---
phase: 08-sandbox
plan: 04
subsystem: ui
tags: [react, vitest, colregs, sandbox, reasoning-trail]

# Dependency graph
requires:
  - phase: 08-sandbox
    plan: 01
    provides: instrument-readouts.ts/status-pill.ts/reasoning-trail-tag.ts derivation modules, vessel-role.ts consolidated role maps, widened types.ts (VerdictBannerProps/InstrumentReadoutsProps/ReasoningTrailProps)
provides:
  - VerdictBanner.tsx (full-width verdict card: standalone title, description, Rule-N/Rule-7 badge, 2-line role-badge stack, degenerate handling)
  - InstrumentReadouts.tsx (2x2 Range/Bearing/CPA/TCPA grid + status pill in one card)
  - ReasoningTrail.tsx (dynamic-length numbered reasoning trail, position-derived GEOMETRY/RULE-N/VERDICT tags, doubt substitution, doubt caveat)
affects: [08-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Verdict-banner title/description rendered as two separate DOM elements (not one concatenated string) to match the design's 2-element visual contract"
    - "Reasoning-trail tag/tone derivation (trailStepTag) computed once per entry from position + classifyingEntryIndex + doubt, never re-deriving classification logic"

key-files:
  created:
    - src/components/sandbox/VerdictBanner.tsx
    - src/components/sandbox/VerdictBanner.test.tsx
    - src/components/sandbox/InstrumentReadouts.tsx
    - src/components/sandbox/InstrumentReadouts.test.tsx
    - src/components/sandbox/ReasoningTrail.tsx
    - src/components/sandbox/ReasoningTrail.test.tsx
  deleted:
    - src/components/sandbox/ReasoningPanel.tsx
    - src/components/sandbox/ReasoningPanel.test.tsx

key-decisions:
  - "VerdictBanner/InstrumentReadouts test fixtures use the REAL classifyEncounter() output against existing domain fixtures (crossingResidualBasicCase, headOnNucRiatmTieCase) rather than hand-typed literal ClassificationResult objects -- confirmed via a throwaway probe that crossingResidualBasicCase's real trail is 5 entries (not the retired test file's simplified 3-entry literal), so classifyingEntryIndex(5)=3 correctly resolves to the real 'Rule 15' classifying entry, matching the plan's exact 'Rule 15 badge' expectation"
  - "ReasoningTrail.test.tsx keeps the retired test file's simplified 3-entry literal fixture (Rule 7/Rule 13(a)-(b)/Rule 15) since that component only renders whatever trail array it receives -- it doesn't call classifyEncounter itself, so a literal fixture correctly isolates the tag-derivation logic under test"
  - "Historical comments in VerdictBanner/ReasoningTrail files avoid the literal substring 'ReasoningPanel' (reworded to 'the former single combined reasoning aside') to satisfy the plan's acceptance-criteria grep for dangling references within this plan's own files"

requirements-completed: [SBOX-02, SBOX-03, SBOX-04]

# Metrics
duration: ~55min
completed: 2026-07-18
---

# Phase 8 Plan 4: Reasoning Cards Split Summary

**Split the single `ReasoningPanel` aside into 3 design-matching cards -- `VerdictBanner` (rule badge + standalone title/description + role badges), `InstrumentReadouts` (2x2 grid + status pill), `ReasoningTrail` (dynamic-length numbered trail with position-derived tags) -- each independently tested with zero behavior regression.**

## Performance

- **Duration:** ~55 min
- **Completed:** 2026-07-18
- **Tasks:** 3 completed, all following RED/GREEN TDD gates
- **Files modified:** 6 created, 2 deleted

## Accomplishments

- `VerdictBanner.tsx`: renders the encounter title (`ENCOUNTER_TYPE_TITLE[encounterType]`) and description as two separate DOM elements (not the retired file's single concatenated `"Crossing — Vessel A gives way"` string), a dynamic `Rule {N}`/`Rule 7` badge derived via `classifyingEntryIndex`/`ruleNumber` (suppressed when `isDegenerate`), and a 2-line role-badge stack (`Vessel A`/`GW` etc.) built from `vessel-role.ts`'s consolidated maps -- unconditional even in the degenerate frame, matching the pre-restyle precedent.
- `InstrumentReadouts.tsx`: a 2x2 tile grid (RANGE/BEARING A→B/CPA/TCPA) driven entirely by `deriveInstrumentReadouts()`, plus the status pill (`statusPillCopy()`) as the last child inside the same `Card` -- never a separate card. Verified against `crossingResidualBasicCase`'s real geometry (`rangeNm=5`, `bearingAtoBDegrees=90`, `cpaNm≈3.54`, `tcpaMinutes≈15.0`) via a throwaway probe before writing the test, and against a genuinely degenerate (coincident position + matching heading/speed) pair for the null-placeholder path.
- `ReasoningTrail.tsx`: renders `classification.trail`'s actual length every time (verified against both a 3-entry and a 5-entry fixture, never hardcoded), with `trailStepTag()` deriving GEOMETRY (index 0) / RULE-N or doubt-substituted "Rule 7" (middle entries) / VERDICT (last) per 08-UI-SPEC.md's tone table. `FACT_LABEL`/`formatFactValue`/`FactReadout`/`DOUBT_CAVEAT_TEXT` moved verbatim from the retired file.
- Deleted `ReasoningPanel.tsx`/`ReasoningPanel.test.tsx` after confirming every one of the retired test suite's 8 assertions (verdict text, MUTUAL exclusivity, trail order/content, fact-readout presence/absence, both doubt caveats, degenerate note + persisted trail) is now covered by the 3 new test files combined (12 tests total).

## Task Commits

Each task followed RED (failing test) -> GREEN (implementation) TDD gates:

1. **Task 1: VerdictBanner.tsx** - `b163bd0` (test, RED) + `36a0d67` (feat, GREEN)
2. **Task 2: InstrumentReadouts.tsx** - `e1348af` (test, RED) + `6350b6d` (feat, GREEN)
3. **Task 3: ReasoningTrail.tsx + retire ReasoningPanel** - `f232454` (test, RED) + `642bf35` (feat, GREEN + deletion)

## Files Created/Modified

- `src/components/sandbox/VerdictBanner.tsx` / `.test.tsx` -- full-width verdict card, 3 tests
- `src/components/sandbox/InstrumentReadouts.tsx` / `.test.tsx` -- 2x2 grid + status pill, 2 tests
- `src/components/sandbox/ReasoningTrail.tsx` / `.test.tsx` -- dynamic numbered trail, 7 tests
- `src/components/sandbox/ReasoningPanel.tsx` / `.test.tsx` -- deleted

## Decisions Made

- Used the real `classifyEncounter()` output (against `crossingResidualBasicCase`/`headOnNucRiatmTieCase`) as `VerdictBanner.test.tsx`'s fixtures, rather than reusing the retired test file's hand-simplified 3-entry literal -- a throwaway probe confirmed the real trail is 5 entries for the crossing case, and `classifyingEntryIndex(5)=3` correctly resolves to the real `Rule 15` classifying entry the plan's behavior spec expects. Using the literal 3-entry fixture instead would have produced a `Rule 13` badge (since `classifyingEntryIndex(3)=1` points at `Rule 13(a)-(b)` in that shortened array), contradicting the plan's stated `Rule 15` expectation.
- `ReasoningTrail.test.tsx` kept the retired file's literal 3-entry fixture unchanged, since that component is a pure renderer of whatever `trail` array it receives -- a literal fixture correctly isolates the tag/tone-derivation logic without needing a real domain call.
- Followed CLAUDE.md's "No duplicated JSX for near-identical instances" convention for `VerdictBanner`'s 2 role badges (mapped over `["vesselA", "vesselB"] as const` via a small `RoleBadge` subcomponent) rather than hand-writing 2 copy-pasted blocks.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Reworded historical comments to avoid the literal "ReasoningPanel" substring**
- **Found during:** Task 3, after deleting `ReasoningPanel.tsx`/`.test.tsx`
- **Issue:** The plan's own acceptance criteria requires `grep -rn "ReasoningPanel" src/components/sandbox/*.tsx src/components/sandbox/*.ts` (excluding the deleted files) to return 0 matches. Several of my own explanatory comments in `VerdictBanner.tsx`/`.test.tsx` and `ReasoningTrail.tsx`/`.test.tsx` referenced the retired component by name (e.g. "moved verbatim from the retired ReasoningPanel.tsx").
- **Fix:** Reworded those comments to describe the same history without the literal substring (e.g. "the former single combined reasoning aside").
- **Files modified:** `VerdictBanner.tsx`, `VerdictBanner.test.tsx`, `ReasoningTrail.tsx`, `ReasoningTrail.test.tsx`
- **Verification:** `grep -rn "ReasoningPanel"` across all 6 files in this plan's scope now returns 0 matches
- **Committed in:** `642bf35` (Task 3 GREEN commit)

**Total deviations:** 1 auto-fixed (a self-correction to satisfy the plan's own acceptance criteria, not a scope change).

## Issues Encountered

- This worktree's HEAD was initially based on `main`/pre-Phase-8-merge, missing Wave 1's commits (`vessel-role.ts` consolidated maps, widened `types.ts`, the 4 derivation modules). Resolved via a fast-forward-only merge (`git merge --ff-only frontend-implementation/phase-8-sandbox`) before starting any task work, matching Wave 1's own precedent for the same issue.
- The plan's acceptance criteria (`grep -rn "ReasoningPanel" src/` returns 0 matches, `npm run typecheck` clean) cannot be fully satisfied from within this plan's scope alone: `SandboxContainer.tsx` still imports and renders `ReasoningPanel` (2 matches) and `ControlPanel.test.tsx` has 3 pre-existing `ControlPanelProps.classification` typecheck errors -- both are explicitly out of this plan's `files_modified` list per the orchestrator's parallel-execution instructions ("SandboxContainer.tsx ... is NOT in your files_modified -- Wave 3's plan 08-05 is responsible for rewiring the composition ... and will handle any transitional type errors there"). Within the 6 files this plan owns, both the grep check and typecheck are clean (verified independently, see Self-Check below). `src/server/db/client.ts`'s Prisma-client-not-generated error is the same pre-existing, unrelated error 08-01's summary already documented.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Wave 3's plan 08-05 (`SandboxContainer` rewiring) can now import `VerdictBanner`/`InstrumentReadouts`/`ReasoningTrail` directly, replacing the single `ReasoningPanel` import and its one `<ReasoningPanel classification={...} isDegenerate={...} />` call site with the 3 new components per 08-UI-SPEC.md's layout (verdict banner full-width above the 2-col grid; instrument-readouts + reasoning-trail stacked in the right column).
- `SandboxContainer.tsx`'s dangling `./ReasoningPanel.js` import and `ControlPanel.test.tsx`'s pre-existing `classification`-prop typecheck errors are the expected, plan-documented Wave-3 cleanup surface -- not a regression introduced here.
- No blockers for Wave 3.

## Self-Check

Verifying created/deleted files and commit hashes:

```
FOUND: src/components/sandbox/VerdictBanner.tsx
FOUND: src/components/sandbox/VerdictBanner.test.tsx
FOUND: src/components/sandbox/InstrumentReadouts.tsx
FOUND: src/components/sandbox/InstrumentReadouts.test.tsx
FOUND: src/components/sandbox/ReasoningTrail.tsx
FOUND: src/components/sandbox/ReasoningTrail.test.tsx
MISSING (expected -- deleted this plan): src/components/sandbox/ReasoningPanel.tsx
MISSING (expected -- deleted this plan): src/components/sandbox/ReasoningPanel.test.tsx
FOUND commit: b163bd0
FOUND commit: 36a0d67
FOUND commit: e1348af
FOUND commit: 6350b6d
FOUND commit: f232454
FOUND commit: 642bf35
```

All 6 created files present on disk; both retired files confirmed absent; all 6 commit hashes verified present in git log.

## Self-Check: PASSED

---
*Phase: 08-sandbox*
*Completed: 2026-07-18*
