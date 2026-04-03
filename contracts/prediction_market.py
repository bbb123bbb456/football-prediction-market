import json
import genlayer.gl as gl
from genlayer import Address, TreeMap, DynArray, u256


# Desteklenen ligler ve takımları
LEAGUES = {
    "premier_league": ["Arsenal", "Manchester City", "Manchester United", "Aston Villa", "Liverpool"],
    "la_liga": ["Barcelona", "Real Madrid", "Atletico Madrid", "Athletic Bilbao", "Villarreal"],
    "serie_a": ["Inter Milan", "Napoli", "AC Milan", "Juventus", "Atalanta"],
    "bundesliga": ["Bayern Munich", "Bayer Leverkusen", "Borussia Dortmund", "RB Leipzig", "Stuttgart"],
    "ligue_1": ["PSG", "Monaco", "Marseille", "Lille", "Lyon"],
}


class PredictionMarket(gl.Contract):
    # --- STATE ---
    markets: TreeMap[str, str]              # market_id → JSON {league, home, away, date, status, outcome, home_score, away_score}
    market_ids: DynArray[str]               # tüm market ID'leri sıralı

    bets: TreeMap[str, str]                 # bet_key (market_id:user_hex) → JSON {prediction, user}
    market_bet_keys: TreeMap[str, str]      # market_id → JSON array of bet_keys
    user_bet_keys: TreeMap[str, str]        # user_hex → JSON array of bet_keys

    points: TreeMap[str, u256]              # user_hex → toplam doğru tahmin puanı

    market_count: u256

    def __init__(self):
        self.market_count = u256(0)

    # ========== WRITE METHODS ==========

    @gl.public.write
    def create_market(
        self,
        league: str,
        home_team: str,
        away_team: str,
        match_date: str,       # "YYYY-MM-DD" format
    ):
        # Lig kontrolü
        if league not in LEAGUES:
            raise gl.vm.UserError(
                f"Unsupported league: {league}. Must be one of: {', '.join(LEAGUES.keys())}"
            )

        teams = LEAGUES[league]

        # Takım kontrolü
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

        # Market ID oluştur
        market_id = f"{league}_{home_team}_{away_team}_{match_date}".replace(" ", "_").lower()

        # Zaten var mı kontrol et
        if market_id in self.markets:
            raise gl.vm.UserError(f"Market already exists: {market_id}")

        # Market verisini kaydet
        market_data = json.dumps({
            "league": league,
            "home_team": home_team,
            "away_team": away_team,
            "match_date": match_date,
            "status": "open",
            "outcome": "",
            "home_score": -1,
            "away_score": -1,
            "creator": str(gl.message.sender_address),
        })

        self.markets[market_id] = market_data
        self.market_ids.append(market_id)
        self.market_count = self.market_count + u256(1)

    @gl.public.write
    def place_bet(self, market_id: str, prediction: str):
        # Market var mı?
        if market_id not in self.markets:
            raise gl.vm.UserError(f"Market not found: {market_id}")

        market = json.loads(self.markets[market_id])

        # Market açık mı?
        if market["status"] != "open":
            raise gl.vm.UserError(f"Market is not open. Current status: {market['status']}")

        # Geçerli tahmin mi?
        if prediction not in ("home", "draw", "away"):
            raise gl.vm.UserError("Prediction must be 'home', 'draw', or 'away'")

        user_hex = str(gl.message.sender_address)
        bet_key = f"{market_id}:{user_hex}"

        # Kullanıcı zaten bahis yapmış mı?
        if bet_key in self.bets:
            raise gl.vm.UserError("You already placed a bet on this market")

        # Bahsi kaydet
        bet_data = json.dumps({
            "prediction": prediction,
            "user": user_hex,
            "market_id": market_id,
        })
        self.bets[bet_key] = bet_data

        # Market'in bahis listesine ekle
        existing_keys = json.loads(self.market_bet_keys.get(market_id, "[]"))
        existing_keys.append(bet_key)
        self.market_bet_keys[market_id] = json.dumps(existing_keys)

        # Kullanıcının bahis listesine ekle
        user_keys = json.loads(self.user_bet_keys.get(user_hex, "[]"))
        user_keys.append(bet_key)
        self.user_bet_keys[user_hex] = json.dumps(user_keys)

    @gl.public.write
    def resolve_market(self, market_id: str):
        """
        Intelligent Oracle: Web'den maç sonucunu çeker, LLM ile parse eder,
        Equivalence Principle ile consensus sağlar, kazananları ödüllendirir.
        """
        if market_id not in self.markets:
            raise gl.vm.UserError(f"Market not found: {market_id}")

        market = json.loads(self.markets[market_id])

        if market["status"] != "open":
            raise gl.vm.UserError("Market is already resolved")

        home_team = market["home_team"]
        away_team = market["away_team"]
        match_date = market["match_date"]

        # --- STEP 1: Web'den maç sonucunu çek ---
        search_query = f"{home_team} vs {away_team} {match_date} final score"
        search_url = f"https://www.google.com/search?q={search_query.replace(' ', '+')}"

        # gl.nondet.web.render() → leader validator web'e gider, sayfayı render eder
        # diğer validator'lar bağımsız olarak aynı URL'i render eder
        web_result = gl.nondet.web.render(search_url, mode="text")

        # --- STEP 2: LLM ile skoru extract et ---
        extraction_prompt = (
            f"From the following web content, extract the final score of the football match "
            f"between {home_team} and {away_team} played on {match_date}.\n\n"
            f"Respond ONLY with a JSON object in this exact format, nothing else:\n"
            f'{{"home_score": <integer>, "away_score": <integer>, "found": true}}\n\n'
            f"If the match result is not found or the match has not been played yet, respond:\n"
            f'{{"found": false}}\n\n'
            f"Web content:\n{web_result}"
        )

        # gl.nondet.exec_prompt() → leader LLM'e sorar, validator'lar kendi LLM'leriyle doğrular
        result_str = gl.nondet.exec_prompt(extraction_prompt)

        # --- STEP 3: Equivalence Principle ile consensus ---
        # prompt_non_comparative: validator'ın result'ını bağımsız değerlendirir
        # "Bu cevap gerçek bir maç skoru içeriyor mu?" sorusuna evet/hayır
        final_result = gl.eq_principle.prompt_non_comparative(
            result_str,
            f"Does this JSON response contain a valid final score for a football match "
            f"between {home_team} and {away_team}? The response must have 'found' as true "
            f"and both 'home_score' and 'away_score' as non-negative integers. "
            f"Answer 'valid' if it does, 'invalid' if it doesn't."
        )

        # --- STEP 4: Sonucu parse et ve kaydet ---
        result = json.loads(result_str)

        if not result.get("found", False):
            raise gl.vm.UserError("Match result not available yet. Try again later.")

        home_score = int(result["home_score"])
        away_score = int(result["away_score"])

        if home_score > away_score:
            outcome = "home"
        elif away_score > home_score:
            outcome = "away"
        else:
            outcome = "draw"

        # Market'i güncelle
        market["status"] = "resolved"
        market["outcome"] = outcome
        market["home_score"] = home_score
        market["away_score"] = away_score
        self.markets[market_id] = json.dumps(market)

        # --- STEP 5: Doğru tahmin edenlere puan ver ---
        bet_keys_json = self.market_bet_keys.get(market_id, "[]")
        bet_keys = json.loads(bet_keys_json)

        for bk in bet_keys:
            if bk in self.bets:
                bet = json.loads(self.bets[bk])
                if bet["prediction"] == outcome:
                    user = bet["user"]
                    current_points = self.points.get(user, u256(0))
                    self.points[user] = current_points + u256(1)

    # ========== VIEW METHODS ==========

    @gl.public.view
    def get_market(self, market_id: str) -> str:
        if market_id not in self.markets:
            return json.dumps({"error": "Market not found"})
        return self.markets[market_id]

    @gl.public.view
    def get_all_markets(self) -> str:
        result = []
        for mid in self.market_ids:
            market = json.loads(self.markets[mid])
            market["market_id"] = mid
            result.append(market)
        return json.dumps(result)

    @gl.public.view
    def get_markets_by_league(self, league: str) -> str:
        result = []
        for mid in self.market_ids:
            market = json.loads(self.markets[mid])
            if market["league"] == league:
                market["market_id"] = mid
                result.append(market)
        return json.dumps(result)

    @gl.public.view
    def get_open_markets(self) -> str:
        result = []
        for mid in self.market_ids:
            market = json.loads(self.markets[mid])
            if market["status"] == "open":
                market["market_id"] = mid
                result.append(market)
        return json.dumps(result)

    @gl.public.view
    def get_market_bets(self, market_id: str) -> str:
        bet_keys_json = self.market_bet_keys.get(market_id, "[]")
        bet_keys = json.loads(bet_keys_json)
        result = []
        for bk in bet_keys:
            if bk in self.bets:
                result.append(json.loads(self.bets[bk]))
        return json.dumps(result)

    @gl.public.view
    def get_user_bets(self, user_address: str) -> str:
        user_keys_json = self.user_bet_keys.get(user_address, "[]")
        user_keys = json.loads(user_keys_json)
        result = []
        for uk in user_keys:
            if uk in self.bets:
                bet = json.loads(self.bets[uk])
                if bet["market_id"] in self.markets:
                    market = json.loads(self.markets[bet["market_id"]])
                    bet["market_status"] = market["status"]
                    bet["market_outcome"] = market.get("outcome", "")
                    bet["won"] = (market["status"] == "resolved" and bet["prediction"] == market.get("outcome", ""))
                result.append(bet)
        return json.dumps(result)

    @gl.public.view
    def get_user_points(self, user_address: str) -> str:
        pts = self.points.get(user_address, u256(0))
        return json.dumps({"user": user_address, "points": int(pts)})

    @gl.public.view
    def get_leaderboard(self) -> str:
        entries = []
        for user_hex in self.points:
            entries.append({
                "user": user_hex,
                "points": int(self.points[user_hex]),
            })
        entries.sort(key=lambda x: x["points"], reverse=True)
        return json.dumps(entries[:50])

    @gl.public.view
    def get_supported_leagues(self) -> str:
        return json.dumps(LEAGUES)
