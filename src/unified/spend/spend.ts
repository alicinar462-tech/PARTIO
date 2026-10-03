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

  console.log(
    "========== CIRCLE SPEND START =========="
  );

  console.log(
    "[CIRCLE SPEND] Requested amount:",
    amount
  );

  console.log(
    "[CIRCLE SPEND] Token:",
    "USDC"
  );

  console.log(
    "[CIRCLE SPEND] Destination chain:",
    "Arc"
  );

  console.log(
    "[CIRCLE SPEND] Destination:",
    recipientAddress
  );

  console.log(
    "[CIRCLE SPEND] Calling unifiedBalance.spend()..."
  );

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

  console.log(
    "[CIRCLE SPEND] spend() returned:"
  );

  console.dir(
    result,
    {
      depth: null,
    }
  );

  console.log(
    "[CIRCLE SPEND] Result keys:",
    result &&
      typeof result === "object"
      ? Object.keys(result)
      : []
  );

  console.log(
    "========== CIRCLE SPEND END =========="
  );

  return result;
}