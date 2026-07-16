/**
 * classifyEncounter() -- the Rule 7 -> 13 -> 14 -> 15 -> 18 dispatch (CLAS-01
 * through CLAS-04, DETM-01, DETM-02, RSON-02).
 *
 * The entire portfolio-value proposition of this project: given two vessels
 * (and, optionally, the previously-classified encounter type for
 * hysteresis), derive the COLREGS encounter type, the give-way/stand-on
 * verdict, and an ordered reasoning trail -- built inline at each dispatch
 * stage, never re-derived after the verdict is already known (RSON-02).
 *
 * Composes Phase 1's `relativeBearing()`/`cpa()` and Plan 01's
 * `riskOfCollision`/`rule18Overrides()`/`vesselPriority()` functions
 * exclusively -- no new trigonometry or threshold logic is introduced here.
 */

import type { Vessel } from "../vessel/vessel.js";
import { ok, type Result } from "../shared/result.js";
import { relativeBearing } from "../geometry/relative-bearing.js";
import { cpa } from "../geometry/cpa.js";
import { riskOfCollision } from "./risk-of-collision.js";
import { rule18Overrides, vesselPriority } from "./vessel-priority.js";
import type {
  ClassificationResult,
  EncounterType,
  ReasoningTrailEntry,
  VesselLabel,
} from "./types.js";

// Rule 13(b)'s "22.5 degrees abaft the beam" expressed as a relative-bearing
// magnitude: 90 (dead abeam) + 22.5 = 112.5, verbatim from rule text.
export const OVERTAKING_BOUNDARY_DEGREES = 112.5;

// D-09/D-10: one shared doubt-band width, applied symmetrically to both the
// overtaking/crossing boundary (112.5 deg) and the head-on boundary (0 deg)
// -- not two independently-tuned constants.
export const DOUBT_BAND_DEGREES = 5;

