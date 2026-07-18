import { describe, expect, it } from "vitest";
import type { ClassificationResult } from "../../domain/colregs/types.js";
import {
  getVesselRole,
  ROLE_BADGE_CLASSNAME,
  ROLE_BADGE_TEXT,
  ROLE_HULL_FILL_CLASS,
  type VesselRole,
} from "./vessel-role.js";

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

const ROLES: VesselRole[] = ["give-way", "stand-on", "mutual"];

describe("ROLE_HULL_FILL_CLASS", () => {
  it("has exactly the 3 VesselRole keys with the semantic-token fill classes", () => {
    expect(Object.keys(ROLE_HULL_FILL_CLASS).sort()).toEqual([...ROLES].sort());
    expect(ROLE_HULL_FILL_CLASS["give-way"]).toBe("fill-give-way");
    expect(ROLE_HULL_FILL_CLASS["stand-on"]).toBe("fill-stand-on");
    expect(ROLE_HULL_FILL_CLASS.mutual).toBe("fill-mutual");
  });
});

describe("ROLE_BADGE_TEXT", () => {
  it("has exactly the 3 VesselRole keys with the existing badge text values", () => {
    expect(Object.keys(ROLE_BADGE_TEXT).sort()).toEqual([...ROLES].sort());
    expect(ROLE_BADGE_TEXT["give-way"]).toBe("GW");
    expect(ROLE_BADGE_TEXT["stand-on"]).toBe("SO");
    expect(ROLE_BADGE_TEXT.mutual).toBe("MUTUAL");
  });
});

describe("ROLE_BADGE_CLASSNAME", () => {
  it("has exactly the 3 VesselRole keys with the 10%/35% opacity badge classes", () => {
    expect(Object.keys(ROLE_BADGE_CLASSNAME).sort()).toEqual([...ROLES].sort());
    expect(ROLE_BADGE_CLASSNAME["give-way"]).toBe("bg-give-way/10 border-give-way/35 text-give-way");
    expect(ROLE_BADGE_CLASSNAME["stand-on"]).toBe("bg-stand-on/10 border-stand-on/35 text-stand-on");
    expect(ROLE_BADGE_CLASSNAME.mutual).toBe("bg-mutual/10 border-mutual/35 text-mutual");
  });
});
