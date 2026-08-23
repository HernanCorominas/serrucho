import { describe, it, expect, beforeEach } from "vitest";
import { ExpenseService } from "@/features/expenses/service";
import { SerruchoService } from "@/features/serruchos/service";
import { ParticipantService } from "@/features/participants/service";
import { SettlementService } from "@/features/settlements/service";

describe("Milestone 07: Add Expense Validation & Financial Engine", () => {
  let serruchoId: string;
  let p1Id: string;
  let p2Id: string;
  let p3Id: string;

  beforeEach(async () => {
    const serrucho = await SerruchoService.create("owner-1", {
      name: "Coro en Juan Dolio 🏖️",
      currency: "DOP",
      creator_name: "Braulio",
    });
    serruchoId = serrucho.id;

    const p1 = await ParticipantService.add(serruchoId, { name: "Braulio", preferred_channel: "WHATSAPP" });
    const p2 = await ParticipantService.add(serruchoId, { name: "Camila", preferred_channel: "WHATSAPP" });
    const p3 = await ParticipantService.add(serruchoId, { name: "Marcos", preferred_channel: "WHATSAPP" });

    p1Id = p1.id;
    p2Id = p2.id;
    p3Id = p3.id;
  });

  it("successfully registers a normal expense divided equally among all participants", async () => {
    const expense = await ExpenseService.add(serruchoId, {
      description: "Supermercado Nacional",
      amount: 3000,
      paid_by_participant_id: p1Id,
      expense_date: "2026-08-22",
      category: "FOOD_GROCERIES",
      split_method: "EQUAL",
      splits: [{ participant_id: p1Id }, { participant_id: p2Id }, { participant_id: p3Id }],
    });

    expect(expense.id).toBeDefined();
    expect(expense.amount_cents).toBe(300000);
    expect(expense.splits).toHaveLength(3);
    expect(expense.splits[0].owed_cents).toBe(100000); // 1000 DOP each

    // Check updated settlement balances
    const settlement = await SettlementService.calculateLiveSettlement(serruchoId);
    const p1Fin = settlement.participants.find((p) => p.id === p1Id);
    const p2Fin = settlement.participants.find((p) => p.id === p2Id);

    // Braulio paid 3000, consumed 1000 -> net +2000
    expect(p1Fin?.net_balance_cents).toBe(200000);
    // Camila paid 0, consumed 1000 -> net -1000
    expect(p2Fin?.net_balance_cents).toBe(-100000);
  });

  it("supports partial participant splits (e.g. Uber for only 2 people)", async () => {
    const expense = await ExpenseService.add(serruchoId, {
      description: "Uber al hotel",
      amount: 800,
      paid_by_participant_id: p2Id, // Camila paid
      expense_date: "2026-08-22",
      category: "FUEL_TRANSPORT",
      split_method: "EQUAL",
      splits: [{ participant_id: p1Id }, { participant_id: p2Id }], // Only Braulio and Camila
    });

    expect(expense.splits).toHaveLength(2);
    expect(expense.splits[0].owed_cents).toBe(40000); // 400 DOP each

    const settlement = await SettlementService.calculateLiveSettlement(serruchoId);
    const p3Fin = settlement.participants.find((p) => p.id === p3Id);
    // Marcos was not included in Uber -> net 0
    expect(p3Fin?.net_balance_cents).toBe(0);
  });

  it("rejects non-positive and invalid amounts", async () => {
    await expect(
      ExpenseService.add(serruchoId, {
        description: "Gasto Cero",
        amount: 0,
        paid_by_participant_id: p1Id,
        expense_date: "2026-08-22",
        category: "OTHER",
        split_method: "EQUAL",
        splits: [{ participant_id: p1Id }],
      })
    ).rejects.toThrow();
  });

  it("rejects expense if paid_by_participant_id does not exist in the serrucho", async () => {
    await expect(
      ExpenseService.add(serruchoId, {
        description: "Gasto Fantasma",
        amount: 500,
        paid_by_participant_id: "non-existent-user",
        expense_date: "2026-08-22",
        category: "OTHER",
        split_method: "EQUAL",
        splits: [{ participant_id: p1Id }],
      })
    ).rejects.toThrow();
  });
});
