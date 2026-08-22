"use client";

import * as React from "react";
import { Trophy, Sparkles, Award } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CoroAward } from "@/lib/types/domain";
import { calculateCoroAwards } from "@/lib/finance/math";

interface CoroAwardsCardProps {
  participants: { id: string; name: string; total_paid_cents: number; total_owed_cents: number; net_balance_cents: number }[];
  expenses: { id: string; description: string; amount_cents: number; paid_by_participant_id: string; category?: string }[];
}

export function CoroAwardsCard({ participants, expenses }: CoroAwardsCardProps) {
  const awards: CoroAward[] = React.useMemo(() => {
    return calculateCoroAwards({ participants, expenses });
  }, [participants, expenses]);

  if (awards.length === 0) return null;

  return (
    <Card className="border-amber-200/80 bg-gradient-to-br from-amber-500/5 via-card to-card dark:border-amber-800/80">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 font-bold">
              <Trophy className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-extrabold text-foreground flex items-center gap-1.5">
                <span>Insignias & Premios del Coro</span>
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              </CardTitle>
              <CardDescription className="text-xs">
                Menciones honoríficas basadas en el comportamiento financiero del grupo
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] font-bold border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300">
            {awards.length} Premios
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {awards.map((award) => (
            <div
              key={award.id}
              className={`p-3.5 rounded-2xl border bg-gradient-to-br transition-all hover:scale-[1.02] shadow-xs space-y-2 ${award.color}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{award.emoji}</span>
                  <div>
                    <h4 className="font-extrabold text-xs text-foreground leading-tight">
                      {award.title}
                    </h4>
                    <span className="text-[10px] text-muted-foreground block line-clamp-1">
                      {award.subtitle}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
                <span className="font-black text-foreground truncate max-w-[120px]">
                  {award.winner_name}
                </span>
                <Badge variant="secondary" className="text-[11px] font-extrabold font-mono">
                  {award.metric}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
