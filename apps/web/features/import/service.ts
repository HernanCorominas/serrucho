import {
  ImportFormat,
  ImportMovementType,
  ImportMovementPreview,
  ImportSplitPreview,
  ImportError,
  ImportWarning,
  ImportPreviewResult,
  ConfirmImportInput,
} from "./types";
import { SerruchoService } from "@/features/serruchos/service";
import { ParticipantService } from "@/features/participants/service";
import { ExpenseService } from "@/features/expenses/service";
import { TransferService } from "@/features/transfers/service";
import { IncomeService } from "@/features/incomes/service";
import { ActivityService } from "@/features/activity/service";
import { ExpenseCategory, CurrencyCode, Serrucho } from "@/lib/types/domain";

export class ImportService {
  /**
   * Pipeline Step: Parse -> Normalize -> Validate -> Preview.
   * STRICT GUARANTEE: Never modifies the database or creates any entities during preview.
   */
  static async parseAndPreview(
    rawCsv: string,
    options?: { defaultCurrency?: CurrencyCode; serruchoName?: string }
  ): Promise<ImportPreviewResult> {
    const errors: ImportError[] = [];
    const warnings: ImportWarning[] = [];

    // Clean BOM and trim
    const cleanContent = (rawCsv || "").replace(/^\uFEFF/, "").trim();
    if (!cleanContent) {
      return {
        format_detected: "AUTO_DETECT",
        serrucho_name_suggested: "Serrucho Importado",
        currency: options?.defaultCurrency || "DOP",
        participant_names: [],
        total_movements: 0,
        total_expenses_cents: 0,
        movements: [],
        errors: [{ message: "El archivo CSV está vacío." }],
        warnings: [],
        is_valid: false,
      };
    }

    // Split lines handling CRLF / LF
    const lines = cleanContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      return {
        format_detected: "AUTO_DETECT",
        serrucho_name_suggested: "Serrucho Importado",
        currency: options?.defaultCurrency || "DOP",
        participant_names: [],
        total_movements: 0,
        total_expenses_cents: 0,
        movements: [],
        errors: [{ message: "El archivo debe contener una fila de encabezados y al menos un movimiento." }],
        warnings: [],
        is_valid: false,
      };
    }

    // Detect delimiter
    const headerLine = lines[0];
    const delimiter = headerLine.includes(";") ? ";" : headerLine.includes("\t") ? "\t" : ",";
    const headers = this.parseCsvLine(headerLine, delimiter).map((h) => h.trim());

    // Detect format
    const isSplitwise = this.isSplitwiseFormat(headers);
    const formatDetected: ImportFormat = isSplitwise ? "SPLITWISE_CSV" : "SERRUCHO_CSV";

    let participantNames: string[] = [];
    const movements: ImportMovementPreview[] = [];
    let defaultCurrency: CurrencyCode = options?.defaultCurrency || "DOP";

    if (isSplitwise) {
      const parsed = this.parseSplitwiseRows(lines, headers, delimiter, errors, warnings);
      participantNames = parsed.participantNames;
      movements.push(...parsed.movements);
      if (parsed.detectedCurrency) defaultCurrency = parsed.detectedCurrency;
    } else {
      const parsed = this.parseSerruchoRows(lines, headers, delimiter, errors, warnings);
      participantNames = parsed.participantNames;
      movements.push(...parsed.movements);
      if (parsed.detectedCurrency) defaultCurrency = parsed.detectedCurrency;
    }

    // Deduplicate and filter participant names
    const uniqueParticipants = Array.from(
      new Set(participantNames.map((n) => n.trim()).filter((n) => n.length > 0))
    );

    // Calculate totals
    const totalExpensesCents = movements
      .filter((m) => m.type === "EXPENSE" && !m.has_error)
      .reduce((sum, m) => sum + m.amount_cents, 0);

    const isValid = errors.length === 0 && movements.length > 0 && uniqueParticipants.length > 0;

