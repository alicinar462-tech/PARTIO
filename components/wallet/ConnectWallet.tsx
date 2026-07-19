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
import {
  createContact,
  deleteContact,
  getContacts,
} from "@/lib/services/contacts";

import ContactsPanel from "../contacts/ContactsPanel";
import RecipientsPanel from "../recipients/RecipientsPanel";
import NetworkBadge from "./NetworkBadge";
import WalletAddress from "./WalletAddress";

export default function ConnectWallet() {
  const [mounted, setMounted] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);

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

    if (!confirmed) {
      return;
    }

    deleteContact(contact.id);
    setContacts(getContacts());
  }

  if (!mounted) {
    return null;
  }

  if (!isConnected) {
    return (
      <button
        onClick={() => connect({ connector: injected() })}
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
    <div className="flex w-full max-w-2xl flex-col items-center gap-4">
      <div className="font-semibold text-green-500">
        Wallet Connected
      </div>

      <WalletAddress address={address} />

      <NetworkBadge
        chainId={chainId}
        expectedChainId={arcTestnet.id}
      />

      {!isCorrectNetwork && (
        <button
          onClick={() =>
            switchChain({
              chainId: arcTestnet.id,
            })
          }
          disabled={isSwitching}
          className="rounded-lg bg-yellow-500 px-5 py-2 font-semibold text-black hover:bg-yellow-400"
        >
          {isSwitching
            ? "Switching..."
            : "Switch to ARC Testnet"}
        </button>
      )}

      <button
        onClick={() => disconnect()}
        className="rounded-lg bg-red-600 px-5 py-2 text-white hover:bg-red-700"
      >
        Disconnect
      </button>

      {isCorrectNetwork && (
        <>
          <ContactsPanel
            contacts={contacts}
            onCreate={handleCreate}
            onDelete={handleDelete}
          />

          <RecipientsPanel
            contacts={contacts}
          />
        </>
      )}
    </div>
  );
}