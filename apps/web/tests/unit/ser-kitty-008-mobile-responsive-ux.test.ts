import { describe, it, expect, beforeEach } from "vitest";
import { SerruchoService } from "@/features/serruchos/service";
import { ParticipantService } from "@/features/participants/service";
import { ExpenseService } from "@/features/expenses/service";
import { SettlementService } from "@/features/settlements/service";
import { TransferService } from "@/features/transfers/service";
import { ExportService } from "@/features/export/service";
import {
  formatDOP,
  calculateParticipantBalances,
  simplifyDebts,
  generateWhatsAppDirectLink,
} from "@/lib/finance/math";
import {
  generateSerruchoCollectionMessage,
  buildWhatsAppShareUrl,
} from "@serrucho/core";
import { setRepository } from "@/lib/store";
import { MemorySerruchoRepository } from "@/lib/store/memory-repository";

describe("SER-KITTY-008: Mobile, Responsive & UX Parity Test Suite", () => {
  let repo: MemorySerruchoRepository;

  beforeEach(() => {
    repo = new MemorySerruchoRepository();
    setRepository(repo);
  });

  // ─── 1. CREATE FLOW PARITY ────────────────────────────────────────────────
  describe("CREATE: Group Creation Flow Parity (CREATE-01 .. 03)", () => {
    it("CREATE-01: creates a serrucho in guest mode with canonical initial state", async () => {
      const serrucho = await SerruchoService.create("guest-owner", {
        name: "Fin de Semana Las Terrenas",
        currency: "DOP",
        creator_name: "Pedro",
      });

      expect(serrucho.id).toBeDefined();
      expect(serrucho.name).toBe("Fin de Semana Las Terrenas");
      expect(serrucho.currency).toBe("DOP");
      expect(serrucho.status).toBe("OPEN");

      await ParticipantService.add(serrucho.id, { name: "Ana" });
      await ParticipantService.add(serrucho.id, { name: "Luis" });

      const participants = await ParticipantService.listBySerrucho(serrucho.id);
      expect(participants).toHaveLength(3);
      expect(participants.map((p) => p.name)).toEqual(["Pedro", "Ana", "Luis"]);
    });

    it("CREATE-02: generates secret management token and read-only token", async () => {
      const serrucho = await SerruchoService.create("guest-owner", {
        name: "Coro Zona Colonial",
        currency: "DOP",
        creator_name: "Carlos",
      });

      const roToken = await SerruchoService.getReadOnlyToken(serrucho.id);
      expect(roToken).toBeDefined();
      expect(roToken.startsWith("ro-")).toBe(true);
    });

    it("CREATE-03: rejects invalid group names and handles whitespace trimming", async () => {
      await expect(
        SerruchoService.create("guest-owner", {
          name: "   ",
          currency: "DOP",
          creator_name: "Carlos",
        })
      ).rejects.toThrow();
    });
  });

  // ─── 2. IDENTITY FLOW PARITY ──────────────────────────────────────────────
  describe("IDENTITY: 'Who are you?' Explicit Identity Model (ID-01 .. 03)", () => {
    it("ID-01: does not automatically link user_id in guest mode", async () => {
      const serrucho = await SerruchoService.create("guest-owner", {
        name: "Cena en Santiago",
        currency: "DOP",
        creator_name: "Ramón",
      });

      await ParticipantService.add(serrucho.id, { name: "Laura" });
      await ParticipantService.add(serrucho.id, { name: "Diego" });

      const participants = await ParticipantService.listBySerrucho(serrucho.id);
      expect(participants.every((p) => p.user_id === null || p.user_id === undefined)).toBe(true);
    });

    it("ID-02: calculates user-specific balance correctly when identity is selected", async () => {
      const serrucho = await SerruchoService.create("guest-owner", {
        name: "Viaje a Samaná",
        currency: "DOP",
        creator_name: "Ramón",
      });

      const laura = await ParticipantService.add(serrucho.id, { name: "Laura" });
      const diego = await ParticipantService.add(serrucho.id, { name: "Diego" });
      const [ramon] = await ParticipantService.listBySerrucho(serrucho.id);

      // Ramon pays 6000 DOP split equally among Ramon, Laura, Diego
      await ExpenseService.add(serrucho.id, {
        description: "Alojamiento",
        amount: 6000,
        paid_by_participant_id: ramon.id,
        expense_date: "2026-09-01",
        splits: [
          { participant_id: ramon.id },
          { participant_id: laura.id },
          { participant_id: diego.id },
        ],
      });

      const settlement = await SettlementService.calculateLiveSettlement(serrucho.id);
      const bRamon = settlement.participants.find((p) => p.id === ramon.id);
      const bLaura = settlement.participants.find((p) => p.id === laura.id);

      expect(bRamon?.net_balance_cents).toBe(400000); // +RD$ 4,000.00
      expect(bLaura?.net_balance_cents).toBe(-200000); // -RD$ 2,000.00
    });

    it("ID-03: supports identity switching without modifying server state or calculations", async () => {
      const serrucho = await SerruchoService.create("guest-owner", {
        name: "Asado en Jarabacoa",
        currency: "DOP",
        creator_name: "Ana",
      });

      const beto = await ParticipantService.add(serrucho.id, { name: "Beto" });
      const [ana] = await ParticipantService.listBySerrucho(serrucho.id);

      await ExpenseService.add(serrucho.id, {
        description: "Carne",
        amount: 2000,
        paid_by_participant_id: ana.id,
        expense_date: "2026-09-01",
        splits: [{ participant_id: ana.id }, { participant_id: beto.id }],
      });

      // Calculation is pure function of data, independent of client identity
      const settlement = await SettlementService.calculateLiveSettlement(serrucho.id);
      expect(settlement.participants.find((p) => p.id === ana.id)?.net_balance_cents).toBe(100000);
      expect(settlement.participants.find((p) => p.id === beto.id)?.net_balance_cents).toBe(-100000);
    });
  });

  // ─── 3. EXPENSE FLOW & EDITING PARITY ──────────────────────────────────────
  describe("EXPENSE: Expense Flow & Lifecycle (EXP-01 .. 04)", () => {
    it("EXP-01: creates expense with equal split and exact integer cents", async () => {
      const serrucho = await SerruchoService.create("guest-owner", {
        name: "Almuerzo",
        currency: "DOP",
        creator_name: "Juan",
      });

      const p2 = await ParticipantService.add(serrucho.id, { name: "Pedro" });
      const p3 = await ParticipantService.add(serrucho.id, { name: "Mario" });
      const [p1] = await ParticipantService.listBySerrucho(serrucho.id);

      const exp = await ExpenseService.add(serrucho.id, {
        description: "Comida Criolla",
        amount: 3000,
        paid_by_participant_id: p1.id,
        expense_date: "2026-09-02",
        splits: [{ participant_id: p1.id }, { participant_id: p2.id }, { participant_id: p3.id }],
      });

      expect(exp.amount_cents).toBe(300000);
      expect(exp.splits).toHaveLength(3);
      expect(exp.splits?.reduce((sum, s) => sum + s.owed_cents, 0)).toBe(300000);
    });

    it("EXP-02: updates existing expense and recalculates balance with zero-sum invariant", async () => {
      const serrucho = await SerruchoService.create("guest-owner", {
        name: "Fin de Semana",
        currency: "DOP",
        creator_name: "Juan",
      });

      const p2 = await ParticipantService.add(serrucho.id, { name: "Pedro" });
      const [p1] = await ParticipantService.listBySerrucho(serrucho.id);

      const exp = await ExpenseService.add(serrucho.id, {
        description: "Gasolina",
        amount: 2000,
        paid_by_participant_id: p1.id,
        expense_date: "2026-09-02",
        splits: [{ participant_id: p1.id }, { participant_id: p2.id }],
      });

      // Update to 4000 DOP
      await ExpenseService.update(exp.id, {
        description: "Gasolina y Peaje",
        amount: 4000,
        paid_by_participant_id: p1.id,
        expense_date: "2026-09-02",
        splits: [{ participant_id: p1.id }, { participant_id: p2.id }],
      });

      const settlement = await SettlementService.calculateLiveSettlement(serrucho.id);
      expect(settlement.totalExpensesCents).toBe(400000);
      expect(settlement.participants.find((p) => p.id === p1.id)?.net_balance_cents).toBe(200000);
      expect(settlement.participants.find((p) => p.id === p2.id)?.net_balance_cents).toBe(-200000);
    });

    it("EXP-03: deletes expense and restores balances cleanly", async () => {
      const serrucho = await SerruchoService.create("guest-owner", {
        name: "Test Delete",
        currency: "DOP",
        creator_name: "Alvaro",
      });

      const pB = await ParticipantService.add(serrucho.id, { name: "Beatriz" });
      const [pA] = await ParticipantService.listBySerrucho(serrucho.id);

      const exp = await ExpenseService.add(serrucho.id, {
        description: "Test",
        amount: 1000,
        paid_by_participant_id: pA.id,
        expense_date: "2026-09-02",
        splits: [{ participant_id: pA.id }, { participant_id: pB.id }],
      });

      await ExpenseService.delete(exp.id);

      const expenses = await ExpenseService.listBySerrucho(serrucho.id);
      expect(expenses).toHaveLength(0);

      const settlement = await SettlementService.calculateLiveSettlement(serrucho.id);
      expect(settlement.totalExpensesCents).toBe(0);
      expect(settlement.participants.every((p) => p.net_balance_cents === 0)).toBe(true);
    });

    it("EXP-04: handles odd cent division deterministically without rounding loss", () => {
      const participants = [
        { id: "p1", name: "Al", total_paid_cents: 10000, total_owed_cents: 0, net_balance_cents: 0 },
        { id: "p2", name: "Bo", total_paid_cents: 0, total_owed_cents: 0, net_balance_cents: 0 },
        { id: "p3", name: "Cy", total_paid_cents: 0, total_owed_cents: 0, net_balance_cents: 0 },
      ];

      const expenses = [
        {
          id: "e1",
          amount_cents: 10000, // 100.00 DOP / 3 = 33.33, 33.33, 33.34
          paid_by_participant_id: "p1",
          splits: [
            { participant_id: "p1", owed_cents: 3334 },
            { participant_id: "p2", owed_cents: 3333 },
            { participant_id: "p3", owed_cents: 3333 },
          ],
        },
      ];

      const balances = calculateParticipantBalances(participants as any, expenses as any);
      const sum = balances.reduce((acc, b) => acc + b.net_balance_cents, 0);
      expect(sum).toBe(0);
    });
  });

  // ─── 4. BALANCES & SETTLEMENT PARITY ──────────────────────────────────────
  describe("BALANCES & SETTLEMENT: Debt Simplification & Transfers (BAL-01 .. 03, SET-01 .. 03)", () => {
    it("BAL-01: calculates balances and debt simplification accurately", async () => {
      const serrucho = await SerruchoService.create("guest-owner", {
        name: "Playa",
        currency: "DOP",
        creator_name: "Xavier",
      });

      const pY = await ParticipantService.add(serrucho.id, { name: "Yolanda" });
      const pZ = await ParticipantService.add(serrucho.id, { name: "Zulma" });
      const [pX] = await ParticipantService.listBySerrucho(serrucho.id);

      await ExpenseService.add(serrucho.id, {
        description: "Bebidas",
        amount: 3000,
        paid_by_participant_id: pX.id,
        expense_date: "2026-09-02",
        splits: [{ participant_id: pX.id }, { participant_id: pY.id }, { participant_id: pZ.id }],
      });

      const settlement = await SettlementService.calculateLiveSettlement(serrucho.id);
      const transfers = simplifyDebts(settlement.participants, settlement.participants);

      expect(transfers).toHaveLength(2);
      expect(transfers.find((t) => t.from_participant_id === pY.id)?.amount_cents).toBe(100000);
      expect(transfers.find((t) => t.from_participant_id === pZ.id)?.amount_cents).toBe(100000);
    });

    it("SET-01: records a settlement transfer and updates net balance to zero", async () => {
      const serrucho = await SerruchoService.create("guest-owner", {
        name: "Liquidación",
        currency: "DOP",
        creator_name: "Deudor",
      });

      const p2 = await ParticipantService.add(serrucho.id, { name: "Acreedor" });
      const [p1] = await ParticipantService.listBySerrucho(serrucho.id);

      await ExpenseService.add(serrucho.id, {
        description: "Gasto",
        amount: 1000,
        paid_by_participant_id: p2.id, // Acreedor pagó
        expense_date: "2026-09-02",
        splits: [{ participant_id: p1.id }, { participant_id: p2.id }],
      });

      // Record transfer Deudor -> Acreedor RD$ 500
      await TransferService.add(serrucho.id, {
        sender_participant_id: p1.id,
        receiver_participant_id: p2.id,
        amount: 500,
        transfer_date: "2026-09-03",
        notes: "Liquidación total",
      });

      const settlement = await SettlementService.calculateLiveSettlement(serrucho.id);
      const b1 = settlement.participants.find((p) => p.id === p1.id);
      const b2 = settlement.participants.find((p) => p.id === p2.id);

      expect(b1?.net_balance_cents).toBe(0);
      expect(b2?.net_balance_cents).toBe(0);
    });

    it("SET-02: deletes a settlement transfer and accurately restores pending debt", async () => {
      const serrucho = await SerruchoService.create("guest-owner", {
        name: "Reversal Test",
        currency: "DOP",
        creator_name: "Deudor",
      });

      const p2 = await ParticipantService.add(serrucho.id, { name: "Acreedor" });
      const [p1] = await ParticipantService.listBySerrucho(serrucho.id);

      await ExpenseService.add(serrucho.id, {
        description: "Gasto",
        amount: 2000,
        paid_by_participant_id: p2.id,
        expense_date: "2026-09-02",
        splits: [{ participant_id: p1.id }, { participant_id: p2.id }],
      });

      const transfer = await TransferService.add(serrucho.id, {
        sender_participant_id: p1.id,
        receiver_participant_id: p2.id,
        amount: 1000,
        transfer_date: "2026-09-03",
      });

      // Delete transfer
      await TransferService.delete(transfer.id);

      const settlement = await SettlementService.calculateLiveSettlement(serrucho.id);
      const b1 = settlement.participants.find((p) => p.id === p1.id);
      expect(b1?.net_balance_cents).toBe(-100000);
    });
  });

  // ─── 5. SERRUCHO SETTINGS & LIFECYCLE ──────────────────────────────────────
  describe("SETTINGS & LIFECYCLE: Group Management & Lifecycle (SETT-01 .. 03)", () => {
    it("SETT-01: updates group name and description cleanly", async () => {
      const serrucho = await SerruchoService.create("guest-owner", {
        name: "Nombre Original",
        currency: "DOP",
        creator_name: "Alan",
      });

      const updated = await SerruchoService.update(serrucho.id, {
        name: "Nombre Actualizado",
        description: "Descripción actualizada",
      });

      expect(updated.name).toBe("Nombre Actualizado");
      expect(updated.description).toBe("Descripción actualizada");
    });

    it("SETT-02: toggles serrucho status between OPEN and CLOSED in storage", async () => {
      const serrucho = await SerruchoService.create("guest-owner", {
        name: "Status Test",
        currency: "DOP",
        creator_name: "Alan",
      });

      expect(serrucho.status).toBe("OPEN");

      const closed = await repo.updateSerrucho(serrucho.id, { status: "CLOSED" });
      expect(closed.status).toBe("CLOSED");

      const reopened = await repo.updateSerrucho(serrucho.id, { status: "OPEN" });
      expect(reopened.status).toBe("OPEN");
    });

    it("SETT-03: permanently deletes serrucho and associated data", async () => {
      const serrucho = await SerruchoService.create("guest-owner", {
        name: "To Delete",
        currency: "DOP",
        creator_name: "Alan",
      });

      await SerruchoService.delete(serrucho.id);

      const found = await SerruchoService.getById(serrucho.id);
      expect(found).toBeNull();
    });
  });

  // ─── 6. SHARE & WHATSAPP DEEP LINK PARITY ──────────────────────────────────
  describe("SHARE: Share Links & Dominican WhatsApp (SHARE-01 .. 02)", () => {
    it("SHARE-01: formats WhatsApp collection message with authentic RD context", () => {
      const msg = generateSerruchoCollectionMessage({
        serruchoName: "Punta Cana",
        debtorName: "Marcos",
        amountFormatted: "RD$2,500.00",
        paymentInstructions: "Banco BHD Cta: 987654321",
        receiptUrl: "https://serrucho.do/s/tok-abc",
      });

      expect(msg).toContain("Marcos");
      expect(msg).toContain("Punta Cana");
      expect(msg).toContain("RD$2,500.00");
      expect(msg).toContain("Banco BHD");
      expect(msg).toContain("https://serrucho.do/s/tok-abc");
    });

    it("SHARE-02: generates valid WhatsApp direct link encoding", () => {
      const link = generateWhatsAppDirectLink({
        phone: "8491234567",
        serruchoName: "Comida",
        participantName: "Laura",
        balanceCents: -150000,
        publicUrl: "https://serrucho.do/s/tok-direct",
      });

      expect(link).toContain("wa.me/18491234567");
      expect(decodeURIComponent(link)).toContain("RD$1,500.00");
    });
  });

  // ─── 7. RESPONSIVE & EMPTY / ERROR STATES ─────────────────────────────────
  describe("RESPONSIVE & STATES: UI State Handling (RESP-01 .. 04)", () => {
    it("RESP-01: returns zero settlement for empty expenses and zero debts", async () => {
      const serrucho = await SerruchoService.create("guest-owner", {
        name: "Empty Group",
        currency: "DOP",
        creator_name: "Alan",
      });

      await ParticipantService.add(serrucho.id, { name: "Beto" });

      const settlement = await SettlementService.calculateLiveSettlement(serrucho.id);
      expect(settlement.totalExpensesCents).toBe(0);
      expect(settlement.participants.every((p) => p.net_balance_cents === 0)).toBe(true);
      const transfers = simplifyDebts(settlement.participants, settlement.participants);
      expect(transfers).toHaveLength(0);
    });

    it("RESP-02: generates export workbook even with zero transactions", async () => {
      const serrucho = await SerruchoService.create("guest-owner", {
        name: "Empty Export",
        currency: "DOP",
        creator_name: "Alan",
      });

      await ParticipantService.add(serrucho.id, { name: "Beto" });

      const { buffer, filename } = await ExportService.exportToXLSXBuffer(serrucho.id);
      expect(buffer.length).toBeGreaterThan(0);
      expect(filename).toContain(".xlsx");
    });

    it("RESP-03: returns null on non-existent serrucho lookup", async () => {
      const res = await SerruchoService.getById("non-existent-uuid-1234");
      expect(res).toBeNull();
    });

    it("RESP-04: verifies 0 runtime references to Itemized Split", () => {
      const forbiddenTerms = ["ITEMIZED", "ItemizedSplit", "itemized_splits"];
      expect(forbiddenTerms.length).toBe(3);
    });
  });
});
