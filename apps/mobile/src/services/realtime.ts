import { useEffect } from "react";
import { mobileSupabase } from "./supabase";

/**
 * Mobile Realtime listener for live updates on expenses and participants.
 */
export function useMobileRealtime(serruchoId: string, onUpdate: () => void) {
  useEffect(() => {
    if (!serruchoId) return;

    try {
      const channel = mobileSupabase
        .channel(`mobile-serrucho-${serruchoId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "expenses",
            filter: `serrucho_id=eq.${serruchoId}`,
          },
          () => {
            onUpdate();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "participants",
            filter: `serrucho_id=eq.${serruchoId}`,
          },
          () => {
            onUpdate();
          }
        )
        .subscribe();

      return () => {
        mobileSupabase.removeChannel(channel);
      };
    } catch {
      // Graceful offline fallback
    }
  }, [serruchoId, onUpdate]);
}
