import { describe, expect, it } from "vitest";
import {
  crossingResidualBasicCase,
  doubtBandNearOvertakingBoundaryCase,
  headOnBoundaryInclusiveCase,
} from "../../../domain/colregs/classify-encounter.fixtures.js";
import { classifyEncounter } from "../../../domain/colregs/classify-encounter.js";
import { deriveInstrumentReadouts } from "../instruments/instrument-readouts.js";
import { deriveChartOverlayState } from "./chart-panel-derivation.js";

const CONTAINER_SIZE = { width: 400, height: 400 };
const VIEW_BOX = { minX: -10, minY: -10, width: 20, height: 20 };

describe("deriveChartOverlayState", () => {
  it("swaps the bearing line to dashed amber for a near-head-on-boundary doubt", () => {
    const { vesselA, vesselB } = headOnBoundaryInclusiveCase;
    const result = classifyEncounter(vesselA, vesselB);
    if (!result.ok) throw new Error("fixture expected to classify successfully");

    const overlay = deriveChartOverlayState(vesselA, vesselB, result.value, CONTAINER_SIZE, VIEW_BOX);

    expect(overlay.bearingStroke).toBe("#F59E0B");
    expect(overlay.bearingDashArray).toBe("4 3");
  });

  it("resolves exactly one doubt vessel for a near-overtaking-crossing-boundary doubt", () => {
    const { vesselA, vesselB } = doubtBandNearOvertakingBoundaryCase;
    const result = classifyEncounter(vesselA, vesselB);
    if (!result.ok) throw new Error("fixture expected to classify successfully");

    const overlay = deriveChartOverlayState(vesselA, vesselB, result.value, CONTAINER_SIZE, VIEW_BOX);

    expect(overlay.doubtVessel).not.toBeNull();
    expect(["vesselA", "vesselB"]).toContain(overlay.doubtVessel);
  });

  it("derives rangeNm from deriveInstrumentReadouts and shows no doubt for a baseline crossing case", () => {
    const { vesselA, vesselB } = crossingResidualBasicCase;
    const result = classifyEncounter(vesselA, vesselB);
    if (!result.ok) throw new Error("fixture expected to classify successfully");

    const overlay = deriveChartOverlayState(vesselA, vesselB, result.value, CONTAINER_SIZE, VIEW_BOX);

    expect(overlay.bearingDashArray).toBeUndefined();
    expect(overlay.doubtVessel).toBeNull();
    // D-01 dedup: rangeNm must come from deriveInstrumentReadouts(), not a
    // second independent Math.hypot() computation.
    expect(overlay.rangeNm).toBe(deriveInstrumentReadouts(vesselA, vesselB).rangeNm);
  });
});
