---
phase: 18-on-chart-vessel-control-overlay
plan: 04
subsystem: ui
tags: [react, typescript, sandbox, testing-library]

# Dependency graph
requires:
  - phase: 18-01
    provides: ChartHeaderStripProps/ChartFooterStripProps/VesselOverlayCardProps type contracts
  - phase: 18-02
    provides: ChartHeaderStrip.tsx, ChartFooterStrip.tsx, VesselOverlayCard.tsx (self-contained, unit-tested)
  - phase: 18-03
    provides: ChartPanel.tsx's selectedVessel state machine, fully wired open/toggle/switch/close overlay behavior
provides:
  - SandboxContainer.tsx composing only ChartPanel + ReasoningTrail -- no standalone VerdictBanner card, no standalone InstrumentReadouts card, no side ControlPanel column
  - Deletion of the 4 retired components (VerdictBanner.tsx, InstrumentReadouts.tsx, status-pill.ts, ControlPanel.tsx) and their 4 test files, plus 3 now-unused prop-contract interfaces removed from types.ts
  - SandboxContainer.test.tsx's full suite rewritten against the click-to-open-overlay interaction model, with zero remaining slider-index ambiguity
affects: [18-05-human-verification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "openOverlay() test helper mirrors dragHullTo()'s shape (single pointerdown, no pointermove, per D-04) for driving the on-chart overlay open/switch behavior in integration tests"

key-files:
  created: []
  modified:
    - src/components/sandbox/SandboxContainer.tsx
    - src/components/sandbox/SandboxContainer.test.tsx
    - src/components/sandbox/types.ts
  # Deleted (not modified):
  #   src/components/sandbox/reasoning/VerdictBanner.tsx + .test.tsx
  #   src/components/sandbox/instruments/InstrumentReadouts.tsx + .test.tsx
  #   src/components/sandbox/instruments/status-pill.ts + .test.ts
  #   src/components/sandbox/control-panel/ControlPanel.tsx + .test.tsx

key-decisions:
  - "Collapsed the 2-column grid wrapper (ChartPanel + side column) to a plain single-column div now that there is no second column to size -- ChartPanel is the sole content"
  - "Removed the now-obsolete verdictBanner() DOM-scoping test helper (and its 21 within(verdictBanner()) call sites) once VerdictBanner.tsx's deletion resolved the dual-render ambiguity that helper existed to disambiguate -- replaced with plain screen queries"
  - "Updated the default-mount test's stale assertion checking VerdictBanner's retired combined description sentence ('Vessel A gives way. Give-way vessel takes early...') to check ChartFooterStrip's per-vessel required-action text (D-03) instead, since that content genuinely moved, not merely relocated verbatim"

patterns-established: []

requirements-completed: [SBOX-06, SBOX-07, SBOX-08]

# Metrics
duration: 60min
completed: 2026-07-25
---

# Phase 18 Plan 04: Retire VerdictBanner/InstrumentReadouts/ControlPanel Summary

**SandboxContainer.tsx now composes only ChartPanel (header strip/chart/footer strip/click-to-open overlay) and ReasoningTrail -- the 4 retired components (VerdictBanner, InstrumentReadouts, status-pill, ControlPanel) plus their 4 test files are deleted outright, and SandboxContainer.test.tsx's full 13-test suite passes against the new click-to-open-overlay interaction model.**

## Performance

- **Duration:** ~60 min
- **Started:** 2026-07-25T17:00:00Z (approx.)
- **Completed:** 2026-07-25T17:53:00Z
- **Tasks:** 3 completed
- **Files modified:** 11 (3 modified, 8 deleted)

## Accomplishments

- `SandboxContainer.tsx`: removed the `VerdictBanner`/`InstrumentReadouts`/`ControlPanel` imports and JSX usages; `ChartPanel` is now the sole content of the chart area (2-column grid collapsed to a plain single-column wrapper); header copy and the file's own top-of-file doc comment updated to describe the new composition.
- Deleted 8 files outright: `VerdictBanner.tsx`/`.test.tsx`, `InstrumentReadouts.tsx`/`.test.tsx`, `status-pill.ts`/`.test.ts` (dead after `InstrumentReadouts.tsx`'s removal, its only consumer), `ControlPanel.tsx`/`.test.tsx`. `CopyLinkButton.tsx` (unrelated file in the same `control-panel/` directory) confirmed untouched.
- `types.ts`: removed the now-unused `ControlPanelProps`, `VerdictBannerProps`, `InstrumentReadoutsProps` interfaces.
- `SandboxContainer.test.tsx`: added `openOverlay()` helper (mirrors `dragHullTo`'s shape -- single pointerdown, no pointermove, per D-04); rewrote the 2 slider-dependent tests to open the relevant vessel's overlay before pressing arrow keys and switched both to singular `getByRole("slider")`; removed the now-obsolete `verdictBanner()` scoping helper and its 21 `within(verdictBanner())` call sites (replaced with plain `screen` queries) since `ChartHeaderStrip` is now the sole renderer of that content; updated one additional stale assertion (the default-mount test's check for VerdictBanner's retired combined description sentence) to check `ChartFooterStrip`'s per-vessel required-action text instead.

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove VerdictBanner/InstrumentReadouts/ControlPanel from SandboxContainer.tsx's composition** - `ca6222d` (feat)
2. **Task 2: Delete the 3 retired components (+ dead status-pill.ts) and their now-unused type contracts** - `e09b071` (feat)
3. **Task 3: Rewrite SandboxContainer.test.tsx's slider-dependent tests for the click-to-open-overlay model** - `6b67faa` (test)

**Plan metadata:** committed alongside this SUMMARY.md.

## Files Created/Modified

- `src/components/sandbox/SandboxContainer.tsx` - composes only `ChartPanel` + `ReasoningTrail`; updated header copy and doc comment
- `src/components/sandbox/SandboxContainer.test.tsx` - `openOverlay()` helper; 2 slider tests rewritten; `verdictBanner()` helper removed (21 call sites simplified to `screen`); 1 stale assertion updated
- `src/components/sandbox/types.ts` - removed `ControlPanelProps`/`VerdictBannerProps`/`InstrumentReadoutsProps`
- `src/components/sandbox/reasoning/VerdictBanner.tsx` - **deleted**
- `src/components/sandbox/reasoning/VerdictBanner.test.tsx` - **deleted**
- `src/components/sandbox/instruments/InstrumentReadouts.tsx` - **deleted**
- `src/components/sandbox/instruments/InstrumentReadouts.test.tsx` - **deleted**
- `src/components/sandbox/instruments/status-pill.ts` - **deleted**
- `src/components/sandbox/instruments/status-pill.test.ts` - **deleted**
- `src/components/sandbox/control-panel/ControlPanel.tsx` - **deleted**
- `src/components/sandbox/control-panel/ControlPanel.test.tsx` - **deleted**

## Decisions Made

- Collapsed the grid wrapper to a plain single-column `<div className="mt-4">` rather than keeping a 1-column grid template, since there's no longer a second column to size.
- Fixed the `verdictBanner()` test helper and 1 stale assertion beyond the plan's explicitly-named "exactly 2 tests" -- both were direct, foreseeable consequences of this same plan's Task 1/2 deletions (VerdictBanner's DOM slot and its retired description sentence no longer exist), required for the plan's own acceptance criteria ("all 13 existing test cases still present and green") to pass. See Deviations below.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed the now-broken `verdictBanner()` test-scoping helper**
- **Found during:** Task 3 (`npx vitest run SandboxContainer.test.tsx`)
- **Issue:** `verdictBanner()` queried `[data-slot="verdict-banner"]`, a DOM region only `VerdictBanner.tsx` (deleted in Task 2) ever rendered. Once deleted, every one of the helper's 21 `within(verdictBanner())` call sites would throw (`expect(banner).not.toBeNull()` failing), breaking nearly the entire test file -- the scoping was needed only during the mid-phase dual-rendering window (Plan 18-03), and that window closed once this same plan's Task 2 landed.
- **Fix:** Removed the `verdictBanner()` helper and its doc comment; replaced all 21 `within(verdictBanner())` call sites with plain `screen` queries (no more ambiguity now that `ChartHeaderStrip` is the sole renderer of this heading/rule-badge content); removed the now-unused `within` import.
- **Files modified:** `src/components/sandbox/SandboxContainer.test.tsx`
- **Verification:** `npx vitest run SandboxContainer.test.tsx` -- 13/13 passing.
- **Committed in:** `6b67faa` (Task 3 commit).

**2. [Rule 1 - Bug] Updated a 3rd stale test assertion (VerdictBanner's retired description sentence)**
- **Found during:** Task 3 (`npx vitest run SandboxContainer.test.tsx`)
- **Issue:** The default-mount test asserted `screen.getByText(/Vessel A gives way\. Give-way vessel takes early/)`, a sentence only `VerdictBanner.tsx`'s `verdictBannerDescription()` ever rendered. That combined one-line summary was never ported to `ChartHeaderStrip`/`ChartFooterStrip` -- it was legitimately replaced by `ChartFooterStrip`'s per-vessel `ROLE_ACTION_TEXT` copy (D-03), a deliberate content change from Plans 18-01/18-02, not a regression.
- **Fix:** Updated the assertion to check for the give-way vessel's actual required-action text now rendered in the footer strip: `"Alter course early & substantially — pass well clear astern."`.
- **Files modified:** `src/components/sandbox/SandboxContainer.test.tsx`
- **Verification:** `npx vitest run SandboxContainer.test.tsx` -- 13/13 passing.
- **Committed in:** `6b67faa` (Task 3 commit).

**3. [Rule 3 - Blocking] Generated missing Prisma client in worktree**
- **Found during:** Task 1 (`npm run typecheck` acceptance check)
- **Issue:** Same pre-existing per-worktree gap documented in Plans 18-01/18-02/18-03's own SUMMARYs -- `npm run typecheck` failed with `Cannot find module '../../../generated/prisma/client.js'`.
- **Fix:** Ran `DATABASE_URL=<placeholder from .env.example> npx prisma generate` (schema introspection only, no live DB connection needed).
- **Files modified:** None tracked (generated output is gitignored).
- **Verification:** `npm run typecheck` then exited 0.
- **Committed in:** N/A (environment-only fix, no tracked file changes).

---

**Total deviations:** 3 auto-fixed (2 bug fixes directly caused by this plan's own Task 1/2 deletions, 1 environment-only fix). No scope creep -- all 3 were necessary for the plan's own stated acceptance criteria to pass.
**Impact on plan:** None beyond the fixes themselves; no behavioral change to production code beyond what Tasks 1-2 already specified.

## Issues Encountered

- **`npm run build` could not be fully verified end-to-end in this sandboxed worktree.** The production build fails during static-page generation of the homepage (`/`) because `GalleryContainer` (a Server Component, entirely unrelated to this plan's files) queries Prisma/Postgres at build time, and this worktree has no Docker daemon access (`docker ps` fails with `no such file or directory` on the daemon socket) and no local Postgres binary. This is the exact same category of environment limitation Plans 18-01/18-02 documented for `npm run test`'s DB-dependent suites (`ECONNREFUSED` against a Postgres the worktree can't run). Confirmed via `git diff --stat` across the whole plan (`949b1ff..HEAD`) that zero files under `src/server` or `src/components/gallery` were touched by this plan's 3 tasks -- the build failure is pre-existing and unrelated to Sandbox/VerdictBanner/ControlPanel/InstrumentReadouts changes. `npm run typecheck` (which does not require a live DB) exits 0.
- `npx vitest run` (full suite): 15 pre-existing failures across the same 4 files documented in Plan 18-01/18-02 (`scenario-repository.test.ts`, `scenario-service.test.ts`, `scenario.test.ts` router, `GalleryContainer.test.tsx`) -- all require a live Postgres connection unavailable in this worktree. Confirmed via `git diff --stat` that none of this plan's 3 tasks touched any file in those paths. 217/232 tests pass; the 15 failures are the identical known/expected worktree limitation already logged in this phase's prior plans, not a new discovery.
- The repo-wide `grep -rln "VerdictBanner\|InstrumentReadouts\b\|ControlPanel\b" src app` from the plan's own `<verification>` section returns nonzero hits even after all deletions -- confirmed every hit is either (a) a "mined, not imported" provenance comment in `ChartHeaderStrip.tsx`/`ChartFooterStrip.tsx`/`VesselOverlayCard.tsx` (an established convention from Plan 18-02, citing the retired component a module's logic was mined from) or (b) a differently-named identifier that happens to contain the substring (`deriveInstrumentReadouts()`, the `InstrumentReadouts` interface in `instrument-readouts.ts` -- a derivation module untouched by this plan). A targeted `grep -rn "from.*ControlPanel\.js\|from.*VerdictBanner\.js\|from.*InstrumentReadouts\.js\|from.*status-pill\.js" src app` (actual import statements) returns zero hits, and `npm run typecheck` exits 0, confirming no orphaned code references remain.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- ROADMAP Phase 18 success criteria 1-3 are now literally true in the codebase: the separate `VerdictBanner` card, the separate `InstrumentReadouts` card, and the side `ControlPanel` are all gone, replaced by `ChartPanel`'s header strip / footer strip / click-to-open overlay (Plans 18-01 through 18-03).
- Only success criterion 4 (human-verified hit-testing regression re-check) remains -- addressed in Plan 18-05.
- `npm run build`'s live-DB dependency for homepage static generation is a pre-existing, out-of-scope environment limitation this worktree cannot resolve (no Docker/Postgres access) -- worth flagging to the orchestrator/human-verification step if a real build check is needed before merge, since it could not be exercised here.
- No blockers to Plan 18-05.

---
*Phase: 18-on-chart-vessel-control-overlay*
*Completed: 2026-07-25*
