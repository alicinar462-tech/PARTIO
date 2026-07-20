"use client";

import { Recipient } from "@/types/recipient";

import RecipientList from "./RecipientList";

interface RecipientsPanelProps {
  recipients: Recipient[];
  onAmountChange: (
    id: string,
    amount: string
  ) => void;
  onRemove: (id: string) => void;
}

export default function RecipientsPanel({
  recipients,
  onAmountChange,
  onRemove,
}: RecipientsPanelProps) {
  return (
    <section className="mt-10 w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">
          Recipients
        </h2>

        <p className="mt-1 text-sm text-neutral-400">
          Selected contacts and assigned amounts.
        </p>
      </div>

      <RecipientList
        recipients={recipients}
        onAmountChange={onAmountChange}
        onRemove={onRemove}
      />
    </section>
  );
}