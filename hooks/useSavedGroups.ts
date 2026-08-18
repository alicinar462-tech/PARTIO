"use client";

import { useState } from "react";

import {
  createSavedGroup,
  deleteSavedGroup,
  getSavedGroups,
  updateSavedGroup,
} from "@/lib/services/saved-groups";

export function useSavedGroups() {
  const [
    savedGroups,
    setSavedGroups,
  ] = useState(() =>
    getSavedGroups()
  );

  function handleCreate(
    name: string,
    contactIds: string[]
  ) {
    createSavedGroup(
      name,
      contactIds
    );

    setSavedGroups(
      getSavedGroups()
    );
  }

  function handleUpdate(
    id: string,
    name: string,
    contactIds: string[]
  ) {
    updateSavedGroup(
      id,
      name,
      contactIds
    );

    setSavedGroups(
      getSavedGroups()
    );
  }

  function handleDelete(
    id: string
  ) {
    deleteSavedGroup(id);

    setSavedGroups(
      getSavedGroups()
    );
  }

  return {
    savedGroups,
    handleCreate,
    handleUpdate,
    handleDelete,
  };
}