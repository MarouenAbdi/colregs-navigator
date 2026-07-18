"use client";

/**
 * Client-side tRPC + React Query wiring. Mounted once at the app root
 * (app/layout.tsx) so any client component can call trpc.*.useMutation()/
 * useQuery(). Server Components should use src/lib/trpc/server.ts instead --
 * this file is browser-only plumbing.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { useState } from "react";

import type { AppRouter } from "../../server/api/routers/_app.js";

export const trpc = createTRPCReact<AppRouter>();

function makeQueryClient() {
  return new QueryClient();
}

// The server should always get a fresh QueryClient (no cross-request cache
// leakage); the browser reuses one instance across re-renders.
let clientQueryClientSingleton: QueryClient | undefined;
function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  return (clientQueryClientSingleton ??= makeQueryClient());
}

function getUrl() {
  return typeof window !== "undefined"
    ? "/api/trpc"
    : "http://localhost:3000/api/trpc";
}

export function TRPCReactProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = getQueryClient();

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [httpBatchLink({ url: getUrl() })],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
