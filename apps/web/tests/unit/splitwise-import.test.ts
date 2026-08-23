import { describe, it, expect, beforeEach } from "vitest";
import { ImportService } from "@/features/import/service";
import { SettlementService } from "@/features/settlements/service";
import { setRepository, getRepository } from "@/lib/store";
import { MemorySerruchoRepository } from "@/lib/store/memory-repository";

describe("Milestone 29: Splitwise & CSV Import Pipeline (Importación de datos desde otras apps)", () => {
  beforeEach(() => {
    setRepository(new MemorySerruchoRepository());
  });

  const SAMPLE_SPLITWISE_CSV = `Date,Description,Category,Cost,Currency,Carlos,Laura,Pedro
2026-08-10,Villa Jarabacoa,Lodging,12000.00,DOP,4000.00,4000.00,4000.00
2026-08-11,Supermercado Nacional,Groceries,4500.50,DOP,1500.17,1500.17,1500.16
2026-08-12,Gasolina y Peajes,Transport,1500.00,DOP,500.00,500.00,500.00`;

  const SAMPLE_SERRUCHO_CSV = `Fecha,Descripcion,Monto,Moneda,Pagado_Por,Participantes,Categoria
2026-08-15,Cena Zona Colonial,6000,DOP,Manuel,Manuel|Sofía|Andrés,FOOD_DINING
2026-08-16,Bebidas & Hielo,2400,DOP,Sofía,Manuel|Sofía|Andrés,DRINKS_ALCOHOL`;

  describe("Pipeline: Parse -> Normalize -> Validate -> Preview", () => {
    it("parses Splitwise CSV, detects participants and amounts without creating database entities", async () => {
      const repo = getRepository();
      const initialSerruchos = await repo.getSerruchosByOwner("test-user");

      // Execute Dry-Run Preview
      const preview = await ImportService.parseAndPreview(SAMPLE_SPLITWISE_CSV, {
        defaultCurrency: "DOP",
        serruchoName: "Viaje Jarabacoa 2026",
      });

      // Assert preview structure
      expect(preview.format_detected).toBe("SPLITWISE_CSV");
      expect(preview.is_valid).toBe(true);
      expect(preview.errors).toHaveLength(0);
      expect(preview.participant_names).toEqual(["Carlos", "Laura", "Pedro"]);
      expect(preview.total_movements).toBe(3);
      expect(preview.total_expenses_cents).toBe(1800050); // 12000.00 + 4500.50 + 1500.00 = 18000.50 DOP

      // CRITICAL RULE: Preview must NOT create any records in DB
      const serruchosAfterPreview = await repo.getSerruchosByOwner("test-user");
      expect(serruchosAfterPreview).toEqual(initialSerruchos);
    });

    it("parses Serrucho standard CSV with pipe-separated participant lists", async () => {
      const preview = await ImportService.parseAndPreview(SAMPLE_SERRUCHO_CSV);

      expect(preview.format_detected).toBe("SERRUCHO_CSV");
      expect(preview.is_valid).toBe(true);
      expect(preview.participant_names).toContain("Manuel");
      expect(preview.participant_names).toContain("Sofía");
      expect(preview.participant_names).toContain("Andrés");
      expect(preview.total_movements).toBe(2);
      expect(preview.total_expenses_cents).toBe(840000); // 6000 + 2400 = 8400 DOP
    });

    it("fails validation gracefully for empty or invalid CSV files", async () => {
      // Empty string
      const emptyPreview = await ImportService.parseAndPreview("");
      expect(emptyPreview.is_valid).toBe(false);
      expect(emptyPreview.errors.length).toBeGreaterThan(0);

      // Header only
      const headerOnly = await ImportService.parseAndPreview("Date,Description,Cost\n");
      expect(headerOnly.is_valid).toBe(false);
      expect(headerOnly.errors.length).toBeGreaterThan(0);
    });
  });

  describe("Pipeline: Confirm -> Persist (Atomic Creation)", () => {
    it("atomically creates the Serrucho, participants, expenses with splits, and audit trail", async () => {
      const repo = getRepository();

      // 1. Preview
      const preview = await ImportService.parseAndPreview(SAMPLE_SPLITWISE_CSV, {
        serruchoName: "Coro Jarabacoa Importado",
        defaultCurrency: "DOP",
      });

      // 2. Confirm and Persist
      const result = await ImportService.confirmAndPersist("usr-migrator", {
        serrucho_name: "Coro Jarabacoa Importado",
        currency: "DOP",
        participant_names: preview.participant_names,
        movements: preview.movements,
      });

      expect(result.serrucho.id).toBeDefined();
      expect(result.participantsCount).toBe(3);
      expect(result.movementsCount).toBe(3);

      // 3. Verify DB state and Financial Calculations
      const participants = await repo.getParticipants(result.serrucho.id);
      expect(participants).toHaveLength(3);

      const expenses = await repo.getExpenses(result.serrucho.id);
      expect(expenses).toHaveLength(3);

      const settlement = await SettlementService.calculateLiveSettlement(result.serrucho.id);
      expect(settlement.totalExpensesCents).toBe(1800050);
      expect(settlement.participants).toHaveLength(3);

      // Verify audit trail logged import
      const audit = await repo.getActivityEvents(result.serrucho.id);
      expect(audit.some((a) => a.action_type === "SERRUCHO_CREATED")).toBe(true);
    });
  });
});
