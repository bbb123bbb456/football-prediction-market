"use client";

import Link from "next/link";
import type { LeagueInfo } from "@/lib/constants";
import type { Market } from "@/lib/types";
import { useMarketsByLeague } from "@/lib/hooks/usePredictionMarket";

interface LeagueCardProps {
  league: LeagueInfo;
}

export function LeagueCard({ league }: LeagueCardProps) {
  const { data: markets = [] } = useMarketsByLeague(league.slug);
  const open = markets.filter((m: Market) => m.status === "open").length;
  const totalBets = markets.reduce((acc: number, m: Market) => acc + m.total_bets, 0);

  return (
    <Link href={`/league/${league.slug}`} className="block group">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:border-white/20 cursor-pointer">
        {/* Gradient stripe */}
        <div className={`absolute inset-0 bg-gradient-to-br ${league.bgGradient} opacity-10 group-hover:opacity-20 transition-opacity`} />

        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-4xl mb-2">{league.emoji}</div>
              <h3 className="text-lg font-bold">{league.name}</h3>
              <p className="text-sm text-muted-foreground">{league.country}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-accent">{open}</div>
              <div className="text-xs text-muted-foreground">open markets</div>
            </div>
          </div>

          {/* Teams */}
          <div className="flex flex-wrap gap-1 mb-4">
            {league.teams.map((team) => (
              <span
                key={team}
                className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-muted-foreground"
              >
                {team}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {markets.length} markets total
            </span>
            <span className="text-muted-foreground">
              {totalBets} bets placed
            </span>
          </div>

          {/* CTA */}
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-sm font-medium text-accent group-hover:text-accent transition-colors">
              View Markets →
            </span>
            {open > 0 && (
              <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
                {open} live
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
