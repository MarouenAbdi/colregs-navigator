/**
 * Hand-derived fixtures for `bearing()` (D-13).
 *
 * Each case documents the worked trigonometry so correctness is auditable
 * without re-deriving the math. Convention: `bearing = atan2(dx, dy)`,
 * normalized to [0, 360) — 0=N, 90=E, 180=S, 270=W (D-08).
 */

import type { Position } from "../../vessel/vessel.js";

type OkCase = { a: Position; b: Position; expected: number };
type ErrCase = { a: Position; b: Position };

// dx = 5 - 0 = 5, dy = 0 - 0 = 0 -> atan2(5, 0) = 90 deg (due east).
export const dueEastCase: OkCase = {
  a: { x: 0, y: 0 },
  b: { x: 5, y: 0 },
  expected: 90,
};

// dx = 0 - 0 = 0, dy = 5 - 0 = 5 -> atan2(0, 5) = 0 deg (due north).
export const dueNorthCase: OkCase = {
  a: { x: 0, y: 0 },
  b: { x: 0, y: 5 },
  expected: 0,
};

// dx = 0 - 0 = 0, dy = -5 - 0 = -5 -> atan2(0, -5) = 180 deg (due south).
export const dueSouthCase: OkCase = {
  a: { x: 0, y: 0 },
  b: { x: 0, y: -5 },
  expected: 180,
};

// dx = -5 - 0 = -5, dy = 0 - 0 = 0 -> atan2(-5, 0) = -90 deg,
// normalized ((-90 % 360) + 360) % 360 = 270 deg (due west).
export const dueWestCase: OkCase = {
  a: { x: 0, y: 0 },
  b: { x: -5, y: 0 },
  expected: 270,
};

// dx = -0.001 - 0 = -0.001, dy = 5 - 0 = 5 -> atan2(-0.001, 5)
// ~= -0.011459 deg (small negative angle just west of due north),
// normalized to ~359.9885 deg -- confirms normalization approaches but
// never reaches exactly 360.
export const near360BoundaryCase: OkCase = {
  a: { x: 0, y: 0 },
  b: { x: -0.001, y: 5 },
  expected: 359.99,
};

// Identical positions -> dx = 0, dy = 0 -> bearing is geometrically
// undefined (D-07). Must return err('coincident-position'), never 0.
export const coincidentPositionCase: ErrCase = {
  a: { x: 2, y: 3 },
  b: { x: 2, y: 3 },
};

// Separation of 1e-7 chart-space units -- sub-threshold (below
// COINCIDENT_DISTANCE_THRESHOLD of 1e-6) but nonzero, so exact dx===0/dy===0
// equality would miss it. Must still classify as coincident (D-11).
export const nearCoincidentPositionCase: ErrCase = {
  a: { x: 2, y: 3 },
  b: { x: 2 + 1e-7, y: 3 },
};

// Non-finite coordinate (NaN) must be rejected before any atan2/normalize
// arithmetic runs.
export const nonFiniteInputCase: ErrCase = {
  a: { x: NaN, y: 0 },
  b: { x: 1, y: 1 },
};

// Non-finite coordinate (Infinity) must also be rejected.
export const infiniteInputCase: ErrCase = {
  a: { x: 0, y: 0 },
  b: { x: Infinity, y: 0 },
};
