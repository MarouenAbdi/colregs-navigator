---
phase: 04-interactive-chart-sandbox
plan: 02
subsystem: domain
tags: [typescript, colregs, geometry, tdd, vitest]

# Dependency graph
requires:
  - phase: 04-interactive-chart-sandbox
    provides: "classifyEncounter() (04-01/Phase 2) OVERTAKING_BOUNDARY_DEGREES/DOUBT_BAND_DEGREES constants, relativeBearing() (Phase 1), DoubtBoundary/VesselLabel types"
provides:
  - "resolveDoubtGeometry(vesselA, vesselB, doubtBoundary) -> Result<{ vessel, relativeBearingDegrees }> in src/domain/colregs/resolve-doubt-geometry.ts"
affects: ["04-03 ChartPanel doubt overlay rendering (Wave 2)"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Doubt-geometry resolution recomputes relativeBearing() independently from vesselA/vesselB rather than reading the reasoning trail's per-stage facts, avoiding the sticky-hysteresis branch's empty facts:{} trap"

key-files:
  created:
    - src/domain/colregs/resolve-doubt-geometry.ts
    - src/domain/colregs/resolve-doubt-geometry.fixtures.ts
    - src/domain/colregs/resolve-doubt-geometry.test.ts
  modified: []

key-decisions:
  - "resolveDoubtGeometry() takes no `previous` argument and never reads classifyEncounter()'s reasoning trail -- it recomputes both relativeBearing() directions itself, which is what makes it correct for the sticky-hysteresis branch (whose Rule 13(d) trail entry has facts:{})"
  - "For near-overtaking-crossing-boundary doubt, the triggering vessel is whichever side's |relativeBearing| magnitude is closer to OVERTAKING_BOUNDARY_DEGREES (112.5), with a <= tie-break favoring vesselA, mirroring classify-encounter.ts's own WR-02 tie-break style"
  - "For near-head-on-boundary doubt, vesselA is a fixed, arbitrary-but-pinned convention since the head-on doubt band is symmetric and either vessel's bearing is geometrically equivalent for rendering"

patterns-established:
  - "Doubt-boundary geometry resolution is a pure function independent of the reasoning trail -- future UI-facing derived facts should also recompute from vesselA/vesselB rather than trust trail.facts, since trail shape is not guaranteed consistent across all classification branches"

requirements-completed: [RSON-03]

duration: 9min
completed: 2026-07-17
---

# Phase 04 Plan 02: Doubt-Geometry Resolution Summary

**`resolveDoubtGeometry()` pure function that deterministically identifies which vessel and relative-bearing value triggered a doubt-flagged classification, by recomputing geometry directly rather than trusting the reasoning trail's inconsistent per-stage facts**

## Performance

- **Duration:** 9 min
- **Started:** 2026-07-17T18:03:08+01:00
- **Completed:** 2026-07-17T18:11:47+01:00
- **Tasks:** 1 (TDD: RED + GREEN)
- **Files modified:** 3 created

## Accomplishments
- Implemented `resolveDoubtGeometry(vesselA, vesselB, doubtBoundary)` in `src/domain/colregs/resolve-doubt-geometry.ts`, composing `relativeBearing()` and `OVERTAKING_BOUNDARY_DEGREES`/`DOUBT_BAND_DEGREES` exclusively -- no re-derived `atan2` call or re-declared threshold constant
- Proved via a dedicated fixture (`overtakingBoundaryTriggeredByBCase`) that the function correctly identifies vesselB as the doubt trigger in the exact geometry a naive `facts.relativeBearingAtoB`-only reader would get wrong (04-RESEARCH.md Pitfall 3)
- Proved via `stickyHysteresisNearBoundaryCase` (reusing `overtakingHysteresisNearBoundaryCase`'s vessel shapes) that the function derives the correct answer purely from vessel geometry even though the sticky-hysteresis trail branch's `facts: {}` carries no usable data
- Full TDD gate sequence followed: failing test commit before implementation commit

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): add failing tests for resolveDoubtGeometry** - `44f959f` (test)
2. **Task 1 (GREEN): implement resolveDoubtGeometry** - `5ec92ac` (feat)

_TDD task: test -> feat cycle, no refactor commit needed (implementation was already minimal and clean after GREEN)._

## Files Created/Modified
- `src/domain/colregs/resolve-doubt-geometry.ts` - Pure `resolveDoubtGeometry()` function: recomputes both `relativeBearing()` directions, then branches on `doubtBoundary` to pick the triggering vessel (magnitude-closest-to-112.5 for overtaking/crossing, fixed vesselA for the symmetric head-on case), propagating any `relativeBearing()` failure unchanged
- `src/domain/colregs/resolve-doubt-geometry.fixtures.ts` - Five named fixtures: A-side trigger, B-side trigger (the Pitfall 3 case), sticky-hysteresis shape, head-on boundary, and coincident-position propagation
- `src/domain/colregs/resolve-doubt-geometry.test.ts` - Five behavior-case tests importing the fixtures above

## Decisions Made
- No `previous` argument, no trail reads -- see `key-decisions` in frontmatter for full rationale (this is the plan's central design point, directly resolving Pitfall 3 and the sticky-hysteresis `facts: {}` gap)
- Reused exact vessel shapes from `classify-encounter.fixtures.ts` (`doubtBandNearOvertakingBoundaryCase`, `overtakingHysteresisNearBoundaryCase`, `headOnBoundaryInclusiveCase`) rather than importing them directly, per the plan's explicit instruction, since this file's fixtures need an additional `doubtBoundary` field the classification fixtures don't carry
- For the B-side-trigger fixture, swapped the vesselA/vesselB labels on the same physical geometry as the A-side fixture, which is the cleanest way to construct a case where B's bearing (not A's) is the one closer to the 112.5 deg boundary

## Deviations from Plan

None - plan executed exactly as written. One environment-setup step was needed but is not a deviation from the plan's code: this worktree had no `node_modules` (fresh worktree checkout) and no generated Prisma client, both required to run the full test suite for the plan's stated verification (`npx vitest run` full suite exits 0). Ran `npm install` and `npx prisma generate` (schema-only codegen, no live DB write) to restore the environment to the state the plan's verification step assumes; also exported `DATABASE_URL` from the repo's own `.env.example` value to run the 3 pre-existing Postgres-integration test files against the already-running local Postgres Docker container, confirming all 120 tests pass. No source files were touched by this environment setup.

## Issues Encountered
None beyond the environment setup described above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `resolveDoubtGeometry()` is ready for 04-03's ChartPanel to call when rendering the dashed-amber doubt overlay (D-04), given any `ClassificationResult` with `doubt: true` and its `doubtBoundary`
- Zero coupling to the reasoning trail's `facts` shape, so future changes to trail formatting (e.g. tightening `facts: {}` in the sticky branch) cannot break this function's correctness
- Full domain-layer suite (120/120 tests) and `tsc --noEmit` both green

---
*Phase: 04-interactive-chart-sandbox*
*Completed: 2026-07-17*

## Self-Check: PASSED

All created files verified present on disk; all task/plan commit hashes (`44f959f`, `5ec92ac`, `8ed49b0`) verified present in git log.
