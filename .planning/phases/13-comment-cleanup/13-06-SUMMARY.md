---
phase: 13-comment-cleanup
plan: 06
subsystem: ui
tags: [comments, documentation, marketing, hero, gallery, eslint, code-hygiene]

# Dependency graph
requires: []
provides:
  - Stale Phase/Plan/Task-N/UI-SPEC.md/RESEARCH.md/CONTEXT.md comment references removed from all 14 files in the Hero/Gallery/shared/layout marketing cluster
affects: [13-08 final verification sweep]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Rotting-pointer comments (Phase N / Task N / UI-SPEC.md / RESEARCH.md / CONTEXT.md) rewritten to state the underlying design/architectural reason directly, per CLAUDE.md's comment convention"

key-files:
  created: []
  modified:
    - src/components/hero/Hero.tsx
    - src/components/hero/Hero.test.tsx
    - src/components/hero/HeroPreviewCard.tsx
    - src/components/hero/hero-preview-fixture.ts
    - src/components/hero/hero-preview-fixture.test.ts
    - src/components/hero/hero-preview-geometry.ts
    - app/layout.tsx
    - src/components/gallery/GalleryCard.tsx
    - src/components/gallery/GalleryContainer.tsx
    - src/components/gallery/GalleryPreviewChart.tsx
    - src/components/gallery/gallery-preview-geometry.test.ts
    - src/components/layout/Footer.tsx
    - src/components/shared/SectionGridBackground.tsx
    - src/components/shared/static-chart-geometry.ts

key-decisions:
  - "Fixed a redundancy bug in the already-committed Hero.test.tsx rewrite: literal substitution of \"(07-UI-SPEC.md)\" -> \"(by design)\" produced \"appears twice by design (by design):\" since the sentence already said \"by design\" before the citation -- dropped the redundant parenthetical entirely in a follow-up fix commit"
  - "The color-name false positives in hero-preview-geometry.ts (red-500/green-500/slate-600) confirmed as intentional retentions"

patterns-established: []

requirements-completed: [CMNT-01]

# Metrics
duration: 15min
completed: 2026-07-20
---

# Phase 13 Plan 06: Comment Cleanup (Hero/Gallery/shared/layout) Summary

**Rewrote every stale Phase/Plan/Task-N/UI-SPEC.md/RESEARCH.md/CONTEXT.md comment reference across all 14 files in the Hero/Gallery/shared/layout marketing cluster into durable, reason-based comments with zero change to rendered values, fixture numbers, or classification results.**

## Performance

- **Duration:** ~15 min (resumed after a session interruption killed the original background executor mid-Task-2)
- **Started:** 2026-07-20T11:19:00+01:00
- **Completed:** 2026-07-20T13:45:18+01:00
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- Removed every "(07-01)", "(06-01)", "CONTEXT.md", "RESEARCH.md", "UI-SPEC.md", bare "Task N", and "Phase 9" reference from all 14 files while preserving the worked-math provenance note in `hero-preview-fixture.ts` and the viewBox/scale derivation notes in `GalleryPreviewChart.tsx`
- `app/layout.tsx` (outside the original 54-file ESLint-flagged scoping sweep) had its own stale `06-01 Task 3`/`Task 1's` references found and rewritten, per CMNT-02's broader re-grep intent
- Found and fixed a redundancy bug from the already-committed portion of this plan's Task 1 work: a literal find-replace of `"(07-UI-SPEC.md)"` → `"(by design)"` in `Hero.test.tsx` produced the doubled phrase `"appears twice by design (by design):"` since the sentence already said "by design" before the citation -- corrected in a follow-up fix commit
- Left the 3 Tailwind color-shade name false positives in `hero-preview-geometry.ts` (`red-500`, `green-500`, `slate-600`) untouched, confirmed via grep
- Verified zero behavior change: all 6 affected test files pass — 16/16, matching pre-change behavior
- `npm run typecheck` passes clean

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite stale comments in Hero.tsx, Hero.test.tsx, HeroPreviewCard.tsx, hero-preview-fixture.ts, hero-preview-fixture.test.ts, hero-preview-geometry.ts, app/layout.tsx** - `95f0292` (docs)
2. **Fix: remove duplicated "by design" wording introduced by Task 1's literal substitution** - `a26d7f0` (fix)
3. **Task 2: Rewrite stale comments in GalleryCard.tsx, GalleryContainer.tsx, GalleryPreviewChart.tsx, gallery-preview-geometry.test.ts, Footer.tsx, SectionGridBackground.tsx, static-chart-geometry.ts** - `8c02e59` (docs)

_Note: no TDD tasks in this plan; all commits are documentation-only (comment text) with no code/logic change._

