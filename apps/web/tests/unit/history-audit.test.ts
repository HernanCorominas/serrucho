import { describe, it, expect, beforeEach } from "vitest";
import { ActivityService } from "@/features/activity/service";
import { ExpenseService } from "@/features/expenses/service";
import { TransferService } from "@/features/transfers/service";
import { IncomeService } from "@/features/incomes/service";
import { ParticipantService } from "@/features/participants/service";
import { SerruchoService } from "@/features/serruchos/service";
import { SettlementService } from "@/features/settlements/service";
import { toCents } from "@serrucho/core";

describe("Milestone 19: Activity History & Audit Trail", () => {
  let serruchoId: string;
  let pAna: string;
  let pBraulin: string;
  let pCarlos: string;

  beforeEach(async () => {
    const serrucho = await SerruchoService.create("owner-1", {
      name: "Villa en Las Terrenas 🏖️",
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

  it("records full expense activity trail (creation, edition, deletion)", async () => {
    // 1. Add expense
    const exp = await ExpenseService.add(serruchoId, {
      description: "Cena en El Pescador",
      amount: 4200,
      paid_by_participant_id: pBraulin,
      expense_date: "2026-08-22",
      split_method: "EQUAL",
      splits: [
        { participant_id: pAna },
        { participant_id: pBraulin },
        { participant_id: pCarlos },
      ],
    });

    let activities = await ActivityService.listBySerrucho(serruchoId);
    const createdEvent = activities.find((a) => a.action_type === "EXPENSE_CREATED");

    expect(createdEvent).toBeDefined();
    expect(createdEvent?.actor_name).toBe("Braulin");
    expect(createdEvent?.summary).toContain("Braulin agregó \"Cena en El Pescador\"");
    expect(createdEvent?.metadata?.amount_cents).toBe(toCents(4200));

    // 2. Edit expense
    await ExpenseService.update(exp.id, {
      amount: 5000,
      description: "Cena en El Pescador (con propina)",
    });

    activities = await ActivityService.listBySerrucho(serruchoId);
    const updatedEvent = activities.find((a) => a.action_type === "EXPENSE_UPDATED");

    expect(updatedEvent).toBeDefined();
    expect(updatedEvent?.actor_name).toBe("Braulin");
    expect(updatedEvent?.summary).toContain("Braulin editó el gasto");
    expect(updatedEvent?.metadata?.old_amount_cents).toBe(toCents(4200));
    expect(updatedEvent?.metadata?.new_amount_cents).toBe(toCents(5000));

    // 3. Delete expense
    await ExpenseService.delete(exp.id);

    activities = await ActivityService.listBySerrucho(serruchoId);
    const deletedEvent = activities.find((a) => a.action_type === "EXPENSE_DELETED");

    expect(deletedEvent).toBeDefined();
    expect(deletedEvent?.summary).toContain("Se eliminó el gasto \"Cena en El Pescador (con propina)\"");
  });

  it("records transfers and refunds in audit trail", async () => {
    // 1. Transfer
    const transfer = await TransferService.add(serruchoId, {
      sender_participant_id: pBraulin,
      receiver_participant_id: pAna,
      amount: 1500,
      transfer_date: "2026-08-22",
      notes: "Abono cena",
    });

    let activities = await ActivityService.listBySerrucho(serruchoId);
    const transferCreated = activities.find((a) => a.action_type === "TRANSFER_CREATED");

    expect(transferCreated).toBeDefined();
    expect(transferCreated?.actor_name).toBe("Braulin");
    expect(transferCreated?.summary).toContain("Braulin transfirió");
    expect(transferCreated?.summary).toContain("a Ana");

    // 2. Income / Refund
    const income = await IncomeService.add(serruchoId, {
      description: "Devolución depósito kayak",
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

    activities = await ActivityService.listBySerrucho(serruchoId);
    const incomeCreated = activities.find((a) => a.action_type === "INCOME_CREATED");

    expect(incomeCreated).toBeDefined();
    expect(incomeCreated?.actor_name).toBe("Ana");
    expect(incomeCreated?.summary).toContain("Ana registró reembolso \"Devolución depósito kayak\"");
  });

  it("records participants and serrucho closure events", async () => {
    // Participant add event was recorded in beforeEach for Braulin and Carlos
    const activities = await ActivityService.listBySerrucho(serruchoId);
    const partEvents = activities.filter((a) => a.action_type === "PARTICIPANT_ADDED");

    expect(partEvents.length).toBeGreaterThanOrEqual(2);

    // Close Serrucho
    await SettlementService.closeSerrucho(serruchoId, {
      payment_instructions: "Transferir a Banreservas 123456",
      payment_deadline: "2026-08-30",
      confirm: true,
    });

    const finalActivities = await ActivityService.listBySerrucho(serruchoId);
    const closeEvent = finalActivities.find((a) => a.action_type === "SERRUCHO_CLOSED");

    expect(closeEvent).toBeDefined();
    expect(closeEvent?.summary).toContain("Se cerró el serrucho y se congelaron los saldos");
  });

  it("ensures activity log never mutates balance totals", async () => {
    const initialSettlement = await SettlementService.calculateLiveSettlement(serruchoId);
    const initialNetSums = initialSettlement.participants.reduce(
      (sum, p) => sum + p.net_balance_cents,
      0
    );

    // Record manual activity
    await ActivityService.record({
      serrucho_id: serruchoId,
      actor_name: "Ana",
      action_type: "SERRUCHO_UPDATED",
      entity_type: "SERRUCHO",
      summary: "Ana cambió el nombre del serrucho",
    });

    const postSettlement = await SettlementService.calculateLiveSettlement(serruchoId);
    const postNetSums = postSettlement.participants.reduce(
      (sum, p) => sum + p.net_balance_cents,
      0
    );

    expect(initialNetSums).toBe(0);
    expect(postNetSums).toBe(0);
  });
});
