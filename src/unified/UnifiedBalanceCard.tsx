"use client";

import { useEffect, useState } from "react";

import {
  formatUnits,
  type Address,
} from "viem";

import {
  useAccount,
  useSwitchChain,
} from "wagmi";

import { arcMainnet } from "@/lib/wagmi";

import { createArcAdapter } from "./adapters/viem";
import { depositUSDC } from "./deposit/deposit";

const ARC_NATIVE_DECIMALS = 18;

const ARC_CHAIN_ID_HEX = "0x13b2";

type DepositChain =
  | "Base"
  | "Arbitrum";

type EthereumProvider = {
  request: (args: {
    method: string;
    params?: unknown[];
  }) => Promise<unknown>;
};

export default function UnifiedBalanceCard() {
  const {
    address,
  } = useAccount();

  const {
    switchChainAsync,
  } = useSwitchChain();

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
    useState<DepositChain>("Base");

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const totalAvailable =
    (
      Number(confirmed) +
      Number(walletBalance)
    ).toFixed(6);

  function getEthereumProvider():
    EthereumProvider | null {
    if (
      typeof window ===
      "undefined"
    ) {
      return null;
    }

    const ethereum =
      (
        window as Window & {
          ethereum?: EthereumProvider;
        }
      ).ethereum;

    return ethereum ?? null;
  }

  async function getCurrentProviderChainId() {
    const ethereum =
      getEthereumProvider();

    if (!ethereum) {
      return null;
    }

    const result =
      await ethereum.request({
        method: "eth_chainId",
      });

    if (
      typeof result !==
      "string"
    ) {
      return null;
    }

    return result.toLowerCase();
  }

  async function waitForArcNetwork(
    timeoutMs = 5000
  ) {
    const startedAt =
      Date.now();

    while (
      Date.now() -
        startedAt <
      timeoutMs
    ) {
      try {
        const chainId =
          await getCurrentProviderChainId();

        if (
          chainId ===
          ARC_CHAIN_ID_HEX
        ) {
          return true;
        }
      } catch {
        // Provider may be updating
        // its selected network.
      }

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            200
          )
      );
    }

    return false;
  }

  useEffect(() => {
    if (!address) {
      setConfirmed(
        "0.000000"
      );

      setPending(
        "0.000000"
      );

      setWalletBalance(
        "0.000000"
      );

      return;
    }

    refreshBalance();
  }, [
    address,
  ]);

  async function getWalletUSDCBalance(
    walletAddress: Address
  ) {
    const ethereum =
      getEthereumProvider();

    if (!ethereum) {
      throw new Error(
        "Wallet provider not found."
      );
    }

    const chainId =
      await getCurrentProviderChainId();

    /*
     * The wallet value shown here is
     * specifically the native USDC balance
     * on ARC Mainnet.
     *
     * Never read the native balance while the
     * wallet is connected to Base or Arbitrum.
     */
    if (
      chainId !==
      ARC_CHAIN_ID_HEX
    ) {
      return null;
    }

    const result =
      await ethereum.request({
        method:
          "eth_getBalance",
        params: [
          walletAddress,
          "latest",
        ],
      });

    if (
      typeof result !==
        "string" ||
      !result.startsWith("0x")
    ) {
      throw new Error(
        "Unable to read wallet balance."
      );
    }

    return BigInt(result);
  }

  async function refreshBalance(
    silent = false
  ) {
    try {
      setRefreshing(true);

      if (!silent) {
        setError(null);
      }

      /*
       * Unified Balance is independent from
       * the currently selected browser wallet
       * network.
       */
      const adapter =
        await createArcAdapter();

      const balance =
        await import(
          "./gateway/balances"
        ).then(
          ({
            getUnifiedBalances,
          }) =>
            getUnifiedBalances(
              adapter
            )
        );

      console.log(
        "[PARTIO] Unified Balance Raw Result",
        balance
      );

      setConfirmed(
        balance.totalConfirmedBalance ??
          "0.000000"
      );

      setPending(
        balance.totalPendingBalance ??
          "0.000000"
      );

      /*
       * Read the actual provider network.
       *
       * We intentionally do not use the React
       * chain state here because after a wallet
       * switch it can take a moment to update.
       */
      if (address) {
        const wallet =
          await getWalletUSDCBalance(
            address
          );

        if (
          wallet !== null
        ) {
          setWalletBalance(
            formatUnits(
              wallet,
              ARC_NATIVE_DECIMALS
            )
          );
        } else {
          /*
           * Wallet is currently on Base/
           * Arbitrum/etc. Therefore its native
           * balance must not be presented as
           * ARC USDC.
           */
          setWalletBalance(
            "0.000000"
          );
        }
      } else {
        setWalletBalance(
          "0.000000"
        );
      }
    } catch (err) {
      console.error(
        "[PARTIO] Balance Refresh Error",
        err
      );

      /*
       * Silent refreshes happen immediately
       * after deposit/network transitions.
       *
       * Do not flash a red error box to the
       * user during that transition.
       */
      if (!silent) {
        setError(
          "Unable to refresh balance."
        );
      }
    } finally {
      setRefreshing(false);
    }
  }

  async function switchBackToArc() {
    const ethereum =
      getEthereumProvider();

    if (!ethereum) {
      console.error(
        "[PARTIO] Wallet provider not found while switching back to ARC."
      );

      return false;
    }

    /*
     * First check the REAL provider chain.
     * This avoids relying on a stale React
     * chainId immediately after deposit.
     */
    try {
      const currentChainId =
        await getCurrentProviderChainId();

      if (
        currentChainId ===
        ARC_CHAIN_ID_HEX
      ) {
        return true;
      }
    } catch {
      // Continue with switch attempt.
    }

    /*
     * Primary path:
     * let wagmi perform the network switch.
     */
    try {
      await switchChainAsync({
        chainId:
          arcMainnet.id,
      });

      const switched =
        await waitForArcNetwork();

      if (switched) {
        return true;
      }
    } catch (err) {
      console.warn(
        "[PARTIO] Wagmi ARC switch did not complete:",
        err
      );
    }

    /*
     * Fallback:
     * directly request the switch from the
     * connected browser wallet provider.
     *
     * This is particularly useful for wallets
     * that update their internal network state
     * slightly differently from wagmi.
     */
    try {
      await ethereum.request({
        method:
          "wallet_switchEthereumChain",
        params: [
          {
            chainId:
              ARC_CHAIN_ID_HEX,
          },
        ],
      });

      const switched =
        await waitForArcNetwork();

      if (switched) {
        return true;
      }
    } catch (err) {
      console.warn(
        "[PARTIO] Direct ARC switch did not complete:",
        err
      );
    }

    return false;
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
        "[PARTIO] Deposit Started"
      );

      const result =
        await depositUSDC(
          adapter,
          depositAmount,
          depositChain
        );

      console.log(
        "[PARTIO] Deposit Result"
      );

      console.log(
        result
      );

      /*
       * Circle deposit may have moved the
       * browser wallet to Base or
       * Arbitrum.
       *
       * Return to ARC before touching the
       * wallet balance again.
       */
      const switchedBack =
        await switchBackToArc();

      if (!switchedBack) {
        /*
         * Deposit itself succeeded.
         *
         * Do NOT show:
         * "Unable to refresh balance."
         *
         * The user should not see a scary
         * error merely because the wallet
         * provider did not immediately switch.
         */
        console.warn(
          "[PARTIO] Deposit completed, but ARC network could not be confirmed yet."
        );

        return;
      }

      /*
       * The wallet provider has now confirmed
       * ARC Mainnet.
       *
       * Give the wallet a short moment to
       * finish updating its internal state.
       */
      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            400
          )
      );

      /*
       * Silent refresh:
       * update the numbers without showing
       * a red error box during the transition.
       */
      await refreshBalance(
        true
      );
    } catch (err) {
      console.error(
        "[PARTIO] Deposit Error",
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-purple-400 shadow-[0_0_14px_rgba(155,92,255,0.8)]" />

          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Unified Balance
          </span>
        </div>

        <button
          onClick={() =>
            refreshBalance()
          }
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

      <div className="mt-3 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-white">
          USDC Balance
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Wallet and Unified Balance in one view.
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
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

      <div className="mt-5">
        <label className="mb-2 block text-sm text-slate-400">
          Deposit to Unified Balance
        </label>

        <div className="mb-3">
          <select
            value={
              depositChain
            }
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
            <option value="Base">
              Base
            </option>

            <option value="Arbitrum">
              Arbitrum
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
            disabled={
              loading
            }
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