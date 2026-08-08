"use client";

import { useState } from "react";

import {
  formatUnits,
  parseUnits,
  type Address,
  type TransactionReceipt,
} from "viem";

import {
  useAccount,
  usePublicClient,
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

function getReadableError(error: unknown): Error {
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
  const publicClient =
    usePublicClient();

  const { address } =
    useAccount();

  const {
    writeContractAsync,
  } = useWriteContract();

  const [isWriting, setIsWriting] =
    useState(false);

  const [
    isConfirming,
    setIsConfirming,
  ] = useState(false);

  const [
    isConfirmed,
    setIsConfirmed,
  ] = useState(false);

  const [txHash, setTxHash] =
    useState<`0x${string}` | null>(
      null
    );

  const [
    receipt,
    setReceipt,
  ] =
    useState<TransactionReceipt | null>(
      null
    );

  const [
    writeError,
    setWriteError,
  ] =
    useState<Error | null>(
      null
    );

  async function getWalletUSDCBalance(
    walletAddress: Address
  ) {
    if (!publicClient) {
      throw new Error(
        "Unable to connect to ARC Testnet."
      );
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
      console.log(
        "Estimating Unified amount:",
        amount
      );

      await kit.unifiedBalance.estimateSpend({
        amount,
        token: "USDC",
        from: {
          adapter,
        },
        to: {
          adapter,
          chain: "Arc_Testnet",
          recipientAddress:
            PARTIO_ADDRESS,
        },
      });

      console.log(
        "Unified amount accepted:",
        amount
      );

      return true;
    } catch (error) {
      console.log(
        "Unified amount rejected:",
        amount
      );

      console.log(error);

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

    let low = 0n;
    let high = maxAmountUnits;

    console.log(
      "Finding maximum Unified spendable amount..."
    );

    while (
      low < high
    ) {
      const mid =
        low +
        (high - low + 1n) /
          2n;

      const canSpend =
        await canSpendUnifiedAmount(
          adapter,
          mid
        );

      if (canSpend) {
        low = mid;
      } else {
        high =
          mid - 1n;
      }
    }

    if (
      low > 0n &&
      low < maxAmountUnits
    ) {
      const exactCheck =
        await canSpendUnifiedAmount(
          adapter,
          low
        );

      if (!exactCheck) {
        low =
          low > MICRO_USDC
            ? low -
              MICRO_USDC
            : 0n;
      }
    }

    console.log(
      "Maximum Unified spend:",
      formatUnits(
        low,
        6
      )
    );

    return low;
  }

  async function partition() {
    try {
      console.clear();

      setWriteError(null);
      setIsWriting(false);
      setIsConfirming(false);
      setIsConfirmed(false);
      setTxHash(null);
      setReceipt(null);

      if (!address) {
        throw new Error(
          "Wallet is not connected."
        );
      }

      console.log(
        "Preparing Payment"
      );

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

      const totalAmount =
        formatUnits(
          totalAmountUnits,
          6
        );

      console.log(
        "================================"
      );

      console.log(
        "PARTIO PAYMENT"
      );

      console.log(
        "Total:",
        totalAmount,
        "USDC"
      );

      console.log(
        "================================"
      );

      /*
       * ---------------------------------------------------------
       * STEP 1
       * Read Unified Balance
       * ---------------------------------------------------------
       */

      console.log(
        "Step 1 - Reading Unified Balance"
      );

      const adapter =
        await createArcAdapter();

      const unifiedBalance =
        await getUnifiedBalances(
          adapter
        );

      const confirmedUnifiedBalance =
        parseUnits(
          unifiedBalance.totalConfirmedBalance ??
            "0",
          6
        );

      console.log(
        "Confirmed Unified Balance:",
        formatUnits(
          confirmedUnifiedBalance,
          6
        )
      );

      console.log(
        "Pending Unified Balance:",
        unifiedBalance.totalPendingBalance
      );

      /*
       * ---------------------------------------------------------
       * STEP 2
       * Determine maximum amount Unified can actually spend
       * ---------------------------------------------------------
       */

      const unifiedCandidate =
        confirmedUnifiedBalance >
        totalAmountUnits
          ? totalAmountUnits
          : confirmedUnifiedBalance;

      let unifiedAmount = 0n;

      if (
        unifiedCandidate > 0n
      ) {
        console.log(
          "Step 2 - Finding Unified Spend Capacity"
        );

        unifiedAmount =
          await findMaxUnifiedSpend(
            adapter,
            unifiedCandidate
          );
      }

      /*
       * ---------------------------------------------------------
       * STEP 3
       * Remaining amount must come from ARC wallet
       * ---------------------------------------------------------
       */

      const walletAmount =
        totalAmountUnits -
        unifiedAmount;

      console.log(
        "--------------------------------"
      );

      console.log(
        "Unified Amount:",
        formatUnits(
          unifiedAmount,
          6
        ),
        "USDC"
      );

      console.log(
        "Wallet Amount:",
        formatUnits(
          walletAmount,
          6
        ),
        "USDC"
      );

      console.log(
        "--------------------------------"
      );

      /*
       * ---------------------------------------------------------
       * STEP 4
       * Verify ARC wallet fallback
       * ---------------------------------------------------------
       */

      if (
        walletAmount > 0n
      ) {
        console.log(
          "Step 3 - Checking ARC Wallet USDC"
        );

        const walletBalance =
          await getWalletUSDCBalance(
            address
          );

        console.log(
          "ARC Wallet USDC:",
          formatUnits(
            walletBalance,
            6
          )
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
       * ---------------------------------------------------------
       * STEP 5
       * Execute Unified Balance spend
       * ---------------------------------------------------------
       */

      if (
        unifiedAmount > 0n
      ) {
        console.log(
          "Step 4 - Spending Unified Balance"
        );

        const unifiedSpendAmount =
          formatUnits(
            unifiedAmount,
            6
          );

        console.log(
          "Unified spend amount:",
          unifiedSpendAmount
        );

        const spendResult =
          await spendUSDC(
            adapter,
            PARTIO_ADDRESS,
            unifiedSpendAmount
          );

        console.log(
          "Unified Spend Complete"
        );

        console.log(
          spendResult
        );
      } else {
        console.log(
          "Step 4 - No Unified Balance used"
        );
      }

      /*
       * ---------------------------------------------------------
       * STEP 6
       * Transfer remaining amount from ARC wallet
       * ---------------------------------------------------------
       */

      if (
        walletAmount > 0n
      ) {
        console.log(
          "Step 5 - ARC Wallet Fallback"
        );

        setIsWriting(true);

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

        console.log(
          "ARC Wallet Transfer Submitted"
        );

        console.log(
          walletTransferHash
        );

        if (!publicClient) {
          throw new Error(
            "Unable to connect to ARC Testnet."
          );
        }

        console.log(
          "Waiting for ARC Wallet Transfer"
        );

        await publicClient.waitForTransactionReceipt(
          {
            hash:
              walletTransferHash,
          }
        );

        console.log(
          "ARC Wallet Transfer Confirmed"
        );

        setIsWriting(false);
      } else {
        console.log(
          "Step 5 - No ARC Wallet Fallback Needed"
        );
      }

      /*
       * ---------------------------------------------------------
       * STEP 7
       * Execute Partio partition
       * ---------------------------------------------------------
       */

      console.log(
        "Step 6 - Execute Partition"
      );

      setIsWriting(true);

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

      console.log(
        "Partition Submitted"
      );

      console.log(hash);

      setTxHash(hash);

      setIsWriting(false);
      setIsConfirming(true);

      if (!publicClient) {
        throw new Error(
          "Unable to connect to ARC Testnet."
        );
      }

      console.log(
        "Waiting for Partition Receipt"
      );

      const txReceipt =
        await publicClient.waitForTransactionReceipt(
          {
            hash,
          }
        );

      console.log(
        "Partition Confirmed"
      );

      console.log(
        txReceipt
      );

      setReceipt(
        txReceipt
      );

      setIsConfirming(false);
      setIsConfirmed(true);

      console.log(
        "================================"
      );

      console.log(
        "PAYMENT COMPLETED"
      );

      console.log(
        "================================"
      );
    } catch (error) {
      console.error(
        "Partition Error"
      );

      console.error(error);

      setIsWriting(false);
      setIsConfirming(false);
      setIsConfirmed(false);

      setWriteError(
        getReadableError(
          error
        )
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