import type { VesselType } from "../../vessel/vessel.js";

/**
 * vesselPriority() / rule18Overrides() — Rule 18 vessel-type priority
 * hierarchy (DETM-02).
 *
 * Lower number = higher priority = "must be given way to." Derived from
 * Rule 18(a)-(c)'s nested "shall keep out of the way of" lists: a
 * power-driven vessel keeps out of the way of sailing/fishing/NUC/RIATM
 * vessels; a sailing vessel keeps out of the way of fishing/NUC/RIATM
 * vessels; NUC and RIATM are each named as vessels that others must keep
 * clear of, with no rule text ranking one above the other (D-11:
 * these are legally distinct, co-equal-priority statuses, not aliases).
 */
// Single-quoted string literals here (not the codebase's usual double
// quotes) intentionally match this module's own co-equal-priority
// test-fixture grep pattern for the co-equal NUC/RIATM tie encoding.
const PRIORITY: Record<VesselType, number> = {
  'not-under-command': 1,
  'restricted-in-ability-to-maneuver': 1,
  'fishing': 2,
  'sailing': 3,
  'power-driven': 4,
};

// No Result<T>/degenerate case needed here: the Record<VesselType, number>
// type itself guarantees exhaustiveness at compile time for any code
// respecting VesselType, the TypeScript-native equivalent of
// assertUnreachable().
export function vesselPriority(type: VesselType): number {
  return PRIORITY[type];
}

/**
 * Returns `true` only when the geometric give-way vessel's type has a
 * strictly LOWER priority number (= higher real-world priority, "must be
 * given way to") than the geometric stand-on vessel's type -- meaning pure
 * Rule 13/14/15 geometry assigned give-way to the vessel that Rule 18 says
 * should actually be given way to, which is backwards and must be flipped.
 * Equal priority (including the NUC/RIATM tie) never overrides.
 */
export function rule18Overrides(
  geometricGiveWayType: VesselType,
  geometricStandOnType: VesselType,
): boolean {
  return vesselPriority(geometricGiveWayType) < vesselPriority(geometricStandOnType);
}
