import { describe, it, expect, beforeEach } from "vitest";
import { ExpenseService } from "@/features/expenses/service";
import { ParticipantService } from "@/features/participants/service";
import { SerruchoService } from "@/features/serruchos/service";
import { SettlementService } from "@/features/settlements/service";
import { TransferService } from "@/features/transfers/service";
import { IncomeService } from "@/features/incomes/service";
import { toCents } from "@serrucho/core";

describe("Milestone 17: Edit & Delete Transactions (Expenses, Transfers, Incomes)", () => {
  let serruchoId: string;
  let pAna: string;
  let pBraulin: string;
  let pCarlos: string;

  beforeEach(async () => {
    const serrucho = await SerruchoService.create("owner-1", {
      name: "Villa en Jarabacoa 🌲",
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

  it("handles full expense editing lifecycle and resets balances on deletion", async () => {
    // 1. Create initial expense: Ana paid 3,000 equal across Ana, Braulin, Carlos (1,000 each)
    const exp = await ExpenseService.add(serruchoId, {
      description: "Supermercado inicial",
      amount: 3000,
      paid_by_participant_id: pAna,
      expense_date: "2026-08-22",
      split_method: "EQUAL",
      splits: [
        { participant_id: pAna },
        { participant_id: pBraulin },
        { participant_id: pCarlos },
      ],
    });

    let settlement = await SettlementService.calculateLiveSettlement(serruchoId);
    let bAna = settlement.participants.find((p) => p.id === pAna);
    let bBraulin = settlement.participants.find((p) => p.id === pBraulin);
    let bCarlos = settlement.participants.find((p) => p.id === pCarlos);

    expect(bAna?.net_balance_cents).toBe(toCents(2000));
    expect(bBraulin?.net_balance_cents).toBe(toCents(-1000));
    expect(bCarlos?.net_balance_cents).toBe(toCents(-1000));

    // 2. Edit amount to 6,000 (splits become 2,000 each)
    await ExpenseService.update(exp.id, {
      amount: 6000,
      splits: [
        { participant_id: pAna },
        { participant_id: pBraulin },
        { participant_id: pCarlos },
      ],
    });

    settlement = await SettlementService.calculateLiveSettlement(serruchoId);
    bAna = settlement.participants.find((p) => p.id === pAna);
    bBraulin = settlement.participants.find((p) => p.id === pBraulin);
    bCarlos = settlement.participants.find((p) => p.id === pCarlos);

    expect(bAna?.net_balance_cents).toBe(toCents(4000));
    expect(bBraulin?.net_balance_cents).toBe(toCents(-2000));
    expect(bCarlos?.net_balance_cents).toBe(toCents(-2000));

    // 3. Edit participants to only Ana and Braulin (3,000 each; Carlos excluded)
    await ExpenseService.update(exp.id, {
      splits: [{ participant_id: pAna }, { participant_id: pBraulin }],
    });

    settlement = await SettlementService.calculateLiveSettlement(serruchoId);
    bAna = settlement.participants.find((p) => p.id === pAna);
    bBraulin = settlement.participants.find((p) => p.id === pBraulin);
    bCarlos = settlement.participants.find((p) => p.id === pCarlos);

    expect(bAna?.net_balance_cents).toBe(toCents(3000));
    expect(bBraulin?.net_balance_cents).toBe(toCents(-3000));
    expect(bCarlos?.net_balance_cents).toBe(0);

    // 4. Edit payer from Ana to Braulin
    await ExpenseService.update(exp.id, {
      paid_by_participant_id: pBraulin,
    });

    settlement = await SettlementService.calculateLiveSettlement(serruchoId);
    bAna = settlement.participants.find((p) => p.id === pAna);
    bBraulin = settlement.participants.find((p) => p.id === pBraulin);

    expect(bBraulin?.net_balance_cents).toBe(toCents(3000));
    expect(bAna?.net_balance_cents).toBe(toCents(-3000));

    // 5. Delete expense -> Everything returns to 0
    const deleted = await ExpenseService.delete(exp.id);
    expect(deleted).toBe(true);

    settlement = await SettlementService.calculateLiveSettlement(serruchoId);
    settlement.participants.forEach((p) => {
      expect(p.net_balance_cents).toBe(0);
      expect(p.total_paid_cents).toBe(0);
      expect(p.total_owed_cents).toBe(0);
    });
  });

  it("handles transfer editing and deletion with automatic balance updates", async () => {
    // Braulin transfers 1,500 to Ana
    const transfer = await TransferService.add(serruchoId, {
      sender_participant_id: pBraulin,
      receiver_participant_id: pAna,
      amount: 1500,
      transfer_date: "2026-08-22",
      payment_method: "TRANSFER_BHD",
      notes: "Abono inicial",
    });

    let settlement = await SettlementService.calculateLiveSettlement(serruchoId);
    let bAna = settlement.participants.find((p) => p.id === pAna);
    let bBraulin = settlement.participants.find((p) => p.id === pBraulin);

    expect(bBraulin?.net_balance_cents).toBe(toCents(1500));
    expect(bAna?.net_balance_cents).toBe(toCents(-1500));

    // Edit transfer: change amount to 2,000 and change receiver to Carlos
    await TransferService.update(transfer.id, {
      amount: 2000,
      receiver_participant_id: pCarlos,
      notes: "Abono corregido para Carlos",
    });

    settlement = await SettlementService.calculateLiveSettlement(serruchoId);
    bAna = settlement.participants.find((p) => p.id === pAna);
    bBraulin = settlement.participants.find((p) => p.id === pBraulin);
    let bCarlos = settlement.participants.find((p) => p.id === pCarlos);

    expect(bAna?.net_balance_cents).toBe(0);
    expect(bBraulin?.net_balance_cents).toBe(toCents(2000));
    expect(bCarlos?.net_balance_cents).toBe(toCents(-2000));

    // Delete transfer -> all back to 0
    await TransferService.delete(transfer.id);
    settlement = await SettlementService.calculateLiveSettlement(serruchoId);
    settlement.participants.forEach((p) => expect(p.net_balance_cents).toBe(0));
  });

  it("handles income/refund editing and deletion with automatic balance updates", async () => {
    // Ana receives 1,200 supplier refund, credited to Ana, Braulin, Carlos (400 each)
    const income = await IncomeService.add(serruchoId, {
      description: "Devolución depósito villa",
      amount: 1200,
      received_by_participant_id: pAna,
      category: "DEPOSIT_RETURN",
      income_date: "2026-08-22",
      split_method: "EQUAL",
      splits: [
        { participant_id: pAna },
        { participant_id: pBraulin },
        { participant_id: pCarlos },
      ],
    });

    let settlement = await SettlementService.calculateLiveSettlement(serruchoId);
    let bAna = settlement.participants.find((p) => p.id === pAna);
    let bBraulin = settlement.participants.find((p) => p.id === pBraulin);
    let bCarlos = settlement.participants.find((p) => p.id === pCarlos);

    // Ana has 1200 cash in hand, minus 400 her credit = owes 800 net
    expect(bAna?.net_balance_cents).toBe(toCents(-800));
    expect(bBraulin?.net_balance_cents).toBe(toCents(400));
    expect(bCarlos?.net_balance_cents).toBe(toCents(400));

    // Edit income: amount 1,500 credited equally to Ana and Braulin only (750 each)
    await IncomeService.update(income.id, {
      amount: 1500,
      splits: [{ participant_id: pAna }, { participant_id: pBraulin }],
    });

    settlement = await SettlementService.calculateLiveSettlement(serruchoId);
    bAna = settlement.participants.find((p) => p.id === pAna);
    bBraulin = settlement.participants.find((p) => p.id === pBraulin);
    bCarlos = settlement.participants.find((p) => p.id === pCarlos);

    // Ana holds 1500, gets 750 credit = -750 net. Braulin gets +750. Carlos = 0
    expect(bAna?.net_balance_cents).toBe(toCents(-750));
    expect(bBraulin?.net_balance_cents).toBe(toCents(750));
    expect(bCarlos?.net_balance_cents).toBe(0);

    // Delete income -> back to 0
    await IncomeService.delete(income.id);
    settlement = await SettlementService.calculateLiveSettlement(serruchoId);
    settlement.participants.forEach((p) => expect(p.net_balance_cents).toBe(0));
  });

  it("protects closed serruchos from editing or deleting transactions", async () => {
    const exp = await ExpenseService.add(serruchoId, {
      description: "Carbón y hielo",
      amount: 500,
      paid_by_participant_id: pAna,
      expense_date: "2026-08-22",
      split_method: "EQUAL",
      splits: [{ participant_id: pAna }, { participant_id: pBraulin }],
    });

    const transfer = await TransferService.add(serruchoId, {
      sender_participant_id: pBraulin,
      receiver_participant_id: pAna,
      amount: 250,
      transfer_date: "2026-08-22",
    });

    // Close serrucho
    await SettlementService.closeSerrucho(serruchoId, {
      payment_instructions: "Popular 123",
      payment_deadline: "2026-08-30",
      confirm: true,
    });

    // Attempts to modify or delete must fail
    await expect(ExpenseService.update(exp.id, { amount: 600 })).rejects.toThrow(
      "No se pueden modificar gastos en un serrucho cerrado"
    );
    await expect(ExpenseService.delete(exp.id)).rejects.toThrow(
      "No se pueden eliminar gastos de un serrucho cerrado"
    );

    await expect(TransferService.update(transfer.id, { amount: 300 })).rejects.toThrow(
      "No se pueden modificar transferencias en un serrucho cerrado"
    );
    await expect(TransferService.delete(transfer.id)).rejects.toThrow(
      "No se pueden eliminar transferencias en un serrucho cerrado"
    );
  });
});
