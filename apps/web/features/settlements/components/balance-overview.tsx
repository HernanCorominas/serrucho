"use client";

import * as React from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  TrendingUp,
  Users,
  Share2,
  Receipt,
  PlusCircle,
  MessageCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDOP, buildWhatsAppShareUrl, generateSerruchoCollectionMessage } from "@serrucho/core";
import { ParticipantFinancials, Expense } from "@/lib/types/domain";
import { DebtSimplificationCard } from "./debt-simplification-card";
import { CategoryBreakdownCard } from "./category-breakdown-card";
import { GroupSummaryDialog } from "./group-summary-dialog";
import { CollectionProgressRing } from "@/components/collection-progress";



interface BalanceOverviewProps {
  participants: ParticipantFinancials[];
  expenses?: Expense[];
  totalExpensesCents: number;
  serruchoName?: string;
  serruchoId?: string;
  paymentInstructions?: string | null;
  currency?: string;
  myParticipantId?: string | null;
  isReadOnly?: boolean;
  onAddExpenseClick?: () => void;
  onSettled?: () => void;
}

export function BalanceOverview({
  participants,
  expenses = [],
  totalExpensesCents,
  serruchoName = "Serrucho",
  serruchoId,
  paymentInstructions,
  myParticipantId,
  isReadOnly = false,
  onAddExpenseClick,
  onSettled,
}: BalanceOverviewProps) {
  const [summaryOpen, setSummaryOpen] = React.useState(false);

  const creditors = participants.filter((p) => p.net_balance_cents > 0);
  const debtors = participants.filter((p) => p.net_balance_cents < 0);

  // My Personal Financial Status (5-second clarity)
  const myFinancials = myParticipantId
    ? participants.find((p) => p.id === myParticipantId)
    : null;

  return (
    <div className="space-y-6">
      {/* My Personal Status Hero Card (5-Second Financial Clarity) */}
      {myFinancials && (
        <Card
          className={`p-5 rounded-2xl border-2 transition-all duration-300 shadow-sm ${
            myFinancials.net_balance_cents > 0
              ? "bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 border-emerald-500/40 dark:border-emerald-500/30"
              : myFinancials.net_balance_cents < 0
              ? "bg-gradient-to-r from-red-500/15 via-amber-500/10 to-red-500/15 border-red-500/40 dark:border-red-500/30"
              : "bg-gradient-to-r from-blue-500/15 via-sky-500/10 to-blue-500/15 border-blue-500/40 dark:border-blue-500/30"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Tu Estado Personal
                </span>
                <Badge
                  variant={
                    myFinancials.net_balance_cents > 0
                      ? "success"
                      : myFinancials.net_balance_cents < 0
                      ? "destructive"
                      : "secondary"
                  }
                  className="font-bold text-xs"
                >
                  {myFinancials.net_balance_cents > 0
                    ? "A TU FAVOR"
                    : myFinancials.net_balance_cents < 0
                    ? "TIENES QUE PAGAR"
                    : "ESTÁS AL DÍA"}
                </Badge>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-foreground">
                {myFinancials.net_balance_cents > 0 ? (
                  <span className="text-emerald-700 dark:text-emerald-400">
                    Te deben {formatDOP(myFinancials.net_balance_cents)} 🎉
                  </span>
                ) : myFinancials.net_balance_cents < 0 ? (
                  <span className="text-red-700 dark:text-red-400">
                    Te toca transferir {formatDOP(Math.abs(myFinancials.net_balance_cents))} ⚠️
                  </span>
                ) : (
                  <span className="text-blue-700 dark:text-blue-400">
                    ¡Estás a mano! No debes ni te deben ✨
                  </span>
                )}
              </h3>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                <span>
                  Pagaste en total: <strong className="text-foreground">{formatDOP(myFinancials.total_paid_cents)}</strong>
                </span>
                <span>•</span>
                <span>
                  Tu consumo en gastos: <strong className="text-foreground">{formatDOP(myFinancials.total_owed_cents)}</strong>
                </span>
              </div>
            </div>

            {onAddExpenseClick && (
              <Button
                size="sm"
                onClick={onAddExpenseClick}
                className="bg-primary hover:bg-primary/90 text-white font-bold text-xs gap-1.5 h-10 px-4 rounded-xl shrink-0"
              >
                <PlusCircle className="h-4 w-4" />
                <span>+ Agregar lo que pagué</span>
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Collection Progress Ring — shown when there are debtors */}
      {participants.length > 0 && (
        <CollectionProgressRing
          participants={participants}
          totalExpensesCents={totalExpensesCents}
          serruchoName={serruchoName}
        />
      )}

      {/* Top summary metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="border-purple-200/60 bg-gradient-to-br from-purple-50/70 to-card dark:from-purple-950/20 dark:border-purple-900/40">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-purple-900/70 dark:text-purple-300 uppercase tracking-wider">
                Total del Serrucho
              </span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
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

      {/* Suggested Simplified Transfers Card */}
      {participants.length > 0 && (
        <DebtSimplificationCard
          participants={participants}
          serruchoName={serruchoName}
          serruchoId={serruchoId}
          paymentInstructions={paymentInstructions}
          isReadOnly={isReadOnly}
          onSettled={onSettled}
        />
      )}

      {/* Category Breakdown Card */}

      {expenses.length > 0 && <CategoryBreakdownCard expenses={expenses} />}

      {/* Detailed Participant Balances Grid */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span>Balances por Participante</span>
              </CardTitle>
              <CardDescription>
                Resumen instantáneo de quién pagó, cuánto le toca y saldo neto
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSummaryOpen(true)}
                className="gap-1.5 text-xs font-bold"
              >
                <Share2 className="h-3.5 w-3.5 text-primary" />
                <span>Compartir / Exportar</span>
              </Button>
              <Badge variant="outline" className="font-bold">
                {participants.length} participantes
              </Badge>
            </div>
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

                const debtorMsg = isDebtor
                  ? generateSerruchoCollectionMessage({
                      serruchoName,
                      debtorName: p.name,
                      amountFormatted: formatDOP(Math.abs(p.net_balance_cents)),
                      paymentInstructions,
                    })
                  : "";

                const waUrl = isDebtor ? buildWhatsAppShareUrl(debtorMsg, p.phone) : "";

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
                          {p.phone ? `📱 ${p.phone}` : p.email ? `✉️ ${p.email}` : "Sin contacto directo"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isCreditor && (
                          <Badge variant="success" className="gap-1 font-bold text-xs">
                            <ArrowUpRight className="h-3 w-3" />
                            Debe Recibir
                          </Badge>
                        )}
                        {isDebtor && (
                          <>
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-xs transition-colors"
                              title={`Cobrar ${formatDOP(Math.abs(p.net_balance_cents))} a ${p.name} por WhatsApp`}
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              <span>Cobrar</span>
                            </a>
                            <Badge variant="destructive" className="gap-1 font-bold text-xs">
                              <ArrowDownRight className="h-3 w-3" />
                              Debe Pagar
                            </Badge>
                          </>
                        )}
                        {isSettled && (
                          <Badge variant="secondary" className="gap-1 font-bold text-xs">
                            <CheckCircle2 className="h-3 w-3 text-muted-foreground" />
                            Al día
                          </Badge>
                        )}
                      </div>
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

      {/* Group Summary & Export Dialog */}
      <GroupSummaryDialog
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
        serruchoName={serruchoName}
        totalExpensesCents={totalExpensesCents}
        participants={participants}
        expenses={expenses}
      />
    </div>
  );
}
