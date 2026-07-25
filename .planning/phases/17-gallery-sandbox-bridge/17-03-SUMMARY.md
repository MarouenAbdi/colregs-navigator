---
phase: 17-gallery-sandbox-bridge
plan: 03
subsystem: domain
tags: [typescript, result-type, vitest, eslint, geometry]

# Dependency graph
requires:
  - phase: 16-sandbox-mutation-generalization
    provides: "useSandboxState.ts's applyVesselUpdate() Result<T> narrowing idiom and the CR-01 code-review finding this plan closes"
provides:
  - "useSandboxState.ts's lazy initializer with a real .ok-checked two-level fallback chain (no unchecked cast)"
  - "bearing()'s coincident-position guard widened from exact equality to a documented 1e-6 distance threshold"
  - "nearCoincidentPositionCase fixture + test proving the widened guard"
affects: [sandbox, gallery-sandbox-bridge]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "expectOk()/expectErr() non-conditional Result<T> narrowing test helpers (avoids eslint vitest/no-conditional-expect)"

key-files:
  created: []
  modified:
    - src/components/sandbox/hooks/useSandboxState.ts
    - src/domain/geometry/bearing/bearing.ts
    - src/domain/geometry/bearing/bearing.fixtures.ts
    - src/domain/geometry/bearing/bearing.test.ts
    - eslint-suppressions.json

key-decisions:
  - "D-10: unsafe Result cast replaced with real .ok check + two-level fallback (seed classification -> crossingResidualBasicCase -> throw), matching the file's own applyVesselUpdate() narrowing idiom exactly"
  - "D-11: coincident-position guard widened from dx===0 && dy===0 exact equality to Math.hypot(dx, dy) < 1e-6, since real pointer drags almost never land on exact floating-point equality"
  - "Rule 3 deviation: rewrote bearing.test.ts's conditional-expect assertions using expectOk()/expectErr() helpers to unblock the pre-commit hook (pre-existing eslint vitest/no-conditional-expect baseline suppression became stale once the new test raised the file's count past its tracked baseline); pruned the stale suppression entry rather than re-adding a bigger one"

patterns-established:
  - "expectOk()/expectErr() throwing-assertion helpers for Result<T> test narrowing without an if-block wrapping expect() -- scoped to bearing.test.ts only; the same pre-existing pattern remains un-refactored (and suppressed) in the other 9 files sharing it"

requirements-completed: [GAL-05]

# Metrics
duration: 13min
completed: 2026-07-25
---

# Phase 17 Plan 03: Result-safety and coincident-position hardening Summary

**Replaced useSandboxState's unchecked Result cast with a real `.ok`-checked fallback chain, and widened bearing()'s exact-equality coincident-position guard to a documented 1e-6 distance threshold with new fixture/test coverage.**

## Performance

- **Duration:** 13 min
- **Started:** 2026-07-25T14:40:56+01:00
- **Completed:** 2026-07-25T14:53:21+01:00
- **Tasks:** 2
- **Files modified:** 5 (4 planned + 1 eslint-suppressions.json baseline prune)

## Accomplishments
- `useSandboxState.ts`'s lazy initializer now performs a real `.ok` check on `classifyEncounter(seedA, seedB)` instead of an unchecked type cast, falling back to `crossingResidualBasicCase` and, as a last resort, throwing loudly instead of crashing the render with an opaque `TypeError` (D-10, closes CR-01 from Phase 16's code review).
- `bearing()`'s coincident-position guard now uses `Math.hypot(dx, dy) < 1e-6` instead of exact `dx === 0 && dy === 0` equality, so near-exact drag-to-overlap gestures reliably trigger the "Unable to classify" degenerate state (D-11).
- Added `nearCoincidentPositionCase` fixture (1e-7 unit separation, sub-threshold) and a matching test proving the widened guard catches it.

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix the unsafe Result cast in useSandboxState.ts's lazy initializer (D-10)** - `917f45b` (fix)
2. **Task 2: Widen bearing()'s coincident-position check from exact equality to a distance threshold (D-11)** - `4c88048` (fix)

_Note: Task 2's commit also includes a Rule 3 deviation fix to `bearing.test.ts` and `eslint-suppressions.json` (see Deviations below)._

## Files Created/Modified
- `src/components/sandbox/hooks/useSandboxState.ts` - Lazy initializer: `.ok`-checked two-level fallback chain replacing the unchecked cast
- `src/domain/geometry/bearing/bearing.ts` - `COINCIDENT_DISTANCE_THRESHOLD = 1e-6` constant + `Math.hypot`-based guard replacing exact equality
- `src/domain/geometry/bearing/bearing.fixtures.ts` - New `nearCoincidentPositionCase` fixture
- `src/domain/geometry/bearing/bearing.test.ts` - New near-coincident test; whole file refactored to `expectOk()`/`expectErr()` narrowing helpers (see deviation below)
- `eslint-suppressions.json` - Pruned the now-stale `bearing.test.ts` / `vitest/no-conditional-expect` baseline entry (count 10 -> removed) after the file's violations were eliminated

