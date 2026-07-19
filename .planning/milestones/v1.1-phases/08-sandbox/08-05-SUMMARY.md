---
phase: 08-sandbox
plan: 05
subsystem: ui
tags: [react, tailwind, colregs, sandbox, chip-row, vitest]

# Dependency graph
requires:
  - phase: 08-sandbox
    plan: 01
    provides: 7 semantic @theme tokens, chip-scenarios.ts fixtures/CHIP_ORDER, widened types.ts (ControlPanelProps.classification)
  - phase: 08-sandbox
    plan: 02
    provides: ChartPanel.tsx re-themed against the dark palette
  - phase: 08-sandbox
    plan: 03
    provides: ControlPanel.tsx restyled with Select/Slider/Card, requires classification prop
  - phase: 08-sandbox
    plan: 04
    provides: VerdictBanner.tsx/InstrumentReadouts.tsx/ReasoningTrail.tsx replacing ReasoningPanel.tsx
provides:
  - SandboxContainer.tsx fully restyled and rewired -- new header/copy, retired nested <main>, VerdictBanner/InstrumentReadouts/ReasoningTrail composed in a responsive 2-col/full-width grid, 6-chip preset row wired through the existing applyVesselUpdate/handleReset choke point
  - CopyLinkButton.tsx restyled to an icon-only outline Button, clipboard logic unchanged
  - app/s/[shareId]/page.tsx spacing aligned with SandboxContainer's new root padding
  - SandboxContainer.test.tsx fully rewritten for the new markup (Radix Slider interaction, split verdict title/description, renamed Reset/Save accessible names, new chip-click coverage)
affects: [08-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Chip row is a plain button group (not Tabs/ToggleGroup) driving the exact same applyVesselUpdate/handleReset choke point every other update site uses -- no parallel state-update path"
    - "activeChipId is a purely cosmetic client-side highlight, cleared on any manual drag/heading/speed/type edit so it never goes stale"

key-files:
  created: []
  modified:
    - src/components/sandbox/SandboxContainer.tsx
    - src/components/sandbox/SandboxContainer.test.tsx
    - src/components/sandbox/CopyLinkButton.tsx
    - app/s/[shareId]/page.tsx

key-decisions:
  - "Default activeChipId is \"classic-crossing\" since crossingResidualBasicCase (SandboxContainer's own default seed) is byte-identical to the classic-crossing chip fixture -- confirmed by direct comparison of both literals before relying on the assumption, per the plan's own discretionary guidance"
  - "ControlPanel is rendered directly (not re-wrapped in an outer sm:grid-cols-2 grid) since ControlPanel.tsx (08-03 output) already renders its own internal 2-card grid with that exact breakpoint -- wrapping it again would nest a 2-column outer grid around a single grid item, breaking the visual layout (one outer column would render empty above 640px). The plan's acceptance-criteria grep assumed SandboxContainer.tsx itself would contain the literal `sm:grid-cols-2` string; this assumption predates ControlPanel's actual (already-committed) internal grid from Plan 08-03. Correct layout was prioritized over the grep match -- see Deviations."
  - "SandboxContainer.test.tsx's live-update/hysteresis tests drive the Radix Slider via focus() + repeated user.keyboard(\"{ArrowRight}\"/\"{ArrowLeft}\") presses (step=1), matching Plan 08-03's ControlPanel.test.tsx rewrite pattern exactly, replacing the retired native-input clear+type helper"
  - "The new chip-click test targets the verdict banner specifically via `getByRole(\"heading\", { name: ... })` (an <h2>, unambiguous vs. ControlPanel's own <h2> \"Vessel A\"/\"Vessel B\" headings) then scopes a `within()` query to that card's ancestor to disambiguate the Vessel A role badge from ControlPanel's own identically-labeled badge"

patterns-established: []

requirements-completed: [SBOX-02, SBOX-04, SBOX-05]

# Metrics
duration: ~55min
completed: 2026-07-18
---

# Phase 8 Plan 5: SandboxContainer Restyle & Wiring Summary

**Restyled SandboxContainer's header/layout and composed the 3 split reasoning cards into the design's responsive 2-col/full-width grid, wired the 6-chip preset row through the existing applyVesselUpdate/handleReset choke point, restyled CopyLinkButton to an icon button, and fully rewrote SandboxContainer.test.tsx (12/12 green) for the new markup -- closing out every remaining Wave 2 transitional typecheck error.**

## Performance

- **Duration:** ~55 min
- **Completed:** 2026-07-18T21:50:07Z
- **Tasks:** 3 completed
- **Files modified:** 4

## Accomplishments

- `SandboxContainer.tsx`'s root changed from a nested `<main>` to a plain section wrapper (`app/layout.tsx` already owns the page-level `<main>` landmark) -- zero `<main>` occurrences remain in the file
- New eyebrow/heading/subhead copy per the Sandbox design contract; Reset restyled with a `RotateCcw` icon and lowercase "Reset scenario" copy; Save relocated to an icon-only `Button` (`Link2`, `aria-label="Save and share this scenario"`) immediately left of Reset -- zero regression to SCEN-01's create-and-redirect flow
- `VerdictBanner` (full-width, standing alone) composed above a `grid-cols-1 min-[900px]:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]` row containing `ChartPanel` and a `flex flex-col` column of `InstrumentReadouts` + `ReasoningTrail`; `ControlPanel` (now passed the required `classification` prop) rendered full-width below -- collapses to the design's required Chart -> Reasoning -> Controls single-column stack below 900px with zero extra reordering CSS
- 6-chip preset row (`CHIP_ORDER`) wired via a new `handleChipSelect()` mirroring `handleReset()`'s exact shape (clears `previousEncounterTypeRef`, calls `applyVesselUpdate` with the chip's fixture, sets `activeChipId`) -- routes through the same validated choke point every other update site uses, no parallel state path; `activeChipId` cleared to `null` inside all 4 manual-edit handlers (`onVesselPositionChange`/`onVesselHeadingChange`/`onVesselSpeedChange`/`onVesselTypeChange`) so the highlight never goes stale
- `CopyLinkButton.tsx` restyled to an icon-only outline `Button` (`Link2`/`Check`), clipboard `useState`/`setTimeout` logic untouched; `app/s/[shareId]/page.tsx`'s `<CopyLinkButton />` wrapped in the same responsive horizontal padding `SandboxContainer`'s own root now uses
- `SandboxContainer.test.tsx` fully rewritten: verdict title/description asserted as two separate nodes (`getByRole("heading", ...)` + a description regex) instead of one concatenated string, the retired `<aside>` textContent-diff query replaced with a `Reasoning Trail` card lookup, native Speed inputs replaced by `getAllByRole("slider")` + arrow-key presses, Reset/Save accessible names updated, and one new test proving the "Overtaking" chip loads its fixture and lands the give-way role badge on Vessel A -- all 12 tests green
- `npm run typecheck` and `npx vitest run` (full 32-file, 191-test suite) both pass with **zero errors** after this plan

