---
phase: 08-sandbox
plan: 03
subsystem: ui
tags: [tailwind, shadcn, radix, vitest, colregs, sandbox, control-panel]

# Dependency graph
requires:
  - phase: 08-sandbox
    plan: 01
    provides: shadcn Select/Slider/Label primitives, vessel-role.ts consolidated ROLE_BADGE_TEXT/ROLE_BADGE_CLASSNAME, widened ControlPanelProps.classification
provides:
  - ControlPanel.tsx restyled with Card/Select/Slider/Badge, TYPE/SPEED/HEADING field order, card-header letter-chip + role badge
  - ControlPanel.test.tsx fully rewritten for the Radix Select/Slider interaction pattern
affects: [08-05, 08-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Radix Select/Slider test interaction: click trigger + async findByRole('option') for Select, focus + keyboard ArrowRight/Left on role=slider for Slider -- not user.selectOptions/user.type"
    - "ResizeObserver polyfill required for Radix Slider under jsdom (react-use-size hook), scoped locally per-file, not global"

key-files:
  created: []
  modified:
    - src/components/sandbox/ControlPanel.tsx
    - src/components/sandbox/ControlPanel.test.tsx

key-decisions:
  - "Committed the component restyle (Task 1) and the full test-file rewrite (Task 2) as two separate atomic commits, matching the plan's per-task files_modified split, even though the intermediate state (old test file against new Select/Slider markup) would not itself pass in isolation -- this is a real, unavoidable one-way coupling for a native-control-to-Radix-primitive swap, not a TDD RED/GREEN pair of the same behavior"
  - "Card component's default CardHeader grid layout is overridden to flex via twMerge (className prop wins the grid-vs-flex conflict), rather than fighting the shadcn primitive's default -- confirmed via lib/utils.ts's twMerge+clsx cn() helper"

requirements-completed: [SBOX-02, SBOX-04]

# Metrics
duration: 35min
completed: 2026-07-18
---

# Phase 8 Plan 3: ControlPanel Select/Slider Restyle Summary

**Swapped ControlPanel.tsx's native `<input type="number">`/`<select>` for shadcn `Slider`/`Select` inside a per-vessel `Card` with a letter-chip + role-badge header row, and fully rewrote `ControlPanel.test.tsx`'s interaction assertions for the Radix primitive click/keyboard pattern, preserving the exact `onVesselSpeedChange`/`onVesselTypeChange` call contract.**

## Performance

- **Duration:** ~35 min
- **Completed:** 2026-07-18
- **Tasks:** 2 completed
- **Files modified:** 2

## Accomplishments

- `ControlPanel.tsx` now renders each vessel inside a `Card`/`CardHeader`/`CardContent`: header row is letter-chip ("A"/"B") + "Vessel A"/"Vessel B" + a role `Badge` derived via `getVesselRole(label, classification)` and `vessel-role.ts`'s consolidated `ROLE_BADGE_TEXT`/`ROLE_BADGE_CLASSNAME` maps (never a locally re-derived role)
- Field order is now TYPE (shadcn `Select`) -> SPEED (shadcn `Slider` + live `${speed} kn` mono readout, the only element in this file using `--primary`) -> HEADING (read-only, zero-padded 3-digit degree string, no new editable control -- heading stays drag-only on the chart per D-06)
- `VESSEL_TYPE_LABELS` and the "never hand-author a parallel option list" invariant are unchanged -- `VesselTypeSchema.options` is still the single source of truth for `Select`'s option values
- `ControlPanel.test.tsx` is a full interaction-pattern rewrite: `user.selectOptions()` replaced by `click` + async `findByRole("option")` for `Select`; the native number-input `user.clear`/`user.type` replaced by `focus()` + `user.keyboard("{ArrowRight}")` on `role="slider"` for `Slider`
- Added a new test asserting the card-header role badge (`GW`/`SO`) renders from the classification-derived role
- Added local `ResizeObserver`/pointer-capture/`scrollIntoView` polyfills scoped to this file's own `beforeEach`, matching `ChartPanel.test.tsx`'s established convention (not added to a global `vitest.setup.ts`)

## Task Commits

Each task was committed atomically:

1. **Task 1: Swap native inputs for Select/Slider, add Card header row and HEADING readout** - `3442b0a` (feat)
2. **Task 2: Rewrite ControlPanel.test.tsx for the Radix Select/Slider interaction pattern** - `0a34277` (test)

## Files Created/Modified

- `src/components/sandbox/ControlPanel.tsx` - Select/Slider/Card/Badge restyle, TYPE/SPEED/HEADING order, card-header role badge
- `src/components/sandbox/ControlPanel.test.tsx` - full interaction-pattern rewrite for Radix Select/Slider, classificationFixture threaded through every render, new role-badge test, local jsdom polyfills

## Decisions Made

- Followed the plan's exact markup/class recommendations from `08-PATTERNS.md`'s "New shadcn pattern" and `08-UI-SPEC.md`'s Typography/Color sections (letter-chip classes, Speed-readout `--primary` exclusivity, uppercase Label field text) with no deviation
- Committed Task 1 (component) and Task 2 (test rewrite) as two separate commits per the plan's own file-scoped task split, even though the old test file cannot pass against the new Radix markup in isolation between the two commits -- this one-way coupling is inherent to a native-control-to-Radix-primitive swap, not something to paper over by merging the commits

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added a `ResizeObserver` polyfill to `ControlPanel.test.tsx`, not mentioned explicitly in the plan's own polyfill list**
- **Found during:** Task 2, first test run
- **Issue:** Radix `Slider`'s internal `@radix-ui/react-use-size` hook calls `ResizeObserver` directly on mount; jsdom does not implement it, causing every test to fail with `ReferenceError: ResizeObserver is not defined` before any assertion ran
- **Fix:** Added a minimal `MockResizeObserver` class + `vi.stubGlobal("ResizeObserver", MockResizeObserver)` in the file's `beforeEach`, mirroring `ChartPanel.test.tsx`'s existing convention for the same class of jsdom gap (the plan's own `<action>` text called out `hasPointerCapture`/`scrollIntoView` explicitly but not `ResizeObserver`, since it doesn't affect `Select`, only `Slider`)
- **Files modified:** `src/components/sandbox/ControlPanel.test.tsx`
- **Verification:** All 5 tests pass
- **Committed in:** `0a34277` (Task 2)

**2. [Rule 1 - Bug] Removed a literal `user.selectOptions` comment-only occurrence to satisfy the plan's own acceptance-criteria grep**
- **Found during:** Task 2, acceptance-criteria verification
- **Issue:** A file-header comment explaining the test rewrite's rationale happened to contain the literal string `user.selectOptions`, which the plan's `grep -c "user.selectOptions" ... returns 0` acceptance criterion flagged (comment text, not actual test code)
- **Fix:** Reworded the comment to describe the same rationale without the literal flagged substring
- **Files modified:** `src/components/sandbox/ControlPanel.test.tsx`
- **Verification:** `grep -c "user.selectOptions" src/components/sandbox/ControlPanel.test.tsx` returns 0; all tests still pass
- **Committed in:** `0a34277` (Task 2)

---

**Total deviations:** 2 auto-fixed (1 blocking jsdom gap, 1 self-correction to satisfy the plan's own acceptance grep) -- no scope creep.

## Issues Encountered

- This worktree's HEAD was initially based on a stale commit missing Wave 1 (`08-01`)'s foundation (shadcn `Select`/`Slider`/`Label`, widened `types.ts`, consolidated `vessel-role.ts`). Resolved via a fast-forward-only merge (`git merge --ff-only frontend-implementation/phase-8-sandbox`) before starting any task work, per this plan's own `<worktree_branch_check>` instructions.
- `npm run typecheck` reports pre-existing errors in `ReasoningPanel.tsx` (expected Wave 2 cleanup surface, addressed by plan `08-04`), `SandboxContainer.tsx` (`ControlPanel` call site not yet updated with the required `classification` prop -- expected Wave 3 wiring, addressed by plan `08-05`), and `src/server/db/client.ts` (pre-existing, unrelated Prisma-generated-client gap, out of this plan's scope). Zero errors are attributable to `ControlPanel.tsx`/`ControlPanel.test.tsx` themselves, satisfying this plan's own acceptance criterion.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan `08-05` (SandboxContainer restyle/wiring) can now pass `classification` into `ControlPanel` at its call site -- the missing-prop typecheck error at `SandboxContainer.tsx:188` will resolve once that plan updates the call site, which is expected, documented wave-3 cleanup, not a regression introduced here.
- No blockers for later waves.

## Self-Check: PASSED

Both modified files verified present on disk with the expected content; both commit hashes (`3442b0a`, `0a34277`) verified present in `git log`.

---
*Phase: 08-sandbox*
*Completed: 2026-07-18*
