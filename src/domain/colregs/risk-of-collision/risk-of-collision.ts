import type { Result } from "../../shared/result.js";

/**
 * riskOfCollision() — Rule 7 gate (CLAS-03, D-05-D-08).
 *
 * Consumes the `Result<{ tcpaMinutes, dcpaNm }>` produced by this codebase's
 * own `cpa()` and reduces it to a plain `boolean` — deliberately NOT
 * `Result<boolean>`, because "no risk" is a valid classification outcome,
 * not a degenerate/error case. This mirrors relative-bearing.ts's
 * "propagate unchanged, don't re-wrap" philosophy applied one level up:
 * the *input* `cpaResult`'s `Result` failure is consumed and converted
 * into a definite `false`, not re-propagated as a new failure.
 */

// D-06: the DCPA distance threshold is 1.0nm — a round, easily-documented/
// tunable value appropriate for this synthetic nm-scale sandbox.
export const RISK_OF_COLLISION_DCPA_THRESHOLD_NM = 1.0;

export function riskOfCollision(
  cpaResult: Result<{ tcpaMinutes: number; dcpaNm: number }>,
): boolean {
  if (!cpaResult.ok) {
    // D-07: cpa()'s tagged 'no-closure' result (parallel/matching-course
    // vessels) is treated as "no risk of collision" automatically. Any
    // other reason reaching here (e.g. 'invalid-input') should not occur
    // since Stage 0 of classifyEncounter propagates it before this point —
    // conservatively treated as no risk rather than thrown.
    return false;
  }

  // D-05 + D-08: BOTH a positive TCPA (still closing) AND a DCPA at or
  // under the threshold are required. `<=` makes the threshold inclusive
  // per the "at or under" wording. A negative TCPA always means no risk,
  // regardless of how small DCPA was — no grace window after CPA=0.
  return (
    cpaResult.value.tcpaMinutes > 0 &&
    cpaResult.value.dcpaNm <= RISK_OF_COLLISION_DCPA_THRESHOLD_NM
  );
}
