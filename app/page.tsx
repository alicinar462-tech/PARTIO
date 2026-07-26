  "use client";

  import ConnectWallet from "../components/wallet/ConnectWallet";

  export default function Home() {
    return (
      <main className="min-h-screen bg-neutral-950 text-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col px-8 py-10">
          <header className="mb-10 flex flex-col items-center text-center">
            <h1 className="text-5xl font-bold">
              PARTIO
            </h1>

            <p className="mt-3 max-w-2xl text-center">
              <span className="block font-medium text-white">
                One-Click Payment Partition on ARC
              </span>

              <span className="mt-1 block text-neutral-400">
                Split one payment into multiple destinations with a single transaction.
              </span>
            </p>
          </header>

          <ConnectWallet />
        </div>
      </main>
    );
  }