"use client";

import * as React from "react";
import { ArrowRightLeft, DollarSign, Calendar, CreditCard, FileText } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Participant, PaymentMethod } from "@/lib/types/domain";
import { hapticSuccess } from "@/lib/utils/haptics";

interface AddTransferDialogProps {
  serruchoId: string;
  participants: Participant[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransferAdded: () => void;
  defaultSenderId?: string;
  defaultReceiverId?: string;
}

export function AddTransferDialog({
  serruchoId,
  participants,
  open,
  onOpenChange,
  onTransferAdded,
  defaultSenderId,
  defaultReceiverId,
}: AddTransferDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [senderId, setSenderId] = React.useState("");
  const [receiverId, setReceiverId] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [transferDate, setTransferDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("TRANSFER_POPULAR");
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (participants.length >= 2) {
      if (defaultSenderId && participants.some((p) => p.id === defaultSenderId)) {
        setSenderId(defaultSenderId);
      } else if (!senderId) {
        setSenderId(participants[0].id);
      }

      if (defaultReceiverId && participants.some((p) => p.id === defaultReceiverId)) {
        setReceiverId(defaultReceiverId);
      } else if (!receiverId) {
        const other = participants.find((p) => p.id !== (defaultSenderId || participants[0].id));
        if (other) setReceiverId(other.id);
      }
    }
  }, [participants, open, defaultSenderId, defaultReceiverId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({ type: "error", message: "Ingresa un monto válido mayor a 0" });
      return;
    }

    if (!senderId || !receiverId) {
      toast({ type: "error", message: "Selecciona quién entregó y quién recibió el dinero" });
      return;
    }

    if (senderId === receiverId) {
      toast({ type: "error", message: "El emisor y el receptor no pueden ser la misma persona" });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/serruchos/${serruchoId}/transfers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_participant_id: senderId,
          receiver_participant_id: receiverId,
          amount: parsedAmount,
          transfer_date: transferDate,
          payment_method: paymentMethod,
          notes: notes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Error al registrar transferencia");
      }

      hapticSuccess();
      toast({
        type: "success",
        title: "¡Transferencia registrada!",
        message: `Se anotó el pago de RD$ ${parsedAmount.toLocaleString("es-DO")}.`,
      });

      setAmount("");
      setNotes("");
      onOpenChange(false);
      onTransferAdded();
    } catch (err: any) {
      toast({ type: "error", message: err.message || "Error al procesar transferencia" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <DialogTitle>Registrar Transferencia o Pago Directo</DialogTitle>
          </div>
          <DialogDescription>
            Anota dinero prestado, abonos o pagos bancarios directos entre dos personas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Sender and Receiver Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/40 rounded-xl border border-border">
            <div className="space-y-1.5">
              <Label htmlFor="trans_sender" className="text-xs font-bold text-muted-foreground uppercase">
                ¿Quién entregó / pagó? *
              </Label>
              <Select
                id="trans_sender"
                value={senderId}
                onChange={(e) => setSenderId(e.target.value)}
                required
              >
                {participants.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.id === receiverId}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="trans_receiver" className="text-xs font-bold text-muted-foreground uppercase">
                ¿Quién recibió el dinero? *
              </Label>
              <Select
                id="trans_receiver"
                value={receiverId}
                onChange={(e) => setReceiverId(e.target.value)}
                required
              >
                {participants.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.id === senderId}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <Label htmlFor="trans_amount">Monto transferido (RD$) *</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-black text-muted-foreground">
                RD$
              </span>
              <Input
                id="trans_amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                className="pl-11 text-base font-bold"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          {/* Date & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="trans_date">Fecha</Label>
              <Input
                id="trans_date"
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="trans_method">Vía / Método de pago</Label>
              <Select
                id="trans_method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              >
                <option value="TRANSFER_POPULAR">Banco Popular</option>
                <option value="TRANSFER_BHD">Banco BHD</option>
                <option value="TRANSFER_BANRESERVAS">Banreservas</option>
                <option value="TRANSFER_OTHER">Otra Transferencia / tPago</option>
                <option value="CASH">Efectivo 💵</option>
                <option value="OTHER">Otro</option>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="trans_notes">Nota o Referencia (Opcional)</Label>
            <Input
              id="trans_notes"
              placeholder="Ej. Abono combustible, Préstamo efectivo, Ref 849204"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Notice Banner */}
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 text-xs">
            💡 <strong>Movimiento directo:</strong> Esta transferencia modifica exclusivamente el balance entre estas dos personas sin alterar los gastos ni la cuota de los demás.
          </div>
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
            disabled={loading || !amount || parseFloat(amount) <= 0 || senderId === receiverId}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5"
          >
            <ArrowRightLeft className="h-4 w-4" />
            <span>{loading ? "Guardando..." : "Registrar Transferencia"}</span>
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
