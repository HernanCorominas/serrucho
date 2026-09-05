"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  UserCheck,
  Lock,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Plus,
  Home,
  CheckCircle2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { Serrucho, Participant } from "@/lib/types/domain";
import { hapticSuccess, hapticImpact } from "@/lib/utils/haptics";

export default function JoinSerruchoPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const tokenOrId = params?.token as string;

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [serrucho, setSerrucho] = React.useState<Serrucho | null>(null);
  const [participants, setParticipants] = React.useState<Participant[]>([]);
  const [selectingId, setSelectingId] = React.useState<string | null>(null);

  // New participant input (if adding oneself)
  const [newName, setNewName] = React.useState("");
  const [addingNew, setAddingNew] = React.useState(false);

  React.useEffect(() => {
    if (!tokenOrId) return;

    async function loadGroup() {
      try {
        setLoading(true);
        setError(null);

        // Fetch serrucho by ID or token
        const res = await fetch(`/api/serruchos/${tokenOrId}`);
        if (!res.ok) {
          throw new Error("El enlace de invitación no es válido o ha expirado");
        }

        const data = await res.json();
        setSerrucho(data.serrucho);
        setParticipants(data.participants || []);
      } catch (err: any) {
        setError(err.message || "No se pudo cargar el serrucho");
      } finally {
        setLoading(false);
      }
    }

    loadGroup();
  }, [tokenOrId]);

  const handleSelectIdentity = async (p: Participant) => {
    if (!serrucho) return;

    // Decisión #2: Validar si ya fue reclamado
    const isClaimed =
      p.access_status === "IDENTIFIED" ||
      p.access_status === "LINKED_ACCOUNT" ||
      p.access_status === "ACCESSED";

    // Allow user to re-select if their local storage matches
    const currentMyId = localStorage.getItem(`serrucho_my_id_${serrucho.id}`);
    if (isClaimed && currentMyId !== p.id) {
      hapticImpact();
      toast({
        type: "error",
        title: "Participante ya reclamado",
        message:
          "Este participante ya fue seleccionado por otra persona. Si eres tú, pide al organizador que reinicie tu acceso (Decisión #2 y #3).",
      });
      return;
    }

    try {
      setSelectingId(p.id);
      hapticSuccess();

      // Store identity in local storage
      localStorage.setItem(`serrucho_my_id_${serrucho.id}`, p.id);

      // Register seen presence (RN-011, RN-012)
      await fetch(`/api/serruchos/${serrucho.id}/participants/${p.id}/seen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IDENTIFIED" }),
      });

      toast({
        type: "success",
        title: `¡Bienvenido, ${p.name}! 🎉`,
        message: `Has ingresado a "${serrucho.name}".`,
      });

      router.push(`/dashboard/${serrucho.id}`);
    } catch {
      router.push(`/dashboard/${serrucho.id}`);
    } finally {
      setSelectingId(null);
    }
  };

  const handleAddNewParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serrucho || !newName.trim()) return;

    try {
      setAddingNew(true);
      const res = await fetch(`/api/serruchos/${serrucho.id}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Error al agregarte al coro");
      }

      const created = await res.json();
      hapticSuccess();
      localStorage.setItem(`serrucho_my_id_${serrucho.id}`, created.id);

      toast({
        type: "success",
        title: `¡Te has unido, ${created.name}!`,
        message: "Ya estás registrado en el serrucho.",
      });

      router.push(`/dashboard/${serrucho.id}`);
    } catch (err: any) {
      hapticImpact();
      toast({ type: "error", message: err.message });
    } finally {
      setAddingNew(false);
    }
  };

  // Screen 18: Error State para Enlace Inválido o Expirado
  if (error || (!loading && !serrucho)) {
    return (
      <div className="container max-w-md mx-auto px-4 py-20 text-center space-y-5">
        <div className="h-16 w-16 rounded-3xl bg-red-500/10 text-red-600 mx-auto flex items-center justify-center shadow-xs">
          <AlertCircle className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-foreground">
            Enlace de Invitación Inválido
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto">
            {error || "No pudimos encontrar el serrucho correspondiente a este enlace. Verifica el link con el organizador del coro."}
          </p>
        </div>
        <div className="pt-3">
          <Link href="/">
            <Button className="font-bold text-xs gap-2 rounded-xl bg-primary text-white">
              <Home className="h-4 w-4" />
              <span>Volver a la Página Principal</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading || !serrucho) {
    return (
      <div className="container max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-muted-foreground animate-pulse">
          Cargando coro...
        </p>
      </div>
    );
  }

  // Screen 8: Pantalla "¿Quién eres?" (RF-005)
  return (
    <div className="container max-w-lg mx-auto px-4 py-8 sm:py-12 space-y-6">
      {/* Header Info */}
      <div className="text-center space-y-2">
        <Badge
          variant="outline"
          className="border-primary/30 text-primary font-bold text-xs px-3 py-1 rounded-full gap-1.5"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Invitación al Coro 🇩🇴</span>
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
          {serrucho.name}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {serrucho.description || "Gastos y cuentas compartidas del grupo."}
        </p>
      </div>

      {/* Identity Selection Card */}
      <Card className="border-border shadow-md rounded-2xl overflow-hidden">
        <CardHeader className="bg-muted/30 pb-3 border-b border-border/60">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            <span>¿Quién eres en este serrucho?</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Selecciona tu nombre para vincular tus gastos, deudas y ver tu resumen individual.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 space-y-3">
          <div className="space-y-2">
            {participants.map((p) => {
              const isClaimed =
                p.access_status === "IDENTIFIED" ||
                p.access_status === "LINKED_ACCOUNT" ||
                p.access_status === "ACCESSED";
              const isMe =
                typeof window !== "undefined" &&
                localStorage.getItem(`serrucho_my_id_${serrucho.id}`) === p.id;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectIdentity(p)}
                  disabled={isClaimed && !isMe || selectingId === p.id}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isMe
                      ? "border-primary bg-primary/10 shadow-xs"
                      : isClaimed
                      ? "border-border/50 bg-muted/40 opacity-60 cursor-not-allowed"
                      : "border-border bg-card hover:border-primary hover:bg-primary/5 cursor-pointer shadow-xs"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl font-black text-sm ${
                        isMe
                          ? "bg-primary text-white"
                          : isClaimed
                          ? "bg-muted text-muted-foreground"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-foreground">
                          {p.name}
                        </span>
                        {isMe && (
                          <Badge className="bg-primary text-white text-[10px] font-bold py-0">
                            Eres tú ✓
                          </Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {isClaimed && !isMe ? (
                          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                            <Lock className="h-3 w-3" /> Reclamado previamente
                          </span>
                        ) : (
                          <span>Toca para identificarte</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    {isMe ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : isClaimed ? (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        Bloqueado
                      </Badge>
                    ) : (
                      <div className="flex items-center gap-1 text-xs font-bold text-primary">
                        <span>Soy yo</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Add oneself if not listed */}
          <div className="pt-3 border-t border-border/60">
            <div className="text-xs text-muted-foreground mb-2 font-medium">
              ¿No ves tu nombre en la lista? Agrégate:
            </div>
            <form onSubmit={handleAddNewParticipant} className="flex gap-2">
              <Input
                placeholder="Tu nombre completo o apodo"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="text-xs h-9"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!newName.trim() || addingNew}
                className="bg-primary hover:bg-primary/90 text-white font-bold text-xs shrink-0 gap-1 h-9"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{addingNew ? "Uniendo..." : "Unirme"}</span>
              </Button>
            </form>
          </div>
        </CardContent>

        <CardFooter className="bg-muted/20 p-3.5 border-t border-border/60 text-center justify-center">
          <p className="text-[11px] text-muted-foreground">
            Al identificarte podrás anotar gastos, revisar balances y marcar tus transferencias.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
