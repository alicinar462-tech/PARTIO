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

type DepositChain =
  | "Base_Sepolia"
  | "Arbitrum_Sepolia";

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

  const [depositChain, setDepositChain] =
    useState<DepositChain>(
      "Base_Sepolia"
    );

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
          depositAmount,
          depositChain
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
    <div className="partio-card rounded-2xl p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
      {/* Section label + refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-purple-400 shadow-[0_0_14px_rgba(155,92,255,0.8)]" />

          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Unified Balance
          </span>
        </div>

        <button
          onClick={refreshBalance}
          disabled={
            refreshing ||
            loading
          }
          className="rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm font-medium text-white transition hover:border-slate-500 hover:bg-slate-800 disabled:opacity-50"
        >
          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>

      {/* Centered heading */}
      <div className="mt-3 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-white">
          USDC Balance
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Wallet and Unified Balance in one view.
        </p>
      </div>

      {/* Balance cards */}
      <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {/* Total */}
        <div className="rounded-xl border border-indigo-400/15 bg-[#080d2d]/80 p-4">
          <p className="partio-label mb-2">
            Total Available
          </p>

          <p className="text-2xl font-bold tracking-tight text-white">
            {totalAvailable}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            USDC
          </p>
        </div>

        {/* Wallet */}
        <div className="rounded-xl border border-indigo-400/15 bg-[#080d2d]/80 p-4">
          <p className="partio-label mb-2">
            Wallet
          </p>

          <p className="text-xl font-bold text-white">
            {walletBalance}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            USDC
          </p>
        </div>

        {/* Deposit */}
        <div className="rounded-xl border border-indigo-400/15 bg-[#080d2d]/80 p-4">
          <p className="partio-label mb-2">
            Deposit
          </p>

          <p className="text-xl font-bold text-purple-300">
            {confirmed}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            USDC
          </p>
        </div>

        {/* Pending */}
        <div className="rounded-xl border border-indigo-400/15 bg-[#080d2d]/80 p-4">
          <p className="partio-label mb-2">
            Pending
          </p>

          <p className="text-xl font-bold text-slate-300">
            {pending}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            USDC
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Deposit */}
      <div className="mt-5">
        <label className="mb-2 block text-sm text-slate-400">
          Deposit to Unified Balance
        </label>

        <div className="mb-3">
          <select
            value={depositChain}
            onChange={(e) =>
              setDepositChain(
                e.target.value as DepositChain
              )
            }
            disabled={
              loading ||
              refreshing
            }
            className="w-full rounded-lg border border-slate-700 bg-[#080d2d]/80 px-4 py-3 text-white outline-none transition focus:border-indigo-500 disabled:opacity-50"
          >
            <option value="Base_Sepolia">
              Base Sepolia
            </option>

            <option value="Arbitrum_Sepolia">
              Arbitrum Sepolia
            </option>
          </select>
        </div>

        <div className="flex gap-3">
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
            className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-[#080d2d]/80 px-4 py-3 outline-none transition focus:border-indigo-500 disabled:opacity-50"
          />

          <button
            onClick={
              handleDeposit
            }
            disabled={
              loading ||
              refreshing
            }
            className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Processing..."
              : "Deposit"}
          </button>
        </div>

        <p className="mt-2 text-xs leading-5 text-slate-500">
          Deposits may take some time to become
          available in Unified Balance.
        </p>
      </div>
    </div>
  );
}