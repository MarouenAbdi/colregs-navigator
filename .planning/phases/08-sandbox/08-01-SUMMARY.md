---
phase: 08-sandbox
plan: 01
subsystem: ui
tags: [tailwind, shadcn, radix, vitest, colregs, sandbox]

# Dependency graph
requires:
  - phase: 06-scaffolding
    provides: shadcn/ui component primitives (Button/Card/Badge), dark-only @theme token scaffold, components.json (style radix-nova)
  - phase: 07-hero
    provides: pure computation-module/presentation-split convention (hero-preview-geometry.ts precedent), Typography/Spacing role tables Phase 8 reuses verbatim
provides:
  - 7 new semantic @theme tokens (give-way/stand-on/mutual/rule-accent/doubt/geometry/chart-surface) registered in app/globals.css
  - shadcn Select/Slider/Label primitives vendored under src/components/ui/
  - vessel-role.ts consolidated ROLE_HULL_FILL_CLASS/ROLE_BADGE_TEXT/ROLE_BADGE_CLASSNAME (single source of truth for role styling)
  - types.ts widened/renamed prop contracts (ControlPanelProps.classification, VerdictBannerProps, InstrumentReadoutsProps, ReasoningTrailProps)
  - chip-scenarios.ts (6 preset Vessel-pair fixtures + CHIP_ORDER), instrument-readouts.ts, status-pill.ts, reasoning-trail-tag.ts -- 4 new pure, framework-free derivation modules
affects: [08-02, 08-03, 08-04, 08-05, 08-06]

# Tech tracking
tech-stack:
  added: [shadcn Select, shadcn Slider, shadcn Label]
  patterns:
    - "Pure derivation modules (chip-scenarios.ts/instrument-readouts.ts/status-pill.ts/reasoning-trail-tag.ts) built before any presentational component consumes them (Interface-First Task Ordering)"
    - "Instrument readouts derived via direct relativeBearing()/cpa() calls against live vessel state, never by scanning classification.trail[].facts"

key-files:
  created:
    - src/components/ui/select.tsx
    - src/components/ui/slider.tsx
    - src/components/ui/label.tsx
    - src/components/sandbox/chip-scenarios.ts
    - src/components/sandbox/chip-scenarios.test.ts
    - src/components/sandbox/instrument-readouts.ts
    - src/components/sandbox/instrument-readouts.test.ts
    - src/components/sandbox/status-pill.ts
    - src/components/sandbox/status-pill.test.ts
    - src/components/sandbox/reasoning-trail-tag.ts
    - src/components/sandbox/reasoning-trail-tag.test.ts
  modified:
    - app/globals.css
    - src/components/sandbox/vessel-role.ts
    - src/components/sandbox/vessel-role.test.ts
    - src/components/sandbox/types.ts

key-decisions:
  - "rule-accent (#0D9488, teal-600) registered as a token deliberately distinct from --primary (#2dd4bf) -- reserved for the active chip fill, RULE-N reasoning-trail tag, and the existing rotate-handle circle stroke"
  - "chip-scenarios.ts fixtures are sandbox-local standalone literals, not imported from classify-encounter.fixtures.ts or any src/server path (D-03)"
  - "Instrument readouts call relativeBearing()/cpa() directly rather than scanning classification.trail[].facts, which cannot reliably supply Range/CPA/TCPA across every code path (sticky-overtaking has facts:{}, no-closure never attaches tcpaMinutes/dcpaNm)"

patterns-established:
  - "Role-derivation style maps (fill class, badge text, badge className) live in one module (vessel-role.ts), consumed by every component that renders a role, instead of each component re-deriving/duplicating its own copy"

requirements-completed: [SBOX-01, SBOX-02]

# Metrics
duration: 45min
completed: 2026-07-18
---

# Phase 8 Plan 1: Sandbox Shared Building Blocks Summary

**Registered 7 missing dark-theme semantic tokens, vendored shadcn Select/Slider/Label, consolidated role-styling into vessel-role.ts, and built 4 pure derivation modules (6 chip fixtures verified against the real classifyEncounter(), instrument readouts, status-pill copy, reasoning-trail tag helpers) that every Wave 2/3 Sandbox component will import.**

