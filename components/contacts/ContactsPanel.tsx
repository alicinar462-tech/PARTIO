"use client";

import { useEffect, useState } from "react";

import { Contact } from "@/types/contact";
import {
  createContact,
  deleteContact,
  getContacts,
} from "@/lib/services/contacts";

import ContactForm from "./ContactForm";
import ContactList from "./ContactList";

export default function ContactsPanel() {
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    setContacts(getContacts());
  }, []);

  function handleCreate(
    name: string,
    address: `0x${string}`
  ) {
    createContact(name, address);
    setContacts(getContacts());
  }

  function handleDelete(contact: Contact) {
    const confirmed = window.confirm(
      `Delete "${contact.name}" from your contacts?`
    );

    if (!confirmed) {
      return;
    }

    deleteContact(contact.id);
    setContacts(getContacts());
  }

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

      <ContactForm onCreate={handleCreate} />

      <div className="mt-8">
        <ContactList
          contacts={contacts}
          onDelete={handleDelete}
        />
      </div>
    </section>
  );
}