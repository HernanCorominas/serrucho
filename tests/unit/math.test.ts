import { describe, it, expect } from "vitest";
import {
  toCents,
  fromCents,
  formatDOP,
  splitEqually,
  splitByPercentage,
  calculateNetBalances,
  simplifyDebts,
  calculateCategoryTotals,
  generateWhatsAppDirectLink,
  generateGroupWhatsAppSummary,
  calculateCoroAwards,
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

      expect(juan.totalPaidCents).toBe(300000);
      expect(juan.totalOwedCents).toBe(100000);
      expect(juan.netBalanceCents).toBe(200000);

      expect(pedro.totalPaidCents).toBe(150000);
      expect(pedro.totalOwedCents).toBe(175000);
      expect(pedro.netBalanceCents).toBe(-25000);

      expect(maria.totalPaidCents).toBe(0);
      expect(maria.totalOwedCents).toBe(175000);
      expect(maria.netBalanceCents).toBe(-175000);

      const totalNet = juan.netBalanceCents + pedro.netBalanceCents + maria.netBalanceCents;
      expect(totalNet).toBe(0);
    });
  });

  describe("simplifyDebts (Min-Cash-Flow)", () => {
    it("simplifies 3-person balances to minimum optimal transfers", () => {
      const participants = [
        { id: "carlos", name: "Carlos" },
        { id: "juan", name: "Juan" },
        { id: "pedro", name: "Pedro" },
      ];

      // Carlos is owed +2,000; Juan owes -1,500; Pedro owes -500
      const balances = new Map([
        ["carlos", 200000],
        ["juan", -150000],
        ["pedro", -50000],
      ]);

      const transfers = simplifyDebts(participants, balances);

      expect(transfers.length).toBe(2);
      expect(transfers[0]).toEqual({
        from_participant_id: "juan",
        from_name: "Juan",
        to_participant_id: "carlos",
        to_name: "Carlos",
        amount_cents: 150000,
      });
      expect(transfers[1]).toEqual({
        from_participant_id: "pedro",
        from_name: "Pedro",
        to_participant_id: "carlos",
        to_name: "Carlos",
        amount_cents: 50000,
      });
    });

    it("handles complex multi-party settlements with fewer transactions than people", () => {
      const participants = [
        { id: "p1", name: "P1" },
        { id: "p2", name: "P2" },
        { id: "p3", name: "P3" },
        { id: "p4", name: "P4" },
      ];

      // P1: +3,000, P2: +1,000, P3: -2,000, P4: -2,000
      const balances = [
        { id: "p1", name: "P1", net_balance_cents: 300000 },
        { id: "p2", name: "P2", net_balance_cents: 100000 },
        { id: "p3", name: "P3", net_balance_cents: -200000 },
        { id: "p4", name: "P4", net_balance_cents: -200000 },
      ];

      const transfers = simplifyDebts(participants, balances);

      const totalTransferred = transfers.reduce((sum, t) => sum + t.amount_cents, 0);
      expect(totalTransferred).toBe(400000);
      expect(transfers.length).toBeLessThanOrEqual(3);
    });
  });

  describe("calculateCategoryTotals", () => {
    it("groups and calculates percentage per category", () => {
      const expenses = [
        { amount_cents: 2400000, category: "LODGING" as const },
        { amount_cents: 850000, category: "FOOD_GROCERIES" as const },
        { amount_cents: 300000, category: "FUEL_TRANSPORT" as const },
      ];

      const breakdown = calculateCategoryTotals(expenses);

      expect(breakdown.length).toBe(3);
      expect(breakdown[0].category).toBe("LODGING");
      expect(breakdown[0].total_cents).toBe(2400000);
      expect(breakdown[0].percentage).toBeGreaterThan(60);
    });
  });

  describe("WhatsApp Link and Group Summary Generators", () => {
    it("generates correct wa.me link for Dominican phone numbers", () => {
      const link = generateWhatsAppDirectLink({
        phone: "809-555-0199",
        serruchoName: "Las Terrenas",
        participantName: "Juan",
        balanceCents: -250000,
        publicUrl: "https://serrucho.vercel.app/s/abc123token",
        paymentInstructions: "Banco BHD 1234567890",
      });

      expect(link).toContain("https://wa.me/18095550199");
      expect(link).toContain("Las%20Terrenas");
      expect(link).toContain("2%2C500.00");
    });

    it("generates clean group summary text with emojis", () => {
      const summary = generateGroupWhatsAppSummary({
        serruchoName: "Las Terrenas 🌴",
        totalExpensesCents: 3550000,
        transfers: [
          {
            from_participant_id: "p2",
            from_name: "Juan Pérez",
            to_participant_id: "p1",
            to_name: "Carlos Gómez",
            amount_cents: 212500,
          },
        ],
      });

      expect(summary).toContain("SERRUCHO: Las Terrenas 🌴");
      expect(summary).toContain("Juan Pérez");
      expect(summary).toContain("Carlos Gómez");
      expect(summary).toContain("RD$");
    });
  });

  describe("calculateCoroAwards", () => {
    it("assigns appropriate badges to participants based on financial contributions", () => {
      const participants = [
        { id: "carlos", name: "Carlos Gómez", total_paid_cents: 2400000, total_owed_cents: 887500, net_balance_cents: 1512500 },
        { id: "juan", name: "Juan Pérez", total_paid_cents: 0, total_owed_cents: 887500, net_balance_cents: -887500 },
        { id: "pedro", name: "Pedro Rosario", total_paid_cents: 850000, total_owed_cents: 887500, net_balance_cents: -37500 },
        { id: "maria", name: "María Santos", total_paid_cents: 300000, total_owed_cents: 887500, net_balance_cents: -587500 },
      ];

      const expenses = [
        { id: "e1", description: "Villa Las Terrenas", amount_cents: 2400000, paid_by_participant_id: "carlos", category: "LODGING" },
        { id: "e2", description: "Supermercado Nacional", amount_cents: 850000, paid_by_participant_id: "pedro", category: "FOOD_GROCERIES" },
        { id: "e3", description: "Bebidas y Ron", amount_cents: 300000, paid_by_participant_id: "maria", category: "DRINKS_ALCOHOL" },
      ];

      const awards = calculateCoroAwards({ participants, expenses });

      expect(awards.length).toBeGreaterThanOrEqual(3);

      const topPayer = awards.find((a) => a.id === "top-payer");
      expect(topPayer?.winner_name).toBe("Carlos Gómez");

      const barman = awards.find((a) => a.id === "barman");
      expect(barman?.winner_name).toBe("María Santos");

      const supplier = awards.find((a) => a.id === "supplier");
      expect(supplier?.winner_name).toBe("Carlos Gómez"); // 24,000 > 8,500

      const topDebtor = awards.find((a) => a.id === "top-debtor");
      expect(topDebtor?.winner_name).toBe("Juan Pérez");
    });
  });
});
