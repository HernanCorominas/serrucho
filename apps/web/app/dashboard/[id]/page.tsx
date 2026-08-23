"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Lock,
  Users,
  Receipt,
  TrendingUp,
  Share2,
  Check,
  History,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { ParticipantList } from "@/features/participants/components/participant-list";
import { AddParticipantDialog } from "@/features/participants/components/add-participant-dialog";
import { ExpenseList } from "@/features/expenses/components/expense-list";
import { AddExpenseDialog } from "@/features/expenses/components/add-expense-dialog";
import { AddTransferDialog } from "@/features/transfers/components/add-transfer-dialog";
import { AddIncomeDialog } from "@/features/incomes/components/add-income-dialog";
import { ShareSerruchoDialog } from "@/features/serruchos/components/share-serrucho-dialog";
import { BalanceOverview } from "@/features/settlements/components/balance-overview";
import { CloseSerruchoWizard } from "@/features/settlements/components/close-serrucho-wizard";
import { ClosedSettlementView } from "@/features/settlements/components/closed-settlement-view";
import { ActivityFeed } from "@/features/activity/components/activity-feed";
import {
  Serrucho,
  Participant,
  ExpenseWithSplits,
  TransferWithParticipants,
  IncomeWithSplits,
  SettlementSnapshot,
  NotificationLog,
} from "@/lib/types/domain";
import { LiveSettlementData } from "@/features/settlements/service";
import { useRecentSerruchos } from "@/lib/hooks/use-recent-serruchos";

