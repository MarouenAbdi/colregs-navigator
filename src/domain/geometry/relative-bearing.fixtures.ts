/**
 * Hand-derived fixtures for `relativeBearing()` (D-13, D-16).
 *
 * Convention: relativeBearing = normalize(bearing(own.position, contact.position)
 * - own.heading) to (-180, 180] (D-08). Each `ok` case documents the worked
 * trigonometry behind its expected value.
 */

import type { Vessel } from "../vessel/vessel.js";

type OkCase = { own: Vessel; contact: Vessel; expected: number };
type ErrCase = { own: Vessel; contact: Vessel };

// Own heading 000, contact dead ahead (bearing 0 deg to contact, dx=0,
// dy=5 -> due north like bearing.fixtures.ts's dueNorthCase).
// raw = 0 - 0 = 0 -> relative bearing 0 (dead ahead).
// Contact heading 180 (reciprocal) makes this the classic head-on shape
// (D-16): closing head to head, contact dead ahead.
export const headOnCase: OkCase = {
  own: { position: { x: 0, y: 0 }, heading: 0, speed: 10, type: "power-driven" },
  contact: {
    position: { x: 0, y: 5 },
    heading: 180,
    speed: 10,
    type: "power-driven",
  },
  expected: 0,
};

// Own heading 000, contact bearing 90 (due east, dx=5,dy=0).
// raw = 90 - 0 = 90 -> relative bearing 90 (dead abeam to starboard).
// Contact heading 270 (roughly perpendicular to own's course) makes this
// the classic crossing shape (D-16).
export const crossingCase: OkCase = {
  own: { position: { x: 0, y: 0 }, heading: 0, speed: 10, type: "power-driven" },
  contact: {
    position: { x: 5, y: 0 },
    heading: 270,
    speed: 10,
    type: "power-driven",
  },
  expected: 90,
};

// Own is the vessel being overtaken, heading 000. Contact approaches from
// more than 22.5 deg abaft own's beam (Rule 13's overtaking sector) on a
// similar heading (000) but at higher speed, catching up from astern.
// Bearing to contact: r=10, angle=150 deg -> dx = 10*sin(150deg) = 5,
// dy = 10*cos(150deg) = -8.660254 (10 * -sqrt(3)/2).
// raw = 150 - 0 = 150 -> relative bearing 150 (well abaft the beam,
// |150| > 112.5 deg = 90 + 22.5 deg per Rule 13's sector definition).
export const overtakingCase: OkCase = {
  own: { position: { x: 0, y: 0 }, heading: 0, speed: 8, type: "power-driven" },
  contact: {
    position: { x: 5, y: -8.660254 },
    heading: 0,
    speed: 15,
    type: "power-driven",
  },
  expected: 150,
};

// Reciprocal-heading-but-off-axis-bearing (D-16 -- a reciprocal heading
// alone must not be treated as head-on without checking the actual bearing
// to the contact): own heading 000, contact heading 180 (reciprocal --
// matches a naive "head-on by heading alone" check), but contact is
// positioned abeam (bearing 90 deg, dx=5,dy=0), not dead ahead/astern.
// raw = 90 - 0 = 90 -> relative bearing 90, nowhere near 0/180 -- proving
// heading-only reciprocity is not sufficient to classify head-on.
export const reciprocalOffAxisCase: OkCase = {
  own: { position: { x: 0, y: 0 }, heading: 0, speed: 10, type: "power-driven" },
  contact: {
    position: { x: 5, y: 0 },
    heading: 180,
    speed: 10,
    type: "power-driven",
  },
  expected: 90,
};

// Exact (-180, 180] upper-inclusive boundary (D-08): own heading 000,
// contact bearing exactly 180 (dx=0, dy=-5 -> due south, matching
// bearing.fixtures.ts's dueSouthCase -- integer inputs, no floating-point
// residue). raw = 180 - 0 = 180 exactly. The naive modulo-normalize
// formula alone maps raw=180 (and, equivalently mod 360, raw=-180) to
// -180 (mathematically correct but violates D-08's upper-inclusive/
// lower-exclusive convention), so the implementation must remap that
// case to +180, not leave it at -180.
export const exactBoundaryCase: OkCase = {
  own: { position: { x: 0, y: 0 }, heading: 0, speed: 10, type: "power-driven" },
  contact: {
    position: { x: 0, y: -5 },
    heading: 180,
    speed: 10,
    type: "power-driven",
  },
  expected: 180,
};

// Coincident positions -- bearing() itself returns
// err('coincident-position'), which relativeBearing() must propagate
// unchanged (no re-wrapping/re-tagging).
export const coincidentPropagationCase: ErrCase = {
  own: { position: { x: 3, y: 4 }, heading: 0, speed: 10, type: "power-driven" },
  contact: {
    position: { x: 3, y: 4 },
    heading: 90,
    speed: 10,
    type: "power-driven",
  },
};

// Non-finite heading (NaN) bypasses VesselSchema's runtime validation via
// direct object-literal construction (see threat_model trust boundary).
// bearing() alone would not catch this since it only inspects positions --
// relativeBearing() must guard own.heading itself.
export const nonFiniteHeadingCase: ErrCase = {
  own: { position: { x: 0, y: 0 }, heading: NaN, speed: 10, type: "power-driven" },
  contact: {
    position: { x: 1, y: 1 },
    heading: 45,
    speed: 10,
    type: "power-driven",
  },
};
