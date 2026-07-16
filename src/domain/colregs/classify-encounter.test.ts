import { describe, expect, it } from "vitest";
import { classifyEncounter } from "./classify-encounter.js";
import {
  crossingResidualBasicCase,
  crossingRule18NonOverrideCase,
  crossingRule18OverrideCase,
  doubtBandJustOverOvertakingBoundaryCase,
  doubtBandNearOvertakingBoundaryCase,
  headOnBoundaryInclusiveCase,
  headOnGenuineCase,
  headOnNucRiatmTieCase,
  headOnPitfall2OneSidedCase,
  headOnRule18OverrideCase,
  justOutsideHeadOnSectorCase,
  noClosureDoesNotPropagateCase,
  overtakingBothDirectionsCase,
  overtakingHysteresisHoldsCase,
  overtakingHysteresisReleasesCase,
  overtakingRule18NoOverrideCase,
  stage0CoincidentPropagationCase,
} from "./classify-encounter.fixtures.js";

describe("classifyEncounter() overtaking direction (Rule 13)", () => {
  it("classifies vesselB as overtaking vesselA when the bearing from A to B is more than 112.5 deg", () => {
    const result = classifyEncounter(
      overtakingBothDirectionsCase.vesselA,
      overtakingBothDirectionsCase.vesselB,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.encounterType).toBe(
        overtakingBothDirectionsCase.expectedEncounterType,
      );
      expect(result.value.riskOfCollision).toBe(
        overtakingBothDirectionsCase.expectedRiskOfCollision,
      );
      expect(result.value.giveWay).toBe(
        overtakingBothDirectionsCase.expectedGiveWay,
      );
      expect(result.value.standOn).toBe(
        overtakingBothDirectionsCase.expectedStandOn,
      );
      expect(result.value.doubt).toBe(
        overtakingBothDirectionsCase.expectedDoubt,
      );
    }
  });

  it("swapped argument order (Pitfall 1 symmetry): the same physical overtaking vessel is still identified correctly", () => {
    const swapped = classifyEncounter(
      overtakingBothDirectionsCase.vesselB,
      overtakingBothDirectionsCase.vesselA,
    );
    expect(swapped.ok).toBe(true);
    if (swapped.ok) {
      expect(swapped.value.encounterType).toBe("overtaking");
      expect(swapped.value.giveWay).toBe("vesselA");
      expect(swapped.value.standOn).toBe("vesselB");
    }
  });

  it("Pitfall 2 regression: one-sided-only near-zero bearing (non-reciprocal headings) is crossing, not head-on", () => {
    const result = classifyEncounter(
      headOnPitfall2OneSidedCase.vesselA,
      headOnPitfall2OneSidedCase.vesselB,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.encounterType).toBe("crossing");
      expect(result.value.giveWay).toBe("vesselA");
      expect(result.value.standOn).toBe("vesselB");
      expect(result.value.doubt).toBe(false);
    }
  });
});

describe("classifyEncounter() hysteresis (D-01-D-04)", () => {
  it("holds the sticky overtaking classification while Rule 7's gate still passes, even as bearing drifts into the crossing sector", () => {
    const result = classifyEncounter(
      overtakingHysteresisHoldsCase.vesselA,
      overtakingHysteresisHoldsCase.vesselB,
      overtakingHysteresisHoldsCase.previous,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.encounterType).toBe("overtaking");
      expect(result.value.riskOfCollision).toBe(true);
      expect(result.value.giveWay).toBe("vesselB");
      expect(result.value.standOn).toBe("vesselA");
      expect(result.value.doubt).toBe(false);
      // Sticky path skips Rule 13/14/15's own trail entries entirely.
      const ruleIds = result.value.trail.map((entry) => entry.ruleId);
      expect(ruleIds).toContain("Rule 7");
      expect(ruleIds).toContain("Rule 13(d)");
      expect(ruleIds).not.toContain("Rule 15");
    }
  });

  it("fully RELEASES (not softens) the instant Rule 7's gate fails -- Pitfall 4 regression", () => {
    const released = classifyEncounter(
      overtakingHysteresisReleasesCase.vesselA,
      overtakingHysteresisReleasesCase.vesselB,
      overtakingHysteresisReleasesCase.previous,
    );
    expect(released.ok).toBe(true);
    if (released.ok) {
      expect(released.value.encounterType).toBe("crossing");
      expect(released.value.riskOfCollision).toBe(false);
    }

    const fresh = classifyEncounter(
      overtakingHysteresisReleasesCase.vesselA,
      overtakingHysteresisReleasesCase.vesselB,
    );
    expect(fresh.ok).toBe(true);

    if (released.ok && fresh.ok) {
      expect(released.value.encounterType).toBe(fresh.value.encounterType);
      expect(released.value.giveWay).toBe(fresh.value.giveWay);
      expect(released.value.standOn).toBe(fresh.value.standOn);
    }
  });
});

describe("classifyEncounter() head-on (Rule 14, Pitfall 2)", () => {
  it("classifies a genuine head-on encounter with mutual giveWay/standOn=null for same-type vessels", () => {
    const result = classifyEncounter(
      headOnGenuineCase.vesselA,
      headOnGenuineCase.vesselB,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.encounterType).toBe("head-on");
      expect(result.value.giveWay).toBeNull();
      expect(result.value.standOn).toBeNull();
      expect(result.value.doubt).toBe(true);
      expect(result.value.doubtBoundary).toBe("near-head-on-boundary");
    }
  });
});

