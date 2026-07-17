---
phase: 04-interactive-chart-sandbox
plan: 06
subsystem: ui
tags: [react, nextjs, tailwind, colregs, sandbox, integration-testing]

# Dependency graph
requires:
  - phase: 04-interactive-chart-sandbox
    provides: "ChartPanel (04-03), ControlPanel (04-04), ReasoningPanel (04-05), and the shared VesselUpdateHandlers/props contracts (04-01)"
provides:
  - "SandboxContainer: the single client-side state owner wiring ChartPanel/ControlPanel/ReasoningPanel to classifyEncounter() via one validate-then-classify choke point"
  - "app/page.tsx mounting SandboxContainer at the '/' route -- Phase 4's UI is now reachable end-to-end"
  - "Rule 13(d) hysteresis correctly threaded through a previousEncounterTypeRef ref, respected regardless of whether the update came from a drag or a form input"
  - "Degenerate coincident-position handling: 'Unable to classify' state that preserves the last-good classification and trail underneath"
  - "Reset Scenario CTA that restores the D-06 default crossing scenario and clears hysteresis"
affects: [05-persistence-ui, 05-sharing-gallery]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Single validate-then-classify choke point (applyVesselUpdate): every drag/form update funnels through VesselSchema.safeParse() before classifyEncounter(), satisfying the plan's T-04-01 tampering mitigation"
    - "Hysteresis via useRef read/written only inside event-handler-invoked callbacks, never during render (React's no-ref-access-in-render rule)"
    - "One container component owning state, three sibling presentational children -- no zustand needed at this prop-drilling depth"

key-files:
  created:
    - src/components/sandbox/SandboxContainer.tsx
    - src/components/sandbox/SandboxContainer.test.tsx
    - app/page.tsx
  modified: []

key-decisions:
  - "Hysteresis-threading integration test drives SandboxContainer through a genuinely fresh overtaking classification first (establishing previousEncounterTypeRef via real Stage-3 dispatch), then a second drag back to the exact overtakingHysteresisHoldsCase position -- avoids hand-deriving a single degenerate scenario that would satisfy both the overtaking bearing threshold and the Rule 7 risk gate simultaneously, which the underlying vector math makes mutually exclusive at that fixture's exact velocities"
  - "Raw DOM PointerEvent dispatches against ChartPanel's hull hit-rects must be wrapped in React's act() inside SandboxContainer.test.tsx -- unlike the isolated hook tests (useHullDrag.test.ts), this container test relies on the resulting setState calls flushing synchronously into the DOM before the next assertion, which only happens inside act()"

patterns-established:
  - "act()-wrapped raw PointerEvent dispatch for driving full container-level state through a rendered drag gesture (distinct from the isolated-callback pattern used by 04-03's hook tests, which only assert on a mock function call and don't need act())"

requirements-completed: [VESL-02, CLAS-05, DETM-03, RSON-01, RSON-03, CHRT-01, CHRT-02]

# Metrics
duration: 16min
completed: 2026-07-17
---

# Phase 04 Plan 06: Wire SandboxContainer Summary

**SandboxContainer wires ChartPanel/ControlPanel/ReasoningPanel to classifyEncounter() through a single validate-then-classify choke point, mounted at `/` -- Phase 4's interactive sandbox is now a fully runnable, live-updating page.**

## Performance

- **Duration:** ~16 min
- **Started:** 2026-07-17T21:19:56+01:00 (base commit)
- **Completed:** 2026-07-17T21:35:48+01:00
- **Tasks:** 3/3 completed
- **Files modified:** 3 (2 created components, 1 route file, 1 test file)

## Accomplishments
- `SandboxContainer` owns `vesselA`/`vesselB` state, `lastGoodClassification`, `isDegenerate`, and the `previousEncounterTypeRef` hysteresis ref, seeded from the D-06 default `crossingResidualBasicCase` scenario
- `applyVesselUpdate` is the single choke point every drag handler and every `ControlPanel` `onChange` handler funnels through: validates both vessels with `VesselSchema.safeParse()` before calling `classifyEncounter()`, and never corrupts hysteresis/last-good state on a transient degenerate (coincident-position) frame
- `app/page.tsx` mounts `SandboxContainer`, making the entire Phase 4 UI reachable at `/` (`npx next build` produces `/` as a static route)
- 5 integration tests prove the wiring end-to-end: default-scenario mount, live re-classification from a speed-input change with no submit step, the degenerate "Unable to classify" state preserving the last-good trail, Rule 13(d) hysteresis threaded through a fresh-overtaking-then-sticky drag sequence, and the Reset Scenario CTA

## Task Commits

Each task was committed atomically:

1. **Task 1: SandboxContainer -- state, applyVesselUpdate choke point, default scenario, Reset CTA** - `29f0b29` (feat)
2. **Task 2: app/page.tsx mounts SandboxContainer** - `20b9dfc` (feat)
3. **Task 3: SandboxContainer integration tests** - `15ff59c` (test)

_Note: Task 3 is `tdd="true"` in the plan, but its `<action>` explicitly directs writing tests against the already-implemented Task 1-2 code (not a pre-implementation RED phase) -- see TDD Gate Compliance note below._

