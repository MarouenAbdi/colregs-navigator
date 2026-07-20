---
phase: 12-chartpanel-sandboxcontainer-decomposition-refactor
verified: 2026-07-20T09:09:37Z
status: passed
score: 8/8 must-haves verified
overrides_applied: 0
---

# Phase 12: ChartPanel/SandboxContainer Decomposition Refactor Verification Report

**Phase Goal:** `ChartPanel.tsx` and `SandboxContainer.tsx` are decomposed into focused,
single-concern modules following this project's established "split computation from
presentation" convention, with zero behavior change and zero hit-testing regression.
**Verified:** 2026-07-20T09:09:37Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | RFCT-01: ChartPanel.tsx's pure geometry constants, `wedgePath()`, `buildGridLineSegments()` live in `chart-panel-geometry.ts` | VERIFIED | `src/components/sandbox/chart-panel-geometry.ts` (168 lines) holds all ~35 constants + both functions; `grep "from \"react\""` returns 0 matches; `ChartPanel.tsx` imports only `CHART_VIEW_BOX`/`CONE_DEFAULT_STROKE`/`DOUBT_STROKE` from it, no inline `function wedgePath`/`buildGridLines` remain in ChartPanel.tsx |
| 2 | RFCT-02: per-render derivation lives in `deriveChartOverlayState()` in `chart-panel-derivation.ts` | VERIFIED | `chart-panel-derivation.ts` (125 lines) exports `ChartOverlayState` + `deriveChartOverlayState()`; zero React import; `ChartPanel.tsx` calls `deriveChartOverlayState(vesselA, vesselB, classification, containerSize, CHART_VIEW_BOX)` once (line 61) and destructures `overlay.*` at every JSX use site. D-01 dedup confirmed: `rangeNm` comes from `deriveInstrumentReadouts(vesselA, vesselB).rangeNm` (line 75); `grep "Math.hypot"` in this file returns 0 matches |
| 3 | RFCT-03: decorative chart chrome lives in `ChartBackdrop.tsx`; resize observation lives in `useContainerSize()` | VERIFIED | `ChartBackdrop.tsx` (91 lines) renders the fine-grid `<defs>`, gridlines (via `buildGridLineSegments().map()`), range rings, crosshair, "N" label; `grep "onPointer"`/`grep "useState\|useEffect"` both return 0 matches (purely presentational, as required). `useContainerSize.ts` (32 lines) owns `containerRef`/`containerSize`/`ResizeObserver` effect; `ChartPanel.tsx` calls `const { containerRef, containerSize } = useContainerSize()` (line 38) and renders `<ChartBackdrop containerSize=... chartCenter=... innerRingRadiusPx=... outerRingRadiusPx=... />` (lines 86–91) |
| 4 | RFCT-04: SandboxContainer.tsx's state machine lives in `useSandboxState()`, preserving Rule 13(d) hysteresis exactly | VERIFIED | `hooks/useSandboxState.ts` (208 lines) contains `previousEncounterTypeRef`, the exact `applyVesselUpdate` choke point (VesselSchema validation → classifyEncounter → hysteresis-respecting branch), the Pitfall-5 degenerate-frame comment preserved verbatim, all 4 `onVesselXChange` handlers, `handleReset`, `handleChipSelect`, `handleSave`. `SandboxContainer.tsx` calls `useSandboxState(initialScenario)` once (line 27) and has zero inline state/business logic — `grep "function applyVesselUpdate" SandboxContainer.tsx` returns no matches |
| 5 | RFCT-05: `VesselGroup.tsx` extracted as one atomic, byte-for-byte unit | VERIFIED | `VesselGroup.tsx` (161 lines) exports `VesselGroupProps`/`VesselGroup`; git diff against pre-phase-12 `ChartPanel.tsx` confirms the JSX region (stalk, hull polygon w/ `data-testid="hull-hit-*"`, rotate-handle circle w/ `data-testid="rotate-hit-*"`, badge overlay `<g pointerEvents="none">`) moved with every Phase-4/Phase-8 regression comment intact, same sibling order (rotating group first, non-rotating badge group second) |
| 6 | RFCT-06: zero hit-testing regression after VesselGroup extraction | VERIFIED | `ChartPanel.test.tsx` contains both the pre-existing `pointerEvents="none"` regression test (unmodified, passing) and the new DOM-order test (`compareDocumentPosition & DOCUMENT_POSITION_PRECEDING`) confirming the rotating group precedes the non-rotating badge group — both pass under `npx vitest run`. Per 12-04-SUMMARY.md, a human real-browser drag/rotate pass for both vessels at heading 0 was completed as a blocking checkpoint during execution and returned "approved" — this verifier cannot re-run that live-browser session, but the automated regression net it was layered on top of is confirmed green |
| 7 | RFCT-07: both files land under the ~150-200 line convention | VERIFIED | `wc -l`: `ChartPanel.tsx` = 176 lines, `SandboxContainer.tsx` = 147 lines — both under 200 |
| 8 | RFCT-08: all existing tests continue passing, updated only for import-path changes | VERIFIED | `npx vitest run` → 216/216 tests, 38/38 files passed (includes unmodified `ChartPanel.test.tsx` 4 pre-existing assertions + 1 new DOM-order test, unmodified `SandboxContainer.test.tsx` 13/13 tests, plus 2 new dedicated test files for the new pure modules per D-02) |

