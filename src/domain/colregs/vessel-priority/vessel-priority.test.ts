import { describe, expect, it } from "vitest";
import { rule18Overrides, vesselPriority } from "./vessel-priority.js";
import {
  fishingOverridesPowerDrivenCase,
  nucRiatmTieCase,
  powerDrivenNoOverrideOfFishingCase,
  priorityTierCases,
  sameTypeTieCase,
} from "./vessel-priority.fixtures.js";

describe("vesselPriority() tier ranking", () => {
  for (const fixture of priorityTierCases) {
    it(`ranks '${fixture.type}' as priority ${fixture.expectedPriority}`, () => {
      expect(vesselPriority(fixture.type)).toBe(fixture.expectedPriority);
    });
  }
});

describe("rule18Overrides() tie-break mechanics", () => {
  it("does not override for the co-equal not-under-command/RIATM tie", () => {
    expect(rule18Overrides(nucRiatmTieCase.giveWayType, nucRiatmTieCase.standOnType)).toBe(
      nucRiatmTieCase.expectedOverride,
    );
  });

  it("does not override when both vessels share the same type", () => {
    expect(rule18Overrides(sameTypeTieCase.giveWayType, sameTypeTieCase.standOnType)).toBe(
      sameTypeTieCase.expectedOverride,
    );
  });

  it("overrides when the geometric give-way vessel (fishing) outranks the stand-on vessel (power-driven)", () => {
    expect(
      rule18Overrides(
        fishingOverridesPowerDrivenCase.giveWayType,
        fishingOverridesPowerDrivenCase.standOnType,
      ),
    ).toBe(fishingOverridesPowerDrivenCase.expectedOverride);
  });

  it("does not override the reverse direction (power-driven give-way to fishing stand-on is already correct)", () => {
    expect(
      rule18Overrides(
        powerDrivenNoOverrideOfFishingCase.giveWayType,
        powerDrivenNoOverrideOfFishingCase.standOnType,
      ),
    ).toBe(powerDrivenNoOverrideOfFishingCase.expectedOverride);
  });
});
