"use client";

import { useEffect, useState } from "react";

import {
  useAccount,
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

export default function ConnectWallet() {
  const [mounted, setMounted] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { address, chainId, isConnected } =
    useAccount();

  const { connect, isPending: isConnecting } =
    useConnect();

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
  } = useRecipients();

  const {
    partition,
    isWriting,
    isConfirming,
    isConfirmed,
  } = usePartition(recipients);

  useEffect(() => {
    if (!isConfirmed) return;

    setReviewOpen(false);
  }, [isConfirmed]);

  function handleDeleteContact(contact: Contact) {
    handleDelete(contact);
    handleRemoveRecipient(contact.id);
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
          isSwitching={isSwitching}
          onSwitchNetwork={() =>
            switchChain({
              chainId: arcTestnet.id,
            })
          }
          onDisconnect={() => disconnect()}
        />

        {isCorrectNetwork && (
          <>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-white">
                  Add New Contact
                </h2>

                <p className="mt-1 text-sm text-neutral-400">
                  Save wallet addresses for future payment partitions.
                </p>
              </div>

              <ContactForm
                onCreate={handleCreate}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <ContactsPanel
                contacts={contacts}
                recipientIds={recipients.map(
                  (recipient) => recipient.id
                )}
                onDelete={handleDeleteContact}
                onAddRecipient={
                  handleAddRecipient
                }
              />

              <RecipientsPanel
                recipients={recipients}
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
              totalAmount={totalAmount}
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
        isConfirming={isConfirming}
        onClose={() =>
          setReviewOpen(false)
        }
        onConfirm={partition}
      />
    </>
  );
}