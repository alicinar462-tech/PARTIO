import "./globals.css";
import type { Metadata } from "next";
import WalletProvider from "../providers/wallet";

export const metadata: Metadata = {
  title: "Partio",
  description:
    "One-Click Payment Partition on ARC. Split one payment into multiple destinations with a single transaction.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}