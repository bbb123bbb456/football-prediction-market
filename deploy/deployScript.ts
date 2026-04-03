import { readFileSync } from "fs";
import path from "path";
import {
  TransactionHash,
  TransactionStatus,
  GenLayerClient,
  DecodedDeployData,
  GenLayerChain,
} from "genlayer-js/types";
import { localnet } from "genlayer-js/chains";

// Upcoming real fixtures for April/May 2026
const FIXTURES = [
  // Premier League
  { league: "premier_league", home: "Arsenal", away: "Liverpool", date: "2026-04-11" },
  { league: "premier_league", home: "Manchester City", away: "Aston Villa", date: "2026-04-18" },
  // La Liga
  { league: "la_liga", home: "Barcelona", away: "Real Madrid", date: "2026-04-12" },
  { league: "la_liga", home: "Atletico Madrid", away: "Villarreal", date: "2026-04-19" },
  // Serie A
  { league: "serie_a", home: "Inter Milan", away: "AC Milan", date: "2026-04-13" },
  { league: "serie_a", home: "Juventus", away: "Napoli", date: "2026-04-20" },
  // Bundesliga
  { league: "bundesliga", home: "Bayern Munich", away: "Borussia Dortmund", date: "2026-04-12" },
  { league: "bundesliga", home: "Bayer Leverkusen", away: "RB Leipzig", date: "2026-04-19" },
  // Ligue 1
  { league: "ligue_1", home: "PSG", away: "Marseille", date: "2026-04-11" },
  { league: "ligue_1", home: "Monaco", away: "Lyon", date: "2026-04-18" },
  // Turkish Super Lig
  { league: "super_lig", home: "Galatasaray", away: "Fenerbahce", date: "2026-04-13" },
  { league: "super_lig", home: "Besiktas", away: "Trabzonspor", date: "2026-04-20" },
];

export default async function main(client: GenLayerClient<any>) {
  const filePath = path.resolve(process.cwd(), "contracts/prediction_market.py");

  try {
    const contractCode = new Uint8Array(readFileSync(filePath));

    await client.initializeConsensusSmartContract();

    // ── STEP 1: Deploy contract ─────────────────────────────
    console.log("🚀 Deploying PredictionMarket contract...");
    const deployTransaction = await client.deployContract({
      code: contractCode,
      args: [],
    });

    const receipt = await client.waitForTransactionReceipt({
      hash: deployTransaction as TransactionHash,
      status: TransactionStatus.ACCEPTED,
      retries: 200,
    });

    if (
      receipt.status !== 5 &&
      receipt.status !== 6 &&
      receipt.statusName !== "ACCEPTED" &&
      receipt.statusName !== "FINALIZED"
    ) {
      throw new Error(`Deployment failed. Receipt: ${JSON.stringify(receipt)}`);
    }

    const deployedContractAddress =
      (client.chain as GenLayerChain).id === localnet.id
        ? receipt.data.contract_address
        : (receipt.txDataDecoded as DecodedDeployData)?.contractAddress;

    console.log(`✅ Contract deployed at address: ${deployedContractAddress}`);

    // ── STEP 2: Seed fixtures ───────────────────────────────
    console.log("\n⚽ Seeding fixtures...\n");

    for (const fixture of FIXTURES) {
      try {
        console.log(`  Creating: ${fixture.home} vs ${fixture.away} (${fixture.date})...`);
        const txHash = await client.writeContract({
          address: deployedContractAddress as `0x${string}`,
          functionName: "create_market",
          args: [fixture.league, fixture.home, fixture.away, fixture.date],
          value: BigInt(0),
        });
        await client.waitForTransactionReceipt({
          hash: txHash as TransactionHash,
          status: TransactionStatus.ACCEPTED,
          retries: 100,
        });
        console.log(`  ✅ Created!`);
      } catch (err: any) {
        console.log(`  ⚠️ Skipped: ${err?.message?.slice(0, 80) || err}`);
      }
    }

    console.log("\n🎉 Done! All fixtures seeded.");
    console.log(`\n📍 Contract Address: ${deployedContractAddress}`);
    console.log(`\n👉 Update frontend/.env:`);
    console.log(`   NEXT_PUBLIC_CONTRACT_ADDRESS=${deployedContractAddress}`);
  } catch (error) {
    throw new Error(`Error during deployment: ${error}`);
  }
}
