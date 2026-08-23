import { describe, it, expect, beforeEach } from "vitest";
import { ExpenseService } from "@/features/expenses/service";
import { SerruchoService } from "@/features/serruchos/service";
import { ParticipantService } from "@/features/participants/service";
import { SettlementService } from "@/features/settlements/service";

describe("Milestone 08: Expense Participant Selection & Debt Isolation", () => {
  let serruchoId: string;
  let p1: string;
  let p2: string;
  let p3: string;
  let p4: string;
  let p5: string;

  beforeEach(async () => {
    const serrucho = await SerruchoService.create("owner-1", {
      name: "Villa en Jarabacoa 🍓",
      currency: "DOP",
      creator_name: "Braulio",
    });
    serruchoId = serrucho.id;

    const part1 = await ParticipantService.add(serruchoId, { name: "Braulio", preferred_channel: "WHATSAPP" });
    const part2 = await ParticipantService.add(serruchoId, { name: "Camila", preferred_channel: "WHATSAPP" });
    const part3 = await ParticipantService.add(serruchoId, { name: "Marcos", preferred_channel: "WHATSAPP" });
    const part4 = await ParticipantService.add(serruchoId, { name: "Laura", preferred_channel: "WHATSAPP" });
    const part5 = await ParticipantService.add(serruchoId, { name: "Diego", preferred_channel: "WHATSAPP" });

    p1 = part1.id;
    p2 = part2.id;
    p3 = part3.id;
    p4 = part4.id;
    p5 = part5.id;
  });

  it("splitting an expense for 2 of 5 people does NOT alter the zero balance of the other 3", async () => {
    // Braulio pays a dinner for himself and Camila only (RD$ 2,000)
    await ExpenseService.add(serruchoId, {
      description: "Cena íntima",
      amount: 2000,
      paid_by_participant_id: p1,
      expense_date: "2026-08-22",
      category: "RESTAURANT",
      split_method: "EQUAL",
      splits: [{ participant_id: p1 }, { participant_id: p2 }], // Only Braulio and Camila
    });

    const settlement = await SettlementService.calculateLiveSettlement(serruchoId);

    const b1 = settlement.participants.find((p) => p.id === p1);
    const b2 = settlement.participants.find((p) => p.id === p2);
    const b3 = settlement.participants.find((p) => p.id === p3);
    const b4 = settlement.participants.find((p) => p.id === p4);
    const b5 = settlement.participants.find((p) => p.id === p5);

    // Braulio paid 2000, owes 1000 -> +1000
    expect(b1?.net_balance_cents).toBe(100000);
    // Camila paid 0, owes 1000 -> -1000
    expect(b2?.net_balance_cents).toBe(-100000);

    // Marcos, Laura, Diego must remain completely unaffected (0)
    expect(b3?.net_balance_cents).toBe(0);
    expect(b4?.net_balance_cents).toBe(0);
    expect(b5?.net_balance_cents).toBe(0);
  });

  it("fails validation if zero participants are selected in splits array", async () => {
    await expect(
      ExpenseService.add(serruchoId, {
        description: "Gasto sin gente",
        amount: 500,
        paid_by_participant_id: p1,
        expense_date: "2026-08-22",
        category: "OTHER",
        split_method: "EQUAL",
        splits: [], // Empty
      })
    ).rejects.toThrow();
  });
});
