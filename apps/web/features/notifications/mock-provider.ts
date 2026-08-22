import { maskDestination } from "@/lib/security/tokens";
import { NotificationProvider, NotificationResult, SettlementNotification } from "./types";

export class MockNotificationProvider implements NotificationProvider {
  readonly channel: "EMAIL" | "WHATSAPP";
  public sentNotifications: SettlementNotification[] = [];

  constructor(channel: "EMAIL" | "WHATSAPP" = "EMAIL") {
    this.channel = channel;
  }

  isAvailable(): boolean {
    return true;
  }

  async sendSettlement(notification: SettlementNotification): Promise<NotificationResult> {
    this.sentNotifications.push(notification);
    const destination =
      this.channel === "EMAIL" ? notification.participantEmail : notification.participantPhone;
    return {
      success: true,
      channel: this.channel,
      destinationMasked: maskDestination(destination || ""),
      providerMessageId: `mock-msg-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    };
  }
}
