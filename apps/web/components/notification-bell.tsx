"use client";

import * as React from "react";
import { Bell, BellOff, BellRing, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  showLocalNotification,
} from "@/lib/utils/push-notifications";
import { hapticLight, hapticSuccess } from "@/lib/utils/haptics";

interface NotificationBellProps {
  pendingCount?: number;
  serruchoName?: string;
}

/**
 * Notification bell with permission request flow and reminder badge.
 * Mobile synergy: in Expo, maps to expo-notifications Permission request.
 */
export function NotificationBell({ pendingCount = 0, serruchoName }: NotificationBellProps) {
  const [permission, setPermission] = React.useState<NotificationPermission>("default");
  const [showPrompt, setShowPrompt] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    if (isNotificationSupported()) {
      setPermission(getNotificationPermission());
    }
  }, []);

  // Register service worker on mount
  React.useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.info("[SW] Registered:", reg.scope))
        .catch((err) => console.warn("[SW] Registration failed:", err));
    }
  }, []);

  const handleBellClick = () => {
    hapticLight();
    if (!isNotificationSupported()) return;

    if (permission === "default") {
      setShowPrompt(true);
    } else if (permission === "granted" && pendingCount > 0 && serruchoName) {
      // Send a reminder notification immediately
      showLocalNotification(`Serrucho: ${serruchoName}`, {
        body: `${pendingCount} participante${pendingCount > 1 ? "s" : ""} aún no ${pendingCount > 1 ? "han pagado" : "ha pagado"} su parte.`,
        tag: "payment-reminder",
      });
      hapticSuccess();
    }
  };

  const handleAllow = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    setShowPrompt(false);
    if (result === "granted") {
      hapticSuccess();
      showLocalNotification("🪚 Serrucho activado", {
        body: "Te avisaremos cuando haya pagos pendientes.",
      });
    }
  };

  if (!mounted || !isNotificationSupported()) return null;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBellClick}
        className="relative h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
        title={
          permission === "granted"
            ? pendingCount > 0
              ? `${pendingCount} pagos pendientes — clic para enviar recordatorio`
              : "Notificaciones activas"
            : "Activar notificaciones de pago"
        }
      >
        {permission === "denied" ? (
          <BellOff className="h-4 w-4" />
        ) : permission === "granted" ? (
          <BellRing className={`h-4 w-4 ${pendingCount > 0 ? "text-teal-600 dark:text-teal-400" : ""}`} />
        ) : (
          <Bell className="h-4 w-4" />
        )}

        {/* Badge */}
        {permission === "granted" && pendingCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center leading-none ring-2 ring-background">
            {pendingCount > 9 ? "9+" : pendingCount}
          </span>
        )}
      </Button>

      {/* Permission prompt mini-modal */}
      {showPrompt && (
        <div className="absolute top-10 right-0 w-64 rounded-2xl border border-border bg-popover shadow-xl p-4 space-y-3 z-50">
          <div className="flex items-start gap-2.5">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Activar recordatorios de pago</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Te avisaremos cuando algún participante tenga pagos pendientes.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleAllow}
              className="flex-1 gap-1 text-xs font-bold"
            >
              <Check className="h-3 w-3" />
              Activar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPrompt(false)}
              className="flex-1 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Ahora no
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
