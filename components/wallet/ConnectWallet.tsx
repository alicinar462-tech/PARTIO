"use client";

import { useEffect, useState } from "react";

import { formatEther } from "viem";

import {
  useAccount,
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

import SummaryCard from "../payment/SummaryCard";
import ReviewModal from "../payment/ReviewModal";

const GAS_BUFFER = 0.01;

export default function ConnectWallet() {
  const [mounted, setMounted] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { address, chainId, isConnected } =
    useAccount();

  const { data: balanceData } = useBalance({
    address,
  });

  const availableBalance = Number(
    formatEther(balanceData?.value ?? 0n)
  );

  const {
    connect,
    isPending: isConnecting,
  } = useConnect();

  const { disconnect } = useDisconnect();

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
  } = usePartition(recipients);

  const remainingBalance =
    availableBalance - totalAmount;

  const missingAmount = Math.max(
    totalAmount - availableBalance,
    0
  );

  const hasEnoughBalance =
    availableBalance >=
    totalAmount + GAS_BUFFER;

  function handleDeleteContact(
    contact: Contact
  ) {
    handleDelete(contact);
    handleRemoveRecipient(contact.id);
  }

  function handleNewPayment() {
    resetTransaction();
    clearRecipients();
    setReviewOpen(false);
  }

  if (!mounted) return null;

  if (!isConnected) {
    return (
      <button
        onClick={() =>
          connect({
            connector: injected(),
          })
        }
        disabled={isConnecting}
        className="rounded-lg bg-white px-6 py-3 font-semibold text-black hover:bg-gray-200"
      >
        {isConnecting
          ? "Connecting..."
          : "Connect Wallet"}
      </button>
    );
  }

  const isCorrectNetwork =
    chainId === arcTestnet.id;

  return (
    <>
      <div className="w-full space-y-8">
        <WalletCard
          address={address}
          chainId={chainId}
          availableBalance={
            availableBalance
          }
          isSwitching={isSwitching}
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

        {isCorrectNetwork && (
          <>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
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

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <ContactsPanel
                contacts={contacts}
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
                setReviewOpen(true)
              }
            />
          </>
        )}
      </div>

      <ReviewModal
        open={reviewOpen}
        recipients={recipients}
        totalAmount={totalAmount}
        isWriting={isWriting}
        isConfirming={
          isConfirming
        }
        isConfirmed={
          isConfirmed
        }
        txHash={txHash}
        writeError={writeError}
        onClose={() =>
          setReviewOpen(false)
        }
        onConfirm={partition}
        onNewPayment={
          handleNewPayment
        }
      />
    </>
  );
}