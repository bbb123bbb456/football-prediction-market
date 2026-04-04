#!/usr/bin/env node
// ============================================================================
// deploy_to_testnet.mjs — Force deploy contract to Bradbury Testnet
// ============================================================================

import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import { privateKeyToAccount } from "viem/accounts";
import fs from "fs";
import { PRIVATE_KEY, log } from "./config.mjs";

async function main() {
  log("🚀 Deploying PredictionMarket to Bradbury Testnet...");

  if (!PRIVATE_KEY) {
    log("❌ GENLAYER_PRIVATE_KEY not set!");
    process.exit(1);
  }

  const account = privateKeyToAccount(PRIVATE_KEY);
  const client = createClient({
    chain: testnetBradbury,
    account: account,
  });

  const contractCode = new Uint8Array(fs.readFileSync("./contracts/prediction_market.py"));

  const deployTransaction = await client.deployContract({
    code: contractCode,
    args: [],
  });
  log(`⏳ Transaction sent! Hash: ${deployTransaction}`);

  const receipt = await client.waitForTransactionReceipt({
    hash: deployTransaction,
    status: "ACCEPTED",
    retries: 60,
    interval: 5000,
  });

  log(`✅ Contract successfully deployed to Bradbury!`);
  log(`🎯 Contract Address: ${receipt.contractAddress}`);
}

main().catch(err => {
  log(`❌ Fatal error: ${err.message}`);
  process.exit(1);
});
