export type SerruchoStatus = "OPEN" | "CLOSED";
export type SplitMethod = "EQUAL" | "PERCENTAGE" | "EXACT" | "SHARES";
export type PreferredChannel = "EMAIL" | "WHATSAPP";

export type NotificationChannel = "EMAIL" | "WHATSAPP";
export type NotificationStatus = "PENDING" | "SENT" | "FAILED" | "SKIPPED";

export type ExpenseCategory =
  | "RENT_HOUSING"
  | "ACCOMMODATION"
  | "LODGING"
  | "GROCERIES"
  | "FOOD_GROCERIES"
  | "RESTAURANTS_DELIVERY"
  | "RESTAURANT"
  | "TRANSPORTATION"
  | "GAS_FUEL"
  | "FUEL_TRANSPORT"
  | "HOME_UTILITIES"
  | "INTERNET_TELECOM"
  | "HEALTH_MEDICAL"
  | "ENTERTAINMENT"
  | "SHOPPING"
  | "PERSONAL_CARE"
  | "FEES_CHARGES"
  | "GIFTS"
  | "TRIPS_TRAVEL"
  | "DRINKS_ALCOHOL"
  | "OTHER";

export const CATEGORY_INFO: Record<
  ExpenseCategory,
  { label: string; emoji: string; color: string }
