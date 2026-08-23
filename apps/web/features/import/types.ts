import { ExpenseCategory, CurrencyCode } from "@/lib/types/domain";

export type ImportFormat = "SPLITWISE_CSV" | "SERRUCHO_CSV" | "AUTO_DETECT";

export type ImportMovementType = "EXPENSE" | "TRANSFER" | "INCOME";

export interface ImportSplitPreview {
  participant_name: string;
  amount_cents?: number;
  percentage?: number;
}

export interface ImportMovementPreview {
  id: string;
  row_number: number;
  type: ImportMovementType;
  date: string;
  description: string;
  category: string;
  amount_cents: number;
  currency: string;
  paid_by_name: string;
  receiver_name?: string; // for transfers
  splits: ImportSplitPreview[];
  notes?: string;
  has_error?: boolean;
  error_message?: string;
}

export interface ImportError {
  row_number?: number;
  field?: string;
  message: string;
}

export interface ImportWarning {
  row_number?: number;
  message: string;
}

export interface ImportPreviewResult {
  format_detected: ImportFormat;
  serrucho_name_suggested: string;
  currency: CurrencyCode;
  participant_names: string[];
  total_movements: number;
  total_expenses_cents: number;
  movements: ImportMovementPreview[];
  errors: ImportError[];
  warnings: ImportWarning[];
  is_valid: boolean;
}

export interface ConfirmImportInput {
  serrucho_name: string;
  currency: CurrencyCode;
  description?: string;
  participant_names: string[];
  movements: ImportMovementPreview[];
}
