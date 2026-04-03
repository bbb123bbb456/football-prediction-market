// TypeScript interfaces for the Prediction Market contract

import type { PredictionType } from "./constants";

export interface Market {
  market_id: string;
  league: string;
  league_name: string;
  home_team: string;
  away_team: string;
  match_date: string;
  status: "open" | "resolved";
  home_score: number | null;
  away_score: number | null;
  outcome: PredictionType | null;
  total_bets: number;
  home_bets: number;
  draw_bets: number;
  away_bets: number;
  creator: string;
}

export interface Bet {
  bet_id: string;
  market_id: string;
  user: string;
  prediction: PredictionType;
  result?: "won" | "lost" | "pending";
  market?: Market;
}

export interface LeaderboardEntry {
  rank: number;
  user: string;
  points: number;
  total_bets: number;
}
