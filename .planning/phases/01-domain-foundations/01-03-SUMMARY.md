---
phase: 01-domain-foundations
plan: 03
subsystem: domain
tags: [geometry, trigonometry, vitest, typescript, colregs, cpa, tcpa, coordinate-conversion]

# Dependency graph
requires:
  - phase: 01-domain-foundations (Plan 01-01)
    provides: shared Result<T> discriminated union (src/domain/shared/result.ts) and Vessel/Position Zod schemas (src/domain/vessel/vessel.ts)
provides:
  - cpa()/tcpa() closest-point-of-approach vector math (Result<{tcpaMinutes, dcpaNm}>)
  - angle-convert.ts pure compass<->math angle conversion + normalization helpers
  - screen-convert.ts pure screen-pixel<->chart-space coordinate conversion (ROADMAP Phase 1 Success Criterion #3)
affects: [02-colregs-rules-engine, 04-interactive-chart-sandbox]

# Tech tracking
tech-stack:
  added: []
  patterns: [shared Result<T> reused for degenerate cases, plain-number pure functions for non-degenerate conversions, epsilon-gated near-zero comparison instead of exact equality]

key-files:
  created:
    - src/domain/geometry/cpa.ts
    - src/domain/geometry/cpa.fixtures.ts
    - src/domain/geometry/cpa.test.ts
    - src/domain/geometry/angle-convert.ts
    - src/domain/geometry/angle-convert.fixtures.ts
    - src/domain/geometry/angle-convert.test.ts
    - src/domain/geometry/screen-convert.ts
    - src/domain/geometry/screen-convert.fixtures.ts
    - src/domain/geometry/screen-convert.test.ts
  modified: []

key-decisions:
  - "Negative TCPA (vessels past closest approach, diverging) is returned as a normal ok() result, never clamped to 0 and never tagged degenerate — resolves RESEARCH.md Open Question 1 per its own recommendation"
  - "Near-zero relative velocity is detected via an epsilon threshold (NEAR_ZERO_RELATIVE_VELOCITY_SQ = 1e-9 squared-knots), not exact-zero equality, since floating-point noise from sin/cos-derived velocity components makes exact comparison unreliable — resolves RESEARCH.md Open Question 2"
  - "angle-convert.ts and screen-convert.ts return plain numbers/objects (not Result<T>) because pure angle/coordinate conversion has no degenerate runtime case for finite input — only cpa()/tcpa() (which can hit no-closure) needs the Result<T> wrapper"
  - "screen-convert.ts implements the pure screenToChart()/chartToScreen() functions in full during Phase 1 (plain number-in/number-out, zero DOM/ResizeObserver/SVGElement dependency) — only the future caller that measures live containerSize is deferred to Phase 4, per the plan-checker's blocker finding during plan-phase"

patterns-established:
  - "Velocity decomposition from heading+speed uses vx = speed*sin(heading), vy = speed*cos(heading) for the x=east/y=north compass convention — consistent with bearing.ts's atan2(dx, dy) convention family"
  - "Y-axis inversion in chart<->screen conversion (chart y increases north/up, screen y increases downward) via containerSize.height subtraction, documented inline as the pitfall most likely to be silently swapped"

requirements-completed: [VESL-01]

# Metrics
duration: 25min
completed: 2026-07-14
---

# Phase 1: Domain Foundations Summary (Plan 03)

**CPA/TCPA vector math with negative-TCPA and epsilon-threshold resolution, plus pure compass/math and screen/chart coordinate converters**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-07-14T18:28:33+01:00
- **Completed:** 2026-07-14T18:53:45+01:00
- **Tasks:** 3
- **Files modified:** 9 (all created)

## Accomplishments
- `cpa()`/`tcpa()` implements the standard relative-position/relative-velocity vector formula, converting the natural nm/knots-derived hours output to minutes per D-02, and resolves both of RESEARCH.md's open questions (negative TCPA allowed through as `ok()`; near-zero relative velocity gated by an explicit epsilon constant rather than exact equality)
- `angle-convert.ts` provides `compassToMathDegrees`, `mathToCompassDegrees`, `normalizeCompassDegrees` ([0,360)), and `normalizeRelativeBearingDegrees` ((-180,180]) as plain, degenerate-case-free pure functions
- `screen-convert.ts` delivers ROADMAP Phase 1 Success Criterion #3 in full: `chartToScreen()`/`screenToChart()` are pure, DOM-free coordinate converters taking `containerSize`/`viewBox` as plain arguments — no `SVGElement`, `ResizeObserver`, or `getScreenCTM` anywhere

## Task Commits

Each task was committed atomically (RED/GREEN pairs):

1. **Task 1: cpa()/tcpa() vector math** - `06af22d` (test, RED) → `3dbc333` (feat, GREEN)
2. **Task 2: angle-convert.ts compass/math conversion** - `245a0f0` (test, RED) → `d9c1952` (feat, GREEN)
3. **Task 3: screen-convert.ts coordinate conversion** - `d91184c` (test, RED) → `ef0b275` (feat, GREEN)

**Plan metadata:** this file (docs: complete plan) — written by the orchestrator after the executor agent was terminated by the harness's stall watchdog immediately after finishing Task 3's implementation, before it could write and commit its own SUMMARY.md. All 3 tasks' RED/GREEN commits, fixtures, and tests were already complete and verified on disk; the orchestrator verified `npm test` (26/26 passing for this plan's 3 test files; 65/65 across the full phase after merge) and `npx tsc --noEmit` (0 errors) before authoring this summary.

