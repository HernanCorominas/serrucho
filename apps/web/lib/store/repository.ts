import {
  Serrucho,
  Participant,
  Expense,
  ExpenseParticipant,
  Transfer,
  PaymentMethod,
  SettlementPaymentStatus,
  Income,
  IncomeParticipant,
  SettlementSnapshot,
  SettlementItem,
  NotificationLog,
  Profile,
  ActivityEvent,
} from "@/lib/types/domain";

export interface ISerruchoRepository {
  // Profiles
  getProfile(id: string): Promise<Profile | null>;
  upsertProfile(profile: Profile): Promise<Profile>;

  // Serruchos
  getSerruchosByOwner(ownerId: string): Promise<Serrucho[]>;
  getSerruchoById(id: string): Promise<Serrucho | null>;
  createSerrucho(serrucho: Omit<Serrucho, "id" | "created_at" | "updated_at" | "closed_at">): Promise<Serrucho>;
  updateSerrucho(id: string, updates: Partial<Serrucho>): Promise<Serrucho>;
  deleteSerrucho(id: string): Promise<boolean>;

  // Participants
  getParticipants(serruchoId: string): Promise<Participant[]>;
  getParticipantById(id: string): Promise<Participant | null>;
  createParticipant(participant: Omit<Participant, "id" | "created_at" | "updated_at">): Promise<Participant>;
  updateParticipant(id: string, updates: Partial<Participant>): Promise<Participant>;
  deleteParticipant(id: string): Promise<boolean>;

  // Expenses
  getExpenses(serruchoId: string): Promise<Expense[]>;
  getExpenseById(id: string): Promise<Expense | null>;
  getExpenseSplits(expenseId: string): Promise<ExpenseParticipant[]>;
  createExpenseWithSplits(
    expense: Omit<Expense, "id" | "created_at" | "updated_at">,
    splits: Omit<ExpenseParticipant, "expense_id">[]
  ): Promise<Expense>;
  updateExpenseWithSplits(
    id: string,
    updates: Partial<Expense>,
    splits?: Omit<ExpenseParticipant, "expense_id">[]
  ): Promise<Expense>;
  deleteExpense(id: string): Promise<boolean>;

  // Incomes & Refunds
  getIncomes(serruchoId: string): Promise<Income[]>;
  getIncomeById(id: string): Promise<Income | null>;
  getIncomeSplits(incomeId: string): Promise<IncomeParticipant[]>;
  createIncome(
    income: Omit<Income, "id" | "created_at" | "updated_at">,
    splits: Omit<IncomeParticipant, "income_id">[]
  ): Promise<Income>;
  updateIncomeWithSplits(
    id: string,
    updates: Partial<Income>,
    splits?: Omit<IncomeParticipant, "income_id">[]
  ): Promise<Income>;
  deleteIncome(id: string): Promise<boolean>;

  // Settlement Snapshots & Items
  getSnapshotsBySerrucho(serruchoId: string): Promise<SettlementSnapshot[]>;
  getSnapshotByTokenHash(tokenHash: string): Promise<{
    snapshot: SettlementSnapshot;
    participant: Participant;
    serrucho: Serrucho;
    items: SettlementItem[];
  } | null>;
  createSettlementSnapshots(
    snapshots: {
      snapshot: Omit<SettlementSnapshot, "id" | "created_at">;
      items: Omit<SettlementItem, "id" | "snapshot_id">[];
    }[]
  ): Promise<SettlementSnapshot[]>;
  markSnapshotPaid(
    snapshotId: string,
    isPaid: boolean,
    details?: {
      payment_method?: PaymentMethod | null;
      payment_notes?: string | null;
      paid_amount_cents?: number | null;
      payment_status?: SettlementPaymentStatus | null;
    }
  ): Promise<SettlementSnapshot>;

  // Transfers
  getTransfers(serruchoId: string): Promise<Transfer[]>;
  getTransferById(id: string): Promise<Transfer | null>;
  createTransfer(transfer: Omit<Transfer, "id" | "created_at" | "updated_at">): Promise<Transfer>;
  updateTransfer(id: string, updates: Partial<Transfer>): Promise<Transfer>;
  deleteTransfer(id: string): Promise<boolean>;

  // Notification Logs
  createNotificationLog(log: Omit<NotificationLog, "id" | "created_at">): Promise<NotificationLog>;
  getNotificationLogs(serruchoId: string): Promise<NotificationLog[]>;

  // Activity / Audit Trail
  createActivityEvent(event: Omit<ActivityEvent, "id" | "created_at">): Promise<ActivityEvent>;
  getActivityEvents(serruchoId: string, limit?: number): Promise<ActivityEvent[]>;
}
