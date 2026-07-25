---
phase: 18-on-chart-vessel-control-overlay
plan: 02
subsystem: ui
tags: [react, typescript, sandbox, tdd, presentational-components]

# Dependency graph
requires:
  - phase: 18-01
    provides: ChartHeaderStripProps/ChartFooterStripProps/VesselOverlayCardProps type contracts, deriveChartHeaderRisk(), ROLE_ACTION_TEXT, deriveOverlayAnchor()
provides:
  - ChartHeaderStrip.tsx -- merged rule-badge + title + 4-tier risk-pill header strip (SBOX-06)
  - ChartFooterStrip.tsx -- merged RANGE/BEARING/CPA/TCPA readouts + per-vessel role/action panel (SBOX-07)
  - VesselOverlayCard.tsx -- floating TYPE/SPEED/HEADING control card, pointer-events-safe (SBOX-08)
affects: [18-03-chart-panel-wiring, 18-04-retire-old-components]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Mine-not-import: logic copied verbatim from a soon-to-be-retired component (VerdictBanner/InstrumentReadouts/ControlPanel), never imported, so Plan 18-04's retirement of those files breaks nothing"
    - "pointer-events-none root + pointer-events-auto on individually re-enabled interactive descendants (Pitfall 1), proven via a DOM className assertion, not just visual review"
    - "Per-vessel subcomponent extraction (VesselActionCell) to avoid duplicated JSX for near-identical instances, mirroring VerdictBanner.tsx's RoleBadge precedent"

key-files:
  created:
    - src/components/sandbox/chart/ChartHeaderStrip.tsx
    - src/components/sandbox/chart/ChartHeaderStrip.test.tsx
    - src/components/sandbox/chart/ChartFooterStrip.tsx
    - src/components/sandbox/chart/ChartFooterStrip.test.tsx
    - src/components/sandbox/chart/VesselOverlayCard.tsx
    - src/components/sandbox/chart/VesselOverlayCard.test.tsx
  modified: []

key-decisions:
  - "Hand-authored a literal ClassificationResult fixture (mutualNonDoubtClassification) for ChartHeaderStrip's mutual-accent test -- every mutual (giveWay/standOn null) fixture in classify-encounter.fixtures.ts also happens to land in a doubt band, so no real domain fixture isolates the mutual-accent branch from the doubt-accent branch. Mirrors ControlPanel.test.tsx's own precedent for hand-typed ClassificationResult literals."
  - "ChartFooterStrip's per-vessel divider (border-t mobile / border-l at min-[900px]:) applies only to the second VesselActionCell instance (vessel B), matching the design snapshot's actual markup where only the second action cell carries border-left -- not both."

patterns-established:
  - "New presentational components under src/components/sandbox/chart/ that replace a retiring component cite 'mined, not imported' in their own top-of-file doc comment, matching Plan 18-01's precedent of citing the specific decision/pitfall they implement."

requirements-completed: [SBOX-06, SBOX-07, SBOX-08]

# Metrics
duration: 45min
completed: 2026-07-25
---

# Phase 18 Plan 02: Header/Footer Strip + Vessel Overlay Components Summary

**Three self-contained, unit-tested presentational components (ChartHeaderStrip, ChartFooterStrip, VesselOverlayCard) that mine the logic of VerdictBanner/InstrumentReadouts/ControlPanel verbatim rather than importing them, applying D-02's 4-tier risk pill, D-03's action copy, and Pitfall 1's pointer-events-none-by-default overlay mitigation -- none wired into ChartPanel/SandboxContainer yet.**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-07-25T18:03:00Z
- **Completed:** 2026-07-25T18:08:45Z
- **Tasks:** 3 completed (all TDD: RED then GREEN)
- **Files modified:** 6 (all created, 0 modified)

## Accomplishments

- `ChartHeaderStrip.tsx`: merged rule-badge + title + 4-tier risk pill. Copies `VerdictBanner.tsx`'s `bannerRuleBadge`/`ENCOUNTER_TYPE_TITLE`/`DEGENERATE_TITLE`/`bannerAccentClassName` logic verbatim; risk pill derives from `deriveChartHeaderRisk()` against `deriveInstrumentReadouts()`'s CPA/TCPA, with the degenerate case reusing the amber `watch` tone + "Unable to classify" framing per D-02. 4/4 tests passing (non-degenerate crossing, doubt-always-wins Rule 7, degenerate suppression, mutual accent token).
- `ChartFooterStrip.tsx`: merged RANGE/BEARING/CPA/TCPA readout tiles + LIVE indicator + per-vessel role/action panel. Copies `InstrumentReadouts.tsx`'s `Tile`/`formatBearing`/`formatCpa`/`formatTcpa`/`PLACEHOLDER` verbatim; extracts a `VesselActionCell` subcomponent (no duplicated per-vessel JSX) gating action text on `isDegenerate` (not tile-value nullness) per D-03; LIVE dot uses Tailwind's built-in `animate-pulse`, no new `@keyframes`. 3/3 tests passing (real classification, coincident-but-not-degenerate, isDegenerate-gated placeholder).
- `VesselOverlayCard.tsx`: floating TYPE(editable)/SPEED(editable)/HEADING(read-only) control card. Copies `ControlPanel.tsx`'s `VESSEL_TYPE_LABELS`/`formatHeading()`/Select-Slider wiring verbatim; root chrome carries `pointer-events-none`, with close button/Select trigger/Slider each individually re-enabling `pointer-events-auto` (Pitfall 1), verified via a direct DOM className assertion rather than visual review alone. 6/6 tests passing (render, 5 type options, type-change wiring, speed-change wiring, close wiring, pointer-events split).

