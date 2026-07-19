---
phase: 08-sandbox
plan: 02
subsystem: ui
tags: [tailwind, svg, chart, colregs, sandbox]

# Dependency graph
requires:
  - phase: 08-sandbox
    plan: 01
    provides: "ROLE_HULL_FILL_CLASS/ROLE_BADGE_TEXT consolidated maps in vessel-role.ts, 7 new @theme tokens (chart-surface/rule-accent/mutual/etc.) in app/globals.css"
provides:
  - "ChartPanel.tsx fully re-themed against the dark palette (bg-chart-surface, stroke-rule-accent, stroke-mutual replacing raw hex literals)"
  - "ChartPanel.tsx's hull-fill/role-badge maps single-sourced from vessel-role.ts (local duplicate maps deleted)"
  - "1 NM scale-bar legend, proportionally accurate to container size and CHART_VIEW_BOX"
affects: [08-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Paint-only restyle discipline: SVG stroke/fill attribute -> Tailwind className swap performed with zero touch to hit-testing geometry constants or pointer handler wiring, verified by an unmodified passing test suite plus a manual git diff review"

key-files:
  created: []
  modified:
    - src/components/sandbox/ChartPanel.tsx

key-decisions:
  - "Left GRID_STROKE/CONE_DEFAULT_STROKE/BEARING_LINE_DEFAULT_STROKE/DOUBT_STROKE as raw hex const string literals per the plan's explicit instruction -- these are read directly by ChartPanel.test.tsx's getAttribute(\"stroke\") assertions, which Tailwind classes cannot satisfy the same way"

patterns-established: []

requirements-completed: [SBOX-01]

# Metrics
duration: ~12min
completed: 2026-07-18
---

# Phase 8 Plan 2: ChartPanel Re-theme Summary

**Re-themed ChartPanel.tsx's remaining raw hex literals to semantic Tailwind tokens, consolidated its hull-fill/role-badge maps into vessel-role.ts, and added a proportionally-accurate "1 NM" scale-bar legend -- with zero changes to hull/rotate-handle hit-testing geometry or pointer handler wiring.**

## Performance

- **Duration:** ~12 min
- **Completed:** 2026-07-18T21:28:17Z
- **Tasks:** 1 completed
- **Files modified:** 1

## Accomplishments

- Replaced the SVG's raw `bg-[#0B0B0E]` background with the new `bg-chart-surface` semantic token
- Converted the rotate-handle circle's hardcoded `stroke="#0D9488"` and the stalk line's hardcoded `stroke="#94A3B8"` to `stroke-rule-accent`/`stroke-mutual` Tailwind classes (same visual values, now sourced from `app/globals.css`'s 08-01 tokens)
- Deleted `ChartPanel.tsx`'s local `HULL_FILL_CLASS`/`ROLE_BADGE_TEXT` const maps; imported `ROLE_HULL_FILL_CLASS`/`ROLE_BADGE_TEXT` from `vessel-role.ts` instead, consolidating role-styling to a single source
- Added a "1 NM" scale-bar legend (bottom-left, plain HTML sibling of the `<svg>`) whose tick width is computed from `containerSize.width / CHART_VIEW_BOX.width` -- stays accurate across container/screen sizes rather than being a hardcoded decorative width
- Left `GRID_STROKE`/`CONE_DEFAULT_STROKE` untouched (already correctly re-themed in a prior pass) and `BEARING_LINE_DEFAULT_STROKE`/`DOUBT_STROKE` untouched as raw hex consts (still needed as JSX attribute values asserted directly by existing tests)
- Zero changes to `HULL_POINTS`, `HULL_BOW_Y`, `HULL_STERN_Y`, `HULL_HALF_WIDTH`, `ROTATE_HANDLE_CY`, `ROTATE_HANDLE_VISIBLE_R`, or any `onPointerDown`/`onPointerMove`/`onPointerUp` handler wiring -- confirmed via `git diff` review showing only the intended paint-value/import/legend lines changed
- `ChartPanel.test.tsx` passes unmodified (3/3 tests), proving the restyle preserved every externally-observable behavior the existing suite checks

## Task Commits

Each task was committed atomically:

1. **Task 1: Re-theme remaining hex literals and consolidate hull/badge maps into vessel-role.ts** - `6338eab` (feat)

## Files Created/Modified

- `src/components/sandbox/ChartPanel.tsx` - SVG background, rotate-handle stroke, and stalk stroke re-themed to semantic Tailwind tokens; local `HULL_FILL_CLASS`/`ROLE_BADGE_TEXT` maps deleted in favor of `vessel-role.ts` imports; "1 NM" scale-bar legend added

## Decisions Made

- Followed the plan's explicit instruction to leave `BEARING_LINE_DEFAULT_STROKE`/`DOUBT_STROKE` as raw hex string consts (not converted to Tailwind classes) because `ChartPanel.test.tsx` asserts their exact hex values via `getAttribute("stroke")`, and Tailwind's `stroke-*` utility classes cannot be asserted the same way -- converting them would require rewriting passing tests for zero visual benefit (values already match the registered `--doubt`/`--geometry` tokens; this is a deliberate two-representation choice per the plan, not a gap)

## Deviations from Plan

None - plan executed exactly as written. All acceptance-criteria greps (hex-literal count, local-const-declaration count, import-line contents, `bg-chart-surface`/`stroke-rule-accent`/`stroke-mutual`/`"1 NM"` occurrence counts) returned the exact values the plan specified on the first attempt.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `ChartPanel.tsx` is fully re-themed and ready for the phase's mandatory manual browser drag+rotate UAT pass (08-06) -- jsdom cannot detect a hit-testing regression, so that pass remains the final backstop per the threat model's disposition for T-08-03.
- No blockers for the remaining Wave 2/3/4 plans (08-03 through 08-06); this plan touched only `ChartPanel.tsx`, no other files.

## Self-Check: PASSED

`src/components/sandbox/ChartPanel.tsx` confirmed present on disk with expected content; commit `6338eab` confirmed present in `git log --oneline`.

---
*Phase: 08-sandbox*
*Completed: 2026-07-18*
