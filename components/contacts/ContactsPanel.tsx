"use client";

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
}

export default function ContactsPanel({
  contacts,
  onCreate,
  onDelete,
}: ContactsPanelProps) {
  return (
    <section className="mt-10 w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">
          Contacts
        </h2>

        <p className="mt-1 text-sm text-neutral-400">
          Save frequently used wallet addresses.
        </p>
      </div>

      <ContactForm onCreate={onCreate} />

      <div className="mt-8">
        <ContactList
          contacts={contacts}
          onDelete={onDelete}
        />
      </div>
    </section>
  );
}