---
phase: 11-tailwind-deprecated-class-name-fixes
plan: 01
subsystem: ui
tags: [tailwind, tailwind-v4, eslint, accessibility, class-name-migration]

# Dependency graph
requires:
  - phase: 10-eslint-setup-lint-clean-baseline
    provides: "working `npm run lint` / `npx eslint` baseline, including the better-tailwindcss plugin config and the rounded-[0.25rem] ignore pattern this plan's renames make dead"
provides:
  - "outline-none renamed to outline-hidden (canonical Tailwind v4 class) in button.tsx, select.tsx, Header.tsx, GalleryCard.tsx"
  - "rounded-[0.25rem] renamed to rounded-sm (canonical Tailwind v4 class) in SandboxContainer.tsx and ChartPanel.tsx"
  - "zero remaining outline-none or rounded-[0.25rem] occurrences anywhere in src/"
  - "eslint-clean baseline preserved (0 errors, 0 warnings) on all 6 touched files, including two new class-order/line-wrap fixups the rename itself introduced"
affects: [11-02-eslint-config-cleanup, 11-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Tailwind v3->v4 deprecated class-name renames applied by hand, file-by-file, scoped strictly to real className usages (not blanket find-replace) to avoid known false-positive text/comment traps"

key-files:
  created: []
  modified:
    - src/components/ui/button.tsx
    - src/components/ui/select.tsx
    - src/components/layout/Header.tsx
    - src/components/gallery/GalleryCard.tsx
    - src/components/sandbox/SandboxContainer.tsx
    - src/components/sandbox/ChartPanel.tsx

key-decisions:
  - "D-01/D-02 (CONTEXT.md): rounded-[0.25rem] -> rounded-sm accepted as a deliberate 0.25rem -> 0.375rem (--radius-sm) visual radius increase on SandboxContainer.tsx/ChartPanel.tsx, not rolled back."
  - "Rule 1 auto-fix: the outline-none -> outline-hidden token swap shifted canonical class ordering at 3 sites (button.tsx, select.tsx, GalleryCard.tsx), tripping better-tailwindcss/enforce-consistent-class-order and enforce-consistent-line-wrapping warnings not present before the rename. Reordered by hand to eslint's exact suggested output to restore the zero-warnings baseline required by this plan's acceptance criteria."

patterns-established: []

requirements-completed: [TWFX-01, TWFX-02, TWFX-03]

# Metrics
duration: 15min
completed: 2026-07-19
---

# Phase 11 Plan 01: Tailwind Deprecated Class-Name Renames Summary

**Renamed `outline-none` to `outline-hidden` (4 sites) and `rounded-[0.25rem]` to `rounded-sm` (2 sites) by hand across 6 components, then fixed 3 newly-introduced class-order lint warnings the rename itself caused, restoring a zero-warning eslint baseline.**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-07-19
- **Tasks:** 3/3 completed
- **Files modified:** 6

## Accomplishments
- Renamed the bare `outline-none` -> `outline-hidden` in `button.tsx` and `select.tsx`, and the variant-prefixed `focus-visible:outline-none` -> `focus-visible:outline-hidden` in `Header.tsx` and `GalleryCard.tsx` (TWFX-01).
- Renamed `rounded-[0.25rem]` -> `rounded-sm` in `SandboxContainer.tsx`'s save-status banner and `ChartPanel.tsx`'s chart SVG border, accepting the resulting 0.25rem -> 0.375rem visual radius increase per D-01/D-02 (TWFX-02).
- Confirmed zero false-positive edits: `GalleryPreviewChart.tsx:19`'s "rounded to clean numbers" comment and `Hero.tsx:72`'s "Grounded in " copy are byte-identical; `select.tsx:56`'s unrelated `rounded-[min(var(--radius-md),10px)]` arbitrary radius is untouched (TWFX-03).
- Restored a clean eslint run (0 errors, 0 warnings) on all 6 files after the rename introduced 3 unforeseen class-order/line-wrap warnings.

## Task Commits

Each task was committed atomically:

1. **Task 1: Rename outline-none to outline-hidden in button.tsx, select.tsx, Header.tsx, GalleryCard.tsx** - `7622693` (fix)
2. **Task 2: Rename rounded-[0.25rem] to rounded-sm in SandboxContainer.tsx and ChartPanel.tsx** - `07d1efc` (fix)
3. **Task 3: Verify no false-positive edits and lint stays clean on all 6 files** - `07cde6f` (fix, includes the Rule 1 auto-fix for the class-order warnings discovered during this task's verification)

**Plan metadata:** committed separately at plan close.

## Files Created/Modified
- `src/components/ui/button.tsx` - `outline-none` -> `outline-hidden`; reordered to `whitespace-nowrap outline-hidden transition-all select-none` per eslint's canonical class-order fix
- `src/components/ui/select.tsx` - `outline-none` -> `outline-hidden`; reordered to `outline-hidden transition-colors select-none` per eslint's canonical class-order fix
- `src/components/layout/Header.tsx` - `focus-visible:outline-none` -> `focus-visible:outline-hidden`
- `src/components/gallery/GalleryCard.tsx` - `focus-visible:outline-none` -> `focus-visible:outline-hidden`; re-wrapped onto its own line per eslint's line-wrapping fix
- `src/components/sandbox/SandboxContainer.tsx` - `rounded-[0.25rem]` -> `rounded-sm` on the save-status banner
- `src/components/sandbox/ChartPanel.tsx` - `rounded-[0.25rem]` -> `rounded-sm` on the chart SVG border

## Decisions Made
- D-01/D-02 (CONTEXT.md, pre-locked): accept the `rounded-sm` radius as canonically correct even though it visually increases the radius from 0.25rem to 0.375rem; not a bug to compensate for.
- Rule 1 auto-fix (this execution): applying eslint's own suggested reordering to the 3 sites its `better-tailwindcss` plugin flagged post-rename, rather than leaving warnings in place, since the plan's Task 3 acceptance criteria requires eslint to exit 0 with zero errors/warnings.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed 3 class-order/line-wrap lint warnings introduced by the outline-hidden rename**
- **Found during:** Task 3 (lint verification sweep)
- **Issue:** The plan assumed a literal token swap (`outline-none` -> `outline-hidden`) would keep the 4 rename sites lint-clean, matching Task 1's acceptance criteria and CONTEXT.md's note that all 6 files "currently pass lint cleanly." Running `npx eslint` on the 6 files after Tasks 1-2 surfaced 3 new warnings: `better-tailwindcss/enforce-consistent-class-order` in `button.tsx` and `select.tsx` (the canonical sort position for `outline-hidden` differs from `outline-none`'s previous position in the token string), and `better-tailwindcss/enforce-consistent-line-wrapping` in `GalleryCard.tsx` (the renamed token no longer fit the plugin's expected line-wrap point).
- **Fix:** Applied eslint's own suggested reordering verbatim: `button.tsx` line 11 -> `whitespace-nowrap outline-hidden transition-all select-none`; `select.tsx` line 48 -> `outline-hidden transition-colors select-none`; `GalleryCard.tsx` -> split `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden` across two lines matching the plugin's expected wrap point. No ring/ring-offset classes were added, removed, or reordered relative to each other — only the renamed token's position/line moved.
- **Files modified:** `src/components/ui/button.tsx`, `src/components/ui/select.tsx`, `src/components/gallery/GalleryCard.tsx`
- **Verification:** `npx eslint` on all 6 plan files now exits 0 with zero errors/warnings; re-ran the `outline-none`/`rounded-[0.25rem]` absence checks and both false-positive trap greps to confirm the fix didn't reintroduce or regress anything.
- **Committed in:** `07cde6f` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 Rule 1 bug fix)
**Impact on plan:** Necessary to satisfy this plan's own Task 3 acceptance criteria ("eslint exits 0 with zero errors/warnings"). No scope creep — purely a class-order/line-wrap correction at the exact 3 sites this plan already touched, no new sites or classes involved.

## Issues Encountered
None beyond the auto-fixed deviation above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `outline-none` and `rounded-[0.25rem]` no longer appear anywhere in `src/` — plan 11-02 (removing the now-dead `eslint.config.mjs` ignore pattern for `rounded-[0.25rem]`, per D-03) can proceed safely, since its precondition (both rename sites landed) is now met.
- TWFX-04 (human browser verification of no visual/focus-ring regression) remains open, scoped to a later plan/checkpoint per CONTEXT.md D-05 — not part of this plan's scope.
- No blockers.

---
*Phase: 11-tailwind-deprecated-class-name-fixes*
*Completed: 2026-07-19*

## Self-Check: PASSED

All 6 modified files and the summary file confirmed present on disk; all 4 task/summary commit hashes (`7622693`, `07d1efc`, `07cde6f`, `51ad908`) confirmed present in git history.
