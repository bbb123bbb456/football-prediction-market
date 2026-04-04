# {"Depends": "py-genlayer:latest"}
import json
import genlayer.nondet.web as web
import genlayer.nondet as gl

class MatchOracle:
    def __init__(self):
        # GenVM requires __init__
        self.name = "Football Match Oracle"
        self.results = {}
        
    def resolve_match(self, home_team: str, away_team: str, match_date: str) -> int:
        """
        Executes a non-deterministic web query to find the match outcome.
        Returns:
        0 = HOME TEAM WON
        1 = AWAY TEAM WON
        2 = DRAW
        3 = CANCELED / NOT PLAYED / NOT FINISHED YET
        """
        
        # 1. Provide instructions to the LLM
        task_prompt = f"""
        You are a highly precise sports data oracle.
        A football match between '{home_team}' (Home) and '{away_team}' (Away) was scheduled for {match_date}.
        Your goal is to search the web for the FINAL outcome of this EXACT match.
        Return ONLY a JSON object with the following structure, no markdown blocks, no extra text:
        {{
            "home_score": int,
            "away_score": int,
            "status": "FINISHED" or "NOT_FINISHED"
        }}
        If the match has not been played yet, or you cannot find reliable information that it has concluded, return "status": "NOT_FINISHED".
        """
        
        try:
            # 2. Browse the web to gather data
            search_query = f"{home_team} vs {away_team} {match_date} match result final score"
            print(f"Searching web for: {search_query}")
            web_data = web.render(search_query)
            
            # 3. Use an LLM to parse the data
            response = gl.exec_prompt(task_prompt, web_data)
            
            # Clean possible markdown formatting
            clean_response = response.strip()
            if clean_response.startswith('```json'): clean_response = clean_response[7:]
            if clean_response.startswith('```'): clean_response = clean_response[3:]
            if clean_response.endswith('```'): clean_response = clean_response[:-3]
                
            data = json.loads(clean_response.strip())
            
            # 4. Determine result based on scores
            status = data.get("status", "NOT_FINISHED")
            if status != "FINISHED":
                print("Match not finished.")
                return 3
                
            home = int(data.get("home_score", 0))
            away = int(data.get("away_score", 0))
            
            res = 0 if home > away else (1 if away > home else 2)
            
            # Store in state
            market_id = f"{home_team}_{away_team}_{match_date}"
            self.results[market_id] = res
            print(f"Match resolved: {res}")
            return res
                
        except Exception as e:
            print(f"Error resolving match {home_team} vs {away_team}: {e}")
            return 3
            
    def get_result(self, home_team: str, away_team: str, match_date: str) -> int:
        market_id = f"{home_team}_{away_team}_{match_date}"
        return self.results.get(market_id, -1)
