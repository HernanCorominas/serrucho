export type SerruchoStatus = "OPEN" | "CLOSED";
export type SplitMethod = "EQUAL" | "PERCENTAGE";
export type PreferredChannel = "EMAIL" | "WHATSAPP";
export type NotificationChannel = "EMAIL" | "WHATSAPP";
export type NotificationStatus = "PENDING" | "SENT" | "FAILED" | "SKIPPED";

export type ExpenseCategory =
  | "LODGING"
  | "FOOD_GROCERIES"
  | "DRINKS_ALCOHOL"
  | "FUEL_TRANSPORT"
  | "RESTAURANT"
  | "ENTERTAINMENT"
  | "OTHER";

export const CATEGORY_INFO: Record<
  ExpenseCategory,
  { label: string; emoji: string; color: string }
> = {
  LODGING: { label: "Villa / Alojamiento", emoji: "🏡", color: "bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-800" },
  FOOD_GROCERIES: { label: "Supermercado & Compras", emoji: "🛒", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800" },
  DRINKS_ALCOHOL: { label: "Bebidas & Alcohol", emoji: "🍻", color: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800" },
  FUEL_TRANSPORT: { label: "Combustible & Peajes", emoji: "⛽", color: "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800" },
  RESTAURANT: { label: "Restaurante & Cenas", emoji: "🍽️", color: "bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-800" },
  ENTERTAINMENT: { label: "Entretenimiento & Paseos", emoji: "🎉", color: "bg-indigo-500/10 text-indigo-600 border-indigo-200 dark:border-indigo-800" },
  OTHER: { label: "Otros Gastos", emoji: "📦", color: "bg-slate-500/10 text-slate-600 border-slate-200 dark:border-slate-800" },
};

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

export interface Serrucho {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  currency: string;
  event_date: string | null;
  status: SerruchoStatus;
  payment_instructions: string | null;
  payment_deadline: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Participant {
  id: string;
  serrucho_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  preferred_channel: PreferredChannel;
  user_id?: string | null;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  serrucho_id: string;
  description: string;
  amount_cents: number;
  paid_by_participant_id: string;
  expense_date: string;
  split_method: SplitMethod;
  category: ExpenseCategory;
  created_at: string;
  updated_at: string;
}

export interface ExpenseParticipant {
  expense_id: string;
  participant_id: string;
  percentage_basis_points: number | null;
  owed_cents: number;
}

export interface SettlementSnapshot {
  id: string;
  serrucho_id: string;
  participant_id: string;
  total_expenses_cents: number;
  owed_cents: number;
  paid_cents: number;
  balance_cents: number; // positive = receives, negative = owes
  payment_instructions: string | null;
  payment_deadline: string | null;
  public_token_hash: string;
  is_paid: boolean;
  paid_at: string | null;
  created_at: string;
}

export interface SettlementItem {
  id: string;
  snapshot_id: string;
  expense_id: string | null;
  description: string;
  paid_by_name: string;
  amount_cents: number;
  participant_owed_cents: number;
}

export interface NotificationLog {
  id: string;
  serrucho_id: string;
  participant_id: string;
  snapshot_id: string | null;
  channel: NotificationChannel;
  destination_masked: string;
  status: NotificationStatus;
  provider_message_id: string | null;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

// Optimization & Calculation Types
export interface SimplifiedTransfer {
  from_participant_id: string;
  from_name: string;
  to_participant_id: string;
  to_name: string;
  amount_cents: number;
}

export interface CategoryTotal {
  category: ExpenseCategory;
  total_cents: number;
  percentage: number;
  expense_count: number;
}

// Composite types for UI and Services
export interface ParticipantFinancials extends Participant {
  total_paid_cents: number;
  total_owed_cents: number;
  net_balance_cents: number;
}

export interface ExpenseWithSplits extends Expense {
  paid_by_name: string;
  splits: (ExpenseParticipant & { participant_name: string })[];
}

export interface PublicSettlementReceipt {
  snapshot: SettlementSnapshot;
  participant: Participant;
  serrucho: {
    name: string;
    description: string | null;
    event_date: string | null;
    currency: string;
    closed_at: string | null;
  };
  items: SettlementItem[];
}

export interface CoroAward {
  id: string;
  title: string;
  emoji: string;
  subtitle: string;
  winner_name: string;
  metric: string;
  color: string;
}

export interface ItemizedExpenseLine {
  id: string;
  name: string;
  amountCents: number;
  assignedParticipantIds: string[];
}

export interface ItemizedSplitResult {
  totalSubtotalCents: number;
  itbisCents: number;
  serviceCents: number;
  tipCents: number;
  totalFinalCents: number;
  participantTotals: {
    participantId: string;
    subtotalCents: number;
    taxesAndTipCents: number;
    totalOwedCents: number;
    basisPoints: number;
  }[];
}


