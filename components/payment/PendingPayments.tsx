"use client";

import { useEffect, useState } from "react";

import {
  formatUnits,
  parseUnits,
  publicActions,
  type Address,
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
  const { address } = useAccount();

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
        JSON.parse(stored);

      if (!Array.isArray(parsed)) {
        return;
      }

      const filtered =
        parsed.filter(
          (payment: PendingPayment) =>
            payment.paymentId !==
            paymentId
        );

      if (filtered.length === 0) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(
          key,
          JSON.stringify(filtered)
        );
      }

      setPayments(filtered);
    } catch {
      localStorage.removeItem(key);
      setPayments([]);
    }
  }

  async function refreshPayments() {
    if (
      !address ||
      !connectorClient
    ) {
      return;
    }

    const key =
      getStorageKey(address);

    try {
      const stored =
        localStorage.getItem(key);

      if (!stored) {
        setPayments([]);
        return;
      }

      const parsed =
        JSON.parse(stored);

      if (!Array.isArray(parsed)) {
        setPayments([]);
        return;
      }

      const walletClient =
        connectorClient.extend(
          publicActions
        );

      const nextStatuses: Record<
        string,
        PaymentStatus
      > = {};

      const nextBalances: Record<
        string,
        string
      > = {};

      const activePayments: PendingPayment[] =
        [];

      for (
        const payment of parsed as PendingPayment[]
      ) {
        try {
          const vault =
            payment.vaultAddress as Address;

          const [
            balance,
            executed,
          ] = await Promise.all([
            walletClient.readContract({
              address: vault,
              abi:
                PARTIO_VAULT_ABI,
              functionName:
                "balance",
            }),

            walletClient.readContract({
              address: vault,
              abi:
                PARTIO_VAULT_ABI,
              functionName:
                "executed",
            }),
          ]);

          if (executed) {
            continue;
          }

          const balanceText =
            formatUnits(
              balance,
              USDC_DECIMALS
            );

          nextBalances[
            payment.paymentId
          ] = balanceText;

          const required =
            parseUnits(
              payment.totalAmount,
              USDC_DECIMALS
            );

          nextStatuses[
            payment.paymentId
          ] =
            balance >= required
              ? "funded"
              : "waiting";

          activePayments.push(
            payment
          );
        } catch {
          nextStatuses[
            payment.paymentId
          ] = "error";

          activePayments.push(
            payment
          );
        }
      }

      setPayments(activePayments);
      setStatuses(nextStatuses);
      setBalances(nextBalances);

      if (
        activePayments.length !==
        parsed.length
      ) {
        if (
          activePayments.length === 0
        ) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(
            key,
            JSON.stringify(
              activePayments
            )
          );
        }
      }
    } catch {
      setPayments([]);
    }
  }

  useEffect(() => {
    if (!address) {
      setPayments([]);
      setStatuses({});
      setBalances({});
      return;
    }

    try {
      const stored =
        localStorage.getItem(
          getStorageKey(address)
        );

      if (!stored) {
        setPayments([]);
        return;
      }

      const parsed =
        JSON.parse(stored);

      setPayments(
        Array.isArray(parsed)
          ? parsed
          : []
      );
    } catch {
      setPayments([]);
    }
  }, [address]);

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
    adapter: any,
    maxAmountUnits: bigint,
    destination: Address
  ) {
    if (maxAmountUnits <= 0n) {
      return 0n;
    }

    const canSpend =
      async (
        amountUnits: bigint
      ) => {
        if (amountUnits <= 0n) {
          return false;
        }

        try {
          await kit.unifiedBalance.estimateSpend(
            {
              amount: formatUnits(
                amountUnits,
                USDC_DECIMALS
              ),
              token: "USDC",
              from: {
                adapter,
              },
              to: {
                adapter,
                chain: "Arc",
                recipientAddress:
                  destination,
              },
            }
          );

          return true;
        } catch {
          return false;
        }
      };

    if (
      await canSpend(
        maxAmountUnits
      )
    ) {
      return maxAmountUnits;
    }

    for (
      const reserve of UNIFIED_RESERVES
    ) {
      if (
        reserve >=
        maxAmountUnits
      ) {
        continue;
      }

      const candidate =
        maxAmountUnits -
        reserve;

      if (
        await canSpend(candidate)
      ) {
        return candidate;
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
          "funding",
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
        currentBalance,
        executed,
      ] = await Promise.all([
        walletClient.readContract({
          address: vault,
          abi:
            PARTIO_VAULT_ABI,
          functionName:
            "balance",
        }),

        walletClient.readContract({
          address: vault,
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

      const remaining =
        totalAmount -
        currentBalance;

      if (remaining <= 0n) {
        setBalances(
          (current) => ({
            ...current,
            [payment.paymentId]:
              formatUnits(
                currentBalance,
                USDC_DECIMALS
              ),
          })
        );

        setStatuses(
          (current) => ({
            ...current,
            [payment.paymentId]:
              "funded",
          })
        );

        return;
      }

      const adapter =
        await createArcAdapter();

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

      let unifiedAmount = 0n;

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
              abi: USDC_ABI,
              functionName:
                "balanceOf",
              args: [address],
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
              abi: USDC_ABI,
              functionName:
                "transfer",
              args: [
                vault,
                walletAmount,
              ],
            }
          );

        await walletClient.waitForTransactionReceipt(
          {
            hash: transferHash,
          }
        );
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
      ] = await Promise.all([
        walletClient.readContract({
          address: vault,
          abi:
            PARTIO_VAULT_ABI,
          functionName:
            "balance",
        }),

        walletClient.readContract({
          address: vault,
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

      const executeHash =
        await writeContractAsync({
          address: vault,
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
            hash: executeHash,
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
        "Payment could not be completed. Please try again."
      );
    } finally {
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
      const vault =
        payment.vaultAddress as Address;

      const walletClient =
        connectorClient.extend(
          publicActions
        );

      const [
        balance,
        executed,
      ] = await Promise.all([
        walletClient.readContract({
          address: vault,
          abi:
            PARTIO_VAULT_ABI,
          functionName:
            "balance",
        }),

        walletClient.readContract({
          address: vault,
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

      if (balance === 0n) {
        setError(
          "There are no funds in this payment vault."
        );
        return;
      }

      const refundHash =
        await writeContractAsync({
          address: vault,
          abi:
            PARTIO_VAULT_ABI,
          functionName:
            "refund",
        });

      await walletClient.waitForTransactionReceipt(
        {
          hash: refundHash,
        }
      );

      removePayment(
        payment.paymentId
      );
    } catch (err) {
      console.error(
        "[PARTIO] Refund error:",
        err
      );

      setError(
        "Refund could not be completed. Please try again."
      );
    } finally {
      setLoadingPayment(null);
    }
  }

  if (
    !address ||
    (
      payments.length === 0 &&
      !completedPayment
    )
  ) {
    return null;
  }

  return (
    <>
      {completedPayment && (
        <section className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              ✓
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Payment Completed
                  </p>

                  <p className="mt-1 text-xs text-neutral-400">
                    {
                      completedPayment.totalAmount
                    }{" "}
                    USDC sent successfully.
                  </p>
                </div>

                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-emerald-400">
                  Success
                </span>
              </div>

              <div className="mt-4 rounded-xl border border-neutral-800 bg-neutral-950/60">
                <div className="border-b border-neutral-800 px-4 py-3">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                    Recipients
                  </p>
                </div>

                <div className="divide-y divide-neutral-800">
                  {completedPayment.recipients.map(
                    (recipient, index) => (
                      <div
                        key={`${recipient.address}-${index}`}
                        className="flex items-center justify-between gap-4 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-white">
                            {recipient.name ||
                              shortenAddress(
                                recipient.address
                              )}
                          </p>

                          <p className="mt-0.5 truncate text-[11px] text-neutral-500">
                            {shortenAddress(
                              recipient.address
                            )}
                          </p>
                        </div>

                        <span className="shrink-0 text-xs font-medium text-white">
                          {recipient.amount} USDC
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-950/60 px-4 py-3">
                <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                  Transaction
                </p>

                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="truncate font-mono text-xs text-neutral-300">
                    {shortenHash(
                      completedPayment.txHash
                    )}
                  </span>

                  <a
                    href={`https://explorer.arc.io/tx/${completedPayment.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-xs font-medium text-white underline decoration-neutral-600 underline-offset-4 transition hover:decoration-white"
                  >
                    View on Arc Explorer →
                  </a>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  window.location.reload()
                }
                className="mt-4 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200"
              >
                New Payment
              </button>
            </div>
          </div>
        </section>
      )}

      {payments.length > 0 && (
        <section className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white">
                Pending Payments
              </p>

              <p className="mt-1 text-xs text-neutral-400">
                These payments may need your attention.
              </p>
            </div>

            <button
              type="button"
              onClick={
                refreshPayments
              }
              disabled={
                loadingPayment !== null
              }
              className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 transition hover:border-neutral-500 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {payments.map(
              (payment) => {
                const status =
                  statuses[
                    payment.paymentId
                  ] ?? "checking";

                const balance =
                  balances[
                    payment.paymentId
                  ] ?? "0";

                const isLoading =
                  loadingPayment ===
                  payment.paymentId;

                return (
                  <div
                    key={
                      payment.paymentId
                    }
                    className="rounded-xl border border-neutral-800 bg-neutral-950 p-4"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-white">
                            Payment #
                            {
                              payment.paymentId
                            }
                          </p>

                          <p className="mt-1 text-xs text-neutral-500">
                            {
                              payment.vaultAddress.slice(
                                0,
                                6
                              )
                            }
                            ...
                            {
                              payment.vaultAddress.slice(
                                -4
                              )
                            }
                          </p>
                        </div>

                        <p className="text-sm font-semibold text-white">
                          {
                            payment.totalAmount
                          }{" "}
                          USDC
                        </p>
                      </div>

                      <div className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-xs text-neutral-500">
                            Vault balance
                          </span>

                          <span className="text-xs font-medium text-white">
                            {balance} USDC
                          </span>
                        </div>
                      </div>

                      {status ===
                        "funded" && (
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <button
                            type="button"
                            onClick={() =>
                              handleResume(
                                payment
                              )
                            }
                            disabled={
                              isLoading
                            }
                            className="flex-1 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isLoading
                              ? "Processing..."
                              : "Resume Payment"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleRefund(
                                payment
                              )
                            }
                            disabled={
                              isLoading
                            }
                            className="rounded-xl border border-neutral-700 px-4 py-3 text-sm font-medium text-neutral-300 transition hover:border-neutral-500 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Refund
                          </button>
                        </div>
                      )}

                      {status ===
                        "waiting" && (
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <button
                            type="button"
                            onClick={() =>
                              handleContinueFunding(
                                payment
                              )
                            }
                            disabled={
                              isLoading
                            }
                            className="flex-1 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isLoading
                              ? "Funding..."
                              : "Continue Funding"}
                          </button>

                          {balance !==
                            "0" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleRefund(
                                  payment
                                )
                              }
                              disabled={
                                isLoading
                              }
                              className="rounded-xl border border-neutral-700 px-4 py-3 text-sm font-medium text-neutral-300 transition hover:border-neutral-500 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Refund
                            </button>
                          )}
                        </div>
                      )}

                      {status ===
                        "funding" && (
                        <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-xs text-neutral-400">
                          Funding payment...
                        </div>
                      )}

                      {status ===
                        "checking" && (
                        <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-xs text-neutral-400">
                          Checking payment status...
                        </div>
                      )}

                      {status ===
                        "error" && (
                        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
                          Unable to read the payment vault. Refresh and try again.
                        </div>
                      )}

                      <div className="text-xs text-neutral-600">
                        {
                          payment.recipients.length
                        }{" "}
                        recipient
                        {
                          payment.recipients.length !==
                          1
                            ? "s"
                            : ""
                        }
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </section>
      )}
    </>
  );
}