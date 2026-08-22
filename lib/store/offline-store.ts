/**
 * Serrucho Offline Store — IndexedDB via `idb`
 * Provides client-side caching of serruchos data for offline use.
 * Mobile synergy: maps to AsyncStorage/SQLite in Expo React Native.
 */

import { openDB, DBSchema, IDBPDatabase } from "idb";
import type { Serrucho, Participant, ExpenseWithSplits, ParticipantFinancials } from "@/lib/types/domain";

const DB_NAME = "serrucho_offline";
const DB_VERSION = 1;

export interface CachedSerrucho extends Serrucho {
  cachedAt: number;
}

export interface OfflineSerruchoPayload {
  serrucho: CachedSerrucho;
  participants: Participant[];
  expenses: ExpenseWithSplits[];
  balances: ParticipantFinancials[];
}

interface SerruchoDB extends DBSchema {
  serruchos: {
    key: string;
    value: CachedSerrucho;
    indexes: { "by-status": string };
  };
  serrucho_detail: {
    key: string;
    value: OfflineSerruchoPayload;
  };
  pending_actions: {
    key: number;
    value: {
      id?: number;
      action: "ADD_EXPENSE" | "ADD_PARTICIPANT" | "DELETE_EXPENSE" | "DELETE_PARTICIPANT";
      payload: Record<string, unknown>;
      serruchoId: string;
      createdAt: number;
    };
    autoIncrement: true;
  };
}

let dbPromise: Promise<IDBPDatabase<SerruchoDB>> | null = null;

function getDB(): Promise<IDBPDatabase<SerruchoDB>> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB not available on server"));
  }

  if (!dbPromise) {
    dbPromise = openDB<SerruchoDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("serruchos")) {
          const serruchoStore = db.createObjectStore("serruchos", { keyPath: "id" });
          serruchoStore.createIndex("by-status", "status");
        }
        if (!db.objectStoreNames.contains("serrucho_detail")) {
          db.createObjectStore("serrucho_detail", { keyPath: "serrucho.id" });
        }
        if (!db.objectStoreNames.contains("pending_actions")) {
          db.createObjectStore("pending_actions", { keyPath: "id", autoIncrement: true });
        }
      },
    });
  }

  return dbPromise;
}

// ==================== Serrucho List Cache ====================

export async function cacheSerruchoList(serruchos: Serrucho[]): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction("serruchos", "readwrite");
    const now = Date.now();
    await Promise.all([
      ...serruchos.map((s) => tx.store.put({ ...s, cachedAt: now })),
      tx.done,
    ]);
  } catch (err) {
    console.warn("[OfflineStore] Failed to cache serrucho list:", err);
  }
}

export async function getCachedSerruchoList(): Promise<CachedSerrucho[]> {
  try {
    const db = await getDB();
    return await db.getAll("serruchos");
  } catch {
    return [];
  }
}

// ==================== Serrucho Detail Cache ====================

export async function cacheSerruchoDetail(payload: OfflineSerruchoPayload): Promise<void> {
  try {
    const db = await getDB();
    await db.put("serrucho_detail", {
      ...payload,
      serrucho: { ...payload.serrucho, cachedAt: Date.now() },
    });
  } catch (err) {
    console.warn("[OfflineStore] Failed to cache serrucho detail:", err);
  }
}

export async function getCachedSerruchoDetail(id: string): Promise<OfflineSerruchoPayload | null> {
  try {
    const db = await getDB();
    return (await db.get("serrucho_detail", id)) ?? null;
  } catch {
    return null;
  }
}

// ==================== Pending Actions Queue ====================

export async function queuePendingAction(
  action: SerruchoDB["pending_actions"]["value"]["action"],
  serruchoId: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const db = await getDB();
    await db.add("pending_actions", {
      action,
      serruchoId,
      payload,
      createdAt: Date.now(),
    });
    console.info(`[OfflineStore] Queued offline action: ${action}`);
  } catch (err) {
    console.warn("[OfflineStore] Failed to queue pending action:", err);
  }
}

export async function getPendingActions(): Promise<SerruchoDB["pending_actions"]["value"][]> {
  try {
    const db = await getDB();
    return await db.getAll("pending_actions");
  } catch {
    return [];
  }
}

export async function clearPendingAction(id: number): Promise<void> {
  try {
    const db = await getDB();
    await db.delete("pending_actions", id);
  } catch (err) {
    console.warn("[OfflineStore] Failed to clear pending action:", err);
  }
}

// ==================== Connectivity Utilities ====================

export function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

export function subscribeToConnectivity(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
  return () => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
  };
}
