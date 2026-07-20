---
phase: 12-chartpanel-sandboxcontainer-decomposition-refactor
plan: 02
subsystem: ui
tags: [react, hooks, refactor, sandbox, state-machine]

# Dependency graph
requires: []
provides:
  - useSandboxState() hook owning SandboxContainer's vessel state, Rule 13(d) hysteresis, and the applyVesselUpdate choke point
  - SandboxContainer.tsx reduced to a thin consumer of useSandboxState() plus JSX composition
affects: [12-03, 12-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "State-machine extraction into a dedicated hooks/ file, keeping the presentation component as pure JSX composition (established Phase 7, applied here to the Sandbox feature's top-level container)"

key-files:
  created:
    - src/components/sandbox/hooks/useSandboxState.ts
  modified:
    - src/components/sandbox/SandboxContainer.tsx
    - eslint-suppressions.json

key-decisions:
  - "Moved the 4 pre-existing stale-ID comments (05-03, T-08-07, T-04-01, D-01/D-02) verbatim into useSandboxState.ts per the plan's explicit preserve-unchanged instruction, and relocated their eslint-suppressions.json entry to match -- actual removal of these comments is Phase 13's job (comment cleanup), out of scope here"
  - "Wrote SandboxContainer.tsx's own new top-of-file doc comment without a Phase/Plan/REQ-ID reference (reworded to explain the reason instead), since a freshly-authored comment referencing RFCT-04/CLAS-05 would itself trip the local no-stale-id-comments lint rule"

patterns-established: []

requirements-completed: [RFCT-04, RFCT-07, RFCT-08]

# Metrics
duration: 12min
completed: 2026-07-20
---

# Phase 12 Plan 2: SandboxContainer State-Machine Extraction Summary

**Extracted SandboxContainer.tsx's vessel state, Rule 13(d) hysteresis, and applyVesselUpdate choke point into a new `useSandboxState()` hook, leaving SandboxContainer.tsx at 146 lines of pure JSX composition.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-20T09:21:00Z (approx)
- **Completed:** 2026-07-20T09:33:47Z
- **Tasks:** 2 completed (plus 1 auto-fix commit)
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments
- `src/components/sandbox/hooks/useSandboxState.ts` created, exporting `useSandboxState()` with the exact interface locked in the plan: vessel state, `lastGoodClassification`, `isDegenerate`, `activeChipId`, `saveError`, `isSaving`, the 4 `onVesselXChange` handlers, `handleReset`, `handleChipSelect`, and a new `handleSave` (wrapping the previously-inline `createScenario.mutate` call)
- `previousEncounterTypeRef` Rule 13(d) hysteresis ref and the Pitfall 5 degenerate-frame handling comment moved byte-identical, word-for-word
- `SandboxContainer.tsx` now calls `useSandboxState(initialScenario)` once and references `sandboxState.*` at every former direct state/handler use site -- no state or business logic remains inline
- Full regression suite (209 tests across 36 files, including the unmodified 13-test `SandboxContainer.test.tsx`) and `npx tsc --noEmit` both pass
- `npx eslint .` stays at 0 errors after the file move (suppression baseline entry relocated, no comments deleted -- that's Phase 13's scope)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create hooks/useSandboxState.ts** - `3bfae34` (feat)
2. **Task 2: Wire useSandboxState() into SandboxContainer.tsx, run full regression suite** - `909eaad` (refactor)

**Deviation fix:** `c0e4791` (fix) - kept the lint-clean baseline in sync with the file move (see Deviations below)

## Files Created/Modified
- `src/components/sandbox/hooks/useSandboxState.ts` - New hook: vessel state, Rule 13(d) hysteresis ref, `applyVesselUpdate` choke point, the 4 `onVesselXChange` handlers, `handleReset`, `handleChipSelect`, `handleSave`
- `src/components/sandbox/SandboxContainer.tsx` - Reduced from 301 to 146 lines; now a `useSandboxState()` consumer plus JSX composition only
- `eslint-suppressions.json` - Relocated the 4-count `local/no-stale-id-comments` suppression entry from `SandboxContainer.tsx` to `hooks/useSandboxState.ts`, matching where those pre-existing comments now live

## Decisions Made
- Preserved the plan's explicit instruction to move the `05-03`/`T-08-07`/`T-04-01`/`D-01/D-02` comments unchanged rather than cleaning them up now -- that cleanup is Phase 13's explicit scope (codebase-wide stale-ID comment removal), and doing it here would go beyond this plan's stated objective (pure state/JSX split, byte-identical hysteresis behavior)
- Wrote fresh doc comments (top of both files) using reasons/decisions rather than requirement-ID references, per CLAUDE.md's comment convention, avoiding introducing a *new* rotting-ID violation while performing the extraction

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing `.env` and ungenerated Prisma client blocked `npx tsc --noEmit` and the DB-touching subset of `npx vitest run`**
- **Found during:** Task 2 verification (`npx tsc --noEmit`)
- **Issue:** This worktree checkout had no `.env` file (gitignored, not copied into the worktree) and no `generated/prisma` client directory, so `tsc --noEmit` failed on an unrelated import (`src/server/db/client.ts` couldn't resolve `../../../generated/prisma/client.js`)
- **Fix:** Copied the existing (gitignored, non-secret local-dev-only) `.env` from the main repo checkout into the worktree, then ran `npx prisma generate` to populate `generated/prisma`. No code or schema changes -- purely restored local dev tooling state that already existed in the main checkout
- **Files modified:** None tracked (`.env` is gitignored; `generated/prisma` is a build artifact, also gitignored)
- **Verification:** `npx tsc --noEmit` now exits 0; `npx vitest run` went from 4 failed / 32 passed test files to 36/36 passed (209/209 tests)
- **Committed in:** N/A (no tracked files changed by this fix)

**2. [Rule 1 - Bug] Own new doc comments tripped the local `no-stale-id-comments` ESLint rule**
- **Found during:** Post-task-2 lint check (`npx eslint .`)
- **Issue:** The new top-of-file doc comments I wrote for both `SandboxContainer.tsx` and `useSandboxState.ts` referenced `RFCT-04`/`CLAS-05`, which the project's local `no-stale-id-comments` rule flags as a rotting requirement-ID reference (CLAUDE.md convention: explain the reason, not the ID)
- **Fix:** Reworded both doc comments to state the underlying reason (separation of state from presentation; live-update-regardless-of-input-modality behavior) instead of the requirement IDs
- **Files modified:** `src/components/sandbox/SandboxContainer.tsx`, `src/components/sandbox/hooks/useSandboxState.ts`
- **Verification:** `npx eslint .` error count for these two files dropped to 0
- **Committed in:** `c0e4791`

**3. [Rule 3 - Blocking] eslint-suppressions.json's per-file baseline was stale after the code move**
- **Found during:** Post-task-2 lint check (`npx eslint .`)
- **Issue:** `eslint-suppressions.json` had a 4-count `local/no-stale-id-comments` suppression entry for `SandboxContainer.tsx` (the 4 pre-existing stale-ID comments, moved verbatim per the plan). After the move those 4 violations now live in `hooks/useSandboxState.ts`, which had no suppression entry -- `npx eslint .` failed with 4 fresh errors there, while `SandboxContainer.tsx`'s now-unused suppression entry triggered ESLint's "suppressions left that do not occur anymore" warning
- **Fix:** Removed the stale `SandboxContainer.tsx` entry and added an equivalent 4-count entry for `hooks/useSandboxState.ts`, matching the actual post-move violation location. Did not delete the underlying comments themselves (Phase 13's scope) or run a global `--prune-suppressions` pass (would have touched unrelated pre-existing suppressions outside this plan's scope)
- **Files modified:** `eslint-suppressions.json`
- **Verification:** `npx eslint .` returns to 0 errors (3 pre-existing, unrelated `max-lines` warnings remain, out of scope for this plan)
- **Committed in:** `c0e4791`

---

**Total deviations:** 3 auto-fixed (1 blocking-environment, 1 self-introduced lint bug, 1 blocking-suppression-baseline)
**Impact on plan:** All three were necessary to make the plan's own stated verification commands (`npx tsc --noEmit`, `npx vitest run`, `npx eslint .`) actually pass in this worktree; none touched domain logic, hysteresis behavior, or introduced scope creep beyond the file-move's direct consequences.

## Issues Encountered
None beyond the auto-fixed items above.

## User Setup Required
None - no external service configuration required. (The `.env` restoration above was a local-worktree-only fix using an already-existing, non-secret local dev value; no new external service was introduced.)

## Next Phase Readiness
- `useSandboxState()` is in place and independently testable/reusable if a future plan (12-03, 12-04) needs to compose it differently
- `SandboxContainer.tsx` is now well under the ~150-200 line convention threshold (146 lines), matching RFCT-07's target
- No blockers for subsequent Phase 12 plans -- this plan's files (`SandboxContainer.tsx`, `hooks/useSandboxState.ts`) are disjoint from the ChartPanel-side extractions per D-03

---
*Phase: 12-chartpanel-sandboxcontainer-decomposition-refactor*
*Completed: 2026-07-20*

## Self-Check: PASSED
