"use client";

import { useLeaderboard } from "@/lib/hooks/usePredictionMarket";
import type { LeaderboardEntry } from "@/lib/types";

function truncate(addr: string) {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

const RANK_MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export function LeaderboardTable() {
  const { data: entries = [], isLoading } = useLeaderboard();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No points recorded yet. Place and win bets to climb the leaderboard!
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-muted-foreground text-xs border-b border-white/10">
            <th className="pb-2 text-left w-10">#</th>
            <th className="pb-2 text-left">Player</th>
            <th className="pb-2 text-right">Bets</th>
            <th className="pb-2 text-right">Points</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {entries.map((entry: LeaderboardEntry) => (
            <tr key={entry.user} className="hover:bg-white/5 transition-colors">
              <td className="py-3 text-base">
                {RANK_MEDALS[entry.rank] ?? (
                  <span className="text-muted-foreground text-xs">{entry.rank}</span>
                )}
              </td>
              <td className="py-3 font-mono text-xs text-muted-foreground">
                {truncate(entry.user)}
              </td>
              <td className="py-3 text-right text-muted-foreground">{entry.total_bets}</td>
              <td className="py-3 text-right">
                <span className="font-bold text-accent">{entry.points}</span>
                <span className="text-xs text-muted-foreground ml-1">pts</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
