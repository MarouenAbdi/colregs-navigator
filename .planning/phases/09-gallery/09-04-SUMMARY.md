---
phase: 09-gallery
plan: 04
subsystem: ui
tags: [nextjs, react, tailwind, shadcn, manual-verification]

# Dependency graph
requires:
  - phase: 09-gallery
    provides: GalleryCard, GalleryContainer, /gallery redirect (plan 09-03)
provides:
  - Human-confirmed pass on GAL-01/GAL-03/GAL-04's real-browser behavior
  - Fix for 4 design-fidelity gaps found during the checkpoint (grid background, hover border, body-weight fonts, verdict badge shape)
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - src/components/gallery/GalleryContainer.tsx
    - src/components/gallery/GalleryCard.tsx

key-decisions:
  - "Gallery section now wraps in relative overflow-hidden + SectionGridBackground opacity={0.18}, matching Hero's own pattern (Hero uses 0.22 + glow) per the shared component's own doc comment intent."
  - "Verdict badge switched from a raw <span rounded-md> to the shared Badge component (pill shape, rounded-4xl), matching Rule-N badge and ControlPanel.tsx's established Badge+ROLE_BADGE_CLASSNAME composition."

patterns-established: []

requirements-completed: [GAL-01, GAL-03, GAL-04]

# Metrics
duration: 25min
completed: 2026-07-19
---

# Phase 9: Gallery Summary (Plan 04 — Manual Browser Verification)

**Human-confirmed GAL-03 redirect/anchor-scroll behavior and GAL-01 responsive grid fidelity, plus 4 design-fidelity fixes found and resolved during the checkpoint**

## Performance

- **Duration:** ~25 min
- **Tasks:** 1 (checkpoint:human-verify)
- **Files modified:** 2

