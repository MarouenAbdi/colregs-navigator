import { describe, expect, it } from "vitest";
import { crossingResidualBasicCase } from "../../../domain/colregs/classify-encounter.fixtures.js";
import { cpa } from "../../../domain/geometry/cpa.js";
import type { Vessel } from "../../../domain/vessel/vessel.js";
import { deriveInstrumentReadouts } from "./instrument-readouts.js";

describe("deriveInstrumentReadouts", () => {
  it("derives range/bearing/cpa/tcpa matching the direct geometry functions", () => {
    const { vesselA, vesselB } = crossingResidualBasicCase;
    const readouts = deriveInstrumentReadouts(vesselA, vesselB);

    expect(readouts.rangeNm).toBeCloseTo(5);
    expect(readouts.bearingAtoBDegrees).not.toBeNull();

    const cpaResult = cpa(vesselA, vesselB);
    expect(cpaResult.ok).toBe(true);
    if (cpaResult.ok) {
      expect(readouts.cpaNm).toBeCloseTo(cpaResult.value.dcpaNm);
      expect(readouts.tcpaMinutes).toBeCloseTo(cpaResult.value.tcpaMinutes);
    }
  });

  it("returns null bearing/cpa/tcpa (but a computable range of 0) for coincident, matching-course vessels", () => {
    // Same heading/speed (not just coincident position) is required so
    // cpa()'s relative-velocity vector is also zero, triggering its
    // "no-closure" failure -- a coincident position alone with differing
    // headings would still yield a defined (zero) CPA.
    const vesselA: Vessel = { position: { x: 3, y: 4 }, heading: 0, speed: 10, type: "power-driven" };
    const vesselB: Vessel = { position: { x: 3, y: 4 }, heading: 0, speed: 10, type: "power-driven" };

    const readouts = deriveInstrumentReadouts(vesselA, vesselB);

    expect(readouts.rangeNm).toBe(0);
    expect(readouts.bearingAtoBDegrees).toBeNull();
    expect(readouts.cpaNm).toBeNull();
    expect(readouts.tcpaMinutes).toBeNull();
  });
});
