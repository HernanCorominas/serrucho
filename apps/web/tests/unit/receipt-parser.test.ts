import { describe, it, expect } from "vitest";
import { parseReceiptText } from "@serrucho/core";

describe("Receipt Parser Engine", () => {
  it("correctly parses a standard Dominican restaurant receipt", () => {
    const rawReceipt = `
      RESTAURANTE EL CONUCO
      1 Chivo Liniero 850.00
      2 Presidente Grande 700.00
      1 Tostones con Ajo 250.00
      SUBTOTAL 1800.00
      18% ITBIS 324.00
      10% Propina Legal 180.00
      TOTAL 2304.00
    `;

    const result = parseReceiptText(rawReceipt);

    expect(result.items.length).toBe(3);
    expect(result.items[0].name).toContain("Chivo Liniero");
    expect(result.items[0].totalCents).toBe(85000);
    expect(result.items[1].name).toContain("Presidente Grande");
    expect(result.items[1].quantity).toBe(2);
    expect(result.items[1].totalCents).toBe(70000);

    expect(result.subtotalCents).toBe(180000);
    expect(result.taxCents).toBe(32400);
    expect(result.tipCents).toBe(18000);
    expect(result.totalCents).toBe(230400);
  });

  it("handles receipt text without explicit totals by summing lines", () => {
    const rawReceipt = `
      Mofongo Mixto 650.00
      Jugo de Chinola 150.00
    `;

    const result = parseReceiptText(rawReceipt);

    expect(result.items.length).toBe(2);
    expect(result.subtotalCents).toBe(80000);
    expect(result.totalCents).toBe(80000);
  });
});
