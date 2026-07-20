---
phase: 13-comment-cleanup
plan: 04
subsystem: ui
tags: [comments, documentation, sandbox, react, eslint, code-hygiene]

# Dependency graph
requires: []
provides:
  - Stale Phase/Task-N/UI-SPEC.md/RESEARCH.md/HUMAN-UAT.md comment references removed from all 12 files in the ChartPanel/ControlPanel/InstrumentReadouts/ReasoningTrail/VerdictBanner cluster
affects: [13-08 final verification sweep]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Rotting-pointer comments (Phase N / Task N / UI-SPEC.md / RESEARCH.md / HUMAN-UAT.md / code review CR-NN) rewritten to state the underlying reason directly, per CLAUDE.md's comment convention"

key-files:
  created: []
  modified:
    - src/components/sandbox/ChartPanel.tsx
    - src/components/sandbox/ChartPanel.test.tsx
    - src/components/sandbox/chart-panel-geometry.ts
    - src/components/sandbox/ControlPanel.tsx
    - src/components/sandbox/ControlPanel.test.tsx
    - src/components/sandbox/CopyLinkButton.tsx
    - src/components/sandbox/InstrumentReadouts.tsx
    - src/components/sandbox/InstrumentReadouts.test.tsx
    - src/components/sandbox/ReasoningTrail.tsx
    - src/components/sandbox/ReasoningTrail.test.tsx
    - src/components/sandbox/VerdictBanner.tsx
    - src/components/sandbox/VerdictBanner.test.tsx

key-decisions:
  - "ChartPanel.tsx and ReasoningTrail.tsx needed zero edits -- their only comment-block citations are live REQ-IDs/decision-IDs (CHRT-01/CHRT-02/RSON-03/VESL-02/D-01/D-02, SBOX-03), which the plan explicitly instructed to leave untouched"
  - "chart-panel-geometry.ts's 5 Tailwind color-shade names (slate-200, zinc-700, slate-600, amber-500, slate-300) confirmed as false positives against the stale-ID regex and left untouched, per plan"

patterns-established: []

requirements-completed: [CMNT-01]

# Metrics
duration: 10min
completed: 2026-07-20
---

# Phase 13 Plan 04: Comment Cleanup (Sandbox cluster A) Summary

**Rewrote every stale Phase/Task-N/UI-SPEC.md/RESEARCH.md/HUMAN-UAT.md comment reference across all 12 files in the ChartPanel/ControlPanel/InstrumentReadouts/ReasoningTrail/VerdictBanner cluster into durable, reason-based comments with zero rendering or drag-gesture behavior change.**

## Performance

