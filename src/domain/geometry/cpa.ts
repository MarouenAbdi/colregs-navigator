import type { Vessel } from "../vessel/vessel.js";
import { err, ok, type Result } from "../shared/result.js";

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

// Squared-knots units. Resolves RESEARCH.md Open Question 2: a raw
// `vDotV === 0` check is fragile against floating-point noise from
// sin/cos-derived velocity components, so use a small epsilon threshold
// instead of exact equality (D-06's "≈ zero", not "=== zero").
export const NEAR_ZERO_RELATIVE_VELOCITY_SQ = 1e-9;

export function cpa(
  vesselA: Vessel,
  vesselB: Vessel,
): Result<{ tcpaMinutes: number; dcpaNm: number }> {
  const numericFields = [
    vesselA.position.x,
    vesselA.position.y,
    vesselA.heading,
    vesselA.speed,
    vesselB.position.x,
    vesselB.position.y,
    vesselB.heading,
    vesselB.speed,
  ];
  if (!numericFields.every((field) => Number.isFinite(field))) {
    return err("invalid-input", { vesselA, vesselB });
  }

  // Velocity decomposition from heading+speed: vx = speed * sin(heading),
  // vy = speed * cos(heading) — this is the correct sin/cos pairing for a
  // compass bearing measured clockwise from north with x=east/y=north
  // (the same convention family as bearing.ts's atan2(dx, dy)). It is easy
  // to instinctively swap sin/cos here — do not.
  const headingRadiansA = vesselA.heading * (Math.PI / 180);
  const headingRadiansB = vesselB.heading * (Math.PI / 180);
  const vA = {
    x: vesselA.speed * Math.sin(headingRadiansA),
    y: vesselA.speed * Math.cos(headingRadiansA),
  };
  const vB = {
    x: vesselB.speed * Math.sin(headingRadiansB),
    y: vesselB.speed * Math.cos(headingRadiansB),
  };

  const R = {
    x: vesselB.position.x - vesselA.position.x,
    y: vesselB.position.y - vesselA.position.y,
  };
  const V = { x: vB.x - vA.x, y: vB.y - vA.y };

  const vDotV = V.x * V.x + V.y * V.y;
  if (Math.abs(vDotV) < NEAR_ZERO_RELATIVE_VELOCITY_SQ) {
    // D-06: parallel/matching-course — no defined closest approach.
    return err("no-closure", { currentDistanceNm: Math.hypot(R.x, R.y) });
  }

  const tcpaHours = -(R.x * V.x + R.y * V.y) / vDotV;
  // D-02: TCPA is reported in minutes, not raw hours (hours-to-minutes
  // conversion dimension check: nm/(nm/hr) = hr, then hr * 60 = min).
  const tcpaMinutes = tcpaHours * 60;
  const posAtCpa = { x: R.x + V.x * tcpaHours, y: R.y + V.y * tcpaHours };
  const dcpaNm = Math.hypot(posAtCpa.x, posAtCpa.y);

  // Negative tcpaMinutes is intentionally allowed through as a valid ok()
  // result (closest approach was in the past) — resolves RESEARCH.md Open
  // Question 1 per its own recommendation, consistent with D-04's "return
  // raw" philosophy. Do not clamp to 0; do not add a new tagged reason.
  return ok({ tcpaMinutes, dcpaNm });
}
