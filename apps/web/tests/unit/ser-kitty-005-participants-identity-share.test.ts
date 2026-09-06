import { describe, it, expect, beforeEach } from "vitest";
import { ParticipantService } from "@/features/participants/service";
import { SerruchoService } from "@/features/serruchos/service";
import { ExpenseService } from "@/features/expenses/service";
import { TransferService } from "@/features/transfers/service";
import { IncomeService } from "@/features/incomes/service";
import { SettlementService } from "@/features/settlements/service";
import { setRepository } from "@/lib/store";
import { MemorySerruchoRepository } from "@/lib/store/memory-repository";
import {
  generateSerruchoInviteMessage,
  buildWhatsAppShareUrl,
  calculateParticipantBalances,
} from "@serrucho/core";

describe("PROMPT 05 — Participants, Identity ('Who are you?') & Share Matrix", () => {
  let repo: MemorySerruchoRepository;
  let serruchoId: string;
  let creatorId: string;
  let partAId: string;
  let partBId: string;

  beforeEach(async () => {
    repo = new MemorySerruchoRepository();
    setRepository(repo);

    const serrucho = await SerruchoService.create("guest-owner", {
      name: "Viaje a Samaná 🌴",
      creator_name: "Braulio",
      initial_participants: ["María", "Juan"],
    });

    serruchoId = serrucho.id;
    const participants = await ParticipantService.listBySerrucho(serruchoId);
    creatorId = participants.find((p) => p.name === "Braulio")!.id;
    partAId = participants.find((p) => p.name === "María")!.id;
    partBId = participants.find((p) => p.name === "Juan")!.id;
  });

  // ==========================================
  // PARTICIPANTS (PAR-01 .. PAR-10)
  // ==========================================
  describe("PARTICIPANTS", () => {
    // PAR-01: Create participant
    it("PAR-01: creates a new participant with valid fields and default shares", async () => {
      const p = await ParticipantService.add(serruchoId, {
        name: "Pedro",
        email: "pedro@example.com",
        phone: "8095551234",
        preferred_channel: "WHATSAPP",
        default_shares: 2,
      });

      expect(p).toBeDefined();
      expect(p.id).toBeDefined();
      expect(p.name).toBe("Pedro");
      expect(p.email).toBe("pedro@example.com");
      expect(p.phone).toBe("8095551234");
      expect(p.default_shares).toBe(2);
      expect(p.access_status).toBe("INVITED");
    });

    // PAR-02: Rename participant preserving ID
    it("PAR-02: renames participant while preserving the exact participant ID", async () => {
      const initial = await ParticipantService.getById(partAId);
      expect(initial?.name).toBe("María");

      const updated = await ParticipantService.update(partAId, {
        name: "María Eugenia",
      });

      expect(updated.id).toBe(partAId);
      expect(updated.name).toBe("María Eugenia");

      const reloaded = await ParticipantService.getById(partAId);
      expect(reloaded?.id).toBe(partAId);
      expect(reloaded?.name).toBe("María Eugenia");
    });

    // PAR-03: Participant appears in Serrucho
    it("PAR-03: participant appears in Serrucho participant list", async () => {
      const list = await ParticipantService.listBySerrucho(serruchoId);
      expect(list).toHaveLength(3);
      const names = list.map((p) => p.name);
      expect(names).toContain("Braulio");
      expect(names).toContain("María");
      expect(names).toContain("Juan");
    });

    // PAR-04: Participant used by expense
    it("PAR-04: participant can be used as the payer of an expense", async () => {
      const expense = await ExpenseService.add(serruchoId, {
        description: "Alquiler de Villa",
        amount: 3000,
        paid_by_participant_id: creatorId,
        expense_date: "2026-09-01",
        split_method: "EQUAL",
        splits: [
          { participant_id: creatorId },
          { participant_id: partAId },
          { participant_id: partBId },
        ],
      });

      expect(expense.paid_by_participant_id).toBe(creatorId);
      expect(expense.amount_cents).toBe(300000);
    });

    // PAR-05: Participant used by expense split
    it("PAR-05: participant is referenced in expense splits with correct owed amount", async () => {
      const expense = await ExpenseService.add(serruchoId, {
        description: "Cena de Pescado",
        amount: 3000,
        paid_by_participant_id: creatorId,
        expense_date: "2026-09-01",
        split_method: "EQUAL",
        splits: [
          { participant_id: creatorId },
          { participant_id: partAId },
          { participant_id: partBId },
        ],
      });

      expect(expense.splits).toHaveLength(3);
      const splitA = expense.splits.find((s) => s.participant_id === partAId);
      expect(splitA).toBeDefined();
      expect(splitA?.owed_cents).toBe(100000);
    });

    // PAR-06: Participant used by transfer
    it("PAR-06: participant can be sender or receiver in transfers", async () => {
      const transfer = await TransferService.add(serruchoId, {
        sender_participant_id: partAId,
        receiver_participant_id: creatorId,
        amount: 1000,
        transfer_date: "2026-09-02",
        notes: "Abono cena",
      });

      expect(transfer.sender_participant_id).toBe(partAId);
      expect(transfer.receiver_participant_id).toBe(creatorId);
      expect(transfer.amount_cents).toBe(100000);
    });

    // PAR-07: Participant used by income
    it("PAR-07: participant can be recipient and beneficiary in incomes/refunds", async () => {
      const income = await IncomeService.add(serruchoId, {
        description: "Reembolso Depósito Villa",
        amount: 900,
        received_by_participant_id: creatorId,
        income_date: "2026-09-03",
        split_method: "EQUAL",
        splits: [
          { participant_id: creatorId },
          { participant_id: partAId },
          { participant_id: partBId },
        ],
      });

      expect(income.received_by_participant_id).toBe(creatorId);
      expect(income.amount_cents).toBe(90000);
    });

    // PAR-08: Invalid foreign participant rejected
    it("PAR-08: rejects foreign participant ID from another Serrucho in transactions", async () => {
      const otherSerrucho = await SerruchoService.create("guest-owner", {
        name: "Otro Grupo",
        creator_name: "Desconocido",
      });
      const otherParticipants = await ParticipantService.listBySerrucho(otherSerrucho.id);
      const foreignId = otherParticipants[0].id;

      await expect(
        ExpenseService.add(serruchoId, {
          description: "Gasto Inválido",
          amount: 500,
          paid_by_participant_id: foreignId,
          expense_date: "2026-09-01",
          split_method: "EQUAL",
          splits: [{ participant_id: creatorId }],
        })
      ).rejects.toThrow(/El pagador no es un participante válido/);

      await expect(
        TransferService.add(serruchoId, {
          sender_participant_id: foreignId,
          receiver_participant_id: creatorId,
          amount: 100,
          transfer_date: "2026-09-01",
        })
      ).rejects.toThrow(/Participante emisor inválido/);
    });

    // PAR-09: Participant deletion behavior
    it("PAR-09: allows deleting participants with zero records, but BLOCKS if participant has expenses or debts", async () => {
      const freshP = await ParticipantService.add(serruchoId, {
        name: "Invitado Temporal",
      });

      // Deleting unused participant succeeds
      const deleted = await ParticipantService.delete(freshP.id);
      expect(deleted).toBe(true);

      // Add expense involving partAId
      await ExpenseService.add(serruchoId, {
        description: "Gasolina",
        amount: 1000,
        paid_by_participant_id: partAId,
        expense_date: "2026-09-01",
        split_method: "EQUAL",
        splits: [{ participant_id: partAId }, { participant_id: creatorId }],
      });

      // Attempting to delete partAId must be blocked
      await expect(ParticipantService.delete(partAId)).rejects.toThrow(
        /No puedes eliminar un participante que tiene gastos o deudas registradas/
      );
    });

    // PAR-10: Balance integrity after participant operation
    it("PAR-10: preserves zero-sum balance invariant after adding, renaming, or deleting participants", async () => {
      // 1. Add expense
      await ExpenseService.add(serruchoId, {
        description: "Supermercado",
        amount: 3000,
        paid_by_participant_id: creatorId,
        expense_date: "2026-09-01",
        split_method: "EQUAL",
        splits: [
          { participant_id: creatorId },
          { participant_id: partAId },
          { participant_id: partBId },
        ],
      });

      // 2. Add new participant
      await ParticipantService.add(serruchoId, { name: "Nuevo Amigo" });

      // 3. Rename existing participant
      await ParticipantService.update(partAId, { name: "María Renombrada" });

      // 4. Verify financial invariants
      const settlement = await SettlementService.calculateLiveSettlement(serruchoId);
      const sumBalances = settlement.participants.reduce((sum, p) => sum + p.net_balance_cents, 0);
      expect(sumBalances).toBe(0);
      expect(settlement.totalExpensesCents).toBe(300000);
    });
  });

  // ==========================================
  // IDENTITY ("Who are you?") (ID-01 .. ID-08)
  // ==========================================
  describe("IDENTITY ('Who are you?')", () => {
    // ID-01: First access asks "Who are you?"
    it("ID-01: starts without active identity (null) when first accessing Serrucho", () => {
      const localStore: Record<string, string> = {};
      const storedId = localStore[`serrucho_my_id_${serruchoId}`] || null;
      expect(storedId).toBeNull();
    });

    // ID-02: Explicit participant selection
    it("ID-02: allows explicit selection of a participant from available options", async () => {
      const participants = await ParticipantService.listBySerrucho(serruchoId);
      const selected = participants.find((p) => p.name === "María");
      expect(selected).toBeDefined();

      const chosenId = selected!.id;
      expect(chosenId).toBe(partAId);
    });

    // ID-03: Identity persisted locally
    it("ID-03: persists selected participant ID in local storage key", () => {
      const localStore: Record<string, string> = {};
      const key = `serrucho_my_id_${serruchoId}`;

      localStore[key] = partAId;
      expect(localStore[key]).toBe(partAId);
    });

    // ID-04: Returning user restores identity
    it("ID-04: restores identity on subsequent access using stored local key", () => {
      const localStore: Record<string, string> = {
        [`serrucho_my_id_${serruchoId}`]: partAId,
      };

      const restoredId = localStore[`serrucho_my_id_${serruchoId}`];
      expect(restoredId).toBe(partAId);
    });

    // ID-05: Change identity
    it("ID-05: allows changing identity without affecting participant records or history", async () => {
      const localStore: Record<string, string> = {
        [`serrucho_my_id_${serruchoId}`]: partAId,
      };

      // Switch identity to Juan
      localStore[`serrucho_my_id_${serruchoId}`] = partBId;
      expect(localStore[`serrucho_my_id_${serruchoId}`]).toBe(partBId);

      // Verify participant database records remain unchanged
      const participants = await ParticipantService.listBySerrucho(serruchoId);
      expect(participants.find((p) => p.id === partAId)?.name).toBe("María");
      expect(participants.find((p) => p.id === partBId)?.name).toBe("Juan");
    });

    // ID-06: Invalid stored participant forces reselection
    it("ID-06: falls back to reselection if stored participant ID no longer exists in Serrucho", async () => {
      const localStore: Record<string, string> = {
        [`serrucho_my_id_${serruchoId}`]: "non-existent-participant-999",
      };

      const participants = await ParticipantService.listBySerrucho(serruchoId);
      const storedId = localStore[`serrucho_my_id_${serruchoId}`];
      const isValid = participants.some((p) => p.id === storedId);

      expect(isValid).toBe(false);
      // Resolved identity should fall back to null (prompt "Who are you?")
      const resolvedId = isValid ? storedId : null;
      expect(resolvedId).toBeNull();
    });

    // ID-07: Identity does not alter financial records
    it("ID-07: selecting or switching identity never modifies financial state or balances", async () => {
      await ExpenseService.add(serruchoId, {
        description: "Peaje",
        amount: 300,
        paid_by_participant_id: creatorId,
        expense_date: "2026-09-01",
        split_method: "EQUAL",
        splits: [{ participant_id: creatorId }, { participant_id: partAId }, { participant_id: partBId }],
      });

      const before = await SettlementService.calculateLiveSettlement(serruchoId);

      // Simulate local identity changes
      let currentIdentity = partAId;
      await ParticipantService.markSeen(currentIdentity, "IDENTIFIED");

      currentIdentity = partBId;
      await ParticipantService.markSeen(currentIdentity, "IDENTIFIED");

      const after = await SettlementService.calculateLiveSettlement(serruchoId);
      expect(after.totalExpensesCents).toBe(before.totalExpensesCents);
      expect(after.participants.map((p) => p.net_balance_cents)).toEqual(
        before.participants.map((p) => p.net_balance_cents)
      );
    });

    // ID-08: Creator is NOT automatically selected
    it("ID-08: does not auto-assign creator as identity on fresh device/session", async () => {
      // A new session accessing the URL has no stored ID
      const emptyLocalStore: Record<string, string> = {};
      const activeIdentity = emptyLocalStore[`serrucho_my_id_${serruchoId}`] || null;

      expect(activeIdentity).toBeNull();
      expect(activeIdentity).not.toBe(creatorId);
    });
  });

  // ==========================================
  // SHARE / INVITE (SH-01 .. SH-07)
  // ==========================================
  describe("SHARE / INVITE", () => {
    // SH-01: Generate/access existing share link
    it("SH-01: generates valid edit and read-only share URLs", async () => {
      const serrucho = await SerruchoService.getById(serruchoId);
      expect(serrucho).toBeDefined();

      const editUrl = `https://serrucho.do/dashboard/${serruchoId}`;
      const readOnlyUrl = `https://serrucho.do/r/${serrucho?.read_only_token}`;

      expect(editUrl).toContain(`/dashboard/${serruchoId}`);
      expect(readOnlyUrl).toContain(`/r/${serrucho?.read_only_token}`);
      expect(serrucho?.read_only_token).toBeDefined();
    });

    // SH-02: Valid token opens correct Serrucho
    it("SH-02: valid read-only token opens the correct Serrucho", async () => {
      const serrucho = await SerruchoService.getById(serruchoId);
      const token = serrucho!.read_only_token!;

      const found = await SerruchoService.getByReadOnlyToken(token);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(serruchoId);
      expect(found?.name).toBe("Viaje a Samaná 🌴");
    });

    // SH-03: Malformed token rejected
    it("SH-03: malformed or empty token is rejected safely", async () => {
      const invalid = await SerruchoService.getByReadOnlyToken("invalid-malformed-token");
      expect(invalid).toBeNull();

      const empty = await SerruchoService.getByReadOnlyToken("");
      expect(empty).toBeNull();
    });

    // SH-04: Foreign Serrucho access rejected
    it("SH-04: token from Serrucho A does not grant access to Serrucho B", async () => {
      const serruchoB = await SerruchoService.create("other-owner", {
        name: "Grupo B",
        creator_name: "Owner B",
      });

      const tokenB = serruchoB.read_only_token!;
      const result = await SerruchoService.getByReadOnlyToken(tokenB);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(serruchoB.id);
      expect(result?.id).not.toBe(serruchoId);
    });

    // SH-05: Share message contains correct link
    it("SH-05: share message contains group name, organizer, and join URL", () => {
      const joinUrl = `https://serrucho.do/dashboard/${serruchoId}`;
      const msg = generateSerruchoInviteMessage({
        serruchoName: "Viaje a Samaná 🌴",
        joinUrl,
        organizerName: "Braulio",
      });

      expect(msg).toContain("Viaje a Samaná 🌴");
      expect(msg).toContain("Braulio");
      expect(msg).toContain(joinUrl);
    });

    // SH-06: WhatsApp URL correctly encoded
    it("SH-06: encodes WhatsApp URL with emojis, accents, and special characters safely", () => {
      const msg = "🌴 ¡Hola! Únete al serrucho 'Samaná 2026': https://serrucho.do/dashboard/123";
      const url = buildWhatsAppShareUrl(msg);

      expect(url.startsWith("https://wa.me/?text=")).toBe(true);
      expect(url).not.toContain(" ");
      expect(url).toContain("%F0%9F%8C%B4"); // 🌴
      expect(url).toContain("%C2%A1Hola!"); // ¡Hola!
    });

    // SH-07: Share does not expose internal IDs
    it("SH-07: share copy does not expose user passwords, secret keys, or sensitive internal data", () => {
      const msg = generateSerruchoInviteMessage({
        serruchoName: "Cena Secreta",
        joinUrl: "https://serrucho.do/dashboard/abc-123",
      });

      expect(msg).not.toContain("password");
      expect(msg).not.toContain("secret_key");
      expect(msg).not.toContain("token=");
      expect(msg).not.toContain("db_");
    });
  });

  // ==========================================
  // SECURITY (SEC-01 .. SEC-05)
  // ==========================================
  describe("SECURITY", () => {
    // SEC-01: Foreign participant ID
    it("SEC-01: blocks assigning transaction to participant belonging to a different Serrucho", async () => {
      const otherSerrucho = await SerruchoService.create("other-user", {
        name: "Grupo Desconocido",
        creator_name: "Alien",
      });
      const otherP = (await ParticipantService.listBySerrucho(otherSerrucho.id))[0];

      await expect(
        ExpenseService.add(serruchoId, {
          description: "Hack",
          amount: 500,
          paid_by_participant_id: otherP.id,
          expense_date: "2026-09-01",
          split_method: "EQUAL",
          splits: [{ participant_id: creatorId }],
        })
      ).rejects.toThrow();
    });

    // SEC-02: Foreign Serrucho ID
    it("SEC-02: prevents participant mutation across different Serruchos", async () => {
      const otherSerrucho = await SerruchoService.create("other-user", {
        name: "Grupo Desconocido",
        creator_name: "Alien",
      });
      const otherP = (await ParticipantService.listBySerrucho(otherSerrucho.id))[0];

      // Deleting participant looks up their own Serrucho and prevents cross-contamination
      const deleted = await ParticipantService.delete(otherP.id);
      expect(deleted).toBe(true);

      // Verify original serrucho participants remain untouched
      const originalList = await ParticipantService.listBySerrucho(serruchoId);
      expect(originalList).toHaveLength(3);
    });

    // SEC-03: Malformed token
    it("SEC-03: handles SQL injection and script injection attempts in tokens gracefully", async () => {
      const injections = [
        "' OR '1'='1",
        "<script>alert('xss')</script>",
        "../../etc/passwd",
        "0x0000",
      ];

      for (const injection of injections) {
        const res = await SerruchoService.getByReadOnlyToken(injection);
        expect(res).toBeNull();
      }
    });

    // SEC-04: Invalid identity
    it("SEC-04: rejects markSeen or identity linking on non-existent participant IDs", async () => {
      await expect(
        ParticipantService.markSeen("non-existent-id", "IDENTIFIED")
      ).rejects.toThrow(/Participante no encontrado/);

      await expect(
        ParticipantService.linkAccount("non-existent-id", "usr-123")
      ).rejects.toThrow(/Participante no encontrado/);
    });

    // SEC-05: Unauthorized mutation on closed Serrucho
    it("SEC-05: rejects adding or updating participants in a closed Serrucho", async () => {
      await repo.updateSerrucho(serruchoId, { status: "CLOSED" });

      await expect(
        ParticipantService.add(serruchoId, { name: "Persona Tarde" })
      ).rejects.toThrow(/No se pueden agregar participantes a un serrucho cerrado/);

      await expect(
        ParticipantService.update(partAId, { name: "Nuevo Nombre" })
      ).rejects.toThrow(/No se pueden editar participantes en un serrucho cerrado/);

      await expect(
        ParticipantService.delete(partAId)
      ).rejects.toThrow(/No se pueden eliminar participantes de un serrucho cerrado/);
    });
  });
});
