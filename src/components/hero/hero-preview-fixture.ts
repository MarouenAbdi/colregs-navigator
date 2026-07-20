/**
 * Fixed vessel fixture for the illustrative "Live
 * classification" preview card (HERO-02, D-07). These values are
 * NOT hand-derived -- they were computed [Verified: via a standalone script
 * replicating bearing.ts/relative-bearing.ts/cpa.ts/classify-encounter.ts's
 * exact formulas, not hand arithmetic] by iterating vesselB's speed until
 * dcpaNm converged on the design mock's displayed 1.18 NM. Transcribed
 * verbatim from this project's original worked-math derivation -- do not alter.
 *
 * Reproduces `classifyEncounter(heroPreviewVesselA, heroPreviewVesselB)`
 * output of: encounterType "crossing", giveWay "vesselA", standOn
 * "vesselB", doubt false. Reproduces the design mock's displayed readouts:
 * RANGE 2.99 NM (Math.hypot of the position delta), BEARING 061 deg
 * (bearing() fn), CPA 1.18 NM (cpa().dcpaNm, 1.1805 -> "1.18 NM").
 */

import type { Vessel } from "../../domain/vessel/vessel.js";

export const heroPreviewVesselA: Vessel = {
  position: { x: 0, y: 0 },
  heading: 0,
  speed: 12,
  type: "power-driven",
};

export const heroPreviewVesselB: Vessel = {
  position: { x: 2.6151, y: 1.4496 }, // bearing 061.0deg, range 2.99nm from A
  heading: 280,
  speed: 8.3,
  type: "power-driven",
};

// Resulting classifyEncounter(heroPreviewVesselA, heroPreviewVesselB) output:
//   encounterType: "crossing"
//   giveWay: "vesselA", standOn: "vesselB"
//   doubt: false  (both |bearing - 112.5| and head-on checks clear the 5deg band)
//   trail includes a "Rule 15" entry (Crossing dispatch stage)
// Resulting readouts (computed, not hardcoded):
//   range (Math.hypot):        2.99 NM  (exact)
//   bearing (bearing() fn):    61.0 deg -> "061deg"
//   cpa (cpa().dcpaNm):        1.1805 NM -> "1.18 NM"
// Note: cpa().tcpaMinutes is ~12.3 (positive) but dcpaNm (1.18) is OVER
// the Rule 7 1.0nm risk threshold, so classifyEncounter()'s own
// `riskOfCollision` field evaluates false for this fixture. This does NOT
// block the Rule 15/crossing/give-way verdict (Rule 7's gate only affects
// hysteresis, not encounterType dispatch -- see classify-encounter.ts Stage
// 1 vs Stage 3-5) and the design mock never displays the riskOfCollision
// boolean directly, so this is a non-issue for HERO-02's acceptance
// criteria. Flagged here only so a future reader isn't confused if they
// inspect the full ClassificationResult and see riskOfCollision: false.