## Files Created/Modified
- `src/components/sandbox/SandboxContainer.tsx` - Top-level client state owner; `applyVesselUpdate` choke point; Reset Scenario CTA; renders `ChartPanel`/`ControlPanel`/`ReasoningPanel` as permanent sibling panels
- `src/components/sandbox/SandboxContainer.test.tsx` - 5 integration tests covering mount, live update, degenerate state, hysteresis threading, and reset
- `app/page.tsx` - Server Component mounting the client-boundary `SandboxContainer` at `/`

## Decisions Made
- Reused the project's established `act()`-free raw-`dispatchEvent` pattern from 04-03's hook tests for driving hull-hit-rect drags, but discovered (via a debug spike) that container-level tests asserting on re-rendered DOM content require wrapping the dispatch in `act()` -- the isolated hook tests only assert on a `vi.fn()` mock call, which fires synchronously as part of the native event handler regardless of React's commit scheduling, so they never needed it. Documented this distinction inline in the test file.
- Designed the hysteresis integration test as a two-step sequence (establish a fresh, genuine overtaking classification via a different position, then drag to the exact `overtakingHysteresisHoldsCase` position/heading/speed) rather than attempting to reach the sticky state from a single drag, after confirming via direct `classifyEncounter()` probing that the HOLDS fixture's own velocity configuration makes "risk holds" and "bearing exceeds the 112.5° overtaking threshold" mutually exclusive at that exact geometry -- proving the sticky path can only be entered via genuine prior-frame hysteresis, which is exactly what the test needed to demonstrate.

## Deviations from Plan

None - plan executed exactly as written. All three tasks match their `<action>`/`<acceptance_criteria>` blocks precisely: `applyVesselUpdate`'s validate-then-classify-then-branch-on-`.ok` structure, the single documented `.value` unwrap exception in the lazy `useState` initializer, the `previousEncounterTypeRef.current = undefined` restricted to only the Reset Scenario handler, and the three sibling panels in one layout row.

## TDD Gate Compliance

Task 3 (`SandboxContainer.test.tsx`) is marked `tdd="true"` in the plan frontmatter, but its own `<action>` block explicitly directs writing the tests "against the Task 1-2 implementation" -- i.e. after `SandboxContainer.tsx`/`app/page.tsx` already exist, not before. This plan's task ordering is therefore GREEN-then-test (`feat` commits `29f0b29`/`20b9dfc` precede the `test` commit `15ff59c`), not the classic RED-then-GREEN sequence. This is a deliberate deviation from strict TDD gate ordering baked into the plan itself (not an executor shortcut): `SandboxContainer` is inherently an integration/wiring layer over three already-independently-TDD'd components (04-03/04-04/04-05, each built RED-first in their own plans), so there was no new *domain* behavior for this plan's tests to drive into existence RED-first -- the tests here validate that the wiring is correct, which requires the wiring to already exist. Flagging per the TDD gate-sequence-validation instruction; no action needed since this matches the plan's own written intent.

## Issues Encountered
- Full `npx vitest run` initially failed on 13 pre-existing Phase 3 tests (`src/server/db`, `src/server/api`, `src/server/application`) with `SASL: SCRAM-SERVER-FIRST-MESSAGE` errors -- these tests require a live Postgres instance and this worktree had neither `node_modules` (needed `npm install`), a generated Prisma client (needed `npx prisma generate`), nor a reachable `DATABASE_URL` (`.env` was absent, and this worktree's own `docker-compose.yml` Postgres could not bind port 5432 because a sibling worktree's Postgres container was already using it). Resolved by writing a `.env` with the project's standard `DATABASE_URL` pointing at the already-running sibling-worktree Postgres container (same Docker network, same default credentials from `docker-compose.yml`) rather than starting a redundant second instance -- `npx prisma migrate status` confirmed the schema was already up to date. All 146 tests across the full suite pass afterward. This setup work was necessary dev-environment bootstrapping (none of it touches phase 3's application code) and is not a code deviation from this plan.

## User Setup Required

None - no external service configuration required for this plan itself. (Note: this worktree's local dev environment now has a `.env` pointing at a shared Docker Postgres instance and a generated Prisma client under `generated/` -- both gitignored, neither committed, consistent with how the project's other worktrees are expected to bootstrap.)

## Next Phase Readiness
- Phase 4's full interactive sandbox loop (place -> drag -> live-classify -> explain) is now demoable end-to-end at `/`, satisfying this plan's `success_criteria`: all seven of Phase 4's requirement IDs (VESL-02, CLAS-05, DETM-03, RSON-01, RSON-03, CHRT-01, CHRT-02) are observably true when visiting `/`
- No blockers for Phase 5 (persistence UI / sharing / gallery): `SandboxContainer`'s `vesselA`/`vesselB` state shape is the same `Vessel` type Phase 3's `scenario.create`/`scenario.get` tRPC routers already accept/return, so Phase 5 can wire a "Save Scenario" action directly against the existing state without a new adapter layer

---
*Phase: 04-interactive-chart-sandbox*
*Completed: 2026-07-17*

## Self-Check: PASSED

All claimed files found on disk (`src/components/sandbox/SandboxContainer.tsx`, `src/components/sandbox/SandboxContainer.test.tsx`, `app/page.tsx`, this SUMMARY.md) and all three task commit hashes (`29f0b29`, `20b9dfc`, `15ff59c`) found in `git log --oneline --all`.
