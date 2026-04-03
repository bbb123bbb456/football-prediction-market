"use client";

import { Navbar } from "@/components/Navbar";
import { LeagueCard } from "@/components/LeagueCard";
import { MatchCard } from "@/components/MatchCard";
import { LeaderboardTable } from "@/components/Leaderboard";
import { LEAGUES, LEAGUE_SLUGS } from "@/lib/constants";
import { useLiveMatches } from "@/lib/hooks/usePredictionMarket";
import type { Market } from "@/lib/types";

function sortByDate(markets: Market[]) {
  return [...markets].sort(
    (a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime()
  );
}

export default function HomePage() {
  const { data: liveMatches = [] } = useLiveMatches();

  // Sort open markets by date — first one is Active, rest are Upcoming
  const sorted = sortByDate(liveMatches);
  const activeMatches = sorted.slice(0, 6);   // nearest 6 are active (bettable)
  const upcomingMatches = sorted.slice(6);      // rest are upcoming (locked)

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-24 pb-16 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Hero */}
          <div className="text-center animate-fade-in">
            <div className="text-6xl mb-4">⚽</div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-accent via-purple-400 to-blue-400 bg-clip-text text-transparent">
              Top 5 Leagues
            </h1>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">
              Prediction Market
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Bet on matches from the Premier League, La Liga, Serie A, Bundesliga, Ligue 1 & Süper Lig.
              Results verified automatically by GenLayer&apos;s AI oracle — no oracles, no trust.
            </p>
          </div>

          {/* League Grid */}
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span>🏆</span> Leagues
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {LEAGUE_SLUGS.map((slug) => (
                <LeagueCard key={slug} league={LEAGUES[slug]} />
              ))}
            </div>
          </section>

          {/* Main content area: Active Matches + Leaderboard */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Active Matches */}
            <section className="lg:col-span-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span className="text-green-400 animate-pulse">●</span> Active Markets
                <span className="text-sm font-normal text-muted-foreground ml-2">bet now!</span>
              </h2>
              {activeMatches.length === 0 ? (
                <div className="glass-card p-8 rounded-2xl text-center text-muted-foreground">
                  <div className="text-4xl mb-3">📋</div>
                  <p className="font-medium">No active markets yet</p>
                  <p className="text-sm mt-1">Markets will appear here when fixtures are created</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeMatches.map((m) => (
                    <MatchCard key={m.market_id} market={m} showLeague />
                  ))}
                </div>
              )}
            </section>

            {/* Leaderboard Sidebar */}
            <section className="lg:col-span-4">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                🏅 Leaderboard
              </h2>
              <div className="glass-card p-5 rounded-2xl border border-white/10">
                <LeaderboardTable />
              </div>
            </section>
          </div>

          {/* Upcoming Markets */}
          {upcomingMatches.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span>📅</span> Upcoming Markets
                <span className="text-sm font-normal text-muted-foreground ml-2">opens after current matches resolve</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingMatches.map((m) => (
                  <MatchCard key={m.market_id} market={m} showLeague locked />
                ))}
              </div>
            </section>
          )}

          {/* How it Works */}
          <section className="glass-card p-8 rounded-2xl border border-white/10 animate-fade-in">
            <h2 className="text-2xl font-bold mb-6">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { step: "1", icon: "🏟️", title: "Browse Leagues", desc: "Explore markets across 6 major European leagues and their top 5 teams." },
                { step: "2", icon: "🎯", title: "Place Your Bet", desc: "Pick Home Win, Draw, or Away Win on any open match market." },
                { step: "3", icon: "🤖", title: "AI Resolution", desc: "After the match, GenLayer's AI oracle fetches the real result from the web and resolves bets trustlessly." },
                { step: "4", icon: "🏆", title: "Earn Points", desc: "Correct predictions earn points. Climb the global leaderboard!" },
              ].map((item) => (
                <div key={item.step} className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center text-lg">
                    {item.icon}
                  </div>
                  <div className="text-accent font-bold">Step {item.step}</div>
                  <div className="font-semibold">{item.title}</div>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-white/10 py-4">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm text-muted-foreground">
            <a href="https://genlayer.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">Powered by GenLayer</a>
            <a href="https://studio.genlayer.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">Studio</a>
            <a href="https://docs.genlayer.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">Docs</a>
            <a href="https://github.com/genlayerlabs/genlayer-project-boilerplate" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
