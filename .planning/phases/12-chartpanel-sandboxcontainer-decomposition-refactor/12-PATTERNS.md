# Phase 12: ChartPanel/SandboxContainer Decomposition Refactor - Pattern Map

**Mapped:** 2026-07-20
**Files analyzed:** 8 (6 new files + 2 modified files)
**Analogs found:** 8 / 8

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/components/sandbox/chart-panel-geometry.ts` | utility (pure geometry) | transform | `src/components/hero/hero-preview-geometry.ts` | exact |
| `src/components/sandbox/chart-panel-derivation.ts` | utility (pure derivation) | transform | `src/components/sandbox/instrument-readouts.ts` | exact |
| `src/components/sandbox/ChartBackdrop.tsx` | component (presentational) | request-response (props-in, JSX-out) | `src/components/shared/SectionGridBackground.tsx` | role-match |
| `src/components/sandbox/hooks/useContainerSize.ts` | hook | event-driven (ResizeObserver) | current `ChartPanel.tsx` lines 344–358 (inline, being extracted) | exact (self-extraction, no separate hook precedent exists yet) |
| `src/components/sandbox/VesselGroup.tsx` | component (presentational + hit-testing wiring) | event-driven (pointer) | current `ChartPanel.tsx` lines 196–335 (inline `VesselGroup`, being moved verbatim) | exact (verbatim move, no transformation) |
| `src/components/sandbox/hooks/useSandboxState.ts` | hook (state machine) | CRUD (local state) + request-response (save mutation) | current `SandboxContainer.tsx` lines 41–181 (inline, being extracted) | exact (self-extraction) |
| `src/components/sandbox/ChartPanel.tsx` (modified) | component (composition/orchestration) | request-response | itself (pre-refactor version, being thinned) | n/a — modification, not new |
| `src/components/sandbox/SandboxContainer.tsx` (modified) | component (composition/orchestration) | request-response | itself (pre-refactor version, being thinned) | n/a — modification, not new |

**Test files (per D-02):**

| New Test File | Analog | Match Quality |
|---|---|---|
| `src/components/sandbox/chart-panel-geometry.test.ts` | `src/components/sandbox/instrument-readouts.test.ts` (numeric-fixture unit-test style) + `src/domain/geometry/*.test.ts` (pure-function fixture style) | exact |
| `src/components/sandbox/chart-panel-derivation.test.ts` | `src/components/sandbox/instrument-readouts.test.ts` | exact |

## Pattern Assignments

### `src/components/sandbox/chart-panel-geometry.ts` (utility, transform)

**Analog:** `src/components/hero/hero-preview-geometry.ts` (zero-JSX pure module precedent; also cross-check `src/components/shared/static-chart-geometry.ts` for the "pure geometry helper" shape)

**Imports pattern** (`hero-preview-geometry.ts` lines 1–8):
```typescript
/**
 * Pure, framework-free geometry for the Hero preview card's illustrative
 * SVG chart. Every constant here is derived from the design source
 * ...
 */
