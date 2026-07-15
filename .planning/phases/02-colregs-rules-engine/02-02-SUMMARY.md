---
phase: 02-colregs-rules-engine
plan: 02
subsystem: domain
tags: [colregs, rules-engine, typescript, vitest, domain-modeling]

requires:
  - phase: 02-colregs-rules-engine (Plan 01)
    provides: "types.ts (EncounterType/ClassificationResult/ReasoningTrailEntry/DoubtBoundary/VesselLabel), risk-of-collision.ts (riskOfCollision()), vessel-priority.ts (vesselPriority()/rule18Overrides())"
  - phase: 01-domain-foundations
    provides: "relativeBearing()/cpa() geometry primitives, Vessel/VesselType/Position Zod schemas, Result<T> degenerate-case signaling"
provides:
  - "classifyEncounter(vesselA, vesselB, previous?) -- the full Rule 7 -> 13 -> 14 -> 15 -> 18 sequential dispatch function"
  - "16-fixture auditable proof-of-correctness suite (classify-encounter.fixtures.ts) covering both-direction overtaking, hysteresis hold/release, head-on pitfalls, doubt-band boundaries, Rule 18 override matrix, and Stage 0 geometry propagation"
affects: [03-persistence-api, 04-interactive-chart]

tech-stack:
  added: []
  patterns:
    - "Sequential rule dispatch with inline trail accumulation (RSON-02): each stage pushes a ReasoningTrailEntry as it executes, matched or ruled-out, never re-derived after the verdict"
    - "Both-direction relative-bearing checks for symmetric two-vessel rules (Rule 13 overtaking, Rule 14 head-on) -- never a single-direction shortcut"
    - "Sticky-state hysteresis via an explicit optional parameter (previous), released outright (not softened) when its governing gate (Rule 7) fails"

key-files:
  created:
    - src/domain/colregs/classify-encounter.ts
    - src/domain/colregs/classify-encounter.fixtures.ts
    - src/domain/colregs/classify-encounter.test.ts
  modified: []

key-decisions:
  - "Head-on sector modeled as exactly the +/-5deg doubt band itself (Assumption A1) -- no separate wider 'confident head-on' core; every head-on classification always carries doubt:true"
  - "Rule 7 gate failure sets effectivePrevious to undefined outright, never a softened/demoted hint -- proven via a deep-equal regression test against the same vessels classified with no previous argument at all"
  - "Rule 18 override for head-on encounters only assigns give-way/stand-on when the two vessels' priority tiers differ; same-tier (including the NUC/RIATM co-equal tie) keeps giveWay/standOn both null"

patterns-established:
  - "Fixture-file worked-math convention extended to composed multi-stage functions: each classify-encounter fixture documents the relativeBearing()/cpa() derivation behind its expected verdict inline"

requirements-completed: [CLAS-01, CLAS-02, CLAS-03, CLAS-04, DETM-01, DETM-02, RSON-02]

duration: 45min
completed: 2026-07-15
---

# Phase 2 Plan 2: COLREGS Encounter Classification Dispatch Summary

**`classifyEncounter()` -- the Rule 7->13->14->15->18 sequential dispatch with inline reasoning-trail accumulation, sticky-overtaking hysteresis, and inclusive +/-5deg doubt bands, verified against a 16-fixture hand-derived suite.**

## Performance

- **Duration:** 45 min
- **Started:** 2026-07-15T10:31:00Z
- **Completed:** 2026-07-15T11:16:27Z
- **Tasks:** 2 completed
- **Files modified:** 3 (all new)

## Accomplishments

