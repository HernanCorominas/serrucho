/**
 * Serrucho Financial Engine
 * All monetary calculations are performed in integer cents to prevent floating point inaccuracies.
 */

import { ExpenseCategory, SimplifiedTransfer, CategoryTotal, CATEGORY_INFO } from "@/lib/types/domain";

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
 * Computes the complete net balance summary for all participants given expenses, allocations, and direct transfers.
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
  netBalances: Map<string, number> | { id: string; net_balance_cents: number; name: string }[]
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
    netBalances.forEach((balance, id) => {
      const name = nameMap.get(id) || "Participante";
      if (balance < 0) {
        debtors.push({ id, name, amount: Math.abs(balance) });
      } else if (balance > 0) {
        creditors.push({ id, name, amount: balance });
      }
    });
  }

  const transfers: SimplifiedTransfer[] = [];

  // Sort debtors and creditors descending by amount
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

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
export function calculateCoroAwards(params: {
  participants: { id: string; name: string; total_paid_cents: number; total_owed_cents: number; net_balance_cents: number }[];
  expenses: { id: string; description: string; amount_cents: number; paid_by_participant_id: string; category?: string }[];
}): import("@/lib/types/domain").CoroAward[] {
  const awards: import("@/lib/types/domain").CoroAward[] = [];
  if (!params.participants.length || !params.expenses.length) return awards;

  const partMap = new Map(params.participants.map((p) => [p.id, p]));

  // 1. El Financiero del Viaje (Quien más pagó)
  const topPayer = [...params.participants].sort((a, b) => b.total_paid_cents - a.total_paid_cents)[0];
  if (topPayer && topPayer.total_paid_cents > 0) {
    awards.push({
      id: "top-payer",
      title: "El Financiero del Viaje",
      emoji: "👑",
      subtitle: "Aportó más capital de su bolsillo para el grupo",
      winner_name: topPayer.name,
      metric: formatDOP(topPayer.total_paid_cents),
      color: "from-amber-500/20 to-orange-500/10 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200",
    });
  }

  // 2. El Barman del Coro (Quien pagó más en Bebidas & Alcohol)
  const drinkExpenses = params.expenses.filter((e) => e.category === "DRINKS_ALCOHOL");
  if (drinkExpenses.length > 0) {
    const drinkPaidBy = new Map<string, number>();
    drinkExpenses.forEach((e) => {
      drinkPaidBy.set(e.paid_by_participant_id, (drinkPaidBy.get(e.paid_by_participant_id) || 0) + e.amount_cents);
    });
    let topDrinkPayerId = "";
    let maxDrink = 0;
    drinkPaidBy.forEach((amount, pid) => {
      if (amount > maxDrink) {
        maxDrink = amount;
        topDrinkPayerId = pid;
      }
    });
    if (topDrinkPayerId && maxDrink > 0) {
      awards.push({
        id: "barman",
        title: "El Barman Oficial",
        emoji: "🍻",
        subtitle: "Financió las bebidas y los brindis del coro",
        winner_name: partMap.get(topDrinkPayerId)?.name || "Participante",
        metric: formatDOP(maxDrink),
        color: "from-rose-500/20 to-pink-500/10 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200",
      });
    }
  }

  // 3. El Abastecedor (Quien pagó más en Supermercado / Comida)
  const foodExpenses = params.expenses.filter((e) => e.category === "FOOD_GROCERIES" || e.category === "LODGING");
  if (foodExpenses.length > 0) {
    const foodPaidBy = new Map<string, number>();
    foodExpenses.forEach((e) => {
      foodPaidBy.set(e.paid_by_participant_id, (foodPaidBy.get(e.paid_by_participant_id) || 0) + e.amount_cents);
    });
    let topFoodPayerId = "";
    let maxFood = 0;
    foodPaidBy.forEach((amount, pid) => {
      if (amount > maxFood) {
        maxFood = amount;
        topFoodPayerId = pid;
      }
    });
    if (topFoodPayerId && maxFood > 0) {
      awards.push({
        id: "supplier",
        title: "El Abastecedor Mayor",
        emoji: "🛒",
        subtitle: "Garantizó la villa y los víveres para todos",
        winner_name: partMap.get(topFoodPayerId)?.name || "Participante",
        metric: formatDOP(maxFood),
        color: "from-emerald-500/20 to-teal-500/10 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200",
      });
    }
  }

  // 4. El Mayor Deudor (Quien debe el mayor monto)
  const debtors = params.participants.filter((p) => p.net_balance_cents < 0);
  if (debtors.length > 0) {
    const topDebtor = [...debtors].sort((a, b) => a.net_balance_cents - b.net_balance_cents)[0];
    if (topDebtor) {
      awards.push({
        id: "top-debtor",
        title: "El Deudor VIP",
        emoji: "💨",
        subtitle: "Tiene el mayor saldo pendiente por transferir",
        winner_name: topDebtor.name,
        metric: formatDOP(Math.abs(topDebtor.net_balance_cents)),
        color: "from-blue-500/20 to-indigo-500/10 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-200",
      });
    }
  }

  // 5. El Gasto Chipi-Chipi (El gasto individual más pequeño)
  if (params.expenses.length > 1) {
    const smallestExpense = [...params.expenses].sort((a, b) => a.amount_cents - b.amount_cents)[0];
    if (smallestExpense) {
      awards.push({
        id: "smallest-expense",
        title: "El Gasto Chipi-Chipi",
        emoji: "🔍",
        subtitle: `"${smallestExpense.description}" fue el menor gasto anotado`,
        winner_name: partMap.get(smallestExpense.paid_by_participant_id)?.name || "Participante",
        metric: formatDOP(smallestExpense.amount_cents),
        color: "from-slate-500/20 to-zinc-500/10 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200",
      });
    }
  }

  return awards;
}