import type { ChartViewBox, ContainerSize } from "../../domain/geometry/screen-convert.js";
```
`chart-panel-geometry.ts` should mirror this exactly: a top-of-file doc comment stating "pure, framework-free", then a single type-only import from `screen-convert.js` (relative path `../../domain/geometry/screen-convert.js` since this file lives one level deeper than hero's file — verify actual relative depth from `src/components/sandbox/`). **No `import type { PointerEvent } from "react"` and no plain `import ... from "react"`** — this is the bar Anti-Pattern 3 in ARCHITECTURE.md calls out.

**Core pattern — pure function returning a value, not JSX** (`hero-preview-geometry.ts` lines 48–65, `bearingSectorPath()`):
```typescript
export function bearingSectorPath(bearingDegrees: number): string {
  const northEdge = { x: HERO_CHART_CENTER.screenX, y: HERO_CHART_CENTER.screenY - HERO_OUTER_RING_RADIUS_PX };
  const bearingEdge = { ... };
  const largeArcFlag = bearingDegrees > 180 ? 1 : 0;
  return [
    `M ${HERO_CHART_CENTER.screenX} ${HERO_CHART_CENTER.screenY}`,
    `L ${northEdge.x} ${northEdge.y}`,
    `A ${HERO_OUTER_RING_RADIUS_PX} ${HERO_OUTER_RING_RADIUS_PX} 0 ${largeArcFlag} 1 ${bearingEdge.x} ${bearingEdge.y}`,
    "Z",
  ].join(" ");
}
```
`wedgePath()` (currently `ChartPanel.tsx` lines 129–154) already matches this exact shape — move verbatim, no changes needed. Its own doc comment already cross-references this same bearing→SVG-angle convention (`svgAngle = bearing - 90`).

**Return-type discipline — the one required transformation** (ARCHITECTURE.md Anti-Pattern 3, `static-chart-geometry.ts` lines 12–19 as the "plain data, not JSX" precedent):
```typescript
// static-chart-geometry.ts — returns plain numeric data, never elements
export const HULL_PATH = "M 0,-13.8 L 8.43,10.73 L 0,5.37 L -8.43,10.73 Z";
export function headingVectorEndpoint(
  screen: { screenX: number; screenY: number },
  headingDegrees: number,
): { x: number; y: number } { ... }
```
Apply the identical shape to the renamed `buildGridLineSegments()`: it must return `Array<{ key: string; x1: number; y1: number; x2: number; y2: number }>` (per ARCHITECTURE.md's locked signature), not `React.ReactNode[]`. Current `buildGridLines()` (`ChartPanel.tsx` lines 156–194) does the coordinate math correctly already — only its `lines.push(<line .../>)` calls change to `lines.push({ key: ..., x1: ..., y1: ..., x2: ..., y2: ... })`, and the `import type { ContainerSize } ...` / `chartToScreen` calls carry over unchanged. The caller (in `ChartPanel.tsx` or `ChartBackdrop.tsx`) keeps a 4-line `.map()` turning each segment into a `<line stroke={GRID_STROKE} .../>`.

**Constants-with-derivation-comment convention** (`hero-preview-geometry.ts` lines 10–24, apply to all ~35 constants moved from `ChartPanel.tsx` lines 32–123):
```typescript
// UI-SPEC.md "Preview Card Dimensions": 8:5 (not square) aspect ratio,
// framed to comfortably contain both fixture vessels + the range rings.
export const HERO_CONTAINER_SIZE: ContainerSize = { width: 320, height: 200 };
```
`ChartPanel.tsx`'s existing constants (`CHART_VIEW_BOX`, `HULL_POINTS`, `CONE_RADIUS_PX`, etc.) already carry this same "why this number" comment style — preserve every comment verbatim when moving, do not compress/summarize them.

---

### `src/components/sandbox/chart-panel-derivation.ts` (utility, transform)

**Analog:** `src/components/sandbox/instrument-readouts.ts` (`deriveInstrumentReadouts()`) — direct structural sibling in the same folder, same "per-render pure derivation" role.

**Imports pattern** (`instrument-readouts.ts` lines 1–18):
```typescript
/**
 * Instrument-readout derivation (Range/Bearing A->B/CPA/TCPA) -- calls
 * `relativeBearing()`/`cpa()` directly against live vessel state, rather
 * than scanning `classification.trail[].facts` for these values. ...
 */

import { relativeBearing } from "../../domain/geometry/relative-bearing.js";
import { cpa } from "../../domain/geometry/cpa.js";
import type { Vessel } from "../../domain/vessel/vessel.js";
```
`chart-panel-derivation.ts` follows the same shape: doc comment explaining *why* this derivation exists as its own module (buried-in-component-body per ARCHITECTURE.md), then named imports of the domain functions it calls (`chartToScreen`, `getVesselRole`, `resolveDoubtGeometry`, `wedgePath` from the sibling `chart-panel-geometry.ts`, and — per D-01 — `deriveInstrumentReadouts` from `./instrument-readouts.js`).

**Core pattern — interface + single derive function** (`instrument-readouts.ts` lines 20–44):
```typescript
export interface InstrumentReadouts {
  rangeNm: number;
  bearingAtoBDegrees: number | null;
  cpaNm: number | null;
  tcpaMinutes: number | null;
}

