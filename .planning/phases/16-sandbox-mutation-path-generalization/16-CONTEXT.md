# Phase 16: Sandbox Mutation-Path Generalization - Context

**Gathered:** 2026-07-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Every Sandbox vessel-mutation source (drag, ControlPanel field edit, Reset) funnels through one generalized, reusable scenario-loading entry point on `useSandboxState()`, and the inline 6-chip preset row is fully removed from the UI — the prerequisite both Phase 17 (Gallery→Sandbox bridge) and the rest of the v1.4 milestone depend on. No new user-facing feature is added in this phase; the chip row's scenario-loading capability is not replaced until Phase 17 ships.

</domain>

<decisions>
## Implementation Decisions

### Generalizing handleChipSelect → loadScenario
- **D-01:** `useSandboxState()` gains `loadScenario(vesselA: Vessel, vesselB: Vessel): void`, replacing `handleChipSelect(chipId: ChipId)`. Same body as today's `handleChipSelect` (reset `previousEncounterTypeRef.current = undefined`, then call `applyVesselUpdate(vesselA, vesselB)`), minus the `ChipId` lookup and the `setActiveChipId` call. This matches `ARCHITECTURE.md`'s Pattern 1 exactly — a rename/generalization of already-tested code, not new logic.
- **D-02:** `activeChipId` (state, setter, and the `ChipId | null` return field) is removed entirely from `useSandboxState()` — it has no remaining purpose once the chip UI is gone.
- **D-03 (discussed — Reset/loadScenario relationship):** `handleReset()` is refactored to call `loadScenario(seedA, seedB)` internally rather than duplicating the "reset hysteresis + full vessel-pair replace" body under a separate name. Rationale: once `activeChipId` is gone, `handleReset`'s and the old `handleChipSelect`'s bodies are identical except for which vessel pair is passed — keeping two near-identical implementations would violate this repo's own "no duplicated near-identical logic" convention (CLAUDE.md Conventions section). `handleReset` still owns computing `seedA`/`seedB` (the instance's seed — either `initialScenario` or the default fixture); it just delegates the actual apply step to `loadScenario`.

### Chip-row and chip-scenarios.ts removal
- **D-04:** `chip-scenarios.ts` and its test file (`chip-scenarios.test.ts`) are deleted outright, not archived or repurposed. Verified via repo-wide grep: the module's only consumers are `SandboxContainer.tsx` (chip row JSX + `CHIP_ORDER` import) and `useSandboxState.ts` (`CHIP_SCENARIOS`/`ChipId` import) — both being removed this phase. The three fixtures with genuinely nontrivial documented derivations (`sailingHasPriorityVessels`, `notUnderCommandVessels`, `inDoubtVessels`) are already preserved verbatim in `src/domain/colregs/classify-encounter.fixtures.ts` (`crossingSailingPriorityCase`, `crossingNotUnderCommandCase`, `headOnInDoubtCase`, each commented "already proven correct... by chip-scenarios.test.ts"). The remaining three (`classicCrossingVessels` — identical to the app's own default seed `crossingResidualBasicCase`; `headOnMeetingVessels`; `overtakingVessels`) are simple/undistinguished geometries with no unique derivation value. No migration or preservation step is needed beyond the existing domain fixtures.
- **D-05:** The chip row JSX block in `SandboxContainer.tsx` (the `CHIP_ORDER.map(...)` button group and its surrounding comment) is deleted, along with the `CHIP_ORDER` import. Nothing visually replaces it this phase — the vertical space simply collapses. This is expected and matches the ROADMAP's success criteria; no interim placeholder is in scope.
- **D-06:** `SandboxContainer.test.tsx`'s chip-dependent tests (the "does not show any chip as active..." regression test and the "loads the Overtaking chip's fixture scenario when clicked..." test) must be replaced with equivalent coverage exercising `loadScenario()` directly (or via whatever new call site invokes it), not left referencing removed UI. Left to the planner/executor to design the specific replacement test(s) — this is a testing-strategy detail, not a product decision.

