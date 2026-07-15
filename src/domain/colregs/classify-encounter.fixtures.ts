/**
 * Hand-derived fixtures for `classifyEncounter()` (D-01 through D-16) -- the
 * auditable proof-of-correctness suite CONTEXT.md calls for. Each fixture
 * documents the worked `relativeBearing()`/`cpa()` derivation behind its
 * expected values inline (transcribed from 02-02-PLAN.md's own worked math,
 * not re-derived here).
 */

import type { Vessel } from "../vessel/vessel.js";
import type { DoubtBoundary, EncounterType, VesselLabel } from "./types.js";
import { crossingCase, headOnCase } from "../geometry/relative-bearing.fixtures.js";

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
