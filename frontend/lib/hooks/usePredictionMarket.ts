"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import PredictionMarket from "../contracts/PredictionMarket";
import { getContractAddress, getStudioUrl } from "../genlayer/client";
import { useWallet } from "../genlayer/wallet";
import { success, error } from "../utils/toast";
import { STATIC_FIXTURES, getFixturesByLeague as getStaticByLeague } from "../fixtures";
import type { Market, Bet, LeaderboardEntry } from "../types";

// ── Contract instance hook ────────────────────────────────────────────────

export function usePredictionMarketContract(): PredictionMarket | null {
  const { address } = useWallet();
  const contractAddress = getContractAddress();
  const studioUrl = getStudioUrl();

  return useMemo(() => {
    if (!contractAddress) return null;
    return new PredictionMarket(contractAddress, address, studioUrl);
  }, [contractAddress, address, studioUrl]);
}

// ── Helper: merge static fixtures with on-chain data ──────────────────────

function mergeWithStatic(onChain: Market[], staticData: Market[]): Market[] {
  if (onChain.length > 0) return onChain;
  return staticData;
}

// ── Read hooks ────────────────────────────────────────────────────────────

export function useAllMarkets() {
  const contract = usePredictionMarketContract();
  return useQuery<Market[], Error>({
    queryKey: ["markets", "all"],
    queryFn: async () => {
      if (!contract) return STATIC_FIXTURES as unknown as Market[];
      try {
        const data = await contract.getAllMarkets();
        return data.length > 0 ? data : STATIC_FIXTURES as unknown as Market[];
      } catch { return STATIC_FIXTURES as unknown as Market[]; }
    },
    enabled: true,
    staleTime: 5000,
    refetchOnWindowFocus: true,
  });
}

export function useMarket(marketId: string | null) {
  const contract = usePredictionMarketContract();
  return useQuery<Market | null, Error>({
    queryKey: ["market", marketId],
    queryFn: async () => {
      if (!marketId) return null;
      // Check static first
      const staticMatch = STATIC_FIXTURES.find(f => f.market_id === marketId);
      if (!contract) return (staticMatch as unknown as Market) || null;
      try {
        const data = await contract.getMarket(marketId);
        if (data && !("error" in data)) return data;
        return (staticMatch as unknown as Market) || null;
      } catch { return (staticMatch as unknown as Market) || null; }
    },
    enabled: !!marketId,
    staleTime: 5000,
    refetchOnWindowFocus: true,
  });
}

export function useMarketsByLeague(league: string | null) {
  const contract = usePredictionMarketContract();
  return useQuery<Market[], Error>({
    queryKey: ["markets", "league", league],
    queryFn: async () => {
      if (!league) return [];
      const staticLeague = getStaticByLeague(league) as unknown as Market[];
      if (!contract) return staticLeague;
      try {
        const data = await contract.getMarketsByLeague(league);
        return data.length > 0 ? data : staticLeague;
      } catch { return staticLeague; }
    },
    enabled: !!league,
    staleTime: 5000,
    refetchOnWindowFocus: true,
  });
}

export function useLiveMatches() {
  const contract = usePredictionMarketContract();
  return useQuery<Market[], Error>({
    queryKey: ["markets", "live"],
    queryFn: async () => {
      if (!contract) return STATIC_FIXTURES as unknown as Market[];
      try {
        const data = await contract.getLiveMatches();
        return data.length > 0 ? data : STATIC_FIXTURES as unknown as Market[];
      } catch { return STATIC_FIXTURES as unknown as Market[]; }
    },
    enabled: true,
    staleTime: 10000,
    refetchInterval: 30000,
  });
}

export function useUserBets(user: string | null) {
  const contract = usePredictionMarketContract();
  return useQuery<Bet[], Error>({
    queryKey: ["userBets", user],
    queryFn: () =>
      contract && user ? contract.getUserBets(user) : Promise.resolve([]),
    enabled: !!contract && !!user,
    staleTime: 5000,
    refetchOnWindowFocus: true,
  });
}

