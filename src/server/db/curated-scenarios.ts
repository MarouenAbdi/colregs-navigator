/**
 * Curated gallery seed data (SCEN-03, D-04) -- the data `prisma/seed.ts`
 * writes directly into the `Scenario` table, bypassing the public
 * `scenario.create` mutation (D-03: no auth exists to gate who could
 * otherwise self-curate).
 *
 * Every vessel object here is imported verbatim from
 * `classify-encounter.fixtures.ts` -- never re-typed as a new literal --
 * so this file can never drift from already-tested fixture geometry
 * (05-02-PLAN.md Task 1). Per 05-RESEARCH.md's Fixture Catalog (Pitfall 3),
 * only fixtures with no `previous` field are safe to reuse here; hysteresis-
 * dependent fixtures like `overtakingHysteresisHoldsCase` are NOT used.
 *
 * D-04's shape: one clean case per core rule the reasoning trail
 * distinguishes -- head-on, give-way crossing, stand-on crossing (mirror
 * view of the SAME encounter), overtaking, plus 1-2 Rule 18 vessel-type-
 * priority examples.
 */

import type { Vessel } from "../../domain/vessel/vessel.js";
import {
  crossingResidualBasicCase,
  crossingRule18OverrideCase,
  headOnGenuineCase,
  headOnRule18OverrideCase,
  overtakingBothDirectionsCase,
} from "../../domain/colregs/classify-encounter.fixtures.js";

export interface CuratedScenario {
  vesselA: Vessel;
  vesselB: Vessel;
  rationale: string;
  displayOrder: number;
}

export const curatedScenarios: CuratedScenario[] = [
  {
    // 0: textbook head-on (headOnGenuineCase). Per Assumption A1
    // (classify-encounter.ts), every head-on match always carries
    // doubt: true -- this rationale asserts clarity about the required
    // action, not about the absence of the geometric doubt flag (Pitfall 2).
    vesselA: headOnGenuineCase.vesselA,
    vesselB: headOnGenuineCase.vesselB,
    rationale:
      "Vessel B is nearly dead ahead of Vessel A and closing — a clear head-on situation requiring both vessels to alter course to starboard.",
    displayOrder: 0,
  },
  {
    // 1: give-way crossing (crossingResidualBasicCase, normal order --
    // both power-driven, no Rule 18 involved).
    vesselA: crossingResidualBasicCase.vesselA,
    vesselB: crossingResidualBasicCase.vesselB,
    rationale:
      "Vessel A has Vessel B fine on her own starboard side — a textbook Rule 15 crossing situation where Vessel A, as the give-way vessel, must take early and substantial action to keep well clear.",
    displayOrder: 1,
  },
  {
    // 2: stand-on crossing (SAME two vessel objects as entry 1, slots
    // swapped) -- the genuine mirror view of that identical encounter,
    // not a different fixture.
    vesselA: crossingResidualBasicCase.vesselB,
    vesselB: crossingResidualBasicCase.vesselA,
    rationale:
      "This is the same crossing encounter viewed from the other vessel's perspective: Vessel A now holds the stand-on role and must hold course and speed, while Vessel B — the vessel crossing on Vessel A's own starboard side — is the one that must keep clear.",
    displayOrder: 2,
  },
  {
    // 3: overtaking (overtakingBothDirectionsCase).
    vesselA: overtakingBothDirectionsCase.vesselA,
    vesselB: overtakingBothDirectionsCase.vesselB,
    rationale:
      "Vessel B is closing on Vessel A from well abaft the beam at a higher speed — an overtaking situation where Vessel B, as the overtaking vessel, must keep clear until finally past and clear.",
    displayOrder: 3,
  },
  {
    // 4: Rule 18 vessel-type-priority override, crossing
    // (crossingRule18OverrideCase -- vesselA fishing, vesselB power-driven).
    vesselA: crossingRule18OverrideCase.vesselA,
    vesselB: crossingRule18OverrideCase.vesselB,
    rationale:
      "The geometry alone would put Vessel A in the give-way role, but Vessel A is fishing and Vessel B is power-driven — Rule 18's vessel-type hierarchy overrides the baseline, so the power-driven Vessel B must give way to the fishing vessel.",
    displayOrder: 4,
  },
  {
    // 5: Rule 18 vessel-type-priority override, head-on
    // (headOnRule18OverrideCase -- vesselA sailing, vesselB power-driven).
    vesselA: headOnRule18OverrideCase.vesselA,
    vesselB: headOnRule18OverrideCase.vesselB,
    rationale:
      "A head-on encounter would normally impose a mutual obligation on both vessels, but Vessel A is sailing and Vessel B is power-driven — Rule 18 breaks the tie, requiring the power-driven Vessel B to give way to the sailing vessel.",
    displayOrder: 5,
  },
];
