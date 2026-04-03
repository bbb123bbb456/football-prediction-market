"use client";

import { Navbar } from "@/components/Navbar";
import { LeaderboardTable } from "@/components/Leaderboard";

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16 px-4 md:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center animate-fade-in">
            <div className="text-5xl mb-3">🏆</div>
            <h1 className="text-3xl md:text-4xl font-bold">Global Leaderboard</h1>
            <p className="text-muted-foreground mt-2">
              Ranked by total correct predictions across all leagues
            </p>
          </div>

          <div className="glass-card rounded-2xl border border-white/15 p-6 animate-slide-up">
            <LeaderboardTable />
          </div>

          <div className="glass-card rounded-2xl border border-white/10 p-5 text-sm text-muted-foreground">
            <h3 className="font-semibold text-foreground mb-2">How points work</h3>
            <ul className="space-y-1 list-disc list-inside">
              <li>Each correct match prediction earns <strong className="text-accent">1 point</strong></li>
              <li>Predictions are locked when you place your bet</li>
              <li>Points are awarded automatically when a market is resolved</li>
              <li>Resolution uses GenLayer's AI oracle — no human intervention</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
