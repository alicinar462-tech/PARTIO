"use client";

import { Recipient } from "@/types/recipient";

type ReviewModalProps = {
  open: boolean;
  recipients: Recipient[];
  totalAmount: number;
  isWriting: boolean;
  isConfirming: boolean;
  isConfirmed: boolean;
  txHash: `0x${string}` | null;
  writeError: Error | null;
  onClose: () => void;
  onConfirm: () => void;
  onNewPayment: () => void;
};

export default function ReviewModal({
  open,
  recipients,
  totalAmount,
  isWriting,
  isConfirming,
  isConfirmed,
  txHash,
  writeError,
  onClose,
  onConfirm,
  onNewPayment,
}: ReviewModalProps) {
  if (!open) return null;

  const validRecipients =
    recipients.filter(
      (recipient) => {
        const value =
          Number(
            recipient.amount
          );

        return (
          !Number.isNaN(value) &&
          value > 0
        );
      }
    );

  const copyHash = async () => {
    if (!txHash) return;

    await navigator.clipboard.writeText(
      txHash
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="partio-card flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl shadow-2xl shadow-black/60">
        {!isConfirmed ? (
          <>
            <div className="shrink-0 border-b border-indigo-400/10 px-6 py-6 text-center">
              <div className="flex items-center justify-center gap-3">
                <div className="h-2.5 w-2.5 rounded-full bg-purple-400 shadow-[0_0_14px_rgba(155,77,255,0.8)]" />

                <h2 className="text-2xl font-bold text-white">
                  Review Payment
                </h2>
              </div>

              <p className="mt-2 text-sm text-slate-400">
                Please review all recipients before submitting your transaction.
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-2">
                {writeError && (
                  <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-4">
                    <p className="font-semibold text-red-300">
                      Payment Failed
                    </p>

                    <p className="mt-1 text-sm text-red-200">
                      {writeError.message}
                    </p>
                  </div>
                )}

                {validRecipients.length === 0 ? (
                  <div className="rounded-xl border border-indigo-400/10 bg-black/20 p-6 text-center text-slate-400">
                    No valid recipients found.
                  </div>
                ) : (
                  validRecipients.map(
                    (recipient) => (
                      <div
                        key={
                          recipient.id
                        }
                        className="partio-subcard rounded-xl p-4"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="font-semibold text-white">
                              {
                                recipient.name
                              }
                            </p>

                            <p className="mt-1 break-all text-sm text-slate-500">
                              {
                                recipient.address
                              }
                            </p>
                          </div>

                          <div className="shrink-0 text-right">
                            <p className="text-lg font-bold text-cyan-300">
                              {Number(
                                recipient.amount
                              ).toFixed(
                                2
                              )}{" "}
                              USDC
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  )
                )}
              </div>
            </div>

            <div className="shrink-0 border-t border-indigo-400/10 px-6 py-5">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="partio-label">
                    Recipients
                  </p>

                  <p className="mt-2 text-xl font-bold text-white">
                    {
                      validRecipients.length
                    }
                  </p>
                </div>

                <div className="text-right">
                  <p className="partio-label">
                    Total Payment
                  </p>

                  <p className="mt-2 text-2xl font-bold partio-gradient-text">
                    {totalAmount.toFixed(
                      2
                    )}{" "}
                    USDC
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={
                    onClose
                  }
                  disabled={
                    isWriting ||
                    isConfirming
                  }
                  className="rounded-lg border border-slate-700 bg-slate-900/60 px-5 py-3 font-medium text-white transition hover:border-slate-500 hover:bg-slate-800 disabled:opacity-50"
                >
                  Back
                </button>

                <button
                  onClick={
                    onConfirm
                  }
                  disabled={
                    isWriting ||
                    isConfirming
                  }
                  className={`rounded-lg px-6 py-3 font-semibold text-white transition ${
                    isWriting ||
                    isConfirming
                      ? "bg-slate-700 opacity-60"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {isWriting
                    ? "Confirm in your wallet..."
                    : isConfirming
                    ? "Waiting for ARC confirmation..."
                    : "Confirm Payment"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="border-b border-indigo-400/10 px-6 py-8 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-3xl shadow-[0_0_35px_rgba(0,232,137,0.12)]">
                ✓
              </div>

              <h2 className="text-3xl font-bold text-white">
                Payment Completed
              </h2>

              <p className="mt-3 text-slate-400">
                Your payment has been successfully confirmed on ARC Network.
              </p>
            </div>

            <div className="space-y-6 px-6 py-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="partio-subcard rounded-xl p-5">
                  <p className="partio-label">
                    Recipients
                  </p>

                  <p className="mt-2 text-3xl font-bold text-white">
                    {
                      validRecipients.length
                    }
                  </p>
                </div>

                <div className="partio-subcard rounded-xl p-5 text-right">
                  <p className="partio-label">
                    Total Sent
                  </p>

                  <p className="mt-2 text-3xl font-bold text-emerald-400">
                    {totalAmount.toFixed(
                      2
                    )}{" "}
                    USDC
                  </p>
                </div>
              </div>

              {txHash && (
                <div className="partio-subcard rounded-xl p-5">
                  <p className="partio-label mb-3">
                    Transaction Hash
                  </p>

                  <p className="break-all font-mono text-sm text-slate-300">
                    {txHash}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      onClick={
                        copyHash
                      }
                      className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:border-slate-500 hover:bg-slate-800"
                    >
                      Copy Hash
                    </button>

                    <a
                      href={`https://testnet.arcscan.app/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                    >
                      View on ArcScan
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-indigo-400/10 px-6 py-5">
              <button
                onClick={
                  onNewPayment
                }
                className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                New Payment
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}