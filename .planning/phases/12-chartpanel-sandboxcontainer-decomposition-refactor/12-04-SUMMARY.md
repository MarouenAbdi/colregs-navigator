---
phase: 12-chartpanel-sandboxcontainer-decomposition-refactor
plan: 04
subsystem: ui
tags: [react, svg, pointer-events, drag-and-drop]

requires:
  - phase: 12-chartpanel-sandboxcontainer-decomposition-refactor
    provides: chart-panel-geometry.ts constants (hull/badge/rotate-handle offsets), vessel-role.ts (ROLE_HULL_FILL_CLASS/ROLE_BADGE_TEXT), ChartPanel.tsx thinned by 12-01/12-03
provides:
  - VesselGroup.tsx -- byte-for-byte extracted hull polygon, rotate-handle circle, letter/badge overlay, and hit-testing wiring
  - DOM-order regression test asserting the rotating group precedes the non-rotating pointerEvents=none badge group
  - ChartPanel.tsx (176 lines) and SandboxContainer.tsx (147 lines) both under the ~150-200 line convention -- closes RFCT-07
affects: []

tech-stack:
  added: []
  patterns:
    - "Highest-risk, most regression-prone extraction lands last and as its own separately-reviewable commit, gated by a mandatory human real-browser pass -- not just automated tests"

key-files:
  created:
    - src/components/sandbox/VesselGroup.tsx
  modified:
    - src/components/sandbox/ChartPanel.tsx
    - src/components/sandbox/ChartPanel.test.tsx

key-decisions:
  - "Task 1's acceptance-criteria grep expected exactly 1 pointerEvents=\"none\" match in VesselGroup.tsx but found 2 -- the second is inside a preserved comment referencing the range-tooltip group's matching pattern, byte-identical to the original ChartPanel.tsx source, not introduced by this move. No code change needed; the functional invariant (rotating group precedes non-rotating badge group) still holds and is now also asserted by an automated DOM-order test."

patterns-established:
  - "The most hit-testing-sensitive UI code in a decomposition (documented history of real regressions) gets extracted last, as an isolated commit, with a dedicated human-verify checkpoint rather than folded into a batch of automated-only extractions."

requirements-completed: [RFCT-05, RFCT-06, RFCT-07, RFCT-08]

duration: ~20min (2 automated tasks) + human verification checkpoint
completed: 2026-07-20
---

# Phase 12 Plan 04: VesselGroup extraction + human hit-testing verification Summary

**Extracted VesselGroup (hull/rotate-handle/badge overlay) as a byte-for-byte move into its own file, added an automated DOM-order regression assertion, and got human-confirmed real-browser drag/rotate verification with zero hit-testing regression -- closing Phase 12**

## Performance

- **Duration:** ~20 min automated work + human verification pass
- **Tasks:** 3 (2 automated, 1 human-verify checkpoint)
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments
- `VesselGroup.tsx` extracted as one atomic, byte-for-byte cut-paste from `ChartPanel.tsx` -- every comment documenting the Phase 4/Phase 8 hit-testing regression fixes preserved verbatim, sibling order (rotating group before non-rotating `pointerEvents="none"` badge group) unchanged, direct pointer-handler attachment to the visible painted hull polygon/rotate-handle circle unchanged
- New automated DOM-order regression test added to `ChartPanel.test.tsx`, asserting the rotating `<g transform="rotate(...)">` group precedes the non-rotating badge overlay group via `compareDocumentPosition`/`DOCUMENT_POSITION_PRECEDING` -- belt-and-suspenders alongside the pre-existing `pointerEvents=none` test, which passes unmodified
- Human confirmed in a real browser (both vessels, default heading-0 scenario -- the exact heading where the Phase 8 regression previously occurred) that hull drag-to-reposition and rotate-handle drag-to-rotate both work smoothly with no dead zones, and that clicking/dragging near the overlapping letter/badge chips still starts a hull drag rather than being swallowed by the decorative overlay
- `ChartPanel.tsx` (176 lines) and `SandboxContainer.tsx` (147 lines) both land under the project's ~150-200 line convention, closing RFCT-07 -- the phase's final structural gate

## Task Commits

1. **Task 1: Create VesselGroup.tsx (byte-for-byte move)** - `09b87da` (feat)
2. **Task 2: Wire VesselGroup into ChartPanel.tsx, add DOM-order regression test** - `9341482` (refactor)
3. **Task 3: Real-browser drag/rotate verification (RFCT-06)** - human-verify checkpoint, approved (no code change)

## Files Created/Modified
- `src/components/sandbox/VesselGroup.tsx` - Hull polygon, rotate-handle circle, letter/role-badge overlay, and all hit-testing pointer-handler wiring; exports `VesselGroupProps`/`VesselGroup`
- `src/components/sandbox/ChartPanel.tsx` - Imports and renders `VesselGroup` instead of defining it inline; dropped now-dead `vessel-role.js`/`chart-panel-geometry.js` imports only `VesselGroup.tsx` still consumes
- `src/components/sandbox/ChartPanel.test.tsx` - New DOM-order regression test appended after the existing `pointerEvents=none` test (unmodified)

## Decisions Made
- Task 1's acceptance criterion `grep -c 'pointerEvents="none"'` expected exactly 1 match; `VesselGroup.tsx` has 2 because a preserved comment (referencing the range-tooltip group's matching pattern) also contains the literal string `pointerEvents="none"`. This is pre-existing text moved byte-for-byte from `ChartPanel.tsx`, not a functional deviation -- the actual JSX attribute still appears exactly once, on the correct (second/last) sibling group, which the new DOM-order test now asserts directly.

## Deviations from Plan

None - plan executed exactly as written, aside from the grep-count false positive noted above (comment text, not code).

## Issues Encountered

The prior executor agent hit a session-limit API error partway through this plan (after Tasks 1-2 committed, right at the Task 3 checkpoint handoff). No rework was needed -- Tasks 1-2's commits and passing test suite were verified intact, the dev server report was already in hand, and the human-verify checkpoint was completed by relaying the exact verification steps to the user directly.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 12 is now complete: all four extraction plans (chart-panel-geometry.ts/chart-panel-derivation.ts, useSandboxState.ts, useContainerSize.ts/ChartBackdrop.tsx, VesselGroup.tsx) have landed on `gsd/phase-12-chartpanel-sandboxcontainer-decomposition-refactor`
- Full suite (216/216), `tsc --noEmit`, and `eslint` all pass at the phase's final commit
- No known follow-up work for this refactor; future phases can treat ChartPanel.tsx/SandboxContainer.tsx as stable, thinned composition roots

---
*Phase: 12-chartpanel-sandboxcontainer-decomposition-refactor*
*Completed: 2026-07-20*
