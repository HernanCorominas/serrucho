"use client";

import * as React from "react";
import {
  Download,
  DollarSign,
  Calendar,
  Layers,
  Sparkles,
  Users,
  Check,
  Building,
} from "lucide-react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {
  Participant,
  IncomeCategory,
  INCOME_CATEGORY_INFO,
  SplitMethod,
} from "@/lib/types/domain";
import { formatDOP, toCents, fromCents } from "@/lib/finance/math";
import { hapticSuccess } from "@/lib/utils/haptics";

interface AddIncomeDialogProps {
  serruchoId: string;
  participants: Participant[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIncomeAdded: () => void;
  defaultReceiverId?: string;
}

export function AddIncomeDialog({
  serruchoId,
  participants,
  open,
  onOpenChange,
  onIncomeAdded,
  defaultReceiverId,
}: AddIncomeDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  // Form State
  const [description, setDescription] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [receivedBy, setReceivedBy] = React.useState("");
  const [incomeDate, setIncomeDate] = React.useState(
    new Date().toISOString().split("T")[0]
  );
  const [category, setCategory] = React.useState<IncomeCategory>("DEPOSIT_RETURN");
  const [splitMethod, setSplitMethod] = React.useState<SplitMethod>("EQUAL");

  // Beneficiaries selection
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [percentages, setPercentages] = React.useState<Record<string, string>>({});
  const [exactAmounts, setExactAmounts] = React.useState<Record<string, string>>({});
  const [shares, setShares] = React.useState<Record<string, string>>({});

  // Initialize
  React.useEffect(() => {
    if (participants.length > 0) {
      if (defaultReceiverId && participants.some((p) => p.id === defaultReceiverId)) {
        setReceivedBy(defaultReceiverId);
      } else if (!receivedBy) {
        setReceivedBy(participants[0].id);
      }

      if (selectedIds.size === 0) {
        const allIds = new Set(participants.map((p) => p.id));
        setSelectedIds(allIds);

        // Preload percentages and shares
        const initialPcts: Record<string, string> = {};
        const initialShares: Record<string, string> = {};
        const equalPct = (100 / participants.length).toFixed(2);

        participants.forEach((p) => {
          initialPcts[p.id] = equalPct;
          initialShares[p.id] = String(p.default_shares || 1);
        });

        setPercentages(initialPcts);
        setShares(initialShares);
      }
    }
  }, [participants, defaultReceiverId, open]);

  const toggleParticipant = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      if (next.size === 1) {
        toast({ type: "error", message: "Debe haber al menos un participante beneficiado" });
        return;
      }
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const selectAll = () => {
    setSelectedIds(new Set(participants.map((p) => p.id)));
  };

  const parsedAmount = parseFloat(amount) || 0;
  const activeCount = selectedIds.size;
  const equalCreditEach = activeCount > 0 && parsedAmount > 0 ? parsedAmount / activeCount : 0;

  // Validation sums
  const totalPercentage = Array.from(selectedIds).reduce(
    (sum, id) => sum + (parseFloat(percentages[id]) || 0),
    0
  );
  const totalExact = Array.from(selectedIds).reduce(
    (sum, id) => sum + (parseFloat(exactAmounts[id]) || 0),
    0
  );
  const totalShares = Array.from(selectedIds).reduce(
    (sum, id) => sum + (parseFloat(shares[id]) || 0),
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      toast({ type: "error", message: "Ingresa el concepto del reembolso o ingreso" });
      return;
    }

    if (parsedAmount <= 0) {
      toast({ type: "error", message: "El monto debe ser mayor a 0" });
      return;
    }

    if (!receivedBy) {
      toast({ type: "error", message: "Indica quién recibió el dinero" });
      return;
    }

    if (selectedIds.size === 0) {
      toast({ type: "error", message: "Selecciona al menos un participante beneficiado" });
      return;
    }

    let splitPayload: any[] = [];

    if (splitMethod === "EQUAL") {
      splitPayload = Array.from(selectedIds).map((id) => ({ participant_id: id }));
    } else if (splitMethod === "PERCENTAGE") {
      if (Math.abs(totalPercentage - 100) > 0.01) {
        toast({
          type: "error",
          message: `La suma de los porcentajes es ${totalPercentage.toFixed(1)}% (debe ser 100%)`,
        });
        return;
      }
      splitPayload = Array.from(selectedIds).map((id) => ({
        participant_id: id,
        percentage: parseFloat(percentages[id]) || 0,
      }));
    } else if (splitMethod === "EXACT") {
      if (Math.abs(totalExact - parsedAmount) > 0.01) {
        toast({
          type: "error",
          message: `La suma de montos es ${formatDOP(toCents(totalExact))} (debe ser ${formatDOP(toCents(parsedAmount))})`,
        });
        return;
      }
      splitPayload = Array.from(selectedIds).map((id) => ({
        participant_id: id,
        amount: parseFloat(exactAmounts[id]) || 0,
      }));
    } else if (splitMethod === "SHARES") {
      if (totalShares <= 0) {
        toast({ type: "error", message: "El total de cuotas debe ser mayor a 0" });
        return;
      }
      splitPayload = Array.from(selectedIds).map((id) => ({
        participant_id: id,
        shares: parseFloat(shares[id]) || 1,
      }));
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/serruchos/${serruchoId}/incomes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          amount: parsedAmount,
          received_by_participant_id: receivedBy,
          income_date: incomeDate,
          category,
          split_method: splitMethod,
          splits: splitPayload,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Error al registrar ingreso");
      }

      hapticSuccess();
      toast({
        type: "success",
        title: "¡Ingreso / Reembolso Registrado!",
        message: `Se acreditaron RD$ ${parsedAmount.toLocaleString("es-DO")} al grupo.`,
      });

      setDescription("");
      setAmount("");
      onOpenChange(false);
      onIncomeAdded();
    } catch (err: any) {
      toast({ type: "error", message: err.message || "Error al registrar ingreso" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 flex items-center justify-center font-bold">
              <Download className="h-4 w-4" />
            </div>
            <DialogTitle>Registrar Ingreso o Reembolso</DialogTitle>
          </div>
          <DialogDescription>
            Anota devoluciones de depósito, reembolsos de compras o aportes al grupo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="inc_desc">Concepto / Motivo *</Label>
            <Input
              id="inc_desc"
              placeholder="Ej. Devolución depósito villa, Reembolso bebidas, Aporte tío"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Amount and Receiver */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="inc_amount">Monto devuelto (RD$) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-black text-muted-foreground">
                  RD$
                </span>
                <Input
                  id="inc_amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  className="pl-11 text-base font-bold"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inc_receiver">¿Quién recibió el dinero? *</Label>
              <Select
                id="inc_receiver"
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
                required
              >
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Date & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="inc_date">Fecha</Label>
              <Input
                id="inc_date"
                type="date"
                value={incomeDate}
                onChange={(e) => setIncomeDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inc_cat">Tipo de Ingreso</Label>
              <Select
                id="inc_cat"
                value={category}
                onChange={(e) => setCategory(e.target.value as IncomeCategory)}
              >
                {(Object.keys(INCOME_CATEGORY_INFO) as IncomeCategory[]).map((catKey) => {
                  const info = INCOME_CATEGORY_INFO[catKey];
                  return (
                    <option key={catKey} value={catKey}>
                      {info.emoji} {info.label}
                    </option>
                  );
                })}
              </Select>
            </div>
          </div>

          {/* Beneficiaries Selection */}
          <div className="space-y-2 pt-1 border-t border-border">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary" />
                <span>Beneficiarios del reembolso ({activeCount}/{participants.length})</span>
              </Label>
              <button
                type="button"
                onClick={selectAll}
                className="text-xs font-bold text-primary hover:underline"
              >
                Seleccionar todos
              </button>
            </div>

            {/* Beneficiaries checklist */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-muted/30 rounded-xl border border-border">
              {participants.map((p) => {
                const isSelected = selectedIds.has(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleParticipant(p.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border text-left ${
                      isSelected
                        ? "bg-cyan-50 border-cyan-300 text-cyan-900 dark:bg-cyan-950/80 dark:border-cyan-700 dark:text-cyan-200"
                        : "bg-card border-transparent text-muted-foreground opacity-60 hover:opacity-100"
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-cyan-600 text-white"
                          : "border border-muted-foreground/40"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                    <span className="truncate">{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Split Mode Tabs */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase">
              ¿Cómo repartir el crédito / descuento?
            </Label>
            <Tabs value={splitMethod} onValueChange={(val) => setSplitMethod(val as SplitMethod)}>
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="EQUAL" className="text-[11px] font-bold">
                  Equitativo
                </TabsTrigger>
                <TabsTrigger value="PERCENTAGE" className="text-[11px] font-bold">
                  Porcentaje
                </TabsTrigger>
                <TabsTrigger value="EXACT" className="text-[11px] font-bold">
                  Montos Fijos
                </TabsTrigger>
                <TabsTrigger value="SHARES" className="text-[11px] font-bold">
                  Cuotas
                </TabsTrigger>
              </TabsList>

              {/* EQUAL Tab */}
              <TabsContent value="EQUAL">
                <div className="p-3 bg-muted/20 rounded-xl border border-border text-center">
                  <p className="text-xs text-muted-foreground">
                    Cada beneficiario recibe un crédito de:
                  </p>
                  <p className="text-base font-black text-cyan-700 dark:text-cyan-300 mt-0.5">
                    {formatDOP(toCents(equalCreditEach))}
                  </p>
                </div>
              </TabsContent>

              {/* PERCENTAGE Tab */}
              <TabsContent value="PERCENTAGE">
                <div className="space-y-2 p-2 bg-muted/20 rounded-xl border border-border max-h-40 overflow-y-auto">
                  {participants
                    .filter((p) => selectedIds.has(p.id))
                    .map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-semibold truncate">{p.name}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            className="w-16 h-7 text-xs text-right font-bold"
                            value={percentages[p.id] || ""}
                            onChange={(e) =>
                              setPercentages({ ...percentages, [p.id]: e.target.value })
                            }
                          />
                          <span className="text-muted-foreground font-bold">%</span>
                          <span className="text-[11px] text-muted-foreground w-16 text-right">
                            {formatDOP(
                              toCents(
                                (parsedAmount * (parseFloat(percentages[p.id]) || 0)) / 100
                              )
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </TabsContent>

              {/* EXACT Tab */}
              <TabsContent value="EXACT">
                <div className="space-y-2 p-2 bg-muted/20 rounded-xl border border-border max-h-40 overflow-y-auto">
                  {participants
                    .filter((p) => selectedIds.has(p.id))
                    .map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-semibold truncate">{p.name}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-muted-foreground font-bold">RD$</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-24 h-7 text-xs text-right font-bold"
                            value={exactAmounts[p.id] || ""}
                            onChange={(e) =>
                              setExactAmounts({ ...exactAmounts, [p.id]: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </TabsContent>

              {/* SHARES Tab */}
              <TabsContent value="SHARES">
                <div className="space-y-2 p-2 bg-muted/20 rounded-xl border border-border max-h-40 overflow-y-auto">
                  {participants
                    .filter((p) => selectedIds.has(p.id))
                    .map((p) => {
                      const shareVal = parseFloat(shares[p.id]) || 0;
                      const shareFraction = totalShares > 0 ? shareVal / totalShares : 0;
                      const estCredit = parsedAmount * shareFraction;

                      return (
                        <div key={p.id} className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-semibold truncate">{p.name}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Input
                              type="number"
                              step="0.1"
                              min="0.1"
                              className="w-16 h-7 text-xs text-right font-bold"
                              value={shares[p.id] || "1"}
                              onChange={(e) =>
                                setShares({ ...shares, [p.id]: e.target.value })
                              }
                            />
                            <span className="text-muted-foreground font-bold">cuotas</span>
                            <span className="text-[11px] text-muted-foreground w-16 text-right">
                              ~ {formatDOP(toCents(estCredit))}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Educational Note */}
          <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-900 border border-cyan-200 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-800 text-xs">
            💡 <strong>Efecto en balances:</strong> El dinero recibido en mano se acredita automáticamente a los beneficiarios, reduciendo el costo que debe aportar cada uno.
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
            disabled={
              loading ||
              !description.trim() ||
              parsedAmount <= 0 ||
              selectedIds.size === 0
            }
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold gap-1.5 shadow-sm"
          >
            <Download className="h-4 w-4" />
            <span>{loading ? "Guardando..." : "Registrar Reembolso"}</span>
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
