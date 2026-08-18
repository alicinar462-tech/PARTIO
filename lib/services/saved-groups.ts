import { SavedGroup } from "@/types/saved-group";

const STORAGE_KEY = "partio_saved_groups";

function isBrowser() {
  return (
    typeof window !== "undefined"
  );
}

export function getSavedGroups(): SavedGroup[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const stored =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!stored) {
      return [];
    }

    const parsed =
      JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch (error) {
    console.error(
      "Failed to load saved groups:",
      error
    );

    return [];
  }
}

function saveGroups(
  groups: SavedGroup[]
) {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(groups)
  );
}

export function createSavedGroup(
  name: string,
  contactIds: string[]
): SavedGroup {
  const groups =
    getSavedGroups();

  const group: SavedGroup = {
    id: crypto.randomUUID(),
    name: name.trim(),
    contactIds: [
      ...new Set(contactIds),
    ],
    createdAt: Date.now(),
  };

  saveGroups([
    ...groups,
    group,
  ]);

  return group;
}

export function updateSavedGroup(
  id: string,
  name: string,
  contactIds: string[]
): SavedGroup | null {
  const groups =
    getSavedGroups();

  const index =
    groups.findIndex(
      (group) =>
        group.id === id
    );

  if (index === -1) {
    return null;
  }

  const updatedGroup: SavedGroup = {
    ...groups[index],
    name: name.trim(),
    contactIds: [
      ...new Set(contactIds),
    ],
  };

  const updatedGroups =
    [...groups];

  updatedGroups[index] =
    updatedGroup;

  saveGroups(updatedGroups);

  return updatedGroup;
}

export function deleteSavedGroup(
  id: string
): void {
  const groups =
    getSavedGroups();

  saveGroups(
    groups.filter(
      (group) =>
        group.id !== id
    )
  );
}