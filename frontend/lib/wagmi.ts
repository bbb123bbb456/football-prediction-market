import { http, createConfig } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

export const config = createConfig({
  chains: [baseSepolia],
  connectors: [
    injected(),
  ],
  transports: {
    [baseSepolia.id]: http(),
  },
})

export const predictionMarketAbi = [
  {
    "inputs": [{"internalType": "address", "name": "_relayer", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": false, "internalType": "string", "name": "id", "type": "string"},
      {"indexed": false, "internalType": "address", "name": "bettor", "type": "address"},
      {"indexed": false, "internalType": "uint8", "name": "prediction", "type": "uint8"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "BetPlaced",
    "type": "event"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "_id", "type": "string"},
      {"internalType": "string", "name": "_league", "type": "string"},
      {"internalType": "string", "name": "_homeTeam", "type": "string"},
      {"internalType": "string", "name": "_awayTeam", "type": "string"},
      {"internalType": "uint256", "name": "_matchTimestamp", "type": "uint256"}
    ],
    "name": "createMarket",
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "_id", "type": "string"},
      {"internalType": "uint8", "name": "_prediction", "type": "uint8"}
    ],
    "name": "placeBet",
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "string", "name": "_id", "type": "string"}],
    "name": "requestResolution",
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "string", "name": "_id", "type": "string"}],
    "name": "claimWinnings",
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllMarkets",
    "stateMutability": "view",
    "type": "function",
    "outputs": [
      {
        "components": [
          {"internalType": "string", "name": "id", "type": "string"},
          {"internalType": "string", "name": "league", "type": "string"},
          {"internalType": "string", "name": "homeTeam", "type": "string"},
          {"internalType": "string", "name": "awayTeam", "type": "string"},
          {"internalType": "uint256", "name": "matchTimestamp", "type": "uint256"},
          {"internalType": "uint8", "name": "state", "type": "uint8"},
          {"internalType": "uint256", "name": "homePool", "type": "uint256"},
          {"internalType": "uint256", "name": "awayPool", "type": "uint256"},
          {"internalType": "uint256", "name": "drawPool", "type": "uint256"},
          {"internalType": "uint256", "name": "totalPool", "type": "uint256"}
        ],
        "internalType": "struct FootballPredictionMarket.Market[]",
        "name": "",
        "type": "tuple[]"
      }
    ]
  },
  {
    "inputs": [
      {"internalType": "string", "name": "_id", "type": "string"},
      {"internalType": "address", "name": "_user", "type": "address"},
      {"internalType": "uint8", "name": "_prediction", "type": "uint8"}
    ],
    "name": "getBetAmount",
    "stateMutability": "view",
    "type": "function",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}]
  }
] as const;
