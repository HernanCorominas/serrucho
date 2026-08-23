"use client";

import * as React from "react";
import QRCode from "qrcode";
import { MessageCircle, Share2, Copy, Check, QrCode } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { generateSerruchoInviteMessage, buildWhatsAppShareUrl } from "@serrucho/core";

interface ShareSerruchoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serruchoName: string;
  serruchoId: string;
}

export function ShareSerruchoDialog({
  open,
  onOpenChange,
  serruchoName,
  serruchoId,
}: ShareSerruchoDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);
  const [qrDataUrl, setQrDataUrl] = React.useState<string>("");
  const [showQr, setShowQr] = React.useState(false);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/dashboard/${serruchoId}`
    : `https://serrucho.do/dashboard/${serruchoId}`;

  const inviteMessage = generateSerruchoInviteMessage({
    serruchoName,
    joinUrl: shareUrl,
  });

  const whatsAppUrl = buildWhatsAppShareUrl(inviteMessage);

  React.useEffect(() => {
    if (open && shareUrl) {
      QRCode.toDataURL(shareUrl, {
        width: 250,
        margin: 2,
        color: {
          dark: "#1e293b",
          light: "#ffffff",
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("Error generating QR:", err));
    }
  }, [open, shareUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({
      type: "success",
      title: "¡Enlace copiado!",
      message: "Pégalo en tu chat o grupo de WhatsApp.",
    });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Serrucho: ${serruchoName}`,
          text: inviteMessage,
          url: shareUrl,
        });
        toast({ type: "success", message: "Compartido con éxito" });
      } catch (e: any) {
        if (e.name !== "AbortError") {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌴</span>
          <DialogTitle>Compartir con el Coro</DialogTitle>
        </div>
        <DialogDescription>
          Invita a tus amigos para que vean las cuentas y agreguen sus gastos.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-2">
        {/* WhatsApp Big Action */}
        <a
          href={whatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full"
        >
          <Button
            type="button"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold h-12 rounded-xl gap-2 shadow-md shadow-emerald-600/20 text-sm"
          >
            <MessageCircle className="h-5 w-5" />
            <span>Compartir por WhatsApp 🇩🇴</span>
          </Button>
        </a>

        {/* Copy Link Row */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 h-10 px-3 rounded-xl border border-input bg-muted/30 text-xs font-mono text-muted-foreground select-all focus:outline-none"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleCopy}
            className="h-10 px-4 font-bold text-xs gap-1.5 shrink-0"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? "¡Copiado!" : "Copiar"}</span>
          </Button>
        </div>

        {/* QR Code Toggle Section */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              ¿Están juntos en persona?
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowQr(!showQr)}
              className="text-xs font-bold gap-1 text-primary h-8"
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>{showQr ? "Ocultar QR" : "Mostrar Código QR"}</span>
            </Button>
          </div>

          {showQr && qrDataUrl && (
            <div className="mt-3 p-4 bg-white dark:bg-card border border-border rounded-2xl flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-200">
              <img
                src={qrDataUrl}
                alt={`Código QR para unirse a ${serruchoName}`}
                className="w-44 h-44 rounded-lg"
              />
              <p className="text-[11px] text-muted-foreground mt-2 font-medium">
                Escanea con la cámara del celular para abrir el serrucho
              </p>
            </div>
          )}
        </div>
      </div>

      <DialogFooter className="sm:justify-between flex-row items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleNativeShare}
          className="text-xs font-semibold gap-1.5"
        >
          <Share2 className="h-3.5 w-3.5" />
          <span>Más opciones</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onOpenChange(false)}
        >
          Listo
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