export function deriveInstrumentReadouts(vesselA: Vessel, vesselB: Vessel): InstrumentReadouts {
  const rangeNm = Math.hypot(
    vesselB.position.x - vesselA.position.x,
    vesselB.position.y - vesselA.position.y,
  );
  const bearingResult = relativeBearing(vesselA, vesselB);
  const cpaResult = cpa(vesselA, vesselB);
  return {
    rangeNm,
    bearingAtoBDegrees: bearingResult.ok ? bearingResult.value : null,
    cpaNm: cpaResult.ok ? cpaResult.value.dcpaNm : null,
    tcpaMinutes: cpaResult.ok ? cpaResult.value.tcpaMinutes : null,
  };
}
```
Mirror this exactly for `deriveChartOverlayState()`: export the `ChartOverlayState` interface (signature already locked in ARCHITECTURE.md lines 98–120), then a single function taking `(vesselA, vesselB, classification, containerSize, viewBox)` and returning a plain object — no JSX, no DOM reads, no React import. Move the derivation block verbatim from `ChartPanel.tsx` lines 368–430 (screenA/B, chartCenter, ring radii, roleA/B, bearing-doubt styling, rangeNm, bearingMidpoint, doubtVessel via `resolveDoubtGeometry`, conePathA/B via `wedgePath`).

**D-01 dedup — the one required change versus a pure verbatim move:**
```typescript
// ChartPanel.tsx lines 404–407, CURRENT (to be replaced):
const rangeNm = Math.hypot(
  vesselB.position.x - vesselA.position.x,
  vesselB.position.y - vesselA.position.y,
);
```
becomes, inside `deriveChartOverlayState()`:
```typescript
const { rangeNm } = deriveInstrumentReadouts(vesselA, vesselB);
```
Same value, same formula — this is the exact duplication class `vessel-role.ts`'s own comment (lines 18–26, reproduced below in Shared Patterns) already calls out as a prior bug source in this codebase.

**Doubt-resolution pattern to preserve verbatim** (`ChartPanel.tsx` lines 413–426):
```typescript
let doubtVessel: VesselLabel | null = null;
if (classification.doubt && classification.doubtBoundary === "near-overtaking-crossing-boundary") {
  const doubtResult = resolveDoubtGeometry(vesselA, vesselB, classification.doubtBoundary);
  if (doubtResult.ok) {
    doubtVessel = doubtResult.value.vessel;
  }
  // If resolveDoubtGeometry returns !ok (should not occur here since
  // classifyEncounter already succeeded for these same vessels), fall
  // back to default static styling on both cones -- doubtVessel stays
  // null.
}
```
Move this block's logic and its comment unchanged — the comment documents a real invariant (classifyEncounter already succeeded), not restating the code.

---

### `src/components/sandbox/chart-panel-geometry.test.ts` / `chart-panel-derivation.test.ts` (test)

**Analog:** `src/components/sandbox/instrument-readouts.test.ts`

**Test structure pattern** (full file, 39 lines):
```typescript
import { describe, expect, it } from "vitest";
import { crossingResidualBasicCase } from "../../domain/colregs/classify-encounter.fixtures.js";
import { cpa } from "../../domain/geometry/cpa.js";
import type { Vessel } from "../../domain/vessel/vessel.js";
import { deriveInstrumentReadouts } from "./instrument-readouts.js";

