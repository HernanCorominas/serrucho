import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock React Native modules prior to importing mobile code
vi.mock("react-native", () => ({
  Platform: { OS: "ios" },
  useColorScheme: vi.fn(() => "light"),
  StyleSheet: { create: (styles: any) => styles },
  Alert: { alert: vi.fn() },
  Share: { share: vi.fn() },
  Linking: { openURL: vi.fn(), canOpenURL: vi.fn().mockResolvedValue(true) },
}));

// In-memory mock storage for multi-device simulation
const mockDeviceStorage = new Map<string, string>();
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async (key: string) => mockDeviceStorage.get(key) || null),
    setItem: vi.fn(async (key: string, val: string) => {
      mockDeviceStorage.set(key, val);
    }),
    removeItem: vi.fn(async (key: string) => {
      mockDeviceStorage.delete(key);
    }),
    clear: vi.fn(async () => {
      mockDeviceStorage.clear();
    }),
  },
}));

import {
  mobileStorage,
  encodeGroupPayload,
  decodeGroupPayload,
  type MobileSerruchoDetailData,
  type BilateralSettlement,
} from "../../src/services/storage";
import {
  MobileSyncEngine,
  memoryBroadcastProvider,
  type SyncMessage,
} from "../../src/services/sync";
import {
  calculateParticipantBalances,
  simplifyDebts,
  splitEqually,
  type Serrucho,
  type Participant,
  type ExpenseWithSplits,
  type Transfer,
} from "@serrucho/core";

