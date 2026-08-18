"use client";

import { useMemo, useState } from "react";

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
  const [search, setSearch] = useState("");

  const filteredRecipients = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return recipients;
    }

    return recipients.filter((recipient) => {
      return (
        recipient.name
          .toLowerCase()
          .includes(query) ||
        recipient.address
          .toLowerCase()
          .includes(query)
      );
    });
  }, [recipients, search]);

  return (
    <section className="flex h-[500px] min-h-0 flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
      <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-white">
            Recipients
          </h2>

          <p className="mt-1 truncate text-xs text-neutral-400">
            Choose how much each recipient will receive.
          </p>
        </div>

        <div className="shrink-0 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5">
          <p className="text-center text-[10px] text-neutral-400">
            Selected
          </p>

          <p className="text-center text-base font-bold leading-5 text-white">
            {recipients.length}
          </p>
        </div>
      </div>

      <div className="mb-3 shrink-0">
        <input
          type="text"
          placeholder="Search recipients..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="h-10 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-blue-500"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {recipients.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-neutral-700 bg-neutral-950 p-6 text-center">
            <div>
              <p className="text-sm font-medium text-neutral-300">
                No recipients yet
              </p>

              <p className="mt-2 text-xs text-neutral-500">
                Add contacts from the left panel to start building your payment.
              </p>
            </div>
          </div>
        ) : filteredRecipients.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-neutral-700 text-center">
            <p className="text-sm text-neutral-400">
              No matching recipients found.
            </p>
          </div>
        ) : (
          <RecipientList
            recipients={filteredRecipients}
            onAmountChange={onAmountChange}
            onRemove={onRemove}
          />
        )}
      </div>
    </section>
  );
}