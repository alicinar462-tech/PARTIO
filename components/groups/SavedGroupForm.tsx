"use client";

import { useEffect, useState } from "react";

import { Contact } from "@/types/contact";
import { SavedGroup } from "@/types/saved-group";

interface SavedGroupFormProps {
  contacts: Contact[];
  group?: SavedGroup | null;
  onSave: (
    name: string,
    contactIds: string[]
  ) => void;
  onCancel: () => void;
}

export default function SavedGroupForm({
  contacts,
  group,
  onSave,
  onCancel,
}: SavedGroupFormProps) {
  const [name, setName] = useState(
    group?.name ?? ""
  );

  const [selectedIds, setSelectedIds] =
    useState<string[]>(
      group?.contactIds ?? []
    );

  const isEditing = Boolean(group);

  useEffect(() => {
    setName(group?.name ?? "");
    setSelectedIds(
      group?.contactIds ?? []
    );
  }, [group]);

  function toggleContact(
    contactId: string
  ) {
    setSelectedIds((current) => {
      if (
        current.includes(contactId)
      ) {
        return current.filter(
          (id) =>
            id !== contactId
        );
      }

      return [
        ...current,
        contactId,
      ];
    });
  }

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const trimmedName =
      name.trim();

    if (!trimmedName) {
      return;
    }

    if (selectedIds.length === 0) {
      return;
    }

    onSave(
      trimmedName,
      selectedIds
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-blue-500/20 bg-neutral-950 p-4"
    >
      <div className="mb-4">
        <h3 className="font-semibold text-white">
          {isEditing
            ? "Edit Saved Group"
            : "Create Saved Group"}
        </h3>

        <p className="mt-1 text-xs text-neutral-400">
          Select the contacts that belong to
          this group.
        </p>
      </div>

      <div className="mb-4">
        <label className="mb-2 block text-xs font-medium text-neutral-400">
          Group name
        </label>

        <input
          type="text"
          value={name}
          onChange={(event) =>
            setName(
              event.target.value
            )
          }
          placeholder="e.g. ARC, İzmir, Friends"
          className="h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-blue-500"
        />
      </div>

      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs font-medium text-neutral-400">
            Contacts
          </label>

          <span className="text-xs text-neutral-500">
            {selectedIds.length} selected
          </span>
        </div>

        {contacts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-700 p-4 text-center">
            <p className="text-sm text-neutral-400">
              Add contacts first.
            </p>
          </div>
        ) : (
          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {contacts.map(
              (contact) => {
                const selected =
                  selectedIds.includes(
                    contact.id
                  );

                return (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() =>
                      toggleContact(
                        contact.id
                      )
                    }
                    className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition ${
                      selected
                        ? "border-blue-500/40 bg-blue-500/10"
                        : "border-neutral-800 bg-neutral-900 hover:border-neutral-700"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {contact.name}
                      </p>

                      <p className="truncate font-mono text-[11px] text-neutral-500">
                        {contact.address.slice(
                          0,
                          6
                        )}
                        ...
                        {contact.address.slice(
                          -4
                        )}
                      </p>
                    </div>

                    <div
                      className={`ml-3 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${
                        selected
                          ? "border-blue-500 bg-blue-600 text-white"
                          : "border-neutral-600 text-transparent"
                      }`}
                    >
                      ✓
                    </div>
                  </button>
                );
              }
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 transition hover:bg-neutral-800"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={
            !name.trim() ||
            selectedIds.length === 0
          }
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isEditing
            ? "Save Changes"
            : "Create Group"}
        </button>
      </div>
    </form>
  );
}