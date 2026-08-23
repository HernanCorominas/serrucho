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
  initial_participants: z.array(z.string()).optional(),
});

export type SerruchoInput = z.infer<typeof serruchoSchema>;

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
});

export type ParticipantInput = z.input<typeof participantSchema>;

export const expenseParticipantSplitSchema = z.object({
  participant_id: z.string().min(1, "ID de participante requerido"),
  percentage: z.number().min(0).max(100).optional(),
  amount: z.number().min(0).optional(),
  shares: z.number().positive("Las cuotas / shares deben ser mayores a 0").optional(),
});

export const expenseCategorySchema = z.enum([
  "LODGING",
  "FOOD_GROCERIES",
  "DRINKS_ALCOHOL",
  "FUEL_TRANSPORT",
  "RESTAURANT",
  "ENTERTAINMENT",
  "OTHER",
]);

export const expenseSchema = z
  .object({
    description: z
      .string()
      .min(2, "El concepto del gasto debe tener al menos 2 caracteres")
      .max(200, "El concepto no puede exceder 200 caracteres"),
    amount: z
      .number({ invalid_type_error: "Ingresa un monto válido" })
      .positive("El monto debe ser mayor a 0"),
    paid_by_participant_id: z.string().min(1, "Selecciona quién pagó este gasto"),
    expense_date: z.string().min(1, "Fecha de gasto requerida"),
    split_method: z.enum(["EQUAL", "PERCENTAGE", "EXACT", "SHARES", "ITEMIZED"]).default("EQUAL"),
    category: expenseCategorySchema.default("OTHER"),
    splits: z
      .array(expenseParticipantSplitSchema)
      .min(1, "Debe incluir al menos un participante en el reparto"),
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

export const closeSerruchoSchema = z.object({
  payment_instructions: z
    .string()
    .min(5, "Indica dónde o cómo transferir los pagos (ej. Banco BHD, Banreservas, tPago, etc.)")
    .max(1000, "Las instrucciones no pueden exceder 1000 caracteres"),
  payment_deadline: z.string().min(1, "Indica la fecha límite de pago"),
  confirm: z.boolean().refine((val) => val === true, {
    message: "Debes confirmar el cierre irreversible del serrucho",
  }),
});

export type CloseSerruchoInput = z.infer<typeof closeSerruchoSchema>;

export const togglePaymentSchema = z.object({
  is_paid: z.boolean(),
});

export type TogglePaymentInput = z.infer<typeof togglePaymentSchema>;

export const paymentMethodSchema = z.enum([
  "TRANSFER_POPULAR",
  "TRANSFER_BHD",
  "TRANSFER_BANRESERVAS",
  "TRANSFER_OTHER",
  "CASH",
  "OTHER",
]);

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
  })
  .refine(
    (data) => data.sender_participant_id !== data.receiver_participant_id,
    {
      message: "El emisor y el receptor no pueden ser la misma persona",
      path: ["receiver_participant_id"],
    }
  );

export type TransferInput = z.infer<typeof transferSchema>;
