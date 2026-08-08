import { createArcAdapter } from "../adapters/viem";
import { spendUSDC } from "../spend/spend";

export async function partitionPayment(
  recipient: `0x${string}`,
  amount: string
) {
  const adapter = await createArcAdapter();

  return await spendUSDC(
    adapter,
    recipient,
    amount
  );
}