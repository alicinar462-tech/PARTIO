
import { formatUnits } from "viem";
import { kit } from "@/src/unified/gateway/client";

const UNIFIED_RESERVES = [
  10_000n,
  20_000n,
  50_000n,
  100_000n,
  250_000n,
  500_000n,
  1_000_000n,
] as const;

const FALLBACK_RESERVE = 2_000_000n;
const USDC_DECIMALS = 6;

type ErrorInfo = {
  code?: unknown;
  name?: unknown;
  cause?: unknown;
};

function getErrorChain(error: unknown): ErrorInfo[] {
  const chain: ErrorInfo[] = [];
  const visited = new Set<object>();
  let current: unknown = error;

  while (
    typeof current === "object" &&
    current !== null &&
    !visited.has(current)
  ) {
    visited.add(current);
    const item = current as ErrorInfo;
    chain.push(item);
    current = item.cause;
  }

  return chain;
}

function isExpectedBalanceError(error: unknown): boolean {
  return getErrorChain(error).some(
    (candidate) =>
      candidate.code === 9001 ||
      candidate.code === 9002 ||
      candidate.code === 9003 ||
      candidate.name === "BALANCE_INSUFFICIENT_TOKEN" ||
      candidate.name === "BALANCE_INSUFFICIENT_GAS" ||
      candidate.name === "BALANCE_INSUFFICIENT_ALLOWANCE",
  );
}

function isLiquidityError(error: unknown): boolean {
  return getErrorChain(error).some(
    (candidate) =>
      candidate.code === 6001 ||
      candidate.name === "LIQUIDITY_INSUFFICIENT",
  );
}

async function canSpendAmount(
  adapter: any,
  destinationAddress: `0x${string}`,
  amountUnits: bigint,
): Promise<boolean> {
  if (amountUnits <= 0n) {
    return false;
  }

  try {
    await kit.unifiedBalance.estimateSpend({
      amount: formatUnits(amountUnits, USDC_DECIMALS),
      token: "USDC",
      from: {
        adapter,
      },
      to: {
        adapter,
        chain: "Arc",
        recipientAddress: destinationAddress,
      },
    });

    return true;
  } catch (error) {
    if (isExpectedBalanceError(error)) {
      return false;
    }

    if (isLiquidityError(error)) {
      console.warn(
        "[PARTIO] Unified Balance liquidity is insufficient for the requested amount.",
        error,
      );
      return false;
    }

    throw error;
  }
}

export async function findMaxUnifiedSpend(
  adapter: any,
  maxAmountUnits: bigint,
  destinationAddress: `0x${string}`,
): Promise<bigint> {
  if (maxAmountUnits <= 0n) {
    return 0n;
  }

  // Try the full amount first.
  if (
    await canSpendAmount(
      adapter,
      destinationAddress,
      maxAmountUnits,
    )
  ) {
    return maxAmountUnits;
  }

  // Try progressively larger reserves, starting at 0.01 USDC.
  for (const reserve of UNIFIED_RESERVES) {
    if (reserve >= maxAmountUnits) {
      continue;
    }

    const candidate = maxAmountUnits - reserve;

    if (
      await canSpendAmount(
        adapter,
        destinationAddress,
        candidate,
      )
    ) {
      return candidate;
    }
  }

  // Preserve the existing 2 USDC fallback.
  if (maxAmountUnits > FALLBACK_RESERVE) {
    const fallbackAmount =
      maxAmountUnits - FALLBACK_RESERVE;

    if (
      await canSpendAmount(
        adapter,
        destinationAddress,
        fallbackAmount,
      )
    ) {
      return fallbackAmount;
    }
  }

  return 0n;
}
