---
phase: 20-reasoning-trail-hero-visual-sync
plan: 04
subsystem: ui
tags: [react, tailwind, svg, hero, design-sync]

# Dependency graph
requires:
  - phase: 20-03
    provides: "hero-preview-geometry.ts's HERO_RANGE_RING_RADII_PX/HERO_COMPASS_*/HERO_CARDINAL_LABEL_OFFSET_PX/HERO_RANGE_LABEL_TEXT constants, plus the deliberately-kept-alive HERO_OUTER_RING_RADIUS_PX/HERO_INNER_RING_RADIUS_PX exports this plan retires"
  - phase: 20-01
    provides: ".hero-radar-sweep/.hero-radar-sweep-inner CSS classes (app/globals.css), consumed here by className reference only"
provides:
  - "HeroPreviewCard.tsx's bezel SVG extended with 3 range rings, a dashed 2-layer compass-tick ring, a full N-S/E-W crosshair, 4 cardinal labels, 3 range labels, and a center hub -- all inside the unchanged 320x200 viewBox"
  - "A CSS-only radar-sweep overlay (position: absolute sibling of the SVG, inside a position: relative wrapper) completing HERO-05's visual-fidelity requirement"
  - "HERO_OUTER_RING_RADIUS_PX/HERO_INNER_RING_RADIUS_PX fully deleted from hero-preview-geometry.ts, completing the migration plan 20-03 deferred"
