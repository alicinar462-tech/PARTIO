import { Contact } from "@/types/contact";
import { Recipient } from "@/types/recipient";

export function addRecipient(
  recipients: Recipient[],
  contact: Contact
): Recipient[] {
  const exists = recipients.some(
    (recipient) => recipient.id === contact.id
  );

  if (exists) {
    return recipients;
  }

  return [
    ...recipients,
    {
      ...contact,
      amount: "",
    },
  ];
}

export function removeRecipient(
  recipients: Recipient[],
  id: string
): Recipient[] {
  return recipients.filter(
    (recipient) => recipient.id !== id
  );
}

export function updateRecipientAmount(
  recipients: Recipient[],
  id: string,
  amount: string
): Recipient[] {
  return recipients.map((recipient) =>
    recipient.id === id
      ? {
          ...recipient,
          amount,
        }
      : recipient
  );
}