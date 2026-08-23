"use client";

import * as React from "react";
import { MessageCircle, Send, Phone, Edit3, Loader2, Sparkles, AlertCircle } from "lucide-react";
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
import { useToast } from "@/components/ui/toast";
import { formatDOP } from "@/lib/finance/math";
import { WhatsAppReminderService } from "../whatsapp-reminder-service";
import { hapticLight, hapticSuccess } from "@/lib/utils/haptics";

interface WhatsAppReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serruchoId: string;
  serruchoName: string;
  debtorParticipantId: string;
  debtorName: string;
  debtorPhone?: string | null;
  amountCents: number;
  paymentInstructions?: string | null;
  senderName?: string;
  publicUrl?: string | null;
  onReminderSent?: () => void;
}

export function WhatsAppReminderDialog({
  open,
  onOpenChange,
  serruchoId,
  serruchoName,
  debtorParticipantId,
  debtorName,
  debtorPhone,
  amountCents,
  paymentInstructions,
  senderName = "Organizador",
  publicUrl,
  onReminderSent,
}: WhatsAppReminderDialogProps) {
  const { toast } = useToast();

  const [phone, setPhone] = React.useState(debtorPhone || "");
  const [message, setMessage] = React.useState("");
  const [isProcessing, setIsProcessing] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setPhone(debtorPhone || "");
      const initialMsg = WhatsAppReminderService.buildReminderMessage({
        serruchoName,
        debtorName,
        creditorName: senderName,
        amountCents,
        paymentInstructions,
        publicUrl,
      });
      setMessage(initialMsg);
    }
  }, [open, serruchoName, debtorName, debtorPhone, amountCents, paymentInstructions, senderName, publicUrl]);

  const handleLaunchWhatsApp = async () => {
    try {
      hapticLight();
      setIsProcessing(true);

      // Record intent on backend
      const res = await fetch(
        `/api/serruchos/${serruchoId}/participants/${debtorParticipantId}/reminder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            debtorName,
            senderName,
            phone: phone || undefined,
            amountCents,
            customMessage: message,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "No se pudo procesar el recordatorio");
      }

      hapticSuccess();
      toast({
        type: "success",
        title: "WhatsApp Abierto 🌴",
        message: `Se ha abierto WhatsApp con tu mensaje listo para enviar a ${debtorName}.`,
      });

      // Open WhatsApp in a new tab
      if (typeof window !== "undefined") {
        window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
      }

      onOpenChange(false);
      onReminderSent?.();
    } catch (err: any) {
      toast({
        type: "error",
        title: "Aviso",
        message: err.message || "Error al generar el recordatorio.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
            <MessageCircle className="h-5 w-5 fill-emerald-500" />
          </div>
          <div>
            <DialogTitle className="text-base font-extrabold text-foreground">
              Recordatorio por WhatsApp
            </DialogTitle>
            <DialogDescription className="text-xs">
              Para {debtorName} • Balance pendiente:{" "}
              <strong className="text-foreground">{formatDOP(Math.abs(amountCents))}</strong>
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="space-y-3.5 py-1 text-xs">
        {/* Recipient Phone */}
        <div className="space-y-1">
          <Label className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1">
            <Phone className="h-3.5 w-3.5" />
            <span>Teléfono / WhatsApp de {debtorName}:</span>
          </Label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="809-555-0123 (opcional)"
            className="text-xs h-9"
          />
          <p className="text-[10px] text-muted-foreground">
            Si dejas el teléfono vacío, WhatsApp te permitirá elegir el contacto de tu lista al abrir.
          </p>
        </div>

        {/* Editable Message Box */}
        <div className="space-y-1">
          <Label className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1">
            <Edit3 className="h-3.5 w-3.5" />
            <span>Mensaje editable (Tono Dominicano):</span>
          </Label>
          <textarea
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-xl border border-input bg-card p-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans leading-relaxed resize-none"
          />
        </div>

        {/* Polite note */}
        <div className="p-2.5 rounded-xl bg-muted/60 text-[10px] text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span>Al presionar el botón se abrirá WhatsApp con el texto preparado para que tú lo confirmes y envíes.</span>
        </div>
      </div>

      <DialogFooter className="sm:justify-between flex-row items-center gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onOpenChange(false)}
          disabled={isProcessing}
          className="text-xs"
        >
          Cancelar
        </Button>

        <Button
          type="button"
          onClick={handleLaunchWhatsApp}
          disabled={isProcessing || !message.trim()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-5 rounded-xl gap-2 shadow-md shadow-emerald-600/20"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Preparando...</span>
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5" />
              <span>Abrir WhatsApp</span>
            </>
          )}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
