/**
 * Phase 1 scope: compass<->math angle conversion only. The pure
 * screen-pixel <-> chart {x,y} coordinate-conversion functions are
 * implemented in this same phase, in a sibling file (screen-convert.ts,
 * this plan's Task 3) — kept separate from this file because they convert
 * screen-space pixel coordinates, not compass/math angles. Only the
 * *caller* that measures live containerSize via ResizeObserver and
 * supplies the chart's viewBox is Phase 4's (Interactive Chart Sandbox)
 * responsibility, per CLAUDE.md's SVG + Pointer Events architecture note;
 * the conversion functions themselves are not deferred.
 *
 * Unlike bearing/relativeBearing/cpa, none of the four functions below have
 * a degenerate runtime case (there is no "coincident position" or
 * "no-closure" analog for a pure angle conversion) — any finite real
 * number is a valid input, so these return a plain `number`, not a
 * `Result<T>`.
 */

export function compassToMathDegrees(compassDegrees: number): number {
  if (!Number.isFinite(compassDegrees)) {
    throw new TypeError(`compassToMathDegrees: expected a finite number, got ${compassDegrees}`);
  }
  return normalizeCompassDegrees(90 - compassDegrees);
}

export function mathToCompassDegrees(mathDegrees: number): number {
  if (!Number.isFinite(mathDegrees)) {
    throw new TypeError(`mathToCompassDegrees: expected a finite number, got ${mathDegrees}`);
  }
  // Self-inverse: the same 90-minus-transform converts in both directions.
  return normalizeCompassDegrees(90 - mathDegrees);
}

export function normalizeCompassDegrees(degrees: number): number {
  if (!Number.isFinite(degrees)) {
    throw new TypeError(`normalizeCompassDegrees: expected a finite number, got ${degrees}`);
  }
  // D-08: true bearing normalized into [0, 360).
  return ((degrees % 360) + 360) % 360;
}

export function normalizeRelativeBearingDegrees(degrees: number): number {
  if (!Number.isFinite(degrees)) {
    throw new TypeError(
      `normalizeRelativeBearingDegrees: expected a finite number, got ${degrees}`,
    );
  }
  // D-08: relative bearing normalized into (-180, 180], upper-inclusive.
  // This duplicates ~2 lines of relative-bearing.ts's own inline
  // normalization intentionally (kept file-independent so this plan and
  // Plan 02 can execute in the same wave without a file dependency; not
  // worth extracting into a shared helper at this scale per CLAUDE.md's
  // "justify every abstraction" persona).
  const normalized = (((degrees + 180) % 360) + 360) % 360 - 180;
  return normalized === -180 ? 180 : normalized;
}
