"use client";

import * as React from "react";
import { ArrowRight, Sparkles, CheckCircle2, MessageCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDOP, simplifyDebts } from "@/lib/finance/math";
import { ParticipantFinancials } from "@/lib/types/domain";

interface DebtSimplificationCardProps {
  participants: ParticipantFinancials[];
  currency?: string;
  serruchoName?: string;
  paymentInstructions?: string | null;
}

export function DebtSimplificationCard({
  participants,
  serruchoName = "Serrucho",
}: DebtSimplificationCardProps) {
  const transfers = React.useMemo(() => {
    return simplifyDebts(participants, participants);
  }, [participants]);

  const totalTransferredCents = transfers.reduce((sum, t) => sum + t.amount_cents, 0);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <span>Menos Transferencias</span>
                <Badge variant="default" className="text-[10px] font-extrabold uppercase tracking-wider">
                  Algoritmo Óptimo
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Resuelve todas las deudas del coro con el menor número de transferencias posibles.
              </CardDescription>
            </div>
          </div>

          {transfers.length > 0 && (
            <div className="text-left sm:text-right">
              <span className="text-[11px] text-muted-foreground block">Monto a liquidar</span>
              <span className="text-sm font-extrabold text-foreground">{formatDOP(totalTransferredCents)}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {transfers.length === 0 ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <p className="font-medium">
              ¡No se requieren transferencias! Todos los participantes están al día con sus gastos.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {transfers.map((t, idx) => {
              const shareMsg = encodeURIComponent(
                `¡Dímelo ${t.from_name}! 🌴 En el serrucho *${serruchoName}* te corresponde transferirle *${formatDOP(
                  t.amount_cents
                )}* a *${t.to_name}*.`
              );
              const waUrl = `https://wa.me/?text=${shareMsg}`;

              return (
                <div
                  key={`${t.from_participant_id}-${t.to_participant_id}-${idx}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-3.5 rounded-xl border border-border bg-card/90 hover:border-primary/30 transition-all gap-3"
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-xs sm:text-sm">
                    {/* Debtor */}
                    <div className="flex items-center gap-1.5 font-bold text-foreground">
                      <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                      <span>{t.from_name}</span>
                    </div>

                    <div className="flex items-center gap-1 text-muted-foreground text-xs px-1.5 py-0.5 rounded-md bg-muted">
                      <span>le transfiere a</span>
                      <ArrowRight className="h-3 w-3 text-primary" />
                    </div>

                    {/* Creditor */}
                    <div className="flex items-center gap-1.5 font-bold text-foreground">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                      <span>{t.to_name}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                    <span className="text-sm sm:text-base font-extrabold text-primary">
                      {formatDOP(t.amount_cents)}
                    </span>

                    <a href={waUrl} target="_blank" rel="noopener noreferrer">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2.5 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 gap-1"
                        title="Avisar por WhatsApp"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Avisar</span>
                      </Button>
                    </a>
                  </div>
                </div>
              );
            })}

            <p className="text-[11px] text-muted-foreground text-center pt-1">
              ✨ Con este esquema se realizan solo <strong>{transfers.length}</strong> {transfers.length === 1 ? "transferencia" : "transferencias"} en lugar de hacer cobros cruzados individuales.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
