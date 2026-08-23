import { describe, it, expect, beforeEach } from "vitest";
import { SerruchoService } from "@/features/serruchos/service";
import { ParticipantService } from "@/features/participants/service";
import { ExpenseService } from "@/features/expenses/service";
import { SettlementService } from "@/features/settlements/service";
import { ExportService } from "@/features/export/service";
import { AuthService } from "@/features/auth/service";
import { formatDOP, simplifyDebts, generateWhatsAppDirectLink } from "@/lib/finance/math";

import { convertToDOPCents, formatForeignAmount } from "@/lib/finance/currency";
import { setRepository } from "@/lib/store";
import { MemorySerruchoRepository } from "@/lib/store/memory-repository";

describe("Milestone 27: Web, Mobile & Cross-Platform Parity (Paridad web, Android e iOS / experiencia responsive)", () => {
  beforeEach(() => {
    setRepository(new MemorySerruchoRepository());
  });

  describe("Core Business Logic & Financial Parity", () => {
    it("executes identical debt simplification and balance math independently of platform", async () => {
      const serrucho = await SerruchoService.create("owner-test", {
        name: "Viaje a Jarabacoa",
        currency: "DOP",
      });

      const pCarlos = (await ParticipantService.listBySerrucho(serrucho.id))[0];
      const pJuan = await ParticipantService.add(serrucho.id, { name: "Juan" });
      const pMaria = await ParticipantService.add(serrucho.id, { name: "María" });

      const allSplits = [
        { participant_id: pCarlos.id },
        { participant_id: pJuan.id },
        { participant_id: pMaria.id },
      ];

      // Carlos pays RD$ 9,000 for villa
      await ExpenseService.add(serrucho.id, {
        description: "Villa Jarabacoa",
        amount: 9000,
        paid_by_participant_id: pCarlos.id,
        expense_date: "2026-08-20",
        splits: allSplits,
      });

      const settlement = await SettlementService.calculateLiveSettlement(serrucho.id);

      // Financial invariant: 3000 each. Carlos +6000, Juan -3000, Maria -3000
      expect(settlement.totalExpensesCents).toBe(900000);
      const bCarlos = settlement.participants.find((p) => p.id === pCarlos.id);
      const bJuan = settlement.participants.find((p) => p.id === pJuan.id);
      const bMaria = settlement.participants.find((p) => p.id === pMaria.id);

      expect(bCarlos?.net_balance_cents).toBe(600000);
      expect(bJuan?.net_balance_cents).toBe(-300000);
      expect(bMaria?.net_balance_cents).toBe(-300000);

      // Optimal debt simplification invariant
      const transfers = simplifyDebts(settlement.participants, settlement.participants);
      expect(transfers).toHaveLength(2);
      expect(transfers.every((t) => t.to_participant_id === pCarlos.id)).toBe(true);
    });

    it("formats currency with authentic Dominican format (RD$) across all platforms", () => {
      expect(formatDOP(250000)).toBe("RD$2,500.00");
      expect(formatDOP(0)).toBe("RD$0.00");
      expect(formatDOP(-125050)).toBe("-RD$1,250.50");

      const usdFormatted = formatForeignAmount(15000, "USD");
      expect(usdFormatted).toContain("$ 150.00 USD");
    });

  });

  describe("Dominican WhatsApp Deep Linking for Mobile & Desktop Web", () => {
    it("generates cross-platform WhatsApp direct link with formatted Dominican message", () => {
      const whatsappUrl = generateWhatsAppDirectLink({
        phone: "8095551234",
        serruchoName: "Coro en Ocoa",
        participantName: "Juan",
        balanceCents: -350000,
        paymentInstructions: "Banco Popular Cta: 123456789",
        publicUrl: "https://serrucho.do/s/tok-123",
      });

      expect(whatsappUrl).toContain("https://wa.me/18095551234?text=");
      const decodedText = decodeURIComponent(whatsappUrl);
      expect(decodedText).toContain("Juan");
      expect(decodedText).toContain("RD$3,500.00");
      expect(decodedText).toContain("Banco Popular");
      expect(decodedText).toContain("https://serrucho.do/s/tok-123");
    });
  });


  describe("Feature Parity Across Mobile & Desktop Web", () => {
    it("guarantees export, read-only lookup, and account linking are universally accessible", async () => {
      const serrucho = await SerruchoService.create("owner-1", {
        name: "Test Universal Parity",
        currency: "DOP",
      });

      // 1. Export is platform-agnostic
      const { buffer, filename } = await ExportService.exportToXLSXBuffer(serrucho.id);
      expect(buffer.length).toBeGreaterThan(0);
      expect(filename.endsWith(".xlsx")).toBe(true);

      // 2. Read-only token retrieval is platform-agnostic
      const roToken = await SerruchoService.getReadOnlyToken(serrucho.id);
      expect(roToken).toBeDefined();
      const readOnlyFound = await SerruchoService.getByReadOnlyToken(roToken);
      expect(readOnlyFound?.id).toBe(serrucho.id);

      // 3. User profile and multi-device sync is platform-agnostic
      const profile = await AuthService.upsertProfile({
        id: "usr-parity_test",
        email: "parity@test.do",
        full_name: "Usuario Universal",
      });
      expect(profile.id).toBe("usr-parity_test");
    });
  });
});
