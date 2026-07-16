---
phase: 02-colregs-rules-engine
verified: 2026-07-16T11:30:00Z
status: human_needed
score: 8/8 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Confirm Rule 13(a) precedence over Rule 18 (CR-01 fix) is the legally correct COLREGS interpretation for this project's scope"
    expected: "An overtaking vessel always gives way regardless of vessel type, per Rule 13(a)'s 'notwithstanding anything contained in Rules 4 to 18, inclusive' language. classifyEncounter() must never apply Rule 18's vessel-type hierarchy to an 'overtaking' encounterType."
    why_human: "This is a maritime-law/domain-correctness judgment on the project's core value proposition ('if this reasoning is wrong, nothing else matters'). The code-review-fix step (02-REVIEW-FIX.md, commit 6c72cf7) explicitly flagged this as 'requires human verification' rather than closing it as a routine fix. The verifier independently confirmed the code change matches the cited Rule 13(a) text and is covered by a passing regression test (CR-01 regression, classify-encounter.test.ts:319-332), but a maintainer sign-off on the legal interpretation itself is what the executor asked for and grep/test inspection cannot substitute for that judgment call."
  - test: "Confirm the sticky-overtaking hysteresis path should now raise doubt near the 112.5deg boundary (WR-01 fix) rather than always reporting doubt:false"
    expected: "overtakingHysteresisNearBoundaryCase (bearing 110deg while sticky) reports doubt:true, doubtBoundary:'near-overtaking-crossing-boundary' -- confirm this is the intended UX/domain behavior, not just an internally-consistent code change."
    why_human: "Same class of judgment as above -- 02-REVIEW-FIX.md explicitly flagged this fix (commit ba7f0ae) as 'requires human verification' because it changes previously-always-false output to sometimes-true. The verifier confirmed the change is internally consistent with Stage 3's doubt logic and is regression-tested, but the original design intent (was doubt:false in the sticky path deliberate simplification, per the reviewer's WR-01 alternative fix option?) is a product/domain call, not a code-correctness one."
---

# Phase 2: COLREGS Rules Engine Verification Report

**Phase Goal:** Given any two-vessel scenario, the system correctly classifies the encounter and determines give-way/stand-on with a transparent reasoning trail — the project's core value — validated against textbook fixtures before any UI exists.
**Verified:** 2026-07-16T11:30:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `classifyEncounter()` classifies head-on/crossing/overtaking per Rules 12-15 using relative bearing computed in BOTH directions against a textbook fixture suite (CLAS-01) | VERIFIED | `classify-encounter.ts:49-58` calls `relativeBearing(vesselA,vesselB)` AND `relativeBearing(vesselB,vesselA)`; both feed Stage 3/4 dispatch. 21 tests in `classify-encounter.test.ts` pass, including swapped-argument symmetry and one-sided-bearing (Pitfall 2) regression tests. |
| 2 | Overtaking evaluated before head-on/crossing (Rule 13 precedence); sticky overtaking holds while Rule 7 gate passes and fully RELEASES (not softens) the instant it fails (CLAS-02, D-01-D-04) | VERIFIED | `classify-encounter.ts:97` checks `effectivePrevious==='overtaking'` before Stage 3-5 run at all (Stage 2 short-circuits). `effectivePrevious` is set to `undefined` outright when the Rule 7 gate fails (line 89), proven by `overtakingHysteresisReleasesCase` deep-equal test against the no-`previous` case (passing). |
| 3 | Diverging/parallel vessels (Rule 7 gate fails: no-closure, negative TCPA, or DCPA > 1.0nm) never receive `riskOfCollision=true` (CLAS-03) | VERIFIED | `riskOfCollision()` requires `tcpaMinutes > 0 && dcpaNm <= 1.0` (both conditions, inclusive threshold); `!cpaResult.ok` (no-closure) returns `false` unconditionally. 5/5 tests in `risk-of-collision.test.ts` pass including exact-threshold-boundary and negative-TCPA-no-grace-window cases. |
| 4 | Near-boundary cases at 112.5deg and 0deg edges return one definite `EncounterType` plus an explicit doubt flag identifying the boundary, never a 4th ambiguous type (CLAS-04) | VERIFIED | `EncounterType` has exactly 3 members (`grep -c "'ambiguous'"` = 0 confirmed). Doubt-band tests at 110deg/115deg/5deg/5.5deg all pass with correct `doubtBoundary` values. |
| 5 | Rule 18 vessel-type hierarchy overrides the geometric baseline for crossing/overtaking, and assigns give-way/stand-on for head-on ONLY when priority tiers differ; NUC/RIATM co-equal and same-tier stay null/null (DETM-01, DETM-02) | VERIFIED (with correction) | Stage 6 now has 3 explicit branches (head-on / overtaking / crossing) at `classify-encounter.ts:234-291`. Crossing correctly applies `rule18Overrides()`. Head-on assigns give-way/stand-on only when `vesselPriority(A) !== vesselPriority(B)`. **Overtaking now deliberately does NOT apply Rule 18** (see CR-01 fix below) — this is a correction of the original plan's literal wording ("applies... for crossing/overtaking") to match actual COLREGS Rule 13(a) precedence, verified correct against cited rule text and covered by `CR-01 regression` test. |
| 6 | Every `ClassificationResult` carries an ordered reasoning trail (ruleId+text+facts) built inline at each dispatch stage in Rule7->13->14->15->18 order, never re-derived (RSON-02) | VERIFIED | `trail.push(...)` calls appear at every stage that executes (Stage 1 Rule 7, Stage 2/3 Rule 13, Stage 4 Rule 14, Stage 5 Rule 15, Stage 6 Rule 18/13(a)) — single local `trail` array accumulated in place, never recomputed post-hoc. |
| 7 | `riskOfCollision()`/`vesselPriority()`/`rule18Overrides()` isolated, independently fixture-tested primitives exist for Plan 02 to compose (Plan 01 must-have) | VERIFIED | `src/domain/colregs/risk-of-collision.ts`, `vessel-priority.ts` exist, substantive (not stubs), 5+5=10 passing tests, zero circular imports with `types.ts` confirmed by direct read. |
| 8 | `types.ts` exports the six contracts Plan 02 needs with zero implementation logic (Plan 01 must-have) | VERIFIED | `types.ts` exports exactly `EncounterType`, `VesselLabel`, `DoubtBoundary`, `ReasoningTrailEntry`, `GiveWayResult`, `ClassificationResult` — 6 exports, 0 implementation statements, imported successfully by `classify-encounter.ts`. |

