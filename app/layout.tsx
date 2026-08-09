import "./globals.css";

import type { Metadata } from "next";

import WalletProvider from "../providers/wallet";

export const metadata: Metadata = {
  title: "PARTIO — One Payment. Multiple Recipients.",
  description:
    "One payment. Multiple recipients. Powered by Circle and ARC.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}