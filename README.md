<p align="center">
  <img src="public/partio-logo.png" alt="PARTIO" width="450">
</p>

<h1 align="center">PARTIO</h1>

<p align="center">
  <strong>One Payment. Multiple Recipients.</strong>
</p>

<p align="center">
  A multi-recipient USDC payment application built on Arc and Circle infrastructure.
</p>

PARTIO is a payment application built on Arc.

The idea is simple: instead of making a separate transaction for every person, PARTIO lets users prepare multiple payments and send them through a single payment flow.

PARTIO uses native USDC on Arc and integrates Circle App Kit and Unified Balance to make funds available across supported networks.

The payment is then handled by a PARTIO smart contract that distributes the payment between the selected recipients.

PARTIO started as a testnet project and has now moved to Arc Mainnet.

---

## Live Demo

🌐 https://partiopay.xyz

---

## Mainnet

PARTIO is currently deployed on **Arc Mainnet**.

### Network

- Network: Arc Mainnet
- Chain ID: `5042`
- Native currency: USDC
- RPC: `https://rpc.mainnet.arc.io`

### PARTIO V2

The current payment flow uses the PARTIO V2 architecture.

**PARTIO V2 Factory**

```text
0xaF60A431824ABd26c18b8593a2b44FFef2624182
```

**Arc Mainnet USDC**

```text
0x3600000000000000000000000000000000000000
```

Each payment created through PARTIO gets its own payment vault.

This keeps payment funds isolated instead of keeping multiple users' payments inside a shared contract balance.

---

## How It Works

The basic flow is:

1. Connect your wallet
2. Add recipients
3. Enter an amount for each recipient
4. PARTIO calculates the total
5. PARTIO checks the connected wallet and Unified Balance
6. PARTIO prepares the required funding
7. Review the payment
8. Confirm the transaction
9. The payment vault distributes the USDC to the recipients

The goal is to keep the process simple and avoid making the user deal with separate transactions for every recipient.

Saved Groups can also be used to add multiple saved contacts to a payment at once.

---

## Features

- Native USDC payments on Arc Mainnet
- Multiple recipients in one payment
- Payment partitioning through Solidity smart contracts
- Dedicated payment vault for each payment
- Circle App Kit
- Circle Unified Balance
- Circle Gateway infrastructure
- Wallet connection
- Arc Mainnet detection
- One-click network switching
- Live wallet USDC balance
- Unified Balance
- Wallet + Unified Balance funding
- Contact management
- Saved Groups
- Create, edit and delete saved groups
- Search contacts and saved groups
- Add multiple contacts using a saved group
- Transaction confirmation
- ArcScan transaction links
- Responsive UI
- Base Sepolia and Arbitrum Sepolia support for Unified Balance deposits and balances
- Improved Unified Balance payment preparation
- Production payment-flow validation
- On-chain transaction status checks
- Safer refund handling

---

## Payment Architecture

PARTIO uses a dedicated vault architecture for each payment.

The current flow is:

```text
User Wallet
    │
    │ createPayment()
    ▼
PARTIO V2 Factory
    │
    │ creates
    ▼
Dedicated Payment Vault
    │
    │ receives USDC
    │
    ├───────────────┐
    │               │
    ▼               ▼
Recipient 1     Recipient 2
    │               │
    └─────── ... ───┘
```

Every payment gets its own `PartioVault`.

The connected wallet becomes the owner of that vault.

Only the owner can execute or refund the payment.

This architecture was introduced to avoid the problems that can occur when multiple payments share the same contract balance.

---

## Circle Integration

PARTIO uses Circle infrastructure for the Unified Balance part of the payment flow.

### Circle App Kit

PARTIO uses:

```text
@circle-fin/app-kit
@circle-fin/unified-balance-kit
@circle-fin/adapter-viem-v2
```

The basic setup looks like this:

```text
Wallet
  ↓
Viem Adapter
  ↓
Circle App Kit
  ↓
Unified Balance
  ↓
Arc
```

### Unified Balance

Unified Balance allows PARTIO to use USDC available through the user's Unified Balance.

PARTIO also checks the connected wallet's USDC balance.

The payment preparation logic determines how much can actually be used from Unified Balance.

If the full payment can be funded through Unified Balance, PARTIO uses it directly.

If only part of the payment can be funded through Unified Balance, the remaining amount can be taken from the connected wallet.

For example:

