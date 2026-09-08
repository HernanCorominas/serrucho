import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  calculateParticipantBalances,
  simplifyDebts,
  type Serrucho,
  type Participant,
  type ExpenseWithSplits,
  type Transfer,
  type ActivityEvent,
} from "@serrucho/core";
import {
  mobileStorage,
  type MobileSerruchoDetailData,
  type BilateralSettlement,
} from "./storage";

export type SyncActionType =
  | "EXPENSE_CREATED"
  | "EXPENSE_UPDATED"
  | "EXPENSE_DELETED"
  | "PARTICIPANT_ADDED"
  | "PARTICIPANT_CLAIMED"
  | "SETTLEMENT_INITIATED"
  | "SETTLEMENT_CONFIRMED"
  | "SETTLEMENT_REJECTED"
  | "SERRUCHO_UPDATED";

export interface SyncMutation {
  id: string;
  serrucho_id: string;
  action_type: SyncActionType;
  actor_user_id: string;
  actor_participant_id?: string | null;
  payload: any;
  timestamp: string;
}

export interface SyncMessage {
  type: "MUTATION" | "FULL_SYNC";
  serrucho_id: string;
  sender_user_id: string;
  mutation?: SyncMutation;
  full_state?: MobileSerruchoDetailData;
  timestamp: string;
}

export interface ISyncProvider {
  publish(serruchoId: string, message: SyncMessage): Promise<void>;
  subscribe(serruchoId: string, listener: (message: SyncMessage) => void): () => void;
}

// Global In-Memory / Cross-Instance Broadcast Relay for multi-device simulation & coordination
type ChannelListener = (message: SyncMessage) => void;
const channelSubscribers = new Map<string, Set<ChannelListener>>();

export const memoryBroadcastProvider: ISyncProvider = {
  async publish(serruchoId: string, message: SyncMessage): Promise<void> {
    const listeners = channelSubscribers.get(serruchoId);
    if (listeners) {
      const promises = Array.from(listeners).map(async (listener) => {
        try {
          await listener(message);
        } catch (e) {
          console.warn("Error in sync channel listener", e);
        }
      });
      await Promise.all(promises);
    }
  },

  subscribe(serruchoId: string, listener: ChannelListener): () => void {
    if (!channelSubscribers.has(serruchoId)) {
      channelSubscribers.set(serruchoId, new Set());
    }
    const set = channelSubscribers.get(serruchoId)!;
    set.add(listener);
    return () => {
      set.delete(listener);
      if (set.size === 0) {
        channelSubscribers.delete(serruchoId);
      }
    };
  },
};

const SYNC_QUEUE_KEY = "@serrucho:sync_queue";

export class MobileSyncEngine {
  private provider: ISyncProvider;
  private onlineStatus = true;
  private activeSubscriptions = new Map<string, () => void>();

  constructor(provider: ISyncProvider = memoryBroadcastProvider) {
    this.provider = provider;
  }

  setProvider(provider: ISyncProvider) {
    this.provider = provider;
  }

  isOnline(): boolean {
    return this.onlineStatus;
  }

  setOnline(online: boolean) {
    this.onlineStatus = online;
    if (online) {
      this.flushQueue();
    }
  }

  // --- Offline Queue Management ---
  async getQueue(): Promise<SyncMutation[]> {
    try {
      const data = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  async enqueueMutation(mutation: SyncMutation): Promise<void> {
    try {
      const queue = await this.getQueue();
      queue.push(mutation);
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.warn("Error enqueuing mutation", e);
    }
  }

  async clearQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
    } catch (e) {
      console.warn("Error clearing sync queue", e);
    }
  }

