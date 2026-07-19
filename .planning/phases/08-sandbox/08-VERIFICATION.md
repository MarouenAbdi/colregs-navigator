---
phase: 08-sandbox
verified: 2026-07-19T02:10:00Z
status: passed
score: 5/5 must-haves verified
overrides_applied: 0
---

# Phase 8: Sandbox Verification Report

**Phase Goal:** The existing interactive chart, controls, and reasoning trail are restyled to match the design exactly, with zero regression to the underlying domain wiring or interaction model.
**Verified:** 2026-07-19T02:10:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | SBOX-01: Chart matches dark theme exactly; drag-to-reposition/drag-to-rotate both still work, verified manually in a real browser, not just jsdom | VERIFIED | `ChartPanel.tsx` fully re-themed (`bg-chart-surface`, `stroke-rule-accent`, `stroke-mutual`, no light-theme hex left except intentionally-deferred SVG stroke constants, see Anti-Patterns below). Hull/rotate-handle hit-testing preserved: pointer handlers remain attached directly to the solid-filled hull `<polygon>`/rotate `<circle>` (`ChartPanel.tsx:244-272`). A real hit-testing dead zone (CR-01: the non-rotating role badge overlapped ~45px² of the hull's painted area at heading 0, the app's default seed) was found by code review *after* the human UAT "approved" verdict, and independently fixed in `fb0ec8a` (`<g pointerEvents="none">` wrapping the letter/badge overlay, `ChartPanel.tsx:289,323`) — re-verified via a numeric point-in-polygon check and a live-browser `elementFromPoint()` check per `08-REVIEW.md`'s Resolution section, plus a new regression test (`ChartPanel.test.tsx:84-97`) asserting `pointer-events:none` on the overlay group, which passes in the current 196/196 suite. Human UAT (`08-06-SUMMARY.md`) separately confirmed smooth drag/rotate in a real browser prior to this fix. |
| 2 | SBOX-02: Vessel type/speed controls and verdict banner restyled with shadcn/ui form primitives (Select, Slider, Card, Badge), identical classification results | VERIFIED | `ControlPanel.tsx` uses `Select`/`SelectTrigger`/`SelectContent`/`SelectItem` (from `@/components/ui/select`) and `Slider` (from `@/components/ui/slider`), calling the exact same `onVesselTypeChange`/`onVesselSpeedChange` callback contract (`ControlPanel.tsx:71,102`). `VerdictBanner.tsx` uses `Card`-equivalent styling + role badges deriving classification purely from `getVesselRole()`/`classification` — no domain logic touched. `ControlPanel.test.tsx` and `VerdictBanner.test.tsx` both exist and pass. |
| 3 | SBOX-03: Reasoning trail panel restyled (numbered steps, colored tags/dots, connecting line), same rule citations/facts, same order | VERIFIED | `ReasoningTrail.tsx` maps `classification.trail` directly in original array order (`trail.map((entry, index) => ...)`, `ReasoningTrail.tsx:128`), rendering `classification.trail.length` steps every time — never a hardcoded 3 (confirmed no hardcoded length anywhere in the file). Each step has a numbered/colored circle (`TONE_NUMBER_CLASSNAME`), a colored tag (`TONE_TAG_CLASSNAME`, `GEOMETRY`/`RULE N`/`VERDICT`/doubt-substituted `Rule 7` per D-08), and `entry.text`/`entry.facts` rendered unchanged (`FactReadout`). `ReasoningTrail.test.tsx` exists and passes. |
| 4 | SBOX-04: Existing Vitest/RTL tests exercising drag/control interactions pass after the shadcn/Radix primitive swap | VERIFIED | Full suite: `npx vitest run` → **196/196 tests passing, 32/32 test files**, executed directly by this verification (not taken from SUMMARY claims). `ControlPanel.test.tsx`/`SandboxContainer.test.tsx` both rewritten for the Radix `Select`/`Slider` interaction pattern (`findByRole`, keyboard-driven slider presses) per `08-03-SUMMARY.md`/`08-05-SUMMARY.md`. |
| 5 | SBOX-05: Sandbox layout responsive per design breakpoints (stacked single-column below 900px, stacked controls below 640px) | VERIFIED | `SandboxContainer.tsx:184,251` uses `min-[900px]:` variants (900px chart/reasoning 2-col collapse, matching Phase 7's registered `--breakpoint-hero: 900px`); `ControlPanel.tsx:127` uses Tailwind's default `sm:grid-cols-2` (640px) for the 2 vessel-control cards. Human UAT (`08-06-SUMMARY.md`) separately confirmed both breakpoints behave correctly in a real browser (jsdom cannot verify real breakpoint behavior). |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/globals.css` | 7 new `@theme` tokens (give-way/stand-on/mutual/rule-accent/doubt/geometry/chart-surface) | VERIFIED | All 7 registered in `@theme inline` + `:root` + `.dark` (lines 55-61, 106-112, 147-153), byte-identical dark-only values |
| `src/components/ui/select.tsx`, `slider.tsx`, `label.tsx` | shadcn primitives | VERIFIED | Present, imported by `ControlPanel.tsx` |
| `src/components/sandbox/chip-scenarios.ts` | 6 preset fixtures | VERIFIED | All 6 `ChipId`s defined with worked-math comments, verified against real `classifyEncounter()` in `chip-scenarios.test.ts` |
| `src/components/sandbox/vessel-role.ts` | Single-sourced role→style maps | VERIFIED | `ROLE_HULL_FILL_CLASS`/`ROLE_BADGE_TEXT`/`ROLE_BADGE_CLASSNAME` consumed by `ChartPanel.tsx`, `ControlPanel.tsx`, `VerdictBanner.tsx` — no duplicate local maps remain |
| `src/components/sandbox/ChartPanel.tsx` | Re-themed SVG chart | VERIFIED | Dark tokens applied; hit-testing preserved; CR-01 fixed |
| `src/components/sandbox/ControlPanel.tsx` | Restyled vessel-control cards | VERIFIED | Select/Slider/Card/Badge composition, role badge in header, read-only HEADING readout |
| `src/components/sandbox/VerdictBanner.tsx`, `InstrumentReadouts.tsx`, `ReasoningTrail.tsx` | 3-card split of former `ReasoningPanel.tsx` | VERIFIED | All 3 exist, each independently tested; `ReasoningPanel.tsx`/`.test.tsx` retired (not present on disk) |
| `src/components/sandbox/SandboxContainer.tsx` | Restyled container, chip row wiring | VERIFIED | Header/chip-row/grid restyled; `handleChipSelect` routes through the existing `applyVesselUpdate` choke point; CR-02 fixed (`activeChipId` no longer stale on `/s/[shareId]`) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `ChartPanel.tsx` | `vessel-role.ts` | `ROLE_HULL_FILL_CLASS[role]` on hull `<polygon>` | WIRED | Confirmed at `ChartPanel.tsx:247` |
| `ChartPanel.tsx` | `app/globals.css` | `bg-chart-surface`/`stroke-rule-accent`/`stroke-mutual` classes | WIRED | Confirmed at `ChartPanel.tsx:229,266,437` |
| `ControlPanel.tsx` | `vessel-role.ts` | `getVesselRole` + `ROLE_BADGE_TEXT`/`ROLE_BADGE_CLASSNAME` | WIRED | Confirmed at `ControlPanel.tsx:50,59-61` |
| `ControlPanel.tsx` | `src/components/ui/select.tsx` | `Select`/`SelectTrigger`/`SelectContent`/`SelectItem`/`SelectValue` | WIRED | Confirmed at `ControlPanel.tsx:6,71-82` |
| `VerdictBanner.tsx` | `reasoning-trail-tag.ts` | `classifyingEntryIndex`/`ruleNumber` for dynamic Rule badge | WIRED | Confirmed at `VerdictBanner.tsx:11,48-50` |
| `InstrumentReadouts.tsx` | `instrument-readouts.ts` | `deriveInstrumentReadouts(vesselA, vesselB)` | WIRED | Confirmed at `InstrumentReadouts.tsx:11,62` |
| `ReasoningTrail.tsx` | `reasoning-trail-tag.ts` | `classifyingEntryIndex`/`ruleNumber` per-step tag | WIRED | Confirmed at `ReasoningTrail.tsx:12,96-109` |
| `SandboxContainer.tsx` | `chip-scenarios.ts` | `CHIP_SCENARIOS`/`CHIP_ORDER` in `handleChipSelect` | WIRED | Confirmed at `SandboxContainer.tsx:23,174-181,232` |
| `SandboxContainer.tsx` | `VerdictBanner`/`InstrumentReadouts`/`ReasoningTrail` | direct composition | WIRED | Confirmed at `SandboxContainer.tsx:249,260-264,275-277` (layout order deviates from the original static `08-UI-SPEC.md` composition — see Notes) |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| `ChartPanel.tsx` | `vesselA`/`vesselB`/`classification` | Props from `SandboxContainer`'s live `applyVesselUpdate` state, never a static default | Yes | FLOWING |
| `InstrumentReadouts.tsx` | `rangeNm`/`bearingAtoBDegrees`/`cpaNm`/`tcpaMinutes` | `deriveInstrumentReadouts(vesselA, vesselB)` — real geometry calls (`relativeBearing()`/`cpa()`), not a static fallback | Yes | FLOWING |
| `ReasoningTrail.tsx` | `classification.trail` | Real `classifyEncounter()` output, propagated from `SandboxContainer`'s `lastGoodClassification` state | Yes | FLOWING |
| `VerdictBanner.tsx` | `classification`/`isDegenerate` | Same live state | Yes | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full Vitest suite passes | `npx vitest run` | 32 files / 196 tests passing | PASS |
| TypeScript compiles clean | `npm run typecheck` (`tsc --noEmit`) | No output, exit 0 | PASS |
| Production build succeeds | `npm run build` | Compiled successfully, static pages generated | PASS |
| CR-01 regression test (badge pointer-events) present and green | `ChartPanel.test.tsx:84-97` | Included in the 196-test run above | PASS |
| CR-02 regression test (stale chip highlight) present and green | `SandboxContainer.test.tsx:277-302` | Included in the 196-test run above | PASS |

### Probe Execution

Step 7c: SKIPPED — no `scripts/*/tests/probe-*.sh` convention or plan-declared probes exist for this phase; verification relies on the direct Vitest/typecheck/build runs above instead.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| SBOX-01 | 08-01, 08-02, 08-06 | Chart restyled dark, zero hit-testing regression, manual browser verify | SATISFIED | See Truth #1 above; CR-01 fix (`fb0ec8a`) confirmed in code + regression test + independent live-browser check documented in `08-REVIEW.md` |
| SBOX-02 | 08-01, 08-03, 08-04, 08-05 | Controls/verdict banner restyled with shadcn primitives, identical classification | SATISFIED | See Truth #2 above |
| SBOX-03 | 08-04 | Reasoning trail restyled, same content/order | SATISFIED | See Truth #3 above |
| SBOX-04 | 08-03, 08-04, 08-05 | Existing tests updated for Radix swap, still pass | SATISFIED | 196/196 passing, verified directly |
| SBOX-05 | 08-01, 08-05, 08-06 | Responsive per design breakpoints | SATISFIED | See Truth #5 above |

No orphaned requirements — REQUIREMENTS.md maps exactly SBOX-01..05 to Phase 8, and all 5 appear in at least one plan's `requirements:` frontmatter field (08-01, 08-02, 08-03, 08-04, 08-05, 08-06).

**Documentation note (non-blocking):** `.planning/REQUIREMENTS.md`'s checkboxes show SBOX-01 and SBOX-03 as `[ ]` (unchecked) while SBOX-02/04/05 show `[x]`. This is a stale-checkbox issue, not a functional gap — the same file also shows HERO-01 through HERO-04 as unchecked despite Phase 7 (Hero) being marked complete in `ROADMAP.md`, indicating this is a pre-existing, project-wide documentation-sync gap rather than something specific to this phase's execution. Both SBOX-01 and SBOX-03 are independently confirmed implemented and tested above. Recommend updating `REQUIREMENTS.md` checkboxes for Phase 7 and Phase 8 as a housekeeping follow-up.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `ChartPanel.tsx` | 38,55,114-116 | Raw hex literals (`GRID_STROKE`, `CROSSHAIR_STROKE`, `BEARING_LINE_DEFAULT_STROKE`, `DOUBT_STROKE`) remain as JS constants even though `--geometry`/`--doubt` tokens are now registered in `globals.css` | Info | Documented and deliberately deferred (`08-REVIEW.md` IN-01, `08-02-SUMMARY.md`) — required because these values are asserted directly via `getAttribute("stroke")` in `ChartPanel.test.tsx`, and Tailwind's `stroke-*` utility can't be read the same way. Values agree with the registered tokens today; a future retune of `--doubt`/`--geometry` would need a matching manual update here. Not a hidden regression, already tracked in the code review's Info-level findings with no user-facing impact. |
| `ControlPanel.tsx` | 34,44 | `heading` prop name (display title) collides with the vessel's own domain `heading` (compass number) in the same file | Info | `08-REVIEW.md` IN-02, deliberately deferred as a naming-clarity-only issue, zero behavior impact |
| `ControlPanel.tsx` | 71 | Unchecked `as VesselType` cast on Radix `Select`'s `onValueChange` | Info | `08-REVIEW.md` IN-03, provably safe today (every `SelectItem` value sourced from `VesselTypeSchema.options`), deliberately deferred |

No TBD/FIXME/XXX markers found in any file modified by this phase (`grep -rn "TBD\|FIXME\|XXX"` across `src/components/sandbox/` returns no matches for this phase's changed files). No Critical or unresolved Warning-severity findings remain — both Criticals (CR-01, CR-02) and 3 of 4 Warnings (WR-01, WR-02, WR-03, WR-04 — all 4 actually) from `08-REVIEW.md` are resolved and independently re-verified; only the three Info-level items above remain, all explicitly marked low-priority/no-impact by the original code review.

### Human Verification Required

None. The phase's one mandatory human-verify checkpoint (drag/rotate hit-testing + responsive breakpoints, `08-06-PLAN.md`) was already completed with a human "approved" verdict (`08-06-SUMMARY.md`). The one regression (CR-01) discovered by code review *after* that approval has since been independently closed via a numeric point-in-polygon check, a live-browser `elementFromPoint()` check, and a new automated regression test — all documented in `08-REVIEW.md`'s Resolution section and confirmed present in this verification pass. No further human action is required to close out Phase 8.

### Notes on Layout Deviation from the Written 08-UI-SPEC.md

`08-UI-SPEC.md`'s Layout section (written before the interactive UAT session) describes the 2-column grid's right column as containing Instrument-Readouts *then* Reasoning-Trail, with the 2 vessel-control cards in a separate full-width row below the grid. The actual, human-approved implementation (per UAT fix #6, `4b8afe8`, `08-06-SUMMARY.md`) instead places `ControlPanel` inside the right column (stacked under `InstrumentReadouts`) and moves `ReasoningTrail` to a full-width row below the entire grid. This was a deliberate, human-confirmed correction made mid-session against a freshly re-imported live Claude Design source (more authoritative than the static screenshot the original `08-UI-SPEC.md` was written from), not an unreviewed regression — the human tester explicitly approved this section-order change as part of the UAT pass. `08-UI-SPEC.md` itself was not subsequently updated to reflect this correction, which is a documentation-only gap (the spec file is now stale relative to the actual, approved implementation) — does not affect the phase goal, since the underlying content, headings, order-of-appearance top-to-bottom (Chart → Reasoning → Controls, matching D-06's stacking requirement), and responsive collapse behavior are all still correct and human-verified.

---

_Verified: 2026-07-19T02:10:00Z_
_Verifier: Claude (gsd-verifier)_