export function classifyEncounter(
  vesselA: Vessel,
  vesselB: Vessel,
  previous?: EncounterType,
): Result<ClassificationResult> {
  const trail: ReasoningTrailEntry[] = [];

  // Stage 0: geometry inputs. Any genuine relativeBearing() failure
  // (invalid-input/coincident-position) is a real Stage-0 error and is
  // propagated unchanged -- no re-wrapping, matching relative-bearing.ts's
  // own "propagate unchanged" idiom applied one level up.
  const rbAtoBResult = relativeBearing(vesselA, vesselB);
  if (!rbAtoBResult.ok) {
    return rbAtoBResult;
  }
  const rbBtoAResult = relativeBearing(vesselB, vesselA);
  if (!rbBtoAResult.ok) {
    return rbBtoAResult;
  }
  const rbAtoB = rbAtoBResult.value;
  const rbBtoA = rbBtoAResult.value;

  const cpaResult = cpa(vesselA, vesselB);
  if (!cpaResult.ok && cpaResult.reason === "invalid-input") {
    return cpaResult;
  }
  // D-07: a degenerate parallel/matching-course cpa() result (the sibling
  // 'invalid-input' reason is already returned above) is NOT propagated as
  // a classifyEncounter()-level failure -- the whole (still !ok) Result is
  // handed to the Stage 1 risk gate below, which treats it as no risk.

  // Stage 1: Rule 7 gate.
  const risk = riskOfCollision(cpaResult);
  trail.push({
    ruleId: "Rule 7",
    text: risk
      ? "Risk of collision exists: the vessels are closing (positive TCPA) with a projected closest-approach distance at or under the 1.0nm threshold."
      : "No risk of collision: either the vessels are not closing, closest approach already occurred, or the projected closest-approach distance exceeds the 1.0nm threshold.",
    facts: {
      riskOfCollision: risk,
      ...(cpaResult.ok
        ? {
            tcpaMinutes: cpaResult.value.tcpaMinutes,
            dcpaNm: cpaResult.value.dcpaNm,
          }
        : {}),
    },
  });
  // D-02/D-03: when the gate fails, effectivePrevious becomes undefined
  // OUTRIGHT -- a full release to fresh geometric classification, never a
  // softened/demoted hint (Pitfall 4).
  const effectivePrevious = risk ? previous : undefined;

  let encounterType: EncounterType;
  let giveWay: VesselLabel | null = null;
  let standOn: VesselLabel | null = null;
  let doubt = false;
  let doubtBoundary: ClassificationResult["doubtBoundary"] = undefined;

  if (effectivePrevious === "overtaking") {
    // Stage 2: sticky overtaking (D-01/D-02). Direction is redetermined by
    // magnitude comparison alone, WITHOUT the 112.5 threshold -- bearing may
    // have drifted below it, that is the entire point of hysteresis.
    encounterType = "overtaking";
    trail.push({
      ruleId: "Rule 13(d)",
      text: "Overtaking situation persists (once overtaking, always overtaking until finally past and clear) -- previous classification was overtaking and Rule 7 risk of collision still holds.",
      facts: {},
    });
    let stickyTriggeringBearing: number;
    if (Math.abs(rbAtoB) >= Math.abs(rbBtoA)) {
      giveWay = "vesselB";
      standOn = "vesselA";
      stickyTriggeringBearing = rbAtoB;
    } else {
      giveWay = "vesselA";
      standOn = "vesselB";
      stickyTriggeringBearing = rbBtoA;
    }
    // WR-01: mirror Stage 3's doubt-band check against the same 112.5 deg
    // boundary, using the larger-magnitude bearing (the one driving the
    // direction tie-break above). Hysteresis intentionally skips the
    // >112.5 threshold test itself (that is the whole point of "sticky"),
    // but a current bearing that has drifted close to the boundary is
    // still worth flagging as doubtful, same as a freshly-derived
    // classification would.
    doubt =
      Math.abs(Math.abs(stickyTriggeringBearing) - OVERTAKING_BOUNDARY_DEGREES) <=
      DOUBT_BAND_DEGREES;
    if (doubt) {
      doubtBoundary = "near-overtaking-crossing-boundary";
    }
  } else {
    // Stage 3: Rule 13, both directions (Pitfall 1: two independent checks,
    // never a single bearing reused for both).
    const bOvertakesA = Math.abs(rbAtoB) > OVERTAKING_BOUNDARY_DEGREES;
    const aOvertakesB = Math.abs(rbBtoA) > OVERTAKING_BOUNDARY_DEGREES;
    if (bOvertakesA || aOvertakesB) {
      encounterType = "overtaking";
      const triggeringBearing = bOvertakesA ? rbAtoB : rbBtoA;
      // WR-02: bOvertakesA and aOvertakesB CAN both be true simultaneously
      // (e.g. two vessels heading directly apart along the same line, each
      // seeing the other dead astern of its own beam). `bOvertakesA` wins
      // the tie deliberately, not by oversight: this geometry only arises
      // for genuinely diverging vessels, which Rule 7's riskOfCollision
      // gate has already excluded from any real give-way consequence (see
      // overtakingBothTrueDivergingCase) -- there is no closing encounter
      // where both conditions can hold at once, so the tie-break's outcome
      // is geometrically inert in practice.
      if (bOvertakesA) {
        giveWay = "vesselB";
        standOn = "vesselA";
        trail.push({
          ruleId: "Rule 13(a)-(b)",
          text: "Vessel B is overtaking Vessel A (bearing from A to B is more than 22.5 degrees abaft A's beam).",
          facts: { relativeBearingAtoB: rbAtoB },
        });
      } else {
        giveWay = "vesselA";
        standOn = "vesselB";
        trail.push({
          ruleId: "Rule 13(a)-(b)",
          text: "Vessel A is overtaking Vessel B (bearing from B to A is more than 22.5 degrees abaft B's beam).",
          facts: { relativeBearingBtoA: rbBtoA },
        });
      }
      doubt =
        Math.abs(Math.abs(triggeringBearing) - OVERTAKING_BOUNDARY_DEGREES) <=
        DOUBT_BAND_DEGREES;
      if (doubt) {
        doubtBoundary = "near-overtaking-crossing-boundary";
      }
    } else {
      trail.push({
        ruleId: "Rule 13(a)-(b)",
        text: "Not overtaking in either direction -- both relative bearings are forward of the 112.5 degree abaft-the-beam threshold.",
        facts: { relativeBearingAtoB: rbAtoB, relativeBearingBtoA: rbBtoA },
      });

      // Stage 4: Rule 14, both directions (Pitfall 2). Per Assumption A1,
      // the head-on sector IS the doubt band itself -- every match always
      // carries doubt: true.
      const isHeadOn =
        Math.abs(rbAtoB) <= DOUBT_BAND_DEGREES &&
        Math.abs(rbBtoA) <= DOUBT_BAND_DEGREES;
      if (isHeadOn) {
        encounterType = "head-on";
        giveWay = null;
        standOn = null;
        doubt = true;
        doubtBoundary = "near-head-on-boundary";
        trail.push({
          ruleId: "Rule 14(a)-(b)",
          text: "Head-on: the vessels are meeting on reciprocal or nearly reciprocal courses, each seeing the other ahead or nearly ahead.",
          facts: { relativeBearingAtoB: rbAtoB, relativeBearingBtoA: rbBtoA },
        });
      } else {
        trail.push({
          ruleId: "Rule 14(a)-(b)",
          text: "Not head-on -- at least one vessel does not see the other ahead or nearly ahead.",
          facts: { relativeBearingAtoB: rbAtoB, relativeBearingBtoA: rbBtoA },
        });

        // Stage 5: Rule 15, residual. Dispatch order guarantees rbAtoB is
        // never exactly 0/undefined-boundary here -- Stage 4 already
        // excluded the head-on sector, and Stage 3 already excluded the
        // overtaking sector.
        encounterType = "crossing";
        if (rbAtoB > 0) {
          giveWay = "vesselA";
          standOn = "vesselB";
        } else {
          giveWay = "vesselB";
          standOn = "vesselA";
        }
        doubt =
          Math.abs(Math.abs(rbAtoB) - OVERTAKING_BOUNDARY_DEGREES) <=
            DOUBT_BAND_DEGREES ||
          Math.abs(Math.abs(rbBtoA) - OVERTAKING_BOUNDARY_DEGREES) <=
            DOUBT_BAND_DEGREES;
        if (doubt) {
          doubtBoundary = "near-overtaking-crossing-boundary";
        }
        trail.push({
          ruleId: "Rule 15",
          text: "Crossing: the vessel that has the other on her own starboard side must keep out of the way.",
          facts: { relativeBearingAtoB: rbAtoB },
        });
      }
    }
  }

  // Stage 6: Rule 18 override, always runs.
  if (encounterType === "head-on") {
    if (giveWay === null && standOn === null) {
      const priorityA = vesselPriority(vesselA.type);
      const priorityB = vesselPriority(vesselB.type);
      if (priorityA !== priorityB) {
        // The vessel with the HIGHER priority number (= lower real-world
        // priority) becomes give-way; the other becomes stand-on.
        if (priorityA > priorityB) {
          giveWay = "vesselA";
          standOn = "vesselB";
        } else {
          giveWay = "vesselB";
          standOn = "vesselA";
        }
        trail.push({
          ruleId: "Rule 18(a)-(c)",
          text: "Rule 18 hierarchy applies even to a head-on encounter: the lower-priority vessel type must give way.",
          facts: { vesselAType: vesselA.type, vesselBType: vesselB.type },
        });
      } else {
        trail.push({
          ruleId: "Rule 18(a)-(c)",
          text: "Rule 18 does not apply: both vessels share the same priority tier (including the not-under-command/restricted-in-ability-to-maneuver tie) -- mutual obligation stands, no give-way/stand-on assigned.",
          facts: { vesselAType: vesselA.type, vesselBType: vesselB.type },
        });
      }
    }
  } else if (encounterType === "overtaking") {
    // overtaking: Rule 13(a) applies "notwithstanding anything contained in
    // Rules 4 to 18" -- the overtaking vessel always gives way, vessel type
    // is irrelevant. Do not call rule18Overrides() here.
    trail.push({
      ruleId: "Rule 13(a)",
      text: "Rule 18 does not apply to an overtaking situation: Rule 13(a) overrides Rules 4-18, so the overtaking vessel gives way regardless of vessel type.",
      facts: { vesselAType: vesselA.type, vesselBType: vesselB.type },
    });
  } else {
    // crossing: giveWay/standOn are non-null vessel labels here.
    const giveWayVessel = giveWay === "vesselA" ? vesselA : vesselB;
    const standOnVessel = standOn === "vesselA" ? vesselA : vesselB;
    if (rule18Overrides(giveWayVessel.type, standOnVessel.type)) {
      const previousGiveWay = giveWay;
      giveWay = standOn;
      standOn = previousGiveWay;
      trail.push({
        ruleId: "Rule 18(a)-(c)",
        text: "Rule 18 override: the geometric give-way vessel outranks the geometric stand-on vessel in the Rule 18 hierarchy -- verdict flipped.",
        facts: { vesselAType: vesselA.type, vesselBType: vesselB.type },
      });
    } else {
      trail.push({
        ruleId: "Rule 18(a)-(c)",
        text: "Rule 18 does not override the geometric baseline -- the geometric give-way vessel's type does not outrank the stand-on vessel's type.",
        facts: { vesselAType: vesselA.type, vesselBType: vesselB.type },
      });
    }
  }

  return ok({
    encounterType,
    riskOfCollision: risk,
    giveWay,
    standOn,
    doubt,
    doubtBoundary,
    trail,
  });
}
