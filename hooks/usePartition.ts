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
      console.clear();

      setWriteError(null);
      setIsWriting(false);
      setIsConfirming(false);
      setIsConfirmed(false);

      console.log("A - Preparing transaction");

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
        throw new Error(
          "No valid recipients."
        );
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

      console.log("B - Opening wallet");

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

      console.log("C - Transaction Hash");
      console.log(hash);

      setIsWriting(false);
      setIsConfirming(true);

      if (!publicClient) {
        throw new Error(
          "publicClient is undefined"
        );
      }

      console.log("D - Waiting for receipt");

      const receipt =
        await publicClient.waitForTransactionReceipt({
          hash,
        });

      console.log("E - Receipt received");
      console.log(receipt);

      setIsConfirming(false);
      setIsConfirmed(true);

      console.log("F - Success");
    } catch (error) {
      console.error("G - ERROR");
      console.error(error);

      setIsWriting(false);
      setIsConfirming(false);
      setIsConfirmed(false);

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