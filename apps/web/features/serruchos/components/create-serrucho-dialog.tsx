"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface CreateSerruchoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (serruchoId: string) => void;
}

export function CreateSerruchoDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateSerruchoDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    currency: "DOP" as "DOP" | "USD" | "EUR",
    creator_name: "",
    initial_participants_text: "",
    event_date: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ type: "error", message: "Ponle un nombre a tu serrucho" });
      return;
    }

    try {
      setLoading(true);
      const initialParticipants = formData.initial_participants_text
        ? formData.initial_participants_text
            .split(/[,;\n]/)
            .map((p) => p.trim())
            .filter((p) => p.length > 0)
        : [];

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        currency: formData.currency,
        creator_name: formData.creator_name.trim() || null,
        initial_participants: initialParticipants,
        event_date: formData.event_date || null,
      };

      const res = await fetch("/api/serruchos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al crear el serrucho");
      }

      const serrucho = await res.json();
      toast({
        type: "success",
        title: "¡Serrucho creado!",
        message: `Se ha creado "${serrucho.name}" con éxito.`,
      });

      onOpenChange(false);
      setFormData({
        name: "",
        description: "",
        currency: "DOP",
        creator_name: "",
        initial_participants_text: "",
        event_date: new Date().toISOString().split("T")[0],
      });

      if (onCreated) {
        onCreated(serrucho.id);
      }
      router.push(`/dashboard/${serrucho.id}`);
    } catch (err: any) {
      toast({ type: "error", message: err.message || "No se pudo crear el serrucho" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🪚</span>
            <DialogTitle>Hacer un nuevo serrucho</DialogTitle>
          </div>
          <DialogDescription>
            Organiza los gastos de tu coro, viaje, cena o actividad en segundos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Nombre del Serrucho */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre del serrucho *</Label>
            <Input
              id="name"
              placeholder="Ej. Fin de Semana Las Terrenas 🌴, Cena de Cumpleaños"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              autoFocus
            />
          </div>

          {/* Moneda y Creador */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="currency">Moneda</Label>
              <select
                id="currency"
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={formData.currency}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    currency: e.target.value as "DOP" | "USD" | "EUR",
                  })
                }
              >
                <option value="DOP">🇩🇴 DOP (RD$ Dominicano)</option>
                <option value="USD">🇺🇸 USD ($ Dólar)</option>
                <option value="EUR">🇪🇺 EUR (€ Euro)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="creator_name">Tu Nombre / Apodo (Opcional)</Label>
              <Input
                id="creator_name"
                placeholder="Ej. Braulio"
                value={formData.creator_name}
                onChange={(e) => setFormData({ ...formData, creator_name: e.target.value })}
              />
            </div>
          </div>

          {/* Participantes Iniciales */}
          <div className="space-y-1.5">
            <Label htmlFor="initial_participants">
              Amigos del coro (Opcional, separados por coma)
            </Label>
            <Input
              id="initial_participants"
              placeholder="Ej. Carlos, Laura, Marcos, Paola"
              value={formData.initial_participants_text}
              onChange={(e) =>
                setFormData({ ...formData, initial_participants_text: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground">
              Puedes dejarlos en blanco y agregarlos o enviarles el link de WhatsApp después.
            </p>
          </div>

          {/* Fecha y Descripción */}
          <div className="space-y-1.5">
            <Label htmlFor="event_date">Fecha de la actividad</Label>
            <Input
              id="event_date"
              type="date"
              value={formData.event_date}
              onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Descripción o notas (opcional)</Label>
            <Input
              id="description"
              placeholder="Ej. Villa, combustible, bebidas y supermercado"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="bg-primary text-white font-bold">
            {loading ? "Creando..." : "Crear Serrucho ➔"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
