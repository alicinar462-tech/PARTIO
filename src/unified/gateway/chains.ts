import { kit } from "./client";

export async function getSupportedChains() {
  try {
    const chains = await kit.getSupportedChains("unifiedBalance");

    console.log("Supported Chains:", chains);

    return chains;
  } catch (error) {
    console.error(error);
    throw error;
  }
}