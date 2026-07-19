/**
 * Hand-derived fixtures for `classifyEncounter()` (D-01 through D-16) -- the
 * auditable proof-of-correctness suite CONTEXT.md calls for. Each fixture
 * documents the worked `relativeBearing()`/`cpa()` derivation behind its
 * expected values inline (transcribed from 02-02-PLAN.md's own worked math,
 * not re-derived here).
 */

import type { Vessel } from "../vessel/vessel.js";
import type { DoubtBoundary, EncounterType, VesselLabel } from "./types.js";
import {
  coincidentPropagationCase as relativeBearingCoincidentPropagationCase,
  crossingCase,
  headOnCase,
} from "../geometry/relative-bearing.fixtures.js";
import { parallelNoClosureCase } from "../geometry/cpa.fixtures.js";

interface ClassificationCase {
  vesselA: Vessel;
  vesselB: Vessel;
  previous?: EncounterType;
  expectedEncounterType: EncounterType;
  expectedRiskOfCollision?: boolean;
  expectedGiveWay: VesselLabel | null;
  expectedStandOn: VesselLabel | null;
  expectedDoubt: boolean;
  expectedDoubtBoundary?: DoubtBoundary;
}

interface PropagationCase {
  vesselA: Vessel;
  vesselB: Vessel;
  expectedReason: "coincident-position" | "invalid-input";
}

// vesselA is being overtaken (heading 000, speed 8); vesselB approaches
// from 150 deg relative bearing (well abaft A's beam, |150| > 112.5) at a
// higher speed (15kn), same geometry shape as Phase 1's overtakingCase
// scaled to 1/10 magnitude so DCPA falls under the 1.0nm threshold.
// relativeBearing(A,B) = 150. cpa(A,B): tcpaMinutes ~= 7.42, dcpaNm ~= 0.5
// (under threshold -> risk of collision holds).
export const overtakingBothDirectionsCase: ClassificationCase = {
  vesselA: {
    position: { x: 0, y: 0 },
    heading: 0,
    speed: 8,
    type: "power-driven",
  },
  vesselB: {
    position: { x: 0.5, y: -0.8660254 },
    heading: 0,
    speed: 15,
    type: "power-driven",
  },
  expectedEncounterType: "overtaking",
  expectedRiskOfCollision: true,
  expectedGiveWay: "vesselB",
  expectedStandOn: "vesselA",
  expectedDoubt: false,
};

// Hysteresis HOLDS (D-02): previous='overtaking' plus a current bearing
// that reads geometrically as crossing (90 deg) must still classify as
// overtaking, as long as Rule 7's gate still passes. relativeBearing(A,B)
// = 90, relativeBearing(B,A) = 0. cpa(A,B): tcpaMinutes = 20, dcpaNm = 0
// (direct collision course -- gate holds). Direction tie-break: |90| >= |0|
// -> vesselB is treated as the overtaking vessel, vesselA as overtaken.
export const overtakingHysteresisHoldsCase: ClassificationCase = {
  vesselA: {
    position: { x: 0, y: 0 },
    heading: 0,
    speed: 0,
    type: "power-driven",
  },
  vesselB: {
    position: { x: 5, y: 0 },
    heading: 270,
    speed: 15,
    type: "power-driven",
  },
  previous: "overtaking",
  expectedEncounterType: "overtaking",
  expectedRiskOfCollision: true,
  expectedGiveWay: "vesselB",
  expectedStandOn: "vesselA",
  expectedDoubt: false,
};

// Hysteresis RELEASES (Pitfall 4 regression, D-02/D-03): identical bearing
// geometry to the HOLDS case above (relativeBearing(A,B) = 90,
// relativeBearing(B,A) = 0 -- relativeBearing depends only on position/
// heading, not speed, so it is unchanged by vesselA's higher speed here),
// but vesselA's speed change alters cpa() enough that the Rule 7 gate now
// FAILS: tcpaMinutes ~= 15.57, dcpaNm ~= 2.353 (over the 1.0nm threshold).
// The sticky overtaking classification must fully release (not soften) to
// fresh geometric classification: crossing, since 90 deg is outside both
// the overtaking sector (112.5 +/- 5) and the head-on sector (0 +/- 5).
export const overtakingHysteresisReleasesCase: ClassificationCase = {
  vesselA: {
    position: { x: 0, y: 0 },
    heading: 0,
    speed: 8,
    type: "power-driven",
  },
  vesselB: {
    position: { x: 5, y: 0 },
    heading: 270,
    speed: 15,
    type: "power-driven",
  },
  previous: "overtaking",
  expectedEncounterType: "crossing",
  expectedRiskOfCollision: false,
  expectedGiveWay: "vesselA",
  expectedStandOn: "vesselB",
  expectedDoubt: false,
};

