import "./globals.css";

import type { Metadata } from "next";

import { TRPCReactProvider } from "../src/lib/trpc/client.js";

export const metadata: Metadata = {
  title: "COLREGS Navigator",
  description: "Maritime collision-avoidance rules engine and visualizer.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-slate-50 min-h-screen">
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
