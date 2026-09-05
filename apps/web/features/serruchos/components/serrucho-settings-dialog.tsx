"use client";

import * as React from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Settings, Image as ImageIcon, Sparkles, Check, DollarSign } from "lucide-react";
import { Serrucho } from "@/lib/types/domain";
import { hapticSuccess, hapticImpact } from "@/lib/utils/haptics";

interface SerruchoSettingsDialogProps {
  serrucho: Serrucho;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

const PRESET_AVATARS = [
  "🌴", "🏖️", "🍻", "🍕", "🚗", "🏠", "✈️", "🎉", "🍔", "⛽", "⛰️", "⛺"
];

export function SerruchoSettingsDialog({
  serrucho,
  open,
  onOpenChange,
  onUpdated,
}: SerruchoSettingsDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [name, setName] = React.useState(serrucho.name);
  const [description, setDescription] = React.useState(serrucho.description || "");
  const [currency, setCurrency] = React.useState(serrucho.currency || "DOP");
  const [eventDate, setEventDate] = React.useState(
    serrucho.event_date ? new Date(serrucho.event_date).toISOString().split("T")[0] : ""
  );
  const [imageUrl, setImageUrl] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setName(serrucho.name);
      setDescription(serrucho.description || "");
      setCurrency(serrucho.currency || "DOP");
      setEventDate(
        serrucho.event_date
          ? new Date(serrucho.event_date).toISOString().split("T")[0]
          : ""
      );
    }
  }, [open, serrucho]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ type: "error", message: "El serrucho debe tener un nombre" });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/serruchos/${serrucho.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          event_date: eventDate || null,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "No se pudo actualizar la configuración");
      }

      hapticSuccess();
      toast({
        type: "success",
        title: "Configuración guardada",
        message: "Los cambios del serrucho se han actualizado.",
      });

      onOpenChange(false);
      onUpdated();
    } catch (err: any) {
      hapticImpact();
      toast({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black">
                Configuración del Serrucho
              </DialogTitle>
              <DialogDescription className="text-xs">
                Ajusta el nombre, moneda, avatar y detalles generales (RF-006)
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3.5 py-1">
          {/* Avatar / Icon Preset Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              Avatar o ícono del coro
            </Label>
            <div className="flex flex-wrap gap-2 pt-1">
              {PRESET_AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    if (!name.includes(emoji)) {
                      setName((prev) => `${prev.replace(/[\p{Emoji}]/gu, "").trim()} ${emoji}`);
                    }
                  }}
                  className="h-9 w-9 rounded-xl border border-border bg-card hover:bg-primary/10 hover:border-primary text-base flex items-center justify-center transition-all cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="cfg_name" className="text-xs font-bold">
              Nombre del serrucho *
            </Label>
            <Input
              id="cfg_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Fin de Semana Las Terrenas"
              required
            />
          </div>

          {/* Currency & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cfg_currency" className="text-xs font-bold">
                Moneda principal
              </Label>
              <select
                id="cfg_currency"
                value={currency}
                disabled
                className="w-full h-10 px-3 rounded-xl border border-input bg-muted text-muted-foreground text-xs font-semibold cursor-not-allowed"
              >
                <option value="DOP">🇩🇴 DOP (RD$ Dominicano)</option>
                <option value="USD">🇺🇸 USD ($ Dólar)</option>
                <option value="EUR">🇪🇺 EUR (€ Euro)</option>
              </select>
              <p className="text-[10px] text-muted-foreground">
                Fijada al crear el serrucho para mantener coherencia financiera.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cfg_date" className="text-xs font-bold">
                Fecha de la actividad
              </Label>
              <Input
                id="cfg_date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="cfg_desc" className="text-xs font-bold">
              Descripción o notas
            </Label>
            <Input
              id="cfg_desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles sobre el viaje, villa, cena o evento"
            />
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="text-xs"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-white font-bold gap-1.5 text-xs"
          >
            <Check className="h-4 w-4" />
            <span>{loading ? "Guardando..." : "Guardar Cambios"}</span>
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
