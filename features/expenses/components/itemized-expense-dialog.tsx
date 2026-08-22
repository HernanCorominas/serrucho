"use client";

import * as React from "react";
import { Plus, Trash2, Users, UtensilsCrossed, Check } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Participant, ItemizedExpenseLine } from "@/lib/types/domain";
import { calculateItemizedSplits, formatDOP } from "@/lib/finance/math";
import { hapticLight, hapticSuccess } from "@/lib/utils/haptics";

interface ItemizedExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participants: Participant[];
  onApplyItemizedSplit: (params: {
    totalAmount: number;
    description: string;
    splitPercentages: Record<string, number>;
  }) => void;
}

export function ItemizedExpenseDialog({
  open,
  onOpenChange,
  participants,
  onApplyItemizedSplit,
}: ItemizedExpenseDialogProps) {
  const [lines, setLines] = React.useState<ItemizedExpenseLine[]>([
    {
      id: "1",
      name: "Plato / Consumo 1",
      amountCents: 0,
      assignedParticipantIds: participants.map((p) => p.id),
    },
  ]);

  const [includeItbis, setIncludeItbis] = React.useState(true);
  const [includeService, setIncludeService] = React.useState(true);
  const [customTip, setCustomTip] = React.useState<string>("");

  const participantIds = React.useMemo(() => participants.map((p) => p.id), [participants]);

  const splitResult = React.useMemo(() => {
    return calculateItemizedSplits({
      lines,
      participantIds,
      itbisPercent: includeItbis ? 18 : 0,
      servicePercent: includeService ? 10 : 0,
      customTipCents: customTip ? Math.round(parseFloat(customTip) * 100) : 0,
    });
  }, [lines, participantIds, includeItbis, includeService, customTip]);

  const addLine = () => {
    hapticLight();
    setLines((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        name: `Consumo ${prev.length + 1}`,
        amountCents: 0,
        assignedParticipantIds: [...participantIds],
      },
    ]);
  };

  const removeLine = (id: string) => {
    hapticLight();
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  const updateLine = (id: string, field: "name" | "amount", value: string) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        if (field === "name") return { ...l, name: value };
        const clean = value.replace(/[^0-9.]/g, "");
        const parsed = parseFloat(clean);
        return { ...l, amountCents: isNaN(parsed) ? 0 : Math.round(parsed * 100) };
      })
    );
  };

  const toggleParticipantInLine = (lineId: string, partId: string) => {
    hapticLight();
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== lineId) return l;
        const exists = l.assignedParticipantIds.includes(partId);
        const next = exists
          ? l.assignedParticipantIds.filter((id) => id !== partId)
          : [...l.assignedParticipantIds, partId];
        return { ...l, assignedParticipantIds: next };
      })
    );
  };

  const selectAllInLine = (lineId: string) => {
    hapticLight();
    setLines((prev) =>
      prev.map((l) => (l.id === lineId ? { ...l, assignedParticipantIds: [...participantIds] } : l))
    );
  };

  const handleApply = () => {
    if (splitResult.totalFinalCents <= 0) return;

    hapticSuccess();
    const splitPercentages: Record<string, number> = {};
    splitResult.participantTotals.forEach((pt) => {
      splitPercentages[pt.participantId] = pt.basisPoints / 100;
    });

    const dishNames = lines
      .filter((l) => l.amountCents > 0)
      .map((l) => l.name)
      .slice(0, 3)
      .join(", ");

    onApplyItemizedSplit({
      totalAmount: splitResult.totalFinalCents / 100,
      description: dishNames ? `Cena: ${dishNames}` : "Consumo Desglosado",
      splitPercentages,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="space-y-4 max-h-[85vh] overflow-y-auto pr-1">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 font-bold">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Desglose por Ítems & Platos
              </DialogTitle>
              <DialogDescription className="text-xs">
                Anota qué consumió cada amigo y calculamos los impuestos (ITBIS + Ley) proporcionalmente.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Lines Builder */}
        <div className="space-y-3">
          {lines.map((line, idx) => (
            <div
              key={line.id}
              className="p-3 rounded-2xl border border-border bg-muted/20 space-y-2 text-xs"
            >
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Ej. Mofongo, Cervezas..."
                  value={line.name}
                  onChange={(e) => updateLine(line.id, "name", e.target.value)}
                  className="h-8 text-xs font-semibold flex-1"
                />

                <div className="relative w-28">
                  <span className="absolute left-2 top-2 text-[10px] font-bold text-muted-foreground">
                    RD$
                  </span>
                  <Input
                    placeholder="0.00"
                    type="number"
                    value={line.amountCents > 0 ? (line.amountCents / 100).toString() : ""}
                    onChange={(e) => updateLine(line.id, "amount", e.target.value)}
                    className="h-8 pl-8 text-xs font-bold"
                  />
                </div>

                {lines.length > 1 && (
                  <button
                    onClick={() => removeLine(line.id)}
                    className="text-muted-foreground hover:text-red-500 p-1"
                    title="Eliminar plato"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Participant Assignment Chips */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
                  <span>¿Quiénes consumieron esto?</span>
                  <button
                    onClick={() => selectAllInLine(line.id)}
                    className="text-primary hover:underline"
                  >
                    Todos
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {participants.map((p) => {
                    const isAssigned = line.assignedParticipantIds.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleParticipantInLine(line.id, p.id)}
                        className={`py-1 px-2 rounded-lg text-[11px] font-semibold border transition-all ${
                          isAssigned
                            ? "bg-primary text-white border-primary shadow-2xs"
                            : "border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {p.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addLine}
            className="w-full gap-1.5 text-xs font-bold border-dashed"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Agregar otro plato o bebida</span>
          </Button>
        </div>

        {/* Taxes & Tip Configuration */}
        <div className="p-3 rounded-2xl bg-muted/40 border border-border space-y-2 text-xs">
          <span className="font-bold text-foreground block">Impuestos & Propina Legal</span>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={includeItbis}
                onChange={(e) => setIncludeItbis(e.target.checked)}
                className="rounded border-input text-primary focus:ring-primary"
              />
              <span>ITBIS (18%)</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={includeService}
                onChange={(e) => setIncludeService(e.target.checked)}
                className="rounded border-input text-primary focus:ring-primary"
              />
              <span>10% de Ley</span>
            </label>

            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-muted-foreground">Propina Voluntaria:</span>
              <Input
                type="number"
                placeholder="RD$ 0"
                value={customTip}
                onChange={(e) => setCustomTip(e.target.value)}
                className="h-7 w-20 text-xs font-bold"
              />
            </div>
          </div>
        </div>

        {/* Summary Table */}
        <div className="p-3 rounded-2xl bg-background border border-border space-y-2 text-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Subtotal platos:</span>
            <span className="font-bold text-foreground">
              {formatDOP(splitResult.totalSubtotalCents)}
            </span>
          </div>

          <div className="flex items-center justify-between text-muted-foreground">
            <span>Impuestos + Propina:</span>
            <span className="font-bold text-foreground">
              {formatDOP(splitResult.itbisCents + splitResult.serviceCents + splitResult.tipCents)}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border font-extrabold text-sm text-foreground">
            <span>Total Final Cuenta:</span>
            <span className="text-primary text-base">
              {formatDOP(splitResult.totalFinalCents)}
            </span>
          </div>

          {/* Per-person breakdown mini-chips */}
          <div className="pt-2 border-t border-border/60 space-y-1">
            <span className="text-[11px] font-bold text-muted-foreground">
              Resultado por persona:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {splitResult.participantTotals.map((pt) => {
                const pName = participants.find((p) => p.id === pt.participantId)?.name;
                return (
                  <div
                    key={pt.participantId}
                    className="flex justify-between p-1.5 rounded-lg bg-muted/30 border border-border/50 text-[11px]"
                  >
                    <span className="truncate max-w-[90px] font-medium">{pName}:</span>
                    <span className="font-bold text-foreground">
                      {formatDOP(pt.totalOwedCents)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleApply}
            disabled={splitResult.totalFinalCents <= 0}
            className="gap-1.5 text-xs font-bold bg-primary text-white"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Aplicar al Gasto</span>
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  );
}
