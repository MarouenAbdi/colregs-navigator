/**
 * Bearing to a contact vessel relative to own vessel's heading.
 *
 * Composes `bearing()` (this module's own atan2 convention lives there,
 * not here) and normalizes the difference to (-180, 180] (D-08) --
 * upper-inclusive, lower-exclusive, matching CLAUDE.md's locked
 * convention. Result is raw, unrounded degrees (D-04).
 */

import type { Vessel } from "../vessel/vessel.js";
import { err, ok, type Result } from "../shared/result.js";
import { bearing } from "./bearing.js";

export function relativeBearing(own: Vessel, contact: Vessel): Result<number> {
  // bearing() alone would not catch a non-finite heading (it only
  // inspects positions), so this guard is unique to this function.
  // Position-level non-finite values are already caught by
  // the composed bearing() call below -- no duplicate guard
  // needed here.
  if (!Number.isFinite(own.heading)) {
    return err("invalid-input", { own });
  }

  const bearingResult = bearing(own.position, contact.position);
  if (!bearingResult.ok) {
    // Propagate unchanged -- do not re-wrap or re-tag the failure.
    return bearingResult;
  }

  const raw = bearingResult.value - own.heading;

  // Standard modulo-normalize maps raw ~180 to the mathematically
  // equivalent -180, which violates D-08's upper-inclusive/
  // lower-exclusive (-180, 180] convention -- remap that one case.
  let normalized = (((raw + 180) % 360) + 360) % 360 - 180;
  if (normalized === -180) {
    normalized = 180;
  }

  return ok(normalized);
}
