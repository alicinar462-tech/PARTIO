import { Contact } from "@/types/contact";

interface ContactCardProps {
  contact: Contact;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contact: Contact) => void;
}

export default function ContactCard({
  contact,
  onEdit,
  onDelete,
}: ContactCardProps) {
  const shortenedAddress = `${contact.address.slice(0, 6)}...${contact.address.slice(-4)}`;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-semibold text-blue-700">
          {contact.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900">
            {contact.name}
          </h3>

          <p className="mt-1 font-mono text-sm text-gray-500">
            {shortenedAddress}
          </p>
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => onEdit?.(contact)}
          className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          Edit
        </button>

        <button
          type="button"
          onClick={() => onDelete?.(contact)}
          className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}