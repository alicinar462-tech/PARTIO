"use client";

import { useEffect, useState } from "react";

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

  const [depositAmount, setDepositAmount] =
    useState("1.00");

  const [spendAmount, setSpendAmount] =
    useState("1.00");

  useEffect(() => {
    refreshBalance();
  }, []);

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
          depositAmount
        );

      console.log("Deposit Result");
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
          spendAmount
        );

      console.log("Spend Result");
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

          <span className="font-semibold">
            {confirmed} USDC
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-neutral-400">
            Pending
          </span>

          <span className="font-semibold">
            {pending} USDC
          </span>
        </div>

      </div>

      <div className="mt-8">

        <label className="mb-2 block text-sm text-neutral-400">
          Deposit Amount
        </label>

        <input
          value={depositAmount}
          onChange={(e) =>
            setDepositAmount(e.target.value)
          }
          className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-indigo-500"
        />

        <button
          onClick={handleDeposit}
          disabled={loading}
          className="mt-3 w-full rounded-lg bg-indigo-600 px-6 py-3 font-semibold hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading
            ? "Processing..."
            : `Deposit ${depositAmount} USDC`}
        </button>

      </div>

      <div className="mt-8">

        <label className="mb-2 block text-sm text-neutral-400">
          Spend Amount
        </label>

        <input
          value={spendAmount}
          onChange={(e) =>
            setSpendAmount(e.target.value)
          }
          className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-green-500"
        />

        <button
          onClick={handleSpend}
          disabled={loading}
          className="mt-3 w-full rounded-lg bg-green-600 px-6 py-3 font-semibold hover:bg-green-700 disabled:opacity-50"
        >
          {loading
            ? "Processing..."
            : `Spend ${spendAmount} USDC`}
        </button>

      </div>

    </div>
  );
}