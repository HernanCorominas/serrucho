"use client";

import * as React from "react";
import { MessageSquarePlus, Send, Copy, Check } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

const RATING_LABELS = [
  { value: 5, emoji: "🔥", text: "¡Me encantó!" },
  { value: 4, emoji: "👍", text: "Muy buena" },
  { value: 3, emoji: "😐", text: "Regular / Puede mejorar" },
  { value: 2, emoji: "😕", text: "Complicada" },
  { value: 1, emoji: "🐛", text: "Tiene errores" },
];

export function FeedbackWidget() {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [rating, setRating] = React.useState<number>(5);
  const [category, setCategory] = React.useState<string>("SUGGESTION");
  const [comment, setComment] = React.useState<string>("");
  const [name, setName] = React.useState<string>("");
  const [copied, setCopied] = React.useState(false);

  const buildFeedbackMessage = () => {
    const ratingObj = RATING_LABELS.find((r) => r.value === rating);
    const catLabel =
      category === "BUG"
        ? "🐛 Reporte de Error"
        : category === "SUGGESTION"
        ? "💡 Sugerencia / Idea"
        : "🎉 Felicitaciones";

    return `*Feedback de Serrucho Beta* 🪚🇩🇴\n\n*De:* ${name.trim() || "Amigo tester"}\n*Tipo:* ${catLabel}\n*Calificación:* ${ratingObj?.emoji} ${ratingObj?.text}\n\n*Comentario:*\n${comment.trim() || "¡Sin comentarios adicionales!"}\n\n_Enviado desde Serrucho Beta App_`;
  };

  const handleSendWhatsApp = () => {
    const msg = buildFeedbackMessage();
    // Opens WhatsApp share/chat
    const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank");
    toast({
      type: "success",
      title: "¡Gracias por tu feedback!",
      message: "Se abrió WhatsApp para enviar tus comentarios al creador.",
    });
    setOpen(false);
    setComment("");
  };

  const handleCopy = () => {
    const msg = buildFeedbackMessage();
    navigator.clipboard.writeText(msg);
    setCopied(true);
    toast({
      type: "success",
      title: "Mensaje copiado",
      message: "Listo para pegar en cualquier chat.",
    });
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-4 right-4 z-40 no-print">
        <Button
          onClick={() => setOpen(true)}
          size="sm"
          className="rounded-full shadow-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold gap-2 px-4 py-2 text-xs border border-white/20 transition-transform hover:scale-105"
        >
          <MessageSquarePlus className="h-4 w-4" />
          <span className="hidden sm:inline">¿Feedback / Sugerencias?</span>
          <span className="sm:hidden">Feedback</span>
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        </Button>
      </div>

      {/* Feedback Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <div className="space-y-4">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="text-2xl">💬</span>
              <DialogTitle>Danos tu Opinión (Beta)</DialogTitle>
            </div>
            <DialogDescription>
              Estamos mejorando Serrucho para todos. Cuéntanos qué te gustó, qué falta o si encontraste algún detalle.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs sm:text-sm">
            {/* Rating Selector */}
            <div className="space-y-1.5">
              <Label className="font-bold text-xs">¿Cómo calificarías tu experiencia?</Label>
              <div className="grid grid-cols-5 gap-1.5 pt-1">
                {RATING_LABELS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRating(r.value)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all ${
                      rating === r.value
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-xs scale-105"
                        : "border-border hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <span className="text-xl mb-1">{r.emoji}</span>
                    <span className="text-[10px] text-center leading-tight font-medium">
                      {r.value} ★
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Type selector */}
            <div className="space-y-1.5">
              <Label className="font-bold text-xs">Tipo de mensaje</Label>
              <div className="flex gap-2">
                {[
                  { id: "SUGGESTION", label: "💡 Sugerencia" },
                  { id: "PRAISE", label: "🎉 Me encantó" },
                  { id: "BUG", label: "🐛 Reportar Error" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                      category === cat.id
                        ? "bg-foreground text-background border-foreground font-bold"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Name input */}
            <div className="space-y-1.5">
              <Label htmlFor="fb_name" className="font-bold text-xs">Tu Nombre (opcional)</Label>
              <input
                id="fb_name"
                type="text"
                placeholder="Ej. Carlos, María..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Comment input */}
            <div className="space-y-1.5">
              <Label htmlFor="fb_comment" className="font-bold text-xs">¿Qué podemos mejorar o qué te pareció?</Label>
              <textarea
                id="fb_comment"
                rows={3}
                placeholder="Ej. Me gustaría poder agregar fotos de recibos, la calculadora me pareció súper útil..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full rounded-xl border border-input bg-background p-3 text-xs outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-1.5 text-xs font-semibold"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "¡Copiado!" : "Copiar Texto"}</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleSendWhatsApp}
              className="gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Enviar por WhatsApp</span>
            </Button>
          </DialogFooter>
        </div>
      </Dialog>
    </>
  );
}