affects: ["20-05 (human-browser verification of unchanged card height and /#gallery scroll behavior)"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Decorative bezel elements (crosshair/compass/labels/hub) render before the classification-driven sector path/vessel markers in SVG paint order, so they always sit visually behind the data-driven elements"

key-files:
  created: []
  modified:
    - src/components/hero/HeroPreviewCard.tsx
    - src/components/hero/hero-preview-geometry.ts
    - eslint.config.mjs

key-decisions:
  - "Added hero-radar-sweep(-inner) to eslint.config.mjs's better-tailwindcss/no-unknown-classes ignore list -- real plain CSS classes (plan 20-01), not Tailwind utilities, mirroring the hero-live-pulse/radar-sweep-dot precedent from plan 20-03/Phase 19"

requirements-completed: [HERO-05]

# Metrics
duration: ~20min
completed: 2026-07-28
---

# Phase 20 Plan 04: Hero Bezel SVG Extension & Radar-Sweep Overlay Summary

**Hero preview card's SVG bezel extended to 3 range rings + dashed compass-tick ring + full crosshair + cardinal/range labels + center hub, plus a CSS-only radar-sweep overlay -- entirely within the pre-existing 320x200 viewBox, with zero change to any classifyEncounter()/bearing()/cpa() call or fixture value.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-07-28T08:05Z (worktree base correction + read phase)
- **Completed:** 2026-07-28T08:26Z
- **Tasks:** 2 completed
- **Files modified:** 3

## Accomplishments
- Replaced the 2 legacy range-ring `<circle>` elements with 3, driven by `HERO_RANGE_RING_RADII_PX`, and migrated the `radialGradient`'s `r` and the north-reference line's `y2` off the retired ring constants
- Added the full decorative bezel: N-S/E-W crosshair, 2-layer dashed compass-tick ring, 4 cardinal (`N`/`S`/`E`/`W`) labels, 3 range labels (`0.5/1.0/1.5 NM`), and a center hub -- all painted behind the sector wedge and vessel markers
- Deleted `HERO_OUTER_RING_RADIUS_PX`/`HERO_INNER_RING_RADIUS_PX` from `hero-preview-geometry.ts`, completing the constant-retirement migration plan 20-03 intentionally deferred here
- Added the `.hero-radar-sweep`/`.hero-radar-sweep-inner` CSS-only overlay as an absolutely-positioned sibling of the `<svg>`, inside a newly `relative`-positioned chart-wrapper div

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend the bezel SVG -- 3rd ring, compass ticks, crosshair, cardinal/range labels, center hub** - `811979b` (feat)
2. **Task 2: Add the radar-sweep overlay div and confirm Hero.test.tsx** - `48f4a20` (feat, includes the eslint ignore-list deviation fix)

## Files Created/Modified
- `src/components/hero/HeroPreviewCard.tsx` - Bezel SVG extended (3 range rings, crosshair, compass ticks, cardinal/range labels, center hub); import list migrated off the retired ring constants onto the new geometry constants; radar-sweep overlay div added as a `relative`-wrapped sibling of the SVG
- `src/components/hero/hero-preview-geometry.ts` - `HERO_OUTER_RING_RADIUS_PX`/`HERO_INNER_RING_RADIUS_PX` exports deleted (zero remaining consumers anywhere in the codebase)
- `eslint.config.mjs` - Added `^hero-radar-sweep(-inner)?$` to the `better-tailwindcss/no-unknown-classes` ignore list

## Decisions Made
- Followed the plan's exact bezel-element ordering (rings -> crosshair/compass/labels/hub -> sector path) so decorative elements never visually occlude classification-driven elements, matching the plan's explicit paint-order instruction.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added `hero-radar-sweep`/`hero-radar-sweep-inner` to eslint's Tailwind-unknown-class ignore list**
- **Found during:** Task 2 (radar-sweep overlay div)
- **Issue:** `eslint-plugin-better-tailwindcss`'s `no-unknown-classes` rule (pre-commit hook, `eslint --fix`) flagged `hero-radar-sweep`/`hero-radar-sweep-inner` (real, plain CSS classes defined in `app/globals.css` by plan 20-01) as unknown/invalid Tailwind classes, since neither is a Tailwind utility and the plugin's compiler-backed check can't generate CSS for them -- blocking the commit.
- **Fix:** Added `^hero-radar-sweep(-inner)?$` to `eslint.config.mjs`'s existing ignore list, alongside the pre-existing `radar-sweep-dot`/`trail-*`/`hero-live-pulse` entries (identical precedent from Phase 19 and plan 20-03).
- **Files modified:** `eslint.config.mjs`
- **Verification:** `npx eslint src/components/hero/HeroPreviewCard.tsx eslint.config.mjs` reports 0 errors/warnings after the fix.
- **Committed in:** `48f4a20` (part of Task 2's commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to keep the repo lint-clean after consuming plan 20-01's new CSS classes; matches an established codebase precedent exactly (3rd occurrence of this exact false-positive class). No scope creep.

## Issues Encountered
- This worktree's HEAD was initially on an ancestor commit lacking the phase 20 plan files entirely (missing `20-04-PLAN.md` etc.); corrected via `git reset --hard` to the expected base commit (`7fab926f2c71be74d5287ad3fc93c279cae7fcfb`), verified as the exact target commit before any task work began -- same class of issue plan 20-03 encountered and documented.
- `npx tsc --noEmit` project-wide reports one pre-existing, out-of-scope error (`src/server/db/client.ts` can't resolve `generated/prisma/client.js`) caused by this worktree lacking a reachable `DATABASE_URL`/generated Prisma client -- already documented in `deferred-items.md` from plans 20-02/20-03, not caused by this plan's changes, and not touched (scope-boundary rule). All of this plan's own scoped checks (`Hero.test.tsx`, targeted greps) pass cleanly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `HeroPreviewCard.tsx`'s bezel visually matches the design's richer instrument-panel aesthetic, entirely within the unchanged 320x200 viewBox; `Hero.test.tsx` passes unmodified (no new text-content collision from the cardinal/range labels).
- Plan 20-05's human-browser verification (unchanged card height, unaffected `/#gallery` anchor-scroll behavior) can proceed against this plan's final markup -- no automated-check gaps remain from this plan's scope.
- `HERO_OUTER_RING_RADIUS_PX`/`HERO_INNER_RING_RADIUS_PX` have zero remaining references anywhere in the codebase; the plan 20-03 -> 20-04 constant-retirement migration is fully complete.

---
*Phase: 20-reasoning-trail-hero-visual-sync*
*Completed: 2026-07-28*

## Self-Check: PASSED

All modified files confirmed present in the worktree: `HeroPreviewCard.tsx`,
`hero-preview-geometry.ts`, `eslint.config.mjs`, `20-04-SUMMARY.md`.
All 3 task/SUMMARY commits confirmed present in `git log`: `811979b`,
`48f4a20`, `2228c54` (this SUMMARY commit).