## Decisions Made
- D-10's fallback fixture: `crossingResidualBasicCase`, the file's own existing seed-of-last-resort (already imported), per CONTEXT.md's Claude's Discretion note — no new fixture needed.
- D-11's threshold value: `1e-6` chart-space units, per CONTEXT.md's Claude's Discretion note — far below any humanly-perceptible vessel separation on this chart's viewBox scale, so it only catches true coincident/near-coincident drags.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Refactored bearing.test.ts to eliminate conditional `expect()` calls**
- **Found during:** Task 2, at commit time
- **Issue:** `bearing.test.ts` already had a pre-existing baseline of 10 `eslint` `vitest/no-conditional-expect` violations (the codebase-wide `if (result.ok) { expect(...) }` idiom, tracked via `eslint-suppressions.json` since before Husky's pre-commit hook was installed in Phase 14 — the hook postdates these violations, so they were never caught at commit time until now). Adding the plan's required 11th instance (mirroring the same pattern per the plan's own action text) pushed the file's violation count past its tracked baseline, and the pre-commit hook lints the whole staged file — unconditionally blocking the commit.
- **Fix:** Rewrote the whole file to use two local non-conditional narrowing helpers (`expectOk<T>(result): T` and `expectErr<T>(result): DegenerateCaseReason`, each asserting `result.ok` unconditionally via `expect()` and narrowing via a `throw`, not a conditional `expect()`), replacing every `if (result.ok) { expect(...) }` / `if (!result.ok) { expect(...) }` block. Same assertions, same test coverage, no behavior change. Pruned the file's now-stale suppression entry from `eslint-suppressions.json` (`npx eslint ... --prune-suppressions`) since its violation count is now 0.
- **Files modified:** `src/domain/geometry/bearing/bearing.test.ts`, `eslint-suppressions.json`
- **Verification:** `npx eslint src/domain/geometry/bearing/bearing.test.ts` — 0 errors; `npx vitest run src/domain/geometry/bearing/bearing.test.ts` — 9/9 pass (unchanged count); `npm run typecheck` — 0 errors.
- **Committed in:** `4c88048` (part of Task 2 commit)
- **Scope note:** The other 9 files sharing this exact same pre-existing `vitest/no-conditional-expect` pattern (`src/components/hero/hero-preview-fixture.test.ts`, `src/components/sandbox/instruments/instrument-readouts.test.ts`, `src/domain/colregs/classify-encounter.test.ts`, `src/domain/colregs/doubt-geometry/resolve-doubt-geometry.test.ts`, `src/domain/colregs/risk-of-collision/risk-of-collision.test.ts`, `src/domain/geometry/cpa/cpa.test.ts`, `src/domain/geometry/relative-bearing/relative-bearing.test.ts`, `src/domain/shared/result.test.ts`) were left untouched — out of this plan's scope per the SCOPE BOUNDARY rule (unrelated files, not blocking this commit). A stale `src/components/sandbox/chip-scenarios.test.ts` suppression entry (file no longer exists in the repo) was also pruned as a side effect of running `--prune-suppressions`.

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to land Task 2's required test at all; no scope creep beyond the one file this plan already modifies. No behavior change to any test's assertions.

## Issues Encountered
- Local dev environment lacked a generated Prisma client and `DATABASE_URL`, causing `npm run typecheck` to fail on an unrelated `src/server/db/client.ts` import before any of this plan's changes were made. Resolved by running `npx prisma generate` with `DATABASE_URL` set from `.env.example`'s placeholder value (no real database needed for `prisma generate`/`tsc --noEmit`/`vitest run` — none of this plan's verification commands touch a live database). This was a one-time local environment fix, not a code change, and is not part of any commit.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Both folded todos (D-10, D-11 from CONTEXT.md) are closed; the two corresponding pending todo files (`.planning/todos/pending/2026-07-25-unsafe-result-cast-in-usesandboxstate-lazy-initializer.md`, `.planning/todos/pending/2026-07-25-drag-to-coincident-position-rarely-triggers-unable-to-classify.md`) can be moved to resolved/done by the orchestrator.
- This plan shares no files with 17-01/17-02 (the Gallery <-> Sandbox wiring plans in the same wave) and required no coordination.
- No blockers for the rest of Phase 17.

---
*Phase: 17-gallery-sandbox-bridge*
*Completed: 2026-07-25*

## Self-Check: PASSED

All created/modified files verified present on disk; all task commits (`917f45b`, `4c88048`) and the metadata commit (`7554b6b`) verified present in `git log --oneline --all`.
