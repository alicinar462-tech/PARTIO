// src/unified/hooks/useUnifiedBalance.ts

import { useCallback, useState } from "react";
import { fetchUnifiedBalance } from "../services/balance.service";

export function useUnifiedBalance() {
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchUnifiedBalance();
      setBalance(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    balance,
    loading,
    error,
    refresh,
  };
}