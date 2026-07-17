---
phase: 04-interactive-chart-sandbox
verified: 2026-07-17T20:50:19Z
status: passed
score: 19/19 must-haves verified
overrides_applied: 0
human_verification_resolved: 2026-07-17T22:55:00Z
human_verification_source: 04-HUMAN-UAT.md
human_verification:
  - test: "Drag a vessel's hull around the chart with the mouse/trackpad for several seconds"
    expected: "The vessel follows the pointer smoothly with no visible lag, jank, or flicker; the reasoning trail and bearing line update continuously in step with the drag"
    why_human: "CHRT-02 ('no lag or flicker during continuous drag') is a felt real-time-performance/visual-smoothness property. Code inspection confirms no throttling/RAF batching was added (deliberate, matches plan) and all classification math is synchronous, but actual frame-rate smoothness in a real browser can only be judged by a human watching the drag."
  - test: "Look at the give-way (red) / stand-on (green) / mutual (slate) hull colors and GW/SO/MUTUAL badges together on the chart"
    expected: "Colors are visually distinct and legible against the white chart background and slate-50 page background at a normal viewing distance; the color+text-badge pairing reads clearly as an accessible (colorblind-safe) signal, per D-02's discretionary accessibility consideration"
    why_human: "Visual contrast/legibility and colorblind-accessibility quality are subjective/visual judgments; automated tests only confirm the correct CSS classes and badge text are present in the DOM, not that they render legibly"
  - test: "Drag the rotate handle near the hull's edge, including at the boundary where the hull hit-rect and rotate hit-circle visually overlap"
    expected: "Only the rotate gesture fires (heading changes), the hull never also jumps position for the same gesture"
    why_human: "IN-02 in 04-REVIEW.md notes the `stopPropagation()` comment describes the wrong mechanism (siblings can't bubble to each other); the real protection is SVG paint-order hit-testing. This is exercised by an automated regression test (useRotateHandleDrag.test.ts) using simulated pointer events, but the exact-pixel-boundary overlap behavior in a live browser is worth a human spot-check given the documentation/implementation mismatch flagged in review."
---

# Phase 4: Interactive Chart Sandbox Verification Report

**Phase Goal:** Users can interactively set up a two-vessel encounter on a chart and see live, visually-explained classification as they drag — the main interaction loop and demo centerpiece.
**Verified:** 2026-07-17T20:50:19Z
**Status:** passed
**Re-verification:** No — initial verification

