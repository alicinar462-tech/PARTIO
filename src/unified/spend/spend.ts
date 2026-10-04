import { AppKit } from "@circle-fin/app-kit";
import { resolveChainIdentifier } from "@circle-fin/adapter-viem-v2";

const kit = new AppKit();

export async function spendUSDC(
  adapter: any,
  recipientAddress: `0x${string}`,
  amount: string
) {
  const chain =
    resolveChainIdentifier("Arc");

  if (chain.type !== "evm") {
    throw new Error(
      "Arc is not an EVM chain."
    );
  }

  await adapter.ensureChain(chain);

  const result =
    await kit.unifiedBalance.spend({
      amount,
      token: "USDC",

      from: {
        adapter,
      },

      to: {
        adapter,
        chain: "Arc",
        recipientAddress,
      },
    });

  if (!result) {
    throw new Error(
      "Unified Balance spend returned no result."
    );
  }

  if (
    typeof result.txHash !== "string" ||
    !result.txHash.startsWith("0x")
  ) {
    throw new Error(
      "Unified Balance spend did not return a valid transaction hash."
    );
  }

  if (
    result.recipientAddress.toLowerCase() !==
    recipientAddress.toLowerCase()
  ) {
    throw new Error(
      "Unified Balance spend returned an unexpected recipient."
    );
  }

  if (
    result.destinationChain !==
    "Arc"
  ) {
    throw new Error(
      "Unified Balance spend returned an unexpected destination chain."
    );
  }

  return result;
}