---
phase: 19-guided-tour
plan: 01
subsystem: ui
tags: [radix-ui, dialog, tailwind, tour, css-keyframes]

# Dependency graph
requires:
  - phase: 18-on-chart-vessel-control-overlay
    provides: final Sandbox header/footer strip layout the tour's z-index/UI references are written against
provides:
  - "src/components/ui/dialog.tsx: Radix Dialog primitive wrapper (Dialog/DialogTrigger/DialogPortal/DialogOverlay/DialogContent/DialogTitle/DialogDescription/DialogClose)"
  - "src/components/tour/guided-tour-steps.ts: TOUR_STEPS pure data module, 6 verbatim tour steps"
  - "app/globals.css: .radar-sweep-dot decorative CSS rule + @keyframes radar-sweep"
affects: [19-02-guided-tour-modal, 19-03-sandbox-trigger-wiring]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Radix Dialog wrapped with this repo's data-slot/no-forwardRef convention (mirrors select.tsx), unified `radix-ui` package import"
    - "z-50 documented inline as the app's single shared Portal-content stacking tier (D-04)"
    - "Pure .ts data module (zero JSX/React import) + a co-located data-integrity test, matching hero-preview-fixture.ts's convention"
    - "Decorative CSS as a real globals.css rule referencing var(--primary), not a template-literal style string"

key-files:
  created:
    - src/components/ui/dialog.tsx
    - src/components/tour/guided-tour-steps.ts
    - src/components/tour/guided-tour-steps.test.ts
  modified:
    - app/globals.css

key-decisions:
  - "dialog.tsx hand-authored directly from select.tsx's exact structure (network-restricted sandbox made `npx shadcn add dialog` impractical to verify) -- zero new package.json dependency, radix-ui's Dialog namespace already ships in the installed radix-ui package"
  - "No built-in close-X button in DialogContent -- Plan 19-02's GuidedTourModal supplies its own explicit Skip control per the design source"
  - "radar-sweep-dot references var(--primary) (#2dd4bf token), never a raw hex literal, keeping the accent theme-consistent"

patterns-established:
  - "First Dialog primitive in this codebase -- future modal-style UI should wrap Radix Dialog the same way, not hand-roll a fixed-overlay div"

requirements-completed: [TOUR-01, TOUR-02]

# Metrics
duration: 5min
completed: 2026-07-26
---

# Phase 19 Plan 01: Guided Tour Groundwork Summary

**Radix Dialog primitive wrapper, verbatim 6-step TOUR_STEPS data module, and a net-new .radar-sweep-dot CSS keyframe rule -- the interface-first contracts Plan 19-02's GuidedTourModal/TourStepIllustration are written against.**

## Performance

- **Duration:** ~5 min (task commits 22:18:16 -> 22:20:25 UTC+1)
- **Started:** 2026-07-26T22:18:16+01:00
- **Completed:** 2026-07-26T22:20:25+01:00
- **Tasks:** 3/3
- **Files modified:** 4 (3 created, 1 modified)

## Accomplishments
- `dialog.tsx` ships this codebase's first Radix Dialog wrapper, exporting exactly 8 named parts, matching `select.tsx`'s data-slot/no-forwardRef convention with zero `@radix-ui/react-dialog` per-primitive import
- `guided-tour-steps.ts` exports `TOUR_STEPS` with exactly 6 entries (ids 0-5), verbatim copy ported from `19-DESIGN-SNAPSHOT.md`, proven by a 7-assertion data-integrity test
- `app/globals.css` gained a real `.radar-sweep-dot`/`@keyframes radar-sweep` rule referencing `var(--primary)`, with zero raw hex literal

## Task Commits

Each task was committed atomically:

1. **Task 1: dialog.tsx -- Radix Dialog primitive wrapper (D-01, D-04)** - `aa92905` (feat)
2. **Task 2: guided-tour-steps.ts -- verbatim 6-step tour data module** - `00f9ebc` (feat)
3. **Task 3: radar-sweep-dot decorative CSS (net-new, per Pitfall 2)** - `6533930` (feat)

_Note: no TDD tasks this plan -- all three are `type="auto"`._

## Files Created/Modified
- `src/components/ui/dialog.tsx` - Radix Dialog primitive wrapper (8 named exports), z-50 documented as shared Portal-content tier
- `src/components/tour/guided-tour-steps.ts` - TOUR_STEPS pure data module (6 steps, verbatim design copy)
- `src/components/tour/guided-tour-steps.test.ts` - Data-integrity guard (entry count, id order, exact title/point content)
- `app/globals.css` - Added `@keyframes radar-sweep` + `.radar-sweep-dot` class

