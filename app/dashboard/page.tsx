"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  PlusCircle,
  Calendar,
  Lock,
  ArrowRight,
  History,
  X,
  Receipt,
  TrendingUp,
  Sparkles,
  WifiOff,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreateSerruchoDialog } from "@/features/serruchos/components/create-serrucho-dialog";
import { useRecentSerruchos } from "@/lib/hooks/use-recent-serruchos";
import { Serrucho } from "@/lib/types/domain";
import {
  cacheSerruchoList,
  getCachedSerruchoList,
  isOnline,
  subscribeToConnectivity,
} from "@/lib/store/offline-store";
import { PullToRefresh } from "@/components/pull-to-refresh";

interface DashboardStats {
  totalSerruchos: number;
  totalOpen: number;
  totalClosed: number;
}

function SerruchoCard({ s }: { s: Serrucho }) {
  const isOpen = s.status === "OPEN";
  const eventDate = s.event_date || new Date(s.created_at).toLocaleDateString("es-DO");

  return (
    <Link href={`/dashboard/${s.id}`}>
      <Card
        className={`h-full hover:shadow-md transition-all duration-200 group cursor-pointer overflow-hidden relative ${
          isOpen
            ? "hover:border-primary/50 border-border"
            : "opacity-85 hover:opacity-100 bg-muted/20 hover:border-border/80"
        }`}
      >
        {/* Top accent bar */}
        {isOpen && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-t-lg" />
        )}

        <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3
                className={`font-extrabold text-base leading-tight transition-colors ${
                  isOpen ? "group-hover:text-primary" : "group-hover:text-primary"
                } text-foreground`}
              >
                {s.name}
              </h3>

              {isOpen ? (
                <Badge variant="success" className="text-[10px] font-bold flex-shrink-0 gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                  En Curso
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px] font-bold flex-shrink-0 gap-1">
                  <Lock className="h-2.5 w-2.5" />
                  Cerrado
                </Badge>
              )}
            </div>

            {s.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {s.description}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {isOpen ? eventDate : `Cerrado el ${new Date(s.closed_at || s.updated_at).toLocaleDateString("es-DO")}`}
            </span>
            <span
              className={`flex items-center gap-1 font-bold transition-transform group-hover:translate-x-0.5 ${
                isOpen ? "text-primary" : "text-foreground"
              }`}
            >
              {isOpen ? "Entrar" : "Ver"} <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function StatsRow({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        {
          label: "Total",
          value: stats.totalSerruchos,
          icon: Receipt,
          color: "text-primary",
          bg: "bg-primary/10",
        },
        {
          label: "Activos",
          value: stats.totalOpen,
          icon: TrendingUp,
          color: "text-emerald-600",
          bg: "bg-emerald-500/10",
        },
        {
          label: "Cerrados",
          value: stats.totalClosed,
          icon: Lock,
          color: "text-muted-foreground",
          bg: "bg-muted/60",
        },
      ].map((stat) => (
        <Card key={stat.label} className="border-border">
          <CardContent className="p-3.5 flex items-center gap-2.5">
            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon className="h-4 w-4" />
            </div>
            <div>
              <div className="text-lg font-black text-foreground leading-none">{stat.value}</div>
              <div className="text-[11px] text-muted-foreground font-medium">{stat.label}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const { recents, removeRecent } = useRecentSerruchos();
  const [serruchos, setSerruchos] = React.useState<Serrucho[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isOffline, setIsOffline] = React.useState(!isOnline());
  const [createOpen, setCreateOpen] = React.useState(false);

  const fetchSerruchos = React.useCallback(async () => {
    try {
      setLoading(true);

      if (!isOnline()) {
        // Offline — load from IndexedDB cache
        const cached = await getCachedSerruchoList();
        if (cached.length > 0) {
          setSerruchos(cached);
        }
        return;
      }

      const res = await fetch("/api/serruchos");
      if (res.ok) {
        const data: Serrucho[] = await res.json();
        setSerruchos(data);
        // Cache for offline use
        await cacheSerruchoList(data);
      }
    } catch (err) {
      console.error("Error fetching serruchos:", err);
      // Fallback to cache on network error
      const cached = await getCachedSerruchoList();
      if (cached.length > 0) setSerruchos(cached);
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

  React.useEffect(() => {
    const unsubscribe = subscribeToConnectivity(
      () => {
        setIsOffline(false);
        fetchSerruchos(); // Re-fetch on reconnect
      },
      () => setIsOffline(true)
    );
    return unsubscribe;
  }, [fetchSerruchos]);

  const openSerruchos = serruchos.filter((s) => s.status === "OPEN");
  const closedSerruchos = serruchos.filter((s) => s.status === "CLOSED");
  const knownIds = new Set(serruchos.map((s) => s.id));
  const otherRecents = recents.filter((r) => !knownIds.has(r.id));

  const stats: DashboardStats = {
    totalSerruchos: serruchos.length,
    totalOpen: openSerruchos.length,
    totalClosed: closedSerruchos.length,
  };

  return (
    <PullToRefresh onRefresh={fetchSerruchos} enabled={!loading}>
      <div className="container px-4 sm:px-6 py-8 max-w-5xl mx-auto space-y-7">
        {/* Offline notice */}
        {isOffline && (
          <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl px-4 py-2.5 font-medium">
            <WifiOff className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Sin conexión — mostrando datos guardados en este dispositivo</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
              <span>Mis Serruchos</span>
              {openSerruchos.length > 0 && (
                <Badge variant="success" className="text-xs font-bold gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                  {openSerruchos.length} activo{openSerruchos.length !== 1 && "s"}
                </Badge>
              )}
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

        {/* Stats */}
        {serruchos.length > 0 && !loading && <StatsRow stats={stats} />}

        {/* Recents on this device */}
        {otherRecents.length > 0 && (
          <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <History className="h-3.5 w-3.5 text-primary" />
              <span>Visitados recientemente en este dispositivo</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {otherRecents.map((item) => (
                <div
                  key={item.id}
                  className="inline-flex items-center gap-1.5 bg-background border border-border rounded-full py-1 px-3 text-xs font-medium text-foreground hover:border-primary transition-colors"
                >
                  <Link href={`/dashboard/${item.id}`} className="hover:text-primary font-bold">
                    {item.name}
                  </Link>
                  <button
                    onClick={() => removeRecent(item.id)}
                    className="text-muted-foreground hover:text-red-500 ml-1"
                    title="Quitar de recientes"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-8">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-36 rounded-2xl bg-muted/60 animate-pulse"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        ) : serruchos.length === 0 ? (
          <Card className="text-center py-16 border-dashed bg-muted/20">
            <CardContent className="space-y-3">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 text-primary mx-auto flex items-center justify-center font-bold text-3xl">
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
                <div className="flex items-center gap-2 text-xs text-muted-foreground italic p-4 rounded-xl border border-dashed border-border bg-muted/10">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span>No hay serruchos abiertos. Crea uno nuevo para empezar.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {openSerruchos.map((s, i) => (
                    <div
                      key={s.id}
                      style={{
                        animation: `fadeInUp 0.35s ease ${i * 60}ms both`,
                      }}
                    >
                      <SerruchoCard s={s} />
                    </div>
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
                    Liquidados y Archivados ({closedSerruchos.length})
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {closedSerruchos.map((s) => (
                    <SerruchoCard key={s.id} s={s} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <CreateSerruchoDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
      </div>
    </PullToRefresh>
  );
}

export default function DashboardPage() {
  return (
    <React.Suspense
      fallback={
        <div className="container max-w-5xl mx-auto px-4 py-12 space-y-6">
          <div className="h-10 w-48 bg-muted/60 rounded-xl animate-pulse" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted/60 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="h-40 bg-muted/60 rounded-2xl animate-pulse" />
        </div>
      }
    >
      <DashboardContent />
    </React.Suspense>
  );
}
