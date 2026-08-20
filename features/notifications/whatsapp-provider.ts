import { formatDOP } from "@/lib/finance/math";
import { maskDestination } from "@/lib/security/tokens";
import { NotificationProvider, NotificationResult, SettlementNotification } from "./types";

export class WhatsAppCloudApiProvider implements NotificationProvider {
  readonly channel = "WHATSAPP" as const;
  private accessToken?: string;
  private phoneNumberId?: string;
  private templateName: string;

  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.templateName = process.env.WHATSAPP_TEMPLATE_NAME || "serrucho_settlement_notification";
  }

  isAvailable(): boolean {
    return !!(this.accessToken && this.phoneNumberId);
  }

  async sendSettlement(notification: SettlementNotification): Promise<NotificationResult> {
    const phone = notification.participantPhone;
    const masked = phone ? maskDestination(phone) : "***";

    if (!phone) {
      return {
        success: false,
        channel: "WHATSAPP",
        destinationMasked: masked,
        error: "El participante no tiene número de teléfono configurado",
      };
    }

    // Clean phone number (Dominican standard prefix 1 for country code if missing)
    let cleanPhone = phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length === 10) {
      cleanPhone = `1${cleanPhone}`; // Add Dominican Republic / NANP country code
    }

    if (!this.isAvailable()) {
      console.log(`[WhatsApp Simulated to ${masked}] Serrucho: ${notification.serruchoName}, Balance: ${formatDOP(notification.balanceCents)}`);
      return {
        success: true,
        channel: "WHATSAPP",
        destinationMasked: masked,
        providerMessageId: `simulated-wa-${Date.now()}`,
      };
    }

    try {
      const url = `https://graph.facebook.com/v21.0/${this.phoneNumberId}/messages`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: cleanPhone,
          type: "template",
          template: {
            name: this.templateName,
            language: { code: "es" },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: notification.participantName },
                  { type: "text", text: notification.serruchoName },
                  { type: "text", text: formatDOP(Math.abs(notification.balanceCents)) },
                  { type: "text", text: notification.publicUrl },
                ],
              },
            ],
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          channel: "WHATSAPP",
          destinationMasked: masked,
          error: data.error?.message || "Error al enviar mensaje por WhatsApp Cloud API",
        };
      }

      return {
        success: true,
        channel: "WHATSAPP",
        destinationMasked: masked,
        providerMessageId: data.messages?.[0]?.id,
      };
    } catch (err: any) {
      return {
        success: false,
        channel: "WHATSAPP",
        destinationMasked: masked,
        error: err.message || "Error de red en WhatsApp Cloud API",
      };
    }
  }
}
