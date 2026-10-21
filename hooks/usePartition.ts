
"use client";

import { useState } from "react";

import {
  formatUnits,
  parseUnits,
  decodeEventLog,
  publicActions,
  type Address,
  type TransactionReceipt,
  type EIP1193Provider,
} from "viem";

import {
  useAccount,
  useConnectorClient,
  useWriteContract,
} from "wagmi";

import {
  PARTIO_ABI,
  PARTIO_ADDRESS,
} from "@/lib/contracts/partio";

import { Recipient } from "@/types/recipient";

import { createArcAdapter } from "@/src/unified/adapters/viem";
import { getUnifiedBalances } from "@/src/unified/gateway/balances";
import { spendUSDC } from "@/src/unified/spend/spend";
import { findMaxUnifiedSpend as findMaxUnifiedSpendShared } from "@/src/unified/spend/findMaxUnifiedSpend";

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

const PARTIO_VAULT_ABI = [
  {
    type: "function",
    name: "execute",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "recipients",
        type: "address[]",
      },
      {
        name: "amounts",
        type: "uint256[]",
      },
      {
        name: "totalAmount",
        type: "uint256",
      },
    ],
    outputs: [],
  },
] as const;

const PENDING_PAYMENTS_KEY =
  "partio_pending_payments";

type PendingPayment = {
  paymentId: string;
  vaultAddress: Address;
  recipients: {
    name: string;
    address: string;
    amount: string;
  }[];
  totalAmount: string;
};

function getPendingPaymentsKey(
  walletAddress: Address
) {
  return `${PENDING_PAYMENTS_KEY}_${walletAddress.toLowerCase()}`;
}

function savePendingPayment(
  walletAddress: Address,
  payment: PendingPayment
) {
  if (typeof window === "undefined") {
    return;
  }

  const key =
    getPendingPaymentsKey(walletAddress);

  let payments: PendingPayment[] = [];

  try {
    const existing =
      localStorage.getItem(key);

    payments = existing
      ? JSON.parse(existing)
      : [];
  } catch {
    payments = [];
  }

  const filtered = payments.filter(
    (item) =>
      item.paymentId !== payment.paymentId
  );

  localStorage.setItem(
    key,
    JSON.stringify([
      ...filtered,
      payment,
    ])
  );
}

