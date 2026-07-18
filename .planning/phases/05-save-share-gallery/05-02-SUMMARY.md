---
phase: 05-save-share-gallery
plan: 02
subsystem: database
tags: [prisma, seed-script, tsx, vitest, colregs-domain, gallery]

requires:
  - phase: 03-persistence-api
    provides: "Scenario Prisma model, scenario-repository.ts (create/findByShareId/findCurated), scenario-service.ts (createScenario/getScenario/listGallery re-derive-on-read pattern)"
  - phase: 02-colregs-rules-engine
    provides: "classifyEncounter() and its fixture suite (classify-encounter.fixtures.ts) -- reused verbatim as curated seed vessel geometry"
provides:
  - "curatedScenarios data module (6 entries covering D-04's shape: head-on, give-way/stand-on crossing mirror pair, overtaking, 2 Rule 18 overrides)"
  - "prisma/seed.ts, runnable via `npx prisma db seed`, populating the Scenario table with isCurated/rationale/displayOrder"
  - "gallery.list() now returns real curated rows with fresh verdicts instead of []"
affects: [05-03, 05-04, gallery-ui, share-link-ui]

tech-stack:
  added: ["tsx@^4.23.1 (devDependency) -- TypeScript+ESM script runner for prisma/seed.ts"]
  patterns:
    - "Curated seed data imports vessel objects verbatim from domain fixtures, never re-typing literals"
    - "Seed script dry-run validates every entry via classifyEncounter() before persisting, discarding the verdict (never persists a verdict column)"
    - "Tests against the shared dev Postgres assert containment (find/some), never exact array equality, once a plan introduces persistent seed data"

key-files:
  created:
    - src/server/db/curated-scenarios.ts
    - src/server/db/curated-scenarios.test.ts
    - prisma/seed.ts
  modified:
    - prisma.config.ts
    - src/server/api/routers/scenario.test.ts
    - src/server/application/scenario-service.test.ts
    - package.json
    - package-lock.json

key-decisions:
  - "Added tsx as a devDependency to run prisma/seed.ts, because Node's native TypeScript type-stripping does not remap .js-extension import specifiers onto sibling .ts files -- a codebase-wide, every-Node-version characteristic (not the Node-version gap 05-RESEARCH.md's Assumption A1 anticipated), independently verified as a legitimate, high-trust package before installing (73M weekly downloads, MIT license, github.com/privatenumber/tsx, published since 2015) and confirmed with the coordinator before finishing the install."
  - "Entries 1 and 2 of curatedScenarios reuse the exact same crossingResidualBasicCase vessel objects with vesselA/vesselB slots swapped, rather than two different fixtures, to produce a genuine mirror-view give-way/stand-on pair (verified in the test suite via a deep-equal geometry check, not just differing give-way labels)."

requirements-completed: [SCEN-03]

duration: 23min
completed: 2026-07-18
---

# Phase 05 Plan 02: Curated Gallery Seed Data Summary

**Authored and seeded 6 curated COLREGS encounters (head-on, give-way/stand-on crossing mirror pair, overtaking, 2 Rule 18 overrides) into the Scenario table via a new `tsx`-run Prisma seed script, unblocking `gallery.list()` from its previous always-`[]` state.**

## Performance

- **Duration:** 23 min
- **Started:** 2026-07-18T00:52:28+01:00 (first commit)
- **Completed:** 2026-07-18T01:15:19+01:00 (last commit)
- **Tasks:** 3 planned tasks completed, plus 1 in-scope Rule 1 auto-fix
- **Files modified:** 8 (3 created, 5 modified)

