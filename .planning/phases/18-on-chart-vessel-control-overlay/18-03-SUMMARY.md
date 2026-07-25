---
phase: 18-on-chart-vessel-control-overlay
plan: 03
subsystem: ui
tags: [react, typescript, sandbox, pointer-events, tdd]

# Dependency graph
requires:
  - phase: 18-01
    provides: ChartHeaderStripProps/ChartFooterStripProps/VesselOverlayCardProps contracts, deriveOverlayAnchor()
  - phase: 18-02
    provides: ChartHeaderStrip.tsx, ChartFooterStrip.tsx, VesselOverlayCard.tsx (self-contained, unit-tested)
provides:
  - ChartPanel.tsx composes ChartHeaderStrip/ChartFooterStrip/VesselOverlayCard around the chart surface with a working selectedVessel state machine
  - useHullDrag.ts/useRotateHandleDrag.ts fire onSelect(vessel) in the same breath as setPointerCapture (D-04), guarded by stopPropagation against the svg's new empty-click-close handler
  - SandboxContainer.tsx threads onVesselSpeedChange/onVesselTypeChange/isDegenerate to ChartPanel (old VerdictBanner/InstrumentReadouts/ControlPanel cards untouched, dual-rendering expected mid-phase)
affects: [18-04-retire-old-components, 18-05-human-verification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "onSelect fired in the same breath as setPointerCapture inside onPointerDown, not a separate click handler (D-04) -- keeps selection and drag-start atomic within one event dispatch"
    - "event.stopPropagation() on the per-vessel pointerdown handlers double-duty guards both sibling hull/rotate-handle overlap (pre-existing) and the new svg-level empty-click-close handler (Pitfall 1's 3rd occurrence of this hit-testing regression class), documented inline at the exact call site per this codebase's WHY-only comment convention"
    - "selectVessel() toggle: setSelectedVessel((current) => (current === vessel ? null : vessel)) -- D-01's re-click-closes layered on the design source's own non-toggling default"

key-files:
  created: []
  modified:
    - src/components/sandbox/types.ts
    - src/components/sandbox/hooks/useHullDrag.ts
    - src/components/sandbox/hooks/useHullDrag.test.ts
    - src/components/sandbox/hooks/useRotateHandleDrag.ts
    - src/components/sandbox/hooks/useRotateHandleDrag.test.ts
    - src/components/sandbox/chart/ChartPanel.tsx
    - src/components/sandbox/chart/ChartPanel.test.tsx
    - src/components/sandbox/SandboxContainer.tsx
    - src/components/sandbox/SandboxContainer.test.tsx

key-decisions:
  - "Restructured ChartPanel's return so the zero-size early-return div and the full-render branch both nest inside one outer wrapper carrying ChartHeaderStrip/ChartFooterStrip -- header/footer render even before the first ResizeObserver callback fires, matching the design's always-framed chart card, while the svg/legend/overlay-card still gate on non-zero containerSize."
  - "Overlay positioning uses deriveOverlayAnchor() output via 2 CSS custom properties (--ov-x/--ov-y) referenced from Tailwind arbitrary-value classes, per this codebase's 'expose a numeric value as a CSS custom property, don't compose the whole rule in JS' convention -- no template-literal-built background-image/animation strings."
  - "Added a verdictBanner() query helper in SandboxContainer.test.tsx (scoped to [data-slot='verdict-banner']), mirroring the file's existing reasoningTrailCard() pattern, once ChartHeaderStrip's now-simultaneous rendering made prior document-scoped heading/'Unable to classify' queries ambiguous."

patterns-established:
  - "When a plan's own acceptance-criteria grep predicts an exact count for a prop wired into a new call site, and a legitimate pre-existing call site already contains the same substring (ControlPanel's onVesselSpeedChange usage here), the count naturally rises above the plan's estimate -- verify by reading the surrounding lines, not by treating a grep-count mismatch as a defect on its own."

requirements-completed: [SBOX-06, SBOX-07, SBOX-08]

# Metrics
duration: 70min
completed: 2026-07-25
---

# Phase 18 Plan 03: ChartPanel Selection Wiring Summary

**ChartPanel.tsx now owns a selectedVessel state machine wired to both drag hooks' pointerdown handlers -- hull/rotate-handle press opens or toggles a vessel's floating overlay, switching between vessels never closes it, and pressing bare chart background closes it -- with 5 new regression tests proving the Pitfall-1 overlap-does-not-block-drag case explicitly, not just by manual review.**

## Performance

- **Duration:** ~70 min
- **Started:** 2026-07-25T17:57:00Z
- **Completed:** 2026-07-25T19:07:00Z (recovered after an API connection drop right before this SUMMARY.md write; all task work and commits landed cleanly beforehand)
- **Tasks:** 3 completed + 1 follow-up test-scoping fix
- **Files modified:** 9

## Accomplishments

- `useHullDrag.ts`/`useRotateHandleDrag.ts`: both hooks gained a final `onSelect: (vessel: VesselLabel) => void` parameter, called immediately after `setPointerCapture` inside the existing `onPointerDown` (D-04 -- selection and drag-start are atomic within one event). `useHullDrag`'s `stopPropagation()` is new and documented inline: it prevents the pointerdown from bubbling to `ChartPanel`'s new svg-level close handler, which would otherwise silently overwrite a vessel-to-vessel switch back to "closed."
- `ChartPanel.tsx`: added `selectedVessel` state, a `selectVessel()` toggle (D-01), an svg `onPointerDown` empty-click-close path, and full composition of `ChartHeaderStrip`/`ChartFooterStrip`/`VesselOverlayCard` around the existing chart surface -- the overlay renders via `deriveOverlayAnchor()`-derived CSS custom properties when a vessel is selected.
- `SandboxContainer.tsx`: threads `isDegenerate`/`onVesselSpeedChange`/`onVesselTypeChange` to the new `ChartPanel` composition; `VerdictBanner`/`InstrumentReadouts`/`ControlPanel` usage is untouched (both old and new UI coexist until Plan 18-04 retires the former).
- `ChartPanel.test.tsx`: 5 new cases proving all 4 D-01 open/toggle/switch/close paths plus the Pitfall-1 regression (a drag on vessel B still fires `onVesselPositionChange` while vessel A's overlay is open and visually near it), via real `PointerEvent` dispatch against the rendered hull hit-rects and svg background.
- `SandboxContainer.test.tsx`: fixed 2 pre-existing document-scoped queries that became ambiguous once `ChartHeaderStrip` started rendering simultaneously with the still-live `VerdictBanner` card, by scoping them to `VerdictBanner`'s own `[data-slot="verdict-banner"]` region.

## Task Commits

1. **Task 1: Extend ChartPanelProps, add onSelect to both drag hooks, wire ChartPanel.tsx** - `f4a04d5` (feat)
2. **Task 2: Update existing test files' required-prop shape** - `30bcf7d` (test)
3. **Task 3: New ChartPanel.test.tsx regression coverage for D-01 + Pitfall 1** - `3097748` (test)
4. **Follow-up fix: scope SandboxContainer.test.tsx queries around ChartHeaderStrip's duplicate content** - `8e65daf` (fix)

**Plan metadata:** committed alongside this SUMMARY.md.

## Files Created/Modified

- `src/components/sandbox/types.ts` - `ChartPanelProps` gains `isDegenerate`/`onVesselSpeedChange`/`onVesselTypeChange`
- `src/components/sandbox/hooks/useHullDrag.ts` - `onSelect` param + `stopPropagation()` + inline WHY comment
- `src/components/sandbox/hooks/useHullDrag.test.ts` - supplies the 3 new required `ChartPanelProps` fields
- `src/components/sandbox/hooks/useRotateHandleDrag.ts` - `onSelect` param, existing `stopPropagation()` comment extended
- `src/components/sandbox/hooks/useRotateHandleDrag.test.ts` - supplies the 3 new required fields
- `src/components/sandbox/chart/ChartPanel.tsx` - `selectedVessel` state, `selectVessel()` toggle, svg close-path, full strip/overlay composition
- `src/components/sandbox/chart/ChartPanel.test.tsx` - existing GW/SO queries scoped to `<svg>`; 5 new D-01/Pitfall-1 regression cases; `afterEach(cleanup())` added
- `src/components/sandbox/SandboxContainer.tsx` - passes `isDegenerate`/`onVesselSpeedChange`/`onVesselTypeChange` to `ChartPanel`
- `src/components/sandbox/SandboxContainer.test.tsx` - `verdictBanner()` query helper scoped to `[data-slot="verdict-banner"]`

## Decisions Made

- See `key-decisions` in frontmatter — restructured `ChartPanel`'s render branches for an always-framed header/footer, used CSS custom properties for overlay positioning per the codebase's no-raw-CSS-strings convention, and added a scoped query helper rather than relaxing existing `SandboxContainer.test.tsx` assertions.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Scoped 2 SandboxContainer.test.tsx queries that became ambiguous**
- **Found during:** Task 1's acceptance check (existing `SandboxContainer.test.tsx` suite, run as part of the full test pass)
- **Issue:** `ChartHeaderStrip` now renders alongside the still-live `VerdictBanner` card (expected mid-phase dual-rendering), so 2 pre-existing document-scoped queries (heading name, "Unable to classify" text) matched both components and broke.
- **Fix:** Added a `verdictBanner()` query helper scoped to `[data-slot="verdict-banner"]`, mirroring the file's existing `reasoningTrailCard()` pattern; rescoped the 2 affected assertions to query within it.
- **Files modified:** `src/components/sandbox/SandboxContainer.test.tsx`
- **Verification:** `npx vitest run SandboxContainer.test.tsx` passes.
- **Committed in:** `8e65daf` (separate fix commit, not folded into a task commit).

---

**Total deviations:** 1 auto-fixed (test-scoping fix, no production behavior change).
**Impact on plan:** None — required for pre-existing tests to keep passing under the plan's own expected dual-rendering state; no scope creep.

## Issues Encountered

The executor agent's process was interrupted by a transient API connection error immediately after finishing all task work and verification (all commits already landed, all tests green) but before writing this SUMMARY.md. The orchestrator verified the worktree's git history against the plan's 3 tasks, re-ran the full acceptance-criteria grep set and the relevant test files (`ChartPanel.test.tsx`, `useHullDrag.test.ts`, `useRotateHandleDrag.test.ts`, `SandboxContainer.test.tsx` — 25/25 passing) plus `npm run typecheck` (exits 0), confirmed no gaps, and completed this SUMMARY.md manually per the safe-resume "close out manually" recovery path.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- `ChartPanel.tsx` is fully wired: opening/toggling/switching/closing the vessel overlay all work, verified by 5 new automated regression tests plus the pre-existing suite, with zero pointer-event regressions on the drag/rotate gestures this codebase has previously broken twice.
- `VerdictBanner`/`InstrumentReadouts`/`ControlPanel` remain mounted in `SandboxContainer.tsx` (dual-rendering with the new strips/overlay is expected) — Plan 18-04 removes them next.
- No blockers.

---
*Phase: 18-on-chart-vessel-control-overlay*
*Completed: 2026-07-25*
