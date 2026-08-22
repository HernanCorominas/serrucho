"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import { hapticLight } from "@/lib/utils/haptics";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  enabled?: boolean;
}

const THRESHOLD = 80;

/**
 * Pull-to-Refresh container — mobile gesture support.
 * In Expo React Native: maps to ScrollView + RefreshControl natively.
 */
export function PullToRefresh({ onRefresh, children, enabled = true }: PullToRefreshProps) {
  const [pulling, setPulling] = React.useState(false);
  const [progress, setProgress] = React.useState(0); // 0-1
  const [refreshing, setRefreshing] = React.useState(false);
  const startY = React.useRef<number | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleTouchStart = React.useCallback(
    (e: TouchEvent) => {
      if (!enabled || refreshing) return;
      const scrollTop = containerRef.current?.closest("[data-scroll-root]")?.scrollTop ?? window.scrollY;
      if (scrollTop > 5) return; // Only trigger when at top
      startY.current = e.touches[0].clientY;
    },
    [enabled, refreshing]
  );

  const handleTouchMove = React.useCallback(
    (e: TouchEvent) => {
      if (startY.current === null || !enabled || refreshing) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta < 0) return;

      const pct = Math.min(delta / THRESHOLD, 1);
      setProgress(pct);
      if (pct > 0) {
        setPulling(true);
        if (pct >= 1) hapticLight();
      }
    },
    [enabled, refreshing]
  );

  const handleTouchEnd = React.useCallback(async () => {
    if (!enabled) return;
    if (progress >= 1) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
    startY.current = null;
    setPulling(false);
    setProgress(0);
  }, [enabled, progress, onRefresh]);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: true });
    el.addEventListener("touchend", handleTouchEnd);

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const indicatorOffset = Math.min(progress * THRESHOLD, THRESHOLD);

  return (
    <div ref={containerRef} className="relative min-h-0">
      {/* Pull Indicator */}
      {(pulling || refreshing) && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center z-20 pointer-events-none"
          style={{ transform: `translateY(${indicatorOffset - 40}px)`, transition: refreshing ? "none" : "transform 0.1s" }}
        >
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform ${
              refreshing ? "" : ""
            }`}
            style={{
              opacity: Math.min(progress * 2, 1),
              transform: refreshing ? "scale(1)" : `scale(${0.6 + progress * 0.4})`,
            }}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              style={{ transform: `rotate(${progress * 360}deg)`, transition: refreshing ? "none" : "transform 0.1s" }}
            />
          </div>
        </div>
      )}

      <div
        style={{
          transform: pulling || refreshing ? `translateY(${indicatorOffset}px)` : "translateY(0)",
          transition: pulling ? "none" : "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
