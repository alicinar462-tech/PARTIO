"use client";

import { arcMainnet } from "@/lib/wagmi";

import NetworkBadge from "./NetworkBadge";
import WalletAddress from "./WalletAddress";

type WalletCardProps = {
  address?: `0x${string}`;
  chainId?: number;
  availableBalance: number;
  isSwitching: boolean;
  onSwitchNetwork: () => void;
  onDisconnect: () => void;
};

export default function WalletCard({
  address,
  chainId,
  availableBalance,
  isSwitching,
  onSwitchNetwork,
  onDisconnect,
}: WalletCardProps) {
  const isCorrectNetwork =
    chainId === arcMainnet.id;

  return (
    <div className="partio-card rounded-2xl p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
      {/* Section label */}
      <div className="flex items-center gap-3">
        <div className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_14px_rgba(32,217,255,0.8)]" />

        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Connected Wallet
        </span>
      </div>

      {/* Centered heading */}
      <div className="mt-3 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Ready to send payments
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Send one payment to multiple recipients on ARC.
        </p>
      </div>

      {/* Wallet information */}
      <div className="mt-5 grid gap-3 lg:grid-cols-[1.4fr_1fr_0.8fr_auto]">
        {/* Wallet Address */}
        <div className="rounded-xl border border-indigo-400/15 bg-[#080d2d]/80 p-4">
          <p className="partio-label mb-2">
            Wallet Address
          </p>

          <WalletAddress address={address} />
        </div>

        {/* Available Balance */}
        <div className="rounded-xl border border-indigo-400/15 bg-[#080d2d]/80 p-4">
          <p className="partio-label mb-2">
            Available Balance
          </p>

          <p className="text-2xl font-bold tracking-tight text-emerald-400">
            {availableBalance.toFixed(2)}{" "}
            <span className="text-base text-emerald-300/80">
              USDC
            </span>
          </p>
        </div>

        {/* Network */}
        <div className="flex items-center rounded-xl border border-indigo-400/15 bg-[#080d2d]/80 p-4">
          <div>
            <p className="partio-label mb-2">
              Network
            </p>

            <NetworkBadge
              chainId={chainId}
              expectedChainId={arcMainnet.id}
            />
          </div>
        </div>

        {/* Disconnect / Switch */}
        <div className="flex items-center justify-end rounded-xl border border-indigo-400/15 bg-[#080d2d]/80 p-4">
          <div className="flex flex-wrap justify-end gap-2">
            {!isCorrectNetwork && (
              <button
                onClick={onSwitchNetwork}
                disabled={isSwitching}
                className="rounded-lg bg-amber-400 px-4 py-2.5 font-semibold text-black transition hover:bg-amber-300 disabled:opacity-50"
              >
                {isSwitching
                  ? "Switching..."
                  : "Switch to ARC"}
              </button>
            )}

            <button
              onClick={onDisconnect}
              className="rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-2.5 font-medium text-white transition hover:border-slate-500 hover:bg-slate-800"
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}