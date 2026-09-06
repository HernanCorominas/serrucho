/**
 * Serrucho Financial Engine
 * All monetary calculations are performed in integer cents to prevent floating point inaccuracies.
 */

import { ExpenseCategory, SimplifiedTransfer, CategoryTotal, CATEGORY_INFO } from "../types/domain";

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
 * Calculates voluntary tip amount in integer cents from base cents and percentage.
 */
export function calculateTip(amountCents: number, tipPercentage: number): number {
  if (amountCents <= 0 || tipPercentage <= 0) return 0;
  return Math.round(amountCents * (tipPercentage / 100));
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

/**
 * Splits an expense by exact individual amounts per participant.
 * Validates that the sum of individual cents equals totalCents exactly.
 */
export function splitByExactAmounts(
  totalCents: number,
  splits: { participantId: string; amountCents: number }[]
): SplitResult[] {
  if (!splits.length || totalCents <= 0) {
    return splits.map((s) => ({
      participantId: s.participantId,
      owedCents: 0,
    }));
  }

  const sumCents = splits.reduce((acc, s) => acc + s.amountCents, 0);
  if (sumCents !== totalCents) {
    throw new Error(
      `La suma de los montos individuales (${fromCents(sumCents)}) debe ser exactamente igual al monto total (${fromCents(totalCents)})`
    );
  }

  return splits.map((s) => ({
    participantId: s.participantId,
    owedCents: s.amountCents,
  }));
}

/**
 * Splits an expense by relative shares/weights (e.g. 1 share for singles, 2 for couples, 0.5 for kids).
 * Handles floating/decimal shares and deterministically allocates rounding cents to prevent penny loss.
 */
export function splitByShares(
  totalCents: number,
  splits: { participantId: string; shares: number }[]
): SplitResult[] {
  if (!splits.length || totalCents <= 0) {
    return splits.map((s) => ({
      participantId: s.participantId,
      owedCents: 0,
    }));
  }

  const totalShares = splits.reduce((sum, s) => sum + (s.shares > 0 ? s.shares : 0), 0);
  if (totalShares <= 0) {
    throw new Error("El total de cuotas / shares debe ser mayor a 0");
  }

  // Calculate base share in cents and keep fractional remainder
  const calculated = splits.map((s) => {
    const rawExact = (totalCents * (s.shares > 0 ? s.shares : 0)) / totalShares;
    const baseCents = Math.floor(rawExact);
    const fractionalRemainder = rawExact - baseCents;
    return {
      participantId: s.participantId,
      shares: s.shares,
      baseCents,
      fractionalRemainder,
    };
  });

  const sumBaseCents = calculated.reduce((sum, item) => sum + item.baseCents, 0);
  const remainderCents = totalCents - sumBaseCents;

  // Sort by highest fractional remainder, then participantId for determinism
  const sortedByFraction = [...calculated].sort((a, b) => {
    if (Math.abs(b.fractionalRemainder - a.fractionalRemainder) > 0.00001) {
      return b.fractionalRemainder - a.fractionalRemainder;
    }
    return a.participantId.localeCompare(b.participantId);
  });

  const bonusIds = new Set<string>();
  for (let i = 0; i < remainderCents; i++) {
    bonusIds.add(sortedByFraction[i].participantId);
  }

  return calculated.map((item) => ({
    participantId: item.participantId,
    owedCents: item.baseCents + (bonusIds.has(item.participantId) ? 1 : 0),
    percentageBasisPoints: Math.round((item.shares / totalShares) * 10000),
  }));
}

export interface ParticipantFinancialSummary {
  participantId: string;
  totalPaidCents: number;
  totalOwedCents: number;
  netBalanceCents: number; // positive = receives, negative = owes
}

/**
 * Computes the complete net balance summary for all participants given expenses, allocations, direct transfers, and incomes/refunds.
 */
export function calculateNetBalances(
  participantIds: string[],
  expenses: {
    paidByParticipantId: string;
    amountCents: number;
    splits: { participantId: string; owedCents: number }[];
  }[],
  transfers: {
    senderParticipantId: string;
    receiverParticipantId: string;
    amountCents: number;
  }[] = [],
  incomes: {
    receivedByParticipantId: string;
    amountCents: number;
    splits: { participantId: string; creditCents: number }[];
  }[] = []
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

  // Aggregate payments and owed amounts from expenses
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

  // Aggregate direct transfers between participants
  for (const tr of transfers) {
    const sender = summaryMap.get(tr.senderParticipantId);
    if (sender) {
      sender.totalPaidCents += tr.amountCents;
    }

    const receiver = summaryMap.get(tr.receiverParticipantId);
    if (receiver) {
      receiver.totalOwedCents += tr.amountCents;
    }
  }

  // Aggregate group incomes & refunds (e.g. deposit return, supplier refund)
  for (const inc of incomes) {
    // The participant who received the income in hand owes that amount to the group
    const receiver = summaryMap.get(inc.receivedByParticipantId);
    if (receiver) {
      receiver.totalOwedCents += inc.amountCents;
    }

    // Each beneficiary gets a credit reducing their net cost / increasing their balance
    for (const split of inc.splits) {
      const beneficiary = summaryMap.get(split.participantId);
      if (beneficiary) {
        beneficiary.totalPaidCents += split.creditCents;
      }
    }
  }

  // Compute net balances: balance = paid - owed
  for (const summary of summaryMap.values()) {
    summary.netBalanceCents = summary.totalPaidCents - summary.totalOwedCents;
  }

  return summaryMap;
}

/**
 * Min-Cash-Flow Debt Simplification Algorithm
 * Transforms N complex cross-payments into the minimum possible number of peer-to-peer transfers.
 */
export function simplifyDebts(
  participants: { id: string; name: string }[],
  netBalances:
    | Map<string, number>
    | Map<string, ParticipantFinancialSummary>
    | { id: string; net_balance_cents: number; name: string }[]
): SimplifiedTransfer[] {
  const nameMap = new Map<string, string>();
  participants.forEach((p) => nameMap.set(p.id, p.name));

  // Extract positive and negative balance lists
  const debtors: { id: string; name: string; amount: number }[] = [];
  const creditors: { id: string; name: string; amount: number }[] = [];

  if (Array.isArray(netBalances)) {
    netBalances.forEach((p) => {
      nameMap.set(p.id, p.name);
      if (p.net_balance_cents < 0) {
        debtors.push({ id: p.id, name: p.name, amount: Math.abs(p.net_balance_cents) });
      } else if (p.net_balance_cents > 0) {
        creditors.push({ id: p.id, name: p.name, amount: p.net_balance_cents });
      }
    });
  } else {
    netBalances.forEach((val: any, id: string) => {
      const balance =
        typeof val === "number"
          ? val
          : typeof val?.netBalanceCents === "number"
          ? val.netBalanceCents
          : typeof val?.net_balance_cents === "number"
          ? val.net_balance_cents
          : 0;
      const name = nameMap.get(id) || val?.name || "Participante";
      if (balance < 0) {
        debtors.push({ id, name, amount: Math.abs(balance) });
      } else if (balance > 0) {
        creditors.push({ id, name, amount: balance });
      }
    });
  }

  const transfers: SimplifiedTransfer[] = [];

  // Sort debtors and creditors descending by amount, with secondary sort by ID for 100% determinism
  debtors.sort((a, b) => {
    if (b.amount !== a.amount) return b.amount - a.amount;
    return a.id.localeCompare(b.id);
  });
  creditors.sort((a, b) => {
    if (b.amount !== a.amount) return b.amount - a.amount;
    return a.id.localeCompare(b.id);
  });

  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const transferAmount = Math.min(debtor.amount, creditor.amount);

    if (transferAmount > 0) {
      transfers.push({
        from_participant_id: debtor.id,
        from_name: debtor.name,
        to_participant_id: creditor.id,
        to_name: creditor.name,
        amount_cents: transferAmount,
      });

      debtor.amount -= transferAmount;
      creditor.amount -= transferAmount;
    }

    if (debtor.amount === 0) dIdx++;
    if (creditor.amount === 0) cIdx++;
  }

  return transfers;
}

