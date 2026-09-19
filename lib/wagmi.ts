import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { defineChain } from "viem";

export const arcMainnet = defineChain({
  id: 5042,
  name: "Arc Mainnet",
  network: "arc-mainnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.mainnet.arc.io"],
    },
  },
  blockExplorers: {
    default: {
      name: "ArcScan",
      url: "https://arcscan.app",
    },
  },
});

export const config = createConfig({
  chains: [arcMainnet],
  connectors: [
    injected({
      shimDisconnect: true,
    }),
  ],
  transports: {
    [arcMainnet.id]: http(
      "https://rpc.mainnet.arc.io"
    ),
  },
});