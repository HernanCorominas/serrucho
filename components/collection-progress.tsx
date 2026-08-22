"use client";

import * as React from "react";
import { formatDOP } from "@/lib/finance/math";
import { ParticipantFinancials } from "@/lib/types/domain";

interface CollectionProgressProps {
  participants: ParticipantFinancials[];
  totalExpensesCents: number;
  serruchoName?: string;
}

/**
 * Animated SVG donut ring showing collection progress of a closed serrucho.
 * In Expo: maps to react-native-svg with identical path data.
 */
export function CollectionProgressRing({
  participants,
  totalExpensesCents,
}: CollectionProgressProps) {
  const [animated, setAnimated] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  const totalOwed = participants
    .filter((p) => p.net_balance_cents < 0)
    .reduce((sum, p) => sum + Math.abs(p.net_balance_cents), 0);

  const totalCollected = totalExpensesCents - totalOwed;
  const pct = totalExpensesCents > 0 ? Math.max(0, Math.min(1, totalCollected / totalExpensesCents)) : 0;

  // SVG ring values
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - (animated ? pct : 0));

  const paidCount = participants.filter((p) => p.net_balance_cents >= 0).length;
  const pendingCount = participants.filter((p) => p.net_balance_cents < 0).length;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl bg-gradient-to-br from-orange-500/8 to-card border border-orange-200/50 dark:border-orange-900/30">
      {/* Donut Ring */}
      <div className="relative flex-shrink-0">
        <svg width="130" height="130" viewBox="0 0 130 130" className="-rotate-90">
          {/* Track */}
          <circle
            cx="65"
            cy="65"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            className="text-muted/40"
          />
          {/* Progress */}
          <circle
            cx="65"
            cy="65"
            r={radius}
            fill="none"
            stroke="url(#collectionGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
          />
          <defs>
            <linearGradient id="collectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-foreground">
            {Math.round(pct * 100)}%
          </span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            cobrado
          </span>
        </div>
      </div>

      {/* Stats Breakdown */}
      <div className="flex-1 w-full space-y-3">
        <div>
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
            Progreso de Cobro
          </div>
          <div className="text-xl font-black text-foreground">
            {formatDOP(totalCollected)}{" "}
            <span className="text-sm font-semibold text-muted-foreground">
              de {formatDOP(totalExpensesCents)}
            </span>
          </div>
          {totalOwed > 0 && (
            <div className="text-xs text-red-600 dark:text-red-400 font-semibold mt-0.5">
              Pendiente: {formatDOP(totalOwed)}
            </div>
          )}
        </div>

        {/* Linear progress bar */}
        <div className="w-full h-2 bg-muted/50 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500"
            style={{
              width: `${animated ? pct * 100 : 0}%`,
              transition: "width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          />
        </div>

        {/* Participant counts */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">
              <strong className="text-foreground">{paidCount}</strong> al día
            </span>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-muted-foreground">
                <strong className="text-foreground">{pendingCount}</strong> pendientes
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== Expense Category Mini-Chart ====================

interface CategoryDonutData {
  label: string;
  emoji: string;
  cents: number;
  color: string;
}

interface CategoryMiniDonutProps {
  data: CategoryDonutData[];
  totalCents: number;
}

export function CategoryMiniDonut({ data, totalCents }: CategoryMiniDonutProps) {
  const [animated, setAnimated] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(t);
  }, []);

  const size = 80;
  const cx = 40;
  const cy = 40;
  const r = 28;
  const circumference = 2 * Math.PI * r;

  let accumulatedPercent = 0;
  const segments = data
    .filter((d) => d.cents > 0)
    .map((d) => {
      const pct = totalCents > 0 ? d.cents / totalCents : 0;
      const offset = circumference * (1 - (animated ? accumulatedPercent : 0));
      const dash = circumference * (animated ? pct : 0);
      accumulatedPercent += pct;
      return { ...d, pct, offset, dash };
    });

  const topCategory = segments.sort((a, b) => b.cents - a.cents)[0];

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-shrink-0">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="8"
              strokeLinecap="butt"
              strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
              strokeDashoffset={seg.offset}
              style={{ transition: `stroke-dasharray 1s ${i * 0.1}s cubic-bezier(0.25, 0.46, 0.45, 0.94), stroke-dashoffset 1s ${i * 0.1}s` }}
            />
          ))}
        </svg>
        {topCategory && (
          <div className="absolute inset-0 flex items-center justify-center text-lg">
            {topCategory.emoji}
          </div>
        )}
      </div>
      <div className="space-y-1 min-w-0">
        {segments.slice(0, 3).map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5 text-[11px]">
            <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-muted-foreground truncate">{seg.emoji} {seg.label.split("/")[0]}</span>
            <span className="text-foreground font-bold ml-auto">{Math.round(seg.pct * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
