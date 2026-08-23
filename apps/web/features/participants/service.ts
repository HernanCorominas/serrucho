import { getRepository } from "@/lib/store";
import { Participant } from "@/lib/types/domain";
import { participantSchema, ParticipantInput } from "@/lib/validations/schemas";

export class ParticipantService {
  static async listBySerrucho(serruchoId: string): Promise<Participant[]> {
    const repo = getRepository();
    return repo.getParticipants(serruchoId);
  }

  static async getById(id: string): Promise<Participant | null> {
    const repo = getRepository();
    return repo.getParticipantById(id);
  }

  static async add(serruchoId: string, input: ParticipantInput): Promise<Participant> {
    const validated = participantSchema.parse(input);
    const repo = getRepository();

    const serrucho = await repo.getSerruchoById(serruchoId);
    if (!serrucho) throw new Error("Serrucho no encontrado");
    if (serrucho.status === "CLOSED") {
      throw new Error("No se pueden agregar participantes a un serrucho cerrado");
    }

    return repo.createParticipant({
      serrucho_id: serruchoId,
      name: validated.name.trim(),
      email: validated.email ? validated.email.trim().toLowerCase() : null,
      phone: validated.phone ? validated.phone.trim() : null,
      preferred_channel: validated.preferred_channel || "EMAIL",
      default_shares: validated.default_shares ?? 1,
    });
  }

  static async update(id: string, input: Partial<ParticipantInput>): Promise<Participant> {
    const repo = getRepository();
    const existing = await repo.getParticipantById(id);
    if (!existing) throw new Error("Participante no encontrado");

    const serrucho = await repo.getSerruchoById(existing.serrucho_id);
    if (serrucho?.status === "CLOSED") {
      throw new Error("No se pueden editar participantes en un serrucho cerrado");
    }

    return repo.updateParticipant(id, {
      ...(input.name ? { name: input.name.trim() } : {}),
      ...(input.email !== undefined
        ? { email: input.email ? input.email.trim().toLowerCase() : null }
        : {}),
      ...(input.phone !== undefined ? { phone: input.phone ? input.phone.trim() : null } : {}),
      ...(input.preferred_channel ? { preferred_channel: input.preferred_channel } : {}),
      ...(input.default_shares !== undefined ? { default_shares: input.default_shares } : {}),
    });
  }

  static async delete(id: string): Promise<boolean> {
    const repo = getRepository();
    const existing = await repo.getParticipantById(id);
    if (!existing) return false;

    const serrucho = await repo.getSerruchoById(existing.serrucho_id);
    if (serrucho?.status === "CLOSED") {
      throw new Error("No se pueden eliminar participantes de un serrucho cerrado");
    }

    // Integrity Check: ensure participant has no paid expenses or active split debts
    const expenses = await repo.getExpenses(existing.serrucho_id);
    const hasPaid = expenses.some((e) => e.paid_by_participant_id === id);
    let hasSplits = false;
    for (const exp of expenses) {
      const splits = await repo.getExpenseSplits(exp.id);
      if (splits.some((s) => s.participant_id === id && s.owed_cents > 0)) {
        hasSplits = true;
        break;
      }
    }

    if (hasPaid || hasSplits) {
      throw new Error(
        "No puedes eliminar un participante que tiene gastos o deudas registradas. Elimina o reasigna los gastos correspondientes primero para proteger la integridad contable."
      );
    }

    return repo.deleteParticipant(id);
  }
}
