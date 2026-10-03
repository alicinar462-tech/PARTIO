"use client";
import { useEffect, useRef, useState } from "react";
import {
  formatUnits,
  parseUnits,
  publicActions,
  type Address,
  type EIP1193Provider,
} from "viem";
import {
  useAccount,
  useConnectorClient,
  useWriteContract,
} from "wagmi";
import { AppKit } from "@circle-fin/app-kit";
import {
  PARTIO_VAULT_ABI,
} from "@/lib/contracts/partio";
import { createArcAdapter } from "@/src/unified/adapters/viem";
import { getUnifiedBalances } from "@/src/unified/gateway/balances";
import { spendUSDC } from "@/src/unified/spend/spend";
type PendingPayment = {
  paymentId: string;
  vaultAddress: string;
  recipients: {
    name: string;
    address: string;
    amount: string;
  }[];
  totalAmount: string;
};
type CompletedPayment = {
  paymentId: string;
  totalAmount: string;
  recipients: {
    name: string;
    address: string;
    amount: string;
  }[];
  txHash: string;
};
type PaymentStatus =
  | "checking"
  | "waiting"
  | "funding"
  | "funded"
  | "executed"
  | "error";
const STORAGE_KEY =
  "partio_pending_payments";
const USDC_DECIMALS = 6;
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
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "to",
        type: "address",
      },
      {
        name: "amount",
        type: "uint256",
      },
    ],
    outputs: [
      {
        name: "success",
        type: "bool",
      },
    ],
  },
] as const;
const UNIFIED_RESERVES = [
  10_000n,
  20_000n,
  50_000n,
  100_000n,
  250_000n,
  500_000n,
  1_000_000n,
] as const;
const kit = new AppKit();
function getStorageKey(
  address: Address
) {
  return `${STORAGE_KEY}_${address.toLowerCase()}`;
}
function shortenAddress(
  address: string
) {
  return `${address.slice(
    0,
    6
  )}...${address.slice(-4)}`;
}
function shortenHash(
  hash: string
) {
  return `${hash.slice(
    0,
    10
  )}...${hash.slice(-8)}`;
}
export default function PendingPayments() {
  const {
    address,
    connector,
  } = useAccount();
  const {
    data: connectorClient,
  } = useConnectorClient();
  const {
    writeContractAsync,
  } = useWriteContract();
  const [
    payments,
    setPayments,
  ] = useState<PendingPayment[]>([]);
  const [
    statuses,
    setStatuses,
  ] = useState<
    Record<string, PaymentStatus>
  >({});
  const [
    balances,
    setBalances,
  ] = useState<
    Record<string, string>
  >({});
  const [
    loadingPayment,
    setLoadingPayment,
  ] = useState<string | null>(
    null
  );
  const [
    error,
    setError,
  ] = useState<string | null>(
    null
  );
  const [
    completedPayment,
    setCompletedPayment,
  ] = useState<CompletedPayment | null>(
    null
  );
  const inFlightPayments =
    useRef(new Set<string>());
  function removePayment(
    paymentId: string
  ) {
    if (!address) {
      return;
    }
    const key =
      getStorageKey(address);
    try {
      const stored =
        localStorage.getItem(key);
      if (!stored) {
        return;
      }
      const parsed =
        JSON.parse(stored) as PendingPayment[];
      const filtered =
        parsed.filter(
          (payment) =>
            payment.paymentId !==
            paymentId
        );
      localStorage.setItem(
        key,
        JSON.stringify(filtered)
      );
      setPayments(filtered);
    } catch (err) {
      console.error(
        "[PARTIO] Remove payment error:",
        err
      );
    }
  }
  async function refreshPayments() {
    if (!address || !connectorClient) {
      return;
    }
    const key =
      getStorageKey(address);
    try {
      const stored =
        localStorage.getItem(key);
      if (!stored) {
        setPayments([]);
        setBalances({});
        return;
      }
      const parsed =
        JSON.parse(stored) as PendingPayment[];
      setPayments(parsed);
      const walletClient =
        connectorClient.extend(
          publicActions
        );
      const nextBalances:
        Record<string, string> = {};
      const nextStatuses:
        Record<string, PaymentStatus> = {};
      const remainingPayments:
        PendingPayment[] = [];
      for (
        const payment of parsed
      ) {
        try {
          const [
            balance,
            executed,
          ] =
            await Promise.all([
              walletClient.readContract({
                address:
                  payment.vaultAddress as Address,
                abi:
                  PARTIO_VAULT_ABI,
                functionName:
                  "balance",
              }),
              walletClient.readContract({
                address:
                  payment.vaultAddress as Address,
                abi:
                  PARTIO_VAULT_ABI,
                functionName:
                  "executed",
              }),
            ]);
          const formattedBalance =
            formatUnits(
              balance,
              USDC_DECIMALS
            );
          nextBalances[
            payment.paymentId
          ] =
            formattedBalance;
          if (executed) {
            continue;
          }
          remainingPayments.push(
            payment
          );
          const required =
            parseUnits(
              payment.totalAmount,
              USDC_DECIMALS
            );
          if (
            balance >= required
          ) {
            nextStatuses[
              payment.paymentId
            ] =
              "funded";
          } else {
            nextStatuses[
              payment.paymentId
            ] =
              "waiting";
          }
        } catch (err) {
          console.error(
            "[PARTIO] Refresh payment error:",
            err
          );
          remainingPayments.push(
            payment
          );
          nextStatuses[
            payment.paymentId
          ] =
            "error";
        }
      }
      setPayments(
        remainingPayments
      );
      setBalances(
        nextBalances
      );
      setStatuses(
        nextStatuses
      );
      localStorage.setItem(
        key,
        JSON.stringify(
          remainingPayments
        )
      );
    } catch (err) {
      console.error(
        "[PARTIO] Refresh payments error:",
        err
      );
    }
  }
  useEffect(() => {
    if (
      !address ||
      !connectorClient
    ) {
      return;
    }
    refreshPayments();
  }, [
    address,
    connectorClient,
  ]);
  async function findMaxUnifiedSpend(
    adapter: Awaited<
      ReturnType<typeof createArcAdapter>
    >,
    maxAmountUnits: bigint,
    destination: Address
  ) {
    if (
      maxAmountUnits <= 0n
    ) {
      return 0n;
    }
    for (
      let i =
        UNIFIED_RESERVES.length - 1;
      i >= 0;
      i--
    ) {
      const reserve =
        UNIFIED_RESERVES[i];
      if (
        reserve >
        maxAmountUnits
      ) {
        continue;
      }
      try {
        await kit.unifiedBalance.estimateSpend(
          {
            amount:
              formatUnits(
                reserve,
                USDC_DECIMALS
              ),
            token:
              "USDC",
            from: {
              adapter,
            },
            to: {
              adapter,
              chain:
                "Arc",
              recipientAddress:
                destination,
            },
          }
        );
        return reserve;
      } catch (error) {
        const errorCode =
          typeof error === "object" &&
          error !== null &&
          "code" in error
            ? (
                error as {
                  code?: unknown;
                }
              ).code
            : undefined;
        const errorName =
          typeof error === "object" &&
          error !== null &&
          "name" in error
            ? (
                error as {
                  name?: unknown;
                }
              ).name
            : undefined;
        const expectedBalanceError =
          errorCode === 9001 ||
          errorCode === 9002 ||
          errorCode === 9003 ||
          errorCode === 6001 ||
          errorName ===
            "BALANCE_INSUFFICIENT_TOKEN" ||
          errorName ===
            "BALANCE_INSUFFICIENT_GAS" ||
          errorName ===
            "BALANCE_INSUFFICIENT_ALLOWANCE" ||
          errorName ===
            "LIQUIDITY_INSUFFICIENT";
        if (!expectedBalanceError) {
          throw error;
        }
      }
    }
    return 0n;
  }
  async function handleContinueFunding(
    payment: PendingPayment
  ) {
    if (
      !address ||
      !connectorClient
    ) {
      return;
    }
    setError(null);
    setLoadingPayment(
      payment.paymentId
    );
    setStatuses(
      (current) => ({
        ...current,
        [payment.paymentId]:
          "checking",
      })
    );
    try {
      const walletClient =
        connectorClient.extend(
          publicActions
        );
      const vault =
        payment.vaultAddress as Address;
      const [
        currentVaultBalance,
        executed,
      ] =
        await Promise.all([
          walletClient.readContract({
            address:
              vault,
            abi:
              PARTIO_VAULT_ABI,
            functionName:
              "balance",
          }),
          walletClient.readContract({
            address:
              vault,
            abi:
              PARTIO_VAULT_ABI,
            functionName:
              "executed",
          }),
        ]);
      if (executed) {
        removePayment(
          payment.paymentId
        );
        return;
      }
      const totalAmount =
        parseUnits(
          payment.totalAmount,
          USDC_DECIMALS
        );
      if (
        currentVaultBalance >=
        totalAmount
      ) {
        setStatuses(
          (current) => ({
            ...current,
            [payment.paymentId]:
              "funded",
          })
        );
        setBalances(
          (current) => ({
            ...current,
            [payment.paymentId]:
              formatUnits(
                currentVaultBalance,
                USDC_DECIMALS
              ),
          })
        );
        return;
      }
      const remaining =
        totalAmount -
        currentVaultBalance;
      setStatuses(
        (current) => ({
          ...current,
          [payment.paymentId]:
            "funding",
        })
      );
      if (!connector) {
        throw new Error(
          "Unable to access the connected wallet."
        );
      }
      const provider =
        await connector.getProvider();
      const adapter =
        await createArcAdapter(
          provider as EIP1193Provider
        );
      const unifiedBalance =
        await getUnifiedBalances(
          adapter
        );
      const confirmedBalance =
        parseUnits(
          unifiedBalance
            .totalConfirmedBalance ??
            "0",
          USDC_DECIMALS
        );
      const unifiedCandidate =
        confirmedBalance <
        remaining
          ? confirmedBalance
          : remaining;
      let unifiedAmount =
        0n;
      if (
        unifiedCandidate > 0n
      ) {
        unifiedAmount =
          await findMaxUnifiedSpend(
            adapter,
            unifiedCandidate,
            vault
          );
      }
      const walletAmount =
        remaining -
        unifiedAmount;
      if (
        walletAmount > 0n
      ) {
        const walletBalance =
          await walletClient.readContract(
            {
              address:
                USDC_ADDRESS,
              abi:
                USDC_ABI,
              functionName:
                "balanceOf",
              args: [
                address,
              ],
            }
          );
        if (
          walletBalance <
          walletAmount
        ) {
          throw new Error(
            `Not enough USDC. Need ${formatUnits(
              walletAmount,
              USDC_DECIMALS
            )} USDC from the ARC wallet.`
          );
        }
      }
      if (
        unifiedAmount > 0n
      ) {
        await spendUSDC(
          adapter,
          vault,
          formatUnits(
            unifiedAmount,
            USDC_DECIMALS
          )
        );
      }
      if (
        walletAmount > 0n
      ) {
        const transferHash =
          await writeContractAsync(
            {
              address:
                USDC_ADDRESS,
              abi:
                USDC_ABI,
              functionName:
                "transfer",
              args: [
                vault,
                walletAmount,
              ],
            }
          );
        const transferReceipt =
          await walletClient.waitForTransactionReceipt(
            {
              hash:
                transferHash,
            }
          );
        if (
          transferReceipt.status !==
          "success"
        ) {
          throw new Error(
            "USDC transfer to the payment vault failed on-chain."
          );
        }
      }
      await refreshPayments();
    } catch (err) {
      console.error(
        "[PARTIO] Continue funding error:",
        err
      );
      setStatuses(
        (current) => ({
          ...current,
          [payment.paymentId]:
            "waiting",
        })
      );
      setError(
        err instanceof Error
          ? err.message
          : "Funding could not be completed. Please try again."
      );
    } finally {
      setLoadingPayment(null);
    }
  }
  async function handleResume(
    payment: PendingPayment
  ) {
    if (
      !address ||
      !connectorClient
    ) {
      return;
    }
    if (
      inFlightPayments.current.has(
        payment.paymentId
      )
    ) {
      return;
    }
    inFlightPayments.current.add(
      payment.paymentId
    );
    setError(null);
    setLoadingPayment(
      payment.paymentId
    );
    setStatuses(
      (current) => ({
        ...current,
        [payment.paymentId]:
          "checking",
      })
    );
    try {
      const walletClient =
        connectorClient.extend(
          publicActions
        );
      const vault =
        payment.vaultAddress as Address;
      const [
        balance,
        executed,
      ] =
        await Promise.all([
          walletClient.readContract({
            address:
              vault,
            abi:
              PARTIO_VAULT_ABI,
            functionName:
              "balance",
          }),
          walletClient.readContract({
            address:
              vault,
            abi:
              PARTIO_VAULT_ABI,
            functionName:
              "executed",
          }),
        ]);
      if (executed) {
        removePayment(
          payment.paymentId
        );
        return;
      }
      const totalAmount =
        parseUnits(
          payment.totalAmount,
          USDC_DECIMALS
        );
      if (
        balance < totalAmount
      ) {
        setStatuses(
          (current) => ({
            ...current,
            [payment.paymentId]:
              "waiting",
          })
        );
        setError(
          `Payment #${payment.paymentId} is not fully funded yet.`
        );
        return;
      }
      const recipientAddresses =
        payment.recipients.map(
          (recipient) =>
            recipient.address as Address
        );
      const amounts =
        payment.recipients.map(
          (recipient) =>
            parseUnits(
              recipient.amount,
              USDC_DECIMALS
            )
        );
      const latestVaultBalance =
        await walletClient.readContract({
          address:
            vault,
          abi:
            PARTIO_VAULT_ABI,
          functionName:
            "balance",
        });
      if (
        latestVaultBalance <
        totalAmount
      ) {
        setStatuses(
          (current) => ({
            ...current,
            [payment.paymentId]:
              "waiting",
          })
        );
        setError(
          "Payment vault balance changed before execution. Please fund the remaining amount and try again."
        );
        return;
      }
      const executeHash =
        await writeContractAsync({
          address:
            vault,
          abi:
            PARTIO_VAULT_ABI,
          functionName:
            "execute",
          args: [
            recipientAddresses,
            amounts,
            totalAmount,
          ],
        });
      const executeReceipt =
        await walletClient.waitForTransactionReceipt(
          {
            hash:
              executeHash,
          }
        );
      if (
        executeReceipt.status !==
        "success"
      ) {
        throw new Error(
          "Payment transaction failed on-chain."
        );
      }
      setStatuses(
        (current) => ({
          ...current,
          [payment.paymentId]:
            "executed",
        })
      );
      setCompletedPayment({
        paymentId:
          payment.paymentId,
        totalAmount:
          payment.totalAmount,
        recipients:
          payment.recipients,
        txHash:
          executeHash,
      });
      removePayment(
        payment.paymentId
      );
    } catch (err) {
      console.error(
        "[PARTIO] Resume payment error:",
        err
      );
      setStatuses(
        (current) => ({
          ...current,
          [payment.paymentId]:
            "funded",
        })
      );
      setError(
        err instanceof Error
          ? err.message
          : "Payment could not be completed. Please try again."
      );
    } finally {
      inFlightPayments.current.delete(
        payment.paymentId
      );
      setLoadingPayment(null);
    }
  }
  async function handleRefund(
    payment: PendingPayment
  ) {
    if (
      !address ||
      !connectorClient
    ) {
      return;
    }
    setError(null);
    setLoadingPayment(
      payment.paymentId
    );
    try {
      const walletClient =
        connectorClient.extend(
          publicActions
        );
      const vault =
        payment.vaultAddress as Address;
      const [
        balance,
        executed,
      ] =
        await Promise.all([
          walletClient.readContract({
            address:
              vault,
            abi:
              PARTIO_VAULT_ABI,
            functionName:
              "balance",
          }),
          walletClient.readContract({
            address:
              vault,
            abi:
              PARTIO_VAULT_ABI,
            functionName:
              "executed",
          }),
        ]);
      if (executed) {
        removePayment(
          payment.paymentId
        );
        return;
      }
      if (
        balance === 0n
      ) {
        throw new Error(
          "There is no USDC available to refund."
        );
      }
      setStatuses(
        (current) => ({
          ...current,
          [payment.paymentId]:
            "funding",
        })
      );
      const refundHash =
        await writeContractAsync({
          address:
            vault,
          abi:
            PARTIO_VAULT_ABI,
          functionName:
            "refund",
          args: [],
        });
      await walletClient.waitForTransactionReceipt(
        {
          hash:
            refundHash,
        }
      );
      removePayment(
        payment.paymentId
      );
      setError(null);
    } catch (err) {
      console.error(
        "[PARTIO] Refund error:",
        err
      );
      setStatuses(
        (current) => ({
          ...current,
          [payment.paymentId]:
            "error",
        })
      );
      setError(
        err instanceof Error
          ? err.message
          : "Refund could not be completed. Please try again."
      );
    } finally {
      setLoadingPayment(null);
    }
  }
  if (
    !address ||
    payments.length === 0
  ) {
    return (
      <>
        {completedPayment && (
          <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-emerald-400">
                  Payment completed
                </div>
                <div className="mt-1 text-xs text-neutral-400">
                  Payment #
                  {completedPayment.paymentId}
                </div>
              </div>
              <a
                href={`https://explorer.arc.io/tx/${completedPayment.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-neutral-300 hover:text-white"
              >
                View transaction →
              </a>
            </div>
            <div className="mb-4 text-2xl font-semibold text-white">
              {completedPayment.totalAmount} USDC
            </div>
            <div className="space-y-2">
              {completedPayment.recipients.map(
                (
                  recipient,
                  index
                ) => (
                  <div
                    key={`${recipient.address}-${index}`}
                    className="flex items-center justify-between gap-4 rounded-xl bg-neutral-900/70 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm text-white">
                        {recipient.name ||
                          shortenAddress(
                            recipient.address
                          )}
                      </div>
                      <div className="mt-1 text-xs text-neutral-500">
                        {shortenAddress(
                          recipient.address
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-sm font-medium text-neutral-200">
                      {recipient.amount} USDC
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </>
    );
  }
  return (
    <section className="mt-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Pending payments
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Payments that still need to be completed.
          </p>
        </div>
        <button
          onClick={() =>
            refreshPayments()
          }
          className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-xs font-medium text-neutral-300 transition hover:border-neutral-600 hover:bg-neutral-800 hover:text-white"
        >
          Refresh
        </button>
      </div>
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
      <div className="space-y-4">
        {payments.map(
          (payment) => {
            const status =
              statuses[
                payment.paymentId
              ] ??
              "checking";
            const balance =
              balances[
                payment.paymentId
              ] ??
              "0";
            const isLoading =
              loadingPayment ===
              payment.paymentId;
            return (
              <div
                key={payment.paymentId}
                className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.25)]"
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-white">
                      Payment #
                      {payment.paymentId}
                    </div>
                    <div className="mt-1 text-xs text-neutral-500">
                      Vault{" "}
                      {shortenAddress(
                        payment.vaultAddress
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-white">
                      {payment.totalAmount} USDC
                    </div>
                    <div className="mt-1 text-xs text-neutral-500">
                      Vault balance:{" "}
                      {balance} USDC
                    </div>
                  </div>
                </div>
                <div className="mb-5 space-y-2">
                  {payment.recipients.map(
                    (
                      recipient,
                      index
                    ) => (
                      <div
                        key={`${recipient.address}-${index}`}
                        className="flex items-center justify-between gap-4 rounded-xl bg-neutral-950/60 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm text-white">
                            {recipient.name ||
                              shortenAddress(
                                recipient.address
                              )}
                          </div>
                          <div className="mt-1 text-xs text-neutral-500">
                            {shortenAddress(
                              recipient.address
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 text-sm font-medium text-neutral-200">
                          {recipient.amount} USDC
                        </div>
                      </div>
                    )
                  )}
                </div>
                {status ===
                  "waiting" && (
                  <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-300">
                    This payment is waiting for more USDC.
                  </div>
                )}
                {status ===
                  "funded" && (
                  <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-xs text-emerald-300">
                    Payment is fully funded and ready to execute.
                  </div>
                )}
                {status ===
                  "funding" && (
                  <div className="mb-4 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-xs text-blue-300">
                    Funding payment...
                  </div>
                )}
                {status ===
                  "checking" && (
                  <div className="mb-4 rounded-xl border border-neutral-700 bg-neutral-950/50 px-4 py-3 text-xs text-neutral-400">
                    Checking payment status...
                  </div>
                )}
                {status ===
                  "error" && (
                  <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-300">
                    Something went wrong. Please try again.
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  {status ===
                    "funded" && (
                    <button
                      disabled={isLoading}
                      onClick={() =>
                        handleResume(
                          payment
                        )
                      }
                      className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isLoading
                        ? "Processing..."
                        : "Resume Payment"}
                    </button>
                  )}
                  {status ===
                    "waiting" && (
                    <button
                      disabled={isLoading}
                      onClick={() =>
                        handleContinueFunding(
                          payment
                        )
                      }
                      className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isLoading
                        ? "Funding..."
                        : "Continue Funding"}
                    </button>
                  )}
                  {(
                    status ===
                      "waiting" ||
                    status ===
                      "funded"
                  ) && (
                    <button
                      disabled={
                        isLoading ||
                        balance === "0"
                      }
                      onClick={() =>
                        handleRefund(
                          payment
                        )
                      }
                      className="rounded-xl border border-neutral-700 bg-neutral-950 px-5 py-3 text-sm font-medium text-neutral-300 transition hover:border-neutral-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Refund
                    </button>
                  )}
                  {status ===
                    "error" && (
                    <button
                      disabled={isLoading}
                      onClick={() =>
                        refreshPayments()
                      }
                      className="rounded-xl border border-neutral-700 bg-neutral-950 px-5 py-3 text-sm font-medium text-neutral-300 transition hover:border-neutral-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Retry
                    </button>
                  )}
                </div>
              </div>
            );
          }
        )}
      </div>
      {completedPayment && (
        <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-emerald-400">
                Payment completed
              </div>
              <div className="mt-1 text-xs text-neutral-400">
                Payment #
                {completedPayment.paymentId}
              </div>
            </div>
            <a
              href={`https://explorer.arc.io/tx/${completedPayment.txHash}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-neutral-300 hover:text-white"
            >
              View transaction →
            </a>
          </div>
          <div className="mb-4 text-2xl font-semibold text-white">
            {completedPayment.totalAmount} USDC
          </div>
          <div className="space-y-2">
            {completedPayment.recipients.map(
              (
                recipient,
                index
              ) => (
                <div
                  key={`${recipient.address}-${index}`}
                  className="flex items-center justify-between gap-4 rounded-xl bg-neutral-900/70 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm text-white">
                      {recipient.name ||
                        shortenAddress(
                          recipient.address
                        )}
                    </div>
                    <div className="mt-1 text-xs text-neutral-500">
                      {shortenAddress(
                        recipient.address
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-sm font-medium text-neutral-200">
                    {recipient.amount} USDC
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </section>
  );
}