function removePendingPayment(
  walletAddress: Address,
  paymentId: string
) {
  if (typeof window === "undefined") {
    return;
  }

  const key =
    getPendingPaymentsKey(walletAddress);

  const existing =
    localStorage.getItem(key);

  if (!existing) {
    return;
  }

  try {
    const payments: PendingPayment[] =
      JSON.parse(existing);

    const filtered = payments.filter(
      (item) =>
        item.paymentId !== paymentId
    );

    if (filtered.length === 0) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(
        key,
        JSON.stringify(filtered)
      );
    }
  } catch {
    localStorage.removeItem(key);
  }
}

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
      "Please switch to ARC Mainnet."
    );
  }

  if (
    message.includes("execution reverted") ||
    message.includes("reverted")
  ) {
    return new Error(
      "Payment couldn't be completed. Please try again."
    );
  }

  if (message.includes("timeout")) {
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
  const {
    data: connectorClient,
  } = useConnectorClient();

  const {
    address,
    connector,
  } = useAccount();

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
  ] = useState<Error | null>(null);

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
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: "balanceOf",
      args: [walletAddress],
    });
  }

  async function findMaxUnifiedSpend(
    adapter: any,
    maxAmountUnits: bigint,
    destinationAddress: Address
  ): Promise<bigint> {
    return findMaxUnifiedSpendShared(
      adapter,
      maxAmountUnits,
      destinationAddress
    );
  }

  async function partition() {
    console.log(
      "========== PARTIO V2 PAYMENT START =========="
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

      const walletAddress =
        address.toLowerCase();

      const selfPayment =
        validRecipients.some(
          (recipient) =>
            recipient.address.toLowerCase() ===
            walletAddress
        );

      if (selfPayment) {
        throw new Error(
          "You cannot send a payment to your connected wallet."
        );
      }

      const recipientAddresses =
        validRecipients.map(
          (recipient) =>
            recipient.address
        );

      const uniqueRecipientAddresses =
        new Set(
          recipientAddresses.map(
            (recipientAddress) =>
              recipientAddress.toLowerCase()
          )
        );

      if (
        uniqueRecipientAddresses.size !==
        recipientAddresses.length
      ) {
        throw new Error(
          "The same wallet address cannot be added more than once."
        );
      }

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

      console.log(
        "[PARTIO] Payment amount:",
        formatUnits(
          totalAmountUnits,
          6
        ),
        "USDC"
      );

      /*
       * STEP 1
       * Create a unique payment vault.
       */

      console.log(
        "[PARTIO] Creating payment vault..."
      );

      setIsWriting(true);

      const createPaymentHash =
        await writeContractAsync({
          address:
            PARTIO_ADDRESS,
          abi:
            PARTIO_ABI,
          functionName:
            "createPayment",
        });

      console.log(
        "[PARTIO] createPayment tx:",
        createPaymentHash
      );

      const walletClient =
        getWalletClient();

      setIsConfirming(true);

      const createReceipt =
        await walletClient.waitForTransactionReceipt(
          {
            hash:
              createPaymentHash,
          }
        );

      setIsConfirming(false);

      if (
        createReceipt.status !==
        "success"
      ) {
        throw new Error(
          "Payment vault creation failed on-chain. No payment funding was started."
        );
      }

      /*
       * Get payment ID and vault address
       * from PaymentCreated event.
       */

      let paymentId:
        bigint | undefined;

      let vaultAddress:
        Address | undefined;

      for (
        const log of createReceipt.logs
      ) {
        if (
          log.address.toLowerCase() !==
          PARTIO_ADDRESS.toLowerCase()
        ) {
          continue;
        }

        try {
          const decoded =
            decodeEventLog({
              abi:
                PARTIO_ABI,
              data:
                log.data,
              topics:
                log.topics,
            });

          if (
            decoded.eventName ===
            "PaymentCreated"
          ) {
            paymentId =
              decoded.args.paymentId as bigint;

            vaultAddress =
              decoded.args.vault as Address;

            break;
          }
        } catch {
          // Ignore unrelated logs.
        }
      }

      if (
        !vaultAddress ||
        paymentId === undefined
      ) {
        throw new Error(
          "Payment vault information could not be found."
        );
      }

      console.log(
        "[PARTIO] Payment ID:",
        paymentId.toString()
      );

      console.log(
        "[PARTIO] Payment Vault:",
        vaultAddress
      );

      /*
       * Save recovery information immediately.
       * This is intentionally done before any
       * Unified Balance or wallet transfer.
       */

      savePendingPayment(
        address,
        {
          paymentId:
            paymentId.toString(),
          vaultAddress,
          recipients:
            validRecipients.map(
              (recipient) => ({
                name:
                  recipient.name,
                address:
                  recipient.address,
                amount:
                  recipient.amount,
              })
            ),
          totalAmount:
            formatUnits(
              totalAmountUnits,
              6
            ),
        }
      );

      /*
       * STEP 2
       * Circle Unified Balance.
       */

      console.time(
        "[PARTIO] createArcAdapter"
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

      console.timeEnd(
        "[PARTIO] createArcAdapter"
      );

      const unifiedBalance =
        await getUnifiedBalances(
          adapter
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

      let unifiedAmount = 0n;

      if (
        unifiedCandidate > 0n
      ) {
        unifiedAmount =
          await findMaxUnifiedSpend(
            adapter,
            unifiedCandidate,
            vaultAddress
          );
      }

      const walletAmount =
        totalAmountUnits -
        unifiedAmount;

      console.log(
        "[PARTIO] Unified amount:",
        formatUnits(
          unifiedAmount,
          6
        ),
        "USDC"
      );

      console.log(
        "[PARTIO] Wallet amount:",
        formatUnits(
          walletAmount,
          6
        ),
        "USDC"
      );

      /*
       * STEP 3
       * Check wallet balance if needed.
       */

      if (
        walletAmount > 0n
      ) {
        const walletBalance =
          await getWalletUSDCBalance(
            address
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
       * STEP 4
       * Unified Balance → Vault.
       */

      if (
        unifiedAmount > 0n
      ) {
        console.log(
          "[PARTIO] Unified Balance → Vault"
        );

        setIsWriting(true);

        await spendUSDC(
          adapter,
          vaultAddress,
          formatUnits(
            unifiedAmount,
            6
          )
        );

        setIsWriting(false);

        console.log(
          "[PARTIO] Unified Balance spend completed."
        );
      }

      /*
       * STEP 5
       * Wallet → Vault.
       */

      if (
        walletAmount > 0n
      ) {
        console.log(
          "[PARTIO] Wallet → Vault"
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
              vaultAddress,
              walletAmount,
            ],
          });

        console.log(
          "[PARTIO] Wallet transfer:",
          walletTransferHash
        );

        const walletTransferReceipt =
          await walletClient.waitForTransactionReceipt(
            {
              hash:
                walletTransferHash,
            }
          );

        if (
          walletTransferReceipt.status !==
          "success"
        ) {
          throw new Error(
            "USDC transfer to the payment vault failed on-chain. The payment was not executed. Check the pending payment recovery panel."
          );
        }

        setIsWriting(false);
      }

      /*
       * STEP 6
       * Vault → Recipients.
       */

      console.log(
        "[PARTIO] Executing payment from Vault..."
      );

      setIsWriting(true);

      const executeHash =
        await writeContractAsync({
          address:
            vaultAddress,
          abi:
            PARTIO_VAULT_ABI,
          functionName:
            "execute",
          args: [
            recipientAddresses,
            amounts,
            totalAmountUnits,
          ],
        });

      console.log(
        "[PARTIO] Vault execute tx:",
        executeHash
      );

      setTxHash(
        executeHash
      );

      setIsWriting(false);
      setIsConfirming(true);

      const txReceipt =
        await walletClient.waitForTransactionReceipt(
          {
            hash:
              executeHash,
          }
        );

      setReceipt(
        txReceipt
      );

      if (
        txReceipt.status !==
        "success"
      ) {
        throw new Error(
          "Payment execution failed on-chain. Your funds remain in the payment vault."
        );
      }

      setIsConfirming(false);
      setIsConfirmed(true);

      /*
       * Payment completed successfully.
       * Remove the recovery record.
       */

      removePendingPayment(
        address,
        paymentId.toString()
      );

      console.log(
        "========== PARTIO V2 PAYMENT COMPLETE =========="
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
