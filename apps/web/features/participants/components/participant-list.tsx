"use client";

import * as React from "react";
import {
  User,
  Trash2,
  Mail,
  Phone,
  PlusCircle,
  Users,
  Search,
  RotateCcw,
  CheckCircle2,
  Clock,
  Shield,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { Participant, ACCESS_STATUS_INFO } from "@/lib/types/domain";
import { hapticLight, hapticImpact, hapticSuccess } from "@/lib/utils/haptics";

interface ParticipantListProps {
  serruchoId: string;
  isClosed: boolean;
  isReadOnly?: boolean;
  participants: Participant[];
  ownerId?: string;
  onAddClick: () => void;
  onParticipantDeleted: () => void;
}

export function ParticipantList({
  serruchoId,
  isClosed,
  isReadOnly = false,
  participants,
  ownerId,
  onAddClick,
  onParticipantDeleted,
}: ParticipantListProps) {
  const { toast } = useToast();
  const [search, setSearch] = React.useState("");
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [resettingId, setResettingId] = React.useState<string | null>(null);

  const filteredParticipants = React.useMemo(() => {
    if (!search.trim()) return participants;
    const q = search.toLowerCase().trim();
    return participants.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.email && p.email.toLowerCase().includes(q)) ||
        (p.phone && p.phone.includes(q))
    );
  }, [participants, search]);

  const handleDelete = async (id: string, name: string, isOwner = false) => {
    // RN-002: El Owner nunca puede eliminarse a sí mismo
    if (isOwner) {
      toast({
        type: "error",
        title: "Acción no permitida",
        message: "El organizador / Owner no puede eliminarse del serrucho (RN-002).",
      });
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar a ${name} del serrucho?`)) {
      return;
    }

    try {
      hapticImpact();
      setDeletingId(id);
      const res = await fetch(`/api/serruchos/${serruchoId}/participants/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "No se pudo eliminar el participante");
      }

      toast({
        type: "success",
        title: "Participante eliminado",
        message: `${name} ha sido retirado del serrucho.`,
      });
      onParticipantDeleted();
    } catch (err: any) {
      toast({ type: "error", message: err.message });
    } finally {
      setDeletingId(null);
    }
  };

  const handleResetAccess = async (id: string, name: string) => {
    if (!confirm(`¿Deseas reiniciar el acceso de ${name}? Quedará libre para volverse a vincular.`)) {
      return;
    }

    try {
      setResettingId(id);
      const res = await fetch(`/api/serruchos/${serruchoId}/participants/${id}/reset-access`, {
        method: "POST",
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "No se pudo reiniciar el acceso");
      }

      hapticSuccess();
      toast({
        type: "success",
        title: "Acceso reiniciado",
        message: `El estado de ${name} ahora es Invitado (Decisión #3).`,
      });
      onParticipantDeleted();
    } catch (err: any) {
      toast({ type: "error", message: err.message });
    } finally {
      setResettingId(null);
    }
  };

  const handleUpdateShares = async (pId: string, shares: number) => {
    try {
      const res = await fetch(`/api/serruchos/${serruchoId}/participants/${pId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ default_shares: shares }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al actualizar cuotas");
      }

      toast({
        type: "success",
        title: "Cuotas actualizadas",
        message: `Se configuraron ${shares} cuotas por defecto para este participante.`,
      });
      onParticipantDeleted();
    } catch (err: any) {
      toast({ type: "error", message: err.message });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-3">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <span>Participantes ({participants.length})</span>
          </CardTitle>
          <CardDescription>
            Integrantes del coro y su estado de acceso al serrucho (RF-017)
          </CardDescription>
        </div>

        {!isClosed && !isReadOnly && (
          <Button
            size="sm"
            onClick={() => {
              hapticLight();
              onAddClick();
            }}
            className="gap-1.5 font-bold self-start sm:self-auto bg-primary hover:bg-primary/90 text-white"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Agregar Integrante</span>
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Search Bar */}
        {participants.length > 3 && (
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar participante por nombre, email o teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-xs"
            />
          </div>
        )}

        {participants.length === 0 ? (
          <div className="text-center py-14 border border-dashed border-border/80 rounded-3xl p-6 bg-gradient-to-b from-muted/30 to-card shadow-xs">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary mx-auto mb-3 shadow-xs">
              <Users className="h-8 w-8" />
            </div>
            <h4 className="font-extrabold text-foreground text-base">Aún no hay integrantes en el coro</h4>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
              Agrega a los amigos o familiares que participan en los gastos para comenzar a repartir las cuentas.
            </p>
            {!isClosed && !isReadOnly && (
              <Button size="sm" onClick={onAddClick} className="mt-5 gap-2 font-extrabold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-sm px-4 h-10">
                <PlusCircle className="h-4 w-4" />
                <span>Agregar Primer Integrante</span>
              </Button>
            )}
          </div>
        ) : filteredParticipants.length === 0 ? (
          <div className="text-center py-6 text-xs text-muted-foreground">
            No se encontró ningún participante que coincida con &quot;{search}&quot;.
          </div>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
            {filteredParticipants.map((p, idx) => {
              const isOwner = idx === 0 || (ownerId && p.user_id === ownerId);
              const defShares = p.default_shares ?? 1;
              const accessStatus = p.access_status || "INVITED";
              const statusInfo = ACCESS_STATUS_INFO[accessStatus];
              const hasAccessed = accessStatus !== "INVITED";

              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3.5 hover:bg-muted/30 transition-colors gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm shrink-0">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className="font-bold text-sm text-foreground truncate">{p.name}</h5>
                        {isOwner && (
                          <Badge variant="outline" className="text-[10px] font-extrabold border-primary/40 text-primary px-1.5 py-0 gap-1">
                            <Shield className="h-2.5 w-2.5" />
                            <span>Owner</span>
                          </Badge>
                        )}
                        {defShares !== 1 && (
                          <Badge variant="secondary" className="text-[10px] font-bold px-1.5 py-0">
                            {defShares}x {defShares === 2 ? "Pareja" : defShares === 0.5 ? "Niño" : "Cuotas"}
                          </Badge>
                        )}

                        {/* Visual Access State (RF-012 & Screen 5) */}
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            hasAccessed
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-300 dark:border-emerald-800"
                              : "bg-muted text-muted-foreground border-border"
                          }`}
                          title={hasAccessed ? "✓ Participante accedió al serrucho" : "✗ Aún no ha accedido"}
                        >
                          <span>{hasAccessed ? "✓ Accedió" : "✗ No ha accedido"}</span>
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        {p.email && (
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="h-3 w-3 shrink-0" /> {p.email}
                          </span>
                        )}
                        {p.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 shrink-0" /> {p.phone}
                          </span>
                        )}
                        {!p.email && !p.phone && <span>Sin datos de contacto</span>}
                        {p.last_seen_at && (
                          <>
                            <span>•</span>
                            <span className="text-[11px] text-muted-foreground/80">
                              Visto: {new Date(p.last_seen_at).toLocaleDateString("es-DO", { day: "numeric", month: "short" })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isClosed && !isReadOnly && (
                      <div className="flex items-center gap-1.5">
                        {/* Reset access button (Decisión #3) */}
                        {hasAccessed && !isOwner && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResetAccess(p.id, p.name)}
                            disabled={resettingId === p.id}
                            className="h-8 px-2 text-[11px] font-semibold text-muted-foreground hover:text-foreground gap-1"
                            title="Reiniciar acceso de este participante si se equivocó de identidad"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Reiniciar</span>
                          </Button>
                        )}

                        <select
                          value={defShares}
                          onChange={(e) => handleUpdateShares(p.id, parseFloat(e.target.value))}
                          title="Cuotas por defecto para repartir"
                          className="text-[11px] font-bold bg-muted/60 border border-border rounded-md px-1.5 py-1 text-foreground cursor-pointer"
                        >
                          <option value="1">1x (Normal)</option>
                          <option value="2">2x (Pareja)</option>
                          <option value="0.5">0.5x (Niño)</option>
                          <option value="3">3x (Familia)</option>
                        </select>

                        {/* Delete button (Owner cannot delete himself RN-002) */}
                        {!isOwner && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(p.id, p.name, Boolean(isOwner))}
                            disabled={deletingId === p.id}
                            className="text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 p-2 h-8 w-8"
                            title={`Eliminar a ${p.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
