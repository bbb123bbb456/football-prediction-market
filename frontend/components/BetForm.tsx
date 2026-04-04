"use client";

import { useState } from "react";
import { usePlaceBet } from "@/lib/hooks/usePredictionMarket";
import { useBalance } from "@/lib/hooks/useBalance";
import type { Market } from "@/lib/types";
import type { PredictionType } from "@/lib/constants";
import { PREDICTION_LABELS } from "@/lib/constants";

interface BetFormProps {
  market: Market;
}

const OPTIONS: { value: PredictionType; label: string; color: string; icon: string }[] = [
  { value: "home", label: PREDICTION_LABELS.home, color: "blue", icon: "🔵" },
  { value: "draw", label: PREDICTION_LABELS.draw, color: "yellow", icon: "🟡" },
  { value: "away", label: PREDICTION_LABELS.away, color: "red", icon: "🔴" },
];

export function BetForm({ market }: BetFormProps) {
  const [selected, setSelected] = useState<PredictionType | null>(null);
  const [amount, setAmount] = useState<string>("");
  const { placeBet, isPlacing } = usePlaceBet();
  const { data: balance, isLoading: isBalanceLoading } = useBalance();

  const numAmount = parseFloat(amount);
  const numBalance = parseFloat(balance || "0");
  const isInvalidAmount = isNaN(numAmount) || numAmount <= 0;
  const isInsufficientFunds = !isInvalidAmount && numAmount > numBalance;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || isInvalidAmount || isInsufficientFunds) return;
    placeBet({ marketId: market.market_id, prediction: selected, amount });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {OPTIONS.map((opt) => {
          const isActive = selected === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelected(opt.value)}
              className={`relative p-4 rounded-xl border transition-all duration-200 text-center
                ${
                  isActive
                    ? opt.color === "blue"
                      ? "border-blue-500 bg-blue-500/20 shadow-[0_0_24px_rgba(59,130,246,0.3)]"
                      : opt.color === "yellow"
                      ? "border-yellow-500 bg-yellow-500/20 shadow-[0_0_24px_rgba(234,179,8,0.3)]"
                      : "border-red-500 bg-red-500/20 shadow-[0_0_24px_rgba(239,68,68,0.3)]"
                    : "border-white/10 hover:border-white/30 bg-white/5"
                }
              `}
            >
              {isActive && (
                <div className="absolute top-2 right-2 w-4 h-4 bg-accent rounded-full flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              <div className="text-2xl mb-1">{opt.icon}</div>
              <div className={`text-sm font-semibold ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                {opt.label}
              </div>
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Wager Amount (GEN)</span>
          <span className="text-muted-foreground flex gap-2">
            Wallet Balance: {isBalanceLoading ? "..." : (balance ? Number(balance).toFixed(2) : "0")} GEN
            {balance && (
              <button 
                type="button" 
                onClick={() => setAmount(balance)}
                className="text-accent hover:text-accent-foreground font-semibold"
              >
                Max
              </button>
            )}
          </span>
        </div>
        <input
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={`w-full bg-white/5 border rounded-xl p-3 text-lg focus:outline-none focus:ring-2 focus:ring-accent transition-all ${
            isInsufficientFunds ? "border-red-500 focus:ring-red-500" : "border-white/10"
          }`}
          disabled={isPlacing}
        />
        {isInsufficientFunds && (
          <p className="text-red-500 text-sm mt-1">Insufficient GEN token balance.</p>
        )}
      </div>

      <button
        type="submit"
        disabled={!selected || isInvalidAmount || isInsufficientFunds || isPlacing}
        className="w-full py-3 px-6 rounded-xl font-bold text-sm transition-all duration-200
          bg-accent text-white hover:bg-accent/90 hover:shadow-[0_0_32px_rgba(155,106,246,0.4)]
          disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none
          flex items-center justify-center gap-2"
      >
        {isPlacing ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Submitting to blockchain…
          </>
        ) : (
          `Place Bet ${selected ? `— ${PREDICTION_LABELS[selected]}` : ""}`
        )}
      </button>
    </form>
  );
}
