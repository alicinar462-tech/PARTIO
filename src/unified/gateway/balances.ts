import { kit } from "./client";

export async function getUnifiedBalances(adapter: any) {
  return await kit.unifiedBalance.getBalances({
    sources: [{ adapter }],
    networkType: "testnet",
    includePending: true,
  });
}