---
phase: 16-sandbox-mutation-path-generalization
verified: 2026-07-25T13:10:00Z
status: passed
score: 4/4 must-haves verified
overrides_applied: 0
---

# Phase 16: Sandbox Mutation-Path Generalization Verification Report

**Phase Goal:** Every Sandbox vessel-mutation source funnels through one generalized, reusable scenario-loading entry point, and the inline preset-chip UI is fully removed — the prerequisite both Phase 17 (Gallery load) and the rest of this milestone depend on.
**Verified:** 2026-07-25T13:10:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | The Sandbox UI no longer displays the 6-chip preset row anywhere on the page | VERIFIED | `SandboxContainer.tsx` has no `CHIP_ORDER` import and no chip-row JSX block; `VerdictBanner` is the element immediately after `</header>`. `SandboxContainer.test.tsx` line 157 explicitly asserts `screen.queryByRole("button", { name: "Classic crossing" })` is absent. |
| 2 | `useSandboxState()` exposes a single `loadScenario(vesselA, vesselB)` entry point (replacing `handleChipSelect`) that every mutation source can call | VERIFIED | `useSandboxState.ts:151-154` defines `loadScenario(nextA, nextB)`; return type/object (lines 41, 181) exposes it; `handleChipSelect`/`activeChipId`/`ChipId`/`CHIP_SCENARIOS` do not appear anywhere in the file (confirmed via grep, 0 hits). `handleReset()` (lines 156-162) delegates via `loadScenario(seedA, seedB)`. Drag/rotate/ControlPanel handlers (`onVesselPositionChange`, `onVesselHeadingChange`, `onVesselSpeedChange`, `onVesselTypeChange`) all funnel through the shared `applyVesselUpdate()` choke point, which `loadScenario` also calls. |
| 3 | Existing Sandbox interactions (drag/rotate, ControlPanel edit, Reset) behave identically to before the refactor — human-verified in a real browser | VERIFIED | Per task instructions, this was human-verified in Plan 16-02's checkpoint (SUMMARY confirms drag/rotate/ControlPanel edits/Reset all update the verdict live and Reset→loadScenario delegation works). The one reported discrepancy (drag-to-exact-coincident-position not reliably showing "Unable to classify") was investigated and confirmed to be a pre-existing precision quirk in `bearing.ts`'s exact-equality check, unrelated to this phase's refactor (ChartPanel.tsx/bearing.ts untouched by 16-01) — logged as `.planning/todos/pending/2026-07-25-drag-to-coincident-position-rarely-triggers-unable-to-classify.md`, not a phase-16 gap per explicit scope decision. |
| 4 | No orphaned chip-row code remains (`activeChipId`, old `handleChipSelect`, `chip-scenarios.ts`) — removed, not merely hidden | VERIFIED | `test -f chip-scenarios.ts` / `chip-scenarios.test.ts` both confirm absence. `grep -rn "chip-scenarios\|CHIP_SCENARIOS\|CHIP_ORDER\|ChipId\|activeChipId\|handleChipSelect" src/components/sandbox/` returns zero hits. Repo-wide grep for the same terms returns only 6 lines, all provenance *comments* in `src/domain/colregs/classify-encounter.fixtures.ts` documenting where 3 fixtures were copied from before `chip-scenarios.ts`'s deletion — explicitly declared out-of-scope in Plan 16-01's D-04/verification step 4, not orphaned executable code. |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/sandbox/hooks/useSandboxState.ts` | `loadScenario()` single mutation entry point | VERIFIED | Function present, exported, wired into `handleReset`; no `activeChipId`/`handleChipSelect`/`ChipId` remnants. |
| `src/components/sandbox/SandboxContainer.tsx` | chip-row-free composition (>=100 lines) | VERIFIED | 118 lines, no `CHIP_ORDER` import, no chip JSX. |
| `src/components/sandbox/chip-scenarios.ts` | DELETED | VERIFIED | File does not exist. |
| `src/components/sandbox/chip-scenarios.test.ts` | DELETED | VERIFIED | File does not exist. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `handleReset` (useSandboxState.ts:156-162) | `loadScenario` (useSandboxState.ts:151-154) | direct delegating call | WIRED | `handleReset` body is exactly `loadScenario(seedA, seedB);` — no duplicated reset-then-apply logic. |
| `SandboxContainer.test.tsx` | `useSandboxState`'s `loadScenario`/`handleReset` contract | RTL render + Reset-button click assertions | WIRED | "restores the passed-in initialScenario's own vessels... when Reset scenario is clicked" (lines 259-287) exercises the full drag-to-degenerate → Reset → loadScenario path and asserts correct verdict restoration. |
| `SandboxContainer.tsx` mutation sources (drag, ControlPanel) | `useSandboxState`'s `applyVesselUpdate` choke point | `onVesselPositionChange`/`onVesselHeadingChange`/`onVesselSpeedChange`/`onVesselTypeChange` props | WIRED | All 4 handlers call `applyVesselUpdate`, the same underlying choke point `loadScenario` calls — single-path funnel confirmed by direct code read. |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full test suite (sandbox scope + repo) | `npx vitest run src/components/sandbox` | 15 files / 62 tests passed | PASS |
| Typecheck | `npm run typecheck` | 0 errors | PASS |
| Lint | `npm run lint` | 0 errors, 3 pre-existing unrelated `max-lines` warnings in `src/domain/colregs/*` (not touched by this phase) | PASS |
| Orphaned-code grep (Sandbox scope) | `grep -rn "chip-scenarios\|CHIP_SCENARIOS\|CHIP_ORDER\|ChipId\|activeChipId\|handleChipSelect" src/components/sandbox/` | 0 hits | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| SBOX-10 | 16-01, 16-02 | "The inline 6-chip preset row is removed from the Sandbox; scenario loading happens only via the Gallery's 'Try on Sandbox' action" | SATISFIED (in-scope portion) | The removal clause is fully satisfied by this phase (chip row deleted, `chip-scenarios.ts` deleted, no orphaned code). The "scenario loading happens only via Gallery's Try on Sandbox action" clause depends on Phase 17 (not yet started — ROADMAP explicitly scopes this as Phase 16's prerequisite work, with Phase 17 depending on Phase 16's `loadScenario()`). This split is intentional per ROADMAP's phase breakdown, not a gap in Phase 16. |

**Note:** `.planning/REQUIREMENTS.md`'s traceability table (line 60) still lists SBOX-10 as "Pending" and the requirement checkbox (line 16) is unchecked. This is a stale tracking-document detail, not a code gap — the code-verifiable portion of SBOX-10 owned by Phase 16 is fully implemented. Flagged here as informational; recommend updating REQUIREMENTS.md's checkbox/status once Phase 17 completes the requirement's full scope (or splitting SBOX-10 into a Phase-16 sub-clause if strict per-phase tracking is desired).

### Anti-Patterns Found

None. No `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/placeholder markers in any file this phase modified (`useSandboxState.ts`, `SandboxContainer.tsx`, `SandboxContainer.test.tsx`). The two known findings from this phase's process (degenerate-drag precision quirk; pre-existing unsafe `Result` cast from Phase 12-02) were both investigated, confirmed pre-existing/out-of-scope, and logged as proper backlog todos with file references rather than left as inline debt markers:
- `.planning/todos/pending/2026-07-25-drag-to-coincident-position-rarely-triggers-unable-to-classify.md`
- `.planning/todos/pending/2026-07-25-unsafe-result-cast-in-usesandboxstate-lazy-initializer.md`

Both are confirmed pre-existing (untouched by this phase's diffs — `ChartPanel.tsx`/`bearing.ts` untouched by 16-01; the unsafe cast traces to commit `3bfae34`, Phase 12-02) and are correctly excluded from this phase's gap accounting per the task's explicit instructions.

### Human Verification Required

None outstanding. Success criterion 3's human-browser verification was already completed in Plan 16-02's checkpoint (dev server run, 8-step sequence, user typed confirmation per SUMMARY.md), with the one reported discrepancy investigated and resolved as pre-existing/out-of-scope rather than left unresolved.

### Gaps Summary

No gaps. All 4 ROADMAP success criteria are verified true in the codebase:
1. Chip row removed from UI (confirmed via source read + test assertion).
2. `loadScenario(vesselA, vesselB)` is the single generalized entry point; `handleReset` delegates to it; all mutation sources (drag/rotate/ControlPanel) share the same `applyVesselUpdate` choke point.
3. Behavioral parity human-verified in 16-02, with the one known deviation traced to a pre-existing, phase-unrelated precision quirk and logged as backlog.
4. Zero orphaned chip-identifier code remains in `src/components/sandbox/`; only historical provenance comments in an out-of-scope domain fixtures file reference the deleted module by name.

Full test suite (62 tests), typecheck, and lint are all green. Both commits-per-task chain (`ae09491`, `6067e33`, `63c76b9`, `bdb504f`) confirmed present in git log.

---

*Verified: 2026-07-25T13:10:00Z*
*Verifier: Claude (gsd-verifier)*