/**
 * Calculates category breakdown statistics for a set of expenses.
 */
export function calculateCategoryTotals(
  expenses: { amount_cents: number; category?: ExpenseCategory }[]
): CategoryTotal[] {
  const totalSpend = expenses.reduce((sum, e) => sum + e.amount_cents, 0);
  const map = new Map<ExpenseCategory, { total_cents: number; count: number }>();

  // Initialize with all known categories
  (Object.keys(CATEGORY_INFO) as ExpenseCategory[]).forEach((cat) => {
    map.set(cat, { total_cents: 0, count: 0 });
  });

  expenses.forEach((e) => {
    const cat = e.category || "OTHER";
    const current = map.get(cat) || { total_cents: 0, count: 0 };
    current.total_cents += e.amount_cents;
    current.count += 1;
    map.set(cat, current);
  });

  const results: CategoryTotal[] = [];
  map.forEach((val, key) => {
    if (val.count > 0 || val.total_cents > 0) {
      results.push({
        category: key,
        total_cents: val.total_cents,
        expense_count: val.count,
        percentage: totalSpend > 0 ? Number(((val.total_cents / totalSpend) * 100).toFixed(1)) : 0,
      });
    }
  });

  return results.sort((a, b) => b.total_cents - a.total_cents);
}

/**
 * Generates an authentic Dominican WhatsApp direct share text for debt collection.
 */
