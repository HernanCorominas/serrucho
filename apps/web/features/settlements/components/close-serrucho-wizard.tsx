"use client";

import * as React from "react";
import { Lock, AlertTriangle, Send, CheckCircle2, Calendar, CreditCard } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatDOP } from "@/lib/finance/math";
import { ParticipantFinancials } from "@/lib/types/domain";
import { hapticImpact } from "@/lib/utils/haptics";

interface CloseSerruchoWizardProps {
  serruchoId: string;
  serruchoName: string;
  participants: ParticipantFinancials[];
  totalExpensesCents: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClosed: (result: any) => void;
}

export function CloseSerruchoWizard({
  serruchoId,
  serruchoName,
  participants,
  totalExpensesCents,
  open,
  onOpenChange,
  onClosed,
}: CloseSerruchoWizardProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [paymentInstructions, setPaymentInstructions] = React.useState(
    "Transferencia Bancaria: Banco BHD / Banreservas / tPago a mi nombre."
  );
  const [paymentDeadline, setPaymentDeadline] = React.useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [confirmed, setConfirmed] = React.useState(false);

  const debtors = participants.filter((p) => p.net_balance_cents < 0);
  const creditors = participants.filter((p) => p.net_balance_cents > 0);

  const handleCloseSerrucho = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!paymentInstructions.trim()) {
      toast({ type: "error", message: "Indica las instrucciones o cuentas de pago" });
      return;
    }

    if (!paymentDeadline) {
      toast({ type: "error", message: "Selecciona una fecha límite de pago" });
      return;
    }

    if (!confirmed) {
      toast({
        type: "error",
        message: "Debes marcar la casilla de confirmación para cerrar el serrucho",
      });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/serruchos/${serruchoId}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_instructions: paymentInstructions.trim(),
          payment_deadline: paymentDeadline,
          confirm: true,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Error al cerrar el serrucho");
      }

      const result = await res.json();
      hapticImpact();
      toast({
        type: "success",
        title: "¡Serrucho cerrado con éxito! 🔒",
        message: "Los estados de cuenta han sido congelados y notificados.",
      });

      onOpenChange(false);
      onClosed(result);
    } catch (err: any) {
      toast({ type: "error", message: err.message || "No se pudo cerrar el serrucho" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleCloseSerrucho}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500/10 text-primary">
              <Lock className="h-5 w-5" />
            </div>
            <DialogTitle>Cerrar Serrucho y Congelar Cuentas</DialogTitle>
          </div>
          <DialogDescription>
            Revisa los balances finales, añade los datos de pago y genera los estados de cuenta inmutables.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Summary pill */}
          <div className="bg-muted/50 rounded-xl p-3.5 border border-border text-xs space-y-1.5">
            <div className="flex justify-between font-semibold text-foreground">
              <span>Total de gastos acumulados:</span>
              <span className="font-extrabold text-primary text-sm">{formatDOP(totalExpensesCents)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Participantes en el serrucho:</span>
              <span className="font-medium text-foreground">{participants.length} personas</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Personas que deben transferir:</span>
              <span className="font-bold text-red-600 dark:text-red-400">{debtors.length} personas</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="close_instructions" className="flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-primary" />
              <span>Instrucciones y cuentas para recibir los pagos *</span>
            </Label>
            <textarea
              id="close_instructions"
              rows={3}
              className="flex w-full rounded-xl border border-input bg-background px-3.5 py-2 text-xs sm:text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Ej. Banco Popular Cta 1234567 a nombre de Carlos Gómez, o tPago / Banreservas al 809-555-0101"
              value={paymentInstructions}
              onChange={(e) => setPaymentInstructions(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="close_deadline" className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-primary" />
              <span>Fecha límite de pago *</span>
            </Label>
            <Input
              id="close_deadline"
              type="date"
              value={paymentDeadline}
              onChange={(e) => setPaymentDeadline(e.target.value)}
              required
            />
          </div>

          {/* Warning box */}
          <div className="rounded-xl border border-amber-300/80 bg-amber-50/80 dark:bg-amber-950/30 dark:border-amber-800 p-3.5 text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block">Acción Irreversible:</strong>
                Al cerrar, los gastos y participantes quedarán protegidos contra modificaciones. Cada participante recibirá un enlace seguro con su estado de cuenta.
              </div>
            </div>
          </div>

          <label className="flex items-start gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-muted/30 select-none">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="rounded border-input text-primary focus:ring-primary h-4 w-4 mt-0.5"
            />
            <span className="text-xs text-foreground font-medium">
              Confirmo que los gastos están correctos y deseo congelar este serrucho y enviar las notificaciones.
            </span>
          </label>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading || !confirmed}
            className="bg-red-600 hover:bg-red-700 text-white font-bold gap-1.5"
          >
            <Lock className="h-4 w-4" />
            {loading ? "Cerrando serrucho..." : "Cerrar Serrucho Definitivamente"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
