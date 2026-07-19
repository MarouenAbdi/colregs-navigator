---
quick_id: 260719-t8r
status: complete
completed: 2026-07-19
---

# Quick Task 260719-t8r: Generate reasoning-trails.json design reference — Summary

**`docs/reasoning-trails.json` catalogs all 7 distinct end-to-end reasoning-trail shapes and both Stage-0 failure reasons `classifyEncounter()` can produce, with every explanatory `text` string copied byte-verbatim from `classify-encounter.ts` — a read-only design-reference deliverable, no application code touched.**

## Accomplishments

- Re-read `src/domain/colregs/classify-encounter.ts` end to end and extracted all 14 distinct literal `text:` strings from its `trail.push({...})` call sites, programmatically verified byte-for-byte against the source (`node -e` substring-containment check over all 14 unique strings — zero mismatches).
- Wrote `docs/reasoning-trails.json` with the exact top-level shape specified in the plan: `meta`, `types` (encounterType, vesselLabel, doubtBoundary, vesselType, vesselPriority, reasoningTrailEntryShape, classificationResultShape, factKeys), `constants`, `stage0Failures` (2 entries), and `reasoningTrails` (7 entries, in the plan's specified order: overtaking-sticky-hysteresis, overtaking-fresh-b-gives-way, overtaking-fresh-a-gives-way, head-on-rule18-override, head-on-mutual-obligation, crossing-rule18-override, crossing-no-rule18-override).
- Confirmed the plan's audit_findings breakdown against a fresh read of the source with no discrepancies — all 7 shapes and both Stage-0 failure reasons trace to real, distinct branches in `classify-encounter.ts`.
- Documented the exact 7 fact keys `ReasoningTrail.tsx`'s `FACT_LABEL` record renders (`riskOfCollision`, `tcpaMinutes`, `dcpaNm`, `relativeBearingAtoB`, `relativeBearingBtoA`, `vesselAType`, `vesselBType`) — no invented/undocumented fact key added.
- Validated the written file parses as JSON via `node -e` and confirmed shape counts (`reasoningTrails.length === 7`, `stage0Failures.length === 2`) match the plan's verification command exactly.

## Task Commits

- `ed81e7b` — docs(260719-t8r): generate reasoning-trails.json design reference

## Files Created/Modified

- `docs/reasoning-trails.json` — new file (new `docs/` directory, none existed before). Only file changed — confirmed via `git status --short` showing only `docs/` as untracked before staging, and `git diff --diff-filter=D` showing no deletions after commit.

## Decisions Made

- **Rule 7's dual text variants (risk / no-risk) represented as an object, not a plain string:** Rule 7's entry always appears first in every shape and has exactly 2 literal text variants. For shapes where `riskOfCollision` is fixed (the sticky-hysteresis shape, always `true`), a single verbatim string is used. For the 6 shapes where `riskOfCollision` is `"either"`, `text` is instead an object `{whenRiskOfCollision, whenNoRisk}` keyed by condition, with both values still verbatim literals from the source. This keeps the `{ruleId, text, facts}` field name consistent across all entries while still surfacing both real literal strings rather than picking one arbitrarily or inventing a third representation. Documented in `meta.note`.
- **`giveWay`/`standOn` described in plain words where they depend on a runtime tie-break** (per the plan's own instruction for the sticky-hysteresis and crossing shapes), rather than a fixed enum value, since the actual vessel label assigned varies per invocation within that one shape.
- **`riskOfCollision: "either"` used for all shapes except overtaking-sticky-hysteresis:** only the sticky-hysteresis shape has an explicit "always true" constraint in the plan's audit_findings (hysteresis is only reachable when Rule 7's gate holds); no other shape has a stated fixed constraint, including shapes where an available example fixture happens to show one particular value (e.g. `overtakingBothTrueDivergingCase` showing `riskOfCollision: false` for the fresh-a-gives-way shape) — treated as "either" rather than over-constraining based on a single example.
- **`stage0Failures[1].exampleFixture` (invalid-input) set to `null`:** the plan's spec says "exampleFixture (fixture export name where available)" and no fixture in `classify-encounter.fixtures.ts` exercises the generic `invalid-input` path at the `classifyEncounter()` level (only `coincident-position` has a dedicated `stage0CoincidentPropagationCase`); `null` documents its genuine absence rather than fabricating one.

## Deviations from Plan

None — plan executed exactly as written. The plan's own `<audit_findings>` block was re-verified against a fresh read of `classify-encounter.ts`, `types.ts`, `vessel-priority.ts`, `risk-of-collision.ts`, `vessel.ts`, `classify-encounter.fixtures.ts`, and `ReasoningTrail.tsx` (plus `relative-bearing.ts`, `cpa.ts`, `bearing.ts`, and `result.ts` for the exact Stage-0 failure-reason strings, which the audit_findings referenced but did not quote verbatim) — no discrepancies found; the source was the single source of truth throughout, as instructed.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required. `docs/reasoning-trails.json` is a static, read-only design-reference file with no runtime dependency.

## Next Phase Readiness

`docs/reasoning-trails.json` is ready for Claude Design to consume as a complete, accurate catalog of every reasoning-trail shape and literal copy the engine produces. No application code was modified; this task has no blocking effect on any other phase or plan.

---
*Quick task: 260719-t8r*
*Completed: 2026-07-19*

## Self-Check: PASSED

- FOUND: `docs/reasoning-trails.json`
- FOUND: commit `ed81e7b` in `git log --oneline --all`
