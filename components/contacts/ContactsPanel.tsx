"use client";

import { useMemo, useState } from "react";

import { Contact } from "@/types/contact";

import ContactForm from "./ContactForm";
import ContactList from "./ContactList";

interface ContactsPanelProps {
  contacts: Contact[];
  onCreate: (
    name: string,
    address: `0x${string}`
  ) => void;
  onDelete: (contact: Contact) => void;
  onAddRecipient: (contact: Contact) => void;
}

export default function ContactsPanel({
  contacts,
  onCreate,
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
        contact.name
          .toLowerCase()
          .includes(query) ||
        contact.address
          .toLowerCase()
          .includes(query)
      );
    });
  }, [contacts, search]);

  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-white">
          Contacts
        </h2>

        <p className="mt-1 text-xs text-neutral-400">
          Save frequently used wallet addresses.
        </p>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or address..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="h-10 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-blue-500"
        />
      </div>

      <ContactForm onCreate={onCreate} />

      <div className="mt-5 border-t border-neutral-800 pt-5">
        <div className="max-h-[420px] overflow-y-auto pr-1">
          <ContactList
            contacts={filteredContacts}
            onDelete={onDelete}
            onAddRecipient={onAddRecipient}
          />
        </div>

        {filteredContacts.length === 0 && (
          <div className="py-8 text-center text-sm text-neutral-500">
            No contacts found.
          </div>
        )}
      </div>
    </section>
  );
}