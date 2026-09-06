"use client";

import * as React from "react";
import { Receipt, AlertCircle, Sparkles, Check, RefreshCw } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {
  Participant,
  ExpenseWithSplits,
  ExpenseCategory,
  CATEGORY_INFO,
  SplitMethod,
} from "@/lib/types/domain";
import { formatDOP, fromCents, toCents } from "@/lib/finance/math";
import {
  SupportedCurrency,
  ExchangeRates,
  getExchangeRates,
  convertToDOPCents,
  CURRENCY_SYMBOLS,
} from "@/lib/finance/currency";
import { ReceiptGallery } from "@/features/receipts/components/receipt-gallery";
import { hapticSuccess, hapticImpact, hapticLight } from "@/lib/utils/haptics";

interface EditExpenseDialogProps {
  serruchoId: string;
  expense: ExpenseWithSplits | null;
  participants: Participant[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExpenseUpdated: () => void;
}

export function EditExpenseDialog({
  serruchoId,
  expense,
  participants,
  open,
  onOpenChange,
  onExpenseUpdated,
}: EditExpenseDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  const [description, setDescription] = React.useState("");
  const [amount, setAmount] = React.useState<string>("");
  const [paidById, setPaidById] = React.useState<string>("");
  const [expenseDate, setExpenseDate] = React.useState("");
  const [category, setCategory] = React.useState<ExpenseCategory>("OTHER");
  const [splitMethod, setSplitMethod] = React.useState<SplitMethod>("EQUAL");

  // Multi-currency support
  const [currency, setCurrency] = React.useState<SupportedCurrency>("DOP");
  const [exchangeRates, setExchangeRates] = React.useState<ExchangeRates | null>(null);
  const [customRate, setCustomRate] = React.useState<string>("");
  const [rateAdjustedBy, setRateAdjustedBy] = React.useState<string | null>(null);
  const [rateAdjustedAt, setRateAdjustedAt] = React.useState<string | null>(null);

  // Receipts
  const [receiptUrls, setReceiptUrls] = React.useState<string[]>([]);

  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [percentages, setPercentages] = React.useState<Record<string, number>>({});
  const [exactAmounts, setExactAmounts] = React.useState<Record<string, number>>({});
  const [shares, setShares] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    getExchangeRates().then((rates) => {
      setExchangeRates(rates);
    });
  }, []);

  // Pre-fill state when dialog opens or expense changes
  React.useEffect(() => {
    if (expense && open) {
      setDescription(expense.description);
      setPaidById(expense.paid_by_participant_id);
      setExpenseDate(expense.expense_date);
      setCategory(expense.category || "OTHER");
      setSplitMethod(expense.split_method);

      // Currency pre-filling: preserve historical rate if exists
      if (expense.original_currency && expense.original_currency !== "DOP") {
        setCurrency(expense.original_currency as SupportedCurrency);
        const origAmt = expense.original_amount_cents != null
          ? fromCents(expense.original_amount_cents).toString()
          : fromCents(expense.amount_cents).toString();
        setAmount(origAmt);
        setCustomRate(expense.exchange_rate_used ? expense.exchange_rate_used.toString() : "");
        setRateAdjustedBy(expense.rate_adjusted_by || null);
        setRateAdjustedAt(expense.rate_adjusted_at || null);
      } else {
        setCurrency("DOP");
        setAmount(fromCents(expense.amount_cents).toString());
        setCustomRate("");
        setRateAdjustedBy(null);
        setRateAdjustedAt(null);
      }

      // Receipts pre-filling
      const urls = expense.receipt_urls || (expense.receipt_url ? [expense.receipt_url] : []);
      setReceiptUrls(urls);

      const selIds = new Set(expense.splits.map((s) => s.participant_id));
      setSelectedIds(selIds);

      const pMap: Record<string, number> = {};
      const eMap: Record<string, number> = {};
      const sMap: Record<string, number> = {};

      for (const s of expense.splits) {
        if (s.percentage_basis_points != null) {
          pMap[s.participant_id] = s.percentage_basis_points / 100;
        }
        eMap[s.participant_id] = fromCents(s.owed_cents);
        sMap[s.participant_id] = 1;
      }

      setPercentages(pMap);
      setExactAmounts(eMap);
      setShares(sMap);
    }
  }, [expense, open]);

  // Computed DOP equivalent amount if currency is USD or EUR
  const convertedDOPAmount = React.useMemo(() => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) return 0;
    const rate = customRate ? parseFloat(customRate) : undefined;
    const cents = convertToDOPCents(parsed, currency, rate);
    return cents / 100;
  }, [amount, currency, customRate]);

  const finalAmountInDOP = currency === "DOP" ? (parseFloat(amount) || 0) : convertedDOPAmount;
  const numAmount = finalAmountInDOP;


  const toggleParticipant = (id: string) => {
    hapticLight();
    const next = new Set(selectedIds);
    if (next.has(id)) {
      if (next.size <= 1) {
        toast({ type: "error", message: "Debe haber al menos un participante en el serrucho" });
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

  // Validation
  const validateForm = (): string | null => {
    if (!description.trim()) return "Ingresa una descripción del gasto";
    if (isNaN(numAmount) || numAmount <= 0) return "El monto debe ser mayor a 0";
    if (!paidById) return "Selecciona quién pagó el gasto";
    if (selectedIds.size === 0) return "Selecciona al menos un participante para dividir el gasto";

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
        return `La suma de los montos (${formatDOP(toCents(sumExact))}) debe ser igual al total (${formatDOP(toCents(numAmount))})`;
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expense) return;

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

      const isForeignCurrency = currency !== "DOP";
      const rawParsedAmount = parseFloat(amount) || 0;
      const effectiveRate = customRate ? parseFloat(customRate) : undefined;

      const res = await fetch(`/api/serruchos/${serruchoId}/expenses/${expense.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          amount: finalAmountInDOP,
          paid_by_participant_id: paidById,
          expense_date: expenseDate,
          category,
          split_method: splitMethod,
          splits: splitPayload,
          receipt_urls: receiptUrls.length > 0 ? receiptUrls : undefined,
          receipt_url: receiptUrls[0] || null,
          // Multi-currency traceability
          original_currency: isForeignCurrency ? currency : null,
          original_amount: isForeignCurrency ? rawParsedAmount : null,
          exchange_rate_used: isForeignCurrency ? (effectiveRate || null) : null,
          rate_adjusted_by: isForeignCurrency ? rateAdjustedBy : null,
          rate_adjusted_at: isForeignCurrency ? rateAdjustedAt : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "No se pudo actualizar el gasto");
      }

      hapticSuccess();
      toast({
        type: "success",
        title: "¡Gasto actualizado!",
        message: `"${description}" se actualizó correctamente y los balances se recalcularon.`,
      });

      onOpenChange(false);
      onExpenseUpdated();
    } catch (err: any) {
      hapticImpact();
      toast({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!expense) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Receipt className="h-5 w-5 text-primary" />
            <span>Editar Gasto</span>
          </DialogTitle>
          <DialogDescription>
            Modifica el monto, moneda, pagador o división. Los balances del coro se recalcularán automáticamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Description & Amount */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Concepto / Descripción</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej. Cena en El Conuco, Combustible..."
                className="text-sm font-medium"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold">Monto *</Label>
                    <div className="flex gap-1">
                      {(["DOP", "USD", "EUR"] as SupportedCurrency[]).map((curr) => (
                        <button
                          key={curr}
                          type="button"
                          onClick={() => {
                            hapticLight();
                            setCurrency(curr);
                            if (curr !== "DOP" && !customRate && exchangeRates) {
                              if (curr === "USD") setCustomRate(exchangeRates.DOP.toString());
                              if (curr === "EUR")
                                setCustomRate((exchangeRates.DOP / exchangeRates.EUR).toFixed(2));
                            }
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

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                      {CURRENCY_SYMBOLS[currency] || currency}
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
                  <Label className="text-xs font-bold">Fecha del Gasto</Label>
                  <Input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="text-xs sm:text-sm"
                    required
                  />
                </div>
              </div>

              {/* Multi-Currency Conversion Info */}
              {currency !== "DOP" && (
                <div className="p-2.5 rounded-xl bg-muted/60 border border-border text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground font-medium">
                        Tasa de Cambio ({currency} a RD$):
                      </span>
                      {rateAdjustedBy && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-400 text-amber-600 dark:text-amber-400">
                          Ajuste Manual
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        step="0.01"
                        value={customRate}
                        onChange={(e) => {
                          setCustomRate(e.target.value);
                          setRateAdjustedBy("manual");
                          setRateAdjustedAt(new Date().toISOString());
                        }}
                        className="h-6 w-20 text-xs font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (exchangeRates) {
                            if (currency === "USD") setCustomRate(exchangeRates.DOP.toString());
                            if (currency === "EUR")
                              setCustomRate((exchangeRates.DOP / exchangeRates.EUR).toFixed(2));
                            setRateAdjustedBy(null);
                            setRateAdjustedAt(null);
                            toast({
                              type: "info",
                              message: "Tasa actualizada a la cotización de mercado actual",
                            });
                          }
                        }}
                        title="Recalcular con tasa de mercado actual"
                        className="text-muted-foreground hover:text-foreground p-1"
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
          </div>

          {/* Payer & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Quién Pagó</Label>
              <select
                value={paidById}
                onChange={(e) => {
                  hapticLight();
                  setPaidById(e.target.value);
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
              <Label className="text-xs font-bold">Categoría</Label>
              <select
                value={category}
                onChange={(e) => {
                  hapticLight();
                  setCategory(e.target.value as ExpenseCategory);
                }}
                className="w-full rounded-lg border border-input bg-card px-2.5 py-2 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {Object.entries(CATEGORY_INFO).map(([key, info]) => (
                  <option key={key} value={key}>
                    {info.emoji} {info.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Split Method */}
          <div className="space-y-2">
            <Label className="text-xs font-bold">Forma de División</Label>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-muted/60 border border-border">
              <button
                type="button"
                onClick={() => {
                  hapticLight();
                  setSplitMethod("EQUAL");
                }}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  splitMethod === "EQUAL"
                    ? "bg-card text-foreground shadow-xs border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Equitativo
              </button>
              <button
                type="button"
                onClick={() => {
                  hapticLight();
                  setSplitMethod("SHARES");
                }}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  splitMethod === "SHARES"
                    ? "bg-card text-foreground shadow-xs border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Cuotas (Shares)
              </button>
              <button
                type="button"
                onClick={() => {
                  hapticLight();
                  setSplitMethod("EXACT");
                }}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  splitMethod === "EXACT"
                    ? "bg-card text-foreground shadow-xs border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Montos Fijos (RD$)
              </button>
            </div>
          </div>

          {/* Participants selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold">Participantes Incluidos</Label>
              <span className="text-[11px] text-muted-foreground font-medium">
                {selectedIds.size} de {participants.length}
              </span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {participants.map((p) => {
                const isSelected = selectedIds.has(p.id);

                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-colors ${
                      isSelected
                        ? "border-primary/40 bg-primary/5"
                        : "border-border/60 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <label className="flex items-center gap-2 cursor-pointer select-none">
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
                          <span className="text-[11px] font-bold text-primary">
                            {formatDOP(
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

          {/* Receipt Attachments */}
          <div className="pt-1">
            <ReceiptGallery
              urls={receiptUrls}
              onChange={setReceiptUrls}
              label="Fotos y comprobantes"
            />
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
              className="w-full sm:w-auto text-xs font-bold gap-1.5"
            >
              <Check className="h-4 w-4" />
              <span>{loading ? "Guardando..." : "Guardar Cambios"}</span>
            </Button>
          </DialogFooter>
        </form>
    </Dialog>
  );
}
