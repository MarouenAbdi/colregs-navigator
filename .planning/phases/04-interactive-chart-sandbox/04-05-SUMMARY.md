---
phase: 04-interactive-chart-sandbox
plan: 05
subsystem: ui
tags: [react, tsx, tailwind, colregs, reasoning-trail, vitest, testing-library]

# Dependency graph
requires:
  - phase: 04-01
    provides: "ReasoningPanelProps contract (types.ts), getVesselRole (vessel-role.ts), RTL/jsdom test harness"
provides:
  - "ReasoningPanel presentational component: verdict banner, vessel role badges, full ordered reasoning trail with per-entry font-mono geometric fact readouts, doubt caveat, and degenerate 'Unable to classify' note"
affects: [04-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Presentational component consumes ReasoningPanelProps verbatim, zero new copy beyond banner template/fact labels/doubt caveats"
    - "Explicit afterEach(cleanup) in .test.tsx files (vitest.config globals:false means RTL's auto-cleanup never registers)"

key-files:
  created:
    - src/components/sandbox/ReasoningPanel.tsx
    - src/components/sandbox/ReasoningPanel.test.tsx
  modified: []

key-decisions:
  - "Vessel role badges render bare 'GW'/'SO'/'MUTUAL' text (not 'A: GW') with aria-label='Vessel A/B role' for disambiguation -- keeps text nodes exact-matchable and avoids inventing new copy"
  - "Generated the Prisma client locally (npx prisma generate with .env.example's DATABASE_URL) purely to unblock `tsc --noEmit` verification -- this is a pre-existing repo setup gap unrelated to this plan's files, not committed (generated/ and node_modules/ are gitignored)"

patterns-established:
  - "Any new *.test.tsx file must import cleanup from @testing-library/react and register `afterEach(cleanup)` itself, since vitest.config.ts's globals:false prevents RTL's automatic cleanup registration"

requirements-completed: [RSON-01]

# Metrics
duration: 7min
completed: 2026-07-17
---

# Phase 04 Plan 05: Reasoning Panel Summary

**ReasoningPanel renders the full Rule 7→13→14→15→18 trail with per-entry font-mono geometric fact readouts (TCPA/DCPA/relative bearings/vessel types), a verdict banner, doubt caveat, and a degenerate note that never discards the last-good trail**

## Performance

- **Duration:** 7 min
- **Started:** 2026-07-17T21:03:29+01:00
- **Completed:** 2026-07-17T21:10:05+01:00
- **Tasks:** 2 completed
- **Files modified:** 2 (both created)

## Accomplishments
- `ReasoningPanel` renders `classification.trail` unconditionally and in full, in array order, with zero transformation of `ruleId`/`text`
- Every non-empty `facts` object gets a `font-mono` key/value readout line beneath its entry (all seven possible fact keys mapped: risk of collision, TCPA, DCPA, both relative bearings, both vessel types) -- this is what makes RSON-01's "geometric logic" requirement visible, not just asserted via rule citation
- Verdict banner and doubt caveat composed/selected from structured fields only, verbatim against 04-UI-SPEC.md's Copywriting Contract -- no new rule-explanation prose invented
- Degenerate "Unable to classify" state renders the exact Error-state copy while the last-good trail stays visible underneath (D-03)
- 8 behavior-driven tests cover banner text (give-way and mutual-obligation cases), full trail order, fact-readout formatting including the empty-facts skip case, both doubt-caveat strings, and the degenerate note

## Task Commits

Each task was committed atomically:

1. **Task 1: ReasoningPanel -- verdict banner, full trail list with geometric fact readouts, doubt caveat, degenerate note** - `2eccf3d` (feat)
2. **Task 2: ReasoningPanel tests** - `f6a6dc2` (test)

**Plan metadata:** commit pending (this SUMMARY.md, committed by the worktree-mode metadata step)

## Files Created/Modified
- `src/components/sandbox/ReasoningPanel.tsx` - Presentational component: verdict banner (Display 28px), vessel role badges (reuses `getVesselRole`), ordered trail list with per-entry font-mono fact readouts, doubt caveat, degenerate note
- `src/components/sandbox/ReasoningPanel.test.tsx` - 8 RTL/jsdom tests covering all six behavior cases from the plan's `<behavior>` block

## Decisions Made
- Vessel role badges render as bare `GW`/`SO`/`MUTUAL` text nodes (with `aria-label="Vessel A role"`/`"Vessel B role"` for a11y/disambiguation) rather than prefixed strings like `"A: GW"` -- keeps the rendered text exact-matchable against the plan's literal badge-text spec (`"GW"` not `"A: GW"`) and avoids inventing new copy
- Generated the Prisma client locally (`DATABASE_URL` from `.env.example` + `npx prisma generate`) solely to unblock `npx tsc --noEmit` -- `src/server/db/client.ts` was failing to resolve `../../../generated/prisma/client.js` in this fresh worktree checkout (node_modules/generated output are gitignored, not present until installed/generated). This is a pre-existing repo environment-setup gap, not caused by this plan's files, and nothing from `generated/` was committed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Registered explicit `afterEach(cleanup)` in the new test file**
- **Found during:** Task 2 (ReasoningPanel tests)
- **Issue:** `vitest.config.ts` sets `globals: false`, so `@testing-library/react`'s automatic cleanup registration (which relies on a global `afterEach`) never fires. Running the test suite without explicit cleanup left prior tests' rendered DOM in place, causing `getByText` to throw "multiple elements found" across tests in the same file.
- **Fix:** Imported `cleanup` from `@testing-library/react` and `afterEach` from `vitest`, called `afterEach(cleanup)` at the top of the test file.
- **Files modified:** `src/components/sandbox/ReasoningPanel.test.tsx`
- **Verification:** `npx vitest run src/components/sandbox/ReasoningPanel.test.tsx` -- 8/8 pass
- **Committed in:** `f6a6dc2` (Task 2 commit)

**2. [Rule 3 - Blocking] Installed dependencies and generated the Prisma client to unblock verification**
- **Found during:** Task 1 verification (`npx tsc --noEmit`)
- **Issue:** This worktree checkout had no `node_modules/` (fresh worktree, dependencies never installed) and no `generated/prisma/` client output, causing `tsc --noEmit` to fail on a pre-existing, unrelated file (`src/server/db/client.ts`) before it could even reach `ReasoningPanel.tsx`.
- **Fix:** Ran `npm ci` (installs exactly what `package-lock.json` already declares, no new packages) and `npx prisma generate` (local codegen from the existing `prisma/schema.prisma`, no network package install). Neither `node_modules/` nor `generated/` are tracked by git (both gitignored) -- no source files were added or committed as part of this fix.
- **Files modified:** none tracked (both directories gitignored)
- **Verification:** `npm run typecheck` exits 0 with only the two plan files present
- **Committed in:** not applicable -- no trackable file changes

---

**Total deviations:** 2 auto-fixed (both Rule 3 - blocking, both required only to run the plan's own verification commands)
**Impact on plan:** No scope creep -- both fixes were prerequisites for running `tsc --noEmit`/`vitest run` as the plan itself specifies, not changes to plan behavior.

## Issues Encountered
- Full-suite `npx vitest run` shows 13 pre-existing failures, all in `src/server/db/scenario-repository.test.ts`, `src/server/api/routers/scenario.test.ts`, and `src/server/application/scenario-service.test.ts` (Phase 3 persistence-layer integration tests) -- all fail with `SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string`, i.e. no live Postgres instance reachable from this worktree's sandbox. This is a pre-existing environment/infrastructure gap (no DB server running here), unrelated to this plan's `src/components/sandbox/` files, and out of this plan's scope per the SCOPE BOUNDARY rule (only auto-fix issues directly caused by the current task's changes). `npx vitest run src/components/sandbox/ReasoningPanel.test.tsx` (this plan's own scope) passes 8/8 clean.

## User Setup Required

None - no external service configuration required. (The pre-existing DB-integration test failures noted above require a running Postgres instance per `.env.example`/`docker-compose.yml`, already documented by Phase 3 -- not new to this plan.)

## Next Phase Readiness
- `ReasoningPanel` is ready to be mounted by `SandboxContainer` in 04-06, consuming exactly the `ReasoningPanelProps` contract from 04-01 with no prop changes needed
- No blockers introduced by this plan for 04-06

---
*Phase: 04-interactive-chart-sandbox*
*Completed: 2026-07-17*

## Self-Check: PASSED

- FOUND: src/components/sandbox/ReasoningPanel.tsx
- FOUND: src/components/sandbox/ReasoningPanel.test.tsx
- FOUND: .planning/phases/04-interactive-chart-sandbox/04-05-SUMMARY.md
- FOUND commit: 2eccf3d (Task 1)
- FOUND commit: f6a6dc2 (Task 2)
- FOUND commit: d6754ed (docs: complete plan)
