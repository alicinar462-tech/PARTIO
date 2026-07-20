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

  const { connect, isPending: isConnecting } =
    useConnect();

  const { disconnect } = useDisconnect();

  const {
    switchChain,
    isPending: isSwitching,
  } = useSwitchChain();

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
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ContactsPanel
              contacts={contacts}
              onCreate={handleCreate}
              onDelete={handleDelete}
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
                  Coming Soon
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  disabled
                  className="rounded-lg bg-neutral-700 px-5 py-2 text-neutral-400"
                >
                  Approve
                </button>

                <button
                  disabled
                  className="rounded-lg bg-blue-600 px-5 py-2 text-white opacity-50"
                >
                  Split
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}