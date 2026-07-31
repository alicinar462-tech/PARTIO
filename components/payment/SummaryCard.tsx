"use client";

type SummaryCardProps = {
  recipientCount: number;
  totalAmount: number;
  hasValidAmounts: boolean;
  onReview: () => void;
};

export default function SummaryCard({
  recipientCount,
  totalAmount,
  hasValidAmounts,
  onReview,
}: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">
          Payment Summary
        </h2>

        <p className="mt-1 text-sm text-neutral-400">
          Review your payment before submitting it to the ARC Network.
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-10">
          <div>
            <p className="text-sm text-neutral-400">
              Recipients
            </p>

            <p className="mt-1 text-3xl font-bold text-white">
              {recipientCount}
            </p>
          </div>

          <div>
            <p className="text-sm text-neutral-400">
              Total Amount
            </p>

            <p className="mt-1 text-3xl font-bold text-green-400">
              {totalAmount.toFixed(2)} USDC
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <button
            onClick={onReview}
            disabled={!hasValidAmounts}
            className={`rounded-lg px-8 py-3 font-semibold transition ${
              hasValidAmounts
                ? "bg-blue-600 text-white hover:bg-blue-500"
                : "cursor-not-allowed bg-neutral-700 text-neutral-400"
            }`}
          >
            Review Payment
          </button>

          {!hasValidAmounts && (
            <p className="mt-2 text-xs text-neutral-500">
              Add at least one recipient and enter a valid amount.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}