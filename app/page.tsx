"use client";

import ConnectWallet from "../components/wallet/ConnectWallet";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-6 text-white">
      <h1 className="mb-4 text-6xl font-bold">ArcSplit</h1>

      <p className="mb-10 text-neutral-400">
        One Click USDC Distribution on ARC
      </p>

      <ConnectWallet />
    </main>
  );
}