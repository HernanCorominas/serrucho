import { describe, it, expect, beforeEach } from "vitest";
import { CATEGORY_INFO, ExpenseCategory } from "@/lib/types/domain";
import { formatDOP, formatCurrency, generateSerruchoInviteMessage } from "@/lib/finance/math";
import { SerruchoService } from "@/features/serruchos/service";
import { ExpenseService } from "@/features/expenses/service";
import { SettlementService } from "@/features/settlements/service";
import { setRepository, getRepository } from "@/lib/store";
import { MemorySerruchoRepository } from "@/lib/store/memory-repository";

describe("Milestone 31: Deep Dominican Localization (Localización dominicana profunda)", () => {
  beforeEach(() => {
    setRepository(new MemorySerruchoRepository());
  });

  describe("Dominican Currency (RD$ / DOP) Default & Consistency", () => {
    it("uses DOP as default currency and formats amounts with RD$ consistently", async () => {
      const serrucho = await SerruchoService.create("owner-rd", {
        name: "Coro en Las Terrenas",
        currency: "DOP",
      });

      expect(serrucho.currency).toBe("DOP");
      expect(formatDOP(150000)).toBe("RD$1,500.00");
      expect(formatDOP(29900)).toBe("RD$299.00");
      expect(formatCurrency(150000, "DOP")).toBe("RD$1,500.00");
      expect(formatCurrency(5000, "USD")).toBe("US$50.00");
    });
  });

  describe("Dominican Categories (Colmado, Delivery, Frías, Gasolina, Villa)", () => {
    it("contains authentic Dominican categories and labels", () => {
      expect(CATEGORY_INFO.GROCERIES.label).toContain("Colmado");
      expect(CATEGORY_INFO.RESTAURANTS_DELIVERY.label).toContain("Delivery");
      expect(CATEGORY_INFO.DRINKS_ALCOHOL.label).toContain("Frías");
      expect(CATEGORY_INFO.GAS_FUEL.label).toContain("Peajes");
      expect(CATEGORY_INFO.LODGING.label).toContain("Villa");
      expect(CATEGORY_INFO.HOME_UTILITIES.label).toContain("Luz / Agua / Gas");
      expect(CATEGORY_INFO.INTERNET_TELECOM.label).toContain("Internet, Teléfono");
      expect(CATEGORY_INFO.OTHER.label).toContain("Coro");
    });
  });

  describe("Dominican Natural Language & Sharing Priority", () => {
    it("generates authentic Dominican WhatsApp invite message with join link", () => {
      const msg = generateSerruchoInviteMessage({
        serruchoName: "Viaje a Samaná",
        joinUrl: "https://serrucho.do/dashboard/ser-samana",
      });

      expect(msg).toContain("¡Únete al Serrucho");
      expect(msg).toContain("Viaje a Samaná");
      expect(msg).toContain("https://serrucho.do/dashboard/ser-samana");
      expect(msg).toContain("gastos del coro");
      expect(msg).toContain("Serrucho 🇩🇴");
    });

    it("settlement terminology uses natural Dominican terms (saldado, deudas, balances)", async () => {
      const serrucho = await SerruchoService.create("owner-rd", {
        name: "Cena en la Zona Colonial",
        currency: "DOP",
      });


      const repo = getRepository();
      const p1 = (await repo.getParticipants(serrucho.id))[0];
      const p2 = await repo.createParticipant({
        serrucho_id: serrucho.id,
        name: "Carlos",
        email: null,
        phone: null,
        preferred_channel: "WHATSAPP",
        user_id: null,
        access_status: "IDENTIFIED",
        last_seen_at: new Date().toISOString(),
      });

      await ExpenseService.add(serrucho.id, {
        description: "Pescado Boca Chica",
        amount: 3000,
        paid_by_participant_id: p1.id,
        expense_date: "2026-08-20",
        splits: [{ participant_id: p1.id }, { participant_id: p2.id }],
      });

      const settlement = await SettlementService.calculateLiveSettlement(serrucho.id);
      expect(settlement.participants.find((p) => p.id === p1.id)?.net_balance_cents).toBe(150000); // Te deben RD$ 1,500
      expect(settlement.participants.find((p) => p.id === p2.id)?.net_balance_cents).toBe(-150000); // Debes RD$ 1,500
    });
  });
});
