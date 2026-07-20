/**
 * resolveDoubtGeometry() -- pure doubt-triggering-vessel/bearing resolution.
 *
 * Resolves an open design question: given a doubt-flagged classification's
 * `DoubtBoundary`, ChartPanel needs to know exactly which vessel's
 * relative-bearing line/overtaking-boundary wedge to render as the
 * dashed-amber doubt overlay (D-04). The reasoning trail's per-stage
 * `facts` shape is inconsistent for this purpose -- the sticky-hysteresis
 * branch's Rule 13(d) trail entry pushes `facts: {}` and cannot answer this
 * question at all -- so this function recomputes geometry independently
 * from `vesselA`/`vesselB` rather than reading the trail, and takes no
 * `previous` argument.
 *
 * Composes `relativeBearing()` and classify-encounter.ts's own
 * `OVERTAKING_BOUNDARY_DEGREES` constant exclusively -- no re-derived
 * atan2 call or re-declared threshold lives here.
 */

import type { Vessel } from "../../vessel/vessel.js";
import { ok, type Result } from "../../shared/result.js";
import { relativeBearing } from "../../geometry/relative-bearing.js";
import { OVERTAKING_BOUNDARY_DEGREES } from "../classify-encounter.js";
import type { DoubtBoundary, VesselLabel } from "../types.js";

export function resolveDoubtGeometry(
  vesselA: Vessel,
  vesselB: Vessel,
  doubtBoundary: DoubtBoundary,
): Result<{ vessel: VesselLabel; relativeBearingDegrees: number }> {
  // Mirror classify-encounter.ts's Stage-0 idiom: any genuine
  // relativeBearing() failure (invalid-input/coincident-position) is
  // propagated unchanged, no re-wrapping.
  const rbAtoBResult = relativeBearing(vesselA, vesselB);
  if (!rbAtoBResult.ok) {
    return rbAtoBResult;
  }
  const rbBtoAResult = relativeBearing(vesselB, vesselA);
  if (!rbBtoAResult.ok) {
    return rbBtoAResult;
  }

  if (doubtBoundary === "near-head-on-boundary") {
    // The head-on doubt band is symmetric (both vessels see each other
    // within +/-5 deg of dead ahead), so either vessel's bearing is
    // geometrically equivalent for rendering purposes -- vesselA is an
    // arbitrary, pinned, always-A convention (mirrors classify-
    // encounter.ts's own tie-break documentation style).
    return ok({ vessel: "vesselA", relativeBearingDegrees: rbAtoBResult.value });
  }

  // doubtBoundary === "near-overtaking-crossing-boundary": whichever
  // vessel's relative bearing is closer in magnitude to the 112.5 deg
  // boundary is the one that triggered the doubt flag -- this is the exact
  // question a naive facts.relativeBearingAtoB-only reader gets wrong
  // (Pitfall 3), since the triggering side is not always A.
  const distA = Math.abs(
    Math.abs(rbAtoBResult.value) - OVERTAKING_BOUNDARY_DEGREES,
  );
  const distB = Math.abs(
    Math.abs(rbBtoAResult.value) - OVERTAKING_BOUNDARY_DEGREES,
  );
  // `<=` favors vesselA on an exact tie, consistent with classify-
  // encounter.ts's own documented bOvertakesA/aOvertakesB tie-break style.
  if (distA <= distB) {
    return ok({ vessel: "vesselA", relativeBearingDegrees: rbAtoBResult.value });
  }
  return ok({ vessel: "vesselB", relativeBearingDegrees: rbBtoAResult.value });
}
