import { simulator, createAccount } from "genlayer-js/chains";
import { createClient, http } from "genlayer-js";
import path from "path";
import fs from "fs";

const main = async () => {
  const client = createClient({ chain: simulator, transport: http() });
  const account = createAccount();

  // Contract dosyasını oku
  const contractPath = path.resolve(
    __dirname,
    "../contracts/prediction_market.py"
  );
  const contractCode = fs.readFileSync(contractPath, "utf-8");

  console.log("Deploying PredictionMarket contract...");

  const receipt = await client.deployContract({
    account,
    code: contractCode,
    args: [],
  });

  console.log("✅ Contract deployed!");
  console.log("📍 Address:", receipt.contractAddress);
  console.log("");
  console.log("👉 Bu adresi kopyala ve şu dosyaya yapıştır:");
  console.log("   frontend/.env → NEXT_PUBLIC_CONTRACT_ADDRESS=<bu_adres>");
};

main().catch((err) => {
  console.error("❌ Deploy failed:", err);
  process.exit(1);
});
