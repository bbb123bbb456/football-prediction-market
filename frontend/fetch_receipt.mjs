import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import fs from "fs";

async function run() {
  const client = createClient({ chain: testnetBradbury });
  try {
    const txHash = "0xbfdd0734b192dd57b9d83a2b3e26ba6f038dc3ea7002b001c9ae0fcc11ac7175";
    const receipt = await client.waitForTransactionReceipt({ hash: txHash });
    console.log("Error details:", receipt.error);
    console.log("Execution result:", receipt.executionResult);
    fs.writeFileSync("receipt_dump.json", JSON.stringify(receipt, null, 2));
    console.log("Dumped receipt");
  } catch (e) {
    console.error("RPC Error:", e);
  }
}
run();
