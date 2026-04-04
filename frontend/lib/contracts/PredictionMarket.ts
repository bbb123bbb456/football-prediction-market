import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import { parseEther } from "viem";
import type { Market, Bet, LeaderboardEntry } from "../types";

class PredictionMarket {
  private contractAddress: `0x${string}`;
  private client: ReturnType<typeof createClient>;

  constructor(contractAddress: string, address?: string | null, studioUrl?: string) {
    this.contractAddress = contractAddress as `0x${string}`;
    const config: any = { chain: testnetBradbury };
    if (address) config.account = address as `0x${string}`;
    if (studioUrl) config.endpoint = studioUrl;
    this.client = createClient(config);
  }

  private async read<T>(functionName: string, args: any[] = []): Promise<T> {
    return this.client.readContract({
      address: this.contractAddress,
      functionName,
      args,
    }) as Promise<T>;
  }

  private async write(functionName: string, args: any[], options: { value?: bigint } = {}): Promise<any> {
    const txHash = await this.client.writeContract({
      address: this.contractAddress,
      functionName,
      args,
      value: options.value || BigInt(0),
    });
    return this.client.waitForTransactionReceipt({
      hash: txHash,
      status: "ACCEPTED" as any,
      retries: 60,
      interval: 5000,
    });
  }

  // ── Read methods ──────────────────────────────────────────────────────────

  async getAllMarkets(): Promise<Market[]> {
    const raw: string = await this.read("get_all_markets");
    return JSON.parse(raw) as Market[];
  }

  async getMarket(marketId: string): Promise<Market> {
    const raw: string = await this.read("get_market", [marketId]);
    return JSON.parse(raw) as Market;
  }

  async getMarketsByLeague(league: string): Promise<Market[]> {
    const raw: string = await this.read("get_markets_by_league", [league]);
    return JSON.parse(raw) as Market[];
  }

  async getLiveMatches(): Promise<Market[]> {
    const raw: string = await this.read("get_live_matches");
    return JSON.parse(raw) as Market[];
  }

  async getUserBets(user: string): Promise<Bet[]> {
    const raw: string = await this.read("get_user_bets", [user]);
    return JSON.parse(raw) as Bet[];
  }

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const raw: string = await this.read("get_leaderboard");
    return JSON.parse(raw) as LeaderboardEntry[];
  }

  async getUserPoints(user: string): Promise<number> {
    const pts = await this.read<number>("get_user_points", [user]);
    return Number(pts);
  }

  async getMarketCount(): Promise<number> {
    const n = await this.read<number>("get_market_count");
    return Number(n);
  }

  // ── Write methods ─────────────────────────────────────────────────────────

  async createMarket(
    league: string,
    homeTeam: string,
    awayTeam: string,
    matchDate: string
  ): Promise<any> {
    return this.write("create_market", [league, homeTeam, awayTeam, matchDate]);
  }

  async placeBet(marketId: string, prediction: string, amount: string): Promise<any> {
    const weiAmountStr = parseEther(amount).toString();
    
    // We pass weiAmountStr into the GenVM argument list directly as a string to avoid JS large integer rounding errors
    return this.write("place_bet", [marketId, prediction, weiAmountStr], { value: parseEther(amount) });
  }

  async resolveMarket(marketId: string): Promise<any> {
    return this.write("resolve_market", [marketId]);
  }
}

export default PredictionMarket;
