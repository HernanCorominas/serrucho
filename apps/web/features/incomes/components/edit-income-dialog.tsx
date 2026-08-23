"use client";

import * as React from "react";
import { Download, Check } from "lucide-react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  Participant,
  IncomeWithSplits,
  IncomeCategory,
  INCOME_CATEGORY_INFO,
  SplitMethod,
} from "@/lib/types/domain";
import { formatDOP, fromCents, toCents } from "@/lib/finance/math";
import { hapticSuccess, hapticImpact, hapticLight } from "@/lib/utils/haptics";

interface EditIncomeDialogProps {
  serruchoId: string;
  income: IncomeWithSplits | null;
  participants: Participant[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIncomeUpdated: () => void;
}

export function EditIncomeDialog({
  serruchoId,
  income,
  participants,
  open,
  onOpenChange,
  onIncomeUpdated,
}: EditIncomeDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  const [description, setDescription] = React.useState("");
  const [amount, setAmount] = React.useState<string>("");
  const [receivedById, setReceivedById] = React.useState<string>("");
  const [incomeDate, setIncomeDate] = React.useState("");
  const [category, setCategory] = React.useState<IncomeCategory>("OTHER_INCOME");
  const [splitMethod, setSplitMethod] = React.useState<SplitMethod>("EQUAL");

  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [percentages, setPercentages] = React.useState<Record<string, number>>({});
  const [exactAmounts, setExactAmounts] = React.useState<Record<string, number>>({});
  const [shares, setShares] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    if (income && open) {
      setDescription(income.description);
      setAmount(fromCents(income.amount_cents).toString());
      setReceivedById(income.received_by_participant_id);
      setIncomeDate(income.income_date);
      setCategory(income.category || "OTHER_INCOME");
      setSplitMethod(income.split_method);

      const selIds = new Set(income.splits.map((s) => s.participant_id));
      setSelectedIds(selIds);

      const pMap: Record<string, number> = {};
      const eMap: Record<string, number> = {};
      const sMap: Record<string, number> = {};

      for (const s of income.splits) {
        if (s.percentage_basis_points != null) {
          pMap[s.participant_id] = s.percentage_basis_points / 100;
        }
        eMap[s.participant_id] = fromCents(s.credit_cents);
        sMap[s.participant_id] = 1;
      }

      setPercentages(pMap);
      setExactAmounts(eMap);
      setShares(sMap);
    }
  }, [income, open]);

  const numAmount = parseFloat(amount) || 0;

  const toggleParticipant = (id: string) => {
    hapticLight();
    const next = new Set(selectedIds);
    if (next.has(id)) {
      if (next.size <= 1) {
        toast({ type: "error", message: "Debe haber al menos un participante beneficiario" });
        return;
      }
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handlePercentageChange = (id: string, val: number) => {
    setPercentages((prev) => ({ ...prev, [id]: val }));
  };

  const handleExactChange = (id: string, val: number) => {
    setExactAmounts((prev) => ({ ...prev, [id]: val }));
  };

  const handleSharesChange = (id: string, val: number) => {
    setShares((prev) => ({ ...prev, [id]: Math.max(1, val) }));
  };

  const validateForm = (): string | null => {
    if (!description.trim()) return "Ingresa una descripción del reembolso";
    if (isNaN(numAmount) || numAmount <= 0) return "El monto debe ser mayor a 0";
    if (!receivedById) return "Selecciona quién recibió el dinero en mano";
    if (selectedIds.size === 0) return "Selecciona al menos un participante beneficiario";

    if (splitMethod === "PERCENTAGE") {
      const sumPct = Array.from(selectedIds).reduce(
        (acc, id) => acc + (percentages[id] || 0),
        0
      );
      if (Math.abs(sumPct - 100) > 0.05) {
        return `La suma de los porcentajes debe ser exactamente 100% (actual: ${sumPct.toFixed(1)}%)`;
      }
    }

    if (splitMethod === "EXACT") {
      const sumExact = Array.from(selectedIds).reduce(
        (acc, id) => acc + (exactAmounts[id] || 0),
        0
      );
      if (Math.abs(sumExact - numAmount) > 0.01) {
        return `La suma de los créditos (${formatDOP(toCents(sumExact))}) debe ser igual al total (${formatDOP(toCents(numAmount))})`;
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!income) return;

    const errorMsg = validateForm();
    if (errorMsg) {
      hapticImpact();
      toast({ type: "error", message: errorMsg });
      return;
    }

    try {
      setLoading(true);

      const splitPayload = Array.from(selectedIds).map((id) => {
        if (splitMethod === "PERCENTAGE") {
          return { participant_id: id, percentage: percentages[id] || 0 };
        }
        if (splitMethod === "EXACT") {
          return { participant_id: id, amount: exactAmounts[id] || 0 };
        }
        if (splitMethod === "SHARES") {
          return { participant_id: id, shares: shares[id] || 1 };
        }
        return { participant_id: id };
      });

      const res = await fetch(`/api/serruchos/${serruchoId}/incomes/${income.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          amount: numAmount,
          received_by_participant_id: receivedById,
          income_date: incomeDate,
          category,
          split_method: splitMethod,
          splits: splitPayload,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "No se pudo actualizar el ingreso");
      }

      hapticSuccess();
      toast({
        type: "success",
        title: "¡Reembolso actualizado!",
        message: `"${description}" se actualizó correctamente y los balances se recalcularon.`,
      });

      onOpenChange(false);
      onIncomeUpdated();
    } catch (err: any) {
      hapticImpact();
      toast({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!income) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-lg">
          <Download className="h-5 w-5 text-cyan-600" />
          <span>Editar Reembolso / Ingreso</span>
        </DialogTitle>
        <DialogDescription>
          Modifica el monto, receptor o beneficiarios. Los créditos se recalcularán automáticamente.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs font-bold">Concepto / Motivo</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Devolución de fianza de la villa..."
              className="text-sm font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Monto Devuelto (RD$)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                  RD$
                </span>
                <Input
                  type="number"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-11 text-sm font-black"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">Fecha del Reembolso</Label>
              <Input
                type="date"
                value={incomeDate}
                onChange={(e) => setIncomeDate(e.target.value)}
                className="text-xs sm:text-sm"
                required
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs font-bold">Quién Recibió en Mano</Label>
            <select
              value={receivedById}
              onChange={(e) => {
                hapticLight();
                setReceivedById(e.target.value);
              }}
              className="w-full rounded-lg border border-input bg-card px-2.5 py-2 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              {participants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold">Categoría del Ingreso</Label>
            <select
              value={category}
              onChange={(e) => {
                hapticLight();
                setCategory(e.target.value as IncomeCategory);
              }}
              className="w-full rounded-lg border border-input bg-card px-2.5 py-2 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {(Object.keys(INCOME_CATEGORY_INFO) as IncomeCategory[]).map((catKey) => {
                const info = INCOME_CATEGORY_INFO[catKey];
                return (
                  <option key={catKey} value={catKey}>
                    {info.emoji} {info.label}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Split Method Tabs */}
        <div className="space-y-2">
          <Label className="text-xs font-bold">Método de Distribución del Crédito</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-muted p-1 rounded-xl text-xs font-bold">
            {(
              [
                { key: "EQUAL", label: "Equitativo", emoji: "⚖️" },
                { key: "EXACT", label: "Monto Fijo", emoji: "💵" },
                { key: "PERCENTAGE", label: "Porcentaje", emoji: "📊" },
                { key: "SHARES", label: "Cuotas", emoji: "🔢" },
              ] as const
            ).map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => {
                  hapticLight();
                  setSplitMethod(m.key);
                }}
                className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
                  splitMethod === m.key
                    ? "bg-card text-foreground shadow-xs ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{m.emoji}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Beneficiaries Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <Label className="font-bold">Participantes que reciben el crédito ({selectedIds.size})</Label>
            <button
              type="button"
              onClick={() => {
                hapticLight();
                if (selectedIds.size === participants.length) {
                  setSelectedIds(new Set([participants[0].id]));
                } else {
                  setSelectedIds(new Set(participants.map((p) => p.id)));
                }
              }}
              className="text-[11px] font-bold text-primary hover:underline"
            >
              {selectedIds.size === participants.length ? "Deseleccionar todos" : "Seleccionar todos"}
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-xl border border-border p-2 bg-muted/20">
            {participants.map((p) => {
              const isSelected = selectedIds.has(p.id);

              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-2 rounded-lg text-xs transition-all ${
                    isSelected
                      ? "bg-card border border-cyan-500/30 shadow-xs"
                      : "bg-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <label className="flex items-center gap-2 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleParticipant(p.id)}
                      className="rounded border-input text-primary focus:ring-primary"
                    />
                    <span className="font-semibold text-foreground">{p.name}</span>
                  </label>

                  {isSelected && (
                    <div className="flex items-center gap-2">
                      {splitMethod === "PERCENTAGE" && (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            step="any"
                            value={percentages[p.id] ?? ""}
                            onChange={(e) =>
                              handlePercentageChange(p.id, parseFloat(e.target.value) || 0)
                            }
                            className="w-16 h-7 text-xs font-bold text-right"
                            placeholder="0"
                          />
                          <span className="text-muted-foreground font-bold">%</span>
                        </div>
                      )}

                      {splitMethod === "EXACT" && (
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground text-[11px] font-bold">RD$</span>
                          <Input
                            type="number"
                            step="any"
                            value={exactAmounts[p.id] ?? ""}
                            onChange={(e) =>
                              handleExactChange(p.id, parseFloat(e.target.value) || 0)
                            }
                            className="w-20 h-7 text-xs font-bold text-right"
                            placeholder="0.00"
                          />
                        </div>
                      )}

                      {splitMethod === "SHARES" && (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min="1"
                            value={shares[p.id] ?? 1}
                            onChange={(e) =>
                              handleSharesChange(p.id, parseInt(e.target.value, 10) || 1)
                            }
                            className="w-14 h-7 text-xs font-bold text-center"
                          />
                          <span className="text-muted-foreground text-[11px]">partes</span>
                        </div>
                      )}

                      {splitMethod === "EQUAL" && (
                        <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400">
                          -{formatDOP(
                            selectedIds.size > 0
                              ? Math.round(toCents(numAmount) / selectedIds.size)
                              : 0
                          )}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter className="pt-2 gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="w-full sm:w-auto text-xs"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white gap-1.5"
          >
            <Check className="h-4 w-4" />
            <span>{loading ? "Guardando..." : "Guardar Cambios"}</span>
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
