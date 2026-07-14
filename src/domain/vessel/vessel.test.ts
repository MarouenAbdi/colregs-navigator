import { describe, expect, it } from "vitest";
import {
  PositionSchema,
  VesselSchema,
  VesselTypeSchema,
} from "./vessel.js";

const validVessel = {
  position: { x: 0, y: 0 },
  heading: 90,
  speed: 12,
  type: "power-driven" as const,
};

describe("VesselTypeSchema", () => {
  const allFiveTypes = [
    "power-driven",
    "sailing",
    "fishing",
    "not-under-command",
    "restricted-in-ability-to-maneuver",
  ] as const;

  it.each(allFiveTypes)("accepts '%s'", (type) => {
    expect(VesselTypeSchema.safeParse(type).success).toBe(true);
  });

  it("rejects the British spelling 'restricted-in-ability-to-manoeuvre'", () => {
    expect(
      VesselTypeSchema.safeParse("restricted-in-ability-to-manoeuvre").success,
    ).toBe(false);
  });

  it("rejects an unrelated string like 'cargo'", () => {
    expect(VesselTypeSchema.safeParse("cargo").success).toBe(false);
  });
});

describe("PositionSchema", () => {
  it("accepts unbounded numeric x/y (no min/max, D-01/D-03)", () => {
    expect(PositionSchema.safeParse({ x: -99999, y: 99999 }).success).toBe(true);
  });

  it("rejects non-numeric input", () => {
    expect(PositionSchema.safeParse({ x: "0", y: 0 }).success).toBe(false);
  });

  it("rejects NaN", () => {
    expect(PositionSchema.safeParse({ x: NaN, y: 0 }).success).toBe(false);
  });
});

describe("VesselSchema heading boundary (D-10 reject-not-normalize)", () => {
  it("accepts heading 0", () => {
    expect(VesselSchema.safeParse({ ...validVessel, heading: 0 }).success).toBe(true);
  });

  it("accepts heading 359.999", () => {
    expect(
      VesselSchema.safeParse({ ...validVessel, heading: 359.999 }).success,
    ).toBe(true);
  });

  it("rejects heading 360 (does not wrap to 0)", () => {
    expect(VesselSchema.safeParse({ ...validVessel, heading: 360 }).success).toBe(
      false,
    );
  });

  it("rejects heading -10 (does not wrap to 350)", () => {
    expect(VesselSchema.safeParse({ ...validVessel, heading: -10 }).success).toBe(
      false,
    );
  });
});

describe("VesselSchema speed boundary (D-09 no ceiling)", () => {
  it("accepts speed 0 (anchored/dead-in-water)", () => {
    expect(VesselSchema.safeParse({ ...validVessel, speed: 0 }).success).toBe(true);
  });

  it("accepts a large speed value with no ceiling", () => {
    expect(VesselSchema.safeParse({ ...validVessel, speed: 500 }).success).toBe(
      true,
    );
  });

  it("rejects speed -1", () => {
    expect(VesselSchema.safeParse({ ...validVessel, speed: -1 }).success).toBe(
      false,
    );
  });
});

describe("VesselSchema construction semantics", () => {
  it("safeParse never throws and returns { success: false } for invalid input", () => {
    expect(() =>
      VesselSchema.safeParse({ ...validVessel, heading: 360 }),
    ).not.toThrow();
    expect(VesselSchema.safeParse({ ...validVessel, heading: 360 }).success).toBe(
      false,
    );
  });

  it("parse throws a ZodError for invalid input", () => {
    expect(() => VesselSchema.parse({ ...validVessel, heading: 360 })).toThrow();
  });

  it("accepts a fully valid vessel", () => {
    expect(VesselSchema.safeParse(validVessel).success).toBe(true);
  });
});
