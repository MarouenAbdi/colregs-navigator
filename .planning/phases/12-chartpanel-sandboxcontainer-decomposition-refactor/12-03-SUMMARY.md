---
phase: 12-chartpanel-sandboxcontainer-decomposition-refactor
plan: 03
subsystem: ui
tags: [react, svg, resize-observer, chart]

requires:
  - phase: 12-chartpanel-sandboxcontainer-decomposition-refactor
    provides: chart-panel-geometry.ts (constants + buildGridLineSegments), consumed by ChartBackdrop.tsx
provides:
  - useContainerSize() hook -- ResizeObserver-backed container size tracking, extracted from ChartPanel.tsx
  - ChartBackdrop.tsx -- presentational decorative chart chrome (fine-grid, gridlines, range rings, crosshair, N label)
  - ChartPanel.tsx further thinned (422 lines post-12-01/02 wiring -> 336 lines)
affects: [12-04]

tech-stack:
  added: []
  patterns:
    - "Presentational component with zero pointer handlers/internal state (ChartBackdrop.tsx), mirroring SectionGridBackground.tsx's props-in/JSX-out shape"
    - "Resize-observation isolated to its own hook (useContainerSize.ts), mirroring useHullDrag.ts's single-responsibility hook convention"

key-files:
  created:
    - src/components/sandbox/hooks/useContainerSize.ts
    - src/components/sandbox/ChartBackdrop.tsx
  modified:
    - src/components/sandbox/ChartPanel.tsx

key-decisions:
  - "useContainerSize()'s containerRef return type corrected to React.RefObject<HTMLDivElement | null> -- React 19's useRef<T>(null) overload returns RefObject<T | null>, not RefObject<T>; the plan's literal locked signature didn't compile under tsc --noEmit"

patterns-established:
  - "Decorative/observational chart sub-pieces continue splitting into zero-state presentational components + single-purpose hooks, following the same convention as 12-01's geometry/derivation split"

requirements-completed: [RFCT-03, RFCT-08]

duration: ~15min
completed: 2026-07-20
---

# Phase 12 Plan 03: ChartPanel resize hook + ChartBackdrop extraction Summary

**Extracted ChartPanel's ResizeObserver state into `useContainerSize()` and its decorative chart chrome into a zero-state `ChartBackdrop.tsx`, shrinking ChartPanel.tsx to 336 lines with no behavior change**

## Performance

- **Duration:** ~15 min
- **Tasks:** 3 completed
- **Files modified:** 3 (2 created, 1 modified)

## Accomplishments
- `useContainerSize()` hook now owns `containerRef`/`containerSize` state and the `ResizeObserver` effect, matching the locked `{ containerRef, containerSize }` return shape
- `ChartBackdrop.tsx` now owns the fine-grid pattern, background rect, gridlines, range rings, crosshair, and "N" label as pure presentational JSX -- confirmed zero pointer handlers and zero internal state
- `ChartPanel.tsx` wires both in, removing the inline `useState`/`useEffect`/`ResizeObserver` block and the inline `<defs>`...`<text>N</text>` JSX block

## Task Commits

1. **Task 1: Create hooks/useContainerSize.ts** - `7ae0b86` (feat)
2. **Task 2: Create ChartBackdrop.tsx** - `5c1ed83` (feat)
3. **Task 3: Wire useContainerSize() and ChartBackdrop into ChartPanel.tsx** - `ce874bc` (refactor)

## Files Created/Modified
- `src/components/sandbox/hooks/useContainerSize.ts` - Tracks container pixel size via `ResizeObserver`, returns `{ containerRef, containerSize }`
- `src/components/sandbox/ChartBackdrop.tsx` - Presentational decorative chart chrome (fine-grid, gridlines, range rings, crosshair, N label), props-in/JSX-out
- `src/components/sandbox/ChartPanel.tsx` - Now calls `useContainerSize()` and renders `<ChartBackdrop>` instead of owning this state/JSX inline; removed now-unused `chart-panel-geometry.js` imports (`FINE_GRID_CELL_PX`, `FINE_GRID_STROKE`, `RANGE_RING_STROKE`, `CROSSHAIR_STROKE`, `GRID_STROKE`, `buildGridLineSegments`) that only `ChartBackdrop.tsx` consumes now

## Decisions Made
- Corrected `useContainerSize()`'s `containerRef` return type to `React.RefObject<HTMLDivElement | null>` instead of the plan's literal `React.RefObject<HTMLDivElement>` -- React 19's `useRef<T>(null)` overload returns `RefObject<T | null>`, so the plan's exact locked signature failed `tsc --noEmit`. This is a type-only correction; behavior is unchanged.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Type Correctness] `useContainerSize()` return type signature**
- **Found during:** Task 3 (wiring into ChartPanel.tsx, running `tsc --noEmit`)
- **Issue:** The plan's locked interface specified `containerRef: React.RefObject<HTMLDivElement>`, but `useRef<HTMLDivElement>(null)` under React 19's type definitions returns `RefObject<HTMLDivElement | null>` -- the literal signature didn't typecheck.
- **Fix:** Changed the return type to `React.RefObject<HTMLDivElement | null>` in `useContainerSize.ts`.
- **Files modified:** `src/components/sandbox/hooks/useContainerSize.ts`
- **Verification:** `npx tsc --noEmit` exits 0
- **Committed in:** `ce874bc` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 type-correctness)
**Impact on plan:** Necessary for compilation; no scope creep, no behavior change.

## Issues Encountered
None beyond the type-signature correction above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `ChartPanel.tsx` is down to 336 lines with `VesselGroup` still inline (extracted next in Plan 12-04, which will bring it under the ~150-200 line RFCT-07 target)
- All 4 existing `ChartPanel.test.tsx` tests pass unmodified; `MockResizeObserver` polyfill still works against `useContainerSize()`'s `ResizeObserver` usage
- Full suite (215/215), `tsc --noEmit`, and `eslint` on touched files all pass

---
*Phase: 12-chartpanel-sandboxcontainer-decomposition-refactor*
*Completed: 2026-07-20*
