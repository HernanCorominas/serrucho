import { toCents } from "./math";

export interface ParsedReceiptLine {
  id: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
}

export interface ParsedReceiptResult {
  items: ParsedReceiptLine[];
  subtotalCents: number;
  taxCents: number;
  tipCents: number;
  totalCents: number;
  rawText: string;
}

/**
 * Intelligent receipt text parser (Zero-cost client-side engine)
 * Extracts dishes, drinks, prices, ITBIS, and totals from camera/OCR text.
 */
export function parseReceiptText(text: string): ParsedReceiptResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const items: ParsedReceiptLine[] = [];
  let subtotalCents = 0;
  let taxCents = 0;
  let tipCents = 0;
  let totalCents = 0;

  // Regex to match a price at the end of a line (e.g. 450.00, 1,200.50, $850, RD$300)
  const priceRegex = /(?:RD\$|\$)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})|[0-9]+(?:\.[0-9]{1,2})?)\s*$/i;
  // Regex to match quantity prefix (e.g. "2x", "3 x", "1 ")
  const qtyRegex = /^([0-9]+)\s*[xX*]?\s+(.+)/;

  for (const line of lines) {
    const lower = line.toLowerCase();

    // Check for tax / ITBIS keywords
    if (lower.includes("itbis") || lower.includes("tax") || lower.includes("iva")) {
      const match = line.match(priceRegex);
      if (match && match[1]) {
        taxCents = toCents(match[1]);
      }
      continue;
    }

    // Check for tip / 10% ley
    if (lower.includes("propina") || lower.includes("ley") || lower.includes("service") || lower.includes("tip")) {
      const match = line.match(priceRegex);
      if (match && match[1]) {
        tipCents = toCents(match[1]);
      }
      continue;
    }

    // Check for total keywords
    if (lower.includes("total") || lower.includes("monto final") || lower.includes("balance")) {
      const match = line.match(priceRegex);
      if (match && match[1]) {
        totalCents = toCents(match[1]);
      }
      continue;
    }

    // Check for subtotal
    if (lower.includes("subtotal") || lower.includes("sub-total")) {
      const match = line.match(priceRegex);
      if (match && match[1]) {
        subtotalCents = toCents(match[1]);
      }
      continue;
    }

    // Check for standard line item with price
    const match = line.match(priceRegex);
    if (match && match[1]) {
      const priceStr = match[1];
      const parsedCents = toCents(priceStr);

      if (parsedCents > 0) {
        let name = line.substring(0, line.lastIndexOf(priceStr)).replace(/(?:RD\$|\$|-|:|\.|\s)+$/, "").trim();
        let quantity = 1;

        // Check if there is a quantity indicator
        const qtyMatch = name.match(qtyRegex);
        if (qtyMatch && qtyMatch[1] && qtyMatch[2]) {
          quantity = parseInt(qtyMatch[1], 10) || 1;
          name = qtyMatch[2].trim();
        }

        if (name.length > 1) {
          items.push({
            id: `item-${Date.now()}-${items.length}`,
            name,
            quantity,
            unitPriceCents: Math.round(parsedCents / quantity),
            totalCents: parsedCents,
          });
        }
      }
    }
  }

  // If subtotal wasn't explicitly found, sum the parsed items
  const itemsSum = items.reduce((sum, i) => sum + i.totalCents, 0);
  if (subtotalCents === 0 && itemsSum > 0) {
    subtotalCents = itemsSum;
  }

  // If total wasn't explicitly found, calculate it
  if (totalCents === 0) {
    totalCents = subtotalCents + taxCents + tipCents;
  }

  return {
    items,
    subtotalCents,
    taxCents,
    tipCents,
    totalCents,
    rawText: text,
  };
}
