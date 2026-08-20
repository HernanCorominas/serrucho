export type SerruchoStatus = "OPEN" | "CLOSED";
export type SplitMethod = "EQUAL" | "PERCENTAGE";
export type PreferredChannel = "EMAIL" | "WHATSAPP";
export type NotificationChannel = "EMAIL" | "WHATSAPP";
export type NotificationStatus = "PENDING" | "SENT" | "FAILED" | "SKIPPED";

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
