"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  PlusCircle,
  Calendar,
  Lock,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreateSerruchoDialog } from "@/features/serruchos/components/create-serrucho-dialog";
import { Serrucho } from "@/lib/types/domain";

function DashboardContent() {
  const searchParams = useSearchParams();
  const [serruchos, setSerruchos] = React.useState<Serrucho[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);

  const fetchSerruchos = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/serruchos");
      if (res.ok) {
        const data = await res.json();
        setSerruchos(data);
      }
    } catch (err) {
      console.error("Error fetching serruchos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSerruchos();
  }, [fetchSerruchos]);

  React.useEffect(() => {
    if (searchParams.get("new") === "true") {
      setCreateOpen(true);
    }
  }, [searchParams]);

  const openSerruchos = serruchos.filter((s) => s.status === "OPEN");
  const closedSerruchos = serruchos.filter((s) => s.status === "CLOSED");

  return (
    <div className="container px-4 sm:px-6 py-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Mis Serruchos
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Gestiona tus grupos de gastos, revisa balances y genera estados de cuenta
          </p>
        </div>

        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white font-bold gap-2 self-start sm:self-auto shadow-sm"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Nuevo Serrucho</span>
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-8">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 rounded-2xl bg-muted/60 animate-pulse" />
          ))}
        </div>
      ) : serruchos.length === 0 ? (
        <Card className="text-center py-16 border-dashed bg-muted/20">
          <CardContent className="space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center font-bold text-2xl">
              🪚
            </div>
            <h3 className="font-bold text-lg text-foreground">No tienes ningún serrucho activo</h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
              Crea tu primer serrucho para organizar las cuentas de tu próxima salida o viaje.
            </p>
            <Button
              onClick={() => setCreateOpen(true)}
              className="mt-4 bg-primary text-white font-bold gap-1.5"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Crear mi primer serrucho</span>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Active Serruchos */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                Serruchos en Curso ({openSerruchos.length})
              </h2>
            </div>

            {openSerruchos.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No hay serruchos abiertos en este momento.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {openSerruchos.map((s) => (
                  <Link key={s.id} href={`/dashboard/${s.id}`}>
                    <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all duration-200 group cursor-pointer border-border">
                      <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-extrabold text-lg text-foreground group-hover:text-primary transition-colors">
                              {s.name}
                            </h3>
                            <Badge variant="success" className="text-[10px] font-bold">
                              En Curso
                            </Badge>
                          </div>
                          {s.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{s.description}</p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {s.event_date || new Date(s.created_at).toLocaleDateString("es-DO")}
                          </span>
                          <span className="flex items-center gap-1 font-bold text-primary group-hover:translate-x-1 transition-transform">
                            Entrar al serrucho <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Closed Serruchos */}
          {closedSerruchos.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-border/80">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-base sm:text-lg font-bold text-foreground">
                  Serruchos Cerrados y Liquidados ({closedSerruchos.length})
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {closedSerruchos.map((s) => (
                  <Link key={s.id} href={`/dashboard/${s.id}`}>
                    <Card className="h-full hover:border-border/80 transition-all opacity-85 hover:opacity-100 group cursor-pointer bg-muted/20">
                      <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-extrabold text-base text-foreground group-hover:text-primary transition-colors">
                              {s.name}
                            </h3>
                            <Badge variant="secondary" className="text-[10px] font-bold gap-1">
                              <Lock className="h-2.5 w-2.5" />
                              Cerrado
                            </Badge>
                          </div>
                          {s.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{s.description}</p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs text-muted-foreground">
                          <span>Cerrado el {new Date(s.closed_at || s.updated_at).toLocaleDateString("es-DO")}</span>
                          <span className="flex items-center gap-1 font-semibold text-foreground group-hover:translate-x-1 transition-transform">
                            Ver comprobantes <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <CreateSerruchoDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => fetchSerruchos()}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <React.Suspense
      fallback={
        <div className="container max-w-5xl mx-auto px-4 py-12 space-y-6">
          <div className="h-10 w-48 bg-muted/60 rounded-xl animate-pulse" />
          <div className="h-40 bg-muted/60 rounded-2xl animate-pulse" />
        </div>
      }
    >
      <DashboardContent />
    </React.Suspense>
  );
}
