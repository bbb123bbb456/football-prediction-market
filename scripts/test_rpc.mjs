import { createClient, createAccount } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import fs from "fs";

async function run() {
  const account = createAccount(process.env.GENLAYER_PRIVATE_KEY);
  const client = createClient({ chain: testnetBradbury, account });

  const code = fs.readFileSync("contracts/test_basic.py", "utf8");
  
  console.log("Deploying basic test contract...");
  const txHash = await client.deployContract({
    code,
    args: [],
  });

  console.log("Tx Hash:", txHash);
  const receipt = await client.waitForTransactionReceipt({ hash: txHash });
  const addr = receipt.txDataDecoded?.contractAddress || receipt.contractAddress;
  console.log("Address:", addr);
  console.log("Status:", receipt.status_name);
  
  console.log("Reading...");
  try {
    const raw = await client.readContract({
      address: addr,
      functionName: "hello",
      args: [],
    });
    console.log("Success! Read:", raw);
  } catch (e) {
    console.error("Read failed:", e.message);
  }
}
run().catch(console.error);