## Performance

- **Duration:** ~45 min
- **Completed:** 2026-07-18T21:22:33Z
- **Tasks:** 3 completed (Task 3 followed RED/GREEN TDD gates)
- **Files modified:** 4 modified, 11 created

## Accomplishments

- Closed Pitfall S2 (missing give-way/stand-on/mutual/rule-accent/doubt/geometry/chart-surface `@theme` tokens) by registering all 7 in `app/globals.css`'s `@theme inline` + `:root` + `.dark` blocks with byte-identical dark-only values
- Vendored `select.tsx`/`slider.tsx`/`label.tsx` via the official shadcn registry (`npx shadcn add`), no third-party registry
- Consolidated the role -> style duplication that previously lived separately in `ChartPanel.tsx` and `ReasoningPanel.tsx` into `vessel-role.ts`'s 3 new exports
- Widened `types.ts` for the Wave 2 `ReasoningPanel` 3-card split and the Wave 3 `ControlPanel` role badge, without touching `src/domain/colregs/types.ts`
- Built and unit-tested 4 new pure modules, with the 6 chip fixtures (including the two genuinely-new `not-under-command` and `in-doubt` geometries) verified against the real `classifyEncounter()`, not just hand-derived math

## Task Commits

Each task was committed atomically:

1. **Task 1: Install shadcn Select/Slider/Label + register 7 semantic tokens** - `0f96a3d` (feat)
2. **Task 2: Consolidate vessel-role.ts, widen types.ts** - `ca0d3bc` (refactor)
3. **Task 3: 4 new pure derivation modules** - `4b9af6b` (test, RED) + `be5bf9e` (feat, GREEN)

## Files Created/Modified

- `app/globals.css` - 7 new `--color-*` tokens in `@theme inline`, raw `--give-way`/`--stand-on`/`--mutual`/`--rule-accent`/`--doubt`/`--geometry`/`--chart-surface` vars in both `:root` and `.dark`
- `src/components/ui/select.tsx`, `slider.tsx`, `label.tsx` - shadcn-vendored primitives
- `src/components/sandbox/vessel-role.ts` - added `ROLE_HULL_FILL_CLASS`/`ROLE_BADGE_TEXT`/`ROLE_BADGE_CLASSNAME`
- `src/components/sandbox/vessel-role.test.ts` - 3 new `describe` blocks for the consolidated maps
- `src/components/sandbox/types.ts` - `ControlPanelProps.classification`; `ReasoningPanelProps` renamed `VerdictBannerProps`; new `InstrumentReadoutsProps`/`ReasoningTrailProps`
- `src/components/sandbox/chip-scenarios.ts` / `.test.ts` - 6 preset `Vessel`-pair fixtures + `CHIP_ORDER`, verified against `classifyEncounter()`
- `src/components/sandbox/instrument-readouts.ts` / `.test.ts` - `deriveInstrumentReadouts()`
- `src/components/sandbox/status-pill.ts` / `.test.ts` - `statusPillCopy()`
- `src/components/sandbox/reasoning-trail-tag.ts` / `.test.ts` - `classifyingEntryIndex()`/`ruleNumber()`

## Decisions Made

- Followed the plan's exact token values/naming (no deviation from 08-01-PLAN.md's specified hex values or export names)
- For the `instrument-readouts.test.ts` degenerate case, used matching heading+speed (not just coincident position) so `cpa()`'s relative-velocity vector is genuinely zero and triggers its "no-closure" failure -- a coincident position alone with differing headings still yields a defined (zero) CPA, which would have made the test's null-CPA assertion incorrect

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed an incorrect assumption in the plan's own instrument-readouts degenerate-case test guidance**
- **Found during:** Task 3 (instrument-readouts.test.ts)
- **Issue:** The plan's behavior spec assumed `cpa()` fails (returns null `cpaNm`/`tcpaMinutes`) for any coincident-position pair. Tracing `cpa.ts`'s actual formula shows this is only true when the relative *velocity* vector is also near-zero (matching heading+speed) -- a coincident position with differing headings still produces a valid (zero) CPA result.
- **Fix:** Constructed the test's degenerate fixture with matching heading and speed (in addition to coincident position) so the "no-closure" failure path is genuinely exercised, matching the documented null-CPA behavior.
- **Files modified:** `src/components/sandbox/instrument-readouts.test.ts`
- **Verification:** Test passes; `bearingAtoBDegrees`/`cpaNm`/`tcpaMinutes` are all `null`, `rangeNm` is `0`
- **Committed in:** `be5bf9e` (Task 3 GREEN commit)

