"use client";

import { arcTestnet } from "@/lib/wagmi";

import NetworkBadge from "./NetworkBadge";
import WalletAddress from "./WalletAddress";

type WalletCardProps = {
  address?: `0x${string}`;
  chainId?: number;
  isSwitching: boolean;
  onSwitchNetwork: () => void;
  onDisconnect: () => void;
};

export default function WalletCard({
  address,
  chainId,
  isSwitching,
  onSwitchNetwork,
  onDisconnect,
}: WalletCardProps) {
  const isCorrectNetwork = chainId === arcTestnet.id;

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">
            Connected Wallet
          </h2>

          <p className="mt-1 text-sm text-neutral-400">
            Ready to send payments on ARC Network.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-3">
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-neutral-500">
              Wallet Address
            </p>

            <WalletAddress address={address} />
          </div>

          <NetworkBadge
            chainId={chainId}
            expectedChainId={arcTestnet.id}
          />
        </div>

        <div className="flex gap-3">
          {!isCorrectNetwork && (
            <button
              onClick={onSwitchNetwork}
              disabled={isSwitching}
              className="rounded-lg bg-yellow-500 px-4 py-2 font-semibold text-black transition hover:bg-yellow-400 disabled:opacity-50"
            >
              {isSwitching
                ? "Switching..."
                : "Switch to ARC"}
            </button>
          )}

          <button
            onClick={onDisconnect}
            className="rounded-lg bg-neutral-800 px-4 py-2 font-medium text-white transition hover:bg-neutral-700"
          >
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}