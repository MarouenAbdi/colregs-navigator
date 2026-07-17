---
phase: 02-colregs-rules-engine
reviewed: 2026-07-15T11:24:39Z
depth: standard
files_reviewed: 10
files_reviewed_list:
  - src/domain/colregs/classify-encounter.fixtures.ts
  - src/domain/colregs/classify-encounter.test.ts
  - src/domain/colregs/classify-encounter.ts
  - src/domain/colregs/risk-of-collision.fixtures.ts
  - src/domain/colregs/risk-of-collision.test.ts
  - src/domain/colregs/risk-of-collision.ts
  - src/domain/colregs/types.ts
  - src/domain/colregs/vessel-priority.fixtures.ts
  - src/domain/colregs/vessel-priority.test.ts
  - src/domain/colregs/vessel-priority.ts
findings:
  critical: 1
  warning: 4
  info: 2
  total: 7
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-07-15T11:24:39Z
**Depth:** standard
**Files Reviewed:** 10
**Status:** issues_found

## Summary

Reviewed the Phase 2 COLREGS rules-engine layer (`classifyEncounter()`, `riskOfCollision()`, `vesselPriority()`/`rule18Overrides()`, their fixtures, tests, and type contracts). The 31 existing unit tests all pass, and most of the fixture-derived trigonometry was independently re-derived and checked by hand — it is correct.

However, one finding is a genuine domain-correctness bug that goes directly against the project's stated core value ("correctly classify... under COLREGS... If this reasoning is wrong or opaque, nothing else about the project matters"): **Rule 18's vessel-type hierarchy is applied to overtaking encounters**, but real COLREGS Rule 13(a) explicitly states the overtaking rule applies "notwithstanding anything contained in Rules 4 to 18" — i.e. Rule 13 is supposed to override Rule 18, not the other way around. I wrote and ran a targeted regression test (not committed) that reproduces this: a `fishing` vessel genuinely overtaking a `power-driven` vessel gets its give-way obligation incorrectly flipped onto the vessel being overtaken. No existing fixture exercises this overtaking + Rule 18 interaction, which is why the bug shipped with all tests green.

Several smaller edge-case gaps and a couple of code-quality nits round out the rest of the findings.

## Critical Issues

### CR-01: Rule 18 vessel-type hierarchy incorrectly overrides genuine overtaking situations (violates Rule 13(a))

**File:** `src/domain/colregs/classify-encounter.ts:234-253`
**Issue:**
Stage 6's `else` branch (everything that isn't `head-on`) applies `rule18Overrides()` uniformly to both `crossing` and `overtaking` encounter types:

```ts
} else {
  // crossing/overtaking: giveWay/standOn are non-null vessel labels here.
  const giveWayVessel = giveWay === "vesselA" ? vesselA : vesselB;
  const standOnVessel = standOn === "vesselA" ? vesselA : vesselB;
  if (rule18Overrides(giveWayVessel.type, standOnVessel.type)) {
    const previousGiveWay = giveWay;
    giveWay = standOn;
    standOn = previousGiveWay;
    ...
```

Real COLREGS Rule 13(a) reads: *"Notwithstanding anything contained in Rules 4 to 18, inclusive, any vessel overtaking any other shall keep out of the way of the vessel being overtaken."* This is the one rule in the entire steering-and-sailing subpart that explicitly overrides Rule 18's vessel-type hierarchy. Applying `rule18Overrides()` to `crossing` (Rule 15) and `head-on` (Rule 14) is correct; applying it to `overtaking` (Rule 13) is not.

I verified this concretely with a standalone test (not committed to the repo, deleted after verification):
- `vesselA` (`power-driven`) at rest, `vesselB` (`fishing`) approaching from `150°` relative bearing (a genuine, well-inside-the-sector overtaking geometry, same construction as the existing `overtakingBothDirectionsCase` fixture but with `vesselB.type = "fishing"`).
- Expected (per Rule 13(a)): `giveWay: "vesselB"` (the overtaking vessel, `fishing`, must give way — vessel type is irrelevant to Rule 13).
- Actual: `giveWay: "vesselA"` — the code flips the verdict because `fishing` (priority 2) outranks `power-driven` (priority 4) in `rule18Overrides()`, producing a legally incorrect verdict for a real overtaking scenario.

