---
phase: 04-interactive-chart-sandbox
plan: 03
subsystem: ui
tags: [react, svg, pointer-events, tailwind, colregs, drag-interaction]

# Dependency graph
requires:
  - phase: 04-01
    provides: "ChartPanelProps contract (src/components/sandbox/types.ts), getVesselRole (src/components/sandbox/vessel-role.ts), Tailwind v4 + RTL/jsdom test harness"
  - phase: 04-02
    provides: "resolveDoubtGeometry (src/domain/colregs/resolve-doubt-geometry.ts)"
provides:
  - "ChartPanel component: SVG chart rendering both vessels (hull color/badge per D-02), grid, relative-bearing line, overtaking-boundary reference cones, doubt-overlay styling"
  - "useHullDrag hook: pointer-capture position-drag, forwards screenToChart-converted chart Position"
  - "useRotateHandleDrag hook: pointer-capture heading-drag, calls bearing() directly (no re-derived atan2)"
affects: ["04-06 (SandboxContainer mounts ChartPanel)"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Native Pointer Events (setPointerCapture/hasPointerCapture/releasePointerCapture) for SVG drag, no gesture library"
    - "Two independent drag targets (hull hit-rect, rotate-handle hit-circle) with stopPropagation on the rotate handle to avoid cross-firing"
    - "screenToChart()/chartToScreen() as the sole coordinate-transform boundary; no getScreenCTM()/getBBox()"
    - "data-testid attributes on SVG overlay elements (bearing line, cones, hit-targets) for unambiguous RTL queries when multiple same-tag elements exist (grid also uses <line>)"

key-files:
  created:
    - src/components/sandbox/ChartPanel.tsx
    - src/components/sandbox/ChartPanel.test.tsx
    - src/components/sandbox/hooks/useHullDrag.ts
    - src/components/sandbox/hooks/useHullDrag.test.ts
    - src/components/sandbox/hooks/useRotateHandleDrag.ts
    - src/components/sandbox/hooks/useRotateHandleDrag.test.ts
  modified: []

key-decisions:
  - "Added data-testid attributes to bearing line, cones, hull hit-rect, and rotate hit-circle for deterministic test queries (grid also renders <line> elements, making a bare querySelector('line') ambiguous)"
  - "Polyfilled ResizeObserver and Pointer Capture methods locally in each test file rather than globally in vitest.setup.ts, since jsdom 29 implements neither and this plan's file list does not include vitest.setup.ts"

patterns-established:
  - "Pattern: jsdom test files that render Pointer-Events/ResizeObserver-dependent components must polyfill both before render() -- documented inline in each test file's docblock for the next plan (04-04/04-05) to reuse"

requirements-completed: [VESL-02, DETM-03, RSON-03, CHRT-01, CHRT-02, CLAS-05]

# Metrics
duration: 65min
completed: 2026-07-17
---

# Phase 4 Plan 3: ChartPanel + Drag Hooks Summary

**SVG chart rendering both vessels (role-colored hulls + GW/SO/MUTUAL badges, relative-bearing line, overtaking-boundary cones) with native Pointer-Events hull-drag and rotate-handle-drag hooks wired directly onto the SVG hit-targets.**

## Performance

- **Duration:** ~65 min
- **Started:** 2026-07-17T20:04:00Z (approx, worktree setup)
- **Completed:** 2026-07-17T21:16:00Z
- **Tasks:** 3
- **Files modified:** 6 created (ChartPanel.tsx, ChartPanel.test.tsx, useHullDrag.ts, useHullDrag.test.ts, useRotateHandleDrag.ts, useRotateHandleDrag.test.ts)

## Accomplishments
- `ChartPanel` renders both vessels at their `chartToScreen`-projected positions, colored red/green/slate per `getVesselRole`, each with a GW/SO/MUTUAL text badge (colorblind-accessible secondary cue)
- Relative-bearing line and overtaking-boundary reference cones always render; the specific element `resolveDoubtGeometry`/`doubtBoundary` identifies swaps to dashed amber, the other vessel's cone stays untouched
- `useHullDrag`/`useRotateHandleDrag` give each vessel two independent Pointer-Events drag targets (hull hit-rect for position, rotate-handle hit-circle for heading) with no cross-firing (Pitfall 1, `stopPropagation()`)
- `useRotateHandleDrag` computes heading via the already-implemented `bearing()` function -- no re-derived `atan2` call anywhere in the UI layer
- Full component + hook test coverage (5 tests) using a real `classifyEncounter()` result as props, driving real `PointerEvent` sequences against the rendered DOM

## Task Commits

Each task was committed atomically:

1. **Task 1: ChartPanel static rendering -- viewBox, grid, vessel hulls, role badges** - `fb59014` (feat)
2. **Task 2: Bearing line + overtaking-boundary cones + drag hooks wired into ChartPanel** - `1ecef91` (feat)
3. **Task 3: ChartPanel + drag hook tests** - `cfd26c1` (test)

**Plan metadata:** (SUMMARY commit follows, see worktree-mode note below)

## Files Created/Modified
- `src/components/sandbox/ChartPanel.tsx` - SVG chart: viewBox, grid, vessel hulls+badges, bearing line, overtaking-boundary cones, drag wiring
- `src/components/sandbox/ChartPanel.test.tsx` - render + doubt-overlay tests
- `src/components/sandbox/hooks/useHullDrag.ts` - pointerdown/move/up + setPointerCapture position-drag hook
- `src/components/sandbox/hooks/useHullDrag.test.ts` - pointer-sequence test asserting screenToChart-converted position
- `src/components/sandbox/hooks/useRotateHandleDrag.ts` - pointerdown/move/up + setPointerCapture heading-drag hook, calls bearing() directly
- `src/components/sandbox/hooks/useRotateHandleDrag.test.ts` - pointer-sequence test + Pitfall 1 cross-firing regression test

## Decisions Made
- **Fixed chart viewBox `{ minX: -10, minY: -10, width: 20, height: 20 }`** as specified by the plan -- comfortably contains the default `crossingResidualBasicCase` scenario (5nm apart) with room to drag.
- **`data-testid` attributes added to SVG overlay elements** (`bearing-line`, `cone-vesselA`/`cone-vesselB`, `hull-hit-vesselA`/`hull-hit-vesselB`, `rotate-hit-vesselA`/`rotate-hit-vesselB`) rather than relying on tag-based `querySelector` -- the grid also renders many `<line>` elements (Task 1's own design), so a bare `container.querySelector("line")` (as the plan's Task 3 behavior text literally suggests) would non-deterministically match a grid line instead of the bearing line. This is a small, low-risk testability addition, not a behavior change.
- **ResizeObserver and Pointer Capture (`setPointerCapture`/`hasPointerCapture`/`releasePointerCapture`) polyfilled locally per test file**, not in the shared `vitest.setup.ts` -- confirmed via direct `jsdom` inspection that jsdom 29.1.1 implements neither API. Scoped the polyfill to the three new test files (not in this plan's `files_modified` list) rather than touching shared test config, keeping the change minimal and localized to what needed it.
- **`npm ci` run to restore `node_modules`** at the start of this plan -- the worktree checkout did not include installed dependencies; this is a lockfile-restore, not a new package install, so it is not subject to the package-legitimacy gate. Also ran `prisma generate` (gitignored `generated/` output, using the example `DATABASE_URL` from `.env.example`) solely to unblock `tsc --noEmit`, which otherwise failed on an unrelated pre-existing Phase 3 file (`src/server/db/client.ts`) with no generated Prisma client present.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Testability/Bug] Added `data-testid` attributes to disambiguate SVG element queries**
- **Found during:** Task 3 (writing ChartPanel.test.tsx)
- **Issue:** The plan's Task 1 renders the grid using multiple `<line>` elements (10+ per axis), and Task 3's own behavior spec says to query the bearing line via `container.querySelector("line")` -- with the grid's `<line>` elements present first in DOM order, this query would deterministically return a grid line, not the bearing line, causing an incorrect/flaky test.
- **Fix:** Added `data-testid="bearing-line"`, `data-testid="cone-vesselA"`/`"cone-vesselB"`, `data-testid="hull-hit-vesselA"`/`"hull-hit-vesselB"`, `data-testid="rotate-hit-vesselA"`/`"rotate-hit-vesselB"` to the relevant elements and queried by test id instead.
- **Files modified:** src/components/sandbox/ChartPanel.tsx
- **Verification:** `npx vitest run` (full suite) passes, 129/129 tests
- **Committed in:** cfd26c1 (Task 3 commit)

**2. [Rule 3 - Blocking] Polyfilled jsdom's missing ResizeObserver and Pointer Capture APIs in test files**
- **Found during:** Task 3 (writing all three test files)
- **Issue:** `ChartPanel` calls `new ResizeObserver(...)` (required to ever leave its empty-container early-return state) and the drag hooks call `element.setPointerCapture`/`hasPointerCapture`/`releasePointerCapture` -- direct inspection confirmed jsdom 29.1.1 implements none of these, so tests would fail immediately without a polyfill.
- **Fix:** Added a minimal `MockResizeObserver` class (fires the callback synchronously with a fixed 400x400 `contentRect` on `observe()`) and no-op `Element.prototype` shims for the three Pointer Capture methods, installed via `beforeEach`/`vi.stubGlobal` in each of the three test files. Production code (`ChartPanel.tsx`, the two hooks) is unchanged -- calls the real browser APIs directly, exactly as the plan and 04-RESEARCH.md's Pattern 1 specify, with no defensive feature-detection added to production code.
- **Files modified:** src/components/sandbox/ChartPanel.test.tsx, src/components/sandbox/hooks/useHullDrag.test.ts, src/components/sandbox/hooks/useRotateHandleDrag.test.ts
- **Verification:** `npx vitest run` (full suite) passes, 129/129 tests
- **Committed in:** cfd26c1 (Task 3 commit)

**3. [Rule 3 - Blocking] Restored node_modules and generated Prisma client to unblock verification**
- **Found during:** Task 1 (before first `npx tsc --noEmit`)
- **Issue:** The worktree checkout had no `node_modules` (fresh checkout, dependencies never installed in this worktree) and `npx tsc --noEmit` failed on `src/server/db/client.ts`'s missing generated Prisma client (`../../../generated/prisma/client.js`) -- an unrelated, pre-existing Phase 3 file, not touched by this plan.
- **Fix:** Ran `npm ci` (restores from the existing, committed `package-lock.json` -- not a new package install, so the package-legitimacy gate does not apply) and `prisma generate` with the example `DATABASE_URL` (`generated/` is gitignored, no repo files changed) solely to let `tsc --noEmit` complete cleanly.
- **Files modified:** none (node_modules/ and generated/ are both gitignored)
- **Verification:** `npx tsc --noEmit` exits 0 with no output
- **Committed in:** N/A (no repo files changed by this fix)

---

**Total deviations:** 3 auto-fixed (1 testability, 2 blocking)
**Impact on plan:** All three were necessary to make the plan's own verification commands (`tsc --noEmit`, `vitest run`) pass at all in this fresh worktree; none change ChartPanel/hook production behavior beyond the additive `data-testid` attributes. No scope creep.

## Issues Encountered
None beyond the deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `ChartPanel` is ready to be mounted by `SandboxContainer` (04-06) with the exact `ChartPanelProps` contract from 04-01 -- no prop shape changes.
- `useHullDrag`/`useRotateHandleDrag` are self-contained and only need `containerSize`/`viewBox`/vessel data passed in; no additional wiring required from 04-06 beyond rendering `<ChartPanel {...props} />`.
- The jsdom ResizeObserver/Pointer-Capture polyfill pattern established in this plan's test files should be reused as-is by any sibling plan (04-04/04-05) that renders `ChartPanel` or its own Pointer-Events components in tests.
- No blockers identified for downstream plans.

## Self-Check: PASSED

All 7 claimed files found on disk; all 4 commit hashes (fb59014, 1ecef91, cfd26c1, 15c4da4) found in git log.

---
*Phase: 04-interactive-chart-sandbox*
*Completed: 2026-07-17*
