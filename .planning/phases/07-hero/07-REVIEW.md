---
phase: 07-hero
reviewed: 2026-07-18T18:50:00Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - src/components/hero/Hero.tsx
  - src/components/hero/HeroPreviewCard.tsx
  - src/components/hero/hero-preview-geometry.ts
  - src/components/hero/hero-preview-fixture.ts
  - src/components/hero/hero-preview-fixture.test.ts
  - src/components/hero/Hero.test.tsx
  - src/components/ui/card.tsx
  - src/components/ui/badge.tsx
  - src/components/shared/SectionGridBackground.tsx
  - src/components/shared/README.md
  - src/components/sandbox/ChartPanel.tsx
  - app/page.tsx
  - app/globals.css
findings:
  critical: 0
  warning: 2
  info: 6
  total: 8
status: issues_found
---

# Phase 07: Code Review Report

**Reviewed:** 2026-07-18T18:50:00Z
**Depth:** standard
**Files Reviewed:** 13
**Status:** issues_found

## Summary

This is the final review pass after the Hero section's design-fidelity fixes and its
computation/presentation refactor (`Hero.tsx` → `Hero.tsx` + `HeroPreviewCard.tsx` +
`hero-preview-geometry.ts`). No security issues, crashes, or data-loss risks were found.
The refactor itself is sound: `hero-preview-geometry.ts` is confirmed free of React/JSX
imports (pure functions only), the derived viewBox/screen-position constants were checked
against `chartToScreen()`'s actual formula and reproduce the documented pixel values
(vessel A at screen (100,140), vessel B at ~(239.5, 62.7)), and the `VesselMarker`
extraction correctly keeps the rotating hull group separate from the non-rotating
label/pill groups, matching the documented intent. `ChartPanel.tsx`'s changes were
diffed against the prior commit (`git diff origin/main...HEAD`) and confirmed to be
exactly three color-literal changes (`GRID_STROKE`, `CONE_DEFAULT_STROKE`, the canvas
`bg`/`border` classes) — no hit-testing geometry, coordinates, or event handlers were
touched.

Two Warning-level findings remain, both logic/edge-case gaps rather than active bugs
given the current fixed fixture, plus several Info-level maintainability notes. All
tests in `src/components/hero/` pass (`vitest run src/components/hero`: 2 files, 3
tests, all green).

The `href="#gallery"` anchor in `Hero.tsx` has no matching in-page target on
`app/page.tsx` today. Per CONTEXT.md decision D-06, this is expected: the Gallery
section ships in Phase 9, not this phase. Noted below as an accepted no-op, not a bug.

## Warnings

### WR-01: Unsafe cast discards the nullable/mutual-obligation `giveWay` case