export function generateWhatsAppDirectLink(params: {
  phone?: string | null;
  serruchoName: string;
  participantName: string;
  balanceCents: number;
  publicUrl: string;
  paymentInstructions?: string | null;
}): string {
  const isDebtor = params.balanceCents < 0;
  const isCreditor = params.balanceCents > 0;
  const amountStr = formatDOP(Math.abs(params.balanceCents));

  let message = "";
  if (isDebtor) {
    message =
      `¡Dímelo ${params.participantName}! 🌴\n\n` +
      `Te comparto el estado de cuenta final del serrucho *${params.serruchoName}*.\n\n` +
      `💰 *Tu balance pendiente es:* ${amountStr}\n\n` +
      (params.paymentInstructions
        ? `🏦 *Datos para transferir:*\n${params.paymentInstructions}\n\n`
        : "") +
      `📄 *Revisa tu estado de cuenta detallado aquí:*\n${params.publicUrl}\n\n` +
      `¡Gracias por ser parte del coro! 🪚🇩🇴`;
  } else if (isCreditor) {
    message =
      `¡Dímelo ${params.participantName}! 🌴\n\n` +
      `Ya cerramos el serrucho *${params.serruchoName}*.\n\n` +
      `✅ *Tienes un saldo a tu favor de:* ${amountStr}\n\n` +
      `📄 *Revisa el comprobante aquí:*\n${params.publicUrl}\n\n` +
      `¡Gracias por armar la logística! 🪚🇩🇴`;
  } else {
    message =
      `¡Hola ${params.participantName}! 🌴\n\n` +
      `El serrucho *${params.serruchoName}* ha sido cerrado y estás completamente al día (RD$ 0.00).\n\n` +
      `📄 *Revisa el resumen aquí:*\n${params.publicUrl}`;
  }

  const encodedMessage = encodeURIComponent(message);
  let cleanPhone = (params.phone || "").replace(/[^0-9]/g, "");

  // Default Dominican area code if only 10 digits
  if (cleanPhone.length === 10 && (cleanPhone.startsWith("809") || cleanPhone.startsWith("829") || cleanPhone.startsWith("849"))) {
    cleanPhone = `1${cleanPhone}`;
  }

  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  }

  return `https://wa.me/?text=${encodedMessage}`;
}

/**
 * Generates an all-in-one group summary text ready to paste into WhatsApp group chat.
 */
export function generateGroupWhatsAppSummary(params: {
  serruchoName: string;
  totalExpensesCents: number;
  transfers: SimplifiedTransfer[];
  closedAt?: string | null;
}): string {
  let text =
    `🌴 *SERRUCHO: ${params.serruchoName}* 🪚\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `💰 *Gasto Total del Coro:* ${formatDOP(params.totalExpensesCents)}\n` +
    (params.closedAt ? `🔒 *Cerrado el:* ${new Date(params.closedAt).toLocaleDateString("es-DO")}\n\n` : "\n") +
    `📊 *TRANSFERENCIAS SUGERIDAS (Menos Transferencias):*\n`;

  if (params.transfers.length === 0) {
    text += `✅ ¡No hay transferencias pendientes! Todos están al día.\n`;
  } else {
    params.transfers.forEach((t) => {
      text += `• *${t.from_name}* le transfiere a *${t.to_name}*: ${formatDOP(t.amount_cents)}\n`;
    });
  }

  text += `━━━━━━━━━━━━━━━━━━━━━━\n` + `🇩🇴 _Cuentas claras conservan amistades con Serrucho_`;
  return text;
}

/**
 * Calculates fun, engaging gamification awards for the group ("Premios del Coro").
 */
/**
 * Calculates complete ParticipantFinancials list with paid, owed, and net balance.
 */

export function calculateParticipantBalances(
  participants: import("../types/domain").Participant[],
  expenses: import("../types/domain").ExpenseWithSplits[],
  transfers: {
    senderParticipantId?: string;
    sender_participant_id?: string;
    receiverParticipantId?: string;
    receiver_participant_id?: string;
    amountCents?: number;
    amount_cents?: number;
  }[] = [],
  incomes: any[] = []
): import("../types/domain").ParticipantFinancials[] {
  const normalizedTransfers = transfers.map((t) => ({
    senderParticipantId: t.senderParticipantId || t.sender_participant_id || "",
    receiverParticipantId: t.receiverParticipantId || t.receiver_participant_id || "",
    amountCents: t.amountCents ?? t.amount_cents ?? 0,
  }));

  const normalizedIncomes = incomes.map((inc) => ({
    receivedByParticipantId: inc.receivedByParticipantId || inc.received_by_participant_id || "",
    amountCents: inc.amountCents ?? inc.amount_cents ?? 0,
    splits: (inc.splits || []).map((s: any) => ({
      participantId: s.participantId || s.participant_id || "",
      creditCents: s.creditCents ?? s.credit_cents ?? 0,
    })),
  }));

  const map = calculateNetBalances(
    participants.map((p) => p.id),
    expenses.map((e) => ({
      paidByParticipantId: e.paid_by_participant_id,
      amountCents: e.amount_cents,
      splits: (e.splits || []).map((s) => ({
        participantId: s.participant_id,
        owedCents: s.owed_cents,
      })),
    })),
    normalizedTransfers,
    normalizedIncomes
  );

  return participants.map((p) => {
    const sum = map.get(p.id) || { totalPaidCents: 0, totalOwedCents: 0, netBalanceCents: 0 };
    return {
      ...p,
      total_paid_cents: sum.totalPaidCents,
      total_owed_cents: sum.totalOwedCents,
      net_balance_cents: sum.netBalanceCents,
    };
  });
}