## Files Created/Modified
- `src/components/hero/Hero.tsx` - "Hero (07-01) -- net-new" rewritten to "Net-new"
- `src/components/hero/Hero.test.tsx` - "(07-UI-SPEC.md)" rewritten; redundancy bug fixed in a follow-up commit
- `src/components/hero/HeroPreviewCard.tsx` - "(CONTEXT.md D-03)"/"(CONTEXT.md D-01: ...)" rewritten (2 locations)
- `src/components/hero/hero-preview-fixture.ts` - "Hero (07-01) -- fixed"/"(HERO-02, CONTEXT.md D-07)"/"07-RESEARCH.md's Code Examples section" rewritten
- `src/components/hero/hero-preview-fixture.test.ts` - "Hero (07-01) -- fixture-drift" rewritten
- `src/components/hero/hero-preview-geometry.ts` - "UI-SPEC.md "Preview Card Dimensions":" and "(UI-SPEC.md Color table)" rewritten; 3 color-shade names left untouched
- `app/layout.tsx` - "06-01 Task 3"/"Task 1's" dropped; a second unenumerated "CONTEXT.md/RESEARCH.md Pitfall 2" reference caught and fixed by the acceptance-criteria grep
- `src/components/gallery/GalleryCard.tsx` - two "09-UI-SPEC.md" references rewritten
- `src/components/gallery/GalleryContainer.tsx` - "per 09-UI-SPEC.md's Layout section" rewritten
- `src/components/gallery/GalleryPreviewChart.tsx` - "(09-RESEARCH.md Pattern 1)" and 4 further "UI-SPEC.md"/"09-RESEARCH.md" references rewritten (5 locations total, including one unenumerated PADDING_FRACTION comment found via the acceptance-criteria grep)
- `src/components/gallery/gallery-preview-geometry.test.ts` - "(09-02)"/"this phase's"/"09-RESEARCH.md's verified per-card range table" rewritten
- `src/components/layout/Footer.tsx` - "Footer (06-01) -- static"/"06-UI-SPEC.md's Copywriting Contract" rewritten
- `src/components/shared/SectionGridBackground.tsx` - "Hero (07-01)"/"Phase 9" rewritten
- `src/components/shared/static-chart-geometry.ts` - "(09-CONTEXT.md D-09, ...)" rewritten

## Decisions Made
Fixed a redundancy bug in the already-committed Task 1 work: `Hero.test.tsx`'s comment read `"2.99 NM" appears twice by design (07-UI-SPEC.md): once in the` before this plan, and the plan's literal instruction ("(07-UI-SPEC.md)" -> "(by design)") produced `"appears twice by design (by design):"` since "by design" was already present in the sentence. Dropped the redundant parenthetical entirely rather than follow the plan's literal substitution verbatim, consistent with CLAUDE.md's convention against restating the obvious.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Fixed redundant "(by design)" wording in Hero.test.tsx**
- **Found during:** Review of the already-committed Task 1 work before starting Task 2
- **Issue:** The plan's literal suggested substitution created a duplicated phrase ("by design (by design):") since the source sentence already contained "by design" immediately before the citation being replaced
- **Fix:** Dropped the redundant parenthetical, leaving "appears twice by design: once in the"
- **Files modified:** src/components/hero/Hero.test.tsx
- **Verification:** Re-read the full sentence after the fix; ran `npx vitest run src/components/hero` -- still passes
- **Committed in:** a26d7f0 (separate fix commit)

---

**Total deviations:** 1 auto-fixed (1 missing-critical content fix)
**Impact on plan:** Necessary to avoid leaving an awkward, redundant phrase in place of the original stale-ID violation. No scope creep -- same line, same file, same task.

## Issues Encountered
The original background executor for this plan was killed mid-Task-2 by an unrelated session restart (`/login` re-auth), after completing and committing Task 1 in full (commit `95f0292`, including one unenumerated fix in `app/layout.tsx` found via its own acceptance-criteria grep) and applying items 1-6 of Task 2 (GalleryCard.tsx, GalleryContainer.tsx, most of GalleryPreviewChart.tsx) but leaving them uncommitted. Items 7-13 of Task 2 (3 remaining GalleryPreviewChart.tsx locations, gallery-preview-geometry.test.ts, Footer.tsx, SectionGridBackground.tsx, static-chart-geometry.ts) were not started. The orchestrator reviewed the already-committed Task 1 diff, found and fixed the redundancy bug described above, then completed the remaining Task 2 items and verified against the full acceptance criteria. `npm run typecheck` initially failed with a missing generated Prisma client module; resolved by copying the repo-root `.env` into this worktree and running `npx prisma generate` -- a pre-existing environment-setup gap unrelated to this plan's comment edits.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
All 14 files in the Hero/Gallery/shared/layout marketing cluster are clean of Phase/Plan/Task-N/UI-SPEC.md/RESEARCH.md/CONTEXT.md references (except the 3 deliberately-preserved color-name false positives and the live REQ-ID/decision-ID citations). `npx vitest run` on all 6 affected test files passes 16/16, matching pre-change behavior. `npm run typecheck` passes clean. Ready for the orchestrator to merge alongside sibling plans 13-01..13-05 -- this closes out Wave 1 of Phase 13.

## Self-Check: PASSED

- FOUND: src/components/hero/Hero.tsx
- FOUND: src/components/hero/Hero.test.tsx
- FOUND: src/components/hero/HeroPreviewCard.tsx
- FOUND: src/components/hero/hero-preview-fixture.ts
- FOUND: src/components/hero/hero-preview-fixture.test.ts
- FOUND: src/components/hero/hero-preview-geometry.ts
- FOUND: app/layout.tsx
- FOUND: src/components/gallery/GalleryCard.tsx
- FOUND: src/components/gallery/GalleryContainer.tsx
- FOUND: src/components/gallery/GalleryPreviewChart.tsx
- FOUND: src/components/gallery/gallery-preview-geometry.test.ts
- FOUND: src/components/layout/Footer.tsx
- FOUND: src/components/shared/SectionGridBackground.tsx
- FOUND: src/components/shared/static-chart-geometry.ts
- FOUND: 95f0292
- FOUND: a26d7f0
- FOUND: 8c02e59

---
*Phase: 13-comment-cleanup*
*Completed: 2026-07-20*