/**
 * Calculates itemized bill breakdown (e.g. restaurant dish by dish)
 * and prorates ITBIS (18%), Ley (10%) and voluntary tip to each person's exact consumption.
 */
export function calculateItemizedSplits(params: {
  lines: import("@/lib/types/domain").ItemizedExpenseLine[];
  participantIds: string[];
  itbisPercent?: number; // default 18
  servicePercent?: number; // default 10
  customTipCents?: number;
}): import("@/lib/types/domain").ItemizedSplitResult {
  const { lines, participantIds } = params;
  const itbisPercent = params.itbisPercent ?? 18;
  const servicePercent = params.servicePercent ?? 10;
  const customTipCents = params.customTipCents ?? 0;

  // Initialize subtotals for each participant
  const subtotalMap = new Map<string, number>();
  participantIds.forEach((id) => subtotalMap.set(id, 0));

  let totalSubtotalCents = 0;

  lines.forEach((line) => {
    if (line.amountCents <= 0 || !line.assignedParticipantIds.length) return;
    totalSubtotalCents += line.amountCents;

    const splits = splitEqually(line.amountCents, line.assignedParticipantIds);
    splits.forEach((s) => {
      subtotalMap.set(s.participantId, (subtotalMap.get(s.participantId) || 0) + s.owedCents);
    });
  });

  const itbisCents = Math.round(totalSubtotalCents * (itbisPercent / 100));
  const serviceCents = Math.round(totalSubtotalCents * (servicePercent / 100));
  const totalExtraCents = itbisCents + serviceCents + customTipCents;
  const totalFinalCents = totalSubtotalCents + totalExtraCents;

  const participantTotals = participantIds.map((id) => {
    const subtotal = subtotalMap.get(id) || 0;
    const ratio = totalSubtotalCents > 0 ? subtotal / totalSubtotalCents : 0;
    const taxesAndTip = Math.round(totalExtraCents * ratio);
    const totalOwed = subtotal + taxesAndTip;
    const basisPoints = totalFinalCents > 0 ? Math.round((totalOwed / totalFinalCents) * 10000) : 0;

    return {
      participantId: id,
      subtotalCents: subtotal,
      taxesAndTipCents: taxesAndTip,
      totalOwedCents: totalOwed,
      basisPoints,
    };
  });

  // Adjust any rounding drift on basisPoints to sum exactly 10,000 if totalFinalCents > 0
  if (totalFinalCents > 0 && participantTotals.some((p) => p.totalOwedCents > 0)) {
    const sumBp = participantTotals.reduce((sum, p) => sum + p.basisPoints, 0);
    const diff = 10000 - sumBp;
    if (diff !== 0) {
      // Add/subtract diff from participant with largest owed
      const highest = [...participantTotals].sort((a, b) => b.totalOwedCents - a.totalOwedCents)[0];
      if (highest) {
        highest.basisPoints += diff;
      }
    }
  }

  return {
    totalSubtotalCents,
    itbisCents,
    serviceCents,
    tipCents: customTipCents,
    totalFinalCents,
    participantTotals,
  };
}

/**
 * Calculates complete ParticipantFinancials list with paid, owed, and net balance.
 */
export function calculateParticipantBalances(
  participants: import("@/lib/types/domain").Participant[],
  expenses: import("@/lib/types/domain").ExpenseWithSplits[]
): import("@/lib/types/domain").ParticipantFinancials[] {
  const map = calculateNetBalances(
    participants.map((p) => p.id),
    expenses.map((e) => ({
      paidByParticipantId: e.paid_by_participant_id,
      amountCents: e.amount_cents,
      splits: e.splits.map((s) => ({
        participantId: s.participant_id,
        owedCents: s.owed_cents,
      })),
    }))
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
