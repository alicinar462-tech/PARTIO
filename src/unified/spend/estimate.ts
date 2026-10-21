
import { kit } from "@/src/unified/gateway/client";

export async function estimateSpend(
  adapter: any,
  recipientAddress: `0x${string}`,
  amount: string
) {
  return await kit.unifiedBalance.estimateSpend({
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
}