**File:** `src/components/hero/HeroPreviewCard.tsx:111,114-115`
**Issue:** `ClassificationResult.giveWay` is typed `VesselLabel | null` — `null` is a
real, documented value (Rule 14 head-on encounters between same-priority-tier vessels,
per `src/domain/colregs/types.ts`'s `ClassificationResult` docstring). This line casts
it away instead of narrowing it:

```ts
const giveWayLabel = VESSEL_LABEL_TEXT[classification.giveWay as VesselLabel];
const verdictText = `${ENCOUNTER_TYPE_TITLE[classification.encounterType]} — ${giveWayLabel} gives way`;
...
const vesselAPillText = classification.giveWay === "vesselA" ? "GW" : "SO";
const vesselBPillText = classification.giveWay === "vesselB" ? "GW" : "SO";
```

If `classification.giveWay` were ever `null` (e.g. the fixture is changed to a head-on
encounter between two same-tier power-driven vessels), `VESSEL_LABEL_TEXT[null]` is
`undefined`, so the verdict banner would silently render `"Head-on — undefined gives
way"`, and *both* vessel pills would fall through to `"SO"` — actively wrong, since a
mutual-obligation head-on encounter has no stand-on vessel either. This is harmless
today only because `hero-preview-fixture.ts` is hardcoded to a `"crossing"` encounter,
where `giveWay`/`standOn` are contractually always non-null. It is also inconsistent
with this same file's own pattern three lines above, which throws a developer-facing
error for other invariant violations (`classifyEncounter`/`bearing`/`cpa` failing)
rather than silently casting past them.

**Fix:** Either throw the same kind of invariant error used elsewhere in this file when
`giveWay` is `null` (since a `null` giveWay for this fixture would indicate the fixture
itself was changed to something the preview card wasn't designed to render), or handle
the mutual case explicitly:

```ts
if (classification.giveWay === null) {
  throw new Error(
    "Hero preview fixture produced a mutual-obligation (null giveWay) result -- " +
      "HeroPreviewCard's verdict/pill rendering doesn't support this case",
  );
}
const giveWayLabel = VESSEL_LABEL_TEXT[classification.giveWay];
```

### WR-02: Bearing-sector arc hardcodes `large-arc-flag=0`, silently assumes bearing < 180°

**File:** `src/components/hero/hero-preview-geometry.ts:69-81` (called from
`HeroPreviewCard.tsx:117`)
**Issue:** `bearingSectorPath()` builds an SVG arc from due north to the bearing edge
with the large-arc-flag hardcoded to `0`:

```ts
`A ${HERO_OUTER_RING_RADIUS_PX} ${HERO_OUTER_RING_RADIUS_PX} 0 0 1 ${bearingEdge.x} ${bearingEdge.y}`,
```

This is correct for the fixture's current bearing (61°), but SVG's large-arc-flag must
be `1` whenever the swept angle exceeds 180° for the arc to render as the intended
wedge rather than folding the wrong way. Compare with the equivalent, already-fixed
cone-wedge helper in `ChartPanel.tsx:109`, which computes this flag dynamically
(`endBearingDeg - startBearingDeg > 180 ? 1 : 0`) even though its own span is also
currently fixed at 135°. `bearingSectorPath()` has no such guard and no runtime
assertion that `bearingDegrees < 180`, so a future fixture change producing a bearing
≥ 180° would silently render an incorrect sector shape with no error surfaced.

**Fix:** Compute the flag from the actual angle, mirroring `wedgePath()`'s pattern:

```ts
export function bearingSectorPath(bearingDegrees: number): string {
  ...
  const largeArcFlag = bearingDegrees > 180 ? 1 : 0;
  return [
    `M ${HERO_CHART_CENTER.screenX} ${HERO_CHART_CENTER.screenY}`,
    `L ${northEdge.x} ${northEdge.y}`,
    `A ${HERO_OUTER_RING_RADIUS_PX} ${HERO_OUTER_RING_RADIUS_PX} 0 ${largeArcFlag} 1 ${bearingEdge.x} ${bearingEdge.y}`,
    "Z",
  ].join(" ");
}
```

## Info

### IN-01: `href="#gallery"` anchor has no in-page target (accepted, not a bug)

**File:** `src/components/hero/Hero.tsx:46`
**Issue:** `app/page.tsx` renders only `<Hero />` and `<section id="sandbox">` — there is
no `id="gallery"` element on the page yet, so this CTA is currently a no-op click.
Confirmed accepted per CONTEXT.md decision D-06: the Gallery section ships in Phase 9,
not this phase. No fix needed now; flagged only so this doesn't get rediscovered as a
"bug" in a future review before Phase 9 lands.

### IN-02: No dedicated unit tests for `hero-preview-geometry.ts`'s pure functions

**File:** `src/components/hero/hero-preview-geometry.ts`
**Issue:** `headingVectorEndpoint()`, `bearingSectorPath()`, and `midpoint()` are pure,
framework-free functions — exactly the kind of code CLAUDE.md's testing priorities and
this repo's own new Conventions section ("split computation from presentation... zero
React/JSX, independently unit-testable") call out as testable in isolation. They're
currently exercised only indirectly, through `Hero.test.tsx`'s single rendering
assertion. A direct `hero-preview-geometry.test.ts` (even a few numeric-fixture
assertions, e.g. asserting `bearingSectorPath(61)` produces the exact path string, or
`headingVectorEndpoint` for a few heading values) would have caught WR-02 above and
would guard against regressions the same way `hero-preview-fixture.test.ts` guards the
fixture.

**Fix:** Add `src/components/hero/hero-preview-geometry.test.ts` with a small set of
numeric-fixture assertions for each exported function.

### IN-03: `range` computed inline in the presentation component, not in the geometry module

**File:** `src/components/hero/HeroPreviewCard.tsx:106-109`
**Issue:**

```ts
const range = Math.hypot(
  heroPreviewVesselB.position.x - heroPreviewVesselA.position.x,
  heroPreviewVesselB.position.y - heroPreviewVesselA.position.y,
);
```

is derived computation living in the presentation file, the exact pattern this phase's
refactor (and the newly-added CLAUDE.md convention "split computation from
presentation") was meant to eliminate. It's low-risk on its own (four lines, no branching),
but it's the one remaining piece of non-trivial math that didn't move into
`hero-preview-geometry.ts` alongside `headingVectorEndpoint`/`bearingSectorPath`/`midpoint`.

**Fix:** Move to `hero-preview-geometry.ts` as an exported `rangeNm(a, b)` (or reuse a
shared distance helper if one exists in `src/domain/geometry/`), for consistency with
the rest of the module and to pick up IN-02's suggested test coverage in one place.

### IN-04: `CardContent` spacing via manual `mt-*` margins instead of `gap-*`

**File:** `src/components/hero/HeroPreviewCard.tsx:132,236,241`
**Issue:** `CardContent` is rendered with `className="flex flex-col"` (no `gap`), and
each subsequent child instead carries its own `mt-3`/`mt-2` top margin. This is
functionally equivalent to a `gap-*` utility on the flex container but is more fragile
to reorder (a child inserted at the top would need a fresh margin added by hand,
whereas `gap` handles that automatically) and is inconsistent with the `gap-2`/`gap-3`
patterns used elsewhere in the same file (e.g. `CardHeader`'s `flex flex-row ... gap-*`
spans, `Card`'s own `gap-3`).

**Fix:** `<CardContent className="flex flex-col gap-3">` and drop the per-child `mt-*`
utilities.

### IN-05: Grid-gradient CSS duplicated between `.section-grid-overlay` and its `--glow` modifier

**File:** `app/globals.css:159-173`
**Issue:** `.section-grid-overlay--glow` fully redefines `background-image` rather than
composing with the base rule, so the two `repeating-linear-gradient(...)` declarations
(including the `47px 48px` cadence) are duplicated verbatim across both selectors. This
works correctly today (both classes are applied together on the glow variant, and the
later selector wins the `background-image` property by source order — verified: no
extra specificity involved, purely order-dependent), but the grid cadence now has two
places that must be kept in sync by hand.

**Fix:** Either give the radial glow its own layered rule that composes with the base
class without repeating the grid gradients (e.g. apply the glow as a `::before`
pseudo-element, or use a CSS custom property for the grid `background-image` value that
both rules reference), or add a comment at both call sites cross-referencing the other
so a future cadence change isn't made in only one place.

### IN-06: Chart-canvas background hex `#0B0B0E` hardcoded identically in two components

**File:** `src/components/hero/HeroPreviewCard.tsx:133`,
`src/components/sandbox/ChartPanel.tsx:323`
**Issue:** Both the Hero preview card's mini-chart and the real `ChartPanel.tsx` use the
literal `bg-[#0B0B0E]` for their canvas background — the same value, defined twice as an
arbitrary Tailwind value rather than as a shared CSS custom property. This is the one
canvas-background color in the app that isn't wired through the centralized dark
palette in `app/globals.css`'s `:root`/`.dark` blocks (`--card`, `--background`, etc.),
so a future palette tweak to this specific shade would require finding and updating both
literals by hand.

**Fix:** Add a `--chart-canvas` (or similarly named) custom property to `app/globals.css`
alongside the existing palette variables, and reference it from both components
(`bg-[var(--chart-canvas)]` or a `--color-chart-canvas` Tailwind v4 theme token).

---

_Reviewed: 2026-07-18T18:50:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
