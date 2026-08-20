import { z } from "zod";

export const serruchoSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre del serrucho debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  description: z.string().max(500, "La descripción no puede exceder 500 caracteres").optional().nullable(),
  event_date: z.string().optional().nullable(),
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
});

export type ParticipantInput = z.infer<typeof participantSchema>;

export const expenseParticipantSplitSchema = z.object({
  participant_id: z.string().min(1, "ID de participante requerido"),
  percentage: z.number().min(0).max(100).optional(),
});

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
    split_method: z.enum(["EQUAL", "PERCENTAGE"]).default("EQUAL"),
    splits: z
      .array(expenseParticipantSplitSchema)
      .min(1, "Debe incluir al menos un participante en el reparto"),
  })
  .refine(
    (data) => {
      if (data.split_method === "PERCENTAGE") {
        const sum = data.splits.reduce((acc, s) => acc + (s.percentage || 0), 0);
        // Round to 2 decimal places to prevent float precision issues
        return Math.abs(sum - 100) < 0.01;
      }
      return true;
    },
    {
      message: "La suma de los porcentajes debe ser exactamente 100%",
      path: ["splits"],
    }
  );

export type ExpenseInput = z.infer<typeof expenseSchema>;

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
