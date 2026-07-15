import { describe, expect, it } from "vitest";
import {
  compassToMathDegrees,
  mathToCompassDegrees,
  normalizeCompassDegrees,
  normalizeRelativeBearingDegrees,
} from "./angle-convert.js";
import {
  compassEastToMathCase,
  compassNorthToMathCase,
  compassSouthToMathCase,
  mathZeroToCompassCase,
  normalizeNegativeCase,
  normalizeOverflowCase,
  normalizeUpperBoundaryCase,
  relativeBearingLowerSeamCase,
  relativeBearingUpperBoundaryCase,
  relativeBearingWrapCase,
  roundTripSamples,
} from "./angle-convert.fixtures.js";

describe("compassToMathDegrees", () => {
  it("converts compass north (0) to math 90", () => {
    expect(compassToMathDegrees(compassNorthToMathCase.compassDegrees)).toBeCloseTo(
      compassNorthToMathCase.expectedMathDegrees,
      2,
    );
  });

  it("converts compass east (90) to math 0", () => {
    expect(compassToMathDegrees(compassEastToMathCase.compassDegrees)).toBeCloseTo(
      compassEastToMathCase.expectedMathDegrees,
      2,
    );
  });

  it("converts compass south (180) to math 270, normalized into [0,360)", () => {
    expect(compassToMathDegrees(compassSouthToMathCase.compassDegrees)).toBeCloseTo(
      compassSouthToMathCase.expectedMathDegrees,
      2,
    );
  });
});

describe("mathToCompassDegrees", () => {
  it("converts math 0 to compass 90", () => {
    expect(mathToCompassDegrees(mathZeroToCompassCase.mathDegrees)).toBeCloseTo(
      mathZeroToCompassCase.expectedCompassDegrees,
      2,
    );
  });

  it("is the self-inverse of compassToMathDegrees (round-trip)", () => {
    for (const sample of roundTripSamples) {
      expect(mathToCompassDegrees(compassToMathDegrees(sample))).toBeCloseTo(sample, 2);
    }
  });
});

describe("normalizeCompassDegrees", () => {
  it("wraps a negative angle into [0,360)", () => {
    expect(normalizeCompassDegrees(normalizeNegativeCase.input)).toBeCloseTo(
      normalizeNegativeCase.expected,
      2,
    );
  });

  it("wraps the upper boundary (360) to 0", () => {
    expect(normalizeCompassDegrees(normalizeUpperBoundaryCase.input)).toBeCloseTo(
      normalizeUpperBoundaryCase.expected,
      2,
    );
  });

  it("wraps an overflowing angle (720.5) to 0.5", () => {
    expect(normalizeCompassDegrees(normalizeOverflowCase.input)).toBeCloseTo(
      normalizeOverflowCase.expected,
      2,
    );
  });
});

describe("normalizeRelativeBearingDegrees", () => {
  it("keeps 180 at the upper-inclusive boundary", () => {
    expect(normalizeRelativeBearingDegrees(relativeBearingUpperBoundaryCase.input)).toBeCloseTo(
      relativeBearingUpperBoundaryCase.expected,
      2,
    );
  });

  it("remaps -180 to 180 (D-08 upper-inclusive seam)", () => {
    expect(normalizeRelativeBearingDegrees(relativeBearingLowerSeamCase.input)).toBeCloseTo(
      relativeBearingLowerSeamCase.expected,
      2,
    );
  });

  it("wraps 270 to -90", () => {
    expect(normalizeRelativeBearingDegrees(relativeBearingWrapCase.input)).toBeCloseTo(
      relativeBearingWrapCase.expected,
      2,
    );
  });
});
