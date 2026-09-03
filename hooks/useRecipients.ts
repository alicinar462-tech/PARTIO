"use client";

import { useMemo, useState } from "react";

import { Contact } from "@/types/contact";
import { Recipient } from "@/types/recipient";

import {
  addRecipient,
  removeRecipient,
  updateRecipientAmount,
} from "@/lib/services/recipients";

export function useRecipients() {
  const [recipients, setRecipients] =
    useState<Recipient[]>([]);

  function handleAddRecipient(
    contact: Contact
  ) {
    setRecipients((current) =>
      addRecipient(current, contact)
    );
  }

  function handleRemoveRecipient(
    id: string
  ) {
    setRecipients((current) =>
      removeRecipient(current, id)
    );
  }

  function handleAmountChange(
    id: string,
    amount: string
  ) {
    setRecipients((current) =>
      updateRecipientAmount(
        current,
        id,
        amount
      )
    );
  }

  function loadRecipients(
    nextRecipients: Recipient[]
  ) {
    setRecipients(nextRecipients);
  }

  function clearRecipients() {
    setRecipients([]);
  }

  const totalAmount = useMemo(() => {
    return recipients.reduce(
      (sum, recipient) => {
        const value = Number(
          recipient.amount
        );

        if (Number.isNaN(value)) {
          return sum;
        }

        return sum + value;
      },
      0
    );
  }, [recipients]);

  const hasValidAmounts = useMemo(() => {
    return recipients.some(
      (recipient) => {
        const value = Number(
          recipient.amount
        );

        return (
          !Number.isNaN(value) &&
          value > 0
        );
      }
    );
  }, [recipients]);

  return {
    recipients,
    totalAmount,
    hasValidAmounts,
    handleAddRecipient,
    handleRemoveRecipient,
    handleAmountChange,
    loadRecipients,
    clearRecipients,
  };
}