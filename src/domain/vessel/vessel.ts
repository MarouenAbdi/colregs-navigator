import * as z from "zod";

/**
 * COLREGS vessel-type statuses relevant to Rule 18's give-way hierarchy.
 * Five distinct values (D-11): Rule 3(f)'s status and Rule 3(g)'s status
 * are legally distinct, co-equal-priority statuses, not aliases of one
 * another — see the two dedicated enum members below.
 */
export const VesselTypeSchema = z.enum([
  "power-driven",
  "sailing",
  "fishing",
  "not-under-command",
  "restricted-in-ability-to-maneuver",
]); // D-12: kebab-case, matches COLREGS terminology verbatim

// Position in nautical miles (nm) from an arbitrary chart origin (D-01).
// x = east, y = north (D-03). The plane is unbounded — no artificial
// position-range validation belongs in the domain layer.
export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const VesselSchema = z.object({
  position: PositionSchema,
  // D-10: heading must already be in [0, 360) at construction — rejected,
  // not normalized mod 360. Do NOT add a transform/coercion step here.
  heading: z.number().gte(0).lt(360),
  // D-09: speed >= 0 with no upper ceiling; 0 is a valid anchored/
  // dead-in-water state.
  speed: z.number().gte(0),
  type: VesselTypeSchema,
});

export type Vessel = z.infer<typeof VesselSchema>;
export type Position = z.infer<typeof PositionSchema>;
export type VesselType = z.infer<typeof VesselTypeSchema>;
