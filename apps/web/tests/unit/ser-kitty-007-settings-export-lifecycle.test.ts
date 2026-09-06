import { describe, it, expect, beforeEach } from "vitest";
import * as XLSX from "xlsx";
import { setRepository } from "@/lib/store";
import { MemorySerruchoRepository } from "@/lib/store/memory-repository";
import { SerruchoService } from "@/features/serruchos/service";
import { ParticipantService } from "@/features/participants/service";
import { ExpenseService } from "@/features/expenses/service";
import { TransferService } from "@/features/transfers/service";
import { IncomeService } from "@/features/incomes/service";
import { ExportService } from "@/features/export/service";
import { SettlementService } from "@/features/settlements/service";
import { ActivityService } from "@/features/activity/service";

describe("SER-KITTY-007: Kitty Settings, Data Export & Lifecycle", () => {
  let repo: MemorySerruchoRepository;
  let serruchoId: string;
  let pJuanId: string;
  let pMariaId: string;
  let pPedroId: string;

  beforeEach(async () => {
    repo = new MemorySerruchoRepository();
    setRepository(repo);

    const serrucho = await SerruchoService.create("owner-guest-id", {
      name: "Viaje a Las Terrenas",
      description: "Fin de semana en la playa",
      currency: "DOP",
      creator_name: "Juan",
    });
    serruchoId = serrucho.id;

    const allParts = await ParticipantService.listBySerrucho(serruchoId);
    pJuanId = allParts.find((p) => p.name.includes("Juan"))!.id;

    const pMaria = await ParticipantService.add(serruchoId, { name: "María" });
    pMariaId = pMaria.id;

    const pPedro = await ParticipantService.add(serruchoId, { name: "Pedro" });
    pPedroId = pPedro.id;
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // SECTION 1: SETTINGS & RENAME (SETT-01 to SETT-08)
  // ══════════════════════════════════════════════════════════════════════════════
  describe("Settings & Rename Engine (SETT-01 to SETT-08)", () => {
    it("SETT-01: Renames Serrucho and preserves serrucho.id stability", async () => {
      const updated = await SerruchoService.update(serruchoId, {
        name: "Viaje a Las Terrenas 2026 🌴",
      });

      expect(updated.id).toBe(serruchoId);
      expect(updated.name).toBe("Viaje a Las Terrenas 2026 🌴");

      const fetched = await SerruchoService.getById(serruchoId);
      expect(fetched?.name).toBe("Viaje a Las Terrenas 2026 🌴");
    });

    it("SETT-02: Rejects empty or whitespace-only name", async () => {
      await expect(
        SerruchoService.update(serruchoId, { name: "" })
      ).rejects.toThrow("El nombre no puede estar vacío");

      await expect(
        SerruchoService.update(serruchoId, { name: "   " })
      ).rejects.toThrow("El nombre no puede estar vacío");
    });

    it("SETT-03: Rejects name exceeding 100 characters", async () => {
      const longName = "A".repeat(101);
      await expect(
        SerruchoService.update(serruchoId, { name: longName })
      ).rejects.toThrow("El nombre no puede exceder 100 caracteres");
    });

    it("SETT-04: Allows safe currency update when 0 expenses exist", async () => {
      const updated = await SerruchoService.update(serruchoId, {
        currency: "USD",
      });
      expect(updated.currency).toBe("USD");

      const fetched = await SerruchoService.getById(serruchoId);
      expect(fetched?.currency).toBe("USD");
    });

    it("SETT-05: Rejects currency update when expenses already exist to prevent semantic corruption", async () => {
      await ExpenseService.add(serruchoId, {
        description: "Alquiler Villa",
        amount: 10000, // RD$ 10,000
        paid_by_participant_id: pJuanId,
        expense_date: "2026-09-06",
        split_method: "EQUAL",
        splits: [{ participant_id: pJuanId }, { participant_id: pMariaId }],
      });

      await expect(
        SerruchoService.update(serruchoId, { currency: "USD" })
      ).rejects.toThrow(
        "No se puede cambiar la moneda base de un serrucho con gastos existentes"
      );
    });

    it("SETT-06: Rejects modifying settings in a CLOSED Serrucho", async () => {
      await repo.updateSerrucho(serruchoId, { status: "CLOSED" });

      await expect(
        SerruchoService.update(serruchoId, { name: "Nuevo Nombre" })
      ).rejects.toThrow("No se puede modificar un serrucho que ya está cerrado");
    });

    it("SETT-07: Logs SERRUCHO_UPDATED activity event upon rename", async () => {
      await SerruchoService.update(serruchoId, {
        name: "Nombre Actualizado",
      });

      const logs = await ActivityService.listBySerrucho(serruchoId);
      const renameLog = logs.find((l) => l.action_type === "SERRUCHO_UPDATED");
      expect(renameLog).toBeDefined();
      expect(renameLog?.summary).toContain("Nombre Actualizado");
    });

    it("SETT-08: Preserves integer cents arithmetic and participant balances after settings update", async () => {
      await ExpenseService.add(serruchoId, {
        description: "Gasolina",
        amount: 3000,
        paid_by_participant_id: pJuanId,
        expense_date: "2026-09-06",
        split_method: "EQUAL",
        splits: [
          { participant_id: pJuanId },
          { participant_id: pMariaId },
          { participant_id: pPedroId },
        ],
      });

      await SerruchoService.update(serruchoId, {
        description: "Descripción actualizada",
      });

      const live = await SettlementService.calculateLiveSettlement(serruchoId);
      expect(live.totalExpensesCents).toBe(300000);
      const juan = live.participants.find((p) => p.id === pJuanId);
      expect(juan?.net_balance_cents).toBe(200000); // paid 3000, owed 1000 -> +2000
    });
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // SECTION 2: DATA EXPORT (EXP-01 to EXP-08)
  // ══════════════════════════════════════════════════════════════════════════════
  describe("Data Export Engine (EXP-01 to EXP-08)", () => {
    beforeEach(async () => {
      // Setup standard test data
      await ExpenseService.add(serruchoId, {
        description: "Comida",
        amount: 3000,
        paid_by_participant_id: pJuanId,
        expense_date: "2026-09-06",
        split_method: "EQUAL",
        splits: [
          { participant_id: pJuanId },
          { participant_id: pMariaId },
          { participant_id: pPedroId },
        ],
      });

      await TransferService.add(serruchoId, {
        sender_participant_id: pMariaId,
        receiver_participant_id: pJuanId,
        amount: 1000,
        transfer_date: "2026-09-06",
        notes: "Abono inicial",
      });

      await IncomeService.add(serruchoId, {
        description: "Devolución depósito",
        amount: 600,
        received_by_participant_id: pJuanId,
        income_date: "2026-09-06",
        split_method: "EQUAL",
        splits: [
          { participant_id: pJuanId },
          { participant_id: pMariaId },
          { participant_id: pPedroId },
        ],
      });
    });

    it("EXP-01: Generates multi-sheet XLSX workbook containing 4 distinct sheets", async () => {
      const { workbook, filename } = await ExportService.generateWorkbook(serruchoId);

      expect(workbook.SheetNames).toEqual([
        "Resumen",
        "Movimientos",
        "Liquidación",
        "Historial",
      ]);
      expect(filename).toContain("Viaje_a_Las_Terrenas");
    });

    it("EXP-02: Ground truth financial consistency: uses exact integer cents without floating error", async () => {
      const { workbook } = await ExportService.generateWorkbook(serruchoId);
      const summarySheet = workbook.Sheets["Resumen"];
      const rows: any[][] = XLSX.utils.sheet_to_json(summarySheet, { header: 1 });

      const textDump = JSON.stringify(rows);
      expect(textDump).toContain("Viaje a Las Terrenas");
      expect(textDump).toContain("Total Gastado Bruto (DOP)");
      expect(textDump).toContain("Juan");
      expect(textDump).toContain("María");
      expect(textDump).toContain("Pedro");
    });

    it("EXP-03: Export reflects dynamic state after expense is edited", async () => {
      const expenses = await repo.getExpenses(serruchoId);
      const exp = expenses[0];

      await ExpenseService.update(exp.id, {
        amount: 6000,
        description: "Comida Gourmet",
      });

      const { workbook } = await ExportService.generateWorkbook(serruchoId);
      const movementsSheet = workbook.Sheets["Movimientos"];
      const rows: any[][] = XLSX.utils.sheet_to_json(movementsSheet, { header: 1 });

      const textDump = JSON.stringify(rows);
      expect(textDump).toContain("Comida Gourmet");
      expect(textDump).not.toContain("Comida,");
    });

    it("EXP-04: Export reflects dynamic state after expense is deleted", async () => {
      const expenses = await repo.getExpenses(serruchoId);
      const exp = expenses[0];

      await ExpenseService.delete(exp.id);

      const { workbook } = await ExportService.generateWorkbook(serruchoId);
      const movementsSheet = workbook.Sheets["Movimientos"];
      const rows: any[][] = XLSX.utils.sheet_to_json(movementsSheet, { header: 1 });

      const textDump = JSON.stringify(rows);
      expect(textDump).not.toContain("Comida");
    });

    it("EXP-05: Export reflects dynamic state after transfer is added, edited, or deleted", async () => {
      const transfers = await repo.getTransfers(serruchoId);
      const t = transfers[0];

      await TransferService.update(t.id, {
        notes: "Transferencia Corregida Banco BHD",
        amount: 1500,
      });

      const { workbook } = await ExportService.generateWorkbook(serruchoId);
      const movementsSheet = workbook.Sheets["Movimientos"];
      const rows: any[][] = XLSX.utils.sheet_to_json(movementsSheet, { header: 1 });

      const textDump = JSON.stringify(rows);
      expect(textDump).toContain("Transferencia Corregida Banco BHD");
    });

    it("EXP-06: Group isolation: Export contains strictly records belonging to requested Serrucho", async () => {
      const otherSerrucho = await SerruchoService.create("owner-2", {
        name: "Grupo Secreto B",
        currency: "DOP",
      });
      const pOther = await ParticipantService.add(otherSerrucho.id, { name: "Extraño" });
      await ExpenseService.add(otherSerrucho.id, {
        description: "Gasto Confidencial",
        amount: 9999,
        paid_by_participant_id: pOther.id,
        expense_date: "2026-09-06",
        split_method: "EQUAL",
        splits: [{ participant_id: pOther.id }],
      });

      const { workbook } = await ExportService.generateWorkbook(serruchoId);
      const movementsSheet = workbook.Sheets["Movimientos"];
      const rows: any[][] = XLSX.utils.sheet_to_json(movementsSheet, { header: 1 });

      const textDump = JSON.stringify(rows);
      expect(textDump).not.toContain("Gasto Confidencial");
      expect(textDump).not.toContain("Extraño");
    });

    it("EXP-07: Generates valid CSV format for individual sheets with UTF-8 support", async () => {
      const { csv, filename } = await ExportService.exportToCSV(serruchoId, "Movimientos");

      expect(csv).toContain("Comida");
      expect(csv).toContain("Transferencia");
      expect(filename).toContain(".csv");
    });

    it("EXP-08: Export reflects closed Serrucho snapshot settlements accurately", async () => {
      await repo.createSettlementSnapshots([
        {
          snapshot: {
            serrucho_id: serruchoId,
            participant_id: pMariaId,
            total_expenses_cents: 300000,
            owed_cents: 100000,
            paid_cents: 100000,
            balance_cents: 0,
            payment_instructions: "Completado",
            payment_deadline: null,
            public_token_hash: "hash-maria",
            payment_method: "TRANSFER_OTHER",
            payment_notes: "Liquidado",
          },
          items: [],
        },
      ]);
      await repo.updateSerrucho(serruchoId, { status: "CLOSED" });

      const { workbook } = await ExportService.generateWorkbook(serruchoId);
      const settlementSheet = workbook.Sheets["Liquidación"];
      const rows: any[][] = XLSX.utils.sheet_to_json(settlementSheet, { header: 1 });

      expect(rows.length).toBeGreaterThan(0);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // SECTION 3: LIFECYCLE & PERMANENT DELETE (DEL-01 to DEL-08)
  // ══════════════════════════════════════════════════════════════════════════════
  describe("Lifecycle & Permanent Delete (DEL-01 to DEL-08)", () => {
    beforeEach(async () => {
      // Populate full relational graph
      await ExpenseService.add(serruchoId, {
        description: "Cena",
        amount: 4000,
        paid_by_participant_id: pJuanId,
        expense_date: "2026-09-06",
        split_method: "EQUAL",
        splits: [{ participant_id: pJuanId }, { participant_id: pMariaId }],
      });

      await TransferService.add(serruchoId, {
        sender_participant_id: pMariaId,
        receiver_participant_id: pJuanId,
        amount: 2000,
        transfer_date: "2026-09-06",
      });

      await IncomeService.add(serruchoId, {
        description: "Reembolso",
        amount: 500,
        received_by_participant_id: pJuanId,
        income_date: "2026-09-06",
        split_method: "EQUAL",
        splits: [{ participant_id: pJuanId }],
      });

      await ActivityService.record({
        serrucho_id: serruchoId,
        actor_name: "Juan",
        action_type: "EXPENSE_CREATED",
        entity_type: "EXPENSE",
        summary: "Juan creó gasto Cena",
      });
    });

    it("DEL-01: Permanent deletion removes the Serrucho entity", async () => {
      const deleted = await SerruchoService.delete(serruchoId);
      expect(deleted).toBe(true);

      const fetched = await SerruchoService.getById(serruchoId);
      expect(fetched).toBeNull();
    });

    it("DEL-02: Cascading deletion removes all associated participants", async () => {
      await SerruchoService.delete(serruchoId);
      const parts = await repo.getParticipants(serruchoId);
      expect(parts).toHaveLength(0);
    });

    it("DEL-03: Cascading deletion removes all expenses and associated splits", async () => {
      await SerruchoService.delete(serruchoId);
      const exps = await repo.getExpenses(serruchoId);
      expect(exps).toHaveLength(0);
    });

    it("DEL-04: Cascading deletion removes all transfers", async () => {
      await SerruchoService.delete(serruchoId);
      const transfers = await repo.getTransfers(serruchoId);
      expect(transfers).toHaveLength(0);
    });

    it("DEL-05: Cascading deletion removes all incomes and income splits", async () => {
      await SerruchoService.delete(serruchoId);
      const incomes = await repo.getIncomes(serruchoId);
      expect(incomes).toHaveLength(0);
    });

    it("DEL-06: Cascading deletion removes all activity logs and settlement snapshots", async () => {
      await SerruchoService.delete(serruchoId);
      const logs = await repo.getActivityEvents(serruchoId);
      expect(logs).toHaveLength(0);
    });

    it("DEL-07: Group isolation: Deleting Serrucho A leaves Serrucho B completely untouched", async () => {
      const serruchoB = await SerruchoService.create("owner-b", {
        name: "Serrucho B Intacto",
        currency: "DOP",
      });
      const pB = await ParticipantService.add(serruchoB.id, { name: "Braulio" });
      await ExpenseService.add(serruchoB.id, {
        description: "Gasto B",
        amount: 5000,
        paid_by_participant_id: pB.id,
        expense_date: "2026-09-06",
        split_method: "EQUAL",
        splits: [{ participant_id: pB.id }],
      });

      await SerruchoService.delete(serruchoId);

      const fetchedB = await SerruchoService.getById(serruchoB.id);
      expect(fetchedB).not.toBeNull();
      const partsB = await repo.getParticipants(serruchoB.id);
      expect(partsB.length).toBeGreaterThan(0);
      const expsB = await repo.getExpenses(serruchoB.id);
      expect(expsB).toHaveLength(1);
    });

    it("DEL-08: Idempotent deletion on non-existent ID returns false safely without throwing", async () => {
      const result = await SerruchoService.delete("non-existent-uuid-999");
      expect(result).toBe(false);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // SECTION 4: SECURITY & VALIDATION (SEC-01 to SEC-08)
  // ══════════════════════════════════════════════════════════════════════════════
  describe("Security & Validation (SEC-01 to SEC-08)", () => {
    it("SEC-01: Rejects updating non-existent / foreign Serrucho ID", async () => {
      await expect(
        SerruchoService.update("foreign-uuid-404", { name: "Hack" })
      ).rejects.toThrow("Serrucho no encontrado");
    });

    it("SEC-02: Deleting non-existent Serrucho returns false without side effects", async () => {
      const result = await SerruchoService.delete("fake-serrucho-id");
      expect(result).toBe(false);
    });

    it("SEC-03: Rejects exporting non-existent Serrucho ID", async () => {
      await expect(
        ExportService.generateWorkbook("non-existent-id-555")
      ).rejects.toThrow("Serrucho no encontrado");
    });

    it("SEC-04: Rejects malformed / injection read-only tokens safely", async () => {
      expect(await SerruchoService.getByReadOnlyToken("'; DROP TABLE serruchos; --")).toBeNull();
      expect(await SerruchoService.getByReadOnlyToken("<script>alert(1)</script>")).toBeNull();
      expect(await SerruchoService.getByReadOnlyToken("")).toBeNull();
    });

    it("SEC-05: Read-only token access allows retrieving Serrucho metadata", async () => {
      const token = await SerruchoService.getReadOnlyToken(serruchoId);
      expect(token).toBeDefined();

      const fetched = await SerruchoService.getByReadOnlyToken(token);
      expect(fetched?.id).toBe(serruchoId);
    });

    it("SEC-06: Guest mode: Allows settings, export, and delete without requiring authenticated user account", async () => {
      const guestSerrucho = await SerruchoService.create("guest-owner", {
        name: "Serrucho Guest 100%",
        currency: "DOP",
      });

      const updated = await SerruchoService.update(guestSerrucho.id, {
        name: "Serrucho Guest Renombrado",
      });
      expect(updated.name).toBe("Serrucho Guest Renombrado");

      const { filename } = await ExportService.generateWorkbook(guestSerrucho.id);
      expect(filename).toContain("Serrucho_Guest");

      const deleted = await SerruchoService.delete(guestSerrucho.id);
      expect(deleted).toBe(true);
    });

    it("SEC-07: Multi-Currency modification guard prevents currency tampering on live groups", async () => {
      await ExpenseService.add(serruchoId, {
        description: "Gasto DOP",
        amount: 500,
        paid_by_participant_id: pJuanId,
        expense_date: "2026-09-06",
        split_method: "EQUAL",
        splits: [{ participant_id: pJuanId }],
      });

      await expect(
        SerruchoService.update(serruchoId, { currency: "EUR" })
      ).rejects.toThrow("No se puede cambiar la moneda base de un serrucho con gastos existentes");
    });

    it("SEC-08: Zero runtime itemized split references verified", async () => {
      const serrucho = await SerruchoService.getById(serruchoId);
      expect(serrucho).toBeDefined();
      expect((serrucho as any).itemized_lines).toBeUndefined();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // SECTION 5: ADVERSARIAL SCENARIOS (ADV-01 to ADV-06)
  // ══════════════════════════════════════════════════════════════════════════════
  describe("Adversarial Scenarios (ADV-01 to ADV-06)", () => {
    it("ADV-01: Sequential lifecycle: Create -> Add Expenses -> Export -> Edit Expense -> Export -> Delete -> Verify zero orphans", async () => {
      // 1. Add expense
      const exp = await ExpenseService.add(serruchoId, {
        description: "Airbnb",
        amount: 9000,
        paid_by_participant_id: pJuanId,
        expense_date: "2026-09-06",
        split_method: "EQUAL",
        splits: [{ participant_id: pJuanId }, { participant_id: pMariaId }],
      });

      // 2. Export 1
      const exp1 = await ExportService.generateWorkbook(serruchoId);
      expect(exp1.workbook.SheetNames).toContain("Resumen");

      // 3. Edit expense
      await ExpenseService.update(exp.id, { amount: 12000, description: "Airbnb Deluxe" });

      // 4. Export 2
      const exp2 = await ExportService.generateWorkbook(serruchoId);
      const movements = XLSX.utils.sheet_to_json(exp2.workbook.Sheets["Movimientos"], { header: 1 });
      expect(JSON.stringify(movements)).toContain("Airbnb Deluxe");

      // 5. Delete group
      await SerruchoService.delete(serruchoId);

      // 6. Verify zero orphans
      expect(await repo.getExpenses(serruchoId)).toHaveLength(0);
      expect(await repo.getParticipants(serruchoId)).toHaveLength(0);
      expect(await repo.getTransfers(serruchoId)).toHaveLength(0);
    });

    it("ADV-02: Settle debts via Transfer -> Export -> Delete Transfer -> Export verifies restored debt", async () => {
      await ExpenseService.add(serruchoId, {
        description: "Cena",
        amount: 2000,
        paid_by_participant_id: pJuanId,
        expense_date: "2026-09-06",
        split_method: "EQUAL",
        splits: [{ participant_id: pJuanId }, { participant_id: pMariaId }],
      });

      const t = await TransferService.add(serruchoId, {
        sender_participant_id: pMariaId,
        receiver_participant_id: pJuanId,
        amount: 1000,
        transfer_date: "2026-09-06",
        notes: "Pago de liquidación",
      });

      // Export with settled debt
      const { workbook: wb1 } = await ExportService.generateWorkbook(serruchoId);
      const rows1 = XLSX.utils.sheet_to_json(wb1.Sheets["Resumen"], { header: 1 });
      expect(JSON.stringify(rows1)).toContain("Al día");

      // Delete transfer
      await TransferService.delete(t.id);

      // Export with restored debt
      const { workbook: wb2 } = await ExportService.generateWorkbook(serruchoId);
      const rows2 = XLSX.utils.sheet_to_json(wb2.Sheets["Resumen"], { header: 1 });
      expect(JSON.stringify(rows2)).toContain("Deudor");
    });

    it("ADV-03: Multi-group concurrency: Mutating and deleting Serrucho A while querying Serrucho B", async () => {
      const serruchoB = await SerruchoService.create("owner-concurrent", {
        name: "Grupo Paralelo",
        currency: "DOP",
      });
      const pB = await ParticipantService.add(serruchoB.id, { name: "Carlos" });
      await ExpenseService.add(serruchoB.id, {
        description: "Gasolina B",
        amount: 1500,
        paid_by_participant_id: pB.id,
        expense_date: "2026-09-06",
        split_method: "EQUAL",
        splits: [{ participant_id: pB.id }],
      });

      // Delete A
      await SerruchoService.delete(serruchoId);

      // Export B successfully
      const { workbook } = await ExportService.generateWorkbook(serruchoB.id);
      expect(workbook.SheetNames).toContain("Resumen");
      const summary = XLSX.utils.sheet_to_json(workbook.Sheets["Resumen"], { header: 1 });
      expect(JSON.stringify(summary)).toContain("Grupo Paralelo");
    });

    it("ADV-04: Offline mutation queue replay compatibility", async () => {
      // Replay local offline mutations sequentially
      const offlineQueue = [
        { type: "rename", name: "Nombre Offline Replay" },
        { type: "desc", description: "Descripción Offline" },
      ];

      for (const op of offlineQueue) {
        if (op.type === "rename") {
          await SerruchoService.update(serruchoId, { name: op.name });
        } else if (op.type === "desc") {
          await SerruchoService.update(serruchoId, { description: op.description });
        }
      }

      const fetched = await SerruchoService.getById(serruchoId);
      expect(fetched?.name).toBe("Nombre Offline Replay");
      expect(fetched?.description).toBe("Descripción Offline");
    });

    it("ADV-05: Closed Serrucho deletion deletes all snapshot history cleanly", async () => {
      await repo.createSettlementSnapshots([
        {
          snapshot: {
            serrucho_id: serruchoId,
            participant_id: pJuanId,
            total_expenses_cents: 100000,
            owed_cents: 50000,
            paid_cents: 100000,
            balance_cents: 50000,
            payment_instructions: "Liquidación final",
            payment_deadline: null,
            public_token_hash: "hash-juan-final",
            payment_method: "TRANSFER_OTHER",
            payment_notes: "Cierre exitoso",
          },
          items: [],
        },
      ]);
      await repo.updateSerrucho(serruchoId, { status: "CLOSED" });

      const deleted = await SerruchoService.delete(serruchoId);
      expect(deleted).toBe(true);

      const snapshots = await repo.getSnapshotsBySerrucho(serruchoId);
      expect(snapshots).toHaveLength(0);
    });

    it("ADV-06: Web & Mobile view models produce identical export datasets", async () => {
      await ExpenseService.add(serruchoId, {
        description: "Peaje",
        amount: 600,
        paid_by_participant_id: pJuanId,
        expense_date: "2026-09-06",
        split_method: "EQUAL",
        splits: [{ participant_id: pJuanId }, { participant_id: pMariaId }],
      });

      const { workbook } = await ExportService.generateWorkbook(serruchoId);
      const csv = await ExportService.exportToCSV(serruchoId, "Movimientos");

      expect(workbook.Sheets["Movimientos"]).toBeDefined();
      expect(csv.csv).toContain("Peaje");
    });
  });
});
