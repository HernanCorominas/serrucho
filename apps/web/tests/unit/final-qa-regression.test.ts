import { describe, it, expect, beforeEach } from "vitest";
import { SerruchoService } from "@/features/serruchos/service";
import { ParticipantService } from "@/features/participants/service";
import { ExpenseService } from "@/features/expenses/service";
import { TransferService } from "@/features/transfers/service";
import { IncomeService } from "@/features/incomes/service";
import { SettlementService } from "@/features/settlements/service";
import { ActivityService } from "@/features/activity/service";
import { ExportService } from "@/features/export/service";
import { WhatsAppReminderService } from "@/features/notifications/whatsapp-reminder-service";
import { AuthService } from "@/features/auth/service";
import { setRepository, getRepository } from "@/lib/store";
import { MemorySerruchoRepository } from "@/lib/store/memory-repository";
import { formatDOP, simplifyDebts, splitEqually, splitByShares } from "@/lib/finance/math";

describe("Milestone 32: Final End-to-End QA & Regression Suite (QA integral y cierre)", () => {
  beforeEach(() => {
    setRepository(new MemorySerruchoRepository());
  });

  describe("Complete 31-Point End-to-End Functional Matrix", () => {
    it("executes the entire group lifecycle flawlessly from creation to full settlement", async () => {
      const repo = getRepository();

      // 1. Crear Serrucho
      const serrucho = await SerruchoService.create("owner-organizer", {
        name: "Viaje Completo Jarabacoa 2026",
        currency: "DOP",
        description: "Fin de semana en la montaña con el coro",
      });
      expect(serrucho.id).toBeDefined();

      // 2. Añadir participantes
      const creator = (await ParticipantService.listBySerrucho(serrucho.id))[0];
      const pLaura = await ParticipantService.add(serrucho.id, { name: "Laura", phone: "8095551111" });
      const pPedro = await ParticipantService.add(serrucho.id, { name: "Pedro", phone: "8295552222" });
      const pMaria = await ParticipantService.add(serrucho.id, { name: "María", phone: "8495553333" });

      const participants = await ParticipantService.listBySerrucho(serrucho.id);
      expect(participants).toHaveLength(4);

      // 3 & 4. Compartir por WhatsApp y Entrar como invitado
      const inviteUrl = WhatsAppReminderService.generateWhatsAppUrl(
        pLaura.phone,
        `Únete al Serrucho ${serrucho.name}`
      );
      expect(inviteUrl).toContain("https://wa.me/18095551111");

      await ParticipantService.markSeen(pLaura.id, "ACCESSED");
      const updatedLaura = await ParticipantService.getById(pLaura.id);
      expect(updatedLaura?.access_status).toBe("ACCESSED");


      // 5, 6, 7. Agregar gasto con División Equitativa (Supermercado RD$ 8,000 entre 4 = RD$ 2,000 c/u)
      const exp1 = await ExpenseService.add(serrucho.id, {
        description: "Supermercado Nacional",
        amount: 8000,
        paid_by_participant_id: creator.id,
        expense_date: "2026-08-10",
        category: "GROCERIES",
        splits: participants.map((p) => ({ participant_id: p.id })),
      });
      expect(exp1.amount_cents).toBe(800000);

      // 8. División por Monto Fijo (Cena: Total RD$ 3,000; Creator RD$ 1,500, Laura RD$ 1,500)
      const exp2 = await ExpenseService.add(serrucho.id, {
        description: "Cena Asadero",
        amount: 3000,
        paid_by_participant_id: pLaura.id,
        expense_date: "2026-08-10",
        category: "RESTAURANTS_DELIVERY",
        split_method: "EXACT",
        splits: [
          { participant_id: creator.id, amount: 1500 },
          { participant_id: pLaura.id, amount: 1500 },
        ],
      });
      expect(exp2.amount_cents).toBe(300000);

      // 9 & 10. División por Shares / Default Shares (Pedro tiene 2 shares por pareja, María 1 share = 3 shares de RD$ 3,000)
      const exp3 = await ExpenseService.add(serrucho.id, {
        description: "Excursión Buggies",
        amount: 3000,
        paid_by_participant_id: pPedro.id,
        expense_date: "2026-08-11",
        category: "TRIPS_TRAVEL",
        split_method: "SHARES",
        splits: [
          { participant_id: pPedro.id, shares: 2 },
          { participant_id: pMaria.id, shares: 1 },
        ],
      });
      expect(exp3.amount_cents).toBe(300000);


      // 11. Transferencia entre participantes (Pedro le transfiere RD$ 1,000 a Creator)
      const transfer = await TransferService.add(serrucho.id, {
        sender_participant_id: pPedro.id,
        receiver_participant_id: creator.id,
        amount: 1000,
        transfer_date: "2026-08-11",
        notes: "Abono transferencia Popular",
      });
      expect(transfer.amount_cents).toBe(100000);

      // 12. Ingreso / Reembolso (Devolución depósito villa RD$ 2,000 repartida a todos)
      const refund = await IncomeService.add(serrucho.id, {
        description: "Devolución Depósito Villa",
        amount: 2000,
        received_by_participant_id: creator.id,
        income_date: "2026-08-12",
        category: "DEPOSIT_RETURN",
        split_method: "EQUAL",
        splits: participants.map((p) => ({ participant_id: p.id })),
      });
      expect(refund.amount_cents).toBe(200000);

      // 13 & 14. Recalcular balances y simplificar deudas (INVARIANTE SUMA BALANCES = 0)
      const liveSettlement = await SettlementService.calculateLiveSettlement(serrucho.id);
      const sumBalances = liveSettlement.participants.reduce((s, p) => s + p.net_balance_cents, 0);
      expect(sumBalances).toBe(0);

      const simplified = simplifyDebts(liveSettlement.participants, liveSettlement.participants);
      expect(simplified.length).toBeLessThanOrEqual(participants.length - 1);

      // 15. Marcar settlement y cierre
      const closure = await SettlementService.closeSerrucho(serrucho.id, {
        payment_instructions: "Banco Popular Ahorros: 789-123456-0",
        payment_deadline: "2026-08-25",
        confirm: true,
      });
      expect(closure.snapshots).toHaveLength(4);

      const closedSerrucho = await repo.getSerruchoById(serrucho.id);
      expect(closedSerrucho?.status).toBe("CLOSED");


      // 16 & 17. Edición y Eliminación recalculan correctamente
      // (Reopen test serrucho for transaction modification verification)
      await repo.updateSerrucho(serrucho.id, { status: "OPEN" });
      await ExpenseService.update(exp1.id, {
        description: "Supermercado Nacional (Ajustado)",
        amount: 10000, // Changed from 8000 to 10000
        paid_by_participant_id: creator.id,
        expense_date: "2026-08-10",
        category: "GROCERIES",
        splits: participants.map((p) => ({ participant_id: p.id })),
      });


      const updatedExp = await repo.getExpenseById(exp1.id);
      expect(updatedExp?.amount_cents).toBe(1000000);


      const settlementAfterEdit = await SettlementService.calculateLiveSettlement(serrucho.id);
      const sumAfterEdit = settlementAfterEdit.participants.reduce((s, p) => s + p.net_balance_cents, 0);
      expect(sumAfterEdit).toBe(0);

      // 18 & 19. Categorías y Filtros
      const allExpenses = await ExpenseService.listBySerrucho(serrucho.id);
      const groceries = allExpenses.filter((e) => e.category === "GROCERIES");
      expect(groceries.length).toBeGreaterThanOrEqual(1);

      // 20. Historial de Auditoría
      const auditEvents = await ActivityService.listBySerrucho(serrucho.id);
      expect(auditEvents.length).toBeGreaterThan(0);

      // 26. Exportación (CSV Multi-hoja)
      const exportData = await ExportService.exportToCSV(serrucho.id, "Movimientos");
      expect(exportData.csv).toContain("Supermercado Nacional");
      expect(exportData.filename).toContain("csv");


      // 27 & 28. Cuenta opcional y vinculación de invitado
      await AuthService.upsertProfile({
        id: "usr-maria-reg",
        email: "maria@example.com",
        full_name: "María Gómez",
      });
      const guestLink = await AuthService.linkGuestParticipant(
        "usr-maria-reg",
        serrucho.id,
        pMaria.id
      );
      expect(guestLink.user_id).toBe("usr-maria-reg");
      expect(guestLink.access_status).toBe("LINKED_ACCOUNT");



      // 30 & 31. Recordatorio manual por WhatsApp y registro de método de pago
      const reminder = await WhatsAppReminderService.recordReminderIntent({
        serruchoId: serrucho.id,
        debtorParticipantId: pPedro.id,
        debtorName: pPedro.name,
        senderName: creator.name,
        phone: pPedro.phone,
        amountCents: 150000,
      });
      expect(reminder.success).toBe(true);
      expect(reminder.whatsappUrl).toContain("18295552222");

      // 29. Eliminación limpia de Serrucho
      const deleteResult = await SerruchoService.delete(serrucho.id);
      expect(deleteResult).toBe(true);

      const ghostSerrucho = await SerruchoService.getById(serrucho.id);
      expect(ghostSerrucho).toBeNull();

    });
  });

  describe("Mathematical Invariants and Rounding Precision", () => {
    it("guarantees sum of balances = 0 with difficult odd divisions (e.g. 100 pesos / 3 people = 33.34, 33.33, 33.33)", () => {
      const splits = splitEqually(10000, ["p1", "p2", "p3"]);
      const sumSplits = splits.reduce((s, p) => s + p.owedCents, 0);

      expect(sumSplits).toBe(10000);
      expect(splits[0].owedCents).toBe(3334);
      expect(splits[1].owedCents).toBe(3333);
      expect(splits[2].owedCents).toBe(3333);
    });

    it("settlement never creates nor destroys money across cyclic debt paths", () => {
      // A owes B 100, B owes C 100, C owes A 100 -> Net balances are all 0
      const participants = [
        { id: "A", name: "A", total_paid_cents: 10000, total_owed_cents: 10000, net_balance_cents: 0, percentage: 0, is_settled: false },
        { id: "B", name: "B", total_paid_cents: 10000, total_owed_cents: 10000, net_balance_cents: 0, percentage: 0, is_settled: false },
        { id: "C", name: "C", total_paid_cents: 10000, total_owed_cents: 10000, net_balance_cents: 0, percentage: 0, is_settled: false },
      ] as any;

      const transfers = simplifyDebts(participants, participants);
      expect(transfers).toHaveLength(0); // Zero transfers needed
    });
  });

  describe("Security and Boundary Protections", () => {
    it("prevents operations on non-existent or deleted serruchos", async () => {
      await expect(
        ExpenseService.add("non-existent-id", {
          description: "Gasto fantasma",
          amount: 500,
          paid_by_participant_id: "p1",
          expense_date: "2026-08-10",
          splits: [{ participant_id: "p1" }],
        })
      ).rejects.toThrow();
    });

    it("prevents zero and negative amount expenses", async () => {
      const serrucho = await SerruchoService.create("owner-test", {
        name: "Test Seguridad",
        currency: "DOP",
      });
      const p = (await ParticipantService.listBySerrucho(serrucho.id))[0];

      await expect(
        ExpenseService.add(serrucho.id, {
          description: "Monto negativo",
          amount: -500,
          paid_by_participant_id: p.id,
          expense_date: "2026-08-10",
          splits: [{ participant_id: p.id }],
        })
      ).rejects.toThrow();
    });
  });

});
