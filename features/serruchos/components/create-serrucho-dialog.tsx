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
      const res = await fetch("/api/serruchos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
      setFormData({ name: "", description: "", event_date: new Date().toISOString().split("T")[0] });

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
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre del serrucho *</Label>
            <Input
              id="name"
              placeholder="Ej. Playa Las Terrenas 🌴, Cena de Cumpleaños, Barbacoa"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              autoFocus
            />
          </div>

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
              placeholder="Ej. Gastos de villa, combustible, bebidas y supermercado"
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
