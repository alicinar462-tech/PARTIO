"use client";

import ConnectWallet from "../components/wallet/ConnectWallet";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-8 py-10">
        <header className="mb-10">
          <h1 className="text-5xl font-bold">
            ArcSplit
          </h1>

          <p className="mt-3 text-neutral-400">
            One Click USDC Distribution on ARC
          </p>
        </header>

        <ConnectWallet />
      </div>
    </main>
  );
}