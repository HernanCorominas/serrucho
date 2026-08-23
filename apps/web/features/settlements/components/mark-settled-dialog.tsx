"use client";

import * as React from "react";
import {
  CheckCircle2,
  Calendar,
  CreditCard,
  ArrowRight,
  FileText,
  AlertCircle,
  Clock,
  Sparkles,
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {
  ParticipantFinancials,
  PaymentMethod,
  PAYMENT_METHOD_INFO,
  SettlementPaymentStatus,
  SETTLEMENT_PAYMENT_STATUS_INFO,
} from "@/lib/types/domain";
import { formatDOP, fromCents, toCents } from "@/lib/finance/math";
import { hapticSuccess, hapticImpact, hapticLight } from "@/lib/utils/haptics";

interface MarkSettledDialogProps {
  serruchoId: string;
  participants: ParticipantFinancials[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSettled: () => void;
  initialDebtorId?: string;
  initialCreditorId?: string;
  initialAmountCents?: number;
}

export function MarkSettledDialog({
  serruchoId,
  participants,
  open,
  onOpenChange,
  onSettled,
  initialDebtorId,
  initialCreditorId,
  initialAmountCents,
}: MarkSettledDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  const [fromId, setFromId] = React.useState("");
  const [toId, setToId] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [paymentDate, setPaymentDate] = React.useState(
    new Date().toISOString().split("T")[0]
  );
  const [paymentMethod, setPaymentMethod] =
    React.useState<PaymentMethod>("TRANSFER_POPULAR");
  const [status, setStatus] = React.useState<SettlementPaymentStatus>("SETTLED");
  const [notes, setNotes] = React.useState("");

  // Initialize or reset form when dialog opens or initial props change
  React.useEffect(() => {
    if (open) {
      const defaultDebtor =
        initialDebtorId ||
        participants.find((p) => p.net_balance_cents < 0)?.id ||
        participants[0]?.id ||
        "";
      const defaultCreditor =
        initialCreditorId ||
        participants.find((p) => p.net_balance_cents > 0)?.id ||
        participants.find((p) => p.id !== defaultDebtor)?.id ||
        "";

      setFromId(defaultDebtor);
      setToId(defaultCreditor);
      setAmount(
        initialAmountCents && initialAmountCents > 0
          ? fromCents(initialAmountCents).toString()
          : ""
      );
      setPaymentDate(new Date().toISOString().split("T")[0]);
      setPaymentMethod("TRANSFER_POPULAR");
      setStatus("SETTLED");
      setNotes("");
    }
  }, [open, initialDebtorId, initialCreditorId, initialAmountCents, participants]);

  const payer = participants.find((p) => p.id === fromId);
  const receiver = participants.find((p) => p.id === toId);

  const numAmount = parseFloat(amount) || 0;
  const isPartial =
    initialAmountCents &&
    initialAmountCents > 0 &&
    toCents(numAmount) < initialAmountCents;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fromId || !toId) {
      hapticImpact();
      toast({ type: "error", message: "Selecciona quién paga y quién recibe" });
      return;
    }

    if (fromId === toId) {
      hapticImpact();
      toast({
        type: "error",
        message: "El pagador y el receptor no pueden ser la misma persona",
      });
      return;
    }

    if (isNaN(numAmount) || numAmount <= 0) {
      hapticImpact();
      toast({ type: "error", message: "Ingresa un monto válido mayor a RD$ 0" });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/serruchos/${serruchoId}/settlements/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_participant_id: fromId,
          to_participant_id: toId,
          amount: numAmount,
          payment_date: paymentDate,
          payment_method: paymentMethod,
          status: isPartial && status === "SETTLED" ? "PARTIAL" : status,
          notes: notes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "No se pudo registrar el pago");
      }

      hapticSuccess();
      toast({
        type: "success",
        title: "¡Pago registrado con éxito! 🎉",
        message: `Se registró la transferencia de ${formatDOP(toCents(numAmount))} de ${
          payer?.name || "Deudor"
        } a ${receiver?.name || "Acreedor"}.`,
      });

      onOpenChange(false);
      onSettled();
    } catch (err: any) {
      hapticImpact();
      toast({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-lg">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <span>Marcar Deuda como Saldada</span>
        </DialogTitle>
        <DialogDescription>
          Registra el cumplimiento del pago entre participantes conservando intacto
          el historial de gastos del serrucho.
        </DialogDescription>
      </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Payer & Receiver Selection Cards */}
          <div className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              {/* Payer */}
              <div className="flex-1 space-y-1">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase">
                  Quién Paga (Deudor)
                </Label>
                <select
                  value={fromId}
                  onChange={(e) => {
                    hapticLight();
                    setFromId(e.target.value);
                  }}
                  className="w-full rounded-lg border border-input bg-card px-2.5 py-1.5 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="" disabled>
                    Selecciona pagador
                  </option>
                  {participants.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.net_balance_cents < 0 ? `(Debe ${formatDOP(Math.abs(p.net_balance_cents))})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-5 text-muted-foreground">
                <ArrowRight className="h-4 w-4 text-emerald-600" />
              </div>

              {/* Receiver */}
              <div className="flex-1 space-y-1">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase">
                  Quién Recibe (Acreedor)
                </Label>
                <select
                  value={toId}
                  onChange={(e) => {
                    hapticLight();
                    setToId(e.target.value);
                  }}
                  className="w-full rounded-lg border border-input bg-card px-2.5 py-1.5 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="" disabled>
                    Selecciona receptor
                  </option>
                  {participants.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.net_balance_cents > 0 ? `(A favor ${formatDOP(p.net_balance_cents)})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold">Monto (RD$)</Label>
                {initialAmountCents && initialAmountCents > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      hapticLight();
                      setAmount(fromCents(initialAmountCents).toString());
                    }}
                    className="text-[10px] font-extrabold text-primary hover:underline"
                  >
                    Total: {formatDOP(initialAmountCents)}
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                  RD$
                </span>
                <Input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-11 text-sm font-extrabold"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Fecha del Pago</Label>
              <div className="relative">
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="text-xs sm:text-sm"
                  required
                />
              </div>
            </div>
          </div>

          {/* Dominican Payment Method Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-primary" />
              <span>Método de Pago Utilizado (RD)</span>
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {(Object.keys(PAYMENT_METHOD_INFO) as PaymentMethod[]).map((key) => {
                const info = PAYMENT_METHOD_INFO[key];
                const isSelected = paymentMethod === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      hapticLight();
                      setPaymentMethod(key);
                    }}
                    className={`flex items-center gap-1.5 p-2 rounded-xl border text-left text-xs transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 font-bold text-foreground ring-1 ring-primary shadow-xs"
                        : "border-border bg-card text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    <span className="text-sm">{info.emoji}</span>
                    <span className="truncate">{info.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status Selection (Settled vs Partial vs Disputed) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Estado del Settlement</span>
            </Label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(["SETTLED", "PARTIAL", "DISPUTED"] as SettlementPaymentStatus[]).map((st) => {
                const info = SETTLEMENT_PAYMENT_STATUS_INFO[st];
                const isSelected = status === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      hapticLight();
                      setStatus(st);
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 ${
                      isSelected
                        ? `${info.color} ring-1 ring-current shadow-xs`
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <span>{info.emoji}</span>
                    <span>{info.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes / Reference */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Nota o Referencia Bancaria (Opcional)</span>
            </Label>
            <Input
              placeholder="Ej. Transferencia BHD comprobante #982341..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs sm:text-sm"
              maxLength={200}
            />
          </div>

          {/* Non-destructive guarantee notice */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[11px] font-medium leading-relaxed">
            <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
            <span>
              <strong>Garantía Contable:</strong> Los gastos originales no se eliminan.
              Este pago se agregará al balance reduciendo la deuda pendiente entre ambos.
            </span>
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="w-full sm:w-auto text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{loading ? "Registrando..." : "Confirmar Pago"}</span>
            </Button>
          </DialogFooter>
        </form>
    </Dialog>
  );
}