export default function SerruchoWorkspacePage() {
  const params = useParams();
  const { toast } = useToast();
  const { saveRecent } = useRecentSerruchos();
  const serruchoId = params?.id as string;

  const [loading, setLoading] = React.useState(true);
  const [serrucho, setSerrucho] = React.useState<Serrucho | null>(null);
  const [participants, setParticipants] = React.useState<Participant[]>([]);
  const [expenses, setExpenses] = React.useState<ExpenseWithSplits[]>([]);
  const [transfers, setTransfers] = React.useState<TransferWithParticipants[]>([]);
  const [incomes, setIncomes] = React.useState<IncomeWithSplits[]>([]);
  const [settlement, setSettlement] = React.useState<LiveSettlementData | null>(null);
  const [snapshots, setSnapshots] = React.useState<SettlementSnapshot[]>([]);
  const [logs, setLogs] = React.useState<NotificationLog[]>([]);

  // Dialogs
  const [addPartOpen, setAddPartOpen] = React.useState(false);
  const [addExpOpen, setAddExpOpen] = React.useState(false);
  const [addTransOpen, setAddTransOpen] = React.useState(false);
  const [addIncomeOpen, setAddIncomeOpen] = React.useState(false);
  const [shareOpen, setShareOpen] = React.useState(false);
  const [closeWizardOpen, setCloseWizardOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("balance");
  const [copiedLink, setCopiedLink] = React.useState(false);
  const [myParticipantId, setMyParticipantId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (serruchoId && typeof window !== "undefined") {
      const stored = localStorage.getItem(`serrucho_my_id_${serruchoId}`);
      if (stored) setMyParticipantId(stored);
    }
  }, [serruchoId]);

  const handleSelectMyIdentity = (pId: string | null) => {
    setMyParticipantId(pId);
    if (serruchoId && typeof window !== "undefined") {
      if (pId) {
        localStorage.setItem(`serrucho_my_id_${serruchoId}`, pId);
      } else {
        localStorage.removeItem(`serrucho_my_id_${serruchoId}`);
      }
    }
  };

  const loadData = React.useCallback(async () => {
    if (!serruchoId) return;
    try {
      setLoading(true);
      const [detailRes, settleRes, expRes, transRes, incRes] = await Promise.all([
        fetch(`/api/serruchos/${serruchoId}`),
        fetch(`/api/serruchos/${serruchoId}/settlement`),
        fetch(`/api/serruchos/${serruchoId}/expenses`),
        fetch(`/api/serruchos/${serruchoId}/transfers`),
        fetch(`/api/serruchos/${serruchoId}/incomes`),
      ]);

      if (!detailRes.ok) throw new Error("Serrucho no encontrado");

      const detailData = await detailRes.json();
      setSerrucho(detailData.serrucho);
      setParticipants(detailData.participants);
      setSnapshots(detailData.snapshots || []);
      setLogs(detailData.logs || []);

      if (detailData.serrucho) {
        saveRecent({
          id: detailData.serrucho.id,
          name: detailData.serrucho.name,
          description: detailData.serrucho.description,
          status: detailData.serrucho.status,
        });
      }

      if (settleRes.ok) {
        const settleData = await settleRes.json();
        setSettlement(settleData);
      }

      if (expRes.ok) {
        const expData = await expRes.json();
        setExpenses(expData);
      }

      if (transRes.ok) {
        const transData = await transRes.json();
        setTransfers(transData);
      }

      if (incRes.ok) {
        const incData = await incRes.json();
        setIncomes(incData);
      }
    } catch (err: any) {
      toast({ type: "error", message: err.message || "Error cargando serrucho" });
    } finally {
      setLoading(false);
    }
  }, [serruchoId, toast, saveRecent]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="container max-w-5xl mx-auto px-4 py-12 space-y-6">
        <div className="h-8 w-40 bg-muted/60 rounded-xl animate-pulse" />
        <div className="h-32 bg-muted/60 rounded-2xl animate-pulse" />
        <div className="h-64 bg-muted/60 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!serrucho) {
    return (
      <div className="container max-w-lg mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold">Serrucho no encontrado</h2>
        <Link href="/dashboard">
          <Button variant="outline">Volver a mis serruchos</Button>
        </Link>
      </div>
    );
  }

  const isClosed = serrucho.status === "CLOSED";
  const totalCents = expenses.reduce((sum, e) => sum + e.amount_cents, 0);

  return (
    <div className="container max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-foreground">
                {serrucho.name}
              </h1>
              <Badge
                variant={isClosed ? "destructive" : "success"}
                className="text-[10px] font-bold uppercase tracking-wider"
              >
                {isClosed ? "Cerrado" : "Abierto"}
              </Badge>
            </div>
            {serrucho.description && (
              <p className="text-xs text-muted-foreground mt-0.5 max-w-md line-clamp-1">
                {serrucho.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShareOpen(true)}
            className="gap-1.5 font-semibold text-xs"
          >
            <Share2 className="h-3.5 w-3.5 text-primary" />
            <span>Compartir</span>
          </Button>

          {!isClosed ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddPartOpen(true)}
                className="gap-1.5 font-semibold text-xs"
              >
                <Users className="h-3.5 w-3.5" />
                <span>+ Participante</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddIncomeOpen(true)}
                className="gap-1.5 font-semibold text-xs border-cyan-500/40 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/50"
                disabled={participants.length === 0}
              >
                <TrendingUp className="h-3.5 w-3.5 text-cyan-600" />
                <span>📥 Reembolso</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddTransOpen(true)}
                className="gap-1.5 font-semibold text-xs border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                disabled={participants.length < 2}
              >
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                <span>💸 Transferencia</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddExpOpen(true)}
                className="gap-1.5 font-semibold text-xs"
                disabled={participants.length === 0}
              >
                <Receipt className="h-3.5 w-3.5" />
                <span>+ Gasto</span>
              </Button>

              <Button
                size="sm"
                onClick={() => setCloseWizardOpen(true)}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs gap-1.5 shadow-sm"
                disabled={participants.length === 0}
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Cerrar Serrucho</span>
              </Button>
            </>
          ) : (
            <Badge variant="outline" className="text-xs font-bold py-1.5 px-3">
              Cuentas Inmutables
            </Badge>
          )}
        </div>
      </div>

      {/* Promo Banner for Web Guests */}
      <div className="rounded-2xl p-4 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 border border-orange-200 dark:border-orange-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📱</span>
          <div>
            <h4 className="font-extrabold text-sm text-foreground">
              ¿Quieres organizar tus propios viajes y coros?
            </h4>
            <p className="text-xs text-muted-foreground">
              Crea tu cuenta gratis o descarga la app de Serrucho en tu celular para tener siempre tus gastos al día.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link href="/" className="w-full sm:w-auto">
            <Button
              size="sm"
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-bold text-xs h-9 rounded-xl shadow-xs gap-1.5"
            >
              <span>Crear mi Serrucho ➔</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Guest Identity Selector */}
      {participants.length > 0 && (
        <Card className="bg-card/60 backdrop-blur-xs border-border/80 p-3.5 rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-base">👋</span>
              <span className="text-xs font-bold text-foreground">
                {myParticipantId
                  ? `Viendo como: ${participants.find((p) => p.id === myParticipantId)?.name || "Invitado"}`
                  : "¿Quién eres tú en este serrucho?"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                variant={myParticipantId === null ? "default" : "outline"}
                size="sm"
                onClick={() => handleSelectMyIdentity(null)}
                className="text-xs h-7 px-2.5 rounded-lg"
              >
                Ver todo el grupo
              </Button>
              {participants.map((p) => (
                <Button
                  key={p.id}
                  variant={myParticipantId === p.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSelectMyIdentity(p.id)}
                  className="text-xs h-7 px-2.5 rounded-lg font-medium"
                >
                  {p.name}
                </Button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Main Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full sm:w-auto h-auto p-1 gap-1">
          <TabsTrigger value="balance" className="gap-1.5">
            <TrendingUp className="h-4 w-4" />
            <span>Balances</span>
          </TabsTrigger>
          <TabsTrigger value="expenses" className="gap-1.5">
            <Receipt className="h-4 w-4" />
            <span>Gastos ({expenses.length})</span>
          </TabsTrigger>
          <TabsTrigger value="participants" className="gap-1.5">
            <Users className="h-4 w-4" />
            <span>Participantes ({participants.length})</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-1.5">
            <History className="h-4 w-4" />
            <span>Historial</span>
          </TabsTrigger>
          <TabsTrigger value="closure" className="gap-1.5">
            <Lock className="h-4 w-4" />
            <span>{isClosed ? "Liquidación" : "Cierre"}</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Balance Overview */}
        <TabsContent value="balance">
          {settlement && (
            <BalanceOverview
              participants={settlement.participants}
              expenses={expenses}
              totalExpensesCents={totalCents}
              serruchoName={serrucho.name}
              serruchoId={serrucho.id}
              paymentInstructions={serrucho.payment_instructions}
              currency={serrucho.currency}
              myParticipantId={myParticipantId}
              onAddExpenseClick={() => setAddExpOpen(true)}
              onSettled={loadData}
            />
          )}
        </TabsContent>

        {/* Tab 2: Expenses List */}
        <TabsContent value="expenses">
          <ExpenseList
            serruchoId={serrucho.id}
            isClosed={isClosed}
            expenses={expenses}
            participants={participants}
            transfers={transfers}
            incomes={incomes}
            onAddClick={() => setAddExpOpen(true)}
            onAddTransferClick={() => setAddTransOpen(true)}
            onAddIncomeClick={() => setAddIncomeOpen(true)}
            onExpenseDeleted={loadData}
            onTransferDeleted={loadData}
            onIncomeDeleted={loadData}
            onExpenseUpdated={loadData}
            onTransferUpdated={loadData}
            onIncomeUpdated={loadData}
          />
        </TabsContent>

        {/* Tab 3: Participants List */}
        <TabsContent value="participants">
          <ParticipantList
            serruchoId={serrucho.id}
            isClosed={isClosed}
            participants={participants}
            onAddClick={() => setAddPartOpen(true)}
            onParticipantDeleted={loadData}
          />
        </TabsContent>

        {/* Tab 4: Activity History */}
        <TabsContent value="activity">
          <ActivityFeed serruchoId={serrucho.id} />
        </TabsContent>

        {/* Tab 5: Closure & Snapshots */}
        <TabsContent value="closure">
          {isClosed ? (
            <ClosedSettlementView
              serruchoId={serrucho.id}
              serruchoName={serrucho.name}
              paymentInstructions={serrucho.payment_instructions}
              paymentDeadline={serrucho.payment_deadline}
              closedAt={serrucho.closed_at}
              snapshots={snapshots}
              expenses={expenses}
              logs={logs}
              onSnapshotUpdated={loadData}
            />
          ) : (
            <Card className="border-amber-200/80 bg-gradient-to-br from-amber-50/40 to-card dark:from-amber-950/20">
              <CardContent className="p-6 sm:p-8 text-center space-y-4">
                <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-600 mx-auto flex items-center justify-center font-bold">
                  <Lock className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-extrabold text-foreground">
                  Listo para cerrar y enviar estados de cuenta
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                  Al pulsar "Cerrar serrucho", se generarán estados de cuenta individuales con enlaces seguros e inmutables para cada participante con sus datos de pago.
                </p>
                <div className="pt-2">
                  <Button
                    size="lg"
                    onClick={() => setCloseWizardOpen(true)}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold gap-2 px-6 shadow-md"
                  >
                    <Lock className="h-4 w-4" />
                    <span>Iniciar Cierre del Serrucho</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Participant Dialog */}
      <AddParticipantDialog
        serruchoId={serrucho.id}
        open={addPartOpen}
        onOpenChange={setAddPartOpen}
        onParticipantAdded={loadData}
      />

      {/* Add Expense Dialog */}
      <AddExpenseDialog
        serruchoId={serrucho.id}
        participants={participants}
        open={addExpOpen}
        onOpenChange={setAddExpOpen}
        onExpenseAdded={loadData}
      />

      {/* Add Transfer Dialog */}
      <AddTransferDialog
        serruchoId={serrucho.id}
        participants={participants}
        open={addTransOpen}
        onOpenChange={setAddTransOpen}
        onTransferAdded={loadData}
      />

      {/* Add Income Dialog */}
      <AddIncomeDialog
        serruchoId={serrucho.id}
        participants={participants}
        open={addIncomeOpen}
        onOpenChange={setAddIncomeOpen}
        onIncomeAdded={loadData}
      />

      {/* Share Serrucho Dialog */}
      <ShareSerruchoDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        serruchoName={serrucho.name}
        serruchoId={serrucho.id}
      />

      {/* Close Serrucho Wizard Dialog */}
      {settlement && (
        <CloseSerruchoWizard
          serruchoId={serrucho.id}
          serruchoName={serrucho.name}
          participants={settlement.participants}
          totalExpensesCents={totalCents}
          open={closeWizardOpen}
          onOpenChange={setCloseWizardOpen}
          onClosed={async (result) => {
            await loadData();
            if (result?.snapshots) {
              setSnapshots(result.snapshots);
            }
            setActiveTab("closure");
          }}
        />
      )}
    </div>
  );
}
