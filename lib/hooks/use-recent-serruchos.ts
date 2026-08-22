"use client";

import * as React from "react";

export interface RecentSerruchoItem {
  id: string;
  name: string;
  description?: string | null;
  status: "OPEN" | "CLOSED";
  visitedAt: string;
}

const STORAGE_KEY = "serrucho_recent_items_v1";

export function useRecentSerruchos() {
  const [recents, setRecents] = React.useState<RecentSerruchoItem[]>([]);

  // Load on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecents(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Could not read recent serruchos from localStorage", e);
    }
  }, []);

  const saveRecent = React.useCallback(
    (item: Omit<RecentSerruchoItem, "visitedAt">) => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        let list: RecentSerruchoItem[] = stored ? JSON.parse(stored) : [];

        // Remove if exists and add to beginning
        list = list.filter((s) => s.id !== item.id);
        list.unshift({
          ...item,
          visitedAt: new Date().toISOString(),
        });

        // Keep top 10
        list = list.slice(0, 10);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        setRecents(list);
      } catch (e) {
        console.warn("Could not save recent serrucho to localStorage", e);
      }
    },
    []
  );

  const removeRecent = React.useCallback((id: string) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      let list: RecentSerruchoItem[] = JSON.parse(stored);
      list = list.filter((s) => s.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      setRecents(list);
    } catch (e) {
      console.warn("Could not remove recent serrucho", e);
    }
  }, []);

  const clearRecents = React.useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setRecents([]);
    } catch (e) {
      console.warn("Could not clear recent serruchos", e);
    }
  }, []);

  return {
    recents,
    saveRecent,
    removeRecent,
    clearRecents,
  };
}
