/**
 * Server-side tRPC caller factory. Lets Server Components call
 * scenario.get/gallery.list directly (no HTTP round-trip) using the same
 * createCallerFactory(appRouter)(createTRPCContext()) shape already proven in
 * src/server/api/routers/scenario.test.ts.
 *
 * No "server-only" import: that package is not an installed dependency, and
 * this module is exclusively imported by Server Components in this codebase,
 * so the client-bundling guarantee already holds without adding an unaudited
 * dependency.
 */

import { appRouter } from "../../server/api/routers/_app.js";
import { createCallerFactory, createTRPCContext } from "../../server/api/trpc.js";

export function getCaller() {
  return createCallerFactory(appRouter)(createTRPCContext());
}
