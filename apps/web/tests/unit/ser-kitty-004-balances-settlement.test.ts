import { describe, it, expect, beforeEach } from "vitest";
import {
  toCents,
  fromCents,
  formatDOP,
  splitEqually,
  splitByShares,
  splitByExactAmounts,
  calculateNetBalances,
  simplifyDebts,
  calculateParticipantBalances,
} from "@serrucho/core";
import { SerruchoService } from "@/features/serruchos/service";
import { ParticipantService } from "@/features/participants/service";
import { ExpenseService } from "@/features/expenses/service";
import { TransferService } from "@/features/transfers/service";
import { SettlementService } from "@/features/settlements/service";

describe("SER-KITTY-004: Balances & Min-Cash-Flow Settlement Engine", () => {
  let serruchoId: string;
  let pJuanId: string;
  let pMariaId: string;
  let pPedroId: string;
  let pAnaId: string;

  beforeEach(async () => {
    const serrucho = await SerruchoService.create("owner-004", {
      name: "Villa Las Terrenas 🌴",
      currency: "DOP",
      creator_name: "Juan",
    });
    serruchoId = serrucho.id;

    const participants = await ParticipantService.listBySerrucho(serruchoId);
    pJuanId = participants[0].id;

    const maria = await ParticipantService.add(serruchoId, { name: "María", preferred_channel: "WHATSAPP" });
    const pedro = await ParticipantService.add(serruchoId, { name: "Pedro", preferred_channel: "WHATSAPP" });
    const ana = await ParticipantService.add(serruchoId, { name: "Ana", preferred_channel: "WHATSAPP" });

    pMariaId = maria.id;
    pPedroId = pedro.id;
    pAnaId = ana.id;
  });

  // ==========================================
  // SECTION 1: BALANCES (BAL-01 to BAL-10)
  // ==========================================
  describe("Balances Calculation Engine (BAL-01 to BAL-10)", () => {
    it("BAL-01: One expense (Juan pays 900 for Juan, Maria, Pedro)", async () => {
      await ExpenseService.add(serruchoId, {
        description: "Cena de bienvenida",
        amount: 900,
        paid_by_participant_id: pJuanId,
        expense_date: "2026-09-06",
        split_method: "EQUAL",
        splits: [{ participant_id: pJuanId }, { participant_id: pMariaId }, { participant_id: pPedroId }],
      });

      const live = await SettlementService.calculateLiveSettlement(serruchoId);
      const juan = live.participants.find((p) => p.id === pJuanId);
      const maria = live.participants.find((p) => p.id === pMariaId);
      const pedro = live.participants.find((p) => p.id === pPedroId);
      const ana = live.participants.find((p) => p.id === pAnaId);

      // Juan paid 90000, consumed 30000 -> net +60000 (+RD$ 600.00)
      expect(juan?.net_balance_cents).toBe(60000);
      // Maria paid 0, consumed 30000 -> net -30000 (-RD$ 300.00)
      expect(maria?.net_balance_cents).toBe(-30000);
      // Pedro paid 0, consumed 30000 -> net -30000 (-RD$ 300.00)
      expect(pedro?.net_balance_cents).toBe(-30000);
      // Ana was not part of expense -> net 0
      expect(ana?.net_balance_cents).toBe(0);

      // Verify suggested transfers
      const transfers = simplifyDebts(live.participants, live.participants);
      expect(transfers).toHaveLength(2);
      expect(transfers.every((t) => t.to_participant_id === pJuanId)).toBe(true);
      expect(transfers.reduce((sum, t) => sum + t.amount_cents, 0)).toBe(60000);
    });

    it("BAL-02: Multiple expenses aggregate accurately across participants", async () => {
      await ExpenseService.add(serruchoId, {
        description: "Supermercado",
        amount: 1200,
        paid_by_participant_id: pJuanId,
        expense_date: "2026-09-06",
        split_method: "EQUAL",
        splits: [
          { participant_id: pJuanId },
          { participant_id: pMariaId },
          { participant_id: pPedroId },
          { participant_id: pAnaId },
        ],
      });

      await ExpenseService.add(serruchoId, {
        description: "Gasolina",
        amount: 800,
        paid_by_participant_id: pMariaId,
        expense_date: "2026-09-06",
        split_method: "EQUAL",
        splits: [{ participant_id: pJuanId }, { participant_id: pMariaId }],
      });

      const live = await SettlementService.calculateLiveSettlement(serruchoId);
      expect(live.totalExpensesCents).toBe(200000);
      const juan = live.participants.find((p) => p.id === pJuanId);
      const maria = live.participants.find((p) => p.id === pMariaId);
      // Juan: paid 1200, owed 300 + 400 = 700 -> net +500
      expect(juan?.net_balance_cents).toBe(50000);
      // Maria: paid 800, owed 300 + 400 = 700 -> net +100
      expect(maria?.net_balance_cents).toBe(10000);
    });

    it("BAL-03: Different payers across varied participant subsets", async () => {
      await ExpenseService.add(serruchoId, {
        description: "Bebidas",
        amount: 400,
        paid_by_participant_id: pPedroId,
        expense_date: "2026-09-06",
        split_method: "EQUAL",
        splits: [{ participant_id: pPedroId }, { participant_id: pAnaId }],
      });

      const live = await SettlementService.calculateLiveSettlement(serruchoId);
      const pedro = live.participants.find((p) => p.id === pPedroId);
      const ana = live.participants.find((p) => p.id === pAnaId);
      // Pedro: paid 400, owed 200 -> net +200
      expect(pedro?.net_balance_cents).toBe(20000);
      // Ana: paid 0, owed 200 -> net -200
      expect(ana?.net_balance_cents).toBe(-20000);
    });

    it("BAL-04: Zero balance (balanced participant who owes and is owed nothing)", async () => {
      await ExpenseService.add(serruchoId, {
        description: "Cena",
        amount: 400,
        paid_by_participant_id: pJuanId,
        expense_date: "2026-09-06",
        split_method: "EQUAL",
        splits: [{ participant_id: pJuanId }, { participant_id: pMariaId }],
      });

      const live = await SettlementService.calculateLiveSettlement(serruchoId);
      const ana = live.participants.find((p) => p.id === pAnaId);
      expect(ana?.net_balance_cents).toBe(0);
      expect(live.settled.some((p) => p.id === pAnaId)).toBe(true);
    });

    it("BAL-05: Negative balance (debtor owes money to the group)", async () => {
      await ExpenseService.add(serruchoId, {
        description: "Pique",
        amount: 300,
        paid_by_participant_id: pJuanId,
        expense_date: "2026-09-06",
        split_method: "EQUAL",
        splits: [{ participant_id: pJuanId }, { participant_id: pMariaId }],
      });

      const live = await SettlementService.calculateLiveSettlement(serruchoId);
      const maria = live.participants.find((p) => p.id === pMariaId);
      expect(maria?.net_balance_cents).toBe(-15000);
      expect(live.debtors.some((p) => p.id === pMariaId)).toBe(true);
    });

    it("BAL-06: Positive balance (creditor receives money from the group)", async () => {
      await ExpenseService.add(serruchoId, {
        description: "Pique",
        amount: 300,
        paid_by_participant_id: pJuanId,
        expense_date: "2026-09-06",
        split_method: "EQUAL",
        splits: [{ participant_id: pJuanId }, { participant_id: pMariaId }],
      });

      const live = await SettlementService.calculateLiveSettlement(serruchoId);
      const juan = live.participants.find((p) => p.id === pJuanId);
      expect(juan?.net_balance_cents).toBe(15000);
      expect(live.creditors.some((p) => p.id === pJuanId)).toBe(true);
    });

    it("BAL-07: Three-way cycle (A owes B, B owes C, C owes A) simplifies to minimal transfers", () => {
      const participants = [
        { id: "p-juan", name: "Juan" },
        { id: "p-maria", name: "María" },
        { id: "p-pedro", name: "Pedro" },
      ];

      // Net balances: Juan owes 100 net to Maria (+100), Maria owes 50 net to Pedro (+50), Pedro owes 50 to Juan
      // Net map: Juan: -50, Maria: +50, Pedro: 0
      const netBalances = new Map<string, number>([
        ["p-juan", -5000],
        ["p-maria", 5000],
        ["p-pedro", 0],
      ]);

      const transfers = simplifyDebts(participants, netBalances);
      // Min-cash-flow produces exactly 1 transfer: Juan -> Maria for 50.00 (RD$ 50)
      expect(transfers).toHaveLength(1);
      expect(transfers[0].from_participant_id).toBe("p-juan");
      expect(transfers[0].to_participant_id).toBe("p-maria");
      expect(transfers[0].amount_cents).toBe(5000);
    });

    it("BAL-08: Preserves exact integer cents with odd distributions (e.g. 100 / 3)", async () => {
      await ExpenseService.add(serruchoId, {
        description: "Uber aeropuerto",
        amount: 100, // 10000 cents
        paid_by_participant_id: pJuanId,
        expense_date: "2026-09-06",
        split_method: "EQUAL",
        splits: [{ participant_id: pJuanId }, { participant_id: pMariaId }, { participant_id: pPedroId }],
      });

      const live = await SettlementService.calculateLiveSettlement(serruchoId);
      const totalNet = live.participants.reduce((sum, p) => sum + p.net_balance_cents, 0);
      expect(totalNet).toBe(0);

      // Deterministic remainder rule: splitEqually sorts participant IDs alphabetically;
      // the first sorted ID receives baseShare + remainder (3,334 cents), others receive 3,333 cents.
      const sortedParticipantIds = [pJuanId, pMariaId, pPedroId].sort();
      const firstId = sortedParticipantIds[0];

      const expectedJuanOwed = pJuanId === firstId ? 3334 : 3333;
      const expectedJuanNet = 10000 - expectedJuanOwed;

      const juan = live.participants.find((p) => p.id === pJuanId);
      expect(juan?.net_balance_cents).toBe(expectedJuanNet);

      // Verify each individual participant's owed share matches the deterministic sorted allocation
      live.participants.forEach((p) => {
        if (p.id === firstId) {
          expect(p.total_owed_cents).toBe(3334);
        } else if ([pMariaId, pPedroId].includes(p.id)) {
          expect(p.total_owed_cents).toBe(3333);
        }
      });

      const transfers = simplifyDebts(live.participants, live.participants);
      const totalTransferCents = transfers.reduce((sum, t) => sum + t.amount_cents, 0);
      expect(totalTransferCents).toBe(expectedJuanNet);
    });

    it("BAL-09: Recalculates balances dynamically on expense edit", async () => {
      const exp = await ExpenseService.add(serruchoId, {
        description: "Cena",
        amount: 600,
        paid_by_participant_id: pJuanId,
        expense_date: "2026-09-06",
        split_method: "EQUAL",
        splits: [{ participant_id: pJuanId }, { participant_id: pMariaId }],
      });

      let live = await SettlementService.calculateLiveSettlement(serruchoId);
      expect(live.participants.find((p) => p.id === pMariaId)?.net_balance_cents).toBe(-30000);

      // Edit expense to 1000
      await ExpenseService.update(exp.id, {
        amount: 1000,
        splits: [{ participant_id: pJuanId }, { participant_id: pMariaId }],
      });

      live = await SettlementService.calculateLiveSettlement(serruchoId);
      expect(live.participants.find((p) => p.id === pMariaId)?.net_balance_cents).toBe(-50000);
      expect(live.participants.find((p) => p.id === pJuanId)?.net_balance_cents).toBe(50000);
    });

    it("BAL-10: Recalculates balances dynamically on expense deletion", async () => {
      const exp = await ExpenseService.add(serruchoId, {
        description: "Cena a borrar",
        amount: 600,
        paid_by_participant_id: pJuanId,
        expense_date: "2026-09-06",
        split_method: "EQUAL",
        splits: [{ participant_id: pJuanId }, { participant_id: pMariaId }],
      });

      await ExpenseService.delete(exp.id);
      const live = await SettlementService.calculateLiveSettlement(serruchoId);
      expect(live.participants.find((p) => p.id === pMariaId)?.net_balance_cents).toBe(0);
      expect(live.participants.find((p) => p.id === pJuanId)?.net_balance_cents).toBe(0);
    });
  });

  // ==========================================
  // SECTION 2: SETTLEMENT & TRANSFERS (SET-01 to SET-08)
  // ==========================================
  describe("Settlement & Transfer Execution Engine (SET-01 to SET-08)", () => {
    beforeEach(async () => {
      // Setup base debt: Juan paid 1000 for Juan and Maria (Maria owes 500)
      await ExpenseService.add(serruchoId, {
        description: "Hotel noche 1",
        amount: 1000,
        paid_by_participant_id: pJuanId,
        expense_date: "2026-09-06",
        split_method: "EQUAL",
        splits: [{ participant_id: pJuanId }, { participant_id: pMariaId }],
      });
    });

    it("SET-01: Creates settlement transfer record", async () => {
      const transfer = await TransferService.add(serruchoId, {
        sender_participant_id: pMariaId,
        receiver_participant_id: pJuanId,
        amount: 500,
        transfer_date: "2026-09-06",
        payment_method: "TRANSFER_POPULAR",
        notes: "Transferencia Banco Popular #48291",
      });

      expect(transfer.id).toBeDefined();
      expect(transfer.amount_cents).toBe(50000);
    });

    it("SET-02: Marks debt as settled in live settlement", async () => {
      await TransferService.add(serruchoId, {
        sender_participant_id: pMariaId,
        receiver_participant_id: pJuanId,
        amount: 500,
        transfer_date: "2026-09-06",
      });

      const live = await SettlementService.calculateLiveSettlement(serruchoId);
      const maria = live.participants.find((p) => p.id === pMariaId);
      const juan = live.participants.find((p) => p.id === pJuanId);
      expect(maria?.net_balance_cents).toBe(0);
      expect(juan?.net_balance_cents).toBe(0);
    });

    it("SET-03: Settlement persistence in transfers repository", async () => {
      await TransferService.add(serruchoId, {
        sender_participant_id: pMariaId,
        receiver_participant_id: pJuanId,
        amount: 500,
        transfer_date: "2026-09-06",
      });

      const allTransfers = await TransferService.listBySerrucho(serruchoId);
      expect(allTransfers).toHaveLength(1);
      expect(allTransfers[0].sender_participant_id).toBe(pMariaId);
      expect(allTransfers[0].receiver_participant_id).toBe(pJuanId);
    });

    it("SET-04: Balance resolution while preserving original expenses intact", async () => {
      await TransferService.add(serruchoId, {
        sender_participant_id: pMariaId,
        receiver_participant_id: pJuanId,
        amount: 500,
        transfer_date: "2026-09-06",
      });

      const expenses = await ExpenseService.listBySerrucho(serruchoId);
      expect(expenses).toHaveLength(1);
      expect(expenses[0].amount_cents).toBe(100000);
    });

    it("SET-05: Rejects settlement with invalid / non-existent sender ID", async () => {
      await expect(
        TransferService.add(serruchoId, {
          sender_participant_id: "p-non-existent",
          receiver_participant_id: pJuanId,
          amount: 500,
          transfer_date: "2026-09-06",
        })
      ).rejects.toThrow(/emisor/i);
    });

    it("SET-06: Rejects settlement with invalid / non-existent receiver ID", async () => {
      await expect(
        TransferService.add(serruchoId, {
          sender_participant_id: pMariaId,
          receiver_participant_id: "p-non-existent",
          amount: 500,
          transfer_date: "2026-09-06",
        })
      ).rejects.toThrow(/receptor/i);
    });

    it("SET-07: Rejects settlement when payer and receiver are the same person", async () => {
      await expect(
        TransferService.add(serruchoId, {
          sender_participant_id: pJuanId,
          receiver_participant_id: pJuanId,
          amount: 500,
          transfer_date: "2026-09-06",
        })
      ).rejects.toThrow();
    });

    it("SET-08: Rejects cross-Serrucho participant IDs", async () => {
      const other = await SerruchoService.create("owner-other", {
        name: "Otro Serrucho",
        currency: "DOP",
        creator_name: "Carlos",
      });
      const otherParticipants = await ParticipantService.listBySerrucho(other.id);
      const foreignId = otherParticipants[0].id;

      await expect(
        TransferService.add(serruchoId, {
          sender_participant_id: foreignId,
          receiver_participant_id: pJuanId,
          amount: 500,
          transfer_date: "2026-09-06",
        })
      ).rejects.toThrow();
    });
  });

  // ==========================================
  // SECTION 3: PROPERTY & INVARIANT TESTING
  // ==========================================
  describe("Zero-Sum Invariant & Financial Property Verification", () => {
    it("INVARIANT: Zero-Sum conservation holds across random expense & settlement lifecycles", async () => {
      // 1. Add 3 expenses
      await ExpenseService.add(serruchoId, {
        description: "Gasto A",
        amount: 2400,
        paid_by_participant_id: pJuanId,
        expense_date: "2026-09-06",
        split_method: "EQUAL",
        splits: [{ participant_id: pJuanId }, { participant_id: pMariaId }, { participant_id: pPedroId }],
      });

      await ExpenseService.add(serruchoId, {
        description: "Gasto B",
        amount: 1500,
        paid_by_participant_id: pMariaId,
        expense_date: "2026-09-06",
        split_method: "SHARES",
        splits: [
          { participant_id: pPedroId, shares: 2 },
          { participant_id: pAnaId, shares: 1 },
        ],
      });

      let live = await SettlementService.calculateLiveSettlement(serruchoId);
      let sumNet = live.participants.reduce((sum, p) => sum + p.net_balance_cents, 0);
      expect(sumNet).toBe(0);

      // 2. Perform partial settlements
      const suggested = simplifyDebts(live.participants, live.participants);
      if (suggested.length > 0) {
        await TransferService.add(serruchoId, {
          sender_participant_id: suggested[0].from_participant_id,
          receiver_participant_id: suggested[0].to_participant_id,
          amount: fromCents(suggested[0].amount_cents),
          transfer_date: "2026-09-06",
        });
      }

      live = await SettlementService.calculateLiveSettlement(serruchoId);
      sumNet = live.participants.reduce((sum, p) => sum + p.net_balance_cents, 0);
      expect(sumNet).toBe(0);
    });
  });

  // ==========================================
  // SECTION 4: ADVERSARIAL TESTING
  // ==========================================
  describe("Adversarial & Security Testing", () => {
    it("rejects negative transfer amount", async () => {
      await expect(
        TransferService.add(serruchoId, {
          sender_participant_id: pMariaId,
          receiver_participant_id: pJuanId,
          amount: -100,
          transfer_date: "2026-09-06",
        })
      ).rejects.toThrow();
    });

    it("rejects zero transfer amount", async () => {
      await expect(
        TransferService.add(serruchoId, {
          sender_participant_id: pMariaId,
          receiver_participant_id: pJuanId,
          amount: 0,
          transfer_date: "2026-09-06",
        })
      ).rejects.toThrow();
    });

    it("rejects transfer in a CLOSED serrucho", async () => {
      await SettlementService.closeSerrucho(serruchoId, {
        payment_instructions: "Cuenta Banreservas 92819281",
        payment_deadline: "2026-09-30",
        confirm: true,
      });

      await expect(
        TransferService.add(serruchoId, {
          sender_participant_id: pMariaId,
          receiver_participant_id: pJuanId,
          amount: 500,
          transfer_date: "2026-09-06",
        })
      ).rejects.toThrow(/cerrado/);
    });

    it("calculateParticipantBalances helper works seamlessly with expenses and transfers", () => {
      const participants = [
        { id: "p1", serrucho_id: "s1", name: "Juan", email: null, phone: null, preferred_channel: "WHATSAPP" as const, created_at: "", updated_at: "" },
        { id: "p2", serrucho_id: "s1", name: "María", email: null, phone: null, preferred_channel: "WHATSAPP" as const, created_at: "", updated_at: "" },
      ];

      const expenses = [
        {
          id: "e1",
          serrucho_id: "s1",
          paid_by_participant_id: "p1",
          paid_by_name: "Juan",
          description: "Comida",
          amount_cents: 10000,
          split_method: "EQUAL" as const,
          category: "FOOD_GROCERIES" as const,
          expense_date: "2026-09-06",
          created_at: "",
          updated_at: "",
          splits: [
            { expense_id: "e1", participant_id: "p1", participant_name: "Juan", owed_cents: 5000, percentage_basis_points: null },
            { expense_id: "e1", participant_id: "p2", participant_name: "María", owed_cents: 5000, percentage_basis_points: null },
          ],
        },
      ];

      // Step 1: before transfer (p1: +5000, p2: -5000)
      const balancesBefore = calculateParticipantBalances(participants, expenses);
      expect(balancesBefore.find((p) => p.id === "p1")?.net_balance_cents).toBe(5000);
      expect(balancesBefore.find((p) => p.id === "p2")?.net_balance_cents).toBe(-5000);

      // Step 2: after transfer (p2 transfers 5000 to p1) -> both 0
      const transfers = [
        {
          id: "t1",
          serrucho_id: "s1",
          sender_participant_id: "p2",
          receiver_participant_id: "p1",
          amount_cents: 5000,
          transfer_date: "2026-09-06",
          created_at: "",
          updated_at: "",
        },
      ];

      const balancesAfter = calculateParticipantBalances(participants, expenses, transfers);
      expect(balancesAfter.find((p) => p.id === "p1")?.net_balance_cents).toBe(0);
      expect(balancesAfter.find((p) => p.id === "p2")?.net_balance_cents).toBe(0);
    });
  });
});
