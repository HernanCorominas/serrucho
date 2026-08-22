"use client";

import * as React from "react";
import QRCode from "qrcode";
import { QrCode, Download, Copy, Check, ExternalLink, Smartphone, CreditCard } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { hapticLight, hapticSuccess } from "@/lib/utils/haptics";

interface PaymentQRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  publicUrl?: string;
  paymentInstructions?: string | null;
  participantName?: string;
  amountFormatted?: string;
}

export function PaymentQRDialog({
  open,
  onOpenChange,
  title,
  publicUrl,
  paymentInstructions,
  participantName,
  amountFormatted,
}: PaymentQRDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState<"LINK" | "BANK">("LINK");
  const [copied, setCopied] = React.useState(false);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const qrContent =
    activeTab === "LINK"
      ? publicUrl || ""
      : paymentInstructions
      ? `SERRUCHO: ${title}\nPara: ${participantName || "Participante"}\nMonto: ${amountFormatted || ""}\n\nDatos de Pago:\n${paymentInstructions}`
      : publicUrl || "";

  React.useEffect(() => {
    if (!open || !canvasRef.current || !qrContent) return;

    QRCode.toCanvas(
      canvasRef.current,
      qrContent,
      {
        width: 240,
        margin: 2,
        color: {
          dark: "#1e293b",
          light: "#ffffff",
        },
      },
      (err) => {
        if (err) console.error("Error generating QR code:", err);
      }
    );
  }, [open, qrContent, activeTab]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    hapticSuccess();
    const link = document.createElement("a");
    link.download = `QR-Serrucho-${participantName || "pago"}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
    toast({
      type: "success",
      title: "QR descargado",
      message: "Imagen de código QR guardada con éxito.",
    });
  };

  const handleCopyText = () => {
    hapticLight();
    navigator.clipboard.writeText(qrContent);
    setCopied(true);
    toast({
      type: "success",
      title: "Copiado al portapapeles",
      message: activeTab === "LINK" ? "Enlace copiado." : "Datos bancarios copiados.",
    });
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="space-y-4 text-center">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-1">
            <QrCode className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl font-extrabold text-foreground">
            Escanear Código QR
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Apunta con la cámara de tu celular para abrir el comprobante o escanear los datos de pago al instante.
          </DialogDescription>
        </DialogHeader>

        {/* Tab switchers */}
        {paymentInstructions && (
          <div className="flex rounded-xl bg-muted p-1 gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                hapticLight();
                setActiveTab("LINK");
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all ${
                activeTab === "LINK"
                  ? "bg-background text-foreground shadow-xs font-extrabold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Ver Comprobante</span>
            </button>

            <button
              type="button"
              onClick={() => {
                hapticLight();
                setActiveTab("BANK");
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all ${
                activeTab === "BANK"
                  ? "bg-background text-foreground shadow-xs font-extrabold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>Datos Bancarios</span>
            </button>
          </div>
        )}

        {/* Canvas Display */}
        <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border-2 border-border/80 shadow-inner max-w-xs mx-auto">
          <canvas ref={canvasRef} className="rounded-xl shadow-xs" />
          <span className="text-[11px] font-semibold text-slate-500 mt-2">
            {activeTab === "LINK"
              ? "🔗 Escanea para abrir estado de cuenta"
              : "💳 Escanea para copiar datos de transferencia"}
          </span>
        </div>

        {/* Text Preview */}
        <div className="p-3 bg-muted/40 rounded-xl border border-border text-left text-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground font-semibold">
            <span>{activeTab === "LINK" ? "Enlace de acceso:" : "Información de pago:"}</span>
            <button
              onClick={handleCopyText}
              className="text-primary hover:underline inline-flex items-center gap-1 font-bold"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
              <span>{copied ? "¡Copiado!" : "Copiar"}</span>
            </button>
          </div>
          <p className="text-foreground font-mono text-[11px] truncate select-all">
            {qrContent}
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="gap-1.5 text-xs font-bold w-full sm:w-auto"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Descargar PNG</span>
          </Button>

          {publicUrl && (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button
                type="button"
                size="sm"
                className="gap-1.5 text-xs font-bold bg-primary text-white w-full"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Abrir Enlace</span>
              </Button>
            </a>
          )}
        </DialogFooter>
      </div>
    </Dialog>
  );
}
