#!/usr/bin/env node
// ============================================================================
// fetch_fixtures.mjs — Auto-fetch real upcoming fixtures from football-data.org
// Creates markets on the Bradbury contract for matches involving our top 5 teams
// Run via cron every 6 hours: 0 */6 * * * node /root/football-prediction/scripts/fetch_fixtures.mjs
// ============================================================================

import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import {
  CONTRACT_ADDRESS, FOOTBALL_API_KEY, PRIVATE_KEY,
  LEAGUE_CODES, TEAM_MAP, CONTRACT_TEAMS, mapTeamName, isOurTeam, log
} from "./config.mjs";

const API_BASE = "https://api.football-data.org/v4";

// ── Fetch upcoming matches from football-data.org ──────────────────────────
async function fetchUpcomingMatches(leagueCode) {
  const url = `${API_BASE}/competitions/${leagueCode}/matches?status=SCHEDULED`;
  const res = await fetch(url, {
    headers: { "X-Auth-Token": FOOTBALL_API_KEY },
  });

  if (!res.ok) {
    const errorText = await res.text();
    log(`⚠️ API error for ${leagueCode}: ${res.status} ${res.statusText} - ${errorText}`);
    return [];
  }

  const data = await res.json();
  return data.matches || [];
}

// ── Filter for our teams + pick next 2 per team ────────────────────────────
function filterForOurTeams(matches, leagueSlug) {
  const ourTeams = CONTRACT_TEAMS[leagueSlug] || [];
  const result = [];

  for (const match of matches) {
    const home = mapTeamName(match.homeTeam?.name || "");
    const away = mapTeamName(match.awayTeam?.name || "");

    // Match must involve at least one of our teams
    if (!ourTeams.includes(home) && !ourTeams.includes(away)) continue;
    // Both teams must be in our list
    if (!ourTeams.includes(home) || !ourTeams.includes(away)) continue;

    const utcDate = match.utcDate?.split("T")[0]; // "2026-04-11"
    if (!utcDate) continue;

    result.push({ league: leagueSlug, home, away, date: utcDate });
  }

  // Deduplicate and take first N per league
  const seen = new Set();
  return result.filter(f => {
    const key = `${f.home}_${f.away}_${f.date}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 4); // max 4 fixtures per league
}

// ── Get existing markets from contract ──────────────────────────────────────
async function getExistingMarketIds(client) {
  try {
    const raw = await client.readContract({
      address: CONTRACT_ADDRESS,
      functionName: "get_all_markets",
      args: [],
    });
    const markets = JSON.parse(raw);
    return new Set(markets.map(m => m.market_id));
  } catch (err) {
    log(`⚠️ Could not read existing markets: ${err.message}`);
    return new Set();
  }
}

// ── Create market on contract ───────────────────────────────────────────────
async function createMarket(client, fixture) {
  const { league, home, away, date } = fixture;
  log(`  Creating market: ${home} vs ${away} (${date}) [${league}]`);

  try {
    const txHash = await client.writeContract({
      address: CONTRACT_ADDRESS,
      functionName: "create_market",
      args: [league, home, away, date],
      value: BigInt(0),
    });

    await client.waitForTransactionReceipt({
      hash: txHash,
      status: "ACCEPTED",
      retries: 120,
      interval: 5000,
    });

    log(`  ✅ Market created: ${home} vs ${away}`);
    return true;
  } catch (err) {
    log(`  ⚠️ Failed: ${err.message?.slice(0, 100)}`);
    return false;
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  log("🏈 Starting fixture fetch...");

  if (!FOOTBALL_API_KEY) {
    log("❌ FOOTBALL_API_KEY not set! Register at https://www.football-data.org/client/register");
    process.exit(1);
  }
  if (!PRIVATE_KEY) {
    log("❌ GENLAYER_PRIVATE_KEY not set!");
    process.exit(1);
  }

  // Create genlayer client
  const client = createClient({
    chain: testnetBradbury,
    account: PRIVATE_KEY,
  });

  // Get existing markets to avoid duplicates
  const existingIds = await getExistingMarketIds(client);
  log(`📋 ${existingIds.size} existing markets on contract`);

  let totalCreated = 0;

  // Fetch and create for each league
  for (const [leagueSlug, leagueCode] of Object.entries(LEAGUE_CODES)) {
    log(`\n🏆 Fetching ${leagueSlug} (${leagueCode})...`);

    const matches = await fetchUpcomingMatches(leagueCode);
    log(`  Found ${matches.length} scheduled matches`);

    const filtered = filterForOurTeams(matches, leagueSlug);
    log(`  ${filtered.length} matches involve our top 5 teams`);

    for (const fixture of filtered) {
      const marketId = `${fixture.league}_${fixture.home}_${fixture.away}_${fixture.date}`
        .replace(/ /g, "_").toLowerCase();

      if (existingIds.has(marketId)) {
        log(`  ⏭️ Already exists: ${fixture.home} vs ${fixture.away}`);
        continue;
      }

      const ok = await createMarket(client, fixture);
      if (ok) totalCreated++;

      // Rate limit: wait 2s between transactions
      await new Promise(r => setTimeout(r, 2000));
    }

    // API rate limit: wait 6s between leagues (10 req/min free tier)
    await new Promise(r => setTimeout(r, 6000));
  }

  log(`\n🎉 Done! Created ${totalCreated} new markets.`);
}

main().catch(err => {
  log(`❌ Fatal: ${err.message}`);
  process.exit(1);
});
