import { describe, expect, it } from "vitest";
import type { ClassificationResult } from "../../domain/colregs/types.js";
import { getVesselRole } from "./vessel-role.js";

describe("getVesselRole", () => {
  it("returns 'give-way' when classification.giveWay === the queried vessel", () => {
    const classification: ClassificationResult = {
      encounterType: "crossing",
      riskOfCollision: true,
      giveWay: "vesselA",
      standOn: "vesselB",
      doubt: false,
      trail: [],
    };
    expect(getVesselRole("vesselA", classification)).toBe("give-way");
  });

  it("returns 'stand-on' when classification.standOn === the queried vessel", () => {
    const classification: ClassificationResult = {
      encounterType: "crossing",
      riskOfCollision: true,
      giveWay: "vesselB",
      standOn: "vesselA",
      doubt: false,
      trail: [],
    };
    expect(getVesselRole("vesselA", classification)).toBe("stand-on");
  });

  it("returns 'mutual' when both giveWay and standOn are null", () => {
    const classification: ClassificationResult = {
      encounterType: "head-on",
      riskOfCollision: true,
      giveWay: null,
      standOn: null,
      doubt: false,
      trail: [],
    };
    expect(getVesselRole("vesselA", classification)).toBe("mutual");
  });
});
