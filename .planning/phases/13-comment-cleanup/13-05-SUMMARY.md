---
phase: 13-comment-cleanup
plan: 05
subsystem: ui
tags: [comments, documentation, sandbox, react, drag-gesture, eslint, code-hygiene]

# Dependency graph
requires: []
provides:
  - Stale Phase/Plan/Task-N/threat-model-ID comment references removed from SandboxContainer's state hook, shared Sandbox types, and the hull/rotate drag-gesture hooks (9 files)
affects: [13-08 final verification sweep]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Rotting-pointer comments (05-03 / Phase N / bare Task N / T-NN-NN / -PLAN.md / RESEARCH.md) rewritten to state the underlying reason directly, per CLAUDE.md's comment convention"

key-files:
  created: []
  modified:
    - src/components/sandbox/SandboxContainer.test.tsx
    - src/components/sandbox/hooks/useSandboxState.ts
    - src/components/sandbox/types.ts
    - src/components/sandbox/vessel-role.ts
    - src/components/sandbox/environment.smoke.test.tsx
    - src/components/sandbox/hooks/useHullDrag.ts
    - src/components/sandbox/hooks/useHullDrag.test.ts
    - src/components/sandbox/hooks/useRotateHandleDrag.ts
    - src/components/sandbox/hooks/useRotateHandleDrag.test.ts

key-decisions:
  - "The color-name false positive in vessel-role.ts (red-500/green-500/slate-400) and the VESL-02/D-01 REQ-ID citations in the drag hooks were confirmed as intentional retentions, per the plan's own acceptance-criteria notes"

patterns-established: []

requirements-completed: [CMNT-01]

# Metrics
duration: 12min
completed: 2026-07-20
---

# Phase 13 Plan 05: Comment Cleanup (Sandbox cluster B) Summary

**Rewrote every stale Phase/Plan/Task-N/threat-model-ID comment reference across SandboxContainer's state hook, shared Sandbox types, and the hull/rotate drag-gesture hooks into durable, reason-based comments with zero change to drag-gesture math, hysteresis semantics, or state-machine behavior.**

## Performance

- **Duration:** ~12 min (resumed after a session interruption killed the original background executor mid-Task-2)
- **Started:** 2026-07-20T11:19:00+01:00
- **Completed:** 2026-07-20T13:42:04+01:00
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Removed every "05-03", bare "Task N", "T-08-07", "T-04-01", "04-03-PLAN.md", "04-RESEARCH.md", and "Phase N" reference from all 9 files while preserving Rule 13(d) hysteresis and Pitfall-5 degenerate-frame rationale intact
- `useRotateHandleDrag.test.ts` (outside the original 54-file ESLint-flagged scoping sweep) had its own stale `(04-03 Task 3)` header found and rewritten, per CMNT-02's broader re-grep intent
- Dropped "(code review CR-02)" from a test name since the reasoning is already fully explained in the comment immediately below it
- Left the color-name false positive in `vessel-role.ts` (`red-500`/`green-500`/`slate-400`) untouched, confirmed via grep
- Verified zero behavior change: `SandboxContainer.test.tsx`, `environment.smoke.test.tsx`, `useHullDrag.test.ts`, `useRotateHandleDrag.test.ts` all pass — 16/16, matching pre-change behavior
- `npm run typecheck` passes clean (confirms the `it(...)` string-literal rename introduced no syntax error)

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite stale comments in SandboxContainer.test.tsx, useSandboxState.ts, types.ts, vessel-role.ts, environment.smoke.test.tsx** - `2377fe2` (docs)
2. **Task 2: Rewrite stale comments in useHullDrag.ts/.test.ts, useRotateHandleDrag.ts/.test.ts** - `4d7118d` (docs)

_Note: no TDD tasks in this plan; both commits are documentation-only (comment/test-name text) with no code/logic change._

