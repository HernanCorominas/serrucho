import { getRepository } from "@/lib/store";
import { Participant } from "@/lib/types/domain";
import { participantSchema, ParticipantInput } from "@/lib/validations/schemas";
import { ActivityService } from "@/features/activity/service";

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

    const created = await repo.createParticipant({
      serrucho_id: serruchoId,
      name: validated.name.trim(),
      email: validated.email ? validated.email.trim().toLowerCase() : null,
      phone: validated.phone ? validated.phone.trim() : null,
      preferred_channel: validated.preferred_channel || "EMAIL",
      default_shares: validated.default_shares ?? 1,
    });

    await ActivityService.record({
      serrucho_id: serruchoId,
      actor_name: created.name,
      action_type: "PARTICIPANT_ADDED",
      entity_type: "PARTICIPANT",
      entity_id: created.id,
      summary: `Se agregó a ${created.name} al coro`,
    });

    return created;
  }

  static async update(id: string, input: Partial<ParticipantInput>): Promise<Participant> {
    const repo = getRepository();
    const existing = await repo.getParticipantById(id);
    if (!existing) throw new Error("Participante no encontrado");

    const serrucho = await repo.getSerruchoById(existing.serrucho_id);
    if (serrucho?.status === "CLOSED") {
      throw new Error("No se pueden editar participantes en un serrucho cerrado");
    }

    const updated = await repo.updateParticipant(id, {
      ...(input.name ? { name: input.name.trim() } : {}),
      ...(input.email !== undefined
        ? { email: input.email ? input.email.trim().toLowerCase() : null }
        : {}),
      ...(input.phone !== undefined ? { phone: input.phone ? input.phone.trim() : null } : {}),
      ...(input.preferred_channel ? { preferred_channel: input.preferred_channel } : {}),
      ...(input.default_shares !== undefined ? { default_shares: input.default_shares } : {}),
    });

    await ActivityService.record({
      serrucho_id: existing.serrucho_id,
      actor_name: updated.name,
      action_type: "PARTICIPANT_UPDATED",
      entity_type: "PARTICIPANT",
      entity_id: updated.id,
      summary: `Se actualizaron los datos de ${updated.name}`,
    });

    return updated;
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

    const deleted = await repo.deleteParticipant(id);
    if (deleted) {
      await ActivityService.record({
        serrucho_id: existing.serrucho_id,
        actor_name: existing.name,
        action_type: "PARTICIPANT_REMOVED",
        entity_type: "PARTICIPANT",
        entity_id: id,
        summary: `Se eliminó a ${existing.name} del coro`,
      });
    }

    return deleted;
  }
}