**Human verification resolved 2026-07-17T22:55:00Z** (see `04-HUMAN-UAT.md`): all 3 items confirmed by the user in a live browser session. Item 1 (drag smoothness) and item 3 (rotate-handle boundary behavior) surfaced a genuine hit-area design defect during that testing — the hull and rotate-handle hit targets used padded invisible shapes rather than hit-testing their actual visible geometry, which made gestures misfire near their shared boundary. Fixed across three iterations (commits `3746a98`, `3bf6f24`, `f559e98`) and re-confirmed by the user ("all clear"). Item 2 (color legibility) passed with no issues.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can place two vessels on an SVG chart-style canvas, setting position, heading, speed, and vessel type via drag and/or form controls | ✓ VERIFIED | `ChartPanel.tsx` renders both vessel hulls at `chartToScreen`-projected positions with drag hit-targets; `ControlPanel.tsx` renders speed/type controls; `SandboxContainer.test.tsx` mount test and live dev-server curl both confirm end-to-end rendering |
| 2 | User can drag a vessel's position/heading on the chart and see the classification update live, no submit step, no lag/flicker during continuous drag | ✓ VERIFIED (code) / see human item #1 | `useHullDrag`/`useRotateHandleDrag` fire `onVesselPositionChange`/`onVesselHeadingChange` on every `pointermove` (not just release); `SandboxContainer.applyVesselUpdate` re-derives classification synchronously on every call; no `requestAnimationFrame`/`useTransition`/throttle/debounce found in `ChartPanel.tsx` or `SandboxContainer.tsx` (deliberate, per CHRT-02) |
| 3 | Give-way and stand-on vessels are visually distinguished on the chart (color/icon coding) | ✓ VERIFIED (code) / see human item #2 | `ChartPanel.tsx` `HULL_FILL_CLASS` maps role→`fill-red-500`/`fill-green-500`/`fill-slate-400` via `getVesselRole()`; `ROLE_BADGE_TEXT` renders `GW`/`SO`/`MUTUAL` text badges as the colorblind-accessible secondary cue; `ChartPanel.test.tsx` asserts both badges render |
| 4 | A reasoning trail panel shows the specific rule citation and geometric logic (relative bearing, closing angle) behind the verdict, updating live | ✓ VERIFIED | `ReasoningPanel.tsx` renders `classification.trail.map(...)` verbatim (ruleId + text) plus a `font-mono` `FactReadout` of each entry's `facts` (TCPA, DCPA, relative bearings, vessel types); `SandboxContainer.test.tsx`'s live-update test confirms the panel content changes after a `ControlPanel` speed edit with no submit |
| 5 | The chart visually overlays the geometric reasoning directly on the canvas (relative bearing line, overtaking boundary arc) | ✓ VERIFIED | `ChartPanel.tsx` renders a bearing `<line>` between the two vessels and one wedge `<path>` per vessel for the 112.5°-247.5° overtaking-boundary cone, both swapping to dashed amber (`#F59E0B`) exactly on the `resolveDoubtGeometry()`-identified element; `ChartPanel.test.tsx` asserts both doubt-overlay behaviors |
| 6 | Next.js app boots/builds with Tailwind v4 and a working jsdom+RTL test harness | ✓ VERIFIED | `npx next build` exits 0; `npx tsc --noEmit` exits 0; `npx vitest run` → 22 files / 146 tests all pass |
| 7 | Every sandbox component is built against one locked shared prop contract | ✓ VERIFIED | `src/components/sandbox/types.ts` exports `ChartPanelProps`/`ControlPanelProps`/`ReasoningPanelProps`/`VesselUpdateHandlers`; all four components (`ChartPanel`, `ControlPanel`, `ReasoningPanel`, `SandboxContainer`) import and use these types unchanged (confirmed by reading each file) |
| 8 | Given a doubt-flagged classification, the UI can always determine exactly which vessel/bearing triggered doubt, without reading inconsistent trail facts | ✓ VERIFIED | `resolveDoubtGeometry()` recomputes `relativeBearing()` independently rather than reading `trail[].facts`; 5 fixture-driven test cases (A-side, B-side, sticky-hysteresis, head-on, degenerate-propagation) all pass in `resolve-doubt-geometry.test.ts` |
| 9 | Vessel-type options are sourced from `VesselTypeSchema`'s own enum, not a hand-authored list | ✓ VERIFIED | `ControlPanel.tsx` maps `VesselTypeSchema.options.map(...)` directly to `<option>` elements; all 5 display labels present including "Not under command" |
| 10 | Full reasoning trail (incl. ruled-out rules) always visible, never collapsed | ✓ VERIFIED | `ReasoningPanel.tsx` unconditionally renders `<ol>{classification.trail.map(...)}</ol>` with no `.sort()`/`.filter()`/collapse toggle; no conditional-hide wrapper found |
| 11 | Doubt caveat line naming the specific boundary appears when `classification.doubt` is true | ✓ VERIFIED | `DOUBT_CAVEAT_TEXT` keyed by `doubtBoundary`, rendered conditionally; `ReasoningPanel.test.tsx` covers both boundary strings |
| 12 | Degenerate coincident-position state shows "Unable to classify" while preserving the last-good trail | ✓ VERIFIED | `SandboxContainer.applyVesselUpdate`'s `!result.ok` branch explicitly leaves `lastGoodClassification`/`previousEncounterTypeRef` untouched; `SandboxContainer.test.tsx`'s degenerate test drags vesselA onto vesselB's position and asserts both "Unable to classify" AND "Rule 15" (prior trail) remain visible |
| 13 | Sandbox loads with a default two-vessel classic-crossing scenario already placed, no blank chart | ✓ VERIFIED | `SandboxContainer` seeds `useState` from `crossingResidualBasicCase`; `SandboxContainer.test.tsx` mount test and a live `next dev` curl both show `"Crossing — Vessel A gives way"` with zero interaction |
| 14 | Every drag/form update flows through one choke point that validates via `VesselSchema` before calling `classifyEncounter()`, re-deriving from scratch every time | ✓ VERIFIED | `applyVesselUpdate` calls `VesselSchema.safeParse` on both vessels before any `classifyEncounter()` call; all four `onVessel*Change` handlers funnel through it exclusively |
| 15 | Rule 13(d) hysteresis respected: `classifyEncounter()` always called with previously-committed `encounterType` via a ref, never read/written during render | ✓ VERIFIED | `previousEncounterTypeRef` is a `useRef`, read/written only inside `applyVesselUpdate` (an event-driven function); `SandboxContainer.test.tsx`'s hysteresis test drives a real overtaking→sticky sequence and confirms the verdict banner stays "Overtaking" |
| 16 | A Reset Scenario button restores both vessels to the default scenario and clears hysteresis | ✓ VERIFIED | `handleReset` sets `previousEncounterTypeRef.current = undefined` then calls `applyVesselUpdate` with the default fixture; `SandboxContainer.test.tsx`'s reset test confirms the banner and degenerate state both clear |
| 17 | `ChartPanel`, `ControlPanel`, `ReasoningPanel` mount as permanent sibling panels (D-03), not collapsed/stacked | ✓ VERIFIED | `SandboxContainer.tsx` renders all three as JSX siblings inside one `<div className="flex flex-row gap-8 items-start">` |
| 18 | `app/page.tsx` mounts `SandboxContainer` at the `/` route | ✓ VERIFIED | `app/page.tsx` imports and renders `<SandboxContainer />`; `npx next build` succeeds; live `next dev` curl of `/` returns HTTP 200 with rendered sandbox content |
| 19 | Zero duplicated `atan2`/boundary-constant logic in the new geometry helper (reuses `relativeBearing()`/`bearing()` directly) | ✓ VERIFIED | `resolve-doubt-geometry.ts` imports `relativeBearing` from `../geometry/relative-bearing.js`; `useRotateHandleDrag.ts` imports `bearing` from `../../../domain/geometry/bearing.js`; no `Math.atan2` found in either file |

