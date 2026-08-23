/**
 * Unit tests for Multi-Currency and Exchange Rate Handling
 * Milestone 22: Múltiples monedas y conversión (Prompt 22)
 *
 * Tests cover:
 * - Currency conversions (DOP, USD, EUR) with default and custom rates
 * - Foreign amount formatting
 * - Expense creation with foreign currency and conversion to DOP base
 * - Traceability preservation (original_currency, original_amount_cents, exchange_rate_used)
 * - Manual exchange rate override
 * - Updating foreign currency expenses without silent rate recalculation
 * - Zero-sum invariant on converted balances
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  convertToDOPCents,
  formatForeignAmount,
  CURRENCY_SYMBOLS,
  CURRENCY_LABELS,
} from "@/lib/finance/currency";
import { ExpenseService } from "@/features/expenses/service";
import { SerruchoService } from "@/features/serruchos/service";
import { ParticipantService } from "@/features/participants/service";

describe("Multi-Currency Utilities (lib/finance/currency)", () => {
  describe("convertToDOPCents", () => {
    it("converts DOP directly to cents without exchange rate multiplication", () => {
      expect(convertToDOPCents(100, "DOP")).toBe(10000);
      expect(convertToDOPCents(250.75, "DOP")).toBe(25075);
    });

    it("converts USD using fallback rate when no custom rate provided", () => {
      // 100 USD @ default 60.50 = RD$ 6,050.00 = 605000 cents
      const result = convertToDOPCents(100, "USD");
      expect(result).toBe(605000);
    });

    it("converts USD using custom exchange rate", () => {
      // 100 USD @ 62.50 = RD$ 6,250.00 = 625000 cents
      const result = convertToDOPCents(100, "USD", 62.5);
      expect(result).toBe(625000);
    });

    it("converts EUR using custom exchange rate", () => {
      // 50 EUR @ 65.00 = RD$ 3,250.00 = 325000 cents
      const result = convertToDOPCents(50, "EUR", 65.0);
      expect(result).toBe(325000);
    });

    it("handles zero and invalid amounts gracefully", () => {
      expect(convertToDOPCents(0, "USD")).toBe(0);
      expect(convertToDOPCents(-50, "EUR")).toBe(0);
      expect(convertToDOPCents(NaN, "USD")).toBe(0);
    });
  });

  describe("formatForeignAmount", () => {
    it("formats USD amounts with $ symbol and USD suffix", () => {
      const formatted = formatForeignAmount(10000, "USD");
      expect(formatted).toContain("$");
      expect(formatted).toContain("100.00");
      expect(formatted).toContain("USD");
    });

    it("formats EUR amounts with € symbol and EUR suffix", () => {
      const formatted = formatForeignAmount(4550, "EUR");
      expect(formatted).toContain("€");
      expect(formatted).toContain("45.50");
      expect(formatted).toContain("EUR");
    });
  });

  describe("Currency metadata", () => {
    it("has metadata for all supported currencies", () => {
      expect(CURRENCY_SYMBOLS.DOP).toBe("RD$");
      expect(CURRENCY_SYMBOLS.USD).toBe("$");
      expect(CURRENCY_SYMBOLS.EUR).toBe("€");
      expect(CURRENCY_LABELS.DOP).toContain("Peso Dominicano");
    });
  });
});

describe("ExpenseService Multi-Currency Integration", () => {
  let serruchoId: string;
  let part1Id: string;
  let part2Id: string;

  beforeEach(async () => {
    const s = await SerruchoService.create("owner-curr", {
      name: "Viaje a Miami / Roma",
      currency: "DOP",
    });
    serruchoId = s.id;

    const p1 = await ParticipantService.add(serruchoId, {
      name: "Carlos",
      email: "carlos@test.do",
    });
    const p2 = await ParticipantService.add(serruchoId, {
      name: "Laura",
      email: "laura@test.do",
    });

    part1Id = p1.id;
    part2Id = p2.id;
  });

  it("stores foreign currency expense with base DOP conversion and full traceability", async () => {
    // Carlos paid USD 100 at rate 60.50 (RD$ 6,050.00)
    const expense = await ExpenseService.add(serruchoId, {
      description: "Cena en South Beach",
      amount: 6050, // Converted DOP amount
      paid_by_participant_id: part1Id,
      expense_date: "2026-08-20",
      split_method: "EQUAL",
      splits: [{ participant_id: part1Id }, { participant_id: part2Id }],
      original_currency: "USD",
      original_amount: 100,
      exchange_rate_used: 60.5,
    });


    expect(expense.amount_cents).toBe(605000); // RD$ 6,050.00
    expect(expense.original_currency).toBe("USD");
    expect(expense.original_amount_cents).toBe(10000); // 100.00 USD
    expect(expense.exchange_rate_used).toBe(60.5);

    // Splits must equal total DOP cents (302500 cents each)
    expect(expense.splits).toHaveLength(2);
    const sumSplits = expense.splits.reduce((acc, s) => acc + s.owed_cents, 0);
    expect(sumSplits).toBe(605000);
    expect(expense.splits[0].owed_cents).toBe(302500);
    expect(expense.splits[1].owed_cents).toBe(302500);
  });

  it("supports manual rate adjustment override and records attribution", async () => {
    const expense = await ExpenseService.add(serruchoId, {
      description: "Hotel en Roma",
      amount: 6500, // 100 EUR @ manual rate 65.00
      paid_by_participant_id: part2Id,
      expense_date: "2026-08-21",
      split_method: "EQUAL",
      splits: [{ participant_id: part1Id }, { participant_id: part2Id }],
      original_currency: "EUR",
      original_amount: 100,
      exchange_rate_used: 65.0,
      rate_adjusted_by: "manual",
      rate_adjusted_at: "2026-08-21T15:00:00.000Z",
    });

    expect(expense.original_currency).toBe("EUR");
    expect(expense.exchange_rate_used).toBe(65.0);
    expect(expense.rate_adjusted_by).toBe("manual");
    expect(expense.rate_adjusted_at).toBe("2026-08-21T15:00:00.000Z");
  });

  it("preserves currency traceability when updating other fields", async () => {
    const created = await ExpenseService.add(serruchoId, {
      description: "Supermercado Walmart",
      amount: 3025, // 50 USD @ 60.50
      paid_by_participant_id: part1Id,
      expense_date: "2026-08-22",
      split_method: "EQUAL",
      splits: [{ participant_id: part1Id }, { participant_id: part2Id }],
      original_currency: "USD",
      original_amount: 50,
      exchange_rate_used: 60.5,
    });

    // Update only description
    const updated = await ExpenseService.update(created.id, {
      description: "Supermercado Walmart Doral",
    });

    expect(updated.description).toBe("Supermercado Walmart Doral");
    expect(updated.original_currency).toBe("USD");
    expect(updated.original_amount_cents).toBe(5000);
    expect(updated.exchange_rate_used).toBe(60.5);
  });
});

