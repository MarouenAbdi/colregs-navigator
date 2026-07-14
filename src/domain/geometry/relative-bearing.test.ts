import { describe, expect, it } from "vitest";
import { relativeBearing } from "./relative-bearing.js";
import {
  coincidentPropagationCase,
  crossingCase,
  exactBoundaryCase,
  headOnCase,
  nonFiniteHeadingCase,
  overtakingCase,
  reciprocalOffAxisCase,
} from "./relative-bearing.fixtures.js";

describe("relativeBearing() classic encounter shapes (D-16)", () => {
  it("head-on: contact dead ahead, relative bearing ~0", () => {
    const result = relativeBearing(headOnCase.own, headOnCase.contact);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBeCloseTo(headOnCase.expected, 2);
    }
  });

  it("crossing: contact abeam, relative bearing ~90", () => {
    const result = relativeBearing(crossingCase.own, crossingCase.contact);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBeCloseTo(crossingCase.expected, 2);
    }
  });

  it("overtaking: contact more than 22.5 deg abaft the beam", () => {
    const result = relativeBearing(
      overtakingCase.own,
      overtakingCase.contact,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBeCloseTo(overtakingCase.expected, 2);
      expect(Math.abs(result.value)).toBeGreaterThan(112.5);
    }
  });

  it("reciprocal-heading-but-off-axis: relative bearing is NOT near 0/180 despite reciprocal headings", () => {
    const result = relativeBearing(
      reciprocalOffAxisCase.own,
      reciprocalOffAxisCase.contact,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBeCloseTo(reciprocalOffAxisCase.expected, 2);
      expect(Math.abs(result.value)).toBeGreaterThan(45);
    }
  });
});

describe("relativeBearing() normalization boundary (D-08)", () => {
  it("raw subtraction of exactly -180 is remapped to 180, not -180", () => {
    const result = relativeBearing(
      exactBoundaryCase.own,
      exactBoundaryCase.contact,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(180);
      expect(result.value).not.toBe(-180);
    }
  });
});

describe("relativeBearing() degenerate cases", () => {
  it("propagates coincident-position from bearing() unchanged", () => {
    const result = relativeBearing(
      coincidentPropagationCase.own,
      coincidentPropagationCase.contact,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("coincident-position");
    }
  });

  it("guards non-finite own.heading and returns err('invalid-input')", () => {
    const result = relativeBearing(
      nonFiniteHeadingCase.own,
      nonFiniteHeadingCase.contact,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("invalid-input");
    }
  });
});
