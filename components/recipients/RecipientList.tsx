"use client";

import { Recipient } from "@/types/recipient";

import RecipientCard from "./RecipientCard";

interface RecipientListProps {
  recipients: Recipient[];
  onAmountChange: (
    recipientId: string,
    amount: string
  ) => void;
  onRemove: (recipientId: string) => void;
}

export default function RecipientList({
  recipients,
  onAmountChange,
  onRemove,
}: RecipientListProps) {
  if (recipients.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-700 p-8 text-center">
        <p className="text-neutral-400">
          No recipients selected.
        </p>

        <p className="mt-2 text-sm text-neutral-500">
          Choose one or more contacts to start building your payment partition.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recipients.map((recipient) => (
        <RecipientCard
          key={recipient.id}
          recipient={recipient}
          onAmountChange={onAmountChange}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}