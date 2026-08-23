"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Users,
  Receipt,
  Loader2,
  ArrowRight,
  Sparkles,
  Download,
} from "lucide-react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { formatDOP } from "@/lib/finance/math";
import { ImportPreviewResult } from "../types";
import { useAuth } from "@/lib/hooks/use-auth";
import { hapticLight, hapticSuccess } from "@/lib/utils/haptics";

interface ImportSerruchoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess?: (serruchoId: string) => void;
}

export function ImportSerruchoDialog({
  open,
  onOpenChange,
  onImportSuccess,
}: ImportSerruchoDialogProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [step, setStep] = React.useState<"upload" | "preview">("upload");
  const [file, setFile] = React.useState<File | null>(null);
  const [rawText, setRawText] = React.useState("");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [preview, setPreview] = React.useState<ImportPreviewResult | null>(null);

  // Editable preview fields
  const [serruchoName, setSerruchoName] = React.useState("");
  const [currency, setCurrency] = React.useState("DOP");

  const resetState = () => {
    setStep("upload");
    setFile(null);
    setRawText("");
    setPreview(null);
    setSerruchoName("");
    setCurrency("DOP");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const text = await selected.text();
      setRawText(text);
      await generatePreview(text, selected.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const generatePreview = async (csvText: string, suggestedName?: string) => {
    if (!csvText.trim()) {
      toast({ type: "error", title: "Archivo vacío", message: "El contenido no tiene datos." });
      return;
    }

    try {
      setIsProcessing(true);
      hapticLight();

      const res = await fetch("/api/import/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csvContent: csvText,
          serruchoName: suggestedName || "Coro Importado",
          defaultCurrency: "DOP",
        }),
      });

      if (!res.ok) {
        throw new Error("No se pudo procesar la previsualización");
      }

      const data: ImportPreviewResult = await res.json();
      setPreview(data);
      setSerruchoName(data.serrucho_name_suggested || suggestedName || "Coro Importado");
      setCurrency(data.currency || "DOP");
      setStep("preview");
    } catch (err: any) {
      toast({
        type: "error",
        title: "Error de lectura",
        message: err.message || "Formato de archivo no reconocido.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!preview || !serruchoName.trim()) return;

    try {
      setIsProcessing(true);
      hapticLight();

      const res = await fetch("/api/import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          serrucho_name: serruchoName.trim(),
          currency,
          description: `Importado desde ${preview.format_detected === "SPLITWISE_CSV" ? "Splitwise" : "CSV"}`,
          participant_names: preview.participant_names,
          movements: preview.movements,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al crear el Serrucho");
      }

      hapticSuccess();
      toast({
        type: "success",
        title: "¡Serrucho importado con éxito! 🎉",
        message: `Se crearon ${data.participantsCount} participantes y ${data.movementsCount} movimientos.`,
      });

      onOpenChange(false);
      resetState();
      onImportSuccess?.(data.serruchoId);
      router.push(`/dashboard/${data.serruchoId}`);
    } catch (err: any) {
      toast({
        type: "error",
        title: "No se pudo importar",
        message: err.message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSampleTemplate = () => {
    const sample = `Fecha,Descripcion,Monto,Moneda,Pagado_Por,Participantes,Categoria
2026-08-15,Villa Las Terrenas,15000,DOP,Carlos,Carlos|Laura|Pedro|María,LODGING
2026-08-16,Supermercado Nacional,6400,DOP,Laura,Carlos|Laura|Pedro|María,GROCERIES
2026-08-16,Gasolina y Peajes,2200,DOP,Pedro,Carlos|Laura|Pedro|María,TRANSPORT
2026-08-17,Pescado en la Playa,4800,DOP,Carlos,Carlos|Laura|Pedro|María,FOOD_DINING`;

    const blob = new Blob([sample], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_serrucho_ejemplo.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <DialogTitle className="text-base font-extrabold text-foreground">
              Importar desde Splitwise o CSV
            </DialogTitle>
            <DialogDescription className="text-xs">
              {step === "upload"
                ? "Sube tu archivo exportado de Splitwise o una hoja de cálculo CSV."
                : "Revisa la detección de participantes y gastos antes de crear el Serrucho."}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      {step === "upload" ? (
        <div className="space-y-4 py-2 text-xs">
          {/* Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/40 transition-all rounded-2xl p-6 text-center cursor-pointer space-y-2 group"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors text-muted-foreground">
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-foreground">
                Haz clic para seleccionar tu archivo CSV
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Compatible con exportaciones de Splitwise y formato Serrucho estándar (.csv)
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv,text/plain"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Sample download & instructions */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border text-[11px]">
            <span className="text-muted-foreground">¿No tienes un CSV listo?</span>
            <button
              type="button"
              onClick={downloadSampleTemplate}
              className="font-bold text-primary hover:underline inline-flex items-center gap-1"
            >
              <Download className="h-3 w-3" />
              <span>Descargar plantilla de ejemplo</span>
            </button>
          </div>
        </div>
      ) : (
        preview && (
          <div className="space-y-4 py-1 text-xs max-h-[60vh] overflow-y-auto pr-1">
            {/* Top configuration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">
                  Nombre del Serrucho:
                </label>
                <Input
                  value={serruchoName}
                  onChange={(e) => setSerruchoName(e.target.value)}
                  placeholder="Nombre del viaje o coro"
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">
                  Moneda Principal:
                </label>
                <Input
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                  placeholder="DOP"
                  className="text-xs h-9 font-mono font-bold"
                />
              </div>
            </div>

            {/* Detection Summary Banner */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
              <div>
                <div className="font-extrabold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Formato: {preview.format_detected === "SPLITWISE_CSV" ? "Splitwise CSV" : "Serrucho CSV"}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {preview.participant_names.length} participantes • {preview.total_movements} movimientos detectados
                </p>
              </div>
              <div className="text-right font-mono font-black text-sm text-foreground">
                {formatDOP(preview.total_expenses_cents)}
              </div>
            </div>

            {/* Detected Participants */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                <span>Participantes Detectados ({preview.participant_names.length}):</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {preview.participant_names.map((name, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="font-semibold text-[11px] bg-muted/50 px-2.5 py-1 rounded-lg"
                  >
                    👤 {name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Movements List Preview */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Receipt className="h-3.5 w-3.5" />
                <span>Movimientos ({preview.movements.length}):</span>
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto border border-border rounded-xl p-2 bg-card">
                {preview.movements.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/40 hover:bg-muted/70 text-[11px]"
                  >
                    <div className="min-w-0 pr-2">
                      <strong className="block text-foreground truncate">{m.description}</strong>
                      <span className="text-[10px] text-muted-foreground">
                        {m.date} • Pagó: <strong>{m.paid_by_name}</strong>
                      </span>
                    </div>
                    <div className="font-mono font-bold text-xs shrink-0">
                      {formatDOP(m.amount_cents)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Warnings or Errors if any */}
            {preview.warnings.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-[11px] space-y-1">
                <strong className="flex items-center gap-1 text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Avisos ({preview.warnings.length}):</span>
                </strong>
                <ul className="list-disc list-inside space-y-0.5 text-[10px]">
                  {preview.warnings.slice(0, 3).map((w, idx) => (
                    <li key={idx}>{w.message}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )
      )}

      <DialogFooter className="sm:justify-between flex-row items-center gap-2 pt-2">
        {step === "preview" ? (
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setStep("upload")}
              disabled={isProcessing}
              className="text-xs"
            >
              Cambiar Archivo
            </Button>

            <Button
              type="button"
              onClick={handleConfirmImport}
              disabled={isProcessing || !preview?.is_valid || !serruchoName.trim()}
              className="bg-primary hover:bg-primary/90 text-white font-bold text-xs h-10 px-5 rounded-xl gap-2 shadow-md"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Importando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Crear y Migrar Coro</span>
                </>
              )}
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs ml-auto"
          >
            Cancelar
          </Button>
        )}
      </DialogFooter>
    </Dialog>
  );
}
