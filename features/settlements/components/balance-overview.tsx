"use client";

import * as React from "react";
import { ArrowDownRight, ArrowUpRight, CheckCircle2, TrendingUp, Users, DollarSign } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDOP } from "@/lib/finance/math";
import { ParticipantFinancials } from "@/lib/types/domain";

interface BalanceOverviewProps {
  participants: ParticipantFinancials[];
  totalExpensesCents: number;
  currency?: string;
}

export function BalanceOverview({
  participants,
  totalExpensesCents,
  currency = "DOP",
}: BalanceOverviewProps) {
  const creditors = participants.filter((p) => p.net_balance_cents > 0);
  const debtors = participants.filter((p) => p.net_balance_cents < 0);
  const settled = participants.filter((p) => p.net_balance_cents === 0);

  return (
    <div className="space-y-6">
      {/* Top summary metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="border-orange-200/60 bg-gradient-to-br from-orange-50/70 to-card dark:from-orange-950/20 dark:border-orange-900/40">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-orange-900/70 dark:text-orange-300 uppercase tracking-wider">
                Total del Serrucho
              </span>
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {formatDOP(totalExpensesCents)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Gastos acumulados hasta el momento</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200/60 bg-gradient-to-br from-emerald-50/70 to-card dark:from-emerald-950/20 dark:border-emerald-900/40">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-900/70 dark:text-emerald-300 uppercase tracking-wider">
                Por Cobrar (A favor)
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 tracking-tight">
              {creditors.length} {creditors.length === 1 ? "persona" : "personas"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Pagaron más de lo que les tocaba</p>
          </CardContent>
        </Card>

        <Card className="border-red-200/60 bg-gradient-to-br from-red-50/70 to-card dark:from-red-950/20 dark:border-red-900/40">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-red-900/70 dark:text-red-300 uppercase tracking-wider">
                Por Pagar (Pendientes)
              </span>
              <div className="p-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
                <ArrowDownRight className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-red-700 dark:text-red-400 tracking-tight">
              {debtors.length} {debtors.length === 1 ? "persona" : "personas"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Deben transferir su parte</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Participant Balances Grid */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span>Balances por Participante</span>
              </CardTitle>
              <CardDescription>
                Resumen instantáneo de quién pagó, cuánto le toca y saldo neto
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-bold">
              {participants.length} participantes
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {participants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Agrega participantes para ver los balances
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {participants.map((p) => {
                const isCreditor = p.net_balance_cents > 0;
                const isDebtor = p.net_balance_cents < 0;
                const isSettled = p.net_balance_cents === 0;

                return (
                  <div
                    key={p.id}
                    className={`rounded-xl border p-4 transition-all duration-200 ${
                      isCreditor
                        ? "border-emerald-200/80 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-900/50"
                        : isDebtor
                        ? "border-red-200/80 bg-red-50/40 dark:bg-red-950/20 dark:border-red-900/50"
                        : "border-border bg-card"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-base text-foreground leading-tight">
                          {p.name}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          {p.email || p.phone || "Sin contacto directo"}
                        </span>
                      </div>

                      {isCreditor && (
                        <Badge variant="success" className="gap-1 font-bold text-xs">
                          <ArrowUpRight className="h-3 w-3" />
                          Debe Recibir
                        </Badge>
                      )}
                      {isDebtor && (
                        <Badge variant="destructive" className="gap-1 font-bold text-xs">
                          <ArrowDownRight className="h-3 w-3" />
                          Debe Pagar
                        </Badge>
                      )}
                      {isSettled && (
                        <Badge variant="secondary" className="gap-1 font-bold text-xs">
                          <CheckCircle2 className="h-3 w-3 text-muted-foreground" />
                          Al día
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/60 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Pagó</span>
                        <span className="font-semibold text-foreground">
                          {formatDOP(p.total_paid_cents)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Le toca</span>
                        <span className="font-semibold text-foreground">
                          {formatDOP(p.total_owed_cents)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-muted-foreground block text-[11px]">Balance</span>
                        <span
                          className={`font-black text-sm ${
                            isCreditor
                              ? "text-emerald-600 dark:text-emerald-400"
                              : isDebtor
                              ? "text-red-600 dark:text-red-400"
                              : "text-muted-foreground"
                          }`}
                        >
                          {formatDOP(p.net_balance_cents, true)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
