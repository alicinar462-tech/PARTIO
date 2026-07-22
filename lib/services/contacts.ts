import { Contact } from "@/types/contact";

const STORAGE_KEY = "partio_contacts";

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

function saveContacts(contacts: Contact[]) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(contacts)
  );
}

export function createContact(
  name: string,
  address: `0x${string}`
): Contact {
  const contacts = getContacts();

  const normalizedName = name.trim();
  const normalizedAddress =
    address.toLowerCase() as `0x${string}`;

  if (
    contacts.some(
      (contact) =>
        contact.name.toLowerCase() ===
        normalizedName.toLowerCase()
    )
  ) {
    throw new Error("A contact with this name already exists.");
  }

  if (
    contacts.some(
      (contact) =>
        contact.address.toLowerCase() ===
        normalizedAddress
    )
  ) {
    throw new Error("This wallet address already exists.");
  }

  const contact: Contact = {
    id: crypto.randomUUID(),
    name: normalizedName,
    address: normalizedAddress,
    createdAt: Date.now(),
  };

  contacts.push(contact);

  saveContacts(contacts);

  return contact;
}

export function updateContact(contact: Contact) {
  const contacts = getContacts();

  const updated = contacts.map((item) =>
    item.id === contact.id ? contact : item
  );

  saveContacts(updated);
}

export function deleteContact(id: string) {
  const contacts = getContacts();

  saveContacts(
    contacts.filter((contact) => contact.id !== id)
  );
}

export function getContactById(id: string) {
  return getContacts().find(
    (contact) => contact.id === id
  );
}