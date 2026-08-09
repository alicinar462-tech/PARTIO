"use client";

import { useEffect, useState } from "react";

import {
  formatUnits,
  type Address,
} from "viem";

import {
  useAccount,
  usePublicClient,
  useBalance,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from "wagmi";

import { injected } from "wagmi/connectors";

import { arcTestnet } from "@/lib/wagmi";

import { Contact } from "@/types/contact";

import { useContacts } from "@/hooks/useContacts";
import { useRecipients } from "@/hooks/useRecipients";
import { usePartition } from "@/hooks/usePartition";

import ContactForm from "../contacts/ContactForm";
import ContactsPanel from "../contacts/ContactsPanel";
import RecipientsPanel from "../recipients/RecipientsPanel";

import WalletCard from "./WalletCard";

import UnifiedBalanceCard from "@/src/unified/UnifiedBalanceCard";
import { createArcAdapter } from "@/src/unified/adapters/viem";
import { getUnifiedBalances } from "@/src/unified/gateway/balances";

import SummaryCard from "../payment/SummaryCard";
import ReviewModal from "../payment/ReviewModal";

const GAS_BUFFER = 0.01;

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
] as const;

export default function ConnectWallet() {
  const [mounted, setMounted] =
    useState(false);

  const [reviewOpen, setReviewOpen] =
    useState(false);

  const [
    confirmedDeposit,
    setConfirmedDeposit,
  ] = useState(0);

  const [
    balanceRefreshing,
    setBalanceRefreshing,
  ] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    address,
    chainId,
    isConnected,
  } = useAccount();

  const publicClient =
    usePublicClient();

  const {
    data: balanceData,
  } = useBalance({
    address,
  });

  const walletNativeBalance =
    Number(
      formatUnits(
        balanceData?.value ?? 0n,
        balanceData?.decimals ?? 18
      )
    );

  const {
    connect,
    isPending: isConnecting,
  } = useConnect();

  const {
    disconnect,
  } = useDisconnect();

  const {
    switchChain,
    isPending: isSwitching,
  } = useSwitchChain();

  const {
    contacts,
    handleCreate,
    handleDelete,
  } = useContacts();

  const {
    recipients,
    totalAmount,
    hasValidAmounts,
    handleAddRecipient,
    handleRemoveRecipient,
    handleAmountChange,
    clearRecipients,
  } = useRecipients();

  const {
    partition,
    resetTransaction,
    isWriting,
    isConfirming,
    isConfirmed,
    txHash,
    writeError,
  } = usePartition(
    recipients
  );

  async function refreshUnifiedBalance() {
    try {
      setBalanceRefreshing(true);

      const adapter =
        await createArcAdapter();

      const balance =
        await getUnifiedBalances(
          adapter
        );

      setConfirmedDeposit(
        Number(
          balance.totalConfirmedBalance ??
            "0"
        )
      );
    } catch (error) {
      console.error(
        "Unified Balance Refresh Error",
        error
      );
    } finally {
      setBalanceRefreshing(false);
    }
  }

  useEffect(() => {
    if (!mounted || !isConnected) {
      return;
    }

    refreshUnifiedBalance();

    const interval =
      setInterval(
        refreshUnifiedBalance,
        15000
      );

    return () =>
      clearInterval(interval);
  }, [
    mounted,
    isConnected,
    address,
  ]);

  const walletBalance =
    walletNativeBalance;

  const availableBalance =
    walletBalance +
    confirmedDeposit;

  const remainingBalance =
    availableBalance -
    totalAmount -
    GAS_BUFFER;

  const missingAmount =
    Math.max(
      totalAmount +
        GAS_BUFFER -
        availableBalance,
      0
    );

  const hasEnoughBalance =
    availableBalance >=
    totalAmount +
      GAS_BUFFER;

  function handleDeleteContact(
    contact: Contact
  ) {
    handleDelete(contact);
    handleRemoveRecipient(
      contact.id
    );
  }

  function handleNewPayment() {
    resetTransaction();
    clearRecipients();
    setReviewOpen(false);
  }

  if (!mounted) {
    return null;
  }

  if (!isConnected) {
    return (
      <button
        onClick={() =>
          connect({
            connector: injected(),
          })
        }
        disabled={
          isConnecting
        }
        className="rounded-lg bg-white px-6 py-3 font-semibold text-black hover:bg-gray-200"
      >
        {isConnecting
          ? "Connecting..."
          : "Connect Wallet"}
      </button>
    );
  }

  const isCorrectNetwork =
    chainId ===
    arcTestnet.id;

  return (
    <>
      <WalletCard
        address={address}
        chainId={chainId}
        availableBalance={
          availableBalance
        }
        isSwitching={
          isSwitching
        }
        onSwitchNetwork={() =>
          switchChain({
            chainId:
              arcTestnet.id,
          })
        }
        onDisconnect={() =>
          disconnect()
        }
      />

      <div className="mt-2">
        <UnifiedBalanceCard />
      </div>

      {isCorrectNetwork && (
        <>
          <div className="mt-2 rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-white">
                Add New Contact
              </h2>

              <p className="mt-1 text-sm text-neutral-400">
                Save wallet addresses
                for future payment
                partitions.
              </p>
            </div>

            <ContactForm
              onCreate={
                handleCreate
              }
            />
          </div>

          <div className="mt-2 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ContactsPanel
              contacts={
                contacts
              }
              recipientIds={recipients.map(
                (
                  recipient
                ) =>
                  recipient.id
              )}
              onDelete={
                handleDeleteContact
              }
              onAddRecipient={
                handleAddRecipient
              }
            />

            <RecipientsPanel
              recipients={
                recipients
              }
              onAmountChange={
                handleAmountChange
              }
              onRemove={
                handleRemoveRecipient
              }
            />
          </div>

          <div className="mt-2">
            <SummaryCard
              recipientCount={
                recipients.length
              }
              totalAmount={
                totalAmount
              }
              availableBalance={
                availableBalance
              }
              remainingBalance={
                remainingBalance
              }
              missingAmount={
                missingAmount
              }
              hasEnoughBalance={
                hasEnoughBalance
              }
              hasValidAmounts={
                hasValidAmounts
              }
              onReview={() =>
                setReviewOpen(
                  true
                )
              }
            />
          </div>

          {balanceRefreshing && (
            <p className="mt-2 text-center text-xs text-neutral-500">
              Updating balance...
            </p>
          )}
        </>
      )}

      <ReviewModal
        open={
          reviewOpen
        }
        recipients={
          recipients
        }
        totalAmount={
          totalAmount
        }
        isWriting={
          isWriting
        }
        isConfirming={
          isConfirming
        }
        isConfirmed={
          isConfirmed
        }
        txHash={
          txHash
        }
        writeError={
          writeError
        }
        onClose={() =>
          setReviewOpen(
            false
          )
        }
        onConfirm={
          partition
        }
        onNewPayment={
          handleNewPayment
        }
      />
    </>
  );
}