  async flushQueue(): Promise<number> {
    const queue = await this.getQueue();
    if (queue.length === 0) return 0;

    let flushed = 0;
    const remaining: SyncMutation[] = [];

    for (const mutation of queue) {
      try {
        await this.broadcastMutation(mutation);
        flushed++;
      } catch {
        remaining.push(mutation);
      }
    }

    try {
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remaining));
    } catch (e) {
      console.warn("Error saving remaining queue", e);
    }

    return flushed;
  }

  // --- Security & Authorization Verification ---
  async verifyGroupAuthorization(
    userId: string,
    serruchoId: string
  ): Promise<boolean> {
    // Check if user has explicit membership in this group
    const membership = await mobileStorage.getUserMembership(userId, serruchoId);
    if (membership) return true;

    // Check if user has claimed an identity in this serrucho
    const claimedId = await mobileStorage.getMyIdentity(serruchoId);
    if (claimedId) return true;

    // Check if the serrucho detail exists in local storage and user is owner
    const detail = await mobileStorage.getSerruchoDetail(serruchoId);
    if (!detail) return false;

    return detail.serrucho.owner_id === userId;
  }

  // --- Broadcast & Remote Subscription ---
  async broadcastMutation(mutation: SyncMutation): Promise<void> {
    if (!this.onlineStatus) {
      await this.enqueueMutation(mutation);
      return;
    }

    const message: SyncMessage = {
      type: "MUTATION",
      serrucho_id: mutation.serrucho_id,
      sender_user_id: mutation.actor_user_id,
      mutation,
      timestamp: new Date().toISOString(),
    };

    await this.provider.publish(mutation.serrucho_id, message);
  }

  async broadcastFullSync(serruchoId: string, state: MobileSerruchoDetailData, senderUserId: string): Promise<void> {
    if (!this.onlineStatus) return;

    const message: SyncMessage = {
      type: "FULL_SYNC",
      serrucho_id: serruchoId,
      sender_user_id: senderUserId,
      full_state: state,
      timestamp: new Date().toISOString(),
    };

    await this.provider.publish(serruchoId, message);
  }

  subscribeToSerrucho(
    serruchoId: string,
    currentUserId: string,
    onRemoteUpdate: (updated: MobileSerruchoDetailData) => void
  ): () => void {
    // Unsubscribe existing if present
    if (this.activeSubscriptions.has(serruchoId)) {
      this.activeSubscriptions.get(serruchoId)!();
      this.activeSubscriptions.delete(serruchoId);
    }

    const unsub = this.provider.subscribe(serruchoId, async (message: SyncMessage) => {
      // Ignore echoes from self
      if (message.sender_user_id === currentUserId) return;

      try {
        const localDetail = await mobileStorage.getSerruchoDetail(serruchoId);
        if (!localDetail) return;

        let reconciled: MobileSerruchoDetailData;

        if (message.type === "FULL_SYNC" && message.full_state) {
          reconciled = this.reconcileState(localDetail, message.full_state);
        } else if (message.type === "MUTATION" && message.mutation) {
          reconciled = this.applyMutationToState(localDetail, message.mutation);
        } else {
          return;
        }

        // Save reconciled state locally (this triggers local pub-sub for instant UI update)
        await mobileStorage.saveSerruchoDetail(serruchoId, reconciled);
        onRemoteUpdate(reconciled);
      } catch (e) {
        console.warn("Error handling remote sync message", e);
      }
    });

    this.activeSubscriptions.set(serruchoId, unsub);

    return () => {
      unsub();
      this.activeSubscriptions.delete(serruchoId);
    };
  }

  // --- State Reconciliation & Financial Invariant Preservation ---
  applyMutationToState(
    current: MobileSerruchoDetailData,
    mutation: SyncMutation
  ): MobileSerruchoDetailData {
    let updatedParticipants = [...current.participants];
    let updatedExpenses = [...current.expenses];
    let updatedTransfers = [...(current.transfers || [])];
    let updatedActivities = [...(current.activities || [])];
    let updatedSettlements = [...(current.bilateral_settlements || [])];
    let updatedSerrucho = { ...current.serrucho };

    switch (mutation.action_type) {
      case "EXPENSE_CREATED": {
        const newExp: ExpenseWithSplits = mutation.payload;
        if (!updatedExpenses.some((e) => e.id === newExp.id)) {
          updatedExpenses = [newExp, ...updatedExpenses];
        }
        break;
      }
      case "EXPENSE_UPDATED": {
        const modifiedExp: ExpenseWithSplits = mutation.payload;
        updatedExpenses = updatedExpenses.map((e) =>
          e.id === modifiedExp.id ? modifiedExp : e
        );
        break;
      }
      case "EXPENSE_DELETED": {
        const { expense_id } = mutation.payload;
        updatedExpenses = updatedExpenses.filter((e) => e.id !== expense_id);
        break;
      }
      case "PARTICIPANT_ADDED": {
        const newPart: Participant = mutation.payload;
        if (!updatedParticipants.some((p) => p.id === newPart.id)) {
          updatedParticipants.push(newPart);
        }
        break;
      }
      case "PARTICIPANT_CLAIMED": {
        const { participant_id, user_id } = mutation.payload;
        // Verified claiming - ensures participant exists
        const part = updatedParticipants.find((p) => p.id === participant_id);
        if (part) {
          // Idempotent assignment
          part.updated_at = mutation.timestamp;
        }
        break;
      }
      case "SETTLEMENT_INITIATED": {
        const settlement: BilateralSettlement = mutation.payload;
        const idx = updatedSettlements.findIndex((s) => s.id === settlement.id);
        if (idx >= 0) {
          updatedSettlements[idx] = settlement;
        } else {
          updatedSettlements.push(settlement);
        }
        break;
      }
      case "SETTLEMENT_CONFIRMED": {
        const settlement: BilateralSettlement = mutation.payload;
        updatedSettlements = updatedSettlements.map((s) =>
          s.id === settlement.id ? { ...settlement, status: "SETTLED" } : s
        );

        // Record transfer upon confirmed settlement if not already recorded
        const transferId = `tr_settle_${settlement.id}`;
        if (!updatedTransfers.some((t) => t.id === transferId)) {
          const newTransfer: Transfer = {
            id: transferId,
            serrucho_id: settlement.serrucho_id,
            sender_participant_id: settlement.debtor_participant_id,
            receiver_participant_id: settlement.creditor_participant_id,
            amount_cents: settlement.amount_cents,
            transfer_date: new Date().toISOString().split("T")[0],
            payment_method: settlement.payment_method === "TRANSFER" ? "TRANSFER_OTHER" : settlement.payment_method,
            notes: `Liquidación confirmada vía PIN`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          updatedTransfers.push(newTransfer);
        }
        break;
      }
      case "SETTLEMENT_REJECTED": {
        const { settlement_id } = mutation.payload;
        updatedSettlements = updatedSettlements.map((s) =>
          s.id === settlement_id ? { ...s, status: "REJECTED", rejected_at: mutation.timestamp } : s
        );
        break;
      }
      case "SERRUCHO_UPDATED": {
        updatedSerrucho = { ...updatedSerrucho, ...mutation.payload, updated_at: mutation.timestamp };
        break;
      }
    }

    // Recompute financial balances deterministically preserving BAL-08 and zero-sum
    const calculatedBalances = calculateParticipantBalances(
      updatedParticipants,
      updatedExpenses,
      updatedTransfers
    );

    return {
      serrucho: updatedSerrucho,
      participants: updatedParticipants,
      expenses: updatedExpenses,
      balances: calculatedBalances,
      transfers: updatedTransfers,
      activities: updatedActivities,
      tier: current.tier || "FREE",
      bilateral_settlements: updatedSettlements,
    };
  }

  reconcileState(
    local: MobileSerruchoDetailData,
    remote: MobileSerruchoDetailData
  ): MobileSerruchoDetailData {
    // 1. Merge Participants (Idempotent union by id)
    const participantMap = new Map<string, Participant>();
    local.participants.forEach((p) => participantMap.set(p.id, p));
    remote.participants.forEach((p) => {
      if (!participantMap.has(p.id)) {
        participantMap.set(p.id, p);
      } else {
        const existing = participantMap.get(p.id)!;
        // Latest updated_at wins
        if (new Date(p.updated_at).getTime() > new Date(existing.updated_at).getTime()) {
          participantMap.set(p.id, p);
        }
      }
    });
    const mergedParticipants = Array.from(participantMap.values());

    // 2. Merge Expenses (Latest updated_at wins per expense ID)
    const expenseMap = new Map<string, ExpenseWithSplits>();
    local.expenses.forEach((e) => expenseMap.set(e.id, e));
    remote.expenses.forEach((e) => {
      if (!expenseMap.has(e.id)) {
        expenseMap.set(e.id, e);
      } else {
        const localExp = expenseMap.get(e.id)!;
        const remoteTime = new Date(e.updated_at || e.created_at).getTime();
        const localTime = new Date(localExp.updated_at || localExp.created_at).getTime();
        if (remoteTime >= localTime) {
          expenseMap.set(e.id, e);
        }
      }
    });
    const mergedExpenses = Array.from(expenseMap.values());

    // 3. Merge Transfers (Unique by id)
    const transferMap = new Map<string, Transfer>();
    (local.transfers || []).forEach((t) => transferMap.set(t.id, t));
    (remote.transfers || []).forEach((t) => transferMap.set(t.id, t));
    const mergedTransfers = Array.from(transferMap.values());

    // 4. Merge Bilateral Settlements (Latest status & updated_at wins)
    const settlementMap = new Map<string, BilateralSettlement>();
    (local.bilateral_settlements || []).forEach((s) => settlementMap.set(s.id, s));
    (remote.bilateral_settlements || []).forEach((s) => {
      if (!settlementMap.has(s.id)) {
        settlementMap.set(s.id, s);
      } else {
        const localSet = settlementMap.get(s.id)!;
        if (new Date(s.updated_at).getTime() >= new Date(localSet.updated_at).getTime()) {
          settlementMap.set(s.id, s);
        }
      }
    });
    const mergedSettlements = Array.from(settlementMap.values());

    // 5. Serrucho Metadata (Latest updated_at wins)
    const localTime = new Date(local.serrucho.updated_at).getTime();
    const remoteTime = new Date(remote.serrucho.updated_at).getTime();
    const winningSerrucho = remoteTime > localTime ? remote.serrucho : local.serrucho;

    // 6. Recalculate deterministic balances and debt minimization using financial core
    const calculatedBalances = calculateParticipantBalances(
      mergedParticipants,
      mergedExpenses,
      mergedTransfers
    );

    return {
      serrucho: winningSerrucho,
      participants: mergedParticipants,
      expenses: mergedExpenses,
      balances: calculatedBalances,
      transfers: mergedTransfers,
      activities: remote.activities || local.activities || [],
      tier: remote.tier || local.tier || "FREE",
      bilateral_settlements: mergedSettlements,
    };
  }
}

export const mobileSyncEngine = new MobileSyncEngine();
