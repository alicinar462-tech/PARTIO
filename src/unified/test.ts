import { createArcAdapter } from "./adapters/viem";
import { getUnifiedBalances } from "./gateway/balances";

export async function testUnifiedBalance() {
  try {
    console.log("Creating adapter...");

    const adapter = await createArcAdapter();

    console.log("Adapter:", adapter);

    const balances = await getUnifiedBalances(adapter);

    console.log("Unified Balance:", balances);

    return balances;
  } catch (err) {
    console.error("Unified Balance Error:", err);
  }
}