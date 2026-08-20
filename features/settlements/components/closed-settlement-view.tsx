"use client";

import * as React from "react";
import {
  Lock,
  Copy,
  ExternalLink,
  CheckCircle2,
  Calendar,
  CreditCard,
  Mail,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { formatDOP } from "@/lib/finance/math";
import { SettlementSnapshot, Participant, NotificationLog } from "@/lib/types/domain";

interface ClosedSettlementViewProps {
  serruchoName: string;
  paymentInstructions: string | null;
  paymentDeadline: string | null;
  closedAt: string | null;
  snapshots: (SettlementSnapshot & {
    participant?: Participant;
    raw_token?: string;
    public_url?: string;
  })[];
  logs?: NotificationLog[];
}

export function ClosedSettlementView({
  serruchoName,
  paymentInstructions,
  paymentDeadline,
  closedAt,
  snapshots,
  logs = [],
}: ClosedSettlementViewProps) {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const copyToClipboard = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast({
      type: "success",
      title: "Enlace copiado",
      message: "Puedes enviarle este enlace directo al participante por WhatsApp o chat.",
    });
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Closed Banner */}
      <div className="rounded-2xl border border-emerald-300 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent p-5 sm:p-6 dark:border-emerald-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-extrabold text-foreground">
                  Serrucho Cerrado y Congelado
                </h3>
                <Badge variant="success" className="gap-1 font-bold">
                  <Lock className="h-3 w-3" />
                  Inmutable
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Cerrado el {closedAt ? new Date(closedAt).toLocaleDateString("es-DO") : "recientemente"}.
                Los resultados financieros no pueden ser alterados.
              </p>
            </div>
          </div>
        </div>

        {/* Payment info card */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-emerald-200/60 dark:border-emerald-900/60 text-xs">
          <div className="flex items-start gap-2 bg-background/80 p-3 rounded-xl border border-border">
            <CreditCard className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-foreground block">Instrucciones de Pago:</span>
              <p className="text-muted-foreground whitespace-pre-wrap mt-0.5">
                {paymentInstructions || "No se especificaron instrucciones"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-background/80 p-3 rounded-xl border border-border">
            <Calendar className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-foreground block">Fecha Límite de Pago:</span>
              <p className="text-muted-foreground mt-0.5">
                {paymentDeadline || "Sin fecha límite establecida"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Snapshots list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Estados de Cuenta de los Participantes</span>
            <Badge variant="outline" className="text-xs">
              {snapshots.length} snapshots generados
            </Badge>
          </CardTitle>
          <CardDescription>
            Cada participante cuenta con su enlace público seguro sin requerir registrarse.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {snapshots.map((snap) => {
            const isDebtor = snap.balance_cents < 0;
            const isCreditor = snap.balance_cents > 0;
            const isSettled = snap.balance_cents === 0;

            const name = snap.participant?.name || "Participante";
            const url = snap.public_url || (typeof window !== "undefined" ? `${window.location.origin}/s/${snap.raw_token || ""}` : "");

            return (
              <div
                key={snap.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-base text-foreground">{name}</h4>
                    {isCreditor && (
                      <Badge variant="success" className="text-[11px] font-bold">
                        Recibe {formatDOP(snap.balance_cents)}
                      </Badge>
                    )}
                    {isDebtor && (
                      <Badge variant="destructive" className="text-[11px] font-bold">
                        Debe {formatDOP(Math.abs(snap.balance_cents))}
                      </Badge>
                    )}
                    {isSettled && (
                      <Badge variant="secondary" className="text-[11px] font-bold">
                        Al día
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span>Pagó: <strong>{formatDOP(snap.paid_cents)}</strong></span>
                    <span>•</span>
                    <span>Corresponde: <strong>{formatDOP(snap.owed_cents)}</strong></span>
                    {snap.participant?.email && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {snap.participant.email}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(url, snap.id)}
                      className="gap-1.5 text-xs font-semibold"
                    >
                      {copiedId === snap.id ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copiar Link</span>
                        </>
                      )}
                    </Button>
                  )}

                  {url && (
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="secondary" className="gap-1.5 text-xs font-semibold">
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Ver Estado</span>
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
