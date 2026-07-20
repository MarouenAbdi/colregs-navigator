---
phase: 13-comment-cleanup
plan: 03
subsystem: api
tags: [comments, documentation, trpc, prisma, eslint, code-hygiene]

# Dependency graph
requires: []
provides:
  - Stale Phase/Plan/RESEARCH.md/doc-filename/Task-N comment references removed from all 9 files in the server and tRPC layer
affects: [13-08 final verification sweep]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Rotting-pointer comments (Plan N / Open Question N / RESEARCH.md / -PLAN.md / Phase N / bare Task N) rewritten to state the underlying reason directly, per CLAUDE.md's comment convention"

key-files:
  created: []
  modified:
    - src/server/application/scenario-service.ts
    - src/server/application/scenario-service.test.ts
    - src/server/api/routers/scenario.test.ts
    - src/server/db/scenario-repository.ts
    - src/server/db/scenario-repository.test.ts
    - src/server/db/curated-scenarios.ts
    - src/server/db/curated-scenarios.test.ts
    - src/server/api/trpc.ts
    - src/lib/trpc/banner.ts

key-decisions:
  - "curated-scenarios.ts's ruleLabel comment deviated from the plan's literal suggested text (\"see the research-gap note above\") because no such note exists anywhere else in the file -- inlined a self-contained reason instead of leaving a new dangling reference"
  - "SCEN-02/D-01/D-06/GAL-01/D-01..D-05/D-02 REQ-ID and decision-ID citations kept verbatim throughout, per plan"

patterns-established: []

requirements-completed: [CMNT-01]

# Metrics
duration: 15min
completed: 2026-07-20
---

# Phase 13 Plan 03: Comment Cleanup (server/tRPC) Summary

**Rewrote every stale Phase/Plan/Open-Question/RESEARCH.md/doc-filename comment reference across all 9 files in the server and tRPC layer into durable, reason-based comments with zero behavior change.**

## Performance

- **Duration:** ~15 min (resumed after a session interruption killed the original background executor mid-Task-2)
- **Started:** 2026-07-20T11:19:00+01:00
- **Completed:** 2026-07-20T13:37:28+01:00
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Removed every "Plan N", "Open Question N", "RESEARCH.md", "-PLAN.md", "Phase N", bare "Task N", and "05-03" reference from all 9 files while preserving substantive WHY content
- `scenario-repository.ts` and `trpc.ts` (tRPC-adjacent files outside the original 54-file ESLint-flagged scoping sweep) had their own bare `RESEARCH.md` references found and rewritten, per CMNT-02's broader re-grep intent
- Renamed the `curated-scenarios.test.ts` test name to drop "Test 1:"/`SCEN-03` numbering from the test-runner-visible string (traceability lives in REQUIREMENTS.md)
- Verified zero behavior change: `scenario-service.test.ts`, `scenario-repository.test.ts` (live Docker Postgres integration tests), and `curated-scenarios.test.ts` all pass — 16/16, matching pre-change behavior
- `npm run typecheck` passes clean (confirms the test-name rename introduced no syntax error)

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite stale comments in scenario-service.ts, scenario-service.test.ts, scenario.test.ts, scenario-repository.ts, scenario-repository.test.ts** - `c99bc28` (docs)
2. **Task 2: Rewrite stale comments in curated-scenarios.ts, curated-scenarios.test.ts, trpc.ts, banner.ts** - `8b33b8a` (docs)

_Note: no TDD tasks in this plan; both commits are documentation-only (comment/test-name text) with no code/logic change._

