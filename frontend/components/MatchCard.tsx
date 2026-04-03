"use client";

import Link from "next/link";
import type { Market } from "@/lib/types";
import { LEAGUES } from "@/lib/constants";

interface MatchCardProps {
  market: Market;
  showLeague?: boolean;
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(dateStr)
  );
}

function statusBadge(status: string) {
  if (status === "open")
    return (
      <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full border border-green-500/30 animate-pulse">
        ● LIVE
      </span>
    );
  return (
    <span className="text-xs px-2 py-0.5 bg-white/10 text-muted-foreground rounded-full border border-white/10">
      Resolved
    </span>
  );
}

export function MatchCard({ market, showLeague = false }: MatchCardProps) {
  const league = LEAGUES[market.league as keyof typeof LEAGUES];
  const total = market.total_bets || 1;
  const homeP = Math.round((market.home_bets / total) * 100);
  const drawP = Math.round((market.draw_bets / total) * 100);
  const awayP = 100 - homeP - drawP;

  return (
    <Link href={`/match/${encodeURIComponent(market.market_id)}`} className="block group">
      <div className="relative rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 hover:border-white/20 hover:shadow-xl overflow-hidden">
        {/* Top color stripe */}
        <div
          className={`h-1 w-full bg-gradient-to-r ${league?.bgGradient ?? "from-accent to-purple-500"}`}
        />

        <div className="p-5">
          {/* League + status */}
          <div className="flex items-center justify-between mb-4">
            {showLeague && league && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                {league.emoji} {league.name}
              </span>
            )}
            {!showLeague && <span className="text-xs text-muted-foreground">{formatDate(market.match_date)}</span>}
            {statusBadge(market.status)}
          </div>

          {/* Teams */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex-1 text-center">
              <div className="text-lg font-bold truncate">{market.home_team}</div>
              <div className="text-xs text-muted-foreground">Home</div>
            </div>
            <div className="flex flex-col items-center shrink-0">
              {market.status === "resolved" ? (
                <div className="text-2xl font-black tracking-tighter">
                  {market.home_score} – {market.away_score}
                </div>
              ) : (
                <div className="text-lg font-bold text-muted-foreground">vs</div>
              )}
              {showLeague && (
                <div className="text-xs text-muted-foreground mt-1">{formatDate(market.match_date)}</div>
              )}
            </div>
            <div className="flex-1 text-center">
              <div className="text-lg font-bold truncate">{market.away_team}</div>
              <div className="text-xs text-muted-foreground">Away</div>
            </div>
          </div>

          {/* Outcome winner badge */}
          {market.status === "resolved" && market.outcome && (
            <div className="text-center mb-3">
              <span className="text-xs px-3 py-1 bg-accent/20 text-accent rounded-full border border-accent/30 font-medium">
                {market.outcome === "home"
                  ? `🏆 ${market.home_team} wins`
                  : market.outcome === "away"
                  ? `🏆 ${market.away_team} wins`
                  : "🤝 Draw"}
              </span>
            </div>
          )}

          {/* Bet distribution bar */}
          {market.total_bets > 0 && (
            <div className="mt-2">
              <div className="flex rounded-full overflow-hidden h-1.5 mb-1">
                <div className="bg-blue-500 transition-all" style={{ width: `${homeP}%` }} />
                <div className="bg-yellow-500 transition-all" style={{ width: `${drawP}%` }} />
                <div className="bg-red-500 transition-all" style={{ width: `${awayP}%` }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="text-blue-400">{homeP}% H</span>
                <span className="text-yellow-400">{drawP}% D</span>
                <span className="text-red-400">{awayP}% A</span>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-muted-foreground">
            <span>{market.total_bets} bets</span>
            <span className="text-accent group-hover:underline">View →</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