**Score:** 19/19 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/layout.tsx` | Root layout, imports globals.css | ✓ VERIFIED | Contains `import "./globals.css"`, `export default function RootLayout` |
| `app/globals.css` | Tailwind v4 entrypoint | ✓ VERIFIED | `@import "tailwindcss";` |
| `app/page.tsx` | Mounts SandboxContainer | ✓ VERIFIED | Renders `<SandboxContainer />`, build succeeds |
| `src/components/sandbox/types.ts` | Shared prop contracts | ✓ VERIFIED | Exports `ChartPanelProps`, `ControlPanelProps`, `ReasoningPanelProps`, `VesselUpdateHandlers` exactly per plan |
| `src/components/sandbox/vessel-role.ts` | `getVesselRole()` | ✓ VERIFIED | Matches plan's interface exactly, reused by both ChartPanel and ReasoningPanel |
| `src/domain/colregs/resolve-doubt-geometry.ts` | `resolveDoubtGeometry()` | ✓ VERIFIED | Matches signature, 5/5 fixture tests pass, no re-derived atan2 |
| `src/components/sandbox/ChartPanel.tsx` | SVG chart w/ grid, hulls, bearing line, cones, drag wiring | ✓ VERIFIED | All elements present and tested; see WR-01 note below for a non-blocking gap |
| `src/components/sandbox/hooks/useHullDrag.ts` | Position drag hook | ✓ VERIFIED | Exported, pointer-capture guarded, tested |
| `src/components/sandbox/hooks/useRotateHandleDrag.ts` | Heading drag hook via `bearing()` | ✓ VERIFIED | Exported, calls `bearing()`, tested |
| `src/components/sandbox/ControlPanel.tsx` | Speed + type form controls | ✓ VERIFIED | Sourced from `VesselTypeSchema.options`, tested |
| `src/components/sandbox/ReasoningPanel.tsx` | Full trail + fact readouts + doubt caveat | ✓ VERIFIED | All copy verbatim from plan/UI-SPEC, tested; see WR-03/WR-04 notes below |
| `src/components/sandbox/SandboxContainer.tsx` | State owner + choke point + reset | ✓ VERIFIED | Matches plan exactly, integration-tested against real pointer/form sequences |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `vitest.config.ts` | `@vitejs/plugin-react-swc` | `plugins:` array | ✓ WIRED | `plugins: [react()]` present |
| `vitest.setup.ts` | `@testing-library/jest-dom/vitest` | import | ✓ WIRED | Present, plus a documented type-augmentation fix |
| `useRotateHandleDrag.ts` | `src/domain/geometry/bearing.ts` | `bearing()` call | ✓ WIRED | Imported and called; no `Math.atan2` |
| `ChartPanel.tsx` | `resolve-doubt-geometry.ts` | `resolveDoubtGeometry()` call | ✓ WIRED | Called when `doubtBoundary === "near-overtaking-crossing-boundary"`, defensively falls back on `!ok` |
| `ChartPanel.tsx` | `screen-convert.ts` | `chartToScreen()`/`screenToChart()` | ✓ WIRED | Used for every vessel position, grid line, and pointer conversion |
| `ControlPanel.tsx` | `vessel.ts` | `VesselTypeSchema.options` | ✓ WIRED | Directly mapped to `<option>` elements |
| `SandboxContainer.tsx` | `classify-encounter.ts` | `classifyEncounter()` | ✓ WIRED | Called inside `applyVesselUpdate`, never in render body |
| `SandboxContainer.tsx` | `vessel.ts` | `VesselSchema.safeParse()` | ✓ WIRED | Runs on both vessels before every `classifyEncounter()` call |
| `app/page.tsx` | `SandboxContainer.tsx` | default-exported page renders it | ✓ WIRED | Confirmed via build + live `next dev` curl |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| `ChartPanel` | `classification` prop | `SandboxContainer`'s `lastGoodClassification` state, set from real `classifyEncounter()` calls | Yes | ✓ FLOWING |
| `ReasoningPanel` | `classification.trail` | Same `classifyEncounter()` result, rendered verbatim with no transformation | Yes | ✓ FLOWING |
| `ChartPanel` doubt overlays | `resolveDoubtGeometry()` result | Independently recomputed from live `vesselA`/`vesselB` on every render | Yes | ✓ FLOWING |
| `SandboxContainer` initial state | `crossingResidualBasicCase` | Real domain fixture, unwrapped via a documented one-time safe lazy-initializer | Yes | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full test suite passes | `npx vitest run` | 22 files, 146 tests, all pass | ✓ PASS |
| Production build succeeds | `npx next build` | Compiled successfully, `/` prerendered as static | ✓ PASS |
| Type-check clean | `npx tsc --noEmit` | No output (0 errors) | ✓ PASS |
| Live dev server serves the sandbox | `npx next dev` + `curl http://localhost:3987/` | HTTP 200; response body contains "Crossing", "Reset Scenario", "Reasoning Trail" | ✓ PASS |
| No throttling/RAF anti-pattern (CHRT-02) | `grep -n "requestAnimationFrame\|startTransition\|useTransition\|throttle\|debounce"` on ChartPanel.tsx/SandboxContainer.tsx | No matches | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| VESL-02 | 04-03, 04-04, 04-06 | Drag/adjust vessel position and heading directly on chart | ✓ SATISFIED | `useHullDrag`/`useRotateHandleDrag` wired into `ChartPanel`, forwarded through `SandboxContainer.applyVesselUpdate` |
| CLAS-05 | 04-04, 04-06 | Classification updates live, no manual submit | ✓ SATISFIED | Every `onChange`/`pointermove` funnels through `applyVesselUpdate` → `classifyEncounter()` synchronously |
| DETM-03 | 04-03, 04-06 | Give-way/stand-on visually distinguished on chart | ✓ SATISFIED | Hull fill color + GW/SO/MUTUAL badge via `getVesselRole()` |
| RSON-01 | 04-05 | Reasoning trail with rule citation + geometric logic | ✓ SATISFIED | `ReasoningPanel` renders trail verbatim plus per-entry fact readouts |
| RSON-03 | 04-02, 04-03, 04-06 | Chart overlays geometric reasoning (bearing line, overtaking boundary arc) | ✓ SATISFIED | Bearing line + per-vessel cones in `ChartPanel`, doubt-state resolved by `resolveDoubtGeometry()` |
| CHRT-01 | 04-01, 04-03, 04-06 | 2D nautical-chart-style canvas | ✓ SATISFIED | SVG chart with grid, vessel hulls, headings |
| CHRT-02 | 04-03, 04-06 | Chart/drag stays responsive, no lag/flicker | ✓ SATISFIED (code) — see human verification item #1 for the felt-performance confirmation | No throttling anti-pattern present; synchronous pure-trig computation only |

