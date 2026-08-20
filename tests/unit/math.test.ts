import { describe, it, expect } from "vitest";
import {
  toCents,
  fromCents,
  formatDOP,
  splitEqually,
  splitByPercentage,
  calculateNetBalances,
} from "@/lib/finance/math";

describe("Financial Math Module", () => {
  describe("toCents and fromCents", () => {
    it("converts numbers and strings to integer cents accurately", () => {
      expect(toCents(100)).toBe(10000);
      expect(toCents(100.5)).toBe(10050);
      expect(toCents(100.55)).toBe(10055);
      expect(toCents("100.55")).toBe(10055);
      expect(toCents("RD$ 1,250.75")).toBe(125075);
      expect(toCents("0")).toBe(0);
      expect(toCents(NaN)).toBe(0);
    });

    it("converts cents to decimal float", () => {
      expect(fromCents(10000)).toBe(100);
      expect(fromCents(125075)).toBe(1250.75);
      expect(fromCents(1)).toBe(0.01);
    });
  });

  describe("formatDOP", () => {
    it("formats amounts in RD$ correctly", () => {
      expect(formatDOP(10000)).toContain("100.00");
      expect(formatDOP(125075)).toContain("1,250.75");
      expect(formatDOP(-5000)).toContain("-");
    });
  });

  describe("splitEqually", () => {
    it("splits RD$ 100 (10,000 cents) between 3 people with deterministic penny distribution", () => {
      const participants = ["user-1", "user-2", "user-3"];
      const splits = splitEqually(10000, participants);

      const totalOwed = splits.reduce((sum, s) => sum + s.owedCents, 0);
      expect(totalOwed).toBe(10000);

      // 10000 / 3 = 3333 with remainder 1
      // The sorted first participant gets 3334, others get 3333
      expect(splits[0].owedCents).toBe(3334);
      expect(splits[1].owedCents).toBe(3333);
      expect(splits[2].owedCents).toBe(3333);
    });

    it("splits RD$ 1,000 (100,000 cents) between 3 people", () => {
      const participants = ["p1", "p2", "p3"];
      const splits = splitEqually(100000, participants);

      const totalOwed = splits.reduce((sum, s) => sum + s.owedCents, 0);
      expect(totalOwed).toBe(100000);
      expect(splits[0].owedCents).toBe(33334);
      expect(splits[1].owedCents).toBe(33333);
      expect(splits[2].owedCents).toBe(33333);
    });

    it("splits RD$ 100 between 7 people with exact sum preservation", () => {
      const participants = ["a", "b", "c", "d", "e", "f", "g"];
      const splits = splitEqually(10000, participants);

      const totalOwed = splits.reduce((sum, s) => sum + s.owedCents, 0);
      expect(totalOwed).toBe(10000);
      // 10000 / 7 = 1428 with remainder 4. First 4 get 1429, last 3 get 1428
      expect(splits.filter((s) => s.owedCents === 1429).length).toBe(4);
      expect(splits.filter((s) => s.owedCents === 1428).length).toBe(3);
    });

    it("handles subset of participants", () => {
      const subset = ["user-1", "user-3"];
      const splits = splitEqually(5000, subset);

      expect(splits.length).toBe(2);
      expect(splits[0].owedCents).toBe(2500);
      expect(splits[1].owedCents).toBe(2500);
    });
  });

  describe("splitByPercentage", () => {
    it("splits RD$ 10,000 (1,000,000 cents) by 40%, 30%, 30%", () => {
      const input = [
        { participantId: "p1", basisPoints: 4000 },
        { participantId: "p2", basisPoints: 3000 },
        { participantId: "p3", basisPoints: 3000 },
      ];

      const splits = splitByPercentage(1000000, input);
      const totalOwed = splits.reduce((sum, s) => sum + s.owedCents, 0);

      expect(totalOwed).toBe(1000000);
      expect(splits.find((s) => s.participantId === "p1")?.owedCents).toBe(400000);
      expect(splits.find((s) => s.participantId === "p2")?.owedCents).toBe(300000);
      expect(splits.find((s) => s.participantId === "p3")?.owedCents).toBe(300000);
    });

    it("throws error if percentage sum does not equal 10000 basis points", () => {
      const invalid = [
        { participantId: "p1", basisPoints: 5000 },
        { participantId: "p2", basisPoints: 4000 },
      ];

      expect(() => splitByPercentage(10000, invalid)).toThrow();
    });

    it("distributes leftover cents to highest decimal remainders", () => {
      // Split 100 cents (RD$ 1.00) 33.33%, 33.33%, 33.34%
      const input = [
        { participantId: "p1", basisPoints: 3333 },
        { participantId: "p2", basisPoints: 3333 },
        { participantId: "p3", basisPoints: 3334 },
      ];

      const splits = splitByPercentage(100, input);
      const totalOwed = splits.reduce((sum, s) => sum + s.owedCents, 0);
      expect(totalOwed).toBe(100);
    });
  });

  describe("calculateNetBalances", () => {
    it("calculates accurate net balances and guarantees zero-sum conservation", () => {
      const participants = ["juan", "pedro", "maria"];

      // Expense 1: Juan paid RD$ 3,000 split equally among all 3 (1000 each)
      // Expense 2: Pedro paid RD$ 1,500 split equally between Pedro & Maria (750 each)
      const expenses = [
        {
          paidByParticipantId: "juan",
          amountCents: 300000,
          splits: [
            { participantId: "juan", owedCents: 100000 },
            { participantId: "pedro", owedCents: 100000 },
            { participantId: "maria", owedCents: 100000 },
          ],
        },
        {
          paidByParticipantId: "pedro",
          amountCents: 150000,
          splits: [
            { participantId: "pedro", owedCents: 75000 },
            { participantId: "maria", owedCents: 75000 },
          ],
        },
      ];

      const balances = calculateNetBalances(participants, expenses);

      const juan = balances.get("juan")!;
      const pedro = balances.get("pedro")!;
      const maria = balances.get("maria")!;

      // Juan: Paid 3,000, Owed 1,000 -> Net +2,000 (must receive)
      expect(juan.totalPaidCents).toBe(300000);
      expect(juan.totalOwedCents).toBe(100000);
      expect(juan.netBalanceCents).toBe(200000);

      // Pedro: Paid 1,500, Owed 1,750 (1000 + 750) -> Net -250 (must pay)
      expect(pedro.totalPaidCents).toBe(150000);
      expect(pedro.totalOwedCents).toBe(175000);
      expect(pedro.netBalanceCents).toBe(-25000);

      // Maria: Paid 0, Owed 1,750 (1000 + 750) -> Net -1,750 (must pay)
      expect(maria.totalPaidCents).toBe(0);
      expect(maria.totalOwedCents).toBe(175000);
      expect(maria.netBalanceCents).toBe(-175000);

      // Sum of all net balances must be exactly 0
      const totalNet = juan.netBalanceCents + pedro.netBalanceCents + maria.netBalanceCents;
      expect(totalNet).toBe(0);
    });
  });
});
