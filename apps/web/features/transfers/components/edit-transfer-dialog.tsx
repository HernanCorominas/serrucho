"use client";

import * as React from "react";
import { ArrowRightLeft, CreditCard, Check, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  Participant,
  TransferWithParticipants,
  PaymentMethod,
  PAYMENT_METHOD_INFO,
} from "@/lib/types/domain";
import { fromCents } from "@/lib/finance/math";
import { hapticSuccess, hapticImpact, hapticLight } from "@/lib/utils/haptics";

interface EditTransferDialogProps {
  serruchoId: string;
  transfer: TransferWithParticipants | null;
  participants: Participant[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransferUpdated: () => void;
}

export function EditTransferDialog({
  serruchoId,
  transfer,
  participants,
  open,
  onOpenChange,
  onTransferUpdated,
}: EditTransferDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  const [senderId, setSenderId] = React.useState("");
  const [receiverId, setReceiverId] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [transferDate, setTransferDate] = React.useState("");
  const [paymentMethod, setPaymentMethod] =
    React.useState<PaymentMethod>("TRANSFER_POPULAR");
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (transfer && open) {
      setSenderId(transfer.sender_participant_id);
      setReceiverId(transfer.receiver_participant_id);
      setAmount(fromCents(transfer.amount_cents).toString());
      setTransferDate(transfer.transfer_date);
      setPaymentMethod(transfer.payment_method || "TRANSFER_POPULAR");
      setNotes(transfer.notes || "");
    }
  }, [transfer, open]);

  const numAmount = parseFloat(amount) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transfer) return;

    if (!senderId || !receiverId) {
      hapticImpact();
      toast({ type: "error", message: "Selecciona quién entregó y quién recibió el dinero" });
      return;
    }

    if (senderId === receiverId) {
      hapticImpact();
      toast({ type: "error", message: "El emisor y el receptor no pueden ser la misma persona" });
      return;
    }

    if (isNaN(numAmount) || numAmount <= 0) {
      hapticImpact();
      toast({ type: "error", message: "Ingresa un monto válido mayor a RD$ 0" });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/serruchos/${serruchoId}/transfers/${transfer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_participant_id: senderId,
          receiver_participant_id: receiverId,
          amount: numAmount,
          transfer_date: transferDate,
          payment_method: paymentMethod,
          notes: notes.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "No se pudo actualizar la transferencia");
      }

      hapticSuccess();
      toast({
        type: "success",
        title: "¡Transferencia actualizada!",
        message: "Se actualizaron los datos de la transferencia y se recalcularon los balances.",
      });

      onOpenChange(false);
      onTransferUpdated();
    } catch (err: any) {
      hapticImpact();
      toast({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!transfer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-lg">
          <ArrowRightLeft className="h-5 w-5 text-emerald-600" />
          <span>Editar Transferencia</span>
        </DialogTitle>
        <DialogDescription>
          Modifica el emisor, receptor, monto o notas del abono o transferencia directa.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Sender & Receiver Selection */}
        <div className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 space-y-1">
              <Label className="text-[11px] font-bold text-muted-foreground uppercase">
                Quién Entregó
              </Label>
              <select
                value={senderId}
                onChange={(e) => {
                  hapticLight();
                  setSenderId(e.target.value);
                }}
                className="w-full rounded-lg border border-input bg-card px-2.5 py-1.5 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-5 text-muted-foreground">
              <ArrowRight className="h-4 w-4 text-emerald-600" />
            </div>

            <div className="flex-1 space-y-1">
              <Label className="text-[11px] font-bold text-muted-foreground uppercase">
                Quién Recibió
              </Label>
              <select
                value={receiverId}
                onChange={(e) => {
                  hapticLight();
                  setReceiverId(e.target.value);
                }}
                className="w-full rounded-lg border border-input bg-card px-2.5 py-1.5 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Amount & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs font-bold">Monto (RD$)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                RD$
              </span>
              <Input
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-11 text-sm font-black"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold">Fecha de Transferencia</Label>
            <Input
              type="date"
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              className="text-xs sm:text-sm"
              required
            />
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="space-y-1.5">
          <Label className="text-xs font-bold flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5 text-primary" />
            <span>Método de Pago</span>
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
                      ? "border-primary bg-primary/10 font-bold text-foreground ring-1 ring-primary"
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

        {/* Notes */}
        <div className="space-y-1">
          <Label className="text-xs font-bold">Notas / Referencia (Opcional)</Label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej. Transferencia BHD ref #1234..."
            className="text-xs sm:text-sm"
            maxLength={200}
          />
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
            className="w-full sm:w-auto text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          >
            <Check className="h-4 w-4" />
            <span>{loading ? "Guardando..." : "Guardar Cambios"}</span>
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
