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
    <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-800/60 p-3 transition hover:border-blue-500/40 hover:bg-neutral-800">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
          {recipient.name.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0">
          <p className="truncate font-semibold text-white">
            {recipient.name}
          </p>

          <p className="truncate font-mono text-xs text-neutral-400">
            {shortenedAddress}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="flex h-10 items-center rounded-lg border border-neutral-700 bg-neutral-900 px-3">
          <input
            type="number"
            min="0"
            step="0.000001"
            placeholder="0.00"
            value={recipient.amount}
            onChange={(e) =>
              onAmountChange(
                recipient.id,
                e.target.value
              )
            }
            className="h-10 w-24 bg-transparent text-right text-sm text-white outline-none"
          />

          <span className="ml-2 text-xs font-medium text-neutral-400">
            USDC
          </span>
        </div>

        <button
          type="button"
          onClick={() => onRemove(recipient.id)}
          title="Remove recipient"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-500/20 text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
        >
          ✕
        </button>
      </div>
    </div>
  );
}