---
phase: 03-persistence-api-layer
plan: 02
subsystem: database
tags: [prisma, postgres, trpc-error, vitest, application-layer, repository]

# Dependency graph
requires:
  - phase: 03-persistence-api-layer (Plan 01)
    provides: prisma/schema.prisma (flat Scenario model, no verdict column), src/server/db/client.ts PrismaClient singleton, Docker Postgres running and migrated
provides:
  - src/server/db/scenario-repository.ts -- create/findByShareId/findCurated against the Prisma Scenario model, no generic Repository<T> abstraction
  - src/server/application/scenario-service.ts -- createScenario/getScenario/listGallery use cases, the sole place classifyEncounter() is invoked in this phase (SCEN-02's re-derive-on-read mechanism, fully wired end-to-end)
  - rowToVessels() row-to-domain-object mapping, reused by both getScenario and listGallery
  - vitest.setup.ts + fileParallelism:false -- test infra fixes required for any future src/server test file that touches the live Postgres instance
affects: [03-03, phase-4-interactive-chart]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Application-layer use-case module (src/server/application/) calls classifyEncounter() fresh on every read -- never caches or persists a verdict (D-06/SCEN-02)"
    - "Repository returns bare null for not-found; Result<T> stays domain-internal and is unwrapped inside the application layer before crossing outward (D-10)"
    - "Dry-run classifyEncounter() validation at create time (discarding .value) rejects unclassifiable input with TRPCError BAD_REQUEST before persistence, so read-path re-derivation can assume success"
    - "Vitest test files that touch a live shared Postgres table must run with fileParallelism:false to avoid cross-file row leakage between afterAll cleanups"

key-files:
  created:
    - src/server/db/scenario-repository.ts
    - src/server/db/scenario-repository.test.ts
    - src/server/application/scenario-service.ts
    - src/server/application/scenario-service.test.ts
    - vitest.setup.ts
  modified:
    - vitest.config.ts

key-decisions:
  - "Open Question 1 (RESEARCH.md) resolved as recommended: createScenario dry-run validates via classifyEncounter(), discarding the verdict and throwing TRPCError({code:'BAD_REQUEST'}) on failure; getScenario/listGallery defensively check .ok anyway and throw INTERNAL_SERVER_ERROR in the theoretically-unreachable branch, never leaking DegenerateCaseReason across the tRPC boundary (D-10/T-3-05)"
  - "vesselAType/vesselBType cast as VesselType in rowToVessels() with an inline comment justifying safety (only write path is Zod-validated createScenario input) rather than a second runtime validation pass"
  - "No generic Repository<T> base class -- three plain module-level functions (create/findByShareId/findCurated), consistent with RESEARCH.md's Anti-Patterns and CLAUDE.md's 'justify every abstraction' persona"

patterns-established:
  - "Pattern: scenario-service.ts is the ONLY file in src/server/ that imports both a repository module and classifyEncounter() -- routers (Plan 03-03) must stay thin adapters calling into this service, never Prisma or classifyEncounter() directly"
  - "Pattern: TDD RED/GREEN commit pairs per file (test(03-02) commit immediately followed by feat(03-02) commit) for both scenario-repository.ts and scenario-service.ts"

requirements-completed: [SCEN-02]

# Metrics
duration: ~40min (environment setup + Task 1 ~20min + Task 2 ~20min)
completed: 2026-07-17
---

# Phase 3 Plan 02: Persistence & Application Layer Summary

**Thin Prisma `Scenario` repository (create/findByShareId/findCurated) plus the application-layer `scenario-service.ts` that is the sole place `classifyEncounter()` runs -- wiring SCEN-02's "always re-derive on read" guarantee end-to-end against the live Docker Postgres instance from Plan 01**

## Status: COMPLETE

## Performance

- **Duration:** ~40 min (environment bootstrap -- `.env`, `npm install`, `npx prisma generate` -- plus two TDD RED/GREEN task cycles)
- **Tasks:** 2 of 2 completed
- **Files modified:** 6 (4 created source/test pairs, 1 new test-infra file, 1 modified config)

## Accomplishments
- Bootstrapped the fresh worktree environment per the plan's environment note: copied `.env.example` to `.env`, ran `npm install` (182 packages), ran `npx prisma generate` (client generated to `generated/prisma/` in 18ms), confirmed `npx prisma migrate status` reports the schema up to date against the running Docker Postgres container from Plan 01
- Confirmed the pre-existing 100-test domain suite was green before making any changes
- **Task 1:** Implemented `src/server/db/scenario-repository.ts` -- `create`/`findByShareId`/`findCurated` as three plain module-level functions against `prisma.scenario`, mapping all ten flat vessel columns explicitly, `findByShareId` returning bare `null` for not-found (no `Result<T>` at this layer, D-10), `findCurated` ordered by `displayOrder` ascending. Zero class-based abstraction (verified via `grep -c "^class \|^export class "` returning 0).
- **Task 2:** Implemented `src/server/application/scenario-service.ts` -- `createScenario`/`getScenario`/`listGallery`/`rowToVessels`, resolving RESEARCH.md's Open Question 1 by dry-run validating `classifyEncounter()` at create time (rejecting with `TRPCError({code:'BAD_REQUEST'})` before any persistence) so the read path can assume every found row is classifiable, with a defensive (never-taken-in-normal-operation) `INTERNAL_SERVER_ERROR` fallback that never leaks the domain's `DegenerateCaseReason` across the tRPC boundary.
- Verified `getScenario` genuinely re-invokes `classifyEncounter()` on every call (not merely at create time) via a `vi.spyOn` call-count assertion across the `getScenario` invocation itself -- this is the test that actually proves SCEN-02's mechanism, not just its intent.
- Full suite: 111/111 tests passing (100 pre-existing domain tests + 11 new), `npx tsc --noEmit` clean, re-run three times with no flakiness.

## Task Commits

Each task was committed as a TDD RED/GREEN pair:

1. **Task 1: Scenario repository -- create/findByShareId/findCurated**
   - `6aa858b` (test) -- failing test for create/findByShareId/findCurated against the live Postgres instance
   - `4d4ae5d` (feat) -- implementation + Rule 3 fix: `vitest.setup.ts`/`setupFiles` wiring so Vitest loads `.env` (Vitest does not auto-load `.env` the way the `prisma` CLI's own `prisma.config.ts` does)
2. **Task 2: Scenario service -- re-derive-on-read use cases (SCEN-02)**
   - `0f06ea2` (test) -- failing test for createScenario/getScenario/listGallery/rowToVessels
   - `d4ce60c` (feat) -- implementation + Rule 3 fix: `fileParallelism: false` in `vitest.config.ts`

**Plan metadata:** SUMMARY.md commit (this file) -- pending, see below

_Note: both tasks followed the plan's mandated `tdd="true"` RED-then-GREEN cycle; no REFACTOR commit was needed for either._

## Files Created/Modified
- `src/server/db/scenario-repository.ts` -- `create`/`findByShareId`/`findCurated`, `ScenarioRow` type, three plain functions no class
- `src/server/db/scenario-repository.test.ts` -- 3 tests against the live Postgres instance, with `afterAll` cleanup of every row it creates
- `src/server/application/scenario-service.ts` -- `createScenario`/`getScenario`/`listGallery`/`rowToVessels`, the only file in the codebase importing both the repository and `classifyEncounter()`
- `src/server/application/scenario-service.test.ts` -- 8 tests: create+persist, coincident-position rejection (with a repository `create` spy asserting it's never called), TRPCError instance check, not-found null, re-derivation-proof via `classifyEncounter` spy, empty gallery, populated gallery, `rowToVessels` round-trip
- `vitest.setup.ts` -- new file, loads `dotenv/config` for the whole Vitest run
- `vitest.config.ts` -- added `setupFiles: ["./vitest.setup.ts"]` and `fileParallelism: false`

## Decisions Made
- Open Question 1 resolved per RESEARCH.md's own recommendation: create-time dry-run validation via `classifyEncounter()`, discarding the verdict, rejecting with `BAD_REQUEST` on failure -- keeps `getScenario`'s contract simple (a found row can always be classified)
- `vesselAType`/`vesselBType` cast to `VesselType` in `rowToVessels()` rather than re-validated at read time -- the only write path (`createScenario`) already passed Zod's `VesselTypeSchema` at the tRPC input boundary (deferred to Plan 03-03's router), so a second runtime check here would be redundant
- Chose `crossingResidualBasicCase` (a non-null giveWay/standOn fixture) rather than a head-on case for the create->get round-trip proof, since a head-on mutual-obligation case's null/null verdict is a weaker signal that re-derivation actually ran correctly end-to-end

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Vitest does not auto-load `.env`, unlike the `prisma` CLI**
- **Found during:** Task 1 (scenario-repository tests)
- **Issue:** Running `npm test -- scenario-repository` against the live Postgres instance failed with `SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string` -- `DATABASE_URL` was `undefined` inside the Vitest process because Vitest, unlike the `prisma` CLI (which loads `.env` via `prisma.config.ts`'s own `import "dotenv/config"`) and unlike Next.js's runtime, has no built-in `.env` loading.
- **Fix:** Added `vitest.setup.ts` (a single `import "dotenv/config"`) and referenced it via `test.setupFiles` in `vitest.config.ts`.
- **Files modified:** `vitest.setup.ts` (new), `vitest.config.ts`
- **Verification:** Re-ran `npm test -- scenario-repository`, all 3 tests passed
- **Committed in:** `4d4ae5d` (Task 1 commit)

**2. [Rule 3 - Blocking] Cross-file test isolation gap against the shared live Postgres table**
- **Found during:** Task 2 (scenario-service tests), full-suite run
- **Issue:** `npm test` (full suite) failed on `listGallery() returns [] when no curated rows exist` -- the assertion found a leftover `isCurated: true` row from `scenario-repository.test.ts`'s `findCurated()` test. Vitest runs test files in parallel by default; both files touch the same live Postgres `Scenario` table with no per-file isolation (a single shared Docker instance per D-01), so one file's rows could still exist when the other file's assertion ran, even though each file's own `afterAll` correctly cleans up its own rows.
- **Fix:** Set `fileParallelism: false` in `vitest.config.ts`, forcing sequential file execution so each file's create -> assert -> `afterAll` cleanup cycle fully completes before the next file starts.
- **Files modified:** `vitest.config.ts`
- **Verification:** Re-ran `npm test` three consecutive times; 111/111 passed each time with no flakiness
- **Committed in:** `d4ce60c` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 3 - blocking, both test-infrastructure fixes required to make the plan's own `<verify>` commands pass against a live database)
**Impact on plan:** Both fixes are mechanical test-infra corrections with zero effect on `scenario-repository.ts`/`scenario-service.ts`'s production code, schema, or SCEN-02's architecture. No scope creep.

## Issues Encountered
None beyond the two auto-fixed deviations above.

## User Setup Required
None. Docker Postgres (from Plan 01) was already running and healthy in this worktree; `.env` was created from `.env.example` per the plan's environment note; `npm install` and `npx prisma generate` completed cleanly.

## Next Phase Readiness
- `src/server/application/scenario-service.ts`'s `createScenario`/`getScenario`/`listGallery` exports are ready for Plan 03-03's tRPC routers to call into as thin adapters -- routers must delegate to these three functions and must never call `classifyEncounter()` or Prisma directly (RESEARCH.md success criterion #4).
- `rowToVessels` is exported and reusable if Plan 03-03 or Phase 4 ever needs the same row-to-domain mapping outside this service.
- `vitest.setup.ts`/`fileParallelism: false` now apply project-wide -- any future test file added under `src/server/` that touches the live Postgres instance inherits both fixes automatically, no further action needed.
- SCEN-02 is claimed complete in this summary's `requirements-completed` -- the "always re-derive on read" behavior is now implemented (this plan) AND about to be exposed via tRPC (Plan 03-03); Plan 03-01's summary deferred the claim to whichever plan actually landed the behavior, which is this one.

---
*Phase: 03-persistence-api-layer*
*Completed: 2026-07-17*

## Self-Check: PASSED

All claimed created files found on disk (src/server/db/scenario-repository.ts,
src/server/db/scenario-repository.test.ts, src/server/application/scenario-service.ts,
src/server/application/scenario-service.test.ts, vitest.setup.ts). vitest.config.ts modification
confirmed. All claimed commit hashes found in git log (6aa858b, 4d4ae5d, 0f06ea2, d4ce60c).
Full test suite re-verified green (111/111) and `npx tsc --noEmit` clean immediately before
writing this summary.