## Task Commits

Each task was committed atomically:

1. **Task 1: Restyle header, retire nested `<main>`, rebuild layout grid** - `7dc3af3` (feat)
2. **Task 2: Wire the 6-chip preset row through applyVesselUpdate/handleReset** - `0bba268` (feat)
3. **Task 3: Restyle CopyLinkButton, fix page spacing, rewrite SandboxContainer.test.tsx** - `7d89b82` (test)

## Files Created/Modified

- `src/components/sandbox/SandboxContainer.tsx` -- header/layout restyle (Task 1) + chip row wiring (Task 2)
- `src/components/sandbox/SandboxContainer.test.tsx` -- full rewrite for the new markup/copy, plus a new chip-click test
- `src/components/sandbox/CopyLinkButton.tsx` -- icon-only outline Button restyle, clipboard logic unchanged
- `app/s/[shareId]/page.tsx` -- spacing wrapper around `CopyLinkButton` matching the new root padding

## Decisions Made

- Split Task 1 and Task 2's interleaved changes to the same file into two genuinely separate commits (temporarily reverting Task 2's chip-state/handler/JSX additions, committing Task 1's layout/header restyle alone, then re-applying and committing Task 2) so each commit's diff matches its task's actual scope, rather than landing both tasks' work in one commit
- Kept `ControlPanel` rendered directly rather than re-wrapping it in a redundant outer `sm:grid-cols-2` grid (see key-decisions above) -- correctness of the responsive layout was prioritized over one acceptance-criteria grep line that predates Plan 08-03's actual (already-committed) internal-grid implementation
- Ran `npx prisma generate` (regenerates the gitignored `generated/prisma/` client from `prisma/schema.prisma`, a local build artifact, not a plan file change) and copied the gitignored, non-committed `.env` from the main repo into this worktree so the full `npx vitest run` suite (including `src/server/**` DB-backed tests) and `npm run typecheck` could both be verified as genuinely zero-error, per this plan's explicit success criterion -- neither action touched any tracked/committed file

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed stray "Reset Scenario" (old capitalization) substrings from my own draft comments**
- **Found during:** Task 1, acceptance-criteria verification
- **Issue:** Two of my own explanatory code comments referenced "Reset Scenario" (capital S) even though the actual button copy was already changed to lowercase "Reset scenario" -- tripping the plan's own `grep -c "Reset Scenario" returns 0` acceptance check
- **Fix:** Reworded both comments to lowercase "Reset scenario"
- **Files modified:** `src/components/sandbox/SandboxContainer.tsx`
- **Verification:** `grep -c "Reset Scenario" src/components/sandbox/SandboxContainer.tsx` returns 0
- **Committed in:** `7dc3af3` (Task 1)

