import { describe, expect, it } from "vitest";
import { cpa } from "../geometry/cpa.js";
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
    const cpaResult = cpa(dcpaAtThresholdCase.vesselA, dcpaAtThresholdCase.vesselB);
    expect(riskOfCollision(cpaResult)).toBe(dcpaAtThresholdCase.expectedRisk);
    expect(riskOfCollision(cpaResult)).toBe(true);
  });

  it("returns false when DCPA is over the 1.0nm threshold", () => {
    const cpaResult = cpa(dcpaOverThresholdCase.vesselA, dcpaOverThresholdCase.vesselB);
    expect(riskOfCollision(cpaResult)).toBe(dcpaOverThresholdCase.expectedRisk);
    expect(riskOfCollision(cpaResult)).toBe(false);
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
