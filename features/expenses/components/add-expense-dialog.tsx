"use client";

import * as React from "react";
import { Receipt, AlertCircle } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { Participant } from "@/lib/types/domain";

interface AddExpenseDialogProps {
  serruchoId: string;
  participants: Participant[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExpenseAdded: () => void;
}

export function AddExpenseDialog({
  serruchoId,
  participants,
  open,
  onOpenChange,
  onExpenseAdded,
}: AddExpenseDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [description, setDescription] = React.useState("");
  const [amount, setAmount] = React.useState<string>("");
  const [paidById, setPaidById] = React.useState<string>("");
  const [expenseDate, setExpenseDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [splitMethod, setSplitMethod] = React.useState<"EQUAL" | "PERCENTAGE">("EQUAL");

  // Selected participants for split
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [percentages, setPercentages] = React.useState<Record<string, number>>({});

  // Reset form when opened or participants change
  React.useEffect(() => {
    if (participants.length > 0) {
      if (!paidById || !participants.some((p) => p.id === paidById)) {
        setPaidById(participants[0].id);
      }
      const allIds = new Set(participants.map((p) => p.id));
      setSelectedIds(allIds);

      // Default equal percentages
      const equalPct = Number((100 / participants.length).toFixed(2));
      const pMap: Record<string, number> = {};
      participants.forEach((p) => (pMap[p.id] = equalPct));
      setPercentages(pMap);
    }
  }, [participants, open]);

  const toggleParticipant = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      if (next.size === 1) {
        toast({ type: "error", message: "Debe quedar al menos un participante en el reparto" });
        return;
      }
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);

    // Recalculate default percentages for active subset
    if (splitMethod === "PERCENTAGE") {
      const count = next.size;
      const pct = Number((100 / count).toFixed(2));
      const nextPct: Record<string, number> = { ...percentages };
      participants.forEach((p) => {
        if (next.has(p.id)) {
          nextPct[p.id] = pct;
        }
      });
      setPercentages(nextPct);
    }
  };

  const handlePercentageChange = (id: string, val: number) => {
    setPercentages((prev) => ({
      ...prev,
      [id]: isNaN(val) ? 0 : val,
    }));
  };

  // Percentage sum check
  const currentPctSum = React.useMemo(() => {
    if (splitMethod !== "PERCENTAGE") return 100;
    return Array.from(selectedIds).reduce((sum, id) => sum + (percentages[id] || 0), 0);
  }, [splitMethod, selectedIds, percentages]);

  const isPctValid = Math.abs(currentPctSum - 100) < 0.01;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({ type: "error", message: "Ingresa un monto válido mayor a 0" });
      return;
    }

    if (!description.trim()) {
      toast({ type: "error", message: "Ingresa el concepto del gasto" });
      return;
    }

    if (!paidById) {
      toast({ type: "error", message: "Selecciona quién pagó este gasto" });
      return;
    }

    if (selectedIds.size === 0) {
      toast({ type: "error", message: "Selecciona al menos un participante para dividir" });
      return;
    }

    if (splitMethod === "PERCENTAGE" && !isPctValid) {
      toast({
        type: "error",
        message: `La suma de porcentajes debe ser exactamente 100%. Actual: ${currentPctSum}%`,
      });
      return;
    }

    try {
      setLoading(true);

      const splitsPayload = Array.from(selectedIds).map((id) => ({
        participant_id: id,
        percentage: splitMethod === "PERCENTAGE" ? percentages[id] : undefined,
      }));

      const res = await fetch(`/api/serruchos/${serruchoId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          amount: parsedAmount,
          paid_by_participant_id: paidById,
          expense_date: expenseDate,
          split_method: splitMethod,
          splits: splitsPayload,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Error al registrar gasto");
      }

      toast({
        type: "success",
        title: "¡Gasto registrado!",
        message: `Se anotó "${description}" por RD$ ${parsedAmount.toLocaleString("es-DO")}`,
      });

      setDescription("");
      setAmount("");
      onOpenChange(false);
      onExpenseAdded();
    } catch (err: any) {
      toast({ type: "error", message: err.message || "Error al agregar gasto" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            <DialogTitle>Registrar Gasto</DialogTitle>
          </div>
          <DialogDescription>
            Anota cuánto se gastó, quién lo pagó y cómo se dividirá entre el grupo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="exp_desc">Concepto del gasto *</Label>
            <Input
              id="exp_desc"
              placeholder="Ej. Supermercado, Alquiler de Villa, Gasolina, Cena, Bebidas"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="exp_amount">Monto total (RD$) *</Label>
              <Input
                id="exp_amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="exp_date">Fecha del gasto</Label>
              <Input
                id="exp_date"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="exp_payer">¿Quién pagó el gasto? *</Label>
            <Select
              id="exp_payer"
              value={paidById}
              onChange={(e) => setPaidById(e.target.value)}
              required
            >
              {participants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase font-bold text-muted-foreground">
                ¿Cómo se divide este gasto?
              </Label>
              <div className="flex gap-1 bg-muted p-0.5 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setSplitMethod("EQUAL")}
                  className={`px-3 py-1 rounded-md transition-all ${
                    splitMethod === "EQUAL"
                      ? "bg-card text-foreground shadow-sm font-bold"
                      : "text-muted-foreground"
                  }`}
                >
                  Equitativo (Parejo)
                </button>
                <button
                  type="button"
                  onClick={() => setSplitMethod("PERCENTAGE")}
                  className={`px-3 py-1 rounded-md transition-all ${
                    splitMethod === "PERCENTAGE"
                      ? "bg-card text-foreground shadow-sm font-bold"
                      : "text-muted-foreground"
                  }`}
                >
                  Por Porcentaje (%)
                </button>
              </div>
            </div>

            <div className="bg-muted/40 rounded-xl p-3 space-y-2 max-h-48 overflow-y-auto">
              <div className="text-xs font-medium text-muted-foreground mb-1">
                Participantes incluidos en este gasto ({selectedIds.size} de {participants.length}):
              </div>

              {participants.map((p) => {
                const isSelected = selectedIds.has(p.id);
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-2 rounded-lg text-sm transition-colors border ${
                      isSelected
                        ? "bg-card border-border shadow-xs"
                        : "bg-background/50 border-transparent opacity-60"
                    }`}
                  >
                    <label className="flex items-center gap-2 cursor-pointer select-none flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleParticipant(p.id)}
                        className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                      />
                      <span className="font-semibold text-xs sm:text-sm">{p.name}</span>
                    </label>

                    {splitMethod === "PERCENTAGE" && isSelected && (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          className="h-8 w-20 text-right text-xs py-1 px-2"
                          value={percentages[p.id] ?? 0}
                          onChange={(e) =>
                            handlePercentageChange(p.id, parseFloat(e.target.value))
                          }
                        />
                        <span className="text-xs text-muted-foreground font-bold">%</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {splitMethod === "PERCENTAGE" && (
              <div
                className={`flex items-center justify-between text-xs font-bold p-2 rounded-lg ${
                  isPctValid
                    ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                    : "bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-300"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" />
                  <span>Suma de porcentajes:</span>
                </div>
                <span>{currentPctSum.toFixed(2)}% de 100%</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading || (splitMethod === "PERCENTAGE" && !isPctValid)}
            className="bg-primary text-white font-bold"
          >
            {loading ? "Guardando..." : "Guardar Gasto"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
