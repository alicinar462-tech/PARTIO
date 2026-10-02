export const PARTIO_V2_ADDRESS =
  "0xaF60A431824ABd26c18b8593a2b44FFef2624182" as const;

/* =========================================================
   PARTIO V2 FACTORY
   Creates one isolated vault for each payment
   ========================================================= */

export const PARTIO_V2_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "usdcAddress",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },

  {
    inputs: [],
    name: "InvalidUSDC",
    type: "error",
  },

  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "paymentId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "vault",
        type: "address",
      },
    ],
    name: "PaymentCreated",
    type: "event",
  },

  {
    inputs: [],
    name: "paymentCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },

  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "payments",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },

  {
    inputs: [],
    name: "usdc",
    outputs: [
      {
        internalType: "contract IERC20",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },

  {
    inputs: [],
    name: "createPayment",
    outputs: [
      {
        internalType: "uint256",
        name: "paymentId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "vault",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },

  {
    inputs: [
      {
        internalType: "uint256",
        name: "paymentId",
        type: "uint256",
      },
    ],
    name: "getPaymentVault",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

/* =========================================================
   PARTIO V2 VAULT
   One isolated vault per payment
   ========================================================= */

export const PARTIO_VAULT_ABI = [
  {
    inputs: [],
    name: "InvalidOwner",
    type: "error",
  },

  {
    inputs: [],
    name: "InvalidRecipients",
    type: "error",
  },

  {
    inputs: [],
    name: "InvalidAmounts",
    type: "error",
  },

  {
    inputs: [],
    name: "InvalidValue",
    type: "error",
  },

  {
    inputs: [],
    name: "InsufficientBalance",
    type: "error",
  },

  {
    inputs: [],
    name: "AlreadyExecuted",
    type: "error",
  },

  {
    inputs: [],
    name: "TooManyRecipients",
    type: "error",
  },

  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "totalAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "recipientCount",
        type: "uint256",
      },
    ],
    name: "PaymentExecuted",
    type: "event",
  },

  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Refunded",
    type: "event",
  },

  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },

  {
    inputs: [],
    name: "usdc",
    outputs: [
      {
        internalType: "contract IERC20",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },

  {
    inputs: [],
    name: "executed",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },

  {
    inputs: [],
    name: "balance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },

  {
    inputs: [
      {
        internalType: "address[]",
        name: "recipients",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "amounts",
        type: "uint256[]",
      },
      {
        internalType: "uint256",
        name: "totalAmount",
        type: "uint256",
      },
    ],
    name: "execute",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  {
    inputs: [],
    name: "refund",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

/* =========================================================
   ACTIVE PARTIO CONTRACT
   Deployed on Arc Mainnet
   ========================================================= */

export const PARTIO_ADDRESS =
  PARTIO_V2_ADDRESS;

export const PARTIO_ABI =
  PARTIO_V2_ABI;