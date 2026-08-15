"use client";

import { useState } from "react";

import {
  formatUnits,
  parseUnits,
  publicActions,
  type Address,
  type TransactionReceipt,
} from "viem";

import {
  useAccount,
  useConnectorClient,
  useWriteContract,
} from "wagmi";

import { AppKit } from "@circle-fin/app-kit";

import {
  PARTIO_ABI,
  PARTIO_ADDRESS,
} from "@/lib/contracts/partio";

import { Recipient } from "@/types/recipient";

import { createArcAdapter } from "@/src/unified/adapters/viem";
import { getUnifiedBalances } from "@/src/unified/gateway/balances";
import { spendUSDC } from "@/src/unified/spend/spend";

const kit = new AppKit();

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

const MICRO_USDC = 1n;

/*
 * When the full Unified Balance amount is not spendable,
 * we do not run a 20-25 step binary search anymore.
 *
 * Instead we try a small number of practical safety
 * reserves. This keeps the number of estimateSpend calls
 * very low while still finding a usable Unified amount.
 */
const UNIFIED_RESERVES = [
  10_000n,     // 0.010000 USDC
  20_000n,     // 0.020000 USDC
  50_000n,     // 0.050000 USDC
  100_000n,    // 0.100000 USDC
  250_000n,    // 0.250000 USDC
  500_000n,    // 0.500000 USDC
  1_000_000n,  // 1.000000 USDC
] as const;

function getReadableError(
  error: unknown
): Error {
  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase();

  if (
    message.includes("user rejected") ||
    message.includes("user denied") ||
    message.includes("rejected")
  ) {
    return new Error(
      "Transaction cancelled. No funds were transferred."
    );
  }

  if (
    message.includes("insufficient funds") ||
    message.includes("insufficient balance") ||
    message.includes("balance_insufficient_token")
  ) {
    return new Error(
      "Not enough USDC to complete this payment."
    );
  }

  if (
    message.includes("network") ||
    message.includes("chain")
  ) {
    return new Error(
      "Please switch to ARC Testnet."
    );
  }

  if (
    message.includes("execution reverted")
  ) {
    return new Error(
      "Payment couldn't be completed. Please try again."
    );
  }

  if (
    message.includes("timeout")
  ) {
    return new Error(
      "Network is taking longer than expected. Please try again."
    );
  }

  return new Error(
    "Something went wrong. Please try again."
  );
}