// WR-02 regression: both bOvertakesA and aOvertakesB are simultaneously
// true -- vesselA and vesselB are positioned on the same line, each heading
// directly away from the other (A heading 180 away from B to its north, B
// heading 0 away from A to its south). relativeBearing(A,B) = 180,
// relativeBearing(B,A) = 180 -- both exceed the 112.5 deg abaft-the-beam
// threshold. `bOvertakesA` wins the dispatch tie-break (documented at the
// Stage 3 dispatch site). cpa(A,B): tcpaMinutes is negative (closest
// approach already passed) -> Rule 7 gate reports no risk, confirming this
// tie-break only arises for genuinely diverging vessels.
export const overtakingBothTrueDivergingCase: ClassificationCase = {
  vesselA: {
    position: { x: 0, y: 0 },
    heading: 180,
    speed: 10,
    type: "power-driven",
  },
  vesselB: {
    position: { x: 0, y: 10 },
    heading: 0,
    speed: 10,
    type: "power-driven",
  },
  expectedEncounterType: "overtaking",
  expectedRiskOfCollision: false,
  expectedGiveWay: "vesselB",
  expectedStandOn: "vesselA",
  expectedDoubt: false,
};

// WR-01 regression: sticky-overtaking hysteresis with the current bearing
// drifted close to the 112.5 deg overtaking/crossing boundary.
// relativeBearing(A,B) = 110, relativeBearing(B,A) = -70. |110| >= |-70| so
// the direction tie-break selects vesselB as the overtaking vessel; the
// triggering bearing for the doubt check is 110, and |110 - 112.5| = 2.5
// <= 5 -> doubt band. cpa(A,B): dcpaNm ~= 0.9397 (under threshold), tcpa
// positive -> Rule 7 gate holds, so hysteresis takes the sticky path.
export const overtakingHysteresisNearBoundaryCase: ClassificationCase = {
  vesselA: {
    position: { x: 0, y: 0 },
    heading: 0,
    speed: 8,
    type: "power-driven",
  },
  vesselB: {
    position: { x: 0.9396926207859084, y: -0.3420201433256687 },
    heading: 0,
    speed: 15,
    type: "power-driven",
  },
  previous: "overtaking",
  expectedEncounterType: "overtaking",
  expectedRiskOfCollision: true,
  expectedGiveWay: "vesselB",
  expectedStandOn: "vesselA",
  expectedDoubt: true,
  expectedDoubtBoundary: "near-overtaking-crossing-boundary",
};

// Genuine head-on: reuse Phase 1's headOnCase vessels directly (D-16 cross-
// phase reuse). Both relativeBearing directions = 0. Same vessel type on
// both sides -> Rule 18 has no tie-break preference -> mutual obligation
// (giveWay/standOn both null).
export const headOnGenuineCase: ClassificationCase = {
  vesselA: headOnCase.own,
  vesselB: headOnCase.contact,
  expectedEncounterType: "head-on",
  expectedRiskOfCollision: true,
  expectedGiveWay: null,
  expectedStandOn: null,
  expectedDoubt: true,
  expectedDoubtBoundary: "near-head-on-boundary",
};

// Pitfall 2 regression: relativeBearing(A,B) = 3 (within the +/-5 head-on
// sector from A's side alone), but relativeBearing(B,A) = 83 (NOT within
// +/-5 from B's side -- non-reciprocal heading, 100 deg vs A's 0 deg is not
// close to a reciprocal 180 deg). The head-on check correctly requires BOTH
// directions -- this must classify as crossing, not head-on.
export const headOnPitfall2OneSidedCase: ClassificationCase = {
  vesselA: {
    position: { x: 0, y: 0 },
    heading: 0,
    speed: 10,
    type: "power-driven",
  },
  vesselB: {
    position: { x: 0.5234, y: 9.9863 },
    heading: 100,
    speed: 10,
    type: "power-driven",
  },
  expectedEncounterType: "crossing",
  expectedGiveWay: "vesselA",
  expectedStandOn: "vesselB",
  expectedDoubt: false,
};

