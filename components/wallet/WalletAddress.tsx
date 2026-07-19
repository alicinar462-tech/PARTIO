interface WalletAddressProps {
  address?: `0x${string}`;
}

export default function WalletAddress({
  address,
}: WalletAddressProps) {
  if (!address) return null;

  return (
    <div className="text-sm text-gray-400">
      {address.slice(0, 6)}...
      {address.slice(-4)}
    </div>
  );
}