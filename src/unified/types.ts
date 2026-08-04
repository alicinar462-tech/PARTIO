// src/unified/types.ts

import type { SupportedChain } from "./config";

export interface ChainBalance {
  chain: SupportedChain;
  symbol: string;
  balance: string;
  available: string;
  pending: string;
}

export interface UnifiedBalance {
  total: string;
  balances: ChainBalance[];
}

export interface Recipient {
  address: string;
  amount: string;
}

export interface SpendEstimate {
  total: string;
  fee: string;
  routes: {
    chain: SupportedChain;
    amount: string;
  }[];
}

export interface SpendRequest {
  recipients: Recipient[];
}