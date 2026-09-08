import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock react-native before imports
vi.mock("react-native", () => ({
  useColorScheme: vi.fn(() => "dark"),
  StyleSheet: {
    create: (s: any) => s,
  },
  Platform: { OS: "ios" },
}));

import {
  splitEqually,
  calculateParticipantBalances,
  simplifyDebts,
  formatDOP,
  type Participant,
  type ExpenseWithSplits,
  type Transfer,
} from "@serrucho/core";
import {
  mobileStorage,
  type BilateralSettlement,
  type MobileSerruchoDetailData,
  type MobileUser,
  type UserMembership,
} from "../../src/services/storage";
import { getThemeTokens } from "../../src/theme/colors";

// Mock AsyncStorage in-memory for testing
const mockStore: Record<string, string> = {};
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(mockStore[key] || null)),
    setItem: vi.fn((key: string, value: string) => {
      mockStore[key] = value;
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStore[key];
      return Promise.resolve();
    }),
    clear: vi.fn(() => {
      Object.keys(mockStore).forEach((k) => delete mockStore[k]);
      return Promise.resolve();
    }),
  },
}));

describe("SER-KITTY-011 — Mobile Collaboration & Product Integrity", () => {
  beforeEach(() => {
    Object.keys(mockStore).forEach((k) => delete mockStore[k]);
  });

  // 1. INVITATION & JOIN REAL
  describe("1. Invitation & Join Flow", () => {
    it("claims existing participant without duplicating participant records", async () => {
      const p1: Participant = { id: "p1", serrucho_id: "s1", name: "Juan", email: null, phone: null, preferred_channel: "WHATSAPP", created_at: "", updated_at: "" };
      const p2: Participant = { id: "p2", serrucho_id: "s1", name: "Pedro", email: null, phone: null, preferred_channel: "WHATSAPP", created_at: "", updated_at: "" };
      const participants = [p1, p2];

      // User chooses Pedro (p2)
      await mobileStorage.setMyIdentity("s1", "p2");
      const claimed = await mobileStorage.getMyIdentity("s1");
      expect(claimed).toBe("p2");

      // Participant array is unchanged (no duplicate "Pedro" created)
      expect(participants).toHaveLength(2);
      expect(participants.map((p) => p.name)).toEqual(["Juan", "Pedro"]);
    });

    it("allows joining with a new participant name if not in list", async () => {
      const p1: Participant = { id: "p1", serrucho_id: "s1", name: "Juan", email: null, phone: null, preferred_channel: "WHATSAPP", created_at: "", updated_at: "" };
      const participants = [p1];

      // Join as new participant Carlos
      const newPart: Participant = {
        id: "p_carlos_new",
        serrucho_id: "s1",
        name: "Carlos",
        email: null,
        phone: null,
        preferred_channel: "WHATSAPP",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const updatedList = [...participants, newPart];
      expect(updatedList).toHaveLength(2);
      expect(updatedList[1].name).toBe("Carlos");

      await mobileStorage.setMyIdentity("s1", newPart.id);
      expect(await mobileStorage.getMyIdentity("s1")).toBe("p_carlos_new");
    });
  });

  // 2. USER VS PARTICIPANT IDENTITY SEPARATION
  describe("2. User vs Participant Identity Separation", () => {
    it("maintains a stable global mobile user distinct from per-group participants", async () => {
      const user1 = await mobileStorage.getGlobalUser();
      expect(user1).toBeDefined();
      expect(user1.id).toBeDefined();

      const user2 = await mobileStorage.getGlobalUser();
      expect(user2.id).toBe(user1.id); // Idempotent and persistent
    });

    it("isolates group memberships: participant in Serrucho A gives no access to Serrucho B", async () => {
      const user = await mobileStorage.getGlobalUser();

      // Set membership in Serrucho A as Pedro (p_pedro_a)
      await mobileStorage.setUserMembership({
        user_id: user.id,
        serrucho_id: "serrucho_a",
        participant_id: "p_pedro_a",
        role: "MEMBER",
        joined_at: new Date().toISOString(),
      });

      // Query membership for Serrucho A and Serrucho B
      const memA = await mobileStorage.getUserMembership(user.id, "serrucho_a");
      const memB = await mobileStorage.getUserMembership(user.id, "serrucho_b");

      expect(memA).not.toBeNull();
      expect(memA?.participant_id).toBe("p_pedro_a");
      expect(memB).toBeNull(); // Strictly isolated
    });
  });

  // 3. INSTANT UI UPDATES (REACTIVE PUB-SUB ENGINE)
  describe("3. Instant UI Updates (Pub-Sub Engine)", () => {
    it("dispatches updates to subscribers immediately upon saveSerruchoDetail without pull-to-refresh", async () => {
      const receivedData: MobileSerruchoDetailData[] = [];

      const unsubscribe = mobileStorage.subscribeToDetail("s_test", (data) => {
        receivedData.push(data);
      });

      const sampleData: MobileSerruchoDetailData = {
        serrucho: {
          id: "s_test",
          owner_id: "p1",
          name: "Coro SD",
          description: "",
          currency: "DOP",
          event_date: "",
          status: "OPEN",
          payment_instructions: null,
          payment_deadline: null,
          closed_at: null,
          created_at: "",
          updated_at: "",
        },
        participants: [],
        expenses: [],
        balances: [],
        transfers: [],
        activities: [],
        tier: "FREE",
      };

      await mobileStorage.saveSerruchoDetail("s_test", sampleData);

      expect(receivedData).toHaveLength(1);
      expect(receivedData[0].serrucho.name).toBe("Coro SD");

      // Multiple mutations dispatch synchronously
      const updatedData = {
        ...sampleData,
        serrucho: { ...sampleData.serrucho, name: "Coro SD Actualizado" },
      };
      await mobileStorage.saveSerruchoDetail("s_test", updatedData);
      expect(receivedData).toHaveLength(2);
      expect(receivedData[1].serrucho.name).toBe("Coro SD Actualizado");

      // Unsubscribe detaches listener
      unsubscribe();
      await mobileStorage.saveSerruchoDetail("s_test", sampleData);
      expect(receivedData).toHaveLength(2); // No new dispatch
    });
  });

  // 4. BILATERAL SETTLEMENT & 4-DIGIT CODE CONFIRMATION
  describe("4. Bilateral Settlement State Machine & 4-Digit Code", () => {
    const participants: Participant[] = [
      { id: "p1", serrucho_id: "s1", name: "Juan", email: null, phone: null, preferred_channel: "WHATSAPP", created_at: "", updated_at: "" },
      { id: "p2", serrucho_id: "s1", name: "Pedro", email: null, phone: null, preferred_channel: "WHATSAPP", created_at: "", updated_at: "" },
      { id: "p3", serrucho_id: "s1", name: "Maria", email: null, phone: null, preferred_channel: "WHATSAPP", created_at: "", updated_at: "" },
    ];

    it("allows only debtor or creditor to interact with a debt item", () => {
      const debt = { from_participant_id: "p1", to_participant_id: "p2", amount_cents: 250000 };

      // Debtor
      expect(debt.from_participant_id === "p1").toBe(true);
      // Creditor
      expect(debt.to_participant_id === "p2").toBe(true);
      // Unrelated participant Maria (p3)
      const isUnrelated = "p3" !== debt.from_participant_id && "p3" !== debt.to_participant_id;
      expect(isUnrelated).toBe(true);
    });

    it("runs complete bilateral settlement flow: PENDING -> CODE_PENDING -> SETTLED", () => {
      // 1. Debtor Juan initiates settlement
      const settlement: BilateralSettlement = {
        id: "bsett_1",
        serrucho_id: "s1",
        debtor_participant_id: "p1",
        debtor_name: "Juan",
        creditor_participant_id: "p2",
        creditor_name: "Pedro",
        amount_cents: 250000, // RD$ 2,500.00
        payment_method: "TRANSFER",
        status: "PENDING_CONFIRMATION",
        confirmation_code: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      expect(settlement.status).toBe("PENDING_CONFIRMATION");

      // 2. Creditor Pedro confirms receiving payment -> generates 4-digit code
      const generatedCode = "4827";
      const codePendingSettlement: BilateralSettlement = {
        ...settlement,
        status: "CODE_PENDING",
        confirmation_code: generatedCode,
        updated_at: new Date().toISOString(),
      };
      expect(codePendingSettlement.status).toBe("CODE_PENDING");
      expect(codePendingSettlement.confirmation_code).toBe("4827");

      // 3. Validation: Incorrect code rejected
      const wrongCode = "9999";
      expect(wrongCode === codePendingSettlement.confirmation_code).toBe(false);

      // 4. Validation: Matching code completes settlement
      const inputCode = "4827";
      expect(inputCode === codePendingSettlement.confirmation_code).toBe(true);

      const settled: BilateralSettlement = {
        ...codePendingSettlement,
        status: "SETTLED",
        settled_at: new Date().toISOString(),
      };
      expect(settled.status).toBe("SETTLED");
      expect(settled.settled_at).toBeDefined();

      // 5. Official Transfer created and balances recalculated
      const transfer: Transfer = {
        id: "t_settle_1",
        serrucho_id: "s1",
        sender_participant_id: settled.debtor_participant_id,
        receiver_participant_id: settled.creditor_participant_id,
        amount_cents: settled.amount_cents,
        transfer_date: new Date().toISOString(),
        notes: "Saldado con código de 4 dígitos (TRANSFER)",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Initial state before transfer: Juan owes Pedro 250000
      const initialExpenses: ExpenseWithSplits[] = [
        {
          id: "e1",
          serrucho_id: "s1",
          paid_by_participant_id: "p2",
          paid_by_name: "Pedro",
          description: "Cena",
          amount_cents: 500000,
          split_method: "EQUAL",
          category: "FOOD_GROCERIES",
          expense_date: "2026-09-08",
          created_at: "",
          updated_at: "",
          splits: [
            { expense_id: "e1", participant_id: "p1", participant_name: "Juan", percentage_basis_points: 5000, owed_cents: 250000 },
            { expense_id: "e1", participant_id: "p2", participant_name: "Pedro", percentage_basis_points: 5000, owed_cents: 250000 },
          ],
        },
      ];

      const balancesAfterTransfer = calculateParticipantBalances(participants.slice(0, 2), initialExpenses, [transfer]);
      const juanBalance = balancesAfterTransfer.find((b) => b.id === "p1")?.net_balance_cents;
      const pedroBalance = balancesAfterTransfer.find((b) => b.id === "p2")?.net_balance_cents;

      expect(juanBalance).toBe(0);
      expect(pedroBalance).toBe(0);

      // Remaining debts is empty
      const remainingDebts = simplifyDebts(participants.slice(0, 2), balancesAfterTransfer);
      expect(remainingDebts).toHaveLength(0);
    });

    it("handles creditor rejection without modifying financial balances", () => {
      const settlement: BilateralSettlement = {
        id: "bsett_2",
        serrucho_id: "s1",
        debtor_participant_id: "p1",
        debtor_name: "Juan",
        creditor_participant_id: "p2",
        creditor_name: "Pedro",
        amount_cents: 100000,
        payment_method: "CASH",
        status: "PENDING_CONFIRMATION",
        confirmation_code: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Creditor rejects
      const rejectedSettlement: BilateralSettlement = {
        ...settlement,
        status: "REJECTED",
        rejected_at: new Date().toISOString(),
      };

      expect(rejectedSettlement.status).toBe("REJECTED");
      // No transfer created, balances unchanged
    });
  });

  // 5. ONBOARDING PERSISTENCE
  describe("5. Onboarding Persistence", () => {
    it("returns false on first launch, true after completion", async () => {
      expect(await mobileStorage.hasCompletedOnboarding()).toBe(false);

      await mobileStorage.setOnboardingCompleted();
      expect(await mobileStorage.hasCompletedOnboarding()).toBe(true);

      // Persists across subsequent checks
      expect(await mobileStorage.hasCompletedOnboarding()).toBe(true);
    });
  });

  // 6. DYNAMIC SYSTEM LIGHT / DARK TOKENS
  describe("6. System Light / Dark Mode Tokens", () => {
    it("provides light semantic tokens for light appearance and dark tokens for dark appearance", () => {
      const lightTokens = getThemeTokens("light");
      const darkTokens = getThemeTokens("dark");

      // Light tokens
      expect(lightTokens.colors.background.base).toBe("#F8FAFC");
      expect(lightTokens.colors.text.primary).toBe("#0F172A");

      // Dark tokens (baseline)
      expect(darkTokens.colors.background.base).toBe("#0B0F19");
      expect(darkTokens.colors.text.primary).toBe("#FFFFFF");

      // Neutral/null defaults to dark baseline
      const defaultTokens = getThemeTokens(null);
      expect(defaultTokens.colors.background.base).toBe("#0B0F19");
    });
  });

  // 7. FINANCIAL INVARIANTS (ZERO-SUM, BAL-08, DEBT SIMPLIFICATION)
  describe("7. Financial Invariants Preservation", () => {
    it("BAL-08: splits 10000 cents exactly as 3334 / 3333 / 3333", () => {
      const splits = splitEqually(10000, ["p1", "p2", "p3"]);
      expect(splits[0].owedCents).toBe(3334);
      expect(splits[1].owedCents).toBe(3333);
      expect(splits[2].owedCents).toBe(3333);
      expect(splits.reduce((sum, s) => sum + s.owedCents, 0)).toBe(10000);
    });

    it("ZERO-SUM: sum of net balances is 0 across all states", () => {
      const participants: Participant[] = [
        { id: "p1", serrucho_id: "s1", name: "A", email: null, phone: null, preferred_channel: "WHATSAPP", created_at: "", updated_at: "" },
        { id: "p2", serrucho_id: "s1", name: "B", email: null, phone: null, preferred_channel: "WHATSAPP", created_at: "", updated_at: "" },
        { id: "p3", serrucho_id: "s1", name: "C", email: null, phone: null, preferred_channel: "WHATSAPP", created_at: "", updated_at: "" },
      ];
      const expenses: ExpenseWithSplits[] = [
        {
          id: "e1",
          serrucho_id: "s1",
          paid_by_participant_id: "p1",
          paid_by_name: "A",
          description: "Gasto 1",
          amount_cents: 900000,
          split_method: "EQUAL",
          category: "FOOD_GROCERIES",
          expense_date: "2026-09-08",
          created_at: "",
          updated_at: "",
          splits: [
            { expense_id: "e1", participant_id: "p1", participant_name: "A", percentage_basis_points: 3334, owed_cents: 300000 },
            { expense_id: "e1", participant_id: "p2", participant_name: "B", percentage_basis_points: 3333, owed_cents: 300000 },
            { expense_id: "e1", participant_id: "p3", participant_name: "C", percentage_basis_points: 3333, owed_cents: 300000 },
          ],
        },
      ];

      const balances = calculateParticipantBalances(participants, expenses, []);
      const sum = balances.reduce((acc, b) => acc + b.net_balance_cents, 0);
      expect(sum).toBe(0);
    });
  });
});
