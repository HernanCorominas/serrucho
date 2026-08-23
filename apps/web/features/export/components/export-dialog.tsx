"use client";

import * as React from "react";
import { Download, FileSpreadsheet, FileText, Check, Loader2, Sparkles } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { hapticLight, hapticSuccess } from "@/lib/utils/haptics";

interface ExportSerruchoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serruchoId: string;
  serruchoName: string;
}

export function ExportSerruchoDialog({
  open,
  onOpenChange,
  serruchoId,
  serruchoName,
}: ExportSerruchoDialogProps) {
  const { toast } = useToast();
  const [format, setFormat] = React.useState<"xlsx" | "csv">("xlsx");
  const [csvSheet, setCsvSheet] = React.useState<"Movimientos" | "Resumen" | "Liquidacion" | "Historial">("Movimientos");
  const [isExporting, setIsExporting] = React.useState(false);

  const handleDownload = async () => {
    try {
      hapticLight();
      setIsExporting(true);

      const url =
        format === "xlsx"
          ? `/api/serruchos/${serruchoId}/export?format=xlsx`
          : `/api/serruchos/${serruchoId}/export?format=csv&sheet=${csvSheet}`;

      const res = await fetch(url);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Error al exportar los datos");
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;

      // Extract filename from header if possible
      const contentDisposition = res.headers.get("content-disposition");
      let filename = `Serrucho_${serruchoName}_export.${format}`;
      if (contentDisposition && contentDisposition.includes("filename=")) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      hapticSuccess();
      toast({
        type: "success",
        title: "¡Reporte exportado con éxito!",
        message: `El archivo ${filename} se ha descargado correctamente.`,
      });

      onOpenChange(false);
    } catch (err: any) {
      toast({
        type: "error",
        title: "Error al exportar",
        message: err.message || "No se pudo generar el archivo de exportación.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <DialogTitle>Exportar Hoja de Cálculo</DialogTitle>
            <DialogDescription>
              Descarga todos los gastos, balances y cuentas para Excel o Google Sheets.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="space-y-4 py-2">
        {/* Format Selection Cards */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Formato de Exportación
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* XLSX Option */}
            <button
              type="button"
              onClick={() => setFormat("xlsx")}
              className={`flex flex-col text-left p-3.5 rounded-2xl border transition-all ${
                format === "xlsx"
                  ? "border-emerald-500 bg-emerald-500/5 shadow-xs ring-2 ring-emerald-500/20"
                  : "border-border bg-card hover:border-muted-foreground/30"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  <span>Microsoft Excel (.XLSX)</span>
                </div>
                <Badge variant="success" className="text-[10px] font-extrabold">
                  Completo
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Incluye 4 hojas de cálculo: <strong>Resumen</strong>, <strong>Movimientos</strong>,{" "}
                <strong>Liquidación</strong> e <strong>Historial</strong> con fórmulas y formato.
              </p>
            </button>

            {/* CSV Option */}
            <button
              type="button"
              onClick={() => setFormat("csv")}
              className={`flex flex-col text-left p-3.5 rounded-2xl border transition-all ${
                format === "csv"
                  ? "border-emerald-500 bg-emerald-500/5 shadow-xs ring-2 ring-emerald-500/20"
                  : "border-border bg-card hover:border-muted-foreground/30"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                  <FileText className="h-4 w-4 text-cyan-600" />
                  <span>Texto Plano (.CSV)</span>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold">
                  Universal
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Valores separados por comas. Compatible con cualquier software o base de datos.
              </p>
            </button>
          </div>
        </div>

        {/* CSV Sheet Selector (Only if CSV is selected) */}
        {format === "csv" && (
          <div className="space-y-2 pt-1 animate-in fade-in duration-150">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Hoja a Exportar como CSV
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "Movimientos", label: "Movimientos (Gastos)", desc: "Todos los pagos y transferencias" },
                { id: "Resumen", label: "Resumen de Balances", desc: "Totales por participante" },
                { id: "Liquidacion", label: "Liquidación y Deudas", desc: "Esquema óptimo de pagos" },
                { id: "Historial", label: "Historial de Actividad", desc: "Registro de auditoría" },
              ].map((sheet) => (
                <button
                  key={sheet.id}
                  type="button"
                  onClick={() => setCsvSheet(sheet.id as any)}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                    csvSheet === sheet.id
                      ? "border-emerald-500 bg-emerald-500/10 font-bold text-foreground"
                      : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="font-bold">{sheet.label}</div>
                  <div className="text-[10px] opacity-75">{sheet.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Features banner */}
        <div className="rounded-xl p-3 bg-muted/50 border border-border text-xs text-muted-foreground flex items-center gap-2.5">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <span>
            Las cifras exportadas coinciden al 100% con los centavos calculados por el motor contable de Serrucho.
          </span>
        </div>
      </div>

      <DialogFooter className="sm:justify-between flex-row items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onOpenChange(false)}
          disabled={isExporting}
        >
          Cancelar
        </Button>

        <Button
          type="button"
          onClick={handleDownload}
          disabled={isExporting}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-5 rounded-xl gap-2 shadow-md shadow-emerald-600/20"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generando...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>Descargar {format.toUpperCase()}</span>
            </>
          )}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
