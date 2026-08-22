import { useEffect } from "react";
import { getSupabaseClient } from "@serrucho/supabase";

/**
 * Subscribes to realtime updates on serrucho expenses, participants and status.
 * Automatically triggers callback on any remote database mutation ($0 Supabase Realtime).
 */
export function useSerruchoRealtime(serruchoId: string, onUpdate: () => void) {
  useEffect(() => {
    if (!serruchoId) return;

    try {
      const supabase = getSupabaseClient();
      const channel = supabase
        .channel(`serrucho-${serruchoId}`)
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
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "serruchos",
            filter: `id=eq.${serruchoId}`,
          },
          () => {
            onUpdate();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch {
      // Graceful fallback if realtime is unavailable or offline
    }
  }, [serruchoId, onUpdate]);
}
