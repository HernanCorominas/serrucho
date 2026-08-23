import { describe, it, expect, beforeEach } from "vitest";
import { ExpenseService } from "@/features/expenses/service";
import { ParticipantService } from "@/features/participants/service";
import { SerruchoService } from "@/features/serruchos/service";
import { SettlementService } from "@/features/settlements/service";
import { TransferService } from "@/features/transfers/service";
import { getRepository } from "@/lib/store";
import { toCents } from "@serrucho/core";

describe("Milestone 16: Mark Debt as Settled (Marcar como Saldado)", () => {
  let serruchoId: string;
  let pAna: string;
  let pBraulin: string;
  let pCarlos: string;

  beforeEach(async () => {
    const serrucho = await SerruchoService.create("owner-1", {
      name: "Viaje a Las Terrenas 🏖️",
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

    // Ana paid 6,000 for all 3 (2,000 each)
    await ExpenseService.add(serruchoId, {
      description: "Apartamento en la playa",
      amount: 6000,
      paid_by_participant_id: pAna,
      expense_date: "2026-08-22",
      split_method: "EQUAL",
      splits: [
        { participant_id: pAna },
        { participant_id: pBraulin },
        { participant_id: pCarlos },
      ],
    });
  });

  it("settles a pending debt in full without deleting the original expense", async () => {
    // 1. Check initial live balances
    let settlement = await SettlementService.calculateLiveSettlement(serruchoId);
    let bBraulin = settlement.participants.find((p) => p.id === pBraulin);
    let bAna = settlement.participants.find((p) => p.id === pAna);

    expect(bBraulin?.net_balance_cents).toBe(toCents(-2000));
    expect(bAna?.net_balance_cents).toBe(toCents(4000));

    // 2. Braulin marks debt as settled by paying RD$ 2,000 to Ana via Banco Popular
    const payment = await TransferService.add(serruchoId, {
      sender_participant_id: pBraulin,
      receiver_participant_id: pAna,
      amount: 2000,
      transfer_date: "2026-08-22",
      payment_method: "TRANSFER_POPULAR",
      notes: "[Deuda Saldada] Transferencia Banco Popular #481029",
    });

    expect(payment.id).toBeDefined();
    expect(payment.payment_method).toBe("TRANSFER_POPULAR");

    // 3. Recalculate settlement
    settlement = await SettlementService.calculateLiveSettlement(serruchoId);
    bBraulin = settlement.participants.find((p) => p.id === pBraulin);
    bAna = settlement.participants.find((p) => p.id === pAna);

    // Braulin's debt is now 0 (completely settled)
    expect(bBraulin?.net_balance_cents).toBe(0);
    // Ana's pending credit is reduced from 4,000 to 2,000 (only Carlos owes now)
    expect(bAna?.net_balance_cents).toBe(toCents(2000));

    // 4. CRITICAL AUDIT: Original expense must be 100% intact!
    const expenses = await ExpenseService.listBySerrucho(serruchoId);
    expect(expenses).toHaveLength(1);
    expect(expenses[0].amount_cents).toBe(toCents(6000));
    expect(expenses[0].description).toBe("Apartamento en la playa");
  });

  it("handles partial debt settlement (pago parcial)", async () => {
    // Carlos owes 2,000 to Ana, but pays only 1,200 via Efectivo (partial payment)
    await TransferService.add(serruchoId, {
      sender_participant_id: pCarlos,
      receiver_participant_id: pAna,
      amount: 1200,
      transfer_date: "2026-08-22",
      payment_method: "CASH",
      notes: "[Pago Parcial] 1,200 pesos entregados en efectivo",
    });

    const settlement = await SettlementService.calculateLiveSettlement(serruchoId);
    const bCarlos = settlement.participants.find((p) => p.id === pCarlos);

    // Carlos remaining debt is 2,000 - 1,200 = 800
    expect(bCarlos?.net_balance_cents).toBe(toCents(-800));
  });

  it("updates settlement snapshot payment status with Dominican payment method and notes", async () => {
    // 1. Close serrucho to generate immutable snapshots
    const closeResult = await SettlementService.closeSerrucho(serruchoId, {
      payment_instructions: "Transferir al Banco BHD cuenta 12345678",
      payment_deadline: "2026-08-30",
      confirm: true,
    });

    const snapBraulin = closeResult.snapshots.find(
      (s) => s.participant_id === pBraulin
    );
    expect(snapBraulin).toBeDefined();
    expect(snapBraulin?.is_paid).toBe(false);

    // 2. Mark snapshot as paid with payment details
    const repo = getRepository();
    const updatedSnap = await repo.markSnapshotPaid(snapBraulin!.id, true, {
      payment_method: "TRANSFER_BHD",
      payment_notes: "Comprobante BHD #839201",
      payment_status: "SETTLED",
      paid_amount_cents: toCents(2000),
    });

    expect(updatedSnap.is_paid).toBe(true);
    expect(updatedSnap.paid_at).toBeTruthy();
    expect(updatedSnap.payment_method).toBe("TRANSFER_BHD");
    expect(updatedSnap.payment_notes).toBe("Comprobante BHD #839201");
    expect(updatedSnap.payment_status).toBe("SETTLED");
    expect(updatedSnap.paid_amount_cents).toBe(toCents(2000));
  });
});
