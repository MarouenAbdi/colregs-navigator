# Phase 16: Sandbox Mutation-Path Generalization - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-25
**Phase:** 16-sandbox-mutation-path-generalization
**Areas discussed:** Rollout sequencing, Reset vs loadScenario relationship, Verification scope

---

## Gray-area selection

Before discussion, the analysis noted this phase is a narrow, mostly-mechanical refactor already heavily resolved by prior milestone research (`ARCHITECTURE.md` Pattern 1 for the `loadScenario()` signature, and a codebase check confirming `chip-scenarios.ts` has zero other consumers and its nontrivial fixtures are already duplicated in `classify-encounter.fixtures.ts`). Three genuinely open questions were surfaced and all three were selected for discussion:

| Option | Description | Selected |
|--------|-------------|----------|
| Rollout sequencing | Temporary production gap (no preset-loading) between Phase 16 and Phase 17 merges — is that acceptable? | ✓ |
| Reset vs loadScenario relationship | Should handleReset() delegate to the new loadScenario(), or stay separate? | ✓ |
| Verification scope | Should human-verification cover both `/` and `/s/[shareId]` routes, or just `/`? | ✓ |

---

## Rollout sequencing

| Option | Description | Selected |
|--------|-------------|----------|
| Merge Phase 16 standalone | Accept the temporary gap — low-traffic portfolio project, each phase already ships as its own branch+PR | ✓ |
| Hold Phase 16's branch until Phase 17 is ready | Merge together (combined PR or back-to-back) so production never has a gap | |
| Something else | Feature-flag or fallback approach | |

**User's choice:** Merge Phase 16 standalone (recommended option).
**Notes:** No feature flag, no combined-PR requirement — Phase 16 ships as its own PR per the existing branch-per-phase workflow.

---

## Reset vs loadScenario relationship

| Option | Description | Selected |
|--------|-------------|----------|
| handleReset calls loadScenario(seedA, seedB) | DRY — matches this repo's "no duplicated near-identical logic" convention | ✓ |
| Keep handleReset as its own separate function | Duplicates the same body under a different name, in case semantics diverge later | |

**User's choice:** handleReset calls loadScenario(seedA, seedB) (recommended option).
**Notes:** handleReset still computes seedA/seedB itself; it delegates only the apply step to loadScenario.

---

## Verification scope

| Option | Description | Selected |
|--------|-------------|----------|
| Cover both routes | Verify plain "/" AND a saved /s/[shareId] scenario | |
| Plain "/" route only | The refactor doesn't touch initialScenario seeding logic, only the downstream mutation choke point | ✓ |

**User's choice:** Plain "/" route only.
**Notes:** User went against the recommended (more thorough) option here — explicitly scoped verification to the default route since the refactor doesn't touch the seeding logic that differs between the two routes.

---

## Claude's Discretion

- Exact replacement test design for `SandboxContainer.test.tsx`'s removed chip-dependent tests (must cover `loadScenario()` behavior, not reference removed UI).
- Minor internal structuring of `handleReset`'s `seedA`/`seedB` computation, as long as it delegates the apply step to `loadScenario`.

## Deferred Ideas

None — discussion stayed within phase scope. Phase 17's Gallery→Sandbox bridge (the first real consumer of `loadScenario()` beyond Reset) is already scoped separately in the roadmap.
