import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  Serrucho,
  Participant,
  ExpenseWithSplits,
  ParticipantFinancials,
  Transfer,
  ActivityEvent,
  SerruchoTier,
} from "@serrucho/core";

const SERRUCHOS_KEY = "@serrucho:list";
const DETAIL_KEY_PREFIX = "@serrucho:detail:";
const RECENTS_KEY = "@serrucho:recents";
const GLOBAL_USER_KEY = "@serrucho:global_user";
const MEMBERSHIP_KEY_PREFIX = "@serrucho:membership:";
const ONBOARDING_KEY = "@serrucho:onboarding_completed";

export type BilateralSettlementStatus =
  | "PENDING_CONFIRMATION"
  | "CODE_PENDING"
  | "CONFIRMED"
  | "SETTLED"
  | "REJECTED";

export interface BilateralSettlement {
  id: string;
  serrucho_id: string;
  debtor_participant_id: string;
  debtor_name: string;
  creditor_participant_id: string;
  creditor_name: string;
  amount_cents: number;
  payment_method: "CASH" | "TRANSFER" | "OTHER";
  notes?: string | null;
  status: BilateralSettlementStatus;
  confirmation_code?: string | null;
  created_at: string;
  updated_at: string;
  settled_at?: string | null;
  rejected_at?: string | null;
}

export interface MobileUser {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  created_at: string;
}

export interface UserMembership {
  user_id: string;
  serrucho_id: string;
  participant_id: string;
  role: "OWNER" | "MEMBER";
  joined_at: string;
}

export interface MobileSerruchoDetailData {
  serrucho: Serrucho;
  participants: Participant[];
  expenses: ExpenseWithSplits[];
  balances: ParticipantFinancials[];
  transfers?: Transfer[];
  activities?: ActivityEvent[];
  tier?: SerruchoTier;
  bilateral_settlements?: BilateralSettlement[];
}

type DetailListener = (data: MobileSerruchoDetailData) => void;
const detailListeners = new Map<string, Set<DetailListener>>();

export const mobileStorage = {
  // Reactive subscription engine for instant UI updates
  subscribeToDetail(id: string, listener: DetailListener): () => void {
    if (!detailListeners.has(id)) {
      detailListeners.set(id, new Set());
    }
    const set = detailListeners.get(id)!;
    set.add(listener);
    return () => {
      set.delete(listener);
      if (set.size === 0) {
        detailListeners.delete(id);
      }
    };
  },

  async saveSerruchos(list: Serrucho[]): Promise<void> {
    try {
      await AsyncStorage.setItem(SERRUCHOS_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn("Error saving serruchos to AsyncStorage", e);
    }
  },

  async getSerruchos(): Promise<Serrucho[]> {
    try {
      const data = await AsyncStorage.getItem(SERRUCHOS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async saveSerruchoDetail(
    id: string,
    data: MobileSerruchoDetailData
  ): Promise<void> {
    try {
      await AsyncStorage.setItem(`${DETAIL_KEY_PREFIX}${id}`, JSON.stringify(data));
      // Notify active listeners synchronously for instant UI reactivity
      const set = detailListeners.get(id);
      if (set) {
        set.forEach((listener) => {
          try {
            listener(data);
          } catch (e) {
            console.warn("Error in detail listener", e);
          }
        });
      }
    } catch (e) {
      console.warn("Error saving detail to AsyncStorage", e);
    }
  },

  async getSerruchoDetail(id: string): Promise<MobileSerruchoDetailData | null> {
    try {
      const data = await AsyncStorage.getItem(`${DETAIL_KEY_PREFIX}${id}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async addRecent(item: { id: string; name: string }): Promise<void> {
    try {
      const existing = await this.getRecents();
      const filtered = existing.filter((r) => r.id !== item.id);
      const updated = [item, ...filtered].slice(0, 8);
      await AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn("Error saving recent to AsyncStorage", e);
    }
  },

  async getRecents(): Promise<{ id: string; name: string }[]> {
    try {
      const data = await AsyncStorage.getItem(RECENTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  // Identity: Per-serrucho participant claiming
  async getMyIdentity(serruchoId: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(`@serrucho:my_id:${serruchoId}`);
    } catch {
      return null;
    }
  },

  async setMyIdentity(serruchoId: string, participantId: string | null): Promise<void> {
    try {
      if (participantId) {
        await AsyncStorage.setItem(`@serrucho:my_id:${serruchoId}`, participantId);
        // Also link to global user membership if available
        const globalUser = await this.getGlobalUser();
        await this.setUserMembership({
          user_id: globalUser.id,
          serrucho_id: serruchoId,
          participant_id: participantId,
          role: "MEMBER",
          joined_at: new Date().toISOString(),
        });
      } else {
        await AsyncStorage.removeItem(`@serrucho:my_id:${serruchoId}`);
      }
    } catch (e) {
      console.warn("Error saving identity to AsyncStorage", e);
    }
  },

  // Global Mobile User Identity
  async getGlobalUser(): Promise<MobileUser> {
    try {
      const data = await AsyncStorage.getItem(GLOBAL_USER_KEY);
      if (data) {
        return JSON.parse(data);
      }
      // Create initial local guest mobile user
      const newUser: MobileUser = {
        id: `u_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: "Yo",
        phone: null,
        email: null,
        created_at: new Date().toISOString(),
      };
      await AsyncStorage.setItem(GLOBAL_USER_KEY, JSON.stringify(newUser));
      return newUser;
    } catch {
      return {
        id: "u_fallback",
        name: "Yo",
        phone: null,
        email: null,
        created_at: new Date().toISOString(),
      };
    }
  },

  async setGlobalUser(user: MobileUser): Promise<void> {
    try {
      await AsyncStorage.setItem(GLOBAL_USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn("Error saving global user", e);
    }
  },

  // Group isolation & User Membership mapping
  async getUserMembership(userId: string, serruchoId: string): Promise<UserMembership | null> {
    try {
      const data = await AsyncStorage.getItem(`${MEMBERSHIP_KEY_PREFIX}${userId}:${serruchoId}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async setUserMembership(membership: UserMembership): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${MEMBERSHIP_KEY_PREFIX}${membership.user_id}:${membership.serrucho_id}`,
        JSON.stringify(membership)
      );
    } catch (e) {
      console.warn("Error saving user membership", e);
    }
  },

  // Onboarding persistence
  async hasCompletedOnboarding(): Promise<boolean> {
    try {
      const val = await AsyncStorage.getItem(ONBOARDING_KEY);
      return val === "true";
    } catch {
      return false;
    }
  },

  async setOnboardingCompleted(): Promise<void> {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    } catch (e) {
      console.warn("Error setting onboarding completed", e);
    }
  },

  async deleteSerrucho(id: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${DETAIL_KEY_PREFIX}${id}`);
      await AsyncStorage.removeItem(`@serrucho:my_id:${id}`);
      const user = await this.getGlobalUser();
      await AsyncStorage.removeItem(`${MEMBERSHIP_KEY_PREFIX}${user.id}:${id}`);
      const list = await this.getSerruchos();
      const updatedList = list.filter((s) => s.id !== id);
      await this.saveSerruchos(updatedList);
      const recents = await this.getRecents();
      const updatedRecents = recents.filter((r) => r.id !== id);
      await AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(updatedRecents));
    } catch (e) {
      console.warn("Error deleting serrucho from AsyncStorage", e);
    }
  },
};