describe("classifyEncounter() crossing residual (Rule 15)", () => {
  it("classifies a basic crossing encounter with give-way assigned to the vessel with the other on her starboard side", () => {
    const result = classifyEncounter(
      crossingResidualBasicCase.vesselA,
      crossingResidualBasicCase.vesselB,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.encounterType).toBe("crossing");
      expect(result.value.giveWay).toBe("vesselA");
      expect(result.value.standOn).toBe("vesselB");
      expect(result.value.doubt).toBe(false);
    }
  });
});

describe("classifyEncounter() doubt band (D-09-D-12)", () => {
  it("110 deg: still crossing, within the doubt band of the overtaking/crossing boundary", () => {
    const result = classifyEncounter(
      doubtBandNearOvertakingBoundaryCase.vesselA,
      doubtBandNearOvertakingBoundaryCase.vesselB,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.encounterType).toBe("crossing");
      expect(result.value.doubt).toBe(true);
      expect(result.value.doubtBoundary).toBe(
        "near-overtaking-crossing-boundary",
      );
    }
  });

  it("115 deg: now overtaking, still within the doubt band from the other side of the boundary", () => {
    const result = classifyEncounter(
      doubtBandJustOverOvertakingBoundaryCase.vesselA,
      doubtBandJustOverOvertakingBoundaryCase.vesselB,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.encounterType).toBe("overtaking");
      expect(result.value.doubt).toBe(true);
      expect(result.value.doubtBoundary).toBe(
        "near-overtaking-crossing-boundary",
      );
    }
  });

  it("exactly 5 deg both directions: inclusive head-on boundary", () => {
    const result = classifyEncounter(
      headOnBoundaryInclusiveCase.vesselA,
      headOnBoundaryInclusiveCase.vesselB,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.encounterType).toBe("head-on");
      expect(result.value.doubt).toBe(true);
      expect(result.value.doubtBoundary).toBe("near-head-on-boundary");
    }
  });

  it("5.5 deg both directions: just outside the head-on sector, no doubt band beyond it", () => {
    const result = classifyEncounter(
      justOutsideHeadOnSectorCase.vesselA,
      justOutsideHeadOnSectorCase.vesselB,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.encounterType).toBe("crossing");
      expect(result.value.doubt).toBe(false);
    }
  });
});

describe("classifyEncounter() Rule 18 override (DETM-02)", () => {
  it("flips give-way for a fishing/power-driven crossing encounter (fishing outranks power-driven)", () => {
    const result = classifyEncounter(
      crossingRule18OverrideCase.vesselA,
      crossingRule18OverrideCase.vesselB,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.giveWay).toBe("vesselB");
      expect(result.value.standOn).toBe("vesselA");
    }
  });

  it("does NOT flip give-way for the reverse power-driven/fishing assignment (baseline already correct)", () => {
    const result = classifyEncounter(
      crossingRule18NonOverrideCase.vesselA,
      crossingRule18NonOverrideCase.vesselB,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.giveWay).toBe("vesselA");
      expect(result.value.standOn).toBe("vesselB");
    }
  });

  it("assigns give-way/stand-on for a head-on encounter when vessel-type priority differs", () => {
    const result = classifyEncounter(
      headOnRule18OverrideCase.vesselA,
      headOnRule18OverrideCase.vesselB,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.encounterType).toBe("head-on");
      expect(result.value.giveWay).toBe("vesselB");
      expect(result.value.standOn).toBe("vesselA");
    }
  });

  it("keeps giveWay/standOn both null for the co-equal NUC/RIATM head-on tie", () => {
    const result = classifyEncounter(
      headOnNucRiatmTieCase.vesselA,
      headOnNucRiatmTieCase.vesselB,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.giveWay).toBeNull();
      expect(result.value.standOn).toBeNull();
    }
  });

  it("CR-01 regression: does NOT apply Rule 18 to an overtaking encounter -- the overtaking vessel keeps give-way even though it outranks the vessel being overtaken", () => {
    const result = classifyEncounter(
      overtakingRule18NoOverrideCase.vesselA,
      overtakingRule18NoOverrideCase.vesselB,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.encounterType).toBe("overtaking");
      expect(result.value.giveWay).toBe("vesselB");
      expect(result.value.standOn).toBe("vesselA");
      const ruleIds = result.value.trail.map((entry) => entry.ruleId);
      expect(ruleIds).toContain("Rule 13(a)");
    }
  });
});

describe("classifyEncounter() Stage 0 geometry propagation", () => {
  it("propagates relativeBearing()'s coincident-position failure unchanged", () => {
    const result = classifyEncounter(
      stage0CoincidentPropagationCase.vesselA,
      stage0CoincidentPropagationCase.vesselB,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("coincident-position");
    }
  });

  it("does NOT propagate cpa()'s parallel/matching-course result as a failure (D-07) -- classification proceeds normally", () => {
    const result = classifyEncounter(
      noClosureDoesNotPropagateCase.vesselA,
      noClosureDoesNotPropagateCase.vesselB,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.encounterType).toBe("crossing");
      expect(result.value.riskOfCollision).toBe(false);
      expect(result.value.giveWay).toBe("vesselA");
      expect(result.value.standOn).toBe("vesselB");
    }
  });
});
