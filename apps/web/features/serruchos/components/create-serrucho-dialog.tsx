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

  const [step, setStep] = React.useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = React.useState(false);

  // Form states
  const [name, setName] = React.useState("");
  const [currency, setCurrency] = React.useState<"DOP" | "USD" | "EUR">("DOP");
  const [eventDate, setEventDate] = React.useState(
    new Date().toISOString().split("T")[0]
  );
  const [description, setDescription] = React.useState("");

  // Owner data (Paso 2)
  const [creatorName, setCreatorName] = React.useState("");
  const [creatorEmail, setCreatorEmail] = React.useState("");

  // Initial participants (Paso 3)
  const [participantInput, setParticipantInput] = React.useState("");
  const [participants, setParticipants] = React.useState<string[]>([]);

  // Reset form when opening
  React.useEffect(() => {
    if (open) {
      setStep(1);
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

  // Step 1 Validation -> Step 2
  const handleNextStep1 = () => {
    if (!name.trim()) {
      toast({ type: "error", message: "Ingresa el nombre del serrucho" });
      return;
    }
    hapticLight();
    setStep(2);
  };

  // Step 2 Validation -> Step 3
  const handleNextStep2 = () => {
    if (!creatorName.trim()) {
      toast({ type: "error", message: "Ingresa tu nombre o apodo" });
      return;
    }
    if (!creatorEmail.trim() || !creatorEmail.includes("@")) {
      toast({
        type: "error",
        message: "Ingresa un correo electrónico válido para el organizador",
      });
      return;
    }
    hapticLight();
    setStep(3);
  };

  // Step 3 Validation -> Step 4 (RN-003: Debe haber al menos 1 adicional)
  const handleNextStep3 = () => {
    if (participants.length < 1) {
      toast({
        type: "error",
        message:
          "Debes agregar al menos un participante adicional al organizador (RN-003)",
      });
      return;
    }
    hapticLight();
    setStep(4);
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
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🪚</span>
              <DialogTitle className="text-lg sm:text-xl font-black">
                Hacer un Nuevo Serrucho
              </DialogTitle>
            </div>
            <Badge variant="outline" className="text-xs font-bold px-2.5 py-0.5">
              Paso {step} de 4
            </Badge>
          </div>
          <DialogDescription className="text-xs sm:text-sm">
            {step === 1 && "Paso 1: Define el nombre del evento y la moneda principal."}
            {step === 2 && "Paso 2: Datos del organizador / creador del serrucho."}
            {step === 3 && "Paso 3: Agrega a los amigos o familiares que participan."}
            {step === 4 && "Paso 4: Confirma los datos para crear el serrucho."}
          </DialogDescription>
        </DialogHeader>

        {/* Wizard Progress Indicator */}
        <div className="grid grid-cols-4 gap-1.5 py-3">
          <div
            className={`h-1.5 rounded-full transition-all ${
              step >= 1 ? "bg-primary" : "bg-muted"
            }`}
          />
          <div
            className={`h-1.5 rounded-full transition-all ${
              step >= 2 ? "bg-primary" : "bg-muted"
            }`}
          />
          <div
            className={`h-1.5 rounded-full transition-all ${
              step >= 3 ? "bg-primary" : "bg-muted"
            }`}
          />
          <div
            className={`h-1.5 rounded-full transition-all ${
              step >= 4 ? "bg-primary" : "bg-muted"
            }`}
          />
        </div>

        {/* PASO 1: Nombre del Evento + Moneda */}
        {step === 1 && (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="step1_name" className="font-bold text-xs sm:text-sm">
                Nombre del evento o actividad *
              </Label>
              <Input
                id="step1_name"
                placeholder="Ej. Viaje Punta Cana 🌴, Cena Cumpleaños, Coro Villa"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="step1_currency" className="font-bold text-xs sm:text-sm">
                  Moneda principal
                </Label>
                <select
                  id="step1_currency"
                  value={currency}
                  onChange={(e) =>
                    setCurrency(e.target.value as "DOP" | "USD" | "EUR")
                  }
                  className="w-full h-10 px-3 rounded-xl border border-input bg-background text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="DOP">🇩🇴 DOP (RD$ Dominicano)</option>
                  <option value="USD">🇺🇸 USD ($ Dólar)</option>
                  <option value="EUR">🇪🇺 EUR (€ Euro)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="step1_date" className="font-bold text-xs sm:text-sm">
                  Fecha del evento
                </Label>
                <Input
                  id="step1_date"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="step1_desc" className="text-xs text-muted-foreground">
                Descripción o notas (opcional)
              </Label>
              <Input
                id="step1_desc"
                placeholder="Ej. Gastos de hospedaje, comida, bebidas y combustible"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* PASO 2: Datos del Creador / Owner */}
        {step === 2 && (
          <div className="space-y-4 py-2">
            <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 text-xs space-y-1">
              <div className="font-bold text-foreground flex items-center gap-1.5">
                <User className="h-4 w-4 text-primary" />
                <span>Organizador / Participante #1</span>
              </div>
              <p className="text-muted-foreground">
                El creador queda registrado automáticamente como el primer participante y Owner del serrucho (RN-001).
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="step2_creator_name" className="font-bold text-xs sm:text-sm">
                Tu Nombre o Apodo *
              </Label>
              <Input
                id="step2_creator_name"
                placeholder="Ej. Hernan, Braulio, María"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="step2_creator_email" className="font-bold text-xs sm:text-sm">
                Tu Correo Electrónico *
              </Label>
              <Input
                id="step2_creator_email"
                type="email"
                placeholder="tu.correo@ejemplo.com"
                value={creatorEmail}
                onChange={(e) => setCreatorEmail(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Obligatorio para el creador para recibir notificaciones y administrar el serrucho.
              </p>
            </div>
          </div>
        )}

        {/* PASO 3: Gestión Inicial de Participantes (RN-003) */}
        {step === 3 && (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="font-bold text-xs sm:text-sm">
                Agregar integrantes al coro (mínimo 1 adicional) *
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Nombre del amigo/a (ej. Braulin, Carlos, Laura)"
                  value={participantInput}
                  onChange={(e) => setParticipantInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddParticipant();
                    }
                  }}
                  autoFocus
                />
                <Button
                  type="button"
                  onClick={handleAddParticipant}
                  disabled={!participantInput.trim()}
                  className="bg-primary hover:bg-primary/90 text-white gap-1 shrink-0 font-bold"
                >
                  <Plus className="h-4 w-4" />
                  <span>Agregar</span>
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Solo necesitas el nombre. Podrás enviarles el enlace único por WhatsApp más adelante.
              </p>
            </div>

            {/* List of participants */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase font-bold">
                Lista del Coro ({participants.length + 1})
              </Label>

              <div className="border border-border rounded-xl divide-y divide-border max-h-48 overflow-y-auto bg-card">
                {/* Owner entry */}
                <div className="flex items-center justify-between p-2.5 text-xs bg-muted/30">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-[10px]">
                      1
                    </div>
                    <span className="font-bold text-foreground">
                      {creatorName} (Tú / Owner)
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-bold">
                    Creador
                  </Badge>
                </div>

                {/* Additional participants */}
                {participants.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 text-xs hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground font-bold text-[10px]">
                        {idx + 2}
                      </div>
                      <span className="font-medium text-foreground">{p}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveParticipant(idx)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>

              {participants.length === 0 && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
                  <span>⚠️</span>
                  <span>
                    Debes agregar al menos <strong>1 participante adicional</strong> para poder crear el serrucho (Regla RN-003).
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PASO 4: Resumen y Confirmación */}
        {step === 4 && (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-card border border-border space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-xs text-muted-foreground">Evento</span>
                <span className="font-black text-sm text-foreground">{name}</span>
              </div>

              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-xs text-muted-foreground">Moneda</span>
                <Badge variant="outline" className="font-bold">
                  {currency === "DOP"
                    ? "🇩🇴 DOP (RD$)"
                    : currency === "USD"
                    ? "🇺🇸 USD ($)"
                    : "🇪🇺 EUR (€)"}
                </Badge>
              </div>

              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-xs text-muted-foreground">Creador / Owner</span>
                <div className="text-right">
                  <div className="font-bold text-xs text-foreground">{creatorName}</div>
                  <div className="text-[11px] text-muted-foreground">{creatorEmail}</div>
                </div>
              </div>

              <div>
                <span className="text-xs text-muted-foreground block mb-1.5">
                  Integrantes ({participants.length + 1}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                    👑 {creatorName}
                  </Badge>
                  {participants.map((p, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Al confirmar, se generará el enlace único de invitación para compartir con el coro.
            </p>
          </div>
        )}

        {/* Dialog Footer Actions */}
        <DialogFooter className="flex flex-row justify-between items-center gap-2 pt-2 sm:justify-between">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                hapticLight();
                setStep((prev) => (prev - 1) as any);
              }}
              disabled={loading}
              className="gap-1 text-xs font-bold"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Atrás</span>
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="text-xs"
            >
              Cancelar
            </Button>
          )}

          {step === 1 && (
            <Button
              type="button"
              onClick={handleNextStep1}
              disabled={!name.trim()}
              className="bg-primary hover:bg-primary/90 text-white font-bold gap-1 text-xs"
            >
              <span>Siguiente</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          )}

          {step === 2 && (
            <Button
              type="button"
              onClick={handleNextStep2}
              disabled={!creatorName.trim() || !creatorEmail.trim()}
              className="bg-primary hover:bg-primary/90 text-white font-bold gap-1 text-xs"
            >
              <span>Siguiente</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          )}

          {step === 3 && (
            <Button
              type="button"
              onClick={handleNextStep3}
              disabled={participants.length < 1}
              className="bg-primary hover:bg-primary/90 text-white font-bold gap-1 text-xs"
            >
              <span>Revisar Resumen</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          )}

          {step === 4 && (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-white font-black shadow-md shadow-orange-500/20 gap-1.5 text-xs"
            >
              <Check className="h-4 w-4" />
              <span>{loading ? "Creando..." : "Confirmar y Crear Serrucho ➔"}</span>
            </Button>
          )}
        </DialogFooter>
      </div>
    </Dialog>
  );
}