## Accomplishments
- `curatedScenarios` (src/server/db/curated-scenarios.ts) exports 6 validated entries covering D-04's full shape, built entirely from existing, already-tested domain fixtures -- never re-typed vessel literals.
- `prisma/seed.ts` writes them directly via the Prisma singleton (bypassing the public `scenario.create` mutation per D-03), dry-run validating each entry through `classifyEncounter()` first.
- Ran `npx prisma db seed` against the shared dev Postgres: exits 0, inserts exactly 6 `isCurated: true` rows.
- Fixed the now-stale "empty gallery" assumption in both `scenario.test.ts` (router integration test) and `scenario-service.test.ts` (service unit test, an in-scope side effect of this plan's own seeding).

## Task Commits

Each task was committed atomically:

1. **Task 1a: RED -- failing coverage/validation test** - `653f87c` (test)
2. **Task 1b: GREEN -- author curated scenario data** - `f9e9524` (feat)
3. **Task 2: Prisma seed script + prisma.config.ts + tsx devDependency** - `44441d8` (feat)
4. **Task 3: fix stale empty-gallery router test** - `31a69af` (fix)
5. **Rule 1 auto-fix: fix stale empty-gallery service test** - `64ed421` (fix)

_TDD task (Task 1) has two commits (test -> feat), per the RED/GREEN protocol; no REFACTOR commit was needed._

## Files Created/Modified
- `src/server/db/curated-scenarios.ts` - Exports `curatedScenarios`, 6 entries (displayOrder 0-5) built from `classify-encounter.fixtures.ts` vessel objects
- `src/server/db/curated-scenarios.test.ts` - 5 behavior-block assertions: count range, classifiability, encounter-type + mirror-geometry coverage, genuine Rule 18 override, displayOrder/rationale integrity
- `prisma/seed.ts` - One-time seed script; dry-run `classifyEncounter()` guard per entry, writes via the shared `prisma` singleton
- `prisma.config.ts` - Registered `migrations.seed: "tsx prisma/seed.ts"`
- `src/server/api/routers/scenario.test.ts` - Replaced the stale empty-gallery assertion with a containment-based test that creates + promotes its own row
- `src/server/application/scenario-service.test.ts` - Replaced the stale empty-gallery assertion with a shape/invariant check (Rule 1 auto-fix, this plan's own seeding broke it)
- `package.json` / `package-lock.json` - Added `tsx` devDependency

## Decisions Made
- Reused `crossingResidualBasicCase`'s vessel objects with slots swapped for the give-way/stand-on mirror pair (entries 1 and 2), rather than authoring new geometry, per the plan's explicit instruction -- verified as a genuine mirror (deep-equal position/heading across the swap) in the test suite, not just a coincidentally-similar pair.
- Added `tsx` as a devDependency for running `prisma/seed.ts` (see Deviations below).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added `tsx` devDependency to run `prisma/seed.ts`**
- **Found during:** Task 2 (Prisma seed script)
- **Issue:** `npx prisma db seed` (configured as plain `node prisma/seed.ts`, per 05-RESEARCH.md's Assumption A1 that Node's native type-stripping needs no `tsx`/`ts-node`) failed with `ERR_MODULE_NOT_FOUND` on `client.js`. Root cause, confirmed via a live repro: this codebase's entire `src/` tree uses TypeScript's `NodeNext` convention of `.js`-extension imports pointing at `.ts` source files. Node's native type-stripping (v22.23.1) strips TypeScript syntax but does not remap `.js` specifiers onto sibling `.ts` files -- only literal-matching extensions resolve. This is a structural, every-Node-version characteristic of this codebase's import style, not the older-Node-version gap 05-RESEARCH.md anticipated.
- **Fix:** Evaluated and rejected two dependency-free alternatives first: (a) rewriting all relative imports project-wide to `.ts` extensions -- out of scope, risks breaking the Next.js/Vitest tooling that already depends on the `.js` convention; (b) a hand-written custom Node ESM loader hook to remap extensions -- more "clever"/higher long-term maintenance burden than a standard tool, against this project's stated simplicity-first persona. Added `tsx` (`https://npmjs.com/package/tsx`) as a devDependency instead -- independently verified its legitimacy before installing (73M weekly downloads, MIT license, official `github.com/privatenumber/tsx` repo, published since 2015) -- and changed `prisma.config.ts`'s `migrations.seed` from `"node prisma/seed.ts"` to `"tsx prisma/seed.ts"`. Confirmed with the coordinator before finalizing.
- **Files modified:** `package.json`, `package-lock.json`, `prisma.config.ts`
- **Verification:** `npx prisma db seed` exits 0, inserts exactly 6 `isCurated: true` rows (confirmed via direct `psql` query against the shared dev Postgres)
- **Committed in:** `44441d8` (Task 2 commit)

**2. [Rule 1 - Bug] Fixed a second stale empty-gallery test in `scenario-service.test.ts`**
- **Found during:** post-Task-3 full-suite run
- **Issue:** `prisma/seed.ts` (Task 2) populates the same shared dev database `scenario-service.test.ts` runs against, breaking its pre-existing `listGallery() returns [] when no curated rows exist` assertion -- a direct, in-scope side effect of this plan's own seeding, on a file not listed in the plan's `files_modified` but broken by the plan's own change.
- **Fix:** Replaced the exact-emptiness assertion with a shape/invariant check (`Array.isArray` + every returned row has `isCurated: true`), mirroring the same containment-tolerant pattern used in Task 3's fix.
- **Files modified:** `src/server/application/scenario-service.test.ts`
- **Verification:** `npm test -- src/server/application/scenario-service.test.ts` passes (8/8); full suite (`npm test`) passes 23/23 files, 151/151 tests
- **Committed in:** `64ed421`

---

**Total deviations:** 2 auto-fixed (1 blocking/Rule 3, 1 bug/Rule 1)
**Impact on plan:** Both auto-fixes were necessary for Task 2's own acceptance criteria and for the full test suite to stay green after seeding; no scope creep beyond what this plan's own seed script directly caused. The `tsx` addition is flagged prominently for human review since it's a new dependency, per this project's "AI-generated but human-reviewed" git workflow convention (CLAUDE.md).

## Issues Encountered
- Fresh worktree required generating the Prisma client (`npx prisma generate`, gitignored, not committed) and creating a local `.env` (gitignored, not committed, matching `.env.example`) before any Prisma-backed test/seed command would run -- neither existed yet in this worktree. Not a deviation from the plan itself, just first-run environment setup.
- The shared dev Postgres container was already running from a prior session (`docker compose up -d` reported a port conflict against an existing healthy container) -- reused the existing container rather than starting a duplicate.

## User Setup Required

None - no external service configuration required. (Local dev setup only: `.env` + `docker compose up -d` + `npx prisma generate`, all already documented in the existing README/setup guide from earlier phases.)

## Next Phase Readiness
- `gallery.list()` now returns 6 real curated rows with fresh, re-derived verdicts -- ready for the `/gallery` listing page (05-04) to render against.
- `prisma/seed.ts` can be re-run idempotently-by-convention only in the sense that re-running it will insert a SECOND set of 6 rows (no upsert/dedup logic) -- if a future phase needs idempotent reseeding, that would be a new task, not an oversight in this one (out of this plan's stated scope).
- The `tsx` devDependency addition should get an explicit look during code review, given it's a new package introduced mid-plan rather than pre-approved in 05-RESEARCH.md's Standard Stack.

---
*Phase: 05-save-share-gallery*
*Completed: 2026-07-18*
