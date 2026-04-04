import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";

async function run() {
  const client = createClient({
    chain: testnetBradbury,
  });
  
  const hash = "0xbfdd0734b192dd57b9d83a2b3e26ba6f038dc3ea7002b001c9ae0fcc11ac7175";
  console.log("Fetching receipt...");
  const receipt = await client.waitForTransactionReceipt({ hash });
  console.log("FULL RECEIPT LOGGING:");
  console.dir(receipt, { depth: null });
}

run().catch(console.error);
