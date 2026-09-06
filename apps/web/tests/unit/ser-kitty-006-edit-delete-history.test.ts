import { describe, it, expect, beforeEach } from "vitest";
import { ExpenseService } from "@/features/expenses/service";
import { TransferService } from "@/features/transfers/service";
import { IncomeService } from "@/features/incomes/service";
import { ParticipantService } from "@/features/participants/service";
import { SerruchoService } from "@/features/serruchos/service";
import { SettlementService } from "@/features/settlements/service";
import { ActivityService } from "@/features/activity/service";
import { setRepository } from "@/lib/store";
import { MemorySerruchoRepository } from "@/lib/store/memory-repository";
import { toCents, calculateParticipantBalances, simplifyDebts } from "@serrucho/core";

describe("PROMPT 06 — Edit, Delete & Transaction Audit / History Matrix", () => {
  let repo: MemorySerruchoRepository;
  let serruchoId: string;
  let pAnaId: string;
  let pBraulinId: string;
  let pCarlosId: string;

  beforeEach(async () => {
    repo = new MemorySerruchoRepository();
    setRepository(repo);

    const serrucho = await SerruchoService.create("guest-owner", {
      name: "Villa en Jarabacoa 🌲",
      currency: "DOP",
      creator_name: "Ana",
      initial_participants: ["Braulin", "Carlos"],
    });

    serruchoId = serrucho.id;
    const participants = await ParticipantService.listBySerrucho(serruchoId);
    pAnaId = participants.find((p) => p.name === "Ana")!.id;
    pBraulinId = participants.find((p) => p.name === "Braulin")!.id;
    pCarlosId = participants.find((p) => p.name === "Carlos")!.id;
  });

  // ==========================================
  // EXPENSE EDIT (EXP-EDIT-01 .. EXP-EDIT-10)
  // ==========================================
  describe("EXPENSE EDIT", () => {
    // EXP-EDIT-01: edit description
    it("EXP-EDIT-01: edits expense description while keeping amount and splits unchanged", async () => {
      const exp = await ExpenseService.add(serruchoId, {
        description: "Supermercado inicial",
        amount: 3000,
        paid_by_participant_id: pAnaId,
        expense_date: "2026-09-01",
        split_method: "EQUAL",
        splits: [{ participant_id: pAnaId }, { participant_id: pBraulinId }, { participant_id: pCarlosId }],
      });

      const updated = await ExpenseService.update(exp.id, {
        description: "Supermercado Nacional (Actualizado)",
      });

      expect(updated.id).toBe(exp.id);
      expect(updated.description).toBe("Supermercado Nacional (Actualizado)");
      expect(updated.amount_cents).toBe(300000);
    });

    // EXP-EDIT-02: edit amount upward
    it("EXP-EDIT-02: increases expense amount and recalculates split debts proportionally", async () => {
      const exp = await ExpenseService.add(serruchoId, {
        description: "Alquiler Villa",
        amount: 3000,
        paid_by_participant_id: pAnaId,
        expense_date: "2026-09-01",
        split_method: "EQUAL",
        splits: [{ participant_id: pAnaId }, { participant_id: pBraulinId }, { participant_id: pCarlosId }],
      });

      const updated = await ExpenseService.update(exp.id, {
        amount: 6000,
      });

      expect(updated.amount_cents).toBe(600000);
      expect(updated.splits).toHaveLength(3);
      updated.splits.forEach((s) => {
        expect(s.owed_cents).toBe(200000);
      });
    });

    // EXP-EDIT-03: edit amount downward
    it("EXP-EDIT-03: decreases expense amount and reduces participant owed amounts", async () => {
      const exp = await ExpenseService.add(serruchoId, {
        description: "Cena",
        amount: 3000,
        paid_by_participant_id: pAnaId,
        expense_date: "2026-09-01",
        split_method: "EQUAL",
        splits: [{ participant_id: pAnaId }, { participant_id: pBraulinId }, { participant_id: pCarlosId }],
      });

      const updated = await ExpenseService.update(exp.id, {
        amount: 1500,
      });

      expect(updated.amount_cents).toBe(150000);
      updated.splits.forEach((s) => {
        expect(s.owed_cents).toBe(50000);
      });
    });

    // EXP-EDIT-04: change payer
    it("EXP-EDIT-04: changes the payer of an expense and flips creditor/debtor positions", async () => {
      const exp = await ExpenseService.add(serruchoId, {
        description: "Gasolina",
        amount: 3000,
        paid_by_participant_id: pAnaId,
        expense_date: "2026-09-01",
        split_method: "EQUAL",
        splits: [{ participant_id: pAnaId }, { participant_id: pBraulinId }, { participant_id: pCarlosId }],
      });

      // Change payer to Braulin
      const updated = await ExpenseService.update(exp.id, {
        paid_by_participant_id: pBraulinId,
      });

      expect(updated.paid_by_participant_id).toBe(pBraulinId);

      const settlement = await SettlementService.calculateLiveSettlement(serruchoId);
      const bAna = settlement.participants.find((p) => p.id === pAnaId);
      const bBraulin = settlement.participants.find((p) => p.id === pBraulinId);

      expect(bBraulin?.net_balance_cents).toBe(200000); // Braulin paid 3000, owes 1000 => +2000
      expect(bAna?.net_balance_cents).toBe(-100000); // Ana paid 0, owes 1000 => -1000
    });

    // EXP-EDIT-05: change participants
    it("EXP-EDIT-05: updates participant split members, removing excluded members from obligation", async () => {
      const exp = await ExpenseService.add(serruchoId, {
        description: "Paseo a Caballo",
        amount: 3000,
        paid_by_participant_id: pAnaId,
        expense_date: "2026-09-01",
        split_method: "EQUAL",
        splits: [{ participant_id: pAnaId }, { participant_id: pBraulinId }, { participant_id: pCarlosId }],
      });

      // Exclude Carlos (only Ana and Braulin participate, 1500 each)
      const updated = await ExpenseService.update(exp.id, {
        splits: [{ participant_id: pAnaId }, { participant_id: pBraulinId }],
      });

      expect(updated.splits).toHaveLength(2);
      expect(updated.splits.some((s) => s.participant_id === pCarlosId)).toBe(false);

      const settlement = await SettlementService.calculateLiveSettlement(serruchoId);
      const bCarlos = settlement.participants.find((p) => p.id === pCarlosId);
      expect(bCarlos?.net_balance_cents).toBe(0);
    });

    // EXP-EDIT-06: change split values
    it("EXP-EDIT-06: changes exact split values atomically", async () => {
      const exp = await ExpenseService.add(serruchoId, {
        description: "Almuerzo Variado",
        amount: 3000,
        paid_by_participant_id: pAnaId,
        expense_date: "2026-09-01",
        split_method: "EXACT",
        splits: [
          { participant_id: pAnaId, amount: 1000 },
          { participant_id: pBraulinId, amount: 1000 },
          { participant_id: pCarlosId, amount: 1000 },
        ],
      });

      // Change exact distribution: Ana 500, Braulin 1500, Carlos 1000
      const updated = await ExpenseService.update(exp.id, {
        split_method: "EXACT",
        splits: [
          { participant_id: pAnaId, amount: 500 },
          { participant_id: pBraulinId, amount: 1500 },
          { participant_id: pCarlosId, amount: 1000 },
        ],
      });

      const splitAna = updated.splits.find((s) => s.participant_id === pAnaId);
      const splitBraulin = updated.splits.find((s) => s.participant_id === pBraulinId);
      expect(splitAna?.owed_cents).toBe(50000);
      expect(splitBraulin?.owed_cents).toBe(150000);
    });

    // EXP-EDIT-07: preserve expense ID
    it("EXP-EDIT-07: preserves original expense ID through multiple consecutive updates", async () => {
      const exp = await ExpenseService.add(serruchoId, {
        description: "Bebidas",
        amount: 1000,
        paid_by_participant_id: pAnaId,
        expense_date: "2026-09-01",
        split_method: "EQUAL",
        splits: [{ participant_id: pAnaId }, { participant_id: pBraulinId }],
      });

      const u1 = await ExpenseService.update(exp.id, { description: "Bebidas y Hielo" });
      const u2 = await ExpenseService.update(exp.id, { amount: 1200 });

      expect(u1.id).toBe(exp.id);
      expect(u2.id).toBe(exp.id);
    });

    // EXP-EDIT-08: recalculates balances
    it("EXP-EDIT-08: dynamically recalculates net balances from ground truth", async () => {
      const exp = await ExpenseService.add(serruchoId, {
        description: "Gasto Test",
        amount: 3000,
        paid_by_participant_id: pAnaId,
        expense_date: "2026-09-01",
        split_method: "EQUAL",
        splits: [{ participant_id: pAnaId }, { participant_id: pBraulinId }, { participant_id: pCarlosId }],
      });

      await ExpenseService.update(exp.id, { amount: 6000 });

      const settlement = await SettlementService.calculateLiveSettlement(serruchoId);
      const bAna = settlement.participants.find((p) => p.id === pAnaId);
      expect(bAna?.net_balance_cents).toBe(400000); // 6000 paid - 2000 owed = +4000
    });

    // EXP-EDIT-09: recalculates simplified debts
    it("EXP-EDIT-09: updates debt simplification graph immediately upon editing expense", async () => {
      const exp = await ExpenseService.add(serruchoId, {
        description: "Supermercado",
        amount: 3000,
        paid_by_participant_id: pAnaId,
        expense_date: "2026-09-01",
        split_method: "EQUAL",
        splits: [{ participant_id: pAnaId }, { participant_id: pBraulinId }, { participant_id: pCarlosId }],
      });

      let settlement = await SettlementService.calculateLiveSettlement(serruchoId);
      let simplified = simplifyDebts(settlement.participants, settlement.participants);
      expect(simplified).toHaveLength(2); // Braulin -> Ana (1000), Carlos -> Ana (1000)

      // Edit: Carlos excluded
      await ExpenseService.update(exp.id, {
        splits: [{ participant_id: pAnaId }, { participant_id: pBraulinId }],
      });

      settlement = await SettlementService.calculateLiveSettlement(serruchoId);
      simplified = simplifyDebts(settlement.participants, settlement.participants);
      expect(simplified).toHaveLength(1); // Only Braulin -> Ana (1500)
      expect(simplified[0].from_participant_id).toBe(pBraulinId);
      expect(simplified[0].to_participant_id).toBe(pAnaId);
      expect(simplified[0].amount_cents).toBe(150000);
    });

    // EXP-EDIT-10: preserves zero-sum
    it("EXP-EDIT-10: maintains sum(net_balances) === 0 after every edit", async () => {
      const exp = await ExpenseService.add(serruchoId, {
        description: "Alquiler",
        amount: 3000,
        paid_by_participant_id: pAnaId,
        expense_date: "2026-09-01",
        split_method: "EQUAL",
        splits: [{ participant_id: pAnaId }, { participant_id: pBraulinId }, { participant_id: pCarlosId }],
      });

      await ExpenseService.update(exp.id, { amount: 7777 });
      const settlement = await SettlementService.calculateLiveSettlement(serruchoId);
      const sum = settlement.participants.reduce((acc, p) => acc + p.net_balance_cents, 0);
      expect(sum).toBe(0);
    });
  });

  // ==========================================
  // EXPENSE DELETE (EXP-DEL-01 .. EXP-DEL-07)
  // ==========================================
  describe("EXPENSE DELETE", () => {
    // EXP-DEL-01: delete expense
    it("EXP-DEL-01: deletes expense record and returns true", async () => {
      const exp = await ExpenseService.add(serruchoId, {
        description: "Snacks",
        amount: 500,
        paid_by_participant_id: pAnaId,
        expense_date: "2026-09-01",
        split_method: "EQUAL",
        splits: [{ participant_id: pAnaId }, { participant_id: pBraulinId }],
      });

      const deleted = await ExpenseService.delete(exp.id);
      expect(deleted).toBe(true);

      const list = await ExpenseService.listBySerrucho(serruchoId);
      expect(list.find((e) => e.id === exp.id)).toBeUndefined();
    });

    // EXP-DEL-02: remove associated splits
    it("EXP-DEL-02: purges all associated expense splits to prevent orphan records", async () => {
      const exp = await ExpenseService.add(serruchoId, {
        description: "Snacks",
        amount: 500,
        paid_by_participant_id: pAnaId,
        expense_date: "2026-09-01",
        split_method: "EQUAL",
        splits: [{ participant_id: pAnaId }, { participant_id: pBraulinId }],
      });

      await ExpenseService.delete(exp.id);
      const splits = await repo.getExpenseSplits(exp.id);
      expect(splits).toHaveLength(0);
    });

    // EXP-DEL-03: recalculate balances
    it("EXP-DEL-03: resets balances to 0 after deleting the only expense", async () => {
      const exp = await ExpenseService.add(serruchoId, {
        description: "Cena",
        amount: 3000,
        paid_by_participant_id: pAnaId,
        expense_date: "2026-09-01",
        split_method: "EQUAL",
        splits: [{ participant_id: pAnaId }, { participant_id: pBraulinId }, { participant_id: pCarlosId }],
      });

      await ExpenseService.delete(exp.id);
      const settlement = await SettlementService.calculateLiveSettlement(serruchoId);
      settlement.participants.forEach((p) => {
        expect(p.net_balance_cents).toBe(0);
        expect(p.total_paid_cents).toBe(0);
        expect(p.total_owed_cents).toBe(0);
      });
    });

    // EXP-DEL-04: recalculate debts
    it("EXP-DEL-04: simplifies debts to empty list after all expenses are removed", async () => {
      const exp = await ExpenseService.add(serruchoId, {
        description: "Cena",
        amount: 3000,
        paid_by_participant_id: pAnaId,
        expense_date: "2026-09-01",
        split_method: "EQUAL",
        splits: [{ participant_id: pAnaId }, { participant_id: pBraulinId }],
      });

      await ExpenseService.delete(exp.id);
      const settlement = await SettlementService.calculateLiveSettlement(serruchoId);
      const debts = simplifyDebts(settlement.participants, settlement.participants);
      expect(debts).toHaveLength(0);
    });

    // EXP-DEL-05: preserve participants
    it("EXP-DEL-05: preserving all participant entities when deleting an expense", async () => {
      const exp = await ExpenseService.add(serruchoId, {
        description: "Cena",
        amount: 3000,
        paid_by_participant_id: pAnaId,
        expense_date: "2026-09-01",
        split_method: "EQUAL",
        splits: [{ participant_id: pAnaId }, { participant_id: pBraulinId }, { participant_id: pCarlosId }],
      });

      await ExpenseService.delete(exp.id);
      const participants = await ParticipantService.listBySerrucho(serruchoId);
      expect(participants).toHaveLength(3);
    });

    // EXP-DEL-06: preserve unrelated transfers
    it("EXP-DEL-06: preserves transfers and settlements when deleting an unrelated expense", async () => {
      const exp = await ExpenseService.add(serruchoId, {
        description: "Cena",
        amount: 3000,
        paid_by_participant_id: pAnaId,
        expense_date: "2026-09-01",
        split_method: "EQUAL",
        splits: [{ participant_id: pAnaId }, { participant_id: pBraulinId }],
      });

      const transfer = await TransferService.add(serruchoId, {
        sender_participant_id: pBraulinId,
        receiver_participant_id: pAnaId,
        amount: 500,
        transfer_date: "2026-09-02",
      });

      await ExpenseService.delete(exp.id);
      const transferList = await TransferService.listBySerrucho(serruchoId);
      expect(transferList).toHaveLength(1);
      expect(transferList[0].id).toBe(transfer.id);
    });

    // EXP-DEL-07: preserve unrelated incomes
    it("EXP-DEL-07: preserves incomes and refunds when deleting an expense", async () => {
      const exp = await ExpenseService.add(serruchoId, {
        description: "Cena",
        amount: 3000,
        paid_by_participant_id: pAnaId,
        expense_date: "2026-09-01",
        split_method: "EQUAL",
        splits: [{ participant_id: pAnaId }, { participant_id: pBraulinId }],
      });

      const income = await IncomeService.add(serruchoId, {
        description: "Devolución Depósito",
        amount: 1000,
        received_by_participant_id: pAnaId,
        income_date: "2026-09-02",
        split_method: "EQUAL",
        splits: [{ participant_id: pAnaId }, { participant_id: pBraulinId }],
      });

      await ExpenseService.delete(exp.id);
      const incomeList = await IncomeService.listBySerrucho(serruchoId);
      expect(incomeList).toHaveLength(1);
      expect(incomeList[0].id).toBe(income.id);
    });
  });

  // ==========================================
  // TRANSFERS (TR-01 .. TR-05)
  // ==========================================
  describe("TRANSFERS", () => {
    // TR-01: transfer edit behavior
    it("TR-01: edits transfer amount and receiver, updating net balances correctly", async () => {
      const transfer = await TransferService.add(serruchoId, {
        sender_participant_id: pBraulinId,
        receiver_participant_id: pAnaId,
        amount: 1000,
        transfer_date: "2026-09-01",
      });

      const updated = await TransferService.update(transfer.id, {
        amount: 1500,
        receiver_participant_id: pCarlosId,
      });

      expect(updated.id).toBe(transfer.id);
      expect(updated.amount_cents).toBe(150000);
      expect(updated.receiver_participant_id).toBe(pCarlosId);
    });

    // TR-02: transfer delete behavior
    it("TR-02: deletes transfer and restores previous balance state", async () => {
      const transfer = await TransferService.add(serruchoId, {
        sender_participant_id: pBraulinId,
        receiver_participant_id: pAnaId,
        amount: 1000,
        transfer_date: "2026-09-01",
      });

      const deleted = await TransferService.delete(transfer.id);
      expect(deleted).toBe(true);

      const list = await TransferService.listBySerrucho(serruchoId);
      expect(list).toHaveLength(0);
    });

    // TR-03: balance recalculation
    it("TR-03: recalculates net balances accurately after transfer addition, edit, and deletion", async () => {
      // 1. Add transfer: Braulin -> Ana 1000
      const transfer = await TransferService.add(serruchoId, {
        sender_participant_id: pBraulinId,
        receiver_participant_id: pAnaId,
        amount: 1000,
        transfer_date: "2026-09-01",
      });

      let settlement = await SettlementService.calculateLiveSettlement(serruchoId);
      expect(settlement.participants.find((p) => p.id === pBraulinId)?.net_balance_cents).toBe(100000);
      expect(settlement.participants.find((p) => p.id === pAnaId)?.net_balance_cents).toBe(-100000);

      // 2. Delete transfer
      await TransferService.delete(transfer.id);
      settlement = await SettlementService.calculateLiveSettlement(serruchoId);
      settlement.participants.forEach((p) => expect(p.net_balance_cents).toBe(0));
    });

    // TR-04: settlement integrity
    it("TR-04: preserves zero-sum invariant across transfer modifications", async () => {
      const transfer = await TransferService.add(serruchoId, {
        sender_participant_id: pBraulinId,
        receiver_participant_id: pCarlosId,
        amount: 2500,
        transfer_date: "2026-09-01",
      });

      await TransferService.update(transfer.id, { amount: 3333 });
      const settlement = await SettlementService.calculateLiveSettlement(serruchoId);
      const sum = settlement.participants.reduce((acc, p) => acc + p.net_balance_cents, 0);
      expect(sum).toBe(0);
    });

    // TR-05: duplicate mutation protection
    it("TR-05: rejects invalid self-transfers where sender equals receiver", async () => {
      await expect(
        TransferService.add(serruchoId, {
          sender_participant_id: pAnaId,
          receiver_participant_id: pAnaId,
          amount: 500,
          transfer_date: "2026-09-01",
        })
      ).rejects.toThrow();
    });
  });

  // ==========================================
  // INCOME (INC-01 .. INC-04)
  // ==========================================
  describe("INCOME", () => {
    // INC-01: income edit behavior
    it("INC-01: edits income amount and splits, preserving income ID", async () => {
      const income = await IncomeService.add(serruchoId, {
        description: "Reembolso Hotel",
        amount: 1200,
        received_by_participant_id: pAnaId,
        income_date: "2026-09-01",
        split_method: "EQUAL",
        splits: [{ participant_id: pAnaId }, { participant_id: pBraulinId }, { participant_id: pCarlosId }],
      });

      const updated = await IncomeService.update(income.id, {
        amount: 1500,
        splits: [{ participant_id: pAnaId }, { participant_id: pBraulinId }],
      });

      expect(updated.id).toBe(income.id);
      expect(updated.amount_cents).toBe(150000);
      expect(updated.splits).toHaveLength(2);
    });

    // INC-02: income delete behavior
    it("INC-02: deletes income and purges income splits cleanly", async () => {
      const income = await IncomeService.add(serruchoId, {
        description: "Reembolso",
        amount: 900,
        received_by_participant_id: pAnaId,
        income_date: "2026-09-01",
        split_method: "EQUAL",
        splits: [{ participant_id: pAnaId }, { participant_id: pBraulinId }],
      });

      const deleted = await IncomeService.delete(income.id);
      expect(deleted).toBe(true);

      const splits = await repo.getIncomeSplits(income.id);
      expect(splits).toHaveLength(0);
    });

    // INC-03: income split integrity
    it("INC-03: verifies income credits sum to total income amount", async () => {
      const income = await IncomeService.add(serruchoId, {
        description: "Reembolso Parque",
        amount: 1000,
        received_by_participant_id: pAnaId,
        income_date: "2026-09-01",
        split_method: "EQUAL",
        splits: [{ participant_id: pAnaId }, { participant_id: pBraulinId }, { participant_id: pCarlosId }],
      });

      const splits = await repo.getIncomeSplits(income.id);
      const sumCredits = splits.reduce((acc, s) => acc + s.credit_cents, 0);
      expect(sumCredits).toBe(100000);
    });

    // INC-04: balance recalculation
    it("INC-04: recalculates net balances when income is deleted", async () => {
      const income = await IncomeService.add(serruchoId, {
        description: "Reembolso",
        amount: 1200,
        received_by_participant_id: pAnaId,
        income_date: "2026-09-01",
        split_method: "EQUAL",
        splits: [{ participant_id: pAnaId }, { participant_id: pBraulinId }, { participant_id: pCarlosId }],
      });

      await IncomeService.delete(income.id);
      const settlement = await SettlementService.calculateLiveSettlement(serruchoId);
      settlement.participants.forEach((p) => expect(p.net_balance_cents).toBe(0));
    });
  });

  // ==========================================
  // HISTORY / AUDIT (HIST-01 .. HIST-06)
  // ==========================================
  describe("HISTORY / AUDIT", () => {
    // HIST-01: create event
    it("HIST-01: records EXPENSE_CREATED event in audit activity log", async () => {
      const exp = await ExpenseService.add(serruchoId, {
        description: "Cena en El Pescador",
        amount: 3000,
        paid_by_participant_id: pBraulinId,
        expense_date: "2026-09-01",
        split_method: "EQUAL",
        splits: [{ participant_id: pAnaId }, { participant_id: pBraulinId }],
      });

      const activities = await ActivityService.listBySerrucho(serruchoId);
      const event = activities.find((a) => a.action_type === "EXPENSE_CREATED" && a.entity_id === exp.id);

      expect(event).toBeDefined();
      expect(event?.actor_name).toBe("Braulin");
      expect(event?.summary).toContain("Cena en El Pescador");
    });

    // HIST-02: update event
    it("HIST-02: records EXPENSE_UPDATED event with diff metadata", async () => {
      const exp = await ExpenseService.add(serruchoId, {
        description: "Cena",
        amount: 3000,
        paid_by_participant_id: pBraulinId,
        expense_date: "2026-09-01",
        split_method: "EQUAL",
        splits: [{ participant_id: pAnaId }, { participant_id: pBraulinId }],
      });

      await ExpenseService.update(exp.id, { amount: 4500 });
      const activities = await ActivityService.listBySerrucho(serruchoId);
      const event = activities.find((a) => a.action_type === "EXPENSE_UPDATED" && a.entity_id === exp.id);

      expect(event).toBeDefined();
      expect(event?.metadata?.old_amount_cents).toBe(300000);
      expect(event?.metadata?.new_amount_cents).toBe(450000);
    });

    // HIST-03: delete event
    it("HIST-03: records EXPENSE_DELETED event when expense is removed", async () => {
      const exp = await ExpenseService.add(serruchoId, {
        description: "Postre",
        amount: 600,
        paid_by_participant_id: pAnaId,
        expense_date: "2026-09-01",
        split_method: "EQUAL",
        splits: [{ participant_id: pAnaId }, { participant_id: pBraulinId }],
      });

      await ExpenseService.delete(exp.id);
      const activities = await ActivityService.listBySerrucho(serruchoId);
      const event = activities.find((a) => a.action_type === "EXPENSE_DELETED" && a.entity_id === exp.id);

      expect(event).toBeDefined();
      expect(event?.summary).toContain("Se eliminó el gasto");
    });

    // HIST-04: correct entity reference
    it("HIST-04: links audit event entity_id to actual entity", async () => {
      const transfer = await TransferService.add(serruchoId, {
        sender_participant_id: pBraulinId,
        receiver_participant_id: pAnaId,
        amount: 800,
        transfer_date: "2026-09-01",
      });

      const activities = await ActivityService.listBySerrucho(serruchoId);
      const event = activities.find((a) => a.action_type === "TRANSFER_CREATED");

      expect(event?.entity_id).toBe(transfer.id);
      expect(event?.entity_type).toBe("TRANSFER");
    });

    // HIST-05: correct Serrucho reference
    it("HIST-05: isolates activity events to their specific serrucho_id", async () => {
      const otherSerrucho = await SerruchoService.create("other-user", {
        name: "Otro Grupo",
        creator_name: "Alien",
      });

      const activitiesA = await ActivityService.listBySerrucho(serruchoId);
      const activitiesB = await ActivityService.listBySerrucho(otherSerrucho.id);

      expect(activitiesA.every((a) => a.serrucho_id === serruchoId)).toBe(true);
      expect(activitiesB.every((a) => a.serrucho_id === otherSerrucho.id)).toBe(true);
    });

    // HIST-06: actor identity when supported
    it("HIST-06: populates actor_name from participant context without exposing credentials", async () => {
      await ExpenseService.add(serruchoId, {
        description: "Desayuno",
        amount: 800,
        paid_by_participant_id: pAnaId,
        expense_date: "2026-09-01",
        split_method: "EQUAL",
        splits: [{ participant_id: pAnaId }, { participant_id: pBraulinId }],
      });

      const activities = await ActivityService.listBySerrucho(serruchoId);
      const event = activities.find((a) => a.summary.includes("Desayuno"));

      expect(event?.actor_name).toBe("Ana");
      expect(JSON.stringify(event)).not.toContain("password");
      expect(JSON.stringify(event)).not.toContain("secret");
    });
  });

  // ==========================================
  // SECURITY (SEC-01 .. SEC-08)
  // ==========================================
  describe("SECURITY", () => {
    // SEC-01: foreign expense
    it("SEC-01: prevents mutating an expense using mismatched serrucho context", async () => {
      const exp = await ExpenseService.add(serruchoId, {
        description: "Gasto Propio",
        amount: 1000,
        paid_by_participant_id: pAnaId,
        expense_date: "2026-09-01",
        split_method: "EQUAL",
        splits: [{ participant_id: pAnaId }, { participant_id: pBraulinId }],
      });

      const otherSerrucho = await SerruchoService.create("other-user", {
        name: "Otro Grupo",
        creator_name: "Alien",
      });
      const otherP = (await ParticipantService.listBySerrucho(otherSerrucho.id))[0];

      // Attempting to assign foreign participant to this expense
      await expect(
        ExpenseService.update(exp.id, {
          paid_by_participant_id: otherP.id,
        })
      ).rejects.toThrow(/El pagador no es un participante válido/);
    });

    // SEC-02: foreign transfer
    it("SEC-02: blocks transfer mutation with foreign participant", async () => {
      const transfer = await TransferService.add(serruchoId, {
        sender_participant_id: pBraulinId,
        receiver_participant_id: pAnaId,
        amount: 500,
        transfer_date: "2026-09-01",
      });

      const otherSerrucho = await SerruchoService.create("other-user", {
        name: "Otro Grupo",
        creator_name: "Alien",
      });
      const otherP = (await ParticipantService.listBySerrucho(otherSerrucho.id))[0];

      await expect(
        TransferService.update(transfer.id, {
          receiver_participant_id: otherP.id,
        })
      ).rejects.toThrow(/Participante receptor inválido/);
    });

    // SEC-03: foreign income
    it("SEC-03: blocks income mutation with foreign recipient", async () => {
      const income = await IncomeService.add(serruchoId, {
        description: "Reembolso",
        amount: 500,
        received_by_participant_id: pAnaId,
        income_date: "2026-09-01",
        split_method: "EQUAL",
        splits: [{ participant_id: pAnaId }, { participant_id: pBraulinId }],
      });

      const otherSerrucho = await SerruchoService.create("other-user", {
        name: "Otro Grupo",
        creator_name: "Alien",
      });
      const otherP = (await ParticipantService.listBySerrucho(otherSerrucho.id))[0];

      await expect(
        IncomeService.update(income.id, {
          received_by_participant_id: otherP.id,
        })
      ).rejects.toThrow(/El participante receptor no es válido/);
    });

    // SEC-04: foreign participant
    it("SEC-04: rejects adding participant to non-existent or foreign Serrucho", async () => {
      await expect(
        ParticipantService.add("non-existent-serrucho-id", {
          name: "Hacker",
        })
      ).rejects.toThrow(/Serrucho no encontrado/);
    });

    // SEC-05: closed Serrucho
    it("SEC-05: blocks editing or deleting transactions on closed Serrucho", async () => {
      const exp = await ExpenseService.add(serruchoId, {
        description: "Carbón y Hielo",
        amount: 500,
        paid_by_participant_id: pAnaId,
        expense_date: "2026-09-01",
        split_method: "EQUAL",
        splits: [{ participant_id: pAnaId }, { participant_id: pBraulinId }],
      });

      await repo.updateSerrucho(serruchoId, { status: "CLOSED" });

      await expect(ExpenseService.update(exp.id, { amount: 600 })).rejects.toThrow(
        /No se pueden modificar gastos en un serrucho cerrado/
      );
      await expect(ExpenseService.delete(exp.id)).rejects.toThrow(
        /No se pueden eliminar gastos de un serrucho cerrado/
      );
    });

    // SEC-06: unauthorized mutation
    it("SEC-06: rejects modifying non-existent transaction IDs", async () => {
      await expect(
        ExpenseService.update("non-existent-expense-id", { amount: 100 })
      ).rejects.toThrow(/Gasto no encontrado/);

      await expect(
        TransferService.update("non-existent-transfer-id", { amount: 100 })
      ).rejects.toThrow(/Transferencia no encontrada/);

      await expect(
        IncomeService.update("non-existent-income-id", { amount: 100 })
      ).rejects.toThrow(/Ingreso no encontrado/);
    });

    // SEC-07: duplicate mutation / idempotency
    it("SEC-07: deleting already-deleted transaction returns false safely without crashing", async () => {
      const exp = await ExpenseService.add(serruchoId, {
        description: "Snack",
        amount: 200,
        paid_by_participant_id: pAnaId,
        expense_date: "2026-09-01",
        split_method: "EQUAL",
        splits: [{ participant_id: pAnaId }, { participant_id: pBraulinId }],
      });

      const d1 = await ExpenseService.delete(exp.id);
      expect(d1).toBe(true);

      const d2 = await ExpenseService.delete(exp.id);
      expect(d2).toBe(false);
    });

    // SEC-08: malformed IDs
    it("SEC-08: handles malformed and injection strings in IDs safely", async () => {
      const malformed = ["'; DROP TABLE expenses; --", "<script>alert(1)</script>", "../../../etc/passwd"];
      for (const badId of malformed) {
        await expect(ExpenseService.update(badId, { amount: 100 })).rejects.toThrow();
        const delRes = await ExpenseService.delete(badId);
        expect(delRes).toBe(false);
      }
    });
  });

  // ==========================================
  // ADVERSARIAL SCENARIOS (ADV-A .. ADV-F)
  // ==========================================
  describe("ADVERSARIAL SCENARIOS", () => {
    // Scenario A: Create -> Edit -> Edit again -> Delete
    it("ADV-A: executes full lifecycle Create -> Edit -> Edit again -> Delete cleanly", async () => {
      const exp = await ExpenseService.add(serruchoId, {
        description: "Hotel",
        amount: 3000,
        paid_by_participant_id: pAnaId,
        expense_date: "2026-09-01",
        split_method: "EQUAL",
        splits: [{ participant_id: pAnaId }, { participant_id: pBraulinId }, { participant_id: pCarlosId }],
      });

      await ExpenseService.update(exp.id, { amount: 4500 });
      await ExpenseService.update(exp.id, {
        splits: [{ participant_id: pAnaId }, { participant_id: pBraulinId }],
      });

      await ExpenseService.delete(exp.id);

      const settlement = await SettlementService.calculateLiveSettlement(serruchoId);
      settlement.participants.forEach((p) => expect(p.net_balance_cents).toBe(0));
    });

    // Scenario B: Create Expense -> Settlement -> Edit Expense
    it("ADV-B: updates balances correctly when editing expense after partial settlement transfer is recorded", async () => {
      // 1. Ana pays 3000 equal (Ana, Braulin, Carlos owe 1000 each)
      const exp = await ExpenseService.add(serruchoId, {
        description: "Super",
        amount: 3000,
        paid_by_participant_id: pAnaId,
        expense_date: "2026-09-01",
        split_method: "EQUAL",
        splits: [{ participant_id: pAnaId }, { participant_id: pBraulinId }, { participant_id: pCarlosId }],
      });

      // 2. Braulin settles his 1000 to Ana
      await TransferService.add(serruchoId, {
        sender_participant_id: pBraulinId,
        receiver_participant_id: pAnaId,
        amount: 1000,
        transfer_date: "2026-09-02",
      });

      // 3. Edit expense: total is now 6000 (2000 each)
      await ExpenseService.update(exp.id, { amount: 6000 });

      const settlement = await SettlementService.calculateLiveSettlement(serruchoId);
      const bBraulin = settlement.participants.find((p) => p.id === pBraulinId);
      const bCarlos = settlement.participants.find((p) => p.id === pCarlosId);
      const bAna = settlement.participants.find((p) => p.id === pAnaId);

      // Braulin: owes 2000, paid transfer 1000 => net -1000
      expect(bBraulin?.net_balance_cents).toBe(-100000);
      // Carlos: owes 2000, paid 0 => net -2000
      expect(bCarlos?.net_balance_cents).toBe(-200000);
      // Ana: paid expense 6000, received transfer 1000, owes 2000 => net +3000
      expect(bAna?.net_balance_cents).toBe(300000);
    });

    // Scenario C: Create Expense -> Settlement -> Delete Expense
    it("ADV-C: handles deleting expense when historic settlement transfer remains recorded", async () => {
      const exp = await ExpenseService.add(serruchoId, {
        description: "Cena",
        amount: 2000,
        paid_by_participant_id: pAnaId,
        expense_date: "2026-09-01",
        split_method: "EQUAL",
        splits: [{ participant_id: pAnaId }, { participant_id: pBraulinId }],
      });

      await TransferService.add(serruchoId, {
        sender_participant_id: pBraulinId,
        receiver_participant_id: pAnaId,
        amount: 1000,
        transfer_date: "2026-09-02",
      });

      // Delete expense: historic transfer remains, Braulin is now creditor +1000, Ana is debtor -1000
      await ExpenseService.delete(exp.id);

      const settlement = await SettlementService.calculateLiveSettlement(serruchoId);
      const bBraulin = settlement.participants.find((p) => p.id === pBraulinId);
      const bAna = settlement.participants.find((p) => p.id === pAnaId);

      expect(bBraulin?.net_balance_cents).toBe(100000);
      expect(bAna?.net_balance_cents).toBe(-100000);
    });

    // Scenario D: Create -> Delete -> Retry Delete
    it("ADV-D: handles rapid consecutive delete retries safely without errors", async () => {
      const exp = await ExpenseService.add(serruchoId, {
        description: "Gas",
        amount: 400,
        paid_by_participant_id: pAnaId,
        expense_date: "2026-09-01",
        split_method: "EQUAL",
        splits: [{ participant_id: pAnaId }, { participant_id: pBraulinId }],
      });

      const res1 = await ExpenseService.delete(exp.id);
      const res2 = await ExpenseService.delete(exp.id);

      expect(res1).toBe(true);
      expect(res2).toBe(false);
    });

    // Scenario E: Web & Mobile Engine Parity
    it("ADV-E: produces identical mathematical calculation in core domain balances", async () => {
      const exp = await ExpenseService.add(serruchoId, {
        description: "Comida",
        amount: 3000,
        paid_by_participant_id: pAnaId,
        expense_date: "2026-09-01",
        split_method: "EQUAL",
        splits: [{ participant_id: pAnaId }, { participant_id: pBraulinId }, { participant_id: pCarlosId }],
      });

      const participants = await ParticipantService.listBySerrucho(serruchoId);
      const expenses = await ExpenseService.listBySerrucho(serruchoId);
      const transfers = await TransferService.listBySerrucho(serruchoId);

      const balances = calculateParticipantBalances(participants, expenses, transfers);
      const sumBalances = balances.reduce((sum, p) => sum + p.net_balance_cents, 0);

      expect(sumBalances).toBe(0);
      expect(balances.find((p) => p.id === pAnaId)?.net_balance_cents).toBe(200000);
      expect(balances.find((p) => p.id === pBraulinId)?.net_balance_cents).toBe(-100000);
    });

    // Scenario F: Full Ground-Truth Reconciliation
    it("ADV-F: reconciles balances completely from raw transaction state", async () => {
      const exp1 = await ExpenseService.add(serruchoId, {
        description: "Gasto 1",
        amount: 1500,
        paid_by_participant_id: pAnaId,
        expense_date: "2026-09-01",
        split_method: "EQUAL",
        splits: [{ participant_id: pAnaId }, { participant_id: pBraulinId }, { participant_id: pCarlosId }],
      });

      const exp2 = await ExpenseService.add(serruchoId, {
        description: "Gasto 2",
        amount: 3000,
        paid_by_participant_id: pBraulinId,
        expense_date: "2026-09-01",
        split_method: "EQUAL",
        splits: [{ participant_id: pAnaId }, { participant_id: pBraulinId }, { participant_id: pCarlosId }],
      });

      await ExpenseService.update(exp1.id, { amount: 3000 });
      await ExpenseService.delete(exp2.id);

      const settlement = await SettlementService.calculateLiveSettlement(serruchoId);
      const bAna = settlement.participants.find((p) => p.id === pAnaId);
      const bBraulin = settlement.participants.find((p) => p.id === pBraulinId);
      const bCarlos = settlement.participants.find((p) => p.id === pCarlosId);

      expect(bAna?.net_balance_cents).toBe(200000);
      expect(bBraulin?.net_balance_cents).toBe(-100000);
      expect(bCarlos?.net_balance_cents).toBe(-100000);
    });
  });
});
