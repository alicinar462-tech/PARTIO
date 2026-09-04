"use client";

import { useState } from "react";

import { getContacts } from "@/lib/services/contacts";
import { Recipient } from "@/types/recipient";

type PartioAgentProps = {
  onBack: () => void;
  onOpenPayment: () => void;
};

type AgentMatch = {
  recipient: Recipient;
};

type AgentSuggestion = {
  recipient: Recipient;
  typedName: string;
};

type AgentResult = {
  matches: AgentMatch[];
  suggestions: AgentSuggestion[];
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9ğüşıöç]/gi, "");
}

function escapeRegExp(value: string) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

function levenshteinDistance(
  first: string,
  second: string
) {
  const rows = first.length + 1;
  const columns = second.length + 1;

  const matrix = Array.from(
    { length: rows },
    () => Array(columns).fill(0)
  );

  for (let row = 0; row < rows; row++) {
    matrix[row][0] = row;
  }

  for (
    let column = 0;
    column < columns;
    column++
  ) {
    matrix[0][column] = column;
  }

  for (let row = 1; row < rows; row++) {
    for (
      let column = 1;
      column < columns;
      column++
    ) {
      const cost =
        first[row - 1] ===
        second[column - 1]
          ? 0
          : 1;

      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] +
          cost
      );
    }
  }

  return matrix[
    first.length
  ][second.length];
}

function findClosestContact(
  typedName: string
) {
  const contacts = getContacts();

  const normalizedTypedName =
    normalizeText(typedName);

  let closestContact:
    | (typeof contacts)[number]
    | null = null;

  let closestDistance = Infinity;

  for (const contact of contacts) {
    const normalizedContactName =
      normalizeText(contact.name);

    const distance =
      levenshteinDistance(
        normalizedTypedName,
        normalizedContactName
      );

    if (distance < closestDistance) {
      closestDistance = distance;
      closestContact = contact;
    }
  }

  if (!closestContact) {
    return null;
  }

  const maxDistance =
    normalizedTypedName.length <= 4
      ? 1
      : 2;

  if (closestDistance > maxDistance) {
    return null;
  }

  return closestContact;
}

function parsePaymentCommand(
  message: string
): AgentResult {
  const contacts = getContacts();

  const normalizedMessage =
    message.toLowerCase();

  const matches: AgentMatch[] = [];

  const exactContactIds =
    new Set<string>();

  const suggestions:
    AgentSuggestion[] = [];

  const suggestionContactIds =
    new Set<string>();

  for (const contact of contacts) {
    const name =
      contact.name.toLowerCase();

    const escapedName =
      escapeRegExp(name);

    const amountBeforeName =
      new RegExp(
        `(\\d+(?:[.,]\\d+)?)\\s*(?:usdc|\\$)?\\s*(?:to|ya|ye)?\\s*${escapedName}`,
        "i"
      );

    const nameBeforeAmount =
      new RegExp(
        `${escapedName}\\s*(?:for|ye|ya)?\\s*(\\d+(?:[.,]\\d+)?)\\s*(?:usdc|\\$)?`,
        "i"
      );

    const match =
      normalizedMessage.match(
        amountBeforeName
      ) ||
      normalizedMessage.match(
        nameBeforeAmount
      );

    if (!match) {
      continue;
    }

    const rawAmount =
      match[1].replace(
        ",",
        "."
      );

    const amount =
      Number(rawAmount);

    if (
      Number.isNaN(amount) ||
      amount <= 0
    ) {
      continue;
    }

    if (exactContactIds.has(contact.id)) {
      continue;
    }

    exactContactIds.add(contact.id);

    matches.push({
      recipient: {
        ...contact,
        amount:
          amount.toString(),
      },
    });
  }

  const commandParts =
    normalizedMessage
      .split(
        /,|\band\b|\bve\b|\bile\b/i
      )
      .map((part) =>
        part.trim()
      )
      .filter(Boolean);

  for (const part of commandParts) {
    const amountMatch =
      part.match(
        /(\d+(?:[.,]\d+)?)/
      );

    if (!amountMatch) {
      continue;
    }

    const rawAmount =
      amountMatch[1].replace(
        ",",
        "."
      );

    const amount =
      Number(rawAmount);

    if (
      Number.isNaN(amount) ||
      amount <= 0
    ) {
      continue;
    }

    const typedName =
      part
        .replace(
          /(\d+(?:[.,]\d+)?)/,
          ""
        )
        .replace(
          /\b(usdc|usd|to|for|ya|ye|send|gönder)\b/gi,
          ""
        )
        .replace(/\$/g, "")
        .trim();

    if (!typedName) {
      continue;
    }

    const normalizedTypedName =
      normalizeText(typedName);

    const exactMatch =
      contacts.some(
        (contact) =>
          normalizeText(
            contact.name
          ) === normalizedTypedName
      );

    if (exactMatch) {
      continue;
    }

    const closestContact =
      findClosestContact(
        typedName
      );

    if (!closestContact) {
      continue;
    }

    if (
      exactContactIds.has(
        closestContact.id
      )
    ) {
      continue;
    }

    if (
      suggestionContactIds.has(
        closestContact.id
      )
    ) {
      continue;
    }

    suggestionContactIds.add(
      closestContact.id
    );

    suggestions.push({
      typedName,
      recipient: {
        ...closestContact,
        amount:
          amount.toString(),
      },
    });
  }

  return {
    matches,
    suggestions,
  };
}