**2. [Rule 1 - Bug] Removed literal `ReasoningPanelProps`/`src/server`/`classify-encounter.fixtures` substrings from WHY-comments to satisfy the plan's own source-assertion greps**
- **Found during:** Task 2 and Task 3
- **Issue:** Several of my own explanatory code comments happened to contain the exact strings the plan's acceptance-criteria greps check for absence of (e.g. a comment saying "renamed from ReasoningPanelProps" made `grep -c "ReasoningPanelProps" types.ts` return 1 instead of the required 0; similarly for `chip-scenarios.ts`'s "not sourced from src/server/..." comment)
- **Fix:** Reworded the comments to convey the same rationale without using the literal flagged substrings
- **Files modified:** `src/components/sandbox/types.ts`, `src/components/sandbox/vessel-role.ts`, `src/components/sandbox/chip-scenarios.ts`
- **Verification:** All acceptance-criteria grep checks now return the exact counts specified in the plan
- **Committed in:** `ca0d3bc` (Task 2), `be5bf9e` (Task 3)

**3. [Rule 1 - Bug] Removed plan/task-ID references ("08-01") from new code comments**
- **Found during:** Task 2
- **Issue:** CLAUDE.md's Conventions section explicitly forbids referencing a task/plan ID in comments ("reference the *reason* instead") since it rots once the plan is archived. My first draft of several new comments included "08-01" references.
- **Fix:** Reworded to cite the design/decision rationale (ARCHITECTURE.md's consolidation note, D-05, the Sandbox design contract) instead of the plan ID.
- **Files modified:** `src/components/sandbox/vessel-role.ts`, `src/components/sandbox/types.ts`
- **Verification:** `grep -n "08-01"` across all modified/created files in this plan returns no matches
- **Committed in:** `ca0d3bc` (Task 2)

---

**Total deviations:** 3 auto-fixed (all Rule 1 - bug fixes to my own draft code/tests before committing, not scope changes)
**Impact on plan:** All fixes were self-corrections during implementation, keeping the plan's own acceptance criteria satisfied exactly as specified. No scope creep, no plan deviation in substance.

## Issues Encountered

- This worktree's HEAD was initially based on `main` (pre-Phase-8), missing all of Phase 8's planning docs (`08-01-PLAN.md`, `08-CONTEXT.md`, `08-RESEARCH.md`, `08-UI-SPEC.md`, `08-PATTERNS.md`). Resolved via a fast-forward-only merge (`git merge --ff-only frontend-implementation/phase-8-sandbox`) since this worktree's HEAD was exactly that branch's merge-base -- a pure, non-destructive fast-forward, not a 3-way merge or rebase.
- `npm run typecheck` reports one pre-existing, unrelated error (`src/server/db/client.ts` cannot find the generated Prisma client module) in every run throughout this plan -- present before any of this plan's changes, not caused by this work, and out of this plan's scope (no `src/server/` files were touched).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Wave 2 plans (ChartPanel/ControlPanel/ReasoningPanel-split restyle) can now import `ROLE_HULL_FILL_CLASS`/`ROLE_BADGE_TEXT`/`ROLE_BADGE_CLASSNAME` from `vessel-role.ts`, the widened `types.ts` contracts, the 7 registered semantic tokens, and the `Select`/`Slider`/`Label` primitives without inventing any of these contracts themselves.
- `npm run typecheck`'s remaining errors (`ControlPanel.test.tsx`, `ReasoningPanel.tsx`, `SandboxContainer.tsx`) are the expected, plan-documented wave-2 cleanup surface -- not a regression introduced here.
- No blockers for Wave 2.

---
*Phase: 08-sandbox*
*Completed: 2026-07-18*
