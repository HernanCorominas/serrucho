import { describe, it, expect, beforeEach } from "vitest";
import { ExpenseService } from "@/features/expenses/service";
import { SerruchoService } from "@/features/serruchos/service";
import { ParticipantService } from "@/features/participants/service";
import { SettlementService } from "@/features/settlements/service";
import { splitByShares, toCents } from "@serrucho/core";

describe("Milestone 11: Weighted Shares Split (División por Pesos / Cuotas)", () => {
  let serruchoId: string;
  let pAdultA: string;
  let pAdultB: string;
  let pChild: string;

  beforeEach(async () => {
    const serrucho = await SerruchoService.create("owner-1", {
      name: "Día de Playa en Las Terrenas 🌴",
      currency: "DOP",
      creator_name: "Adulto A",
    });
    serruchoId = serrucho.id;

    const a = await ParticipantService.add(serruchoId, { name: "Adulto A", preferred_channel: "WHATSAPP" });
    const b = await ParticipantService.add(serruchoId, { name: "Adulto B", preferred_channel: "WHATSAPP" });
    const child = await ParticipantService.add(serruchoId, { name: "Niño", preferred_channel: "WHATSAPP" });

    pAdultA = a.id;
    pAdultB = b.id;
    pChild = child.id;
  });

  it("splits RD$ 2,500 with shares [1, 1, 0.5] into exact RD$ 1,000, RD$ 1,000 and RD$ 500", () => {
    const totalCents = toCents(2500); // 250,000
    const input = [
      { participantId: "adult-a", shares: 1 },
      { participantId: "adult-b", shares: 1 },
      { participantId: "child", shares: 0.5 },
    ];

    const result = splitByShares(totalCents, input);

    expect(result).toHaveLength(3);
    expect(result[0].owedCents).toBe(toCents(1000));
    expect(result[1].owedCents).toBe(toCents(1000));
    expect(result[2].owedCents).toBe(toCents(500));

    const sum = result.reduce((acc, s) => acc + s.owedCents, 0);
    expect(sum).toBe(totalCents);
  });

  it("splits RD$ 10,000 with couples (2 shares) and singles (1 share)", () => {
    // Couple A: 2 shares, Couple B: 2 shares, Single C: 1 share -> total 5 shares
    // 10,000 / 5 = 2,000 per share
    const totalCents = toCents(10000);
    const input = [
      { participantId: "couple-a", shares: 2 },
      { participantId: "couple-b", shares: 2 },
      { participantId: "single-c", shares: 1 },
    ];

    const result = splitByShares(totalCents, input);

    expect(result[0].owedCents).toBe(toCents(4000));
    expect(result[1].owedCents).toBe(toCents(4000));
    expect(result[2].owedCents).toBe(toCents(2000));

    const sum = result.reduce((acc, s) => acc + s.owedCents, 0);
    expect(sum).toBe(totalCents);
  });

  it("handles remainder cents without any penny loss when splitting uneven shares", () => {
    const totalCents = 10000; // RD$ 100.00
    const input = [
      { participantId: "a", shares: 1 },
      { participantId: "b", shares: 1 },
      { participantId: "c", shares: 1 },
    ];

    const result = splitByShares(totalCents, input);
    const sum = result.reduce((acc, s) => acc + s.owedCents, 0);
    expect(sum).toBe(10000);
  });

  it("successfully registers a SHARES expense in ExpenseService and updates settlement balances", async () => {
    // Adult A pays 2,500 with shares [1, 1, 0.5]
    const expense = await ExpenseService.add(serruchoId, {
      description: "Entradas al Parque Acuático",
      amount: 2500,
      paid_by_participant_id: pAdultA,
      expense_date: "2026-08-22",
      category: "ENTERTAINMENT",
      split_method: "SHARES",
      splits: [
        { participant_id: pAdultA, shares: 1 },
        { participant_id: pAdultB, shares: 1 },
        { participant_id: pChild, shares: 0.5 },
      ],
    });

    expect(expense.id).toBeDefined();
    expect(expense.amount_cents).toBe(250000);
    expect(expense.splits).toHaveLength(3);

    const settlement = await SettlementService.calculateLiveSettlement(serruchoId);

    const bA = settlement.participants.find((p) => p.id === pAdultA);
    const bB = settlement.participants.find((p) => p.id === pAdultB);
    const bChild = settlement.participants.find((p) => p.id === pChild);

    // Adult A paid 2500, owes 1000 -> net +1500
    expect(bA?.net_balance_cents).toBe(150000);
    // Adult B paid 0, owes 1000 -> net -1000
    expect(bB?.net_balance_cents).toBe(-100000);
    // Child paid 0, owes 500 -> net -500
    expect(bChild?.net_balance_cents).toBe(-50000);
  });

  it("throws validation error if shares <= 0", async () => {
    await expect(
      ExpenseService.add(serruchoId, {
        description: "Gasto inválido",
        amount: 1000,
        paid_by_participant_id: pAdultA,
        expense_date: "2026-08-22",
        category: "OTHER",
        split_method: "SHARES",
        splits: [
          { participant_id: pAdultA, shares: 0 },
        ],
      })
    ).rejects.toThrow();
  });
});
