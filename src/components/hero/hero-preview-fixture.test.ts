import { describe, expect, it } from "vitest";
import { classifyEncounter } from "../../domain/colregs/classify-encounter.js";
import { bearing } from "../../domain/geometry/bearing.js";
import { cpa } from "../../domain/geometry/cpa.js";
import { heroPreviewVesselA, heroPreviewVesselB } from "./hero-preview-fixture.js";

/**
 * Fixture-drift guard (HERO-02). Asserts
 * `heroPreviewVesselA`/`heroPreviewVesselB` still reproduce the design
 * mock's displayed Rule 15/crossing/vesselA-gives-way verdict and its
 * RANGE/BEARING/CPA readouts, so a future change to the domain formulas
 * cannot silently desync the Hero preview card's canned numbers from
 * what `classifyEncounter()`/`bearing()`/`cpa()` actually compute.
 */
describe("hero-preview-fixture (HERO-02 drift guard)", () => {
  it("classifies as a crossing encounter with Vessel A giving way, doubt-free", () => {
    const result = classifyEncounter(heroPreviewVesselA, heroPreviewVesselB);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.encounterType).toBe("crossing");
      expect(result.value.giveWay).toBe("vesselA");
      expect(result.value.standOn).toBe("vesselB");
      expect(result.value.doubt).toBe(false);
    }
  });

  it("reproduces the design mock's displayed RANGE/BEARING/CPA readouts", () => {
    const range = Math.hypot(
      heroPreviewVesselB.position.x - heroPreviewVesselA.position.x,
      heroPreviewVesselB.position.y - heroPreviewVesselA.position.y,
    );
    expect(range).toBeCloseTo(2.99, 2);

    const bearingResult = bearing(heroPreviewVesselA.position, heroPreviewVesselB.position);
    expect(bearingResult.ok).toBe(true);
    if (bearingResult.ok) {
      expect(Math.abs(bearingResult.value - 61)).toBeLessThan(0.5);
    }

    const cpaResult = cpa(heroPreviewVesselA, heroPreviewVesselB);
    expect(cpaResult.ok).toBe(true);
    if (cpaResult.ok) {
      expect(Math.abs(cpaResult.value.dcpaNm - 1.18)).toBeLessThan(0.01);
    }
  });
});
