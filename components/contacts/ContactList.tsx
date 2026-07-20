import ContactCard from "./ContactCard";
import EmptyContacts from "./EmptyContacts";

import { Contact } from "@/types/contact";

interface ContactListProps {
  contacts: Contact[];
  recipientIds: string[];
  onDelete?: (contact: Contact) => void;
  onAddRecipient?: (contact: Contact) => void;
}

export default function ContactList({
  contacts,
  recipientIds,
  onDelete,
  onAddRecipient,
}: ContactListProps) {
  if (contacts.length === 0) {
    return <EmptyContacts />;
  }

  return (
    <div className="space-y-2">
      {contacts.map((contact) => (
        <ContactCard
          key={contact.id}
          contact={contact}
          isRecipient={recipientIds.includes(contact.id)}
          onDelete={onDelete}
          onAddRecipient={onAddRecipient}
        />
      ))}
    </div>
  );
}