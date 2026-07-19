"use client";

import {
  useAccount,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from "wagmi";
import { injected } from "wagmi/connectors";

import { arcTestnet } from "../../lib/wagmi";

import NetworkBadge from "./NetworkBadge";
import WalletAddress from "./WalletAddress";

export default function ConnectWallet() {
  const { address, chainId, isConnected } = useAccount();

  const { connect, isPending: isConnecting } = useConnect();

  const { disconnect } = useDisconnect();

  const {
    switchChain,
    isPending: isSwitching,
  } = useSwitchChain();

  if (!isConnected) {
    return (
      <button
        onClick={() => connect({ connector: injected() })}
        disabled={isConnecting}
        className="rounded-lg bg-white px-6 py-3 font-semibold text-black hover:bg-gray-200"
      >
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </button>
    );
  }

  const isCorrectNetwork =
    chainId === arcTestnet.id;

  return (
    <div className="flex flex-col items-center gap-4">

      <div className="text-green-500 font-semibold">
        Wallet Connected
      </div>

      <WalletAddress address={address} />

      <NetworkBadge
        chainId={chainId}
        expectedChainId={arcTestnet.id}
      />

      {!isCorrectNetwork && (
        <button
          onClick={() =>
            switchChain({
              chainId: arcTestnet.id,
            })
          }
          disabled={isSwitching}
          className="rounded-lg bg-yellow-500 px-5 py-2 font-semibold text-black hover:bg-yellow-400"
        >
          {isSwitching
            ? "Switching..."
            : "Switch to ARC Testnet"}
        </button>
      )}

      <button
        onClick={() => disconnect()}
        className="rounded-lg bg-red-600 px-5 py-2 text-white hover:bg-red-700"
      >
        Disconnect
      </button>
    </div>
  );
}