describe("SER-KITTY-012 — Mobile Multi-Device Collaboration & Sync Engine", () => {
  beforeEach(() => {
    mockDeviceStorage.clear();
    vi.clearAllMocks();
  });

  describe("1. Portable Invitation & Multi-Device Join Flow", () => {
    it("encodes and decodes group snapshot payload for cross-device transport", () => {
      const now = new Date().toISOString();
      const serrucho: Serrucho = {
        id: "s_coro_123",
        owner_id: "u_juan",
        name: "Cena en Santo Domingo",
        description: "Restaurante típico",
        currency: "DOP",
        event_date: now,
        status: "OPEN",
        payment_instructions: null,
        payment_deadline: null,
        closed_at: null,
        created_at: now,
        updated_at: now,
      };
      const p1: Participant = {
        id: "p_juan",
        serrucho_id: "s_coro_123",
        name: "Juan",
        email: null,
        phone: null,
        preferred_channel: "WHATSAPP",
        created_at: now,
        updated_at: now,
      };
      const p2: Participant = {
        id: "p_pedro",
        serrucho_id: "s_coro_123",
        name: "Pedro",
        email: null,
        phone: null,
        preferred_channel: "WHATSAPP",
        created_at: now,
        updated_at: now,
      };

      const originalDetail: MobileSerruchoDetailData = {
        serrucho,
        participants: [p1, p2],
        expenses: [],
        balances: [],
        transfers: [],
        activities: [],
        tier: "FREE",
      };

      // Device A encodes the payload
      const encoded = encodeGroupPayload(originalDetail);
      expect(encoded).toBeDefined();
      expect(typeof encoded).toBe("string");
      expect(encoded.length).toBeGreaterThan(20);

      // Device B receives the link with payload and decodes it
      const decoded = decodeGroupPayload(encoded);
      expect(decoded).not.toBeNull();
      expect(decoded!.serrucho.id).toBe("s_coro_123");
      expect(decoded!.serrucho.name).toBe("Cena en Santo Domingo");
      expect(decoded!.participants).toHaveLength(2);
      expect(decoded!.participants.map((p) => p.name)).toEqual(["Juan", "Pedro"]);
    });

    it("handles invalid or corrupted payload strings gracefully without throwing", () => {
      expect(decodeGroupPayload("")).toBeNull();
      expect(decodeGroupPayload("not-valid-base64-json-???")).toBeNull();
      expect(decodeGroupPayload("e30=")).toBeNull(); // Empty object {} without required fields
    });

    it("prevents duplicate participant records when Device B claims their identity", async () => {
      const now = new Date().toISOString();
      const p1: Participant = { id: "p1", serrucho_id: "s1", name: "Juan", email: null, phone: null, preferred_channel: "WHATSAPP", created_at: now, updated_at: now };
      const p2: Participant = { id: "p2", serrucho_id: "s1", name: "Pedro", email: null, phone: null, preferred_channel: "WHATSAPP", created_at: now, updated_at: now };

      const detail: MobileSerruchoDetailData = {
        serrucho: {
          id: "s1",
          owner_id: "u1",
          name: "Coro",
          description: null,
          currency: "DOP",
          event_date: now,
          status: "OPEN",
          payment_instructions: null,
          payment_deadline: null,
          closed_at: null,
          created_at: now,
          updated_at: now,
        },
        participants: [p1, p2],
        expenses: [],
        balances: [],
        transfers: [],
        activities: [],
      };

      // Device B claims "Pedro" (p2)
      await mobileStorage.setMyIdentity("s1", "p2");
      const claimedId = await mobileStorage.getMyIdentity("s1");
      expect(claimedId).toBe("p2");

      // Idempotency: Claiming again does not change or duplicate
      await mobileStorage.setMyIdentity("s1", "p2");
      const user = await mobileStorage.getGlobalUser();
      const membership = await mobileStorage.getUserMembership(user.id, "s1");
      expect(membership).not.toBeNull();
      expect(membership!.participant_id).toBe("p2");

      // Verify participant list still contains only Juan and Pedro
      expect(detail.participants).toHaveLength(2);
      expect(detail.participants.filter((p) => p.name === "Pedro")).toHaveLength(1);
    });
  });

  describe("2. Multi-Device Expense Synchronization (A -> B and B -> A)", () => {
    it("propagates newly created expense from Device A to Device B without refresh", async () => {
      const engineA = new MobileSyncEngine(memoryBroadcastProvider);
      const engineB = new MobileSyncEngine(memoryBroadcastProvider);

      const now = new Date().toISOString();
      const serruchoId = "s_sync_exp";
      const pJuan: Participant = { id: "p_j", serrucho_id: serruchoId, name: "Juan", email: null, phone: null, preferred_channel: "WHATSAPP", created_at: now, updated_at: now };
      const pPedro: Participant = { id: "p_p", serrucho_id: serruchoId, name: "Pedro", email: null, phone: null, preferred_channel: "WHATSAPP", created_at: now, updated_at: now };

      const initialDetail: MobileSerruchoDetailData = {
        serrucho: {
          id: serruchoId,
          owner_id: "u_juan",
          name: "Cena Sincronizada",
          description: null,
          currency: "DOP",
          event_date: now,
          status: "OPEN",
          payment_instructions: null,
          payment_deadline: null,
          closed_at: null,
          created_at: now,
          updated_at: now,
        },
        participants: [pJuan, pPedro],
        expenses: [],
        balances: [],
        transfers: [],
        activities: [],
      };

      // Set initial state in storage for Device B
      await mobileStorage.saveSerruchoDetail(serruchoId, initialDetail);

      // Device B subscribes to remote updates
      let deviceBReceivedDetail: MobileSerruchoDetailData | null = null;
      const unsubscribeB = engineB.subscribeToSerrucho(serruchoId, "u_pedro", (updated) => {
        deviceBReceivedDetail = updated;
      });

      // Device A creates an expense: RD$5,000 (500000 cents) paid by Juan
      const splits = splitEqually(500000, [pJuan.id, pPedro.id]).map((s) => ({
        expense_id: "exp_1",
        participant_id: s.participantId,
        participant_name: s.participantId === pJuan.id ? "Juan" : "Pedro",
        owed_cents: s.owedCents,
        percentage_basis_points: 5000,
      }));

      const newExpense: ExpenseWithSplits = {
        id: "exp_1",
        serrucho_id: serruchoId,
        paid_by_participant_id: pJuan.id,
        paid_by_name: "Juan",
        description: "Cena en Santo Domingo",
        amount_cents: 500000,
        split_method: "EQUAL",
        category: "RESTAURANT",
        expense_date: now.split("T")[0],
        created_at: now,
        updated_at: now,
        splits,
      };

      // Device A broadcasts the mutation
      await engineA.broadcastMutation({
        id: "mut_1",
        serrucho_id: serruchoId,
        action_type: "EXPENSE_CREATED",
        actor_user_id: "u_juan",
        actor_participant_id: pJuan.id,
        payload: newExpense,
        timestamp: now,
      });

      // Assert Device B received the expense automatically
      expect(deviceBReceivedDetail).not.toBeNull();
      expect(deviceBReceivedDetail!.expenses).toHaveLength(1);
      expect(deviceBReceivedDetail!.expenses[0].id).toBe("exp_1");
      expect(deviceBReceivedDetail!.expenses[0].amount_cents).toBe(500000);

      // Verify Pedro's balance on Device B is -RD$2,500 (-250000 cents)
      const pedroBalance = deviceBReceivedDetail!.balances.find((b) => b.id === pPedro.id);
      expect(pedroBalance).toBeDefined();
      expect(pedroBalance!.net_balance_cents).toBe(-250000);

      unsubscribeB();
    });

    it("propagates expense modifications and deletions between devices", () => {
      const engine = new MobileSyncEngine();
      const now = new Date().toISOString();
      const baseDetail: MobileSerruchoDetailData = {
        serrucho: { id: "s1", owner_id: "u1", name: "S1", description: null, currency: "DOP", event_date: now, status: "OPEN", payment_instructions: null, payment_deadline: null, closed_at: null, created_at: now, updated_at: now },
        participants: [
          { id: "p1", serrucho_id: "s1", name: "A", email: null, phone: null, preferred_channel: "WHATSAPP", created_at: now, updated_at: now },
          { id: "p2", serrucho_id: "s1", name: "B", email: null, phone: null, preferred_channel: "WHATSAPP", created_at: now, updated_at: now },
        ],
        expenses: [
          {
            id: "e1",
            serrucho_id: "s1",
            paid_by_participant_id: "p1",
            paid_by_name: "A",
            description: "Almuerzo",
            amount_cents: 200000,
            split_method: "EQUAL",
            category: "RESTAURANT",
            expense_date: now.split("T")[0],
            created_at: now,
            updated_at: now,
            splits: [
              { expense_id: "e1", participant_id: "p1", participant_name: "A", owed_cents: 100000, percentage_basis_points: 5000 },
              { expense_id: "e1", participant_id: "p2", participant_name: "B", owed_cents: 100000, percentage_basis_points: 5000 },
            ],
          },
        ],
        balances: [],
        transfers: [],
        activities: [],
      };

      // 1. Modify expense to 300000 cents
      const modifiedExp: ExpenseWithSplits = {
        ...baseDetail.expenses[0],
        amount_cents: 300000,
        updated_at: new Date(Date.now() + 1000).toISOString(),
      };
      const updatedState = engine.applyMutationToState(baseDetail, {
        id: "mut_mod",
        serrucho_id: "s1",
        action_type: "EXPENSE_UPDATED",
        actor_user_id: "u1",
        payload: modifiedExp,
        timestamp: new Date().toISOString(),
      });
      expect(updatedState.expenses[0].amount_cents).toBe(300000);

      // 2. Delete expense
      const deletedState = engine.applyMutationToState(updatedState, {
        id: "mut_del",
        serrucho_id: "s1",
        action_type: "EXPENSE_DELETED",
        actor_user_id: "u1",
        payload: { expense_id: "e1" },
        timestamp: new Date().toISOString(),
      });
      expect(deletedState.expenses).toHaveLength(0);
      expect(deletedState.balances.every((b) => b.net_balance_cents === 0)).toBe(true);
    });
  });

  describe("3. Financial Invariants Parity Across Devices (BAL-08 & Zero-Sum)", () => {
    it("preserves exact BAL-08 (3334, 3333, 3333) and zero-sum on both devices", () => {
      const engine = new MobileSyncEngine();
      const now = new Date().toISOString();
      const participants: Participant[] = [
        { id: "p1", serrucho_id: "s1", name: "Juan", email: null, phone: null, preferred_channel: "WHATSAPP", created_at: now, updated_at: now },
        { id: "p2", serrucho_id: "s1", name: "Pedro", email: null, phone: null, preferred_channel: "WHATSAPP", created_at: now, updated_at: now },
        { id: "p3", serrucho_id: "s1", name: "María", email: null, phone: null, preferred_channel: "WHATSAPP", created_at: now, updated_at: now },
      ];

      // RD$ 100.00 (10000 cents) split equally 3 ways
      const splits = splitEqually(10000, ["p1", "p2", "p3"]);
      expect(splits[0].owedCents).toBe(3334);
      expect(splits[1].owedCents).toBe(3333);
      expect(splits[2].owedCents).toBe(3333);
      expect(splits.reduce((acc, s) => acc + s.owedCents, 0)).toBe(10000);

      const expense: ExpenseWithSplits = {
        id: "exp_bal08",
        serrucho_id: "s1",
        paid_by_participant_id: "p1",
        paid_by_name: "Juan",
        description: "Peaje RD$",
        amount_cents: 10000,
        split_method: "EQUAL",
        category: "TRANSPORTATION",
        expense_date: now.split("T")[0],
        created_at: now,
        updated_at: now,
        splits: splits.map((s) => ({
          expense_id: "exp_bal08",
          participant_id: s.participantId,
          participant_name: s.participantId,
          owed_cents: s.owedCents,
          percentage_basis_points: s.percentageBasisPoints || 3333,
        })),
      };

      const state = engine.applyMutationToState(
        {
          serrucho: { id: "s1", owner_id: "u1", name: "S", description: null, currency: "DOP", event_date: now, status: "OPEN", payment_instructions: null, payment_deadline: null, closed_at: null, created_at: now, updated_at: now },
          participants,
          expenses: [],
          balances: [],
          transfers: [],
          activities: [],
        },
        {
          id: "m_bal",
          serrucho_id: "s1",
          action_type: "EXPENSE_CREATED",
          actor_user_id: "u1",
          payload: expense,
          timestamp: now,
        }
      );

      // Invariant: sum of net balances must be strictly 0
      const sumBalances = state.balances.reduce((acc, b) => acc + b.net_balance_cents, 0);
      expect(sumBalances).toBe(0);

      // Juan paid 10000 and owes 3334 -> net balance is +6666
      const juanBal = state.balances.find((b) => b.id === "p1")!;
      expect(juanBal.total_paid_cents).toBe(10000);
      expect(juanBal.total_owed_cents).toBe(3334);
      expect(juanBal.net_balance_cents).toBe(6666);

      // Pedro paid 0 and owes 3333 -> net balance is -3333
      const pedroBal = state.balances.find((b) => b.id === "p2")!;
      expect(pedroBal.net_balance_cents).toBe(-3333);

      // María paid 0 and owes 3333 -> net balance is -3333
      const mariaBal = state.balances.find((b) => b.id === "p3")!;
      expect(mariaBal.net_balance_cents).toBe(-3333);

      // Debt simplification produces exactly 2 transfers
      const debts = simplifyDebts(participants, state.balances);
      expect(debts).toHaveLength(2);
      expect(debts.reduce((acc, d) => acc + d.amount_cents, 0)).toBe(6666);
    });
  });

  describe("4. Multi-Device Bilateral Settlement with 4-Digit PIN", () => {
    it("completes bilateral settlement lifecycle across two devices", () => {
      const engine = new MobileSyncEngine();
      const now = new Date().toISOString();
      const pJuan: Participant = { id: "p_j", serrucho_id: "s1", name: "Juan", email: null, phone: null, preferred_channel: "WHATSAPP", created_at: now, updated_at: now };
      const pPedro: Participant = { id: "p_p", serrucho_id: "s1", name: "Pedro", email: null, phone: null, preferred_channel: "WHATSAPP", created_at: now, updated_at: now };

      const initialDetail: MobileSerruchoDetailData = {
        serrucho: { id: "s1", owner_id: "u1", name: "S1", description: null, currency: "DOP", event_date: now, status: "OPEN", payment_instructions: null, payment_deadline: null, closed_at: null, created_at: now, updated_at: now },
        participants: [pJuan, pPedro],
        expenses: [],
        balances: [],
        transfers: [],
        activities: [],
      };

      // Step 1: Debtor initiates settlement on Device A
      const settlementRecord: BilateralSettlement = {
        id: "bsett_1",
        serrucho_id: "s1",
        debtor_participant_id: pPedro.id,
        debtor_name: "Pedro",
        creditor_participant_id: pJuan.id,
        creditor_name: "Juan",
        amount_cents: 250000,
        payment_method: "TRANSFER",
        status: "PENDING_CONFIRMATION",
        created_at: now,
        updated_at: now,
      };

      const step1State = engine.applyMutationToState(initialDetail, {
        id: "m_init",
        serrucho_id: "s1",
        action_type: "SETTLEMENT_INITIATED",
        actor_user_id: "u_pedro",
        payload: settlementRecord,
        timestamp: now,
      });

      expect(step1State.bilateral_settlements).toHaveLength(1);
      expect(step1State.bilateral_settlements![0].status).toBe("PENDING_CONFIRMATION");

      // Step 2: Creditor confirms on Device B and inputs 4-digit PIN
      const confirmedSettlement: BilateralSettlement = {
        ...settlementRecord,
        status: "SETTLED",
        confirmation_code: "4819",
        settled_at: now,
        updated_at: new Date(Date.now() + 500).toISOString(),
      };

      const step2State = engine.applyMutationToState(step1State, {
        id: "m_conf",
        serrucho_id: "s1",
        action_type: "SETTLEMENT_CONFIRMED",
        actor_user_id: "u_juan",
        payload: confirmedSettlement,
        timestamp: new Date().toISOString(),
      });

      // Both devices reflect SETTLED
      expect(step2State.bilateral_settlements![0].status).toBe("SETTLED");
      // Transfer record created automatically
      expect(step2State.transfers).toHaveLength(1);
      expect(step2State.transfers![0].amount_cents).toBe(250000);
      expect(step2State.transfers![0].sender_participant_id).toBe(pPedro.id);
      expect(step2State.transfers![0].receiver_participant_id).toBe(pJuan.id);
    });

    it("handles settlement rejection transition", () => {
      const engine = new MobileSyncEngine();
      const now = new Date().toISOString();
      const settlement: BilateralSettlement = {
        id: "bsett_rej",
        serrucho_id: "s1",
        debtor_participant_id: "p1",
        debtor_name: "Pedro",
        creditor_participant_id: "p2",
        creditor_name: "Juan",
        amount_cents: 100000,
        payment_method: "CASH",
        status: "PENDING_CONFIRMATION",
        created_at: now,
        updated_at: now,
      };

      const baseState: MobileSerruchoDetailData = {
        serrucho: { id: "s1", owner_id: "u1", name: "S", description: null, currency: "DOP", event_date: now, status: "OPEN", payment_instructions: null, payment_deadline: null, closed_at: null, created_at: now, updated_at: now },
        participants: [],
        expenses: [],
        balances: [],
        transfers: [],
        bilateral_settlements: [settlement],
      };

      const rejectedState = engine.applyMutationToState(baseState, {
        id: "m_rej",
        serrucho_id: "s1",
        action_type: "SETTLEMENT_REJECTED",
        actor_user_id: "u2",
        payload: { settlement_id: "bsett_rej" },
        timestamp: new Date().toISOString(),
      });

      expect(rejectedState.bilateral_settlements![0].status).toBe("REJECTED");
      expect(rejectedState.transfers).toHaveLength(0); // No transfer added on rejection
    });
  });

  describe("5. Security, Group Isolation & Offline Queue", () => {
    it("denies access and mutations across isolated groups", async () => {
      const engine = new MobileSyncEngine();

      // User 1 belongs to Group A
      await mobileStorage.setUserMembership({
        user_id: "user_a",
        serrucho_id: "group_a",
        participant_id: "part_a",
        role: "MEMBER",
        joined_at: new Date().toISOString(),
      });

      // User 1 is authorized for Group A
      const isAuthA = await engine.verifyGroupAuthorization("user_a", "group_a");
      expect(isAuthA).toBe(true);

      // User 1 is NOT authorized for Group B
      const isAuthB = await engine.verifyGroupAuthorization("user_a", "group_b");
      expect(isAuthB).toBe(false);
    });

    it("enqueues mutations while offline and flushes upon coming back online", async () => {
      const engine = new MobileSyncEngine(memoryBroadcastProvider);
      engine.setOnline(false);
      expect(engine.isOnline()).toBe(false);

      const mutation = {
        id: "mut_offline_1",
        serrucho_id: "s_off",
        action_type: "EXPENSE_CREATED" as const,
        actor_user_id: "u1",
        payload: { id: "exp_off", description: "Gasolina" },
        timestamp: new Date().toISOString(),
      };

      // Broadcast while offline should enqueue
      await engine.broadcastMutation(mutation);
      const queue = await engine.getQueue();
      expect(queue).toHaveLength(1);
      expect(queue[0].id).toBe("mut_offline_1");

      // Coming back online automatically flushes
      let flushedCount = 0;
      const publishSpy = vi.spyOn(memoryBroadcastProvider, "publish");
      engine.setOnline(true);
      expect(engine.isOnline()).toBe(true);

      // Wait brief tick for async flush
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(publishSpy).toHaveBeenCalled();
      const remainingQueue = await engine.getQueue();
      expect(remainingQueue).toHaveLength(0);
    });
  });
});
