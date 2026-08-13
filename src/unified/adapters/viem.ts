import {
  ArcTestnet,
  ArbitrumSepolia,
  BaseSepolia,
} from "@circle-fin/app-kit/chains";
import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export async function createArcAdapter() {
  if (!window.ethereum) {
    throw new Error("Wallet provider not found.");
  }

  return await createViemAdapterFromProvider({
    provider: window.ethereum,
    capabilities: {
      supportedChains: [
        BaseSepolia,
        ArbitrumSepolia,
        ArcTestnet,
      ],
    },
  });
}