```text
Payment: 15 USDC

Unified Balance → 4.981 USDC
Wallet          → 10.019 USDC
--------------------------------
Total           → 15.000 USDC
```

The user does not need to manually move funds between networks before making the payment.

### Gateway

Circle Gateway is part of the infrastructure behind the Unified Balance flow.

PARTIO uses Circle's App Kit and Unified Balance APIs rather than implementing the lower-level Gateway flow directly.

---

## Unified Balance Payment Flow

When a payment requires Unified Balance funds, PARTIO first checks how much can actually be spent.

The payment preparation logic avoids unnecessary Unified Balance checks when the requested amount can already be used.

When the full amount cannot be used, PARTIO searches for a usable amount and then calculates the remaining wallet funding requirement.

The resulting flow looks like this:

```text
Payment
   │
   ▼
Check Unified Balance
   │
   ├── Full amount available
   │        │
   │        ▼
   │   Unified Balance
   │
   └── Partial amount available
            │
            ├── Unified Balance
            │
            └── Wallet
```

This allows PARTIO to combine funds from Unified Balance and the connected wallet without requiring the user to manually manage the split.

---

## Supported Networks

### Payment Network

PARTIO payments currently run on:

- Arc Mainnet

### Unified Balance Sources

The current Unified Balance flow has been tested with:

- Base Sepolia
- Arbitrum Sepolia

Additional network support can be added as the project evolves.

---

## Smart Contracts

The payment distribution is handled by Solidity smart contracts deployed on Arc Mainnet.

### PARTIO V2 Factory

```text
0xaF60A431824ABd26c18b8593a2b44FFef2624182
```

The factory creates a new payment vault for each payment.

### Payment Vault

Each payment receives its own `PartioVault`.

The vault:

- Stores the payment funds
- Keeps track of its owner
- Validates recipients and amounts
- Distributes USDC to recipients
- Supports refunds before execution
- Prevents the payment from being executed more than once
- Limits the number of recipients per payment

The current maximum is:

```text
50 recipients
```

For example:

```text
Total: 5 USDC

Recipient 1 → 1 USDC
Recipient 2 → 1 USDC
Recipient 3 → 1 USDC
Recipient 4 → 1 USDC
Recipient 5 → 1 USDC
```

This is the core idea behind the name PARTIO: partitioning one payment into multiple destinations.

---

## Production Readiness Improvements

Before moving the application further into mainnet usage, the payment flow went through an internal production-readiness review.

The review focused on transaction handling, wallet balances, Unified Balance behavior, refund handling and provider consistency.

Several issues were identified and fixed.

### Transaction Status Validation

PARTIO now checks the actual on-chain transaction status after important transactions.

This includes:

- Payment execution
- Wallet funding transactions
- Refund transactions

A transaction is not treated as successful simply because a transaction hash was returned.

### Correct USDC Balance Handling

The wallet balance check now reads the USDC ERC-20 balance directly instead of treating the native wallet balance as an 18-decimal asset.

This is important because Arc uses USDC as its native currency while the application still interacts with USDC through its token interface.

### Unified Balance Error Handling

The Unified Balance payment preparation flow was improved so that an unexpected spend-estimation error does not unnecessarily stop the entire payment flow.

When Unified Balance cannot provide a usable amount, PARTIO can continue with wallet funding when possible.

### Unified Balance Spend Validation

After a successful Circle `spend()` call, PARTIO validates:

- The transaction hash
- The recipient address
- The destination chain

This prevents an unexpected Circle result from being silently treated as a successful payment.

### Pending Balance Handling

The payment preparation flow uses confirmed Unified Balance funds instead of counting pending funds as immediately available.

This reduces the risk of preparing a payment against funds that have not actually settled yet.

### Refund Validation

Refund transactions are now checked for successful on-chain execution before the payment is removed from the pending payment list.

### Wallet Provider Consistency

The main payment flow and pending payment flow now use the connected wallet provider consistently when creating the Circle Viem adapter.

### Production Logging

Development-only Circle spend logging was removed from the production payment path.

---

## Mainnet Testing

The updated payment flow has been tested directly on Arc Mainnet.

Testing covered both wallet-funded and Unified Balance-funded payments.

### Wallet Funding

A mainnet payment was tested using wallet USDC funding.

The payment successfully:

1. Created a dedicated payment vault
2. Funded the vault
3. Executed the payment
4. Distributed USDC to multiple recipients

