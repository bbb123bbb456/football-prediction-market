"use client";

import { useQuery } from "@tanstack/react-query";
import { createPublicClient, http, formatEther } from "viem";
import { useAccount as useWallet } from "wagmi";

// We use the exact ZkSync EVM RPC specific for MetaMask compatibility on GenLayer
const evmClient = createPublicClient({
  transport: http(process.env.NEXT_PUBLIC_GENLAYER_EVM_RPC_URL || "https://zksync-os-testnet-genlayer.zksync.dev")
});

export function useBalance() {
  const { address, isConnected } = useWallet();

  return useQuery({
    queryKey: ["balance", address],
    queryFn: async () => {
      if (!address) return "0";
      try {
        const balanceWei = await evmClient.getBalance({
          address: address as `0x${string}`,
        });
        return formatEther(balanceWei); // Convert from WEI to GEN Token float string
      } catch (e) {
        console.error("Failed to fetch balance:", e);
        return "0";
      }
    },
    enabled: isConnected && !!address,
    refetchInterval: 10000, // Poll every 10s
  });
}