### Rollout sequencing
- **D-07:** Phase 16 merges to `main` on its own PR as soon as it's done, per this project's existing branch-per-phase workflow — no need to hold the branch until Phase 17 (Gallery bridge) is also ready. The user explicitly accepted the resulting temporary production gap (no way to load a preset/curated scenario from the homepage between Phase 16's merge and Phase 17's merge) as low-risk for a low-traffic portfolio project. Do not design around avoiding this gap (e.g., no feature flag, no combined-PR requirement).

### Verification scope
- **D-08:** Success criterion 3's human-verified check ("drag/rotate a vessel, edit via ControlPanel, Reset behave identically to before the refactor") only needs to cover the plain `/` route (default fixture seed). The user explicitly scoped this out: re-verifying the `/s/[shareId]` saved-scenario route is not required this phase, since the refactor doesn't touch `initialScenario` seeding logic — only the mutation choke point downstream of it.

### Claude's Discretion
- Exact replacement test design for the removed chip-dependent tests in `SandboxContainer.test.tsx` (D-06).
- Whether `handleReset`'s `seedA`/`seedB` computation stays inline in `useSandboxState.ts` or is factored slightly differently, as long as `handleReset` delegates to `loadScenario` (D-03).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture & build order
- `.planning/research/ARCHITECTURE.md` — Pattern 1 ("Generalize the existing 'full replace + hysteresis reset' choke point instead of adding a parallel one") is the exact spec for this phase's `loadScenario()` refactor; "Suggested Build Order" section identifies this phase as milestone step [1], the prerequisite for steps [2]/[3].

### Pitfalls
- `.planning/research/PITFALLS.md` — table entry "Leaving chip-scenarios.ts, activeChipId, handleChipSelect... wired inside useSandboxState.ts after the chip row UI is removed" (line ~132) and the "Chip-row removal" checklist item (line ~171) directly describe the orphaned-code risk this phase must close out per D-02/D-04.

### Roadmap & requirements
- `.planning/ROADMAP.md` — Phase 16 section (Goal, Depends on, Requirements: SBOX-10, Success Criteria 1-4).
- `.planning/REQUIREMENTS.md` — SBOX-10.
- `.planning/PROJECT.md` — v1.4 milestone locked decisions (chip row removed, not kept alongside Gallery) and this codebase's documented hit-testing-regression precedent (context for why "human-verified, not just green tests" is a hard requirement across this milestone).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useSandboxState.ts`'s `applyVesselUpdate()` — the existing validate-then-classify choke point; `loadScenario()` wraps it exactly as `handleChipSelect()`/`handleReset()` already do, no new logic needed.
- `src/domain/colregs/classify-encounter.fixtures.ts` — already holds preserved copies of the 3 nontrivial chip fixtures (see D-04); no new fixture-preservation work needed.

### Established Patterns
- "Single choke point" invariant: every mutation source (drag, ControlPanel edit, Reset, and — starting Phase 17 — Gallery load) must funnel through `applyVesselUpdate()`. This phase's job is to make the "full pair replace + hysteresis reset" variant of that funnel (`loadScenario`) generic and chip-free, not to add a second path.
- This repo's "no duplicated near-identical logic" convention (CLAUDE.md Conventions) directly motivates D-03 (Reset delegates to loadScenario).

### Integration Points
- `SandboxContainer.tsx` — remove chip row JSX (lines ~82-108 as of this writing) and the `CHIP_ORDER` import; update the `Button`/`onClick` wiring for Reset (unchanged call site, `sandboxState.handleReset`) — no JSX change needed there since `handleReset`'s public signature doesn't change, only its internal body.
- `useSandboxState.ts` — the file whose public return type changes (`loadScenario` replaces `handleChipSelect`; `activeChipId` removed).

</code_context>

<specifics>
## Specific Ideas

No specific UI/visual requirements — this is a non-visual refactor phase (aside from the chip row's removal, which has no replacement visual this phase).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (Phase 17's Gallery→Sandbox bridge, which will be the first real consumer of `loadScenario()` beyond Reset, is already scoped separately in the roadmap and out of this phase's boundary.)

### Reviewed Todos (not folded)
None — `gsd-sdk query todo.match-phase 16` returned zero matches.

</deferred>

---

*Phase: 16-Sandbox Mutation-Path Generalization*
*Context gathered: 2026-07-25*
