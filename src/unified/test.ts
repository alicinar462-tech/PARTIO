import { createArcAdapter } from "./adapters/viem";
import { getUnifiedBalances } from "./gateway/balances";

export async function testUnifiedBalance() {
  const adapter = await createArcAdapter();

  const balance = await getUnifiedBalances(adapter);

  console.log("Unified Balance:", balance);

  return balance;
}