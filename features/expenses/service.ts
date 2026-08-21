import { getRepository } from "@/lib/store";
import { ExpenseWithSplits } from "@/lib/types/domain";
import { expenseSchema, ExpenseInput } from "@/lib/validations/schemas";
import { toCents, splitEqually, splitByPercentage } from "@/lib/finance/math";

export class ExpenseService {
  static async listBySerrucho(serruchoId: string): Promise<ExpenseWithSplits[]> {
    const repo = getRepository();
    const [expenses, participants] = await Promise.all([
      repo.getExpenses(serruchoId),
      repo.getParticipants(serruchoId),
    ]);

    const participantMap = new Map(participants.map((p) => [p.id, p.name]));

    const result: ExpenseWithSplits[] = [];

    for (const exp of expenses) {
      const splits = await repo.getExpenseSplits(exp.id);
      result.push({
        ...exp,
        paid_by_name: participantMap.get(exp.paid_by_participant_id) || "Desconocido",
        splits: splits.map((s) => ({
          ...s,
          participant_name: participantMap.get(s.participant_id) || "Desconocido",
        })),
      });
    }

    return result;
  }

  static async add(serruchoId: string, input: ExpenseInput): Promise<ExpenseWithSplits> {
    const validated = expenseSchema.parse(input);
    const repo = getRepository();

    const serrucho = await repo.getSerruchoById(serruchoId);
    if (!serrucho) throw new Error("Serrucho no encontrado");
    if (serrucho.status === "CLOSED") {
      throw new Error("No se pueden agregar gastos a un serrucho cerrado");
    }

    const participants = await repo.getParticipants(serruchoId);
    const validParticipantIds = new Set(participants.map((p) => p.id));

    if (!validParticipantIds.has(validated.paid_by_participant_id)) {
      throw new Error("El pagador no es un participante válido de este serrucho");
    }

    for (const s of validated.splits) {
      if (!validParticipantIds.has(s.participant_id)) {
        throw new Error(`Participante ${s.participant_id} no pertenece a este serrucho`);
      }
    }

    const totalCents = toCents(validated.amount);

    // Compute splits based on method
    let calculatedSplits: {
      participant_id: string;
      owed_cents: number;
      percentage_basis_points: number | null;
    }[] = [];

    if (validated.split_method === "PERCENTAGE") {
      const percentageInput = validated.splits.map((s) => ({
        participantId: s.participant_id,
        basisPoints: Math.round((s.percentage || 0) * 100),
      }));
      const results = splitByPercentage(totalCents, percentageInput);
      calculatedSplits = results.map((r) => ({
        participant_id: r.participantId,
        owed_cents: r.owedCents,
        percentage_basis_points: r.percentageBasisPoints ?? null,
      }));
    } else {
      const participantIds = validated.splits.map((s) => s.participant_id);
      const results = splitEqually(totalCents, participantIds);
      calculatedSplits = results.map((r) => ({
        participant_id: r.participantId,
        owed_cents: r.owedCents,
        percentage_basis_points: null,
      }));
    }

    const created = await repo.createExpenseWithSplits(
      {
        serrucho_id: serruchoId,
        description: validated.description.trim(),
        amount_cents: totalCents,
        paid_by_participant_id: validated.paid_by_participant_id,
        expense_date: validated.expense_date,
        split_method: validated.split_method,
        category: validated.category || "OTHER",
      },
      calculatedSplits
    );

    const participantMap = new Map(participants.map((p) => [p.id, p.name]));
    const splits = await repo.getExpenseSplits(created.id);

    return {
      ...created,
      paid_by_name: participantMap.get(created.paid_by_participant_id) || "Desconocido",
      splits: splits.map((s) => ({
        ...s,
        participant_name: participantMap.get(s.participant_id) || "Desconocido",
      })),
    };
  }

  static async update(
    expenseId: string,
    input: Partial<ExpenseInput>
  ): Promise<ExpenseWithSplits> {
    const repo = getRepository();
    const existing = await repo.getExpenseById(expenseId);
    if (!existing) throw new Error("Gasto no encontrado");

    const serrucho = await repo.getSerruchoById(existing.serrucho_id);
    if (serrucho?.status === "CLOSED") {
      throw new Error("No se pueden modificar gastos en un serrucho cerrado");
    }

    const participants = await repo.getParticipants(existing.serrucho_id);
    const participantMap = new Map(participants.map((p) => [p.id, p.name]));

    const totalCents =
      input.amount !== undefined ? toCents(input.amount) : existing.amount_cents;
    const splitMethod = input.split_method || existing.split_method;

    let calculatedSplits:
      | {
          participant_id: string;
          owed_cents: number;
          percentage_basis_points: number | null;
        }[]
      | undefined;

    if (input.splits) {
      if (splitMethod === "PERCENTAGE") {
        const percentageInput = input.splits.map((s) => ({
          participantId: s.participant_id,
          basisPoints: Math.round((s.percentage || 0) * 100),
        }));
        const results = splitByPercentage(totalCents, percentageInput);
        calculatedSplits = results.map((r) => ({
          participant_id: r.participantId,
          owed_cents: r.owedCents,
          percentage_basis_points: r.percentageBasisPoints ?? null,
        }));
      } else {
        const ids = input.splits.map((s) => s.participant_id);
        const results = splitEqually(totalCents, ids);
        calculatedSplits = results.map((r) => ({
          participant_id: r.participantId,
          owed_cents: r.owedCents,
          percentage_basis_points: null,
        }));
      }
    }

    const updated = await repo.updateExpenseWithSplits(
      expenseId,
      {
        ...(input.description ? { description: input.description.trim() } : {}),
        ...(input.amount !== undefined ? { amount_cents: totalCents } : {}),
        ...(input.paid_by_participant_id
          ? { paid_by_participant_id: input.paid_by_participant_id }
          : {}),
        ...(input.expense_date ? { expense_date: input.expense_date } : {}),
        ...(input.split_method ? { split_method: input.split_method } : {}),
        ...(input.category ? { category: input.category } : {}),
      },
      calculatedSplits
    );

    const splits = await repo.getExpenseSplits(updated.id);

    return {
      ...updated,
      paid_by_name: participantMap.get(updated.paid_by_participant_id) || "Desconocido",
      splits: splits.map((s) => ({
        ...s,
        participant_name: participantMap.get(s.participant_id) || "Desconocido",
      })),
    };
  }

  static async delete(expenseId: string): Promise<boolean> {
    const repo = getRepository();
    const existing = await repo.getExpenseById(expenseId);
    if (!existing) return false;

    const serrucho = await repo.getSerruchoById(existing.serrucho_id);
    if (serrucho?.status === "CLOSED") {
      throw new Error("No se pueden eliminar gastos de un serrucho cerrado");
    }

    return repo.deleteExpense(expenseId);
  }
}
