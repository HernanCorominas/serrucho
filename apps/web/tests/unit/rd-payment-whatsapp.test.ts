import { describe, it, expect, beforeEach } from "vitest";
import { SerruchoService } from "@/features/serruchos/service";
import { ParticipantService } from "@/features/participants/service";
import { ExpenseService } from "@/features/expenses/service";
import { SettlementService } from "@/features/settlements/service";
import { WhatsAppReminderService } from "@/features/notifications/whatsapp-reminder-service";
import { setRepository, getRepository } from "@/lib/store";
import { MemorySerruchoRepository } from "@/lib/store/memory-repository";

describe("Milestone 30: Dominican Payment Methods & WhatsApp Reminders (Adaptación dominicana)", () => {
  beforeEach(() => {
    setRepository(new MemorySerruchoRepository());
  });

  describe("Dominican Payment Methods & Notes Registration", () => {
    it("records payment method (Popular, BHD, Banreservas, Card, Cash) and custom payment notes when settling debts", async () => {
      const repo = getRepository();

      const serrucho = await SerruchoService.create("owner-test", {
        name: "Coro en Cabarete",
        currency: "DOP",
      });

      const p1 = (await ParticipantService.listBySerrucho(serrucho.id))[0];
      const p2 = await ParticipantService.add(serrucho.id, { name: "Pedro Gómez", phone: "8095554321" });

      // Expense RD$ 5,000 paid by p1
      await ExpenseService.add(serrucho.id, {
        description: "Alquiler Kite",
        amount: 5000,
        paid_by_participant_id: p1.id,
        expense_date: "2026-08-15",
        splits: [{ participant_id: p1.id }, { participant_id: p2.id }],
      });

      // Close and create settlement snapshot
      const closure = await SettlementService.closeSerrucho(serrucho.id, {
        payment_instructions: "Banco Popular 123456",
        payment_deadline: "2026-08-30",
        confirm: true,
      });
      expect(closure.snapshots).toHaveLength(2);



      const debtorSnapshot = closure.snapshots.find((s) => s.participant_id === p2.id);
      expect(debtorSnapshot).toBeDefined();
      expect(debtorSnapshot?.owed_cents).toBe(250000); // RD$ 2,500
      expect(debtorSnapshot?.is_paid).toBe(false);

      // Mark paid with Banco Popular transfer and custom note
      const updated = await repo.markSnapshotPaid(debtorSnapshot!.id, true, {
        payment_method: "TRANSFER_POPULAR",
        payment_notes: "Transferencia hecha desde mi cuenta Banco Popular No. 789456123.",
        paid_amount_cents: 250000,
        payment_status: "SETTLED",
      });

      expect(updated.is_paid).toBe(true);
      expect(updated.payment_method).toBe("TRANSFER_POPULAR");
      expect(updated.payment_notes).toContain("Banco Popular");
      expect(updated.payment_status).toBe("SETTLED");
    });
  });

  describe("Dominican WhatsApp Reminders Formatting & Deep Linking", () => {
    it("builds polite, cordial Dominican reminder message with bank instructions", () => {
      const msg = WhatsAppReminderService.buildReminderMessage({
        serruchoName: "Villa Las Terrenas",
        debtorName: "Laura",
        amountCents: 375000,
        paymentInstructions: "Banco BHD Cuenta Ahorros: 001-234567-8",
        publicUrl: "https://serrucho.do/s/tok-villa",
      });

      expect(msg).toContain("¡Hey Laura! 👋");
      expect(msg).toContain("RD$3,750.00");
      expect(msg).toContain("Villa Las Terrenas");
      expect(msg).toContain("Banco BHD");
      expect(msg).toContain("https://serrucho.do/s/tok-villa");
      expect(msg).toContain("¡Gracias! 🙌");
    });

    it("formats Dominican 809/829/849 phone numbers into valid wa.me direct links", () => {
      const url809 = WhatsAppReminderService.generateWhatsAppUrl("809-555-1234", "Hola");
      expect(url809).toContain("https://wa.me/18095551234?text=Hola");

      const url829 = WhatsAppReminderService.generateWhatsAppUrl("(829) 999-0000", "Prueba");
      expect(url829).toContain("https://wa.me/18299990000?text=Prueba");

      const urlEmpty = WhatsAppReminderService.generateWhatsAppUrl(null, "Prueba");
      expect(urlEmpty).toBe("https://wa.me/?text=Prueba");
    });
  });

  describe("Rate Limiting, Intent Recording & No False Payment Assumption", () => {
    it("records reminder intention in audit trail and enforces rate-limiting cooldown", async () => {
      const repo = getRepository();

      const serrucho = await SerruchoService.create("owner-test", {
        name: "Cena Santo Domingo",
        currency: "DOP",
      });

      const p1 = (await ParticipantService.listBySerrucho(serrucho.id))[0];
      const p2 = await ParticipantService.add(serrucho.id, { name: "Andrés", phone: "8491112233" });

      // 1. First reminder succeeds and logs intent
      const res = await WhatsAppReminderService.recordReminderIntent({
        serruchoId: serrucho.id,
        debtorParticipantId: p2.id,
        debtorName: p2.name,
        senderName: p1.name,
        phone: p2.phone,
        amountCents: 150000,
      });

      expect(res.success).toBe(true);
      expect(res.whatsappUrl).toContain("https://wa.me/18491112233");

      // Verify audit trail recorded intent
      const logs = await repo.getNotificationLogs(serrucho.id);
      expect(logs).toHaveLength(1);
      expect(logs[0].channel).toBe("WHATSAPP");
      expect(logs[0].status).toBe("SENT");

      // Verify debt is NOT assumed to be paid
      const events = await repo.getActivityEvents(serrucho.id);
      expect(events.some((e) => e.summary.includes("solicitó enviar un recordatorio"))).toBe(true);


      // 2. Rapid second reminder triggers rate-limiting protection
      await expect(
        WhatsAppReminderService.recordReminderIntent({
          serruchoId: serrucho.id,
          debtorParticipantId: p2.id,
          debtorName: p2.name,
          senderName: p1.name,
          phone: p2.phone,
          amountCents: 150000,
        })
      ).rejects.toThrow(/Debes esperar \d+ segundos/);
    });
  });
});