- **Duration:** ~10 min (resumed after a session interruption killed the original background executor mid-Task-2)
- **Started:** 2026-07-20T11:19:00+01:00
- **Completed:** 2026-07-20T13:39:54+01:00
- **Tasks:** 2
- **Files modified:** 10 (of 12 -- ChartPanel.tsx and ReasoningTrail.tsx needed no edits per the plan's own instruction)

## Accomplishments
- Removed every "Phase N", bare "Task N", "UI-SPEC.md", "RESEARCH.md", "HUMAN-UAT.md", and "code review CR-01" reference from the cluster while preserving substantive WHY content
- 3 test files (`InstrumentReadouts.test.tsx`, `ReasoningTrail.test.tsx`, `VerdictBanner.test.tsx`) that were outside the original 54-file ESLint-flagged scoping sweep had their own `(08-04 Task N)` stale headers found and rewritten, per CMNT-02's broader re-grep intent
- Left the 5 Tailwind color-shade name false positives (`slate-200`, `zinc-700`, `slate-600`, `amber-500`, `slate-300`) untouched, confirmed via grep
- Verified zero behavior change: `ChartPanel.test.tsx`, `ControlPanel.test.tsx`, `InstrumentReadouts.test.tsx`, `ReasoningTrail.test.tsx`, `VerdictBanner.test.tsx` all pass — 22/22, matching pre-change behavior

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite stale comments in ChartPanel.test.tsx, chart-panel-geometry.ts, ControlPanel.tsx, ControlPanel.test.tsx, CopyLinkButton.tsx** - `549c060` (docs)
2. **Task 2: Rewrite stale comments in InstrumentReadouts.tsx/.test.tsx, ReasoningTrail.test.tsx, VerdictBanner.tsx/.test.tsx** - `dda945e` (docs)

_Note: no TDD tasks in this plan; both commits are documentation-only (comment text) with no code/logic change._

## Files Created/Modified
- `src/components/sandbox/ChartPanel.tsx` - No edit needed; its only citations (CHRT-01/CHRT-02/RSON-03/VESL-02, D-01/D-02) are live REQ-IDs/decision-IDs, left untouched per plan
- `src/components/sandbox/ChartPanel.test.tsx` - "(04-03 Task 3)"/"04-RESEARCH.md" rewritten; "code review CR-01" rewritten to "found via manual code review"
- `src/components/sandbox/chart-panel-geometry.ts` - "for this phase" rewritten; two "04-HUMAN-UAT.md Gap 1" references rewritten to describe the usability finding directly; "(04-RESEARCH.md Pattern 3)" rewritten; 5 color-shade names left untouched
- `src/components/sandbox/ControlPanel.tsx` - "per 08-UI-SPEC.md's Color section" rewritten
- `src/components/sandbox/ControlPanel.test.tsx` - "per 08-RESEARCH.md's..." rewritten; "(08-01 widened the prop contract)" rewritten
- `src/components/sandbox/CopyLinkButton.tsx` - "Phase 8's dark palette" rewritten
- `src/components/sandbox/InstrumentReadouts.tsx` - "(08-UI-SPEC.md: ...)" and "per 08-UI-SPEC.md's Status Pill color table" rewritten
- `src/components/sandbox/InstrumentReadouts.test.tsx` - "(08-04 Task 2)" dropped; "per 08-01's own..." rewritten
- `src/components/sandbox/ReasoningTrail.tsx` - No edit needed; its only citation (SBOX-03) is a live REQ-ID, left untouched per plan
- `src/components/sandbox/ReasoningTrail.test.tsx` - "(08-04 Task 3)" dropped
- `src/components/sandbox/VerdictBanner.tsx` - "(08-UI-SPEC.md Layout: ...)" rewritten to state the design placement directly
- `src/components/sandbox/VerdictBanner.test.tsx` - "(08-04 Task 1)" dropped

## Decisions Made
None beyond the plan's own explicit scoping (ChartPanel.tsx/ReasoningTrail.tsx left untouched per plan instruction; color-shade false positives confirmed and preserved).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
The original background executor for this plan was killed mid-Task-2 by an unrelated session restart (`/login` re-auth), after completing and committing Task 1 in full (commit `549c060`) and applying items 1-2 of Task 2 (InstrumentReadouts.tsx) but leaving them uncommitted. Items 3-8 of Task 2 (InstrumentReadouts.test.tsx, ReasoningTrail.test.tsx, VerdictBanner.tsx/.test.tsx) were not started. The orchestrator picked up from the uncommitted state, applied the plan's remaining Task 2 `<action>` steps verbatim, then ran the full acceptance-criteria grep and test suite to confirm no regression before committing.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
All 12 files in the ChartPanel/ControlPanel/InstrumentReadouts/ReasoningTrail/VerdictBanner cluster are clean of Phase/Task-N/UI-SPEC.md/RESEARCH.md/HUMAN-UAT.md references (except the 5 deliberately-preserved color-shade names and the live REQ-ID/decision-ID citations). `npx vitest run` on all 5 affected test files passes 22/22, matching pre-change behavior. Ready for the orchestrator to merge alongside sibling plans 13-01..13-03, 13-05, 13-06.

## Self-Check: PASSED

- FOUND: src/components/sandbox/ChartPanel.tsx
- FOUND: src/components/sandbox/ChartPanel.test.tsx
- FOUND: src/components/sandbox/chart-panel-geometry.ts
- FOUND: src/components/sandbox/ControlPanel.tsx
- FOUND: src/components/sandbox/ControlPanel.test.tsx
- FOUND: src/components/sandbox/CopyLinkButton.tsx
- FOUND: src/components/sandbox/InstrumentReadouts.tsx
- FOUND: src/components/sandbox/InstrumentReadouts.test.tsx
- FOUND: src/components/sandbox/ReasoningTrail.tsx
- FOUND: src/components/sandbox/ReasoningTrail.test.tsx
- FOUND: src/components/sandbox/VerdictBanner.tsx
- FOUND: src/components/sandbox/VerdictBanner.test.tsx
- FOUND: 549c060
- FOUND: dda945e

---
*Phase: 13-comment-cleanup*
*Completed: 2026-07-20*
