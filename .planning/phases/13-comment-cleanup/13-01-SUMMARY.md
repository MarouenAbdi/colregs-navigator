---
phase: 13-comment-cleanup
plan: 01
subsystem: domain
tags: [comments, documentation, geometry, eslint, code-hygiene]

# Dependency graph
requires: []
provides:
  - Stale Phase/Plan/Threat-ID/bare-RESEARCH.md comment references removed from src/domain/geometry (angle-convert, bearing, bearing.fixtures, relative-bearing, relative-bearing.fixtures, screen-convert, screen-convert.fixtures, cpa) and src/domain/shared/result.ts
affects: [13-02, 13-03, 13-04, 13-05, 13-06, eslint-suppressions.json baseline for these 9 files]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Rotting-pointer comments (Phase N / Plan N / this phase / this plan / T-NN-NN / bare doc filenames like RESEARCH.md) rewritten to state the underlying reason directly instead of citing an archived plan artifact, per CLAUDE.md's comment convention"

key-files:
  created: []
  modified:
    - src/domain/geometry/angle-convert.ts
    - src/domain/geometry/bearing.ts
    - src/domain/geometry/bearing.fixtures.ts
    - src/domain/geometry/relative-bearing.ts
    - src/domain/geometry/relative-bearing.fixtures.ts
    - src/domain/geometry/screen-convert.ts
    - src/domain/geometry/screen-convert.fixtures.ts
    - src/domain/shared/result.ts
    - src/domain/geometry/cpa.ts

key-decisions:
  - "Decision-ID citations (D-04, D-06, D-07, D-08, D-13, D-16) are out of this plan's scope and were left verbatim -- only Phase/Plan/'this phase'/'this plan'/T-NN-NN/bare-RESEARCH.md-filename references were rewritten"
  - "cpa.ts was folded into this plan's scope (not part of the original 54-file ESLint-flagged baseline) because it had its own bare RESEARCH.md references missed by the original scoping sweep"

patterns-established: []

requirements-completed: [CMNT-01]

# Metrics
duration: 5min
completed: 2026-07-20
---

# Phase 13 Plan 01: Comment Cleanup (geometry + shared) Summary

**Rewrote 9 stale Phase/Plan/Threat-ID/bare-RESEARCH.md comment references across src/domain/geometry and src/domain/shared into durable, reason-based comments with zero behavior change.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-07-20T11:16:00+01:00
- **Completed:** 2026-07-20T11:17:41+01:00
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Removed every "Phase N", "this plan"/"this phase", `T-01-02`/`T-01-04`, and bare `RESEARCH.md`/`ROADMAP Phase` reference from the 9 target files while preserving each comment's substantive WHY content
- Kept all in-scope `D-NN` decision-ID citations (D-04, D-06, D-07, D-08, D-13, D-16) verbatim, per the plan's explicit scope boundary
- Verified zero behavior change: all affected test files pass with the same pass counts as before, and `git diff` confirms only comment lines changed

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite stale comments in angle-convert.ts, bearing.ts, bearing.fixtures.ts, relative-bearing.ts, relative-bearing.fixtures.ts** - `49c7223` (docs)
2. **Task 2: Rewrite stale comments in relative-bearing.fixtures.ts, screen-convert.ts, screen-convert.fixtures.ts, result.ts, cpa.ts** - `9cac850` (docs)

_Note: no TDD tasks in this plan; both commits are documentation-only (comment text) with no code/logic change._

## Files Created/Modified
- `src/domain/geometry/angle-convert.ts` - Removed "Phase 1 scope"/"this same phase"/"this plan's Task 3"/"Phase 4's" from opening JSDoc and inline D-08 comment
- `src/domain/geometry/bearing.ts` - Removed `T-01-02` parenthetical, replaced with direct restatement of D-07's reasoning
- `src/domain/geometry/bearing.fixtures.ts` - Removed `(T-01-02)` from two fixture comments (non-finite-input cases)
- `src/domain/geometry/relative-bearing.ts` - Removed `(T-01-04)` and `(T-01-02)` parentheticals from the heading-guard comment
- `src/domain/geometry/relative-bearing.fixtures.ts` - Removed "ROADMAP Phase 1 Success Criterion #2" and `(T-01-04)` from two fixture comments
- `src/domain/geometry/screen-convert.ts` - Removed "ROADMAP Phase 1 Success Criterion #3" and "Phase-4-owned" from opening JSDoc
- `src/domain/geometry/screen-convert.fixtures.ts` - Removed "this phase's fixtures" wording from opening JSDoc
- `src/domain/shared/result.ts` - Removed "Plans 02-03's" and "Phase 2+ consumers"/"this plan itself" references from two comment blocks
- `src/domain/geometry/cpa.ts` - Removed three bare `RESEARCH.md` references, replaced with direct statements of the negative-TCPA and epsilon-threshold design questions each comment resolves

## Decisions Made
None beyond the plan's own explicit scoping (Decision-ID citations out of scope; cpa.ts folded in per its own bare-doc-reference discovery, as directed by the plan text itself, not a new deviation).

## Deviations from Plan

None - plan executed exactly as written. The plan's own `<action>` text already noted `cpa.ts`'s inclusion and D-NN citations being out of scope; no additional discoveries required auto-fixing under Rules 1-4.

One minor note: the plan's Task 2 `<verify>` block listed `src/domain/geometry/screen-convert.fixtures.ts` as a test target, but that file is a fixtures module, not a test file (`screen-convert.test.ts` is the actual test file that imports it). Ran `screen-convert.test.ts` instead to exercise the fixtures — this is the test file that exists in the repo and covers the fixtures module; no code change, so this is a trivial verification-command correction, not a Rule 1-4 deviation.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
All 9 files in this plan's scope are clean of Phase/Plan/this-phase/this-plan/T-NN-NN/bare-RESEARCH.md references. `npx vitest run src/domain/geometry src/domain/shared` passes 45/45 tests, matching pre-change behavior. Ready for the orchestrator to merge alongside sibling plans 13-02..13-06.

## Self-Check: PASSED

- FOUND: src/domain/geometry/angle-convert.ts
- FOUND: src/domain/geometry/bearing.ts
- FOUND: src/domain/geometry/bearing.fixtures.ts
- FOUND: src/domain/geometry/relative-bearing.ts
- FOUND: src/domain/geometry/relative-bearing.fixtures.ts
- FOUND: src/domain/geometry/screen-convert.ts
- FOUND: src/domain/geometry/screen-convert.fixtures.ts
- FOUND: src/domain/shared/result.ts
- FOUND: src/domain/geometry/cpa.ts
- FOUND: 49c7223
- FOUND: 9cac850

---
*Phase: 13-comment-cleanup*
*Completed: 2026-07-20*
