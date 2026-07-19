---
phase: 09-gallery
plan: 01
subsystem: database
tags: [prisma, postgres, colregs, domain-fixtures, vitest]

# Dependency graph
requires:
  - phase: 08-sandbox
    provides: chip-scenarios.ts's verified notUnderCommandVessels/inDoubtVessels vessel geometry
provides:
  - 3 new domain fixtures (crossingSailingPriorityCase, crossingNotUnderCommandCase, headOnInDoubtCase) in classify-encounter.fixtures.ts
  - Corrected 6-entry curatedScenarios array matching the design's exact 6 cards, with title/ruleLabel fields
  - Scenario.title/Scenario.ruleLabel nullable schema columns, migrated and seeded locally
  - Idempotent prisma/seed.ts (deleteMany isCurated guard)
affects: [09-02, 09-03, gallery card rendering, gallery mini-chart]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Static per-entry ruleLabel field (not derived at render time) for curated gallery cards, since classifyingEntryIndex()'s dynamic Rule-N derivation cannot satisfy 3 of the 6 required rule badges (see Task 2 research-gap note)"

key-files:
  created:
    - prisma/migrations/20260719100808_add_curated_title_and_rule_label/migration.sql
  modified:
    - src/domain/colregs/classify-encounter.fixtures.ts
    - src/server/db/curated-scenarios.ts
    - src/server/db/curated-scenarios.test.ts
    - src/server/db/scenario-repository.ts
    - prisma/schema.prisma
    - prisma/seed.ts

key-decisions:
  - "ruleLabel is a static, per-entry field (added alongside title even though D-04 only named title) because classifyingEntryIndex()'s dynamic Rule-N derivation would render 'Rule 15' for both Rule-18-override cards and 'Rule 7' for both head-on cards, failing D-01's exact per-card rule requirement for 3 of 6 cards."
  - "curated-scenarios.test.ts Test 3/Test 4 rewritten to encounter-type/give-way coverage assertions instead of a mirror-pair assumption, since the mirror-pair entry was intentionally dropped (D-03)."

requirements-completed: [GAL-01]

# Metrics
duration: 12min
completed: 2026-07-19
---

# Phase 9 Plan 1: Curated Gallery Seed Data Correction Summary

**Rewrote the gallery's 6 curated Postgres rows (via 3 new domain fixtures, a corrected curatedScenarios array, and a Scenario.title/ruleLabel schema migration) so `gallery.list()` returns exactly the design's 6 labeled cards with no mirror-pair duplicate.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-19T09:57:00Z
- **Completed:** 2026-07-19T10:09:08Z
- **Tasks:** 3 completed
- **Files modified:** 6 (plus 1 migration file created)

## Accomplishments
- Added 3 new `ClassificationCase` domain fixtures (`crossingSailingPriorityCase`, `crossingNotUnderCommandCase`, `headOnInDoubtCase`), copied verbatim from Phase 8's already-verified `chip-scenarios.ts` geometry, respecting the server/UI dependency direction (D-02)
- Rewrote `curatedScenarios` to exactly 6 entries matching Main-Design.png's labels/rules/give-way vessels (D-01), dropping the old stand-on-mirror duplicate and unused Rule 18 fixtures (D-03)
- Added `title`/`ruleLabel` fields to `CuratedScenario` and migrated `Scenario.title`/`Scenario.ruleLabel` as nullable Postgres columns; reseeded the local dev DB idempotently (D-05)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add the 3 missing domain fixtures** - `911c15d` (feat)
2. **Task 2: Rewrite curated-scenarios.ts's data and test suite** - `e373fcb` (feat)
3. **Task 3: Migrate schema, update seed script, reseed local DB** - `ddcc9a1` (feat)

_Note: no TDD tasks in this plan; single commit per task._

## Files Created/Modified
- `src/domain/colregs/classify-encounter.fixtures.ts` - 3 new named `ClassificationCase` exports for the gallery's previously-missing encounter types
- `src/server/db/curated-scenarios.ts` - rewritten to exactly 6 entries with `title`/`ruleLabel`/`rationale`, sourced only from `classify-encounter.fixtures.ts`
- `src/server/db/curated-scenarios.test.ts` - Test 3/Test 4 rewritten for coverage-based assertions (no mirror-pair assumption); Test 5 extended for title/ruleLabel
- `src/server/db/scenario-repository.ts` - `ScenarioRow` interface gains `title: string | null`, `ruleLabel: string | null`
- `prisma/schema.prisma` - `Scenario.title`/`Scenario.ruleLabel` nullable columns added
- `prisma/seed.ts` - idempotent `deleteMany({isCurated:true})` guard added; `title`/`ruleLabel` populated on create
- `prisma/migrations/20260719100808_add_curated_title_and_rule_label/migration.sql` - new migration (created)

