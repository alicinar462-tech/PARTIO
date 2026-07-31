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
      <div className="rounded-xl border border-dashed border-neutral-700 bg-neutral-950 py-12 text-center">
        <p className="text-lg font-medium text-neutral-300">
          No recipients selected
        </p>

        <p className="mt-2 text-sm text-neutral-500">
          Add contacts to build your payment.
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