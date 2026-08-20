"use client";

import * as React from "react";
import {
  Printer,
  Share2,
  CheckCircle2,
  AlertCircle,
  Clock,
  CreditCard,
  Receipt,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { formatDOP } from "@/lib/finance/math";
import { PublicSettlementReceipt } from "@/lib/types/domain";

interface PublicReceiptCardProps {
  receipt: PublicSettlementReceipt;
}

export function PublicReceiptCard({ receipt }: PublicReceiptCardProps) {
  const { toast } = useToast();
  const { snapshot, participant, serrucho, items } = receipt;

  const isDebtor = snapshot.balance_cents < 0;
  const isCreditor = snapshot.balance_cents > 0;
  const isSettled = snapshot.balance_cents === 0;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Action bar for printing & sharing */}
      <div className="flex items-center justify-between no-print px-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Comprobante Oficial Seguro</span>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Main Printable Card */}
      <Card className="border-2 border-border shadow-xl overflow-hidden rounded-3xl bg-card">
        {/* Top Brand Banner */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 text-white p-6 sm:p-8 text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-white/20 backdrop-blur mb-2 font-black text-2xl">
            🪚
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">SERRUCHO</h1>
          <p className="text-xs sm:text-sm text-orange-100 font-semibold uppercase tracking-wider mt-0.5">
            Estado de Cuenta Individual
          </p>
        </div>

        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Header Info */}
          <div className="border-b border-border pb-5 space-y-1">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Actividad / Viaje</span>
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight">{serrucho.name}</h2>
            {serrucho.description && (
              <p className="text-xs sm:text-sm text-muted-foreground">{serrucho.description}</p>
            )}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2">
              {serrucho.event_date && <span>📅 <strong>Fecha:</strong> {serrucho.event_date}</span>}
              {serrucho.closed_at && (
                <span>🔒 <strong>Cerrado:</strong> {new Date(serrucho.closed_at).toLocaleDateString("es-DO")}</span>
              )}
            </div>
          </div>

          {/* Participant Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-muted/40 border border-border gap-2">
            <div>
              <span className="text-xs font-bold text-muted-foreground uppercase">Participante</span>
              <h3 className="text-lg font-black text-foreground">{participant.name}</h3>
              {participant.email && (
                <span className="text-xs text-muted-foreground">{participant.email}</span>
              )}
            </div>
            <Badge variant="outline" className="self-start sm:self-center font-bold text-xs py-1">
              Moneda: {serrucho.currency} (RD$)
            </Badge>
          </div>

          {/* Primary Balance Result Box */}
          <div
            className={`rounded-2xl p-6 text-center border-2 transition-all ${
              isDebtor
                ? "bg-red-50/80 border-red-300 dark:bg-red-950/40 dark:border-red-800"
                : isCreditor
                ? "bg-emerald-50/80 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800"
                : "bg-muted border-border"
            }`}
          >
            <span
              className={`text-xs uppercase font-extrabold tracking-wider block mb-1 ${
                isDebtor ? "text-red-700 dark:text-red-300" : isCreditor ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground"
              }`}
            >
              {isDebtor
                ? "Monto Pendiente de Pago"
                : isCreditor
                ? "Monto a tu Favor (Debes Recibir)"
                : "Estado de Cuenta"}
            </span>

            <div
              className={`text-4xl sm:text-5xl font-black tracking-tight my-2 ${
                isDebtor ? "text-red-600 dark:text-red-400" : isCreditor ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
              }`}
            >
              {formatDOP(Math.abs(snapshot.balance_cents))}
            </div>

            <p className="text-xs font-semibold text-muted-foreground max-w-md mx-auto">
              {isDebtor
                ? "Por favor realiza la transferencia antes de la fecha límite indicada por el organizador."
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

          {/* Payment Instructions (If Debtor) */}
          {snapshot.payment_instructions && (
            <div className="rounded-2xl border border-amber-300/80 bg-amber-50/70 dark:bg-amber-950/30 dark:border-amber-800 p-5 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-sm">
                <CreditCard className="h-4 w-4 text-amber-600" />
                <span>¿Cómo y dónde pagar?</span>
              </div>
              <p className="text-xs sm:text-sm text-amber-950 dark:text-amber-100 whitespace-pre-wrap font-medium">
                {snapshot.payment_instructions}
              </p>
              {snapshot.payment_deadline && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 pt-2 border-t border-amber-200/80 dark:border-amber-900">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Fecha Límite: {snapshot.payment_deadline}</span>
                </div>
              )}
            </div>
          )}

          {/* Itemized Expenses List */}
          {items.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs uppercase font-extrabold text-muted-foreground tracking-wider flex items-center gap-1.5">
                <Receipt className="h-3.5 w-3.5 text-primary" />
                <span>Detalle de Gastos en que Participaste ({items.length})</span>
              </h4>

              <div className="rounded-2xl border border-border overflow-hidden divide-y divide-border text-xs">
                {items.map((item) => (
                  <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-muted/20 transition-colors">
                    <div>
                      <span className="font-bold text-foreground block text-sm">{item.description}</span>
                      <span className="text-muted-foreground text-[11px]">
                        Pagado por <strong>{item.paid_by_name}</strong> (Total gasto: {formatDOP(item.amount_cents)})
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">Tu Parte</span>
                      <span className="font-extrabold text-sm text-foreground">
                        {formatDOP(item.participant_owed_cents)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-center pt-4 text-[11px] text-muted-foreground border-t border-border">
            🪚 Serrucho · Cuentas claras conservan amistades 🇩🇴
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
