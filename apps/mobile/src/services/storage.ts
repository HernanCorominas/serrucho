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
      transfers?: import("@serrucho/core").Transfer[];
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
      } else {
        await AsyncStorage.removeItem(`@serrucho:my_id:${serruchoId}`);
      }
    } catch (e) {
      console.warn("Error saving identity to AsyncStorage", e);
    }
  },

  async deleteSerrucho(id: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${DETAIL_KEY_PREFIX}${id}`);
      await AsyncStorage.removeItem(`@serrucho:my_id:${id}`);
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
