import "./globals.css";
import type { Metadata } from "next";
import WalletProvider from "../providers/wallet";

export const metadata: Metadata = {
  title: "ArcSplit",
  description: "One Click USDC Distribution on ARC",
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