## Task Commits

Each task was committed atomically (RED then GREEN):

1. **Task 1: ChartHeaderStrip.tsx** - RED `eef7a2c` (test), GREEN `6ab3385` (feat)
2. **Task 2: ChartFooterStrip.tsx** - RED `cbc87e2` (test), GREEN `2b6c2ea` (feat)
3. **Task 3: VesselOverlayCard.tsx** - RED `d8173b7` (test), GREEN `f3df95c` (feat)

**Plan metadata:** committed alongside this SUMMARY.md.

## Files Created/Modified

- `src/components/sandbox/chart/ChartHeaderStrip.tsx` - merged rule-badge/title/risk-pill header strip (SBOX-06)
- `src/components/sandbox/chart/ChartHeaderStrip.test.tsx` - 4 tests
- `src/components/sandbox/chart/ChartFooterStrip.tsx` - merged readout tiles + per-vessel role/action panel (SBOX-07)
- `src/components/sandbox/chart/ChartFooterStrip.test.tsx` - 3 tests
- `src/components/sandbox/chart/VesselOverlayCard.tsx` - floating TYPE/SPEED/HEADING control card (SBOX-08)
- `src/components/sandbox/chart/VesselOverlayCard.test.tsx` - 6 tests

## Decisions Made

- Used `crossingResidualBasicCase`/`doubtBandNearOvertakingBoundaryCase` real domain fixtures (via `classifyEncounter()`) for the majority of test cases, following `VerdictBanner.test.tsx`/`InstrumentReadouts.test.tsx`'s established "verify UI fixtures against the real domain function" convention.
- Hand-authored one literal `ClassificationResult` (`mutualNonDoubtClassification`) specifically to isolate `ChartHeaderStrip`'s mutual-accent branch, since no real fixture in `classify-encounter.fixtures.ts` pairs a non-doubt encounter with `giveWay`/`standOn` both null — every mutual fixture there also lands in a doubt band. This mirrors `ControlPanel.test.tsx`'s own precedent for hand-typed `ClassificationResult` literals.
- `ChartFooterStrip`'s vessel-to-vessel divider (per the plan's `<action>` instruction) applies only to the second `VesselActionCell` (vessel B), matching the design snapshot's `ftracts` markup where only the second child carries `border-left`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Generated missing Prisma client in worktree**
- **Found during:** Task 1 (`npm run typecheck` acceptance check)
- **Issue:** `npm run typecheck` failed with `Cannot find module '../../../generated/prisma/client.js'` — this worktree had never run `prisma generate` (same pre-existing per-worktree gap documented in Plan 18-01's own SUMMARY).
- **Fix:** Ran `DATABASE_URL=<placeholder from .env.example> npx prisma generate` (no live DB connection needed for client generation, only schema introspection).
- **Files modified:** None tracked (generated output is gitignored, confirmed via `git status` before/after).
- **Verification:** `npm run typecheck` then exited 0.
- **Committed in:** N/A (no tracked file changes — environment-only fix).

---

**Total deviations:** 1 auto-fixed (environment-only, no tracked file change, no scope creep).
**Impact on plan:** None — required for the plan's own `npm run typecheck` acceptance criteria to pass, per-worktree environment gap only.

## Issues Encountered

None beyond the Prisma-generate environment gap above. All 13 new tests pass; `npm run typecheck` exits 0; the cross-import grep (`VerdictBanner`/`InstrumentReadouts`/`ControlPanel`) across all 3 new files returns `0` for every file, confirming the "mine, not import" contract this plan required.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All 3 new components (`ChartHeaderStrip.tsx`, `ChartFooterStrip.tsx`, `VesselOverlayCard.tsx`) are independently unit-tested and ready for Plan 18-03's `ChartPanel.tsx`/`SandboxContainer.tsx` wiring. None is imported anywhere yet — confirmed via a grep sweep of `ChartPanel.tsx`/`SandboxContainer.tsx` finding zero references.
- `VerdictBanner.tsx`/`InstrumentReadouts.tsx`/`ControlPanel.tsx` remain untouched and fully functional (still the live, wired components) — Plan 18-04 retires them once Plan 18-03 completes the wiring swap.
- No blockers.

---
*Phase: 18-on-chart-vessel-control-overlay*
*Completed: 2026-07-25*
