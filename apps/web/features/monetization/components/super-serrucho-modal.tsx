"use client";

import * as React from "react";
import {
  Sparkles,
  Zap,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  RotateCcw,
  Loader2,
  Users,
  Receipt,
  Globe2,
  FileSpreadsheet,
} from "lucide-react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { formatDOP } from "@/lib/finance/math";
import { useAuth } from "@/lib/hooks/use-auth";
import { hapticLight, hapticSuccess } from "@/lib/utils/haptics";

interface SuperSerruchoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serruchoId: string;
  serruchoName: string;
  isSuperAlready?: boolean;
  onUnlocked?: () => void;
}

export function SuperSerruchoModal({
  open,
  onOpenChange,
  serruchoId,
  serruchoName,
  isSuperAlready = false,
  onUnlocked,
}: SuperSerruchoModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [tab, setTab] = React.useState<"upgrade" | "restore">("upgrade");
  const [buyerEmail, setBuyerEmail] = React.useState(user?.email || "");
  const [restoreQuery, setRestoreQuery] = React.useState("");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(isSuperAlready);

  React.useEffect(() => {
    if (user?.email && !buyerEmail) {
      setBuyerEmail(user.email);
    }
  }, [user, buyerEmail]);

  React.useEffect(() => {
    setIsSuccess(isSuperAlready);
  }, [isSuperAlready]);

  const handleUpgrade = async () => {
    try {
      hapticLight();
      setIsProcessing(true);

      // 1. Initiate Checkout
      const checkoutRes = await fetch(`/api/serruchos/${serruchoId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerUserId: user?.id,
          buyerEmail: buyerEmail || undefined,
          provider: "MOCK_RD",
          planId: "super_serrucho_pass",
        }),
      });

      if (!checkoutRes.ok) {
        throw new Error("No se pudo iniciar la orden de pago");
      }

      const checkoutData = await checkoutRes.json();
      const orderId = checkoutData.transaction.order_id;

      // 2. Process mock confirmation webhook
      const webhookRes = await fetch(`/api/payments/webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          status: "COMPLETED",
          providerTxId: `mock-tx-${Date.now()}`,
          metadata: { note: "Super Serrucho unlocked via web checkout" },
        }),
      });

      if (!webhookRes.ok) {
        throw new Error("Error procesando la confirmación del pago");
      }

      hapticSuccess();
      setIsSuccess(true);
      toast({
        type: "success",
        title: "¡Super Serrucho Activado! ⚡",
        message: `Este Serrucho ha sido mejorado para todos los participantes. Código de orden: ${orderId}`,
      });

      onUnlocked?.();
    } catch (err: any) {
      toast({
        type: "error",
        title: "Error al activar",
        message: err.message || "Ocurrió un error al procesar el pago.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreQuery.trim()) {
      toast({
        type: "error",
        title: "Dato requerido",
        message: "Ingresa el número de orden o email de compra.",
      });
      return;
    }

    try {
      hapticLight();
      setIsProcessing(true);

      const res = await fetch(`/api/serruchos/${serruchoId}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIdOrEmail: restoreQuery.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "No se encontró una compra válida");
      }

      hapticSuccess();
      setIsSuccess(true);
      toast({
        type: "success",
        title: "¡Compra Restaurada! ⚡",
        message: "El pase Super Serrucho ha sido re-activado exitosamente.",
      });

      onUnlocked?.();
    } catch (err: any) {
      toast({
        type: "error",
        title: "No se pudo restaurar",
        message: err.message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <Zap className="h-5 w-5 fill-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <DialogTitle className="text-base font-extrabold text-foreground">
                Super Serrucho ⚡
              </DialogTitle>
              <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700/50 text-[10px] font-black uppercase">
                Pase Grupal
              </Badge>
            </div>
            <DialogDescription className="text-xs">
              {serruchoName}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      {isSuccess ? (
        <div className="py-6 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 animate-bounce">
            <Sparkles className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-foreground">
              ¡Este Serrucho es SUPER! ⚡
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Todas las funciones avanzadas están activas para todos los miembros presentes y futuros de este coro.
            </p>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-900 dark:text-amber-200 font-medium">
            ✅ Acceso permanente desbloqueado sin cobros adicionales por participante.
          </div>

          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold h-10 rounded-xl"
          >
            Entendido y Disfrutar
          </Button>
        </div>
      ) : (
        <div className="space-y-4 py-2 text-xs">
          {/* Tabs */}
          <div className="flex border-b border-border/80 text-xs">
            <button
              type="button"
              onClick={() => setTab("upgrade")}
              className={`pb-2 px-3 font-bold border-b-2 transition-colors ${
                tab === "upgrade"
                  ? "border-amber-500 text-amber-600 dark:text-amber-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Mejorar Serrucho
            </button>
            <button
              type="button"
              onClick={() => setTab("restore")}
              className={`pb-2 px-3 font-bold border-b-2 transition-colors ${
                tab === "restore"
                  ? "border-amber-500 text-amber-600 dark:text-amber-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Restaurar Compra
            </button>
          </div>

          {tab === "upgrade" ? (
            <div className="space-y-3.5">
              {/* Value prop banner */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/25 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                    Pago Único por Grupo
                  </span>
                  <span className="text-lg font-black text-foreground">
                    {formatDOP(29900)}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Un solo integrante paga y <strong>desbloquea el serrucho para todos los participantes</strong> de forma definitiva.
                </p>
              </div>

              {/* Included Perks */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-card border border-border/70">
                  <Users className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <strong className="block text-foreground">Integrantes Ilimitados</strong>
                    <span className="text-[10px] text-muted-foreground">Para coros masivos</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-card border border-border/70">
                  <Globe2 className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <strong className="block text-foreground">Multi-Moneda Pro</strong>
                    <span className="text-[10px] text-muted-foreground">USD, EUR a DOP</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-card border border-border/70">
                  <Receipt className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <strong className="block text-foreground">Adjuntos Ilimitados</strong>
                    <span className="text-[10px] text-muted-foreground">Facturas y fotos HD</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-card border border-border/70">
                  <FileSpreadsheet className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
                  <div>
                    <strong className="block text-foreground">Excel Avanzado</strong>
                    <span className="text-[10px] text-muted-foreground">Reportes de 4 hojas</span>
                  </div>
                </div>
              </div>

              {/* Email field */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">
                  Correo para enviar comprobante de orden:
                </label>
                <Input
                  type="email"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  placeholder="tu-correo@ejemplo.do"
                  className="text-xs h-9"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <p className="text-xs text-muted-foreground">
                Si ya pagaste este Super Serrucho en otro dispositivo, ingresa tu número de orden o correo electrónico para restaurar el acceso.
              </p>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">
                  Número de Orden o Correo:
                </label>
                <Input
                  value={restoreQuery}
                  onChange={(e) => setRestoreQuery(e.target.value)}
                  placeholder="ord-serrucho-..."
                  className="text-xs h-9"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {!isSuccess && (
        <DialogFooter className="sm:justify-between flex-row items-center gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="text-xs"
          >
            Cerrar
          </Button>

          {tab === "upgrade" ? (
            <Button
              type="button"
              onClick={handleUpgrade}
              disabled={isProcessing}
              className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs h-10 px-5 rounded-xl gap-2 shadow-md shadow-amber-600/20"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 fill-white" />
                  <span>Desbloquear ({formatDOP(29900)})</span>
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleRestore}
              disabled={isProcessing || !restoreQuery.trim()}
              className="bg-primary hover:bg-primary/90 text-white font-bold text-xs h-10 px-4 rounded-xl gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Buscando...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" />
                  <span>Restaurar</span>
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      )}
    </Dialog>
  );
}
