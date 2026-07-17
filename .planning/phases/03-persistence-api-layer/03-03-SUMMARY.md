---
phase: 03-persistence-api-layer
plan: 03
subsystem: api
tags: [trpc, nextjs, integration-test, routers]

# Dependency graph
requires:
  - phase: 03-persistence-api-layer (Plan 01)
    provides: prisma/schema.prisma, src/server/db/client.ts, Docker Postgres running and migrated
  - phase: 03-persistence-api-layer (Plan 02)
    provides: src/server/application/scenario-service.ts (createScenario/getScenario/listGallery), src/server/db/scenario-repository.ts
provides:
  - src/server/api/trpc.ts -- initTRPC context/router/procedure/createCallerFactory setup with production errorFormatter (T-3-07)
  - src/server/api/routers/scenario.ts -- create/get thin adapters, reusing domain VesselSchema (D-11), NOT_FOUND on missing shareId (D-10)
  - src/server/api/routers/gallery.ts -- list thin adapter, returns [] never throws (D-07)
  - src/server/api/routers/_app.ts -- appRouter composing scenario + gallery
  - app/api/trpc/[trpc]/route.ts -- fetchRequestHandler catch-all Next.js App Router handler, GET+POST
  - src/server/api/routers/scenario.test.ts -- createCallerFactory-based end-to-end integration proof of SCEN-02 across the full router->service->repository->domain chain
affects: [phase-4-interactive-chart]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "tRPC routers stay pure Zod-validated pass-throughs to a single application-layer service call -- zero classifyEncounter()/Prisma calls in any router handler (success criterion #4)"
    - "createCallerFactory-based Vitest integration tests exercise the full router stack server-side, no HTTP server needed"
    - "Next.js App Router catch-all route handler (app/api/trpc/[trpc]/route.ts) wraps fetchRequestHandler, exporting the same handler function for both GET and POST"

key-files:
  created:
    - src/server/api/trpc.ts
    - src/server/api/routers/scenario.ts
    - src/server/api/routers/gallery.ts
    - src/server/api/routers/_app.ts
    - app/api/trpc/[trpc]/route.ts
    - src/server/api/routers/scenario.test.ts
  modified: []

key-decisions:
  - "Reused headOnGenuineCase (cross-phase fixture from Phase 1/2) for the create->get round-trip proof, per the plan's explicit direction to reuse an existing head-on fixture -- encounterType/giveWay/standOn are asserted by exact value comparison (including the null/null mutual-obligation giveWay/standOn values, which are still a valid exact-equality assertion, not a weaker toBeDefined() check)"
  - "Reworded gallery.ts's doc comment to avoid the literal substring 'TRPCError' so the plan's own grep-based acceptance criterion (no TRPCError reference in gallery.ts) passes on the comment as well as the code -- mirrors Plan 01's precedent for grep-sensitive comment wording"

patterns-established:
  - "Pattern: Next.js App Router tRPC catch-all handler exports one fetchRequestHandler-wrapped function as both GET and POST"

requirements-completed: [SCEN-02]

# Metrics
duration: ~30min
completed: 2026-07-17
---

# Phase 3 Plan 03: tRPC Routers & Next.js Route Handler Summary

**Thin `scenario`/`gallery` tRPC routers wired to Plan 02's application service, composed into `appRouter`, exposed via a Next.js catch-all route handler, and proven end-to-end via a `createCallerFactory` integration test that re-derives the verdict across the full router -> service -> repository -> domain chain**

## Status: COMPLETE

This is the final plan in Phase 3 (persistence-api-layer). Both tasks are done and committed.

## Performance

- **Duration:** ~30 min (environment bootstrap ~5 min + Task 1 ~10 min + Task 2 ~15 min)
- **Tasks:** 2 of 2 completed
- **Files modified:** 6 (4 router files, 1 route handler, 1 integration test)

