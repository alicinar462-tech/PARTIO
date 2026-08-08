"use client";

import { useEffect, useState } from "react";

import {
  formatUnits,
  type Address,
} from "viem";

import {
  useAccount,
  usePublicClient,
} from "wagmi";

import { createArcAdapter } from "./adapters/viem";
import { depositUSDC } from "./deposit/deposit";

const USDC_ADDRESS =
  "0x3600000000000000000000000000000000000000" as const;

const USDC_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [
      {
        name: "account",
        type: "address",
      },
    ],
    outputs: [
      {
        name: "balance",
        type: "uint256",
      },
    ],
  },
] as const;

export default function UnifiedBalanceCard() {
  const { address } =
    useAccount();

  const publicClient =
    usePublicClient();

  const [loading, setLoading] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [confirmed, setConfirmed] =
    useState("0.000000");

  const [pending, setPending] =
    useState("0.000000");

  const [walletBalance, setWalletBalance] =
    useState("0.000000");

  const [depositAmount, setDepositAmount] =
    useState("1.00");

  const [
    error,
    setError,
  ] = useState<string | null>(
    null
  );

  const totalAvailable =
    (
      Number(confirmed) +
      Number(walletBalance)
    ).toFixed(6);

  useEffect(() => {
    refreshBalance();
  }, [address]);

  async function getWalletUSDCBalance(
    walletAddress: Address
  ) {
    if (!publicClient) {
      return 0n;
    }

    return await publicClient.readContract({
      address:
        USDC_ADDRESS,

      abi:
        USDC_ABI,

      functionName:
        "balanceOf",

      args: [
        walletAddress,
      ],
    });
  }

  async function refreshBalance() {
    try {
      setRefreshing(true);
      setError(null);

      const adapter =
        await createArcAdapter();

      const balance =
        await import(
          "./gateway/balances"
        ).then(
          ({ getUnifiedBalances }) =>
            getUnifiedBalances(
              adapter
            )
        );

      setConfirmed(
        balance.totalConfirmedBalance ??
          "0.000000"
      );

      setPending(
        balance.totalPendingBalance ??
          "0.000000"
      );

      if (
        address &&
        publicClient
      ) {
        const wallet =
          await getWalletUSDCBalance(
            address
          );

        setWalletBalance(
          formatUnits(
            wallet,
            6
          )
        );
      } else {
        setWalletBalance(
          "0.000000"
        );
      }
    } catch (err) {
      console.error(
        "Balance Refresh Error",
        err
      );

      setError(
        "Unable to refresh balance."
      );
    } finally {
      setRefreshing(false);
    }
  }

  async function handleDeposit() {
    try {
      setLoading(true);
      setError(null);

      const amount =
        Number(
          depositAmount
        );

      if (
        !Number.isFinite(
          amount
        ) ||
        amount <= 0
      ) {
        throw new Error(
          "Enter a valid deposit amount."
        );
      }

      const adapter =
        await createArcAdapter();

      console.log(
        "Deposit Started"
      );

      const result =
        await depositUSDC(
          adapter,
          depositAmount
        );

      console.log(
        "Deposit Result"
      );

      console.log(
        result
      );

      await refreshBalance();
    } catch (err) {
      console.error(
        "Deposit Error",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Deposit failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6">

      <div className="flex items-center justify-between">

        <h2 className="text-xl font-semibold">
          USDC Balance
        </h2>

        <button
          onClick={refreshBalance}
          disabled={
            refreshing ||
            loading
          }
          className="rounded-lg bg-neutral-800 px-3 py-2 text-sm hover:bg-neutral-700 disabled:opacity-50"
        >
          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>

      </div>

      <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900 p-5">

        <div className="flex items-center justify-between">

          <span className="text-sm text-neutral-400">
            Available
          </span>

          <span className="text-2xl font-bold">
            {totalAvailable} USDC
          </span>

        </div>

        <div className="mt-5 space-y-3">

          <div className="flex justify-between text-sm">

            <span className="text-neutral-500">
              Wallet
            </span>

            <span>
              {walletBalance} USDC
            </span>

          </div>

          <div className="flex justify-between text-sm">

            <span className="text-neutral-500">
              Deposit
            </span>

            <span>
              {confirmed} USDC
            </span>

          </div>

          <div className="flex justify-between text-sm">

            <span className="text-neutral-500">
              Pending
            </span>

            <span>
              {pending} USDC
            </span>

          </div>

        </div>

      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="mt-8">

        <label className="mb-2 block text-sm text-neutral-400">
          Deposit to Unified Balance
        </label>

        <input
          value={
            depositAmount
          }
          onChange={(e) =>
            setDepositAmount(
              e.target.value
            )
          }
          inputMode="decimal"
          placeholder="1.00"
          disabled={loading}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-indigo-500 disabled:opacity-50"
        />

        <button
          onClick={
            handleDeposit
          }
          disabled={
            loading ||
            refreshing
          }
          className="mt-3 w-full rounded-lg bg-indigo-600 px-6 py-3 font-semibold hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Processing..."
            : `Deposit ${depositAmount} USDC`}
        </button>

        <p className="mt-3 text-xs leading-5 text-neutral-500">
          Deposits may take some time to become
          available in Unified Balance.
        </p>

      </div>

    </div>
  );
}