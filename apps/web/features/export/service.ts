import * as XLSX from "xlsx";
import { getRepository } from "@/lib/store";
import { SettlementService } from "@/features/settlements/service";
import { ActivityService } from "@/features/activity/service";
import { CATEGORY_INFO, INCOME_CATEGORY_INFO, ExpenseWithSplits, TransferWithParticipants, IncomeWithSplits } from "@/lib/types/domain";
import { simplifyDebts } from "@/lib/finance/math";

export class ExportService {
  /**
   * Generates a multi-sheet XLSX Workbook containing:
   * - Hoja 1: Resumen (Summary, totals, and net balance table)
   * - Hoja 2: Movimientos (Expenses, transfers, incomes with multi-currency details)
   * - Hoja 3: Settlement (Optimized debt transfers and payment statuses)
   * - Hoja 4: Historial (Audit activity log)
   */
  static async generateWorkbook(serruchoId: string): Promise<{ workbook: XLSX.WorkBook; filename: string }> {
    const repo = getRepository();
    const serrucho = await repo.getSerruchoById(serruchoId);
    if (!serrucho) throw new Error("Serrucho no encontrado");

    const [rawExpenses, rawTransfers, rawIncomes, participants, snapshots, activityLogs, settlement] =
      await Promise.all([
        repo.getExpenses(serruchoId),
        repo.getTransfers(serruchoId),
        repo.getIncomes(serruchoId),
        repo.getParticipants(serruchoId),
        repo.getSnapshotsBySerrucho(serruchoId),
        ActivityService.listBySerrucho(serruchoId, 200),
        SettlementService.calculateLiveSettlement(serruchoId),
      ]);

    const participantMap = new Map(participants.map((p) => [p.id, p]));

    // Enrich expenses
    const expenses: ExpenseWithSplits[] = await Promise.all(
      rawExpenses.map(async (exp) => {
        const splits = await repo.getExpenseSplits(exp.id);
        return {
          ...exp,
          paid_by_name: participantMap.get(exp.paid_by_participant_id)?.name || "Desconocido",
          splits: splits.map((s) => ({
            ...s,
            participant_name: participantMap.get(s.participant_id)?.name || "Desconocido",
          })),
        };
      })
    );

    // Enrich transfers
    const transfers: TransferWithParticipants[] = rawTransfers.map((t) => ({
      ...t,
      sender_name: participantMap.get(t.sender_participant_id)?.name || "Desconocido",
      receiver_name: participantMap.get(t.receiver_participant_id)?.name || "Desconocido",
    }));

    // Enrich incomes
    const incomes: IncomeWithSplits[] = await Promise.all(
      rawIncomes.map(async (inc) => {
        const splits = await repo.getIncomeSplits(inc.id);
        return {
          ...inc,
          received_by_name: inc.received_by_participant_id
            ? participantMap.get(inc.received_by_participant_id)?.name || "El Serrucho"
            : "El Serrucho",
          splits: splits.map((s) => ({
            ...s,
            participant_name: participantMap.get(s.participant_id)?.name || "Desconocido",
          })),
        };
      })
    );

    const totalExpensesDOP = settlement.totalExpensesCents / 100;
    const totalIncomesDOP = (settlement.totalIncomesCents || 0) / 100;
    const netExpensesDOP = (settlement.netExpensesCents ?? settlement.totalExpensesCents) / 100;

    const workbook = XLSX.utils.book_new();

    // ─── HOJA 1: RESUMEN ──────────────────────────────────────────────────────────
    const summaryData: (string | number)[][] = [
      ["SERRUCHO — REPORTE FINANCIERO 🇩🇴"],
      ["Generado por:", "Serrucho (serrucho.do)"],
      ["Fecha de exportación:", new Date().toISOString().slice(0, 19).replace("T", " ")],
      [""],
      ["INFORMACIÓN GENERAL"],
      ["Nombre del Serrucho:", serrucho.name],
      ["Descripción:", serrucho.description || "N/A"],
      ["Moneda Base:", serrucho.currency || "DOP"],
      ["Estado:", serrucho.status === "CLOSED" ? "CERRADO (Liquidado)" : "ABIERTO (En curso)"],
      ["Fecha del Evento:", serrucho.event_date || "N/A"],
      ["Total Gastado Bruto (DOP):", totalExpensesDOP],
      ["Total Reembolsos / Ingresos (DOP):", totalIncomesDOP],
      ["Total Gasto Neto (DOP):", netExpensesDOP],
      ["Cantidad de Participantes:", participants.length],
      ["Cantidad de Movimientos:", expenses.length + transfers.length + incomes.length],
      [""],
      ["BALANCES POR PARTICIPANTE"],
      [
        "Participante",
        "Contacto (Email / Teléfono)",
        "Cuotas (Shares)",
        "Total Pagado (DOP)",
        "Total Consumo / Corresponde (DOP)",
        "Balance Neto (DOP)",
        "Estado Financiero",
      ],
    ];

    settlement.participants.forEach((p) => {
      const part = participantMap.get(p.id);
      const contact = part?.email || part?.phone || "Sin contacto";
      const paidDOP = p.total_paid_cents / 100;
      const owedDOP = p.total_owed_cents / 100;
      const netDOP = p.net_balance_cents / 100;
      let status = "Al día";
      if (netDOP > 0) {
        status = `Acreedor (Recibe RD$ ${netDOP.toFixed(2)})`;
      } else if (netDOP < 0) {
        status = `Deudor (Debe RD$ ${Math.abs(netDOP).toFixed(2)})`;
      }

      summaryData.push([
        p.name,
        contact,
        part?.default_shares || 1,
        paidDOP,
        owedDOP,
        netDOP,
        status,
      ]);
    });

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet["!cols"] = [
      { wch: 30 },
      { wch: 30 },
      { wch: 15 },
      { wch: 20 },
      { wch: 25 },
      { wch: 20 },
      { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumen");

    // ─── HOJA 2: MOVIMIENTOS ──────────────────────────────────────────────────────
    const movementsData: (string | number)[][] = [
      [
        "Fecha",
        "Descripción",
        "Tipo",
        "Pagador / Emisor",
        "Beneficiarios / Destinatario",
        "Categoría",
        "Moneda Original",
        "Monto Original",
        "Tasa Usada (DOP)",
        "Ajuste Tasa",
        "Monto Equivalente (DOP)",
        "Método de División",
        "Comprobantes Adjuntos",
      ],
    ];

    // Combine all movements and sort chronologically
    interface UnifiedMovement {
      date: string;
      description: string;
      type: "GASTO" | "TRANSFERENCIA" | "REEMBOLSO";
      payer: string;
      beneficiaries: string;
      category: string;
      origCurrency: string;
      origAmount: number;
      rate: number;
      rateAdjusted: string;
      amountDOP: number;
      splitMethod: string;
      receipts: number;
    }

    const allMovements: UnifiedMovement[] = [];

    expenses.forEach((e) => {
      const cat = CATEGORY_INFO[e.category]?.label || e.category;
      const beneficiaries = e.splits.map((s) => s.participant_name).join(", ");
      const splitLabel =
        e.split_method === "PERCENTAGE"
          ? "Porcentaje"
          : e.split_method === "SHARES"
          ? "Cuotas / Shares"
          : e.split_method === "EXACT"
          ? "Monto Exacto"
          : "Equitativo";

      const receiptCount = (e.receipt_urls && e.receipt_urls.length) || (e.receipt_url ? 1 : 0);

      allMovements.push({
        date: e.expense_date,
        description: e.description,
        type: "GASTO",
        payer: e.paid_by_name,
        beneficiaries,
        category: cat,
        origCurrency: e.original_currency || "DOP",
        origAmount: (e.original_amount_cents || e.amount_cents) / 100,
        rate: e.exchange_rate_used || 1,
        rateAdjusted: e.rate_adjusted_by ? "Manual" : "Automática / Base",
        amountDOP: e.amount_cents / 100,
        splitMethod: splitLabel,
        receipts: receiptCount,
      });
    });

    transfers.forEach((t) => {
      const receiptCount = t.receipt_url ? 1 : 0;
      allMovements.push({
        date: t.transfer_date,
        description: t.notes ? `Transferencia: ${t.notes}` : "Transferencia directa",
        type: "TRANSFERENCIA",
        payer: t.sender_name,
        beneficiaries: t.receiver_name,
        category: "Transferencia Directa",
        origCurrency: "DOP",
        origAmount: t.amount_cents / 100,
        rate: 1,
        rateAdjusted: "N/A",
        amountDOP: t.amount_cents / 100,
        splitMethod: "N/A",
        receipts: receiptCount,
      });
    });

    incomes.forEach((inc) => {
      const cat = INCOME_CATEGORY_INFO[inc.category]?.label || inc.category;
      const beneficiaries = inc.splits.map((s) => s.participant_name).join(", ");
      const receiptCount = inc.receipt_url ? 1 : 0;
      allMovements.push({
        date: inc.income_date,
        description: inc.description,
        type: "REEMBOLSO",
        payer: inc.received_by_name,
        beneficiaries,
        category: cat,
        origCurrency: "DOP",
        origAmount: inc.amount_cents / 100,
        rate: 1,
        rateAdjusted: "N/A",
        amountDOP: inc.amount_cents / 100,
        splitMethod: "Equitativo",
        receipts: receiptCount,
      });
    });

    allMovements.sort((a, b) => a.date.localeCompare(b.date));

    allMovements.forEach((m) => {
      movementsData.push([
        m.date,
        m.description,
        m.type,
        m.payer,
        m.beneficiaries,
        m.category,
        m.origCurrency,
        m.origAmount,
        m.rate,
        m.rateAdjusted,
        m.amountDOP,
        m.splitMethod,
        m.receipts,
      ]);
    });

    const movementsSheet = XLSX.utils.aoa_to_sheet(movementsData);
    movementsSheet["!cols"] = [
      { wch: 12 },
      { wch: 35 },
      { wch: 15 },
      { wch: 20 },
      { wch: 30 },
      { wch: 22 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 },
      { wch: 22 },
      { wch: 18 },
      { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(workbook, movementsSheet, "Movimientos");

    // ─── HOJA 3: SETTLEMENT / LIQUIDACIÓN ─────────────────────────────────────────
    const settlementData: (string | number)[][] = [
      [
        "Deudor (Quién paga)",
        "Acreedor (Quién recibe)",
        "Monto a Transferir (DOP)",
        "Estado del Pago",
        "Método de Pago",
        "Instrucciones de Pago / Notas",
        "Fecha de Registro",
      ],
    ];

    if (serrucho.status === "CLOSED" && snapshots.length > 0) {
      // Use closed snapshots
      const debtors = snapshots.filter((s) => s.balance_cents < 0);
      const creditorNames = snapshots
        .filter((s) => s.balance_cents > 0)
        .map((s) => participantMap.get(s.participant_id)?.name || "Acreedor")
        .join(", ");

      debtors.forEach((d) => {
        const debtorName = participantMap.get(d.participant_id)?.name || "Deudor";
        const amountDOP = Math.abs(d.balance_cents) / 100;
        const status = d.is_paid ? "PAGADO" : "PENDIENTE";
        settlementData.push([
          debtorName,
          creditorNames || "Acreedores del Serrucho",
          amountDOP,
          status,
          d.payment_method || "Transferencia",
          d.payment_notes || serrucho.payment_instructions || "",
          d.paid_at ? d.paid_at.slice(0, 10) : "",
        ]);
      });
    } else {
      // Calculate suggested transfers using algorithm
      const suggestedTransfers = simplifyDebts(settlement.participants, settlement.participants);
      suggestedTransfers.forEach((t) => {
        const fromName = participantMap.get(t.from_participant_id)?.name || "Deudor";
        const toName = participantMap.get(t.to_participant_id)?.name || "Acreedor";
        const amountDOP = t.amount_cents / 100;

        settlementData.push([
          fromName,
          toName,
          amountDOP,
          "SUGERIDO (Esquema óptimo)",
          "Transferencia Directa",
          serrucho.payment_instructions || "",
          new Date().toISOString().slice(0, 10),
        ]);
      });
    }

    const settlementSheet = XLSX.utils.aoa_to_sheet(settlementData);
    settlementSheet["!cols"] = [
      { wch: 25 },
      { wch: 25 },
      { wch: 22 },
      { wch: 22 },
      { wch: 22 },
      { wch: 35 },
      { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(workbook, settlementSheet, "Liquidación");

    // ─── HOJA 4: HISTORIAL DE ACTIVIDAD ──────────────────────────────────────────
    const historyData: (string | number)[][] = [
      ["Fecha y Hora", "Actor", "Tipo de Acción", "Resumen"],
    ];

    activityLogs.forEach((log) => {
      historyData.push([
        log.created_at.slice(0, 19).replace("T", " "),
        log.actor_name || "Sistema",
        log.action_type,
        log.summary,
      ]);
    });

    const historySheet = XLSX.utils.aoa_to_sheet(historyData);
    historySheet["!cols"] = [
      { wch: 20 },
      { wch: 20 },
      { wch: 25 },
      { wch: 50 },
    ];
    XLSX.utils.book_append_sheet(workbook, historySheet, "Historial");

    // Clean safe filename
    const safeName = serrucho.name.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `Serrucho_${safeName}_${new Date().toISOString().slice(0, 10)}`;

    return { workbook, filename };
  }

  /**
   * Exports the Serrucho data as an XLSX binary Buffer.
   */
  static async exportToXLSXBuffer(serruchoId: string): Promise<{ buffer: Buffer; filename: string }> {
    const { workbook, filename } = await this.generateWorkbook(serruchoId);
    const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return {
      buffer: Buffer.isBuffer(buf) ? buf : Buffer.from(buf),
      filename: `${filename}.xlsx`,
    };
  }

  /**
   * Exports a specific sheet or unified movements as a CSV string.
   */
  static async exportToCSV(
    serruchoId: string,
    sheetName: "Resumen" | "Movimientos" | "Liquidacion" | "Historial" = "Movimientos"
  ): Promise<{ csv: string; filename: string }> {
    const { workbook, filename } = await this.generateWorkbook(serruchoId);
    const targetSheetName =
      sheetName === "Liquidacion"
        ? "Liquidación"
        : sheetName;

    const sheet = workbook.Sheets[targetSheetName] || workbook.Sheets["Resumen"];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    return {
      csv,
      filename: `${filename}_${sheetName}.csv`,
    };
  }
}
