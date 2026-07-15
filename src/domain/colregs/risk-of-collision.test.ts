import { describe, expect, it } from "vitest";
import { cpa } from "../geometry/cpa.js";
import { ok } from "../shared/result.js";
import { riskOfCollision } from "./risk-of-collision.js";
import {
  dcpaAtThresholdCase,
  dcpaOverThresholdCase,
  headOnClosingCase,
  negativeTcpaCase,
  parallelNoClosureCase,
} from "./risk-of-collision.fixtures.js";

describe("riskOfCollision() Rule 7 gate (D-05-D-08)", () => {
  it("returns true for a closing, well-under-threshold encounter (headOnClosingCase)", () => {
    const cpaResult = cpa(headOnClosingCase.vesselA, headOnClosingCase.vesselB);
    expect(riskOfCollision(cpaResult)).toBe(true);
  });

  it("returns true when DCPA is exactly at the 1.0nm threshold (D-05 inclusive)", () => {
    // Sanity-check cpa()'s real output is close to the worked-math value
    // (toBeCloseTo, per Phase 1's float-comparison convention) before
    // asserting riskOfCollision()'s exact `<=` boundary against the
    // literal expected value directly -- Math.sin(Math.PI) is not exactly
    // 0 in floating point, so cpa()'s computed dcpaNm lands a few ULPs
    // above 1.0, not exactly on it.
    const cpaResult = cpa(dcpaAtThresholdCase.vesselA, dcpaAtThresholdCase.vesselB);
    expect(cpaResult.ok).toBe(true);
    if (cpaResult.ok) {
      expect(cpaResult.value.tcpaMinutes).toBeCloseTo(
        dcpaAtThresholdCase.expectedCpaValue.tcpaMinutes,
        6,
      );
      expect(cpaResult.value.dcpaNm).toBeCloseTo(dcpaAtThresholdCase.expectedCpaValue.dcpaNm, 6);
    }
    expect(riskOfCollision(ok(dcpaAtThresholdCase.expectedCpaValue))).toBe(
      dcpaAtThresholdCase.expectedRisk,
    );
  });

  it("returns false when DCPA is over the 1.0nm threshold", () => {
    const cpaResult = cpa(dcpaOverThresholdCase.vesselA, dcpaOverThresholdCase.vesselB);
    expect(cpaResult.ok).toBe(true);
    if (cpaResult.ok) {
      expect(cpaResult.value.tcpaMinutes).toBeCloseTo(
        dcpaOverThresholdCase.expectedCpaValue.tcpaMinutes,
        6,
      );
      expect(cpaResult.value.dcpaNm).toBeCloseTo(dcpaOverThresholdCase.expectedCpaValue.dcpaNm, 6);
    }
    expect(riskOfCollision(ok(dcpaOverThresholdCase.expectedCpaValue))).toBe(
      dcpaOverThresholdCase.expectedRisk,
    );
  });

  it("returns false for a no-closure (parallel/matching-course) cpa() result (D-07)", () => {
    const cpaResult = cpa(parallelNoClosureCase.vesselA, parallelNoClosureCase.vesselB);
    expect(cpaResult.ok).toBe(false);
    expect(riskOfCollision(cpaResult)).toBe(false);
  });

  it("returns false for a negative TCPA regardless of DCPA (D-08, no grace window)", () => {
    const cpaResult = cpa(negativeTcpaCase.vesselA, negativeTcpaCase.vesselB);
    expect(riskOfCollision(cpaResult)).toBe(false);
  });
});
