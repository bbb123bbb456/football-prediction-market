// Leagues, teams, and slug utilities for the Top 5 Leagues Prediction Market

export type LeagueSlug =
  | "premier_league"
  | "la_liga"
  | "serie_a"
  | "bundesliga"
  | "ligue_1"
  | "super_lig";

export interface LeagueInfo {
  slug: LeagueSlug;
  name: string;
  emoji: string;
  country: string;
  teams: string[];
  accentColor: string;
  bgGradient: string;
}

export const LEAGUES: Record<LeagueSlug, LeagueInfo> = {
  premier_league: {
    slug: "premier_league",
    name: "Premier League",
    emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    country: "England",
    teams: ["Arsenal", "Manchester City", "Manchester United", "Aston Villa", "Liverpool"],
    accentColor: "#38003c",
    bgGradient: "from-[#38003c] to-[#00a551]",
  },
  la_liga: {
    slug: "la_liga",
    name: "La Liga",
    emoji: "🇪🇸",
    country: "Spain",
    teams: ["Barcelona", "Real Madrid", "Atletico Madrid", "Athletic Bilbao", "Villarreal"],
    accentColor: "#ee8707",
    bgGradient: "from-[#ee8707] to-[#c8102e]",
  },
  serie_a: {
    slug: "serie_a",
    name: "Serie A",
    emoji: "🇮🇹",
    country: "Italy",
    teams: ["Inter Milan", "Napoli", "AC Milan", "Juventus", "Atalanta"],
    accentColor: "#024494",
    bgGradient: "from-[#024494] to-[#009246]",
  },
  bundesliga: {
    slug: "bundesliga",
    name: "Bundesliga",
    emoji: "🇩🇪",
    country: "Germany",
    teams: ["Bayern Munich", "Bayer Leverkusen", "Borussia Dortmund", "RB Leipzig", "Stuttgart"],
    accentColor: "#d3010c",
    bgGradient: "from-[#d3010c] to-[#ffcb00]",
  },
  ligue_1: {
    slug: "ligue_1",
    name: "Ligue 1",
    emoji: "🇫🇷",
    country: "France",
    teams: ["PSG", "Monaco", "Marseille", "Lille", "Lyon"],
    accentColor: "#003f8a",
    bgGradient: "from-[#003f8a] to-[#ee2436]",
  },
  super_lig: {
    slug: "super_lig",
    name: "Turkish Super Lig",
    emoji: "🇹🇷",
    country: "Turkey",
    teams: ["Galatasaray", "Fenerbahce", "Besiktas", "Samsunspor", "Trabzonspor"],
    accentColor: "#e30a17",
    bgGradient: "from-[#e30a17] to-[#003087]",
  },
};

export const LEAGUE_SLUGS = Object.keys(LEAGUES) as LeagueSlug[];

export function getLeagueBySlug(slug: string): LeagueInfo | null {
  return LEAGUES[slug as LeagueSlug] ?? null;
}

export function isValidLeagueSlug(slug: string): slug is LeagueSlug {
  return slug in LEAGUES;
}

export const VALID_PREDICTIONS = ["home", "draw", "away"] as const;
export type PredictionType = (typeof VALID_PREDICTIONS)[number];

export const PREDICTION_LABELS: Record<PredictionType, string> = {
  home: "Home Win",
  draw: "Draw",
  away: "Away Win",
};
