interface WalletAddressProps {
  address?: `0x${string}`;
}

export default function WalletAddress({
  address,
}: WalletAddressProps) {
  if (!address) return null;

  return (
    <div className="text-sm text-gray-400">
      <span className="mr-2 text-neutral-500">Wallet</span>
      <span className="font-mono">
        {address.slice(0, 6)}...{address.slice(-4)}
      </span>
    </div>
  );
}