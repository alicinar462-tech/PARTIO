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
    <section className="flex h-[500px] min-h-0 flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
      <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-white">
            Saved Contacts
          </h2>

          <p className="mt-1 truncate text-xs text-neutral-400">
            Select contacts to include in your payment.
          </p>
        </div>

        <div className="shrink-0 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5">
          <p className="text-center text-[10px] text-neutral-400">
            Contacts
          </p>

          <p className="text-center text-base font-bold leading-5 text-white">
            {contacts.length}
          </p>
        </div>
      </div>

      <div className="mb-3 shrink-0">
        <input
          type="text"
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-blue-500"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {contacts.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-neutral-700 bg-neutral-950 p-6 text-center">
            <div>
              <p className="text-sm font-medium text-neutral-300">
                No contacts yet
              </p>

              <p className="mt-2 text-xs text-neutral-500">
                Add your first wallet address above to get started.
              </p>
            </div>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-neutral-700 text-center">
            <p className="text-sm text-neutral-400">
              No matching contacts found.
            </p>
          </div>
        ) : (
          <ContactList
            contacts={filteredContacts}
            recipientIds={recipientIds}
            onDelete={onDelete}
            onAddRecipient={onAddRecipient}
          />
        )}
      </div>
    </section>
  );
}