## Accomplishments
- Bootstrapped the fresh worktree environment: copied `.env.example` to `.env`, ran `npm install` (182 packages), ran `npx prisma generate` (client generated to `generated/prisma/`), confirmed `npx prisma migrate status` reports the schema up to date against the already-running Docker Postgres instance.
- Confirmed the pre-existing 111-test suite (Phase 1/2 domain tests + Plan 02's repository/service tests) was green before making any changes.
- **Task 1:** Created `src/server/api/trpc.ts` (`initTRPC` context/router/procedure/`createCallerFactory` setup, with a production-only `errorFormatter` that hides Prisma error internals per T-3-07), `src/server/api/routers/scenario.ts` (`create`/`get`, reusing domain `VesselSchema` per D-11, throwing `TRPCError({code:'NOT_FOUND'})` per D-10), `src/server/api/routers/gallery.ts` (`list`, returns `[]` never throws per D-07), and `src/server/api/routers/_app.ts` (`appRouter` composing both). Verified via grep that neither router file contains any `classifyEncounter`/Prisma reference (success criterion #4) and that `scenario.ts` does not redefine a parallel vessel Zod schema.
- **Task 2:** Created `app/api/trpc/[trpc]/route.ts` (Next.js App Router catch-all handler, `fetchRequestHandler` wired to `appRouter`/`createTRPCContext`, exporting `GET`/`POST`) and `src/server/api/routers/scenario.test.ts` (4 `createCallerFactory`-based integration tests proving SCEN-02 end-to-end: create returns a cuid-shaped `shareId`; get re-derives `verdict.encounterType`/`giveWay`/`standOn` matching the fixture's expected values by exact comparison; a nonexistent `shareId` rejects with `TRPCError` `code: 'NOT_FOUND'`; `gallery.list` resolves to `[]` with no curated scenarios seeded).
- Full suite: 115/115 tests passing (111 pre-existing + 4 new), `npx tsc --noEmit` clean, full suite re-run 3 consecutive times with no flakiness (relevant given the shared live-Postgres-table concern flagged in Plan 02's summary).

## Task Commits

1. **Task 1: tRPC init, scenario/gallery routers, router composition**
   - `ed77449` (feat) -- `src/server/api/trpc.ts`, `src/server/api/routers/scenario.ts`, `src/server/api/routers/gallery.ts`, `src/server/api/routers/_app.ts`
2. **Task 2: Next.js route handler + end-to-end SCEN-02 integration tests**
   - `492f6af` (test) -- `src/server/api/routers/scenario.test.ts` (see TDD Gate Compliance note below -- this test passes immediately, no RED phase)
   - `611afab` (feat) -- `app/api/trpc/[trpc]/route.ts`

**Plan metadata:** SUMMARY.md commit -- pending, see below

## Files Created/Modified
- `src/server/api/trpc.ts` -- `createTRPCContext`/`createTRPCRouter`/`publicProcedure`/`createCallerFactory`, production `errorFormatter`
- `src/server/api/routers/scenario.ts` -- `create`/`get` procedures, zero classification/Prisma logic
- `src/server/api/routers/gallery.ts` -- `list` procedure, zero classification/Prisma logic
- `src/server/api/routers/_app.ts` -- `appRouter` composed of `scenario` + `gallery`
- `app/api/trpc/[trpc]/route.ts` -- `GET`/`POST` catch-all handler
- `src/server/api/routers/scenario.test.ts` -- 4 end-to-end integration tests via `createCallerFactory`

## Decisions Made
- Used `headOnGenuineCase` (Phase 1/2 cross-phase fixture, `vesselA`/`vesselB` from `relativeBearing.fixtures.ts`'s `headOnCase`) for the create->get round-trip proof, per the plan's explicit instruction to reuse an existing head-on fixture. Its `expectedGiveWay`/`expectedStandOn` are both `null` (mutual obligation, same vessel type on both sides) -- this is still an exact-value assertion (`toBe(null)`), satisfying the plan's acceptance criterion of "exact value comparison, not `toBeDefined()`", even though a non-null-giveWay fixture would be a marginally stronger visual signal.
- Reworded `gallery.ts`'s doc comment to avoid the literal substring `TRPCError` so the plan's own grep-based acceptance criterion (`grep -c "TRPCError" gallery.ts` returns 0) passes against comments as well as code, mirroring Plan 01's precedent for grep-sensitive wording.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Initial doc comment in gallery.ts tripped its own no-TRPCError grep check**
- **Found during:** Task 1 (gallery.ts authoring)
- **Issue:** The plan's acceptance criterion runs `grep -c "TRPCError" src/server/api/routers/gallery.ts` expecting 0. My first draft's doc comment said "...returns `[]`, never a `TRPCError`" -- the literal substring `TRPCError` appeared in the comment even though no code referenced it, so the grep returned 1.
- **Fix:** Reworded the comment to "...returns `[]` and never throws (no not-found-style error path here)" -- same meaning, no literal match.
- **Files modified:** `src/server/api/routers/gallery.ts`
- **Verification:** Re-ran `grep -c "TRPCError" src/server/api/routers/gallery.ts`, returns 0
- **Committed in:** `ed77449` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 3, blocking, mechanical comment wording)
**Impact on plan:** Cosmetic only -- no change to router behavior, semantics, or architecture.

## TDD Gate Compliance

Task 2 was marked `tdd="true"`. The RED gate (a genuinely failing test before implementation) did not apply cleanly here: `src/server/api/routers/scenario.test.ts` exercises the composed `appRouter` via `createCallerFactory`, which depends only on Task 1's routers (already committed, complete, and correct) plus Plan 02's already-fully-working `scenario-service.ts`/`scenario-repository.ts`. None of the 4 behaviors under test depend on `app/api/trpc/[trpc]/route.ts` (the actual new production code Task 2 adds) -- `createCallerFactory` bypasses HTTP entirely, per the plan's own stated scope boundary ("verifies the routers via `createCallerFactory`... does NOT create... any client-side hook consumer"). Running the test suite immediately after writing the test file (before writing the route handler) showed all 4 tests passing on the first run.

This was investigated per the fail-fast rule before proceeding: the pass is not a test-authoring mistake (it is not testing the wrong thing, nor asserting something trivially true) -- it is a legitimate consequence of this plan's task sequencing, where Task 1 already delivers the full router chain this integration test is designed to regression-proof end-to-end. The test's actual job (per the plan's `<behavior>` block) is to prove SCEN-02's re-derivation guarantee holds through the real composed router stack, not to drive out new router logic -- that logic already exists and was verified separately in Task 1's acceptance criteria. The route handler (`app/api/trpc/[trpc]/route.ts`) itself has no automated test in this phase (per the plan's own scope boundary, which defers any HTTP-level/client-side verification to Phase 4) -- its correctness is established by `npx tsc --noEmit` (type-correct `GET`/`POST` exports wired to `fetchRequestHandler`) and manual code review against Pattern 4/RESEARCH.md's canonical shape, not by this test file.

Gate sequence found in git log: `test(03-03)` commit (`492f6af`) exists, followed by a `feat(03-03)` commit (`611afab`) for the route handler. No `refactor` commit was needed. This satisfies the mechanical RED-then-GREEN commit ordering even though the "RED" commit's test suite was fully green at commit time -- flagged here for transparency rather than silently treated as a normal TDD cycle.

## Issues Encountered
None beyond the one auto-fixed deviation and the TDD gate note above.

## User Setup Required
None. Docker Postgres (from Plan 01) was already running and healthy; `.env` was created from `.env.example`; `npm install` and `npx prisma generate` completed cleanly.

## Next Phase Readiness
- `appRouter`/`AppRouter` type and `app/api/trpc/[trpc]/route.ts` are ready for Phase 4 to build a `TRPCReactProvider`/`layout.tsx` client-side wiring against, per this phase's explicitly deferred scope boundary (Open Question 2, RESEARCH.md).
- All four of Phase 3's ROADMAP.md success criteria are now demonstrably true: (1) schema has no verdict column (Plan 01), (2) a scenario is created/retrieved by a non-guessable cuid share ID (this plan's Test 1/2), (3) retrieval always re-runs `classifyEncounter()` (this plan's Test 2, proven end-to-end through the full stack), (4) routers are thin adapters with zero classification logic (this plan's Task 1 acceptance criteria, grep-verified).
- SCEN-02 is claimed complete in this summary's `requirements-completed` -- Plan 02 implemented the mechanism, this plan exposes and proves it end-to-end via tRPC, which is the last piece needed to close the requirement.
- `npm test` (full 115-test suite) passes cleanly and was re-run 3x with no flakiness, consistent with Plan 02's `fileParallelism: false`/`vitest.setup.ts` test-infra fixes still applying correctly to this plan's new test file.

---
*Phase: 03-persistence-api-layer*
*Completed: 2026-07-17*

## Self-Check: PASSED

All claimed created files found on disk (src/server/api/trpc.ts,
src/server/api/routers/scenario.ts, src/server/api/routers/gallery.ts,
src/server/api/routers/_app.ts, app/api/trpc/[trpc]/route.ts,
src/server/api/routers/scenario.test.ts). All claimed commit hashes found
in git log (ed77449, 492f6af, 611afab). Full test suite re-verified green
(115/115) and `npx tsc --noEmit` clean immediately before writing this
summary.
