"use client";

import * as React from "react";
import { Copy, CheckCircle2, Download, FileSpreadsheet, MessageSquareShare } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatDOP, simplifyDebts, fromCents, generateGroupWhatsAppSummary } from "@/lib/finance/math";
import { Expense, ParticipantFinancials, CATEGORY_INFO } from "@/lib/types/domain";

interface GroupSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serruchoName: string;
  totalExpensesCents: number;
  participants: ParticipantFinancials[];
  expenses: Expense[];
  closedAt?: string | null;
}

export function GroupSummaryDialog({
  open,
  onOpenChange,
  serruchoName,
  totalExpensesCents,
  participants,
  expenses,
  closedAt,
}: GroupSummaryDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  const transfers = React.useMemo(() => {
    return simplifyDebts(participants, participants);
  }, [participants]);

  const summaryText = React.useMemo(() => {
    return generateGroupWhatsAppSummary({
      serruchoName,
      totalExpensesCents,
      transfers,
      closedAt,
    });
  }, [serruchoName, totalExpensesCents, transfers, closedAt]);

  const handleCopyText = () => {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    toast({
      type: "success",
      title: "¡Resumen Copiado! 📋",
      message: "Puedes pegarlo directamente en el grupo de WhatsApp del coro.",
    });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleExportCSV = () => {
    const participantNameMap = new Map(participants.map((p) => [p.id, p.name]));

    // Build CSV header and rows
    const headers = ["Fecha", "Concepto", "Categoría", "Pagado Por", "Monto Total (RD$)"];
    const rows = expenses.map((e) => [
      `"${e.expense_date}"`,
      `"${e.description.replace(/"/g, '""')}"`,
      `"${CATEGORY_INFO[e.category]?.label || e.category}"`,
      `"${participantNameMap.get(e.paid_by_participant_id) || "Desconocido"}"`,
      fromCents(e.amount_cents).toFixed(2),
    ]);

    // Add summary section
    rows.push([]);
    rows.push(["---", "---", "---", "---", "---"]);
    rows.push(["Total Gastado", "", "", "", fromCents(totalExpensesCents).toFixed(2)]);
    rows.push([]);
    rows.push(["Participante", "Pagado Total (RD$)", "Corresponde (RD$)", "Balance Neto (RD$)", "Estado"]);

    participants.forEach((p) => {
      rows.push([
        `"${p.name}"`,
        fromCents(p.total_paid_cents).toFixed(2),
        fromCents(p.total_owed_cents).toFixed(2),
        fromCents(p.net_balance_cents).toFixed(2),
        p.net_balance_cents > 0 ? "Recibe" : p.net_balance_cents < 0 ? "Debe" : "Al día",
      ]);
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeName = serruchoName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    link.setAttribute("href", url);
    link.setAttribute("download", `serrucho-${safeName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      type: "success",
      title: "Archivo CSV descargado 📊",
      message: "Listo para abrir en Excel o Google Sheets.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <MessageSquareShare className="h-5 w-5" />
          </div>
          <DialogTitle>Compartir y Exportar Serrucho</DialogTitle>
        </div>
        <DialogDescription>
          Copia el balance optimizado para tu grupo de WhatsApp o descarga el reporte en Excel/CSV.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-1">
        {/* Quick action buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <Button
            type="button"
            variant="default"
            onClick={handleCopyText}
            className="w-full gap-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {copied ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copiar para WhatsApp</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleExportCSV}
            className="w-full gap-2 font-semibold"
          >
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            <span>Descargar CSV (Excel)</span>
          </Button>
        </div>

        {/* Text preview */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-muted-foreground">Vista previa del mensaje:</span>
          <textarea
            rows={8}
            readOnly
            value={summaryText}
            className="w-full rounded-xl border border-input bg-muted/60 p-3 font-mono text-xs text-foreground focus:outline-none select-all"
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cerrar
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
