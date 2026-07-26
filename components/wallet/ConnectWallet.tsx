"use client";
import { parseEther } from "viem";

import {
  PARTIO_ABI,
  PARTIO_ADDRESS,
} from "@/lib/contracts/partio";
import { useEffect, useMemo, useState } from "react";

import {
  useAccount,
  useConnect,
  useDisconnect,
  useSwitchChain,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { injected } from "wagmi/connectors";

import { arcTestnet } from "@/lib/wagmi";

import { Contact } from "@/types/contact";
import { Recipient } from "@/types/recipient";

import {
  createContact,
  deleteContact,
  getContacts,
} from "@/lib/services/contacts";

import {
  addRecipient,
  removeRecipient,
  updateRecipientAmount,
} from "@/lib/services/recipients";

import ContactForm from "../contacts/ContactForm";
import ContactsPanel from "../contacts/ContactsPanel";
import RecipientsPanel from "../recipients/RecipientsPanel";
import NetworkBadge from "./NetworkBadge";
import WalletAddress from "./WalletAddress";

export default function ConnectWallet() {
  const [mounted, setMounted] = useState(false);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);

  useEffect(() => {
    setMounted(true);
    setContacts(getContacts());
  }, []);

  const { address, chainId, isConnected } = useAccount();

  const { connect, isPending: isConnecting } = useConnect();

  const { disconnect } = useDisconnect();

  const {
    switchChain,
    isPending: isSwitching,
  } = useSwitchChain();
const {
  writeContract,
  data: hash,
  isPending: isWriting,
  error: writeError,
} = useWriteContract();

const {
  isLoading: isConfirming,
  isSuccess: isConfirmed,
} = useWaitForTransactionReceipt({
  hash,
});
  function handleCreate(
    name: string,
    address: `0x${string}`
  ) {
    createContact(name, address);
    setContacts(getContacts());
  }

  function handleDelete(contact: Contact) {
    const confirmed = window.confirm(
      `Delete "${contact.name}" from your contacts?`
    );

    if (!confirmed) return;

    deleteContact(contact.id);
    setContacts(getContacts());

    setRecipients((current) =>
      removeRecipient(current, contact.id)
    );
  }

  function handleAddRecipient(contact: Contact) {
    setRecipients((current) =>
      addRecipient(current, contact)
    );
  }

  function handleRemoveRecipient(id: string) {
    setRecipients((current) =>
      removeRecipient(current, id)
    );
  }

  function handleAmountChange(
    id: string,
    amount: string
  ) {
    setRecipients((current) =>
      updateRecipientAmount(current, id, amount)
    );
  }

  async function handlePartition() {
    const validRecipients = recipients.filter((recipient) => {
      const value = Number(recipient.amount);

      return !Number.isNaN(value) && value > 0;
    });

    if (validRecipients.length === 0) {
      return;
    }

    const recipientAddresses = validRecipients.map(
      (recipient) => recipient.address
    );

    const amounts = validRecipients.map((recipient) =>
      parseEther(recipient.amount)
    );

    const totalValue = amounts.reduce(
      (sum, amount) => sum + amount,
      0n
    );

    writeContract({
      address: PARTIO_ADDRESS,
      abi: PARTIO_ABI,
      functionName: "partition",
      args: [recipientAddresses, amounts],
      value: totalValue,
    });
  }

  const totalAmount = useMemo(() => {
    return recipients.reduce((sum, recipient) => {
      const value = Number(recipient.amount);

      if (Number.isNaN(value)) {
        return sum;
      }

      return sum + value;
    }, 0);
  }, [recipients]);

  const hasValidAmounts = useMemo(() => {
    return recipients.some((recipient) => {
      const value = Number(recipient.amount);

      return !Number.isNaN(value) && value > 0;
    });
  }, [recipients]);

  if (!mounted) return null;

  if (!isConnected) {
    return (
      <button
        onClick={() =>
          connect({ connector: injected() })
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
    <div className="w-full space-y-8">
      {/* Wallet Card */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <div className="mb-4 text-lg font-semibold text-green-500">
          Wallet Connected
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <WalletAddress address={address} />

            <NetworkBadge
              chainId={chainId}
              expectedChainId={arcTestnet.id}
            />
          </div>

          <div className="flex gap-3">
            {!isCorrectNetwork && (
              <button
                onClick={() =>
                  switchChain({
                    chainId: arcTestnet.id,
                  })
                }
                disabled={isSwitching}
                className="rounded-lg bg-yellow-500 px-4 py-2 font-semibold text-black hover:bg-yellow-400"
              >
                {isSwitching
                  ? "Switching..."
                  : "Switch Network"}
              </button>
            )}

            <button
              onClick={() => disconnect()}
              className="rounded-lg bg-red-600 px-4 py-2 hover:bg-red-700"
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>

      {isCorrectNetwork && (
        <>
          {/* Add Contact */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-white">
                Add New Contact
              </h2>

              <p className="mt-1 text-sm text-neutral-400">
                Save wallet addresses for future payment partitions.
              </p>
            </div>

            <ContactForm onCreate={handleCreate} />
          </div>

          {/* Panels */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ContactsPanel
              contacts={contacts}
              recipientIds={recipients.map(
                (recipient) => recipient.id
              )}
              onDelete={handleDelete}
              onAddRecipient={handleAddRecipient}
            />

            <RecipientsPanel
              recipients={recipients}
              onAmountChange={handleAmountChange}
              onRemove={handleRemoveRecipient}
            />
          </div>

          {/* Summary */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="mb-4 text-lg font-semibold">
              Summary
            </h2>

            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <p className="text-neutral-400">
                  Recipients
                </p>

                <p className="text-2xl font-bold">
                  {recipients.length}
                </p>
              </div>

              <div>
                <p className="text-neutral-400">
                  Total USDC
                </p>

                <p className="text-2xl font-bold">
                  {totalAmount.toFixed(2)}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  disabled={!hasValidAmounts}
                  className={`rounded-lg px-5 py-2 font-medium transition ${
                    hasValidAmounts
                      ? "bg-green-600 text-white hover:bg-green-500"
                      : "bg-neutral-700 text-neutral-400"
                  }`}
                >
                  Approve
                </button>

                <button
                  onClick={handlePartition}
                  disabled={
                    !hasValidAmounts ||
                    isWriting ||
                    isConfirming
                  }
                  className={`rounded-lg px-5 py-2 font-medium text-white ${
                    !hasValidAmounts ||
                    isWriting ||
                    isConfirming
                      ? "bg-blue-600 opacity-50"
                      : "bg-blue-600 hover:bg-blue-500"
                  }`}
                >
                  {isWriting
                    ? "Waiting for wallet..."
                    : isConfirming
                    ? "Confirming..."
                    : "Partition"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}