// Basic crossing residual: reuse Phase 1's crossingCase vessels directly.
// relativeBearing(A,B) = 90, relativeBearing(B,A) = 0. Neither overtaking
// (90/0 both under 112.5) nor head-on (90 is far outside +/-5). Same vessel
// type on both sides -> no Rule 18 override.
export const crossingResidualBasicCase: ClassificationCase = {
  vesselA: crossingCase.own,
  vesselB: crossingCase.contact,
  expectedEncounterType: "crossing",
  expectedGiveWay: "vesselA",
  expectedStandOn: "vesselB",
  expectedDoubt: false,
};

// Doubt band, 110 deg (still crossing, D-09): relativeBearing(A,B) = 110
// (<= 112.5, so still crossing not overtaking), relativeBearing(B,A) = 0.
// |110 - 112.5| = 2.5 <= 5 -> within the doubt band of the overtaking/
// crossing boundary.
export const doubtBandNearOvertakingBoundaryCase: ClassificationCase = {
  vesselA: {
    position: { x: 0, y: 0 },
    heading: 0,
    speed: 10,
    type: "power-driven",
  },
  vesselB: {
    position: { x: 9.397, y: -3.42 },
    heading: 290,
    speed: 10,
    type: "power-driven",
  },
  expectedEncounterType: "crossing",
  expectedGiveWay: "vesselA",
  expectedStandOn: "vesselB",
  expectedDoubt: true,
  expectedDoubtBoundary: "near-overtaking-crossing-boundary",
};

// Doubt band, 115 deg (now overtaking, D-09): relativeBearing(A,B) = 115
// (> 112.5, so overtaking -- vesselB is overtaking vesselA per Pitfall 1's
// direction convention), relativeBearing(B,A) = 0. |115 - 112.5| = 2.5 <= 5
// -> still within the doubt band, from the other side of the boundary.
export const doubtBandJustOverOvertakingBoundaryCase: ClassificationCase = {
  vesselA: {
    position: { x: 0, y: 0 },
    heading: 0,
    speed: 10,
    type: "power-driven",
  },
  vesselB: {
    position: { x: 9.063, y: -4.226 },
    heading: 295,
    speed: 10,
    type: "power-driven",
  },
  expectedEncounterType: "overtaking",
  expectedGiveWay: "vesselB",
  expectedStandOn: "vesselA",
  expectedDoubt: true,
  expectedDoubtBoundary: "near-overtaking-crossing-boundary",
};

// Head-on boundary, exactly 5 deg both directions (inclusive, D-10):
// relativeBearing(A,B) = 5, relativeBearing(B,A) = 5. `<=` makes the
// boundary inclusive -> still classified head-on, with doubt.
// [Rule 1 fixture precision fix]: the plan's 4-decimal position values
// (0.8716, 9.9619) round to a bearing of 5.000266 deg (just OVER the
// inclusive <=5 threshold, per atan2), not exactly 5 -- full double
// precision (dx=10*sin(5deg), dy=10*cos(5deg)) is required so the computed
// bearing lands at 4.999999999999999, correctly on the inclusive side of
// the boundary this fixture exists to verify.
export const headOnBoundaryInclusiveCase: ClassificationCase = {
  vesselA: {
    position: { x: 0, y: 0 },
    heading: 0,
    speed: 10,
    type: "power-driven",
  },
  vesselB: {
    position: { x: 0.8715574274765816, y: 9.961946980917455 },
    heading: 180,
    speed: 10,
    type: "power-driven",
  },
  expectedEncounterType: "head-on",
  expectedGiveWay: null,
  expectedStandOn: null,
  expectedDoubt: true,
  expectedDoubtBoundary: "near-head-on-boundary",
};

// Just outside the head-on sector, 5.5 deg both directions (Assumption A1:
// no doubt band extends beyond the sector itself, since the sector IS the
// doubt band): relativeBearing(A,B) = 5.5, relativeBearing(B,A) = 5.5, both
// fail the `<= 5` test -> crossing, no doubt. [Rule 1 fixture precision
// fix]: same full-precision derivation as headOnBoundaryInclusiveCase
// above, for the same reason.
export const justOutsideHeadOnSectorCase: ClassificationCase = {
  vesselA: {
    position: { x: 0, y: 0 },
    heading: 0,
    speed: 10,
    type: "power-driven",
  },
  vesselB: {
    position: { x: 0.9584575252022398, y: 9.953961983671789 },
    heading: 180,
    speed: 10,
    type: "power-driven",
  },
  expectedEncounterType: "crossing",
  expectedGiveWay: "vesselA",
  expectedStandOn: "vesselB",
  expectedDoubt: false,
};

