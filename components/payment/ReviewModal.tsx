"use client";

import { Recipient } from "@/types/recipient";

type ReviewModalProps = {
  open: boolean;
  recipients: Recipient[];
  totalAmount: number;
  isWriting: boolean;
  isConfirming: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ReviewModal({
  open,
  recipients,
  totalAmount,
  isWriting,
  isConfirming,
  onClose,
  onConfirm,
}: ReviewModalProps) {
  if (!open) return null;

  const validRecipients = recipients.filter((recipient) => {
    const value = Number(recipient.amount);
    return !Number.isNaN(value) && value > 0;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl">

        {/* Header */}
        <div className="border-b border-neutral-800 px-6 py-5">
          <h2 className="text-2xl font-bold text-white">
            Review Payment
          </h2>

          <p className="mt-2 text-sm text-neutral-400">
            Please review all recipients before submitting your transaction.
          </p>
        </div>

        {/* Recipient List */}
        <div className="max-h-[420px] space-y-4 overflow-y-auto px-6 py-5">

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

        {/* Summary */}
        <div className="border-t border-neutral-800 px-6 py-5">

          <div className="mb-6 flex items-center justify-between">

            <div>
              <p className="text-sm text-neutral-400">
                Recipients
              </p>

              <p className="text-xl font-bold">
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
                ? "Waiting for wallet..."
                : isConfirming
                ? "Confirming..."
                : "Confirm Payment"}
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}