**Score:** 8/8 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/sandbox/chart-panel-geometry.ts` | pure constants + `wedgePath()` + `buildGridLineSegments()`, zero JSX | VERIFIED | 168 lines, no `react` import, exports confirmed |
| `src/components/sandbox/chart-panel-geometry.test.ts` | numeric-fixture unit tests | VERIFIED | tests `wedgePath()` arc-path output and `buildGridLineSegments()` segment count/values, passes |
| `src/components/sandbox/chart-panel-derivation.ts` | `deriveChartOverlayState()` | VERIFIED | 125 lines, D-01 dedup wired, zero JSX |
| `src/components/sandbox/chart-panel-derivation.test.ts` | fixture-based tests reusing the 3 named fixtures | VERIFIED | 3 `it()` blocks covering doubt-boundary styling + D-01 dedup assertion, passes |
| `src/components/sandbox/ChartBackdrop.tsx` | decorative chrome, zero pointer handlers/state | VERIFIED | 91 lines, confirmed zero `onPointer*`, zero `useState`/`useEffect` |
| `src/components/sandbox/hooks/useContainerSize.ts` | `{ containerRef, containerSize }` | VERIFIED | 32 lines, `ResizeObserver` effect intact |
| `src/components/sandbox/hooks/useSandboxState.ts` | state machine hook | VERIFIED | 208 lines, exact locked return shape, hysteresis/Pitfall-5 comments preserved |
| `src/components/sandbox/VesselGroup.tsx` | hull/rotate-handle/badge presentation + hit-testing wiring | VERIFIED | 161 lines, exports confirmed, both regression-fix comment blocks present verbatim |
| `src/components/sandbox/ChartPanel.tsx` | thinned composition root | VERIFIED | 176 lines, wires all 5 new modules |
| `src/components/sandbox/SandboxContainer.tsx` | thinned composition root | VERIFIED | 147 lines, single `useSandboxState()` call + JSX only |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `ChartPanel.tsx` | `chart-panel-geometry.ts` | `import { CHART_VIEW_BOX, CONE_DEFAULT_STROKE, DOUBT_STROKE } from "./chart-panel-geometry.js"` | WIRED | Confirmed in file, line 22-26 |
| `ChartPanel.tsx` | `chart-panel-derivation.ts` | `deriveChartOverlayState(...)` call | WIRED | Confirmed, line 61; result destructured and used at every JSX site |
| `chart-panel-derivation.ts` | `instrument-readouts.ts` | `deriveInstrumentReadouts(vesselA, vesselB).rangeNm` | WIRED | Confirmed, line 75; test asserts equality (chart-panel-derivation.test.ts line 48) |
| `ChartPanel.tsx` | `hooks/useContainerSize.ts` | `const { containerRef, containerSize } = useContainerSize()` | WIRED | Confirmed, line 38 |
| `ChartPanel.tsx` | `ChartBackdrop.tsx` | `<ChartBackdrop containerSize=... chartCenter=... innerRingRadiusPx=... outerRingRadiusPx=... />` | WIRED | Confirmed, lines 86-91 |
| `ChartPanel.tsx` | `VesselGroup.tsx` | `<VesselGroup label=... vessel=... screen=... role=... hullDrag=... rotateDrag=... />` (×2) | WIRED | Confirmed, lines 143-158, both vessels |
| `VesselGroup.tsx` | `hooks/useHullDrag.ts` / `useRotateHandleDrag.ts` | `hullDrag.onPointerDown/Move/Up`, `rotateDrag.onPointerDown/Move/Up` attached directly to hull polygon/rotate circle | WIRED | Confirmed, lines 80-82, 102-104; hooks themselves untouched (Anti-Pattern 4 avoided) |
| `SandboxContainer.tsx` | `hooks/useSandboxState.ts` | `const sandboxState = useSandboxState(initialScenario)` | WIRED | Confirmed, line 27; all downstream `sandboxState.*` references present |
| `hooks/useSandboxState.ts` | `domain/colregs/classify-encounter.ts` | `classifyEncounter(nextA, nextB, previousEncounterTypeRef.current)` inside `applyVesselUpdate` | WIRED | Confirmed, line 120, hysteresis ref read/write preserved exactly |

### Anti-Patterns Checked (ARCHITECTURE.md's 4 named risks)

| Anti-Pattern | Check | Result |
|---|---|---|
| 1. Padded invisible hit-shape reintroduced | Pointer handlers attach directly to the visible, solid-filled hull `<polygon>`/rotate `<circle>` in `VesselGroup.tsx` | AVOIDED — confirmed, no separate invisible hit-shape found |
| 2. `pointerEvents="none"` lost during cleanup | `grep -c 'pointerEvents="none"'` in `VesselGroup.tsx` | AVOIDED — attribute present on the correct (second/last) sibling group; DOM-order test asserts this directly; a second grep match is inside a preserved comment (not a functional regression, confirmed in 12-04-SUMMARY.md's own deviation note and independently verified by reading the file) |
| 3. Geometry module returning JSX | `chart-panel-geometry.ts` / `chart-panel-derivation.ts` React import check | AVOIDED — both files confirmed zero `react` import, zero JSX |
| 4. Re-extracting already-extracted hit-testing hooks | `useHullDrag.ts`/`useRotateHandleDrag.ts` diff | AVOIDED — both hooks confirmed untouched by this phase (not in any plan's `files_modified`, content unchanged) |

### Behavioral Spot-Checks / Full Verification Suite

| Check | Command | Result | Status |
|---|---|---|---|
| Full test suite | `npx vitest run` | 216/216 tests passed, 38/38 files | PASS |
| Type check | `npx tsc --noEmit` | exit 0 | PASS |
| Lint | `npx eslint .` | 0 errors, 3 pre-existing unrelated `max-lines` warnings (domain/colregs files, not touched by this phase) | PASS |
| File-length gate | `wc -l ChartPanel.tsx` / `wc -l SandboxContainer.tsx` | 176 / 147 | PASS (both under 200) |
| `SandboxContainer.test.tsx` unmodified test count | `grep -c "  it(" SandboxContainer.test.tsx` | 13 (matches pre-refactor count) | PASS |
| Commit integrity | All 11 task-commit hashes referenced across the 4 SUMMARY.md files | all found in `git log --oneline --all` | PASS |
| No debt markers introduced | `grep -E "TBD\|FIXME\|XXX\|TODO\|HACK\|PLACEHOLDER"` across all 8 touched/created files | 0 matches | PASS |
| Out-of-scope `ChipRow.tsx` not created | `ls src/components/sandbox/ChipRow.tsx` | absent (correctly deferred, RFCT-V2-01) | PASS |
| Git working tree clean | `git status --short` | empty | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| RFCT-01 | 12-01 | Pure geometry extracted to `chart-panel-geometry.ts` | SATISFIED | See Truth #1 |
| RFCT-02 | 12-01 | Per-render derivation extracted to `chart-panel-derivation.ts` | SATISFIED | See Truth #2 |
| RFCT-03 | 12-03 | Decorative chrome + resize observation extracted | SATISFIED | See Truth #3 |
| RFCT-04 | 12-02 | State machine extracted to `useSandboxState()`, hysteresis preserved | SATISFIED | See Truth #4 |
| RFCT-05 | 12-04 | `VesselGroup.tsx` extracted atomically, byte-for-byte | SATISFIED | See Truth #5 |
| RFCT-06 | 12-04 | Zero hit-testing regression, automated + human verified | SATISFIED | See Truth #6 (automated proxies independently re-run and green; human sign-off recorded during execution, not independently re-verifiable post-hoc) |
| RFCT-07 | 12-02/12-04 | Both files under ~150-200 lines | SATISFIED | See Truth #7 |
| RFCT-08 | all 4 plans | Existing suite passes with import-path-only changes | SATISFIED | See Truth #8 |

**Note (documentation sync, non-blocking):** `.planning/REQUIREMENTS.md`'s checkbox list and Traceability table for RFCT-01 through RFCT-08 still show `[ ]`/"Pending" as of this verification pass, even though `.planning/ROADMAP.md`'s Phase 12 entry is already marked `[x]` complete and all 4 plan SUMMARY.md files report `requirements-completed`. This is a requirements-doc bookkeeping gap, not a code/behavior gap — flagging for the milestone-close step to reconcile, not treated as a phase-blocking finding here.

### Anti-Patterns Found

None. No debt markers (`TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER`) in any file created or modified by this phase. No stub returns, no empty handlers, no hardcoded-empty props introduced.

### Human Verification Required

None outstanding for this verification pass. RFCT-06's real-browser drag/rotate check was a blocking `checkpoint:human-verify` gate that was already executed and approved during Plan 12-04's execution (recorded in `12-04-SUMMARY.md`: "Human confirmed in a real browser... no dead zones"). This verifier cannot re-run that live session, but has independently re-verified the automated regression net (pointerEvents test + new DOM-order test) it was gated alongside, and both are green.

### Gaps Summary

No gaps found. All 8 RFCT requirements are fully and verifiably met in the current codebase, not merely claimed in SUMMARY.md text:

- Both target files (`ChartPanel.tsx` 176 lines, `SandboxContainer.tsx` 147 lines) are thinned composition roots under the project's line-count convention.
- Six new modules exist with real, substantive content (not stubs): `chart-panel-geometry.ts`, `chart-panel-derivation.ts`, `ChartBackdrop.tsx`, `hooks/useContainerSize.ts`, `hooks/useSandboxState.ts`, `VesselGroup.tsx` — each independently confirmed wired into its consumer via import + call-site/JSX-usage grep, not merely present on disk.
- The two historically regression-prone invariants (visible-shape-only hit-testing, `pointerEvents="none"` on the badge overlay with correct sibling order) are intact, both defended by passing automated tests.
- The opportunistic D-01 `rangeNm` dedup landed as planned and is asserted by a dedicated test.
- Zero behavior change: public prop contracts (`types.ts`) unchanged, full 216-test suite green, `tsc`/`eslint` clean, no domain-logic files touched.
- All commit hashes referenced in the 4 SUMMARY.md files exist in git history; git working tree is clean on the correct phase branch.

---

*Verified: 2026-07-20T09:09:37Z*
*Verifier: Claude (gsd-verifier)*
