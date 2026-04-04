"use client";

import { useState } from "react";
import { useCreateMarket } from "@/lib/hooks/usePredictionMarket";
import { LEAGUES, LEAGUE_SLUGS, type LeagueSlug } from "@/lib/constants";
import { useAccount as useWallet } from "wagmi";

export function CreateMarketModal() {
  const [open, setOpen] = useState(false);
  const [league, setLeague] = useState<LeagueSlug>("premier_league");
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const { createMarket, isCreating } = useCreateMarket();
  const { address } = useWallet();

  const teams = LEAGUES[league].teams;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeTeam || !awayTeam || !matchDate || homeTeam === awayTeam) return;
    await createMarket(
      { league, homeTeam, awayTeam, matchDate },
      { onSuccess: () => { setOpen(false); resetForm(); } }
    );
  };

  const resetForm = () => {
    setHomeTeam("");
    setAwayTeam("");
    setMatchDate("");
  };

  // Today as min date input
  const today = new Date().toISOString().split("T")[0];

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        disabled={!address}
        title={!address ? "Connect wallet to create a market" : "Create a new prediction market"}
        className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm
          bg-accent text-white hover:bg-accent/90 transition-all duration-200
          hover:shadow-[0_0_24px_rgba(155,106,246,0.4)]
          disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span className="hidden sm:inline">Create Market</span>
        <span className="sm:hidden">+</span>
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-lg pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="glass-card rounded-2xl border border-white/20 p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">Create Prediction Market</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Set up a new match market for betting</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* League */}
              <div>
                <label className="block text-sm font-medium mb-1.5">League</label>
                <select
                  value={league}
                  onChange={(e) => { setLeague(e.target.value as LeagueSlug); setHomeTeam(""); setAwayTeam(""); }}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm focus:outline-none focus:border-accent/60 transition-colors"
                >
                  {LEAGUE_SLUGS.map((s) => (
                    <option key={s} value={s} className="bg-[#1a1a2e]">
                      {LEAGUES[s].emoji} {LEAGUES[s].name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Teams */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Home Team</label>
                  <select
                    value={homeTeam}
                    onChange={(e) => setHomeTeam(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm focus:outline-none focus:border-accent/60 transition-colors"
                  >
                    <option value="" className="bg-[#1a1a2e]">Select team…</option>
                    {teams.filter((t) => t !== awayTeam).map((t) => (
                      <option key={t} value={t} className="bg-[#1a1a2e]">{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Away Team</label>
                  <select
                    value={awayTeam}
                    onChange={(e) => setAwayTeam(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm focus:outline-none focus:border-accent/60 transition-colors"
                  >
                    <option value="" className="bg-[#1a1a2e]">Select team…</option>
                    {teams.filter((t) => t !== homeTeam).map((t) => (
                      <option key={t} value={t} className="bg-[#1a1a2e]">{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Match Date */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Match Date</label>
                <input
                  type="date"
                  value={matchDate}
                  min={today}
                  onChange={(e) => setMatchDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-sm focus:outline-none focus:border-accent/60 transition-colors"
                />
              </div>

              {/* Warning */}
              <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 px-4 py-3 text-xs text-yellow-400">
                ⚠️ Only top-5 teams per league are supported. The match result will be resolved automatically by GenLayer's AI oracle after the match.
              </div>

              <button
                type="submit"
                disabled={!homeTeam || !awayTeam || !matchDate || homeTeam === awayTeam || isCreating}
                className="w-full py-3 rounded-xl font-bold text-sm bg-accent text-white
                  hover:bg-accent/90 hover:shadow-[0_0_24px_rgba(155,106,246,0.4)] transition-all duration-200
                  disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating on blockchain…
                  </>
                ) : (
                  "Create Market"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
