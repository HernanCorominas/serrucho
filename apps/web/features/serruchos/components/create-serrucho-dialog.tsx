"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Users,
  Plus,
  Trash2,
  Sparkles,
  DollarSign,
  User,
  Mail,
  Calendar,
} from "lucide-react";
import { hapticSuccess, hapticImpact, hapticLight } from "@/lib/utils/haptics";

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

  // Form states
  const [name, setName] = React.useState("");
  const [currency, setCurrency] = React.useState<"DOP" | "USD" | "EUR">("DOP");
  const [eventDate, setEventDate] = React.useState(
    new Date().toISOString().split("T")[0]
  );
  const [description, setDescription] = React.useState("");

  // Owner data
  const [creatorName, setCreatorName] = React.useState("");
  const [creatorEmail, setCreatorEmail] = React.useState("");

  // Initial participants
  const [participantInput, setParticipantInput] = React.useState("");
  const [participants, setParticipants] = React.useState<string[]>([]);

  // Reset form when opening
  React.useEffect(() => {
    if (open) {
      setName("");
      setCurrency("DOP");
      setEventDate(new Date().toISOString().split("T")[0]);
      setDescription("");
      setCreatorName("");
      setCreatorEmail("");
      setParticipantInput("");
      setParticipants([]);
    }
  }, [open]);

  const handleAddParticipant = () => {
    const trimmed = participantInput.trim();
    if (!trimmed) return;

    if (
      trimmed.toLowerCase() === creatorName.trim().toLowerCase() ||
      participants.some((p) => p.toLowerCase() === trimmed.toLowerCase())
    ) {
      toast({
        type: "error",
        message: "Ya existe un participante con ese nombre",
      });
      return;
    }

    hapticLight();
    setParticipants([...participants, trimmed]);
    setParticipantInput("");
  };

  const handleRemoveParticipant = (index: number) => {
    hapticImpact();
    setParticipants(participants.filter((_, i) => i !== index));
  };

  // Final submit (Paso 4 / Confirmación)
  const handleSubmit = async () => {
    try {
      setLoading(true);
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        currency,
        creator_name: creatorName.trim(),
        creator_email: creatorEmail.trim(),
        initial_participants: participants,
        event_date: eventDate || null,
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

      const created = await res.json();
      hapticSuccess();
      toast({
        type: "success",
        title: "¡Serrucho creado con éxito! 🌴",
        message: `Se ha configurado "${created.name}" con ${participants.length + 1} integrantes.`,
      });

      onOpenChange(false);
      if (onCreated) {
        onCreated(created.id);
      }
      router.push(`/dashboard/${created.id}`);
    } catch (err: any) {
      hapticImpact();
      toast({
        type: "error",
        message: err.message || "No se pudo crear el serrucho",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="max-w-lg w-full">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🪚</span>
            <DialogTitle className="text-lg sm:text-xl font-black">
              Crear un Serrucho Gratis
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs sm:text-sm">
            Sin registro obligatorio. Agrega los datos básicos y empieza a compartir gastos al instante.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) {
              toast({ type: "error", message: "Ingresa el nombre del serrucho" });
              return;
            }
            if (!creatorName.trim()) {
              toast({ type: "error", message: "Ingresa tu nombre o apodo" });
              return;
            }
            handleSubmit();
          }}
          className="space-y-4 py-3"
        >
          {/* Event Name */}
          <div className="space-y-1.5">
            <Label htmlFor="create_name" className="font-bold text-xs sm:text-sm">
              1. Nombre del evento o serrucho *
            </Label>
            <Input
              id="create_name"
              placeholder="Ej. Fin de semana en Las Terrenas 🌴, Cena de Fin de Año"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="h-10 rounded-xl font-medium"
              required
            />
          </div>

          {/* Creator Name & Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="create_creator_name" className="font-bold text-xs sm:text-sm">
                2. Tu Nombre / Apodo *
              </Label>
              <Input
                id="create_creator_name"
                placeholder="Ej. Braulio, Carlos, María"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                className="h-10 rounded-xl font-medium"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create_currency" className="font-bold text-xs sm:text-sm">
                Moneda principal
              </Label>
              <select
                id="create_currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as "DOP" | "USD" | "EUR")}
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="DOP">🇩🇴 DOP (RD$ Dominicano)</option>
                <option value="USD">🇺🇸 USD ($ Dólar)</option>
                <option value="EUR">🇪🇺 EUR (€ Euro)</option>
              </select>
            </div>
          </div>

          {/* Initial Participants */}
          <div className="space-y-1.5">
            <Label className="font-bold text-xs sm:text-sm">
              3. ¿Quiénes más participan? (Amigos del coro)
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Nombre del amigo/a (ej. Laura, Hernan)"
                value={participantInput}
                onChange={(e) => setParticipantInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddParticipant();
                  }
                }}
                className="h-9 rounded-xl text-xs sm:text-sm"
              />
              <Button
                type="button"
                onClick={handleAddParticipant}
                disabled={!participantInput.trim()}
                className="bg-teal-600 hover:bg-teal-700 text-white gap-1 shrink-0 font-bold h-9 px-3 text-xs rounded-xl"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Agregar</span>
              </Button>
            </div>

            {/* Participants list tags */}
            {participants.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1.5 max-h-28 overflow-y-auto">
                {participants.map((p, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted text-xs font-semibold text-foreground border border-border"
                  >
                    <span>{p}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveParticipant(idx)}
                      className="text-muted-foreground hover:text-red-500 transition-colors ml-0.5"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">
              Puedes agregar o quitar amigos en cualquier momento después de crearlo.
            </p>
          </div>

          {/* Optional Creator Email & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-border/60">
            <div className="space-y-1.5">
              <Label htmlFor="create_creator_email" className="text-xs text-muted-foreground font-medium">
                Tu Correo (Opcional)
              </Label>
              <Input
                id="create_creator_email"
                type="email"
                placeholder="ejemplo@correo.com"
                value={creatorEmail}
                onChange={(e) => setCreatorEmail(e.target.value)}
                className="h-9 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create_date" className="text-xs text-muted-foreground font-medium">
                Fecha del Evento (Opcional)
              </Label>
              <Input
                id="create_date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="h-9 rounded-xl text-xs"
              />
            </div>
          </div>

          <DialogFooter className="pt-2 sm:justify-between flex-row items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs font-semibold"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || !name.trim() || !creatorName.trim()}
              className="bg-teal-600 hover:bg-teal-700 text-white font-black text-xs sm:text-sm h-10 px-5 rounded-xl gap-1.5 shadow-md shadow-teal-600/20"
            >
              <Sparkles className="h-4 w-4" />
              <span>{loading ? "Creando Serrucho..." : "Crear Serrucho Ahora ➔"}</span>
            </Button>
          </DialogFooter>
        </form>
      </div>
    </Dialog>
  );
}
