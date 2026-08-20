/**
 * Serrucho Financial Engine
 * All monetary calculations are performed in integer cents to prevent floating point inaccuracies.
 */

export interface SplitParticipantInput {
  participantId: string;
  basisPoints?: number; // 10000 = 100.00%
}

export interface SplitResult {
  participantId: string;
  owedCents: number;
  percentageBasisPoints?: number;
}

/**
 * Converts a currency amount (number or string, e.g. 12.50 or "12.50") to integer cents.
 */
export function toCents(amount: number | string): number {
  if (typeof amount === "string") {
    const clean = amount.replace(/[^0-9.-]+/g, "");
    const parsed = parseFloat(clean);
    if (isNaN(parsed)) return 0;
    return Math.round(parsed * 100);
  }
  if (isNaN(amount)) return 0;
  return Math.round(amount * 100);
}

/**
 * Converts integer cents back to decimal number (e.g. 1250 -> 12.50).
 */
export function fromCents(cents: number): number {
  return cents / 100;
}

/**
 * Formats integer cents into Dominican Pesos (DOP / RD$).
 */
export function formatDOP(cents: number, includeSign: boolean = false): string {
  const amount = fromCents(cents);
  const formatted = new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  // Replace default DOP with RD$ for authentic Dominican feel
  const standard = formatted.replace("DOP", "RD$").trim();

  if (includeSign) {
    if (cents > 0) return `+${standard}`;
    if (cents < 0) return `-${standard}`;
  }

  return cents < 0 ? `-${standard}` : standard;
}

/**
 * Splits an expense equitably among specified participants.
 * Deterministically distributes leftover cents (total % count) to the first N participants.
 */
export function splitEqually(
  totalCents: number,
  participantIds: string[]
): SplitResult[] {
  if (!participantIds.length || totalCents <= 0) {
    return participantIds.map((id) => ({ participantId: id, owedCents: 0 }));
  }

  const count = participantIds.length;
  const baseShare = Math.floor(totalCents / count);
  const remainder = totalCents % count;

  // Sort participant IDs to guarantee deterministic distribution regardless of input order
  const sortedIds = [...participantIds].sort();

  return sortedIds.map((id, index) => {
    // The first `remainder` participants get 1 extra cent
    const owedCents = baseShare + (index < remainder ? 1 : 0);
    return {
      participantId: id,
      owedCents,
    };
  });
}

/**
 * Splits an expense by percentage basis points (100% = 10,000 basis points).
 * Validates that sum of basis points equals 10,000.
 * Leftover rounding cents are assigned to participants with largest remainder.
 */
export function splitByPercentage(
  totalCents: number,
  participants: { participantId: string; basisPoints: number }[]
): SplitResult[] {
  if (!participants.length || totalCents <= 0) {
    return participants.map((p) => ({
      participantId: p.participantId,
      owedCents: 0,
      percentageBasisPoints: p.basisPoints,
    }));
  }

  const totalBasisPoints = participants.reduce((sum, p) => sum + p.basisPoints, 0);
  if (totalBasisPoints !== 10000) {
    throw new Error(
      `La suma de porcentajes debe ser exactamente 100% (10,000 bps). Actual: ${totalBasisPoints / 100}%`
    );
  }

  // Calculate base shares and track decimal fractional remainders for exact penny allocation
  const calculated = participants.map((p) => {
    const rawExact = (totalCents * p.basisPoints) / 10000;
    const baseCents = Math.floor(rawExact);
    const fractionalPart = rawExact - baseCents;
    return {
      participantId: p.participantId,
      percentageBasisPoints: p.basisPoints,
      baseCents,
      fractionalPart,
    };
  });

  const allocatedCents = calculated.reduce((sum, c) => sum + c.baseCents, 0);
  const remainingCents = totalCents - allocatedCents;

  // Sort by highest fractional remainder first, then by participantId for determinism
  const sortedByFraction = [...calculated].sort((a, b) => {
    if (b.fractionalPart !== a.fractionalPart) {
      return b.fractionalPart - a.fractionalPart;
    }
    return a.participantId.localeCompare(b.participantId);
  });

  const bonusIds = new Set<string>();
  for (let i = 0; i < remainingCents; i++) {
    bonusIds.add(sortedByFraction[i].participantId);
  }

  return calculated.map((item) => ({
    participantId: item.participantId,
    owedCents: item.baseCents + (bonusIds.has(item.participantId) ? 1 : 0),
    percentageBasisPoints: item.percentageBasisPoints,
  }));
}

export interface ParticipantFinancialSummary {
  participantId: string;
  totalPaidCents: number;
  totalOwedCents: number;
  netBalanceCents: number; // positive = receives, negative = owes
}

/**
 * Computes the complete net balance summary for all participants given expenses and allocations.
 */
export function calculateNetBalances(
  participantIds: string[],
  expenses: {
    paidByParticipantId: string;
    amountCents: number;
    splits: { participantId: string; owedCents: number }[];
  }[]
): Map<string, ParticipantFinancialSummary> {
  const summaryMap = new Map<string, ParticipantFinancialSummary>();

  // Initialize map
  for (const id of participantIds) {
    summaryMap.set(id, {
      participantId: id,
      totalPaidCents: 0,
      totalOwedCents: 0,
      netBalanceCents: 0,
    });
  }

  // Aggregate payments and owed amounts
  for (const exp of expenses) {
    // Add to payer's paid amount
    const payer = summaryMap.get(exp.paidByParticipantId);
    if (payer) {
      payer.totalPaidCents += exp.amountCents;
    }

    // Add to each participant's owed amount
    for (const split of exp.splits) {
      const debtor = summaryMap.get(split.participantId);
      if (debtor) {
        debtor.totalOwedCents += split.owedCents;
      }
    }
  }

  // Compute net balances: balance = paid - owed
  for (const summary of summaryMap.values()) {
    summary.netBalanceCents = summary.totalPaidCents - summary.totalOwedCents;
  }

  return summaryMap;
}
