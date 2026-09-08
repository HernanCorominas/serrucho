import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { mobileStorage } from "../services/storage";
import { triggerHaptic } from "../utils/haptics";

export interface RecentSerrucho {
  id: string;
  name: string;
}

export interface GlobalNavigationContextType {
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  activeSerruchoId: string | null;
  setActiveSerruchoId: (id: string | null) => void;
  activeSerruchoName: string | null;
  setActiveSerruchoName: (name: string | null) => void;
  recents: RecentSerrucho[];
  refreshRecents: () => Promise<void>;
  registerRecent: (id: string, name: string) => Promise<void>;
}

const GlobalNavigationContext = createContext<GlobalNavigationContextType | undefined>(undefined);

export const GlobalNavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeSerruchoId, setActiveSerruchoIdState] = useState<string | null>(null);
  const [activeSerruchoName, setActiveSerruchoNameState] = useState<string | null>(null);
  const [recents, setRecents] = useState<RecentSerrucho[]>([]);

  const refreshRecents = useCallback(async () => {
    try {
      const stored = await mobileStorage.getRecents();
      if (stored && stored.length > 0) {
        setRecents((prev) => {
          const isSame =
            prev.length === stored.length &&
            prev.every((item, idx) => item.id === stored[idx]?.id && item.name === stored[idx]?.name);
          return isSame ? prev : stored;
        });
      } else {
        // Fallback: populate from known serruchos list
        const all = await mobileStorage.getSerruchos();
        const formatted = all.slice(0, 8).map((s) => ({ id: s.id, name: s.name }));
        setRecents((prev) => {
          const isSame =
            prev.length === formatted.length &&
            prev.every((item, idx) => item.id === formatted[idx]?.id && item.name === formatted[idx]?.name);
          return isSame ? prev : formatted;
        });
      }
    } catch {
      setRecents([]);
    }
  }, []);

  useEffect(() => {
    refreshRecents();
  }, [refreshRecents]);

  const openDrawer = useCallback(() => {
    triggerHaptic("light");
    setIsDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen((prev) => {
      triggerHaptic("light");
      return !prev;
    });
  }, []);

  const setActiveSerruchoId = useCallback((id: string | null) => {
    setActiveSerruchoIdState((prev) => (prev === id ? prev : id));
  }, []);

  const setActiveSerruchoName = useCallback((name: string | null) => {
    setActiveSerruchoNameState((prev) => (prev === name ? prev : name));
  }, []);

  const registerRecent = useCallback(
    async (id: string, name: string) => {
      await mobileStorage.addRecent({ id, name });
      await refreshRecents();
    },
    [refreshRecents]
  );

  const contextValue = React.useMemo<GlobalNavigationContextType>(
    () => ({
      isDrawerOpen,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      activeSerruchoId,
      setActiveSerruchoId,
      activeSerruchoName,
      setActiveSerruchoName,
      recents,
      refreshRecents,
      registerRecent,
    }),
    [
      isDrawerOpen,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      activeSerruchoId,
      setActiveSerruchoId,
      activeSerruchoName,
      setActiveSerruchoName,
      recents,
      refreshRecents,
      registerRecent,
    ]
  );

  return (
    <GlobalNavigationContext.Provider value={contextValue}>
      {children}
    </GlobalNavigationContext.Provider>
  );
};

export const useGlobalNavigation = (): GlobalNavigationContextType => {
  const context = useContext(GlobalNavigationContext);
  if (!context) {
    throw new Error("useGlobalNavigation must be used within a GlobalNavigationProvider");
  }
  return context;
};
