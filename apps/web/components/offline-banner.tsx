"use client";

import * as React from "react";
import { isOnline, subscribeToConnectivity } from "@/lib/store/offline-store";
import { WifiOff, Wifi } from "lucide-react";

/**
 * Offline Banner — appears at top of screen when user loses connectivity.
 * Mobile synergy: in Expo, maps to NetInfo API for same logic.
 */
export function OfflineBanner() {
  const [online, setOnline] = React.useState(true);
  const [justReconnected, setJustReconnected] = React.useState(false);
  const reconnectTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    setOnline(isOnline());

    const unsubscribe = subscribeToConnectivity(
      () => {
        setOnline(true);
        setJustReconnected(true);
        if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
        reconnectTimer.current = setTimeout(() => setJustReconnected(false), 3000);
      },
      () => {
        setOnline(false);
        setJustReconnected(false);
      }
    );

    return () => {
      unsubscribe();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, []);

  if (online && !justReconnected) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 py-2 px-4 text-xs font-bold transition-all duration-500 ${
        online
          ? "bg-emerald-600 text-white"
          : "bg-gray-900 text-white dark:bg-black"
      }`}
    >
      {online ? (
        <>
          <Wifi className="h-3.5 w-3.5" />
          <span>Conexión restaurada — datos sincronizados</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3.5 w-3.5 text-amber-400" />
          <span>Sin conexión — trabajando con datos guardados localmente</span>
        </>
      )}
    </div>
  );
}
