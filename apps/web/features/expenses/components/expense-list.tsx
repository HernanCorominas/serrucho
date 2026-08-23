"use client";

import * as React from "react";
import {
  Receipt,
  Trash2,
  Pencil,
  PlusCircle,
  Calendar,
  UserCheck,
  Search,
  Filter,
  ArrowRightLeft,
  CreditCard,
  Download,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { formatDOP } from "@/lib/finance/math";
import {
  Participant,
  ExpenseWithSplits,
  ExpenseCategory,
  CATEGORY_INFO,
  TransferWithParticipants,
  IncomeWithSplits,
  IncomeCategory,
  INCOME_CATEGORY_INFO,
} from "@/lib/types/domain";
import { EditExpenseDialog } from "./edit-expense-dialog";
import { EditTransferDialog } from "@/features/transfers/components/edit-transfer-dialog";
import { EditIncomeDialog } from "@/features/incomes/components/edit-income-dialog";

interface ExpenseListProps {
  serruchoId: string;
  isClosed: boolean;
  expenses: ExpenseWithSplits[];
  participants?: Participant[];
  transfers?: TransferWithParticipants[];
  incomes?: IncomeWithSplits[];
  onAddClick: () => void;
  onAddTransferClick?: () => void;
  onAddIncomeClick?: () => void;
  onExpenseDeleted: () => void;
  onTransferDeleted?: () => void;
  onIncomeDeleted?: () => void;
  onExpenseUpdated?: () => void;
  onTransferUpdated?: () => void;
  onIncomeUpdated?: () => void;
}

export function ExpenseList({
  serruchoId,
  isClosed,
  expenses,
  participants = [],
  transfers = [],
  incomes = [],
  onAddClick,
  onAddTransferClick,
  onAddIncomeClick,
  onExpenseDeleted,
  onTransferDeleted,
  onIncomeDeleted,
  onExpenseUpdated,
  onTransferUpdated,
  onIncomeUpdated,
}: ExpenseListProps) {
  const { toast } = useToast();
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");
  const [movementType, setMovementType] = React.useState<"ALL" | "EXPENSES" | "TRANSFERS" | "INCOMES">("ALL");

  // Edit states
  const [editingExpense, setEditingExpense] = React.useState<ExpenseWithSplits | null>(null);
  const [editExpenseOpen, setEditExpenseOpen] = React.useState(false);

  const [editingTransfer, setEditingTransfer] = React.useState<TransferWithParticipants | null>(null);
  const [editTransferOpen, setEditTransferOpen] = React.useState(false);

  const [editingIncome, setEditingIncome] = React.useState<IncomeWithSplits | null>(null);
  const [editIncomeOpen, setEditIncomeOpen] = React.useState(false);

  const handleDeleteIncome = async (id: string, description: string) => {
    if (!confirm(`¿Estás seguro de eliminar el ingreso "${description}"?`)) {
      return;
    }

    try {
      setDeletingId(id);
      const res = await fetch(`/api/serruchos/${serruchoId}/incomes/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "No se pudo eliminar el ingreso");
      }

      toast({
        type: "success",
        title: "Ingreso eliminado",
        message: `Se ha borrado "${description}" del serrucho.`,
      });
      if (onIncomeDeleted) onIncomeDeleted();
    } catch (err: any) {
      toast({ type: "error", message: err.message });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteTransfer = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta transferencia?")) {
      return;
    }

    try {
      setDeletingId(id);
      const res = await fetch(`/api/serruchos/${serruchoId}/transfers/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "No se pudo eliminar la transferencia");
      }

      toast({
        type: "success",
        title: "Transferencia eliminada",
        message: "El movimiento ha sido eliminado del serrucho.",
      });
      if (onTransferDeleted) onTransferDeleted();
    } catch (err: any) {
      toast({ type: "error", message: err.message });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDelete = async (id: string, description: string) => {
    if (!confirm(`¿Estás seguro de eliminar el gasto "${description}"?`)) {
      return;
    }

    try {
      setDeletingId(id);
      const res = await fetch(`/api/serruchos/${serruchoId}/expenses/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "No se pudo eliminar el gasto");
      }

      toast({
        type: "success",
        title: "Gasto eliminado",
        message: `Se ha borrado "${description}" del serrucho.`,
      });
      onExpenseDeleted();
    } catch (err: any) {
      toast({ type: "error", message: err.message });
    } finally {
      setDeletingId(null);
    }
  };

  // Filter expenses, transfers and incomes based on search, category and movement type
  const filteredExpenses = React.useMemo(() => {
    if (movementType === "TRANSFERS" || movementType === "INCOMES") return [];
    return expenses.filter((exp) => {
      const matchesSearch =
        exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.paid_by_name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        selectedCategory === "ALL" || (exp.category || "OTHER") === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [expenses, searchQuery, selectedCategory, movementType]);

  const filteredTransfers = React.useMemo(() => {
    if (movementType === "EXPENSES" || movementType === "INCOMES" || selectedCategory !== "ALL") return [];
    return transfers.filter((t) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.sender_name.toLowerCase().includes(q) ||
        t.receiver_name.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q))
      );
    });
  }, [transfers, searchQuery, movementType, selectedCategory]);

  const filteredIncomes = React.useMemo(() => {
    if (movementType === "EXPENSES" || movementType === "TRANSFERS" || selectedCategory !== "ALL") return [];
    return incomes.filter((inc) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        inc.description.toLowerCase().includes(q) ||
        inc.received_by_name.toLowerCase().includes(q) ||
        inc.splits.some((s) => s.participant_name.toLowerCase().includes(q))
      );
    });
  }, [incomes, searchQuery, movementType, selectedCategory]);

  const totalCents = expenses.reduce((sum, e) => sum + e.amount_cents, 0);
  const totalIncomesCents = incomes.reduce((sum, inc) => sum + inc.amount_cents, 0);
  const totalMovementsCount = expenses.length + transfers.length + incomes.length;

  const paymentMethodLabel = (method?: string | null) => {
    switch (method) {
      case "TRANSFER_POPULAR":
        return "Banco Popular";
      case "TRANSFER_BHD":
        return "Banco BHD";
      case "TRANSFER_BANRESERVAS":
        return "Banreservas";
      case "TRANSFER_OTHER":
        return "Transferencia";
      case "CASH":
        return "Efectivo 💵";
      default:
        return "Directo";
    }
  };

  const hasAnyItems = totalMovementsCount > 0;
  const hasFilteredItems =
    filteredExpenses.length > 0 || filteredTransfers.length > 0 || filteredIncomes.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-3">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            <span>Movimientos ({totalMovementsCount})</span>
          </CardTitle>
          <CardDescription>
            Gastos: <strong className="text-foreground">{formatDOP(totalCents)}</strong>
            {totalIncomesCents > 0 && (
              <span> • Reembolsos: <strong className="text-cyan-600 dark:text-cyan-400">-{formatDOP(totalIncomesCents)}</strong></span>
            )}
            {transfers.length > 0 && (
              <span> • {transfers.length} {transfers.length === 1 ? "transferencia" : "transferencias"}</span>
            )}
          </CardDescription>
        </div>

        {!isClosed && (
          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            {onAddIncomeClick && (
              <Button
                size="sm"
                variant="outline"
                onClick={onAddIncomeClick}
                className="gap-1.5 font-bold border-cyan-500/40 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/50"
              >
                <Download className="h-4 w-4" />
                <span>Reembolso</span>
              </Button>
            )}

            {onAddTransferClick && (
              <Button
                size="sm"
                variant="outline"
                onClick={onAddTransferClick}
                className="gap-1.5 font-bold border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
              >
                <ArrowRightLeft className="h-4 w-4" />
                <span>Transferencia</span>
              </Button>
            )}

            <Button size="sm" onClick={onAddClick} className="gap-1.5 font-bold">
              <PlusCircle className="h-4 w-4" />
              <span>Anotar Gasto</span>
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search & Type Filter Bar */}
        {hasAnyItems && (
          <div className="space-y-2.5 pb-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por concepto, persona o nota..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-xs sm:text-sm h-9"
                />
              </div>

              {/* Movement Type Switcher */}
              <div className="flex items-center bg-muted p-0.5 rounded-lg text-xs font-semibold shrink-0 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setMovementType("ALL")}
                  className={`px-2.5 py-1 rounded-md transition-all shrink-0 ${
                    movementType === "ALL"
                      ? "bg-card text-foreground shadow-xs font-bold"
                      : "text-muted-foreground"
                  }`}
                >
                  Todos ({totalMovementsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setMovementType("EXPENSES")}
                  className={`px-2.5 py-1 rounded-md transition-all shrink-0 ${
                    movementType === "EXPENSES"
                      ? "bg-card text-foreground shadow-xs font-bold"
                      : "text-muted-foreground"
                  }`}
                >
                  Gastos ({expenses.length})
                </button>
                <button
                  type="button"
                  onClick={() => setMovementType("TRANSFERS")}
                  className={`px-2.5 py-1 rounded-md transition-all shrink-0 ${
                    movementType === "TRANSFERS"
                      ? "bg-card text-foreground shadow-xs font-bold"
                      : "text-muted-foreground"
                  }`}
                >
                  Transferencias ({transfers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setMovementType("INCOMES")}
                  className={`px-2.5 py-1 rounded-md transition-all shrink-0 ${
                    movementType === "INCOMES"
                      ? "bg-card text-foreground shadow-xs font-bold"
                      : "text-muted-foreground"
                  }`}
                >
                  Reembolsos ({incomes.length})
                </button>
              </div>
            </div>

            {/* Category Filter Pills (when showing expenses) */}
            {movementType === "EXPENSES" && expenses.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("ALL")}
                  className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-all border ${
                    selectedCategory === "ALL"
                      ? "bg-primary text-white border-primary shadow-xs"
                      : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                  }`}
                >
                  Todas las categorías
                </button>

                {(Object.keys(CATEGORY_INFO) as ExpenseCategory[]).map((catKey) => {
                  const info = CATEGORY_INFO[catKey];
                  const count = expenses.filter((e) => (e.category || "OTHER") === catKey).length;
                  if (count === 0 && selectedCategory !== catKey) return null;

                  return (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => setSelectedCategory(catKey)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-all border ${
                        selectedCategory === catKey
                          ? "bg-primary text-white border-primary shadow-xs"
                          : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                      }`}
                    >
                      <span>{info.emoji}</span>
                      <span>{info.label.split("/")[0].trim()} ({count})</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!hasAnyItems ? (
          <div className="text-center py-10 border border-dashed rounded-2xl p-6 bg-muted/20">
            <Receipt className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
            <h4 className="font-bold text-foreground text-sm">No hay movimientos registrados</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              Registra gastos grupales, transferencias directas o reembolsos al serrucho.
            </p>
            {!isClosed && (
              <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                <Button size="sm" onClick={onAddClick} className="gap-1.5 font-bold">
                  <PlusCircle className="h-4 w-4" />
                  <span>Registrar gasto</span>
                </Button>
                {onAddTransferClick && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onAddTransferClick}
                    className="gap-1.5 font-bold"
                  >
                    <ArrowRightLeft className="h-4 w-4" />
                    <span>Transferir dinero</span>
                  </Button>
                )}
                {onAddIncomeClick && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onAddIncomeClick}
                    className="gap-1.5 font-bold border-cyan-500/40 text-cyan-700 dark:text-cyan-300"
                  >
                    <Download className="h-4 w-4" />
                    <span>Reembolso / Ingreso</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : !hasFilteredItems ? (
          <div className="text-center py-8 border rounded-2xl p-6 bg-muted/10">
            <Filter className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
            <p className="text-xs font-semibold text-muted-foreground">
              No se encontraron movimientos que coincidan con los filtros aplicados.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-xs text-primary font-bold"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("ALL");
                setMovementType("ALL");
              }}
            >
              Restablecer filtros
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
            {/* Incomes & Refunds List */}
            {filteredIncomes.map((inc) => {
              const catInfo =
                INCOME_CATEGORY_INFO[inc.category] || INCOME_CATEGORY_INFO.OTHER_INCOME;

              return (
                <div
                  key={inc.id}
                  className="p-4 hover:bg-cyan-500/5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-cyan-500/[0.02]"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base" title={catInfo.label}>
                        {catInfo.emoji}
                      </span>
                      <h5 className="font-bold text-base text-foreground">{inc.description}</h5>
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border ${catInfo.color}`}
                      >
                        {catInfo.label}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-bold border-cyan-500/40 text-cyan-700 dark:text-cyan-300"
                      >
                        📥 Reembolso / Ingreso
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <UserCheck className="h-3 w-3 text-cyan-600" /> Recibió en mano:{" "}
                        <strong className="text-foreground">{inc.received_by_name}</strong>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {inc.income_date}
                      </span>
                      <span>•</span>
                      <span>Beneficia a {inc.splits.length} personas</span>
                    </div>

                    {/* Beneficiaries credit preview pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {inc.splits.map((s) => (
                        <span
                          key={s.participant_id}
                          className="inline-flex items-center rounded-md bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 px-2 py-0.5 text-[11px] font-medium text-cyan-900 dark:text-cyan-200"
                        >
                          {s.participant_name}: -{formatDOP(s.credit_cents)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-cyan-700 dark:text-cyan-400 block">
                        Reembolsado
                      </span>
                      <span className="text-lg font-black text-cyan-700 dark:text-cyan-400">
                        +{formatDOP(inc.amount_cents)}
                      </span>
                    </div>

                    {!isClosed && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-cyan-600"
                          onClick={() => {
                            setEditingIncome(inc);
                            setEditIncomeOpen(true);
                          }}
                          title="Editar ingreso"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-600"
                          onClick={() => handleDeleteIncome(inc.id, inc.description)}
                          disabled={deletingId === inc.id}
                          title="Eliminar ingreso"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Transfers List */}
            {filteredTransfers.map((t) => (
              <div
                key={t.id}
                className="p-4 hover:bg-emerald-500/5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-500/[0.02]"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="h-6 w-6 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-bold">
                      <ArrowRightLeft className="h-3.5 w-3.5" />
                    </span>
                    <h5 className="font-bold text-base text-foreground">
                      {t.sender_name} <span className="text-emerald-600 font-black">➔</span> {t.receiver_name}
                    </h5>
                    <Badge variant="outline" className="text-[10px] font-bold border-emerald-500/40 text-emerald-700 dark:text-emerald-300">
                      💸 Transferencia Directa
                    </Badge>
                    {t.payment_method && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {paymentMethodLabel(t.payment_method)}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {t.transfer_date}
                    </span>
                    {t.notes && (
                      <>
                        <span>•</span>
                        <span className="italic font-medium text-foreground">&quot;{t.notes}&quot;</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">
                      Transferido
                    </span>
                    <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                      {formatDOP(t.amount_cents)}
                    </span>
                  </div>

                  {!isClosed && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-emerald-600"
                        onClick={() => {
                          setEditingTransfer(t);
                          setEditTransferOpen(true);
                        }}
                        title="Editar transferencia"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-600"
                        onClick={() => handleDeleteTransfer(t.id)}
                        disabled={deletingId === t.id}
                        title="Eliminar transferencia"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Expenses List */}
            {filteredExpenses.map((exp) => {
              const catInfo = CATEGORY_INFO[exp.category] || CATEGORY_INFO.OTHER;

              return (
                <div
                  key={exp.id}
                  className="p-4 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base" title={catInfo.label}>
                        {catInfo.emoji}
                      </span>
                      <h5 className="font-bold text-base text-foreground">{exp.description}</h5>
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border ${catInfo.color}`}
                      >
                        {catInfo.label.split("/")[0].trim()}
                      </span>
                      <Badge
                        variant={exp.split_method === "PERCENTAGE" ? "info" : "secondary"}
                        className="text-[10px] uppercase font-bold"
                      >
                        {exp.split_method === "PERCENTAGE"
                          ? "% Porcentaje"
                          : exp.split_method === "SHARES"
                          ? "Cuotas / Shares"
                          : exp.split_method === "EXACT"
                          ? "Montos Fijos"
                          : "Equitativo"}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <UserCheck className="h-3 w-3 text-primary" /> Pagó:{" "}
                        <strong className="text-foreground">{exp.paid_by_name}</strong>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {exp.expense_date}
                      </span>
                      <span>•</span>
                      <span>Dividido entre {exp.splits.length} personas</span>
                    </div>

                    {/* Split preview pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {exp.splits.map((s) => (
                        <span
                          key={s.participant_id}
                          className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                        >
                          {s.participant_name}: {formatDOP(s.owed_cents)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Monto
                      </span>
                      <span className="text-lg font-black text-foreground">
                        {formatDOP(exp.amount_cents)}
                      </span>
                    </div>

                    {!isClosed && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => {
                            setEditingExpense(exp);
                            setEditExpenseOpen(true);
                          }}
                          title="Editar gasto"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-600"
                          onClick={() => handleDelete(exp.id, exp.description)}
                          disabled={deletingId === exp.id}
                          title="Eliminar gasto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Edit Expense Dialog */}
      <EditExpenseDialog
        serruchoId={serruchoId}
        expense={editingExpense}
        participants={participants}
        open={editExpenseOpen}
        onOpenChange={setEditExpenseOpen}
        onExpenseUpdated={() => {
          if (onExpenseUpdated) onExpenseUpdated();
        }}
      />

      {/* Edit Transfer Dialog */}
      <EditTransferDialog
        serruchoId={serruchoId}
        transfer={editingTransfer}
        participants={participants}
        open={editTransferOpen}
        onOpenChange={setEditTransferOpen}
        onTransferUpdated={() => {
          if (onTransferUpdated) onTransferUpdated();
        }}
      />

      {/* Edit Income Dialog */}
      <EditIncomeDialog
        serruchoId={serruchoId}
        income={editingIncome}
        participants={participants}
        open={editIncomeOpen}
        onOpenChange={setEditIncomeOpen}
        onIncomeUpdated={() => {
          if (onIncomeUpdated) onIncomeUpdated();
        }}
      />
    </Card>
  );
}
