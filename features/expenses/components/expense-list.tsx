"use client";

import * as React from "react";
import { Receipt, Trash2, PlusCircle, Calendar, UserCheck, Percent } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { formatDOP } from "@/lib/finance/math";
import { ExpenseWithSplits } from "@/lib/types/domain";

interface ExpenseListProps {
  serruchoId: string;
  isClosed: boolean;
  expenses: ExpenseWithSplits[];
  onAddClick: () => void;
  onExpenseDeleted: () => void;
}

export function ExpenseList({
  serruchoId,
  isClosed,
  expenses,
  onAddClick,
  onExpenseDeleted,
}: ExpenseListProps) {
  const { toast } = useToast();
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

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

  const totalCents = expenses.reduce((sum, e) => sum + e.amount_cents, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            <span>Gastos Registrados ({expenses.length})</span>
          </CardTitle>
          <CardDescription>
            Total acumulado: <strong className="text-foreground">{formatDOP(totalCents)}</strong>
          </CardDescription>
        </div>

        {!isClosed && (
          <Button size="sm" onClick={onAddClick} className="gap-1.5 font-bold">
            <PlusCircle className="h-4 w-4" />
            <span>Anotar Gasto</span>
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {expenses.length === 0 ? (
          <div className="text-center py-10 border border-dashed rounded-2xl p-6 bg-muted/20">
            <Receipt className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
            <h4 className="font-bold text-foreground text-sm">No hay gastos anotados</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              Registra los pagos realizados por ti o tus amigos para calcular la división automática.
            </p>
            {!isClosed && (
              <Button size="sm" onClick={onAddClick} className="mt-4 gap-1.5 font-bold">
                <PlusCircle className="h-4 w-4" />
                <span>Registrar primer gasto</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
            {expenses.map((exp) => (
              <div
                key={exp.id}
                className="p-4 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h5 className="font-bold text-base text-foreground">{exp.description}</h5>
                    <Badge variant={exp.split_method === "PERCENTAGE" ? "info" : "secondary"} className="text-[10px] uppercase font-bold">
                      {exp.split_method === "PERCENTAGE" ? "% Porcentaje" : "Equitativo"}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <UserCheck className="h-3 w-3 text-primary" /> Pagó: <strong className="text-foreground">{exp.paid_by_name}</strong>
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
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Monto</span>
                    <span className="text-lg font-black text-foreground">{formatDOP(exp.amount_cents)}</span>
                  </div>

                  {!isClosed && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-red-600"
                      onClick={() => handleDelete(exp.id, exp.description)}
                      disabled={deletingId === exp.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
