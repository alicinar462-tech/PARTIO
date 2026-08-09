<p align="center">
  <img src="public/partio-logo.png" alt="PARTIO" width="450">
</p>

<h1 align="center">PARTIO</h1>

<p align="center">
  <strong>One Payment. Multiple Recipients.</strong>
</p>

PARTIO is a payment application I'm building for the ARC Hackathon.

The idea is simple: send one payment to multiple recipients without creating a separate payment flow for each recipient.

PARTIO runs on ARC Testnet and uses Circle App Kit and Unified Balance to bring wallet and Unified Balance funds into the payment flow. The payment is then handled by a Solidity smart contract that partitions the total amount between multiple recipients.

I'm building this as a working demo and improving it step by step.

---

## Live Demo

🌐 https://partiopay.xyz

---

## How It Works

The basic flow is:

1. Connect your wallet
2. Add recipients
3. Enter an amount for each recipient
4. PARTIO calculates the total payment
5. Wallet and Unified Balance funds are checked
6. Review the payment
7. Confirm the transaction
8. The PARTIO contract distributes the payment to the recipients

The main idea is to keep the user flow simple while handling the payment distribution on-chain.

---

## Features

- USDC payments on ARC Testnet
- Multiple recipients
- Payment partitioning through a Solidity smart contract
- Circle App Kit integration
- Circle Unified Balance integration
- Circle Gateway-backed payment flow
- Wallet connection
- ARC Testnet detection
- Network switching
- Wallet balance
- Unified Balance
- Contact management
- Transaction confirmation
- ArcScan transaction link
- Responsive UI

---

## Circle Integration

PARTIO uses Circle's developer tools as part of the payment flow.

### Circle App Kit

The project uses `@circle-fin/app-kit` to work with Circle's Unified Balance features.

~~~text
Wallet
  ↓
Viem Adapter
  ↓
Circle App Kit
  ↓
Unified Balance
~~~

### Unified Balance

Unified Balance is used to access and use USDC available through the user's Unified Balance.

PARTIO also checks the connected wallet balance and uses the available funds when preparing a payment.

### Gateway

Circle Gateway is part of the infrastructure behind the Unified Balance flow.

PARTIO uses the App Kit and Unified Balance APIs instead of implementing the lower-level Gateway flow from scratch.

---

## Smart Contract

The payment distribution is handled by the PARTIO Solidity smart contract on ARC Testnet.

The frontend collects the recipient addresses and amounts and sends them to the contract.

The contract then partitions the payment between the recipients.

For example:

~~~text
Total: 5 USDC

Recipient 1 → 1 USDC
Recipient 2 → 1 USDC
Recipient 3 → 1 USDC
Recipient 4 → 1 USDC
Recipient 5 → 1 USDC
~~~

This is the main reason for the name PARTIO — partitioning one payment into multiple destinations.

---

## Built With

- ARC Network
- Solidity
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

~~~text
app/
  Next.js application

components/
  Wallet, recipients and payment UI

hooks/
  Payment and application logic

src/unified/
  Circle Unified Balance integration
  Gateway and wallet adapters

contracts/
  PARTIO Solidity smart contracts

lib/
  Contract configuration and blockchain helpers
~~~

---

## Roadmap

Some things I'd like to work on next:

- Transaction history
- Arc Name support
- Better mobile experience
- Improved contact management
- Better accessibility
- More UI improvements
- More payment options

I'm also interested in exploring a more unified payment experience for cross-chain users.

Instead of asking users to bridge assets first, I'd like to explore how Circle's infrastructure can make that process simpler for the user.

There is still a lot I want to learn and improve as I continue building PARTIO.

---

## Feedback

I'm still learning and building.

If you try PARTIO and find something that could be improved, I'd really appreciate your feedback.

Ideas, bugs and suggestions are all welcome.

Every suggestion helps make PARTIO a little better.
