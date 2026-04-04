"use client";

import { Navbar } from "@/components/Navbar";
import { useUserBets } from "@/lib/hooks/usePredictionMarket";
import { useAccount as useWallet } from "wagmi";
import Link from "next/link";
import type { Bet } from "@/lib/types";
import { PREDICTION_LABELS, type PredictionType } from "@/lib/constants";

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(dateStr)
  );
}

const STATUS_STYLES: Record<string, string> = {
  won: "bg-green-500/20 text-green-400 border-green-500/30",
  lost: "bg-red-500/20 text-red-400 border-red-500/30",
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 animate-pulse",
};
const STATUS_LABELS: Record<string, string> = { won: "✅ Won", lost: "❌ Lost", pending: "⏳ Pending" };

export default function MyBetsPage() {
  const { address } = useWallet();
  const { data: bets = [], isLoading } = useUserBets(address ?? null);

  const won = bets.filter((b: Bet) => b.result === "won").length;
  const lost = bets.filter((b: Bet) => b.result === "lost").length;
  const pending = bets.filter((b: Bet) => b.result === "pending").length;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16 px-4 md:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold">My Bets</h1>
            <p className="text-muted-foreground mt-1">Your prediction history across all leagues</p>
          </div>

          {!address ? (
            <div className="glass-card p-10 rounded-2xl border border-white/15 text-center">
              <div className="text-5xl mb-4">🔗</div>
              <h2 className="text-xl font-bold mb-2">Connect Your Wallet</h2>
              <p className="text-muted-foreground text-sm">Connect MetaMask to see your bets and points</p>
            </div>
          ) : (
            <>
              {/* Stats row */}
              {bets.length > 0 && (
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Total", value: bets.length, color: "text-foreground" },
                    { label: "Won", value: won, color: "text-green-400" },
                    { label: "Lost", value: lost, color: "text-red-400" },
                    { label: "Pending", value: pending, color: "text-yellow-400" },
                  ].map((s) => (
                    <div key={s.label} className="glass-card p-4 rounded-xl border border-white/10 text-center">
                      <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                      <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Loading */}
              {isLoading && (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />
                  ))}
                </div>
              )}

              {/* Bet list */}
              {!isLoading && bets.length === 0 && (
                <div className="glass-card p-10 rounded-2xl border border-white/15 text-center">
                  <div className="text-4xl mb-3">🎫</div>
                  <h2 className="text-xl font-bold mb-2">No Bets Yet</h2>
                  <p className="text-muted-foreground text-sm mb-4">Browse the leagues and place your first bet!</p>
                  <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent/90 transition-colors">
                    Browse Markets
                  </Link>
                </div>
              )}

              {!isLoading && bets.length > 0 && (
                <div className="space-y-3">
                  {bets.map((bet: Bet) => {
                    const m = bet.market;
                    const status = bet.result ?? "pending";
                    return (
                      <Link
                        key={bet.bet_id}
                        href={`/match/${encodeURIComponent(bet.market_id)}`}
                        className="block glass-card rounded-2xl border border-white/10 hover:border-white/20 transition-all hover:bg-white/[0.07] p-5"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            {m && (
                              <div className="font-semibold truncate">
                                {m.home_team} vs {m.away_team}
                              </div>
                            )}
                            <div className="text-sm text-muted-foreground mt-0.5">
                              {m ? formatDate(m.match_date) : bet.market_id}
                              {m && ` · ${m.league_name ?? m.league}`}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-sm font-medium">
                              Predicted: <strong>{PREDICTION_LABELS[bet.prediction as PredictionType]}</strong>
                            </span>
                            {m?.status === "resolved" && m.outcome && (
                              <span className="text-xs text-muted-foreground">
                                Actual: {PREDICTION_LABELS[m.outcome as PredictionType]}
                              </span>
                            )}
                            <span className={`text-xs px-2.5 py-1 rounded-full border ${STATUS_STYLES[status]}`}>
                              {STATUS_LABELS[status]}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
