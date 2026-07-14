import type { Vessel } from "../vessel/vessel.js";
import { type Result } from "../shared/result.js";

/**
 * cpa()/tcpa() — closest point of approach vector math. Resolves
 * RESEARCH.md Open Questions 1 (negative TCPA) and 2 (epsilon threshold),
 * both locked explicitly here rather than left ambiguous:
 *  - Negative tcpaMinutes is returned as a normal ok() result (closest
 *    approach was in the past) — never clamped to 0, never a degenerate tag.
 *  - "No closure" (parallel/matching-course vessels) is detected via an
 *    epsilon-gated comparison against NEAR_ZERO_RELATIVE_VELOCITY_SQ, not
 *    exact-zero equality (floating-point noise from sin/cos-derived
 *    velocity components would make exact equality unreliable).
 */
export function cpa(
  vesselA: Vessel,
  vesselB: Vessel,
): Result<{ tcpaMinutes: number; dcpaNm: number }> {
  throw new Error("not implemented");
}
