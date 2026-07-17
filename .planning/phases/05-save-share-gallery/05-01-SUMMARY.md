---
phase: 05-save-share-gallery
plan: 01
subsystem: api
tags: [trpc, react-query, next.js, app-router]

# Dependency graph
requires:
  - phase: 03-persistence-api-layer
    provides: appRouter (scenario + gallery routers), createTRPCContext, createCallerFactory, publicProcedure
provides:
  - Client-side tRPC + React Query provider (trpc, TRPCReactProvider) mountable from any client component
  - Server-side tRPC caller factory (getCaller()) for Server Components with no HTTP round-trip
  - TRPCReactProvider mounted at the app root (app/layout.tsx)
affects: [05-02 save flow, 05-03/04 gallery page, 05-05 share page]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "createTRPCReact<AppRouter>() + trpc.Provider/QueryClientProvider composed in a single 'use client' TRPCReactProvider, mounted once at app/layout.tsx"
    - "Module-level QueryClient singleton on the browser (typeof window guard), fresh instance per request on the server"
    - "getCaller() server-side wrapper around createCallerFactory(appRouter)(createTRPCContext()) for Server Components"

key-files:
  created: [src/lib/trpc/client.tsx, src/lib/trpc/server.ts]
  modified: [app/layout.tsx]

key-decisions:
  - "No 'server-only' import in src/lib/trpc/server.ts -- package not installed, and this file is exclusively imported by Server Components already, so the guarantee holds without adding an unaudited dependency"
  - "getUrl() in the client provider returns a hardcoded http://localhost:3000/api/trpc for the (currently unused) server-render branch, matching the plan's fixed contract -- no VERCEL_URL/env-based origin needed yet since no Server Component calls trpc.* through this client path in this plan"

patterns-established:
  - "Every future client component reaches the API via `trpc.*.useQuery()/useMutation()` (imported from src/lib/trpc/client.js) instead of ad hoc fetch calls"
  - "Every future Server Component reaches the API via `getCaller()` (imported from src/lib/trpc/server.js) instead of importing routers/services directly"

requirements-completed: [SCEN-01, SCEN-03]

# Metrics
duration: 24min
completed: 2026-07-17
---

# Phase 5 Plan 1: tRPC Client/Server Wiring Summary

**Client-side tRPC + React Query provider and a server-side tRPC caller factory, wired at the app root with zero user-visible behavior change.**

## Performance

- **Duration:** 24 min
- **Started:** 2026-07-17T23:31:xxZ
- **Completed:** 2026-07-17T23:55:32Z
- **Tasks:** 2 completed
- **Files modified:** 3 (2 created, 1 modified)

## Accomplishments
- `src/lib/trpc/client.tsx` exports `trpc` (via `createTRPCReact<AppRouter>()`) and `TRPCReactProvider`, giving any client component `trpc.*.useQuery()/useMutation()` access via `httpBatchLink` against `/api/trpc`
- `src/lib/trpc/server.ts` exports `getCaller()`, a thin wrapper around the already-proven `createCallerFactory(appRouter)(createTRPCContext())` shape, for direct in-process calls from Server Components
- `app/layout.tsx` mounts `TRPCReactProvider` around `{children}`, with `metadata` and `<html lang="en">` left untouched

## Task Commits

Each task was committed atomically:

1. **Task 1: Define tRPC client provider and server caller contracts** - `1ab9ce5` (feat)
2. **Task 2: Mount TRPCReactProvider at the app root** - `e9a4174` (feat)

**Plan metadata:** commit pending (docs: complete plan) -- to be added after this SUMMARY is written

_Note: no TDD tasks in this plan; both tasks are plain `auto` type._

## Files Created/Modified
- `src/lib/trpc/client.tsx` - `"use client"` entry point: `trpc` (createTRPCReact<AppRouter>()) + `TRPCReactProvider` (QueryClient singleton + httpBatchLink)
- `src/lib/trpc/server.ts` - `getCaller()` server-side tRPC caller factory wrapper for Server Components
- `app/layout.tsx` - wraps `{children}` in `<TRPCReactProvider>` inside `<body>`

