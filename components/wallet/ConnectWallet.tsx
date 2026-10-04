"use client";

import { useEffect, useState } from "react";

import {
  formatUnits,
  encodeFunctionData,
} from "viem";

import {
  useAccount,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from "wagmi";

import { injected } from "wagmi/connectors";

import { arcMainnet } from "@/lib/wagmi";

import { Contact } from "@/types/contact";
import { Recipient } from "@/types/recipient";
import { SavedGroup } from "@/types/saved-group";

import { useContacts } from "@/hooks/useContacts";
import { useRecipients } from "@/hooks/useRecipients";
import { usePartition } from "@/hooks/usePartition";
import { useSavedGroups } from "@/hooks/useSavedGroups";

import ContactForm from "../contacts/ContactForm";
import ContactsPanel from "../contacts/ContactsPanel";
import RecipientsPanel from "../recipients/RecipientsPanel";
import SavedGroupsPanel from "../groups/SavedGroupsPanel";

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

const AGENT_DRAFT_KEY =
  "partio_agent_draft";

const AGENT_ACTION_KEY =
  "partio_agent_action";

type EthereumProvider = {
  request: (args: {
    method: string;
    params?: unknown[];
  }) => Promise<unknown>;
};

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

  const [
    walletBalance,
    setWalletBalance,
  ] = useState(0);

  const [
    agentDraftLoaded,
    setAgentDraftLoaded,
  ] = useState(false);

  const [
    agentAction,
    setAgentAction,
  ] = useState<
    "check" | "send" | null
  >(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    address,
    chainId,
    isConnected,
  } = useAccount();

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
    loadRecipients,
    clearRecipients,
  } = useRecipients();

  const {
    savedGroups,
    handleCreate: handleCreateGroup,
    handleUpdate: handleUpdateGroup,
    handleDelete: handleDeleteGroup,
  } = useSavedGroups();

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

  useEffect(() => {
    if (
      !mounted ||
      agentDraftLoaded
    ) {
      return;
    }

    try {
      const storedDraft =
        localStorage.getItem(
          AGENT_DRAFT_KEY
        );

      const storedAction =
        localStorage.getItem(
          AGENT_ACTION_KEY
        );

      if (!storedDraft) {
        setAgentDraftLoaded(true);
        return;
      }

      const parsedDraft =
        JSON.parse(
          storedDraft
        ) as Recipient[];

      if (
        !Array.isArray(
          parsedDraft
        )
      ) {
        localStorage.removeItem(
          AGENT_DRAFT_KEY
        );

        localStorage.removeItem(
          AGENT_ACTION_KEY
        );

        setAgentDraftLoaded(true);

        return;
      }

      const validRecipients =
        parsedDraft.filter(
          (recipient) =>
            recipient &&
            typeof recipient.id ===
              "string" &&
            typeof recipient.name ===
              "string" &&
            typeof recipient.address ===
              "string" &&
            typeof recipient.amount ===
              "string"
        ) as Recipient[];

      if (
        validRecipients.length > 0
      ) {
        loadRecipients(
          validRecipients
        );

        if (
          storedAction === "send"
        ) {
          setAgentAction(
            "send"
          );
        } else {
          setAgentAction(
            "check"
          );
        }
      }

      localStorage.removeItem(
        AGENT_DRAFT_KEY
      );

      localStorage.removeItem(
        AGENT_ACTION_KEY
      );

    } catch (error) {
      console.error(
        "[PARTIO] Agent draft load error:",
        error
      );

      localStorage.removeItem(
        AGENT_DRAFT_KEY
      );

      localStorage.removeItem(
        AGENT_ACTION_KEY
      );

    } finally {
      setAgentDraftLoaded(true);
    }

  }, [
    mounted,
    agentDraftLoaded,
    loadRecipients,
  ]);

  useEffect(() => {
    if (
      agentAction !== "send" ||
      recipients.length === 0
    ) {
      return;
    }

    const timeout =
      setTimeout(() => {
        setReviewOpen(true);
        setAgentAction(null);
      }, 300);

    return () =>
      clearTimeout(timeout);

  }, [
    agentAction,
    recipients.length,
  ]);

  async function refreshWalletBalance() {
    if (
      !address ||
      !window.ethereum ||
      chainId !== arcMainnet.id
    ) {
      setWalletBalance(0);

      return;
    }

    try {
      const data =
        encodeFunctionData({
          abi: USDC_ABI,
          functionName: "balanceOf",
          args: [address],
        });

      const result =
        await window.ethereum.request({
          method: "eth_call",
          params: [
            {
              to: USDC_ADDRESS,
              data,
            },
            "latest",
          ],
        });

      const balanceHex =
        result as string;

      const balance =
        BigInt(balanceHex);

      setWalletBalance(
        Number(
          formatUnits(
            balance,
            6
          )
        )
      );

    } catch (error) {
      console.error(
        "[PARTIO] Wallet balance error:",
        error
      );

      setWalletBalance(0);
    }
  }

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

  async function refreshAllBalances() {
    await Promise.all([
      refreshWalletBalance(),
      refreshUnifiedBalance(),
    ]);
  }

  useEffect(() => {
    if (
      !mounted ||
      !isConnected
    ) {
      return;
    }

    refreshAllBalances();

    const interval =
      setInterval(
        refreshAllBalances,
        15000
      );

    return () =>
      clearInterval(interval);

  }, [
    mounted,
    isConnected,
    address,
    chainId,
  ]);

  useEffect(() => {
    if (
      !mounted ||
      !window.ethereum
    ) {
      return;
    }

    const handleAccountsChanged =
      () => {
        refreshWalletBalance();
      };

    const handleChainChanged =
      () => {
        refreshWalletBalance();
      };

    const provider =
      window.ethereum as EthereumProvider & {
        on?: (
          event: string,
          listener: (
            ...args: unknown[]
          ) => void
        ) => void;

        removeListener?: (
          event: string,
          listener: (
            ...args: unknown[]
          ) => void
        ) => void;
      };

    provider.on?.(
      "accountsChanged",
      handleAccountsChanged
    );

    provider.on?.(
      "chainChanged",
      handleChainChanged
    );

    return () => {
      provider.removeListener?.(
        "accountsChanged",
        handleAccountsChanged
      );

      provider.removeListener?.(
        "chainChanged",
        handleChainChanged
      );
    };

  }, [
    mounted,
  ]);

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

  function handleAddSavedGroup(
    group: SavedGroup
  ) {
    const groupContacts =
      group.contactIds
        .map((contactId) =>
          contacts.find(
            (contact) =>
              contact.id ===
              contactId
          )
        )
        .filter(
          (
            contact
          ): contact is Contact =>
            Boolean(contact)
        );

    groupContacts.forEach(
      (contact) => {
        handleAddRecipient(
          contact
        );
      }
    );
  }

  function handleNewPayment() {
    resetTransaction();
    clearRecipients();
    setReviewOpen(false);
    setAgentAction(null);
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
    arcMainnet.id;

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
              arcMainnet.id,
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

          <div className="mt-2 grid grid-cols-1 gap-2 xl:grid-cols-3">
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

            <SavedGroupsPanel
              contacts={
                contacts
              }
              savedGroups={
                savedGroups
              }
              onCreate={
                handleCreateGroup
              }
              onUpdate={
                handleUpdateGroup
              }
              onDelete={
                handleDeleteGroup
              }
              onAdd={
                handleAddSavedGroup
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
              walletBalance={
                walletBalance
              }
              unifiedBalance={
                confirmedDeposit
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