"use client";

import { Recipient } from "@/types/recipient";

interface RecipientCardProps {
  recipient: Recipient;
  onAmountChange: (
    recipientId: string,
    amount: string
  ) => void;
  onRemove: (recipientId: string) => void;
}

export default function RecipientCard({
  recipient,
  onAmountChange,
  onRemove,
}: RecipientCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <div className="flex-1">
        <p className="font-semibold text-white">
          {recipient.name}
        </p>

        <p className="truncate font-mono text-xs text-neutral-400">
          {recipient.address}
        </p>
      </div>

      <input
        type="number"
        min="0"
        step="0.000001"
        placeholder="0.0"
        value={recipient.amount}
        onChange={(e) =>
          onAmountChange(
            recipient.id,
            e.target.value
          )
        }
        className="w-32 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-right text-white outline-none focus:border-blue-500"
      />

      <button
        onClick={() => onRemove(recipient.id)}
        className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
      >
        Remove
      </button>
    </div>
  );
}