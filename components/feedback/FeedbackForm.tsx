"use client";

import { FormEvent, useState } from "react";

export default function FeedbackForm() {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!message.trim()) {
      setStatus({
        type: "error",
        text: "Please enter your feedback.",
      });
      return;
    }

    try {
      setSending(true);
      setStatus(null);

      const response = await fetch(
        "/api/feedback",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            message: message.trim(),
            email: email.trim(),
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to send feedback."
        );
      }

      setMessage("");
      setEmail("");

      setStatus({
        type: "success",
        text: "Thanks! Your feedback has been sent.",
      });
    } catch (error) {
      console.error(
        "Feedback Error",
        error
      );

      setStatus({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Unable to send feedback.",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="mt-2 rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-950/80 via-[#180b16] to-[#0d0a1d] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
      <div className="mb-5">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400 shadow-[0_0_14px_rgba(248,113,113,0.8)]" />

          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-red-300">
            Feedback
          </span>
        </div>

        <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">
          Help improve PARTIO
        </h2>

        <p className="mt-1 text-sm text-slate-300">
          Found a bug or have an idea?
          Let me know.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-3"
      >
        <textarea
          value={message}
          onChange={(event) =>
            setMessage(
              event.target.value
            )
          }
          placeholder="Write your feedback..."
          rows={5}
          disabled={sending}
          className="w-full resize-none rounded-lg border border-red-900/60 bg-[#120b18]/80 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-red-500 disabled:opacity-50"
        />

        <input
          type="email"
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          placeholder="Your email (optional)"
          disabled={sending}
          className="w-full rounded-lg border border-red-900/60 bg-[#120b18]/80 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-red-500 disabled:opacity-50"
        />

        <div className="flex items-center justify-between gap-3">
          <div className="min-h-5 text-sm">
            {status && (
              <span
                className={
                  status.type ===
                  "success"
                    ? "text-emerald-400"
                    : "text-red-400"
                }
              >
                {status.text}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={
              sending ||
              !message.trim()
            }
            className="rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending
              ? "Sending..."
              : "Send Feedback"}
          </button>
        </div>
      </form>
    </section>
  );
}