export default function PartioAgent({
  onBack,
  onOpenPayment,
}: PartioAgentProps) {
  const [
    message,
    setMessage,
  ] = useState("");

  const [
    result,
    setResult,
  ] = useState<AgentResult | null>(
    null
  );

  const [
    duplicateMessage,
    setDuplicateMessage,
  ] = useState<string | null>(
    null
  );

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!message.trim()) {
      return;
    }

    const parsed =
      parsePaymentCommand(
        message
      );

    setResult(parsed);
    setDuplicateMessage(null);
  }

  function handleAcceptSuggestion(
    suggestion: AgentSuggestion
  ) {
    if (!result) {
      return;
    }

    const alreadyAdded =
      result.matches.some(
        (match) =>
          match.recipient.id ===
          suggestion.recipient.id
      );

    if (alreadyAdded) {
      setDuplicateMessage(
        `${suggestion.recipient.name} is already in your payment draft.`
      );

      return;
    }

    setResult({
      matches: [
        ...result.matches,
        {
          recipient:
            suggestion.recipient,
        },
      ],
      suggestions:
        result.suggestions.filter(
          (item) =>
            item.recipient.id !==
            suggestion.recipient.id
        ),
    });

    setDuplicateMessage(null);
  }

  function handleRejectSuggestion(
    suggestion: AgentSuggestion
  ) {
    if (!result) {
      return;
    }

    setResult({
      ...result,
      suggestions:
        result.suggestions.filter(
          (item) =>
            item.recipient.id !==
            suggestion.recipient.id
        ),
    });

    setDuplicateMessage(null);
  }

  function handleOpenPayment() {
    if (
      !result ||
      result.matches.length === 0
    ) {
      return;
    }

    const recipients =
      result.matches.map(
        (match) =>
          match.recipient
      );

    localStorage.setItem(
      "partio_agent_draft",
      JSON.stringify(
        recipients
      )
    );

    onOpenPayment();
  }

  return (
    <section className="mx-auto w-full max-w-4xl">
      <button
        onClick={onBack}
        className="mb-8 flex items-center gap-2 text-sm text-neutral-400 transition hover:text-white"
      >
        ← Back to PARTIO
      </button>

      <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.35)] md:p-10">
        <div className="mb-10">
          <div className="mb-4 inline-flex items-center rounded-full border border-neutral-700 bg-neutral-800 px-3 py-1 text-xs font-medium text-neutral-300">
            ✦ PARTIO Agent
          </div>

          <h1 className="text-3xl font-semibold text-white md:text-4xl">
            Tell PARTIO who you want to pay.
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-400">
            Use natural language to prepare a
            payment. PARTIO Agent will search
            your saved contacts and create a
            payment draft for review.
          </p>
        </div>

        <div className="mb-8 rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
            Example
          </p>

          <p className="mt-3 text-sm text-neutral-300">
            malto 20, jini 10, sherry 5
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3"
        >
          <textarea
            value={message}
            onChange={(event) => {
              setMessage(
                event.target.value
              );

              setResult(null);
              setDuplicateMessage(null);
            }}
            placeholder="Tell PARTIO what you want to do..."
            rows={4}
            className="w-full resize-none rounded-2xl border border-neutral-700 bg-neutral-950 px-5 py-4 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-white"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={
                !message.trim()
              }
              className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Ask PARTIO Agent
            </button>
          </div>
        </form>

        {result && (
          <div className="mt-8 space-y-5">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
              <div className="mb-4">
                <p className="text-sm font-semibold text-white">
                  Payment draft
                </p>

                <p className="mt-1 text-xs text-neutral-500">
                  Review the contacts and amounts
                  found by PARTIO Agent.
                </p>
              </div>

              {result.matches.length >
              0 ? (
                <div className="space-y-3">
                  {result.matches.map(
                    ({ recipient }) => (
                      <div
                        key={
                          recipient.id
                        }
                        className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-white">
                            {
                              recipient.name
                            }
                          </p>

                          <p className="mt-1 text-xs text-neutral-500">
                            {
                              recipient.address.slice(
                                0,
                                6
                              )
                            }
                            ...
                            {
                              recipient.address.slice(
                                -4
                              )
                            }
                          </p>
                        </div>

                        <p className="text-sm font-semibold text-white">
                          {
                            recipient.amount
                          }{" "}
                          USDC
                        </p>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="text-sm text-neutral-400">
                  No contacts have been added to
                  the payment draft yet.
                </p>
              )}

              {duplicateMessage && (
                <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                  {duplicateMessage}
                </div>
              )}

              {result.matches.length >
                0 && (
                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={
                      handleOpenPayment
                    }
                    className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200"
                  >
                    Open Payment →
                  </button>
                </div>
              )}
            </div>

            {result.suggestions.length >
              0 && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
                <div className="mb-4">
                  <p className="text-sm font-semibold text-white">
                    Did you mean?
                  </p>

                  <p className="mt-1 text-xs text-neutral-400">
                    Confirm suggested contacts
                    before adding them to your
                    payment draft.
                  </p>
                </div>

                <div className="space-y-3">
                  {result.suggestions.map(
                    (suggestion) => (
                      <div
                        key={
                          `${suggestion.recipient.id}-${suggestion.typedName}`
                        }
                        className="rounded-xl border border-neutral-800 bg-neutral-900 p-4"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm text-neutral-400">
                              You typed{" "}
                              <span className="font-medium text-white">
                                {
                                  suggestion.typedName
                                }
                              </span>
                            </p>

                            <p className="mt-1 text-base font-semibold text-white">
                              Did you mean{" "}
                              {
                                suggestion
                                  .recipient
                                  .name
                              }
                              ?
                            </p>

                            <p className="mt-1 text-xs text-neutral-500">
                              {
                                suggestion
                                  .recipient
                                  .amount
                              }{" "}
                              USDC
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleRejectSuggestion(
                                  suggestion
                                )
                              }
                              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 transition hover:border-neutral-500 hover:text-white"
                            >
                              No
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleAcceptSuggestion(
                                  suggestion
                                )
                              }
                              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-neutral-200"
                            >
                              Yes
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {result.matches.length ===
              0 &&
              result.suggestions.length ===
                0 && (
                <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
                  <p className="text-sm text-neutral-400">
                    I could not match this payment
                    request with your saved
                    contacts.
                  </p>
                </div>
              )}
          </div>
        )}

        <p className="mt-6 text-xs leading-5 text-neutral-500">
          The agent prepares payment drafts only.
          No payment will be sent without your
          review and confirmation.
        </p>
      </div>
    </section>
  );
}