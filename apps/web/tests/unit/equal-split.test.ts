import { describe, it, expect } from "vitest";
import { splitEqually, calculateParticipantBalances, toCents } from "@serrucho/core";
import { Participant, ExpenseWithSplits } from "@/lib/types/domain";

describe("Milestone 09: Equal Split & Deterministic Penny Reconciliation", () => {
  it("splits RD$ 1,000 across 4 participants into exactly RD$ 250 each", () => {
    const participants = ["p1", "p2", "p3", "p4"];
    const splits = splitEqually(toCents(1000), participants);

    expect(splits).toHaveLength(4);
    splits.forEach((s) => {
      expect(s.owedCents).toBe(toCents(250));
    });

    const sum = splits.reduce((acc, s) => acc + s.owedCents, 0);
    expect(sum).toBe(toCents(1000));
  });

  it("splits uneven amount (RD$ 100.00 among 3 participants) with ZERO lost cents", () => {
    const participants = ["a", "b", "c"];
    const splits = splitEqually(10000, participants);

    // 10000 / 3 = 3333 with remainder 1 cent -> first gets 3334, rest get 3333
    expect(splits[0].owedCents).toBe(3334);
    expect(splits[1].owedCents).toBe(3333);
    expect(splits[2].owedCents).toBe(3333);

    const sum = splits.reduce((acc, s) => acc + s.owedCents, 0);
    expect(sum).toBe(10000);
  });

  it("splits RD$ 1,000.01 among 3 participants", () => {
    const participants = ["x", "y", "z"];
    const totalCents = 100001; // 1000.01
    const splits = splitEqually(totalCents, participants);

    // 100001 / 3 = 33333 remainder 2 -> first two get 33334, last gets 33333
    expect(splits[0].owedCents).toBe(33334);
    expect(splits[1].owedCents).toBe(33334);
    expect(splits[2].owedCents).toBe(33333);

    const sum = splits.reduce((acc, s) => acc + s.owedCents, 0);
    expect(sum).toBe(totalCents);
  });

  it("splits RD$ 0.05 among 2 participants", () => {
    const participants = ["p1", "p2"];
    const splits = splitEqually(5, participants);

    expect(splits[0].owedCents).toBe(3);
    expect(splits[1].owedCents).toBe(2);

    const sum = splits.reduce((acc, s) => acc + s.owedCents, 0);
    expect(sum).toBe(5);
  });

  it("splits RD$ 10.00 among 6 participants", () => {
    const participants = ["1", "2", "3", "4", "5", "6"];
    const totalCents = 1000;
    const splits = splitEqually(totalCents, participants);

    // 1000 / 6 = 166 remainder 4 -> first 4 get 167, last 2 get 166
    expect(splits[0].owedCents).toBe(167);
    expect(splits[1].owedCents).toBe(167);
    expect(splits[2].owedCents).toBe(167);
    expect(splits[3].owedCents).toBe(167);
    expect(splits[4].owedCents).toBe(166);
    expect(splits[5].owedCents).toBe(166);

    const sum = splits.reduce((acc, s) => acc + s.owedCents, 0);
    expect(sum).toBe(1000);
  });

  it("guarantees sum of all net balances in a group is always exactly 0 (Zero-Sum Invariant)", () => {
    const participantIds = ["p1", "p2", "p3", "p4"];
    const participants: Participant[] = participantIds.map((id) => ({
      id,
      serrucho_id: "s1",
      name: `User ${id}`,
      email: null,
      phone: null,
      preferred_channel: "WHATSAPP" as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const split1 = splitEqually(300000, ["p1", "p2", "p3"]);
    const split2 = splitEqually(100000, ["p2", "p4"]);
    const split3 = splitEqually(75000, ["p1", "p2", "p3", "p4"]);

    const expenses: ExpenseWithSplits[] = [
      {
        id: "e1",
        serrucho_id: "s1",
        paid_by_participant_id: "p1",
        paid_by_name: "User p1",
        description: "Gasto 1",
        amount_cents: 300000,
        split_method: "EQUAL",
        category: "FOOD_GROCERIES",
        expense_date: "2026-08-22",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        splits: split1.map((s) => ({
          expense_id: "e1",
          participant_id: s.participantId,
          participant_name: s.participantId,
          owed_cents: s.owedCents,
          percentage_basis_points: 0,
        })),
      },
      {
        id: "e2",
        serrucho_id: "s1",
        paid_by_participant_id: "p2",
        paid_by_name: "User p2",
        description: "Gasto 2",
        amount_cents: 100000,
        split_method: "EQUAL",
        category: "FUEL_TRANSPORT",
        expense_date: "2026-08-22",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        splits: split2.map((s) => ({
          expense_id: "e2",
          participant_id: s.participantId,
          participant_name: s.participantId,
          owed_cents: s.owedCents,
          percentage_basis_points: 0,
        })),
      },
      {
        id: "e3",
        serrucho_id: "s1",
        paid_by_participant_id: "p3",
        paid_by_name: "User p3",
        description: "Gasto 3",
        amount_cents: 75000,
        split_method: "EQUAL",
        category: "OTHER",
        expense_date: "2026-08-22",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        splits: split3.map((s) => ({
          expense_id: "e3",
          participant_id: s.participantId,
          participant_name: s.participantId,
          owed_cents: s.owedCents,
          percentage_basis_points: 0,
        })),
      },
    ];

    const financials = calculateParticipantBalances(participants, expenses);
    const sumNetBalances = financials.reduce((acc, f) => acc + f.net_balance_cents, 0);

    expect(sumNetBalances).toBe(0);
  });
});
