import { AppKit } from "@circle-fin/app-kit";
import { resolveChainIdentifier } from "@circle-fin/adapter-viem-v2";

const kit = new AppKit();

export async function spendUSDC(
  adapter: any,
  recipientAddress: `0x${string}`,
  amount: string
) {
  const chain = resolveChainIdentifier("Arc_Testnet");

  if (chain.type !== "evm") {
    throw new Error("Arc_Testnet is not an EVM chain.");
  }

  await adapter.ensureChain(chain);

  return await kit.unifiedBalance.spend({
    amount,
    token: "USDC",

    from: {
      adapter,
    },

    to: {
      adapter,
      chain: "Arc_Testnet",
      recipientAddress,
    },
  });
}