"use client";

import * as React from "react";
import { Image as ImageIcon, Download, Share2, Sparkles, Check } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatDOP } from "@/lib/finance/math";
import { hapticLight, hapticSuccess } from "@/lib/utils/haptics";

interface ShareableStoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serruchoName: string;
  totalExpensesCents: number;
  participantsCount: number;
  expensesCount: number;
  eventDate?: string | null;
  categoriesBreakdown?: { label: string; emoji: string; amount_cents: number }[];
}

export function ShareableStoryDialog({
  open,
  onOpenChange,
  serruchoName,
  totalExpensesCents,
  participantsCount,
  expensesCount,
  eventDate,
  categoriesBreakdown = [],
}: ShareableStoryDialogProps) {
  const { toast } = useToast();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = React.useState<string | null>(null);
  const [shared, setShared] = React.useState(false);

  const drawStory = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions (1080x1920 Instagram Story standard)
    canvas.width = 1080;
    canvas.height = 1920;

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1920);
    bgGrad.addColorStop(0, "#0f172a");
    bgGrad.addColorStop(0.4, "#1e293b");
    bgGrad.addColorStop(0.8, "#ea580c");
    bgGrad.addColorStop(1, "#c2410c");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1920);

    // Decorative top circles
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    ctx.beginPath();
    ctx.arc(950, 200, 300, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(100, 1600, 400, 0, Math.PI * 2);
    ctx.fill();

    // App Header Badge
    ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
    ctx.roundRect(140, 160, 800, 100, 50);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 44px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🪚 SERRUCHO  |  CUENTAS CLARAS", 540, 226);

    // Serrucho Name
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 80px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "center";

    // Truncate title if too long
    const displayTitle = serruchoName.length > 24 ? serruchoName.slice(0, 24) + "..." : serruchoName;
    ctx.fillText(displayTitle, 540, 420);

    // Date
    if (eventDate) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.font = "500 36px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText(`📅 ${eventDate}`, 540, 480);
    }

    // Main Card: Total Gasto
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.roundRect(100, 560, 880, 460, 48);
    ctx.fill();

    ctx.fillStyle = "#64748b";
    ctx.font = "bold 34px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("TOTAL GASTADO EN EL CORO", 540, 650);

    ctx.fillStyle = "#ea580c";
    ctx.font = "900 84px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(formatDOP(totalExpensesCents), 540, 770);

    // Quick Stats pills inside main card
    ctx.fillStyle = "#f1f5f9";
    ctx.roundRect(160, 840, 360, 110, 24);
    ctx.fill();

    ctx.roundRect(560, 840, 360, 110, 24);
    ctx.fill();

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 38px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(`👥 ${participantsCount} Personas`, 340, 910);
    ctx.fillText(`🧾 ${expensesCount} Gastos`, 740, 910);

    // Category Breakdown Section
    let currentY = 1080;
    if (categoriesBreakdown.length > 0) {
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 40px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("📊 Distribución de Gastos", 120, currentY);

      currentY += 40;
      categoriesBreakdown.slice(0, 4).forEach((cat) => {
        currentY += 85;
        // Background strip
        ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
        ctx.roundRect(100, currentY - 55, 880, 75, 20);
        ctx.fill();

        // Label
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 34px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(`${cat.emoji} ${cat.label}`, 130, currentY - 5);

        // Amount
        ctx.textAlign = "right";
        ctx.fillText(formatDOP(cat.amount_cents), 950, currentY - 5);
      });
    }

    // Bottom Branding
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = "bold 34px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🇩🇴 Cuentas claras conservan amistades", 540, 1740);

    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    ctx.font = "500 28px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("Calculado automáticamente con Serrucho Web App", 540, 1800);

    setDataUrl(canvas.toDataURL("image/png"));
  }, [serruchoName, totalExpensesCents, participantsCount, expensesCount, eventDate, categoriesBreakdown]);

  React.useEffect(() => {
    if (open) {
      // Allow DOM canvas to mount
      setTimeout(() => drawStory(), 100);
    }
  }, [open, drawStory]);

  const handleDownload = () => {
    if (!dataUrl) return;
    hapticSuccess();
    const link = document.createElement("a");
    link.download = `Story-Serrucho-${serruchoName.replace(/\s+/g, "_")}.png`;
    link.href = dataUrl;
    link.click();
    toast({
      type: "success",
      title: "Tarjeta descargada",
      message: "Lista para compartir en tu Instagram Story o estado de WhatsApp.",
    });
  };

  const handleShareMobile = async () => {
    if (!canvasRef.current || !dataUrl) return;
    hapticLight();

    if (navigator.share && navigator.canShare) {
      try {
        canvasRef.current.toBlob(async (blob) => {
          if (!blob) return;
          const file = new File([blob], "resumen-serrucho.png", { type: "image/png" });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `Resumen de Serrucho: ${serruchoName}`,
              text: `¡Así quedaron las cuentas del coro de ${serruchoName}! 🪚🌴`,
              files: [file],
            });
            setShared(true);
            toast({
              type: "success",
              title: "¡Compartido con éxito!",
              message: "Se envió la tarjeta de resumen a tus redes.",
            });
          } else {
            handleDownload();
          }
        });
      } catch (err) {
        console.error("Error sharing:", err);
        handleDownload();
      }
    } else {
      handleDownload();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="space-y-4 text-center">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600 mb-1">
            <Sparkles className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl font-extrabold text-foreground">
            Tarjeta para Instagram & WhatsApp
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Generamos una imagen visual estética con el resumen del viaje para compartir con tus amigos.
          </DialogDescription>
        </DialogHeader>

        {/* Hidden Canvas for High-Resolution Drawing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Image Preview */}
        <div className="p-3 bg-muted/40 rounded-2xl border border-border flex justify-center items-center">
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dataUrl}
              alt="Story Preview"
              className="max-h-80 w-auto rounded-xl shadow-lg border border-white/20 object-contain"
            />
          ) : (
            <div className="h-72 w-44 bg-muted rounded-xl flex items-center justify-center animate-pulse text-xs text-muted-foreground">
              Generando diseño...
            </div>
          )}
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
            <span>Descargar Imagen PNG</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleShareMobile}
            className="gap-1.5 text-xs font-bold bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white w-full sm:w-auto"
          >
            {shared ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
            <span>{shared ? "¡Compartido!" : "Compartir en Redes"}</span>
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  );
}