- Implemented the full 6-stage COLREGS dispatch (`classify-encounter.ts`): geometry inputs -> Rule 7 gate -> sticky-overtaking check -> Rule 13 (both directions) -> Rule 14 (both directions) -> Rule 15 residual -> Rule 18 override, with an ordered reasoning trail built inline at every stage that actually executes.
- Correctly handles both directional-convention pitfalls research flagged as easy to invert: Rule 13's overtaking-direction check and Rule 14's head-on check are each evaluated in both directions independently, never assuming reciprocity or reusing a single bearing for both vessels.
- Sticky-overtaking hysteresis (D-01/D-02) holds a prior 'overtaking' classification while Rule 7's risk gate still passes (bearing may drift into the geometric crossing sector without flip-flopping the verdict), and fully releases -- not softens -- to fresh geometric evaluation the instant the gate fails, verified by a deep-equal assertion against the same vessels classified with no `previous` argument at all.
- Rule 18's vessel-type hierarchy correctly overrides the geometric baseline for crossing/overtaking encounters and additionally assigns give-way/stand-on for head-on encounters only when the two vessels' priority tiers differ, leaving the NUC/RIATM co-equal tie and same-type cases as a genuine mutual `null`/`null`.
- 16-fixture suite (`classify-encounter.fixtures.ts`) covering both-direction overtaking with swapped-argument symmetry, hysteresis hold/release, genuine and one-sided-only head-on (Pitfall 2 regression), basic crossing residual, doubt-band boundaries at both the 112.5deg and 0deg edges, the full Rule 18 override matrix (crossing override/non-override, head-on override/tie), and both Stage-0 geometry-propagation paths (genuine `coincident-position` failure vs. `cpa()`'s parallel/matching-course result not propagating as an error).

## Task Commits

Each task was committed atomically:

1. **Task 1: classifyEncounter() dispatch (Stages 0-6) + core fixture set** - `9411715` (feat)
2. **Task 2: Rule 18 interaction matrix + Stage 0 propagation fixtures** - `5fc10da` (test)

_Task 2 required no changes to `classify-encounter.ts` -- all 6 new fixtures passed against Task 1's implementation unmodified, confirming the Stage 6 head-on-null-override branch and Stage 0 propagation logic were correct on first implementation._

## Files Created/Modified

- `src/domain/colregs/classify-encounter.ts` - the pure `classifyEncounter(vesselA, vesselB, previous?)` dispatch function (Stages 0-6)
- `src/domain/colregs/classify-encounter.fixtures.ts` - 16 hand-derived fixtures with worked-math comments
- `src/domain/colregs/classify-encounter.test.ts` - full dispatch test suite, 17 test cases across 7 `describe` blocks grouped by concern

## Decisions Made

- Followed 02-CONTEXT.md's D-01 through D-16 exactly as locked; no new implementation decisions were required beyond the plan's own `<behavior>` specification.
- Kept `classify-encounter.ts`'s Stage 6 Rule 18 logic as a single inline branch (head-on vs. crossing/overtaking) rather than splitting into separate helper functions, since the plan's behavior description was already fully specified stage-by-stage and an additional abstraction layer would not have added clarity for a reader tracing the dispatch.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed insufficient floating-point precision in two boundary fixtures**
- **Found during:** Task 1 (`classify-encounter.test.ts` initial run)
- **Issue:** The plan's `headOnBoundaryInclusiveCase` and `justOutsideHeadOnSectorCase` fixtures specified vessel positions rounded to 4 decimal places (e.g. `{x: 0.8716, y: 9.9619}`), intended to produce an exact 5deg relative bearing. Computing `atan2` on those rounded coordinates actually yields `5.000266...` degrees -- just over the inclusive `<= 5` boundary the fixture exists to verify -- causing the "exactly 5 degrees" test to fail with `encounterType: 'crossing'` instead of the expected `'head-on'`.
- **Fix:** Recomputed both vessels' positions at full `Math.sin`/`Math.cos` double precision (`x: 0.8715574274765816, y: 9.961946980917455` and the 5.5deg equivalent), which land the computed bearing at `4.999999999999999` -- correctly on the inclusive side of the boundary. Documented the precision requirement inline in the fixture comments.
- **Files modified:** `src/domain/colregs/classify-encounter.fixtures.ts`
- **Verification:** `npx vitest run src/domain/colregs/classify-encounter.test.ts` -- all 17 tests pass, including the exact-5deg and 5.5deg boundary cases.
- **Committed in:** `9411715` (Task 1 commit)

**2. [Rule 1 - Bug] Rephrased two doc comments to avoid an unintended grep match**
- **Found during:** Task 1 acceptance-criteria verification
- **Issue:** Task 1's acceptance criteria requires `grep -c "riskOfCollision(" src/domain/colregs/classify-encounter.ts` to equal exactly 1 (single Stage-1 call site). Two doc/inline comments referencing `riskOfCollision()` with trailing parentheses (a file-header doc comment and an inline Stage-0 comment) pushed the literal count to 3.
- **Fix:** Reworded both comments to reference the function without a trailing paren-call form (`` `riskOfCollision` `` / "the Stage 1 risk gate") while preserving their explanatory content.
- **Files modified:** `src/domain/colregs/classify-encounter.ts`
- **Verification:** `grep -c "riskOfCollision(" src/domain/colregs/classify-encounter.ts` now returns `1`.
- **Committed in:** `9411715` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 - bug fixes discovered during acceptance-criteria verification, no scope creep).
**Impact on plan:** Both fixes were necessary to make the plan's own stated acceptance criteria pass exactly as written; no behavior or fixture intent changed, only precision/wording.

## Issues Encountered

- `node_modules` was not present in this worktree (gitignored, not checked out); ran `npm install` from the existing `package-lock.json` before any test/typecheck command could execute. No lockfile changes resulted (`npm install` reported "added 48 packages... 0 vulnerabilities" against the existing lock).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `classifyEncounter()` is the complete, fixture-verified COLREGS domain engine for Phase 2's scope (Rules 7, 13-15, 18) and is ready to be consumed by Phase 3's tRPC API layer as a pure function call with no adaptation needed.
- `npx vitest run` (full project suite): 96/96 tests pass across 10 files. `npx tsc --noEmit`: zero type errors in `src/domain/`.
- No blockers for Phase 3.

---
*Phase: 02-colregs-rules-engine*
*Completed: 2026-07-15*

## Self-Check: PASSED

- FOUND: src/domain/colregs/classify-encounter.ts
- FOUND: src/domain/colregs/classify-encounter.fixtures.ts
- FOUND: src/domain/colregs/classify-encounter.test.ts
- FOUND commit: 9411715
- FOUND commit: 5fc10da
