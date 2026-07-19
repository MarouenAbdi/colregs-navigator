---
phase: 09-gallery
plan: 02
subsystem: ui
tags: [react, svg, tailwind, geometry, gallery]

requires:
  - phase: 07-hero
    provides: "hero-preview-geometry.ts's chart-drawing primitives and HeroPreviewCard.tsx's VesselMarker/chip conventions, the direct precedent this plan extracts and mirrors"
provides:
  - "src/components/shared/static-chart-geometry.ts: HULL_PATH/HULL_STROKE/HULL_STROKE_WIDTH/headingVectorEndpoint()/midpoint(), shared between Hero and Gallery's independent static illustrations"
  - "src/components/gallery/gallery-preview-geometry.ts: computeCardViewBox(), per-card dynamic bounding-box viewBox sizing for vessel pairs spanning 1.0-10.0 NM"
  - "src/components/gallery/GalleryPreviewChart.tsx: parametrized, role-colored static SVG mini-chart component ready for Plan 03's GalleryCard.tsx to consume"
  - "src/components/sandbox/vessel-role.ts: ROLE_STROKE_CLASS, mirroring ROLE_HULL_FILL_CLASS for stroke-based role coloring"
affects: ["09-gallery plan 03 (GalleryCard.tsx/GalleryContainer.tsx consume GalleryPreviewChart)"]

tech-stack:
  added: []
  patterns:
    - "Static illustration components (Hero, Gallery) share pure geometry primitives via src/components/shared/ once a genuine second consumer exists, per CLAUDE.md's 'extract only on a real second consumer' convention"
    - "Role-based (not vessel-slot-based) hull/pill/stroke coloring for any component with mutual-role vessel pairs: getVesselRole() + ROLE_HULL_FILL_CLASS/ROLE_STROKE_CLASS, never a hardcoded per-slot hex"

key-files:
  created:
    - src/components/shared/static-chart-geometry.ts
    - src/components/gallery/gallery-preview-geometry.ts
    - src/components/gallery/gallery-preview-geometry.test.ts
    - src/components/gallery/GalleryPreviewChart.tsx
    - src/components/gallery/GalleryPreviewChart.test.tsx
  modified:
    - src/components/hero/hero-preview-geometry.ts
    - src/components/hero/HeroPreviewCard.tsx
    - src/components/sandbox/vessel-role.ts

key-decisions:
  - "Extracted HULL_PATH/HULL_STROKE/HULL_STROKE_WIDTH/headingVectorEndpoint()/midpoint() to shared/static-chart-geometry.ts now that Gallery is a real second consumer, leaving HERO_VIEW_BOX/rings/gradient/bearingSectorPath() in hero-preview-geometry.ts since Gallery does not use any of those (D-09)"
  - "GalleryPreviewChart uses its own local 2-letter pill-text map (GW/SO/MU) rather than vessel-role.ts's ROLE_BADGE_TEXT.mutual (MUTUAL, 6 chars), per UI-SPEC.md Pitfall 3 to avoid overflow at the small pill scale"
  - "gallery-preview-geometry.ts's computeCardViewBox() stays Gallery-local, not shared/, since no second consumer of dynamic-bbox-from-vessel-pair sizing exists yet"

patterns-established:
  - "Shared static-chart geometry primitives live in src/components/shared/static-chart-geometry.ts; component-specific fixed-viewbox/gradient/ring constants stay in the owning component's own -geometry.ts file"

requirements-completed: [GAL-01]

duration: 25min
completed: 2026-07-19
---

# Phase 9 Plan 2: Shared Static-Chart Geometry Extraction + Gallery Mini-Chart Summary

**Extracted Hero's reusable hull/heading-vector/midpoint SVG geometry into `src/components/shared/static-chart-geometry.ts` and built `GalleryPreviewChart.tsx`, a parametrized role-colored mini-chart with a per-card dynamic viewBox spanning the gallery's 1.0-10.0 NM vessel-pair range.**

## Performance

- **Duration:** 25 min
- **Started:** 2026-07-19T09:45:00Z
- **Completed:** 2026-07-19T10:10:00Z
- **Tasks:** 3
- **Files modified:** 8 (4 created, 1 test-only created alongside its implementation for Task 2, and 1 test-only created for Task 3; 3 modified)

