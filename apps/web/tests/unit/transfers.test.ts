import { describe, it, expect, beforeEach } from "vitest";
import { TransferService } from "@/features/transfers/service";
import { ExpenseService } from "@/features/expenses/service";
import { ParticipantService } from "@/features/participants/service";
import { SerruchoService } from "@/features/serruchos/service";
import { SettlementService } from "@/features/settlements/service";
import { toCents } from "@serrucho/core";

describe("Milestone 13: Direct Transfers, Loans & Repayments (Transferencias y Préstamos)", () => {
  let serruchoId: string;
  let pAna: string;
  let pBraulin: string;
  let pCarlos: string;

  beforeEach(async () => {
    const serrucho = await SerruchoService.create("owner-1", {
      name: "Viaje a Samaná 🏖️",
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

  it("registers a direct loan without group expenses and preserves zero-sum invariant", async () => {
    // Ana lends RD$ 2,000 to Braulin
    const transfer = await TransferService.add(serruchoId, {
      sender_participant_id: pAna,
      receiver_participant_id: pBraulin,
      amount: 2000,
      transfer_date: "2026-08-22",
      payment_method: "TRANSFER_POPULAR",
      notes: "Préstamo para combustible",
    });

    expect(transfer.id).toBeDefined();
    expect(transfer.amount_cents).toBe(toCents(2000));

    const settlement = await SettlementService.calculateLiveSettlement(serruchoId);

    const bAna = settlement.participants.find((p) => p.id === pAna);
    const bBraulin = settlement.participants.find((p) => p.id === pBraulin);
    const bCarlos = settlement.participants.find((p) => p.id === pCarlos);

    // Ana gave 2000 -> net balance +2000 (is owed 2000)
    expect(bAna?.net_balance_cents).toBe(toCents(2000));
    // Braulin received 2000 -> net balance -2000 (owes 2000)
    expect(bBraulin?.net_balance_cents).toBe(toCents(-2000));
    // Carlos had zero activity -> balance 0
    expect(bCarlos?.net_balance_cents).toBe(0);

    // Invariant: sum of all net balances must be exactly 0
    const sumNet = settlement.participants.reduce((acc, p) => acc + p.net_balance_cents, 0);
    expect(sumNet).toBe(0);
  });

  it("handles partial repayment between participants", async () => {
    // 1. Ana lends RD$ 2,000 to Braulin
    await TransferService.add(serruchoId, {
      sender_participant_id: pAna,
      receiver_participant_id: pBraulin,
      amount: 2000,
      transfer_date: "2026-08-22",
      payment_method: "CASH",
    });

    // 2. Braulin does partial repayment of RD$ 500
    await TransferService.add(serruchoId, {
      sender_participant_id: pBraulin,
      receiver_participant_id: pAna,
      amount: 500,
      transfer_date: "2026-08-22",
      payment_method: "TRANSFER_BHD",
      notes: "Abono parcial",
    });

    const settlement = await SettlementService.calculateLiveSettlement(serruchoId);
    const bAna = settlement.participants.find((p) => p.id === pAna);
    const bBraulin = settlement.participants.find((p) => p.id === pBraulin);

    // Ana: lent 2000, received 500 -> remaining net +1500
    expect(bAna?.net_balance_cents).toBe(toCents(1500));
    // Braulin: borrowed 2000, paid 500 -> remaining net -1500
    expect(bBraulin?.net_balance_cents).toBe(toCents(-1500));
  });

  it("handles full repayment resulting in zero balance", async () => {
    // 1. Ana lends RD$ 2,000 to Braulin
    await TransferService.add(serruchoId, {
      sender_participant_id: pAna,
      receiver_participant_id: pBraulin,
      amount: 2000,
      transfer_date: "2026-08-22",
    });

    // 2. Braulin repays the full RD$ 2,000
    await TransferService.add(serruchoId, {
      sender_participant_id: pBraulin,
      receiver_participant_id: pAna,
      amount: 2000,
      transfer_date: "2026-08-22",
      payment_method: "TRANSFER_BANRESERVAS",
    });

    const settlement = await SettlementService.calculateLiveSettlement(serruchoId);
    const bAna = settlement.participants.find((p) => p.id === pAna);
    const bBraulin = settlement.participants.find((p) => p.id === pBraulin);

    expect(bAna?.net_balance_cents).toBe(0);
    expect(bBraulin?.net_balance_cents).toBe(0);
  });

  it("correctly integrates transfers with group expenses in debt settlement engine", async () => {
    // Carlos pays RD$ 3,000 for dinner split equally between Carlos, Ana and Braulin (1000 each)
    await ExpenseService.add(serruchoId, {
      description: "Cena de Pescado",
      amount: 3000,
      paid_by_participant_id: pCarlos,
      expense_date: "2026-08-22",
      split_method: "EQUAL",
      splits: [
        { participant_id: pCarlos },
        { participant_id: pAna },
        { participant_id: pBraulin },
      ],
    });

    // Before transfer:
    // Carlos: +2000, Ana: -1000, Braulin: -1000
    // Braulin transfers RD$ 1,000 to Carlos to settle his debt directly
    await TransferService.add(serruchoId, {
      sender_participant_id: pBraulin,
      receiver_participant_id: pCarlos,
      amount: 1000,
      transfer_date: "2026-08-22",
      payment_method: "TRANSFER_POPULAR",
    });

    const settlement = await SettlementService.calculateLiveSettlement(serruchoId);
    const bCarlos = settlement.participants.find((p) => p.id === pCarlos);
    const bAna = settlement.participants.find((p) => p.id === pAna);
    const bBraulin = settlement.participants.find((p) => p.id === pBraulin);

    // Braulin paid 1000 owed 1000 -> net balance 0 (Settled!)
    expect(bBraulin?.net_balance_cents).toBe(0);
    // Carlos paid 3000 + received 1000 -> remaining net +1000 (Ana still owes him 1000)
    expect(bCarlos?.net_balance_cents).toBe(toCents(1000));
    // Ana paid 0 owed 1000 -> net balance -1000
    expect(bAna?.net_balance_cents).toBe(toCents(-1000));
  });

  it("validates that sender and receiver cannot be the same person", async () => {
    await expect(
      TransferService.add(serruchoId, {
        sender_participant_id: pAna,
        receiver_participant_id: pAna,
        amount: 500,
        transfer_date: "2026-08-22",
      })
    ).rejects.toThrow();
  });
});
