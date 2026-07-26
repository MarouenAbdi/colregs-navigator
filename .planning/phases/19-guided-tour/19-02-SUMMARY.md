---
phase: 19-guided-tour
plan: 02
subsystem: ui
tags: [radix-ui, dialog, react, tailwind, tour, testing]

# Dependency graph
requires:
  - phase: 19-guided-tour (Plan 19-01)
    provides: "src/components/ui/dialog.tsx Radix Dialog primitive wrapper, src/components/tour/guided-tour-steps.ts TOUR_STEPS data module, .radar-sweep-dot CSS rule"
provides:
  - "src/components/tour/TourStepIllustration.tsx: 6 per-step inline SVG illustrations switched by step index 0-5"
  - "src/components/tour/GuidedTourModal.tsx: controlled Dialog composition (open/onOpenChange), step nav, Back/Next/Start-exploring, Skip, step dots, focus-return fix"
affects: [19-03-sandbox-trigger-wiring]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Design source's raw SVG .map().join('') string-composition loops ported as real .map() calls returning keyed JSX elements, not dangerouslySetInnerHTML"
    - "Controlled Radix Dialog (open/onOpenChange props) with a manual onCloseAutoFocus override for architectures where the trigger button lives outside the Dialog tree (no DialogTrigger descendant)"
    - "eslint-plugin-better-tailwindcss's no-unknown-classes rule now supports an explicit ignore allow-list for real, non-utility custom CSS classes"

key-files:
  created:
    - src/components/tour/TourStepIllustration.tsx
    - src/components/tour/TourStepIllustration.test.tsx
    - src/components/tour/GuidedTourModal.tsx
    - src/components/tour/GuidedTourModal.test.tsx
  modified:
    - eslint.config.mjs

key-decisions:
  - "Radix Dialog's default onCloseAutoFocus only restores focus via context.triggerRef, populated exclusively by a <DialogTrigger> descendant -- since GuidedTourModal's trigger button lives externally in SandboxContainer.tsx (Plan 19-03), that ref is always null and the unconditional event.preventDefault() in Radix's default handler silently cancels FocusScope's own restore-to-previous-element fallback too. Fixed with a minimal, self-contained manual capture/restore (previouslyFocusedElementRef + a custom onCloseAutoFocus), keeping Escape/outside-click/focus-trap on Radix's real defaults per D-01's intent"
  - "Outside-pointerdown-dismiss test targets the DialogOverlay backdrop (data-slot=\"dialog-overlay\"), not an arbitrary page element -- Radix sets document.body's pointer-events to none while the modal is open (real production behavior) and only its own Portal subtree (Overlay + Content) stays interactive, so the Overlay is both the correct real-world outside-dismiss target and the only element userEvent's pointer-events guard will click"
  - "Added an explicit ignore allow-list entry for radar-sweep-dot to eslint-plugin-better-tailwindcss's no-unknown-classes rule -- this real, non-utility CSS class (Plan 19-01's globals.css) is the first time it's referenced from a className anywhere in the codebase, and the plugin's Tailwind-v4-compiler-backed candidate check cannot generate CSS for a plain custom selector"

patterns-established:
  - "Fully-externally-controlled Dialog (no DialogTrigger in the same tree) needs a one-line manual focus-capture/restore -- future Dialog-based components driven the same way (open/onOpenChange props, trigger elsewhere) should follow this same pattern rather than relying on Radix's bare default"

requirements-completed: [TOUR-01, TOUR-02]

# Metrics
duration: 25min
completed: 2026-07-26
---

# Phase 19 Plan 02: Guided Tour Content & Modal Summary

**TourStepIllustration (6 per-step SVGs ported verbatim as plain JSX) and GuidedTourModal (controlled Radix Dialog with step nav, D-02 button-label copy, and a hand-fixed focus-return path for a no-DialogTrigger architecture), both fully unit-tested against the real Dialog primitive.**

## Performance

- **Duration:** ~25 min (task commits 22:28:02 -> 22:47:53 UTC+1)
- **Started:** 2026-07-26T22:23:32+01:00 (worktree fast-forward merge)
- **Completed:** 2026-07-26T22:47:53+01:00
- **Tasks:** 2/2
- **Files modified:** 5 (4 created, 1 modified)

