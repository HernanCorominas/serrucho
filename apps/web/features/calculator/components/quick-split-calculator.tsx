"use client";

import * as React from "react";
import { Calculator, Users, Copy, CheckCircle2, DollarSign, Percent, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { toCents, fromCents, formatDOP } from "@/lib/finance/math";

export function QuickSplitCalculator() {
  const { toast } = useToast();
  const [subtotalInput, setSubtotalInput] = React.useState("3500");
  const [includeItbis, setIncludeItbis] = React.useState(true); // 18%
  const [includeLey, setIncludeLey] = React.useState(true); // 10%
  const [extraTipPercent, setExtraTipPercent] = React.useState(0);
  const [peopleCount, setPeopleCount] = React.useState(4);
  const [copied, setCopied] = React.useState(false);

  const subtotalCents = React.useMemo(() => toCents(subtotalInput), [subtotalInput]);

  const itbisCents = React.useMemo(() => {
    return includeItbis ? Math.round(subtotalCents * 0.18) : 0;
  }, [subtotalCents, includeItbis]);

  const leyCents = React.useMemo(() => {
    return includeLey ? Math.round(subtotalCents * 0.10) : 0;
  }, [subtotalCents, includeLey]);

  const extraTipCents = React.useMemo(() => {
    return extraTipPercent > 0 ? Math.round(subtotalCents * (extraTipPercent / 100)) : 0;
  }, [subtotalCents, extraTipPercent]);

  const totalCents = subtotalCents + itbisCents + leyCents + extraTipCents;

  const perPersonCents = React.useMemo(() => {
    if (peopleCount <= 0) return 0;
    return Math.round(totalCents / peopleCount);
  }, [totalCents, peopleCount]);

  const handleCopy = () => {
    const text =
      `🍽️ *CUENTA DEL RESTAURANTE (Serrucho Rápido)* 🇩🇴\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💵 *Subtotal:* ${formatDOP(subtotalCents)}\n` +
      (includeItbis ? `➕ *ITBIS (18%):* ${formatDOP(itbisCents)}\n` : "") +
      (includeLey ? `➕ *Propina de Ley (10%):* ${formatDOP(leyCents)}\n` : "") +
      (extraTipPercent > 0 ? `➕ *Propina Voluntaria (${extraTipPercent}%):* ${formatDOP(extraTipCents)}\n` : "") +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 *TOTAL GENERAL:* ${formatDOP(totalCents)}\n` +
      `👥 *Entre ${peopleCount} personas:* 👉 *${formatDOP(perPersonCents)} c/u*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🪚 _Calculado en Serrucho.do_`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      type: "success",
      title: "¡Desglose Copiado! 📋",
      message: "Listo para enviar al grupo de WhatsApp.",
    });
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Card className="border-primary/30 shadow-lg bg-gradient-to-b from-card to-card/90">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-primary text-white shadow-md shadow-primary/20">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg sm:text-xl font-extrabold flex items-center gap-2">
                <span>Calculadora Rápida de Cuenta</span>
                <Badge variant="default" className="text-[10px] font-bold">
                  RD 🇩🇴
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Calcula al instante el 18% ITBIS + 10% Ley y divide la cuenta de restaurante parejo.
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Inputs */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="calc_subtotal" className="text-xs font-bold flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-primary" />
                <span>Subtotal de la Factura (RD$)</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-sm">
                  RD$
                </span>
                <Input
                  id="calc_subtotal"
                  type="number"
                  step="0.01"
                  min="0"
                  className="pl-14 text-base sm:text-lg font-extrabold"
                  value={subtotalInput}
                  onChange={(e) => setSubtotalInput(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Dominican Tax Toggles */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-bold text-muted-foreground block">
                Impuestos y Ley Dominicana:
              </span>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIncludeItbis(!includeItbis)}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                    includeItbis
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                      : "border-border bg-card text-muted-foreground hover:border-border/80"
                  }`}
                >
                  <span className="text-xs">18% ITBIS</span>
                  <span className="text-xs font-mono">{includeItbis ? "✓" : "—"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIncludeLey(!includeLey)}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                    includeLey
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                      : "border-border bg-card text-muted-foreground hover:border-border/80"
                  }`}
                >
                  <span className="text-xs">10% Ley</span>
                  <span className="text-xs font-mono">{includeLey ? "✓" : "—"}</span>
                </button>
              </div>
            </div>

            {/* Extra Tip Buttons */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold flex items-center gap-1.5">
                <Percent className="h-3.5 w-3.5 text-primary" />
                <span>Propina Voluntaria Adicional:</span>
              </Label>
              <div className="grid grid-cols-4 gap-1.5">
                {[0, 5, 10, 15].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setExtraTipPercent(pct)}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                      extraTipPercent === pct
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                    }`}
                  >
                    {pct === 0 ? "Sin extra" : `+${pct}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Number of people */}
            <div className="space-y-1.5">
              <Label htmlFor="calc_people" className="text-xs font-bold flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary" />
                <span>Dividir entre cuántas personas:</span>
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 text-base font-bold"
                  onClick={() => setPeopleCount(Math.max(1, peopleCount - 1))}
                >
                  -
                </Button>
                <Input
                  id="calc_people"
                  type="number"
                  min="1"
                  max="100"
                  className="text-center font-bold text-base h-10"
                  value={peopleCount}
                  onChange={(e) => setPeopleCount(Math.max(1, parseInt(e.target.value) || 1))}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 w-10 text-base font-bold"
                  onClick={() => setPeopleCount(peopleCount + 1)}
                >
                  +
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column: Real-time Result Card */}
          <div className="flex flex-col justify-between p-5 rounded-2xl bg-gradient-to-br from-primary/10 via-muted/40 to-background border border-primary/20 space-y-4">
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-muted-foreground pb-2 border-b border-border">
                <span>Subtotal sin impuestos:</span>
                <span className="font-semibold text-foreground">{formatDOP(subtotalCents)}</span>
              </div>

              {includeItbis && (
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>ITBIS (18%):</span>
                  <span className="font-semibold text-foreground">+{formatDOP(itbisCents)}</span>
                </div>
              )}

              {includeLey && (
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Propina Legal (10%):</span>
                  <span className="font-semibold text-foreground">+{formatDOP(leyCents)}</span>
                </div>
              )}

              {extraTipPercent > 0 && (
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Propina Extra ({extraTipPercent}%):</span>
                  <span className="font-semibold text-foreground">+{formatDOP(extraTipCents)}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-sm font-bold text-foreground pt-2 border-t border-border">
                <span>Total de la Factura:</span>
                <span className="text-base font-extrabold text-foreground">{formatDOP(totalCents)}</span>
              </div>
            </div>

            {/* Per Person Hero Display */}
            <div className="p-4 rounded-xl bg-background border border-primary/30 shadow-md text-center space-y-1">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Le toca a cada uno ({peopleCount} {peopleCount === 1 ? "persona" : "personas"}):
              </span>
              <div className="text-2xl sm:text-3xl font-black text-primary tracking-tight">
                {formatDOP(perPersonCents)}
              </div>
            </div>

            <Button
              type="button"
              variant="default"
              onClick={handleCopy}
              className="w-full gap-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>¡Desglose Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copiar Desglose para WhatsApp</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
