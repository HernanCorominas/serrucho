"use client";

import * as React from "react";
import { UserPlus } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { hapticSuccess } from "@/lib/utils/haptics";

interface AddParticipantDialogProps {
  serruchoId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onParticipantAdded: () => void;
}

export function AddParticipantDialog({
  serruchoId,
  open,
  onOpenChange,
  onParticipantAdded,
}: AddParticipantDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    phone: "",
    preferred_channel: "EMAIL" as "EMAIL" | "WHATSAPP",
    default_shares: 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ type: "error", message: "Ingresa el nombre del participante" });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/serruchos/${serruchoId}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Error al agregar participante");
      }

      hapticSuccess();
      toast({
        type: "success",
        title: "¡Participante agregado!",
        message: `${formData.name} ya está en el serrucho.`,
      });

      setFormData({
        name: "",
        email: "",
        phone: "",
        preferred_channel: "EMAIL",
        default_shares: 1,
      });
      onOpenChange(false);
      onParticipantAdded();
    } catch (err: any) {
      toast({ type: "error", message: err.message || "Error al registrar participante" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <DialogTitle>Agregar Participante</DialogTitle>
          </div>
          <DialogDescription>
            Agrega a una persona que participará en los gastos del serrucho.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="part_name">Nombre completo o apodo *</Label>
            <Input
              id="part_name"
              placeholder="Ej. Juan Pérez, María, Familia Gómez"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="part_email">Correo Electrónico (para enviarle estado de cuenta)</Label>
            <Input
              id="part_email"
              type="email"
              placeholder="juan@ejemplo.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="part_phone">Teléfono / WhatsApp (opcional)</Label>
            <Input
              id="part_phone"
              type="tel"
              placeholder="Ej. 8095550199"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="preferred_channel">Canal preferido para notificaciones</Label>
            <Select
              id="preferred_channel"
              value={formData.preferred_channel}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  preferred_channel: e.target.value as "EMAIL" | "WHATSAPP",
                })
              }
            >
              <option value="EMAIL">Correo Electrónico (Recomendado)</option>
              <option value="WHATSAPP">WhatsApp</option>
            </Select>
          </div>

          <div className="space-y-2 pt-2 border-t border-border">
            <Label htmlFor="default_shares" className="font-bold text-xs uppercase text-muted-foreground">
              ¿Cómo quieres repartir normalmente los gastos para esta persona?
            </Label>
            <p className="text-xs text-muted-foreground">
              Define cuántas cuotas o partes asume por defecto en cada gasto.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex gap-1">
                {[
                  { label: "1x (Normal)", val: 1 },
                  { label: "2x (Pareja)", val: 2 },
                  { label: "0.5x (Niño)", val: 0.5 },
                  { label: "3x (Familia)", val: 3 },
                ].map((sOpt) => (
                  <button
                    key={sOpt.val}
                    type="button"
                    onClick={() => setFormData({ ...formData, default_shares: sOpt.val })}
                    className={`px-2 py-1 rounded-md text-xs font-bold border transition-colors ${
                      formData.default_shares === sOpt.val
                        ? "bg-primary text-white border-primary"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {sOpt.label}
                  </button>
                ))}
              </div>
              <Input
                id="default_shares"
                type="number"
                step="0.5"
                min="0.1"
                className="w-16 text-center text-xs font-bold"
                value={formData.default_shares}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    default_shares: parseFloat(e.target.value) || 1,
                  })
                }
              />
            </div>
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
          <Button type="button" onClick={handleSubmit} disabled={loading} className="bg-primary text-white font-bold">
            {loading ? "Guardando..." : "Agregar Participante"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
