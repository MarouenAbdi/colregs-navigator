---
phase: 12-chartpanel-sandboxcontainer-decomposition-refactor
plan: 01
subsystem: ui
tags: [react, typescript, svg, refactor, vitest]

# Dependency graph
requires:
  - phase: 08-sandbox
    provides: ChartPanel.tsx (original monolithic 560-line component), instrument-readouts.ts, vessel-role.ts, resolve-doubt-geometry.ts
provides:
  - chart-panel-geometry.ts (pure layout constants + wedgePath() + buildGridLineSegments())
  - chart-panel-derivation.ts (deriveChartOverlayState() per-render derivation, with D-01 rangeNm dedup applied)
  - A thinner ChartPanel.tsx that imports and calls both instead of defining this logic inline
affects: [12-02, 12-03, 12-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Split computation from presentation (CLAUDE.md convention): ChartPanel's pure geometry and per-render derivation moved into two zero-React modules, third application of this pattern after hero-preview-geometry.ts and static-chart-geometry.ts"
    - "buildGridLineSegments() returns plain data (Array<{key,x1,y1,x2,y2}>), not JSX -- the JSX-layer .map() lives in the component, matching wedgePath()'s existing plain-data convention"

key-files:
  created:
    - src/components/sandbox/chart-panel-geometry.ts
    - src/components/sandbox/chart-panel-geometry.test.ts
    - src/components/sandbox/chart-panel-derivation.ts
    - src/components/sandbox/chart-panel-derivation.test.ts
  modified:
    - src/components/sandbox/ChartPanel.tsx

key-decisions:
  - "D-01 dedup applied as planned: deriveChartOverlayState()'s rangeNm now comes from deriveInstrumentReadouts(vesselA, vesselB).rangeNm instead of an independent Math.hypot() call"
  - "buildGridLines() renamed to buildGridLineSegments() and made viewBox-parameterized (no longer implicitly reading module-level CHART_VIEW_BOX), per the locked interface signature"

patterns-established: []

requirements-completed: [RFCT-01, RFCT-02, RFCT-08]

# Metrics
duration: 12min
completed: 2026-07-20
---

# Phase 12 Plan 01: ChartPanel Geometry + Derivation Extraction Summary

**Extracted ChartPanel.tsx's ~35 layout constants, wedgePath(), and buildGridLines() into chart-panel-geometry.ts, and its per-render screen/role/bearing/cone/doubt derivation into a new deriveChartOverlayState() in chart-panel-derivation.ts, applying the D-01 rangeNm dedup along the way.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-07-20T09:20:08+01:00
- **Completed:** 2026-07-20T09:31:28+01:00
- **Tasks:** 3
- **Files modified:** 5 (3 created new modules + 2 new test files, 1 modified)

## Accomplishments
- `chart-panel-geometry.ts` now holds every pure geometry constant, `wedgePath()`, and the renamed/viewBox-parameterized `buildGridLineSegments()` -- zero React import, verified by grep
- `chart-panel-derivation.ts` now holds `deriveChartOverlayState()`, consolidating the per-render derivation block that used to live inline in ChartPanel.tsx's component body, and wires the D-01 `rangeNm` dedup through `deriveInstrumentReadouts()`
- `ChartPanel.tsx` shrank from 560 lines (per PROJECT.md's own outlier callout) to importing and calling both new modules -- all 4 pre-existing `ChartPanel.test.tsx` tests pass unmodified

## Task Commits

Each task was committed atomically:

1. **Task 1: Create chart-panel-geometry.ts + chart-panel-geometry.test.ts** - `1f271a7` (feat)
2. **Task 2: Create chart-panel-derivation.ts + chart-panel-derivation.test.ts (D-01 dedup)** - `f291354` (feat)
3. **Task 3: Wire chart-panel-geometry.ts + chart-panel-derivation.ts into ChartPanel.tsx** - `ffc513a` (refactor)

_Note: this plan had no TDD tasks; each task is a single commit._

## Files Created/Modified
- `src/components/sandbox/chart-panel-geometry.ts` - Pure layout constants, `wedgePath()`, `buildGridLineSegments()`
- `src/components/sandbox/chart-panel-geometry.test.ts` - Numeric-fixture unit tests for both functions
- `src/components/sandbox/chart-panel-derivation.ts` - `deriveChartOverlayState()` + `ChartOverlayState` interface
- `src/components/sandbox/chart-panel-derivation.test.ts` - Fixture-based tests reusing `crossingResidualBasicCase`/`headOnBoundaryInclusiveCase`/`doubtBandNearOvertakingBoundaryCase`
- `src/components/sandbox/ChartPanel.tsx` - Now imports both new modules; grid rendering is a thin `.map()` over `buildGridLineSegments()`'s plain-data segments; derivation is a single `deriveChartOverlayState()` call

## Decisions Made
- Followed the plan's locked interfaces exactly: `wedgePath()`'s signature unchanged (move only), `buildGridLines()` renamed to `buildGridLineSegments()` with an explicit `viewBox` parameter and a plain-data return type.
- No new decisions beyond what the plan specified.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Reworded a code comment that accidentally matched the plan's own acceptance-criteria grep**
- **Found during:** Task 2 (chart-panel-derivation.ts)
- **Issue:** A first-draft comment above the D-01 dedup line literally contained the string `Math.hypot()` (to explain what was being replaced), which would have made `grep -n "Math.hypot" chart-panel-derivation.ts` incorrectly match -- the plan's acceptance criteria requires zero matches in this file.
- **Fix:** Reworded the comment to describe the replaced computation ("a second independently-computed Euclidean distance") without using the literal string `Math.hypot`.
- **Files modified:** `src/components/sandbox/chart-panel-derivation.ts`
- **Verification:** `grep -n "Math.hypot" src/components/sandbox/chart-panel-derivation.ts` now returns no matches; `chart-panel-derivation.test.ts` still passes.
- **Committed in:** `f291354` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug/acceptance-criteria fix)
**Impact on plan:** Cosmetic-only; no behavior change. No scope creep.

## Issues Encountered

- **Pre-existing, unrelated environment gap (not fixed, logged to `deferred-items.md`):** `npx tsc --noEmit` fails on `src/server/db/client.ts` (missing generated Prisma client, because this worktree has no `DATABASE_URL` configured) and 4 test files in `npx vitest run` (full suite) fail with a Postgres SASL auth error for the same reason. Neither touches any file this plan modifies (`src/components/sandbox/*`); confirmed no sandbox/chart file imports the generated Prisma client. `ChartPanel.test.tsx` (the plan's actual regression gate) passes 4/4, and every non-DB test file in the suite passes. Logged to `.planning/phases/12-chartpanel-sandboxcontainer-decomposition-refactor/deferred-items.md` per the scope-boundary rule (pre-existing failures in unrelated files/environment are out of scope for this plan).

## User Setup Required

None - no external service configuration required by this plan.

## Next Phase Readiness

- `ChartPanel.tsx` is now thinner and ready for Plans 02-04's further extractions (per ARCHITECTURE.md's risk-ordered extraction table) -- `VesselGroup`, the `containerRef`/`containerSize` state, and the drag hooks are untouched, as scoped.
- The DB/environment gap noted above (no `DATABASE_URL` in this worktree) is pre-existing and unrelated to this plan; it should be resolved at the environment level before relying on the full `npx vitest run`/`npx tsc --noEmit` suite as a complete gate in future plans, but does not block this phase's sandbox-focused work.

---
*Phase: 12-chartpanel-sandboxcontainer-decomposition-refactor*
*Completed: 2026-07-20*

## Self-Check: PASSED

All created/modified files confirmed present on disk; all 4 task/summary
commit hashes (`1f271a7`, `f291354`, `ffc513a`, `956ebd5`) confirmed present
in `git log --oneline --all`.
