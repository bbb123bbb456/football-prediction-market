"use client";

import { use } from "react";
import { Navbar } from "@/components/Navbar";
import { MatchCard } from "@/components/MatchCard";
import Link from "next/link";
import { getLeagueBySlug } from "@/lib/constants";
import { useMarketsByLeague } from "@/lib/hooks/usePredictionMarket";
import type { Market } from "@/lib/types";
import { notFound } from "next/navigation";

export default function LeaguePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const league = getLeagueBySlug(slug);
  const { data: markets = [], isLoading } = useMarketsByLeague(slug);

  if (!league) return notFound();

  const open = markets.filter((m: Market) => m.status === "open");
  const resolved = markets.filter((m: Market) => m.status === "resolved");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-24 pb-16 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-start gap-4 animate-fade-in">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link href="/" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                  Home
                </Link>
                <span className="text-muted-foreground">/</span>
                <span className="text-sm">{league.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-5xl">{league.emoji}</span>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold">{league.name}</h1>
                  <p className="text-muted-foreground">{league.country} · Top 5 Teams</p>
                </div>
              </div>
            </div>
          </div>

          {/* Teams */}
          <div className="flex flex-wrap gap-2">
            {league.teams.map((team) => (
              <span key={team} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm font-medium">
                {team}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Markets", value: markets.length },
              { label: "Open Markets", value: open.length },
              { label: "Total Bets", value: markets.reduce((a: number, m: Market) => a + m.total_bets, 0) },
            ].map((s) => (
              <div key={s.label} className="glass-card p-4 rounded-xl border border-white/10 text-center">
                <div className="text-2xl font-bold text-accent">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          )}

          {/* Open Markets */}
          {!isLoading && (
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-green-400 animate-pulse">●</span>{" "}
                Upcoming Matches
                <span className="text-sm font-normal text-muted-foreground ml-2">({open.length})</span>
              </h2>
              {open.length === 0 ? (
                <div className="glass-card p-8 rounded-2xl text-center text-muted-foreground border border-white/10">
                  <div className="text-3xl mb-2">📋</div>
                  No open markets for {league.name} yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {open.map((m: Market) => <MatchCard key={m.market_id} market={m} />)}
                </div>
              )}
            </section>
          )}

          {/* Resolved Markets */}
          {!isLoading && resolved.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                ✅ Resolved Matches
                <span className="text-sm font-normal text-muted-foreground ml-2">({resolved.length})</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {resolved.map((m: Market) => <MatchCard key={m.market_id} market={m} />)}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
