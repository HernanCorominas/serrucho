import { describe, it, expect, beforeEach } from "vitest";
import { ParticipantService } from "@/features/participants/service";
import { SerruchoService } from "@/features/serruchos/service";
import { ExpenseService } from "@/features/expenses/service";
import { SettlementService } from "@/features/settlements/service";
import { toCents } from "@serrucho/core";

describe("Milestone 12: Default Shares & Group/Family/Couple Configurations", () => {
  let serruchoId: string;
  let pCouple: string;
  let pSingle: string;
  let pChild: string;

  beforeEach(async () => {
    const serrucho = await SerruchoService.create("owner-1", {
      name: "Villa en Jarabacoa 🌲",
      currency: "DOP",
      creator_name: "Familia Pérez",
    });
    serruchoId = serrucho.id;

    // Pareja Gómez = 2 shares
    const couple = await ParticipantService.add(serruchoId, {
      name: "Pareja Gómez",
      preferred_channel: "WHATSAPP",
      default_shares: 2,
    });

    // Soltero Juan = 1 share (default)
    const single = await ParticipantService.add(serruchoId, {
      name: "Soltero Juan",
      preferred_channel: "WHATSAPP",
      default_shares: 1,
    });

    // Niño Lucas = 0.5 share
    const child = await ParticipantService.add(serruchoId, {
      name: "Niño Lucas",
      preferred_channel: "WHATSAPP",
      default_shares: 0.5,
    });

    pCouple = couple.id;
    pSingle = single.id;
    pChild = child.id;
  });

  it("persists default_shares on participant creation", async () => {
    const participants = await ParticipantService.listBySerrucho(serruchoId);
    const couple = participants.find((p) => p.id === pCouple);
    const single = participants.find((p) => p.id === pSingle);
    const child = participants.find((p) => p.id === pChild);

    expect(couple?.default_shares).toBe(2);
    expect(single?.default_shares).toBe(1);
    expect(child?.default_shares).toBe(0.5);
  });

  it("allows updating participant default_shares globally", async () => {
    await ParticipantService.update(pChild, { default_shares: 1 });
    const updated = await ParticipantService.getById(pChild);
    expect(updated?.default_shares).toBe(1);
  });

  it("applies default shares when creating a new SHARES expense", async () => {
    // Total 3.5 shares (Couple 2, Single 1, Child 0.5)
    // Expense RD$ 3,500 paid by Single Juan
    // Couple: (2/3.5) * 3500 = 2000
    // Single: (1/3.5) * 3500 = 1000
    // Child: (0.5/3.5) * 3500 = 500
    const targetParticipants = [
      await ParticipantService.getById(pCouple),
      await ParticipantService.getById(pSingle),
      await ParticipantService.getById(pChild),
    ];

    const expense = await ExpenseService.add(serruchoId, {
      description: "Supermercado Villa",
      amount: 3500,
      paid_by_participant_id: pSingle,
      expense_date: "2026-08-22",
      category: "FOOD_GROCERIES",
      split_method: "SHARES",
      splits: targetParticipants.map((p) => ({
        participant_id: p!.id,
        shares: p!.default_shares || 1,
      })),
    });

    expect(expense.splits).toHaveLength(3);

    const sCouple = expense.splits?.find((s) => s.participant_id === pCouple);
    const sSingle = expense.splits?.find((s) => s.participant_id === pSingle);
    const sChild = expense.splits?.find((s) => s.participant_id === pChild);

    expect(sCouple?.owed_cents).toBe(toCents(2000));
    expect(sSingle?.owed_cents).toBe(toCents(1000));
    expect(sChild?.owed_cents).toBe(toCents(500));
  });

  it("allows per-expense override of shares without modifying participant default_shares", async () => {
    // Override child to 1 share for this specific activity
    const expense = await ExpenseService.add(serruchoId, {
      description: "Excursión Buggies",
      amount: 4000,
      paid_by_participant_id: pSingle,
      expense_date: "2026-08-22",
      category: "ENTERTAINMENT",
      split_method: "SHARES",
      splits: [
        { participant_id: pCouple, shares: 2 },
        { participant_id: pSingle, shares: 1 },
        { participant_id: pChild, shares: 1 }, // overridden from 0.5 to 1
      ],
    });

    // 4 shares total -> 1000 each share -> couple 2000, single 1000, child 1000
    const sChild = expense.splits?.find((s) => s.participant_id === pChild);
    expect(sChild?.owed_cents).toBe(toCents(1000));

    // Global default shares of child must remain untouched (0.5)
    const childGlobal = await ParticipantService.getById(pChild);
    expect(childGlobal?.default_shares).toBe(0.5);
  });

  it("ensures historical expenses remain immutable when default shares are changed later", async () => {
    // 1. Create expense with initial shares (Couple 2, Single 1, Child 0.5)
    const expense = await ExpenseService.add(serruchoId, {
      description: "Cena Inicial",
      amount: 3500,
      paid_by_participant_id: pSingle,
      expense_date: "2026-08-22",
      category: "RESTAURANT",
      split_method: "SHARES",
      splits: [
        { participant_id: pCouple, shares: 2 },
        { participant_id: pSingle, shares: 1 },
        { participant_id: pChild, shares: 0.5 },
      ],
    });

    // 2. Change participant default shares later
    await ParticipantService.update(pCouple, { default_shares: 4 });

    // 3. Past expense split amounts must not change
    const splits = await ExpenseService.listBySerrucho(serruchoId);
    const pastExpense = splits.find((e) => e.id === expense.id);
    const sCouple = pastExpense?.splits.find((s) => s.participant_id === pCouple);

    expect(sCouple?.owed_cents).toBe(toCents(2000)); // still 2000, not recalculating to 4 shares
  });
});
