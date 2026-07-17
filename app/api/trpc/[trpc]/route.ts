/**
 * Next.js App Router catch-all HTTP handler for tRPC. The first externally
 * reachable HTTP endpoint in this repo (T-3-06/T-3-07 trust boundary).
 */

import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../../../../src/server/api/routers/_app.js";
import { createTRPCContext } from "../../../../src/server/api/trpc.js";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: createTRPCContext,
  });

export { handler as GET, handler as POST };
