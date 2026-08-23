import { describe, it, expect } from "vitest";
import {
  calculateNetBalances,
  simplifyDebts,
  toCents,
  fromCents,
  splitEqually,
  splitByPercentage,
  splitByExactAmounts,
  splitByShares,
} from "@/lib/finance/math";

describe("Milestone 15: Debt Engine & Financial Simplification (Motor de Balances)", () => {
  it("Scenario 1: 2 participants (A pays for B)", () => {
    const participants = [
      { id: "p-ana", name: "Ana" },
      { id: "p-braulin", name: "Braulin" },
    ];

    const splits = splitEqually(toCents(1000), ["p-ana", "p-braulin"]);
    const expenses = [
      {
        paidByParticipantId: "p-ana",
        amountCents: toCents(1000),
        splits: splits.map((s) => ({ participantId: s.participantId, owedCents: s.owedCents })),
      },
    ];

    const netMap = calculateNetBalances(
      participants.map((p) => p.id),
      expenses
    );

    expect(netMap.get("p-ana")?.netBalanceCents).toBe(toCents(500));
    expect(netMap.get("p-braulin")?.netBalanceCents).toBe(toCents(-500));

    // Zero-sum invariant
    const sum = Array.from(netMap.values()).reduce((acc, s) => acc + s.netBalanceCents, 0);
    expect(sum).toBe(0);

    const transfers = simplifyDebts(participants, netMap);
    expect(transfers).toHaveLength(1);
    expect(transfers[0]).toEqual({
      from_participant_id: "p-braulin",
      from_name: "Braulin",
      to_participant_id: "p-ana",
      to_name: "Ana",
      amount_cents: toCents(500),
    });
  });

  it("Scenario 2: 3 participants matching the prompt's conceptual debt simplification example", () => {
    // Conceptual example from Prompt 15:
    // Carlos owes 10 to Pablo, Carlos owes 10 to Pedro, Pablo owes 10 to Pedro.
    // Result: Carlos pays 20 to Pedro. Pablo pays/receives 0.
    const participants = [
      { id: "p-carlos", name: "Carlos" },
      { id: "p-pablo", name: "Pablo" },
      { id: "p-pedro", name: "Pedro" },
    ];

    // Modeled as expenses:
    // 1. Pablo paid 10 for Carlos
    // 2. Pedro paid 10 for Carlos
    // 3. Pedro paid 10 for Pablo
    const expenses = [
      {
        paidByParticipantId: "p-pablo",
        amountCents: toCents(10),
        splits: [{ participantId: "p-carlos", owedCents: toCents(10) }],
      },
      {
        paidByParticipantId: "p-pedro",
        amountCents: toCents(10),
        splits: [{ participantId: "p-carlos", owedCents: toCents(10) }],
      },
      {
        paidByParticipantId: "p-pedro",
        amountCents: toCents(10),
        splits: [{ participantId: "p-pablo", owedCents: toCents(10) }],
      },
    ];

    const netMap = calculateNetBalances(
      participants.map((p) => p.id),
      expenses
    );

    // Carlos: paid 0, owed 20 -> Net = -20
    expect(netMap.get("p-carlos")?.netBalanceCents).toBe(toCents(-20));
    // Pablo: paid 10, owed 10 -> Net = 0
    expect(netMap.get("p-pablo")?.netBalanceCents).toBe(0);
    // Pedro: paid 20, owed 0 -> Net = +20
    expect(netMap.get("p-pedro")?.netBalanceCents).toBe(toCents(20));

    // Zero-sum invariant
    const sum = Array.from(netMap.values()).reduce((acc, s) => acc + s.netBalanceCents, 0);
    expect(sum).toBe(0);

    const transfers = simplifyDebts(participants, netMap);
    // Exactly 1 simplified transfer!
    expect(transfers).toHaveLength(1);
    expect(transfers[0]).toEqual({
      from_participant_id: "p-carlos",
      from_name: "Carlos",
      to_participant_id: "p-pedro",
      to_name: "Pedro",
      amount_cents: toCents(20),
    });
  });

  it("Scenario 3: One participant pays all expenses for 5 people", () => {
    const participants = [
      { id: "p1", name: "Ana" },
      { id: "p2", name: "Braulin" },
      { id: "p3", name: "Carlos" },
      { id: "p4", name: "David" },
      { id: "p5", name: "Elena" },
    ];

    const totalAmount = toCents(10000); // RD$ 10,000
    const splits = splitEqually(
      totalAmount,
      participants.map((p) => p.id)
    );

    const expenses = [
      {
        paidByParticipantId: "p1",
        amountCents: totalAmount,
        splits: splits.map((s) => ({ participantId: s.participantId, owedCents: s.owedCents })),
      },
    ];

    const netMap = calculateNetBalances(
      participants.map((p) => p.id),
      expenses
    );

    expect(netMap.get("p1")?.netBalanceCents).toBe(toCents(8000));
    expect(netMap.get("p2")?.netBalanceCents).toBe(toCents(-2000));
    expect(netMap.get("p3")?.netBalanceCents).toBe(toCents(-2000));
    expect(netMap.get("p4")?.netBalanceCents).toBe(toCents(-2000));
    expect(netMap.get("p5")?.netBalanceCents).toBe(toCents(-2000));

    const transfers = simplifyDebts(participants, netMap);
    expect(transfers).toHaveLength(4);
    // Every debtor pays directly to Ana
    transfers.forEach((t) => {
      expect(t.to_participant_id).toBe("p1");
      expect(t.amount_cents).toBe(toCents(2000));
    });

    const totalTransferred = transfers.reduce((acc, t) => acc + t.amount_cents, 0);
    expect(totalTransferred).toBe(toCents(8000));
  });

  it("Scenario 4: Circular debt cycle (A -> B -> C -> A) eliminates all transfers", () => {
    const participants = [
      { id: "pA", name: "Ana" },
      { id: "pB", name: "Braulin" },
      { id: "pC", name: "Carlos" },
    ];

    // Ana paid 1,000 for Braulin
    // Braulin paid 1,000 for Carlos
    // Carlos paid 1,000 for Ana
    const expenses = [
      {
        paidByParticipantId: "pA",
        amountCents: toCents(1000),
        splits: [{ participantId: "pB", owedCents: toCents(1000) }],
      },
      {
        paidByParticipantId: "pB",
        amountCents: toCents(1000),
        splits: [{ participantId: "pC", owedCents: toCents(1000) }],
      },
      {
        paidByParticipantId: "pC",
        amountCents: toCents(1000),
        splits: [{ participantId: "pA", owedCents: toCents(1000) }],
      },
    ];

    const netMap = calculateNetBalances(
      participants.map((p) => p.id),
      expenses
    );

    participants.forEach((p) => {
      expect(netMap.get(p.id)?.netBalanceCents).toBe(0);
    });

    const transfers = simplifyDebts(participants, netMap);
    // Cycle is completely resolved: 0 transfers needed!
    expect(transfers).toHaveLength(0);
  });

  it("Scenario 5: 6 participants with complex cross-payments, transfers and income refunds", () => {
    const participants = [
      { id: "p1", name: "Ana" },
      { id: "p2", name: "Braulin" },
      { id: "p3", name: "Carlos" },
      { id: "p4", name: "Diana" },
      { id: "p5", name: "Eduardo" },
      { id: "p6", name: "Fatima" },
    ];

    // 1. Villa: Ana paid 30,000 split by custom shares (Ana: 1, Braulin: 2, Carlos: 1, Diana: 2, Eduardo: 1, Fatima: 1 => 8 shares)
    const villaSplits = splitByShares(toCents(30000), [
      { participantId: "p1", shares: 1 },
      { participantId: "p2", shares: 2 },
      { participantId: "p3", shares: 1 },
      { participantId: "p4", shares: 2 },
      { participantId: "p5", shares: 1 },
      { participantId: "p6", shares: 1 },
    ]);

    // 2. Groceries: Braulin paid 12,000 split equally among all 6
    const grocerySplits = splitEqually(
      toCents(12000),
      participants.map((p) => p.id)
    );

    // 3. Dinner: Diana paid 6,000 split by exact amounts
    const dinnerSplits = splitByExactAmounts(toCents(6000), [
      { participantId: "p1", amountCents: toCents(1000) },
      { participantId: "p2", amountCents: toCents(1500) },
      { participantId: "p3", amountCents: toCents(800) },
      { participantId: "p4", amountCents: toCents(1200) },
      { participantId: "p5", amountCents: toCents(750) },
      { participantId: "p6", amountCents: toCents(750) },
    ]);

    const expenses = [
      {
        paidByParticipantId: "p1",
        amountCents: toCents(30000),
        splits: villaSplits.map((s) => ({ participantId: s.participantId, owedCents: s.owedCents })),
      },
      {
        paidByParticipantId: "p2",
        amountCents: toCents(12000),
        splits: grocerySplits.map((s) => ({ participantId: s.participantId, owedCents: s.owedCents })),
      },
      {
        paidByParticipantId: "p4",
        amountCents: toCents(6000),
        splits: dinnerSplits.map((s) => ({ participantId: s.participantId, owedCents: s.owedCents })),
      },
    ];

    // 4. Direct Transfer: Carlos sent 2,000 to Ana in advance
    const transfersInput = [
      {
        senderParticipantId: "p3",
        receiverParticipantId: "p1",
        amountCents: toCents(2000),
      },
    ];

    // 5. Villa Deposit Refund: Owner refunded 4,000 received in hand by Fatima, credited equally to all 6
    const refundSplits = splitEqually(
      toCents(4000),
      participants.map((p) => p.id)
    );
    const incomesInput = [
      {
        receivedByParticipantId: "p6",
        amountCents: toCents(4000),
        splits: refundSplits.map((s) => ({ participantId: s.participantId, creditCents: s.owedCents })),
      },
    ];

    const netMap = calculateNetBalances(
      participants.map((p) => p.id),
      expenses,
      transfersInput,
      incomesInput
    );

    // Invariant 1: Sum of all net balances must be EXACTLY ZERO
    const sumNet = Array.from(netMap.values()).reduce((acc, s) => acc + s.netBalanceCents, 0);
    expect(sumNet).toBe(0);

    const simplified = simplifyDebts(participants, netMap);

    // Invariant 2: Number of simplified transfers must be <= N - 1 (<= 5)
    expect(simplified.length).toBeLessThanOrEqual(participants.length - 1);

    // Invariant 3: Total money transferred equals total positive balances (conservation of money)
    const totalPositive = Array.from(netMap.values())
      .filter((s) => s.netBalanceCents > 0)
      .reduce((acc, s) => acc + s.netBalanceCents, 0);

    const totalTransferred = simplified.reduce((acc, t) => acc + t.amount_cents, 0);
    expect(totalTransferred).toBe(totalPositive);

    // Invariant 4: Every participant's net incoming minus outgoing transfers matches their net balance
    const reconstructedNets = new Map<string, number>();
    participants.forEach((p) => reconstructedNets.set(p.id, 0));

    simplified.forEach((t) => {
      // Payer loses amount (negative change)
      reconstructedNets.set(
        t.from_participant_id,
        (reconstructedNets.get(t.from_participant_id) || 0) - t.amount_cents
      );
      // Receiver gains amount (positive change)
      reconstructedNets.set(
        t.to_participant_id,
        (reconstructedNets.get(t.to_participant_id) || 0) + t.amount_cents
      );
    });

    participants.forEach((p) => {
      const originalNet = netMap.get(p.id)?.netBalanceCents || 0;
      const reconstructed = reconstructedNets.get(p.id) || 0;
      expect(reconstructed).toBe(originalNet);
    });
  });

  it("Scenario 6: Determinism guarantee across multiple runs", () => {
    const participants = [
      { id: "p1", name: "Ana" },
      { id: "p2", name: "Braulin" },
      { id: "p3", name: "Carlos" },
      { id: "p4", name: "David" },
    ];

    // Two participants with identical debt amounts
    const netBalances = new Map<string, number>([
      ["p1", toCents(1000)],
      ["p2", toCents(1000)],
      ["p3", toCents(-1000)],
      ["p4", toCents(-1000)],
    ]);

    const run1 = simplifyDebts(participants, netBalances);
    const run2 = simplifyDebts(participants, netBalances);

    expect(run1).toEqual(run2);
  });
});
