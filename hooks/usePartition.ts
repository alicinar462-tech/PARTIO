"use client";

import { useState } from "react";

import { parseEther } from "viem";
import {
  usePublicClient,
  useWriteContract,
} from "wagmi";

import {
  PARTIO_ABI,
  PARTIO_ADDRESS,
} from "@/lib/contracts/partio";

import { Recipient } from "@/types/recipient";

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
    useState<any>(null);

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
          "No valid recipients."
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
          "publicClient is undefined"
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
        error as Error
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