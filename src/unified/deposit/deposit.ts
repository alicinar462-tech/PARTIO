import { AppKit } from "@circle-fin/app-kit";
import { resolveChainIdentifier } from "@circle-fin/adapter-viem-v2";

const kit = new AppKit();

export async function depositUSDC(
  adapter: any,
  amount: string = "1.00"
) {
  const chain = resolveChainIdentifier("Arc_Testnet");

  if (chain.type !== "evm") {
    throw new Error("Arc_Testnet is not an EVM chain.");
  }

  await adapter.ensureChain(chain);

  return await kit.unifiedBalance.deposit({
    from: {
      adapter,
      chain: "Arc_Testnet",
    },
    amount,
    token: "USDC",
  });
}