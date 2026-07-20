import type { Vessel } from "../../vessel/vessel.js";

/**
 * Hand-derived CPA/TCPA fixtures (D-13). Velocity components use the
 * project's locked convention: vx = speed * sin(headingRadians) (east
 * component), vy = speed * cos(headingRadians) (north component) — the
 * same sin/cos pairing used for a compass bearing measured clockwise
 * from north (see cpa.ts's inline comment for the full derivation).
 */

// Head-on closing case:
// vesselA at (0,0) heading 000 (north) speed 10kn => vA = (10*sin0, 10*cos0) = (0, 10).
// vesselB at (0,10) heading 180 (south) speed 10kn => vB = (10*sin180, 10*cos180) = (0, -10).
// R = posB - posA = (0, 10). V = vB - vA = (0, -20). vDotV = 400.
// dot(R,V) = 0*0 + 10*(-20) = -200. tcpaHours = -(-200)/400 = 0.5hr => tcpaMinutes = 30.
// posAtCpa = R + V*0.5 = (0,10) + (0,-10) = (0,0) => dcpaNm = 0 (they meet).
export const headOnClosingCase: {
  vesselA: Vessel;
  vesselB: Vessel;
  expectedTcpaMinutes: number;
  expectedDcpaNm: number;
} = {
  vesselA: { position: { x: 0, y: 0 }, heading: 0, speed: 10, type: "power-driven" },
  vesselB: { position: { x: 0, y: 10 }, heading: 180, speed: 10, type: "power-driven" },
  expectedTcpaMinutes: 30,
  expectedDcpaNm: 0,
};

// Parallel/matching-course case:
// Both vessels heading 000 at 10kn (identical velocity vectors), separated
// by 5nm in x. V = vB - vA = (0,0) exactly => vDotV = 0 < epsilon => no-closure.
// R = posB - posA = (5,0) => currentDistanceNm = hypot(5,0) = 5.
export const parallelNoClosureCase: {
  vesselA: Vessel;
  vesselB: Vessel;
  expectedCurrentDistanceNm: number;
} = {
  vesselA: { position: { x: 0, y: 0 }, heading: 0, speed: 10, type: "power-driven" },
  vesselB: { position: { x: 5, y: 0 }, heading: 0, speed: 10, type: "power-driven" },
  expectedCurrentDistanceNm: 5,
};

// Negative TCPA case (Open Question 1, RESOLVED):
// vesselA at (0,0) heading 000 speed 10kn => vA = (0, 10).
// vesselB at (0,-5) heading 180 speed 10kn (behind A, moving further south) => vB = (0, -10).
// R = posB - posA = (0,-5). V = vB - vA = (0,-20). vDotV = 400.
// dot(R,V) = 0*0 + (-5)*(-20) = 100. tcpaHours = -100/400 = -0.25hr => tcpaMinutes = -15.
// Both vessels are moving directly away from each other from t=0, so the
// mathematically closest approach (distance 0) was 15 minutes in the past —
// a valid, meaningful negative TCPA, not a degenerate case.
export const negativeTcpaCase: {
  vesselA: Vessel;
  vesselB: Vessel;
  expectedTcpaMinutes: number;
  expectedDcpaNm: number;
} = {
  vesselA: { position: { x: 0, y: 0 }, heading: 0, speed: 10, type: "power-driven" },
  vesselB: { position: { x: 0, y: -5 }, heading: 180, speed: 10, type: "power-driven" },
  expectedTcpaMinutes: -15,
  expectedDcpaNm: 0,
};

// Epsilon-boundary case just BELOW the NEAR_ZERO_RELATIVE_VELOCITY_SQ (1e-9)
// threshold (Open Question 2, RESOLVED): vesselA heading 000 speed 10kn =>
// vA = (0,10). vesselB heading 000, speed = 10 + sqrt(5e-10) ≈ 10.0000223607kn
// => vB = (0, 10 + sqrt(5e-10)). V = (0, sqrt(5e-10)) => vDotV = 5e-10, which
// is below 1e-9 => must be classified as no-closure.
// R = posB - posA = (5,0) => currentDistanceNm = 5.
const EPSILON_JUST_BELOW_SPEED_DELTA = Math.sqrt(5e-10);
export const epsilonJustBelowCase: {
  vesselA: Vessel;
  vesselB: Vessel;
  expectedCurrentDistanceNm: number;
} = {
  vesselA: { position: { x: 0, y: 0 }, heading: 0, speed: 10, type: "power-driven" },
  vesselB: {
    position: { x: 5, y: 0 },
    heading: 0,
    speed: 10 + EPSILON_JUST_BELOW_SPEED_DELTA,
    type: "power-driven",
  },
  expectedCurrentDistanceNm: 5,
};

// Epsilon-boundary case just ABOVE the threshold: same construction, but
// speed delta = sqrt(5e-8) ≈ 2.236068e-4kn => vDotV ≈ 5e-8, clearly above
// 1e-9 => must be classified as a computed ok() result, not no-closure.
// R = (5,0). V = (0, sqrt(5e-8)). dot(R,V) = 5*0 + 0*sqrt(5e-8) = 0 =>
// tcpaHours = -0 / 5e-8 = 0 => tcpaMinutes = 0.
// posAtCpa = R + V*0 = (5,0) => dcpaNm = 5.
const EPSILON_JUST_ABOVE_SPEED_DELTA = Math.sqrt(5e-8);
export const epsilonJustAboveCase: {
  vesselA: Vessel;
  vesselB: Vessel;
  expectedTcpaMinutes: number;
  expectedDcpaNm: number;
} = {
  vesselA: { position: { x: 0, y: 0 }, heading: 0, speed: 10, type: "power-driven" },
  vesselB: {
    position: { x: 5, y: 0 },
    heading: 0,
    speed: 10 + EPSILON_JUST_ABOVE_SPEED_DELTA,
    type: "power-driven",
  },
  expectedTcpaMinutes: 0,
  expectedDcpaNm: 5,
};

// Invalid-input case: vesselA.speed is NaN. Constructed as a raw object
// literal (bypassing VesselSchema.parse()) to exercise the trust boundary
// noted in the threat model — cpa() must not assume Zod-validated input.
export const nonFiniteInputCase: { vesselA: Vessel; vesselB: Vessel } = {
  vesselA: { position: { x: 0, y: 0 }, heading: 0, speed: Number.NaN, type: "power-driven" },
  vesselB: { position: { x: 5, y: 0 }, heading: 0, speed: 10, type: "power-driven" },
};
