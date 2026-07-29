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

  const {
    writeContractAsync,
  } = useWriteContract();

  const [isWriting, setIsWriting] =
    useState(false);

  const [isConfirming, setIsConfirming] =
    useState(false);

  const [isConfirmed, setIsConfirmed] =
    useState(false);

  const [writeError, setWriteError] =
    useState<Error | null>(null);

  async function partition() {
    try {
      setWriteError(null);
      setIsConfirmed(false);

      const validRecipients = recipients.filter(
        (recipient) => {
          const value = Number(recipient.amount);

          return (
            !Number.isNaN(value) &&
            value > 0
          );
        }
      );

      if (validRecipients.length === 0) {
        return;
      }

      const recipientAddresses =
        validRecipients.map(
          (recipient) => recipient.address
        );

      const amounts = validRecipients.map(
        (recipient) =>
          parseEther(recipient.amount)
      );

      const totalValue = amounts.reduce(
        (sum, amount) => sum + amount,
        0n
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

      setIsWriting(false);
      setIsConfirming(true);

      await publicClient.waitForTransactionReceipt({
        hash,
      });

      setIsConfirming(false);
      setIsConfirmed(true);
    } catch (error) {
      console.error(error);

      setIsWriting(false);
      setIsConfirming(false);

      setWriteError(error as Error);
    }
  }

  return {
    partition,
    isWriting,
    isConfirming,
    isConfirmed,
    writeError,
  };
}