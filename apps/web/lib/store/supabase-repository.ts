import { SupabaseClient } from "@supabase/supabase-js";
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
import { ISerruchoRepository } from "./repository";

export class SupabaseSerruchoRepository implements ISerruchoRepository {
  private client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  // Profiles
  async getProfile(id: string): Promise<Profile | null> {
    const { data, error } = await this.client
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return data as Profile;
  }

  async upsertProfile(profile: Profile): Promise<Profile> {
    const { data, error } = await this.client
      .from("profiles")
      .upsert(profile)
      .select()
      .single();
    if (error) throw error;
    return data as Profile;
  }

  // Serruchos
  async getSerruchosByOwner(ownerId: string): Promise<Serrucho[]> {
    const { data, error } = await this.client
      .from("serruchos")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as Serrucho[];
  }

  async getSerruchosByUser(userId: string): Promise<Serrucho[]> {
    if (!userId) return [];
    // 1. Serruchos created by user
    const { data: owned, error: err1 } = await this.client
      .from("serruchos")
      .select("*")
      .eq("owner_id", userId);
    if (err1) throw err1;

    // 2. Serruchos where user is a participant
    const { data: participations, error: err2 } = await this.client
      .from("participants")
      .select("serrucho_id")
      .eq("user_id", userId);
    if (err2) throw err2;

    const participatedIds = (participations || []).map((p: any) => p.serrucho_id);
    let participated: Serrucho[] = [];
    if (participatedIds.length > 0) {
      const { data: partData, error: err3 } = await this.client
        .from("serruchos")
        .select("*")
        .in("id", participatedIds);
      if (err3) throw err3;
      participated = (partData || []) as Serrucho[];
    }

    const map = new Map<string, Serrucho>();
    (owned || []).forEach((s: any) => map.set(s.id, s as Serrucho));
    participated.forEach((s) => map.set(s.id, s));
    return Array.from(map.values()).sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  async getSerruchoById(id: string): Promise<Serrucho | null> {
    const { data, error } = await this.client
      .from("serruchos")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return data as Serrucho;
  }

  async getSerruchoByReadOnlyToken(token: string): Promise<Serrucho | null> {
    if (!token || token.trim().length === 0) return null;
    const { data, error } = await this.client
      .from("serruchos")
      .select("*")
      .eq("read_only_token", token)
      .single();
    if (error || !data) return null;
    return data as Serrucho;
  }


  async createSerrucho(
    serrucho: Omit<Serrucho, "id" | "created_at" | "updated_at" | "closed_at">
  ): Promise<Serrucho> {
    const { data, error } = await this.client
      .from("serruchos")
      .insert(serrucho)
      .select()
      .single();
    if (error) throw error;
    return data as Serrucho;
  }

  async updateSerrucho(id: string, updates: Partial<Serrucho>): Promise<Serrucho> {
    const { data, error } = await this.client
      .from("serruchos")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Serrucho;
  }

  async deleteSerrucho(id: string): Promise<boolean> {
    const { error } = await this.client.from("serruchos").delete().eq("id", id);
    return !error;
  }

  // Participants
  async getParticipants(serruchoId: string): Promise<Participant[]> {
    const { data, error } = await this.client
      .from("participants")
      .select("*")
      .eq("serrucho_id", serruchoId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data as Participant[];
  }

  async getParticipantsByUser(userId: string): Promise<Participant[]> {
    if (!userId) return [];
    const { data, error } = await this.client
      .from("participants")
      .select("*")
      .eq("user_id", userId);
    if (error) throw error;
    return data as Participant[];
  }

  async getParticipantById(id: string): Promise<Participant | null> {
    const { data, error } = await this.client
      .from("participants")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return data as Participant;
  }

  async createParticipant(
    participant: Omit<Participant, "id" | "created_at" | "updated_at">
  ): Promise<Participant> {
    const { data, error } = await this.client
      .from("participants")
      .insert(participant)
      .select()
      .single();
    if (error) throw error;
    return data as Participant;
  }

  async updateParticipant(id: string, updates: Partial<Participant>): Promise<Participant> {
    const { data, error } = await this.client
      .from("participants")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Participant;
  }

  async deleteParticipant(id: string): Promise<boolean> {
    const { error } = await this.client.from("participants").delete().eq("id", id);
    return !error;
  }

  // Expenses
  async getExpenses(serruchoId: string): Promise<Expense[]> {
    const { data, error } = await this.client
      .from("expenses")
      .select("*")
      .eq("serrucho_id", serruchoId)
      .order("expense_date", { ascending: false });
    if (error) throw error;
    return (data || []).map((e) => ({
      ...e,
      category: e.category || "OTHER",
      amount_cents: Number(e.amount_cents),
    })) as Expense[];
  }

  async getExpenseById(id: string): Promise<Expense | null> {
    const { data, error } = await this.client
      .from("expenses")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return { ...data, category: data.category || "OTHER", amount_cents: Number(data.amount_cents) } as Expense;
  }

  async getExpenseSplits(expenseId: string): Promise<ExpenseParticipant[]> {
    const { data, error } = await this.client
      .from("expense_participants")
      .select("*")
      .eq("expense_id", expenseId);
    if (error) throw error;
    return (data || []).map((s) => ({
      ...s,
      owed_cents: Number(s.owed_cents),
    })) as ExpenseParticipant[];
  }

  async createExpenseWithSplits(
    expense: Omit<Expense, "id" | "created_at" | "updated_at">,
    splits: Omit<ExpenseParticipant, "expense_id">[]
  ): Promise<Expense> {
    const { data: expData, error: expError } = await this.client
      .from("expenses")
      .insert({ ...expense, category: expense.category || "OTHER" })
      .select()
      .single();
    if (expError) throw expError;

    const expenseId = expData.id;
    const splitRows = splits.map((s) => ({
      expense_id: expenseId,
      participant_id: s.participant_id,
      percentage_basis_points: s.percentage_basis_points ?? null,
      owed_cents: s.owed_cents,
    }));

    const { error: splitError } = await this.client
      .from("expense_participants")
      .insert(splitRows);
    if (splitError) throw splitError;

    return { ...expData, amount_cents: Number(expData.amount_cents) } as Expense;
  }

  async updateExpenseWithSplits(
    id: string,
    updates: Partial<Expense>,
    splits?: Omit<ExpenseParticipant, "expense_id">[]
  ): Promise<Expense> {
    const { data: expData, error: expError } = await this.client
      .from("expenses")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (expError) throw expError;

    if (splits) {
      await this.client.from("expense_participants").delete().eq("expense_id", id);
      const splitRows = splits.map((s) => ({
        expense_id: id,
        participant_id: s.participant_id,
        percentage_basis_points: s.percentage_basis_points ?? null,
        owed_cents: s.owed_cents,
      }));
      await this.client.from("expense_participants").insert(splitRows);
    }

    return { ...expData, amount_cents: Number(expData.amount_cents) } as Expense;
  }

  async deleteExpense(id: string): Promise<boolean> {
    const { error } = await this.client.from("expenses").delete().eq("id", id);
    return !error;
  }

  // Snapshots
  async getSnapshotsBySerrucho(serruchoId: string): Promise<SettlementSnapshot[]> {
    const { data, error } = await this.client
      .from("settlement_snapshots")
      .select("*")
      .eq("serrucho_id", serruchoId);
    if (error) throw error;
    return (data || []).map((s) => ({
      ...s,
      total_expenses_cents: Number(s.total_expenses_cents),
      owed_cents: Number(s.owed_cents),
      paid_cents: Number(s.paid_cents),
      balance_cents: Number(s.balance_cents),
      is_paid: Boolean(s.is_paid),
      paid_at: s.paid_at || null,
    })) as SettlementSnapshot[];
  }

  async getSnapshotByTokenHash(tokenHash: string): Promise<{
    snapshot: SettlementSnapshot;
    participant: Participant;
    serrucho: Serrucho;
    items: SettlementItem[];
  } | null> {
    const { data: snapshotData, error: snapError } = await this.client
      .from("settlement_snapshots")
      .select("*")
      .eq("public_token_hash", tokenHash)
      .single();
    if (snapError || !snapshotData) return null;

    const snapshot: SettlementSnapshot = {
      ...snapshotData,
      total_expenses_cents: Number(snapshotData.total_expenses_cents),
      owed_cents: Number(snapshotData.owed_cents),
      paid_cents: Number(snapshotData.paid_cents),
      balance_cents: Number(snapshotData.balance_cents),
      is_paid: Boolean(snapshotData.is_paid),
      paid_at: snapshotData.paid_at || null,
    };

    const [partRes, serruchoRes, itemsRes] = await Promise.all([
      this.client.from("participants").select("*").eq("id", snapshot.participant_id).single(),
      this.client.from("serruchos").select("*").eq("id", snapshot.serrucho_id).single(),
      this.client.from("settlement_items").select("*").eq("snapshot_id", snapshot.id),
    ]);

    if (partRes.error || serruchoRes.error) return null;

    const items = (itemsRes.data || []).map((item) => ({
      ...item,
      amount_cents: Number(item.amount_cents),
      participant_owed_cents: Number(item.participant_owed_cents),
    })) as SettlementItem[];

    return {
      snapshot,
      participant: partRes.data as Participant,
      serrucho: serruchoRes.data as Serrucho,
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

    for (const entry of entries) {
      const { data: snapData, error: snapError } = await this.client
        .from("settlement_snapshots")
        .insert({ ...entry.snapshot, is_paid: false, paid_at: null })
        .select()
        .single();
      if (snapError) throw snapError;

      const snap: SettlementSnapshot = {
        ...snapData,
        total_expenses_cents: Number(snapData.total_expenses_cents),
        owed_cents: Number(snapData.owed_cents),
        paid_cents: Number(snapData.paid_cents),
        balance_cents: Number(snapData.balance_cents),
        is_paid: false,
        paid_at: null,
      };
      createdSnapshots.push(snap);

      if (entry.items.length > 0) {
        const itemRows = entry.items.map((i) => ({
          ...i,
          snapshot_id: snap.id,
        }));
        const { error: itemError } = await this.client
          .from("settlement_items")
          .insert(itemRows);
        if (itemError) throw itemError;
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
    const paidAt = isPaid ? new Date().toISOString() : null;
    const updatePayload: any = {
      is_paid: isPaid,
      paid_at: paidAt,
    };
    if (details?.payment_method !== undefined) updatePayload.payment_method = details.payment_method;
    if (details?.payment_notes !== undefined) updatePayload.payment_notes = details.payment_notes;
    if (details?.paid_amount_cents !== undefined) updatePayload.paid_amount_cents = details.paid_amount_cents;
    if (details?.payment_status !== undefined) updatePayload.payment_status = details.payment_status;

    const { data, error } = await this.client
      .from("settlement_snapshots")
      .update(updatePayload)
      .eq("id", snapshotId)
      .select()
      .single();
    if (error) throw error;
    return {
      ...data,
      total_expenses_cents: Number(data.total_expenses_cents),
      owed_cents: Number(data.owed_cents),
      paid_cents: Number(data.paid_cents),
      balance_cents: Number(data.balance_cents),
      is_paid: Boolean(data.is_paid),
      paid_at: data.paid_at || null,
      payment_method: data.payment_method || null,
      payment_notes: data.payment_notes || null,
      payment_status: data.payment_status || (isPaid ? "SETTLED" : "PENDING"),
      paid_amount_cents: data.paid_amount_cents != null ? Number(data.paid_amount_cents) : null,
    } as SettlementSnapshot;
  }

  // Notification Logs
  async createNotificationLog(
    logData: Omit<NotificationLog, "id" | "created_at">
  ): Promise<NotificationLog> {
    const { data, error } = await this.client
      .from("notification_logs")
      .insert(logData)
      .select()
      .single();
    if (error) throw error;
    return data as NotificationLog;
  }

  async getNotificationLogs(serruchoId: string): Promise<NotificationLog[]> {
    const { data, error } = await this.client
      .from("notification_logs")
      .select("*")
      .eq("serrucho_id", serruchoId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as NotificationLog[];
  }

  // Transfers
  async getTransfers(serruchoId: string): Promise<Transfer[]> {
    const { data, error } = await this.client
      .from("transfers")
      .select("*")
      .eq("serrucho_id", serruchoId)
      .order("created_at", { ascending: false });
    if (error) return [];
    return (data || []).map((t) => ({
      ...t,
      amount_cents: Number(t.amount_cents),
    })) as Transfer[];
  }

  async getTransferById(id: string): Promise<Transfer | null> {
    const { data, error } = await this.client
      .from("transfers")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return {
      ...data,
      amount_cents: Number(data.amount_cents),
    } as Transfer;
  }

  async createTransfer(
    transferData: Omit<Transfer, "id" | "created_at" | "updated_at">
  ): Promise<Transfer> {
    const { data, error } = await this.client
      .from("transfers")
      .insert(transferData)
      .select()
      .single();
    if (error) throw error;
    return {
      ...data,
      amount_cents: Number(data.amount_cents),
    } as Transfer;
  }

  async updateTransfer(id: string, updates: Partial<Transfer>): Promise<Transfer> {
    const { data, error } = await this.client
      .from("transfers")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return {
      ...data,
      amount_cents: Number(data.amount_cents),
    } as Transfer;
  }

  async deleteTransfer(id: string): Promise<boolean> {
    const { error } = await this.client
      .from("transfers")
      .delete()
      .eq("id", id);
    return !error;
  }

  // Incomes & Refunds
  async getIncomes(serruchoId: string): Promise<Income[]> {
    const { data, error } = await this.client
      .from("incomes")
      .select("*")
      .eq("serrucho_id", serruchoId)
      .order("created_at", { ascending: false });
    if (error) return [];
    return (data || []).map((inc) => ({
      ...inc,
      amount_cents: Number(inc.amount_cents),
    })) as Income[];
  }

  async getIncomeById(id: string): Promise<Income | null> {
    const { data, error } = await this.client
      .from("incomes")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return {
      ...data,
      amount_cents: Number(data.amount_cents),
    } as Income;
  }

  async getIncomeSplits(incomeId: string): Promise<IncomeParticipant[]> {
    const { data, error } = await this.client
      .from("income_participants")
      .select("*")
      .eq("income_id", incomeId);
    if (error) return [];
    return (data || []).map((ip) => ({
      ...ip,
      credit_cents: Number(ip.credit_cents),
    })) as IncomeParticipant[];
  }

  async createIncome(
    incomeData: Omit<Income, "id" | "created_at" | "updated_at">,
    splits: Omit<IncomeParticipant, "income_id">[]
  ): Promise<Income> {
    const { data: income, error: incError } = await this.client
      .from("incomes")
      .insert(incomeData)
      .select()
      .single();
    if (incError) throw incError;

    if (splits.length > 0) {
      const splitRows = splits.map((s) => ({
        ...s,
        income_id: income.id,
      }));
      const { error: splitError } = await this.client
        .from("income_participants")
        .insert(splitRows);
      if (splitError) throw splitError;
    }

    return {
      ...income,
      amount_cents: Number(income.amount_cents),
    } as Income;
  }

  async updateIncomeWithSplits(
    id: string,
    updates: Partial<Income>,
    splits?: Omit<IncomeParticipant, "income_id">[]
  ): Promise<Income> {
    const { data: income, error: incError } = await this.client
      .from("incomes")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (incError) throw incError;

    if (splits) {
      await this.client.from("income_participants").delete().eq("income_id", id);
      if (splits.length > 0) {
        const splitRows = splits.map((s) => ({
          ...s,
          income_id: id,
        }));
        const { error: splitError } = await this.client
          .from("income_participants")
          .insert(splitRows);
        if (splitError) throw splitError;
      }
    }

    return {
      ...income,
      amount_cents: Number(income.amount_cents),
    } as Income;
  }

  async deleteIncome(id: string): Promise<boolean> {
    await this.client.from("income_participants").delete().eq("income_id", id);
    const { error } = await this.client.from("incomes").delete().eq("id", id);
    return !error;
  }

  async createActivityEvent(
    event: Omit<ActivityEvent, "id" | "created_at">
  ): Promise<ActivityEvent> {
    const { data, error } = await this.client
      .from("activity_events")
      .insert(event)
      .select()
      .single();

    if (error) {
      // In case activity_events table is not yet migrated in Supabase, return formatted fallback
      return {
        ...event,
        id: `act-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
    }
    return data as ActivityEvent;
  }

  async getActivityEvents(serruchoId: string, limit: number = 100): Promise<ActivityEvent[]> {
    const { data, error } = await this.client
      .from("activity_events")
      .select("*")
      .eq("serrucho_id", serruchoId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data as ActivityEvent[];
  }
}
