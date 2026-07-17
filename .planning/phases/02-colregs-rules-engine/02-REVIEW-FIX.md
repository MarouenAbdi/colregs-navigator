---
phase: 02-colregs-rules-engine
fixed_at: 2026-07-16T10:20:36Z
review_path: .planning/phases/02-colregs-rules-engine/02-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 02: Code Review Fix Report

**Fixed at:** 2026-07-16T10:20:36Z
**Source review:** .planning/phases/02-colregs-rules-engine/02-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 5 (1 critical, 4 warnings — Info findings IN-01/IN-02 excluded per `fix_scope: critical_warning`)
- Fixed: 5
- Skipped: 0

## Fixed Issues

### CR-01: Rule 18 vessel-type hierarchy incorrectly overrides genuine overtaking situations (violates Rule 13(a))

**Files modified:** `src/domain/colregs/classify-encounter.ts`, `src/domain/colregs/classify-encounter.fixtures.ts`, `src/domain/colregs/classify-encounter.test.ts`
**Commit:** `6c72cf7`
**Status:** fixed: requires human verification
**Applied fix:** Split Stage 6's dispatch into three explicit branches (`head-on` / `overtaking` / `crossing`) instead of `head-on` vs. an `else` that applied `rule18Overrides()` uniformly to both crossing and overtaking. The new `overtaking` branch never calls `rule18Overrides()` and instead pushes a `Rule 13(a)` trail entry explaining that Rule 13(a) overrides Rules 4-18. Added `overtakingRule18NoOverrideCase` (fishing vessel overtaking a power-driven vessel) and a matching test asserting `giveWay` stays on the overtaking vessel (`vesselB`) despite `fishing` outranking `power-driven` in the Rule 18 hierarchy. Flagged for human verification because this is a domain-correctness/legal-interpretation change to the core classification algorithm — the fix matches the review's cited Rule 13(a) text and passes the added regression test, but a maritime-domain sanity check is warranted given the project's stated "if this reasoning is wrong, nothing else matters" bar.

### WR-01: Sticky-overtaking hysteresis path never evaluates doubt

**Files modified:** `src/domain/colregs/classify-encounter.ts`, `src/domain/colregs/classify-encounter.fixtures.ts`, `src/domain/colregs/classify-encounter.test.ts`
**Commit:** `ba7f0ae`
**Status:** fixed: requires human verification
**Applied fix:** The sticky-overtaking branch (`effectivePrevious === "overtaking"`) previously hardcoded `doubt = false`. Now it tracks the larger-magnitude bearing that drives the existing direction tie-break (`stickyTriggeringBearing`) and computes `doubt` against the 112.5 deg boundary the same way Stage 3 does for a fresh classification. Added `overtakingHysteresisNearBoundaryCase` (bearing 110 deg, within 5 deg of the 112.5 deg boundary, Rule 7 gate holds via a sub-1.0nm DCPA) and a test asserting `doubt: true` / `doubtBoundary: "near-overtaking-crossing-boundary"`. Flagged for human verification because this changes the sticky path's actual `doubt` output (previously always `false`) — worth a maintainer sign-off that this is the desired behavior rather than the intentional simplification the reviewer considered possible.

### WR-02: Untested branch precedence when both vessels simultaneously satisfy the Rule 13 "abaft the beam" test

**Files modified:** `src/domain/colregs/classify-encounter.ts`, `src/domain/colregs/classify-encounter.fixtures.ts`, `src/domain/colregs/classify-encounter.test.ts`
**Commit:** `8ac8a95`
**Status:** fixed
**Applied fix:** Chose option (a) from the review's fix guidance: documented, rather than changed, the existing `bOvertakesA`-wins tie-break. Added an inline comment at the Stage 3 dispatch site explaining that both conditions can hold simultaneously only when two vessels are heading directly apart along the same line (each sees the other dead astern), and that Rule 7's `riskOfCollision` gate already excludes this diverging geometry from any real give-way consequence. Added `overtakingBothTrueDivergingCase` (vesselA heading 180 away from vesselB to its north, vesselB heading 0 away from vesselA to its south — both relative bearings compute to exactly 180 deg) and a test confirming the existing precedence (`giveWay: "vesselB"`) and that Rule 7 reports `riskOfCollision: false` for this geometry, consistent with the documented rationale. No behavior change — dispatch precedence is unchanged, only documented and now covered by a regression test.

### WR-03: Comment asserting "rbAtoB is never exactly 0" at Stage 5 is factually incorrect; the resulting tie-break is untested

**Files modified:** `src/domain/colregs/classify-encounter.ts`, `src/domain/colregs/classify-encounter.fixtures.ts`, `src/domain/colregs/classify-encounter.test.ts`
**Commit:** `582378f`
**Status:** fixed
**Applied fix:** Replaced the incorrect comment (which claimed Stage 4 excludes any exact-0 `rbAtoB` case) with an accurate one explaining that Stage 4's head-on exclusion requires BOTH bearings within +/-5 deg, so a one-sided dead-ahead bearing (`rbAtoB === 0` with a non-reciprocal `rbBtoA`) can still reach Stage 5. Added `deadAheadNonReciprocalCase` (vesselA heading 0 with vesselB dead ahead at `rbAtoB = 0`, vesselB heading 120 producing a non-reciprocal `rbBtoA = 60`) and a test pinning the existing tie-break (`giveWay: "vesselB"`, `doubt: false`). Did not add a new `doubt`/`DoubtBoundary` value for this case — the review flagged that as a "may also warrant" consideration requiring a new `DoubtBoundary` enum member and a broader design decision beyond the two concrete asks (fix the comment, add a pinning test), so it is left as a follow-up for the maintainer to decide rather than introduced unilaterally here. No behavior change — the Stage 5 tie-break logic itself is untouched.

### WR-04: `headOnGenuineCase`'s `expectedRiskOfCollision` is defined but never asserted

**Files modified:** `src/domain/colregs/classify-encounter.test.ts`
**Commit:** `cd0a4a6`
**Status:** fixed
**Applied fix:** Added `expect(result.value.riskOfCollision).toBe(headOnGenuineCase.expectedRiskOfCollision);` to the "classifies a genuine head-on encounter..." test block. Pure test addition, no production code change.

## Skipped Issues

None — all in-scope findings were fixed.

---

_Fixed: 2026-07-16T10:20:36Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
