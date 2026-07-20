import ContactCard from "./ContactCard";
import EmptyContacts from "./EmptyContacts";

import { Contact } from "@/types/contact";

interface ContactListProps {
  contacts: Contact[];
  onEdit?: (contact: Contact) => void;
  onDelete?: (contact: Contact) => void;
  onAddRecipient?: (contact: Contact) => void;
}

export default function ContactList({
  contacts,
  onEdit,
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
          onEdit={onEdit}
          onDelete={onDelete}
          onAddRecipient={onAddRecipient}
        />
      ))}
    </div>
  );
}