**Score:** 8/8 truths verified (2 carry a human-verification flag on the underlying domain-correctness judgment, see below)

### Critical Bug Fix Verification (CR-01)

The 02-REVIEW.md flagged a **critical** domain-correctness bug: Rule 18's vessel-type hierarchy was being applied uniformly to crossing AND overtaking encounters, violating Rule 13(a)'s explicit "notwithstanding anything contained in Rules 4 to 18" precedence. This was not a claim taken on faith — the fix was independently confirmed present in the current code:

- `classify-encounter.ts:262-270` — dedicated `overtaking` branch that pushes a `Rule 13(a)` trail entry and explicitly does **not** call `rule18Overrides()`.
- `classify-encounter.fixtures.ts:449` — `overtakingRule18NoOverrideCase` (fishing vessel overtaking a power-driven vessel).
- `classify-encounter.test.ts:319-332` — "CR-01 regression" test asserts `giveWay` stays on the overtaking vessel (`vesselB`) despite `fishing` outranking `power-driven` in the Rule 18 hierarchy; **test passes**.
- Full test suite run by the verifier (not sourced from SUMMARY.md): `npx vitest run` → **100/100 tests pass**, `npx tsc --noEmit` → **zero errors**.

This is flagged in Human Verification below only because the fix constitutes a legal/domain-interpretation judgment on the project's stated core value, and the executor's own review-fix step explicitly requested a maintainer sign-off rather than closing it as routine — not because any code or test evidence is missing or in doubt.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/domain/colregs/types.ts` | 6 named type exports, no logic | VERIFIED | 6 exports confirmed, doc-commented, no circular imports |
| `src/domain/colregs/risk-of-collision.ts` | `riskOfCollision()`, `RISK_OF_COLLISION_DCPA_THRESHOLD_NM` | VERIFIED | Both present, both-conditions-required logic correct |
| `src/domain/colregs/risk-of-collision.fixtures.ts` | Re-exported Phase 1 cases + 2 new boundary fixtures | VERIFIED | `dcpaAtThresholdCase`, `dcpaOverThresholdCase` present with worked math |
| `src/domain/colregs/risk-of-collision.test.ts` | 5 tests covering D-05-D-08 | VERIFIED | 5/5 passing |
| `src/domain/colregs/vessel-priority.ts` | `vesselPriority()`, `rule18Overrides()` | VERIFIED | Both present, correct comparison direction (`<`) |
| `src/domain/colregs/vessel-priority.fixtures.ts` | Priority-tier + 4 override fixtures | VERIFIED | All 5 tiers + 4 override cases present |
| `src/domain/colregs/vessel-priority.test.ts` | Tier ranking + tie-break tests | VERIFIED | 5/5 passing |
| `src/domain/colregs/classify-encounter.ts` | `classifyEncounter(vesselA, vesselB, previous?): Result<ClassificationResult>` | VERIFIED | Full 6-stage dispatch present, matches signature, imports all composed primitives |
| `src/domain/colregs/classify-encounter.fixtures.ts` | Hand-derived fixtures covering all decision clusters | VERIFIED | 20+ named fixtures including all review-fix regression cases |
| `src/domain/colregs/classify-encounter.test.ts` | Full dispatch test suite | VERIFIED | 21 tests across 7 `describe` blocks, all passing |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `risk-of-collision.ts` | `shared/result.ts` | `Result<T>` import | WIRED | `import type { Result } from "../shared/result.js"` confirmed |
| `vessel-priority.ts` | `vessel/vessel.ts` | `VesselType` import | WIRED | `import type { VesselType } from "../vessel/vessel.js"` confirmed |
| `classify-encounter.ts` | `risk-of-collision.ts` | `riskOfCollision(cpaResult)` in Stage 1 | WIRED | Exactly 1 call site confirmed (`grep -c` = 1, per plan's own acceptance criterion) |
| `classify-encounter.ts` | `vessel-priority.ts` | `rule18Overrides()`/`vesselPriority()` in Stage 6 | WIRED | 6 call sites across head-on and crossing branches (overtaking branch correctly omits) |
| `classify-encounter.ts` | `geometry/relative-bearing.ts` | `relativeBearing()` both directions | WIRED | 4 call sites (Stage 0 x2, doc comments) |
| `classify-encounter.ts` | `geometry/cpa.ts` | `cpa(A,B)` once | WIRED | 3 references (1 call + trail/comment usages), single Stage-0 call site confirmed by direct read |

### Behavioral Spot-Checks / Test Execution

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Phase 2 domain unit tests | `npx vitest run src/domain/colregs` | 3 files, 35 tests passed | PASS |
| Full project test suite (no regressions) | `npx vitest run` | 10 files, 100 tests passed | PASS |
| Type safety across `src/domain/` | `npx tsc --noEmit -p tsconfig.json` | zero errors | PASS |
| CR-01 critical fix regression | test case in `classify-encounter.test.ts:319` | passes | PASS |
| Commit hashes cited in SUMMARY/REVIEW-FIX exist | `git log --oneline --all \| grep <hashes>` | all 12 hashes found | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| CLAS-01 | 02-02 | Classify head-on/crossing/overtaking via relative bearing | SATISFIED | Stage 3/4/5 dispatch, both-direction bearing, fixture-tested |
| CLAS-02 | 02-02 | Overtaking evaluated first, no flip-flop on drift | SATISFIED | Stage 2 sticky-overtaking short-circuit, hysteresis hold/release tests pass |
| CLAS-03 | 02-01, 02-02 | Rule 7 risk gate | SATISFIED | `riskOfCollision()` both-conditions gate, consumed once in Stage 1 |
| CLAS-04 | 02-02 | Doubt/ambiguous state at boundaries, no hard cutoff | SATISFIED | `doubt`/`doubtBoundary` fields populated at both boundaries, inclusive edges tested |
| DETM-01 | 02-02 | Give-way/stand-on determination per Rules 13/14/15/17 | SATISFIED | Stage 3-5 baseline assignment, Stage 6 override |
| DETM-02 | 02-01, 02-02 | Rule 18 hierarchy override, NUC/RIATM co-equal | SATISFIED | `vesselPriority()` table, `rule18Overrides()`, Stage 6 head-on/crossing branches, NUC/RIATM tie test passes |
| RSON-02 | 02-02 | Reasoning trail as byproduct of same evaluation path | SATISFIED | Inline `trail.push()` at every executed stage, no post-hoc derivation |

All 7 requirement IDs declared in `02-01-PLAN.md`/`02-02-PLAN.md` frontmatter are accounted for and match `.planning/REQUIREMENTS.md`'s Phase 2 mapping exactly (CLAS-01 through CLAS-04, DETM-01, DETM-02, RSON-02) — no orphaned requirements found.

**Note:** `.planning/REQUIREMENTS.md`'s checklist still shows these 7 items as unchecked (`- [ ]`) and "Pending" in the traceability table. This is a documentation-sync gap, not a code gap — both SUMMARY.md files' `requirements-completed` frontmatter correctly lists all 7 IDs, and the code evidence above independently confirms each is satisfied. Recommend updating REQUIREMENTS.md's checkboxes/traceability table as a follow-up (not blocking).

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `types.ts` | 55-58 | `GiveWayResult` interface exported but never imported/used anywhere in `src/` (IN-01 from 02-REVIEW.md) | Info | Dead code; explicitly left unfixed per review-fix's `fix_scope: critical_warning` (Info findings excluded by design). Not a functional gap. |
| `vessel-priority.ts` | 15-24 | Single-quote string literals deviate from codebase's double-quote convention, justified by a comment referencing "this plan's exact acceptance-criteria grep pattern" rather than a linter config (IN-02 from 02-REVIEW.md) | Info | Cosmetic; fragile coupling to a grading regex, flagged by reviewer, left unfixed (Info scope). Not a functional gap. |

No TBD/FIXME/XXX/TODO/HACK/PLACEHOLDER markers found in any Phase 2 file (`grep` scan of `src/domain/colregs/` returned zero matches).

### Human Verification Required

### 1. Rule 13(a) precedence over Rule 18 for overtaking (CR-01 fix)

**Test:** Review `classify-encounter.ts`'s Stage 6 `overtaking` branch (lines 262-270) and confirm that an overtaking vessel must always give way regardless of vessel type, per Rule 13(a)'s "notwithstanding anything contained in Rules 4 to 18, inclusive" language.
**Expected:** Sign-off that this is the legally/domain-correct behavior for the project's stated scope (Rules 7, 13-15, 18).
**Why human:** This is a maritime-law interpretation directly tied to the project's stated core value ("if this reasoning is wrong, nothing else matters"). The executor's own `02-REVIEW-FIX.md` explicitly marked this fix `requires human verification` rather than closing it routinely. The verifier confirmed the code matches the cited rule text and passes a dedicated regression test, but the legal-interpretation sign-off itself was explicitly deferred to a human by the workflow, and code inspection cannot substitute for that judgment.

### 2. Doubt flag in sticky-overtaking hysteresis path (WR-01 fix)

**Test:** Review whether `overtakingHysteresisNearBoundaryCase` correctly reporting `doubt:true` when the sticky path's current bearing drifts near the 112.5deg boundary is the intended behavior, versus the reviewer's alternative suggestion of leaving the sticky path's doubt hardcoded to `false` with a documenting comment.
**Expected:** Sign-off that raising doubt in the sticky path (rather than suppressing it) is the desired UX/domain behavior.
**Why human:** `02-REVIEW-FIX.md` explicitly flagged this as `requires human verification` because it changes previously-always-`false` output to sometimes-`true`, a behavior change to what a maintainer sees/relies on, not a pure bug fix with one obviously-correct answer.

### Gaps Summary

No blocking gaps. All 8 must-have truths (roadmap Success Criteria 1-5 plus Plan 01's 3 supporting-primitive truths) are verified against the actual codebase: files exist, are substantive (not stubs — extensive worked-math comments, no placeholder returns), are correctly wired (composition confirmed by direct import/call-site inspection), and pass 100/100 tests with zero TypeScript errors. The one critical domain-correctness bug found by code review (Rule 18 incorrectly overriding Rule 13's overtaking precedence) has a fix that is verifiably present in the current code — not just claimed in SUMMARY.md — with a dedicated regression test that passes.

Two items are routed to human verification rather than marked as gaps: both are the two review-fix items the executor itself explicitly flagged as needing a maintainer's domain/legal sign-off (CR-01 and WR-01), not because any code, test, or wiring evidence is missing.

---

*Verified: 2026-07-16T11:30:00Z*
*Verifier: Claude (gsd-verifier)*
