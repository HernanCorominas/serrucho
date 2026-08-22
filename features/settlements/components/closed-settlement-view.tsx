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
  ShieldCheck,
  MessageCircle,
  Share2,
  Check,
  QrCode,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { formatDOP, generateWhatsAppDirectLink, calculateCategoryTotals } from "@/lib/finance/math";
import { SettlementSnapshot, Participant, NotificationLog, Expense, CATEGORY_INFO } from "@/lib/types/domain";
import { DebtSimplificationCard } from "./debt-simplification-card";
import { GroupSummaryDialog } from "./group-summary-dialog";
import { CoroAwardsCard } from "./coro-awards-card";
import { PaymentQRDialog } from "./payment-qr-dialog";
import { ShareableStoryDialog } from "./shareable-story-dialog";
import { hapticLight, hapticSuccess, hapticImpact } from "@/lib/utils/haptics";

interface ClosedSettlementViewProps {
  serruchoId?: string;
  serruchoName: string;
  paymentInstructions: string | null;
  paymentDeadline: string | null;
  closedAt: string | null;
  snapshots: (SettlementSnapshot & {
    participant?: Participant;
    raw_token?: string;
    public_url?: string;
  })[];
  expenses?: Expense[];
  logs?: NotificationLog[];
  onSnapshotUpdated?: () => void;
}

