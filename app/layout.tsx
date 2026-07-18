import "./globals.css";

import type { Metadata } from "next";

import { TRPCReactProvider } from "../src/lib/trpc/client.js";
import { Geist, Geist_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

// 06-01 Task 3 (Pitfall 1): shadcn init's `nova` preset had already
// partially wired Geist (sans only, variable named "--font-sans"). Renamed
// to "--font-geist-sans" and added Geist_Mono, matching the
// "--font-geist-sans"/"--font-geist-mono" variable names Task 1's
// app/globals.css `@theme inline` block maps --font-sans/--font-mono to.
const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "COLREGS Navigator",
  description: "Maritime collision-avoidance rules engine and visualizer.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // Hardcoded "dark" -- no theme-switcher package, no toggle machinery
    // (CONTEXT.md/RESEARCH.md Pitfall 2: this app renders dark-only).
    <html
      lang="en"
      className={cn("dark font-sans", geistSans.variable, geistMono.variable)}
    >
      <body className="bg-background text-foreground antialiased min-h-screen">
        <Header />
        <main>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </main>
        <Footer />
      </body>
    </html>
  );
}
