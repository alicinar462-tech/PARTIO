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
    hasValidAmounts &&
    hasEnoughBalance;

  return (
    <div className="partio-card rounded-2xl p-6">
      <div className="mb-8 text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-blue-400 shadow-[0_0_14px_rgba(83,109,255,0.8)]" />

          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Payment Summary
          </span>
        </div>

        <h2 className="text-2xl font-bold text-white">
          Review Your Payment
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          Review your payment before submitting it to the ARC Network.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="partio-subcard rounded-xl border border-indigo-400/10 p-5 shadow-[0_8px_25px_rgba(0,0,0,0.2)]">
          <p className="partio-label">
            Recipients
          </p>

          <p className="mt-3 text-3xl font-bold text-white">
            {recipientCount}
          </p>
        </div>

        <div className="partio-subcard rounded-xl border border-indigo-400/10 p-5 shadow-[0_8px_25px_rgba(0,0,0,0.2)]">
          <p className="partio-label">
            Payment Total
          </p>

          <p className="mt-3 text-3xl font-bold partio-gradient-text">
            {totalAmount.toFixed(2)}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            USDC
          </p>
        </div>

        <div className="partio-subcard rounded-xl border border-indigo-400/10 p-5 shadow-[0_8px_25px_rgba(0,0,0,0.2)]">
          <p className="partio-label">
            Available Balance
          </p>

          <p className="mt-3 text-3xl font-bold text-white">
            {availableBalance.toFixed(2)}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            USDC
          </p>
        </div>

        <div className="partio-subcard rounded-xl border border-indigo-400/10 p-5 shadow-[0_8px_25px_rgba(0,0,0,0.2)]">
          <p className="partio-label">
            Remaining Balance
          </p>

          <p
            className={`mt-3 text-3xl font-bold ${
              remainingBalance >= 0
                ? "text-emerald-400"
                : "text-red-400"
            }`}
          >
            {remainingBalance.toFixed(2)}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            USDC
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center">
        <button
          onClick={onReview}
          disabled={!canReview}
          className={`rounded-lg px-8 py-3 font-semibold text-white transition ${
            canReview
              ? "bg-blue-600 hover:bg-blue-700"
              : "cursor-not-allowed bg-slate-800 text-slate-500"
          }`}
        >
          Review Your Payment
        </button>

        {!hasValidAmounts && (
          <p className="mt-4 text-center text-xs text-slate-500">
            Add at least one recipient and enter a valid amount.
          </p>
        )}

        {hasValidAmounts &&
          !hasEnoughBalance && (
            <div className="mt-5 w-full max-w-sm rounded-xl border border-red-500/25 bg-red-950/25 p-5 text-center">
              <p className="font-semibold text-red-300">
                Insufficient Balance
              </p>

              <p className="mt-2 text-sm text-slate-300">
                You need{" "}
                <span className="font-semibold text-white">
                  {missingAmount.toFixed(2)} USDC
                </span>{" "}
                more to complete this payment.
              </p>

              <p className="mt-2 text-xs text-slate-500">
                Keep a small amount available for network fees.
              </p>
            </div>
          )}

        {canReview && (
          <p className="mt-4 text-center text-xs font-medium text-emerald-400">
            ✓ Balance verified. Ready to continue.
          </p>
        )}
      </div>
    </div>
  );
}