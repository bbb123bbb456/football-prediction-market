"use client";

import type { Market } from "@/lib/types";

interface OddsChartProps {
  market: Market;
  size?: "sm" | "md" | "lg";
}

export function OddsChart({ market, size = "md" }: OddsChartProps) {
  const total = market.total_bets;
  if (total === 0) {
    return (
      <div className="text-center text-muted-foreground text-sm py-4">
        No bets placed yet
      </div>
    );
  }

  const homeP = (market.home_bets / total) * 100;
  const drawP = (market.draw_bets / total) * 100;
  const awayP = (market.away_bets / total) * 100;

  const bars = [
    { label: "Home", short: market.home_team, pct: homeP, count: market.home_bets, color: "#3b82f6", bg: "bg-blue-500" },
    { label: "Draw", short: "Draw", pct: drawP, count: market.draw_bets, color: "#eab308", bg: "bg-yellow-500" },
    { label: "Away", short: market.away_team, pct: awayP, count: market.away_bets, color: "#ef4444", bg: "bg-red-500" },
  ];

  const height = size === "sm" ? 80 : size === "lg" ? 160 : 120;

  return (
    <div className="space-y-3">
      {/* Bar chart */}
      <div className={`flex items-end gap-3 justify-center`} style={{ height }}>
        {bars.map((bar) => (
          <div key={bar.label} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs font-bold" style={{ color: bar.color }}>
              {Math.round(bar.pct)}%
            </span>
            <div
              className="w-full rounded-t-lg transition-all duration-700"
              style={{
                height: `${Math.max((bar.pct / 100) * height, 6)}px`,
                backgroundColor: bar.color,
                opacity: bar.pct === 0 ? 0.2 : 1,
                boxShadow: bar.pct > 0 ? `0 0 16px ${bar.color}55` : "none",
              }}
            />
          </div>
        ))}
      </div>

      {/* Labels */}
      <div className="flex gap-3">
        {bars.map((bar) => (
          <div key={bar.label} className="flex-1 text-center">
            <div className="text-xs font-semibold text-foreground truncate">{bar.short}</div>
            <div className="text-xs text-muted-foreground">{bar.count} bets</div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="text-center text-xs text-muted-foreground">
        {total} total bets
      </div>
    </div>
  );
}
