import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { defineChain } from "viem";

export const arcTestnet = defineChain({
  id: 5042002,
  name: "ARC Testnet",
  network: "arc-testnet",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.arc.io"],
    },
  },
  blockExplorers: {
    default: {
      name: "ArcScan",
      url: "https://testnet.arcscan.app",
    },
  },
  testnet: true,
});

export const config = createConfig({
  chains: [arcTestnet],
  connectors: [
    injected({
      target: "metaMask",
      shimDisconnect: true,
    }),
  ],
  transports: {
    [arcTestnet.id]: http("https://rpc.testnet.arc.io"),
  },
});