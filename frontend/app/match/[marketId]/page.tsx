"use client";

import { use } from "react";
import { Navbar } from "@/components/Navbar";
import { BetForm } from "@/components/BetForm";
import { OddsChart } from "@/components/OddsChart";
import Link from "next/link";
import { useMarket, useResolveMarket } from "@/lib/hooks/usePredictionMarket";
import { getLeagueBySlug } from "@/lib/constants";
import { useAccount as useWallet } from "wagmi";

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(
    new Date(dateStr)
  );
}

export default function MatchDetailPage({ params }: { params: Promise<{ marketId: string }> }) {
  const { marketId } = use(params);
  const decodedId = decodeURIComponent(marketId);
  const { data: market, isLoading } = useMarket(decodedId);
  const { resolveMarket, isResolving, resolvingMarketId } = useResolveMarket();
  const { address } = useWallet();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow pt-24 px-4 max-w-4xl mx-auto w-full">
          <div className="space-y-4 mt-8">
            <div className="h-12 bg-white/5 animate-pulse rounded-xl" />
            <div className="h-64 bg-white/5 animate-pulse rounded-2xl" />
            <div className="h-48 bg-white/5 animate-pulse rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow pt-24 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-3">❌</div>
            <p className="text-muted-foreground">Market not found</p>
            <Link href="/" className="text-accent hover:underline mt-2 block">← Return Home</Link>
          </div>
        </div>
      </div>
    );
  }

  const league = getLeagueBySlug(market.league);
  const isResolvable = market.status === "open" && new Date(market.match_date) < new Date();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-24 pb-16 px-4 md:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground animate-fade-in">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            {league && (
              <>
                <Link href={`/league/${market.league}`} className="hover:text-foreground transition-colors">
                  {league.emoji} {league.name}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-foreground truncate">{market.home_team} vs {market.away_team}</span>
          </div>

          {/* Match header */}
          <div className={`glass-card rounded-2xl border border-white/15 overflow-hidden animate-fade-in`}>
            {league && <div className={`h-1.5 bg-gradient-to-r ${league.bgGradient}`} />}
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                {league && (
                  <span className="text-sm text-muted-foreground">{league.emoji} {league.name}</span>
                )}
                <div className="flex items-center gap-2">
                  {market.status === "open" ? (
                    <span className="text-xs px-2.5 py-1 bg-green-500/20 text-green-400 rounded-full border border-green-500/30 animate-pulse">
                      ● OPEN
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-1 bg-white/10 text-muted-foreground rounded-full border border-white/15">
                      ✅ RESOLVED
                    </span>
                  )}
                </div>
              </div>

              {/* Teams + Score */}
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex-1 text-center">
                  <div className="text-2xl md:text-3xl font-black">{market.home_team}</div>
                  <div className="text-sm text-muted-foreground mt-1">Home</div>
                </div>
                <div className="text-center shrink-0">
                  {market.status === "resolved" ? (
                    <div className="text-4xl md:text-5xl font-black tracking-tighter">
                      {market.home_score} <span className="text-muted-foreground">–</span> {market.away_score}
                    </div>
                  ) : (
                    <div className="text-3xl font-bold text-muted-foreground">VS</div>
                  )}
                  <div className="text-xs text-muted-foreground mt-2">{formatDate(market.match_date)}</div>
                </div>
                <div className="flex-1 text-center">
                  <div className="text-2xl md:text-3xl font-black">{market.away_team}</div>
                  <div className="text-sm text-muted-foreground mt-1">Away</div>
                </div>
              </div>

              {/* Winner badge */}
              {market.status === "resolved" && market.outcome && (
                <div className="text-center mt-4">
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-accent/20 text-accent rounded-full border border-accent/30 font-bold">
                    🏆{" "}
                    {market.outcome === "home"
                      ? `${market.home_team} wins!`
                      : market.outcome === "away"
                      ? `${market.away_team} wins!`
                      : "It's a Draw!"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Two-column: Chart + Action */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Odds chart */}
            <div className="glass-card rounded-2xl border border-white/15 p-6 animate-slide-up">
              <h3 className="text-lg font-bold mb-4">Bet Distribution</h3>
              <OddsChart market={market} size="lg" />
            </div>

            {/* Bet form or resolve */}
            <div className="glass-card rounded-2xl border border-white/15 p-6 animate-slide-up" style={{ animationDelay: "100ms" }}>
              {market.status === "open" ? (
                <>
                  <h3 className="text-lg font-bold mb-4">Place Your Bet</h3>
                  {!address ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <div className="text-3xl mb-2">🔗</div>
                      <p>Connect your wallet to place a bet</p>
                    </div>
                  ) : (
                    <BetForm market={market} />
                  )}

                  {/* Resolve button if match date passed */}
                  {isResolvable && address && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-xs text-muted-foreground mb-2">Match date has passed. You can resolve this market:</p>
                      <button
                        onClick={() => resolveMarket(market.market_id)}
                        disabled={isResolving && resolvingMarketId === market.market_id}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold border border-accent/40 text-accent hover:bg-accent/10 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                      >
                        {isResolving && resolvingMarketId === market.market_id ? (
                          <>
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                            AI is fetching result…
                          </>
                        ) : (
                          "🤖 Resolve with AI Oracle"
                        )}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <h3 className="text-lg font-bold mb-4">Result</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Final Score</span>
                      <span className="font-bold">{market.home_score} – {market.away_score}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Winner</span>
                      <span className="font-bold">
                        {market.outcome === "home" ? market.home_team : market.outcome === "away" ? market.away_team : "Draw"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Bets</span>
                      <span className="font-bold">{market.total_bets}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