## Decisions Made
- **Static `ruleLabel` field over dynamic derivation:** 09-RESEARCH.md recommended deriving each card's Rule-N badge via `VerdictBanner.tsx`'s `bannerRuleBadge()` pattern, but verified directly against `classify-encounter.ts`'s dispatch logic this cannot satisfy D-01 for 3 of the 6 cards (head-on doubt is unconditional per Assumption A1; `classifyingEntryIndex()` always targets "Rule 15" for crossing-type encounters, one stage short of an actual Rule 18 override). `ruleLabel` is therefore a static, per-entry field like `title`.
- **Test 3/Test 4 rewrite:** since D-03 drops the mirror-pair entry, the old mirror-geometry assertion no longer applies. Test 3 now asserts encounter-type/give-way coverage (head-on/crossing/overtaking each >=1, giveWay==="vesselA" >=1, giveWay===null >=1). Test 4 keeps the type-mismatch-count bound but only counts a "genuine override" when `actual.giveWay !== baseline.giveWay`, since "Sailing has priority" is a type-mismatch entry whose geometric baseline already matches Rule 18's outcome (no override fires).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Prisma Client not generated / stale after schema change**
- **Found during:** Task 1 acceptance verification (`npx tsc --noEmit` failed: `Cannot find module '../../../generated/prisma/client.js'`) and again during Task 3 (seed failed: `Unknown argument 'title'`)
- **Issue:** `generated/prisma` did not exist yet in this fresh worktree (gitignored, not committed); after the Task 3 schema migration, the previously-generated client was stale and didn't know about the new columns
- **Fix:** Ran `npx prisma generate` twice — once before Task 1's tsc check to produce the initial client, once after the Task 3 migration to regenerate it with the new columns
- **Files modified:** none tracked (generated/prisma is gitignored, not committed)
- **Verification:** `npx tsc --noEmit` passes; seed script completes without error
- **Committed in:** N/A (generated output, not committed)

**2. [Rule 3 - Blocking] Worktree missing local `.env` (DATABASE_URL)**
- **Found during:** Task 1, when `npx prisma generate` failed with `Cannot resolve environment variable: DATABASE_URL`
- **Issue:** `.env` is gitignored and therefore not present in the freshly-created git worktree, but `prisma.config.ts` requires `DATABASE_URL` to resolve the local dev Postgres container
- **Fix:** Copied the same local dev `DATABASE_URL` value (`postgresql://colregs:colregs@localhost:5433/colregs_navigator?schema=public`, the existing `colregs-navigator-postgres-1` container) into a new `.env` file inside the worktree
- **Files modified:** `.env` (gitignored, not committed)
- **Verification:** `npx prisma migrate dev`, `npx prisma db seed`, and the direct verification query all succeeded against the local container
- **Committed in:** N/A (gitignored, not committed)

---

**Total deviations:** 2 auto-fixed (both Rule 3 - blocking, both toolchain/environment setup with zero tracked-file impact)
**Impact on plan:** Both fixes were necessary local-environment setup steps for a fresh worktree checkout; no scope creep, no change to any plan-specified file.

## Issues Encountered
- `npx prisma migrate dev` did not auto-trigger the configured seed hook in this run; ran `npx prisma db seed` explicitly as a follow-up (plan's Task 3 action already anticipated this: "whichever this repo's existing convention triggers").

## User Setup Required
None - no external service configuration required. Local dev Postgres container (`colregs-navigator-postgres-1`) was already running.

## Next Phase Readiness
- `gallery.list()` now reads exactly 6 correct curated rows with `title`/`ruleLabel` populated — ready for the card-rendering plan (09-02) and mini-chart plan to consume this data directly
- No blockers identified

---
*Phase: 09-gallery*
*Completed: 2026-07-19*

## Self-Check: PASSED

All created/modified files confirmed present on disk; all 4 task/metadata commit hashes (`911c15d`, `e373fcb`, `ddcc9a1`, `fbceed9`) confirmed in git log.
