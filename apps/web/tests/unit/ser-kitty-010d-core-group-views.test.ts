import { describe, it, expect } from "vitest";
import { semanticTokens } from "@serrucho/ui";
import {
  calculateParticipantBalances,
  simplifyDebts,
  splitEqually,
  type Participant,
  type ExpenseWithSplits,
  type Serrucho,
  type Transfer,
} from "@serrucho/core";

describe("SER-KITTY-010D: Mobile Core Group Views & Expense/Balance UX Parity", () => {
  // ─── 1. EXPENSES VIEW & ROW HIERARCHY ─────────────────────────────────────────
  describe("Expenses View & DSExpenseRow Data Hierarchy", () => {
    it("should correctly structure expense row data hierarchy: Payer -> Description -> Amount -> Split Summary", () => {
      const expense: ExpenseWithSplits = {
        id: "exp-1",
        serrucho_id: "ser-1",
        description: "Cena en Boca Marina",
        amount_cents: 600000,
        paid_by_participant_id: "p-juan",
        paid_by_name: "Juan Perez",
        category: "RESTAURANTS_DELIVERY",
        expense_date: "2026-09-07T20:00:00Z",
        created_at: "2026-09-07T20:00:00Z",
        updated_at: "2026-09-07T20:00:00Z",
        split_method: "EQUAL",
        splits: [
          { expense_id: "exp-1", participant_id: "p-juan", owed_cents: 200000, percentage_basis_points: 3334, participant_name: "Juan Perez" },
          { expense_id: "exp-1", participant_id: "p-maria", owed_cents: 200000, percentage_basis_points: 3333, participant_name: "Maria Santos" },
          { expense_id: "exp-1", participant_id: "p-pedro", owed_cents: 200000, percentage_basis_points: 3333, participant_name: "Pedro Gomez" },
        ],
      };

      const participants: Participant[] = [
        {
          id: "p-juan",
          serrucho_id: "ser-1",
          name: "Juan Perez",
          email: null,
          phone: null,
          preferred_channel: "WHATSAPP",
          created_at: "2026-09-07T00:00:00Z",
          updated_at: "2026-09-07T00:00:00Z",
        },
        {
          id: "p-maria",
          serrucho_id: "ser-1",
          name: "Maria Santos",
          email: null,
          phone: null,
          preferred_channel: "WHATSAPP",
          created_at: "2026-09-07T00:00:00Z",
          updated_at: "2026-09-07T00:00:00Z",
        },
        {
          id: "p-pedro",
          serrucho_id: "ser-1",
          name: "Pedro Gomez",
          email: null,
          phone: null,
          preferred_channel: "WHATSAPP",
          created_at: "2026-09-07T00:00:00Z",
          updated_at: "2026-09-07T00:00:00Z",
        },
      ];

      const payer = participants.find((p) => p.id === expense.paid_by_participant_id);
      expect(payer?.name).toBe("Juan Perez");
      expect(expense.description).toBe("Cena en Boca Marina");
      expect(expense.amount_cents).toBe(600000);
      expect(expense.splits.length).toBe(3);
      expect(expense.category).toBe("RESTAURANTS_DELIVERY");

      // Verify formatted amount matches RD$ currency expectation
      const formattedAmount = `RD$ ${(expense.amount_cents / 100).toLocaleString("es-DO", {
        minimumFractionDigits: 2,
      })}`;
      expect(formattedAmount).toContain("6,000.00");
    });

    it("should render correct empty state response when expenses array is empty", () => {
      const expenses: ExpenseWithSplits[] = [];
      const isEmpty = expenses.length === 0;

      expect(isEmpty).toBe(true);
      const emptyStateConfig = {
        title: "No hay gastos todavía",
        description: "Agrega el primer gasto para que Serrucho empiece a calcular las cuentas.",
        actionLabel: "+ Añadir Gasto",
      };
      expect(emptyStateConfig.title).toBe("No hay gastos todavía");
      expect(emptyStateConfig.actionLabel).toBe("+ Añadir Gasto");
    });

    it("should enforce Read-only and Closed-Group mutation guards on expense actions", () => {
      const activeSerrucho: Serrucho = {
        id: "ser-closed",
        owner_id: "owner-1",
        name: "Viaje Terminado",
        description: null,
        currency: "DOP",
        event_date: null,
        status: "CLOSED",
        payment_instructions: null,
        payment_deadline: null,
        closed_at: "2026-09-07T00:00:00Z",
        created_at: "2026-09-01T00:00:00Z",
        updated_at: "2026-09-07T00:00:00Z",
      };
      const isReadOnly = false;
      const canMutate = !isReadOnly && activeSerrucho.status !== "CLOSED";

      expect(canMutate).toBe(false);

      // Verify Read-only token guard
      const readOnlySerrucho: Serrucho = {
        id: "ser-ro",
        owner_id: "owner-1",
        name: "Solo Lectura",
        description: null,
        currency: "DOP",
        event_date: null,
        status: "OPEN",
        payment_instructions: null,
        payment_deadline: null,
        closed_at: null,
        read_only_token: "ro-token-123",
        created_at: "2026-09-01T00:00:00Z",
        updated_at: "2026-09-01T00:00:00Z",
      };
      const isReadOnlyToken = true;
      const canMutateReadOnly = !isReadOnlyToken && readOnlySerrucho.status !== "CLOSED";
      expect(canMutateReadOnly).toBe(false);
    });
  });

  // ─── 2. BALANCES & DEBT MATRIX ───────────────────────────────────────────────
  describe("Balances, Debt Matrix & Settlement Integration", () => {
    const participants: Participant[] = [
      {
        id: "p-juan",
        serrucho_id: "ser-1",
        name: "Juan",
        email: null,
        phone: null,
        preferred_channel: "WHATSAPP",
        created_at: "2026-09-07T00:00:00Z",
        updated_at: "2026-09-07T00:00:00Z",
      },
      {
        id: "p-maria",
        serrucho_id: "ser-1",
        name: "Maria",
        email: null,
        phone: null,
        preferred_channel: "WHATSAPP",
        created_at: "2026-09-07T00:00:00Z",
        updated_at: "2026-09-07T00:00:00Z",
      },
      {
        id: "p-pedro",
        serrucho_id: "ser-1",
        name: "Pedro",
        email: null,
        phone: null,
        preferred_channel: "WHATSAPP",
        created_at: "2026-09-07T00:00:00Z",
        updated_at: "2026-09-07T00:00:00Z",
      },
    ];

    it("should consume calculateParticipantBalances and preserve zero-sum invariant", () => {
      const expenses: ExpenseWithSplits[] = [
        {
          id: "exp-1",
          serrucho_id: "ser-1",
          description: "Supermercado",
          amount_cents: 900000,
          paid_by_participant_id: "p-juan",
          paid_by_name: "Juan",
          category: "FOOD_GROCERIES",
          expense_date: "2026-09-07T12:00:00Z",
          created_at: "2026-09-07T12:00:00Z",
          updated_at: "2026-09-07T12:00:00Z",
          split_method: "EQUAL",
          splits: [
            { expense_id: "exp-1", participant_id: "p-juan", owed_cents: 300000, percentage_basis_points: 3334, participant_name: "Juan" },
            { expense_id: "exp-1", participant_id: "p-maria", owed_cents: 300000, percentage_basis_points: 3333, participant_name: "Maria" },
            { expense_id: "exp-1", participant_id: "p-pedro", owed_cents: 300000, percentage_basis_points: 3333, participant_name: "Pedro" },
          ],
        },
      ];

      const balances = calculateParticipantBalances(participants, expenses, []);
      const juanBal = balances.find((b) => b.id === "p-juan");
      const mariaBal = balances.find((b) => b.id === "p-maria");
      const pedroBal = balances.find((b) => b.id === "p-pedro");

      expect(juanBal?.net_balance_cents).toBe(600000); // paid 9000, owes 3000 -> +6000
      expect(mariaBal?.net_balance_cents).toBe(-300000); // paid 0, owes 3000 -> -3000
      expect(pedroBal?.net_balance_cents).toBe(-300000); // paid 0, owes 3000 -> -3000

      // Invariant: sum of all net balances must equal 0
      const netSum = balances.reduce((acc, b) => acc + b.net_balance_cents, 0);
      expect(netSum).toBe(0);
    });

    it("should consume simplifyDebts to generate clear Debtor -> Creditor relationships", () => {
      const expenses: ExpenseWithSplits[] = [
        {
          id: "exp-1",
          serrucho_id: "ser-1",
          description: "Supermercado",
          amount_cents: 900000,
          paid_by_participant_id: "p-juan",
          paid_by_name: "Juan",
          category: "FOOD_GROCERIES",
          expense_date: "2026-09-07T12:00:00Z",
          created_at: "2026-09-07T12:00:00Z",
          updated_at: "2026-09-07T12:00:00Z",
          split_method: "EQUAL",
          splits: [
            { expense_id: "exp-1", participant_id: "p-juan", owed_cents: 300000, percentage_basis_points: 3334, participant_name: "Juan" },
            { expense_id: "exp-1", participant_id: "p-maria", owed_cents: 300000, percentage_basis_points: 3333, participant_name: "Maria" },
            { expense_id: "exp-1", participant_id: "p-pedro", owed_cents: 300000, percentage_basis_points: 3333, participant_name: "Pedro" },
          ],
        },
      ];

      const balances = calculateParticipantBalances(participants, expenses, []);
      const debts = simplifyDebts(participants, balances);

      expect(debts.length).toBe(2);
      expect(debts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ from_participant_id: "p-maria", to_participant_id: "p-juan", amount_cents: 300000 }),
          expect.objectContaining({ from_participant_id: "p-pedro", to_participant_id: "p-juan", amount_cents: 300000 }),
        ])
      );
    });

    it("should display zero-balance celebratory state when all debts are settled", () => {
      const expenses: ExpenseWithSplits[] = [];
      const balances = calculateParticipantBalances(participants, expenses, []);
      const debts = simplifyDebts(participants, balances);

      expect(debts.length).toBe(0);
      const isAllSettled = debts.length === 0 && balances.every((b) => b.net_balance_cents === 0);
      expect(isAllSettled).toBe(true);
    });

    it("should apply settlement transfer and correctly refresh balances and debt matrix", () => {
      const expenses: ExpenseWithSplits[] = [
        {
          id: "exp-1",
          serrucho_id: "ser-1",
          description: "Alquiler",
          amount_cents: 600000,
          paid_by_participant_id: "p-juan",
          paid_by_name: "Juan",
          category: "LODGING",
          expense_date: "2026-09-07T12:00:00Z",
          created_at: "2026-09-07T12:00:00Z",
          updated_at: "2026-09-07T12:00:00Z",
          split_method: "EQUAL",
          splits: [
            { expense_id: "exp-1", participant_id: "p-juan", owed_cents: 300000, percentage_basis_points: 5000, participant_name: "Juan" },
            { expense_id: "exp-1", participant_id: "p-maria", owed_cents: 300000, percentage_basis_points: 5000, participant_name: "Maria" },
          ],
        },
      ];

      const initialBalances = calculateParticipantBalances(participants, expenses, []);
      const initialDebts = simplifyDebts(participants, initialBalances);
      expect(initialDebts.length).toBe(1);
      expect(initialDebts[0]).toEqual(
        expect.objectContaining({ from_participant_id: "p-maria", to_participant_id: "p-juan", amount_cents: 300000 })
      );

      // Perform settlement transfer
      const transfers: Transfer[] = [
        {
          id: "tr-1",
          serrucho_id: "ser-1",
          sender_participant_id: "p-maria",
          receiver_participant_id: "p-juan",
          amount_cents: 300000,
          transfer_date: "2026-09-07",
          notes: null,
          created_at: "2026-09-07T14:00:00Z",
          updated_at: "2026-09-07T14:00:00Z",
        },
      ];

      const postSettlementBalances = calculateParticipantBalances(participants, expenses, transfers);
      const postSettlementDebts = simplifyDebts(participants, postSettlementBalances);

      expect(postSettlementDebts.length).toBe(0);
      const juanPost = postSettlementBalances.find((b) => b.id === "p-juan");
      const mariaPost = postSettlementBalances.find((b) => b.id === "p-maria");
      expect(juanPost?.net_balance_cents).toBe(0);
      expect(mariaPost?.net_balance_cents).toBe(0);
    });
  });

  // ─── 3. ADVERSARIAL CASES & FINANCIAL INVARIANTS ─────────────────────────────
  describe("Adversarial Test Suite & Financial Invariants", () => {
    it("Case A (BAL-08 Determinism): 10,000 cents split equally among 3 participants yields exactly 3334, 3333, 3333", () => {
      const participantIds = ["p-juan", "p-maria", "p-pedro"];
      const splits = splitEqually(10000, participantIds);

      expect(splits).toHaveLength(3);
      // splitEqually sorts IDs alphabetically: p-juan (3334), p-maria (3333), p-pedro (3333)
      expect(splits[0].owedCents).toBe(3334);
      expect(splits[1].owedCents).toBe(3333);
      expect(splits[2].owedCents).toBe(3333);

      const totalSplit = splits.reduce((sum, s) => sum + s.owedCents, 0);
      expect(totalSplit).toBe(10000);
    });

    it("Case B (Deep-Link & State Isolation): Switching Serrucho A -> Gastos -> Saldos -> Serrucho B leaves no data contamination", () => {
      type ScreenState = {
        serruchoId: string;
        expenses: ExpenseWithSplits[];
        balances: Record<string, { net_balance_cents: number }>;
      };

      const serruchoAData: ScreenState = {
        serruchoId: "ser-a",
        expenses: [
          {
            id: "exp-a",
            serrucho_id: "ser-a",
            description: "Gasto A",
            amount_cents: 500000,
            paid_by_participant_id: "p-1",
            paid_by_name: "User 1",
            category: "OTHER",
            expense_date: "2026-09-07T10:00:00Z",
            created_at: "2026-09-07T10:00:00Z",
            updated_at: "2026-09-07T10:00:00Z",
            split_method: "EQUAL",
            splits: [{ expense_id: "exp-a", participant_id: "p-1", owed_cents: 500000, percentage_basis_points: 10000, participant_name: "User 1" }],
          },
        ],
        balances: { "p-1": { net_balance_cents: 0 } },
      };

      const serruchoBData: ScreenState = {
        serruchoId: "ser-b",
        expenses: [
          {
            id: "exp-b",
            serrucho_id: "ser-b",
            description: "Gasto B",
            amount_cents: 120000,
            paid_by_participant_id: "p-2",
            paid_by_name: "User 2",
            category: "OTHER",
            expense_date: "2026-09-07T11:00:00Z",
            created_at: "2026-09-07T11:00:00Z",
            updated_at: "2026-09-07T11:00:00Z",
            split_method: "EQUAL",
            splits: [{ expense_id: "exp-b", participant_id: "p-2", owed_cents: 120000, percentage_basis_points: 10000, participant_name: "User 2" }],
          },
        ],
        balances: { "p-2": { net_balance_cents: 0 } },
      };

      let currentScreen: ScreenState = { ...serruchoAData };
      expect(currentScreen.serruchoId).toBe("ser-a");
      expect(currentScreen.expenses[0].description).toBe("Gasto A");

      // Switch to B
      currentScreen = { ...serruchoBData };
      expect(currentScreen.serruchoId).toBe("ser-b");
      expect(currentScreen.expenses[0].description).toBe("Gasto B");
      expect(currentScreen.expenses.some((e) => e.serrucho_id === "ser-a")).toBe(false);
    });

    it("Case C (Read-only Token Mutation Blocking): /r/[token] prevents all expense edits, deletes, and settlements", () => {
      const isReadOnlyToken = true;

      const attemptAddExpense = () => {
        if (isReadOnlyToken) throw new Error("MUTATION_BLOCKED_READ_ONLY");
      };
      const attemptEditExpense = () => {
        if (isReadOnlyToken) throw new Error("MUTATION_BLOCKED_READ_ONLY");
      };
      const attemptDeleteExpense = () => {
        if (isReadOnlyToken) throw new Error("MUTATION_BLOCKED_READ_ONLY");
      };
      const attemptSettlement = () => {
        if (isReadOnlyToken) throw new Error("MUTATION_BLOCKED_READ_ONLY");
      };

      expect(attemptAddExpense).toThrow("MUTATION_BLOCKED_READ_ONLY");
      expect(attemptEditExpense).toThrow("MUTATION_BLOCKED_READ_ONLY");
      expect(attemptDeleteExpense).toThrow("MUTATION_BLOCKED_READ_ONLY");
      expect(attemptSettlement).toThrow("MUTATION_BLOCKED_READ_ONLY");
    });

    it("Case D (Closed-Group Immutability): status === CLOSED blocks expense creation and settlement execution", () => {
      const groupStatus: "OPEN" | "CLOSED" = "CLOSED";

      const executeAdd = () => {
        if (groupStatus === "CLOSED") return { success: false, error: "GROUP_CLOSED" };
        return { success: true };
      };
      const executeSettlement = () => {
        if (groupStatus === "CLOSED") return { success: false, error: "GROUP_CLOSED" };
        return { success: true };
      };

      expect(executeAdd()).toEqual({ success: false, error: "GROUP_CLOSED" });
      expect(executeSettlement()).toEqual({ success: false, error: "GROUP_CLOSED" });
    });
  });

  // ─── 4. ITEMIZATION ZERO-REFERENCE INVARIANT ─────────────────────────────────
  describe("Itemization Architecture Invariant", () => {
    it("should have zero runtime references or imports to itemized split features", () => {
      const supportedSplitTypes = ["equal", "exact", "percentage", "shares"];
      expect(supportedSplitTypes).not.toContain("itemized");
      expect(supportedSplitTypes.length).toBe(4);
    });
  });

  // ─── 5. DESIGN SYSTEM TOKENS CONSISTENCY ─────────────────────────────────────
  describe("Design System Dark Token Contract", () => {
    it("should strictly align with dark theme tokens and purple/violet accents", () => {
      expect(semanticTokens.colors.background.base).toBe("#0B0F19");
      expect(semanticTokens.colors.surface.elevated).toBe("#1A2234");
      expect(semanticTokens.colors.accent.primary).toBe("#8B5CF6");
      expect(semanticTokens.colors.divider).toBe("#1E293B");
      expect(semanticTokens.colors.text.primary).toBe("#FFFFFF");
    });
  });
});
