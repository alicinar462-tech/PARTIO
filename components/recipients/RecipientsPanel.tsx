"use client";

import { useState } from "react";

import { Contact } from "@/types/contact";
import { Recipient } from "@/types/recipient";

import {
  addRecipient,
  removeRecipient,
  updateRecipientAmount,
} from "@/lib/services/recipients";

import RecipientList from "./RecipientList";

interface RecipientsPanelProps {
  contacts: Contact[];
}

export default function RecipientsPanel({
  contacts,
}: RecipientsPanelProps) {
  const [recipients, setRecipients] = useState<
    Recipient[]
  >([]);

  function handleAdd(contact: Contact) {
    setRecipients((current) =>
      addRecipient(current, contact)
    );
  }

  function handleRemove(id: string) {
    setRecipients((current) =>
      removeRecipient(current, id)
    );
  }

  function handleAmountChange(
    id: string,
    amount: string
  ) {
    setRecipients((current) =>
      updateRecipientAmount(
        current,
        id,
        amount
      )
    );
  }

  return (
    <section className="mt-10 w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">
          Recipients
        </h2>

        <p className="mt-1 text-sm text-neutral-400">
          Select contacts and assign amounts.
        </p>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {contacts.map((contact) => (
          <button
            key={contact.id}
            onClick={() => handleAdd(contact)}
            className="rounded-lg border border-neutral-700 px-3 py-2 text-sm text-white hover:bg-neutral-800"
          >
            {contact.name}
          </button>
        ))}
      </div>

      <RecipientList
        recipients={recipients}
        onAmountChange={handleAmountChange}
        onRemove={handleRemove}
      />
    </section>
  );
}