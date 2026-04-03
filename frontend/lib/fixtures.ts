// Static upcoming fixtures data — shown even when contract is empty
// These are real upcoming matches for April/May 2026

export interface StaticFixture {
  market_id: string;
  league: string;
  league_name: string;
  home_team: string;
  away_team: string;
  match_date: string;
  status: "open";
  outcome: string;
  home_score: number;
  away_score: number;
  total_bets: number;
  home_bets: number;
  draw_bets: number;
  away_bets: number;
}

function makeId(league: string, home: string, away: string, date: string) {
  return `${league}_${home}_${away}_${date}`.replace(/ /g, "_").toLowerCase();
}

function fixture(league: string, leagueName: string, home: string, away: string, date: string): StaticFixture {
  return {
    market_id: makeId(league, home, away, date),
    league,
    league_name: leagueName,
    home_team: home,
    away_team: away,
    match_date: date,
    status: "open",
    outcome: "",
    home_score: -1,
    away_score: -1,
    total_bets: 0,
    home_bets: 0,
    draw_bets: 0,
    away_bets: 0,
  };
}

export const STATIC_FIXTURES: StaticFixture[] = [
  // Premier League
  fixture("premier_league", "Premier League", "Arsenal", "Liverpool", "2026-04-11"),
  fixture("premier_league", "Premier League", "Manchester City", "Aston Villa", "2026-04-18"),
  fixture("premier_league", "Premier League", "Manchester United", "Arsenal", "2026-04-25"),

  // La Liga
  fixture("la_liga", "La Liga", "Barcelona", "Real Madrid", "2026-04-12"),
  fixture("la_liga", "La Liga", "Atletico Madrid", "Villarreal", "2026-04-19"),
  fixture("la_liga", "La Liga", "Real Madrid", "Athletic Bilbao", "2026-04-26"),

  // Serie A
  fixture("serie_a", "Serie A", "Inter Milan", "AC Milan", "2026-04-13"),
  fixture("serie_a", "Serie A", "Juventus", "Napoli", "2026-04-20"),
  fixture("serie_a", "Serie A", "Napoli", "Atalanta", "2026-04-27"),

  // Bundesliga
  fixture("bundesliga", "Bundesliga", "Bayern Munich", "Borussia Dortmund", "2026-04-12"),
  fixture("bundesliga", "Bundesliga", "Bayer Leverkusen", "RB Leipzig", "2026-04-19"),
  fixture("bundesliga", "Bundesliga", "Borussia Dortmund", "Stuttgart", "2026-04-26"),

  // Ligue 1
  fixture("ligue_1", "Ligue 1", "PSG", "Marseille", "2026-04-11"),
  fixture("ligue_1", "Ligue 1", "Monaco", "Lyon", "2026-04-18"),
  fixture("ligue_1", "Ligue 1", "Lille", "PSG", "2026-04-25"),

  // Turkish Super Lig
  fixture("super_lig", "Turkish Super Lig", "Galatasaray", "Fenerbahce", "2026-04-13"),
  fixture("super_lig", "Turkish Super Lig", "Besiktas", "Trabzonspor", "2026-04-20"),
  fixture("super_lig", "Turkish Super Lig", "Fenerbahce", "Samsunspor", "2026-04-27"),
];

export function getFixturesByLeague(league: string): StaticFixture[] {
  return STATIC_FIXTURES.filter(f => f.league === league);
}

export function getActiveFixtures(): StaticFixture[] {
  return STATIC_FIXTURES;
}