## Files Created/Modified
- `src/server/application/scenario-service.ts` - "Open Question 1/3 (RESEARCH.md)" rewritten to direct design-resolution statements; "in this phase" rewritten
- `src/server/application/scenario-service.test.ts` - "resolved in this plan's Task 2"/"from Plan 01" rewritten; "05-02-PLAN.md Task 2 side effect" rewritten to "prisma/seed.ts side effect"
- `src/server/api/routers/scenario.test.ts` - "already covered in Plan 02" rewritten; "05-02-PLAN.md Task 3" rewritten to "prisma/seed.ts follow-up"
- `src/server/db/scenario-repository.ts` - bare `RESEARCH.md` Anti-Patterns reference (found via broader re-grep, not in the original ESLint-flagged file list) rewritten to state the no-generic-`Repository<T>` reasoning directly
- `src/server/db/scenario-repository.test.ts` - "from Plan 01" rewritten
- `src/server/db/curated-scenarios.ts` - "05-RESEARCH.md's Fixture Catalog"/"Phase 8's Sandbox chip row" rewritten; the ruleLabel comment (line 80-81) rewritten with a self-contained reason instead of the plan's literal "see the research-gap note above" (which pointed to a note that doesn't exist in this file)
- `src/server/db/curated-scenarios.test.ts` - `it("Test 1: length is between 5 and 8 inclusive (SCEN-03's range)")` renamed to `it("length is between 5 and 8 inclusive")`
- `src/server/api/trpc.ts` - bare `RESEARCH.md` Security Domain reference (found via broader re-grep) rewritten to state the production-stack-trace-stripping reasoning directly
- `src/lib/trpc/banner.ts` - "(05-03's `banner` prop)" rewritten to "(the `banner` prop)"

## Decisions Made
`curated-scenarios.ts`'s `ruleLabel` comment (originally "see Task 2's research-gap note in 09-01-PLAN.md") deviated from the plan's exact suggested replacement text ("see the research-gap note above") after grepping the file and confirming no such note exists anywhere else in it -- following the plan's literal text would have replaced one dangling reference with another. Inlined a self-contained reason instead (`ruleLabel` is a static, hand-verified display string, not derived from `classifyEncounter()`'s reasoning trail at seed time, since these curated entries' expected rule is already fixed via the imported fixture).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Fixed dangling comment reference in curated-scenarios.ts**
- **Found during:** Task 2 (curated-scenarios.ts rewrite)
- **Issue:** The plan's literal suggested text for the `ruleLabel` comment ("see the research-gap note above for why `ruleLabel` is a static field, not derived") assumed a "research-gap note" exists earlier in the file. It does not -- confirmed via grep for "research-gap"/"static"/"derived" across the whole file.
- **Fix:** Rewrote the comment to state the actual reason inline: `ruleLabel` is a static, hand-verified display string rather than derived from `classifyEncounter()`'s reasoning trail at seed time, since these curated entries' expected rule is already fixed via the imported fixture.
- **Files modified:** src/server/db/curated-scenarios.ts
- **Verification:** Re-grepped the full file for "research-gap" after the fix -- zero matches, no new dangling reference introduced.
- **Committed in:** 8b33b8a (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing-critical content fix)
**Impact on plan:** Necessary to avoid leaving a comment convention violation (a reference to a nonexistent "note above") in place of the original violation (a reference to an archived plan file). No scope creep -- same line, same file, same task.

## Issues Encountered
The original background executor for this plan was killed mid-Task-2 by an unrelated session restart (`/login` re-auth), after completing and committing Task 1 in full (commit `c99bc28`, already verified against 11/11 passing integration tests). Task 2 was picked up and completed by the orchestrator directly against the same worktree. Docker Postgres was not running when work resumed; started via `docker compose ps`/Docker Desktop before re-running the integration test suite. `npm run typecheck` initially failed with a missing generated Prisma client module (`generated/prisma/client.js` not present in this worktree checkout) -- resolved by running `npx prisma generate`, a pre-existing environment-setup gap unrelated to this plan's comment edits.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
All 9 files in the server/tRPC layer are clean of Phase/Plan/Open-Question/RESEARCH.md/doc-filename/bare-Task-N references. `npx vitest run` on all 3 affected test files passes 16/16 (including live Docker Postgres integration tests), matching pre-change behavior. `npm run typecheck` passes clean. Ready for the orchestrator to merge alongside sibling plans 13-01, 13-02, 13-04..13-06.

## Self-Check: PASSED

- FOUND: src/server/application/scenario-service.ts
- FOUND: src/server/application/scenario-service.test.ts
- FOUND: src/server/api/routers/scenario.test.ts
- FOUND: src/server/db/scenario-repository.ts
- FOUND: src/server/db/scenario-repository.test.ts
- FOUND: src/server/db/curated-scenarios.ts
- FOUND: src/server/db/curated-scenarios.test.ts
- FOUND: src/server/api/trpc.ts
- FOUND: src/lib/trpc/banner.ts
- FOUND: c99bc28
- FOUND: 8b33b8a

---
*Phase: 13-comment-cleanup*
*Completed: 2026-07-20*
