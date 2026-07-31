"use client";

import { useState } from "react";

import {
  parseEther,
  type TransactionReceipt,
} from "viem";

import {
  usePublicClient,
  useWriteContract,
} from "wagmi";

import {
  PARTIO_ABI,
  PARTIO_ADDRESS,
} from "@/lib/contracts/partio";

import { Recipient } from "@/types/recipient";

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
    message.includes("insufficient balance")
  ) {
    return new Error(
      "Not enough USDC. Please add funds and try again."
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
  const publicClient = usePublicClient();

  const { writeContractAsync } =
    useWriteContract();

  const [isWriting, setIsWriting] =
    useState(false);

  const [isConfirming, setIsConfirming] =
    useState(false);

  const [isConfirmed, setIsConfirmed] =
    useState(false);

  const [txHash, setTxHash] =
    useState<`0x${string}` | null>(null);

  const [receipt, setReceipt] =
    useState<TransactionReceipt | null>(
      null
    );

  const [writeError, setWriteError] =
    useState<Error | null>(null);

  async function partition() {
    try {
      console.clear();

      setWriteError(null);
      setIsWriting(false);
      setIsConfirming(false);
      setIsConfirmed(false);
      setTxHash(null);
      setReceipt(null);

      console.log("A - Preparing transaction");

      const validRecipients =
        recipients.filter((recipient) => {
          const value = Number(
            recipient.amount
          );

          return (
            !Number.isNaN(value) &&
            value > 0
          );
        });

      if (validRecipients.length === 0) {
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
            parseEther(recipient.amount)
        );

      const totalValue =
        amounts.reduce(
          (sum, amount) => sum + amount,
          0n
        );

      console.log(
        "B - Opening wallet"
      );

      setIsWriting(true);

      const hash =
        await writeContractAsync({
          address: PARTIO_ADDRESS,
          abi: PARTIO_ABI,
          functionName: "partition",
          args: [
            recipientAddresses,
            amounts,
          ],
          value: totalValue,
        });

      console.log(
        "C - Transaction Hash"
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
        "D - Waiting for receipt"
      );

      const txReceipt =
        await publicClient.waitForTransactionReceipt(
          {
            hash,
          }
        );

      console.log(
        "E - Receipt received"
      );
      console.log(txReceipt);

      setReceipt(txReceipt);

      setIsConfirming(false);
      setIsConfirmed(true);

      console.log("F - Success");
    } catch (error) {
      console.error("G - ERROR");
      console.error(error);

      setIsWriting(false);
      setIsConfirming(false);
      setIsConfirmed(false);

      setWriteError(
        getReadableError(error)
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