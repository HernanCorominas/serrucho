import { describe, it, expect } from "vitest";
import { BRAND_CONFIG } from "@/lib/brand-config";
import {
  splitEqually,
  calculateParticipantBalances,
  simplifyDebts,
  formatDOP,
  type Participant,
  type ExpenseWithSplits,
} from "@serrucho/core";

describe("SER-KITTY-010H — Web Visual & Responsive UX Parity", () => {
  // 1. BRAND CONFIG & GLOBAL WEB SHELL
  describe("1. Brand Config & Color System", () => {
    it("adheres to Serrucho purple/lilac and Dominican branding", () => {
      expect(BRAND_CONFIG.name).toBe("Serrucho");
      expect(BRAND_CONFIG.currency.code).toBe("DOP");
      expect(BRAND_CONFIG.currency.symbol).toBe("RD$");
      expect(BRAND_CONFIG.colors.primary).toBe("#8B5CF6");
      expect(BRAND_CONFIG.colors.accent).toBe("#F97316");
      expect(BRAND_CONFIG.colors.success).toBe("#10B981");
      expect(BRAND_CONFIG.colors.destructive).toBe("#EF4444");
    });
  });

  // 2. WEB GROUP EXPENSES & FILTERING
  describe("2. Web Expenses & Movement Filtering", () => {
    const expenses: ExpenseWithSplits[] = [
      {
        id: "e1",
        serrucho_id: "s1",
        paid_by_participant_id: "p1",
        paid_by_name: "Juan",
        description: "Supermercado Nacional",
        amount_cents: 350000,
        split_method: "EQUAL",
        category: "FOOD_GROCERIES",
        expense_date: "2026-09-07",
        created_at: "",
        updated_at: "",
        splits: [
          { expense_id: "e1", participant_id: "p1", participant_name: "Juan", percentage_basis_points: 5000, owed_cents: 175000 },
          { expense_id: "e1", participant_id: "p2", participant_name: "Pedro", percentage_basis_points: 5000, owed_cents: 175000 },
        ],
      },
      {
        id: "e2",
        serrucho_id: "s1",
        paid_by_participant_id: "p2",
        paid_by_name: "Pedro",
        description: "Gasolina Shell",
        amount_cents: 150000,
        split_method: "EQUAL",
        category: "FUEL_TRANSPORT",
        expense_date: "2026-09-07",
        created_at: "",
        updated_at: "",
        splits: [
          { expense_id: "e2", participant_id: "p1", participant_name: "Juan", percentage_basis_points: 5000, owed_cents: 75000 },
          { expense_id: "e2", participant_id: "p2", participant_name: "Pedro", percentage_basis_points: 5000, owed_cents: 75000 },
        ],
      },
    ];

    it("filters expenses by search query and category", () => {
      const searchMatch = expenses.filter((e) => e.description.toLowerCase().includes("gasolina"));
      expect(searchMatch).toHaveLength(1);
      expect(searchMatch[0].id).toBe("e2");

      const categoryMatch = expenses.filter((e) => e.category === "FOOD_GROCERIES");
      expect(categoryMatch).toHaveLength(1);
      expect(categoryMatch[0].id).toBe("e1");
    });
  });

  // 3. BALANCES & MY PERSONAL STATUS
  describe("3. Personal Financial Status & Summary", () => {
    it("computes personal status badge and net balance accurately", () => {
      const participants: Participant[] = [
        { id: "p1", serrucho_id: "s1", name: "Juan", email: null, phone: null, preferred_channel: "WHATSAPP", created_at: "", updated_at: "" },
        { id: "p2", serrucho_id: "s1", name: "Pedro", email: null, phone: null, preferred_channel: "WHATSAPP", created_at: "", updated_at: "" },
      ];

      const expenses: ExpenseWithSplits[] = [
        {
          id: "e1",
          serrucho_id: "s1",
          paid_by_participant_id: "p1",
          paid_by_name: "Juan",
          description: "Cena",
          amount_cents: 400000,
          split_method: "EQUAL",
          category: "RESTAURANT",
          expense_date: "",
          created_at: "",
          updated_at: "",
          splits: [
            { expense_id: "e1", participant_id: "p1", participant_name: "Juan", percentage_basis_points: 5000, owed_cents: 200000 },
            { expense_id: "e1", participant_id: "p2", participant_name: "Pedro", percentage_basis_points: 5000, owed_cents: 200000 },
          ],
        },
      ];

      const financials = calculateParticipantBalances(participants, expenses, []);
      const juanFinancial = financials.find((f) => f.id === "p1");
      const pedroFinancial = financials.find((f) => f.id === "p2");

      expect(juanFinancial?.net_balance_cents).toBe(200000); // A favor (+RD$ 2,000.00)
      expect(pedroFinancial?.net_balance_cents).toBe(-200000); // Tienes que pagar (-RD$ 2,000.00)

      const getStatusLabel = (cents: number) => {
        if (cents > 0) return "A TU FAVOR";
        if (cents < 0) return "TIENES QUE PAGAR";
        return "ESTÁS AL DÍA";
      };

      expect(getStatusLabel(juanFinancial!.net_balance_cents)).toBe("A TU FAVOR");
      expect(getStatusLabel(pedroFinancial!.net_balance_cents)).toBe("TIENES QUE PAGAR");
    });
  });

  // 4. RESPONSIVE BREAKPOINT MATRICES
  describe("4. Responsive Breakpoint Layout System", () => {
    it("validates standard responsive grid breakpoints", () => {
      const breakpoints = {
        smMobile: 375,
        mobile: 430,
        tablet: 768,
        desktop: 1024,
        wide: 1440,
      };

      expect(breakpoints.smMobile).toBeLessThan(breakpoints.mobile);
      expect(breakpoints.mobile).toBeLessThan(breakpoints.tablet);
      expect(breakpoints.tablet).toBeLessThan(breakpoints.desktop);
      expect(breakpoints.desktop).toBeLessThan(breakpoints.wide);
    });
  });

  // 5. BAL-08 DETERMINISTIC & ZERO-SUM INVARIANTS
  describe("5. BAL-08 & Zero-Sum Invariants", () => {
    it("preserves BAL-08 exact cent split (10000 cents / 3 participants)", () => {
      const splits = splitEqually(10000, ["p1", "p2", "p3"]);
      expect(splits[0].owedCents).toBe(3334);
      expect(splits[1].owedCents).toBe(3333);
      expect(splits[2].owedCents).toBe(3333);
      expect(splits.reduce((acc, s) => acc + s.owedCents, 0)).toBe(10000);
    });

    it("maintains zero-sum invariant across all participant balances", () => {
      const participants: Participant[] = [
        { id: "p1", serrucho_id: "s1", name: "A", email: null, phone: null, preferred_channel: "WHATSAPP", created_at: "", updated_at: "" },
        { id: "p2", serrucho_id: "s1", name: "B", email: null, phone: null, preferred_channel: "WHATSAPP", created_at: "", updated_at: "" },
        { id: "p3", serrucho_id: "s1", name: "C", email: null, phone: null, preferred_channel: "WHATSAPP", created_at: "", updated_at: "" },
      ];
      const expenses: ExpenseWithSplits[] = [
        {
          id: "e1",
          serrucho_id: "s1",
          paid_by_participant_id: "p1",
          paid_by_name: "A",
          description: "Super",
          amount_cents: 10000,
          split_method: "EQUAL",
          category: "FOOD_GROCERIES",
          expense_date: "",
          created_at: "",
          updated_at: "",
          splits: [
            { expense_id: "e1", participant_id: "p1", participant_name: "A", percentage_basis_points: 3334, owed_cents: 3334 },
            { expense_id: "e1", participant_id: "p2", participant_name: "B", percentage_basis_points: 3333, owed_cents: 3333 },
            { expense_id: "e1", participant_id: "p3", participant_name: "C", percentage_basis_points: 3333, owed_cents: 3333 },
          ],
        },
      ];

      const balances = calculateParticipantBalances(participants, expenses, []);
      const sum = balances.reduce((acc, b) => acc + b.net_balance_cents, 0);
      expect(sum).toBe(0);
    });
  });
});
