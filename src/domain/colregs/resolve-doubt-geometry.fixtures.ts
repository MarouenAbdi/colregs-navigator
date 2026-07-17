/**
 * Hand-derived fixtures for `resolveDoubtGeometry()` (RSON-03).
 *
 * Each case pins two vessels and the `doubtBoundary` classifyEncounter()
 * already determined, plus the expected triggering vessel/relative-bearing
 * pair resolveDoubtGeometry() must derive purely from vesselA/vesselB
 * geometry -- never from a reasoning-trail `facts` entry.
 */

import type { Vessel } from "../vessel/vessel.js";
import type { DoubtBoundary, VesselLabel } from "./types.js";

interface DoubtGeometryOkCase {
  vesselA: Vessel;
  vesselB: Vessel;
  doubtBoundary: DoubtBoundary;
  expectedVessel: VesselLabel;
  expectedRelativeBearingDegrees: number;
}

interface DoubtGeometryErrCase {
  vesselA: Vessel;
  vesselB: Vessel;
  doubtBoundary: DoubtBoundary;
}

// A-side trigger: reuses classify-encounter.fixtures.ts's
// doubtBandNearOvertakingBoundaryCase vessels verbatim.
// relativeBearing(vesselA, vesselB) ~= 110 deg (|110 - 112.5| = 2.5, close
// to the 112.5 deg overtaking/crossing boundary); relativeBearing(vesselB,
// vesselA) ~= 0 deg (|0 - 112.5| = 112.5, nowhere near the boundary). A's
// side is the closer one -> vesselA triggers.
export const overtakingBoundaryTriggeredByACase: DoubtGeometryOkCase = {
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
  doubtBoundary: "near-overtaking-crossing-boundary",
  expectedVessel: "vesselA",
  expectedRelativeBearingDegrees: 110,
};

// B-side trigger (Pitfall 3's exact naive-reader trap): the same physical
// geometry as overtakingBoundaryTriggeredByACase above, but with the
// vesselA/vesselB labels swapped -- now relativeBearing(vesselB, vesselA)
// is the one close to the 112.5 deg boundary (~110 deg) while
// relativeBearing(vesselA, vesselB) is far from it (~0 deg). A reader that
// only ever inspects `facts.relativeBearingAtoB` would wrongly report A's
// (irrelevant) bearing here; resolveDoubtGeometry must correctly identify
// vesselB as the trigger.
export const overtakingBoundaryTriggeredByBCase: DoubtGeometryOkCase = {
  vesselA: {
    position: { x: 9.397, y: -3.42 },
    heading: 290,
    speed: 10,
    type: "power-driven",
  },
  vesselB: {
    position: { x: 0, y: 0 },
    heading: 0,
    speed: 10,
    type: "power-driven",
  },
  doubtBoundary: "near-overtaking-crossing-boundary",
  expectedVessel: "vesselB",
  expectedRelativeBearingDegrees: 110,
};

// Sticky-hysteresis shape: reuses classify-encounter.fixtures.ts's
// overtakingHysteresisNearBoundaryCase vessels verbatim (previous =
// 'overtaking', bearing has drifted near the boundary). This function does
// NOT take a `previous` argument and does NOT read the trail (whose sticky
// branch pushes `facts: {}` for its Rule 13(d) entry) -- it must derive
// vesselA/110 purely from vesselA/vesselB geometry, exactly like the
// A-side case above, proving the empty trail facts are a non-issue here.
// relativeBearing(vesselA, vesselB) = 110, relativeBearing(vesselB,
// vesselA) = -70 -- |110 - 112.5| = 2.5 is closer to the boundary than
// |-70| normalized to |70 - 112.5| = 42.5, so vesselA's side wins.
export const stickyHysteresisNearBoundaryCase: DoubtGeometryOkCase = {
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
  doubtBoundary: "near-overtaking-crossing-boundary",
  expectedVessel: "vesselA",
  expectedRelativeBearingDegrees: 110,
};

// Head-on boundary: reuses classify-encounter.fixtures.ts's
// headOnBoundaryInclusiveCase vessels verbatim (both relativeBearing
// values within +/-5 deg of dead ahead -- the symmetric head-on doubt
// band). Either vessel's bearing is geometrically equivalent for
// rendering purposes here, so vesselA is the fixed, arbitrary-but-pinned
// convention (mirrors classify-encounter.ts's own WR-02-style tie-break
// documentation for symmetric cases).
export const headOnBoundaryCase: DoubtGeometryOkCase = {
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
  doubtBoundary: "near-head-on-boundary",
  expectedVessel: "vesselA",
  expectedRelativeBearingDegrees: 5,
};

// Degenerate propagation: vesselA and vesselB at the identical position ->
// relativeBearing() returns err('coincident-position'), which
// resolveDoubtGeometry must propagate unchanged (no re-wrapping), mirroring
// classify-encounter.ts's own Stage-0 "propagate unchanged" idiom. The
// `doubtBoundary` value is irrelevant here since the function must fail
// before ever branching on it.
export const coincidentPositionCase: DoubtGeometryErrCase = {
  vesselA: {
    position: { x: 3, y: 4 },
    heading: 0,
    speed: 10,
    type: "power-driven",
  },
  vesselB: {
    position: { x: 3, y: 4 },
    heading: 90,
    speed: 10,
    type: "power-driven",
  },
  doubtBoundary: "near-overtaking-crossing-boundary",
};
