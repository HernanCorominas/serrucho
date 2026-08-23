import { describe, it, expect, beforeEach } from "vitest";
import { IncomeService } from "@/features/incomes/service";
import { ExpenseService } from "@/features/expenses/service";
import { ParticipantService } from "@/features/participants/service";
import { SerruchoService } from "@/features/serruchos/service";
import { SettlementService } from "@/features/settlements/service";
import { toCents } from "@serrucho/core";

describe("Milestone 14: Incomes, Refunds & Group Deposit Returns (Ingresos y Reembolsos)", () => {
  let serruchoId: string;
  let pAna: string;
  let pBraulin: string;
  let pCarlos: string;

  beforeEach(async () => {
    const serrucho = await SerruchoService.create("owner-1", {
      name: "Villa en Jarabacoa 🏡",
      currency: "DOP",
      creator_name: "Ana",
    });
    serruchoId = serrucho.id;

    const participants = await ParticipantService.listBySerrucho(serruchoId);
    pAna = participants[0].id;

    const b = await ParticipantService.add(serruchoId, {
      name: "Braulin",
      preferred_channel: "WHATSAPP",
    });
    const c = await ParticipantService.add(serruchoId, {
      name: "Carlos",
      preferred_channel: "WHATSAPP",
    });

    pBraulin = b.id;
    pCarlos = c.id;
  });

  it("handles a villa deposit refund returned to the payer and credited equally to all participants", async () => {
    // 1. Ana paid RD$ 12,000 for the villa (which included a 3,000 deposit), split equally among 3
    await ExpenseService.add(serruchoId, {
      description: "Alquiler Villa Jarabacoa",
      amount: 12000,
      paid_by_participant_id: pAna,
      expense_date: "2026-08-22",
      split_method: "EQUAL",
      splits: [
        { participant_id: pAna },
        { participant_id: pBraulin },
        { participant_id: pCarlos },
      ],
    });

    // 2. Owner returns RD$ 3,000 deposit in cash to Ana. Ana logs Income of 3,000 split equally
    const income = await IncomeService.add(serruchoId, {
      description: "Devolución Depósito Villa",
      amount: 3000,
      received_by_participant_id: pAna,
      income_date: "2026-08-22",
      category: "DEPOSIT_RETURN",
      split_method: "EQUAL",
      splits: [
        { participant_id: pAna },
        { participant_id: pBraulin },
        { participant_id: pCarlos },
      ],
    });

    expect(income.id).toBeDefined();
    expect(income.amount_cents).toBe(toCents(3000));

    const settlement = await SettlementService.calculateLiveSettlement(serruchoId);

    const bAna = settlement.participants.find((p) => p.id === pAna);
    const bBraulin = settlement.participants.find((p) => p.id === pBraulin);
    const bCarlos = settlement.participants.find((p) => p.id === pCarlos);

    // Each person's net villa cost is reduced from 4000 to 3000
    // Ana: paid 12,000, has 3,000 in hand from deposit, owes 4,000 gross + 1,000 credit -> Net +6,000
    expect(bAna?.net_balance_cents).toBe(toCents(6000));
    // Braulin: owes 4,000 - 1,000 credit = -3,000
    expect(bBraulin?.net_balance_cents).toBe(toCents(-3000));
    // Carlos: owes 4,000 - 1,000 credit = -3,000
    expect(bCarlos?.net_balance_cents).toBe(toCents(-3000));

    // Zero-sum invariant: 6000 - 3000 - 3000 === 0
    const sumNet = settlement.participants.reduce((acc, p) => acc + p.net_balance_cents, 0);
    expect(sumNet).toBe(0);

    // Totals verification
    expect(settlement.totalExpensesCents).toBe(toCents(12000));
    expect(settlement.totalIncomesCents).toBe(toCents(3000));
    expect(settlement.netExpensesCents).toBe(toCents(9000));
  });

  it("handles a supplier refund received by a third party for specific beneficiaries", async () => {
    // 1. Braulin bought groceries for RD$ 5,000 for Ana and Braulin only
    await ExpenseService.add(serruchoId, {
      description: "Supermercado Comida",
      amount: 5000,
      paid_by_participant_id: pBraulin,
      expense_date: "2026-08-22",
      split_method: "EQUAL",
      splits: [
        { participant_id: pAna },
        { participant_id: pBraulin },
      ],
    });

    // 2. Colmado refunds RD$ 1,000 received in hand by Carlos for bottle returns,
    // but the credit belongs exclusively to Ana (50%) and Braulin (50%)
    await IncomeService.add(serruchoId, {
      description: "Devolución Botellones Colmado",
      amount: 1000,
      received_by_participant_id: pCarlos,
      income_date: "2026-08-22",
      category: "SUPPLIER_REFUND",
      split_method: "PERCENTAGE",
      splits: [
        { participant_id: pAna, percentage: 50 },
        { participant_id: pBraulin, percentage: 50 },
      ],
    });

    const settlement = await SettlementService.calculateLiveSettlement(serruchoId);

    const bCarlos = settlement.participants.find((p) => p.id === pCarlos);
    const bAna = settlement.participants.find((p) => p.id === pAna);
    const bBraulin = settlement.participants.find((p) => p.id === pBraulin);

    // Carlos received 1000 in hand -> owes 1000
    expect(bCarlos?.net_balance_cents).toBe(toCents(-1000));
    // Ana owed 2500, received 500 credit -> owes 2000
    expect(bAna?.net_balance_cents).toBe(toCents(-2000));
    // Braulin paid 5000, owed 2500, received 500 credit -> is owed 3000
    expect(bBraulin?.net_balance_cents).toBe(toCents(3000));

    // Zero-sum invariant: -1000 - 2000 + 3000 === 0
    const sumNet = settlement.participants.reduce((acc, p) => acc + p.net_balance_cents, 0);
    expect(sumNet).toBe(0);
  });

  it("handles external sponsorship / contribution with custom shares", async () => {
    // External sponsor gives RD$ 6,000 received by Ana
    // Beneficiaries: Ana (1 share), Braulin (2 shares), Carlos (3 shares) => Total 6 shares => 1000, 2000, 3000
    await IncomeService.add(serruchoId, {
      description: "Patrocinio Bebidas Tío Juan",
      amount: 6000,
      received_by_participant_id: pAna,
      income_date: "2026-08-22",
      category: "EXTERNAL_SPONSORSHIP",
      split_method: "SHARES",
      splits: [
        { participant_id: pAna, shares: 1 },
        { participant_id: pBraulin, shares: 2 },
        { participant_id: pCarlos, shares: 3 },
      ],
    });

    const settlement = await SettlementService.calculateLiveSettlement(serruchoId);
    const bAna = settlement.participants.find((p) => p.id === pAna);
    const bBraulin = settlement.participants.find((p) => p.id === pBraulin);
    const bCarlos = settlement.participants.find((p) => p.id === pCarlos);

    // Ana received 6000 in hand, got 1000 credit -> net balance -5000
    expect(bAna?.net_balance_cents).toBe(toCents(-5000));
    // Braulin got 2000 credit -> net balance +2000
    expect(bBraulin?.net_balance_cents).toBe(toCents(2000));
    // Carlos got 3000 credit -> net balance +3000
    expect(bCarlos?.net_balance_cents).toBe(toCents(3000));

    const sumNet = settlement.participants.reduce((acc, p) => acc + p.net_balance_cents, 0);
    expect(sumNet).toBe(0);
  });

  it("validates percentage sums must equal 100%", async () => {
    await expect(
      IncomeService.add(serruchoId, {
        description: "Reembolso Inválido",
        amount: 1000,
        received_by_participant_id: pAna,
        income_date: "2026-08-22",
        split_method: "PERCENTAGE",
        splits: [
          { participant_id: pAna, percentage: 40 },
          { participant_id: pBraulin, percentage: 40 }, // 80% instead of 100%
        ],
      })
    ).rejects.toThrow();
  });
});
