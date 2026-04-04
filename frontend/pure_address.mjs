import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import fs from "fs";

async function run() {
  const client = createClient({
    chain: testnetBradbury,
  });
  
  const hash = "0xbfdd0734b192dd57b9d83a2b3e26ba6f038dc3ea7002b001c9ae0fcc11ac7175";
  const receipt = await client.waitForTransactionReceipt({ hash });
  
  fs.writeFileSync("pure_address.txt", receipt.contractAddress);
}

run().catch(console.error);
