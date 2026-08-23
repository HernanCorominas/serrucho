import { getRepository } from "@/lib/store";
import { Transfer, TransferWithParticipants } from "@/lib/types/domain";
import { transferSchema, TransferInput } from "@/lib/validations/schemas";
import { toCents, formatDOP } from "@/lib/finance/math";
import { ActivityService } from "@/features/activity/service";

export class TransferService {
  static async listBySerrucho(serruchoId: string): Promise<TransferWithParticipants[]> {
    const repo = getRepository();
    const [transfers, participants] = await Promise.all([
      repo.getTransfers(serruchoId),
      repo.getParticipants(serruchoId),
    ]);

    const participantMap = new Map(participants.map((p) => [p.id, p.name]));

    return transfers.map((t) => ({
      ...t,
      sender_name: participantMap.get(t.sender_participant_id) || "Desconocido",
      receiver_name: participantMap.get(t.receiver_participant_id) || "Desconocido",
    }));
  }

  static async getById(id: string): Promise<Transfer | null> {
    const repo = getRepository();
    return repo.getTransferById(id);
  }

  static async add(serruchoId: string, input: TransferInput): Promise<Transfer> {
    const validated = transferSchema.parse(input);
    const repo = getRepository();

    const serrucho = await repo.getSerruchoById(serruchoId);
    if (!serrucho) throw new Error("Serrucho no encontrado");
    if (serrucho.status === "CLOSED") {
      throw new Error("No se pueden registrar transferencias en un serrucho cerrado");
    }

    const [sender, receiver] = await Promise.all([
      repo.getParticipantById(validated.sender_participant_id),
      repo.getParticipantById(validated.receiver_participant_id),
    ]);

    if (!sender || sender.serrucho_id !== serruchoId) {
      throw new Error("Participante emisor inválido");
    }
    if (!receiver || receiver.serrucho_id !== serruchoId) {
      throw new Error("Participante receptor inválido");
    }

    const amountCents = toCents(validated.amount);

    const created = await repo.createTransfer({
      serrucho_id: serruchoId,
      sender_participant_id: validated.sender_participant_id,
      receiver_participant_id: validated.receiver_participant_id,
      amount_cents: amountCents,
      transfer_date: validated.transfer_date,
      notes: validated.notes ? validated.notes.trim() : null,
      payment_method: validated.payment_method || null,
      receipt_url: validated.receipt_url || null,
    });

    await ActivityService.record({
      serrucho_id: serruchoId,
      actor_name: sender.name,
      action_type: "TRANSFER_CREATED",
      entity_type: "TRANSFER",
      entity_id: created.id,
      summary: `${sender.name} transfirió ${formatDOP(amountCents)} a ${receiver.name}`,
      metadata: {
        amount_cents: amountCents,
        sender_id: sender.id,
        receiver_id: receiver.id,
      },
    });

    return created;
  }

  static async update(
    id: string,
    input: Partial<TransferInput>
  ): Promise<TransferWithParticipants> {
    const repo = getRepository();
    const existing = await repo.getTransferById(id);
    if (!existing) throw new Error("Transferencia no encontrada");

    const serrucho = await repo.getSerruchoById(existing.serrucho_id);
    if (serrucho?.status === "CLOSED") {
      throw new Error("No se pueden modificar transferencias en un serrucho cerrado");
    }

    const senderId = input.sender_participant_id || existing.sender_participant_id;
    const receiverId = input.receiver_participant_id || existing.receiver_participant_id;

    if (senderId === receiverId) {
      throw new Error("El emisor y el receptor no pueden ser la misma persona");
    }

    const participants = await repo.getParticipants(existing.serrucho_id);
    const validParticipantIds = new Set(participants.map((p) => p.id));

    if (!validParticipantIds.has(senderId)) {
      throw new Error("Participante emisor inválido");
    }
    if (!validParticipantIds.has(receiverId)) {
      throw new Error("Participante receptor inválido");
    }

    const amountCents =
      input.amount !== undefined ? toCents(input.amount) : existing.amount_cents;

    const updated = await repo.updateTransfer(id, {
      sender_participant_id: senderId,
      receiver_participant_id: receiverId,
      amount_cents: amountCents,
      transfer_date: input.transfer_date || existing.transfer_date,
      notes:
        input.notes !== undefined
          ? input.notes
            ? input.notes.trim()
            : null
          : existing.notes,
      payment_method:
        input.payment_method !== undefined
          ? input.payment_method
          : existing.payment_method,
      receipt_url:
        input.receipt_url !== undefined
          ? input.receipt_url
          : existing.receipt_url,
    });

    const participantMap = new Map(participants.map((p) => [p.id, p.name]));
    const senderName = participantMap.get(updated.sender_participant_id) || "Alguien";
    const receiverName = participantMap.get(updated.receiver_participant_id) || "Alguien";

    await ActivityService.record({
      serrucho_id: existing.serrucho_id,
      actor_name: senderName,
      action_type: "TRANSFER_UPDATED",
      entity_type: "TRANSFER",
      entity_id: updated.id,
      summary: `Se editó la transferencia de ${senderName} a ${receiverName} (${formatDOP(updated.amount_cents)})`,
      metadata: {
        old_amount_cents: existing.amount_cents,
        new_amount_cents: updated.amount_cents,
      },
    });

    return {
      ...updated,
      sender_name: senderName,
      receiver_name: receiverName,
    };
  }

  static async delete(id: string): Promise<boolean> {
    const repo = getRepository();
    const existing = await repo.getTransferById(id);
    if (!existing) return false;

    const serrucho = await repo.getSerruchoById(existing.serrucho_id);
    if (serrucho?.status === "CLOSED") {
      throw new Error("No se pueden eliminar transferencias en un serrucho cerrado");
    }

    const participants = await repo.getParticipants(existing.serrucho_id);
    const participantMap = new Map(participants.map((p) => [p.id, p.name]));
    const senderName = participantMap.get(existing.sender_participant_id) || "Alguien";
    const receiverName = participantMap.get(existing.receiver_participant_id) || "Alguien";

    const deleted = await repo.deleteTransfer(id);
    if (deleted) {
      await ActivityService.record({
        serrucho_id: existing.serrucho_id,
        actor_name: senderName,
        action_type: "TRANSFER_DELETED",
        entity_type: "TRANSFER",
        entity_id: id,
        summary: `Se eliminó la transferencia de ${senderName} a ${receiverName} (${formatDOP(existing.amount_cents)})`,
        metadata: {
          amount_cents: existing.amount_cents,
        },
      });
    }

    return deleted;
  }
}
