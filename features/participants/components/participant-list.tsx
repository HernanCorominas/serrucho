"use client";

import * as React from "react";
import { User, Trash2, Mail, Phone, PlusCircle, Users } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { Participant } from "@/lib/types/domain";

interface ParticipantListProps {
  serruchoId: string;
  isClosed: boolean;
  participants: Participant[];
  onAddClick: () => void;
  onParticipantDeleted: () => void;
}

export function ParticipantList({
  serruchoId,
  isClosed,
  participants,
  onAddClick,
  onParticipantDeleted,
}: ParticipantListProps) {
  const { toast } = useToast();
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar a ${name} del serrucho?`)) {
      return;
    }

    try {
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <span>Participantes ({participants.length})</span>
          </CardTitle>
          <CardDescription>
            Personas incluidas en la división de gastos del serrucho
          </CardDescription>
        </div>

        {!isClosed && (
          <Button size="sm" onClick={onAddClick} className="gap-1.5 font-bold">
            <PlusCircle className="h-4 w-4" />
            <span>Agregar</span>
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {participants.length === 0 ? (
          <div className="text-center py-10 border border-dashed rounded-2xl p-6 bg-muted/20">
            <User className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
            <h4 className="font-bold text-foreground text-sm">No hay participantes aún</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              Agrega a las personas de tu coro para poder anotar gastos y repartirlos.
            </p>
            {!isClosed && (
              <Button size="sm" onClick={onAddClick} className="mt-4 gap-1.5 font-bold">
                <PlusCircle className="h-4 w-4" />
                <span>Agregar primer participante</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
            {participants.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3.5 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-foreground">{p.name}</h5>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {p.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {p.email}
                        </span>
                      )}
                      {p.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {p.phone}
                        </span>
                      )}
                      {!p.email && !p.phone && <span>Sin datos de contacto</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] uppercase font-bold">
                    {p.preferred_channel === "WHATSAPP" ? "WhatsApp" : "Email"}
                  </Badge>

                  {!isClosed && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-red-600"
                      onClick={() => handleDelete(p.id, p.name)}
                      disabled={deletingId === p.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
