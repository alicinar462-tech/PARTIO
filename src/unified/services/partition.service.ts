import {
  PARTIO_ABI,
  PARTIO_ADDRESS,
} from "@/lib/contracts/partio";

import { Recipient } from "@/types/recipient";

import {
  parseUnits,
} from "viem";

export function buildPartitionTransaction(
  recipients: Recipient[]
) {
  const validRecipients =
    recipients.filter(
      (recipient) =>
        Number(recipient.amount) > 0
    );

  const recipientAddresses =
    validRecipients.map(
      (recipient) =>
        recipient.address
    );

  const amounts =
    validRecipients.map(
      (recipient) =>
        parseUnits(
          recipient.amount,
          6
        )
    );

  return {
    address:
      PARTIO_ADDRESS,

    abi:
      PARTIO_ABI,

    functionName:
      "partition",

    args: [
      recipientAddresses,
      amounts,
    ],
  } as const;
}