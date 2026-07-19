export default function EmptyContacts() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white px-8 py-14 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-3xl">
        👥
      </div>

      <h2 className="text-xl font-semibold text-gray-900">
        No contacts yet
      </h2>

      <p className="mt-2 max-w-sm text-sm text-gray-500">
        Add someone you'd like to pay again.
        Your saved contacts will appear here.
      </p>
    </div>
  );
}