> = {
  GROCERIES: { label: "Supermercado y Colmado", emoji: "🛒", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800" },
  FOOD_GROCERIES: { label: "Supermercado y Colmado", emoji: "🛒", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800" },
  RESTAURANTS_DELIVERY: { label: "Restaurantes y Delivery", emoji: "🍽️", color: "bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-800" },
  RESTAURANT: { label: "Restaurante y Salidas", emoji: "🍽️", color: "bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-800" },
  DRINKS_ALCOHOL: { label: "Bebidas, Cervezas y Frías", emoji: "🍻", color: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800" },
  GAS_FUEL: { label: "Gasolina, Combustible y Peajes", emoji: "⛽", color: "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800" },
  FUEL_TRANSPORT: { label: "Gasolina y Peajes", emoji: "⛽", color: "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800" },
  LODGING: { label: "Villa, Alojamiento o Airbnb", emoji: "🏡", color: "bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-800" },
  ACCOMMODATION: { label: "Hospedaje y Hotel", emoji: "🏨", color: "bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-800" },
  RENT_HOUSING: { label: "Alquiler y Vivienda", emoji: "🏠", color: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800" },
  HOME_UTILITIES: { label: "Servicios del Hogar (Luz / Agua / Gas)", emoji: "💡", color: "bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:border-yellow-800" },
  INTERNET_TELECOM: { label: "Internet, Teléfono y Datos", emoji: "📶", color: "bg-teal-500/10 text-teal-600 border-teal-200 dark:border-teal-800" },
  TRANSPORTATION: { label: "Transporte y Pasajes", emoji: "🚌", color: "bg-sky-500/10 text-sky-600 border-sky-200 dark:border-sky-800" },
  TRIPS_TRAVEL: { label: "Viajes, Tours y Excursiones", emoji: "✈️", color: "bg-cyan-500/10 text-cyan-600 border-cyan-200 dark:border-cyan-800" },
  GIFTS: { label: "Regalos y Detalles", emoji: "🎁", color: "bg-violet-500/10 text-violet-600 border-violet-200 dark:border-violet-800" },
  ENTERTAINMENT: { label: "Entretenimiento y Discoteca", emoji: "🎉", color: "bg-indigo-500/10 text-indigo-600 border-indigo-200 dark:border-indigo-800" },
  HEALTH_MEDICAL: { label: "Farmacia y Salud", emoji: "💊", color: "bg-red-500/10 text-red-600 border-red-200 dark:border-red-800" },
  SHOPPING: { label: "Compras y Tiendas", emoji: "🛍️", color: "bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-200 dark:border-fuchsia-800" },
  PERSONAL_CARE: { label: "Cuidado Personal", emoji: "🧴", color: "bg-pink-500/10 text-pink-600 border-pink-200 dark:border-pink-800" },
  FEES_CHARGES: { label: "Comisiones y Cargos", emoji: "💳", color: "bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-800" },
  OTHER: { label: "Otros Gastos del Coro", emoji: "📦", color: "bg-slate-500/10 text-slate-600 border-slate-200 dark:border-slate-800" },
};


export type IncomeCategory =
  | "DEPOSIT_RETURN"
  | "SUPPLIER_REFUND"
  | "HOTEL_REFUND"
  | "EXTERNAL_SPONSORSHIP"
  | "OTHER_INCOME";

export const INCOME_CATEGORY_INFO: Record<
  IncomeCategory,
  { label: string; emoji: string; color: string }
> = {
  DEPOSIT_RETURN: { label: "Devolución de Depósito", emoji: "🏠", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800" },
  SUPPLIER_REFUND: { label: "Reembolso de Proveedor", emoji: "🛒", color: "bg-cyan-500/10 text-cyan-600 border-cyan-200 dark:border-cyan-800" },
  HOTEL_REFUND: { label: "Reembolso Hotel / Vuelo / Airbnb", emoji: "🏨", color: "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800" },
  EXTERNAL_SPONSORSHIP: { label: "Aporte Externo / Patrocinio", emoji: "🎁", color: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800" },
  OTHER_INCOME: { label: "Otro Ingreso", emoji: "💵", color: "bg-slate-500/10 text-slate-600 border-slate-200 dark:border-slate-800" },
};

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  default_payment_instructions?: string | null;
  created_at: string;
  updated_at?: string;
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
  read_only_token?: string | null;
  created_at: string;
  updated_at: string;
}

/** Kittysplit Parity Alias for Serrucho */
export type Kitty = Serrucho;
export type KittyStatus = SerruchoStatus;

export type ParticipantAccessStatus =
  | "INVITED"
  | "ACCESSED"
  | "IDENTIFIED"
  | "LINKED_ACCOUNT";

export const ACCESS_STATUS_INFO: Record<
  ParticipantAccessStatus,
  { label: string; emoji: string; color: string; description: string }
> = {
  INVITED: {
    label: "Invitado",
    emoji: "⏳",
    color: "bg-muted text-muted-foreground border-border",
    description: "Pendiente de abrir el enlace",
  },
  ACCESSED: {
    label: "Accedió",
    emoji: "👁️",
    color: "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800",
    description: "Abrió el serrucho",
  },
  IDENTIFIED: {
    label: "Identificado",
    emoji: "✅",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800",
    description: "Activo en el coro",
  },
  LINKED_ACCOUNT: {
    label: "Cuenta vinculada",
    emoji: "🔗",
    color: "bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-800",
    description: "Usuario registrado",
  },
};

export interface Participant {
  id: string;
  serrucho_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  preferred_channel: PreferredChannel;
  default_shares?: number;
  user_id?: string | null;
  is_active?: boolean;
  access_status?: ParticipantAccessStatus;
  last_seen_at?: string | null;
  created_at: string;
  updated_at: string;
}

/** Kittysplit Parity Alias for Participant */
export type KittyPerson = Participant;

export interface ReceiptAttachment {
  id: string;
  url: string;
  thumbnail_url?: string;
  filename?: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
}

export const MAX_RECEIPTS_PER_TRANSACTION = 3;
export const MAX_RECEIPT_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_RECEIPT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
];

export interface Expense {
  id: string;
  serrucho_id: string;
  description: string;
  amount_cents: number;
  paid_by_participant_id: string;
  expense_date: string;
  split_method: SplitMethod;
  category: ExpenseCategory;
  // Multi-currency traceability
  original_currency?: string | null;        // e.g. "USD", "EUR" — null means DOP
  original_amount_cents?: number | null;    // amount in original currency × 100
  exchange_rate_used?: number | null;       // 1 original_currency = X DOP
  rate_adjusted_by?: string | null;        // name of who set manual rate
  rate_adjusted_at?: string | null;        // ISO timestamp of manual override
  // Attachments
  receipt_url?: string | null;
  receipt_urls?: string[];
  created_at: string;
  updated_at: string;
}

/** Kittysplit Parity Alias for Expense */
export type KittyEntry = Expense;

export interface ExpenseParticipant {
  expense_id: string;
  participant_id: string;
  percentage_basis_points: number | null;
  owed_cents: number;
}

export type PaymentMethod =
  | "TRANSFER_POPULAR"
  | "TRANSFER_BHD"
  | "TRANSFER_BANRESERVAS"
  | "TRANSFER_OTHER"
  | "CASH"
  | "MOBILE_PAY"
  | "DEPOSIT"
  | "CARD"
  | "OTHER";

export const PAYMENT_METHOD_INFO: Record<
  PaymentMethod,
  { label: string; shortLabel: string; emoji: string }
> = {
  TRANSFER_POPULAR: { label: "Banco Popular", shortLabel: "Popular", emoji: "🟢" },
  TRANSFER_BHD: { label: "Banco BHD", shortLabel: "BHD", emoji: "🔵" },
  TRANSFER_BANRESERVAS: { label: "Banreservas", shortLabel: "Banreservas", emoji: "🔴" },
  TRANSFER_OTHER: { label: "Transferencia Bancaria", shortLabel: "Transferencia", emoji: "🏦" },
  MOBILE_PAY: { label: "Pago Móvil / tPago", shortLabel: "tPago", emoji: "📱" },
  DEPOSIT: { label: "Depósito Bancario", shortLabel: "Depósito", emoji: "🏢" },
  CARD: { label: "Tarjeta de Débito / Crédito", shortLabel: "Tarjeta", emoji: "💳" },
  CASH: { label: "Efectivo", shortLabel: "Efectivo", emoji: "💵" },
  OTHER: { label: "Otro Método", shortLabel: "Otro", emoji: "⚡" },
};


export type SettlementPaymentStatus =
  | "SETTLED"
  | "PENDING"
  | "PARTIAL"
  | "DISPUTED"
  | "CANCELLED";

export const SETTLEMENT_PAYMENT_STATUS_INFO: Record<
  SettlementPaymentStatus,
  { label: string; emoji: string; color: string }
> = {
  SETTLED: { label: "Saldado Total", emoji: "✅", color: "bg-emerald-500/10 text-emerald-600 border-emerald-300" },
  PARTIAL: { label: "Pago Parcial", emoji: "⏳", color: "bg-amber-500/10 text-amber-600 border-amber-300" },
  PENDING: { label: "Pendiente", emoji: "🕒", color: "bg-slate-500/10 text-slate-600 border-slate-300" },
  DISPUTED: { label: "En Revisión / Disputado", emoji: "⚠️", color: "bg-rose-500/10 text-rose-600 border-rose-300" },
  CANCELLED: { label: "Cancelado", emoji: "❌", color: "bg-gray-500/10 text-gray-500 border-gray-300" },
};

export interface Transfer {
  id: string;
  serrucho_id: string;
  sender_participant_id: string;
  receiver_participant_id: string;
  amount_cents: number;
  transfer_date: string;
  notes: string | null;
  payment_method?: PaymentMethod | null;
  receipt_url?: string | null;
  receipt_urls?: string[];
  created_at: string;
  updated_at: string;
}

/** Kittysplit Parity Alias for Transfer */
export type KittyTransfer = Transfer;

export interface TransferWithParticipants extends Transfer {
  sender_name: string;
  receiver_name: string;
}

export interface Income {
  id: string;
  serrucho_id: string;
  description: string;
  amount_cents: number;
  received_by_participant_id: string;
  income_date: string;
  split_method: SplitMethod;
  category: IncomeCategory;
  receipt_url?: string | null;
  receipt_urls?: string[];
  created_at: string;
  updated_at: string;
}

export interface IncomeParticipant {
  income_id: string;
  participant_id: string;
  percentage_basis_points: number | null;
  credit_cents: number;
}

export interface IncomeWithSplits extends Income {
  received_by_name: string;
  splits: (IncomeParticipant & { participant_name: string })[];
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
  payment_method?: PaymentMethod | null;
  payment_notes?: string | null;
  payment_status?: SettlementPaymentStatus | null;
  paid_amount_cents?: number | null;
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

export type ActivityActionType =

  | "EXPENSE_CREATED"
  | "EXPENSE_UPDATED"
  | "EXPENSE_DELETED"
  | "TRANSFER_CREATED"
  | "TRANSFER_UPDATED"
  | "TRANSFER_DELETED"
  | "INCOME_CREATED"
  | "INCOME_UPDATED"
  | "INCOME_DELETED"
  | "PARTICIPANT_ADDED"
  | "PARTICIPANT_UPDATED"
  | "PARTICIPANT_REMOVED"
  | "SETTLEMENT_MARKED_PAID"
  | "SERRUCHO_CREATED"
  | "SERRUCHO_UPDATED"
  | "SERRUCHO_CLOSED"
  | "ATTACHMENT_ADDED"
  | "ATTACHMENT_REMOVED";

export type ActivityEntityType =
  | "EXPENSE"
  | "TRANSFER"
  | "INCOME"
  | "PARTICIPANT"
  | "SETTLEMENT"
  | "SERRUCHO"
  | "ATTACHMENT";

export interface ActivityEvent {
  id: string;
  serrucho_id: string;
  actor_name: string;
  action_type: ActivityActionType;
  entity_type: ActivityEntityType;
  entity_id?: string | null;
  summary: string;
  metadata?: Record<string, any> | null;
  created_at: string;
}

// ─── Super Serrucho & Monetization Models ────────────────────────────────────

export type CurrencyCode = "DOP" | "USD" | "EUR" | string;

export type SerruchoTier = "FREE" | "SUPER_SERRUCHO";


export type SuperSerruchoFeature =
  | "UNLIMITED_PARTICIPANTS"
  | "ADVANCED_MULTI_CURRENCY"
  | "UNLIMITED_RECEIPTS"
  | "CUSTOM_EXCEL_TEMPLATES"
  | "EXPANDED_AUDIT_HISTORY"
  | "EXPANDED_AI_RECEIPTS";

export interface SerruchoEntitlement {
  id: string;
  serrucho_id: string;
  tier: SerruchoTier;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
  features: SuperSerruchoFeature[];
  buyer_user_id?: string | null;
  buyer_email?: string | null;
  order_id?: string | null;
  amount_cents?: number;
  currency?: CurrencyCode;
  granted_at: string;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type PaymentProvider =
  | "MOCK_RD"
  | "CARIBBEAN_PAY"
  | "AZUL"
  | "CARNET"
  | "STRIPE"
  | "MANUAL_TRANSFER";

export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

export interface PaymentTransaction {
  id: string;
  serrucho_id: string;
  order_id: string;
  buyer_user_id?: string | null;
  buyer_email?: string | null;
  amount_cents: number;
  currency: CurrencyCode;
  provider: PaymentProvider;
  status: PaymentStatus;
  provider_tx_id?: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface SuperSerruchoPlan {
  id: string;
  name: string;
  description: string;
  amount_cents: number;
  currency: CurrencyCode;
  features: SuperSerruchoFeature[];
}


