# Phase 4: Interactive Chart Sandbox - Research

**Researched:** 2026-07-17
**Domain:** SVG-based drag interaction (React 19 + native Pointer Events), live client-side rules-engine wiring, Tailwind CSS 4 + Vitest/jsdom component-testing setup
**Confidence:** MEDIUM-HIGH (drag mechanics and SVG geometry: HIGH; jsdom/Vitest 4 compatibility: LOW — flagged risk)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Vessel Manipulation (Drag Mechanics)**
- D-01: Dragging the vessel hull moves position; a separate small rotate handle (e.g. at the bow) sets heading; speed is set via a numeric/slider field in a form panel — three distinct, discoverable gestures/controls rather than combining heading+speed into one vector-drag gesture. Chosen specifically to reduce drag-gesture implementation risk (STATE.md flagged "drag-gesture implementation details" as needing deeper research for this phase) while still satisfying VESL-02's drag-adjust-heading requirement directly (not form-only).

**Visual Role Coding (Give-Way / Stand-On)**
- D-02: Give-way vs stand-on is shown via color-coded vessel hulls (e.g. red = give-way, green = stand-on). This is the sole visual signal decided in discussion — no separate icon/badge was requested.

**Reasoning Trail Panel**
- D-03: The reasoning trail is shown as the full trail, always visible, in a persistent side panel (not collapsed/expandable, not stacked below the chart). This means the entire Rule 7→13→14→15→18 decision path — including rules that were checked and ruled out, per Phase 2's D-14 (02-CONTEXT.md) — is visible at all times alongside the chart.
- D-04: Doubt-state cases (Phase 2's `doubt`/`doubtBoundary` fields) render as a dashed/amber overlay on the specific geometric element that triggered the doubt (the relative-bearing line or the overtaking boundary arc, depending on which `doubtBoundary` value fired), plus a caveat line in the reasoning panel naming the boundary. The visual ties directly to the specific geometric cause rather than being a generic banner or a change to the vessel hulls (which stay reserved for give-way/stand-on color coding per D-02).

**Chart Aesthetic**
- D-05: The chart uses a minimal/schematic style — vessel icons, N-up orientation, a subtle grid — with no compass rose, range rings, wake trails, or chart-paper texture.

**Initial Sandbox State**
- D-06: The sandbox loads with a default two-vessel scenario already placed on the chart (a clear, classic encounter, e.g. a textbook crossing) rather than a blank chart.

### Claude's Discretion
- Exact speed input widget (slider vs numeric field vs both) and its exact units/step — default to a labeled numeric input in knots, consistent with Phase 1's speed-in-knots convention (D-01 in 01-CONTEXT.md).
- Whether to pair the hull color with a secondary non-color cue (icon, pattern, or text label) for colorblind accessibility.
- The exact default scenario's specific positions/headings/speeds/types — pick a clean, unambiguous classic encounter (not a doubt-boundary case) during planning.
- Handling of `classifyEncounter()`'s `Result<T>` degenerate cases (coincident-position, no-closure) in the UI — not discussed explicitly; flagged for research/planning.
- UI state's tracking/passing of the `previous` classification parameter on every drag update (for Rule 13(d) hysteresis) — not discussed explicitly; flagged for research/planning.
- Exact Next.js app/component file layout under `app/`/`src/components/` — not discussed; follow CLAUDE.md's Clean Architecture layering conventions.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within Phase 4 scope. No scope-creep suggestions came up during this discussion.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VESL-02 | User can drag/adjust a vessel's position and heading directly on the chart | Pattern 1 (two independent Pointer-Events drag targets — hull-drag for position, rotate-handle for heading), Pitfall 1 (overlapping drag targets), Pitfall 2 (rotate-handle hit-circle scaling) |
| CLAS-05 | Classification updates live as vessel position/heading/speed change (no manual submit step) | Pattern 2 (classification computed in the event handler, not the render body), Live re-render performance section (React 19 automatic batching; no throttling/rAF needed since `classifyEncounter()` is pure synchronous trig) |
| DETM-03 | Give-way and stand-on vessels are visually distinguished on the chart (color/icon coding) | Code Examples: give-way/stand-on/mutual-obligation hull color rendering (covers the `giveWay`/`standOn` both-null head-on mutual-obligation case D-02 left open), Accessibility secondary-cue recommendation |
| RSON-01 | App displays a reasoning trail showing the specific rule(s) applied and the geometric logic that produced the verdict | Architectural Responsibility Map (reasoning trail rendering tier), Recommended Project Structure (`ReasoningPanel` component consuming `ReasoningTrailEntry[]` directly, no transformation logic in the component) |
| RSON-03 | App visually overlays the geometric reasoning directly on the chart (relative bearing line, overtaking boundary arc) | Pattern 3 (SVG sector/wedge path for the overtaking-boundary arc using `OVERTAKING_BOUNDARY_DEGREES`/`DOUBT_BAND_DEGREES`), Pitfall 3 (rendering the doubt overlay against the correct vessel's bearing) |
| CHRT-01 | App renders a 2D nautical-chart-style canvas showing vessel position, heading, and encounter geometry | Standard Stack (SVG + Tailwind), Architectural Responsibility Map (SVG chart rendering tier), Recommended Project Structure (`ChartPanel` component) |
| CHRT-02 | Chart rendering and drag interaction stay responsive during continuous drag (no lag or flicker from re-computation) | Live re-render performance section (no `useTransition`/rAF-throttling needed or recommended — would fight the "live" requirement), Pitfall 5 (transient coincident-position/degenerate `Result` mid-drag handling) |
</phase_requirements>

## Summary

Phase 4 is greenfield UI work wired directly into an already-complete, framework-free domain layer (`classifyEncounter()`, `screenToChart()`/`chartToScreen()`, `bearing()`/`relativeBearing()`). Nothing about the COLREGS logic needs to change or be re-derived — the entire research burden is standard React/SVG plumbing: two independent Pointer-Events drag targets per vessel (hull-drag for position, a small rotate-handle for heading), a live (per-`pointermove`) call into the pure, synchronous `classifyEncounter()`, and rendering its `Result<ClassificationResult>` as colored hulls, an SVG bearing line, an SVG doubt-overlay, and a persistent reasoning-trail panel.

The two-drag-target mechanics are well-established: `setPointerCapture(pointerId)` on `pointerdown` ties all subsequent `pointermove`/`pointerup` events to the originating element regardless of where the cursor travels, and giving the rotate handle its own `pointerdown` handler with `event.stopPropagation()` prevents the hull's drag handler from also firing. Heading-from-pointer-position is not new math to write — it is a direct call to the already-implemented `bearing()` function (vessel center → pointer's chart-space position), reusing the exact atan2-argument-order convention the project has already locked, rather than a second hand-rolled trig implementation living in a component.

Live re-render performance is a non-issue at this phase's scale: `classifyEncounter()` is pure synchronous trigonometry with no I/O, and React 19's automatic batching already coalesces every `setState` call inside one `pointermove` handler into a single render. No `useTransition`/`startTransition`/manual rAF-throttling is needed or recommended — `startTransition` would in fact fight CHRT-02's "live" requirement by deprioritizing the very re-render (reasoning panel) that must stay in sync with the chart. The one real risk in this phase is environment setup, not interaction logic: no Tailwind, no `@testing-library/react`, no `@testing-library/user-event`, and no jsdom test environment exist in the repo yet, and there is an open (unresolved, low-detail) GitHub issue about jsdom-latest + Vitest-4-latest test failures that the plan should smoke-test early rather than discover mid-phase.

**Primary recommendation:** Build a single container component (e.g. `SandboxContainer`) that owns `vesselA`/`vesselB` state (`useState`) and a `previousEncounterTypeRef` (`useRef<EncounterType | undefined>`), computes `classifyEncounter()` results exclusively inside event handlers (never in the render body, to respect React's "no ref reads/writes during render" rule), and passes the resulting vessels + classification down as props to three sibling children — `ChartPanel` (SVG), `ControlPanel` (form), `ReasoningPanel` (trail list). Do not add `zustand` for this: the prop-drilling here is exactly one level deep from one container to three siblings, not the deep/cross-tree case `zustand` exists for.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| SVG chart rendering (vessels, bearing line, doubt overlay, grid) | Browser / Client | — | Pure presentational SVG-in-JSX, no server involvement |
| Drag interaction (hull position, rotate-handle heading) | Browser / Client | — | Native Pointer Events API is browser-only; `setPointerCapture` has no server analog |
| Screen↔chart coordinate transform | Browser / Client | — | `screenToChart()`/`chartToScreen()` are DOM-free pure functions, but the *caller* (measuring `containerSize` via `ResizeObserver`) is inherently client-side |
| Encounter classification (`classifyEncounter()`) | Domain layer (imported into Client bundle) | Browser / Client (invocation site) | Pure, framework-free TS function — CLAS-05/RSON-01 require it to run **client-side with zero network round-trip** in this phase, not as an API/tRPC call |
| Vessel input validation (`VesselSchema`) | Domain layer (imported into Client bundle) | Browser / Client | Same Zod schema already used at the tRPC boundary (Phase 3) reused here to validate drag-derived numeric state before it reaches `classifyEncounter()` |
| Reasoning trail rendering | Browser / Client | — | Renders `ReasoningTrailEntry[]` already computed by the domain layer; no transformation logic belongs in the component |
| Form controls (speed input, vessel type select) | Browser / Client | — | Controlled React inputs, no SSR-specific concern |
| Persistence / save / share | Out of scope this phase | API / Backend (Phase 5) | `scenario.create`/share links are Phase 5 — Phase 4 has no network writes |

## Standard Stack

### Core (already locked, project-wide — CLAUDE.md)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.2.10 | App framework, routing | Locked project constraint |
| React | 19.2.7 | UI layer | Locked project constraint |
| TypeScript | 7.0.2 | Type safety | Locked project constraint |
| Zod | 4.4.3 | `VesselSchema` reuse for UI state validation | Locked project constraint; already the domain value-object layer |

### New for this phase (verified at research time)
| Library | Version (verified via npm registry, 2026-07-17) | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `tailwindcss` | 4.3.3 `[VERIFIED: npm registry + Context7 /tailwindlabs/tailwindcss.com]` | Styling | Locked by CLAUDE.md (stated 4.3.2 there; 4.3.3 is the current patch — use 4.3.3, no breaking changes expected between patch versions) |
| `@tailwindcss/postcss` | 4.3.3 `[VERIFIED: npm registry + Context7]` | Tailwind v4's PostCSS plugin (v4 replaced the old `tailwindcss` PostCSS-plugin-as-package pattern) | Required — Tailwind v4 setup is `npm i tailwindcss @tailwindcss/postcss`, not `tailwindcss` alone |
| `@testing-library/react` | 16.3.2 `[VERIFIED: npm registry]` | Component testing (RTL) | Locked by CLAUDE.md, confirmed current |
| `@testing-library/user-event` | 14.6.1 `[VERIFIED: npm registry]` | Simulates `pointerdown`/`pointermove`/`pointerup` sequences via `user.pointer([...])` for drag-interaction tests | CLAUDE.md flagged this version as "verify at install time" — confirmed: 14.6.1 is current, well past the v14 `pointer()` API introduction |
| `@testing-library/jest-dom` | 6.9.1 `[VERIFIED: npm registry]` | DOM-specific matchers (`toBeInTheDocument`, etc.) for Vitest assertions | Conventional pairing with RTL; not in CLAUDE.md's list but near-universally installed alongside it — flag for planner to confirm inclusion |
| `jsdom` | 29.1.1 `[VERIFIED: npm registry]` | Vitest's DOM environment for component tests | Required for any RTL test — see Pitfall below re: Vitest 4 compatibility risk |
| `@vitejs/plugin-react` OR `@vitejs/plugin-react-swc` | 4.3.1 (babel) / 6.0.3 (swc) `[VERIFIED: npm registry]` | JSX/TSX transform inside Vitest (Next.js's own SWC pipeline does not apply inside the separate Vitest process) | Needed once `.tsx` component test files exist — current `vitest.config.ts` has no plugins because domain-layer tests are plain `.ts` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Single `vitest.config.ts` with `environment: "node"` (current) | Vitest workspace/`projects` config splitting domain tests (`node`) from component tests (`jsdom`) | Cleaner long-term, but adds config surface; a per-file `// @vitest-environment jsdom` docblock on new component test files is the lower-effort option for this phase's scope — recommend the docblock approach, defer workspace split unless test-file count grows |
| `@vitejs/plugin-react` (Babel) | `@vitejs/plugin-react-swc` | SWC variant is faster and matches Next.js's own compiler; either works for RTL — pick one, do not install both |

**Installation:**
```bash
npm install tailwindcss @tailwindcss/postcss
npm install -D @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom @vitejs/plugin-react-swc
```

## Package Legitimacy Audit

All four new npm packages were checked with `slopcheck scan <pkg> --pkg npm --json` (slopcheck v0.6.1, available locally) and cross-checked for suspicious `postinstall` scripts via `npm view <pkg> scripts.postinstall` (all returned empty — no postinstall scripts on any candidate).

| Package | Registry | Age | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-------------|-----------|-------------|
| `tailwindcss` | npm | Multi-year, actively maintained (latest publish 2026-07-16) | github.com/tailwindlabs/tailwindcss | OK | Approved |
| `@tailwindcss/postcss` | npm | Official Tailwind v4 sub-package | github.com/tailwindlabs/tailwindcss | OK | Approved |
| `@testing-library/react` | npm | Multi-year, industry-standard | github.com/testing-library/react-testing-library | OK | Approved |
| `@testing-library/user-event` | npm | Multi-year, industry-standard | github.com/testing-library/user-event | OK | Approved |

**Packages removed due to slopcheck `[SLOP]` verdict:** none
**Packages flagged as suspicious `[SUS]`:** none

`@testing-library/jest-dom`, `jsdom`, and `@vitejs/plugin-react`/`-swc` were verified for existence/version via `npm view` only (not run through slopcheck) — these are extremely well-established, near-ubiquitous dev-tooling packages (jsdom: the de facto standard DOM implementation for Node test runners; `@testing-library/jest-dom`: the standard RTL matcher-extension package). Planner should still run `slopcheck scan` on these three before install as a final gate, consistent with the Package Legitimacy Gate protocol.

## Architecture Patterns

### System Architecture Diagram

```
 User pointer/keyboard input
        |
        v
 +-------------------------+
 |   ChartPanel (SVG)      |  onPointerDown/Move/Up on hull group
 |   - hull drag target    |------------------+
 |   - rotate-handle target|--------+         |
 +-------------------------+        |         |
                                     v         v
                          +----------------------------+
                          |  SandboxContainer (state)   |
                          |  vesselA, vesselB (useState)|
                          |  previousEncounterType (ref)|
                          +----------------------------+
                                     |
                    (event handler, NOT render body)
                                     v
                    +----------------------------------+
                    |  src/domain/colregs/               |
                    |  classifyEncounter(A, B, previous) |  <-- pure, sync, no I/O
                    +----------------------------------+
                                     |
                          Result<ClassificationResult>
                                     |
              +----------------------+----------------------+
              v                                              v
   +---------------------+                       +----------------------+
   |  ChartPanel (SVG)    |                       |  ReasoningPanel       |
   |  - hull fill color   |                       |  - full trail list    |
   |    (give-way/stand-  |                       |  - doubt caveat line  |
   |     on/mutual)       |                       +----------------------+
   |  - bearing line       |
   |  - doubt overlay      |
   |    (dashed/amber)      |
   +---------------------+
              ^
              |
   +---------------------+
   |  ControlPanel (form) |  onChange -> same event-handler path as drag
   |  - speed input        |
   |  - vessel type select |
   +---------------------+
```

### Recommended Project Structure
```
app/
├── layout.tsx              # new — root layout, imports globals.css
├── page.tsx                 # new — mounts SandboxContainer, provides default D-06 scenario
└── globals.css               # new — Tailwind v4 @import "tailwindcss"
src/
├── components/
│   ├── sandbox/
│   │   ├── SandboxContainer.tsx   # owns vesselA/vesselB state + previousEncounterType ref
│   │   ├── ChartPanel.tsx          # SVG chart, delegates drag to hooks below
│   │   ├── ControlPanel.tsx        # form controls (speed, type)
│   │   └── ReasoningPanel.tsx      # full always-visible trail list
│   └── sandbox/hooks/
│       ├── useHullDrag.ts          # pointerdown/move/up + setPointerCapture for position
│       └── useRotateHandleDrag.ts  # pointerdown/move/up + setPointerCapture for heading
├── domain/                          # UNCHANGED — Phases 1-2 output, do not modify
└── ...
```

### Pattern 1: Two independent Pointer-Events drag targets on one SVG group
**What:** The vessel hull (a `<polygon>` or `<path>`) and a small rotate handle (a `<circle>` positioned at the bow, offset from vessel center by a fixed chart-space radius) each get their own `onPointerDown` handler. Both call `event.currentTarget.setPointerCapture(event.pointerId)` on `pointerdown`, attach `pointermove`/`pointerup` handlers, and release capture on `pointerup`/`pointercancel`. The rotate handle's `pointerdown` handler calls `event.stopPropagation()` so the hull's (potentially overlapping, if the handle sits over the hull polygon) drag handler never also fires for the same gesture.
**When to use:** Any time two nested/overlapping SVG elements need independent drag semantics.
**Example:**
```typescript
// Source: pattern synthesized from setPointerCapture drag guides
// (blog.r0b.io — see Sources) + MDN Pointer Events docs
function RotateHandle({ vessel, onHeadingChange, containerSize, viewBox }: Props) {
  const handlePointerDown = (e: React.PointerEvent<SVGCircleElement>) => {
    e.stopPropagation(); // prevent the hull's onPointerDown from also firing
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGCircleElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const chartPos = screenToChart(e.clientX, e.clientY, containerSize, viewBox);
    // Reuse the ALREADY-IMPLEMENTED bearing() function -- do not
    // hand-roll a second atan2 call with a different argument order.
    const headingResult = bearing(vessel.position, chartPos);
    if (headingResult.ok) onHeadingChange(headingResult.value);
  };

  const handlePointerUp = (e: React.PointerEvent<SVGCircleElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <circle
      cx={/* bow position in screen coords */}
      cy={/* bow position in screen coords */}
      r={6}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    />
  );
}
```
**Note on hit-testing:** a `r={6}` circle is a small target; consider a larger *invisible* hit-area circle (e.g. `r={14}`, `fill="transparent"`) layered under/around the visible handle, a common SVG small-target pattern, so the handle is comfortably grabbable without visually enlarging it.

### Pattern 2: Classification computed in the event handler, not the render body
**What:** `classifyEncounter()` and the `previousEncounterTypeRef` read/write happen inside the `pointermove`/`onChange` handler that produces new vessel state — never inside the component's render body or inside a `useMemo` that reads a ref. React's rules explicitly disallow reading or writing `ref.current` during render (only inside event handlers or effects) `[CITED: React source, react-compiler validateNoRefAccessInRender pass]`.
**When to use:** Any time a derived value must both (a) be computed from the *previous* render's committed value and (b) drive the *current* render's output — i.e., exactly the Rule 13(d) hysteresis case.
**Example:**
```typescript
// Source: pattern derived from React's own ref-in-effect/ref-in-handler
// guidance (react.dev "Manipulating the DOM with Refs" + react-compiler
// validateNoRefAccessInRender pass, see Sources)
function SandboxContainer() {
  const [vesselA, setVesselA] = useState<Vessel>(DEFAULT_VESSEL_A);
  const [vesselB, setVesselB] = useState<Vessel>(DEFAULT_VESSEL_B);
  const [classification, setClassification] = useState<Result<ClassificationResult>>(
    () => classifyEncounter(DEFAULT_VESSEL_A, DEFAULT_VESSEL_B),
  );
  const previousRef = useRef<EncounterType | undefined>(undefined);

  // Single choke point -- called from BOTH drag handlers and form
  // onChange handlers, so hysteresis is respected regardless of input
  // modality (VESL-02's drag path and the numeric speed field alike).
  const applyVesselUpdate = (nextA: Vessel, nextB: Vessel) => {
    setVesselA(nextA);
    setVesselB(nextB);
    const result = classifyEncounter(nextA, nextB, previousRef.current);
    setClassification(result);
    if (result.ok) {
      previousRef.current = result.value.encounterType;
    }
    // Genuine Result failures (coincident-position, invalid-input) leave
    // previousRef.current untouched -- do not clear hysteresis on a
    // transient degenerate drag frame (e.g. a vessel briefly dragged
    // exactly on top of the other).
  };

  // ...pass applyVesselUpdate down to ChartPanel's drag hooks and
  // ControlPanel's onChange handlers.
}
```

### Pattern 3: SVG sector/wedge path for the overtaking-boundary arc
**What:** The overtaking boundary (`OVERTAKING_BOUNDARY_DEGREES = 112.5`, `DOUBT_BAND_DEGREES = 5`, from `classify-encounter.ts`) is a bearing *sector*, not a single line — render it as a pie-slice/wedge SVG `<path>` anchored at the observing vessel's position: a line to the sector's start angle, an arc to the sector's end angle, then a line back to center, closed with `Z`.
**When to use:** D-04's doubt overlay when `doubtBoundary === 'near-overtaking-crossing-boundary'`.
**Example:**
```typescript
// Source: SVG arc path syntax synthesized from MDN "Paths" tutorial +
// Josh Comeau "Interactive Guide to SVG Paths" (see Sources)
function wedgePath(
  center: { screenX: number; screenY: number },
  radiusPx: number,
  startBearingDeg: number, // e.g. 112.5 - 5 = 107.5
  endBearingDeg: number,   // e.g. 112.5 + 5 = 117.5
): string {
  // Bearing (clockwise from North/up) -> SVG angle (clockwise from
  // positive x-axis, y-down) conversion: svgAngle = bearing - 90.
  const toXY = (bearingDeg: number) => {
    const rad = ((bearingDeg - 90) * Math.PI) / 180;
    return {
      x: center.screenX + radiusPx * Math.cos(rad),
      y: center.screenY + radiusPx * Math.sin(rad),
    };
  };
  const start = toXY(startBearingDeg);
  const end = toXY(endBearingDeg);
  const largeArcFlag = endBearingDeg - startBearingDeg > 180 ? 1 : 0; // always 0 for a 10 deg doubt band
  const sweepFlag = 1; // clockwise
  return [
    `M ${center.screenX} ${center.screenY}`,
    `L ${start.x} ${start.y}`,
    `A ${radiusPx} ${radiusPx} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}
```
**Note:** the 112.5°/117.5°/107.5° boundary is expressed in *relative-bearing* terms (relative to the observing vessel's heading), not true/absolute bearing — the wedge must be drawn relative to whichever vessel's `facts.relativeBearingAtoB` or `facts.relativeBearingBtoA` triggered the doubt (see Pitfall 3 below), rotated by that vessel's heading to convert to true bearing before applying `toXY()`.

### Anti-Patterns to Avoid
- **Calling `SVGElement.getScreenCTM()`/`getBBox()` inside components:** banned by CLAUDE.md — not implemented in jsdom, will pass in a real browser and silently fail every RTL test that touches the affected component. Use the existing `screenToChart()`/`chartToScreen()` + `ResizeObserver`-measured `containerSize` instead, exactly as Phase 1 designed them.
- **Reading/writing `ref.current` inside `useMemo`/render body for the hysteresis value:** violates React's rules of refs (see Pattern 2) and is exactly the kind of bug the React Compiler's `validateNoRefAccessInRender` pass exists to catch — do it in event handlers instead.
- **Throttling `pointermove` with `startTransition`:** would deprioritize the reasoning-panel re-render relative to the chart re-render, producing exactly the "lag" CHRT-02 prohibits. Not recommended for this phase's scale (2 vessels, pure-trig classification).
- **A single hand-rolled `Math.atan2` call in the rotate-handle drag hook:** duplicates `bearing()`'s already-locked argument-order convention (CLAUDE.md's atan2-argument-order pitfall) in a second place that can drift out of sync. Call `bearing()` directly.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Heading angle from rotate-handle pointer position | A second `atan2`-based bearing calculation inside the component | `bearing(vessel.position, pointerChartPosition)` from `src/domain/geometry/bearing.ts` | Already implemented, already tested, already uses the project's locked (non-standard) atan2 argument order — a second implementation is a guaranteed drift risk |
| Encounter classification / give-way determination | Any new rules logic in the UI layer | `classifyEncounter()` from `src/domain/colregs/classify-encounter.ts` | This is the entire point of Phases 1-2; Phase 4 is purely a rendering/interaction layer over it |
| Screen↔chart coordinate conversion | New math using `getScreenCTM()`/`getBBox()` or a fresh viewBox-scaling formula | `screenToChart()`/`chartToScreen()` from `src/domain/geometry/screen-convert.ts` | Already implemented DOM-free per CLAUDE.md's exact prescription; reimplementing risks the Y-axis-inversion pitfall documented in that file's own comments |
| Drag gesture state machine | A custom drag library or `@use-gesture/react` | Native Pointer Events (`onPointerDown`/`Move`/`Up`, `setPointerCapture`) | Locked by CLAUDE.md; the interaction surface here (2 targets per vessel, no multi-touch/inertia) does not need gesture-library machinery |

**Key insight:** every piece of "hard" logic this phase needs (geometry, rules, coordinate transform) is already built and unit-tested in `src/domain/`. The actual net-new work is thin: wire pointer events to state, wire state to the existing pure functions, render the result. Resist the temptation to "improve" or re-derive any domain-layer output inside a component.

## Common Pitfalls

### Pitfall 1: Overlapping drag targets firing both handlers
**What goes wrong:** the rotate handle sits near/over the hull polygon; a `pointerdown` on the handle also bubbles to the hull's `pointerdown` handler, causing both a position-drag and a heading-drag to start simultaneously.
**Why it happens:** SVG pointer events bubble like any DOM event; `setPointerCapture` alone does not stop propagation of the *initiating* `pointerdown`.
**How to avoid:** call `event.stopPropagation()` in the rotate handle's `onPointerDown` before the event reaches the hull's handler (see Pattern 1).
**Warning signs:** dragging the rotate handle also visibly moves the vessel's position, or vice versa.

### Pitfall 2: Non-uniform SVG scale distorting the rotate-handle hit circle
**What goes wrong:** if the chart's `viewBox` aspect ratio doesn't match the container's pixel aspect ratio, `chartToScreen()`'s `scaleX`/`scaleY` differ, and a circular rotate-handle hit-target (radius in chart units) renders as an ellipse on screen, making the actual clickable hit area not match its visual circle.
**Why it happens:** `screen-convert.ts` deliberately supports independent X/Y scale factors (no aspect-ratio-locking assumption baked in).
**How to avoid:** either (a) size the rotate-handle hit circle directly in screen pixels (a fixed `r` on the rendered `<circle>`, not converted from chart units), or (b) lock the chart's `viewBox` to match the container's aspect ratio via the `ResizeObserver` callback. (a) is simpler and recommended for this phase.
**Warning signs:** the rotate handle is easy to grab on one axis and hard on the other.

### Pitfall 3: Rendering the doubt overlay against the wrong vessel's bearing
**What goes wrong:** `doubtBoundary === 'near-overtaking-crossing-boundary'` can be triggered by either `rbAtoB` or `rbBtoA` (see `classify-encounter.ts` Stage 3/5/hysteresis branches) — the trail entry's `facts` object key differs by stage (`relativeBearingAtoB` vs `relativeBearingBtoA`, and the sticky-hysteresis branch computes `stickyTriggeringBearing` but does not put a distinctly-named fact in the trail at all for that branch). A component that always reads `facts.relativeBearingAtoB` will silently render the wedge/line on the wrong vessel (or `undefined`) for roughly half of the doubt-triggering cases.
**Why it happens:** the reasoning trail's `facts` shape is per-stage, not a single normalized schema — each `ReasoningTrailEntry` is stage-specific by design (RSON-02's "byproduct of rule evaluation" goal), not a UI-normalized contract.
**How to avoid:** when rendering the doubt overlay, inspect whichever trail entry has `ruleId` matching the stage that set `doubt`/`doubtBoundary`, and defensively check for both possible fact keys (`relativeBearingAtoB` ?? `relativeBearingBtoA`) rather than assuming one. Flag for the planner: this may warrant a small, explicitly-tested pure helper (e.g. `resolveDoubtGeometry(result): { vessel: 'A'|'B', bearing: number }`) at the UI-adjacent (not domain) layer, since the domain layer intentionally does not normalize this.
**Warning signs:** the doubt overlay renders in the wrong place, or not at all, for overtaking-boundary doubt cases specifically (head-on-boundary doubt only has one shape and is less at risk).

### Pitfall 4: jsdom + Vitest 4 compatibility risk (LOW confidence, flagged not resolved)
**What goes wrong:** an open, unresolved GitHub issue (vitest-dev/vitest#9279) reports "latest jsdom + latest Vitest 4" causing test failures that do not reproduce with either component pinned to an older version, closed by maintainers as "not planned" without a documented root cause or fix `[CITED: github.com/vitest-dev/vitest/issues/9279]`.
**Why it happens:** unclear from the issue thread — no repro details were published.
**How to avoid:** treat this as a Wave-0 smoke-test item — write and run one trivial RTL component test (e.g. render a `<div>Hello</div>` and assert `getByText`) immediately after installing `jsdom`/`@testing-library/react`, before building real component tests on top of the harness. If it fails, pin `jsdom` to a slightly older minor/patch and re-test.
**Warning signs:** RTL tests fail with obscure DOM-API errors unrelated to the component under test.

### Pitfall 5: Vessel-drag producing a transient coincident-position/degenerate Result mid-drag
**What goes wrong:** while dragging vessel A's hull directly over vessel B's position (a plausible accidental drag path), `bearing()`/`relativeBearing()` return a `'coincident-position'` error `Result`, and `classifyEncounter()` propagates it — the UI must render *something* sensible for this transient failure state, not crash or show stale data.
**Why it happens:** the domain layer correctly refuses to guess a bearing for zero-distance vessels (Phase 1 D-07) — this is expected, tested domain behavior surfacing at the UI boundary for the first time in this phase.
**How to avoid:** the chart/reasoning panel must handle `!result.ok` explicitly — e.g. keep rendering the last-good classification with a "vessels overlapping" inline note, rather than a blank/crashed panel. This should be an explicit, tested UI state, not an afterthought.
**Warning signs:** dragging one vessel onto the other crashes the page or shows a stale/wrong verdict silently.

## Code Examples

### Rendering give-way/stand-on/mutual-obligation hull color (addressing D-02's uncovered null/null case)
```typescript
// D-02 locks red=give-way / green=stand-on. It does NOT address the
// giveWay===null && standOn===null mutual-obligation head-on case
// (types.ts's documented, tested Rule 18-tie scenario). Recommendation:
// a third, visually distinct neutral color -- NOT amber (D-04 reserves
// amber exclusively for the doubt overlay, to avoid the exact "visual
// competition between the two signals" D-04's own rationale warns
// against). Suggest slate/blue, paired with a text label in the
// reasoning panel (the existing Rule 18(a)-(c) trail entry text already
// says "mutual obligation stands" -- surface it verbatim).
function hullColor(label: VesselLabel, result: ClassificationResult): string {
  if (result.giveWay === null && result.standOn === null) {
    return "fill-slate-400"; // mutual obligation -- distinct from red/green/amber
  }
  if (result.giveWay === label) return "fill-red-500";
  if (result.standOn === label) return "fill-green-500";
  return "fill-slate-400"; // defensive fallback, should not occur per types.ts contract
}
```

### Accessibility secondary cue (Claude's discretion per D-02)
```typescript
// Pair hull color with a non-color cue: a small text badge or distinct
// stroke-dasharray, cheap to add and addresses colorblind accessibility
// without altering D-02's locked color-coding mechanism.
// give-way: solid stroke + "GW" badge; stand-on: solid stroke + "SO" badge;
// mutual: dashed stroke + "MUTUAL" badge.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| `mousedown`/`mousemove`/`mouseup` + manual document-level listener attach/detach for drag-outside-element | `pointerdown`/`pointermove`/`pointerup` + `setPointerCapture`/`releasePointerCapture` | Pointer Events broadly supported for years; standard current practice per all sources reviewed | No need for `document.addEventListener` workarounds or separate touch-event handling — one event model covers mouse/touch/pen |
| Tailwind CSS v3 `tailwind.config.js` + PostCSS `tailwindcss`/`autoprefixer` plugins | Tailwind v4 CSS-first config (`@import "tailwindcss"` + `@theme` blocks in CSS, `@tailwindcss/postcss` package) | Tailwind v4 release | Simpler install (2 packages, no separate config file required for basic use), directly confirmed via Context7 `/tailwindlabs/tailwindcss.com` |

**Deprecated/outdated:**
- Plain `tailwindcss` as the PostCSS plugin (v3 pattern): v4 moved the PostCSS integration into the separate `@tailwindcss/postcss` package — both must be installed.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `@testing-library/jest-dom`, `jsdom`, and `@vitejs/plugin-react`/`-swc` versions, while confirmed to exist via `npm view`, were not run through `slopcheck` in this research session (only the four CLAUDE.md-named packages were) | Standard Stack / Package Legitimacy Audit | Low — these are extremely well-established packages, but the planner should still gate them behind the standard legitimacy check before install, per protocol |
| A2 | The recommended "compute classification in event handlers, never render body" pattern (Pattern 2) is presented as the correct React-rules-compliant approach based on documented React ref-access rules, but no single official React doc page was found that shows this *exact* hysteresis-across-renders use case end-to-end | Architecture Patterns / Pattern 2 | Low-Medium — if wrong, the failure mode is a React warning/lint error (react-hooks rules), not a silent correctness bug, so it will surface quickly in development |
| A3 | The slate/blue "mutual obligation" third hull color and the colorblind secondary-cue pairing are this research's own recommendations to fill a gap CONTEXT.md's D-02 left as discretion — not verified against any accessibility standard (e.g. WCAG contrast ratios were not checked) | Code Examples | Low — cosmetic; easy to adjust in review, does not affect correctness of the underlying classification logic |
| A4 | Tailwind v4's exact current patch (4.3.3) vs. CLAUDE.md's stated 4.3.2 is treated as a safe patch-level bump | Standard Stack | Low — patch version, but planner should re-run `npm view tailwindcss version` at actual install time since more time may have passed |

## Open Questions

1. **Exact default D-06 scenario (positions/headings/speeds/types)**
   - What we know: CONTEXT.md leaves this to Claude's discretion; must be a "clean, unambiguous classic encounter (not a doubt-boundary case)" per D-06, and Phase 1/2 already has "classic encounter shapes" fixtures (head-on/crossing/overtaking) in `*.fixtures.ts` files.
   - What's unclear: which of the three (head-on/crossing/overtaking) reads best as the *initial* demo state, and the exact numeric values.
   - Recommendation: planner should pull a known-good, doubt-free fixture directly from `src/domain/colregs/classify-encounter.fixtures.ts` (already exists, already tested) rather than inventing new numbers — a classic crossing encounter (per STATE.md's own phrasing "e.g. a textbook crossing") is a reasonable default since it's the only one of the three with a non-null, single give-way vessel that isn't also the "sticky" overtaking special case.

2. **Where exactly does the doubt-geometry-resolution helper (Pitfall 3) live?**
   - What we know: the domain layer's `facts` shape is intentionally per-stage, not normalized; something needs to resolve "which vessel/bearing triggered this doubt" for rendering.
   - What's unclear: whether this belongs as a small new pure function in `src/domain/colregs/` (tested like the rest of the domain layer) or as a UI-adjacent utility in `src/components/sandbox/`.
   - Recommendation: given the project's Clean Architecture rule ("`src/domain/` never imports from `src/server/`/Next.js/tRPC/Prisma" but the reverse — components importing FROM domain — is fine and expected), a small pure function in `src/domain/colregs/` (e.g. `resolveDoubtGeometry.ts`) is consistent with existing patterns and gets the same unit-test rigor as the rest of the rules engine. Planner should decide during plan authoring; either location is architecturally valid.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build/test runtime | ✓ | v22.23.1 | — |
| npm | Package install | ✓ | 10.9.8 | — |
| slopcheck | Package legitimacy audit | ✓ | 0.6.1 | — |

No missing dependencies — this phase has no external services (no database, no browser-automation tooling) beyond the standard Node/npm toolchain already in use for Phases 1-3.

## Security Domain

This phase is entirely client-side rendering + a pure in-memory function call — no new network endpoints, no auth, no persisted user input (persistence is explicitly Phase 5). The applicable ASVS surface is minimal.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | No | Out of scope — no accounts (REQUIREMENTS.md "Out of Scope") |
| V3 Session Management | No | No sessions in this phase |
| V4 Access Control | No | No protected resources |
| V5 Input Validation | Yes | `VesselSchema` (Zod) — validate drag-derived/form-derived numeric vessel state before it reaches `classifyEncounter()`, exactly as already done at the Phase 3 tRPC boundary. Guards against `NaN`/`Infinity` position values a buggy pointer-event handler could otherwise produce reaching the domain layer's `Number.isFinite` guards as silent failures rather than caught, typed errors. |
| V6 Cryptography | No | No secrets/crypto in this phase |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|----------------------|
| Reflected/stored XSS via reasoning-trail text | Tampering/Info Disclosure | Not applicable here — trail `text` values are all static, developer-authored strings baked into `classify-encounter.ts` (not user input), and React's default JSX text-node escaping applies regardless. No `dangerouslySetInnerHTML` should be introduced to render trail text. |
| Malformed pointer-event-derived numeric input reaching domain math (`NaN`/`Infinity` propagation) | Tampering (of internal state, not external) | `VesselSchema.parse()`/`safeParse()` at the state-update choke point (Pattern 2's `applyVesselUpdate`), consistent with V5 above |

## Sources

### Primary (HIGH confidence)
- Context7 `/tailwindlabs/tailwindcss.com` — Tailwind v4 install (`npm i tailwindcss @tailwindcss/postcss`), PostCSS config migration, `@import "tailwindcss"` CSS-first config, Next.js App Router root-layout integration
- Context7 `/react/react` — `useTransition`/transition-lane semantics; `validateNoRefAccessInRender` compiler pass confirming refs must not be read/written during render
- Context7 `/testing-library/user-event` — `user.pointer([...])` drag-and-drop API, pointerdown/pointermove event dispatch behavior
- npm registry (`npm view <pkg> version`, 2026-07-17) — live version numbers for `tailwindcss`, `@tailwindcss/postcss`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom`, `@vitejs/plugin-react`, `@vitejs/plugin-react-swc`, `zustand`
- Direct codebase reads: `src/domain/colregs/classify-encounter.ts`, `src/domain/colregs/types.ts`, `src/domain/vessel/vessel.ts`, `src/domain/geometry/screen-convert.ts`, `src/domain/geometry/bearing.ts`, `src/domain/geometry/relative-bearing.ts`, `vitest.config.ts`, `tsconfig.json`, `package.json`

### Secondary (MEDIUM confidence)
- [blog.r0b.io — Creating drag interactions with setPointerCapture](https://blog.r0b.io/post/creating-drag-interactions-with-set-pointer-capture-in-java-script/) — core `pointerdown`/`setPointerCapture`/`pointermove`/`pointerup`/`releasePointerCapture` drag pattern
- [redblobgames.com — Draggable objects examples](https://www.redblobgames.com/making-of/draggable/examples.html) — decoupling drag-event-handling from state-update logic; multiple-handle pattern (did not cover rotation-angle computation specifically — filled from first-principles trig using the project's own `bearing()` convention instead)
- [nolanlawson.com — High-performance input handling on the web](https://nolanlawson.com/2019/08/11/high-performance-input-handling-on-the-web/) and [Browsers, input events, and frame throttling](https://nolanlawson.com/2019/08/14/browsers-input-events-and-frame-throttling/) — rationale for why manual rAF-throttling of `pointermove` is often unnecessary/browser-dependent, informing the "don't add throttling" recommendation
- [MDN — SVG Paths tutorial](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorials/SVG_from_scratch/Paths) and [Josh W. Comeau — Interactive Guide to SVG Paths](https://www.joshwcomeau.com/svg/interactive-guide-to-paths/) — arc command syntax (`A rx ry rotation large-arc-flag sweep-flag x y`) used for the doubt-overlay wedge

### Tertiary (LOW confidence)
- [GitHub vitest-dev/vitest#9279](https://github.com/vitest-dev/vitest/issues/9279) — unresolved, low-detail jsdom-latest + Vitest-4-latest incompatibility report; flagged as Pitfall 4, not confirmed reproducible, recommend early smoke-test rather than pre-emptive version pinning

## Metadata

**Confidence breakdown:**
- Standard stack (Tailwind v4, RTL, user-event versions): HIGH — Context7 + npm registry cross-verified
- Drag/Pointer-Events architecture: HIGH — well-documented, standard browser API, cross-verified across 2+ independent sources
- SVG arc/wedge geometry: HIGH — standard, well-documented SVG spec behavior
- jsdom/Vitest 4 compatibility: LOW — single unresolved GitHub issue, no root cause published
- Doubt-overlay `facts`-shape resolution (Pitfall 3): MEDIUM — derived directly from reading `classify-encounter.ts` source, not from an external source, but is a direct code-level observation rather than an assumption

**Research date:** 2026-07-17
**Valid until:** 30 days (stable stack; re-verify `tailwindcss`/`@testing-library/*` patch versions if planning is delayed past this window)
