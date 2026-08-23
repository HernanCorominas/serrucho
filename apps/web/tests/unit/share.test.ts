import { describe, it, expect } from "vitest";
import {
  generateSerruchoInviteMessage,
  generateSerruchoCollectionMessage,
  generateSerruchoSettlementSummaryMessage,
  formatPhoneForWhatsApp,
  buildWhatsAppShareUrl,
} from "@serrucho/core";

describe("Milestone 05: Social & WhatsApp Sharing Engine", () => {
  it("generates clean invite message with Dominican flair and no sensitive leak", () => {
    const msg = generateSerruchoInviteMessage({
      serruchoName: "Villa Las Terrenas 🌴",
      joinUrl: "https://serrucho.do/dashboard/serrucho-123",
      organizerName: "Braulio",
    });

    expect(msg).toContain("Villa Las Terrenas");
    expect(msg).toContain("por Braulio");
    expect(msg).toContain("https://serrucho.do/dashboard/serrucho-123");
    expect(msg).not.toContain("password");
    expect(msg).not.toContain("secret_token");
  });

  it("formats Dominican 10-digit phone numbers with +1 prefix", () => {
    expect(formatPhoneForWhatsApp("809-555-0199")).toBe("18095550199");
    expect(formatPhoneForWhatsApp("8295551234")).toBe("18295551234");
    expect(formatPhoneForWhatsApp("849-111-2233")).toBe("18491112233");
    expect(formatPhoneForWhatsApp("+1 809 555 0199")).toBe("18095550199");
    expect(formatPhoneForWhatsApp("")).toBe("");
  });

  it("builds valid WhatsApp URL with encoded message", () => {
    const url = buildWhatsAppShareUrl("¡Hola Mundo! 🇩🇴", "8095550199");
    expect(url).toContain("https://wa.me/18095550199?text=");
    expect(url).toContain("%C2%A1Hola%20Mundo!");
  });

  it("builds valid WhatsApp URL without phone for open sharing", () => {
    const url = buildWhatsAppShareUrl("Únete al serrucho");
    expect(url).toBe("https://wa.me/?text=%C3%9Anete%20al%20serrucho");
  });

  it("generates individual collection message with payment instructions", () => {
    const msg = generateSerruchoCollectionMessage({
      serruchoName: "Cena Cumpleaños",
      debtorName: "Carlos",
      amountFormatted: "RD$ 1,500.00",
      paymentInstructions: "tPago o BHD 8295550199",
      receiptUrl: "https://serrucho.do/s/token123",
    });

    expect(msg).toContain("Carlos");
    expect(msg).toContain("RD$ 1,500.00");
    expect(msg).toContain("tPago o BHD 8295550199");
    expect(msg).toContain("https://serrucho.do/s/token123");
  });
});
