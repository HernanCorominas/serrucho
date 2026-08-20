import { describe, it, expect } from "vitest";
import { NotificationRouter } from "@/features/notifications/router";
import { MockNotificationProvider } from "@/features/notifications/mock-provider";
import { SettlementNotification } from "@/features/notifications/types";

describe("Notification Router", () => {
  const sampleNotification: SettlementNotification = {
    serruchoId: "s-1",
    serruchoName: "Playa 2026",
    participantId: "p-1",
    participantName: "Juan Pérez",
    participantEmail: "juan@example.com",
    participantPhone: "8095550102",
    balanceCents: -25000,
    totalExpensesCents: 100000,
    owedCents: 50000,
    paidCents: 25000,
    paymentInstructions: "Banco BHD 123456",
    paymentDeadline: "2026-08-30",
    publicUrl: "http://localhost:3000/s/abc123token",
  };

  it("routes to Email when preferred channel is EMAIL", async () => {
    const mockEmail = new MockNotificationProvider("EMAIL");
    const mockWA = new MockNotificationProvider("WHATSAPP");
    const router = new NotificationRouter(mockEmail, mockWA);

    const result = await router.routeSettlement(sampleNotification, "EMAIL");

    expect(result.success).toBe(true);
    expect(result.channel).toBe("EMAIL");
    expect(mockEmail.sentNotifications.length).toBe(1);
    expect(mockWA.sentNotifications.length).toBe(0);
  });

  it("routes to WhatsApp when preferred channel is WHATSAPP", async () => {
    const mockEmail = new MockNotificationProvider("EMAIL");
    const mockWA = new MockNotificationProvider("WHATSAPP");
    const router = new NotificationRouter(mockEmail, mockWA);

    const result = await router.routeSettlement(sampleNotification, "WHATSAPP");

    expect(result.success).toBe(true);
    expect(result.channel).toBe("WHATSAPP");
    expect(mockWA.sentNotifications.length).toBe(1);
  });

  it("falls back to Email if WhatsApp destination is missing", async () => {
    const mockEmail = new MockNotificationProvider("EMAIL");
    const mockWA = new MockNotificationProvider("WHATSAPP");
    const router = new NotificationRouter(mockEmail, mockWA);

    const noPhone = { ...sampleNotification, participantPhone: null };
    const result = await router.routeSettlement(noPhone, "WHATSAPP");

    expect(result.success).toBe(true);
    expect(result.channel).toBe("EMAIL");
    expect(mockEmail.sentNotifications.length).toBe(1);
  });

  it("returns clean failure when participant has neither email nor phone", async () => {
    const mockEmail = new MockNotificationProvider("EMAIL");
    const mockWA = new MockNotificationProvider("WHATSAPP");
    const router = new NotificationRouter(mockEmail, mockWA);

    const noContact = {
      ...sampleNotification,
      participantEmail: null,
      participantPhone: null,
    };
    const result = await router.routeSettlement(noContact, "EMAIL");

    expect(result.success).toBe(false);
    expect(result.error).toContain("no tiene email ni teléfono");
  });
});
