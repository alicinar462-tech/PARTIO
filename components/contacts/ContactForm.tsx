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

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedAddress = address.trim();

    if (!trimmedName || !trimmedAddress) {
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(trimmedAddress)) {
      alert("Please enter a valid wallet address.");
      return;
    }

    onCreate(
      trimmedName,
      trimmedAddress as `0x${string}`
    );

    setName("");
    setAddress("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div>
        <label
          htmlFor="contact-name"
          className="mb-2 block text-sm font-medium text-neutral-300"
        >
          Name
        </label>

        <input
          id="contact-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Alice"
          className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
        />
      </div>

      <div>
        <label
          htmlFor="contact-address"
          className="mb-2 block text-sm font-medium text-neutral-300"
        >
          Wallet Address
        </label>

        <input
          id="contact-address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="0x..."
          spellCheck={false}
          autoComplete="off"
          className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 font-mono text-sm text-white outline-none transition focus:border-blue-500"
        />
      </div>

      <button
        type="submit"
        className="rounded-lg bg-white px-5 py-3 font-semibold text-black transition hover:bg-neutral-200"
      >
        Add Contact
      </button>
    </form>
  );
}