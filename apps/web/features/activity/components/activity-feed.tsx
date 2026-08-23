"use client";

import * as React from "react";
import {
  History,
  Receipt,
  ArrowRightLeft,
  Download,
  UserPlus,
  UserMinus,
  CheckCircle2,
  Lock,
  Edit,
  Trash2,
  Clock,
  Sparkles,
  RefreshCw,
  Search,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActivityEvent, ActivityActionType } from "@/lib/types/domain";

interface ActivityFeedProps {
  serruchoId: string;
}

export function ActivityFeed({ serruchoId }: ActivityFeedProps) {
  const [activities, setActivities] = React.useState<ActivityEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterType, setFilterType] = React.useState<string>("ALL");

  const loadActivity = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/serruchos/${serruchoId}/activity?limit=100`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch (err) {
      console.error("Error loading activities:", err);
    } finally {
      setLoading(false);
    }
  }, [serruchoId]);

  React.useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  const filteredActivities = React.useMemo(() => {
    return activities.filter((act) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery.trim() ||
        act.summary.toLowerCase().includes(q) ||
        act.actor_name.toLowerCase().includes(q);

      const matchesType =
        filterType === "ALL" ||
        (filterType === "EXPENSES" && act.entity_type === "EXPENSE") ||
        (filterType === "TRANSFERS" && act.entity_type === "TRANSFER") ||
        (filterType === "INCOMES" && act.entity_type === "INCOME") ||
        (filterType === "PARTICIPANTS" && act.entity_type === "PARTICIPANT") ||
        (filterType === "SETTLEMENTS" && (act.entity_type === "SETTLEMENT" || act.entity_type === "SERRUCHO"));

      return matchesSearch && matchesType;
    });
  }, [activities, searchQuery, filterType]);

  const getActivityIcon = (type: ActivityActionType) => {
    switch (type) {
      case "EXPENSE_CREATED":
        return <Receipt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case "EXPENSE_UPDATED":
        return <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case "EXPENSE_DELETED":
        return <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case "TRANSFER_CREATED":
      case "TRANSFER_UPDATED":
      case "TRANSFER_DELETED":
        return <ArrowRightLeft className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case "INCOME_CREATED":
      case "INCOME_UPDATED":
      case "INCOME_DELETED":
        return <Download className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />;
      case "PARTICIPANT_ADDED":
      case "PARTICIPANT_UPDATED":
        return <UserPlus className="h-4 w-4 text-purple-600 dark:text-purple-400" />;
      case "PARTICIPANT_REMOVED":
        return <UserMinus className="h-4 w-4 text-rose-600 dark:text-rose-400" />;
      case "SETTLEMENT_MARKED_PAID":
        return <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case "SERRUCHO_CLOSED":
        return <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
      default:
        return <History className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const now = new Date();
      const date = new Date(isoString);
      const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffSecs < 60) return "Hace un momento";
      if (diffSecs < 3600) return `Hace ${Math.floor(diffSecs / 60)} min`;
      if (diffSecs < 86400) return `Hace ${Math.floor(diffSecs / 3600)} h`;
      if (diffSecs < 172800) return "Ayer";

      return date.toLocaleDateString("es-DO", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <History className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base sm:text-lg">Historial de Cambios</CardTitle>
            <CardDescription className="text-xs">
              Registro cronológico de todas las acciones y modificaciones en el coro
            </CardDescription>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadActivity}
          disabled={loading}
          className="gap-1.5 text-xs font-semibold self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Actualizar</span>
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        {activities.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar en el historial..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs sm:text-sm h-9"
              />
            </div>

            <div className="flex items-center bg-muted p-0.5 rounded-lg text-xs font-semibold overflow-x-auto shrink-0">
              <button
                type="button"
                onClick={() => setFilterType("ALL")}
                className={`px-2.5 py-1 rounded-md transition-all shrink-0 ${
                  filterType === "ALL"
                    ? "bg-card text-foreground shadow-xs font-bold"
                    : "text-muted-foreground"
                }`}
              >
                Todos ({activities.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("EXPENSES")}
                className={`px-2.5 py-1 rounded-md transition-all shrink-0 ${
                  filterType === "EXPENSES"
                    ? "bg-card text-foreground shadow-xs font-bold"
                    : "text-muted-foreground"
                }`}
              >
                Gastos
              </button>
              <button
                type="button"
                onClick={() => setFilterType("TRANSFERS")}
                className={`px-2.5 py-1 rounded-md transition-all shrink-0 ${
                  filterType === "TRANSFERS"
                    ? "bg-card text-foreground shadow-xs font-bold"
                    : "text-muted-foreground"
                }`}
              >
                Transferencias
              </button>
              <button
                type="button"
                onClick={() => setFilterType("INCOMES")}
                className={`px-2.5 py-1 rounded-md transition-all shrink-0 ${
                  filterType === "INCOMES"
                    ? "bg-card text-foreground shadow-xs font-bold"
                    : "text-muted-foreground"
                }`}
              >
                Reembolsos
              </button>
              <button
                type="button"
                onClick={() => setFilterType("PARTICIPANTS")}
                className={`px-2.5 py-1 rounded-md transition-all shrink-0 ${
                  filterType === "PARTICIPANTS"
                    ? "bg-card text-foreground shadow-xs font-bold"
                    : "text-muted-foreground"
                }`}
              >
                Integrantes
              </button>
            </div>
          </div>
        )}

        {/* Feed List */}
        {loading && activities.length === 0 ? (
          <div className="text-center py-10 text-xs text-muted-foreground">
            Cargando historial de cambios...
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-10 border border-dashed rounded-2xl p-6 bg-muted/20">
            <History className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
            <h4 className="font-bold text-foreground text-sm">No hay eventos en el historial</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              Las acciones como agregar gastos, registrar pagos o modificar cuotas quedarán registradas aquí para total transparencia.
            </p>
          </div>
        ) : (
          <div className="relative border-l-2 border-border/80 ml-3.5 space-y-4 py-2">
            {filteredActivities.map((act) => (
              <div key={act.id} className="relative pl-6">
                {/* Timeline node icon */}
                <div className="absolute -left-[17px] top-0.5 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card shadow-xs">
                  {getActivityIcon(act.action_type)}
                </div>

                <div className="space-y-0.5 rounded-xl border border-border/60 bg-card p-3 shadow-2xs hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-xs sm:text-sm font-semibold text-foreground">
                      {act.summary}
                    </p>
                    <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground shrink-0">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(act.created_at)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground">
                    <span className="font-medium text-foreground">Por: {act.actor_name}</span>
                    <span>•</span>
                    <span className="text-[10px] font-mono text-muted-foreground/80">
                      {new Date(act.created_at).toLocaleTimeString("es-DO", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