    return {
      format_detected: formatDetected,
      serrucho_name_suggested: options?.serruchoName || "Coro Importado",
      currency: defaultCurrency,
      participant_names: uniqueParticipants,
      total_movements: movements.length,
      total_expenses_cents: totalExpensesCents,
      movements,
      errors,
      warnings,
      is_valid: isValid,
    };
  }

  /**
   * Pipeline Step: Confirm -> Persist.
   * Atomically creates the Serrucho, all participants, expenses with splits, and transfers.
   */
  static async confirmAndPersist(
    userId: string,
    input: ConfirmImportInput
  ): Promise<{ serrucho: Serrucho; participantsCount: number; movementsCount: number }> {
    if (!input.serrucho_name?.trim()) {
      throw new Error("El nombre del Serrucho es requerido");
    }
    if (!input.participant_names || input.participant_names.length === 0) {
      throw new Error("Se requiere al menos un participante para importar");
    }

    // 1. Create Serrucho
    const validCurrency: "DOP" | "USD" | "EUR" =
      input.currency === "USD" ? "USD" : input.currency === "EUR" ? "EUR" : "DOP";

    const serrucho = await SerruchoService.create(userId || "guest-anonymous", {
      name: input.serrucho_name.trim(),
      currency: validCurrency,
      description: input.description || "Importado desde CSV / Splitwise",
    });



    // 2. Map and create participants
    const existingParts = await ParticipantService.listBySerrucho(serrucho.id);
    const participantMap = new Map<string, string>(); // Name (lowercase) -> Participant ID

    // First participant is already created by SerruchoService.create
    if (existingParts.length > 0 && input.participant_names.length > 0) {
      const firstTargetName = input.participant_names[0];
      await ParticipantService.update(existingParts[0].id, { name: firstTargetName });
      participantMap.set(firstTargetName.toLowerCase(), existingParts[0].id);
    }

    // Create remaining participants
    for (let i = 1; i < input.participant_names.length; i++) {
      const name = input.participant_names[i].trim();
      if (!name) continue;
      const part = await ParticipantService.add(serrucho.id, { name });
      participantMap.set(name.toLowerCase(), part.id);
    }

    // Fallback creator ID if needed
    const defaultParticipantId = existingParts[0]?.id || Array.from(participantMap.values())[0];

    // 3. Persist Movements
    let persistedCount = 0;
    for (const mov of input.movements) {
      if (mov.has_error) continue;

      const paidById =
        participantMap.get(mov.paid_by_name?.toLowerCase() || "") || defaultParticipantId;

      if (mov.type === "EXPENSE") {
        // Build splits
        const validSplits = (mov.splits || [])
          .map((s) => {
            const pId = participantMap.get(s.participant_name.toLowerCase());
            return pId ? { participant_id: pId, custom_amount: s.amount_cents ? s.amount_cents / 100 : undefined } : null;
          })
          .filter(Boolean) as { participant_id: string; custom_amount?: number }[];

        // If no splits specified, default to all participants
        const finalSplits =
          validSplits.length > 0
            ? validSplits
            : Array.from(participantMap.values()).map((pId) => ({ participant_id: pId }));

        await ExpenseService.add(serrucho.id, {
          description: mov.description || "Gasto importado",
          amount: mov.amount_cents / 100,
          paid_by_participant_id: paidById,
          expense_date: mov.date || new Date().toISOString().split("T")[0],
          category: (mov.category as ExpenseCategory) || "OTHER",
          splits: finalSplits,
        });

        persistedCount++;
      } else if (mov.type === "TRANSFER") {
        const receiverId =
          participantMap.get(mov.receiver_name?.toLowerCase() || "") || defaultParticipantId;
        if (paidById !== receiverId) {
          await TransferService.add(serrucho.id, {
            sender_participant_id: paidById,
            receiver_participant_id: receiverId,
            amount: mov.amount_cents / 100,
            transfer_date: mov.date || new Date().toISOString().split("T")[0],
            notes: mov.notes,
          });
          persistedCount++;
        }
      } else if (mov.type === "INCOME") {
        const splits = Array.from(participantMap.values()).map((pId) => ({ participant_id: pId }));
        await IncomeService.add(serrucho.id, {
          description: mov.description || "Reembolso importado",
          amount: mov.amount_cents / 100,
          received_by_participant_id: paidById,
          income_date: mov.date || new Date().toISOString().split("T")[0],
          category: "OTHER_INCOME",
          split_method: "EQUAL",
          splits,
        });
        persistedCount++;
      }
    }

    // 4. Record audit event
    await ActivityService.record({
      serrucho_id: serrucho.id,
      actor_name: "Importador",
      action_type: "SERRUCHO_CREATED",
      entity_type: "SERRUCHO",
      summary: `Serrucho importado con éxito: ${input.participant_names.length} participantes y ${persistedCount} movimientos.`,
    });

    return {
      serrucho,
      participantsCount: input.participant_names.length,
      movementsCount: persistedCount,
    };
  }

  // ─── PARSING HELPERS ────────────────────────────────────────────────────────

  private static isSplitwiseFormat(headers: string[]): boolean {
    const lower = headers.map((h) => h.toLowerCase());
    return (
      (lower.includes("date") || lower.includes("fecha")) &&
      (lower.includes("description") || lower.includes("descripción")) &&
      (lower.includes("cost") || lower.includes("costo") || lower.includes("total"))
    );
  }

  private static parseSplitwiseRows(
    lines: string[],
    headers: string[],
    delimiter: string,
    errors: ImportError[],
    warnings: ImportWarning[]
  ): { participantNames: string[]; movements: ImportMovementPreview[]; detectedCurrency?: CurrencyCode } {
    const lowerHeaders = headers.map((h) => h.toLowerCase());
    const dateIdx = lowerHeaders.findIndex((h) => h === "date" || h === "fecha");
    const descIdx = lowerHeaders.findIndex((h) => h === "description" || h === "descripción" || h === "details");
    const categoryIdx = lowerHeaders.findIndex((h) => h === "category" || h === "categoría");
    const costIdx = lowerHeaders.findIndex((h) => h === "cost" || h === "costo" || h === "amount" || h === "monto");
    const currencyIdx = lowerHeaders.findIndex((h) => h === "currency" || h === "moneda");

    // Any remaining columns after standard ones are assumed to be participant names in Splitwise exports
    const standardIndices = new Set([dateIdx, descIdx, categoryIdx, costIdx, currencyIdx].filter((i) => i >= 0));
    const participantColumns: { name: string; index: number }[] = [];

    headers.forEach((h, idx) => {
      if (!standardIndices.has(idx) && h.trim().length > 0) {
        participantColumns.push({ name: h.trim(), index: idx });
      }
    });

    const participantNames: string[] = participantColumns.map((p) => p.name);
    const movements: ImportMovementPreview[] = [];
    let detectedCurrency: CurrencyCode | undefined;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = this.parseCsvLine(line, delimiter);
      const rowNum = i + 1;

      const rawDesc = descIdx >= 0 ? cols[descIdx] : `Movimiento ${i}`;
      const rawCost = costIdx >= 0 ? cols[costIdx] : "0";
      const rawDate = dateIdx >= 0 ? cols[dateIdx] : "";
      const rawCategory = categoryIdx >= 0 ? cols[categoryIdx] : "FOOD_DINING";
      const rawCurrency = currencyIdx >= 0 ? cols[currencyIdx]?.toUpperCase() : "DOP";

      if (rawCurrency && !detectedCurrency) {
        detectedCurrency = rawCurrency;
      }

      const amountCents = this.parseAmountToCents(rawCost);
      if (amountCents === null || isNaN(amountCents) || amountCents <= 0) {
        // Skip 0-cost settlement rows or header noise
        if (amountCents === 0) continue;
        warnings.push({ row_number: rowNum, message: `Fila ${rowNum}: Monto inválido "${rawCost}".` });
        continue;
      }

      // Detect transfers/payments: e.g. "Payment", "Settlement", "Pago", "Transferencia"
      const isTransfer =
        rawDesc.toLowerCase().includes("payment") ||
        rawDesc.toLowerCase().includes("pago") ||
        rawCategory.toLowerCase().includes("payment");

      // Splits per participant column
      const splits: ImportSplitPreview[] = [];
      let paidByName = participantNames[0] || "Organizador";

      participantColumns.forEach((pCol) => {
        const colVal = cols[pCol.index];
        if (colVal !== undefined && colVal.trim() !== "") {
          const valCents = this.parseAmountToCents(colVal);
          if (valCents !== null && valCents > 0) {
            splits.push({
              participant_name: pCol.name,
              amount_cents: valCents,
            });
          }
        }
      });

      movements.push({
        id: `mov-${i}`,
        row_number: rowNum,
        type: isTransfer ? "TRANSFER" : "EXPENSE",
        date: this.normalizeDate(rawDate),
        description: rawDesc.trim(),
        category: this.mapCategory(rawCategory),
        amount_cents: amountCents,
        currency: rawCurrency || "DOP",
        paid_by_name: paidByName,
        receiver_name: isTransfer && participantNames[1] ? participantNames[1] : undefined,
        splits: splits.length > 0 ? splits : participantNames.map((n) => ({ participant_name: n })),
      });
    }

    return { participantNames, movements, detectedCurrency };
  }

  private static parseSerruchoRows(
    lines: string[],
    headers: string[],
    delimiter: string,
    errors: ImportError[],
    warnings: ImportWarning[]
  ): { participantNames: string[]; movements: ImportMovementPreview[]; detectedCurrency?: CurrencyCode } {
    const lowerHeaders = headers.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
    const dateIdx = lowerHeaders.findIndex((h) => h.includes("fecha") || h.includes("date"));
    const descIdx = lowerHeaders.findIndex((h) => h.includes("descrip") || h.includes("concepto"));
    const amountIdx = lowerHeaders.findIndex((h) => h.includes("monto") || h.includes("amount") || h.includes("cost"));
    const currencyIdx = lowerHeaders.findIndex((h) => h.includes("moneda") || h.includes("currency"));
    const paidByIdx = lowerHeaders.findIndex((h) => h.includes("pagado") || h.includes("paidby") || h.includes("pagador"));
    const partsIdx = lowerHeaders.findIndex((h) => h.includes("partic") || h.includes("quienes"));
    const catIdx = lowerHeaders.findIndex((h) => h.includes("categ"));
    const typeIdx = lowerHeaders.findIndex((h) => h.includes("tipo") || h.includes("type"));

    const participantSet = new Set<string>();
    const movements: ImportMovementPreview[] = [];
    let detectedCurrency: CurrencyCode | undefined;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = this.parseCsvLine(line, delimiter);
      const rowNum = i + 1;

      const rawDesc = descIdx >= 0 ? cols[descIdx] : `Movimiento ${i}`;
      const rawAmount = amountIdx >= 0 ? cols[amountIdx] : "0";
      const rawDate = dateIdx >= 0 ? cols[dateIdx] : "";
      const rawPaidBy = paidByIdx >= 0 && cols[paidByIdx]?.trim() ? cols[paidByIdx].trim() : "Organizador";
      const rawCurrency = currencyIdx >= 0 ? cols[currencyIdx]?.toUpperCase() : "DOP";
      const rawCategory = catIdx >= 0 ? cols[catIdx] : "FOOD_DINING";
      const rawType = typeIdx >= 0 ? cols[typeIdx]?.toUpperCase() : "EXPENSE";

      participantSet.add(rawPaidBy);
      if (rawCurrency && !detectedCurrency) detectedCurrency = rawCurrency;

      const amountCents = this.parseAmountToCents(rawAmount);
      if (amountCents === null || isNaN(amountCents) || amountCents <= 0) {
        warnings.push({ row_number: rowNum, message: `Fila ${rowNum}: Monto inválido "${rawAmount}".` });
        continue;
      }

      // Parse participants list if provided
      const rowParts: string[] = [];
      if (partsIdx >= 0 && cols[partsIdx]) {
        const splitNames = cols[partsIdx].split(/[,|;/]/).map((n) => n.trim()).filter((n) => n.length > 0);
        splitNames.forEach((n) => {
          rowParts.push(n);
          participantSet.add(n);
        });
      }

      const movementType: ImportMovementType =
        rawType.includes("TRANS") || rawType.includes("PAGO")
          ? "TRANSFER"
          : rawType.includes("REEMB") || rawType.includes("INCOME")
          ? "INCOME"
          : "EXPENSE";

      movements.push({
        id: `mov-${i}`,
        row_number: rowNum,
        type: movementType,
        date: this.normalizeDate(rawDate),
        description: rawDesc.trim(),
        category: this.mapCategory(rawCategory),
        amount_cents: amountCents,
        currency: rawCurrency || "DOP",
        paid_by_name: rawPaidBy,
        splits: rowParts.map((n) => ({ participant_name: n })),
      });
    }

    return {
      participantNames: Array.from(participantSet),
      movements,
      detectedCurrency,
    };
  }

  private static parseCsvLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let curVal = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(curVal.trim().replace(/^["']|["']$/g, ""));
        curVal = "";
      } else {
        curVal += char;
      }
    }
    result.push(curVal.trim().replace(/^["']|["']$/g, ""));
    return result;
  }

  private static parseAmountToCents(raw: string): number | null {
    if (!raw) return null;
    const clean = raw.replace(/[^0-9.,-]/g, "").trim();
    if (!clean) return null;

    // Handle European comma/dot
    let normalized = clean;
    if (clean.includes(",") && clean.includes(".")) {
      normalized = clean.replace(/,/g, "");
    } else if (clean.includes(",") && !clean.includes(".")) {
      normalized = clean.replace(",", ".");
    }

    const val = parseFloat(normalized);
    if (isNaN(val)) return null;
    return Math.round(val * 100);
  }

  private static normalizeDate(raw: string): string {
    if (!raw) return new Date().toISOString().split("T")[0];
    const clean = raw.trim();

    // If YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

    // If DD/MM/YYYY or MM/DD/YYYY
    const slashParts = clean.split(/[/-]/);
    if (slashParts.length === 3) {
      if (slashParts[0].length === 4) {
        // YYYY/MM/DD
        return `${slashParts[0]}-${slashParts[1].padStart(2, "0")}-${slashParts[2].padStart(2, "0")}`;
      } else if (slashParts[2].length === 4) {
        // DD/MM/YYYY or MM/DD/YYYY
        return `${slashParts[2]}-${slashParts[1].padStart(2, "0")}-${slashParts[0].padStart(2, "0")}`;
      }
    }

    const d = new Date(clean);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split("T")[0];
    }
    return new Date().toISOString().split("T")[0];
  }

  private static mapCategory(raw: string): ExpenseCategory {
    const lower = (raw || "").toLowerCase();
    if (lower.includes("food") || lower.includes("comida") || lower.includes("restaurante") || lower.includes("cena")) return "RESTAURANTS_DELIVERY";
    if (lower.includes("super") || lower.includes("compra") || lower.includes("grocer")) return "GROCERIES";
    if (lower.includes("drink") || lower.includes("alcohol") || lower.includes("bebida") || lower.includes("cerveza")) return "DRINKS_ALCOHOL";
    if (lower.includes("stay") || lower.includes("hotel") || lower.includes("villa") || lower.includes("hospedaje") || lower.includes("airbnb")) return "LODGING";
    if (lower.includes("gas") || lower.includes("combustible") || lower.includes("peaje") || lower.includes("transport") || lower.includes("taxi")) return "TRANSPORTATION";
    if (lower.includes("trip") || lower.includes("viaje") || lower.includes("actividad")) return "TRIPS_TRAVEL";
    return "OTHER";
  }
}