## Accomplishments
- `TourStepIllustration.tsx` ports all 6 `tourViz` SVGs from `19-DESIGN-SNAPSHOT.md` verbatim into 6 named plain-JSX sub-components (zero `dangerouslySetInnerHTML`), with the design's raw `.map().join('')` string loops (instrument tiles, decision-chain nodes, gallery tiles) converted to real `.map()` calls returning keyed JSX
- `GuidedTourModal.tsx` composes the real Radix `Dialog`/`DialogContent`/`DialogTitle`/`DialogDescription` primitives with local step state (reset to 0 on every reopen), implementing Back/Next/"Start exploring" (D-02's exact copy) and 6 step-dots
- Discovered and fixed a real functional gap in the plan's own assumption: Radix's default `onCloseAutoFocus` cannot restore focus to an externally-owned trigger button without a `<DialogTrigger>` in the tree -- added a minimal manual capture/restore that makes the "focus returns to trigger" behavior actually hold
- 17 new tests (7 + 10) pass against the real Dialog/Radix primitives, proving every ROADMAP Phase 19 success criterion this plan owns (step nav, last-step close, all 3 dismissal paths, focus-return)

## Task Commits

Each task was committed atomically:

1. **Task 1: TourStepIllustration.tsx -- 6 per-step inline SVGs** - `1176dbe` (feat)
2. **Task 2: GuidedTourModal.tsx -- controlled Dialog composition (D-01, D-02, TOUR-01, TOUR-02)** - `09c1494` (feat)

_Note: no TDD tasks this plan -- both are `type="auto"` per PLAN.md frontmatter, though both included their test files as part of the same task/commit._

## Files Created/Modified
- `src/components/tour/TourStepIllustration.tsx` - 6 per-step inline SVG illustrations, switched by step index 0-5
- `src/components/tour/TourStepIllustration.test.tsx` - 7 tests covering all 6 steps' distinct content plus the shared `viewBox`
- `src/components/tour/GuidedTourModal.tsx` - controlled Dialog composition: step state, Back/Next/Skip, step dots, manual focus-restore
- `src/components/tour/GuidedTourModal.test.tsx` - 10 tests covering step nav, dismissal paths, focus-return, and reopen-reset
- `eslint.config.mjs` - added `ignore: ["^radar-sweep-dot$"]` to `better-tailwindcss/no-unknown-classes`

## Decisions Made
- Manual `onCloseAutoFocus` override in `GuidedTourModal` (captures `document.activeElement` in the same effect that resets `step` to 0 on open, restores it via `event.preventDefault()` + `.focus()` on close) -- see Deviations below for the full root-cause analysis
- Outside-pointerdown-dismiss test clicks the `DialogOverlay` backdrop rather than an arbitrary page element, since Radix sets `document.body`'s `pointer-events` to `none` while modal, leaving only the Overlay/Content interactive
- Upcoming (not-yet-reached) step dots use `bg-border` (`#27272A`) rather than the design's literal `#3F3F46`, since no existing Tailwind color token matches that exact hex -- per the plan's explicit discretion note

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Radix's default `onCloseAutoFocus` does not restore focus without a `<DialogTrigger>`**
- **Found during:** Task 2, writing the Escape-dismissal focus-return test
- **Issue:** The plan's `<behavior>` and `<done>` sections assume "Radix's default onCloseAutoFocus" alone restores focus to whatever had focus before the Dialog opened. Reading `@radix-ui/react-dialog`'s source (`DialogContentModal`) showed its actual default `onCloseAutoFocus` unconditionally calls `event.preventDefault()` then `context.triggerRef.current?.focus()` -- `triggerRef` is populated only by an actual `<DialogTrigger>` descendant. Since `GuidedTourModal` is driven by a fully external, controlled `open`/`onOpenChange` pair (its trigger button lives in `SandboxContainer.tsx`, wired in Plan 19-03, not as a `DialogTrigger` child here), `triggerRef.current` is always `null`, and the unconditional `preventDefault()` also cancels `FocusScope`'s own "restore to previously-focused element" fallback -- so focus silently landed on `document.body` instead of the trigger. Reproduced first against a minimal from-scratch Dialog harness (isolating it from any of this plan's own code) to confirm it was a genuine Radix/architecture interaction, not a bug in `GuidedTourModal` itself.
- **Fix:** Added `previouslyFocusedElementRef` (captured in the same `useEffect` that resets `step` to 0 on open) plus a custom `onCloseAutoFocus` on `DialogContent` that calls `event.preventDefault()` then manually focuses the captured element -- a minimal, self-contained fix that leaves Escape/outside-click/focus-trap entirely on Radix's real defaults, per D-01's actual intent.
- **Files modified:** `src/components/tour/GuidedTourModal.tsx`
- **Verification:** `GuidedTourModal.test.tsx`'s Escape-dismissal test asserts (via `waitFor`, per Pitfall 3) that the pre-open-focused element regains focus after Escape.
- **Committed in:** `09c1494` (Task 2 commit)

**2. [Rule 3 - Blocking] `eslint-plugin-better-tailwindcss`'s `no-unknown-classes` false-flagged `radar-sweep-dot`**
- **Found during:** Task 2, pre-commit hook (`eslint --fix` via lint-staged/Husky)
- **Issue:** `radar-sweep-dot` is a real, plain CSS class defined directly in `app/globals.css` (Plan 19-01), not a Tailwind utility. This plan is the first time it's ever referenced from a `className` anywhere in the codebase -- the plugin's Tailwind-v4-compiler-backed `candidatesToCss` check cannot generate CSS for a non-utility selector and flagged it as unknown, blocking the commit. (A structurally-identical existing custom class, `section-grid-overlay`, does not trip the same rule for reasons not fully explained by reading the rule's source -- confirmed via a byte-for-byte isolated reproduction that the discrepancy is real and not a copy/paste error on this plan's part.)
- **Fix:** Added an explicit `ignore: ["^radar-sweep-dot$"]` option to `better-tailwindcss/no-unknown-classes` in `eslint.config.mjs` (the rule's own supported allow-list mechanism for real, non-Tailwind custom classes).
- **Files modified:** `eslint.config.mjs`
- **Verification:** `npx eslint .` (project-wide) shows zero errors on `GuidedTourModal.tsx`; `npm run typecheck` and both test files still pass.
- **Committed in:** `09c1494` (Task 2 commit)

**3. [Rule 3 - Blocking] Worktree branch was missing all Phase 19 planning commits (same class as Plan 19-01)**
- **Found during:** Setup, before Task 1
- **Issue:** This worktree's branch (`worktree-agent-af1770ef7ea22c8c1`) forked from the Phase 18 merge commit, predating Plan 19-01's shipped `dialog.tsx`/`guided-tour-steps.ts`/`19-02-PLAN.md` landing on `gsd/phase-19-guided-tour`.
- **Fix:** Fast-forward merged `gsd/phase-19-guided-tour` into the worktree branch (clean fast-forward, no conflicts).
- **Files modified:** Brought in all of `.planning/phases/19-guided-tour/*`, `src/components/ui/dialog.tsx`, `src/components/tour/guided-tour-steps.ts`, `app/globals.css`'s `.radar-sweep-dot` rule.
- **Verification:** `19-02-PLAN.md` and `19-01-SUMMARY.md` readable afterward; `git log` shows a clean fast-forward.
- **Committed in:** n/a (fast-forward, no new commit)

**4. [Rule 3 - Blocking] Missing generated Prisma client and local `.env` blocked typecheck/tests**
- **Found during:** Task 1 (`npm run typecheck`), and before the final full `npm test` regression pass
- **Issue:** `generated/prisma/` (gitignored, per-worktree) was absent, failing typecheck project-wide; `.env` (also gitignored, per-worktree) was absent, causing `DATABASE_URL` to be undefined and every Prisma-touching test to fail with `ECONNREFUSED` -- same environment-setup class of issue as Plan 19-01, and unrelated to this plan's actual code.
- **Fix:** Ran `npx prisma generate` against the running Docker Postgres container; created a local `.env` pointing `DATABASE_URL` at that container's actual host port (5433, confirmed via `docker ps`), matching the pattern already used to unblock Plan 19-01.
- **Files modified:** None tracked (`generated/prisma/` and `.env` are both gitignored).
- **Verification:** `npm run typecheck` passes with 0 errors; full `npm test` run passes 256/256 across 43 files.
- **Committed in:** n/a (gitignored, not tracked)

---

**Total deviations:** 4 auto-fixed (1 Rule 1 bug fix -- a real functional gap in the plan's own Radix-behavior assumption, 3 Rule 3 blocking-issue fixes, 2 of which are environment/worktree-setup repeats of Plan 19-01's precedent)
**Impact on plan:** The Rule 1 fix (focus-return) is a correctness fix directly in scope of this plan's own must-have truth -- without it, "focus returns to whatever had focus before the Dialog opened" would silently not hold in the actual SandboxContainer integration (Plan 19-03). The eslint allow-list and environment fixes are necessary, narrowly-scoped unblocks with zero behavioral change to the deliverables. No scope creep.

## Issues Encountered
None beyond the four deviations documented above.

## Next Phase Readiness
- `TourStepIllustration.tsx` and `GuidedTourModal.tsx` are both fully self-contained, independently unit-tested (17/17 new tests pass), typecheck-clean, and lint-clean -- ready for Plan 19-03 to wire a "How to read this" trigger button plus local `isTourOpen` state into `SandboxContainer.tsx` and pass them straight into `GuidedTourModal`'s `{ open, onOpenChange }` props.
- Plan 19-03 should be aware: since `GuidedTourModal` does not render its own `<DialogTrigger>`, the real trigger button in `SandboxContainer.tsx` does not need any special Radix wiring (no `asChild`/`DialogTrigger` wrapping required) -- plain `onClick={() => setIsTourOpen(true)}` is sufficient, and `GuidedTourModal`'s own manual focus-restore will correctly return focus to whatever was focused before opening (which will be that trigger button, in the real integration).
- Full test suite (43 files / 256 tests) passes with no regressions; `npm run typecheck` and `npx eslint .` both clean.
- No blockers.

## Self-Check: PASSED

- FOUND: src/components/tour/TourStepIllustration.tsx
- FOUND: src/components/tour/TourStepIllustration.test.tsx
- FOUND: src/components/tour/GuidedTourModal.tsx
- FOUND: src/components/tour/GuidedTourModal.test.tsx
- FOUND: eslint.config.mjs (modified)
- FOUND commit: 1176dbe (Task 1)
- FOUND commit: 09c1494 (Task 2)

---
*Phase: 19-guided-tour*
*Completed: 2026-07-26*