export function usePartition(
  recipients: Recipient[]
) {
  /*
   * IMPORTANT:
   *
   * We intentionally use the connected wallet's
   * connector client for blockchain reads.
   *
   * This avoids forcing Brave/Rabby/etc. to use the
   * hardcoded Blockdaemon RPC for eth_call operations.
   *
   * The wallet provider already knows how to communicate
   * with the currently selected ARC Testnet network.
   */
  const {
    data: connectorClient,
  } = useConnectorClient();

  const { address } =
    useAccount();

  const {
    writeContractAsync,
  } = useWriteContract();

  const [
    isWriting,
    setIsWriting,
  ] = useState(false);

  const [
    isConfirming,
    setIsConfirming,
  ] = useState(false);

  const [
    isConfirmed,
    setIsConfirmed,
  ] = useState(false);

  const [
    txHash,
    setTxHash,
  ] = useState<
    `0x${string}` | null
  >(null);

  const [
    receipt,
    setReceipt,
  ] = useState<
    TransactionReceipt | null
  >(null);

  const [
    writeError,
    setWriteError,
  ] = useState<
    Error | null
  >(null);

  /*
   * Create a public-capable client from the connected
   * wallet client.
   *
   * This uses the wallet's own EIP-1193 provider instead
   * of the application's hardcoded RPC transport.
   */
  function getWalletClient() {
    if (!connectorClient) {
      throw new Error(
        "Unable to connect to the wallet."
      );
    }

    return connectorClient.extend(
      publicActions
    );
  }

  async function getWalletUSDCBalance(
    walletAddress: Address
  ) {
    const walletClient =
      getWalletClient();

    return await walletClient.readContract({
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

  async function canSpendUnifiedAmount(
    adapter: any,
    amountUnits: bigint
  ) {
    if (
      amountUnits <= 0n
    ) {
      return false;
    }

    const amount =
      formatUnits(
        amountUnits,
        6
      );

    try {
      await kit.unifiedBalance.estimateSpend({
        amount,

        token:
          "USDC",

        from: {
          adapter,
        },

        to: {
          adapter,

          chain:
            "Arc_Testnet",

          recipientAddress:
            PARTIO_ADDRESS,
        },
      });

      return true;
    } catch {
      return false;
    }
  }

  async function findMaxUnifiedSpend(
    adapter: any,
    maxAmountUnits: bigint
  ) {
    if (
      maxAmountUnits <= 0n
    ) {
      return 0n;
    }

    console.time(
      "[PARTIO] findMaxUnifiedSpend"
    );

    let estimateCount = 0;

    /*
     * --------------------------------------------------
     * STEP 1
     * Try the complete Unified Balance amount.
     *
     * This is the fastest and most common path.
     * --------------------------------------------------
     */

    estimateCount++;

    console.time(
      `[PARTIO] estimateSpend #${estimateCount} direct`
    );

    const directCanSpend =
      await canSpendUnifiedAmount(
        adapter,
        maxAmountUnits
      );

    console.timeEnd(
      `[PARTIO] estimateSpend #${estimateCount} direct`
    );

    console.log(
      `[PARTIO] direct estimate result:`,
      {
        amount:
          formatUnits(
            maxAmountUnits,
            6
          ),

        canSpend:
          directCanSpend,
      }
    );

    if (
      directCanSpend
    ) {
      console.log(
        "[PARTIO] Full Unified amount is spendable. No fallback required."
      );

      console.log(
        "[PARTIO] findMaxUnifiedSpend summary:",
        {
          requested:
            formatUnits(
              maxAmountUnits,
              6
            ),

          result:
            formatUnits(
              maxAmountUnits,
              6
            ),

          estimateCount,

          fallbackUsed:
            false,
        }
      );

      console.timeEnd(
        "[PARTIO] findMaxUnifiedSpend"
      );

      return maxAmountUnits;
    }

    /*
     * --------------------------------------------------
     * STEP 2
     *
     * Full amount is not spendable.
     *
     * Instead of running the old binary search, try
     * progressively larger safety reserves.
     * --------------------------------------------------
     */

    console.log(
      "[PARTIO] Full Unified amount is not spendable. Starting fast reserve search..."
    );

    for (
      const reserve of
        UNIFIED_RESERVES
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
        candidate <= 0n
      ) {
        continue;
      }

      estimateCount++;

      console.time(
        `[PARTIO] estimateSpend #${estimateCount} reserve`
      );

      const canSpend =
        await canSpendUnifiedAmount(
          adapter,
          candidate
        );

      console.timeEnd(
        `[PARTIO] estimateSpend #${estimateCount} reserve`
      );

      console.log(
        `[PARTIO] estimateSpend #${estimateCount} result:`,
        {
          amount:
            formatUnits(
              candidate,
              6
            ),

          reserve:
            formatUnits(
              reserve,
              6
            ),

          canSpend,
        }
      );

      if (
        canSpend
      ) {
        console.log(
          "[PARTIO] Fast Unified amount found:",
          formatUnits(
            candidate,
            6
          ),
          "USDC"
        );

        console.log(
          "[PARTIO] findMaxUnifiedSpend summary:",
          {
            requested:
              formatUnits(
                maxAmountUnits,
                6
              ),

            result:
              formatUnits(
                candidate,
                6
              ),

            reserve:
              formatUnits(
                reserve,
                6
              ),

            estimateCount,

            fallbackUsed:
              true,
          }
        );

        console.timeEnd(
          "[PARTIO] findMaxUnifiedSpend"
        );

        return candidate;
      }
    }

    /*
     * --------------------------------------------------
     * STEP 3
     *
     * If none of the normal reserves worked, use a
     * conservative fallback.
     * --------------------------------------------------
     */

    const fallbackReserve =
      2_000_000n;

    if (
      maxAmountUnits >
      fallbackReserve
    ) {
      const fallbackAmount =
        maxAmountUnits -
        fallbackReserve;

      estimateCount++;

      console.time(
        `[PARTIO] estimateSpend #${estimateCount} fallback`
      );

      const fallbackCanSpend =
        await canSpendUnifiedAmount(
          adapter,
          fallbackAmount
        );

      console.timeEnd(
        `[PARTIO] estimateSpend #${estimateCount} fallback`
      );

      console.log(
        `[PARTIO] fallback estimate result:`,
        {
          amount:
            formatUnits(
              fallbackAmount,
              6
            ),

          reserve:
            formatUnits(
              fallbackReserve,
              6
            ),

          canSpend:
            fallbackCanSpend,
        }
      );

      if (
        fallbackCanSpend
      ) {
        console.log(
          "[PARTIO] Conservative Unified amount selected:",
          formatUnits(
            fallbackAmount,
            6
          ),
          "USDC"
        );

        console.log(
          "[PARTIO] findMaxUnifiedSpend summary:",
          {
            requested:
              formatUnits(
                maxAmountUnits,
                6
              ),

            result:
              formatUnits(
                fallbackAmount,
                6
              ),

            reserve:
              formatUnits(
                fallbackReserve,
                6
              ),

            estimateCount,

            fallbackUsed:
              true,

            conservativeFallback:
              true,
          }
        );

        console.timeEnd(
          "[PARTIO] findMaxUnifiedSpend"
        );

        return fallbackAmount;
      }
    }

    /*
     * Nothing could be estimated successfully.
     * Returning zero means the complete payment will
     * fall back to the connected wallet balance.
     */

    console.log(
      "[PARTIO] Unified Balance could not find a spendable amount."
    );

    console.log(
      "[PARTIO] findMaxUnifiedSpend summary:",
      {
        requested:
          formatUnits(
            maxAmountUnits,
            6
          ),

        result:
          "0",

        estimateCount,

        fallbackUsed:
          true,

        unifiedFallbackToWallet:
          true,
      }
    );

    console.timeEnd(
      "[PARTIO] findMaxUnifiedSpend"
    );

    return 0n;
  }

  async function partition() {
    console.clear();

    console.log(
      "========== PARTIO PAYMENT START =========="
    );

    console.time(
      "[PARTIO] TOTAL partition()"
    );

    try {
      setWriteError(null);

      setIsWriting(false);

      setIsConfirming(false);

      setIsConfirmed(false);

      setTxHash(null);

      setReceipt(null);

      console.time(
        "[PARTIO] Validation"
      );

      if (!address) {
        throw new Error(
          "Wallet is not connected."
        );
      }

      const validRecipients =
        recipients.filter(
          (recipient) =>
            Number(
              recipient.amount
            ) > 0
        );

      if (
        validRecipients.length === 0
      ) {
        throw new Error(
          "Please add at least one recipient."
        );
      }

      const recipientAddresses =
        validRecipients.map(
          (recipient) =>
            recipient.address
        );

      const amounts =
        validRecipients.map(
          (recipient) =>
            parseUnits(
              recipient.amount,
              6
            )
        );

      const totalAmountUnits =
        amounts.reduce(
          (
            sum,
            amount
          ) =>
            sum + amount,
          0n
        );

      console.timeEnd(
        "[PARTIO] Validation"
      );

      console.log(
        "[PARTIO] Payment amount:",
        formatUnits(
          totalAmountUnits,
          6
        ),
        "USDC"
      );

      /*
       * --------------------------------------------------
       * Create Circle adapter
       * --------------------------------------------------
       */

      console.time(
        "[PARTIO] createArcAdapter"
      );

      const adapter =
        await createArcAdapter();

      console.timeEnd(
        "[PARTIO] createArcAdapter"
      );

      /*
       * --------------------------------------------------
       * Read Unified Balance
       * --------------------------------------------------
       */

      console.time(
        "[PARTIO] getUnifiedBalances"
      );

      const unifiedBalance =
        await getUnifiedBalances(
          adapter
        );

      console.timeEnd(
        "[PARTIO] getUnifiedBalances"
      );

      console.log(
        "[PARTIO] Unified Balance:",
        unifiedBalance
      );

      const confirmedUnifiedBalance =
        parseUnits(
          unifiedBalance
            .totalConfirmedBalance ??
            "0",
          6
        );

      const unifiedCandidate =
        confirmedUnifiedBalance >
        totalAmountUnits
          ? totalAmountUnits
          : confirmedUnifiedBalance;

      console.log(
        "[PARTIO] Unified candidate:",
        formatUnits(
          unifiedCandidate,
          6
        ),
        "USDC"
      );

      /*
       * --------------------------------------------------
       * Find usable Unified Balance amount
       * --------------------------------------------------
       */

      let unifiedAmount =
        0n;

      if (
        unifiedCandidate > 0n
      ) {
        unifiedAmount =
          await findMaxUnifiedSpend(
            adapter,
            unifiedCandidate
          );
      }

      console.log(
        "[PARTIO] Final Unified amount:",
        formatUnits(
          unifiedAmount,
          6
        ),
        "USDC"
      );

      /*
       * --------------------------------------------------
       * Remaining amount comes from wallet
       * --------------------------------------------------
       */

      const walletAmount =
        totalAmountUnits -
        unifiedAmount;

      console.log(
        "[PARTIO] Final Wallet amount:",
        formatUnits(
          walletAmount,
          6
        ),
        "USDC"
      );

      /*
       * --------------------------------------------------
       * Validate wallet balance only when needed
       * --------------------------------------------------
       */

      if (
        walletAmount > 0n
      ) {
        console.time(
          "[PARTIO] getWalletUSDCBalance"
        );

        const walletBalance =
          await getWalletUSDCBalance(
            address
          );

        console.timeEnd(
          "[PARTIO] getWalletUSDCBalance"
        );

        console.log(
          "[PARTIO] Wallet balance:",
          formatUnits(
            walletBalance,
            6
          ),
          "USDC"
        );

        if (
          walletBalance <
          walletAmount
        ) {
          throw new Error(
            `Not enough USDC. Need ${formatUnits(
              walletAmount,
              6
            )} USDC from the ARC wallet.`
          );
        }
      }

      /*
       * --------------------------------------------------
       * Unified Balance spend
       * --------------------------------------------------
       */

      if (
        unifiedAmount > 0n
      ) {
        console.log(
          "[PARTIO] Starting Unified Balance spend..."
        );

        setIsWriting(true);

        console.time(
          "[PARTIO] spendUSDC"
        );

        await spendUSDC(
          adapter,

          PARTIO_ADDRESS,

          formatUnits(
            unifiedAmount,
            6
          )
        );

        console.timeEnd(
          "[PARTIO] spendUSDC"
        );

        console.log(
          "[PARTIO] Unified Balance spend completed."
        );

        setIsWriting(false);
      }

      /*
       * --------------------------------------------------
       * Wallet USDC transfer
       * --------------------------------------------------
       */

      if (
        walletAmount > 0n
      ) {
        console.log(
          "[PARTIO] Starting wallet USDC transfer..."
        );

        setIsWriting(true);

        console.time(
          "[PARTIO] wallet transfer signature"
        );

        const walletTransferHash =
          await writeContractAsync({
            address:
              USDC_ADDRESS,

            abi:
              USDC_ABI,

            functionName:
              "transfer",

            args: [
              PARTIO_ADDRESS,
              walletAmount,
            ],
          });

        console.timeEnd(
          "[PARTIO] wallet transfer signature"
        );

        console.log(
          "[PARTIO] Wallet transfer hash:",
          walletTransferHash
        );

        console.time(
          "[PARTIO] wallet transfer confirmation"
        );

        const walletClient =
          getWalletClient();

        await walletClient.waitForTransactionReceipt({
          hash:
            walletTransferHash,
        });

        console.timeEnd(
          "[PARTIO] wallet transfer confirmation"
        );

        setIsWriting(false);
      }

      /*
       * --------------------------------------------------
       * PARTIO contract transaction
       * --------------------------------------------------
       */

      console.log(
        "[PARTIO] Starting PARTIO contract signature..."
      );

      setIsWriting(true);

      console.time(
        "[PARTIO] PARTIO contract signature"
      );

      const hash =
        await writeContractAsync({
          address:
            PARTIO_ADDRESS,

          abi:
            PARTIO_ABI,

          functionName:
            "partition",

          args: [
            recipientAddresses,
            amounts,
            totalAmountUnits,
          ],
        });

      console.timeEnd(
        "[PARTIO] PARTIO contract signature"
      );

      console.log(
        "[PARTIO] PARTIO transaction hash:",
        hash
      );

      setTxHash(hash);

      setIsWriting(false);

      setIsConfirming(true);

      console.time(
        "[PARTIO] PARTIO transaction confirmation"
      );

      const walletClient =
        getWalletClient();

      const txReceipt =
        await walletClient.waitForTransactionReceipt({
          hash,
        });

      console.timeEnd(
        "[PARTIO] PARTIO transaction confirmation"
      );

      setReceipt(
        txReceipt
      );

      setIsConfirming(false);

      setIsConfirmed(true);

      console.log(
        "========== PARTIO PAYMENT COMPLETE =========="
      );
    } catch (error) {
      setIsWriting(false);

      setIsConfirming(false);

      setIsConfirmed(false);

      setWriteError(
        getReadableError(
          error
        )
      );

      console.error(
        "[PARTIO] Payment Error:",
        error
      );
    } finally {
      console.timeEnd(
        "[PARTIO] TOTAL partition()"
      );
    }
  }

  function resetTransaction() {
    setIsWriting(false);

    setIsConfirming(false);

    setIsConfirmed(false);

    setTxHash(null);

    setReceipt(null);

    setWriteError(null);
  }

  return {
    partition,

    resetTransaction,

    isWriting,

    isConfirming,

    isConfirmed,

    txHash,

    receipt,

    writeError,
  };
}