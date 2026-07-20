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
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-white">
          Recipients
        </h2>

        <p className="mt-1 text-xs text-neutral-400">
          Selected contacts and assigned amounts.
        </p>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="h-10 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-blue-500"
        />
      </div>

      <div className="max-h-[420px] overflow-y-auto pr-1">
        <RecipientList
          recipients={filteredRecipients}
          onAmountChange={onAmountChange}
          onRemove={onRemove}
        />
      </div>

      {filteredRecipients.length === 0 && (
        <div className="py-8 text-center text-sm text-neutral-500">
          No recipients yet.
        </div>
      )}
    </section>
  );
}