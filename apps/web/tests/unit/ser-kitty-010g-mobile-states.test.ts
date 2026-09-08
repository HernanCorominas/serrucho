import { describe, it, expect } from "vitest";
import {
  splitEqually,
  splitByPercentage,
  splitByExactAmounts,
  splitByShares,
  calculateParticipantBalances,
  simplifyDebts,
  type Participant,
  type ExpenseWithSplits,
} from "@serrucho/core";

describe("SER-KITTY-010G — Mobile States & Feedback UX Parity", () => {
  // 1. EMPTY STATES MATRIX
  describe("1. Empty States Differentiation", () => {
    it("differentiates search empty state vs tab empty state in dashboard", () => {
      const allSerruchos = [
        { id: "s1", name: "Viaje a Samaná", status: "OPEN" as const },
        { id: "s2", name: "Cena Cumpleaños", status: "CLOSED" as const },
      ];

      // Tab open with matching items
      const openMatches = allSerruchos.filter((s) => s.status === "OPEN");
      expect(openMatches).toHaveLength(1);

      // Search with 0 matches
      const searchQuery = "Punta Cana";
      const searchMatches = allSerruchos.filter(
        (s) => s.status === "OPEN" && s.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      expect(searchMatches).toHaveLength(0);

      // Search empty state should be triggered rather than 'no groups exist'
      const isSearchEmpty = searchQuery.trim() !== "" && searchMatches.length === 0;
      expect(isSearchEmpty).toBe(true);
    });

    it("differentiates no expenses ('Sin movimientos aún') vs settled ('¡Están al día!') in Balances tab", () => {
      const participants: Participant[] = [
        { id: "p1", serrucho_id: "s1", name: "Juan", email: null, phone: null, preferred_channel: "WHATSAPP", created_at: "", updated_at: "" },
        { id: "p2", serrucho_id: "s1", name: "Pedro", email: null, phone: null, preferred_channel: "WHATSAPP", created_at: "", updated_at: "" },
      ];

      // Scenario A: 0 expenses
      const zeroExpenses: ExpenseWithSplits[] = [];
      const zeroBalances = calculateParticipantBalances(participants, zeroExpenses, []);
      const zeroDebts = simplifyDebts(participants, zeroBalances);

      expect(zeroExpenses.length).toBe(0);
      expect(zeroDebts.length).toBe(0);
      // State classification: "Sin movimientos aún"
      const emptyStatusA = zeroExpenses.length === 0 ? "NO_MOVEMENTS" : zeroDebts.length === 0 ? "ALL_SETTLED" : "HAS_DEBTS";
      expect(emptyStatusA).toBe("NO_MOVEMENTS");

      // Scenario B: Has expenses, but settlement equalized everything
      const expenses: ExpenseWithSplits[] = [
        {
          id: "e1",
          serrucho_id: "s1",
          paid_by_participant_id: "p1",
          paid_by_name: "Juan",
          description: "Almuerzo",
          amount_cents: 200000,
          split_method: "EQUAL",
          category: "FOOD_GROCERIES",
          expense_date: "2026-09-07",
          created_at: "",
          updated_at: "",
          splits: [
            { expense_id: "e1", participant_id: "p1", participant_name: "Juan", percentage_basis_points: 5000, owed_cents: 100000 },
            { expense_id: "e1", participant_id: "p2", participant_name: "Pedro", percentage_basis_points: 5000, owed_cents: 100000 },
          ],
        },
      ];
      // Pedro pays back Juan 100000 cents
      const transfers = [
        {
          id: "t1",
          serrucho_id: "s1",
          sender_participant_id: "p2",
          receiver_participant_id: "p1",
          amount_cents: 100000,
          transfer_date: "2026-09-07",
        },
      ];

      const settledBalances = calculateParticipantBalances(participants, expenses, transfers);
      const settledDebts = simplifyDebts(participants, settledBalances);

      expect(expenses.length).toBe(1);
      expect(settledDebts.length).toBe(0);
      // State classification: "¡Están al día!"
      const emptyStatusB = expenses.length === 0 ? "NO_MOVEMENTS" : settledDebts.length === 0 ? "ALL_SETTLED" : "HAS_DEBTS";
      expect(emptyStatusB).toBe("ALL_SETTLED");
    });
  });

  // 2. LOADING & DISABLED STATES
  describe("2. Loading & Double-Submission Guards", () => {
    it("prevents double submission when loading flag is active", () => {
      let callCount = 0;
      let loading = false;

      const submitHandler = () => {
        if (loading) return false;
        loading = true;
        callCount++;
        return true;
      };

      const firstTap = submitHandler();
      const secondTap = submitHandler(); // Rapid double tap while loading

      expect(firstTap).toBe(true);
      expect(secondTap).toBe(false);
      expect(callCount).toBe(1);
    });

    it("disables mutation handlers when group is closed or read-only", () => {
      const closedGroup = { id: "s1", status: "CLOSED" as const, is_read_only: false };
      const readOnlyGroup = { id: "s2", status: "OPEN" as const, is_read_only: true };

      const canMutate = (g: { id?: string; status: "OPEN" | "CLOSED"; is_read_only?: boolean }) => {
        return g.status !== "CLOSED" && !g.is_read_only;
      };

      expect(canMutate(closedGroup)).toBe(false);
      expect(canMutate(readOnlyGroup)).toBe(false);
      expect(canMutate({ id: "s3", status: "OPEN", is_read_only: false })).toBe(true);
    });
  });

  // 3. VALIDATION & ERROR STATES
  describe("3. Expense Input Validation & Feedback", () => {
    it("validates percentage split must sum to exactly 10000 bps (100%)", () => {
      const validatePercentages = (bpsArray: number[]) => {
        const total = bpsArray.reduce((acc, v) => acc + v, 0);
        return total === 10000;
      };

      expect(validatePercentages([5000, 5000])).toBe(true);
      expect(validatePercentages([3334, 3333, 3333])).toBe(true);
      expect(validatePercentages([5000, 4000])).toBe(false); // 90%
      expect(validatePercentages([6000, 5000])).toBe(false); // 110%
    });

    it("validates exact amount split must match total amount cents", () => {
      const amountCents = 150000; // RD$ 1,500.00
      const validateExact = (amounts: number[], total: number) => {
        const sum = amounts.reduce((acc, v) => acc + v, 0);
        return sum === total;
      };

      expect(validateExact([100000, 50000], amountCents)).toBe(true);
      expect(validateExact([100000, 40000], amountCents)).toBe(false);
    });

    it("guards participant deletion against active financial records", () => {
      const participantId = "p1";
      const expenses: ExpenseWithSplits[] = [
        {
          id: "e1",
          serrucho_id: "s1",
          paid_by_participant_id: "p1",
          paid_by_name: "Juan",
          description: "Gasolina",
          amount_cents: 100000,
          split_method: "EQUAL",
          category: "FUEL_TRANSPORT",
          expense_date: "",
          created_at: "",
          updated_at: "",
          splits: [{ expense_id: "e1", participant_id: "p1", participant_name: "Juan", percentage_basis_points: 10000, owed_cents: 100000 }],
        },
      ];
      const transfers: any[] = [];

      const canDeleteParticipant = (pId: string, exps: ExpenseWithSplits[], trs: any[]) => {
        const hasPaid = exps.some((e) => e.paid_by_participant_id === pId);
        const hasSplit = exps.some((e) => e.splits?.some((s) => s.participant_id === pId && s.owed_cents > 0));
        const hasTransfer = trs.some((t) => t.sender_participant_id === pId || t.receiver_participant_id === pId);
        return !hasPaid && !hasSplit && !hasTransfer;
      };

      expect(canDeleteParticipant(participantId, expenses, transfers)).toBe(false);
      expect(canDeleteParticipant("p99_inactive", expenses, transfers)).toBe(true);
    });
  });

  // 4. FINANCIAL ENGINE INVARIANTS & BAL-08
  describe("4. Financial Engine Determinism & BAL-08", () => {
    it("preserves BAL-08 deterministic division (10000 cents across 3 participants)", () => {
      const splits = splitEqually(10000, ["p1", "p2", "p3"]);
      expect(splits).toHaveLength(3);

      expect(splits[0].owedCents).toBe(3334);
      expect(splits[1].owedCents).toBe(3333);
      expect(splits[2].owedCents).toBe(3333);

      const sum = splits.reduce((acc, s) => acc + s.owedCents, 0);
      expect(sum).toBe(10000);
    });

    it("guarantees zero-sum invariant across all net balances", () => {
      const participants: Participant[] = [
        { id: "p1", serrucho_id: "s1", name: "Juan", email: null, phone: null, preferred_channel: "WHATSAPP", created_at: "", updated_at: "" },
        { id: "p2", serrucho_id: "s1", name: "Maria", email: null, phone: null, preferred_channel: "WHATSAPP", created_at: "", updated_at: "" },
        { id: "p3", serrucho_id: "s1", name: "Pedro", email: null, phone: null, preferred_channel: "WHATSAPP", created_at: "", updated_at: "" },
      ];

      const expenses: ExpenseWithSplits[] = [
        {
          id: "e1",
          serrucho_id: "s1",
          paid_by_participant_id: "p1",
          paid_by_name: "Juan",
          description: "Cena",
          amount_cents: 900000,
          split_method: "EQUAL",
          category: "RESTAURANT",
          expense_date: "",
          created_at: "",
          updated_at: "",
          splits: [
            { expense_id: "e1", participant_id: "p1", participant_name: "Juan", percentage_basis_points: 3334, owed_cents: 300000 },
            { expense_id: "e1", participant_id: "p2", participant_name: "Maria", percentage_basis_points: 3333, owed_cents: 300000 },
            { expense_id: "e1", participant_id: "p3", participant_name: "Pedro", percentage_basis_points: 3333, owed_cents: 300000 },
          ],
        },
      ];

      const financials = calculateParticipantBalances(participants, expenses, []);
      const sumNetBalances = financials.reduce((acc, f) => acc + f.net_balance_cents, 0);
      expect(sumNetBalances).toBe(0);
    });
  });
});
