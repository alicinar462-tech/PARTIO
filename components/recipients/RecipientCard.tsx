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
  const shortenedAddress =
    `${recipient.address.slice(0, 6)}...${recipient.address.slice(-4)}`;

  return (
    <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-800/70 px-3 py-2 transition hover:border-neutral-700 hover:bg-neutral-800">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
          {recipient.name.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">
            {recipient.name}
          </p>

          <p className="truncate font-mono text-xs text-neutral-400">
            {shortenedAddress}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
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
          className="h-8 w-24 rounded-lg border border-neutral-700 bg-neutral-900 px-2 text-right text-sm text-white outline-none focus:border-blue-500"
        />

        <button
          onClick={() => onRemove(recipient.id)}
          title="Remove recipient"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
        >
          🗑
        </button>
      </div>
    </div>
  );
}