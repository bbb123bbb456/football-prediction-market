import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("FootballPredictionMarketModule", (m) => {
  // Pass the relayer address (the one running the Node.js bridge script)
  // Default to deploying with standard owner address for local testing,
  // but in production, we should pass the relayer wallet address.
  const relayerAddress = m.getAccount(0);

  const market = m.contract("FootballPredictionMarket", [relayerAddress]);

  return { market };
});
