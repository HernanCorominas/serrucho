import { ResendEmailProvider } from "./email-provider";
import { WhatsAppCloudApiProvider } from "./whatsapp-provider";
import { NotificationProvider, NotificationResult, SettlementNotification } from "./types";

export class NotificationRouter {
  private emailProvider: NotificationProvider;
  private whatsAppProvider: NotificationProvider;

  constructor(
    customEmailProvider?: NotificationProvider,
    customWhatsAppProvider?: NotificationProvider
  ) {
    this.emailProvider = customEmailProvider || new ResendEmailProvider();
    this.whatsAppProvider = customWhatsAppProvider || new WhatsAppCloudApiProvider();
  }

  /**
   * Routes and dispatches a settlement notification to the appropriate channel.
   * Prioritizes participant preference, falls back safely, and captures all errors.
   */
  async routeSettlement(
    notification: SettlementNotification,
    preferredChannel: "EMAIL" | "WHATSAPP" = "EMAIL"
  ): Promise<NotificationResult> {
    try {
      // 1. Try WhatsApp if preferred and phone is available
      if (preferredChannel === "WHATSAPP" && notification.participantPhone) {
        if (this.whatsAppProvider.isAvailable()) {
          const result = await this.whatsAppProvider.sendSettlement(notification);
          if (result.success) return result;
        }
        // Fallback to Email if WhatsApp failed or wasn't available
        if (notification.participantEmail) {
          return await this.emailProvider.sendSettlement(notification);
        }
      }

      // 2. Try Email
      if (notification.participantEmail) {
        return await this.emailProvider.sendSettlement(notification);
      }

      // 3. Fallback to WhatsApp if Email wasn't available but phone is
      if (notification.participantPhone && this.whatsAppProvider.isAvailable()) {
        return await this.whatsAppProvider.sendSettlement(notification);
      }

      // 4. No valid destination configured
      return {
        success: false,
        channel: preferredChannel,
        destinationMasked: "***",
        error: "El participante no tiene email ni teléfono configurado para recibir notificaciones",
      };
    } catch (err: any) {
      return {
        success: false,
        channel: preferredChannel,
        destinationMasked: "***",
        error: err.message || "Error inesperado al enrutar notificación",
      };
    }
  }

  /**
   * Dispatches notifications to all participants in batch.
   */
  async routeBatch(
    items: { notification: SettlementNotification; preferredChannel: "EMAIL" | "WHATSAPP" }[]
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];
    for (const item of items) {
      const res = await this.routeSettlement(item.notification, item.preferredChannel);
      results.push(res);
    }
    return results;
  }
}
