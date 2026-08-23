import { getRepository } from "@/lib/store";
import { formatDOP } from "@/lib/finance/math";
import { ActivityService } from "@/features/activity/service";

// In-memory rate limiting map: `${serruchoId}_${debtorId}` -> timestamp (ms)
const REMINDER_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes cooldown
const reminderTimestampMap = new Map<string, number>();

export class WhatsAppReminderService {
  /**
   * Generates a cordial, Dominican reminder text.
   */
  static buildReminderMessage(params: {
    serruchoName: string;
    debtorName: string;
    creditorName?: string;
    amountCents: number;
    paymentInstructions?: string | null;
    publicUrl?: string | null;
  }): string {
    const amountStr = formatDOP(Math.abs(params.amountCents));

    let msg =
      `¡Hey ${params.debtorName}! 👋 Te recuerdo que tienes pendiente ${amountStr} del Serrucho *${params.serruchoName}*.\n\n` +
      `Cuando puedas, saldamos esa parte. ¡Gracias! 🙌`;

    if (params.paymentInstructions?.trim()) {
      msg += `\n\n🏦 *Datos para transferir:*\n${params.paymentInstructions.trim()}`;
    }

    if (params.publicUrl?.trim()) {
      msg += `\n\n📄 *Revisa el estado de cuenta aquí:*\n${params.publicUrl.trim()}`;
    }

    return msg;
  }

  /**
   * Generates a cross-platform WhatsApp direct link with Dominican area code formatting.
   */
  static generateWhatsAppUrl(phone: string | null | undefined, message: string): string {
    const encoded = encodeURIComponent(message.trim());
    let cleanPhone = (phone || "").replace(/[^0-9]/g, "");

    // Add Dominican country code 1 if missing
    if (
      cleanPhone.length === 10 &&
      (cleanPhone.startsWith("809") || cleanPhone.startsWith("829") || cleanPhone.startsWith("849"))
    ) {
      cleanPhone = `1${cleanPhone}`;
    }

    if (cleanPhone) {
      return `https://wa.me/${cleanPhone}?text=${encoded}`;
    }

    return `https://wa.me/?text=${encoded}`;
  }

  /**
   * Checks rate limiting to prevent spamming.
   */
  static canSendReminder(
    serruchoId: string,
    debtorParticipantId: string
  ): { allowed: boolean; remainingSeconds: number } {
    const key = `${serruchoId}_${debtorParticipantId}`;
    const lastSent = reminderTimestampMap.get(key);
    if (!lastSent) return { allowed: true, remainingSeconds: 0 };

    const elapsed = Date.now() - lastSent;
    if (elapsed < REMINDER_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((REMINDER_COOLDOWN_MS - elapsed) / 1000);
      return { allowed: false, remainingSeconds };
    }

    return { allowed: true, remainingSeconds: 0 };
  }

  /**
   * Records the intention of sending a manual reminder in audit trail and notification logs.
   * STRICT NOTE: Explicitly marks that the user requested the reminder, does NOT assume payment occurred.
   */
  static async recordReminderIntent(params: {
    serruchoId: string;
    debtorParticipantId: string;
    debtorName: string;
    senderName?: string;
    phone?: string | null;
    amountCents: number;
    customMessage?: string;
  }): Promise<{ success: boolean; whatsappUrl: string }> {
    const { allowed, remainingSeconds } = this.canSendReminder(
      params.serruchoId,
      params.debtorParticipantId
    );

    if (!allowed) {
      throw new Error(
        `Debes esperar ${remainingSeconds} segundos antes de enviar otro recordatorio a ${params.debtorName}.`
      );
    }

    const repo = getRepository();
    const serrucho = await repo.getSerruchoById(params.serruchoId);
    if (!serrucho) throw new Error("Serrucho no encontrado");

    const message =
      params.customMessage ||
      this.buildReminderMessage({
        serruchoName: serrucho.name,
        debtorName: params.debtorName,
        amountCents: params.amountCents,
        paymentInstructions: serrucho.payment_instructions,
      });

    const whatsappUrl = this.generateWhatsAppUrl(params.phone, message);

    // Update rate limit timestamp
    const key = `${params.serruchoId}_${params.debtorParticipantId}`;
    reminderTimestampMap.set(key, Date.now());

    // Record notification log
    await repo.createNotificationLog({
      serrucho_id: params.serruchoId,
      participant_id: params.debtorParticipantId,
      snapshot_id: null,
      channel: "WHATSAPP",
      destination_masked: params.phone ? `***${params.phone.slice(-4)}` : params.debtorName,
      status: "SENT",
      provider_message_id: null,
      error_message: null,
      sent_at: new Date().toISOString(),
    });


    // Record audit event
    await ActivityService.record({
      serrucho_id: params.serruchoId,
      actor_name: params.senderName || "Organizador",
      action_type: "PARTICIPANT_UPDATED",
      entity_type: "PARTICIPANT",
      entity_id: params.debtorParticipantId,
      summary: `${params.senderName || "Organizador"} solicitó enviar un recordatorio por WhatsApp a ${params.debtorName}.`,
    });

    return { success: true, whatsappUrl };
  }
}
