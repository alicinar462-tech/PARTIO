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
      <h2 className="mb-4 text-lg font-semibold">
        Summary
      </h2>

      <div className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <p className="text-neutral-400">
            Recipients
          </p>

          <p className="text-2xl font-bold">
            {recipientCount}
          </p>
        </div>

        <div>
          <p className="text-neutral-400">
            Total USDC
          </p>

          <p className="text-2xl font-bold">
            {totalAmount.toFixed(2)}
          </p>
        </div>

        <button
          onClick={onReview}
          disabled={!hasValidAmounts}
          className={`rounded-lg px-6 py-3 font-semibold transition ${
            hasValidAmounts
              ? "bg-blue-600 text-white hover:bg-blue-500"
              : "bg-neutral-700 text-neutral-400 cursor-not-allowed"
          }`}
        >
          Review Payment
        </button>
      </div>
    </div>
  );
}