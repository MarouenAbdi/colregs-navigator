import { describe, expect, it } from "vitest";
import { bearing } from "./bearing.js";
import {
  coincidentPositionCase,
  dueEastCase,
  dueNorthCase,
  dueSouthCase,
  dueWestCase,
  infiniteInputCase,
  near360BoundaryCase,
  nonFiniteInputCase,
} from "./bearing.fixtures.js";

describe("bearing() cardinal directions", () => {
  it("due east: 90 deg", () => {
    const result = bearing(dueEastCase.a, dueEastCase.b);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBeCloseTo(dueEastCase.expected, 2);
    }
  });

  it("due north: 0 deg", () => {
    const result = bearing(dueNorthCase.a, dueNorthCase.b);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBeCloseTo(dueNorthCase.expected, 2);
    }
  });

  it("due south: 180 deg", () => {
    const result = bearing(dueSouthCase.a, dueSouthCase.b);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBeCloseTo(dueSouthCase.expected, 2);
    }
  });

  it("due west: 270 deg", () => {
    const result = bearing(dueWestCase.a, dueWestCase.b);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBeCloseTo(dueWestCase.expected, 2);
    }
  });
});

describe("bearing() normalization boundary", () => {
  it("near-360 case normalizes into [359.9, 360), never exactly 360", () => {
    const result = bearing(near360BoundaryCase.a, near360BoundaryCase.b);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBeGreaterThanOrEqual(359.9);
      expect(result.value).toBeLessThan(360);
      expect(result.value).toBeCloseTo(near360BoundaryCase.expected, 2);
    }
  });
});

describe("bearing() degenerate cases", () => {
  it("coincident positions return err('coincident-position')", () => {
    const result = bearing(
      coincidentPositionCase.a,
      coincidentPositionCase.b,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("coincident-position");
    }
  });

  it("NaN coordinate returns err('invalid-input')", () => {
    const result = bearing(nonFiniteInputCase.a, nonFiniteInputCase.b);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("invalid-input");
    }
  });

  it("Infinity coordinate returns err('invalid-input')", () => {
    const result = bearing(infiniteInputCase.a, infiniteInputCase.b);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("invalid-input");
    }
  });
});
