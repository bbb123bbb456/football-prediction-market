import { createPublicClient, createWalletClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env.cron') });

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const EVM_CONTRACT = process.env.EVM_CONTRACT_ADDRESS;

if (!PRIVATE_KEY || !EVM_CONTRACT) {
  console.error("Missing PRIVATE_KEY or EVM_CONTRACT_ADDRESS in .env.cron");
  process.exit(1);
}

const marketAbi = parseAbi([
  "function getAllMarkets() external view returns (tuple(string id, string league, string homeTeam, string awayTeam, uint256 matchTimestamp, uint8 state, uint256 homePool, uint256 awayPool, uint256 drawPool, uint256 totalPool, string genlayerTxHash)[])",
  "function createMarket(string _id, string _league, string _homeTeam, string _awayTeam, uint256 _matchTimestamp) external"
]);

const FIXTURES = [
  { league: "premier_league", home: "Arsenal", away: "Liverpool", date: "2026-04-11" },
  { league: "premier_league", home: "Manchester City", away: "Aston Villa", date: "2026-04-12" },
  { league: "premier_league", home: "Manchester United", away: "Liverpool", date: "2026-04-13" },
  { league: "la_liga", home: "Real Madrid", away: "Villarreal", date: "2026-04-11" },
  { league: "la_liga", home: "Barcelona", away: "Athletic Bilbao", date: "2026-04-13" },
  { league: "serie_a", home: "Atalanta", away: "Juventus", date: "2026-04-11" },
  { league: "serie_a", home: "Inter Milan", away: "Napoli", date: "2026-04-13" },
  { league: "bundesliga", home: "Bayern Munich", away: "Borussia Dortmund", date: "2026-04-12" },
  { league: "super_lig", home: "Galatasaray", away: "Fenerbahce", date: "2026-04-11" }
];

async function main() {
  console.log(`[${new Date().toISOString()}] 🏈 Starting automated fixture fetcher for EVM...`);
  
  const account = privateKeyToAccount(PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY : `0x${PRIVATE_KEY}`);

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http()
  });

  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http()
  });

  // Pull existing markets from EVM
  const existingMarkets = await publicClient.readContract({
    address: EVM_CONTRACT,
    abi: marketAbi,
    functionName: 'getAllMarkets'
  });

  const existingIds = existingMarkets.map(m => m.id);
  console.log(`📋 Found ${existingMarkets.length} existing markets on Base Sepolia`);

  for (const match of FIXTURES) {
    const marketId = `${match.league}_${match.home}_${match.away}_${match.date}`.replace(/ /g, "_").toLowerCase();
    
    if (existingIds.includes(marketId)) {
        console.log(`   ⏭️ Already exists: ${match.home} vs ${match.away}`);
        continue;
    }

    console.log(`   🔨 Creating market on EVM: ${match.home} vs ${match.away} (${match.date})`);
    try {
        const timestamp = Math.floor(new Date(match.date).getTime() / 1000);
        
        const { request } = await publicClient.simulateContract({
            address: EVM_CONTRACT,
            abi: marketAbi,
            functionName: 'createMarket',
            args: [marketId, match.league, match.home, match.away, BigInt(timestamp)],
            account
        });

        const hash = await walletClient.writeContract(request);
        console.log(`   ⏳ Transaction sent: ${hash}. Waiting for confirmation...`);
        
        await publicClient.waitForTransactionReceipt({ hash });
        console.log(`   ✅ Market perfectly created!`);
        
        // Wait 2 seconds to avoid ratelimits
        await new Promise(r => setTimeout(r, 2000));
    } catch (err) {
        console.error(`   ❌ Failed to create market:`, err.shortMessage || err.message);
    }
  }

  console.log(`🏁 All automated fixtures processed.`);
}

main().catch(console.error);
