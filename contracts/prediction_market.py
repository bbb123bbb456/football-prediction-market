# { "Depends": "py-genlayer:latest" }

import json
import genlayer.gl as gl
from genlayer import Address, TreeMap, DynArray, u256


# ---------------------------------------------------------------------------
# League & Team Constants
# ---------------------------------------------------------------------------
LEAGUES = {
    "premier_league": {
        "name": "Premier League",
        "teams": ["Arsenal", "Manchester City", "Manchester United", "Aston Villa", "Liverpool"],
    },
    "la_liga": {
        "name": "La Liga",
        "teams": ["Barcelona", "Real Madrid", "Atletico Madrid", "Athletic Bilbao", "Villarreal"],
    },
    "serie_a": {
        "name": "Serie A",
        "teams": ["Inter Milan", "Napoli", "AC Milan", "Juventus", "Atalanta"],
    },
    "bundesliga": {
        "name": "Bundesliga",
        "teams": ["Bayern Munich", "Bayer Leverkusen", "Borussia Dortmund", "RB Leipzig", "Stuttgart"],
    },
    "ligue_1": {
        "name": "Ligue 1",
        "teams": ["PSG", "Monaco", "Marseille", "Lille", "Lyon"],
    },
    "super_lig": {
        "name": "Turkish Super Lig",
        "teams": ["Galatasaray", "Fenerbahce", "Besiktas", "Samsunspor", "Trabzonspor"],
    },
}