## Decisions Made
- Hand-authored `dialog.tsx` directly (did not attempt `npx shadcn add dialog` given this sandbox's network restrictions) -- mirrored `select.tsx`'s exact structure per the plan's fallback instruction; verified against all 9 grep-based acceptance criteria plus `npm run typecheck`
- `points` typed as a plain `TourStepPoint[]` (not a fixed 2-3 tuple), per the plan's explicit discretion note

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Worktree branch was missing all Phase 19 planning commits**
- **Found during:** Setup, before Task 1 (attempting to read 19-01-PLAN.md)
- **Issue:** This worktree's branch (`worktree-agent-adb1839154bdf3ee1`) was created from the Phase 18 merge commit (`c80c556`), which predates all Phase 19 planning docs (`19-01-PLAN.md` etc.) landing on `gsd/phase-19-guided-tour`. The plan file did not exist in this worktree's history.
- **Fix:** Fast-forward merged `gsd/phase-19-guided-tour` into the worktree branch (`git merge gsd/phase-19-guided-tour`) -- a clean fast-forward, doc-only commits, no conflicts, no destructive operation.
- **Files modified:** Brought in `.planning/phases/19-guided-tour/*` (all planning docs), `.planning/ROADMAP.md`, `.planning/STATE.md` updates from the planning phase.
- **Verification:** `19-01-PLAN.md` readable afterward; `git log` shows clean fast-forward, no merge commit needed.
- **Committed in:** n/a (fast-forward, no new commit created -- `df4188e` already existed on the source branch)

**2. [Rule 3 - Blocking] Missing generated Prisma client blocked `npm run typecheck`**
- **Found during:** Task 1, verifying `npm run typecheck` after writing `dialog.tsx`
- **Issue:** `generated/prisma/` is gitignored and per-worktree (git worktrees don't share gitignored build artifacts with the main checkout), so `src/server/db/client.ts`'s relative import of the generated Prisma client failed to resolve, blocking typecheck for the whole repo (unrelated to `dialog.tsx` itself).
- **Fix:** Ran `DATABASE_URL=... npx prisma generate` to regenerate the client into `./generated/prisma` (codegen only, no new package installed).
- **Files modified:** None tracked (generated/ is gitignored, correctly not committed).
- **Verification:** `npm run typecheck` then passed with 0 errors.
- **Committed in:** n/a (gitignored, not a tracked change)

**3. [Rule 3 - Blocking] `npm run build` initially failed against the wrong Postgres port**
- **Found during:** Task 3, running the plan's `npm run build` verification
- **Issue:** `.env.example`'s default `DATABASE_URL` points at port 5432, but this environment's running `docker-compose` Postgres container maps to host port 5433 -- caused a home-page prerender DB connection error (`ECONNREFUSED`), unrelated to the CSS change under test.
- **Fix:** Re-ran the build with `DATABASE_URL` pointed at the actual running container's port (5433); confirmed via `docker ps` this container was already healthy.
- **Files modified:** None (environment variable only, not committed).
- **Verification:** `npm run build` completed successfully, all routes compiled/prerendered, zero Tailwind/PostCSS/build errors.
- **Committed in:** n/a (no file change)

**4. [Rule 1 - Bug] Reverted an incidental `next-env.d.ts` change**
- **Found during:** Task 3, post-build `git status` check
- **Issue:** Running `npm run build` (as opposed to `npm run dev`) caused Next.js to auto-rewrite `next-env.d.ts`'s type-reference path from `./.next/dev/types/routes.d.ts` to `./.next/types/routes.d.ts` -- an auto-generated file toggling between dev/build modes, unrelated to this plan's CSS work.
- **Fix:** `git checkout -- next-env.d.ts` to revert the single unrelated file before committing Task 3.
- **Files modified:** `next-env.d.ts` (reverted, not committed as part of this plan).
- **Verification:** `git status --short` showed only `app/globals.css` staged before the Task 3 commit.
- **Committed in:** n/a (reverted, not committed)

---

**Total deviations:** 4 auto-fixed (all Rule 3 blocking-issue fixes except one Rule 1 revert-of-incidental-change), 0 architectural
**Impact on plan:** All four were environment/worktree-setup issues encountered while verifying the plan's own acceptance criteria -- none touched the three deliverable files' actual content or design. No scope creep.

## Issues Encountered
None beyond the four deviations documented above.

## Next Phase Readiness
- `dialog.tsx`'s 8 named exports, `TOUR_STEPS`, and `.radar-sweep-dot` are all in place and verified (typecheck, vitest, build all green) for Plan 19-02 (`GuidedTourModal.tsx`, `TourStepIllustration.tsx`) to import and compose directly.
- No blockers. Full test suite (41 files / 239 tests) passes with no regressions.

## Self-Check: PASSED

- FOUND: src/components/ui/dialog.tsx
- FOUND: src/components/tour/guided-tour-steps.ts
- FOUND: src/components/tour/guided-tour-steps.test.ts
- FOUND: app/globals.css
- FOUND commit: aa92905 (Task 1)
- FOUND commit: 00f9ebc (Task 2)
- FOUND commit: 6533930 (Task 3)

---
*Phase: 19-guided-tour*
*Completed: 2026-07-26*
