interface NetworkBadgeProps {
  chainId?: number;
  expectedChainId: number;
}

const NETWORK_NAMES: Record<number, string> = {
  1: "Ethereum",
  8453: "Base",
  42161: "Arbitrum",
  10: "Optimism",
  137: "Polygon",
  11155111: "Sepolia",
  5042002: "ARC Testnet",
  5042: "ARC Mainnet",
};

export default function NetworkBadge({
  chainId,
  expectedChainId,
}: NetworkBadgeProps) {
  if (!chainId) return null;

  const isCorrect = chainId === expectedChainId;

  const networkName =
    NETWORK_NAMES[chainId] ?? `Unknown (${chainId})`;

  return (
    <div
      className={`rounded-md px-3 py-1 text-sm font-medium ${
        isCorrect
          ? "bg-green-700 text-white"
          : "bg-red-700 text-white"
      }`}
    >
      {networkName}
    </div>
  );
}