"use client";

import { useEffect, useState } from "react";

import { useAccount } from "wagmi";

import ConnectWallet from "../components/wallet/ConnectWallet";
import FeedbackForm from "../components/feedback/FeedbackForm";
import PartioAgent from "../components/agent/PartioAgent";
import PendingPayments from "../components/payment/PendingPayments";

export default function Home() {
  const { isConnected } = useAccount();

  const [mounted, setMounted] =
    useState(false);

  const [agentOpen, setAgentOpen] =
    useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const walletReady =
    mounted && isConnected;

  function handleOpenPayment() {
    setAgentOpen(false);
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-8 py-10">
        {!agentOpen ? (
          <>
            <header className="mb-8 flex flex-col items-center text-center">
              <img
                src="/partio-logo.png"
                alt="PARTIO"
                className="h-72 w-72 object-contain md:h-96 md:w-96"
              />
            </header>

            {walletReady && (
              <button
                onClick={() =>
                  setAgentOpen(true)
                }
                className="mb-4 w-full rounded-2xl border border-neutral-800 bg-neutral-900 p-5 text-left shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition hover:border-neutral-600 hover:bg-neutral-800"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-lg">
                        ✦
                      </span>

                      <span className="text-base font-semibold text-white">
                        PARTIO Agent
                      </span>
                    </div>

                    <p className="text-sm text-neutral-400">
                      Tell PARTIO who you want to pay
                      and create your payment using
                      natural language.
                    </p>
                  </div>

                  <span className="shrink-0 text-sm font-medium text-neutral-300">
                    Open →
                  </span>
                </div>
              </button>
            )}

            <ConnectWallet />

            {walletReady && (
              <>
                <PendingPayments />

                <FeedbackForm />
              </>
            )}
          </>
        ) : (
          <PartioAgent
            onBack={() =>
              setAgentOpen(false)
            }
            onOpenPayment={
              handleOpenPayment
            }
          />
        )}
      </div>
    </main>
  );
}