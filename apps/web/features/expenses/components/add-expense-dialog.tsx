"use client";

import * as React from "react";
import { Receipt, AlertCircle, UtensilsCrossed, RefreshCw, Search } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Participant, ExpenseCategory, CATEGORY_INFO } from "@/lib/types/domain";
import { hapticSuccess, hapticLight } from "@/lib/utils/haptics";
import { getExchangeRates, convertToDOPCents, SupportedCurrency, ExchangeRates } from "@/lib/finance/currency";
import { ItemizedExpenseDialog } from "./itemized-expense-dialog";

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
  const [category, setCategory] = React.useState<ExpenseCategory>("OTHER");
  const [splitMethod, setSplitMethod] = React.useState<"EQUAL" | "PERCENTAGE" | "EXACT">("EQUAL");

  // Multi-currency support
  const [currency, setCurrency] = React.useState<SupportedCurrency>("DOP");
  const [exchangeRates, setExchangeRates] = React.useState<ExchangeRates | null>(null);
  const [customRate, setCustomRate] = React.useState<string>("");

  // Itemized modal
  const [itemizedOpen, setItemizedOpen] = React.useState(false);

  // Selected participants for split
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [percentages, setPercentages] = React.useState<Record<string, number>>({});
  const [exactAmounts, setExactAmounts] = React.useState<Record<string, number>>({});
  const [participantSearch, setParticipantSearch] = React.useState("");

  React.useEffect(() => {
    getExchangeRates().then((rates) => {
      setExchangeRates(rates);
      if (currency === "USD") setCustomRate(rates.DOP.toString());
      if (currency === "EUR") setCustomRate((rates.DOP / rates.EUR).toFixed(2));
    });
  }, [currency]);

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

  // Computed DOP equivalent amount if currency is USD or EUR
  const convertedDOPAmount = React.useMemo(() => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return 0;
    const rate = customRate ? parseFloat(customRate) : undefined;
    const cents = convertToDOPCents(parsed, currency, rate);
    return cents / 100;
  }, [amount, currency, customRate]);

  const targetTotal = currency === "DOP" ? (parseFloat(amount) || 0) : convertedDOPAmount;

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

  const handleExactAmountChange = (id: string, val: number) => {
    setExactAmounts((prev) => ({
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

  // Exact amount sum check
  const currentExactSum = React.useMemo(() => {
    if (splitMethod !== "EXACT") return targetTotal;
    return Array.from(selectedIds).reduce((sum, id) => sum + (exactAmounts[id] || 0), 0);
  }, [splitMethod, selectedIds, exactAmounts, targetTotal]);

  const exactDifference = targetTotal - currentExactSum;
  const isExactValid = Math.abs(exactDifference) < 0.01;

  const handleApplyItemized = (params: {
    totalAmount: number;
    description: string;
    splitPercentages: Record<string, number>;
  }) => {
    setAmount(params.totalAmount.toFixed(2));
    setDescription(params.description);
    setCategory("RESTAURANT");
    setSplitMethod("PERCENTAGE");
    setPercentages(params.splitPercentages);
    setSelectedIds(new Set(Object.keys(params.splitPercentages)));
    setCurrency("DOP");
    toast({
      type: "success",
      title: "Desglose por platos aplicado",
      message: `Total: RD$ ${params.totalAmount.toLocaleString("es-DO")}`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const rawParsed = parseFloat(amount);
    if (isNaN(rawParsed) || rawParsed <= 0) {
      toast({ type: "error", message: "Ingresa un monto válido mayor a 0" });
      return;
    }

    const finalAmountInDOP = currency === "DOP" ? rawParsed : convertedDOPAmount;

    if (!description.trim()) {
      toast({ type: "error", message: "Ingresa una descripción del gasto" });
      return;
    }

    if (!paidById) {
      toast({ type: "error", message: "Selecciona quién pagó el gasto" });
      return;
    }

    if (splitMethod === "PERCENTAGE" && !isPctValid) {
      toast({
        type: "error",
        message: `La suma de los porcentajes es ${currentPctSum.toFixed(2)}%, debe ser exactamente 100%`,
      });
      return;
    }

    if (splitMethod === "EXACT" && !isExactValid) {
      toast({
        type: "error",
        message: `La suma de los montos individuales es RD$ ${currentExactSum.toFixed(2)}, debe sumar exactamente RD$ ${targetTotal.toFixed(2)}`,
      });
      return;
    }

    try {
      setLoading(true);

      const splitsPayload = Array.from(selectedIds).map((id) => ({
        participant_id: id,
        percentage: splitMethod === "PERCENTAGE" ? percentages[id] : undefined,
        amount: splitMethod === "EXACT" ? (exactAmounts[id] || 0) : undefined,
      }));

      // Append currency note if foreign currency
      const finalDesc =
        currency !== "DOP"
          ? `${description.trim()} (${currency === "USD" ? "$" : "€"}${rawParsed.toFixed(2)} ${currency} @ ${customRate})`
          : description.trim();

      const res = await fetch(`/api/serruchos/${serruchoId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: finalDesc,
          amount: finalAmountInDOP,
          paid_by_participant_id: paidById,
          expense_date: expenseDate,
          category,
          split_method: splitMethod,
          splits: splitsPayload,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Error al registrar gasto");
      }

      hapticSuccess();
      toast({
        type: "success",
        title: "¡Gasto registrado!",
        message: `Se anotó "${finalDesc}" por RD$ ${finalAmountInDOP.toLocaleString("es-DO")}`,
      });

      setDescription("");
      setAmount("");
      setCurrency("DOP");
      onOpenChange(false);
      onExpenseAdded();
    } catch (err: any) {
      toast({ type: "error", message: err.message || "Error al agregar gasto" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                <DialogTitle>Registrar Gasto</DialogTitle>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  hapticLight();
                  setItemizedOpen(true);
                }}
                className="text-xs font-bold gap-1 text-orange-600 border-orange-200 dark:border-orange-900 bg-orange-50/50 dark:bg-orange-950/30"
              >
                <UtensilsCrossed className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">Desglose por Platos</span>
                <span className="xs:hidden">Por Platos</span>
              </Button>
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

            {/* Category Selector Pills */}
            <div className="space-y-1.5">
              <Label className="text-xs">Categoría del gasto</Label>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(CATEGORY_INFO) as ExpenseCategory[]).map((catKey) => {
                  const info = CATEGORY_INFO[catKey];
                  const isCatSelected = category === catKey;
                  return (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => setCategory(catKey)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                        isCatSelected
                          ? "bg-primary text-white border-primary shadow-xs"
                          : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                      }`}
                    >
                      <span>{info.emoji}</span>
                      <span>{info.label.split("/")[0].trim()}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Amount & Currency Selection */}
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="exp_amount">Monto *</Label>
                    <div className="flex gap-1">
                      {(["DOP", "USD", "EUR"] as SupportedCurrency[]).map((curr) => (
                        <button
                          key={curr}
                          type="button"
                          onClick={() => {
                            hapticLight();
                            setCurrency(curr);
                          }}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                            currency === curr
                              ? "bg-foreground text-background border-foreground font-black"
                              : "border-border text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {curr === "DOP" ? "RD$" : curr === "USD" ? "US$" : "EUR€"}
                        </button>
                      ))}
                    </div>
                  </div>

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

              {/* Multi-Currency Conversion Info */}
              {currency !== "DOP" && (
                <div className="p-2.5 rounded-xl bg-muted/60 border border-border text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-medium">
                      Tasa de Cambio ({currency} a RD$):
                    </span>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        step="0.01"
                        value={customRate}
                        onChange={(e) => setCustomRate(e.target.value)}
                        className="h-6 w-20 text-xs font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (exchangeRates) {
                            if (currency === "USD") setCustomRate(exchangeRates.DOP.toString());
                            if (currency === "EUR") setCustomRate((exchangeRates.DOP / exchangeRates.EUR).toFixed(2));
                          }
                        }}
                        title="Restablecer tasa en vivo"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between font-bold text-foreground pt-1 border-t border-border/60">
                    <span>Equivalente en el Serrucho:</span>
                    <span className="text-primary font-black">
                      RD$ {convertedDOPAmount.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}
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
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      splitMethod === "EQUAL"
                        ? "bg-card text-foreground shadow-sm font-bold"
                        : "text-muted-foreground"
                    }`}
                  >
                    Equitativo
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitMethod("EXACT")}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      splitMethod === "EXACT"
                        ? "bg-card text-foreground shadow-sm font-bold"
                        : "text-muted-foreground"
                    }`}
                  >
                    Montos Fijos (RD$)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitMethod("PERCENTAGE")}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      splitMethod === "PERCENTAGE"
                        ? "bg-card text-foreground shadow-sm font-bold"
                        : "text-muted-foreground"
                    }`}
                  >
                    Porcentaje (%)
                  </button>
                </div>
              </div>

              <div className="bg-muted/40 rounded-xl p-3 space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                  <div className="font-bold text-foreground">
                    Dividir entre ({selectedIds.size} de {participants.length}):
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedIds(new Set(participants.map((p) => p.id)))}
                      className="text-[11px] font-bold text-primary hover:underline"
                    >
                      Todos
                    </button>
                    <span className="text-muted-foreground">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (participants.length > 0) {
                          setSelectedIds(new Set([participants[0].id]));
                        }
                      }}
                      className="text-[11px] font-bold text-muted-foreground hover:text-foreground"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>

                {/* Search Bar when more than 3 participants */}
                {participants.length > 3 && (
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Buscar persona..."
                      value={participantSearch}
                      onChange={(e) => setParticipantSearch(e.target.value)}
                      className="pl-8 h-8 text-xs bg-background"
                    />
                  </div>
                )}

                {/* Quota Per Person Preview */}
                {splitMethod === "EQUAL" && selectedIds.size > 0 && parseFloat(amount) > 0 && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-black">
                    <span>Cuota estimada por persona:</span>
                    <span>
                      RD$ {((currency === "DOP" ? parseFloat(amount) : convertedDOPAmount) / selectedIds.size).toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} c/u
                    </span>
                  </div>
                )}

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {participants
                    .filter((p) =>
                      p.name.toLowerCase().includes(participantSearch.toLowerCase())
                    )
                    .map((p) => {
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

                          {/* Percentage Input */}
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

                          {/* Exact Amount Input */}
                          {splitMethod === "EXACT" && isSelected && (
                            <div className="flex items-center gap-1.5">
                              <div className="relative">
                                <span className="absolute left-2 top-2 text-[10px] text-muted-foreground font-bold">
                                  RD$
                                </span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  className="h-8 w-24 pl-8 text-right text-xs py-1 px-2 font-bold"
                                  value={exactAmounts[p.id] !== undefined ? exactAmounts[p.id] : ""}
                                  onChange={(e) =>
                                    handleExactAmountChange(p.id, parseFloat(e.target.value))
                                  }
                                />
                              </div>

                              {exactDifference > 0.01 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const curr = exactAmounts[p.id] || 0;
                                    handleExactAmountChange(p.id, Number((curr + exactDifference).toFixed(2)));
                                  }}
                                  title="Asignar restante faltante a este participante"
                                  className="px-1.5 py-1 text-[10px] font-bold bg-primary/10 text-primary hover:bg-primary hover:text-white rounded transition-colors"
                                >
                                  + Restante
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Status Indicator for Percentage */}
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

              {/* Status Indicator for EXACT Amount Split */}
              {splitMethod === "EXACT" && (
                <div
                  className={`flex items-center justify-between text-xs font-bold p-2.5 rounded-xl border transition-colors ${
                    isExactValid
                      ? "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                      : exactDifference > 0.01
                      ? "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
                      : "bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4" />
                      <span>
                        Asignado: RD$ {currentExactSum.toLocaleString("es-DO", { minimumFractionDigits: 2 })} / RD$ {targetTotal.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div>
                    {isExactValid ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-black">
                        ¡Monto cuadrado! 🎉
                      </span>
                    ) : exactDifference > 0.01 ? (
                      <span className="text-amber-700 dark:text-amber-400 font-black">
                        Faltan: RD$ {exactDifference.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <span className="text-rose-700 dark:text-rose-400 font-black">
                        Exceso: RD$ {Math.abs(exactDifference).toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
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
              disabled={
                loading ||
                (splitMethod === "PERCENTAGE" && !isPctValid) ||
                (splitMethod === "EXACT" && !isExactValid)
              }
              className="bg-primary text-white font-bold"
            >
              {loading ? "Guardando..." : "Guardar Gasto"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Itemized Modal */}
      <ItemizedExpenseDialog
        open={itemizedOpen}
        onOpenChange={setItemizedOpen}
        participants={participants}
        onApplyItemizedSplit={handleApplyItemized}
      />
    </>
  );
}