export function ClosedSettlementView({
  serruchoId,
  serruchoName,
  paymentInstructions,
  paymentDeadline,
  closedAt,
  snapshots,
  expenses = [],
  logs = [],
  onSnapshotUpdated,
}: ClosedSettlementViewProps) {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = React.useState(false);
  const [storyOpen, setStoryOpen] = React.useState(false);
  const [qrOpen, setQrOpen] = React.useState(false);
  const [selectedQrSnap, setSelectedQrSnap] = React.useState<{
    url: string;
    name: string;
    amount: string;
  } | null>(null);

  const [localSnapshots, setLocalSnapshots] = React.useState(snapshots);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLocalSnapshots(snapshots);
  }, [snapshots]);

  const copyToClipboard = (url: string, id: string) => {
    hapticLight();
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast({
      type: "success",
      title: "Enlace copiado",
      message: "Puedes enviarle este enlace directo al participante por WhatsApp o chat.",
    });
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleTogglePaid = async (snapId: string, currentStatus: boolean) => {
    if (!serruchoId) return;

    try {
      hapticImpact();
      setUpdatingId(snapId);
      const nextStatus = !currentStatus;

      // Optimistic update
      setLocalSnapshots((prev) =>
        prev.map((s) => (s.id === snapId ? { ...s, is_paid: nextStatus } : s))
      );

      const res = await fetch(`/api/serruchos/${serruchoId}/snapshots/${snapId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_paid: nextStatus }),
      });

      if (!res.ok) {
        throw new Error("No se pudo actualizar el estado de pago");
      }

      toast({
        type: "success",
        title: nextStatus ? "Pago confirmado ✅" : "Pago marcado como pendiente ⏳",
        message: nextStatus
          ? "El comprobante del participante ahora muestra el sello de pago confirmado."
          : "Se ha restablecido el estado a pendiente.",
      });

      if (onSnapshotUpdated) onSnapshotUpdated();
    } catch (err: any) {
      toast({ type: "error", message: err.message });
      // Rollback
      setLocalSnapshots(snapshots);
    } finally {
      setUpdatingId(null);
    }
  };

  const openQrForParticipant = (url: string, name: string, amount: string) => {
    hapticLight();
    setSelectedQrSnap({ url, name, amount });
    setQrOpen(true);
  };

  // Calculate Debt Collection Progress
  const debtors = localSnapshots.filter((s) => s.balance_cents < 0);
  const totalDebtCents = debtors.reduce((sum, s) => sum + Math.abs(s.balance_cents), 0);
  const collectedCents = debtors
    .filter((s) => s.is_paid)
    .reduce((sum, s) => sum + Math.abs(s.balance_cents), 0);

  const collectionPercent =
    totalDebtCents > 0 ? Math.round((collectedCents / totalDebtCents) * 100) : 100;

  // Convert snapshots to ParticipantFinancials format for calculation and components
  const participantFinancials = React.useMemo(() => {
    return localSnapshots.map((s) => ({
      id: s.participant_id,
      serrucho_id: s.serrucho_id,
      name: s.participant?.name || "Participante",
      email: s.participant?.email || null,
      phone: s.participant?.phone || null,
      preferred_channel: s.participant?.preferred_channel || "EMAIL",
      total_paid_cents: s.paid_cents,
      total_owed_cents: s.owed_cents,
      net_balance_cents: s.balance_cents,
      created_at: s.created_at,
      updated_at: s.created_at,
    }));
  }, [localSnapshots]);

  const totalExpensesCents = localSnapshots.length > 0 ? localSnapshots[0].total_expenses_cents : 0;

  const categoryBreakdown = React.useMemo(() => {
    const totals = calculateCategoryTotals(expenses);
    return totals.map((t) => ({
      label: CATEGORY_INFO[t.category]?.label || "Otro",
      emoji: CATEGORY_INFO[t.category]?.emoji || "📦",
      amount_cents: t.total_cents,
    }));
  }, [expenses]);

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

          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                hapticLight();
                setStoryOpen(true);
              }}
              className="gap-1.5 font-bold bg-background/80 hover:border-orange-400"
            >
              <Sparkles className="h-4 w-4 text-orange-500" />
              <span>Crear Story 📱</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                hapticLight();
                setSummaryOpen(true);
              }}
              className="gap-1.5 font-bold bg-background/80"
            >
              <Share2 className="h-4 w-4 text-primary" />
              <span>Compartir Resumen</span>
            </Button>
          </div>
        </div>

        {/* Collection Progress Bar */}
        {debtors.length > 0 && (
          <div className="mt-4 p-4 rounded-xl bg-background/90 border border-border shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">Progreso de Recaudación:</span>
                <Badge
                  variant={collectionPercent === 100 ? "success" : "secondary"}
                  className="text-[10px] font-extrabold"
                >
                  {collectionPercent === 100 ? "¡100% Cobrado! 🎉" : `${collectionPercent}% Recaudado`}
                </Badge>
              </div>
              <span className="font-extrabold text-foreground">
                {formatDOP(collectedCents)} de {formatDOP(totalDebtCents)}
              </span>
            </div>

            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                style={{ width: `${collectionPercent}%` }}
              />
            </div>
          </div>
        )}

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

      {/* Coro Gamification Awards */}
      <CoroAwardsCard
        participants={participantFinancials}
        expenses={expenses}
      />

      {/* Suggested Min-Cash-Flow Transfers */}
      <DebtSimplificationCard
        participants={participantFinancials}
        serruchoName={serruchoName}
        paymentInstructions={paymentInstructions}
      />

      {/* Snapshots list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Estados de Cuenta de los Participantes</span>
            <Badge variant="outline" className="text-xs">
              {localSnapshots.length} snapshots generados
            </Badge>
          </CardTitle>
          <CardDescription>
            Cada participante cuenta con su enlace público seguro sin requerir registrarse.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {localSnapshots.map((snap) => {
            const isDebtor = snap.balance_cents < 0;
            const isCreditor = snap.balance_cents > 0;
            const isSettled = snap.balance_cents === 0;

            const name = snap.participant?.name || "Participante";
            const url =
              snap.public_url ||
              (typeof window !== "undefined"
                ? `${window.location.origin}/s/${snap.raw_token || ""}`
                : "");

            const waDirectUrl = generateWhatsAppDirectLink({
              phone: snap.participant?.phone,
              serruchoName,
              participantName: name,
              balanceCents: snap.balance_cents,
              publicUrl: url,
              paymentInstructions,
            });

            return (
              <div
                key={snap.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-colors gap-3 ${
                  snap.is_paid
                    ? "border-emerald-300 bg-emerald-50/20 dark:border-emerald-900/60"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
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

                    {isDebtor && snap.is_paid && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-bold">
                        <Check className="h-3 w-3" />
                        Transferencia Recibida
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span>
                      Pagó: <strong>{formatDOP(snap.paid_cents)}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Corresponde: <strong>{formatDOP(snap.owed_cents)}</strong>
                    </span>
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

                <div className="flex items-center gap-2 flex-wrap self-end sm:self-center">
                  {/* Mark as paid toggle for debtors */}
                  {isDebtor && serruchoId && (
                    <Button
                      variant={snap.is_paid ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleTogglePaid(snap.id, Boolean(snap.is_paid))}
                      disabled={updatingId === snap.id}
                      className={`text-xs font-bold gap-1 ${
                        snap.is_paid
                          ? "border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white"
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{snap.is_paid ? "Pagado ✓" : "Marcar Pagado"}</span>
                    </Button>
                  )}

                  {/* QR Code button */}
                  {url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        openQrForParticipant(url, name, formatDOP(Math.abs(snap.balance_cents)))
                      }
                      className="gap-1 text-xs font-semibold"
                      title="Ver Código QR para escanear"
                    >
                      <QrCode className="h-3.5 w-3.5 text-foreground" />
                      <span className="hidden xs:inline">QR</span>
                    </Button>
                  )}

                  {/* 1-Click WhatsApp Debt Collection */}
                  {url && (
                    <a href={waDirectUrl} target="_blank" rel="noopener noreferrer">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950"
                        title="Abrir chat de WhatsApp con cobro directo"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>WhatsApp</span>
                      </Button>
                    </a>
                  )}

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
                          <span>Copiar</span>
                        </>
                      )}
                    </Button>
                  )}

                  {url && (
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="secondary" className="gap-1.5 text-xs font-semibold">
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Ver Comprobante</span>
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Group Summary Dialog */}
      <GroupSummaryDialog
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
        serruchoName={serruchoName}
        totalExpensesCents={totalExpensesCents}
        participants={participantFinancials}
        expenses={expenses}
        closedAt={closedAt}
      />

      {/* Shareable Story Generator Dialog */}
      <ShareableStoryDialog
        open={storyOpen}
        onOpenChange={setStoryOpen}
        serruchoName={serruchoName}
        totalExpensesCents={totalExpensesCents}
        participantsCount={participantFinancials.length}
        expensesCount={expenses.length}
        categoriesBreakdown={categoryBreakdown}
      />

      {/* QR Code Dialog */}
      {selectedQrSnap && (
        <PaymentQRDialog
          open={qrOpen}
          onOpenChange={setQrOpen}
          title={serruchoName}
          publicUrl={selectedQrSnap.url}
          participantName={selectedQrSnap.name}
          amountFormatted={selectedQrSnap.amount}
          paymentInstructions={paymentInstructions}
        />
      )}
    </div>
  );
}
