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

  const validRecipients = recipients.filter((recipient) => {
    const value = Number(recipient.amount);
    return !Number.isNaN(value) && value > 0;
  });

  const copyHash = async () => {
    if (!txHash) return;
    await navigator.clipboard.writeText(txHash);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl">
        {!isConfirmed ? (
          <>
            <div className="border-b border-neutral-800 px-6 py-5">
              <h2 className="text-2xl font-bold text-white">
                Review Payment
              </h2>

              <p className="mt-2 text-sm text-neutral-400">
                Please review all recipients before submitting your transaction.
              </p>
            </div>

            <div className="max-h-[420px] space-y-4 overflow-y-auto px-6 py-5">
              {writeError && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4">
                  <p className="font-semibold text-red-300">
                    Payment Failed
                  </p>

                  <p className="mt-1 text-sm text-red-200">
                    {writeError.message}
                  </p>
                </div>
              )}

              {validRecipients.length === 0 ? (
                <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6 text-center text-neutral-400">
                  No valid recipients found.
                </div>
              ) : (
                validRecipients.map((recipient) => (
                  <div
                    key={recipient.id}
                    className="rounded-xl border border-neutral-800 bg-neutral-950 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-white">
                          {recipient.name}
                        </p>

                        <p className="mt-1 break-all text-sm text-neutral-400">
                          {recipient.address}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-bold text-green-400">
                          {Number(recipient.amount).toFixed(2)} USDC
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-neutral-800 px-6 py-5">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-400">
                    Recipients
                  </p>

                  <p className="text-xl font-bold text-white">
                    {validRecipients.length}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-neutral-400">
                    Total Payment
                  </p>

                  <p className="text-2xl font-bold text-green-400">
                    {totalAmount.toFixed(2)} USDC
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  disabled={isWriting || isConfirming}
                  className="rounded-lg border border-neutral-700 px-5 py-3 font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
                >
                  Back
                </button>

                <button
                  onClick={onConfirm}
                  disabled={isWriting || isConfirming}
                  className={`rounded-lg px-6 py-3 font-semibold text-white transition ${
                    isWriting || isConfirming
                      ? "bg-blue-600 opacity-50"
                      : "bg-blue-600 hover:bg-blue-500"
                  }`}
                >
                  {isWriting
                    ? "Confirm the transaction in your wallet..."
                    : isConfirming
                    ? "Waiting for ARC confirmation..."
                    : "Confirm Payment"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="border-b border-neutral-800 px-6 py-8 text-center">
              <div className="mb-4 text-6xl">
                🎉
              </div>

              <h2 className="text-3xl font-bold text-white">
                Payment Completed
              </h2>

              <p className="mt-3 text-neutral-400">
                Your payment has been successfully confirmed on ARC Network.
              </p>
            </div>

            <div className="space-y-6 px-6 py-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5">
                  <p className="text-sm text-neutral-400">
                    Recipients
                  </p>

                  <p className="mt-2 text-3xl font-bold text-white">
                    {validRecipients.length}
                  </p>
                </div>

                <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 text-right">
                  <p className="text-sm text-neutral-400">
                    Total Sent
                  </p>

                  <p className="mt-2 text-3xl font-bold text-green-400">
                    {totalAmount.toFixed(2)} USDC
                  </p>
                </div>
              </div>

              {txHash && (
                <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5">
                  <p className="mb-3 text-sm text-neutral-400">
                    Transaction Hash
                  </p>

                  <p className="break-all font-mono text-sm text-white">
                    {txHash}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      onClick={copyHash}
                      className="rounded-lg bg-neutral-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700"
                    >
                      Copy Hash
                    </button>

                    <a
                      href={`https://testnet.arcscan.app/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
                    >
                      View on ArcScan
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-neutral-800 px-6 py-5">
              <button
                onClick={onNewPayment}
                className="w-full rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-500"
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