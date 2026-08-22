"use client";

import * as React from "react";
import { X } from "lucide-react";

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  snapPoints?: number[]; // e.g. [0.4, 0.8, 0.95] as fraction of viewport height
}

/**
 * Mobile-native Bottom Sheet with gesture-driven swipe-to-dismiss.
 * Replaces centered Dialog on mobile viewports.
 * Mobile synergy: in Expo, maps to @gorhom/bottom-sheet directly.
 */
export function BottomSheet({
  open,
  onOpenChange,
  children,
  title,
  description,
  snapPoints = [0.85],
}: BottomSheetProps) {
  const sheetRef = React.useRef<HTMLDivElement>(null);
  const [currentSnap] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const dragStart = React.useRef<number | null>(null);
  const [dragOffset, setDragOffset] = React.useState(0);
  const [visible, setVisible] = React.useState(false);

  const maxHeight = snapPoints[currentSnap] ?? 0.85;
  const sheetHeightVH = maxHeight * 100;

  React.useEffect(() => {
    if (open) {
      setVisible(true);
      setDragOffset(0);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          sheetRef.current?.classList.add("translate-y-0");
          sheetRef.current?.classList.remove("translate-y-full");
        });
      });
    } else {
      sheetRef.current?.classList.add("translate-y-full");
      sheetRef.current?.classList.remove("translate-y-0");
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleBackdropClick = () => {
    onOpenChange(false);
  };

  const handleHandleTouchStart = (e: React.TouchEvent) => {
    dragStart.current = e.touches[0].clientY;
    setDragging(true);
  };

  const handleHandleTouchMove = (e: React.TouchEvent) => {
    if (dragStart.current === null) return;
    const delta = e.touches[0].clientY - dragStart.current;
    if (delta > 0) setDragOffset(delta);
  };

  const handleHandleTouchEnd = () => {
    setDragging(false);
    if (dragOffset > 100) {
      onOpenChange(false);
    }
    setDragOffset(0);
    dragStart.current = null;
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 backdrop-blur-sm ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleBackdropClick}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl shadow-2xl translate-y-full transition-transform duration-300 ease-out flex flex-col"
        style={{
          maxHeight: `${sheetHeightVH}vh`,
          transform: dragOffset > 0
            ? `translateY(${dragging ? dragOffset : 0}px)`
            : undefined,
          transition: dragging ? "none" : undefined,
        }}
      >
        {/* Drag Handle */}
        <div
          className="flex-shrink-0 pt-3 pb-1 touch-pan-y cursor-grab active:cursor-grabbing"
          onTouchStart={handleHandleTouchStart}
          onTouchMove={handleHandleTouchMove}
          onTouchEnd={handleHandleTouchEnd}
        >
          <div className="mx-auto w-10 h-1 rounded-full bg-muted-foreground/25" />
        </div>

        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between px-5 py-2 flex-shrink-0 border-b border-border/60">
            <div>
              {title && (
                <h3 className="font-bold text-base text-foreground leading-tight">{title}</h3>
              )}
              {description && (
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
              )}
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Content — scrollable */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 pb-[env(safe-area-inset-bottom,16px)]">
          {children}
        </div>
      </div>
    </div>
  );
}
