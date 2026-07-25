/**
 * True compass bearing between two chart positions.
 *
 * Locked convention (CLAUDE.md): dx is the atan2 y-argument and dy is the
 * atan2 x-argument (NOT the JS-standard order) — bearing is measured
 * clockwise from North, not counterclockwise from East. Result is raw,
 * unrounded degrees in [0, 360) (D-04, D-08). Degenerate/invalid inputs
 * return a tagged `Result` failure instead of NaN/Infinity/a
 * silently-wrong 0 (D-07: degenerate/invalid inputs must be caught
 * explicitly, never silently coerced to 0).
 */

import type { Position } from "../../vessel/vessel.js";
import { err, ok, type Result } from "../../shared/result.js";

// D-11: widened from exact dx===0 && dy===0 equality to a small distance
// threshold -- a drag gesture can land the two vessels a sub-pixel
// fraction apart in chart-space units without ever producing exact
// floating-point equality, which let genuinely-coincident-looking drags
// slip past this guard and reach atan2 with a near-zero (but nonzero)
// argument, producing a wildly unstable bearing rather than the intended
// "unable to classify" degenerate signal. 1e-6 chart-space units is far
// below any real, humanly-perceptible vessel separation on this chart's
// viewBox scale, so it only catches true coincident/near-coincident drags.
const COINCIDENT_DISTANCE_THRESHOLD = 1e-6;

export function bearing(a: Position, b: Position): Result<number> {
  if (
    !Number.isFinite(a.x) ||
    !Number.isFinite(a.y) ||
    !Number.isFinite(b.x) ||
    !Number.isFinite(b.y)
  ) {
    return err("invalid-input", { a, b });
  }

  // Named intermediates (not inlined into atan2) so the argument order
  // below is visually auditable at the call site (Pitfall 1).
  const dx = b.x - a.x;
  const dy = b.y - a.y;

  if (Math.hypot(dx, dy) < COINCIDENT_DISTANCE_THRESHOLD) {
    return err("coincident-position", { a, b });
  }

  const rawDegrees = Math.atan2(dx, dy) * (180 / Math.PI);
  const normalizedDegrees = ((rawDegrees % 360) + 360) % 360;

  return ok(normalizedDegrees);
}
