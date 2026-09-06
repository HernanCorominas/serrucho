import { z } from "zod";

export const serruchoSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre del serrucho debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  description: z.string().max(500, "La descripción no puede exceder 500 caracteres").optional().nullable(),
  currency: z.enum(["DOP", "USD", "EUR"]).default("DOP"),
  event_date: z.string().optional().nullable(),
  creator_name: z.string().max(100).optional().nullable(),
  creator_email: z.string().optional().nullable(),
  initial_participants: z.array(z.string()).optional(),
});

export type SerruchoInput = z.infer<typeof serruchoSchema>;
/** Kittysplit Parity Alias */
export const kittySchema = serruchoSchema;
export type KittyInput = SerruchoInput;

export const participantSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  email: z
    .string()
    .email("Correo electrónico inválido")
    .optional()
    .or(z.literal(""))
    .nullable(),
  phone: z
    .string()
    .max(25, "El teléfono no puede exceder 25 caracteres")
    .optional()
    .or(z.literal(""))
    .nullable(),
  preferred_channel: z.enum(["EMAIL", "WHATSAPP"]).default("EMAIL"),
  default_shares: z.number().positive("Las cuotas / shares deben ser mayores a 0").optional().default(1),
  access_status: z.enum(["INVITED", "ACCESSED", "IDENTIFIED", "LINKED_ACCOUNT"]).optional(),
  user_id: z.string().optional().nullable(),
  last_seen_at: z.string().optional().nullable(),
});

export type ParticipantInput = z.input<typeof participantSchema>;
/** Kittysplit Parity Alias */
export const kittyPersonSchema = participantSchema;
export type KittyPersonInput = ParticipantInput;

export const expenseParticipantSplitSchema = z.object({
  participant_id: z.string().min(1, "ID de participante requerido"),
  percentage: z.number().min(0).max(100).optional(),
  amount: z.number().min(0).optional(),
  shares: z.number().positive("Las cuotas / shares deben ser mayores a 0").optional(),
});

export const splitMethodSchema = z.enum(["EQUAL", "PERCENTAGE", "EXACT", "SHARES"]);
export type SplitMethodInput = z.infer<typeof splitMethodSchema>;

export const expenseCategorySchema = z.enum([
  "RENT_HOUSING",
  "ACCOMMODATION",
  "LODGING",
  "GROCERIES",
  "FOOD_GROCERIES",
  "RESTAURANTS_DELIVERY",
  "RESTAURANT",
  "TRANSPORTATION",
  "GAS_FUEL",
  "FUEL_TRANSPORT",
  "HOME_UTILITIES",
  "INTERNET_TELECOM",
  "HEALTH_MEDICAL",
  "ENTERTAINMENT",
  "SHOPPING",
  "PERSONAL_CARE",
  "FEES_CHARGES",
  "GIFTS",
  "TRIPS_TRAVEL",
  "DRINKS_ALCOHOL",
  "OTHER",
]);

export const expenseSchema = z
  .object({
    description: z
      .string()
      .trim()
      .min(1, "El concepto del gasto no puede estar vacío")
      .max(200, "El concepto no puede exceder 200 caracteres"),
    amount: z
      .number({ invalid_type_error: "Ingresa un monto válido" })
      .positive("El monto debe ser mayor a 0"),
    paid_by_participant_id: z.string().min(1, "Selecciona quién pagó este gasto"),
    expense_date: z.string().min(1, "Fecha de gasto requerida"),
    split_method: splitMethodSchema.default("EQUAL"),
    category: expenseCategorySchema.default("OTHER"),
    splits: z
      .array(expenseParticipantSplitSchema)
      .min(1, "Debe incluir al menos un participante en el reparto"),
    receipt_url: z.string().url().optional().nullable(),
    receipt_urls: z.array(z.string()).max(3).optional(),
    // Multi-currency traceability
    original_currency: z.string().max(3).optional().nullable(),
    original_amount: z.number().positive().optional().nullable(),
    exchange_rate_used: z.number().positive().optional().nullable(),
    rate_adjusted_by: z.string().max(100).optional().nullable(),
    rate_adjusted_at: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.split_method === "PERCENTAGE") {
        const sum = data.splits.reduce((acc, s) => acc + (s.percentage || 0), 0);
        return Math.abs(sum - 100) < 0.01;
      }
      if (data.split_method === "EXACT") {
        const sum = data.splits.reduce((acc, s) => acc + (s.amount || 0), 0);
        return Math.abs(sum - data.amount) < 0.01;
      }
      if (data.split_method === "SHARES") {
        const totalShares = data.splits.reduce((acc, s) => acc + (s.shares || 0), 0);
        return totalShares > 0 && data.splits.every((s) => (s.shares || 0) > 0);
      }
      return true;
    },
    (data) => ({
      message:
        data.split_method === "PERCENTAGE"
          ? "La suma de los porcentajes debe ser exactamente 100%"
          : data.split_method === "EXACT"
          ? "La suma de los montos individuales debe ser exactamente igual al monto total"
          : "Cada participante debe tener al menos 0.1 cuotas / shares",
      path: ["splits"],
    })
  );

