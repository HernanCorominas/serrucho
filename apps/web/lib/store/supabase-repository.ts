import { SupabaseClient } from "@supabase/supabase-js";
import {
  Serrucho,
  Participant,
  Expense,
  ExpenseParticipant,
  SettlementSnapshot,
  SettlementItem,
  NotificationLog,
  Profile,
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

  async getSerruchoById(id: string): Promise<Serrucho | null> {
    const { data, error } = await this.client
      .from("serruchos")
      .select("*")
      .eq("id", id)
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

  async markSnapshotPaid(snapshotId: string, isPaid: boolean): Promise<SettlementSnapshot> {
    const paidAt = isPaid ? new Date().toISOString() : null;
    const { data, error } = await this.client
      .from("settlement_snapshots")
      .update({ is_paid: isPaid, paid_at: paidAt })
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
}
