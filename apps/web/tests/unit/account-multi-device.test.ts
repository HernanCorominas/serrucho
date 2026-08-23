import { describe, it, expect, beforeEach } from "vitest";
import { AuthService } from "@/features/auth/service";
import { SerruchoService } from "@/features/serruchos/service";
import { ParticipantService } from "@/features/participants/service";
import { setRepository } from "@/lib/store";
import { MemorySerruchoRepository } from "@/lib/store/memory-repository";

describe("Milestone 25: Optional Account & Multi-Device Synchronization (Cuenta opcional y multi-dispositivo)", () => {
  beforeEach(() => {
    setRepository(new MemorySerruchoRepository());
  });

  describe("Optional Account Principle (Guest Operation)", () => {
    it("allows creating and operating a Serrucho without any registered account", async () => {
      const serrucho = await SerruchoService.create("guest-anonymous", {
        name: "Parrillada Los Prados",
        currency: "DOP",
      });

      expect(serrucho.id).toBeDefined();
      expect(serrucho.owner_id).toBe("guest-anonymous");

      const p1 = await ParticipantService.add(serrucho.id, { name: "Pedro" });
      expect(p1.user_id).toBeUndefined();
      expect(p1.access_status).toBe("INVITED");
    });
  });

  describe("Profile Management", () => {
    it("creates, retrieves and updates user profile with Dominican banking info", async () => {
      const userId = "usr-juan_perez";
      const profile = await AuthService.upsertProfile({
        id: userId,
        email: "juan@perez.do",
        full_name: "Juan Pérez",
        phone: "809-555-9876",
        default_payment_instructions: "Banco Popular Cta Ahorros: 812345678",
      });

      expect(profile.id).toBe(userId);
      expect(profile.full_name).toBe("Juan Pérez");
      expect(profile.phone).toBe("809-555-9876");
      expect(profile.default_payment_instructions).toContain("Banco Popular");

      const fetched = await AuthService.getProfile(userId);
      expect(fetched).not.toBeNull();
      expect(fetched?.full_name).toBe("Juan Pérez");

      // Partial update
      const updated = await AuthService.upsertProfile({
        id: userId,
        email: "juan@perez.do",
        default_payment_instructions: "Qik Banco Digital a mi cédula: 001-1234567-8",
      });
      expect(updated.full_name).toBe("Juan Pérez"); // preserved
      expect(updated.default_payment_instructions).toContain("Qik Banco Digital");
    });
  });

  describe("Secure Guest-to-Account Linking (Never by name alone)", () => {
    it("links an anonymous participant to a registered account without duplicating records", async () => {
      // 1. Serrucho created as guest
      const serrucho = await SerruchoService.create("guest-anonymous", {
        name: "Fin de semana Jarabacoa",
        currency: "DOP",
      });

      // 2. Participant created as guest
      const guestParticipant = await ParticipantService.add(serrucho.id, {
        name: "María Gómez",
      });
      expect(guestParticipant.user_id).toBeUndefined();
      expect(guestParticipant.access_status).toBe("INVITED");

      const initialCount = (await ParticipantService.listBySerrucho(serrucho.id)).length;

      // 3. User registers account
      const userId = "usr-maria_gomez_do";
      await AuthService.upsertProfile({
        id: userId,
        email: "maria@gomez.do",
        full_name: "María Gómez",
      });

      // 4. Link participant using session token/ID (never blind name-only guessing)
      const linkedParticipant = await AuthService.linkGuestParticipant(
        userId,
        serrucho.id,
        guestParticipant.id
      );

      expect(linkedParticipant.id).toBe(guestParticipant.id);
      expect(linkedParticipant.user_id).toBe(userId);
      expect(linkedParticipant.access_status).toBe("LINKED_ACCOUNT");

      // Verify no duplicate participants were created
      const finalParticipants = await ParticipantService.listBySerrucho(serrucho.id);
      expect(finalParticipants).toHaveLength(initialCount);
      const found = finalParticipants.find((p) => p.id === guestParticipant.id);
      expect(found).toBeDefined();
      expect(found?.user_id).toBe(userId);
      expect(found?.access_status).toBe("LINKED_ACCOUNT");
    });


    it("prevents hijacking: disallows linking if participant is already linked to another account", async () => {
      const serrucho = await SerruchoService.create("owner-1", {
        name: "Coro Zona Colonial",
        currency: "DOP",
      });

      const participant = await ParticipantService.add(serrucho.id, { name: "Carlos" });

      // Link to User A
      await AuthService.linkGuestParticipant("usr-user_a", serrucho.id, participant.id);

      // Attempt linking by User B must fail
      await expect(
        AuthService.linkGuestParticipant("usr-user_b", serrucho.id, participant.id)
      ).rejects.toThrow("ya está vinculado a otra cuenta");
    });

    it("disallows linking if participant does not belong to the target Serrucho", async () => {
      const s1 = await SerruchoService.create("owner-1", { name: "Serrucho 1", currency: "DOP" });
      const s2 = await SerruchoService.create("owner-1", { name: "Serrucho 2", currency: "DOP" });

      const p1 = await ParticipantService.add(s1.id, { name: "Ana" });

      await expect(
        AuthService.linkGuestParticipant("usr-ana", s2.id, p1.id)
      ).rejects.toThrow("no pertenece a este Serrucho");
    });
  });

  describe("Multi-Device & Cross-Device Access", () => {
    it("retrieves all associated Serruchos when logging in on a new device", async () => {
      const userId = "usr-braulin_rd";

      // 1. Serrucho where user is creator/owner
      const s1 = await SerruchoService.create(userId, {
        name: "Viaje a Montecristi",
        currency: "DOP",
      });

      // 2. Serrucho where user is a linked participant
      const s2 = await SerruchoService.create("other-host", {
        name: "Cena Navideña",
        currency: "DOP",
      });
      const p2 = await ParticipantService.add(s2.id, { name: "Braulin" });
      await AuthService.linkGuestParticipant(userId, s2.id, p2.id);

      // 3. Unrelated Serrucho
      await SerruchoService.create("stranger", {
        name: "Viaje Desconocido",
        currency: "DOP",
      });

      // 4. User logs in on a completely new device (empty local storage)
      const userSerruchos = await AuthService.getUserSerruchos(userId);

      expect(userSerruchos).toHaveLength(2);
      const ids = userSerruchos.map((s) => s.id);
      expect(ids).toContain(s1.id);
      expect(ids).toContain(s2.id);
    });

    it("batch links multiple local guest sessions to account upon registration/login", async () => {
      const userId = "usr-laura_s";

      const s1 = await SerruchoService.create("guest-anonymous", {
        name: "Cumpleaños Laura",
        currency: "DOP",
      });
      const p1 = await ParticipantService.add(s1.id, { name: "Laura" });

      const s2 = await SerruchoService.create("friend", {
        name: "BBQ Fin de Semana",
        currency: "DOP",
      });
      const p2 = await ParticipantService.add(s2.id, { name: "Laura S." });

      const items = [
        { serruchoId: s1.id, participantId: p1.id, isCreator: true },
        { serruchoId: s2.id, participantId: p2.id, isCreator: false },
      ];

      const result = await AuthService.linkLocalGuestSessions(userId, items);
      expect(result.linkedParticipants).toBe(2);
      expect(result.linkedSerruchos).toBe(1);

      // Verify user can now see both serruchos
      const synced = await AuthService.getUserSerruchos(userId);
      expect(synced).toHaveLength(2);
    });
  });
});