export type ExpenseInput = z.input<typeof expenseSchema>;
/** Kittysplit Parity Alias */
export const kittyEntrySchema = expenseSchema;
export type KittyEntryInput = ExpenseInput;

export const paymentMethodSchema = z.enum([
  "TRANSFER_POPULAR",
  "TRANSFER_BHD",
  "TRANSFER_BANRESERVAS",
  "TRANSFER_OTHER",
  "CASH",
  "MOBILE_PAY",
  "DEPOSIT",
  "CARD",
  "OTHER",
]);

export const settlementPaymentStatusSchema = z.enum([
  "SETTLED",
  "PENDING",
  "PARTIAL",
  "DISPUTED",
  "CANCELLED",
]);

export const togglePaymentSchema = z.object({
  is_paid: z.boolean(),
  payment_method: paymentMethodSchema.optional().nullable(),
  payment_notes: z.string().max(500).optional().nullable(),
  paid_amount_cents: z.number().min(0).optional().nullable(),
  payment_status: settlementPaymentStatusSchema.optional().nullable(),
});

export type TogglePaymentInput = z.infer<typeof togglePaymentSchema>;

export const transferSchema = z
  .object({
    sender_participant_id: z.string().min(1, "Selecciona quién entregó el dinero"),
    receiver_participant_id: z.string().min(1, "Selecciona quién recibió el dinero"),
    amount: z
      .number({ invalid_type_error: "Ingresa un monto válido" })
      .positive("El monto debe ser mayor a 0"),
    transfer_date: z.string().min(1, "Fecha de transferencia requerida"),
    notes: z.string().max(300, "La nota no puede exceder 300 caracteres").optional().nullable(),
    payment_method: paymentMethodSchema.optional().nullable(),
    receipt_url: z.string().url().optional().nullable().or(z.literal("")),
    receipt_urls: z.array(z.string()).max(3).optional(),
  })
  .refine(
    (data) => data.sender_participant_id !== data.receiver_participant_id,
    {
      message: "El emisor y el receptor no pueden ser la misma persona",
      path: ["receiver_participant_id"],
    }
  );

export type TransferInput = z.infer<typeof transferSchema>;
/** Kittysplit Parity Alias */
export const kittyTransferSchema = transferSchema;
export type KittyTransferInput = TransferInput;

export const incomeCategorySchema = z.enum([
  "DEPOSIT_RETURN",
  "SUPPLIER_REFUND",
  "HOTEL_REFUND",
  "EXTERNAL_SPONSORSHIP",
  "OTHER_INCOME",
]);

export const incomeSplitItemSchema = z.object({
  participant_id: z.string().min(1, "Participante requerido"),
  percentage: z.number().min(0).max(100).optional(),
  amount: z.number().min(0).optional(),
  shares: z.number().min(0).optional(),
});

export const incomeSchema = z
  .object({
    description: z
      .string()
      .min(2, "La descripción debe tener al menos 2 caracteres")
      .max(100, "La descripción no puede exceder 100 caracteres"),
    amount: z
      .number({ invalid_type_error: "Ingresa un monto válido" })
      .positive("El monto debe ser mayor a 0"),
    received_by_participant_id: z.string().min(1, "Indica quién recibió el dinero"),
    income_date: z.string().min(1, "Fecha de ingreso requerida"),
    split_method: splitMethodSchema.default("EQUAL"),
    category: incomeCategorySchema.default("OTHER_INCOME"),
    receipt_url: z.string().url().optional().nullable().or(z.literal("")),
    receipt_urls: z.array(z.string()).max(3).optional(),
    splits: z
      .array(incomeSplitItemSchema)
      .min(1, "Debe haber al menos 1 participante beneficiado"),
  })
  .refine(
    (data) => {
      if (data.split_method === "PERCENTAGE") {
        const totalPct = data.splits.reduce((acc, s) => acc + (s.percentage || 0), 0);
        return Math.abs(totalPct - 100) < 0.01;
      }
      if (data.split_method === "EXACT") {
        const totalAmount = data.splits.reduce((acc, s) => acc + (s.amount || 0), 0);
        return Math.abs(totalAmount - data.amount) < 0.01;
      }
      if (data.split_method === "SHARES") {
        const totalShares = data.splits.reduce((acc, s) => acc + (s.shares || 0), 0);
        return totalShares > 0 && data.splits.every((s) => (s.shares || 0) > 0);
      }
      return true;
    },
    (data) => ({
      message:
        data.split_method === "PERCENTAGE"
          ? "La suma de los porcentajes de beneficio debe ser exactamente 100%"
          : data.split_method === "EXACT"
          ? "La suma de los montos acreditados debe ser exactamente igual al monto total del ingreso"
          : "Cada participante beneficiado debe tener al menos 0.1 cuotas / shares",
      path: ["splits"],
    })
  );

export type IncomeInput = z.input<typeof incomeSchema>;

