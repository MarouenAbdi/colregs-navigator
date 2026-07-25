---
phase: 18-on-chart-vessel-control-overlay
verified: 2026-07-25T18:03:51Z
status: passed
score: 8/8 must-haves verified
overrides_applied: 0
---

# Phase 18: On-Chart Vessel Control Overlay Verification Report

**Phase Goal:** Users read the verdict and instrument readouts directly on the chart via merged header/footer strips, and control each vessel via a floating on-chart overlay opened by clicking it — with zero regression to this codebase's twice-fixed drag/rotate hit-testing.
**Verified:** 2026-07-25T18:03:51Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A single merged header strip (rule badge + encounter title + risk badge) sits atop the chart — VerdictBanner card is gone | ✓ VERIFIED | `src/components/sandbox/chart/ChartHeaderStrip.tsx` renders rule badge + title + 4-tier risk pill as a sub-region of `ChartPanel.tsx`'s outer wrapper; `src/components/sandbox/reasoning/VerdictBanner.tsx` confirmed deleted (`test -e` exits nonzero); zero import references to it anywhere in `src`/`app` |
| 2 | A single merged footer strip (LIVE/RANGE/BEARING/CPA/TCPA + per-vessel required-action text) sits below the chart — InstrumentReadouts card is gone | ✓ VERIFIED | `src/components/sandbox/chart/ChartFooterStrip.tsx` renders LIVE dot + 4 readout tiles + per-vessel `VesselActionCell` (role badge + D-03 action text); `src/components/sandbox/instruments/InstrumentReadouts.tsx` and `status-pill.ts` confirmed deleted |
| 3 | User can click a vessel to open a floating control card (type/speed/heading); clicking the other vessel switches to it; re-clicking closes it; side ControlPanel is fully removed | ✓ VERIFIED | `ChartPanel.tsx`'s `selectVessel()` toggle (`current === vessel ? null : vessel`), wired as the final `onSelect` param to both `useHullDrag`/`useRotateHandleDrag`; `VesselOverlayCard.tsx` renders editable Select(type)/Slider(speed) + read-only heading span; `src/components/sandbox/control-panel/ControlPanel.tsx` confirmed deleted, `CopyLinkButton.tsx` (unrelated) confirmed retained |
| 4 | Opening one vessel's overlay never blocks a drag/rotate gesture aimed at the other vessel, even when visually overlapping (Pitfall 1, 3rd occurrence) | ✓ VERIFIED | `VesselOverlayCard.tsx` root carries `pointer-events-none`, only close-button/Select-trigger/Slider carry `pointer-events-auto`, proven via a real DOM className assertion in `VesselOverlayCard.test.tsx`; `ChartPanel.test.tsx` has a live regression test dispatching a real pointerdown+pointermove on vessel B's hull while vessel A's overlay is open, asserting `onVesselPositionChange` still fires with `"vesselB"` |
| 5 | `event.stopPropagation()` prevents the svg-level empty-click-close handler from clobbering a vessel-to-vessel switch (D-01/D-04 wiring) | ✓ VERIFIED | Both `useHullDrag.ts` and `useRotateHandleDrag.ts` call `event.stopPropagation()` as the first line of `onPointerDown`, before `setPointerCapture`/`onSelect`; `ChartPanel.test.tsx`'s "switches the overlay to vesselB... not closing it" test dispatches vesselA-then-vesselB pointerdowns and asserts exactly vesselB's close button is present |
| 6 | No orphaned code remains — VerdictBanner/InstrumentReadouts/status-pill/ControlPanel + their test files are deleted, not merely unreferenced | ✓ VERIFIED | All 8 files confirmed absent via `test -e`; `grep -rn "from.*ControlPanel\.js\|from.*VerdictBanner\.js\|from.*InstrumentReadouts\.js\|from.*status-pill\.js" src app` returns zero hits; `types.ts` no longer exports `ControlPanelProps`/`VerdictBannerProps`/`InstrumentReadoutsProps` |
| 7 | Editing type/speed via the overlay re-derives classification live through the same `useSandboxState()` callbacks, no submit step | ✓ VERIFIED | `SandboxContainer.tsx` passes `onVesselSpeedChange`/`onVesselTypeChange` straight through to `ChartPanel` → `VesselOverlayCard`'s `onValueChange` handlers call them directly (no form/submit wrapper); `SandboxContainer.test.tsx`'s rewritten tests drive this via `openOverlay()` + arrow-key slider presses and assert live classification updates |
| 8 | Human-verified: with the overlay open, dragging/rotating either vessel works with zero dead zones (ROADMAP criterion 4) | ✓ VERIFIED (human) | `18-05-SUMMARY.md` records a completed live-browser UAT session (Docker/Postgres up, dev server running) covering all 3 blocking checkpoint tasks (header/footer fidelity, overlay open/close/switch, drag/rotate hit-testing with overlay open including the visually-overlapping adversarial case); human confirmed: "I checked, everything is working good!" — per task instructions this satisfies the human-verification requirement and is not re-requested here |