## Files Created/Modified
- `src/components/sandbox/SandboxContainer.test.tsx` - "05-03 Task 1/2" references dropped (3 locations); "(code review CR-02)" dropped from a test name
- `src/components/sandbox/hooks/useSandboxState.ts` - "05-03 Task 2"/"05-03:" dropped (2 locations); `T-08-07`/`T-04-01` threat-model pointers dropped, WHY content retained
- `src/components/sandbox/types.ts` - "Phase 4's sandbox UI (04-01)... (04-02 through 04-06)" rewritten; "(05-03 Task 1, ...)" rewritten
- `src/components/sandbox/vessel-role.ts` - "(04-01)" dropped; "established by Phase 7's rule-banner precedent" and "per 08-UI-SPEC.md's Color section measurement" rewritten; color-shade false positive left untouched
- `src/components/sandbox/environment.smoke.test.tsx` - "(04-01)" dropped, GitHub issue link `vitest-dev/vitest#9279` (a stable external reference) kept
- `src/components/sandbox/hooks/useHullDrag.ts` - "(04-03-PLAN.md's threat model T-04-09: ...)" rewritten to state the validation-boundary reason directly
- `src/components/sandbox/hooks/useHullDrag.test.ts` - "(04-03 Task 3)" dropped; "per this plan's own file list" rewritten
- `src/components/sandbox/hooks/useRotateHandleDrag.ts` - "(04-RESEARCH.md Anti-Patterns)" rewritten to state the drift-risk reason directly
- `src/components/sandbox/hooks/useRotateHandleDrag.test.ts` - "(04-03 Task 3)" dropped

## Decisions Made
None beyond the plan's own explicit scoping. The plan's Task 2 acceptance-criteria grep pattern (`VESL-02/D-01\)\.`) intentionally still matches the retained bare `VESL-02`/`D-01` citations in `useHullDrag.ts`/`useRotateHandleDrag.ts` -- confirmed via a follow-up grep excluding that sub-pattern that no other stale-ID pattern (04-03/Task N/RESEARCH.md/-PLAN.md/this-plan) survives.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
The original background executor for this plan was killed mid-Task-2 by an unrelated session restart (`/login` re-auth), after applying all of Task 1's edits (5 files) but leaving them uncommitted, and before starting Task 2 at all. The orchestrator picked up from the uncommitted Task 1 diff, verified it against the plan's acceptance criteria, committed it, then applied and verified Task 2 from scratch. `npm run typecheck` initially failed with a missing generated Prisma client module; resolved by copying the repo-root `.env` (containing `DATABASE_URL`, required by `prisma.config.ts`) into this worktree and running `npx prisma generate` -- a pre-existing environment-setup gap (worktrees don't inherit gitignored `.env` files) unrelated to this plan's comment edits.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
All 9 files in this Sandbox-cluster-B set are clean of Phase/Plan/Task-N/threat-model-ID references (except the deliberately-preserved color-name false positive and the live REQ-ID/decision-ID citations). `npx vitest run` on all 4 affected test files passes 16/16, matching pre-change behavior. `npm run typecheck` passes clean. Ready for the orchestrator to merge alongside sibling plans 13-01..13-04, 13-06.

## Self-Check: PASSED

- FOUND: src/components/sandbox/SandboxContainer.test.tsx
- FOUND: src/components/sandbox/hooks/useSandboxState.ts
- FOUND: src/components/sandbox/types.ts
- FOUND: src/components/sandbox/vessel-role.ts
- FOUND: src/components/sandbox/environment.smoke.test.tsx
- FOUND: src/components/sandbox/hooks/useHullDrag.ts
- FOUND: src/components/sandbox/hooks/useHullDrag.test.ts
- FOUND: src/components/sandbox/hooks/useRotateHandleDrag.ts
- FOUND: src/components/sandbox/hooks/useRotateHandleDrag.test.ts
- FOUND: 2377fe2
- FOUND: 4d7118d

---
*Phase: 13-comment-cleanup*
*Completed: 2026-07-20*
