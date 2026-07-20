import { describe, expect, it } from "vitest";
import { resolveDoubtGeometry } from "./resolve-doubt-geometry.js";
import {
  coincidentPositionCase,
  headOnBoundaryCase,
  overtakingBoundaryTriggeredByACase,
  overtakingBoundaryTriggeredByBCase,
  stickyHysteresisNearBoundaryCase,
} from "./resolve-doubt-geometry.fixtures.js";

describe("resolveDoubtGeometry() overtaking/crossing boundary (Pitfall 3)", () => {
  it("identifies vesselA as the trigger when A's relative bearing is closer to the 112.5 deg boundary", () => {
    const result = resolveDoubtGeometry(
      overtakingBoundaryTriggeredByACase.vesselA,
      overtakingBoundaryTriggeredByACase.vesselB,
      overtakingBoundaryTriggeredByACase.doubtBoundary,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.vessel).toBe(
        overtakingBoundaryTriggeredByACase.expectedVessel,
      );
      expect(result.value.relativeBearingDegrees).toBeCloseTo(
        overtakingBoundaryTriggeredByACase.expectedRelativeBearingDegrees,
        2,
      );
    }
  });

  it("identifies vesselB as the trigger when B's relative bearing is closer to the 112.5 deg boundary (naive facts.relativeBearingAtoB-only reader would get this wrong)", () => {
    const result = resolveDoubtGeometry(
      overtakingBoundaryTriggeredByBCase.vesselA,
      overtakingBoundaryTriggeredByBCase.vesselB,
      overtakingBoundaryTriggeredByBCase.doubtBoundary,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.vessel).toBe(
        overtakingBoundaryTriggeredByBCase.expectedVessel,
      );
      expect(result.value.relativeBearingDegrees).toBeCloseTo(
        overtakingBoundaryTriggeredByBCase.expectedRelativeBearingDegrees,
        2,
      );
    }
  });

  it("derives the correct trigger purely from vesselA/vesselB geometry for the sticky-hysteresis shape, without a 'previous' argument or trail facts", () => {
    const result = resolveDoubtGeometry(
      stickyHysteresisNearBoundaryCase.vesselA,
      stickyHysteresisNearBoundaryCase.vesselB,
      stickyHysteresisNearBoundaryCase.doubtBoundary,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.vessel).toBe(
        stickyHysteresisNearBoundaryCase.expectedVessel,
      );
      expect(result.value.relativeBearingDegrees).toBeCloseTo(
        stickyHysteresisNearBoundaryCase.expectedRelativeBearingDegrees,
        2,
      );
    }
  });
});

describe("resolveDoubtGeometry() head-on boundary (symmetric, vesselA pinned)", () => {
  it("always resolves to vesselA for a near-head-on-boundary doubt, since either vessel's bearing is geometrically equivalent", () => {
    const result = resolveDoubtGeometry(
      headOnBoundaryCase.vesselA,
      headOnBoundaryCase.vesselB,
      headOnBoundaryCase.doubtBoundary,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.vessel).toBe(headOnBoundaryCase.expectedVessel);
      expect(result.value.relativeBearingDegrees).toBeCloseTo(
        headOnBoundaryCase.expectedRelativeBearingDegrees,
        2,
      );
    }
  });
});

describe("resolveDoubtGeometry() degenerate propagation (D-07 idiom)", () => {
  it("propagates relativeBearing()'s coincident-position failure unchanged", () => {
    const result = resolveDoubtGeometry(
      coincidentPositionCase.vesselA,
      coincidentPositionCase.vesselB,
      coincidentPositionCase.doubtBoundary,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("coincident-position");
    }
  });
});
