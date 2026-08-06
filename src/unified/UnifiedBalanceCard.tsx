"use client";

import { useState } from "react";

import { createArcAdapter } from "./adapters/viem";
import { depositUSDC } from "./deposit/deposit";
import { spendUSDC } from "./spend/spend";
import { testUnifiedBalance } from "./test";

const TEST_RECIPIENT =
  "0x8D346b188cf92bB69e2fC2A7862517c65a819D10" as const;

export default function UnifiedBalanceCard() {
  const [loading, setLoading] = useState(false);

  const [confirmed, setConfirmed] =
    useState("0.000000");

  const [pending, setPending] =
    useState("0.000000");

  async function refreshBalance() {
    try {
      const balance =
        await testUnifiedBalance();

      setConfirmed(
        balance.totalConfirmedBalance ??
          "0.000000"
      );

      setPending(
        balance.totalPendingBalance ??
          "0.000000"
      );
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeposit() {
    try {
      setLoading(true);

      const adapter =
        await createArcAdapter();

      const result =
        await depositUSDC(
          adapter,
          "1.00"
        );

      console.log(
        "Deposit Result"
      );
      console.log(result);

      await refreshBalance();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSpend() {
    try {
      setLoading(true);

      const adapter =
        await createArcAdapter();

      const result =
        await spendUSDC(
          adapter,
          TEST_RECIPIENT,
          "1.00"
        );

      console.log(
        "Spend Result"
      );
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

          <span>
            {confirmed} USDC
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-neutral-400">
            Pending
          </span>

          <span>
            {pending} USDC
          </span>
        </div>
      </div>

      <button
        onClick={handleDeposit}
        disabled={loading}
        className="mt-6 w-full rounded-lg bg-indigo-600 px-6 py-3 font-semibold hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading
          ? "Processing..."
          : "Deposit 1.00 USDC"}
      </button>

      <button
        onClick={handleSpend}
        disabled={loading}
        className="mt-3 w-full rounded-lg bg-green-600 px-6 py-3 font-semibold hover:bg-green-700 disabled:opacity-50"
      >
        {loading
          ? "Processing..."
          : "Spend 1.00 USDC"}
      </button>
    </div>
  );
}