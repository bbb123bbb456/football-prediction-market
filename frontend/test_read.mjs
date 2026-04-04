import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";

async function run() {
  const client = createClient({
    chain: testnetBradbury,
  });
  
  const address = "0x1Ef6B4b71352c8803a69f2B5981543505967F593";
  console.log("Reading contract...");
  try {
    const raw = await client.readContract({
      address: address,
      functionName: "get_market_count",
      args: [],
    });
    console.log("Success:", raw);
  } catch (e) {
    console.error("Error:", e.message);
  }
}

run().catch(console.error);
