"use client";

import { FormEvent, useState } from "react";

interface ContactFormProps {
  onCreate: (
    name: string,
    address: `0x${string}`
  ) => void;
}

export default function ContactForm({
  onCreate,
}: ContactFormProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");

    const trimmedName = name.trim();
    const trimmedAddress = address.trim();

    if (!trimmedName || !trimmedAddress) {
      setError("Please fill in all fields.");
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(trimmedAddress)) {
      setError("Please enter a valid wallet address.");
      return;
    }

    try {
      onCreate(
        trimmedName,
        trimmedAddress as `0x${string}`
      );

      setName("");
      setAddress("");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong.");
      }
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3"
    >
      <div className="grid gap-3 lg:grid-cols-[220px_1fr_auto]">
        <div>
          <label
            htmlFor="contact-name"
            className="mb-1 block text-xs font-medium text-neutral-400"
          >
            Name
          </label>

          <input
            id="contact-name"
            type="text"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            placeholder="Alice"
            className="h-10 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 text-sm text-white outline-none transition focus:border-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="contact-address"
            className="mb-1 block text-xs font-medium text-neutral-400"
          >
            Wallet Address
          </label>

          <input
            id="contact-address"
            type="text"
            value={address}
            onChange={(e) =>
              setAddress(e.target.value)
            }
            placeholder="0x..."
            spellCheck={false}
            autoComplete="off"
            className="h-10 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 font-mono text-sm text-white outline-none transition focus:border-blue-500"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="h-10 w-full rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500 lg:w-auto"
          >
            + Add
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400">
          {error}
        </p>
      )}
    </form>
  );
}