---
phase: 16-sandbox-mutation-path-generalization
plan: 01
subsystem: ui
tags: [react, hooks, sandbox, refactor, vitest]

# Dependency graph
requires:
  - phase: 04-interactive-chart-sandbox
    provides: "useSandboxState() hook, applyVesselUpdate choke point, chip-preset row"
provides:
  - "loadScenario(vesselA, vesselB) — the single generalized full-replace + hysteresis-reset entry point on useSandboxState()"
  - "handleReset() refactored to delegate its apply step to loadScenario()"
  - "Chip row UI and chip-scenarios.ts/chip-scenarios.test.ts fully removed from the Sandbox feature"
affects: [17-gallery-sandbox-bridge, 18-on-chart-vessel-overlay]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Single generalized mutation choke point (loadScenario) replacing a chip-specific one — future mutation sources (Gallery load, on-chart overlay edits) call loadScenario() directly instead of adding a parallel path"

key-files:
  created: []
  modified:
    - src/components/sandbox/hooks/useSandboxState.ts
    - src/components/sandbox/SandboxContainer.tsx
    - src/components/sandbox/SandboxContainer.test.tsx

key-decisions:
  - "loadScenario(nextA, nextB) replaces handleChipSelect(chipId) — same 2-line body (reset hysteresis, call applyVesselUpdate), minus the chip lookup"
  - "handleReset() delegates its apply step to loadScenario(seedA, seedB) rather than duplicating the reset-then-apply body (no-duplicated-near-identical-logic convention)"
  - "chip-scenarios.ts and its test deleted outright — the 3 nontrivial fixtures are already preserved verbatim in classify-encounter.fixtures.ts; the other 3 have no unique derivation value"

patterns-established:
  - "Generalize an existing tested choke point in place rather than adding a parallel one when a UI-specific wrapper (chip row) is removed"

requirements-completed: [SBOX-10]

# Metrics
duration: 5min
completed: 2026-07-25
---

# Phase 16 Plan 01: Sandbox Mutation-Path Generalization Summary

**Generalized `useSandboxState()`'s chip-select mutation path into a single `loadScenario(vesselA, vesselB)` entry point, made `handleReset()` delegate to it, and deleted the inline 6-chip preset row plus its backing `chip-scenarios.ts` module.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-07-25T12:41:00+01:00
- **Completed:** 2026-07-25T12:45:32+01:00
- **Tasks:** 3 completed
- **Files modified:** 3 (plus 2 deleted)

## Accomplishments
- `useSandboxState()` now exposes `loadScenario(vesselA, vesselB)` as the single generalized full-replace + hysteresis-reset entry point, with `handleChipSelect`/`ChipId`/`activeChipId` removed entirely
- `handleReset()` delegates its apply step to `loadScenario(seedA, seedB)` instead of duplicating the reset-then-apply body
- Chip row JSX, `chip-scenarios.ts`, and `chip-scenarios.test.ts` are fully deleted from the Sandbox feature directory — the `/` route no longer displays the 6-chip preset row
- `SandboxContainer.test.tsx` updated: chip-dependent tests removed, Reset/initialScenario test's comment strengthened to document it proves `loadScenario`'s contract, and a new assertion confirms no chip button renders on default mount

## Task Commits

Each task was committed atomically:

1. **Task 1: Generalize handleChipSelect into loadScenario in useSandboxState.ts** - `ae09491` (refactor)
2. **Task 2: Remove chip row UI from SandboxContainer.tsx and delete chip-scenarios.ts + its test** - `6067e33` (feat)
3. **Task 3: Replace chip-dependent tests in SandboxContainer.test.tsx and close out the orphaned-code check** - `63c76b9` (test)

## Files Created/Modified
- `src/components/sandbox/hooks/useSandboxState.ts` - `loadScenario()` replaces `handleChipSelect()`; `activeChipId` removed; `handleReset()` delegates to `loadScenario()`
- `src/components/sandbox/SandboxContainer.tsx` - chip row JSX and `CHIP_ORDER` import deleted; header comment updated
- `src/components/sandbox/SandboxContainer.test.tsx` - chip-dependent tests removed, Reset test comment strengthened, default-mount test asserts no chip button, unused `within` import removed
- `src/components/sandbox/chip-scenarios.ts` - deleted (D-04)
- `src/components/sandbox/chip-scenarios.test.ts` - deleted (D-04)

## Decisions Made
None beyond what CONTEXT.md/PATTERNS.md already locked (D-01 through D-06) — plan executed exactly as specified in those documents.

## Deviations from Plan

**1. [Rule 3 - Blocking] Removed the now-unused `within` import from SandboxContainer.test.tsx**
- **Found during:** Task 3
- **Issue:** Deleting the two chip-dependent tests left `within` (from `@testing-library/react`) with no remaining call site in the file, which would fail `npm run lint`'s unused-import rule
- **Fix:** Removed `within` from the import statement; `act`, `cleanup`, `render`, `screen` remain in use
- **Files modified:** src/components/sandbox/SandboxContainer.test.tsx
- **Verification:** `npm run lint` exits 0; `npx vitest run SandboxContainer.test.tsx` passes 11/11
- **Committed in:** 63c76b9 (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minor lint-only fix, no scope creep.

## Issues Encountered

**Pre-existing, out-of-scope environment gap (not caused by this plan):** the parallel-execution worktree lacks the repo's gitignored `.env` (present in the main checkout but not copied into `.claude/worktrees/agent-a044b29edfb9e8455`), so `generated/prisma/client.js` is never generated and any DB-backed test (`src/server/db/scenario-repository.test.ts`, `src/server/application/scenario-service.test.ts`, `src/server/api/routers/scenario.test.ts`) and `src/components/gallery/GalleryContainer.test.tsx` (which imports the Prisma-backed server layer transitively) fail with `SASL`/`Cannot find module '../../../generated/prisma/client.js'` errors. This is unrelated to any file this plan touches (`src/components/sandbox/**` only) and was confirmed by inspecting the failures directly — none reference Sandbox files. `npx vitest run SandboxContainer.test.tsx` (the file this plan modifies) passes 11/11 with 0 failures, `npm run typecheck` and `npm run lint` are both clean except for this same pre-existing Prisma-client-resolution error and 3 pre-existing unrelated `max-lines` warnings in `src/domain/colregs/*` files. Not fixed per the Scope Boundary rule (pre-existing failure in unrelated files/environment, out of scope for this task).

## Next Phase Readiness
- `loadScenario(vesselA, vesselB)` is ready as the single mutation choke point Phase 17 (Gallery→Sandbox bridge) will call as its second consumer
- No orphaned chip code remains anywhere in `src/components/sandbox/` (verified via grep)
- Success criterion 3 (human-verified behavioral parity of drag/rotate/ControlPanel-edit/Reset) is deferred to the follow-on `16-02-PLAN.md`, which depends on this plan, per this plan's own `<success_criteria>` section

---
*Phase: 16-sandbox-mutation-path-generalization*
*Completed: 2026-07-25*