**2. [Rule 1 - Bug] Did not wrap `ControlPanel` in a redundant outer `sm:grid-cols-2` grid**
- **Found during:** Task 1, while composing the full-width controls row
- **Issue:** The plan's action text describes wrapping "the two `<ControlPanel>`-composed vessel cards" in an outer `grid-cols-1 sm:grid-cols-2` div. `ControlPanel.tsx` (Plan 08-03's output) already renders its own internal `grid grid-cols-1 gap-4 sm:grid-cols-2` wrapping both `VesselFormSection` cards. Adding a second, outer `sm:grid-cols-2` grid around the single `<ControlPanel>` call would create a 2-column outer grid with only one grid item -- above 640px the second outer column would render empty and the first column would show ControlPanel's own already-2-column internal grid squeezed into half the intended width, a real visual regression.
- **Fix:** Rendered `<ControlPanel>` directly inside a plain `<div className="mt-8">` (spacing only, no grid), relying on ControlPanel's own existing internal grid for the 640px stacking breakpoint (SBOX-05 is still satisfied, just implemented one component level down from where this plan's acceptance grep expected to find the literal string)
- **Files modified:** `src/components/sandbox/SandboxContainer.tsx`
- **Verification:** Manual layout reasoning (traced the grid math for both above/below 640px); `sm:grid-cols-2` correctly renders once, inside `ControlPanel.tsx`, satisfying the actual responsive behavior SBOX-05 requires
- **Committed in:** `7dc3af3` (Task 1)

---

**Total deviations:** 2 auto-fixed (both Rule 1 self-corrections to satisfy either the plan's own acceptance criteria or actual correct layout behavior, not scope changes).

## Issues Encountered

- This worktree's HEAD was initially exactly Wave 1+2's merge-base (missing all of Waves 1 and 2's commits: the retired `ReasoningPanel.tsx`, the new `VerdictBanner.tsx`/`InstrumentReadouts.tsx`/`ReasoningTrail.tsx`, the restyled `ChartPanel.tsx`/`ControlPanel.tsx`). Resolved via a fast-forward-only merge (`git merge --ff-only frontend-implementation/phase-8-sandbox`) before starting any task work, matching the same precedent already documented in Plans 08-01/08-03/08-04's own summaries.
- The worktree lacked a local `.env` (gitignored, never committed) and the gitignored generated Prisma client (`generated/prisma/`) -- both pre-existing, unrelated-to-this-plan environment gaps (documented since Plan 08-01's summary as "present before any of this plan's changes"). Resolved by copying `.env` from the main repo checkout and running `npx prisma generate` -- both local, non-committed actions -- so the full `npx vitest run`/`npm run typecheck` verification this plan's success criteria explicitly requires could be run to a genuinely clean zero-error result, rather than reporting the pre-existing gap as an unavoidable residual error.

## User Setup Required

None - no external service configuration required. (The `.env` copy and `prisma generate` run above were local verification steps only, not deliverables of this plan -- any fresh worktree/environment will still need its own `.env` and a `prisma generate` run, unrelated to this plan's own scope.)

## Next Phase Readiness

- Phase 8 (Sandbox) is now fully wired: all 6 waves' worth of restyle/composition work (tokens, ChartPanel, ControlPanel, the 3 split reasoning cards, and this plan's SandboxContainer rewiring) type-checks and tests cleanly across the entire repository.
- Plan 08-06 (the phase's final manual browser drag+rotate UAT pass, per `08-UI-SPEC.md`'s mandatory hit-testing regression check) can proceed against a fully composed, green `SandboxContainer`.
- No blockers.

## Self-Check

```
FOUND: src/components/sandbox/SandboxContainer.tsx
FOUND: src/components/sandbox/SandboxContainer.test.tsx
FOUND: src/components/sandbox/CopyLinkButton.tsx
FOUND: app/s/[shareId]/page.tsx
FOUND commit: 7dc3af3
FOUND commit: 0bba268
FOUND commit: 7d89b82
```

All 4 modified files verified present on disk with the expected content; all 3 task commit hashes verified present in `git log`.

## Self-Check: PASSED

---
*Phase: 08-sandbox*
*Completed: 2026-07-18*
