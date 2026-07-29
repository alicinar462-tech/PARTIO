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
      <div className="mb-4 text-lg font-semibold text-green-500">
        Wallet Connected
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <WalletAddress address={address} />

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
              className="rounded-lg bg-yellow-500 px-4 py-2 font-semibold text-black hover:bg-yellow-400"
            >
              {isSwitching
                ? "Switching..."
                : "Switch Network"}
            </button>
          )}

          <button
            onClick={onDisconnect}
            className="rounded-lg bg-red-600 px-4 py-2 hover:bg-red-700"
          >
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}