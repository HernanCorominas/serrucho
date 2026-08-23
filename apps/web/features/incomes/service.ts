import { getRepository } from "@/lib/store";
import {
  Income,
  IncomeWithSplits,
  IncomeParticipant,
} from "@/lib/types/domain";
import { incomeSchema, IncomeInput } from "@/lib/validations/schemas";
import {
  toCents,
  splitEqually,
  splitByPercentage,
  splitByExactAmounts,
  splitByShares,
} from "@/lib/finance/math";

export class IncomeService {
  static async listBySerrucho(serruchoId: string): Promise<IncomeWithSplits[]> {
    const repo = getRepository();
    const [incomes, participants] = await Promise.all([
      repo.getIncomes(serruchoId),
      repo.getParticipants(serruchoId),
    ]);

    const participantMap = new Map(participants.map((p) => [p.id, p.name]));

    const enriched = await Promise.all(
      incomes.map(async (inc) => {
        const splits = await repo.getIncomeSplits(inc.id);
        return {
          ...inc,
          received_by_name: participantMap.get(inc.received_by_participant_id) || "Desconocido",
          splits: splits.map((s) => ({
            ...s,
            participant_name: participantMap.get(s.participant_id) || "Desconocido",
          })),
        };
      })
    );

    return enriched;
  }

  static async getById(id: string): Promise<IncomeWithSplits | null> {
    const repo = getRepository();
    const income = await repo.getIncomeById(id);
    if (!income) return null;

    const [participants, splits] = await Promise.all([
      repo.getParticipants(income.serrucho_id),
      repo.getIncomeSplits(id),
    ]);

    const participantMap = new Map(participants.map((p) => [p.id, p.name]));

    return {
      ...income,
      received_by_name: participantMap.get(income.received_by_participant_id) || "Desconocido",
      splits: splits.map((s) => ({
        ...s,
        participant_name: participantMap.get(s.participant_id) || "Desconocido",
      })),
    };
  }

  static async add(serruchoId: string, input: IncomeInput): Promise<Income> {
    const validated = incomeSchema.parse(input);
    const repo = getRepository();

    const serrucho = await repo.getSerruchoById(serruchoId);
    if (!serrucho) throw new Error("Serrucho no encontrado");
    if (serrucho.status === "CLOSED") {
      throw new Error("No se pueden registrar ingresos en un serrucho cerrado");
    }

    const participants = await repo.getParticipants(serruchoId);
    const participantIds = new Set(participants.map((p) => p.id));

    if (!participantIds.has(validated.received_by_participant_id)) {
      throw new Error("El participante que recibió el ingreso no pertenece a este serrucho");
    }

    for (const split of validated.splits) {
      if (!participantIds.has(split.participant_id)) {
        throw new Error(
          `El participante beneficiado ${split.participant_id} no pertenece a este serrucho`
        );
      }
    }

    const totalCents = toCents(validated.amount);
    let calculatedSplits: Omit<IncomeParticipant, "income_id">[] = [];

    if (validated.split_method === "EQUAL") {
      const splitIds = validated.splits.map((s) => s.participant_id);
      const splitResults = splitEqually(totalCents, splitIds);
      calculatedSplits = splitResults.map((r) => ({
        participant_id: r.participantId,
        percentage_basis_points: r.percentageBasisPoints || null,
        credit_cents: r.owedCents,
      }));
    } else if (validated.split_method === "PERCENTAGE") {
      const pctSplits = validated.splits.map((s) => ({
        participantId: s.participant_id,
        basisPoints: Math.round((s.percentage || 0) * 100),
      }));
      const splitResults = splitByPercentage(totalCents, pctSplits);
      calculatedSplits = splitResults.map((r) => ({
        participant_id: r.participantId,
        percentage_basis_points: r.percentageBasisPoints || null,
        credit_cents: r.owedCents,
      }));
    } else if (validated.split_method === "EXACT") {
      const exactSplits = validated.splits.map((s) => ({
        participantId: s.participant_id,
        amountCents: toCents(s.amount || 0),
      }));
      const splitResults = splitByExactAmounts(totalCents, exactSplits);
      calculatedSplits = splitResults.map((r) => ({
        participant_id: r.participantId,
        percentage_basis_points: null,
        credit_cents: r.owedCents,
      }));
    } else if (validated.split_method === "SHARES") {
      const shareSplits = validated.splits.map((s) => ({
        participantId: s.participant_id,
        shares: s.shares || 1,
      }));
      const splitResults = splitByShares(totalCents, shareSplits);
      calculatedSplits = splitResults.map((r) => ({
        participant_id: r.participantId,
        percentage_basis_points: r.percentageBasisPoints || null,
        credit_cents: r.owedCents,
      }));
    }

    return repo.createIncome(
      {
        serrucho_id: serruchoId,
        description: validated.description.trim(),
        amount_cents: totalCents,
        received_by_participant_id: validated.received_by_participant_id,
        income_date: validated.income_date,
        split_method: validated.split_method,
        category: validated.category,
        receipt_url: validated.receipt_url || null,
      },
      calculatedSplits
    );
  }

  static async delete(id: string): Promise<boolean> {
    const repo = getRepository();
    const existing = await repo.getIncomeById(id);
    if (!existing) return false;

    const serrucho = await repo.getSerruchoById(existing.serrucho_id);
    if (serrucho?.status === "CLOSED") {
      throw new Error("No se pueden eliminar ingresos en un serrucho cerrado");
    }

    return repo.deleteIncome(id);
  }
}