**Score:** 8/8 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/sandbox/chart/chart-header-risk.ts` | 4-tier risk-pill derivation (D-02), CPA-distance-driven | ✓ VERIFIED | `deriveChartHeaderRisk()` implements exact 5-branch order (null→none, opening/tcpa≤0→none, <0.3→high, <1.0→watch, else→ok); zero references to `riskOfCollision`; both classname maps present with exactly 4 keys each |
| `src/components/sandbox/chart/footer-action-copy.ts` | Per-role required-action copy (D-03) | ✓ VERIFIED | `ROLE_ACTION_TEXT` exports exactly the 3 verbatim strings keyed by `VesselRole` |
| `src/components/sandbox/chart/vessel-overlay-position.ts` | Pure quadrant-anchor math (Pitfall 1) | ✓ VERIFIED | `deriveOverlayAnchor()` is framework/DOM-free, computes right/below booleans + clamped pixel offsets; imported and consumed by `ChartPanel.tsx` |
| `src/components/sandbox/types.ts` | 3 new prop-contract interfaces + `ChartPanelProps` extension | ✓ VERIFIED | `ChartHeaderStripProps`/`ChartFooterStripProps`/`VesselOverlayCardProps` all present; `ChartPanelProps` extended with `isDegenerate`/`onVesselSpeedChange`/`onVesselTypeChange`; 3 retired interfaces (`ControlPanelProps`/`VerdictBannerProps`/`InstrumentReadoutsProps`) removed |
| `src/components/sandbox/chart/ChartHeaderStrip.tsx` | Merged rule-badge+title+risk-pill (SBOX-06) | ✓ VERIFIED / WIRED | Substantive JSX, mines (not imports) VerdictBanner's logic; consumed by `ChartPanel.tsx` in both the zero-size and sized render branches |
| `src/components/sandbox/chart/ChartFooterStrip.tsx` | Merged readouts + role/action panel (SBOX-07) | ✓ VERIFIED / WIRED | Substantive JSX, `VesselActionCell` subcomponent extracted (no duplicated JSX); consumed by `ChartPanel.tsx` |
| `src/components/sandbox/chart/VesselOverlayCard.tsx` | Floating TYPE/SPEED/HEADING control card (SBOX-08) | ✓ VERIFIED / WIRED | Substantive JSX with real Select/Slider wiring to the passed callbacks; consumed by `ChartPanel.tsx`'s conditional overlay render |
| `src/components/sandbox/hooks/useHullDrag.ts` | `onSelect` param + `stopPropagation()` | ✓ VERIFIED / WIRED | Confirmed exact param/call order; called from `ChartPanel.tsx` with `selectVessel` |
| `src/components/sandbox/hooks/useRotateHandleDrag.ts` | Same `onSelect` wiring | ✓ VERIFIED / WIRED | Confirmed |
| `src/components/sandbox/SandboxContainer.tsx` | Composes only ChartPanel + ReasoningTrail | ✓ VERIFIED | No `VerdictBanner`/`InstrumentReadouts`/`ControlPanel` references; grid/side-column removed, replaced with plain single-column wrapper (functionally equivalent to the plan's "either is acceptable" instruction) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `chart-header-risk.ts`'s `deriveChartHeaderRisk` | `instrument-readouts.ts`'s `deriveInstrumentReadouts()` output | same `cpaNm`/`tcpaMinutes` values | ✓ WIRED | `ChartHeaderStrip.tsx` calls `deriveInstrumentReadouts(vesselA, vesselB)` once, passes its `cpaNm`/`tcpaMinutes` straight into `deriveChartHeaderRisk()` |
| `VesselOverlayCard.tsx`'s Select/Slider `onChange` | `onVesselSpeedChange`/`onVesselTypeChange` props | direct prop call | ✓ WIRED | `onValueChange={(type) => onVesselTypeChange(label, type as VesselType)}` and `onValueChange={([speed]) => onVesselSpeedChange(label, speed)}` present verbatim |
| `VesselGroup`'s hull/rotate-handle `onPointerDown` (via `useHullDrag`/`useRotateHandleDrag`) | `ChartPanel`'s `selectVessel()` | `onSelect(vessel)` callback, same breath as `setPointerCapture` | ✓ WIRED | Confirmed in both hook files; `selectVessel` passed as final arg to all 4 hook call sites in `ChartPanel.tsx` |
| `ChartPanel`'s `<svg>` `onPointerDown` | `setSelectedVessel(null)` | empty-chart-space close path | ✓ WIRED | Present in `ChartPanel.tsx`; regression test 4 confirms it fires only when no vessel-level `stopPropagation()` already intercepted the event |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| `ChartHeaderStrip` | `risk` (tier/text) | `deriveInstrumentReadouts()` → `deriveChartHeaderRisk()`, both pure functions over live `vesselA`/`vesselB` geometry | Yes — real CPA/TCPA math, not static | ✓ FLOWING |
| `ChartFooterStrip` | `rangeNm`/`bearingAtoBDegrees`/`cpaNm`/`tcpaMinutes` | `deriveInstrumentReadouts(vesselA, vesselB)` | Yes | ✓ FLOWING |
| `VesselOverlayCard` | `vessel.type`/`vessel.speed`/`vessel.heading` | Live `Vessel` object passed down from `useSandboxState()` via `SandboxContainer` → `ChartPanel` | Yes | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full sandbox unit/integration suite passes | `npx vitest run src/components/sandbox` | 17 files / 84 tests passed | ✓ PASS |
| Full project test suite passes (with live Postgres available in this session) | `npx vitest run` | 40 files / 232 tests passed | ✓ PASS |
| Typecheck clean | `npm run typecheck` | exits 0, no errors | ✓ PASS |
| Production build succeeds | `npm run build` | Compiled successfully, static pages generated, all routes built | ✓ PASS |
| No retired-component imports remain | `grep -rn "from.*ControlPanel\.js\|from.*VerdictBanner\.js\|from.*InstrumentReadouts\.js\|from.*status-pill\.js" src app` | zero hits | ✓ PASS |
| Retired files actually deleted | `test -e` on all 4 retired components | all exit nonzero (absent); `CopyLinkButton.tsx` confirmed still present | ✓ PASS |

### Probe Execution

No project-convention probes (`scripts/*/tests/probe-*.sh`) exist and none are referenced by this phase's PLAN/SUMMARY files. SKIPPED (no runnable probes declared for this phase).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|--------------|-------------|--------------|--------|----------|
| SBOX-06 | 18-01, 18-02, 18-03, 18-04 | Chart header strip merges rule badge/title/risk badge, replacing VerdictBanner | ✓ SATISFIED | `ChartHeaderStrip.tsx` implemented and wired; `VerdictBanner.tsx` deleted |
| SBOX-07 | 18-01, 18-02, 18-03, 18-04 | Chart footer strip merges LIVE/RANGE/BEARING/CPA/TCPA + per-vessel action text, replacing InstrumentReadouts | ✓ SATISFIED | `ChartFooterStrip.tsx` implemented and wired; `InstrumentReadouts.tsx`/`status-pill.ts` deleted |
| SBOX-08 | 18-01, 18-02, 18-03, 18-04 | Click-to-open on-chart floating control card, replacing side ControlPanel | ✓ SATISFIED | `VesselOverlayCard.tsx` + `ChartPanel.tsx`'s `selectVessel()` toggle implemented and wired; `ControlPanel.tsx` deleted |

**Note:** `.planning/REQUIREMENTS.md` still lists SBOX-06/07/08 with unchecked `[ ]` checkboxes and status "Pending" in its own tracking table, even though `.planning/ROADMAP.md` (updated in the working tree, not yet committed) marks Phase 18 complete and the code-level evidence above confirms all 3 requirements are satisfied. This is a documentation-sync gap in `REQUIREMENTS.md`'s own bookkeeping, not a code gap — flagged as an informational item, not a blocker (see Anti-Patterns below).

No orphaned requirements: REQUIREMENTS.md maps exactly SBOX-06/07/08 to Phase 18, all 3 are claimed in every plan's frontmatter `requirements:` field, and all 3 have concrete supporting evidence above.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `.planning/REQUIREMENTS.md` | 12-14, 56-58 | Checkbox/status not updated to reflect Phase 18 completion (still "Pending") | ℹ️ Info | Documentation bookkeeping lag only — no code impact, all 3 requirements are functionally satisfied per the evidence above. Recommend updating REQUIREMENTS.md's checkboxes/status column alongside this phase's closeout commit. |

No TBD/FIXME/XXX/TODO/HACK markers, no placeholder returns, no empty handlers, and no hardcoded-empty stub patterns found in any of the 11 files this phase created or modified (`chart-header-risk.ts`, `footer-action-copy.ts`, `vessel-overlay-position.ts`, `ChartHeaderStrip.tsx`, `ChartFooterStrip.tsx`, `VesselOverlayCard.tsx`, `ChartPanel.tsx`, `useHullDrag.ts`, `useRotateHandleDrag.ts`, `SandboxContainer.tsx`, `types.ts`). The `PLACEHOLDER = "—"` constant in `ChartFooterStrip.tsx` and the Radix `placeholder="Vessel type"` prop in `VesselOverlayCard.tsx` are both legitimate, intentional UI conventions (matching this codebase's established "—" degenerate-state convention), not stub markers.

### Human Verification Required

None. Plan 18-05 already conducted the full live-browser UAT (header/footer visual fidelity, overlay open/close/switch/toggle behavior, and the critical drag/rotate hit-testing re-check with the overlay open and visually overlapping the other vessel) against a running dev server with a real Postgres connection, and the human confirmed: "I checked, everything is working good!" Per the task instructions for this verification pass, this satisfies the phase's human-verification requirement (ROADMAP success criterion 4) and is not re-requested.

### Gaps Summary

No gaps found. All 4 ROADMAP success criteria are code-verified plus (for criterion 4) human-verified. The only finding is an informational documentation-sync note (REQUIREMENTS.md's own checkbox/status column not yet updated), which does not affect phase-goal achievement and is not a blocker.

---

_Verified: 2026-07-25T18:03:51Z_
_Verifier: Claude (gsd-verifier)_