## Files Created/Modified
- `src/domain/geometry/cpa.ts` - `cpa(vesselA, vesselB): Result<{tcpaMinutes, dcpaNm}>`, exports `NEAR_ZERO_RELATIVE_VELOCITY_SQ`
- `src/domain/geometry/cpa.fixtures.ts` - hand-derived closing, no-closure, negative-TCPA, and epsilon-boundary fixtures
- `src/domain/geometry/cpa.test.ts` - Vitest suite for `cpa()`
- `src/domain/geometry/angle-convert.ts` - `compassToMathDegrees`, `mathToCompassDegrees`, `normalizeCompassDegrees`, `normalizeRelativeBearingDegrees`
- `src/domain/geometry/angle-convert.fixtures.ts` - hand-derived compass<->math and normalization fixtures
- `src/domain/geometry/angle-convert.test.ts` - Vitest suite for angle conversion
- `src/domain/geometry/screen-convert.ts` - `chartToScreen()`, `screenToChart()`, `ContainerSize`/`ChartViewBox` types
- `src/domain/geometry/screen-convert.fixtures.ts` - hand-derived chart<->screen and round-trip fixtures
- `src/domain/geometry/screen-convert.test.ts` - Vitest suite for coordinate conversion

## Decisions Made
- Negative TCPA returned as a plain `ok()` result rather than a new degenerate tag (RESEARCH.md Open Question 1, resolved per its own recommendation)
- Epsilon threshold `NEAR_ZERO_RELATIVE_VELOCITY_SQ = 1e-9` (squared knots) for near-parallel-course detection, in place of exact-zero equality (RESEARCH.md Open Question 2)
- `angle-convert.ts`/`screen-convert.ts` use plain-number/plain-object returns (not `Result<T>`) since pure angle/coordinate conversion has no degenerate case for finite input — they throw `TypeError` only on non-finite input, which is a programming-error guard, not an expected runtime state
- `normalizeRelativeBearingDegrees` intentionally duplicates ~2 lines of normalization logic already inline in `relative-bearing.ts` (Plan 01-02) rather than extracting a shared helper, to keep Plans 02 and 03 file-independent within the same wave — consistent with CLAUDE.md's "justify every abstraction" persona at this scale

## Deviations from Plan

None — plan executed exactly as written. The only deviation is procedural (this SUMMARY.md being authored by the orchestrator rather than the executor agent itself), not a deviation in the implemented code or tests.

## Issues Encountered

The executor agent that ran this plan in an isolated worktree was terminated by the harness's stall-detection watchdog ("no progress for 600s") immediately after committing Task 3's implementation (`ef0b275`), before it reached the SUMMARY.md-writing step. No code, test, or commit work was lost — all 3 RED/GREEN task pairs were already committed and verified. The orchestrator merged the worktree branch, re-ran the full test suite and type check to confirm correctness, and authored this SUMMARY.md directly rather than re-spawning a fresh executor (which would have risked re-implementing already-correct, already-tested work).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All of Phase 1's geometry primitives (`bearing`, `relativeBearing`, `cpa`/`tcpa`, angle/screen converters) and the `Vessel`/`Result<T>` foundations are now complete and merged
- Phase 2 (COLREGS Rules Engine) can import `bearing()`, `relativeBearing()`, `cpa()`/`tcpa()`, and `Vessel`/`VesselType` directly — no blockers
- Phase 4 (Interactive Chart Sandbox) can import `chartToScreen()`/`screenToChart()` directly; it only needs to add the `ResizeObserver`-based caller that sources `containerSize` live

---
*Phase: 01-domain-foundations*
*Completed: 2026-07-14*
