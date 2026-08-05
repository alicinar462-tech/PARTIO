"use client";

import { useState } from "react";

import { createArcAdapter } from "./adapters/viem";
import { depositUSDC } from "./deposit/deposit";
import { testUnifiedBalance } from "./test";

export default function UnifiedBalanceCard() {
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState("0.000000");
  const [pending, setPending] = useState("0.000000");

  async function refreshBalance() {
    const balance = await testUnifiedBalance();

    setConfirmed(balance.totalConfirmedBalance ?? "0.000000");
    setPending(balance.totalPendingBalance ?? "0.000000");
  }

  async function handleDeposit() {
    try {
      setLoading(true);

      const adapter = await createArcAdapter();

      const result = await depositUSDC(adapter, "1.00");

      console.log(result);

      await refreshBalance();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Unified Balance
        </h2>

        <button
          onClick={refreshBalance}
          className="rounded bg-neutral-800 px-3 py-2 text-sm hover:bg-neutral-700"
        >
          Refresh
        </button>
      </div>

      <div className="mt-6 space-y-2">
        <div className="flex justify-between">
          <span className="text-neutral-400">
            Confirmed
          </span>

          <span>{confirmed} USDC</span>
        </div>

        <div className="flex justify-between">
          <span className="text-neutral-400">
            Pending
          </span>

          <span>{pending} USDC</span>
        </div>
      </div>

      <button
        onClick={handleDeposit}
        disabled={loading}
        className="mt-6 w-full rounded-lg bg-indigo-600 px-6 py-3 font-semibold hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading
          ? "Depositing..."
          : "Deposit 1.00 USDC"}
      </button>
    </div>
  );
}