describe("deriveInstrumentReadouts", () => {
  it("derives range/bearing/cpa/tcpa matching the direct geometry functions", () => {
    const { vesselA, vesselB } = crossingResidualBasicCase;
    const readouts = deriveInstrumentReadouts(vesselA, vesselB);
    expect(readouts.rangeNm).toBeCloseTo(5);
    // ...
  });
});
```
For `chart-panel-derivation.test.ts`, per D-02, reuse the 3 named fixtures `ChartPanel.test.tsx` already imports (`crossingResidualBasicCase`, `headOnBoundaryInclusiveCase`, `doubtBandNearOvertakingBoundaryCase` — all from `../../domain/colregs/classify-encounter.fixtures.js`), call `classifyEncounter()` to get a real `ClassificationResult` for each (same `if (!result.ok) throw new Error(...)` guard pattern used throughout `ChartPanel.test.tsx`), then assert `deriveChartOverlayState()` output fields directly (no React render needed — this is a pure function test, no `@vitest-environment jsdom` pragma required, no `@testing-library/react` import).

For `chart-panel-geometry.test.ts`, use plain numeric fixtures for `wedgePath()` (fixed center/radius/bearing inputs, assert the returned path-string's `M`/`L`/`A` segments) and `buildGridLineSegments()` (fixed `containerSize`/`viewBox`, assert array length and specific segment coordinates) — same "numeric-fixture unit test" style, no component render.

---

### `src/components/sandbox/ChartBackdrop.tsx` (component, request-response)

**Analog:** `src/components/shared/SectionGridBackground.tsx` (closest existing "presentational-only SVG/decorative chrome" component — no pointer handlers, props-in/JSX-out)

Since there is no pre-existing sandbox-folder analog for a decorative sub-component being split out of a bigger SVG component, use the parent `ChartPanel.tsx` JSX itself (lines 448–489: `<defs>` fine-grid pattern, background `<rect>`, grid lines, range rings, crosshair, "N" label) as the literal content to move — this is a structural relocation, not a rewrite. `ChartBackdropProps` signature is already locked in ARCHITECTURE.md lines 133–139:
```typescript
export interface ChartBackdropProps {
  containerSize: ContainerSize;
  chartCenter: { screenX: number; screenY: number };
  innerRingRadiusPx: number;
  outerRingRadiusPx: number;
}
```

**Presentational-only pattern from `SectionGridBackground.tsx`** (props-driven, no internal state, no pointer handlers) — confirms the correct role classification: a component that receives derived geometry as props and purely renders SVG/markup, never computing derivation itself. `ChartBackdrop.tsx` should follow the same shape: import `chart-panel-geometry.ts`'s constants (`FINE_GRID_CELL_PX`, `FINE_GRID_STROKE`, `GRID_STROKE`, `RANGE_RING_STROKE`, `CROSSHAIR_STROKE`) and `buildGridLineSegments()`, map the returned segment data to `<line>` elements inline (the 4-line `.map()` ARCHITECTURE.md's Integration Points section calls for), and render nothing else — no `useState`, no `useEffect`, no pointer handlers (confirmed zero in the source region being moved).

---

### `src/components/sandbox/hooks/useContainerSize.ts` (hook, event-driven)

**Analog:** current inline code in `ChartPanel.tsx` lines 344–358 (the extraction source itself — no separate hook precedent exists yet in this codebase for a bare `ResizeObserver` hook)

**Pattern to extract verbatim**:
```typescript
const containerRef = useRef<HTMLDivElement>(null);
const [containerSize, setContainerSize] = useState<ContainerSize | null>(null);

useEffect(() => {
  const element = containerRef.current;
  if (!element) return;
  const observer = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (!entry) return;
    const { width, height } = entry.contentRect;
    setContainerSize({ width, height });
  });
  observer.observe(element);
  return () => observer.disconnect();
}, []);
```
Wrap this exact block in a function returning `{ containerRef, containerSize }` per ARCHITECTURE.md's locked signature (lines 142–145). No other project hook currently wraps a bare browser observer, but the two sibling hooks (`useHullDrag.ts`, `useRotateHandleDrag.ts`) establish this folder's convention for hook file shape — doc comment stating what VESL-xx/RFCT-xx concern the hook satisfies, a single exported function, return type as a plain object (not a class) — apply the same doc-comment-then-function shape here.

**Hook doc-comment convention** (`useHullDrag.ts` lines 1–9, structural template for the new hook's top comment):
```typescript
/**
 * useHullDrag -- pointerdown/move/up + setPointerCapture position-drag
 * hook (VESL-02/D-01). Converts pointermove screen coordinates to
 * chart-space Position via screenToChart() and forwards them through
 * onVesselPositionChange -- this hook holds no state of its own and does
 * not persist/validate the forwarded value itself (...).
 */
```
`useContainerSize.ts`'s doc comment should state its own single responsibility ("tracks the chart container's live pixel size via ResizeObserver, used to drive chartToScreen/screenToChart") and reference RFCT-01/RFCT-08 rather than restating the code.

**Regression-gate awareness** (`ChartPanel.test.tsx` lines 26–46, the `MockResizeObserver` class) — this hook's extraction must keep `ChartPanel.test.tsx`'s existing `MockResizeObserver` polyfill working unmodified, since the hook still calls the same global `ResizeObserver` constructor from inside a `useEffect`; no change needed to the test's polyfill, only confirm the hook is invoked from `ChartPanel.tsx` the same way `containerRef`/`containerSize` were used inline before.

---

### `src/components/sandbox/VesselGroup.tsx` (component, event-driven — do LAST per D-03)

**Analog:** current inline `VesselGroup` function in `ChartPanel.tsx` lines 196–335 (verbatim move, zero transformation — this is the extraction source, not an external analog)

**Move byte-for-byte**, including every comment (they document the two load-bearing regression fixes). Full current source (`ChartPanel.tsx` lines 196–335) is the copy-source; key excerpts to protect during the move:

**Hit-target-on-visible-shape pattern** (hull, lines 244–257):
```typescript
<polygon
  data-testid={`hull-hit-${label}`}
  points={HULL_POINTS}
  className={`
    cursor-grab
    active:cursor-grabbing
    ${ROLE_HULL_FILL_CLASS[role]}
  `}
  stroke={HULL_STROKE}
  strokeWidth={HULL_STROKE_WIDTH}
  onPointerDown={hullDrag.onPointerDown}
  onPointerMove={hullDrag.onPointerMove}
  onPointerUp={hullDrag.onPointerUp}
