"use client";

import * as React from "react";
import {
  Printer,
  Share2,
  CheckCircle2,
  Clock,
  CreditCard,
  Receipt,
  ShieldCheck,
  Check,
  Copy,
  MessageCircle,
  QrCode,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { formatDOP } from "@/lib/finance/math";
import { PublicSettlementReceipt } from "@/lib/types/domain";
import { PaymentQRDialog } from "./payment-qr-dialog";
import { hapticLight, hapticSuccess } from "@/lib/utils/haptics";

interface PublicReceiptCardProps {
  receipt: PublicSettlementReceipt;
}

export function PublicReceiptCard({ receipt }: PublicReceiptCardProps) {
  const { toast } = useToast();
  const { snapshot, participant, serrucho, items } = receipt;
  const [copiedBank, setCopiedBank] = React.useState(false);
  const [qrOpen, setQrOpen] = React.useState(false);

  const isDebtor = snapshot.balance_cents < 0;
  const isCreditor = snapshot.balance_cents > 0;
  const isSettled = snapshot.balance_cents === 0;

  const handlePrint = () => {
    hapticLight();
    window.print();
  };

  const handleShare = async () => {
    hapticLight();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Estado de Cuenta - ${serrucho.name}`,
          text: `Hola ${participant.name}, aquí está tu estado de cuenta para ${serrucho.name}:`,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        type: "success",
        title: "Enlace copiado",
        message: "Enlace de estado de cuenta copiado al portapapeles.",
      });
    }
  };

  const handleCopyBank = () => {
    if (!snapshot.payment_instructions) return;
    hapticSuccess();
    navigator.clipboard.writeText(snapshot.payment_instructions);
    setCopiedBank(true);
    toast({
      type: "success",
      title: "Datos bancarios copiados",
      message: "Listo para pegar en la app de tu banco.",
    });
    setTimeout(() => setCopiedBank(false), 2500);
  };

  const waNotifyMsg = encodeURIComponent(
    `¡Hola! 🌴 Te confirmo que ya realicé la transferencia de *${formatDOP(
      Math.abs(snapshot.balance_cents)
    )}* del serrucho *${serrucho.name}* a nombre de *${participant.name}*.\n\nComprobante: ${
      typeof window !== "undefined" ? window.location.href : ""
    }`
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Action bar for printing & sharing */}
      <div className="flex items-center justify-between no-print px-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Comprobante Oficial Seguro</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              hapticLight();
              setQrOpen(true);
            }}
            className="gap-1.5 text-xs font-bold"
          >
            <QrCode className="h-3.5 w-3.5" />
            <span>Código QR</span>
          </Button>

          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 text-xs font-bold">
            <Printer className="h-3.5 w-3.5" />
            <span>Imprimir / PDF</span>
          </Button>

          <Button size="sm" onClick={handleShare} className="gap-1.5 text-xs font-bold bg-primary text-white">
            <Share2 className="h-3.5 w-3.5" />
            <span>Compartir</span>
          </Button>
        </div>
      </div>

      {/* Main Receipt Card */}
      <Card className="border-border shadow-xl overflow-hidden bg-card">
        {/* Decorative Top Bar */}
        <div className="h-3 bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500" />

        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 pb-6 border-b border-border">
            <div className="space-y-1">
              <span className="text-xs uppercase font-extrabold tracking-wider text-primary">
                Comprobante de Liquidación
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground">{serrucho.name}</h1>
              {serrucho.description && (
                <p className="text-xs text-muted-foreground">{serrucho.description}</p>
              )}
            </div>

            <div className="text-left sm:text-right space-y-1">
              <Badge variant="outline" className="text-xs font-mono font-semibold">
                Token: {snapshot.public_token_hash ? snapshot.public_token_hash.slice(0, 8) : "seguro"}...
              </Badge>
              <div className="text-xs text-muted-foreground">
                Cerrado el {serrucho.closed_at ? new Date(serrucho.closed_at).toLocaleDateString("es-DO") : "N/A"}
              </div>
            </div>
          </div>

          {/* Participant Info & Status Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-muted/40 border border-border">
            <div>
              <span className="text-xs text-muted-foreground font-semibold">Estado de Cuenta para:</span>
              <h3 className="text-lg font-black text-foreground">{participant.name}</h3>
              {participant.phone && (
                <span className="text-xs text-muted-foreground">📱 {participant.phone}</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isCreditor && (
                <Badge variant="success" className="text-xs font-bold py-1 px-3 gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Saldo a Favor
                </Badge>
              )}

              {isDebtor && !snapshot.is_paid && (
                <Badge variant="destructive" className="text-xs font-bold py-1 px-3 gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Pendiente de Transferir
                </Badge>
              )}

              {isDebtor && snapshot.is_paid && (
                <Badge variant="success" className="text-xs font-bold py-1 px-3 gap-1.5 bg-emerald-600 text-white">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  ¡Transferencia Confirmada!
                </Badge>
              )}

              {isSettled && (
                <Badge variant="secondary" className="text-xs font-bold py-1 px-3 gap-1.5">
                  <Check className="h-3.5 w-3.5" />
                  Al Día (RD$ 0.00)
                </Badge>
              )}
            </div>
          </div>

          {/* Amount Hero */}
          <div className="text-center py-6 px-4 rounded-2xl bg-muted/20 border border-border/80 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {isDebtor && !snapshot.is_paid
                ? "Monto Pendiente de Pago"
                : isDebtor && snapshot.is_paid
                ? "Monto Saldado"
                : isCreditor
                ? "Monto a tu Favor (Debes Recibir)"
                : "Estado de Cuenta"}
            </span>

            <div
              className={`text-4xl sm:text-5xl font-black tracking-tight my-2 ${
                isDebtor && !snapshot.is_paid
                  ? "text-red-600 dark:text-red-400"
                  : isCreditor || (isDebtor && snapshot.is_paid)
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-foreground"
              }`}
            >
              {formatDOP(Math.abs(snapshot.balance_cents))}
            </div>

            <p className="text-xs font-semibold text-muted-foreground max-w-md mx-auto">
              {isDebtor && !snapshot.is_paid
                ? "Por favor realiza la transferencia antes de la fecha límite indicada por el organizador."
                : isDebtor && snapshot.is_paid
                ? "Cuenta completamente al día."
                : isCreditor
                ? "El organizador o los participantes te transferirán este saldo."
                : "¡No tienes saldo pendiente en este serrucho!"}
            </p>
          </div>

          {/* Breakdown Table */}
          <div className="space-y-2">
            <h4 className="text-xs uppercase font-extrabold text-muted-foreground tracking-wider">
              Resumen Financiero
            </h4>
            <div className="rounded-xl border border-border divide-y divide-border text-sm overflow-hidden">
              <div className="flex justify-between p-3.5 bg-muted/20">
                <span className="text-muted-foreground">Total de gastos del grupo:</span>
                <span className="font-bold text-foreground">{formatDOP(snapshot.total_expenses_cents)}</span>
              </div>
              <div className="flex justify-between p-3.5 bg-muted/20">
                <span className="text-muted-foreground">Tu consumo / parte proporcional:</span>
                <span className="font-bold text-foreground">{formatDOP(snapshot.owed_cents)}</span>
              </div>
              <div className="flex justify-between p-3.5 bg-muted/20">
                <span className="text-muted-foreground">Monto que aportaste / pagaste:</span>
                <span className="font-bold text-foreground">{formatDOP(snapshot.paid_cents)}</span>
              </div>
              <div className="flex justify-between p-4 bg-muted/40 font-black text-base">
                <span>Balance Final Neto:</span>
                <span className={isDebtor ? "text-red-600" : isCreditor ? "text-emerald-600" : "text-foreground"}>
                  {formatDOP(snapshot.balance_cents, true)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Instructions (If Debtor & Unpaid) */}
          {snapshot.payment_instructions && isDebtor && !snapshot.is_paid && (
            <div className="rounded-2xl border border-amber-300/80 bg-amber-50/70 dark:bg-amber-950/30 dark:border-amber-800 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-sm">
                  <CreditCard className="h-4 w-4 text-amber-600" />
                  <span>¿Cómo y dónde pagar?</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      hapticLight();
                      setQrOpen(true);
                    }}
                    className="h-7 px-2 text-xs font-semibold gap-1 bg-white/80 dark:bg-card"
                  >
                    <QrCode className="h-3 w-3" />
                    <span>Ver QR</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyBank}
                    className="h-7 px-2 text-xs font-semibold gap-1 bg-white/80 dark:bg-card"
                  >
                    {copiedBank ? <CheckCircle2 className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedBank ? "¡Copiado!" : "Copiar Cuentas"}</span>
                  </Button>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-amber-950 dark:text-amber-100 whitespace-pre-wrap font-medium">
                {snapshot.payment_instructions}
              </p>

              {snapshot.payment_deadline && (
                <div className="text-xs text-amber-800 dark:text-amber-300 font-semibold pt-1 border-t border-amber-200 dark:border-amber-800/80">
                  ⏰ Fecha límite: <strong>{snapshot.payment_deadline}</strong>
                </div>
              )}

              {/* 1-Click WhatsApp Transfer Notification */}
              <div className="pt-2">
                <a
                  href={`https://wa.me/?text=${waNotifyMsg}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button
                    size="sm"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-sm"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>Notificar Pago por WhatsApp</span>
                  </Button>
                </a>
              </div>
            </div>
          )}

          {/* Itemized Expenses Breakdown */}
          {items.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <h4 className="text-xs uppercase font-extrabold text-muted-foreground tracking-wider flex items-center gap-1.5">
                  <Receipt className="h-3.5 w-3.5" />
                  <span>Desglose Detallado de Gastos ({items.length})</span>
                </h4>
              </div>

              <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
                {items.map((item) => (
                  <div key={item.id} className="p-3.5 flex items-center justify-between text-xs sm:text-sm hover:bg-muted/20">
                    <div>
                      <div className="font-bold text-foreground">{item.description}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Gasto total: {formatDOP(item.amount_cents)}
                        {item.paid_by_name && (
                          <span> (Pagó: {item.paid_by_name})</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right font-black text-foreground">
                      {formatDOP(item.participant_owed_cents)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Note */}
          <div className="text-center pt-4 border-t border-border text-xs text-muted-foreground">
            <p>Este comprobante es inmutable y fue generado de manera criptográficamente segura por Serrucho 🪚🇩🇴</p>
            <p className="mt-1 font-semibold text-[11px]">Cuentas claras conservan amistades.</p>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <PaymentQRDialog
        open={qrOpen}
        onOpenChange={setQrOpen}
        title={serrucho.name}
        publicUrl={typeof window !== "undefined" ? window.location.href : ""}
        participantName={participant.name}
        amountFormatted={formatDOP(Math.abs(snapshot.balance_cents))}
        paymentInstructions={snapshot.payment_instructions}
      />
    </div>
  );
}
