import type { Vessel } from "../vessel/vessel.js";
import {
  headOnClosingCase,
  negativeTcpaCase,
  parallelNoClosureCase,
} from "../geometry/cpa.fixtures.js";

// Re-export Phase 1's cpa.fixtures.ts cases directly (RESEARCH.md: "Phase 2
// can reuse these as known-correct starting inputs" — do not re-derive
// their trigonometry).
export { headOnClosingCase, negativeTcpaCase, parallelNoClosureCase };

/**
 * Rule 7 risk-of-collision threshold fixtures (D-05-D-08). Each fixture is
 * piped through `cpa()` in the test, then `riskOfCollision()` is asserted
 * against `expectedRisk`.
 */

// DCPA exactly AT the 1.0nm threshold (D-05's "at or under" is inclusive).
// Same construction as headOnClosingCase, offset 1nm in x on vesselB.
// vesselA at (0,0) heading 000 speed 10kn => vA = (0, 10).
// vesselB at (1,10) heading 180 speed 10kn => vB = (0, -10).
// R = posB - posA = (1,10). V = vB - vA = (0,-20). vDotV = 400.
// dot(R,V) = 1*0 + 10*(-20) = -200. tcpaHours = -(-200)/400 = 0.5 => tcpaMinutes = 30.
// posAtCpa = R + V*0.5 = (1,10) + (0,-10) = (1,0) => dcpaNm = hypot(1,0) = 1.0.
export const dcpaAtThresholdCase: {
  vesselA: Vessel;
  vesselB: Vessel;
  expectedRisk: boolean;
} = {
  vesselA: { position: { x: 0, y: 0 }, heading: 0, speed: 10, type: "power-driven" },
  vesselB: { position: { x: 1, y: 10 }, heading: 180, speed: 10, type: "power-driven" },
  expectedRisk: true,
};

// DCPA over the 1.0nm threshold (2.0nm) — same construction, vesselB offset
// 2nm in x instead of 1nm.
// R = (2,10). V = (0,-20). dot(R,V) = 2*0 + 10*(-20) = -200.
// tcpaHours = 0.5 => tcpaMinutes = 30. posAtCpa = (2,10)+(0,-10) = (2,0)
// => dcpaNm = hypot(2,0) = 2.0.
export const dcpaOverThresholdCase: {
  vesselA: Vessel;
  vesselB: Vessel;
  expectedRisk: boolean;
} = {
  vesselA: { position: { x: 0, y: 0 }, heading: 0, speed: 10, type: "power-driven" },
  vesselB: { position: { x: 2, y: 10 }, heading: 180, speed: 10, type: "power-driven" },
  expectedRisk: false,
};
