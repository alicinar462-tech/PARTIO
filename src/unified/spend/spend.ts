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

  const spendParams = {
    amount,
    token: "USDC" as const,

    from: {
      adapter,
    },

    to: {
      adapter,
      chain: "Arc" as const,
      recipientAddress,
    },
  };

  let result;

  try {
    result =
      await kit.unifiedBalance.spend(
        spendParams
      );
  } catch (error) {
    const cause =
      error as {
        cause?: {
          trace?: {
            attestation?: string;
            signature?: string;
          };
        };
      };

    const trace =
      cause?.cause?.trace;

    const attestation =
      trace?.attestation;

    const signature =
      trace?.signature;

    if (
      typeof attestation ===
        "string" &&
      typeof signature ===
        "string" &&
      attestation.length > 0 &&
      signature.length > 0
    ) {
      console.log(
        "[PARTIO] Mint failed. Retrying with Circle attestation..."
      );

      result =
        await kit.unifiedBalance.spend({
          ...spendParams,

          config: {
            retry: {
              attestation,
              signature,
            },
          },
        });

      console.log(
        "[PARTIO] Circle mint retry completed."
      );
    } else {
      throw error;
    }
  }

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