This is exactly the class of bug the project's CLAUDE.md flags as fatal to the whole portfolio's value proposition: the app would confidently cite "Rule 18(a)-(c) override" and tell the fishing vessel it has right of way, when maritime law says the opposite.

No fixture in `classify-encounter.fixtures.ts` exercises an overtaking encounter with differing Rule 18 priority tiers (`crossingRule18OverrideCase`/`crossingRule18NonOverrideCase`/`headOnRule18OverrideCase` cover crossing and head-on only), so this regression has no test coverage today.

**Fix:** Skip the Rule 18 override entirely when `encounterType === "overtaking"` — the geometric Rule 13 verdict is final regardless of vessel type:

```ts
if (encounterType === "head-on") {
  // ... unchanged ...
} else if (encounterType === "crossing") {
  // existing rule18Overrides() logic, unchanged
} else {
  // overtaking: Rule 13(a) applies "notwithstanding anything contained in
  // Rules 4 to 18" -- the overtaking vessel always gives way, vessel type
  // is irrelevant. Do not call rule18Overrides() here.
  trail.push({
    ruleId: "Rule 13(a)",
    text: "Rule 18 does not apply to an overtaking situation: Rule 13(a) overrides Rules 4-18, so the overtaking vessel gives way regardless of vessel type.",
    facts: { vesselAType: vesselA.type, vesselBType: vesselB.type },
  });
}
```

Add a fixture/test pairing the existing overtaking geometry with mismatched Rule 18 tiers (e.g. `fishing` overtaking `power-driven`) asserting `giveWay` stays on the overtaking vessel.

## Warnings

### WR-01: Sticky-overtaking hysteresis path never evaluates doubt, even when the current bearing is deep inside another sector's doubt band

**File:** `src/domain/colregs/classify-encounter.ts:97-114`
**Issue:** Every other classification stage (Rule 13 fresh, Rule 14, Rule 15) computes `doubt`/`doubtBoundary` from the actual bearing magnitude relative to the 112.5°/0° boundaries. The sticky-overtaking branch (`effectivePrevious === "overtaking"`) unconditionally sets `doubt = false` at line 114, regardless of how close the current bearings are to a boundary. There's no comment explaining why doubt tracking is intentionally skipped here (unlike the doubt logic elsewhere, which is heavily commented), and no fixture exercises a sticky-overtaking case near a boundary to confirm this is deliberate rather than an oversight.
**Fix:** Either compute doubt using the same boundary-distance logic as Stage 3 (bearing magnitude vs. 112.5°), or add an explicit comment citing the design decision (e.g. "hysteresis suppresses doubt because the classification itself is not being freshly derived from geometry this tick") so a future maintainer doesn't mistake this for a bug when auditing doubt-flag behavior.

### WR-02: Untested branch precedence when both vessels simultaneously satisfy the Rule 13 "abaft the beam" test

**File:** `src/domain/colregs/classify-encounter.ts:118-145`
**Issue:** `bOvertakesA` and `aOvertakesB` are computed independently (by design, per the Pitfall 1 comment), but the dispatch (`if (bOvertakesA) { ... } else { ... }` at line 123) silently prefers `bOvertakesA` whenever both are simultaneously true. This is geometrically reachable (e.g. both vessels heading away from each other such that each sees the other dead astern), and produces a give-way verdict that ignores symmetric contrary evidence with no `doubt` flag raised and no trail note acknowledging the ambiguity. No fixture exercises this case.
**Fix:** Add a fixture for the both-true case and either (a) document why `bOvertakesA` precedence is an acceptable arbitrary tie-break (likely because the case only arises for genuinely diverging vessels which Rule 7 will already exclude from `riskOfCollision`), or (b) raise `doubt` when both conditions hold simultaneously.

### WR-03: Comment asserting "rbAtoB is never exactly 0" at Stage 5 is factually incorrect; the resulting tie-break is untested