// WR-03 regression: rbAtoB is exactly 0 (vesselB dead ahead of vesselA) but
// rbBtoA is non-reciprocal (60 deg -- a genuine crossing course), so Stage
// 4's head-on exclusion (which requires BOTH bearings within +/-5 deg) does
// NOT catch this case; it survives to Stage 5's residual crossing dispatch.
// relativeBearing(A,B) = 0, relativeBearing(B,A) = 60. `rbAtoB > 0`
// evaluates false, so the current (pinned-down, arbitrary) tie-break falls
// to the else branch: giveWay = 'vesselB', standOn = 'vesselA'.
export const deadAheadNonReciprocalCase: ClassificationCase = {
  vesselA: {
    position: { x: 0, y: 0 },
    heading: 0,
    speed: 10,
    type: "power-driven",
  },
  vesselB: {
    position: { x: 0, y: 10 },
    heading: 120,
    speed: 10,
    type: "power-driven",
  },
  expectedEncounterType: "crossing",
  expectedRiskOfCollision: false,
  expectedGiveWay: "vesselB",
  expectedStandOn: "vesselA",
  expectedDoubt: false,
};

// --- Task 2: Rule 18 interaction matrix + Stage 0 propagation -----------

// Same positions as crossingResidualBasicCase, but vesselA is 'fishing' and
// vesselB is 'power-driven'. Geometric baseline: giveWay='vesselA'(fishing),
// standOn='vesselB'(power-driven). rule18Overrides('fishing','power-driven')
// = true (fishing outranks power-driven) -> OVERRIDE, verdict flips.
export const crossingRule18OverrideCase: ClassificationCase = {
  vesselA: { position: { x: 0, y: 0 }, heading: 0, speed: 10, type: "fishing" },
  vesselB: {
    position: { x: 5, y: 0 },
    heading: 270,
    speed: 10,
    type: "power-driven",
  },
  expectedEncounterType: "crossing",
  expectedGiveWay: "vesselB",
  expectedStandOn: "vesselA",
  expectedDoubt: false,
};

// Same positions, reversed types: vesselA is 'power-driven', vesselB is
// 'fishing'. Geometric baseline: giveWay='vesselA'(power-driven),
// standOn='vesselB'(fishing). rule18Overrides('power-driven','fishing') =
// false (power-driven does not outrank fishing) -> no override, baseline
// already correct (a power-driven vessel already gives way to fishing).
export const crossingRule18NonOverrideCase: ClassificationCase = {
  vesselA: {
    position: { x: 0, y: 0 },
    heading: 0,
    speed: 10,
    type: "power-driven",
  },
  vesselB: { position: { x: 5, y: 0 }, heading: 270, speed: 10, type: "fishing" },
  expectedEncounterType: "crossing",
  expectedGiveWay: "vesselA",
  expectedStandOn: "vesselB",
  expectedDoubt: false,
};

// Same positions as headOnGenuineCase, but vesselA is 'sailing' and
// vesselB is 'power-driven'. Baseline (head-on) is giveWay=null/standOn=
// null. Priorities differ (sailing=3, power-driven=4) -> Stage 6 assigns
// giveWay='vesselB' (power-driven, higher number/lower rank), standOn=
// 'vesselA' (sailing).
export const headOnRule18OverrideCase: ClassificationCase = {
  vesselA: { position: { x: 0, y: 0 }, heading: 0, speed: 10, type: "sailing" },
  vesselB: {
    position: { x: 0, y: 5 },
    heading: 180,
    speed: 10,
    type: "power-driven",
  },
  expectedEncounterType: "head-on",
  expectedGiveWay: "vesselB",
  expectedStandOn: "vesselA",
  expectedDoubt: true,
  expectedDoubtBoundary: "near-head-on-boundary",
};

// Same positions as headOnGenuineCase, but vesselA is 'not-under-command'
// and vesselB is 'restricted-in-ability-to-maneuver'. Priorities are equal
// (both 1) -> no override -- the mutual obligation stands even between two
// special-status vessels (Rule 18 gives no ranking between them, DETM-02).
export const headOnNucRiatmTieCase: ClassificationCase = {
  vesselA: {
    position: { x: 0, y: 0 },
    heading: 0,
    speed: 10,
    type: "not-under-command",
  },
  vesselB: {
    position: { x: 0, y: 5 },
    heading: 180,
    speed: 10,
    type: "restricted-in-ability-to-maneuver",
  },
  expectedEncounterType: "head-on",
  expectedGiveWay: null,
  expectedStandOn: null,
  expectedDoubt: true,
  expectedDoubtBoundary: "near-head-on-boundary",
};

