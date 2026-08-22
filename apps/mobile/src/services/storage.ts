import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Serrucho, Participant, ExpenseWithSplits, ParticipantFinancials } from "@serrucho/core";

const SERRUCHOS_KEY = "@serrucho:list";
const DETAIL_KEY_PREFIX = "@serrucho:detail:";
const RECENTS_KEY = "@serrucho:recents";

export const mobileStorage = {
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
    data: {
      serrucho: Serrucho;
      participants: Participant[];
      expenses: ExpenseWithSplits[];
      balances: ParticipantFinancials[];
    }
  ): Promise<void> {
    try {
      await AsyncStorage.setItem(`${DETAIL_KEY_PREFIX}${id}`, JSON.stringify(data));
    } catch (e) {
      console.warn("Error saving detail to AsyncStorage", e);
    }
  },

  async getSerruchoDetail(id: string) {
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
};
