import { describe, it, expect, beforeEach } from "vitest";
import { SerruchoService } from "@/features/serruchos/service";
import { ParticipantService } from "@/features/participants/service";
import { ExpenseService } from "@/features/expenses/service";
import { TransferService } from "@/features/transfers/service";
import { IncomeService } from "@/features/incomes/service";
import { ActivityService } from "@/features/activity/service";
import { AuthService } from "@/features/auth/service";
import { ExportService } from "@/features/export/service";
import { setRepository, getRepository } from "@/lib/store";
import { MemorySerruchoRepository } from "@/lib/store/memory-repository";

describe("Milestone 26: Secure Deletion, Link Revocation & Privacy (Eliminación de Serrucho y datos personales)", () => {
  beforeEach(() => {
    setRepository(new MemorySerruchoRepository());
  });

  describe("Cascading Serrucho Deletion & Revocation of Public Routes", () => {
    it("permanently cascades deletion across all participants, expenses, transfers, incomes, logs, and revokes tokens", async () => {
      const repo = getRepository();

      // 1. Create Serrucho with full data
      const serrucho = await SerruchoService.create("owner-test", {
        name: "Viaje a Punta Cana",
        currency: "DOP",
      });

      const readOnlyToken = serrucho.read_only_token!;
      expect(readOnlyToken).toBeDefined();

      const p1 = await ParticipantService.add(serrucho.id, { name: "Pedro" });
      const p2 = await ParticipantService.add(serrucho.id, { name: "Laura" });

      const allSplits = [{ participant_id: p1.id }, { participant_id: p2.id }];

      // Expense
      await ExpenseService.add(serrucho.id, {
        description: "Alquiler Buggy",
        amount: 8000,
        paid_by_participant_id: p1.id,
        expense_date: "2026-08-20",
        splits: allSplits,
      });

      // Transfer
      await TransferService.add(serrucho.id, {
        sender_participant_id: p2.id,
        receiver_participant_id: p1.id,
        amount: 4000,
        transfer_date: "2026-08-20",
      });

      // Income
      await IncomeService.add(serrucho.id, {
        description: "Reembolso Combustible",
        amount: 1500,
        received_by_participant_id: p1.id,
        income_date: "2026-08-20",
        category: "SUPPLIER_REFUND",
        split_method: "EQUAL",
        splits: allSplits,
      });


      // Activity
      await ActivityService.record({
        serrucho_id: serrucho.id,
        actor_name: "Pedro",
        action_type: "EXPENSE_CREATED",
        entity_type: "EXPENSE",
        summary: "Pedro registró Alquiler Buggy",
      });

      // Verify records exist before deletion
      expect(await repo.getParticipants(serrucho.id)).toHaveLength(3); // Creator + 2
      expect(await repo.getExpenses(serrucho.id)).toHaveLength(1);
      expect(await repo.getTransfers(serrucho.id)).toHaveLength(1);
      expect(await repo.getIncomes(serrucho.id)).toHaveLength(1);
      expect((await repo.getActivityEvents(serrucho.id, 10)).length).toBeGreaterThan(0);
      expect(await SerruchoService.getByReadOnlyToken(readOnlyToken)).not.toBeNull();


      // 2. Perform permanent deletion
      const deleted = await SerruchoService.delete(serrucho.id);
      expect(deleted).toBe(true);

      // 3. Verify all associated records are permanently purged
      expect(await repo.getSerruchoById(serrucho.id)).toBeNull();
      expect(await SerruchoService.getByReadOnlyToken(readOnlyToken)).toBeNull();
      expect(await repo.getParticipants(serrucho.id)).toEqual([]);
      expect(await repo.getExpenses(serrucho.id)).toEqual([]);
      expect(await repo.getTransfers(serrucho.id)).toEqual([]);
      expect(await repo.getIncomes(serrucho.id)).toEqual([]);
      expect(await repo.getActivityEvents(serrucho.id, 10)).toEqual([]);

      // 4. Verify public services fail gracefully
      await expect(ExportService.generateWorkbook(serrucho.id)).rejects.toThrow(
        "Serrucho no encontrado"
      );
    });

    it("returns false when attempting to delete a non-existent serrucho", async () => {
      const result = await SerruchoService.delete("non-existent-id-123");
      expect(result).toBe(false);
    });
  });

  describe("Account Deletion & Data Privacy", () => {
    it("deletes user profile, unlinks participants, and reassigns created serruchos", async () => {
      const userId = "usr-privacy_user";

      // 1. Create Profile
      await AuthService.upsertProfile({
        id: userId,
        email: "privacy@test.do",
        full_name: "Usuario Privado",
        phone: "809-555-0000",
      });

      // 2. Create Serrucho owned by this user
      const serrucho = await SerruchoService.create(userId, {
        name: "Cena Privada",
        currency: "DOP",
      });

      // 3. User is linked as a participant in another serrucho
      const otherSerrucho = await SerruchoService.create("friend-id", {
        name: "Viaje Amigos",
        currency: "DOP",
      });
      const p = await ParticipantService.add(otherSerrucho.id, { name: "Usuario Privado" });
      await AuthService.linkGuestParticipant(userId, otherSerrucho.id, p.id);

      // 4. Delete user account
      const deleted = await AuthService.deleteAccount(userId);
      expect(deleted).toBe(true);

      // Profile is gone
      const profile = await AuthService.getProfile(userId);
      expect(profile).toBeNull();

      // Participant is unlinked
      const repo = getRepository();
      const updatedParticipant = await repo.getParticipantById(p.id);
      expect(updatedParticipant?.user_id).toBeUndefined();
      expect(updatedParticipant?.access_status).toBe("INVITED");

      // Owned Serrucho remains functional as guest-anonymous without personal trace
      const updatedSerrucho = await repo.getSerruchoById(serrucho.id);
      expect(updatedSerrucho?.owner_id).toBe("guest-anonymous");

      // User has 0 associated serruchos
      const userSerruchos = await AuthService.getUserSerruchos(userId);
      expect(userSerruchos).toEqual([]);
    });
  });
});