No orphaned requirements: all 7 requirement IDs mapped to Phase 4 in `REQUIREMENTS.md`'s Traceability table (`VESL-02`, `CLAS-05`, `DETM-03`, `RSON-01`, `RSON-03`, `CHRT-01`, `CHRT-02`) appear in at least one plan's `requirements:` frontmatter field, and every plan-declared requirement ID exists in `REQUIREMENTS.md`.

**Note:** `REQUIREMENTS.md`'s markdown checkboxes (`- [ ]`) for these seven IDs are still unchecked and the Traceability table still lists them "Pending," despite the code satisfying them. This is a stale-documentation issue, not a code gap — flagged for the project-doc-update step (typically run after phase verification passes), not a phase-goal blocker.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/sandbox/ChartPanel.tsx` | 183-189 | `ChartPanelProps.isDegenerate` declared and passed by `SandboxContainer` but never destructured/used in `ChartPanel` (WR-01 in 04-REVIEW.md) | ⚠️ Warning | During a coincident-position drag, the chart still draws a zero-length bearing line and stale doubt-cone overlay with no visual cue that the geometry is currently invalid — `ReasoningPanel` does show "Unable to classify" elsewhere on the page, so the overall page communicates the degenerate state, but the chart itself does not. Does not block any of the 7 roadmap success criteria or the 19 must-have truths above — it is a polish gap on top of an otherwise-satisfied contract. |
| `src/components/sandbox/SandboxContainer.tsx` | 64-84 (speed input path) | Invalid `ControlPanel` input (e.g. a manually typed negative speed) silently reverts via `VesselSchema.safeParse` failure, no user-facing error (WR-02 in 04-REVIEW.md) | ⚠️ Warning | Minor UX rough edge (controlled-input-fights-user bug on invalid input); does not break the documented happy-path interaction loop |
| `src/components/sandbox/ReasoningPanel.tsx` | 81-88 | `classification.giveWay as string` cast discards `null` from the type union (WR-03 in 04-REVIEW.md) | ⚠️ Warning | Type-unsound; would silently render "undefined gives way" only if the `giveWay`/`standOn` non-null invariant is ever violated upstream — not observed to occur with any of Phase 2's fixtures or this phase's own tests |
| `src/components/sandbox/ReasoningPanel.tsx` | 47-64 | Unchecked `as number` casts in `formatFactValue`, no app-wide error boundary (WR-04 in 04-REVIEW.md) | ⚠️ Warning | Would throw only if `classify-encounter.ts` ever pushed a mismatched fact-value type under a known key — not currently occurring |

