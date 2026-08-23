import { describe, it, expect, beforeEach } from "vitest";
import { ExpenseService } from "@/features/expenses/service";
import { SerruchoService } from "@/features/serruchos/service";
import { ParticipantService } from "@/features/participants/service";
import { SettlementService } from "@/features/settlements/service";
import { splitByExactAmounts, toCents } from "@serrucho/core";

describe("Milestone 10: Fixed / Exact Amount Split (División por Monto Individual)", () => {
  let serruchoId: string;
  let pAna: string;
  let pBraulin: string;
  let pCarlos: string;

  beforeEach(async () => {
    const serrucho = await SerruchoService.create("owner-1", {
      name: "Cena en Santo Domingo 🍷",
      currency: "DOP",
      creator_name: "Braulin",
    });
    serruchoId = serrucho.id;

    const ana = await ParticipantService.add(serruchoId, { name: "Ana", preferred_channel: "WHATSAPP" });
    const braulin = await ParticipantService.add(serruchoId, { name: "Braulin", preferred_channel: "WHATSAPP" });
    const carlos = await ParticipantService.add(serruchoId, { name: "Carlos", preferred_channel: "WHATSAPP" });

    pAna = ana.id;
    pBraulin = braulin.id;
    pCarlos = carlos.id;
  });

  it("pure math helper splitByExactAmounts validates and splits exact cents", () => {
    const totalCents = toCents(2000);
    const splits = [
      { participantId: "ana", amountCents: toCents(500) },
      { participantId: "braulin", amountCents: toCents(500) },
      { participantId: "carlos", amountCents: toCents(1000) },
    ];

    const result = splitByExactAmounts(totalCents, splits);
    expect(result).toHaveLength(3);
    expect(result[0].owedCents).toBe(toCents(500));
    expect(result[1].owedCents).toBe(toCents(500));
    expect(result[2].owedCents).toBe(toCents(1000));

    const sum = result.reduce((acc, s) => acc + s.owedCents, 0);
    expect(sum).toBe(totalCents);
  });

  it("throws error in pure math if exact amounts do not match total", () => {
    const totalCents = toCents(2000);
    const incompleteSplits = [
      { participantId: "ana", amountCents: toCents(500) },
      { participantId: "braulin", amountCents: toCents(500) },
    ]; // Sum is 1000, not 2000

    expect(() => splitByExactAmounts(totalCents, incompleteSplits)).toThrow();
  });

  it("successfully registers an EXACT expense of RD$ 2,000 where Braulin paid and everyone owes custom amounts", async () => {
    // Braulin pays 2,000.
    // Ana owes 500, Braulin owes 500, Carlos owes 1,000.
    const expense = await ExpenseService.add(serruchoId, {
      description: "Cena en Don Pepe",
      amount: 2000,
      paid_by_participant_id: pBraulin,
      expense_date: "2026-08-22",
      category: "RESTAURANT",
      split_method: "EXACT",
      splits: [
        { participant_id: pAna, amount: 500 },
        { participant_id: pBraulin, amount: 500 },
        { participant_id: pCarlos, amount: 1000 },
      ],
    });

    expect(expense.id).toBeDefined();
    expect(expense.amount_cents).toBe(200000);
    expect(expense.splits).toHaveLength(3);

    // Verify financial balances
    const settlement = await SettlementService.calculateLiveSettlement(serruchoId);

    const bAna = settlement.participants.find((p) => p.id === pAna);
    const bBraulin = settlement.participants.find((p) => p.id === pBraulin);
    const bCarlos = settlement.participants.find((p) => p.id === pCarlos);

    // Ana owes 500 -> net -500
    expect(bAna?.net_balance_cents).toBe(-50000);
    // Carlos owes 1000 -> net -1000
    expect(bCarlos?.net_balance_cents).toBe(-100000);
    // Braulin paid 2000, owes 500 -> net +1500
    expect(bBraulin?.net_balance_cents).toBe(150000);
  });

  it("allows the payer to have RD$0 participation (paid entirely for others)", async () => {
    // Braulin pays 1,500 entirely for Ana and Carlos (Ana: 500, Carlos: 1000, Braulin: 0)
    await ExpenseService.add(serruchoId, {
      description: "Regalo de cumpleaños",
      amount: 1500,
      paid_by_participant_id: pBraulin,
      expense_date: "2026-08-22",
      category: "OTHER",
      split_method: "EXACT",
      splits: [
        { participant_id: pAna, amount: 500 },
        { participant_id: pCarlos, amount: 1000 },
      ],
    });

    const settlement = await SettlementService.calculateLiveSettlement(serruchoId);
    const bBraulin = settlement.participants.find((p) => p.id === pBraulin);

    // Braulin paid 1500, owes 0 -> net +1500
    expect(bBraulin?.net_balance_cents).toBe(150000);
  });

  it("rejects expense if sum of exact amounts does not match total amount", async () => {
    // Total is 2000, but splits only sum to 1500
    await expect(
      ExpenseService.add(serruchoId, {
        description: "Gasto Descuadrado",
        amount: 2000,
        paid_by_participant_id: pBraulin,
        expense_date: "2026-08-22",
        category: "OTHER",
        split_method: "EXACT",
        splits: [
          { participant_id: pAna, amount: 500 },
          { participant_id: pCarlos, amount: 1000 },
        ],
      })
    ).rejects.toThrow();
  });
});