// CR-01 regression: same geometry as overtakingBothDirectionsCase (vesselB
// overtaking vesselA, bearing 150 deg abaft A's beam), but vesselA is
// 'power-driven' and vesselB (the overtaking vessel) is 'fishing'.
// rule18Overrides('fishing', 'power-driven') = true (fishing outranks
// power-driven), so a Stage 6 dispatch that applied Rule 18 uniformly would
// incorrectly flip give-way onto vesselA. Real COLREGS Rule 13(a) overrides
// Rules 4-18 for overtaking: the overtaking vessel (vesselB, fishing) must
// keep give-way regardless of vessel type.
export const overtakingRule18NoOverrideCase: ClassificationCase = {
  vesselA: {
    position: { x: 0, y: 0 },
    heading: 0,
    speed: 8,
    type: "power-driven",
  },
  vesselB: {
    position: { x: 0.5, y: -0.8660254 },
    heading: 0,
    speed: 15,
    type: "fishing",
  },
  expectedEncounterType: "overtaking",
  expectedRiskOfCollision: true,
  expectedGiveWay: "vesselB",
  expectedStandOn: "vesselA",
  expectedDoubt: false,
};

// Copied verbatim from chip-scenarios.ts's sailingHasPriorityVessels,
// already proven correct against classifyEncounter() by chip-scenarios.test.ts.
export const crossingSailingPriorityCase: ClassificationCase = {
  vesselA: {
    position: { x: 0, y: 0 },
    heading: 0,
    speed: 10,
    type: "power-driven",
  },
  vesselB: { position: { x: 5, y: 0 }, heading: 270, speed: 10, type: "sailing" },
  expectedEncounterType: "crossing",
  expectedGiveWay: "vesselA",
  expectedStandOn: "vesselB",
  expectedDoubt: false,
};

// Copied verbatim from chip-scenarios.ts's notUnderCommandVessels,
// already proven correct against classifyEncounter() by chip-scenarios.test.ts.
export const crossingNotUnderCommandCase: ClassificationCase = {
  vesselA: {
    position: { x: 1.4, y: 0 },
    heading: 270,
    speed: 10,
    type: "power-driven",
  },
  vesselB: {
    position: { x: 0, y: 0 },
    heading: 0,
    speed: 10,
    type: "not-under-command",
  },
  expectedEncounterType: "crossing",
  expectedGiveWay: "vesselA",
  expectedStandOn: "vesselB",
  expectedRiskOfCollision: true,
  expectedDoubt: false,
};

// Copied verbatim from chip-scenarios.ts's inDoubtVessels,
// already proven correct against classifyEncounter() by chip-scenarios.test.ts.
export const headOnInDoubtCase: ClassificationCase = {
  vesselA: {
    position: { x: 0, y: 0 },
    heading: 45,
    speed: 10,
    type: "sailing",
  },
  vesselB: {
    position: { x: 7.66044443118978, y: 6.427876096865393 },
    heading: 225,
    speed: 10,
    type: "sailing",
  },
  expectedEncounterType: "head-on",
  expectedGiveWay: null,
  expectedStandOn: null,
  expectedRiskOfCollision: true,
  expectedDoubt: true,
  expectedDoubtBoundary: "near-head-on-boundary",
};

// Reuse Phase 1's coincidentPropagationCase vessels directly (identical
// positions). classifyEncounter() must propagate relativeBearing()'s own
// 'coincident-position' failure unchanged -- no re-wrapping.
export const stage0CoincidentPropagationCase: PropagationCase = {
  vesselA: relativeBearingCoincidentPropagationCase.own,
  vesselB: relativeBearingCoincidentPropagationCase.contact,
  expectedReason: "coincident-position",
};

// Reuse Phase 1's parallelNoClosureCase vessels directly. relativeBearing
// (A,B) = 90, relativeBearing(B,A) = -90 (270 raw, normalized). cpa()
// returns a degenerate parallel/matching-course result -- per D-07, this
// must NOT propagate as a classifyEncounter() failure; it is consumed by
// riskOfCollision() as "no risk" and the dispatch proceeds to a normal
// crossing classification.
export const noClosureDoesNotPropagateCase: ClassificationCase = {
  vesselA: parallelNoClosureCase.vesselA,
  vesselB: parallelNoClosureCase.vesselB,
  expectedEncounterType: "crossing",
  expectedRiskOfCollision: false,
  expectedGiveWay: "vesselA",
  expectedStandOn: "vesselB",
  expectedDoubt: false,
};
