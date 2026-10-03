import {
  Arc,
  Arbitrum,
  Base,
} from "@circle-fin/app-kit/chains";

import {
  createViemAdapterFromProvider,
} from "@circle-fin/adapter-viem-v2";

import type {
  EIP1193Provider,
} from "viem";


declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}


export async function createArcAdapter(
  provider?: EIP1193Provider
) {

  const walletProvider =
    provider ?? window.ethereum;

  if (!walletProvider) {
    throw new Error(
      "Wallet provider not found."
    );
  }


  return await createViemAdapterFromProvider({
    provider: walletProvider,

    capabilities: {
      supportedChains: [
        Base,
        Arbitrum,
        Arc,
      ],
    },
  });

}