export function useLeaderboard() {
  const contract = usePredictionMarketContract();
  return useQuery<LeaderboardEntry[], Error>({
    queryKey: ["leaderboard"],
    queryFn: () => (contract ? contract.getLeaderboard() : Promise.resolve([])),
    enabled: !!contract,
    staleTime: 10000,
    refetchOnWindowFocus: true,
  });
}

export function useUserPoints(user: string | null) {
  const contract = usePredictionMarketContract();
  return useQuery<number, Error>({
    queryKey: ["userPoints", user],
    queryFn: () =>
      contract && user ? contract.getUserPoints(user) : Promise.resolve(0),
    enabled: !!contract && !!user,
    staleTime: 5000,
  });
}

// ── Write hooks ───────────────────────────────────────────────────────────

export function useCreateMarket() {
  const contract = usePredictionMarketContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  const mutation = useMutation({
    mutationFn: async ({
      league,
      homeTeam,
      awayTeam,
      matchDate,
    }: {
      league: string;
      homeTeam: string;
      awayTeam: string;
      matchDate: string;
    }) => {
      if (!contract) throw new Error("Contract not configured");
      if (!address) throw new Error("Wallet not connected");
      setIsCreating(true);
      return contract.createMarket(league, homeTeam, awayTeam, matchDate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["markets"] });
      setIsCreating(false);
      success("Market created!", { description: "Your market is now live on the blockchain." });
    },
    onError: (err: any) => {
      setIsCreating(false);
      error("Failed to create market", { description: err?.message || "Please try again." });
    },
  });

  return { ...mutation, isCreating, createMarket: mutation.mutate, createMarketAsync: mutation.mutateAsync };
}

export function usePlaceBet() {
  const contract = usePredictionMarketContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const [isPlacing, setIsPlacing] = useState(false);

  const mutation = useMutation({
    mutationFn: async ({ marketId, prediction, amount }: { marketId: string; prediction: string; amount: string }) => {
      if (!contract) throw new Error("Contract not configured");
      if (!address) throw new Error("Wallet not connected");
      setIsPlacing(true);
      return contract.placeBet(marketId, prediction, amount);
    },
    onSuccess: (_data, { marketId }) => {
      queryClient.invalidateQueries({ queryKey: ["markets"] });
      queryClient.invalidateQueries({ queryKey: ["market", marketId] });
      queryClient.invalidateQueries({ queryKey: ["userBets"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      setIsPlacing(false);
      success("Bet placed!", { description: "Your prediction has been recorded on the blockchain." });
    },
    onError: (err: any) => {
      setIsPlacing(false);
      error("Failed to place bet", { description: err?.message || "Please try again." });
    },
  });

  return { ...mutation, isPlacing, placeBet: mutation.mutate, placeBetAsync: mutation.mutateAsync };
}

export function useResolveMarket() {
  const contract = usePredictionMarketContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const [isResolving, setIsResolving] = useState(false);
  const [resolvingMarketId, setResolvingMarketId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (marketId: string) => {
      if (!contract) throw new Error("Contract not configured");
      if (!address) throw new Error("Wallet not connected");
      setIsResolving(true);
      setResolvingMarketId(marketId);
      return contract.resolveMarket(marketId);
    },
    onSuccess: (_data, marketId) => {
      queryClient.invalidateQueries({ queryKey: ["markets"] });
      queryClient.invalidateQueries({ queryKey: ["market", marketId] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["userBets"] });
      setIsResolving(false);
      setResolvingMarketId(null);
      success("Market resolved!", { description: "The match result has been verified by GenLayer." });
    },
    onError: (err: any) => {
      setIsResolving(false);
      setResolvingMarketId(null);
      error("Failed to resolve market", { description: err?.message || "Please try again." });
    },
  });

  return {
    ...mutation,
    isResolving,
    resolvingMarketId,
    resolveMarket: mutation.mutate,
    resolveMarketAsync: mutation.mutateAsync,
  };
}
