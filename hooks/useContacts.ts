"use client";

import { useState } from "react";

import { Contact } from "@/types/contact";

import {
  createContact,
  deleteContact,
  getContacts,
} from "@/lib/services/contacts";

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>(() =>
    getContacts()
  );

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

    if (!confirmed) return;

    deleteContact(contact.id);
    setContacts(getContacts());
  }

  return {
    contacts,
    handleCreate,
    handleDelete,
  };
}