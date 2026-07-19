import { Contact } from "@/types/contact";

const STORAGE_KEY = "arcsplit.contacts";

export function getContacts(): Contact[] {
  if (typeof window === "undefined") {
    return [];
  }

  const stored = localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return [];
  }

  try {
    return JSON.parse(stored) as Contact[];
  } catch {
    return [];
  }
}

export function saveContacts(contacts: Contact[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
}

export function createContact(
  name: string,
  address: `0x${string}`
): Contact {
  const newContact: Contact = {
    id: crypto.randomUUID(),
    name: name.trim(),
    address,
    createdAt: Date.now(),
  };

  const contacts = getContacts();

  contacts.push(newContact);

  saveContacts(contacts);

  return newContact;
}

export function updateContact(updatedContact: Contact): void {
  const contacts = getContacts().map((contact) =>
    contact.id === updatedContact.id ? updatedContact : contact
  );

  saveContacts(contacts);
}

export function deleteContact(id: string): void {
  const contacts = getContacts().filter(
    (contact) => contact.id !== id
  );

  saveContacts(contacts);
}

export function getContactById(id: string): Contact | undefined {
  return getContacts().find((contact) => contact.id === id);
}