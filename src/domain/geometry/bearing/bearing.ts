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

  if (dx === 0 && dy === 0) {
    return err("coincident-position", { a, b });
  }

  const rawDegrees = Math.atan2(dx, dy) * (180 / Math.PI);
  const normalizedDegrees = ((rawDegrees % 360) + 360) % 360;

  return ok(normalizedDegrees);
}
