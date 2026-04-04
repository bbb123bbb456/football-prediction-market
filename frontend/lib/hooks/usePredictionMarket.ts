"use client";

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { predictionMarketAbi } from "../wagmi";
import { success, error, loading as toastLoading } from "../utils/toast";
import { STATIC_FIXTURES, getFixturesByLeague as getStaticByLeague } from "../fixtures";
import type { Market, Bet, LeaderboardEntry } from "../types";

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

// Helper to convert EVM Market struct to our frontend interface
function mapEvmMarket(evmMarket: any): Market {
  return {
    market_id: evmMarket.id,
    league: evmMarket.league,
    league_name: evmMarket.league,
    home_team: evmMarket.homeTeam,
    away_team: evmMarket.awayTeam,
    match_date: new Date(Number(evmMarket.matchTimestamp) * 1000).toISOString().split('T')[0],
    status: evmMarket.state === 0 ? "open" : "resolved",
    home_score: null,
    away_score: null,
    home_bets: Number(evmMarket.homePool) / 1e18,
    away_bets: Number(evmMarket.awayPool) / 1e18,
    draw_bets: Number(evmMarket.drawPool) / 1e18,
    total_bets: Number(evmMarket.totalPool) / 1e18,
    outcome: evmMarket.state === 2 ? "home" : evmMarket.state === 3 ? "away" : evmMarket.state === 4 ? "draw" : null,
    creator: ""
  };
}

// ── Read hooks ────────────────────────────────────────────────────────────

export function useAllMarkets() {
  const { data, isLoading, refetch } = useReadContract({
    address: contractAddress,
    abi: predictionMarketAbi,
    functionName: "getAllMarkets",
    query: {
        staleTime: 5000,
        refetchInterval: 10000,
    }
  });

  const markets = data ? (data as any[]).map(mapEvmMarket) : (STATIC_FIXTURES as unknown as Market[]);
  return { data: markets, isLoading, refetch };
}

export function useMarket(marketId: string | null) {
  const { data } = useAllMarkets();
  const market = data?.find(m => m.market_id === marketId) || null;
  return { data: market, isLoading: !data };
}

export function useMarketsByLeague(league: string | null) {
  const { data } = useAllMarkets();
  const markets = data?.filter(m => m.league.toLowerCase() === league?.toLowerCase()) || getStaticByLeague(league || "");
  return { data: markets as Market[], isLoading: !data };
}

export function useLiveMatches() {
  const { data } = useAllMarkets();
  const markets = data?.filter(m => m.status === "open") || [];
  return { data: markets, isLoading: !data };
}

// User points are abstracted out because this is native ETH betting, we show ETH won instead of points
export function useUserPoints(user: string | null) {
  return { data: 0, isLoading: false };
}
export function useUserBets(user: string | null) {
  // We can't efficiently query all user bets from just smart contracts without a subgraph on Base Sepolia.
  // For the sake of the hackathon/demo, we return an empty list or we can just filter events using viem logs.
  return { data: [], isLoading: false };
}
export function useLeaderboard() {
  return { data: [], isLoading: false };
}


// ── Write hooks ───────────────────────────────────────────────────────────

export function useCreateMarket() {
  const { writeContractAsync } = useWriteContract();
  
  const createMarketAsync = async ({ league, homeTeam, awayTeam, matchDate }: any) => {
    const timestamp = Math.floor(new Date(matchDate).getTime() / 1000);
    const id = `${league}_${homeTeam}_${awayTeam}_${matchDate}`.replace(/ /g, "_").toLowerCase();
    
    try {
        const hash = await writeContractAsync({
            address: contractAddress,
            abi: predictionMarketAbi,
            functionName: "createMarket",
            args: [id, league, homeTeam, awayTeam, BigInt(timestamp)]
        });
        success("Market creation sent!", { description: "Waiting for confirmation..." });
        return hash;
    } catch(err: any) {
        error("Failed to create market", { description: err?.shortMessage || err?.message });
        throw err;
    }
  };

  return { isCreating: false, createMarketAsync };
}

export function usePlaceBet() {
  const { writeContractAsync } = useWriteContract();

  const placeBetAsync = async ({ marketId, prediction, amount }: any) => {
    const predMap: any = { HOME: 0, AWAY: 1, DRAW: 2 };
    const val = BigInt((parseFloat(amount) * 1e18).toString());

    try {
        const hash = await writeContractAsync({
            address: contractAddress,
            abi: predictionMarketAbi,
            functionName: "placeBet",
            args: [marketId, predMap[prediction]],
            value: val
        });
        success("Bet transaction submitted!", { description: "Your prediction is being recorded." });
        return hash;
    } catch(err: any) {
        error("Failed to place bet", { description: err?.shortMessage || err?.message });
        throw err;
    }
  };

  return { isPlacing: false, placeBetAsync };
}

export function useResolveMarket() {
  const { writeContractAsync, isPending } = useWriteContract();

  const resolveMarketAsync = async (marketId: string) => {
    try {
        const hash = await writeContractAsync({
            address: contractAddress,
            abi: predictionMarketAbi,
            functionName: "requestResolution",
            args: [marketId]
        });
        success("Resolution requested!", { description: "The GenLayer Oracle will process this shortly." });
        return hash;
    } catch(err: any) {
        error("Failed to resolve market", { description: err?.shortMessage || err?.message });
        throw err;
    }
  };

  return { isResolving: isPending, resolveMarketAsync };
}
