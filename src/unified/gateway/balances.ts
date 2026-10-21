import { kit } from "./client";

export async function getUnifiedBalances(adapter: any) {
  return kit.unifiedBalance.getBalances({
    sources: {
      adapter,
    },
    networkType: "mainnet",
    includePending: false,
  });
}