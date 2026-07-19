---
phase: 09-gallery
plan: 03
subsystem: ui
tags: [react, nextjs, trpc, tailwind, server-components]

requires:
  - phase: 09-gallery (Plan 01)
    provides: curated scenario seed data with title/ruleLabel columns
  - phase: 09-gallery (Plan 02)
    provides: GalleryPreviewChart + shared static-chart-geometry primitives
provides:
  - GalleryCard.tsx (mini-chart + Rule-N badge + verdict badge + title/description, whole-card Link)
  - GalleryContainer.tsx (async Server Component, fetches gallery.list(), responsive 3/2/1 grid)
  - Gallery section embedded on the home page below Sandbox
  - Permanent redirect /gallery -> /#gallery, old /gallery route removed
affects: [none — this is the final plan of the final phase of the v1.1 milestone]

tech-stack:
  added: []
  patterns:
    - "Card-footer verdict badge derivation kept local to GalleryCard.tsx (not shared with the mini-chart's 2-letter pill map), per 09-UI-SPEC.md's explicit distinction between the two badge scales"
    - "next.config.ts redirects() as a sibling key alongside existing turbopack/webpack/typescript config, static string literals only (no open-redirect surface)"

key-files:
  created:
    - src/components/gallery/GalleryCard.tsx
    - src/components/gallery/GalleryCard.test.tsx
    - src/components/gallery/GalleryContainer.tsx
    - src/components/gallery/GalleryContainer.test.tsx
  modified:
    - app/page.tsx
    - next.config.ts
  deleted:
    - app/gallery/page.tsx

key-decisions:
  - "GalleryCard's verdict-badge derivation (cardVerdictBadge) is a local, non-exported function, not folded into vessel-role.ts's shared maps — it produces a different string shape (\"A GIVES WAY\"/\"MUTUAL\") than the shared ROLE_BADGE_TEXT abbreviations, matching 09-UI-SPEC.md's explicit correction."
  - "app/gallery/page.tsx and the now-empty app/gallery/ directory were deleted outright (not left in place behind the redirect) per GAL-03's literal requirement and this project's code-cleanliness convention."

requirements-completed: [GAL-01, GAL-02, GAL-03, GAL-04]

duration: 35min
completed: 2026-07-19
---

# Phase 09 Plan 03: Gallery Card + Container + Home Page Wiring Summary

**Gallery section (6-card responsive grid) server-rendered on the home page below Sandbox, consuming Plan 01's curated data and Plan 02's GalleryPreviewChart; `/gallery` route removed in favor of a permanent redirect.**

## Performance

- **Duration:** 35 min
- **Started:** 2026-07-19T10:44:00Z (approx.)
- **Completed:** 2026-07-19T10:19:06Z
- **Tasks:** 3 completed
- **Files modified:** 6 (4 created, 2 modified, 1 deleted)

## Accomplishments
- `GalleryCard.tsx`: single accessible `<Link>` wrapping a `Card` — mini-chart, static `Rule-N` outline badge, dynamic give-way/mutual verdict badge, title, description
- `GalleryContainer.tsx`: async Server Component fetching `gallery.list()` via the real tRPC caller (no client fetch), rendering the section header and a 3/2/1-column responsive grid
- `app/page.tsx` now composes Hero → Sandbox → Gallery in that order, `id="gallery"` present at first paint for `/#gallery` anchor scrolling
- `/gallery` route removed; `next.config.ts` declares a permanent (308) redirect to `/#gallery`

## Task Commits

Each task was committed atomically (TDD: test → feat per task):

1. **Task 1: GalleryCard.tsx** — `9705ad5` (test), `982ece0` (feat)
2. **Task 2: GalleryContainer.tsx and app/page.tsx wiring** — `566fbe3` (test), `76fdaaf` (feat)
3. **Task 3: Redirect /gallery -> /#gallery, remove the old route** — `10e91b0` (feat)

_Note: Task 3 has no separate test/feat split — it's a config + deletion change, not new behavior requiring a failing-test-first cycle._

## Files Created/Modified
- `src/components/gallery/GalleryCard.tsx` - one gallery card: mini-chart, Rule-N badge, verdict badge, title, description, whole-card Link
- `src/components/gallery/GalleryCard.test.tsx` - 3 behaviors: give-way badge text, mutual badge text, single Link with exact href/aria-label
- `src/components/gallery/GalleryContainer.tsx` - async Server Component, section header + responsive grid, maps `gallery.list()` rows through `rowToVessels()` into `GalleryCard` props
- `src/components/gallery/GalleryContainer.test.tsx` - 2 behaviors: heading/eyebrow/6-links-to-/s/*, real seeded titles present
- `app/page.tsx` - added `<section id="gallery"><GalleryContainer /></section>` after the Sandbox section
- `next.config.ts` - added `redirects()` key returning the static `/gallery -> /#gallery` permanent redirect
- `app/gallery/page.tsx` (deleted) - old standalone route, superseded by the embedded section + redirect

## Decisions Made
- Kept `cardVerdictBadge()` local to `GalleryCard.tsx` rather than adding it to `vessel-role.ts`'s shared maps, since its output string shape ("A GIVES WAY"/"MUTUAL") is specific to this card's footer badge and would collide in intent with the mini-chart's separate 2-letter pill map if merged.
- Deleted `app/gallery/page.tsx` and the now-empty `app/gallery/` directory entirely rather than leaving unreachable dead code behind the redirect, per GAL-03's literal "removed" wording.

## Deviations from Plan

None - plan executed exactly as written. One setup step not explicit in the plan but required to run the DB-backed `GalleryContainer.test.tsx` in this fresh worktree: created a worktree-local `.env` pointing at the existing `colregs-navigator-postgres-1` Docker container (port 5433, matching the main checkout's `.env`) and ran `npx prisma generate` to produce the gitignored Prisma client — this is environment setup, not a plan deviation, and required no code changes.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required. (The worktree-local `.env`/generated Prisma client noted above are gitignored, local-only artifacts, not something a user needs to configure — they mirror the existing main-checkout setup.)

## Next Phase Readiness

This is the final plan of Phase 09 (Gallery), the final phase of the v1.1 UI Redesign milestone. All 4 of this phase's requirements (GAL-01 through GAL-04) are satisfied:
- Home page renders Hero, Sandbox, then a 6-card Gallery grid, server-rendered, in that order
- Every gallery card links to `/s/{id}` with correct title/ruleLabel/verdict badge/description, sourced from the real seeded curated data
- `/gallery` route is removed; `next.config.ts` declares the permanent redirect

Full test suite (`npx vitest run`) passes: 36 test files, 208 tests, no regressions. `npx tsc --noEmit` passes clean.

Manual verification still needed (per STATE.md's existing blocker note): the `/gallery` → `/#gallery` redirect's actual scroll-to-anchor behavior in a real browser, both from a fresh tab and via in-app navigation — this cannot be confirmed from automated tests alone (jsdom does not perform real navigation/scroll).

---
*Phase: 09-gallery*
*Completed: 2026-07-19*

## Self-Check: PASSED

All created/modified files verified present (or absent, for the intentionally deleted `app/gallery/page.tsx`); all 6 task/summary commit hashes verified present in git log.