/>
```

**`pointerEvents="none"` regression-critical group** (lines 296–332, the exact block the dedicated `ChartPanel.test.tsx` regression test asserts on):
```typescript
<g pointerEvents="none">
  {/* Letter identifier (A/B) ... */}
  <circle cx={LETTER_OFFSET_X} cy={LETTER_OFFSET_Y} r={LETTER_CIRCLE_R} className="fill-card" />
  <text ...>{label === "vesselA" ? "A" : "B"}</text>
  {/* Role badge (GW/SO/MUTUAL) ... */}
  <rect ... className={ROLE_HULL_FILL_CLASS[role]} />
  <text ...>{ROLE_BADGE_TEXT[role]}</text>
</g>
```
Sibling order is load-bearing: the rotating `<g transform={\`rotate(${vessel.heading})\`}>` (containing stalk, hull polygon, rotate-handle circle) must remain the **first** child of the outer `<g transform="translate(...)">`, and the non-rotating `<g pointerEvents="none">` badge group must remain the **second**/last child — reversing this order or dropping the attribute reintroduces the Phase 8 regression (`fb0ec8a`). `VesselGroupProps` signature is already locked (ARCHITECTURE.md lines 123–131) and matches the current inline interface exactly — no signature change needed, only the file boundary.

**Regression test this file must keep passing unmodified** (`ChartPanel.test.tsx` lines 84–97):
```typescript
it("gives the decorative letter/role-badge overlay pointer-events:none so it never shadows the hull's own drag hit-target underneath it", () => {
  const { container } = renderChartPanel();
  const badgeText = within(container).getByText("GW");
  const overlayGroup = badgeText.closest("g[pointer-events]");
  expect(overlayGroup).not.toBeNull();
  expect(overlayGroup?.getAttribute("pointer-events")).toBe("none");
});
```
Per CONTEXT.md's Claude's Discretion note, also add the optional DOM-order assertion (rotating `<g transform="rotate(...)">` precedes the non-rotating `<g pointerEvents="none">` sibling) as belt-and-suspenders, following this same `container.querySelector`/`closest` style already used throughout `ChartPanel.test.tsx`.

---

### `src/components/sandbox/hooks/useSandboxState.ts` (hook, CRUD + request-response)

**Analog:** current inline state/handler block in `SandboxContainer.tsx` lines 41–181 (extraction source — no separate "state machine hook" precedent exists yet in this codebase, but the shape is a natural custom-hook wrap of existing `useState`/`useRef` + tRPC mutation code)

**Imports pattern to carry over** (`SandboxContainer.tsx` lines 15–39):
```typescript
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChartPanel } from "./ChartPanel.js"; // NOT needed in the hook — stays in the component
import { CHIP_ORDER, CHIP_SCENARIOS, type ChipId } from "./chip-scenarios.js";
import { classifyEncounter } from "../../domain/colregs/classify-encounter.js";
import { crossingResidualBasicCase } from "../../domain/colregs/classify-encounter.fixtures.js";
import { trpc } from "../../lib/trpc/client.js";
import {
  VesselSchema,
  type Position,
  type Vessel,
  type VesselType,
} from "../../domain/vessel/vessel.js";
import type {
  ClassificationResult,
  EncounterType,
  VesselLabel,
} from "../../domain/colregs/types.js";
```
The hook takes everything except the JSX-only imports (`ChartPanel`, `ControlPanel`, `VerdictBanner`, `InstrumentReadouts`, `ReasoningTrail`, `Button`, `RotateCcw`/`Link2` icons) — those stay in `SandboxContainer.tsx`, which becomes a thin consumer of the hook's return value plus its own composition JSX.

**Core CRUD/state-machine pattern — the single choke point** (`SandboxContainer.tsx` lines 108–128, `applyVesselUpdate`):
```typescript
function applyVesselUpdate(nextA: Vessel, nextB: Vessel): void {
  const parsedA = VesselSchema.safeParse(nextA);
  const parsedB = VesselSchema.safeParse(nextB);
  if (!parsedA.success || !parsedB.success) return;

  setVesselA(nextA);
  setVesselB(nextB);

  const result = classifyEncounter(nextA, nextB, previousEncounterTypeRef.current);
  if (result.ok) {
    setLastGoodClassification(result.value);
    setIsDegenerate(false);
    previousEncounterTypeRef.current = result.value.encounterType;
  } else {
    // Pitfall 5: a transient coincident-position drag frame must not
    // corrupt hysteresis or discard the last-good verdict -- leave
    // lastGoodClassification and previousEncounterTypeRef.current
    // untouched, only flip the degenerate flag.
    setIsDegenerate(true);
  }
}
```
Move this function and all 4 `onVesselXChange` wrappers, `handleReset`, `handleChipSelect` verbatim into the hook body — this is the highest-value logic in the file and the comment documenting the degenerate-frame invariant (Pitfall 5) must move with it unchanged.

**Save-mutation pattern** (`SandboxContainer.tsx` lines 46–54):
```typescript
const [saveError, setSaveError] = useState<string | null>(null);
const createScenario = trpc.scenario.create.useMutation({
  onSuccess: ({ shareId }) => router.push(`/s/${shareId}`),
  onError: () => setSaveError("Couldn't save this scenario. Try again."),
});
```
Per ARCHITECTURE.md's locked `useSandboxState()` return shape, wrap `createScenario.mutate({ vesselA, vesselB })` (currently inline at the `onClick` in JSX, lines 213–216) into an exported `handleSave: () => void`, and expose `isSaving: createScenario.isPending` and `saveError` — `SandboxContainer.tsx`'s JSX then calls `sandboxState.handleSave` and reads `sandboxState.saveError`/`sandboxState.isSaving` instead of touching `createScenario` directly.

**Hysteresis-ref pattern to preserve exactly** (`SandboxContainer.tsx` lines 96–100, 162–172):
```typescript
const previousEncounterTypeRef = useRef<EncounterType | undefined>(
  lastGoodClassification.encounterType,
);
// ...
function handleReset(): void {
  previousEncounterTypeRef.current = undefined;
  applyVesselUpdate(seedA, seedB);
}
```
This ref-based Rule 13(d) hysteresis mechanism is a locked domain-adjacent invariant (CONTEXT.md explicitly calls out "must preserve `previousEncounterTypeRef` hysteresis semantics exactly") — move it unchanged, do not convert to `useState` or otherwise "clean up" the ref usage.

**Regression gate:** `SandboxContainer.test.tsx` renders `<SandboxContainer/>` end-to-end and does not care whether this logic lives inline or in a hook — no test changes needed for this extraction (per ARCHITECTURE.md's Extraction 2b row), but the full suite must still pass unmodified after the move.

---

## Shared Patterns

### Pure-module doc-comment + zero-React-import discipline
**Source:** `src/components/hero/hero-preview-geometry.ts` (whole file), `src/components/shared/static-chart-geometry.ts` (whole file)
**Apply to:** `chart-panel-geometry.ts`, `chart-panel-derivation.ts`
```typescript
/**
 * Pure, framework-free geometry for the Hero preview card's illustrative
 * SVG chart. Every constant here is derived from ...
 */
import type { ChartViewBox, ContainerSize } from "../../domain/geometry/screen-convert.js";
```
No `import ... from "react"` (type-only or otherwise) anywhere in either new pure module — the two prior successful applications of this convention both clear this bar, and ARCHITECTURE.md's Anti-Pattern 3 exists specifically to prevent regressing it.

### Duplication-avoidance ("single-sourced" derivation reuse)
**Source:** `src/components/sandbox/vessel-role.ts` lines 18–26
```typescript
// Single-sourced role -> style maps (ARCHITECTURE.md's consolidation note):
// ChartPanel.tsx (HULL_FILL_CLASS/ROLE_BADGE_TEXT) and ReasoningPanel.tsx
// (ROLE_BADGE/VESSEL_LABEL_TEXT) each independently duplicated these same
// three concepts -- a fix applied to one file's map but not the other
// would have been invisible until someone happened to exercise the
// un-fixed path ...
```
**Apply to:** `chart-panel-derivation.ts`'s D-01 `rangeNm` dedup — cite this exact comment as precedent when writing the dedup's own justifying comment (same duplication class, same silent-bug risk).

### Hit-testing hooks stay untouched
**Source:** `src/components/sandbox/hooks/useHullDrag.ts`, `src/components/sandbox/hooks/useRotateHandleDrag.ts` (whole files)
**Apply to:** `ChartPanel.tsx`'s modification and `VesselGroup.tsx`'s creation — both hooks are imported and called exactly as today (`useHullDrag("vesselA", onVesselPositionChange, containerSize, CHART_VIEW_BOX)` etc., currently `ChartPanel.tsx` lines 360–375); only the JSX consuming their `DragHandlers` return value moves to `VesselGroup.tsx`. Do not re-extract, re-type, or modify either hook file (ARCHITECTURE.md Anti-Pattern 4).

### jsdom ResizeObserver/PointerCapture polyfill convention
**Source:** `src/components/sandbox/ChartPanel.test.tsx` lines 26–59, duplicated in `src/components/sandbox/hooks/useHullDrag.test.ts` lines 24–53
```typescript
class MockResizeObserver {
  private readonly callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) { this.callback = callback; }
  observe(): void {
    this.callback([{ contentRect: MOCK_CONTAINER_SIZE } as ResizeObserverEntry], this as unknown as ResizeObserver);
  }
  unobserve(): void {}
  disconnect(): void {}
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", MockResizeObserver);
  if (!Element.prototype.hasPointerCapture) Element.prototype.hasPointerCapture = () => true;
  if (!Element.prototype.setPointerCapture) Element.prototype.setPointerCapture = () => {};
  if (!Element.prototype.releasePointerCapture) Element.prototype.releasePointerCapture = () => {};
});
```
**Apply to:** No new test needs this polyfill directly (the two required new test files per D-02 are pure-function tests with no DOM render), but this pattern must keep working unmodified in `ChartPanel.test.tsx` after `useContainerSize.ts`/`VesselGroup.tsx` extraction, since both still ultimately rely on the same global `ResizeObserver`/pointer-capture APIs being polyfilled at the top of that test file.

### `Result<T>`-style ok/value discriminated returns
**Source:** `src/domain/geometry/screen-convert.ts` (throws on invalid config, doesn't use Result) vs. `resolve-doubt-geometry.ts`/`classify-encounter.ts` (both return `{ ok: boolean; value }`-shaped results, seen via `doubtResult.ok`/`result.ok` call sites in `ChartPanel.tsx` and `SandboxContainer.tsx`)
**Apply to:** `chart-panel-derivation.ts` and `useSandboxState.ts` — both new modules call domain functions that already return this discriminated-union shape; preserve the existing `if (result.ok) { ... } else { ... }` handling verbatim rather than introducing exceptions or a different error convention.

## No Analog Found

None. All 8 files (6 new + 2 modified) have a strong analog — either an existing sibling pure module (`instrument-readouts.ts`, `hero-preview-geometry.ts`, `static-chart-geometry.ts`) or the current pre-refactor inline code itself, since this phase is a structural relocation with zero new business logic (per CONTEXT.md: "No new capabilities... this phase touches only the internal structure of two presentation-layer components").

## Metadata

**Analog search scope:** `src/components/sandbox/` (all files + `hooks/` subfolder), `src/components/hero/`, `src/components/shared/`, `src/domain/geometry/screen-convert.ts` (referenced import target)
**Files scanned:** 18 (ChartPanel.tsx, SandboxContainer.tsx, ChartPanel.test.tsx, SandboxContainer.test.tsx [structure only], instrument-readouts.ts, instrument-readouts.test.ts, vessel-role.ts, types.ts, chip-scenarios.ts [referenced], hooks/useHullDrag.ts, hooks/useHullDrag.test.ts, hooks/useRotateHandleDrag.ts, hero-preview-geometry.ts, static-chart-geometry.ts, SectionGridBackground.tsx [referenced], screen-convert.ts, resolve-doubt-geometry.ts [signature only])
**Pattern extraction date:** 2026-07-20
