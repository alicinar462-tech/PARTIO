"use client";

import { useMemo, useState } from "react";

import { Contact } from "@/types/contact";
import { SavedGroup } from "@/types/saved-group";

import SavedGroupCard from "./SavedGroupCard";
import SavedGroupForm from "./SavedGroupForm";

interface SavedGroupsPanelProps {
  contacts: Contact[];
  savedGroups: SavedGroup[];
  onCreate: (
    name: string,
    contactIds: string[]
  ) => void;
  onUpdate: (
    id: string,
    name: string,
    contactIds: string[]
  ) => void;
  onDelete: (id: string) => void;
  onAdd: (group: SavedGroup) => void;
}

export default function SavedGroupsPanel({
  contacts,
  savedGroups,
  onCreate,
  onUpdate,
  onDelete,
  onAdd,
}: SavedGroupsPanelProps) {
  const [formOpen, setFormOpen] =
    useState(false);

  const [editingGroup, setEditingGroup] =
    useState<SavedGroup | null>(null);

  const [search, setSearch] =
    useState("");

  const contactMap = useMemo(() => {
    return new Map(
      contacts.map((contact) => [
        contact.id,
        contact,
      ])
    );
  }, [contacts]);

  const filteredGroups = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return savedGroups;
    }

    return savedGroups.filter((group) =>
      group.name
        .toLowerCase()
        .includes(query)
    );
  }, [savedGroups, search]);

  function handleCreate() {
    setEditingGroup(null);
    setFormOpen(true);
  }

  function handleEdit(group: SavedGroup) {
    setEditingGroup(group);
    setFormOpen(true);
  }

  function handleSave(
    name: string,
    contactIds: string[]
  ) {
    if (editingGroup) {
      onUpdate(
        editingGroup.id,
        name,
        contactIds
      );
    } else {
      onCreate(name, contactIds);
    }

    setFormOpen(false);
    setEditingGroup(null);
  }

  function handleCancel() {
    setFormOpen(false);
    setEditingGroup(null);
  }

  function handleDelete(group: SavedGroup) {
    onDelete(group.id);

    if (editingGroup?.id === group.id) {
      handleCancel();
    }
  }

  return (
    <section className="flex h-[500px] min-h-0 flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
      <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-white">
            Saved Groups
          </h2>

          <p className="mt-1 truncate text-xs text-neutral-400">
            Add multiple contacts to your payment at once.
          </p>
        </div>

        {!formOpen && (
          <button
            type="button"
            onClick={handleCreate}
            disabled={contacts.length === 0}
            className="flex h-12.5 shrink-0 items-center justify-center rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            + Create
          </button>
        )}
      </div>

      {formOpen ? (
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <SavedGroupForm
            contacts={contacts}
            group={editingGroup}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        <>
          <div className="mb-3 shrink-0">
            <input
              type="text"
              placeholder="Search groups..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="h-10 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-blue-500"
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {savedGroups.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-neutral-700 bg-neutral-950 p-6 text-center">
                <div>
                  <p className="text-sm font-medium text-neutral-300">
                    No saved groups yet
                  </p>

                  <p className="mt-2 text-xs text-neutral-500">
                    Create a group to add several recipients at once.
                  </p>
                </div>
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-neutral-700 text-center">
                <p className="text-sm text-neutral-400">
                  No matching groups found.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredGroups.map((group) => {
                  const contactCount =
                    group.contactIds.filter(
                      (id) => contactMap.has(id)
                    ).length;

                  return (
                    <SavedGroupCard
                      key={group.id}
                      group={group}
                      contactCount={contactCount}
                      onAdd={onAdd}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}