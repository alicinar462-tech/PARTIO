// src/unified/config.ts

export const unifiedConfig = {
  appName: "PARTIO",

  environment: "sandbox",

  supportedChains: [
    "arc",
    "base",
    "ethereum",
    "arbitrum",
    "optimism",
  ] as const,
};

export type SupportedChain =
  (typeof unifiedConfig.supportedChains)[number];