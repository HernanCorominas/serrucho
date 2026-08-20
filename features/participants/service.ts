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

    // Check if participant has expenses or splits
    const expenses = await repo.getExpenses(existing.serrucho_id);
    const hasPaid = expenses.some((e) => e.paid_by_participant_id === id);
    if (hasPaid) {
      throw new Error(
        "No puedes eliminar un participante que tiene gastos registrados a su nombre. Elimina o reasigna sus gastos primero."
      );
    }

    return repo.deleteParticipant(id);
  }
}
