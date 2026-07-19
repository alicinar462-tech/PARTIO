import ContactCard from "./ContactCard";
import EmptyContacts from "./EmptyContacts";

import { Contact } from "@/types/contact";

interface ContactListProps {
  contacts: Contact[];
  onEdit?: (contact: Contact) => void;
  onDelete?: (contact: Contact) => void;
}

export default function ContactList({
  contacts,
  onEdit,
  onDelete,
}: ContactListProps) {
  if (contacts.length === 0) {
    return <EmptyContacts />;
  }

  return (
    <div className="grid gap-4">
      {contacts.map((contact) => (
        <ContactCard
          key={contact.id}
          contact={contact}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}