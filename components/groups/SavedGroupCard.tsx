"use client";

import { SavedGroup } from "@/types/saved-group";

interface SavedGroupCardProps {
  group: SavedGroup;
  contactCount: number;
  onAdd: (group: SavedGroup) => void;
  onEdit: (group: SavedGroup) => void;
  onDelete: (group: SavedGroup) => void;
}

export default function SavedGroupCard({
  group,
  contactCount,
  onAdd,
  onEdit,
  onDelete,
}: SavedGroupCardProps) {
  function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${group.name}" saved group?`
    );

    if (!confirmed) return;

    onDelete(group);
  }

  return (
    <div className="flex h-[64px] items-center justify-between gap-2 rounded-xl border border-neutral-800 bg-neutral-800/60 px-3 py-2 transition hover:border-blue-500/30 hover:bg-neutral-800">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">
          {group.name}
          <span className="ml-1.5 text-xs font-normal text-neutral-400">
            ({contactCount}{" "}
            {contactCount === 1
              ? "person"
              : "people"})
          </span>
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={() => onAdd(group)}
          title="Add group"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-lg font-semibold leading-none text-white transition hover:bg-blue-500"
        >
          +
        </button>

        <button
          type="button"
          onClick={() => onEdit(group)}
          title="Edit group"
          className="rounded-lg border border-neutral-700 px-2.5 py-1.5 text-xs font-medium text-neutral-300 transition hover:border-neutral-600 hover:bg-neutral-700"
        >
          Edit
        </button>

        <button
          type="button"
          onClick={handleDelete}
          title="Delete group"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/20 text-sm font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
        >
          X
        </button>
      </div>
    </div>
  );
}