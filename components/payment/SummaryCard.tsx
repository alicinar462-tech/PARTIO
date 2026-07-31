"use client";

type SummaryCardProps = {
  recipientCount: number;
  totalAmount: number;
  availableBalance: number;
  remainingBalance: number;
  missingAmount: number;
  hasEnoughBalance: boolean;
  hasValidAmounts: boolean;
  onReview: () => void;
};

export default function SummaryCard({
  recipientCount,
  totalAmount,
  availableBalance,
  remainingBalance,
  missingAmount,
  hasEnoughBalance,
  hasValidAmounts,
  onReview,
}: SummaryCardProps) {
  const canReview =
    hasValidAmounts && hasEnoughBalance;

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

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="grid grid-cols-2 gap-6">
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
              Payment Total
            </p>

            <p className="mt-1 text-3xl font-bold text-green-400">
              {totalAmount.toFixed(2)} USDC
            </p>
          </div>

          <div>
            <p className="text-sm text-neutral-400">
              Available Balance
            </p>

            <p className="mt-1 text-3xl font-bold text-white">
              {availableBalance.toFixed(2)} USDC
            </p>
          </div>

          <div>
            <p className="text-sm text-neutral-400">
              Remaining Balance
            </p>

            <p
              className={`mt-1 text-3xl font-bold ${
                remainingBalance >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {remainingBalance.toFixed(2)} USDC
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end justify-between">
          <button
            onClick={onReview}
            disabled={!canReview}
            className={`rounded-lg px-8 py-3 font-semibold transition ${
              canReview
                ? "bg-blue-600 text-white hover:bg-blue-500"
                : "cursor-not-allowed bg-neutral-700 text-neutral-400"
            }`}
          >
            Review Payment
          </button>

          {!hasValidAmounts && (
            <p className="mt-3 text-right text-xs text-neutral-500">
              Add at least one recipient and enter a valid amount.
            </p>
          )}

          {hasValidAmounts &&
            !hasEnoughBalance && (
              <div className="mt-4 max-w-sm rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-right">
                <p className="font-semibold text-red-400">
                  Insufficient Balance
                </p>

                <p className="mt-2 text-sm text-neutral-300">
                  You need{" "}
                  <span className="font-semibold text-white">
                    {missingAmount.toFixed(2)} USDC
                  </span>{" "}
                  more to complete this payment.
                </p>

                <p className="mt-2 text-xs text-neutral-500">
                  Keep a small amount available for
                  network fees.
                </p>
              </div>
            )}

          {canReview && (
            <p className="mt-3 text-right text-xs text-green-400">
              ✓ Balance verified. Ready to continue.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}