## Accomplishments
- Confirmed via curl (no browser extension available) that `/gallery` returns a `308 Permanent Redirect` to `/#gallery`, and that the home page's server-rendered HTML (fetched without JS) includes `id="gallery"` and all 6 curated card titles — satisfying GAL-04's server-rendering requirement.
- Human tester verified the remaining browser-only checks (fresh-tab redirect scroll, in-app anchor click scroll, responsive 3/2/1-column grid, card click-through) directly against the running dev server and reported design-fidelity issues, which were then fixed and re-confirmed ("all looking good").
- Found and fixed 4 real bugs in Plan 09-03's implementation, verified against 09-UI-SPEC.md:
  1. `GalleryContainer.tsx` never rendered `SectionGridBackground` — the section had no grid overlay at all (Hero has one).
  2. Subhead and card description paragraphs were missing `font-semibold` (spec's Body role is 16px/600; they rendered at default weight).
  3. `GalleryCard`'s `Card` had `border-border` (color only) with no `border` width utility, so the border — and its hover-to-`border-primary/40` transition — was invisible.
  4. The verdict badge was a raw `<span rounded-md>` instead of the shared `Badge` component, so it didn't match the pill shape (`rounded-4xl`) used by the Rule-N badge and `ControlPanel.tsx`'s own verdict badge.

## Task Commits

1. **Task 1: Manual browser verification** — no code commit (pure verification gate)
2. **Fix: checkpoint-found design-fidelity gaps** - `a0c70d2` (fix)

## Files Created/Modified
- `src/components/gallery/GalleryContainer.tsx` - Wrapped section in `relative overflow-hidden` + `SectionGridBackground opacity={0.18}`; added `font-semibold` to subhead
- `src/components/gallery/GalleryCard.tsx` - Added `border` width utility, replaced no-op `group-hover:bg-card` with `group-hover:shadow-sm`, replaced raw verdict `<span>` with `Badge`, added `font-semibold` to description

## Decisions Made
- Used `shadow-sm` for the hover lift rather than the spec's `bg-card/80`→`bg-card` alternative (spec explicitly offers both), since Card already defaults to `bg-card` and touching the resting-state background risked an unrelated visual change beyond what was reported.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Gallery section missing SectionGridBackground**
- **Found during:** Task 1 (manual browser checkpoint) — user reported "the grid background isn't there for the section (Same as Hero)"
- **Issue:** `GalleryContainer.tsx` composed its content in a plain `<div>`, never importing or rendering the shared `SectionGridBackground` component that Hero already uses, despite that component's own doc comment explicitly anticipating Gallery as its second consumer
- **Fix:** Wrapped the container in `<section className="relative overflow-hidden bg-background">` and added `<SectionGridBackground opacity={0.18} />` before the content div (now `relative z-[1]`)
- **Files modified:** src/components/gallery/GalleryContainer.tsx
- **Verification:** `curl` of the rendered home page HTML shows `<div aria-hidden="true" class="section-grid-overlay" style="--grid-opacity:0.18">` inside the Gallery section; user confirmed visually
- **Committed in:** a0c70d2

**2. [Rule 2 - Missing Critical] Card hover border invisible (no border-width utility)**
- **Found during:** Task 1 — user reported "the hover styles aren't there"
- **Issue:** `Card` className had `border-border` (sets `border-color` only) with no `border` utility (which sets `border-width: 1px`); Tailwind's preflight resets border-width to 0 by default, so no border — and no visible hover-color transition — ever rendered
- **Fix:** Added `border` to the className list alongside `border-border`; also swapped `group-hover:bg-card` (a no-op since `Card` already defaults to `bg-card`) for `group-hover:shadow-sm` per the UI-SPEC's alternative hover-lift option
- **Files modified:** src/components/gallery/GalleryCard.tsx
- **Verification:** `curl` of rendered HTML confirms `border border-border ... group-hover:border-primary/40 group-hover:shadow-sm` in the card's class list; user confirmed visually
- **Committed in:** a0c70d2

**3. [Rule 2 - Missing Critical] Body-role text missing font-semibold**
- **Found during:** Task 1 — user reported "the fonts... aren't according to design"
- **Issue:** 09-UI-SPEC.md's Typography section specifies Body role at 16px/600, but the section subhead and card description paragraphs only had `text-base`/`text-muted-foreground` with no explicit font-weight, rendering at the browser default weight instead of 600
- **Fix:** Added `font-semibold` to both paragraphs
- **Files modified:** src/components/gallery/GalleryContainer.tsx, src/components/gallery/GalleryCard.tsx
- **Verification:** User confirmed visually after fix
- **Committed in:** a0c70d2

**4. [Rule 2 - Missing Critical] Verdict badge shape inconsistent with design**
- **Found during:** Task 1 — user reported "chips styles on the cards aren't according to design"
- **Issue:** The verdict badge ("A GIVES WAY"/"MUTUAL") was a raw `<span className="... rounded-md border ...">` instead of the shared shadcn `Badge` component, giving it a boxy rectangle shape instead of the pill shape (`rounded-4xl`) that the Rule-N badge (same card) and `ControlPanel.tsx`'s equivalent verdict badge both use
- **Fix:** Replaced the raw `<span>` with `<Badge variant="outline" className={...}>`, matching `ControlPanel.tsx`'s established `Badge` + `ROLE_BADGE_CLASSNAME` composition pattern
- **Files modified:** src/components/gallery/GalleryCard.tsx
- **Verification:** `GalleryCard.test.tsx`'s existing text/role-based queries (not className assertions) continue to pass unchanged; user confirmed visually
- **Committed in:** a0c70d2

---

**Total deviations:** 4 auto-fixed (all Rule 2 - Missing Critical, all design-fidelity gaps against 09-UI-SPEC.md)
**Impact on plan:** All four fixes bring the already-merged Plan 09-03 implementation into conformance with the approved UI-SPEC. No scope creep — no new features, only correcting gaps between the implementation and the already-locked design contract.

## Issues Encountered
- The Claude-in-Chrome browser extension was not connected in this session, so the redirect/anchor-scroll and responsive-grid checks could not be driven directly; the human tester performed those checks against the running dev server instead. Server-rendering (GAL-04) and redirect mechanics (308 + correct Location header) were independently confirmed via `curl`.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 9 (Gallery) implementation is now complete and visually verified against 09-UI-SPEC.md.
- No known blockers remain for phase-level verification.

---
*Phase: 09-gallery*
*Completed: 2026-07-19*