**File:** `src/domain/colregs/classify-encounter.ts:177-190`
**Issue:** The comment states: *"Dispatch order guarantees rbAtoB is never exactly 0/undefined-boundary here -- Stage 4 already excluded the head-on sector, and Stage 3 already excluded the overtaking sector."* This is incorrect: head-on exclusion (Stage 4) requires **both** `|rbAtoB| <= 5` **and** `|rbBtoA| <= 5`; it is entirely possible for `rbAtoB === 0` exactly while `rbBtoA` is outside `±5°` (and outside the overtaking sector too), e.g. `vesselA` heading `0°` at the origin with `vesselB` positioned due north (dead ahead, `rbAtoB = 0`) but heading `120°` (a genuine crossing course, `rbBtoA = 60°`, worked by hand). In that case Stage 5's `if (rbAtoB > 0)` evaluates `0 > 0` as `false` and falls into the `else` branch, arbitrarily assigning `giveWay = "vesselB"` for a bow-on ("dead ahead") bearing that is not actually resolvable by the port/starboard convention the comment implies is exhaustive. This tie-break is untested, and given the sandbox's likely UI defaults (cardinal headings, snap-to-grid positions), exact-0 relative bearings are a realistic occurrence, not a theoretical footnote — several existing fixtures already produce exact-0 bearings by construction (e.g. `crossingResidualBasicCase`, `overtakingHysteresisHoldsCase`).
**Fix:** Correct the comment to accurately describe the invariant (or remove it if untrue), and add a fixture for the dead-ahead (`rbAtoB === 0`, non-reciprocal `rbBtoA`) case to pin down the intended behavior — this may also warrant a `doubt` flag, since "dead ahead, neither port nor starboard" is itself an ambiguous bow-on encounter.

### WR-04: `headOnGenuineCase`'s `expectedRiskOfCollision` is defined but never asserted

**File:** `src/domain/colregs/classify-encounter.fixtures.ts:123-132`, `src/domain/colregs/classify-encounter.test.ts:124-139`
**Issue:** The fixture declares `expectedRiskOfCollision: true`, but the corresponding test block ("classifies a genuine head-on encounter...") never reads `result.value.riskOfCollision`. The fixtures file's own header comment describes this suite as "the auditable proof-of-correctness suite" — an asserted-but-unchecked expected value undercuts that claim and could silently drift (e.g. if `riskOfCollision` flipped to `false` here, no test would catch it).
**Fix:** Add `expect(result.value.riskOfCollision).toBe(headOnGenuineCase.expectedRiskOfCollision);` to the test block.

## Info

### IN-01: `GiveWayResult` interface is defined but never used

**File:** `src/domain/colregs/types.ts:50-58`
**Issue:** `GiveWayResult` is exported and documented as "the shared give-way/stand-on shape used internally by each dispatch stage's helper functions," but no file in the reviewed set (or the rest of `src/`, confirmed via project-wide search) imports or references it. `classify-encounter.ts` uses plain local `giveWay`/`standOn` variables instead.
**Fix:** Either wire it into `classify-encounter.ts`'s stage helpers as originally intended, or remove the unused export to avoid dead code accumulating in the domain layer.

### IN-02: Quote-style deviation justified by an external grep pattern rather than codebase convention

**File:** `src/domain/colregs/vessel-priority.ts:15-24`
**Issue:** The `PRIORITY` record uses single-quoted string literals, with a comment explicitly stating this is "not the codebase's usual double quotes" and is done "intentionally" to match "this plan's exact acceptance-criteria grep pattern." Coupling source-code style to a specific grading regex (rather than to a linter/formatter config, which doesn't exist in this repo) is fragile: any future reformat (e.g. adding Prettier) will silently break the acceptance check this comment is protecting, and it introduces a one-off style inconsistency for a future reader to puzzle over.
**Fix:** If a runtime/grep contract genuinely requires single quotes here, encode that as an actual test assertion (e.g. a source-text regex test) rather than an unenforced code comment; otherwise switch to double quotes for consistency with the rest of the codebase.

---

_Reviewed: 2026-07-15T11:24:39Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
