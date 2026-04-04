#!/usr/bin/env node
// ============================================================================
// resolve_matches.mjs — Auto-resolve finished matches via GenLayer AI Oracle
// Checks open markets with past match dates, calls resolve_market on contract
// The GenLayer AI Oracle handles:
//   1. Searching Google for the real match score
//   2. Extracting score with LLM
//   3. Validator consensus via Equivalence Principle
//   4. On-chain finalization + point awards
// Run via cron every 30 min: */30 * * * * node /root/football-prediction/scripts/resolve_matches.mjs
// ============================================================================

import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import { privateKeyToAccount } from "viem/accounts";
import { CONTRACT_ADDRESS, PRIVATE_KEY, log } from "./config.mjs";

// ── Get all open markets from contract ──────────────────────────────────────
async function getOpenMarkets(client) {
  try {
    const raw = await client.readContract({
      address: CONTRACT_ADDRESS,
      functionName: "get_live_matches",
      args: [],
    });
    return JSON.parse(raw);
  } catch (err) {
    log(`⚠️ Could not read open markets: ${err.message}`);
    return [];
  }
}

// ── Check if match date has passed (match should be finished) ───────────────
function isMatchFinished(matchDate) {
  const matchTime = new Date(matchDate + "T23:59:59Z"); // End of match day
  const now = new Date();
  // Add 3 hours buffer after match day ends (for late-finishing matches)
  const cutoff = new Date(matchTime.getTime() + 3 * 60 * 60 * 1000);
  return now > cutoff;
}

// ── Resolve a market via GenLayer AI Oracle ──────────────────────────────────
async function resolveMarket(client, market) {
  const { market_id, home_team, away_team, match_date } = market;
  log(`  🤖 Resolving: ${home_team} vs ${away_team} (${match_date})...`);
  log(`     → GenLayer AI Oracle will search Google for the real score`);
  log(`     → Validators will verify via Equivalence Principle`);

  let retriesLeft = 5;
  while (retriesLeft > 0) {
    try {
      const txHash = await client.writeContract({
        address: CONTRACT_ADDRESS,
        functionName: "resolve_market",
        args: [market_id],
        value: BigInt(0),
      });

      log(`     → Transaction sent: ${txHash}`);
      log(`     → Waiting for AI Oracle consensus (this may take 1-3 minutes)...`);

      const receipt = await client.waitForTransactionReceipt({
        hash: txHash,
        status: "ACCEPTED",
        retries: 200,      // long wait — oracle needs time
        interval: 10000,   // check every 10s
      });

      log(`  ✅ RESOLVED ON-CHAIN: ${home_team} vs ${away_team}`);
      log(`     Transaction status: ${receipt.statusName || receipt.status}`);
      return true;
    } catch (err) {
      if (err.message?.includes("not available yet")) {
        log(`  ⏳ Score not yet available for ${home_team} vs ${away_team} — will retry later`);
        return false;
      } else {
        retriesLeft--;
        log(`  ⚠️ Resolution failed (${err.message?.slice(0, 80)}). Retries left: ${retriesLeft}`);
        if (retriesLeft > 0) {
          log(`  ⏳ Waiting 30s before retrying resolution...`);
          await new Promise(r => setTimeout(r, 30000));
        }
      }
    }
  }
  log(`  ❌ Exhausted all retries for resolving ${market_id}`);
  return false;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  log("⚽ Starting match resolution check...");

  if (!PRIVATE_KEY) {
    log("❌ GENLAYER_PRIVATE_KEY not set!");
    process.exit(1);
  }

  const account = privateKeyToAccount(PRIVATE_KEY);
  const client = createClient({
    chain: testnetBradbury,
    account: account,
  });

  const openMarkets = await getOpenMarkets(client);
  log(`📋 ${openMarkets.length} open markets found`);

  if (openMarkets.length === 0) {
    log("✅ No open markets to resolve.");
    return;
  }

  let resolved = 0;

  for (const market of openMarkets) {
    if (!isMatchFinished(market.match_date)) {
      log(`  ⏭️ ${market.home_team} vs ${market.away_team} (${market.match_date}) — match not finished yet`);
      continue;
    }

    const ok = await resolveMarket(client, market);
    if (ok) resolved++;

    // Wait between resolutions to avoid overloading
    await new Promise(r => setTimeout(r, 5000));
  }

  log(`\n🎉 Done! Resolved ${resolved} markets on-chain via GenLayer AI Oracle.`);
}

main().catch(err => {
  log(`❌ Fatal: ${err.message}`);
  process.exit(1);
});
