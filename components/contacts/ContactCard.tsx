import { Contact } from "@/types/contact";

interface ContactCardProps {
  contact: Contact;
  isRecipient?: boolean;
  onDelete?: (contact: Contact) => void;
  onAddRecipient?: (contact: Contact) => void;
}

export default function ContactCard({
  contact,
  isRecipient = false,
  onDelete,
  onAddRecipient,
}: ContactCardProps) {
  const shortenedAddress =
    `${contact.address.slice(0, 6)}...${contact.address.slice(-4)}`;

  return (
    <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-800/70 px-3 py-2 transition hover:border-neutral-700 hover:bg-neutral-800">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
          {contact.name.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">
            {contact.name}
          </p>

          <p className="truncate font-mono text-xs text-neutral-400">
            {shortenedAddress}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {isRecipient ? (
          <div
            title="Recipient added"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600 text-sm font-bold text-white"
          >
            ✓
          </div>
        ) : (
          <button
            type="button"
            title="Add to recipients"
            onClick={() => onAddRecipient?.(contact)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white transition hover:bg-blue-500"
          >
            +
          </button>
        )}

        <button
          type="button"
          title="Remove contact"
          onClick={() => onDelete?.(contact)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-sm text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
        >
          🗑
        </button>
      </div>
    </div>
  );
}