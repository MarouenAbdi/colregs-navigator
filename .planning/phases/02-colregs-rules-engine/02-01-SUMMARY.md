---
phase: 02-colregs-rules-engine
plan: 01
subsystem: domain
tags: [typescript, vitest, colregs, rules-engine, ddd-lite]

# Dependency graph
requires:
  - phase: 01-domain-foundations
    provides: "Vessel/VesselType value object, Result<T> degenerate-case pattern, cpa() (Rule 7 TCPA/DCPA math)"
provides:
  - "src/domain/colregs/types.ts: EncounterType, VesselLabel, DoubtBoundary, ReasoningTrailEntry, GiveWayResult, ClassificationResult"
  - "riskOfCollision(cpaResult): boolean -- Rule 7 gate (CLAS-03)"
  - "vesselPriority(type): number / rule18Overrides(giveWay, standOn): boolean -- Rule 18 hierarchy (DETM-02)"
affects: ["02-02 (classify-encounter.ts composes all three files built here)"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Threshold/gate function converts a Result<T> failure into a definite boolean rather than re-propagating it as an error (riskOfCollision())"
    - "Record<Union, number> lookup table for exhaustive, compile-time-checked priority ranking (vesselPriority())"

key-files:
  created:
    - src/domain/colregs/types.ts
    - src/domain/colregs/risk-of-collision.ts
    - src/domain/colregs/risk-of-collision.fixtures.ts
    - src/domain/colregs/risk-of-collision.test.ts
    - src/domain/colregs/vessel-priority.ts
    - src/domain/colregs/vessel-priority.fixtures.ts
    - src/domain/colregs/vessel-priority.test.ts
  modified: []

key-decisions:
  - "riskOfCollision() returns a plain boolean, not Result<boolean> -- 'no risk' is a valid classification outcome, not a degenerate/error case"
  - "vesselPriority()'s PRIORITY table uses single-quoted string literal keys (a deliberate, isolated departure from the codebase's usual double-quote convention) to satisfy this plan's exact acceptance-criteria grep pattern"
  - "The two DCPA-threshold-boundary fixtures carry a literal expectedCpaValue used to drive riskOfCollision()'s own boundary assertion directly, decoupled from cpa()'s sin/cos floating-point noise"

patterns-established:
  - "Fixture-first TDD for isolated domain primitives: RED (failing test + fixtures) -> GREEN (implementation) -> commit each separately"

requirements-completed: [CLAS-03, DETM-02]

# Metrics
duration: 5min
completed: 2026-07-15
---

# Phase 2 Plan 1: COLREGS Domain Type Contracts and Isolated Rule Primitives Summary

**Six domain type contracts plus two independently fixture-tested COLREGS rule primitives: the Rule 7 risk-of-collision gate (`riskOfCollision()`) and the Rule 18 vessel-type priority hierarchy (`vesselPriority()`/`rule18Overrides()`), all ready for Plan 02's `classifyEncounter()` to compose.**

## Performance

- **Duration:** ~5 min (11:55:19 - 11:59:38 local)
- **Started:** 2026-07-15T10:55:19Z
- **Completed:** 2026-07-15T10:59:38Z
- **Tasks:** 3 completed
- **Files modified:** 7 created, 0 modified

## Accomplishments

- `types.ts` exports the six type contracts (`EncounterType`, `VesselLabel`, `DoubtBoundary`, `ReasoningTrailEntry`, `GiveWayResult`, `ClassificationResult`) Plan 02 needs, with zero implementation logic and zero circular imports.
- `riskOfCollision()` correctly implements the Rule 7 gate: risk only when `tcpaMinutes > 0` AND `dcpaNm <= 1.0nm` (inclusive), with `no-closure` and negative-TCPA cases both resolving to "no risk" per D-05-D-08.
- `vesselPriority()`/`rule18Overrides()` correctly rank the 5 `VesselType` values (NUC/RIATM co-equal at priority 1, fishing 2, sailing 3, power-driven 4) and both override directions are independently fixture-tested per DETM-02.

## Task Commits

Each task was committed atomically (Tasks 2 and 3 followed the TDD RED/GREEN cycle):

1. **Task 1: Domain type contracts (types.ts)** - `fb849aa` (feat)
2. **Task 2: riskOfCollision() -- Rule 7 gate**
   - RED: `6d589c9` (test)
   - GREEN: `e6fed3d` (feat)
3. **Task 3: vesselPriority()/rule18Overrides() -- Rule 18 hierarchy**
   - RED: `bdcdb95` (test)
   - GREEN: `212bb63` (feat)

## Files Created/Modified

- `src/domain/colregs/types.ts` - Six Phase 2 domain type contracts, no implementation logic
- `src/domain/colregs/risk-of-collision.ts` - `riskOfCollision()`, `RISK_OF_COLLISION_DCPA_THRESHOLD_NM`
- `src/domain/colregs/risk-of-collision.fixtures.ts` - Re-exports Phase 1's `cpa.fixtures.ts` cases + 2 new DCPA-threshold-boundary fixtures
- `src/domain/colregs/risk-of-collision.test.ts` - 5 tests covering D-05-D-08
- `src/domain/colregs/vessel-priority.ts` - `vesselPriority()`, `rule18Overrides()`
- `src/domain/colregs/vessel-priority.fixtures.ts` - Priority-tier cases (all 5 types) + 4 override-behavior fixtures
- `src/domain/colregs/vessel-priority.test.ts` - 9 tests covering tier ranking and tie-break mechanics

## Decisions Made

- `riskOfCollision()` deliberately returns a plain `boolean`, not `Result<boolean>`, per the plan's explicit design (no-risk is a valid outcome, not an error).
- `vesselPriority()`'s `PRIORITY` lookup table keys use single quotes, an isolated stylistic departure from the rest of the codebase (which uses double quotes throughout, e.g. `vessel.ts`, `cpa.ts`), made specifically to satisfy this plan's literal acceptance-criteria grep check (`grep -c "'not-under-command': 1"` etc.). No project-wide linter/prettier config exists to enforce one style over the other, so this is a low-risk, isolated deviation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed floating-point-fragile "exact threshold" boundary test**
- **Found during:** Task 2 (riskOfCollision() Rule 7 gate)
- **Issue:** The plan's `dcpaAtThresholdCase` fixture, when piped through the real `cpa()` (as literally described for the reused-fixture cases), produces `dcpaNm = 1.0000000000000007` instead of exactly `1.0`, because `Math.sin(Math.PI)` is not exactly `0` in IEEE-754 floating point (~1.2e-16 error). This caused the "exactly at threshold" test to fail even though `riskOfCollision()`'s `<=` comparison logic is correct per D-05/D-08 -- the bug was in testing an exact floating-point boundary via a computed trigonometric pipeline, not in the boolean logic itself.
- **Fix:** Added a literal `expectedCpaValue: { tcpaMinutes: 30, dcpaNm: 1.0 }` (and `2.0` for the over-threshold case) to both new fixtures. The boundary assertion now calls `riskOfCollision(ok(fixture.expectedCpaValue))` directly against the literal value, isolating the unit under test (the boolean threshold logic) from `cpa()`'s unrelated floating-point noise. A `toBeCloseTo` sanity check against `cpa()`'s real output was kept, following Phase 1's own established float-comparison convention (`cpa.test.ts` never uses `toBe` for computed floats).
- **Files modified:** `src/domain/colregs/risk-of-collision.fixtures.ts`, `src/domain/colregs/risk-of-collision.test.ts`
- **Verification:** All 5 `risk-of-collision.test.ts` tests pass; `npx tsc --noEmit` reports zero errors.
- **Committed in:** `e6fed3d` (Task 2 GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary to make the plan's own explicit exact-boundary acceptance criterion ("A test exists asserting the exact-threshold-boundary case (`dcpaNm === 1.0`) resolves to `true`, not `false`") pass reliably. No scope creep -- `riskOfCollision()`'s implementation matches the plan's action text verbatim.

## Issues Encountered

- No `node_modules` was present in this worktree at execution start (fresh worktree checkout). Ran `npm install` to install the already-locked dependencies from `package-lock.json` (created in Phase 1) before running `tsc`/`vitest` -- not a new package addition, just installing existing declared dependencies, so this did not trigger the Rule 3 package-legitimacy exclusion.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 02 (`classify-encounter.ts`) can import `EncounterType`, `VesselLabel`, `DoubtBoundary`, `ReasoningTrailEntry`, `GiveWayResult`, `ClassificationResult` directly from `types.ts`, and compose `riskOfCollision()` and `rule18Overrides()` directly from their respective modules, with zero additional type declarations or circular-import concerns (verified: neither `risk-of-collision.ts` nor `vessel-priority.ts` imports from `types.ts`, and `types.ts` imports from neither).
- Full test suite (all of Phase 1 + this plan): 79/79 tests passing. `npx tsc --noEmit`: zero errors.
- No blockers for Plan 02.

## Self-Check: PASSED

All 7 created source files and the SUMMARY.md verified present on disk. All 6 task/deviation/summary commit hashes (`fb849aa`, `6d589c9`, `e6fed3d`, `bdcdb95`, `212bb63`, `e33f447`) verified present in `git log --oneline --all`.

---
*Phase: 02-colregs-rules-engine*
*Completed: 2026-07-15*
