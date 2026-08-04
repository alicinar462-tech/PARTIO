import { createArcAdapter } from "../adapters/viem";
import { getUnifiedBalances } from "../gateway/balances";

export async function fetchUnifiedBalance() {
  const adapter = createArcAdapter();

  return getUnifiedBalances(adapter);
}