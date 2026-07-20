import { describe, expect, it } from "vitest";
import { cpa } from "./cpa.js";
import {
  epsilonJustAboveCase,
  epsilonJustBelowCase,
  headOnClosingCase,
  negativeTcpaCase,
  nonFiniteInputCase,
  parallelNoClosureCase,
} from "./cpa.fixtures.js";

describe("cpa", () => {
  it("returns textbook-correct tcpaMinutes/dcpaNm for a head-on closing encounter", () => {
    const result = cpa(headOnClosingCase.vesselA, headOnClosingCase.vesselB);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.tcpaMinutes).toBeCloseTo(headOnClosingCase.expectedTcpaMinutes, 2);
      expect(result.value.dcpaNm).toBeCloseTo(headOnClosingCase.expectedDcpaNm, 2);
    }
  });

  it("returns err('no-closure', { currentDistanceNm }) for parallel/matching-course vessels", () => {
    const result = cpa(parallelNoClosureCase.vesselA, parallelNoClosureCase.vesselB);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("no-closure");
      expect(result.details?.currentDistanceNm).toBeCloseTo(
        parallelNoClosureCase.expectedCurrentDistanceNm,
        2,
      );
    }
  });

  it("returns a valid negative tcpaMinutes as ok() for a diverging encounter (not clamped, not tagged)", () => {
    const result = cpa(negativeTcpaCase.vesselA, negativeTcpaCase.vesselB);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.tcpaMinutes).toBeLessThan(0);
      expect(result.value.tcpaMinutes).toBeCloseTo(negativeTcpaCase.expectedTcpaMinutes, 2);
      expect(result.value.dcpaNm).toBeCloseTo(negativeTcpaCase.expectedDcpaNm, 2);
    }
  });

  it("classifies a vDotV just below the epsilon threshold as no-closure", () => {
    const result = cpa(epsilonJustBelowCase.vesselA, epsilonJustBelowCase.vesselB);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("no-closure");
      expect(result.details?.currentDistanceNm).toBeCloseTo(
        epsilonJustBelowCase.expectedCurrentDistanceNm,
        2,
      );
    }
  });

  it("classifies a vDotV just above the epsilon threshold as a computed ok() result", () => {
    const result = cpa(epsilonJustAboveCase.vesselA, epsilonJustAboveCase.vesselB);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Number.isFinite(result.value.tcpaMinutes)).toBe(true);
      expect(Number.isFinite(result.value.dcpaNm)).toBe(true);
      expect(result.value.tcpaMinutes).toBeCloseTo(epsilonJustAboveCase.expectedTcpaMinutes, 2);
      expect(result.value.dcpaNm).toBeCloseTo(epsilonJustAboveCase.expectedDcpaNm, 2);
    }
  });

  it("returns err('invalid-input') when a numeric field is non-finite (bypassing VesselSchema)", () => {
    const result = cpa(nonFiniteInputCase.vesselA, nonFiniteInputCase.vesselB);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("invalid-input");
    }
  });
});
