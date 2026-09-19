import { AppKit } from "@circle-fin/app-kit";
import { resolveChainIdentifier } from "@circle-fin/adapter-viem-v2";

const kit = new AppKit();

export async function depositUSDC(
  adapter: any,
  amount: string = "1.00",
  chainName: "Base" | "Arbitrum" = "Base"
) {
  const chain = resolveChainIdentifier(chainName);

  if (chain.type !== "evm") {
    throw new Error(`${chainName} is not an EVM chain.`);
  }

  await adapter.ensureChain(chain);

  return await kit.unifiedBalance.deposit({
    from: {
      adapter,
      chain: chainName,
    },
    amount,
    token: "USDC",
  });
}