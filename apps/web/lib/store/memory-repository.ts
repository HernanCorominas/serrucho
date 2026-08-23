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
} from "@/lib/types/domain";
import { ISerruchoRepository } from "./repository";

export class MemorySerruchoRepository implements ISerruchoRepository {
  public profiles: Map<string, Profile> = new Map();
  public serruchos: Map<string, Serrucho> = new Map();
  public participants: Map<string, Participant> = new Map();
  public expenses: Map<string, Expense> = new Map();
  public expenseParticipants: ExpenseParticipant[] = [];
  public transfers: Map<string, Transfer> = new Map();
  public incomes: Map<string, Income> = new Map();
  public incomeParticipants: IncomeParticipant[] = [];
  public settlementSnapshots: Map<string, SettlementSnapshot> = new Map();
  public settlementItems: Map<string, SettlementItem> = new Map();
  public notificationLogs: Map<string, NotificationLog> = new Map();

  constructor() {
    this.seedDemoData();
  }

  private seedDemoData() {
    const demoProfile: Profile = {
      id: "demo-user-1",
      email: "organizador@serrucho.do",
      full_name: "Carlos Gómez",
      created_at: new Date().toISOString(),
    };
    this.profiles.set(demoProfile.id, demoProfile);

    const demoSerrucho: Serrucho = {
      id: "serrucho-demo-1",
      owner_id: demoProfile.id,
      name: "Fin de Semana en Las Terrenas 🌴",
      description: "Villa, comida, gasolina y bebidas del coro de la playa.",
      currency: "DOP",
      event_date: "2026-08-25",
      status: "OPEN",
      payment_instructions:
        "Banco BHD: Cuenta 1234567890 a nombre de Carlos Gómez, o por Banreservas / tPago al 809-555-0199",
      payment_deadline: "2026-08-30",
      closed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.serruchos.set(demoSerrucho.id, demoSerrucho);

    const p1: Participant = {
      id: "part-1",
      serrucho_id: demoSerrucho.id,
      name: "Carlos Gómez (Organizador)",
      email: "carlos@serrucho.do",
      phone: "8095550101",
      preferred_channel: "EMAIL",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const p2: Participant = {
      id: "part-2",
      serrucho_id: demoSerrucho.id,
      name: "Juan Pérez",
      email: "juan.perez@example.com",
      phone: "8095550102",
      preferred_channel: "EMAIL",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const p3: Participant = {
      id: "part-3",
      serrucho_id: demoSerrucho.id,
      name: "Pedro Rosario",
      email: "pedro.rosario@example.com",
      phone: "8095550103",
      preferred_channel: "WHATSAPP",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const p4: Participant = {
      id: "part-4",
      serrucho_id: demoSerrucho.id,
      name: "María Santos",
      email: "maria.santos@example.com",
      phone: "8095550104",
      preferred_channel: "EMAIL",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    [p1, p2, p3, p4].forEach((p) => this.participants.set(p.id, p));

    // Demo Expense 1: Villa (RD$ 24,000) paid by Carlos (LODGING)
    const exp1: Expense = {
      id: "exp-1",
      serrucho_id: demoSerrucho.id,
      description: "Alquiler de Villa frente a la playa",
      amount_cents: 2400000,
      paid_by_participant_id: p1.id,
      expense_date: "2026-08-20",
      split_method: "EQUAL",
      category: "LODGING",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.expenses.set(exp1.id, exp1);
    [p1, p2, p3, p4].forEach((p) => {
      this.expenseParticipants.push({
        expense_id: exp1.id,
        participant_id: p.id,
        percentage_basis_points: 2500,
        owed_cents: 600000,
      });
    });

    // Demo Expense 2: Supermercado (RD$ 8,500) paid by Juan (FOOD_GROCERIES)
    const exp2: Expense = {
      id: "exp-2",
      serrucho_id: demoSerrucho.id,
      description: "Compra de comida en Supermercado Nacional",
      amount_cents: 850000,
      paid_by_participant_id: p2.id,
      expense_date: "2026-08-21",
      split_method: "EQUAL",
      category: "FOOD_GROCERIES",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.expenses.set(exp2.id, exp2);
    [p1, p2, p3, p4].forEach((p) => {
      this.expenseParticipants.push({
        expense_id: exp2.id,
        participant_id: p.id,
        percentage_basis_points: 2500,
        owed_cents: 212500,
      });
    });

    // Demo Expense 3: Gasolina (RD$ 3,000) paid by Pedro, split only Carlos, Juan, Pedro (FUEL_TRANSPORT)
    const exp3: Expense = {
      id: "exp-3",
      serrucho_id: demoSerrucho.id,
      description: "Gasolina y peaje Autopista del Nordeste",
      amount_cents: 300000,
      paid_by_participant_id: p3.id,
      expense_date: "2026-08-21",
      split_method: "EQUAL",
      category: "FUEL_TRANSPORT",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.expenses.set(exp3.id, exp3);
    [
      { id: p1.id, owed: 100000, bps: 3334 },
      { id: p2.id, owed: 100000, bps: 3333 },
      { id: p3.id, owed: 100000, bps: 3333 },
    ].forEach((item) => {
      this.expenseParticipants.push({
        expense_id: exp3.id,
        participant_id: item.id,
        percentage_basis_points: item.bps,
        owed_cents: item.owed,
      });
    });
  }

  // Profiles
  async getProfile(id: string): Promise<Profile | null> {
    return this.profiles.get(id) || null;
  }

  async upsertProfile(profile: Profile): Promise<Profile> {
    this.profiles.set(profile.id, profile);
    return profile;
  }

  // Serruchos
  async getSerruchosByOwner(ownerId: string): Promise<Serrucho[]> {
    return Array.from(this.serruchos.values()).filter((s) => s.owner_id === ownerId);
  }

  async getSerruchoById(id: string): Promise<Serrucho | null> {
    return this.serruchos.get(id) || null;
  }

  async createSerrucho(
    data: Omit<Serrucho, "id" | "created_at" | "updated_at" | "closed_at">
  ): Promise<Serrucho> {
    const id = `serrucho-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const now = new Date().toISOString();
    const serrucho: Serrucho = {
      ...data,
      id,
      closed_at: null,
      created_at: now,
      updated_at: now,
    };
    this.serruchos.set(id, serrucho);
    return serrucho;
  }

  async updateSerrucho(id: string, updates: Partial<Serrucho>): Promise<Serrucho> {
    const existing = this.serruchos.get(id);
    if (!existing) throw new Error("Serrucho no encontrado");
    const updated: Serrucho = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.serruchos.set(id, updated);
    return updated;
  }

  async deleteSerrucho(id: string): Promise<boolean> {
    return this.serruchos.delete(id);
  }

  // Participants
  async getParticipants(serruchoId: string): Promise<Participant[]> {
    return Array.from(this.participants.values()).filter((p) => p.serrucho_id === serruchoId);
  }

  async getParticipantById(id: string): Promise<Participant | null> {
    return this.participants.get(id) || null;
  }

  async createParticipant(
    data: Omit<Participant, "id" | "created_at" | "updated_at">
  ): Promise<Participant> {
    const id = `part-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const now = new Date().toISOString();
    const participant: Participant = {
      ...data,
      id,
      created_at: now,
      updated_at: now,
    };
    this.participants.set(id, participant);
    return participant;
  }

  async updateParticipant(id: string, updates: Partial<Participant>): Promise<Participant> {
    const existing = this.participants.get(id);
    if (!existing) throw new Error("Participante no encontrado");
    const updated: Participant = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.participants.set(id, updated);
    return updated;
  }

  async deleteParticipant(id: string): Promise<boolean> {
    return this.participants.delete(id);
  }

  // Expenses
  async getExpenses(serruchoId: string): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter((e) => e.serrucho_id === serruchoId);
  }

  async getExpenseById(id: string): Promise<Expense | null> {
    return this.expenses.get(id) || null;
  }

  async getExpenseSplits(expenseId: string): Promise<ExpenseParticipant[]> {
    return this.expenseParticipants.filter((ep) => ep.expense_id === expenseId);
  }

  async createExpenseWithSplits(
    expenseData: Omit<Expense, "id" | "created_at" | "updated_at">,
    splits: Omit<ExpenseParticipant, "expense_id">[]
  ): Promise<Expense> {
    const id = `exp-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const now = new Date().toISOString();
    const expense: Expense = {
      ...expenseData,
      id,
      category: expenseData.category || "OTHER",
      created_at: now,
      updated_at: now,
    };
    this.expenses.set(id, expense);

    splits.forEach((s) => {
      this.expenseParticipants.push({
        expense_id: id,
        participant_id: s.participant_id,
        percentage_basis_points: s.percentage_basis_points ?? null,
        owed_cents: s.owed_cents,
      });
    });

    return expense;
  }

  async updateExpenseWithSplits(
    id: string,
    updates: Partial<Expense>,
    splits?: Omit<ExpenseParticipant, "expense_id">[]
  ): Promise<Expense> {
    const existing = this.expenses.get(id);
    if (!existing) throw new Error("Gasto no encontrado");

    const updated: Expense = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.expenses.set(id, updated);

    if (splits) {
      this.expenseParticipants = this.expenseParticipants.filter((ep) => ep.expense_id !== id);
      splits.forEach((s) => {
        this.expenseParticipants.push({
          expense_id: id,
          participant_id: s.participant_id,
          percentage_basis_points: s.percentage_basis_points ?? null,
          owed_cents: s.owed_cents,
        });
      });
    }

    return updated;
  }

  async deleteExpense(id: string): Promise<boolean> {
    this.expenseParticipants = this.expenseParticipants.filter((ep) => ep.expense_id !== id);
    return this.expenses.delete(id);
  }

  // Snapshots & Items
  async getSnapshotsBySerrucho(serruchoId: string): Promise<SettlementSnapshot[]> {
    return Array.from(this.settlementSnapshots.values()).filter(
      (s) => s.serrucho_id === serruchoId
    );
  }

  async getSnapshotByTokenHash(tokenHash: string): Promise<{
    snapshot: SettlementSnapshot;
    participant: Participant;
    serrucho: Serrucho;
    items: SettlementItem[];
  } | null> {
    const snapshot = Array.from(this.settlementSnapshots.values()).find(
      (s) => s.public_token_hash === tokenHash
    );
    if (!snapshot) return null;

    const participant = this.participants.get(snapshot.participant_id);
    const serrucho = this.serruchos.get(snapshot.serrucho_id);
    if (!participant || !serrucho) return null;

    const items = Array.from(this.settlementItems.values()).filter(
      (item) => item.snapshot_id === snapshot.id
    );

    return {
      snapshot,
      participant,
      serrucho,
      items,
    };
  }

  async createSettlementSnapshots(
    entries: {
      snapshot: Omit<SettlementSnapshot, "id" | "created_at" | "is_paid" | "paid_at">;
      items: Omit<SettlementItem, "id" | "snapshot_id">[];
    }[]
  ): Promise<SettlementSnapshot[]> {
    const createdSnapshots: SettlementSnapshot[] = [];
    const now = new Date().toISOString();

    for (const entry of entries) {
      const snapshotId = `snap-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const snapshot: SettlementSnapshot & { raw_token?: string } = {
        ...entry.snapshot,
        id: snapshotId,
        is_paid: false,
        paid_at: null,
        created_at: now,
        raw_token: (entry as any).rawToken,
      };
      this.settlementSnapshots.set(snapshotId, snapshot);
      createdSnapshots.push(snapshot);

      for (const itm of entry.items) {
        const itemId = `item-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const item: SettlementItem = {
          ...itm,
          id: itemId,
          snapshot_id: snapshotId,
        };
        this.settlementItems.set(itemId, item);
      }
    }

    return createdSnapshots;
  }

  async markSnapshotPaid(
    snapshotId: string,
    isPaid: boolean,
    details?: {
      payment_method?: PaymentMethod | null;
      payment_notes?: string | null;
      paid_amount_cents?: number | null;
      payment_status?: SettlementPaymentStatus | null;
    }
  ): Promise<SettlementSnapshot> {
    const existing = this.settlementSnapshots.get(snapshotId);
    if (!existing) throw new Error("Estado de cuenta no encontrado");

    const updated: SettlementSnapshot = {
      ...existing,
      is_paid: isPaid,
      paid_at: isPaid ? new Date().toISOString() : null,
      payment_method: details?.payment_method ?? existing.payment_method ?? null,
      payment_notes: details?.payment_notes ?? existing.payment_notes ?? null,
      payment_status: details?.payment_status ?? (isPaid ? "SETTLED" : "PENDING"),
      paid_amount_cents:
        details?.paid_amount_cents ?? (isPaid ? Math.abs(existing.balance_cents) : 0),
    };

    this.settlementSnapshots.set(snapshotId, updated);
    return updated;
  }

  // Notification Logs
  async createNotificationLog(
    logData: Omit<NotificationLog, "id" | "created_at">
  ): Promise<NotificationLog> {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const log: NotificationLog = {
      ...logData,
      id,
      created_at: new Date().toISOString(),
    };
    this.notificationLogs.set(id, log);
    return log;
  }

  async getNotificationLogs(serruchoId: string): Promise<NotificationLog[]> {
    return Array.from(this.notificationLogs.values()).filter(
      (l) => l.serrucho_id === serruchoId
    );
  }

  // Transfers
  async getTransfers(serruchoId: string): Promise<Transfer[]> {
    return Array.from(this.transfers.values()).filter(
      (t) => t.serrucho_id === serruchoId
    );
  }

  async getTransferById(id: string): Promise<Transfer | null> {
    return this.transfers.get(id) || null;
  }

  async createTransfer(
    transferData: Omit<Transfer, "id" | "created_at" | "updated_at">
  ): Promise<Transfer> {
    const id = `trans-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const now = new Date().toISOString();
    const transfer: Transfer = {
      ...transferData,
      id,
      created_at: now,
      updated_at: now,
    };
    this.transfers.set(id, transfer);
    return transfer;
  }

  async updateTransfer(id: string, updates: Partial<Transfer>): Promise<Transfer> {
    const existing = this.transfers.get(id);
    if (!existing) throw new Error("Transferencia no encontrada");

    const updated: Transfer = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.transfers.set(id, updated);
    return updated;
  }

  async deleteTransfer(id: string): Promise<boolean> {
    return this.transfers.delete(id);
  }

  // Incomes & Refunds
  async getIncomes(serruchoId: string): Promise<Income[]> {
    return Array.from(this.incomes.values()).filter(
      (inc) => inc.serrucho_id === serruchoId
    );
  }

  async getIncomeById(id: string): Promise<Income | null> {
    return this.incomes.get(id) || null;
  }

  async getIncomeSplits(incomeId: string): Promise<IncomeParticipant[]> {
    return this.incomeParticipants.filter((ip) => ip.income_id === incomeId);
  }

  async createIncome(
    incomeData: Omit<Income, "id" | "created_at" | "updated_at">,
    splits: Omit<IncomeParticipant, "income_id">[]
  ): Promise<Income> {
    const id = `inc-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const now = new Date().toISOString();
    const income: Income = {
      ...incomeData,
      id,
      created_at: now,
      updated_at: now,
    };
    this.incomes.set(id, income);

    for (const split of splits) {
      this.incomeParticipants.push({
        ...split,
        income_id: id,
      });
    }

    return income;
  }

  async updateIncomeWithSplits(
    id: string,
    updates: Partial<Income>,
    splits?: Omit<IncomeParticipant, "income_id">[]
  ): Promise<Income> {
    const existing = this.incomes.get(id);
    if (!existing) throw new Error("Ingreso no encontrado");

    const updated: Income = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.incomes.set(id, updated);

    if (splits) {
      this.incomeParticipants = this.incomeParticipants.filter(
        (ip) => ip.income_id !== id
      );
      for (const split of splits) {
        this.incomeParticipants.push({
          ...split,
          income_id: id,
        });
      }
    }

    return updated;
  }

  async deleteIncome(id: string): Promise<boolean> {
    const existed = this.incomes.delete(id);
    this.incomeParticipants = this.incomeParticipants.filter(
      (ip) => ip.income_id !== id
    );
    return existed;
  }
}