No `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER` markers, no hardcoded empty stub data, no `console.log`-only implementations found in any file created/modified by this phase.

### Human Verification Required

### 1. Continuous-drag smoothness (CHRT-02)

**Test:** Drag a vessel's hull around the chart with the mouse/trackpad for several seconds, watching the chart and reasoning panel simultaneously.
**Expected:** The vessel follows the pointer smoothly with no visible lag, jank, or flicker; the reasoning trail and bearing line update continuously in step with the drag, not in visible discrete jumps.
**Why human:** This is a felt real-time-performance property. Code inspection confirms the deliberate absence of throttling/RAF batching and purely synchronous trig computation (matching the plan's explicit CHRT-02 anti-pattern guidance), but actual frame-rate smoothness in a real browser can only be judged by a human watching the drag.

### 2. Give-way/stand-on color legibility and accessibility

**Test:** Look at the give-way (red-500) / stand-on (green-500) / mutual (slate-400) hull colors and their GW/SO/MUTUAL text badges together on the chart.
**Expected:** Colors are visually distinct and legible against the white chart background and slate-50 page background; the color+text-badge pairing reads clearly as an accessible (colorblind-safe) signal.
**Why human:** Visual contrast/legibility and colorblind-accessibility quality are subjective/visual judgments — automated tests only confirm the correct CSS classes and badge text exist in the DOM, not that they render legibly to a human eye.

### 3. Rotate-handle vs. hull-drag boundary behavior

**Test:** Drag the rotate handle near the hull's edge, including at the pixel boundary where the hull hit-rect (44x44px) and rotate hit-circle (44px diameter) visually overlap.
**Expected:** Only the rotate gesture fires (heading changes); the hull never also jumps position for the same gesture.
**Why human:** `04-REVIEW.md`'s IN-02 finding notes the code's `stopPropagation()` comment describes the wrong mechanism — hull-hit-rect and rotate-hit-circle are SVG siblings, not ancestor/descendant, so a pointerdown event could never bubble between them regardless of `stopPropagation()`. The real protection is SVG paint-order hit-testing (the rotate circle renders after/on top of the hull rect). This is exercised by an automated regression test using simulated pointer events, but given the documentation/implementation mismatch flagged in review, an exact-pixel-boundary check in a live browser is worth a human spot-check to be sure paint-order hit-testing behaves as expected across browsers.

### Gaps Summary

No must-have truths, artifacts, or key links failed. All 19 truths derived from the roadmap's 5 success criteria plus all 6 plans' `must_haves` frontmatter are verified against the actual codebase: 146 automated tests pass, `npx next build` and `npx tsc --noEmit` are clean, and a live `next dev` smoke test confirms the `/` route serves the fully-wired sandbox with the default crossing scenario, Reset Scenario button, and Reasoning Trail panel.

Four non-blocking warnings carried over from `04-REVIEW.md` (WR-01 through WR-04) remain unresolved in the code — none of them break a roadmap success criterion or a plan-declared must-have, but WR-01 (unused `isDegenerate` prop in `ChartPanel`) is the most visible: the chart gives no visual cue during a degenerate coincident-position drag, relying entirely on `ReasoningPanel`'s "Unable to classify" text elsewhere on the page. This is worth fixing before Phase 5 builds further UI on top of this contract, but does not block Phase 4's goal, since the degenerate state IS communicated to the user (just not on the chart itself).

Status is `human_needed` rather than `passed` solely because three visual/interactive qualities (continuous-drag smoothness, color/accessibility legibility, and exact-pixel-boundary drag-target behavior) cannot be fully confirmed by static analysis or jsdom-simulated pointer events — they require a human to actually watch the running app in a browser.

---

_Verified: 2026-07-17T20:50:19Z_
_Verifier: Claude (gsd-verifier)_
