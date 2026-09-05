"use client";

import * as React from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Receipt,
  Calendar,
  User,
  Users,
  PieChart,
  Tag,
  Paperclip,
  X,
  ExternalLink,
  Edit2,
  Trash2,
} from "lucide-react";
import {
  ExpenseWithSplits,
  Participant,
  CATEGORY_INFO,
} from "@/lib/types/domain";
import { formatDOP } from "@/lib/finance/math";
import { formatForeignAmount } from "@/lib/finance/currency";

interface ExpenseDetailDialogProps {
  expense: ExpenseWithSplits | null;
  participants: Participant[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (expense: ExpenseWithSplits) => void;
  onDelete?: (id: string, desc: string) => void;
  isReadOnly?: boolean;
}

export function ExpenseDetailDialog({
  expense,
  participants,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  isReadOnly = false,
}: ExpenseDetailDialogProps) {
  if (!expense) return null;

  const cat = CATEGORY_INFO[expense.category] || CATEGORY_INFO.OTHER;
  const isForeign =
    expense.original_currency &&
    expense.original_currency !== "DOP" &&
    expense.original_amount_cents;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="max-w-md w-full space-y-4">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary text-xl">
                {cat.emoji}
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-black text-foreground">
                  {expense.description}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Detalle completo y desglose de la división
                </DialogDescription>
              </div>
            </div>
            <Badge variant="outline" className={`text-xs font-bold border ${cat.color}`}>
              {cat.label}
            </Badge>
          </div>
        </DialogHeader>

        {/* Financial Header Card */}
        <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Monto Total</span>
            <div className="text-right">
              <div className="text-xl sm:text-2xl font-black text-primary">
                {formatDOP(expense.amount_cents)}
              </div>
              {isForeign && (
                <div className="text-xs font-semibold text-muted-foreground">
                  ({formatForeignAmount(expense.original_amount_cents!, expense.original_currency!)})
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px]">Pagado por:</span>
              <span className="font-bold text-foreground flex items-center gap-1 mt-0.5">
                <User className="h-3.5 w-3.5 text-primary" />
                <span>{expense.paid_by_name || "Participante"}</span>
              </span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[11px]">Fecha del gasto:</span>
              <span className="font-bold text-foreground flex items-center gap-1 mt-0.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span>
                  {expense.expense_date
                    ? new Date(expense.expense_date).toLocaleDateString("es-DO", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "Fecha actual"}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Division Breakdown */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-foreground">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-primary" />
              <span>División entre integrantes ({expense.splits.length})</span>
            </div>
            <Badge variant="secondary" className="text-[10px] uppercase font-extrabold">
              {expense.split_method === "EQUAL"
                ? "Equitativo"
                : expense.split_method === "PERCENTAGE"
                ? "Porcentual"
                : expense.split_method === "SHARES"
                ? "Proporcional"
                : "Monto Exacto"}
            </Badge>
          </div>

          <div className="border border-border rounded-xl divide-y divide-border bg-card overflow-hidden">
            {expense.splits.map((s) => {
              const participant = participants.find((p) => p.id === s.participant_id);
              const pName = participant?.name || s.participant_name || "Participante";
              const isPayer = s.participant_id === expense.paid_by_participant_id;

              return (
                <div
                  key={s.participant_id}
                  className="flex items-center justify-between p-2.5 text-xs hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
                      {pName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-foreground">{pName}</span>
                        {isPayer && (
                          <Badge variant="outline" className="text-[9px] font-bold text-emerald-600 border-emerald-300 py-0">
                            Pagó
                          </Badge>
                        )}
                      </div>
                      {s.percentage_basis_points ? (
                        <span className="text-[10px] text-muted-foreground">
                          {(s.percentage_basis_points / 100).toFixed(1)}% del total
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="text-right font-extrabold text-foreground">
                    {formatDOP(s.owed_cents)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Attachment preview if exists */}
        {expense.receipt_urls && expense.receipt_urls.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-xs font-bold text-foreground">
              <Paperclip className="h-3.5 w-3.5 text-primary" />
              <span>Comprobante o factura adjunta</span>
            </div>
            <div className="rounded-xl border border-border p-2 bg-muted/20">
              <a
                href={expense.receipt_urls[0]}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-2 text-xs font-semibold text-primary hover:underline"
              >
                <span>Ver imagen del recibo</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        )}

        <DialogFooter className="pt-2 flex flex-row justify-between items-center sm:justify-between">
          {!isReadOnly && onDelete && onEdit ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onDelete(expense.id, expense.description);
                }}
                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950 border-red-200 text-xs font-bold gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Eliminar</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onEdit(expense);
                }}
                className="text-xs font-bold gap-1"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Editar</span>
              </Button>
            </div>
          ) : (
            <div />
          )}

          <Button
            type="button"
            variant="default"
            onClick={() => onOpenChange(false)}
            className="text-xs font-bold px-4"
          >
            Cerrar
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  );
}
