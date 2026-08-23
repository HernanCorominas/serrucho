"use client";

import * as React from "react";
import QRCode from "qrcode";
import { MessageCircle, Share2, Copy, Check, QrCode, Eye, Users } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { generateSerruchoInviteMessage, buildWhatsAppShareUrl } from "@serrucho/core";

interface ShareSerruchoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serruchoName: string;
  serruchoId: string;
  readOnlyToken?: string | null;
}

export function ShareSerruchoDialog({
  open,
  onOpenChange,
  serruchoName,
  serruchoId,
  readOnlyToken,
}: ShareSerruchoDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);
  const [qrDataUrl, setQrDataUrl] = React.useState<string>("");
  const [showQr, setShowQr] = React.useState(false);
  const [mode, setMode] = React.useState<"EDIT" | "READ_ONLY">("EDIT");

  const origin = typeof window !== "undefined" ? window.location.origin : "https://serrucho.do";

  const editShareUrl = `${origin}/dashboard/${serruchoId}`;
  const readOnlyShareUrl = readOnlyToken
    ? `${origin}/r/${readOnlyToken}`
    : `${origin}/dashboard/${serruchoId}?readonly=1`;

  const activeShareUrl = mode === "EDIT" ? editShareUrl : readOnlyShareUrl;

  const inviteMessage =
    mode === "EDIT"
      ? generateSerruchoInviteMessage({
          serruchoName,
          joinUrl: editShareUrl,
        })
      : `👀 *${serruchoName}* (Enlace de Solo Lectura 🇩🇴)\n\nTe comparto el enlace para que consultes los gastos, balances y cuentas del coro sin editar nada:\n\n${readOnlyShareUrl}\n\n_Hecho con Serrucho_`;

  const whatsAppUrl = buildWhatsAppShareUrl(inviteMessage);

  React.useEffect(() => {
    if (open && activeShareUrl) {
      QRCode.toDataURL(activeShareUrl, {
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
  }, [open, activeShareUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(activeShareUrl);
    setCopied(true);
    toast({
      type: "success",
      title: "¡Enlace copiado!",
      message:
        mode === "EDIT"
          ? "Pégalo en tu chat o grupo de WhatsApp para invitar colaboradores."
          : "Enlace de solo lectura copiado. Quien lo abra no podrá modificar datos.",
    });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Serrucho: ${serruchoName} ${mode === "READ_ONLY" ? "(Solo Lectura)" : ""}`,
          text: inviteMessage,
          url: activeShareUrl,
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
          <DialogTitle>Compartir Serrucho</DialogTitle>
        </div>
        <DialogDescription>
          Elige qué tipo de acceso deseas otorgar antes de compartir el enlace.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-2">
        {/* Access Mode Selector */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-muted/60 border border-border">
          <button
            type="button"
            onClick={() => setMode("EDIT")}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              mode === "EDIT"
                ? "bg-card text-foreground shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="h-3.5 w-3.5 text-primary" />
            <span>Colaborador (Editar)</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("READ_ONLY")}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              mode === "READ_ONLY"
                ? "bg-card text-amber-600 dark:text-amber-400 shadow-xs border border-amber-500/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Eye className="h-3.5 w-3.5 text-amber-500" />
            <span>Solo Lectura (Ver)</span>
          </button>
        </div>

        {/* Info banner for read-only */}
        {mode === "READ_ONLY" && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
            🔒 <strong>Acceso protegido:</strong> Este enlace permite consultar balances y gastos, pero bloquea cualquier intento de creación, edición o liquidación.
          </div>
        )}

        {/* WhatsApp Big Action */}
        <a
          href={whatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full"
        >
          <Button
            type="button"
            className={`w-full text-white font-extrabold h-12 rounded-xl gap-2 shadow-md text-sm ${
              mode === "EDIT"
                ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                : "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"
            }`}
          >
            <MessageCircle className="h-5 w-5" />
            <span>
              {mode === "EDIT"
                ? "Compartir por WhatsApp 🇩🇴"
                : "Compartir Solo Lectura por WhatsApp 🇩🇴"}
            </span>
          </Button>
        </a>

        {/* Copy Link Row */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={activeShareUrl}
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
                alt={`Código QR para ${serruchoName}`}
                className="w-44 h-44 rounded-lg"
              />
              <p className="text-[11px] text-muted-foreground mt-2 font-medium">
                {mode === "EDIT"
                  ? "Escanea con la cámara del celular para abrir el serrucho"
                  : "Escanea para abrir en modo solo lectura"}
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

