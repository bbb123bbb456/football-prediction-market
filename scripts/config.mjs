// Shared config for automation scripts
// Environment variables needed:
//   FOOTBALL_API_KEY  — from https://www.football-data.org/client/register (free)
//   GENLAYER_PRIVATE_KEY — GenLayer account private key (for signing transactions)
//   CONTRACT_ADDRESS — deployed contract on Bradbury

export const RPC_URL = "https://rpc-bradbury.genlayer.com";
export const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x1Ef6B4b71352c8803a69f2B5981543505967F593";
export const FOOTBALL_API_KEY = process.env.FOOTBALL_API_KEY || "";
export const PRIVATE_KEY = process.env.GENLAYER_PRIVATE_KEY || "";

// football-data.org competition codes (free tier)
export const LEAGUE_CODES = {
  premier_league: "PL",
  la_liga: "PD",
  serie_a: "SA",
  bundesliga: "BL1",
  ligue_1: "FL1",
};

// Map football-data.org team names → our contract team names
export const TEAM_MAP = {
  // Premier League
  "Arsenal FC": "Arsenal",
  "Manchester City FC": "Manchester City",
  "Manchester United FC": "Manchester United",
  "Aston Villa FC": "Aston Villa",
  "Liverpool FC": "Liverpool",
  // La Liga
  "FC Barcelona": "Barcelona",
  "Real Madrid CF": "Real Madrid",
  "Club Atlético de Madrid": "Atletico Madrid",
  "Athletic Club": "Athletic Bilbao",
  "Villarreal CF": "Villarreal",
  // Serie A
  "FC Internazionale Milano": "Inter Milan",
  "SSC Napoli": "Napoli",
  "AC Milan": "AC Milan",
  "Juventus FC": "Juventus",
  "Atalanta BC": "Atalanta",
  // Bundesliga
  "FC Bayern München": "Bayern Munich",
  "Bayer 04 Leverkusen": "Bayer Leverkusen",
  "Borussia Dortmund": "Borussia Dortmund",
  "RasenBallsport Leipzig": "RB Leipzig",
  "VfB Stuttgart": "Stuttgart",
  // Ligue 1
  "Paris Saint-Germain FC": "PSG",
  "AS Monaco FC": "Monaco",
  "Olympique de Marseille": "Marseille",
  "LOSC Lille": "Lille",
  "Olympique Lyonnais": "Lyon",
};

// Turkish Super Lig teams (not in football-data.org free tier)
export const SUPER_LIG_TEAMS = ["Galatasaray", "Fenerbahce", "Besiktas", "Samsunspor", "Trabzonspor"];

// Our contract's top 5 teams per league (for filtering)
export const CONTRACT_TEAMS = {
  premier_league: ["Arsenal", "Manchester City", "Manchester United", "Aston Villa", "Liverpool"],
  la_liga: ["Barcelona", "Real Madrid", "Atletico Madrid", "Athletic Bilbao", "Villarreal"],
  serie_a: ["Inter Milan", "Napoli", "AC Milan", "Juventus", "Atalanta"],
  bundesliga: ["Bayern Munich", "Bayer Leverkusen", "Borussia Dortmund", "RB Leipzig", "Stuttgart"],
  ligue_1: ["PSG", "Monaco", "Marseille", "Lille", "Lyon"],
  super_lig: ["Galatasaray", "Fenerbahce", "Besiktas", "Samsunspor", "Trabzonspor"],
};

export function mapTeamName(apiName) {
  return TEAM_MAP[apiName] || apiName;
}

export function isOurTeam(teamName) {
  const mapped = mapTeamName(teamName);
  for (const teams of Object.values(CONTRACT_TEAMS)) {
    if (teams.includes(mapped)) return true;
  }
  return false;
}

export function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}
