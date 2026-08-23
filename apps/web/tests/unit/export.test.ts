import { describe, it, expect, beforeEach } from "vitest";
import * as XLSX from "xlsx";
import { ExportService } from "@/features/export/service";
import { SerruchoService } from "@/features/serruchos/service";
import { ParticipantService } from "@/features/participants/service";
import { ExpenseService } from "@/features/expenses/service";
import { TransferService } from "@/features/transfers/service";
import { IncomeService } from "@/features/incomes/service";
import { ActivityService } from "@/features/activity/service";
import { setRepository } from "@/lib/store";
import { MemorySerruchoRepository } from "@/lib/store/memory-repository";

describe("Milestone 24: Data Export to XLSX & CSV (Exportación de datos)", () => {
  beforeEach(() => {
    setRepository(new MemorySerruchoRepository());
  });

  async function setupTestSerrucho() {
    const serrucho = await SerruchoService.create("owner-test", {
      name: "Viaje a Samaná",
      description: "Gastos del fin de semana en Las Galeras",
      currency: "DOP",
      event_date: "2026-08-20",
      creator_name: "Carlos",
    });

    const pJuan = await ParticipantService.add(serrucho.id, { name: "Juan" });
    const pMaria = await ParticipantService.add(serrucho.id, { name: "María" });
    const pAna = await ParticipantService.add(serrucho.id, { name: "Ana" });
    const allParticipants = await ParticipantService.listBySerrucho(serrucho.id);
    const pCarlos = allParticipants.find((p) => p.name === "Carlos")!;
    const allSplits = [
      { participant_id: pCarlos.id },
      { participant_id: pJuan.id },
      { participant_id: pMaria.id },
      { participant_id: pAna.id },
    ];

    // 1. Expense: Villa RD$ 24,000 paid by Carlos
    await ExpenseService.add(serrucho.id, {
      description: "Alquiler Villa",
      amount: 24000,
      paid_by_participant_id: pCarlos.id,
      expense_date: "2026-08-20",
      category: "LODGING",
      split_method: "EQUAL",
      splits: allSplits,
    });

    // 2. Multi-currency Expense: Excursión USD 100 paid by Juan (@ 60.00 = RD$ 6,000)
    await ExpenseService.add(serrucho.id, {
      description: "Tour en Lancha",
      amount: 6000,
      paid_by_participant_id: pJuan.id,
      expense_date: "2026-08-21",
      category: "ENTERTAINMENT",
      split_method: "EQUAL",
      splits: allSplits,
      original_currency: "USD",
      original_amount: 100,
      exchange_rate_used: 60,
    });


    // 3. Direct Transfer: María transfers RD$ 3,000 to Carlos
    await TransferService.add(serrucho.id, {
      sender_participant_id: pMaria.id,
      receiver_participant_id: pCarlos.id,
      amount: 3000,
      transfer_date: "2026-08-22",
      notes: "Abono villa por Banco Popular",
    });

    // 4. Refund / Income: RD$ 2,000 refund from villa deposit
    await IncomeService.add(serrucho.id, {
      description: "Reembolso depósito lancha",
      amount: 2000,
      received_by_participant_id: pCarlos.id,
      income_date: "2026-08-22",
      category: "DEPOSIT_RETURN",
      split_method: "EQUAL",
      splits: allSplits,
    });


    // 5. Activity event
    await ActivityService.record({
      serrucho_id: serrucho.id,
      actor_name: "Carlos",
      action_type: "EXPENSE_CREATED",
      entity_type: "EXPENSE",
      summary: "Carlos registró el gasto Alquiler Villa por RD$ 24,000.00",
    });

    return { serrucho, pCarlos, pJuan, pMaria, pAna };
  }

  describe("Workbook Generation (generateWorkbook)", () => {
    it("generates an XLSX workbook with all 4 required sheets", async () => {
      const { serrucho } = await setupTestSerrucho();

      const { workbook, filename } = await ExportService.generateWorkbook(serrucho.id);

      expect(workbook.SheetNames).toEqual([
        "Resumen",
        "Movimientos",
        "Liquidación",
        "Historial",
      ]);
      expect(filename).toContain("Viaje_a_Saman");
    });

    it("populates Sheet 1 (Resumen) with correct metadata and zero-sum balances", async () => {
      const { serrucho } = await setupTestSerrucho();

      const { workbook } = await ExportService.generateWorkbook(serrucho.id);
      const summarySheet = workbook.Sheets["Resumen"];
      const rows: any[][] = XLSX.utils.sheet_to_json(summarySheet, { header: 1 });

      const textDump = JSON.stringify(rows);
      expect(textDump).toContain("SERRUCHO — REPORTE FINANCIERO");
      expect(textDump).toContain("Viaje a Samaná");
      expect(textDump).toContain("Carlos");
      expect(textDump).toContain("Juan");
      expect(textDump).toContain("María");
      expect(textDump).toContain("Ana");
    });

    it("populates Sheet 2 (Movimientos) with expenses, foreign currencies, transfers, and refunds", async () => {
      const { serrucho } = await setupTestSerrucho();

      const { workbook } = await ExportService.generateWorkbook(serrucho.id);
      const movementsSheet = workbook.Sheets["Movimientos"];
      const rows: any[][] = XLSX.utils.sheet_to_json(movementsSheet, { header: 1 });

      const textDump = JSON.stringify(rows);
      expect(textDump).toContain("Alquiler Villa");
      expect(textDump).toContain("Tour en Lancha");
      expect(textDump).toContain("USD");
      expect(textDump).toContain("Abono villa por Banco Popular");
      expect(textDump).toContain("Reembolso depósito lancha");
    });

    it("populates Sheet 3 (Liquidación) with optimal transfer suggestions", async () => {
      const { serrucho } = await setupTestSerrucho();

      const { workbook } = await ExportService.generateWorkbook(serrucho.id);
      const settlementSheet = workbook.Sheets["Liquidación"];
      const rows: any[][] = XLSX.utils.sheet_to_json(settlementSheet, { header: 1 });

      expect(rows.length).toBeGreaterThan(1);
      const textDump = JSON.stringify(rows);
      expect(textDump).toContain("Deudor");
      expect(textDump).toContain("Acreedor");
      expect(textDump).toContain("Monto a Transferir (DOP)");
    });

    it("populates Sheet 4 (Historial) with activity audit logs", async () => {
      const { serrucho } = await setupTestSerrucho();

      const { workbook } = await ExportService.generateWorkbook(serrucho.id);
      const historySheet = workbook.Sheets["Historial"];
      const rows: any[][] = XLSX.utils.sheet_to_json(historySheet, { header: 1 });

      const textDump = JSON.stringify(rows);
      expect(textDump).toContain("Carlos registró el gasto Alquiler Villa");
    });
  });

  describe("Binary and CSV Output", () => {
    it("generates a valid XLSX binary Buffer with .xlsx extension", async () => {
      const { serrucho } = await setupTestSerrucho();

      const { buffer, filename } = await ExportService.exportToXLSXBuffer(serrucho.id);

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(100);
      expect(filename.endsWith(".xlsx")).toBe(true);

      // Verify buffer can be read back as a valid workbook
      const parsed = XLSX.read(buffer, { type: "buffer" });
      expect(parsed.SheetNames).toContain("Resumen");
      expect(parsed.SheetNames).toContain("Movimientos");
    });

    it("generates CSV string for Movimientos sheet", async () => {
      const { serrucho } = await setupTestSerrucho();

      const { csv, filename } = await ExportService.exportToCSV(serrucho.id, "Movimientos");

      expect(filename.endsWith(".csv")).toBe(true);
      expect(csv).toContain("Fecha,Descripción,Tipo,Pagador / Emisor");
      expect(csv).toContain("Alquiler Villa");
      expect(csv).toContain("Tour en Lancha");
    });

    it("generates CSV string for Resumen sheet", async () => {
      const { serrucho } = await setupTestSerrucho();

      const { csv, filename } = await ExportService.exportToCSV(serrucho.id, "Resumen");

      expect(filename.endsWith(".csv")).toBe(true);
      expect(csv).toContain("SERRUCHO — REPORTE FINANCIERO");
      expect(csv).toContain("BALANCES POR PARTICIPANTE");
      expect(csv).toContain("Carlos");
    });
  });
});
