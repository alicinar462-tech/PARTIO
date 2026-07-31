"use client";

import { useMemo, useState } from "react";

import { Contact } from "@/types/contact";

import ContactList from "./ContactList";

interface ContactsPanelProps {
  contacts: Contact[];
  recipientIds: string[];
  onDelete: (contact: Contact) => void;
  onAddRecipient: (contact: Contact) => void;
}

export default function ContactsPanel({
  contacts,
  recipientIds,
  onDelete,
  onAddRecipient,
}: ContactsPanelProps) {
  const [search, setSearch] = useState("");

  const filteredContacts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return contacts;
    }

    return contacts.filter((contact) => {
      return (
        contact.name.toLowerCase().includes(query) ||
        contact.address.toLowerCase().includes(query)
      );
    });
  }, [contacts, search]);

  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Saved Contacts
          </h2>

          <p className="mt-1 text-xs text-neutral-400">
            Select contacts to include in your payment.
          </p>
        </div>

        <div className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2">
          <p className="text-xs text-neutral-400">
            Contacts
          </p>

          <p className="text-center text-lg font-bold text-white">
            {contacts.length}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search contacts..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="h-11 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-blue-500"
        />
      </div>

      {contacts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-700 py-12 text-center">
          <p className="text-lg font-medium text-neutral-300">
            No contacts yet
          </p>

          <p className="mt-2 text-sm text-neutral-500">
            Add your first wallet address above to get started.
          </p>
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-700 py-12 text-center">
          <p className="text-neutral-400">
            No matching contacts found.
          </p>
        </div>
      ) : (
        <div className="max-h-[420px] overflow-y-auto pr-1">
          <ContactList
            contacts={filteredContacts}
            recipientIds={recipientIds}
            onDelete={onDelete}
            onAddRecipient={onAddRecipient}
          />
        </div>
      )}
    </section>
  );
}