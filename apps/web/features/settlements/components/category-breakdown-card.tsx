"use client";

import * as React from "react";
import { PieChart } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { formatDOP, calculateCategoryTotals } from "@/lib/finance/math";
import { Expense, CATEGORY_INFO } from "@/lib/types/domain";

interface CategoryBreakdownCardProps {
  expenses: Expense[];
  currency?: string;
}

export function CategoryBreakdownCard({ expenses }: CategoryBreakdownCardProps) {
  const breakdown = React.useMemo(() => {
    return calculateCategoryTotals(expenses);
  }, [expenses]);

  const totalCents = expenses.reduce((sum, e) => sum + e.amount_cents, 0);

  if (expenses.length === 0) return null;

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <PieChart className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg">Distribución por Categoría</CardTitle>
              <CardDescription className="text-xs">
                Desglose de en qué se fue el presupuesto del coro
              </CardDescription>
            </div>
          </div>
          <span className="text-xs font-bold text-muted-foreground">
            {breakdown.length} {breakdown.length === 1 ? "categoría" : "categorías"}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {breakdown.map((item) => {
          const info = CATEGORY_INFO[item.category] || CATEGORY_INFO.OTHER;

          return (
            <div key={item.category} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-base">{info.emoji}</span>
                  <span className="font-semibold text-foreground">{info.label}</span>
                  <span className="text-[11px] text-muted-foreground">
                    ({item.expense_count} {item.expense_count === 1 ? "gasto" : "gastos"})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">{formatDOP(item.total_cents)}</span>
                  <span className="text-xs text-muted-foreground w-12 text-right">
                    {item.percentage}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${Math.max(item.percentage, 3)}%` }}
                />
              </div>
            </div>
          );
        })}

        <div className="pt-2 border-t border-border flex justify-between text-xs font-semibold text-muted-foreground">
          <span>Gasto Total Acumulado:</span>
          <span className="font-extrabold text-foreground">{formatDOP(totalCents)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
