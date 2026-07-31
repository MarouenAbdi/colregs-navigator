---
phase: 20-reasoning-trail-hero-visual-sync
reviewed: 2026-07-31T18:45:21Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - app/globals.css
  - eslint.config.mjs
  - src/components/hero/Hero.test.tsx
  - src/components/hero/HeroPreviewCard.tsx
  - src/components/hero/hero-preview-geometry.ts
  - src/components/hero/hero-preview-risk.ts
  - src/components/sandbox/SandboxContainer.test.tsx
  - src/components/sandbox/reasoning/ReasoningTrail.test.tsx
  - src/components/sandbox/reasoning/ReasoningTrail.tsx
findings:
  critical: 0
  warning: 4
  info: 3
  total: 7
status: issues_found
---

# Phase 20: Code Review Report

**Reviewed:** 2026-07-31T18:45:21Z
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

Reviewed the Reasoning Trail / Hero visual-sync phase: the new "NAV DECISION
CHAIN" trail card (`ReasoningTrail.tsx` + its `globals.css` animation layers),
the Hero preview card's bezel/radar-sweep rework (`HeroPreviewCard.tsx` +
`hero-preview-geometry.ts` + the net-new `hero-preview-risk.ts`), and the
supporting ESLint/test changes.

All 25 tests across the three touched test files pass, and `eslint` reports
zero errors against the touched source files. The geometry math in
`hero-preview-geometry.ts` was hand-traced against `chartToScreen()`'s actual
formula and checks out (vessel screen positions, range-ring radii, and
compass-ring radius all match the documented derivation). No security
vulnerabilities, crashes, or incorrect-behavior bugs were found — the issues
below are convention violations, duplication/drift risks, and a couple of
narrow display-formatting and test-assertion gaps.

The most substantive issue is `HeroPreviewCard.tsx` growing to 457 lines by
mixing real derived computation (unwrapping three domain `Result`s, deriving
range/pill-text/sector-path/heading-vectors/risk) directly in the component
body ahead of ~300 lines of SVG markup — the exact "computation entangled
with presentation" smell CLAUDE.md's own conventions call out for this
codebase.

## Warnings

### WR-01: HeroPreviewCard.tsx mixes derived computation with presentation, violating this repo's documented split-computation-from-presentation convention

**File:** `src/components/hero/HeroPreviewCard.tsx:114-159` (computation) immediately followed by `:160-457` (300 lines of JSX)
**Issue:** CLAUDE.md's "Conventions" section (established Phase 7, "generalized for all future frontend work") states: "When a component mixes non-trivial derived computation ... with JSX presentation, split it ... Signal that a split is overdue: a component file growing past ~150-200 lines by accumulating both derived math and markup." `HeroPreviewCard()` unwraps three domain `Result`s (`classifyEncounter`, `bearing`, `cpa`), computes `range` via `Math.hypot`, derives `vesselAPillText`/`vesselBPillText`, `sectorPath`, `headingVectorA/B`, `connectorMidpoint`, and `risk` — all inline in the component body — then renders a 300-line SVG tree. The file is now 457 lines, well past the documented threshold, and a reviewer who only cares about the SVG layout still has to read through the classification/geometry unwrapping to understand the component.
**Fix:** Extract a pure function (e.g. `deriveHeroPreviewCardData(vesselA, vesselB)` in a new `hero-preview-card-data.ts` or added to `hero-preview-geometry.ts`) that returns `{ classification, bearingDegrees, screenA, screenB, range, sectorPath, headingVectorA, headingVectorB, connectorMidpoint, risk, vesselAPillText, vesselBPillText }` (throwing the same fixture-invariant errors internally), and have `HeroPreviewCard()` call it once and render JSX only.

### WR-02: Range-ring `<circle>` elements are copy-pasted instead of mapped, unlike the parallel range-label array — a drift risk CLAUDE.md explicitly warns against