### Unified Balance

A mainnet payment was also tested using Circle Unified Balance.

The flow successfully:

1. Created a dedicated payment vault
2. Created the required Circle Unified Balance operation
3. Moved USDC to the Arc payment vault
4. Executed the PARTIO payment
5. Distributed the payment to the recipients

### Mixed Funding

The payment flow has also been tested with situations where Unified Balance and wallet funds are both involved.

This is one of the main reasons for the Unified Balance integration: the user should not have to manually calculate how much needs to be moved between networks before making a payment.

---

## Saved Contacts and Saved Groups

PARTIO includes a local contact management system.

Users can:

- Save wallet addresses
- Edit contacts
- Delete contacts
- Search contacts

Saved Groups make repeated multi-recipient payments easier.

Users can:

- Create groups
- Add saved contacts to groups
- Search groups
- Edit groups
- Delete groups
- Add an entire group to a payment

This is useful for recurring payments where the same recipients are used repeatedly.

---

## Recent Improvements

A major part of the recent development work focused on making the payment flow more reliable and predictable.

The earlier testnet version already supported Unified Balance, but payment preparation could perform unnecessary checks and sometimes take longer than expected.

The payment logic was improved to:

- Check available Unified Balance more efficiently
- Avoid unnecessary estimation attempts
- Find a usable Unified Balance amount more intelligently
- Calculate the remaining wallet requirement
- Validate Circle spend results
- Validate transaction receipts
- Handle failed transactions more safely
- Improve wallet and provider handling

The application was then tested again on Arc Mainnet.

The result is a much more stable payment flow compared with the earlier testnet implementation.

---

## Security and Current Limitations

PARTIO has gone through an internal production-readiness review focused on the payment flow.

The review covered:

- Smart contract interaction
- Wallet funding
- Unified Balance integration
- Transaction receipt handling
- Refund handling
- Balance calculations
- Provider consistency
- Circle spend result validation

This was an internal engineering review, not a formal third-party security audit.

There is also an edge case that remains on the roadmap.

If a payment vault receives more USDC than the exact payment amount and the payment is executed for a smaller amount, the remaining balance can stay inside the vault after execution.

This is currently considered a rare edge case and has not been changed in the current production flow.

As PARTIO evolves, this behavior can be improved with a dedicated excess-balance handling mechanism.

---

## Built With

- Arc Network
- Solidity
- OpenZeppelin
- Next.js
- React
- TypeScript
- Wagmi
- Viem
- Tailwind CSS
- Circle App Kit
- Circle Unified Balance Kit
- Circle Viem Adapter
- Hardhat

---

## Project Structure

The project is split into a few main areas:

```text
app/
  Next.js application

components/
  Wallet, recipients and payment UI
  Contacts and Saved Groups UI
  Payment review and pending payment UI

hooks/
  Payment and application logic
  Payment preparation
  Wallet and Unified Balance flow

src/unified/
  Circle Unified Balance integration
  Gateway and wallet adapters
  Unified Balance spend flow

contracts/
  PARTIO Solidity smart contracts
  Payment factory
  Dedicated payment vaults

lib/
  Contract configuration
  Blockchain helpers
  Contact and Saved Groups storage

types/
  Application types
  Contact, recipient and saved group types
```

---

## Roadmap

PARTIO is still evolving.

### Currently Working On

- Transaction history
- Finding previous payments by wallet address
- Additional network integrations
- Feedback system
- Further payment flow improvements
- Better handling of payment edge cases

### Planned

- Arc Name support
- Better mobile experience
- Improved contact management
- Better accessibility
- More UI improvements
- More payment options
- More detailed transaction history
- Improved handling of excess payment-vault balances

A longer-term goal is to make the payment experience feel more network-agnostic.

Instead of requiring users to manually bridge or move funds before making a payment, PARTIO can use Circle's infrastructure to handle more of the underlying complexity in the background.

There are still many ideas to explore, but the main direction is clear:

```text
One payment
      ↓
Multiple recipients
      ↓
Multiple possible funding sources
      ↓
Simple user experience
```

---

## Feedback

PARTIO is still being developed and tested.

If you try the application and something does not work as expected, or you have an idea that could make the payment experience better, feedback is welcome.

Bugs, ideas and suggestions are all useful.

A feedback system is also being integrated directly into the application to make reporting issues easier while using PARTIO.

---

## License

This project is currently under development.
