# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import json


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
    market_ids_json: str                         # JSON string array of all market IDs

    # ── Bets ─────────────────────────────────────────────────────────────────
    bets: TreeMap[str, str]                      # bet_key → JSON
    market_bet_keys: TreeMap[str, str]           # market_id → JSON array of bet_keys
    user_bet_keys: TreeMap[str, str]             # user_hex → JSON array of bet_keys

    # ── Points / Leaderboard ─────────────────────────────────────────────────
    points: TreeMap[str, u256]                   # user_hex → total correct predictions
    scored_users_json: str                       # JSON string array of users who have points
    claimable_balances: TreeMap[str, u256]       # user_hex -> claimable GEN tokens (wei)

    # ── Config ───────────────────────────────────────────────────────────────
    market_count: u256

    # =========================================================================
    # Constructor
    # =========================================================================
    def __init__(self) -> None:
        self.market_ids_json = "[]"
        self.scored_users_json = "[]"
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

        if home_team not in teams and away_team not in teams:
            raise gl.vm.UserError(
                f"At least one team must be in the tracked top 5 of {league}. Tracked: {', '.join(teams)}"
            )
        if home_team == away_team:
            raise gl.vm.UserError("Home and away teams must be different")

        market_id = f"{league}_{home_team}_{away_team}_{match_date}".replace(" ", "_").lower()

        if self.markets.get(market_id, "") != "":
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
            "home_pool": 0,
            "draw_pool": 0,
            "away_pool": 0,
            "total_pool": 0,
            "creator": str(gl.message.sender_address),
        })

        self.markets[market_id] = market_data
        
        m_ids = json.loads(self.market_ids_json)
        m_ids.append(market_id)
        self.market_ids_json = json.dumps(m_ids)
        
        self.market_count = u256(int(self.market_count) + 1)

    @gl.public.write
    def place_bet(self, market_id: str, prediction: str, amount_str: str):
        market_raw = self.markets.get(market_id, "")
        if market_raw == "":
            raise gl.vm.UserError(f"Market not found: {market_id}")

        market = json.loads(market_raw)

        if market["status"] != "open":
            raise gl.vm.UserError(f"Market is not open. Current status: {market['status']}")

        if prediction not in ("home", "draw", "away"):
            raise gl.vm.UserError("Prediction must be 'home', 'draw', or 'away'")

        user_hex = str(gl.message.sender_address)
        bet_key = f"{market_id}:{user_hex}"

        if self.bets.get(bet_key, "") != "":
            raise gl.vm.UserError("You already placed a bet on this market")

        bet_amount = int(amount_str)
        if bet_amount <= 0:
            raise gl.vm.UserError("Bet amount must be greater than 0")

        bet_data = json.dumps({
            "bet_id": bet_key,
            "prediction": prediction,
            "user": user_hex,
            "market_id": market_id,
            "amount": bet_amount,
        })
        self.bets[bet_key] = bet_data

        existing_keys = json.loads(self.market_bet_keys.get(market_id, "[]"))
        existing_keys.append(bet_key)
        self.market_bet_keys[market_id] = json.dumps(existing_keys)

        user_keys = json.loads(self.user_bet_keys.get(user_hex, "[]"))
        user_keys.append(bet_key)
        self.user_bet_keys[user_hex] = json.dumps(user_keys)

        # Update market counters & pools
        market["total_bets"] = market["total_bets"] + 1
        market["total_pool"] = market["total_pool"] + bet_amount
        if prediction == "home":
            market["home_bets"] = market["home_bets"] + 1
            market["home_pool"] = market["home_pool"] + bet_amount
        elif prediction == "draw":
            market["draw_bets"] = market["draw_bets"] + 1
            market["draw_pool"] = market["draw_pool"] + bet_amount
        else:
            market["away_bets"] = market["away_bets"] + 1
            market["away_pool"] = market["away_pool"] + bet_amount
            
        self.markets[market_id] = json.dumps(market)

    @gl.public.write
    def resolve_market(self, market_id: str):
        """
        Intelligent Oracle: fetches match result from web, parses with LLM,
        uses Equivalence Principle for consensus, awards points to winners.
        """
        market_raw = self.markets.get(market_id, "")
        if market_raw == "":
            raise gl.vm.UserError(f"Market not found: {market_id}")

        market = json.loads(market_raw)

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

        # Award points and Auto-Payout to correct predictors
        bet_keys_json = self.market_bet_keys.get(market_id, "[]")
        bet_keys = json.loads(bet_keys_json)
        
        total_pool = int(market["total_pool"])
        winning_pool = 0
        if outcome == "home": winning_pool = int(market["home_pool"])
        elif outcome == "draw": winning_pool = int(market["draw_pool"])
        else: winning_pool = int(market["away_pool"])

        for bk in bet_keys:
            bet_raw = self.bets.get(bk, "")
            if bet_raw != "":
                bet = json.loads(bet_raw)
                user = bet["user"]
                
                # If they won
                if bet["prediction"] == outcome:
                    # 1. Update Leaderboard Points
                    current_points = self.points.get(user, u256(0))
                    if current_points == u256(0):
                        s_users = json.loads(self.scored_users_json)
                        if user not in s_users:
                            s_users.append(user)
                            self.scored_users_json = json.dumps(s_users)
                    self.points[user] = current_points + u256(1)
                    
                    # 2. Token Payout
                    if winning_pool > 0 and total_pool > 0:
                        bet_amount = int(bet.get("amount", 0))
                        # Fractional share of the entire pool
                        payout = (bet_amount * total_pool) // winning_pool
                        if payout > 0:
                            current_bal = int(self.claimable_balances.get(user, u256(0)))
                            self.claimable_balances[user] = u256(current_bal + payout)
                
                # If no one won (winning pool is 0), refund everyone who bet
                elif winning_pool == 0 and total_pool > 0:
                    bet_amount = int(bet.get("amount", 0))
                    if bet_amount > 0:
                        current_bal = int(self.claimable_balances.get(user, u256(0)))
                        self.claimable_balances[user] = u256(current_bal + bet_amount)

    @gl.public.write
    def claim_winnings(self):
        user = str(gl.message.sender_address)
        amount_u256 = self.claimable_balances.get(user, u256(0))
        amount = int(amount_u256)
        if amount <= 0:
            raise gl.vm.UserError("No winnings to claim")
        
        self.claimable_balances[user] = u256(0)
        # Note: Native transfer execution deferred until GenLayer Phase 2 transfer interface is stabilized

    # =========================================================================
    # Read Methods (Views)
    # =========================================================================

    @gl.public.view
    def get_market(self, market_id: str) -> str:
        raw = self.markets.get(market_id, "")
        if raw == "":
            return json.dumps({"error": "Market not found"})
        return raw

    @gl.public.view
    def get_all_markets(self) -> str:
        result = []
        m_ids = json.loads(self.market_ids_json)
        for mid in m_ids:
            raw = self.markets.get(mid, "")
            if raw != "":
                result.append(json.loads(raw))
        return json.dumps(result)

    @gl.public.view
    def get_markets_by_league(self, league: str) -> str:
        result = []
        m_ids = json.loads(self.market_ids_json)
        for mid in m_ids:
            raw = self.markets.get(mid, "")
            if raw != "":
                market = json.loads(raw)
                if market["league"] == league:
                    result.append(market)
        return json.dumps(result)

    @gl.public.view
    def get_live_matches(self) -> str:
        result = []
        m_ids = json.loads(self.market_ids_json)
        for mid in m_ids:
            raw = self.markets.get(mid, "")
            if raw != "":
                market = json.loads(raw)
                if market["status"] == "open":
                    result.append(market)
        return json.dumps(result)

    @gl.public.view
    def get_user_bets(self, user_address: str) -> str:
        user_keys_json = self.user_bet_keys.get(user_address, "[]")
        user_keys = json.loads(user_keys_json)
        result = []
        for bk in user_keys:
            bet_raw = self.bets.get(bk, "")
            if bet_raw != "":
                bet = json.loads(bet_raw)
                market_raw = self.markets.get(bet["market_id"], "")
                if market_raw != "":
                    market = json.loads(market_raw)
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
        s_users = json.loads(self.scored_users_json)
        for user in s_users:
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