**File:** `src/components/hero/HeroPreviewCard.tsx:219-242` (three hand-copied `<circle>` blocks, one per `HERO_RANGE_RING_RADII_PX[0|1|2]`) vs. `:335-347` (`HERO_RANGE_LABEL_TEXT.map((label, i) => ...)` correctly mapped over the same parallel array)
**Issue:** `HERO_RANGE_RING_RADII_PX` (3-tuple) and `HERO_RANGE_LABEL_TEXT` (3-element array) are parallel arrays representing the same 3 range rings. The label text is correctly rendered via `.map()`, but the ring `<circle>` elements are three separately copy-pasted JSX blocks differing only by array index. If either array's length ever changes (e.g. a 4th range ring is added), the labels update automatically via the map but the rings would silently stay at 3 — exactly the "duplication... invisible until someone [changes] the second [instance]" failure mode CLAUDE.md's conventions section calls out by name (citing the project's own prior rotation-bug precedent).
**Fix:**
```tsx
{HERO_RANGE_RING_RADII_PX.map((radius, i) => (
  <circle
    key={radius}
    cx={HERO_CHART_CENTER.screenX}
    cy={HERO_CHART_CENTER.screenY}
    r={radius}
    stroke="rgba(45,212,191,0.16)"
    fill="none"
    strokeWidth={1}
  />
))}
```

### WR-03: Cardinal N/S/E/W labels are four near-identical, hand-duplicated `<text>` blocks instead of a parameterized loop

**File:** `src/components/hero/HeroPreviewCard.tsx:286-333`
**Issue:** The four cardinal-direction `<text>` elements are identical in every prop except `x`/`y` offset direction and the label string — the exact "near-identical JSX repeated for N data instances" pattern CLAUDE.md's conventions section says to extract rather than copy-paste ("Duplication here has bitten this project already").
**Fix:** Extract a small data-driven loop, e.g.:
```tsx
const CARDINAL_LABELS = [
  { label: "N", dx: 0, dy: -HERO_CARDINAL_LABEL_OFFSET_PX },
  { label: "S", dx: 0, dy: HERO_CARDINAL_LABEL_OFFSET_PX },
  { label: "E", dx: HERO_CARDINAL_LABEL_OFFSET_PX, dy: 0 },
  { label: "W", dx: -HERO_CARDINAL_LABEL_OFFSET_PX, dy: 0 },
] as const;
// ...
{CARDINAL_LABELS.map(({ label, dx, dy }) => (
  <text key={label} x={HERO_CHART_CENTER.screenX + dx} y={HERO_CHART_CENTER.screenY + dy} /* ...shared props */>
    {label}
  </text>
))}
```

### WR-04: Hero.test.tsx's "2.99 NM appears twice" assertion doesn't actually verify the documented invariant

**File:** `src/components/hero/Hero.test.tsx:31`
**Issue:** The comment above the assertion explicitly documents that `"2.99 NM"` "appears twice by design," but the assertion itself is `expect(screen.getAllByText("2.99 NM").length).toBeGreaterThan(0)`. This passes whether the text appears once, twice, or five times — it does not catch a regression where one of the two intended occurrences (the connector-line chip vs. the RANGE tile) silently disappears, which is the exact scenario the comment says the test is guarding against.
**Fix:**
```ts
expect(screen.getAllByText("2.99 NM")).toHaveLength(2);
```

## Info

### IN-01: `formatFactValue` relies on unchecked `as number` type assertions for facts typed only as a generic union

**File:** `src/components/sandbox/reasoning/ReasoningTrail.tsx:31-48`
**Issue:** `ReasoningTrailEntry["facts"]` is typed as `Record<string, number | string | boolean>` — TypeScript cannot statically guarantee that the value stored under `"tcpaMinutes"`/`"dcpaNm"`/`"relativeBearingAtoB"`/`"relativeBearingBtoA"` is actually a `number` for any given entry. `formatFactValue` bridges this gap with `(value as number).toFixed(...)` casts rather than a runtime check (`typeof value === "number"`). Today this is safe only because `classifyEncounter()` is documented to be the sole producer of these keys with consistent types; if that invariant is ever violated by a future domain change, this will throw an uncaught `TypeError: value.toFixed is not a function` at render time with no guard.
**Fix:** Add a `typeof` guard (or a `Record<string, number> | Record<string, string> | Record<string, boolean>` discriminated shape upstream in the domain types) so a shape drift fails a type-check instead of a runtime crash, e.g. `typeof value === "number" ? value.toFixed(1) : String(value)`.

### IN-02: Two functionally-identical CSS keyframes (`radar-sweep` and `sweep`) both defined in globals.css

**File:** `app/globals.css:209-213` (`@keyframes radar-sweep { to { transform: rotate(360deg); } }`) and `:350-354` (`@keyframes sweep { to { transform: rotate(360deg); } }`)
**Issue:** These two keyframe blocks are byte-for-byte identical in effect (a full 360° rotation), just given different names and applied with different `animation` shorthand durations (`.trail-token-sweep-ring`/`.radar-sweep-dot` use `radar-sweep`; `.hero-radar-sweep-inner` uses `sweep`). This is avoidable duplication — the same `@keyframes` can be reused across selectors with different `animation-duration` values.
**Fix:** Delete the `sweep` keyframe and point `.hero-radar-sweep-inner`'s animation at `radar-sweep` instead (`animation: radar-sweep 4.5s linear infinite;`).

### IN-03: BEARING tile's `Math.round(...).padStart(3, "0")` can format "360°" instead of wrapping to "000°"

**File:** `src/components/hero/HeroPreviewCard.tsx:450`
**Issue:** `bearing()` normalizes to `[0, 360)`, but `Math.round()` on a value like `359.6` yields `360`, which `padStart(3, "0")` renders as `"360°"` — outside the valid 000–359 compass display range. Not reachable today since the fixture's bearing is fixed at ~061°, and the same unguarded pattern already exists elsewhere in the codebase (`ChartFooterStrip.tsx`, `VesselOverlayCard.tsx`), so this isn't new to this phase — but since this phase touches this exact line, it's a good opportunity to fix it once rather than propagate it further.
**Fix:** `` `${(Math.round(bearingDegrees) % 360).toString().padStart(3, "0")}°` ``

---

_Reviewed: 2026-07-31T18:45:21Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