## Accomplishments
- Extracted the 5 chart-drawing primitives Hero's preview card and Gallery's new mini-chart both need into `src/components/shared/static-chart-geometry.ts`, with zero visual regression to Hero (verified by its existing test suite passing unchanged)
- Implemented `computeCardViewBox()`, a pure per-card dynamic bounding-box function that correctly sizes/centers a viewBox for vessel pairs ranging from 1.0 NM to 10.0 NM apart, TDD'd against 4 behaviors including the coincident-axis edge case
- Built `GalleryPreviewChart.tsx`, a parametrized static SVG mini-chart that derives every hull/pill/heading-vector color from the vessel's actual give-way/stand-on/mutual role (never a hardcoded per-slot color), TDD'd against give-way, mutual, and fixture-invariant-error behaviors
- Added `ROLE_STROKE_CLASS` to `vessel-role.ts`, mirroring the existing `ROLE_HULL_FILL_CLASS` pattern for Gallery's role-colored dashed heading-vector lines

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract static-chart-geometry.ts and add ROLE_STROKE_CLASS** - `9b62c77` (refactor)
2. **Task 2: gallery-preview-geometry.ts (per-card dynamic viewBox)** - `4b2d5cd` (test, RED) then `1b63424` (feat, GREEN)
3. **Task 3: GalleryPreviewChart.tsx (parametrized mini-chart)** - `a480d57` (test, RED) then `878f6de` (feat, GREEN)

**Plan metadata:** (this commit)

_TDD tasks (2, 3) each have a RED test commit followed by a GREEN implementation commit._

## Files Created/Modified
- `src/components/shared/static-chart-geometry.ts` - New shared file: `HULL_PATH`, `HULL_STROKE`, `HULL_STROKE_WIDTH`, `headingVectorEndpoint()`, `midpoint()`, moved verbatim out of `hero-preview-geometry.ts`
- `src/components/hero/hero-preview-geometry.ts` - The 5 moved exports removed; `HERO_CONTAINER_SIZE`/`HERO_VIEW_BOX`/`HERO_CHART_CENTER`/ring radii/slot colors/`bearingSectorPath()` unchanged
- `src/components/hero/HeroPreviewCard.tsx` - Import block split across `hero-preview-geometry.js` and the new `shared/static-chart-geometry.js`; no JSX/rendering logic changed
- `src/components/sandbox/vessel-role.ts` - Added `ROLE_STROKE_CLASS: Record<VesselRole, string>` mapping to `stroke-give-way`/`stroke-stand-on`/`stroke-mutual`
- `src/components/gallery/gallery-preview-geometry.ts` - `computeCardViewBox(a, b, aspectRatio, paddingFraction)`, Gallery-local per-card dynamic viewBox math
- `src/components/gallery/gallery-preview-geometry.test.ts` - 4 unit tests: aspect-ratio enforcement + containment, 1.0/10.0 NM range validity, coincident-axis guard, midpoint-centering
- `src/components/gallery/GalleryPreviewChart.tsx` - Parametrized mini-chart accepting `vesselA`/`vesselB`: grid pattern, connector line, role-colored hulls, label badges, GW/SO/MU pills, dashed role-colored heading vectors, range-label chip
- `src/components/gallery/GalleryPreviewChart.test.tsx` - 3 RTL tests: give-way-type role-correct pills, mutual-type both-MU pills + mutual fill class, fixture-invariant Error throw on coincident-position vessels

## Decisions Made
- Followed the plan's extraction scope exactly (D-09): only the 5 primitives Gallery genuinely needs moved to `shared/`; Hero's rings/gradient/fixed-viewbox constants stay component-local since Gallery has no use for them (per UI-SPEC.md's Mini-Chart Contract, which confirms rings/gradient are absent from every gallery card)
- Local `PILL_TEXT` map in `GalleryPreviewChart.tsx` (not `vessel-role.ts`'s `ROLE_BADGE_TEXT`) for the 2-letter hull-adjacent pill, per UI-SPEC.md Pitfall 3

## Deviations from Plan

None - plan executed exactly as written, including the UI-SPEC.md-mandated grid-pattern-present correction (the plan's Task 3 action text already reflected this correction, so no additional deviation was needed).

## Issues Encountered

`npx tsc --noEmit` reports a pre-existing, unrelated failure (`src/server/db/client.ts` cannot resolve `../../../generated/prisma/client.js`) because this worktree has no `.env`/`DATABASE_URL` and the Prisma client was never generated. This is an environment/setup gap, not caused by this plan's presentation-layer changes — none of the modified/created files touch Prisma. Logged to `.planning/phases/09-gallery/deferred-items.md`; functional verification instead used `npx vitest run` against all files this plan's `<verification>` block specifies (10/10 tests pass across 4 test files).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
`GalleryPreviewChart.tsx` is ready for Plan 03 to consume in `GalleryCard.tsx`/`GalleryContainer.tsx` (accepts any `vesselA`/`vesselB` `Vessel` pair, throws a descriptive Error on invalid/coincident-position input, correctly role-colors mutual-role cards). No blockers for Plan 03.

---
*Phase: 09-gallery*
*Completed: 2026-07-19*

## Self-Check: PASSED

All created files verified present on disk; all task commit hashes (9b62c77, 4b2d5cd, 1b63424, a480d57, 878f6de) verified present in git log. Full plan verification suite (`gallery-preview-geometry.test.ts`, `GalleryPreviewChart.test.tsx`, `Hero.test.tsx`, `hero-preview-fixture.test.ts`) plus `vessel-role.test.ts` re-run: 16/16 tests pass across 5 files.
