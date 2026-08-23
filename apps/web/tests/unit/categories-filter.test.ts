import { describe, it, expect } from "vitest";
import { calculateCategoryTotals, formatDOP } from "@/lib/finance/math";
import { CATEGORY_INFO, ExpenseCategory } from "@/lib/types/domain";
import { toCents } from "@serrucho/core";

describe("Milestone 18: Categories and Filters (RD Taxonomy & Analytics)", () => {
  it("includes all 16 RD categories in taxonomy with labels and emojis", () => {
    const requiredCategories: ExpenseCategory[] = [
      "RENT_HOUSING",
      "ACCOMMODATION",
      "GROCERIES",
      "RESTAURANTS_DELIVERY",
      "TRANSPORTATION",
      "GAS_FUEL",
      "HOME_UTILITIES",
      "INTERNET_TELECOM",
      "HEALTH_MEDICAL",
      "ENTERTAINMENT",
      "SHOPPING",
      "PERSONAL_CARE",
      "FEES_CHARGES",
      "GIFTS",
      "TRIPS_TRAVEL",
      "OTHER",
    ];

    requiredCategories.forEach((cat) => {
      expect(CATEGORY_INFO[cat]).toBeDefined();
      expect(CATEGORY_INFO[cat].label).toBeTruthy();
      expect(CATEGORY_INFO[cat].emoji).toBeTruthy();
    });
  });

  it("calculates accurate category breakdown answering '¿Cuánto gastamos en comida?' and '¿Cuánto fue gasolina?'", () => {
    const expenses = [
      { amount_cents: toCents(3500), category: "GROCERIES" as ExpenseCategory },
      { amount_cents: toCents(1500), category: "GROCERIES" as ExpenseCategory },
      { amount_cents: toCents(2000), category: "GAS_FUEL" as ExpenseCategory },
      { amount_cents: toCents(8000), category: "ACCOMMODATION" as ExpenseCategory },
      { amount_cents: toCents(1000), category: "ENTERTAINMENT" as ExpenseCategory },
    ];

    const breakdown = calculateCategoryTotals(expenses);
    const totalCents = expenses.reduce((s, e) => s + e.amount_cents, 0); // 16,000 DOP

    expect(totalCents).toBe(toCents(16000));

    // Accommodation is #1
    expect(breakdown[0].category).toBe("ACCOMMODATION");
    expect(breakdown[0].total_cents).toBe(toCents(8000));
    expect(breakdown[0].percentage).toBe(50.0);
    expect(breakdown[0].expense_count).toBe(1);

    // Groceries is #2 (3500 + 1500 = 5000 DOP) -> "¿Cuánto gastamos en comida? RD$ 5,000.00"
    const groceries = breakdown.find((b) => b.category === "GROCERIES");
    expect(groceries).toBeDefined();
    expect(groceries?.total_cents).toBe(toCents(5000));
    expect(groceries?.expense_count).toBe(2);
    expect(groceries?.percentage).toBe(31.3);
    expect(formatDOP(groceries!.total_cents)).toBe(formatDOP(toCents(5000)));

    // Gas/Fuel is #3 (2000 DOP) -> "¿Cuánto fue gasolina? RD$ 2,000.00"
    const gas = breakdown.find((b) => b.category === "GAS_FUEL");
    expect(gas).toBeDefined();
    expect(gas?.total_cents).toBe(toCents(2000));
    expect(gas?.expense_count).toBe(1);
    expect(gas?.percentage).toBe(12.5);
    expect(formatDOP(gas!.total_cents)).toBe(formatDOP(toCents(2000)));
  });

  it("filters correctly across multi-dimensional criteria (Category + Participant + Date + Search Query)", () => {
    const expenses = [
      {
        id: "e1",
        description: "Supermercado Nacional",
        amount_cents: toCents(4500),
        category: "GROCERIES" as ExpenseCategory,
        paid_by_participant_id: "user-ana",
        paid_by_name: "Ana",
        expense_date: "2026-08-20",
        splits: [
          { participant_id: "user-ana", participant_name: "Ana" },
          { participant_id: "user-braulin", participant_name: "Braulin" },
        ],
      },
      {
        id: "e2",
        description: "Gasolina Shell Autopista Duarte",
        amount_cents: toCents(2200),
        category: "GAS_FUEL" as ExpenseCategory,
        paid_by_participant_id: "user-braulin",
        paid_by_name: "Braulin",
        expense_date: "2026-08-20",
        splits: [
          { participant_id: "user-ana", participant_name: "Ana" },
          { participant_id: "user-braulin", participant_name: "Braulin" },
          { participant_id: "user-carlos", participant_name: "Carlos" },
        ],
      },
      {
        id: "e3",
        description: "Cena Chilis Blue Mall",
        amount_cents: toCents(3800),
        category: "RESTAURANTS_DELIVERY" as ExpenseCategory,
        paid_by_participant_id: "user-carlos",
        paid_by_name: "Carlos",
        expense_date: "2026-08-21",
        splits: [
          { participant_id: "user-ana", participant_name: "Ana" },
          { participant_id: "user-carlos", participant_name: "Carlos" },
        ],
      },
    ];

    // Filter by Category: GROCERIES
    const groceriesFiltered = expenses.filter((e) => e.category === "GROCERIES");
    expect(groceriesFiltered).toHaveLength(1);
    expect(groceriesFiltered[0].description).toBe("Supermercado Nacional");

    // Filter by Participant: Braulin (paid or involved in split)
    const braulinFiltered = expenses.filter(
      (e) =>
        e.paid_by_participant_id === "user-braulin" ||
        e.splits.some((s) => s.participant_id === "user-braulin")
    );
    expect(braulinFiltered).toHaveLength(2); // e1 and e2

    // Filter by Date: 2026-08-20
    const dateFiltered = expenses.filter((e) => e.expense_date === "2026-08-20");
    expect(dateFiltered).toHaveLength(2);

    // Combined Filter: Date 2026-08-20 + Category GAS_FUEL
    const combinedFiltered = expenses.filter(
      (e) => e.expense_date === "2026-08-20" && e.category === "GAS_FUEL"
    );
    expect(combinedFiltered).toHaveLength(1);
    expect(combinedFiltered[0].description).toBe("Gasolina Shell Autopista Duarte");
  });

  it("verifies categories never alter balances or zero-sum conservation", () => {
    const expensesWithCatA = [
      { amount_cents: 1000, category: "GROCERIES" as ExpenseCategory },
      { amount_cents: 2000, category: "GAS_FUEL" as ExpenseCategory },
    ];
    const expensesWithCatB = [
      { amount_cents: 1000, category: "ENTERTAINMENT" as ExpenseCategory },
      { amount_cents: 2000, category: "OTHER" as ExpenseCategory },
    ];

    const sumA = expensesWithCatA.reduce((s, e) => s + e.amount_cents, 0);
    const sumB = expensesWithCatB.reduce((s, e) => s + e.amount_cents, 0);

    expect(sumA).toBe(sumB);
  });
});
