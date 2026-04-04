import { createPublicClient, createWalletClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { createClient } from 'genlayer-js';
import { testnetBradbury } from 'genlayer-js/chains';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const EVM_CONTRACT = process.env.EVM_CONTRACT_ADDRESS;
const ORACLE_CONTRACT = process.env.GENLAYER_ORACLE_ADDRESS;

if (!PRIVATE_KEY || !EVM_CONTRACT || !ORACLE_CONTRACT) {
  console.error("Missing env vars: PRIVATE_KEY, EVM_CONTRACT_ADDRESS, or GENLAYER_ORACLE_ADDRESS");
  process.exit(1);
}

// Minimal ABI required for Relay
const marketAbi = parseAbi([
  "function getAllMarkets() external view returns (tuple(string id, string league, string homeTeam, string awayTeam, uint256 matchTimestamp, uint8 state, uint256 homePool, uint256 awayPool, uint256 drawPool, uint256 totalPool, string genlayerTxHash)[])",
  "function submitResult(string _id, uint8 _result, string _genlayerTxHash) external"
]);

async function main() {
  console.log("🌉 Starting Hybrid Relayer Bridge...");
  console.log("EVM Contract:", EVM_CONTRACT);
  console.log("GenLayer Oracle:", ORACLE_CONTRACT);

  const account = privateKeyToAccount(PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY : `0x${PRIVATE_KEY}`);

  // Base Sepolia Client
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http()
  });
  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http()
  });

  // GenLayer Client
  const genlayerClient = createClient({
    chain: testnetBradbury,
    account: PRIVATE_KEY // genlayer-js uses raw private key without 0x or with 0x depending on version
  });

  while (true) {
    try {
      console.log(`[${new Date().toISOString()}] Scanning for markets that need resolution...`);
      
      const markets = await publicClient.readContract({
        address: EVM_CONTRACT,
        abi: marketAbi,
        functionName: 'getAllMarkets'
      });

      for (const market of markets) {
        // state: 1 is RESOLVING
        if (market.state === 1) {
          console.log(`\n⏳ Found market pending resolution: ${market.id} (${market.homeTeam} vs ${market.awayTeam})`);
          
          try {
            // 1. Call GenLayer Oracle
            // Extract YYYY-MM-DD from matchTimestamp
            const matchDate = new Date(Number(market.matchTimestamp) * 1000).toISOString().split('T')[0];
            
            console.log(`   -> Prompting GenLayer to resolve match (Date: ${matchDate})...`);
            
            // Send transaction to GenLayer
            const hash = await genlayerClient.writeContract({
              address: ORACLE_CONTRACT,
              functionName: "resolve_match",
              args: [market.homeTeam, market.awayTeam, matchDate],
              value: 0n,
            });
            console.log(`   -> GenLayer transaction sent: ${hash}`);
            
            // Wait for consensus
            await genlayerClient.waitForTransactionReceipt({ hash, status: "ACCEPTED", retries: 30, interval: 5000 });
            console.log(`   -> GenLayer consensus reached!`);

            // Read the result back from the contract state
            const resultRaw = await genlayerClient.readContract({
              address: ORACLE_CONTRACT,
              functionName: "get_result",
              args: [market.homeTeam, market.awayTeam, matchDate]
            });
            
            let result = Number(resultRaw);
            if (result === -1 || result === 3) {
                console.log(`   -> Match not finished or error. Result: ${result}. Re-trying later.`);
                continue;
            }

            console.log(`   -> GenLayer resolved match! Result: ${result} (0=Home, 1=Away, 2=Draw)`);

            // 2. Submit back to Base Sepolia
            console.log(`   -> Submiting result back to EVM Contract...`);
            const { request } = await publicClient.simulateContract({
                address: EVM_CONTRACT,
                abi: marketAbi,
                functionName: 'submitResult',
                args: [market.id, result, hash],
                account
            });
            const tx = await walletClient.writeContract(request);
            console.log(`   ✅ Submitted EVM tx: ${tx}`);
            await publicClient.waitForTransactionReceipt({ hash: tx });
            console.log(`   ✅ Market fully resolved on Base Sepolia!`);
            
          } catch (e) {
            console.error(`   ❌ Failed to resolve market ${market.id}:`, e.message);
          }
        }
      }
    } catch (e) {
      console.error("Relayer loop error:", e.message);
    }
    
    // Poll every 30 seconds
    await sleep(30_000);
  }
}

main().catch(console.error);