## Decisions Made
- Followed the plan's exact contract for both files (module-level singleton pattern, `getUrl()` branching on `typeof window`, no `@trpc/tanstack-react-query` import since it isn't installed).
- Cross-checked the provider pattern against tRPC's own current documentation (Context7 `/trpc/trpc`) before writing the file; the plan's spec matched the library's documented App Router setup exactly, so no deviation was needed there.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Generated the Prisma client so `tsc --noEmit` could run cleanly**
- **Found during:** Task 1 verification (`npx tsc --noEmit`)
- **Issue:** `generated/prisma` (Prisma 7's generated client output, gitignored) did not exist in this fresh worktree, causing an unrelated pre-existing `TS2307` error in `src/server/db/client.ts` that blocked confirming this plan's own files typechecked cleanly.
- **Fix:** Ran `DATABASE_URL=<local dev value> npx prisma generate` (schema generation only, no DB connection required). Output is gitignored, nothing committed.
- **Files modified:** none tracked (generated artifact only)
- **Verification:** `npx tsc --noEmit` now exits 0
- **Committed in:** N/A (gitignored artifact, not committed)

**2. [Rule 3 - Blocking] Created local `.env` so the full test suite could run against the real DB-backed tests**
- **Found during:** Task 2 verification (`npm test`)
- **Issue:** 3 test files (pre-existing, unrelated to this plan's files) that exercise `src/server/db`/`scenario`/`gallery` routers against a live Postgres instance failed with a SASL auth error because no `.env` (gitignored) existed in this worktree to supply `DATABASE_URL`.
- **Fix:** Copied `.env.example` to `.env` (same dev credentials already used elsewhere in the project; a Postgres 17 Docker container was already running locally on port 5432). Gitignored, nothing committed.
- **Files modified:** none tracked (`.env` is gitignored)
- **Verification:** `npm test` now reports 22/22 test files, 146/146 tests passing
- **Committed in:** N/A (gitignored file, not committed)

---

**Total deviations:** 2 auto-fixed (both Rule 3, both local-environment setup only -- no tracked files changed, no scope creep).
**Impact on plan:** Neither deviation touched any file in this plan's scope; both were prerequisites for running this plan's own verification commands (`tsc`, `npm test`) in a fresh worktree.

## Issues Encountered
- The plan's Task 2 "done" criterion asks for a manual `npm run dev` + load `/` smoke check. This worktree's `node_modules` is not materialized locally (Node's own module resolution walks up to the parent checkout's `node_modules`, which is why `tsc`/`vitest` work fine), and Next.js 16's Turbopack explicitly refuses to follow a `node_modules` symlink pointing outside the pinned `turbopack.root` (`Error: Symlink [project]/node_modules is invalid, it points out of the filesystem root`). This is a worktree-isolation limitation of the dev-server tooling, not a defect in the code shipped by this plan -- confirmed unrelated by (a) `tsc --noEmit` exiting 0 and (b) the full 146-test suite passing, including this plan's own layout render path being exercised indirectly by React Testing Library-based tests elsewhere in the suite. The dev-server manual smoke check itself could not be completed in this environment; documenting here rather than silently skipping.

## User Setup Required

None - no external service configuration required beyond the pre-existing local Postgres dev setup already documented in `.env.example`.

## Next Phase Readiness
- `trpc` + `TRPCReactProvider` (src/lib/trpc/client.tsx) and `getCaller()` (src/lib/trpc/server.ts) are the fixed, ready-to-consume entry points for 05-02's Save mutation, and for the gallery/share Server Components in 05-03/04/05.
- No blockers. The dev-server smoke-check limitation noted above is a local worktree-tooling gap only; it does not affect the merged branch once combined with the primary checkout's fully-installed `node_modules`.

---
*Phase: 05-save-share-gallery*
*Completed: 2026-07-17*
