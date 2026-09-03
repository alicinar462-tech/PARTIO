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

type AgentResult = {
  matches: AgentMatch[];
};

function escapeRegExp(value: string) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

function parsePaymentCommand(
  message: string
): AgentResult {
  const contacts = getContacts();

  const normalizedMessage =
    message.toLowerCase();

  const matches: AgentMatch[] = [];

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

    matches.push({
      recipient: {
        ...contact,
        amount:
          amount.toString(),
      },
    });
  }

  return {
    matches,
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
            Use natural language to prepare a payment.
            PARTIO Agent will search your saved contacts
            and create a payment draft for review.
          </p>
        </div>

        <div className="mb-8 rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
            Example
          </p>

          <p className="mt-3 text-sm text-neutral-300">
            Send 20 USDC to Jini, 25 USDC to Malto
            and 10 USDC to Sherry.
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
          <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
            <div className="mb-4">
              <p className="text-sm font-semibold text-white">
                Payment draft
              </p>

              <p className="mt-1 text-xs text-neutral-500">
                Review the contacts and amounts found
                by PARTIO Agent.
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
              </div>
            ) : (
              <p className="text-sm text-neutral-400">
                I could not match this payment request
                with your saved contacts.
              </p>
            )}
          </div>
        )}

        <p className="mt-6 text-xs leading-5 text-neutral-500">
          The agent prepares payment drafts only.
          No payment will be sent without your review
          and confirmation.
        </p>
      </div>
    </section>
  );
}