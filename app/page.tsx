"use client";

import ConnectWallet from "../components/wallet/ConnectWallet";
import FeedbackForm from "../components/feedback/FeedbackForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-8 py-10">
        <header className="mb-10 flex flex-col items-center text-center">
          <img
            src="/partio-logo.png"
            alt="PARTIO"
            className="h-96 w-96 object-contain"
          />
        </header>

        <ConnectWallet />

        <FeedbackForm />
      </div>
    </main>
  );
}