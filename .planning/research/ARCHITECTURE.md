# Architecture Research: ChartPanel.tsx / SandboxContainer.tsx Decomposition

**Domain:** Internal refactor (v1.2 Tech Debt & Stabilization) — no new features, no behavior change
**Researched:** 2026-07-19
**Confidence:** HIGH (based on direct inspection of the two target files, their existing test suites, the two already-extracted hooks, and the two prior successful applications of this project's own split convention — `hero-preview-geometry.ts` and `static-chart-geometry.ts`)

> Note: this file supersedes the v1.1 `ARCHITECTURE.md` (2026-07-18, shadcn/ui folder-boundary focus) for the current research question. The v1.1 file's high-level `src/components/` layout (feature-first folders: `sandbox/`, `hero/`, `gallery/`, `shared/`, `ui/`) remains accurate and untouched by this milestone — this file covers the v1.2-specific question: how to split the two outlier files (`ChartPanel.tsx` 560 lines, `SandboxContainer.tsx` 280 lines) *within* the existing `src/components/sandbox/` folder, following the project's own "split computation from presentation" convention, without changing runtime behavior or reintroducing either of the two documented SVG hit-testing regressions.

## Current State

### ChartPanel.tsx (560 lines) — what it actually contains today

| Region (approx. lines) | Content | Nature |
|---|---|---|
| 32–123 | ~35 layout/color constants (viewBox, grid, hull geometry, badge offsets, rotate-handle geometry, cone/bearing colors) | Pure, framework-free |
| 129–154 | `wedgePath()` — bearing→SVG-arc-path pure function | Pure, framework-free |
| 156–194 | `buildGridLines()` — returns `React.ReactNode[]` | Mixed (geometry math + JSX) |
| 196–326 | `VesselGroup` component + `VesselGroupProps` — hull polygon, rotate-handle circle, letter/badge overlay, all pointer-handler wiring | Presentation + hit-testing wiring |
| 328–367 | `ChartPanel` body: `containerRef`/`containerSize` state + `ResizeObserver` effect, then 4 `useHullDrag`/`useRotateHandleDrag` calls | Hook orchestration (already delegates the actual hit-testing logic) |
| 368–430 | Per-render derivation: `screenA/B`, `chartCenter`, ring radii, `roleA/B`, bearing-doubt styling, `rangeNm`, `bearingMidpoint`, `doubtVessel` resolution (`resolveDoubtGeometry`), `conePathA/B` | Pure data derivation, buried in component body |
| 432–560 | JSX: `<svg>` with fine-grid `<defs>`, background, grid lines, range rings, crosshair, "N" label, cones, bearing line, range tooltip, two `<VesselGroup>`, scale-bar legend | Presentation |

**Already extracted (and this IS the intended pattern):** `src/components/sandbox/hooks/useHullDrag.ts` and `useRotateHandleDrag.ts` already hold 100% of the actual pointer-capture / hit-testing *logic* (`onPointerDown`/`onPointerMove`/`onPointerUp`, `setPointerCapture`, `screenToChart`, `bearing()`), each with its own dedicated test file (`useHullDrag.test.ts`, `useRotateHandleDrag.test.ts`). ChartPanel.tsx only *consumes* these hooks' `DragHandlers` return value and wires it onto JSX elements inside `VesselGroup`. **The riskiest code (the event-handling logic itself) is already isolated and already tested in its own module** — what's left unextracted is (a) the pure geometry/constants surrounding it, (b) the per-render derivation, (c) the decorative chrome, and (d) the JSX *wiring* of `DragHandlers` onto the hull/rotate-handle elements (`VesselGroup` itself, still inline in ChartPanel.tsx).

### SandboxContainer.tsx (280 lines) — what it actually contains today

| Region (approx. lines) | Content | Nature |
|---|---|---|
| 41–100 | `useRouter`, `trpc.scenario.create.useMutation`, seed resolution (`initialScenario` vs. default fixture), `vesselA/B` state, lazy-initialized `lastGoodClassification`, `isDegenerate`, `activeChipId` | State wiring |
| 96–100 | `previousEncounterTypeRef` (Rule 13(d) hysteresis) | State wiring |
| 108–181 | `applyVesselUpdate` (the single validate→classify choke point) + 4 `onVesselXChange` handlers + `handleReset` + `handleChipSelect` | Domain-call logic buried in component body |
| 183–280 | JSX: header (title/copy/Save+Reset buttons/save-error/banner), chip-preset button row, `VerdictBanner`, grid of `ChartPanel`/`InstrumentReadouts`/`ControlPanel`, `ReasoningTrail` | Presentation/composition |

This file has no SVG/pointer-event code at all — its "computation mixed with markup" is `applyVesselUpdate` and its five call sites (domain calls: `VesselSchema.safeParse`, `classifyEncounter`) sitting inside the same function body as ~100 lines of JSX composition. `chip-scenarios.ts` (data) is already correctly extracted; the state-machine around it is not.

## Precedent: the two already-successful applications of this project's split convention

| File | What was extracted | Consumer(s) |
|---|---|---|
| `src/components/hero/hero-preview-geometry.ts` | Constants + `bearingSectorPath()` — zero JSX, zero React import | `HeroPreviewCard.tsx` |
| `src/components/shared/static-chart-geometry.ts` | `HULL_PATH`/stroke constants, `headingVectorEndpoint()`, `midpoint()` — extracted from the Hero module once Gallery became a real second consumer (per CLAUDE.md's "extract only on a real second consumer" rule) | `HeroPreviewCard.tsx`, Gallery mini-chart |

Both are **pure, framework-free modules with zero JSX** — this is the bar `chart-panel-geometry.ts` (below) must clear to be a faithful application of the same convention, which is why `buildGridLines()`'s current `React.ReactNode[]` return type cannot move over unchanged — it must be re-shaped into plain data first (see Extraction 1).

## Critical constraint: the two documented hit-testing regressions

Both are recorded in `.planning/PROJECT.md` → Key Decisions, and both live entirely inside the JSX region that will become `VesselGroup.tsx`:

1. **"SVG drag/rotate hit-targets must hit-test the actual visible shape, not a padded invisible proxy"** (Phase 4, commits `3bf6f24`, `f559e98`). Fix: `onPointerDown/Move/Up` attach directly to the visible, solid-filled hull `<polygon>` and rotate-handle `<circle>` — SVG's default `pointer-events: visiblePainted` then hit-tests the real painted area. No separate invisible padded hit-shape exists anywhere in the current code — do not reintroduce one during extraction.
2. **"Decorative overlays layered on top of an interactive shape need explicit `pointer-events: none`"** (Phase 8, commit `fb0ec8a`). Fix: the non-rotating letter/badge `<g pointerEvents="none">` sibling group. This was caught by automated point-in-polygon code review, *not* manual UAT — a ~45px² dead zone at heading 0 is not visually obvious. **This is exactly the kind of silent regression a careless copy-paste during a refactor could reintroduce** if `pointerEvents="none"` is dropped, or if the badge group is reordered to render *before* the hull polygon in a future paint-order change.

Any extraction touching `VesselGroup`'s JSX must be a byte-for-byte structural move: same sibling order (rotating `<g transform="rotate(...)">` before the non-rotating `<g pointerEvents="none">`), same `pointerEvents="none"` attribute, same direct attachment of handlers to the polygon/circle. This is why it is sequenced **last**, done as a pure cut-and-paste, and re-verified against the existing dedicated regression test (`ChartPanel.test.tsx`: *"gives the decorative letter/role-badge overlay pointer-events:none so it never shadows the hull's own drag hit-target underneath it"*).

## Target Decomposition

### New files (ChartPanel.tsx)

| New file | Contents (moved from ChartPanel.tsx) | Risk |
|---|---|---|
| `src/components/sandbox/chart-panel-geometry.ts` | All ~35 constants (lines 32–123); `wedgePath()` (129–154) verbatim; `buildGridLines()` renamed to `buildGridLineSegments()` and re-typed to return plain data (see below) | **Zero** — pure, no JSX, no React import, mirrors `hero-preview-geometry.ts` exactly |
| `src/components/sandbox/chart-panel-derivation.ts` | New `deriveChartOverlayState()` — moves the per-render derivation block (368–430: `screenA/B`, `chartCenter`, ring radii, `roleA/B`, bearing-doubt styling, `rangeNm`, `bearingMidpoint`, `doubtVessel`, `conePathA/B`) out of the component body | **Zero pointer-event risk** — no DOM/SVG, calls only `chartToScreen`, `getVesselRole`, `resolveDoubtGeometry`, `wedgePath` — same shape as the already-existing `deriveInstrumentReadouts()` in this same folder |
| `src/components/sandbox/ChartBackdrop.tsx` | Static chrome JSX (432–480ish: `<defs>` fine-grid pattern, background rect, grid lines, range rings, crosshair, "N" label) | **Low** — none of this JSX carries a pointer handler today; pure decorative move, no logic change |
| `src/components/sandbox/hooks/useContainerSize.ts` | `containerRef`/`containerSize` state + `ResizeObserver` effect (335–349) | **Zero** — unrelated to pointer/hit-testing, a resize-observation concern only |
| `src/components/sandbox/VesselGroup.tsx` | `VesselGroup` component + `VesselGroupProps` (196–326), moved **verbatim** | **Medium** — this is the file containing both documented regression classes; see constraint above. Do last. |

### New files (SandboxContainer.tsx)

| New file | Contents (moved from SandboxContainer.tsx) | Risk |
|---|---|---|
| `src/components/sandbox/hooks/useSandboxState.ts` | `useState`/`useRef`/`useRouter`/`trpc` mutation wiring, `applyVesselUpdate`, the 4 `onVesselXChange` handlers, `handleReset`, `handleChipSelect`, save-mutation handling (108–181, plus 41–100's state setup) | **Zero SVG/pointer risk** — no chart code at all. Must preserve `previousEncounterTypeRef` hysteresis semantics exactly (Rule 13(d)) |
| `src/components/sandbox/ChipRow.tsx` *(optional secondary cleanup)* | The chip-button-row JSX (231–247) | **Zero** — decorative `onClick`-only map, no drag/pointer surface |

Not recommended: don't extract the header/title/Save+Reset-button JSX into its own file unless it later grows — at ~40 lines it's not a length problem and CLAUDE.md's "don't pre-abstract" convention argues against a speculative split here.

## Integration Points (exact signatures)

```typescript
// chart-panel-geometry.ts — pure, zero React import
export function wedgePath(
  center: { screenX: number; screenY: number },
  radiusPx: number,
  startBearingDeg: number,
  endBearingDeg: number,
): string; // unchanged signature, move only

export function buildGridLineSegments(
  containerSize: ContainerSize,
  viewBox: ChartViewBox,
): Array<{ key: string; x1: number; y1: number; x2: number; y2: number }>;
// RENAMED from buildGridLines(); return type changes from React.ReactNode[]
// to plain data — ChartPanel.tsx (or ChartBackdrop.tsx, see below) keeps a
// 4-line .map() that turns each segment into a <line stroke={GRID_STROKE}
// .../>. This is the only way to keep the module JSX-free (matching
// hero-preview-geometry.ts / static-chart-geometry.ts precedent) while
// keeping rendered output pixel-identical.

// chart-panel-derivation.ts — pure, calls domain fns only (no DOM/SVG)
export interface ChartOverlayState {
  screenA: { screenX: number; screenY: number };
  screenB: { screenX: number; screenY: number };
  chartCenter: { screenX: number; screenY: number };
  innerRingRadiusPx: number;
  outerRingRadiusPx: number;
  roleA: VesselRole;
  roleB: VesselRole;
  bearingStroke: string;
  bearingDashArray: string | undefined;
  rangeNm: number;
  bearingMidpoint: { screenX: number; screenY: number };
  doubtVessel: VesselLabel | null;
  conePathA: string;
  conePathB: string;
}
export function deriveChartOverlayState(
  vesselA: Vessel,
  vesselB: Vessel,
  classification: ClassificationResult,
  containerSize: ContainerSize,
  viewBox: ChartViewBox,
): ChartOverlayState;

// VesselGroup.tsx — moved verbatim, signature unchanged
export interface VesselGroupProps {
  label: VesselLabel;
  vessel: Vessel;
  screen: { screenX: number; screenY: number };
  role: VesselRole;
  hullDrag: DragHandlers;   // from ./hooks/useHullDrag.js, unchanged
  rotateDrag: DragHandlers; // from ./hooks/useRotateHandleDrag.js, unchanged
}
export function VesselGroup(props: VesselGroupProps): JSX.Element;

// ChartBackdrop.tsx — new, presentational only, no pointer handlers
export interface ChartBackdropProps {
  containerSize: ContainerSize;
  chartCenter: { screenX: number; screenY: number };
  innerRingRadiusPx: number;
  outerRingRadiusPx: number;
}

// hooks/useContainerSize.ts — new
export function useContainerSize(): {
  containerRef: React.RefObject<HTMLDivElement>;
  containerSize: ContainerSize | null;
};

// hooks/useSandboxState.ts — new (SandboxContainer's "brain")
export function useSandboxState(initialScenario?: { vesselA: Vessel; vesselB: Vessel }): {
  vesselA: Vessel;
  vesselB: Vessel;
  lastGoodClassification: ClassificationResult;
  isDegenerate: boolean;
  activeChipId: ChipId | null;
  saveError: string | null;
  isSaving: boolean; // was createScenario.isPending
  onVesselPositionChange: (vessel: VesselLabel, position: Position) => void;
  onVesselHeadingChange: (vessel: VesselLabel, heading: number) => void;
  onVesselSpeedChange: (vessel: VesselLabel, speed: number) => void;
  onVesselTypeChange: (vessel: VesselLabel, type: VesselType) => void;
  handleReset: () => void;
  handleChipSelect: (chipId: ChipId) => void;
  handleSave: () => void; // was the inline createScenario.mutate({vesselA, vesselB}) call
};
```

**Opportunistic, zero-risk dedup found during this research** (not required, but worth doing in the same pass as Extraction 2 since it touches the exact code being moved anyway): ChartPanel.tsx's `rangeNm` (`Math.hypot(...)`, line 395–398) duplicates the identical formula already computed by `instrument-readouts.ts`'s `deriveInstrumentReadouts()`. `deriveChartOverlayState()` can call `deriveInstrumentReadouts(vesselA, vesselB).rangeNm` instead of recomputing — same value, same formula, one fewer independently-maintained copy of the same math (the same class of duplication `vessel-role.ts`'s own comment already calls out as a prior bug source in this codebase).

## Extraction Order (low-risk → high-risk, each gated by tests)

| # | Extraction | File(s) | Risk | Regression gate |
|---|---|---|---|---|
| 0 | Baseline | — | — | Run `ChartPanel.test.tsx`, `SandboxContainer.test.tsx`, `useHullDrag.test.ts`, `useRotateHandleDrag.test.ts` green *before* touching anything — this is the regression net every later step is checked against |
| 1 | Pure geometry/constants | `chart-panel-geometry.ts` | Zero | `ChartPanel.test.tsx` passes unmodified; add `chart-panel-geometry.test.ts` for `wedgePath()`/`buildGridLineSegments()` (trivial numeric-fixture unit tests, same style as domain geometry tests) |
| 2 | Overlay-state derivation | `chart-panel-derivation.ts` | Zero (no DOM/pointer code) | `ChartPanel.test.tsx` passes unmodified (its 3 doubt-styling assertions exercise this derivation indirectly); optionally add `chart-panel-derivation.test.ts` using the same 3 fixtures already imported by `ChartPanel.test.tsx` (`crossingResidualBasicCase`, `headOnBoundaryInclusiveCase`, `doubtBandNearOvertakingBoundaryCase`) |
| 2b | (parallel, independent) State-machine hook | `hooks/useSandboxState.ts` | Zero (no SVG/pointer code) | `SandboxContainer.test.tsx` passes unmodified — it renders `<SandboxContainer/>` end-to-end and doesn't care whether state logic lives inline or in a hook |
| 3 | Container-size hook | `hooks/useContainerSize.ts` | Zero | `ChartPanel.test.tsx`'s `MockResizeObserver` setup keeps working unmodified |
| 4 | Decorative chart chrome | `ChartBackdrop.tsx` | Low | `ChartPanel.test.tsx` passes unmodified (grid/rings/crosshair aren't asserted on directly, but nothing in this JSX has pointer handlers to regress) |
| 4b | (optional) Chip row | `ChipRow.tsx` | Low | `SandboxContainer.test.tsx`'s chip-select assertions pass unmodified |
| 5 | **VesselGroup (do last, most carefully)** | `VesselGroup.tsx` | **Medium — the two documented regression classes both live here** | Verbatim cut-paste only (no reformatting, no reordering of the rotating vs. non-rotating `<g>` siblings, no dropping `pointerEvents="none"`). Rerun `ChartPanel.test.tsx` unmodified, in particular its pointer-events:none regression test. Consider adding one new DOM-order assertion (rotating `<g transform="rotate(...)">` is a preceding sibling of the non-rotating `<g pointerEvents="none">` group) as belt-and-suspenders on top of the existing check. `useHullDrag.test.ts`/`useRotateHandleDrag.test.ts` are untouched since the hooks themselves don't move. |

Steps 1–4b have no ordering dependency on each other and can be done in any order or combined into one PR; step 5 must come after (or in a separate, reviewed-alone commit from) all of them, since it is the only step touching the regression-prone DOM structure.

## Expected File-Size Outcome

| File | Before | After (estimate) |
|---|---|---|
| `ChartPanel.tsx` | 560 lines | ~120–150 lines (container-size hook call, `deriveChartOverlayState()` call, 4 drag-hook calls, `<svg>` composing `<ChartBackdrop>` + cones + bearing line + range tooltip + 2× `<VesselGroup>` + scale-bar legend) |
| `SandboxContainer.tsx` | 280 lines | ~110–140 lines (one `useSandboxState()` call + JSX composition only) |

Both land comfortably under the ~150–200 line convention threshold without needing every optional secondary split (`ChipRow.tsx` is nice-to-have, not required to hit the target).

## Anti-Patterns to Avoid During This Refactor

### Anti-Pattern 1: Reintroducing a padded invisible hit-shape
**What people do:** "Simplify" the hull/rotate-handle hit-testing by adding a separate larger invisible `<rect>`/`<circle>` sized independently from the visible shape, reasoning it'll be "easier to test."
**Why it's wrong:** This is precisely the pre-Phase-4 bug (Key Decisions table) — two independently-sized invisible hit-shapes whose boundaries never matched what the user saw or each other.
**Do this instead:** Keep pointer handlers on the visible, solid-filled shape itself (`pointer-events: visiblePainted`), exactly as today.

### Anti-Pattern 2: Losing `pointerEvents="none"` during a "cleanup" pass
**What people do:** While moving `VesselGroup` to its own file, a linter-driven or formatter-driven pass drops an attribute that "looks unused" or reorders JSX groups for readability.
**Why it's wrong:** This is precisely the Phase 8 bug — the badge overlay group's `pointerEvents="none"` is load-bearing, not decorative, and was invisible to manual UAT (only caught by an automated point-in-polygon code review).
**Do this instead:** Treat `VesselGroup.tsx`'s extraction as a pure, mechanical cut-and-paste with no simplification, and re-run `ChartPanel.test.tsx`'s dedicated regression test immediately after.

### Anti-Pattern 3: Making `chart-panel-geometry.ts` return JSX
**What people do:** Move `buildGridLines()` over unchanged (still returning `React.ReactNode[]`), reasoning "it's still just constants + one helper."
**Why it's wrong:** Violates the project's own convention bar, which both prior successful applications (`hero-preview-geometry.ts`, `static-chart-geometry.ts`) meet by having zero JSX/React imports — a "pure geometry module" that imports `react` and returns elements isn't actually pure, and can't be unit-tested with plain numeric assertions the way the rest of the module can.
**Do this instead:** Return plain data (`buildGridLineSegments()`) and let the (thin) presentation layer map it to `<line>` elements.

### Anti-Pattern 4: Extracting hit-testing logic a second time
**What people do:** Assume `useHullDrag`/`useRotateHandleDrag` still need to be pulled out of ChartPanel.tsx as part of this milestone.
**Why it's wrong:** They're already extracted, already tested in isolation (`useHullDrag.test.ts`, `useRotateHandleDrag.test.ts`), and already follow this exact convention. Re-touching them isn't needed and only adds regression surface to a milestone whose locked decision is "no domain logic changes."
**Do this instead:** Leave both hook files untouched; the only remaining Sandbox hit-testing-adjacent work is moving the JSX that *consumes* their output (`VesselGroup`), not the hooks themselves.

## Sources

- Direct inspection: `src/components/sandbox/ChartPanel.tsx`, `SandboxContainer.tsx`, `ChartPanel.test.tsx`, `SandboxContainer.test.tsx` (HIGH confidence — read in full)
- Direct inspection: `src/components/sandbox/hooks/useHullDrag.ts`, `useRotateHandleDrag.ts`, `useHullDrag.test.ts`, `useRotateHandleDrag.test.ts` (confirms these are already-extracted, already-tested precedent for the "hit-testing last, most carefully" step)
- Direct inspection: `src/components/sandbox/instrument-readouts.ts`, `vessel-role.ts`, `types.ts`, `chip-scenarios.ts` (existing shared/derivation modules this decomposition should reuse, not duplicate)
- Direct inspection: `src/components/hero/hero-preview-geometry.ts`, `src/components/shared/static-chart-geometry.ts` (the two prior successful applications of this exact split convention — used as the structural template for `chart-panel-geometry.ts`)
- `.planning/PROJECT.md` Key Decisions table — both documented hit-testing regressions (Phase 4 commits `3bf6f24`/`f559e98`; Phase 8 commit `fb0ec8a`) and the CLAUDE.md-sourced "split computation from presentation" convention (established Phase 7)

---
*Architecture research for: v1.2 Tech Debt & Stabilization — ChartPanel.tsx / SandboxContainer.tsx decomposition*
*Researched: 2026-07-19*
