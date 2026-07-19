/**
 * Curated gallery seed data (GAL-01, D-01 through D-05) -- the data
 * `prisma/seed.ts` writes directly into the `Scenario` table, bypassing the
 * public `scenario.create` mutation (no auth exists to gate who could
 * otherwise self-curate).
 *
 * Every vessel object here is imported verbatim from
 * `classify-encounter.fixtures.ts` -- never re-typed as a new literal --
 * so this file can never drift from already-tested fixture geometry.
 * Per 05-RESEARCH.md's Fixture Catalog (Pitfall 3), only fixtures with no
 * `previous` field are safe to reuse here; hysteresis-dependent fixtures
 * are NOT used.
 *
 * These 6 entries match Main-Design.png's Gallery section exactly (D-01):
 * Classic crossing (Rule 15), Head-on meeting (Rule 14), Overtaking
 * (Rule 13), Sailing has priority (Rule 18), Not under command (Rule 18),
 * In doubt (Rule 7) -- the same 6 labels Phase 8's Sandbox chip row uses.
 */

import type { Vessel } from "../../domain/vessel/vessel.js";
import {
  crossingNotUnderCommandCase,
  crossingResidualBasicCase,
  crossingSailingPriorityCase,
  headOnGenuineCase,
  headOnInDoubtCase,
  overtakingBothDirectionsCase,
} from "../../domain/colregs/classify-encounter.fixtures.js";

export interface CuratedScenario {
  vesselA: Vessel;
  vesselB: Vessel;
  title: string;
  ruleLabel: string;
  rationale: string;
  displayOrder: number;
}

export const curatedScenarios: CuratedScenario[] = [
  {
    // 0: classic crossing (crossingResidualBasicCase -- both power-driven,
    // no Rule 18 involved).
    vesselA: crossingResidualBasicCase.vesselA,
    vesselB: crossingResidualBasicCase.vesselB,
    title: "Classic crossing",
    ruleLabel: "Rule 15",
    rationale:
      "Power-driven vessels on crossing courses; the one with the other to starboard keeps clear.",
    displayOrder: 0,
  },
  {
    // 1: textbook head-on (headOnGenuineCase). Per Assumption A1
    // (classify-encounter.ts), every head-on match always carries
    // doubt: true -- this rationale asserts clarity about the required
    // action, not about the absence of the geometric doubt flag.
    vesselA: headOnGenuineCase.vesselA,
    vesselB: headOnGenuineCase.vesselB,
    title: "Head-on meeting",
    ruleLabel: "Rule 14",
    rationale:
      "Reciprocal courses, each dead ahead of the other — both alter course to starboard.",
    displayOrder: 1,
  },
  {
    // 2: overtaking (overtakingBothDirectionsCase, slots swapped so
    // giveWay resolves to vesselA, matching this card's "A GIVES WAY" role
    // badge -- Pitfall 1's direction convention means the fixture's own
    // vesselB is the overtaking/give-way vessel).
    vesselA: overtakingBothDirectionsCase.vesselB,
    vesselB: overtakingBothDirectionsCase.vesselA,
    title: "Overtaking",
    ruleLabel: "Rule 13",
    rationale:
      "A faster vessel comes up from abaft the beam and must keep clear.",
    displayOrder: 2,
  },
  {
    // 3: Rule 18 vessel-type-priority, crossing (crossingSailingPriorityCase
    // -- vesselA power-driven, vesselB sailing). Geometric baseline already
    // matches Rule 18's outcome -- see Task 2's research-gap note in
    // 09-01-PLAN.md for why `ruleLabel` is a static field, not derived.
    vesselA: crossingSailingPriorityCase.vesselA,
    vesselB: crossingSailingPriorityCase.vesselB,
    title: "Sailing has priority",
    ruleLabel: "Rule 18",
    rationale:
      "A power-driven vessel keeps clear of a sailing vessel regardless of geometry.",
    displayOrder: 3,
  },
  {
    // 4: Rule 18 vessel-type-priority, crossing (crossingNotUnderCommandCase
    // -- vesselA power-driven, vesselB not-under-command). Geometric
    // baseline would favor vesselB giving way; Rule 18 flips the verdict
    // onto vesselA to protect the NUC vessel's special status.
    vesselA: crossingNotUnderCommandCase.vesselA,
    vesselB: crossingNotUnderCommandCase.vesselB,
    title: "Not under command",
    ruleLabel: "Rule 18",
    rationale:
      "Every other vessel keeps out of the way of a vessel not under command.",
    displayOrder: 4,
  },
  {
    // 5: near-reciprocal, ambiguous head-on (headOnInDoubtCase -- both
    // sailing, a same-tier tie so Rule 18 does not override).
    vesselA: headOnInDoubtCase.vesselA,
    vesselB: headOnInDoubtCase.vesselB,
    title: "In doubt",
    ruleLabel: "Rule 7",
    rationale:
      "Near-reciprocal but ambiguous — assume a head-on situation exists and act accordingly.",
    displayOrder: 5,
  },
];
