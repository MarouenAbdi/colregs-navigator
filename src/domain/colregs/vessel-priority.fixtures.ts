import type { VesselType } from "../vessel/vessel.js";

/**
 * Rule 18 priority-tier and tie-break fixtures (DETM-02). `priorityTierCases`
 * covers all 5 vessel types' expected numeric priority; the named consts
 * below cover each `rule18Overrides()` behavior case left to engineering
 * discretion during this module's design: how to break a tie when two
 * different vessel types are equally prioritized.
 */

// Lower number = higher priority = "must be given way to" (Rule 18(a)-(c)).
export const priorityTierCases: { type: VesselType; expectedPriority: number }[] = [
  { type: "not-under-command", expectedPriority: 1 },
  { type: "restricted-in-ability-to-maneuver", expectedPriority: 1 },
  { type: "fishing", expectedPriority: 2 },
  { type: "sailing", expectedPriority: 3 },
  { type: "power-driven", expectedPriority: 4 },
];

// Co-equal tie: not-under-command and restricted-in-ability-to-maneuver
// share priority 1 -- no rule text ranks one above the other, so neither
// direction overrides.
export const nucRiatmTieCase: {
  giveWayType: VesselType;
  standOnType: VesselType;
  expectedOverride: boolean;
} = {
  giveWayType: "not-under-command",
  standOnType: "restricted-in-ability-to-maneuver",
  expectedOverride: false,
};

// Identical-type tie: two power-driven vessels -- same priority, no override.
export const sameTypeTieCase: {
  giveWayType: VesselType;
  standOnType: VesselType;
  expectedOverride: boolean;
} = {
  giveWayType: "power-driven",
  standOnType: "power-driven",
  expectedOverride: false,
};

// Genuine override: geometric baseline assigned 'fishing' (priority 2) as
// give-way and 'power-driven' (priority 4) as stand-on, but fishing
// outranks power-driven per Rule 18(a)(iii) -- this is backwards and must
// flip.
export const fishingOverridesPowerDrivenCase: {
  giveWayType: VesselType;
  standOnType: VesselType;
  expectedOverride: boolean;
} = {
  giveWayType: "fishing",
  standOnType: "power-driven",
  expectedOverride: true,
};

// Non-override: geometric baseline already has 'power-driven' (priority 4,
// lowest rank) giving way to 'fishing' (priority 2) -- already correct per
// Rule 18, no reversal needed.
export const powerDrivenNoOverrideOfFishingCase: {
  giveWayType: VesselType;
  standOnType: VesselType;
  expectedOverride: boolean;
} = {
  giveWayType: "power-driven",
  standOnType: "fishing",
  expectedOverride: false,
};