class PredictionMarket(gl.Contract):
    # ── Markets ──────────────────────────────────────────────────────────────
    markets: TreeMap[str, str]                   # market_id → JSON
    market_ids: DynArray[str]                    # ordered list of all market IDs

    # ── Bets ─────────────────────────────────────────────────────────────────
    bets: TreeMap[str, str]                      # bet_key → JSON
    market_bet_keys: TreeMap[str, str]            # market_id → JSON array of bet_keys
    user_bet_keys: TreeMap[str, str]              # user_hex → JSON array of bet_keys

    # ── Points / Leaderboard ─────────────────────────────────────────────────
    points: TreeMap[str, u256]                    # user_hex → total correct predictions
    scored_users: DynArray[str]                    # tracks users who have points

    # ── Config ───────────────────────────────────────────────────────────────
    market_count: u256

    # =========================================================================
    # Constructor
    # =========================================================================
    def __init__(self):
        self.market_count = u256(0)

    # =========================================================================
    # Write Methods
    # =========================================================================

    @gl.public.write
    def create_market(
        self,
        league: str,
        home_team: str,
        away_team: str,
        match_date: str,
    ):
        if league not in LEAGUES:
            raise gl.vm.UserError(
                f"Unsupported league: {league}. Must be one of: {', '.join(LEAGUES.keys())}"
            )

        teams = LEAGUES[league]["teams"]

        if home_team not in teams:
            raise gl.vm.UserError(
                f"{home_team} is not in the top 5 of {league}. Valid teams: {', '.join(teams)}"
            )
        if away_team not in teams:
            raise gl.vm.UserError(
                f"{away_team} is not in the top 5 of {league}. Valid teams: {', '.join(teams)}"
            )
        if home_team == away_team:
            raise gl.vm.UserError("Home and away teams must be different")

        market_id = f"{league}_{home_team}_{away_team}_{match_date}".replace(" ", "_").lower()

        if market_id in self.markets:
            raise gl.vm.UserError(f"Market already exists: {market_id}")

        market_data = json.dumps({
            "market_id": market_id,
            "league": league,
            "league_name": LEAGUES[league]["name"],
            "home_team": home_team,
            "away_team": away_team,
            "match_date": match_date,
            "status": "open",
            "outcome": "",
            "home_score": -1,
            "away_score": -1,
            "total_bets": 0,
            "home_bets": 0,
            "draw_bets": 0,
            "away_bets": 0,
            "creator": str(gl.message.sender_address),
        })

        self.markets[market_id] = market_data
        self.market_ids.append(market_id)
        self.market_count = self.market_count + u256(1)

    @gl.public.write
    def place_bet(self, market_id: str, prediction: str):
        if market_id not in self.markets:
            raise gl.vm.UserError(f"Market not found: {market_id}")

        market = json.loads(self.markets[market_id])

        if market["status"] != "open":
            raise gl.vm.UserError(f"Market is not open. Current status: {market['status']}")

        if prediction not in ("home", "draw", "away"):
            raise gl.vm.UserError("Prediction must be 'home', 'draw', or 'away'")

        user_hex = str(gl.message.sender_address)
        bet_key = f"{market_id}:{user_hex}"

        if bet_key in self.bets:
            raise gl.vm.UserError("You already placed a bet on this market")

        bet_data = json.dumps({
            "bet_id": bet_key,
            "prediction": prediction,
            "user": user_hex,
            "market_id": market_id,
        })
        self.bets[bet_key] = bet_data

        existing_keys = json.loads(self.market_bet_keys.get(market_id, "[]"))
        existing_keys.append(bet_key)
        self.market_bet_keys[market_id] = json.dumps(existing_keys)

        user_keys = json.loads(self.user_bet_keys.get(user_hex, "[]"))
        user_keys.append(bet_key)
        self.user_bet_keys[user_hex] = json.dumps(user_keys)

        # Update market counters
        market["total_bets"] = market["total_bets"] + 1
        if prediction == "home":
            market["home_bets"] = market["home_bets"] + 1
        elif prediction == "draw":
            market["draw_bets"] = market["draw_bets"] + 1
        else:
            market["away_bets"] = market["away_bets"] + 1
        self.markets[market_id] = json.dumps(market)

    @gl.public.write
    def resolve_market(self, market_id: str):
        """
        Intelligent Oracle: fetches match result from web, parses with LLM,
        uses Equivalence Principle for consensus, awards points to winners.
        """
        if market_id not in self.markets:
            raise gl.vm.UserError(f"Market not found: {market_id}")

        market = json.loads(self.markets[market_id])

        if market["status"] != "open":
            raise gl.vm.UserError("Market is already resolved")

        home_team = market["home_team"]
        away_team = market["away_team"]
        match_date = market["match_date"]

        # --- Fetch match result, extract score, validate via consensus ---
        search_query = f"{home_team} vs {away_team} {match_date} final score result"
        search_url = f"https://www.google.com/search?q={search_query.replace(' ', '+')}"

        def fetch_data():
            return gl.nondet.web.render(search_url, mode='text')[:8000]

        task_prompt = (
            f"From the provided web content, extract the final score of the football match "
            f"between {home_team} and {away_team} played on {match_date}.\n\n"
            f"Respond ONLY with a JSON object in this exact format, nothing else:\n"
            f'{{"home_score": <integer>, "away_score": <integer>, "status": "finished"}}\n\n'
            f"If the match has not been played yet, or the result is not found, respond:\n"
            f'{{"status": "not_found"}}\n\n'
            f"Rules:\n"
            f"- home_score and away_score must be non-negative integers\n"
            f"- Only extract results from completed, FINAL matches"
        )

        criteria_prompt = (
            f"Does this JSON contain a valid football match score? "
            f"It must have 'home_score' and 'away_score' as non-negative integers. "
            f"Accept if valid JSON with scores. Reject otherwise."
        )

        result_str = gl.eq_principle.prompt_non_comparative(
            fetch_data,
            task=task_prompt,
            criteria=criteria_prompt,
        )

        # --- Parse the validated result ---
        # Strip potential markdown code fences
        clean = result_str.strip()
        if clean.startswith("```"):
            lines = clean.split("\n")
            lines = [l for l in lines if not l.strip().startswith("```")]
            clean = "\n".join(lines).strip()

        result = json.loads(clean)

        if result.get("status") != "finished":
            raise gl.vm.UserError("Match result not available yet. Try again later.")

        home_score = int(result["home_score"])
        away_score = int(result["away_score"])

        if home_score > away_score:
            outcome = "home"
        elif away_score > home_score:
            outcome = "away"
        else:
            outcome = "draw"

        # Update market
        market["status"] = "resolved"
        market["outcome"] = outcome
        market["home_score"] = home_score
        market["away_score"] = away_score
        self.markets[market_id] = json.dumps(market)

        # Award points to correct predictors
        bet_keys_json = self.market_bet_keys.get(market_id, "[]")
        bet_keys = json.loads(bet_keys_json)


        for bk in bet_keys:
            if bk in self.bets:
                bet = json.loads(self.bets[bk])
                if bet["prediction"] == outcome:
                    user = bet["user"]
                    current_points = self.points.get(user, u256(0))
                    if current_points == u256(0):
                        self.scored_users.append(user)
                    self.points[user] = current_points + u256(1)

    # =========================================================================
    # Read Methods (Views)
    # =========================================================================

    @gl.public.view
    def get_market(self, market_id: str) -> str:
        if market_id not in self.markets:
            return json.dumps({"error": "Market not found"})
        return self.markets[market_id]

    @gl.public.view
    def get_all_markets(self) -> str:
        result = []
        for mid in self.market_ids:
            result.append(json.loads(self.markets[mid]))
        return json.dumps(result)

    @gl.public.view
    def get_markets_by_league(self, league: str) -> str:
        result = []
        for mid in self.market_ids:
            market = json.loads(self.markets[mid])
            if market["league"] == league:
                result.append(market)
        return json.dumps(result)

    @gl.public.view
    def get_live_matches(self) -> str:
        result = []
        for mid in self.market_ids:
            market = json.loads(self.markets[mid])
            if market["status"] == "open":
                result.append(market)
        return json.dumps(result)

    @gl.public.view
    def get_user_bets(self, user_address: str) -> str:
        user_keys_json = self.user_bet_keys.get(user_address, "[]")
        user_keys = json.loads(user_keys_json)
        result = []
        for bk in user_keys:
            if bk in self.bets:
                bet = json.loads(self.bets[bk])
                if bet["market_id"] in self.markets:
                    market = json.loads(self.markets[bet["market_id"]])
                    bet["market"] = market
                    if market["status"] == "resolved":
                        bet["result"] = "won" if bet["prediction"] == market["outcome"] else "lost"
                    else:
                        bet["result"] = "pending"
                result.append(bet)
        return json.dumps(result)

    @gl.public.view
    def get_leaderboard(self) -> str:
        entries = []
        for user in self.scored_users:
            pts = self.points.get(user, u256(0))
            total_bets = len(json.loads(self.user_bet_keys.get(user, "[]")))
            entries.append({
                "user": user,
                "points": int(pts),
                "total_bets": total_bets,
            })
        entries.sort(key=lambda e: e["points"], reverse=True)
        for i, e in enumerate(entries):
            e["rank"] = i + 1
        return json.dumps(entries)

    @gl.public.view
    def get_user_points(self, user: str) -> int:
        return int(self.points.get(user, u256(0)))

    @gl.public.view
    def get_leagues(self) -> str:
        return json.dumps(LEAGUES)

    @gl.public.view
    def get_market_count(self) -> int:
        return int(self.market_count)
