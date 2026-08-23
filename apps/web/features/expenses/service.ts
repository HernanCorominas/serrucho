import { getRepository } from "@/lib/store";
import { ExpenseWithSplits } from "@/lib/types/domain";
import { expenseSchema, ExpenseInput } from "@/lib/validations/schemas";
import { toCents, splitEqually, splitByPercentage, splitByExactAmounts, splitByShares, formatDOP } from "@/lib/finance/math";
import { ActivityService } from "@/features/activity/service";

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
    } else if (validated.split_method === "EXACT") {
      const exactInput = validated.splits.map((s) => ({
        participantId: s.participant_id,
        amountCents: toCents(s.amount || 0),
      }));
      const results = splitByExactAmounts(totalCents, exactInput);
      calculatedSplits = results.map((r) => ({
        participant_id: r.participantId,
        owed_cents: r.owedCents,
        percentage_basis_points: Math.round((r.owedCents / totalCents) * 10000),
      }));
    } else if (validated.split_method === "SHARES") {
      const sharesInput = validated.splits.map((s) => ({
        participantId: s.participant_id,
        shares: s.shares || 1,
      }));
      const results = splitByShares(totalCents, sharesInput);
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

    const isForeignCurrency = validated.original_currency && validated.original_currency !== "DOP";

    const created = await repo.createExpenseWithSplits(
      {
        serrucho_id: serruchoId,
        description: validated.description.trim(),
        amount_cents: totalCents,
        paid_by_participant_id: validated.paid_by_participant_id,
        expense_date: validated.expense_date,
        split_method: validated.split_method,
        category: validated.category || "OTHER",
        receipt_url: validated.receipt_url || null,
        receipt_urls: validated.receipt_urls || [],
        // Multi-currency traceability
        original_currency: isForeignCurrency ? validated.original_currency : null,
        original_amount_cents: isForeignCurrency && validated.original_amount
          ? Math.round(validated.original_amount * 100)
          : null,
        exchange_rate_used: isForeignCurrency ? (validated.exchange_rate_used || null) : null,
        rate_adjusted_by: validated.rate_adjusted_by || null,
        rate_adjusted_at: validated.rate_adjusted_at || null,
      },
      calculatedSplits
    );


    const participantMap = new Map(participants.map((p) => [p.id, p.name]));
    const splits = await repo.getExpenseSplits(created.id);
    const paidByName = participantMap.get(created.paid_by_participant_id) || "Alguien";

    await ActivityService.record({
      serrucho_id: serruchoId,
      actor_name: paidByName,
      action_type: "EXPENSE_CREATED",
      entity_type: "EXPENSE",
      entity_id: created.id,
      summary: `${paidByName} agregó "${created.description}" — ${formatDOP(created.amount_cents)}`,
      metadata: {
        amount_cents: created.amount_cents,
        description: created.description,
        split_method: created.split_method,
      },
    });

    return {
      ...created,
      paid_by_name: paidByName,
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

    if (input.paid_by_participant_id) {
      const validParticipantIds = new Set(participants.map((p) => p.id));
      if (!validParticipantIds.has(input.paid_by_participant_id)) {
        throw new Error("El pagador no es un participante válido de este serrucho");
      }
    }

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
      } else if (splitMethod === "EXACT") {
        const exactInput = input.splits.map((s) => ({
          participantId: s.participant_id,
          amountCents: toCents(s.amount || 0),
        }));
        const results = splitByExactAmounts(totalCents, exactInput);
        calculatedSplits = results.map((r) => ({
          participant_id: r.participantId,
          owed_cents: r.owedCents,
          percentage_basis_points: Math.round((r.owedCents / totalCents) * 10000),
        }));
      } else if (splitMethod === "SHARES") {
        const sharesInput = input.splits.map((s) => ({
          participantId: s.participant_id,
          shares: s.shares || 1,
        }));
        const results = splitByShares(totalCents, sharesInput);
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
    } else if (input.amount !== undefined && input.amount !== existing.amount_cents / 100) {
      // Re-evaluate current splits for new amount
      const currentSplits = await repo.getExpenseSplits(expenseId);
      if (currentSplits.length > 0) {
        if (splitMethod === "PERCENTAGE") {
          const percentageInput = currentSplits.map((s) => ({
            participantId: s.participant_id,
            basisPoints: s.percentage_basis_points || 0,
          }));
          const results = splitByPercentage(totalCents, percentageInput);
          calculatedSplits = results.map((r) => ({
            participant_id: r.participantId,
            owed_cents: r.owedCents,
            percentage_basis_points: r.percentageBasisPoints ?? null,
          }));
        } else {
          const ids = currentSplits.map((s) => s.participant_id);
          const results = splitEqually(totalCents, ids);
          calculatedSplits = results.map((r) => ({
            participant_id: r.participantId,
            owed_cents: r.owedCents,
            percentage_basis_points: null,
          }));
        }
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
        ...(input.receipt_url !== undefined ? { receipt_url: input.receipt_url } : {}),
        ...(input.receipt_urls !== undefined ? { receipt_urls: input.receipt_urls } : {}),
        ...(input.original_currency !== undefined ? { original_currency: input.original_currency } : {}),
        ...(input.original_amount !== undefined
          ? {
              original_amount_cents:
                input.original_amount !== null ? Math.round(input.original_amount * 100) : null,
            }
          : {}),
        ...(input.exchange_rate_used !== undefined
          ? { exchange_rate_used: input.exchange_rate_used }
          : {}),
        ...(input.rate_adjusted_by !== undefined
          ? { rate_adjusted_by: input.rate_adjusted_by }
          : {}),
        ...(input.rate_adjusted_at !== undefined
          ? { rate_adjusted_at: input.rate_adjusted_at }
          : {}),
      },
      calculatedSplits
    );


    const splits = await repo.getExpenseSplits(updated.id);
    const paidByName = participantMap.get(updated.paid_by_participant_id) || "Alguien";

    await ActivityService.record({
      serrucho_id: existing.serrucho_id,
      actor_name: paidByName,
      action_type: "EXPENSE_UPDATED",
      entity_type: "EXPENSE",
      entity_id: updated.id,
      summary: `${paidByName} editó el gasto "${updated.description}" — ${formatDOP(updated.amount_cents)}`,
      metadata: {
        old_amount_cents: existing.amount_cents,
        new_amount_cents: updated.amount_cents,
        description: updated.description,
      },
    });

    return {
      ...updated,
      paid_by_name: paidByName,
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

    const participants = await repo.getParticipants(existing.serrucho_id);
    const participantMap = new Map(participants.map((p) => [p.id, p.name]));
    const actorName = participantMap.get(existing.paid_by_participant_id) || "Alguien";

    const deleted = await repo.deleteExpense(expenseId);
    if (deleted) {
      await ActivityService.record({
        serrucho_id: existing.serrucho_id,
        actor_name: actorName,
        action_type: "EXPENSE_DELETED",
        entity_type: "EXPENSE",
        entity_id: expenseId,
        summary: `Se eliminó el gasto "${existing.description}" — ${formatDOP(existing.amount_cents)}`,
        metadata: {
          amount_cents: existing.amount_cents,
          description: existing.description,
        },
      });
    }

    return deleted;
  }
}
