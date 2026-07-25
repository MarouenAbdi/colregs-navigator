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
  nearCoincidentPositionCase,
  nonFiniteInputCase,
} from "./bearing.fixtures.js";
import type { DegenerateCaseReason, Result } from "../../shared/result.js";

// Local narrowing helpers -- eslint's vitest/no-conditional-expect rule
// forbids calling `expect()` inside an `if`/`else` block, so `.value`/
// `.reason` narrowing happens via a throwing assertion helper instead of an
// inline `if (result.ok) { expect(...) }` guard. The `expect(result.ok)`
// call itself still runs unconditionally, so the ok/err assertion is not
// lost -- only the narrowing step moves out of a conditional.
function expectOk<T>(result: Result<T>): T {
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(`expected ok, got err: ${result.reason}`);
  return result.value;
}

function expectErr<T>(result: Result<T>): DegenerateCaseReason {
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error("expected err, got ok");
  return result.reason;
}

describe("bearing() cardinal directions", () => {
  it("due east: 90 deg", () => {
    const value = expectOk(bearing(dueEastCase.a, dueEastCase.b));
    expect(value).toBeCloseTo(dueEastCase.expected, 2);
  });

  it("due north: 0 deg", () => {
    const value = expectOk(bearing(dueNorthCase.a, dueNorthCase.b));
    expect(value).toBeCloseTo(dueNorthCase.expected, 2);
  });

  it("due south: 180 deg", () => {
    const value = expectOk(bearing(dueSouthCase.a, dueSouthCase.b));
    expect(value).toBeCloseTo(dueSouthCase.expected, 2);
  });

  it("due west: 270 deg", () => {
    const value = expectOk(bearing(dueWestCase.a, dueWestCase.b));
    expect(value).toBeCloseTo(dueWestCase.expected, 2);
  });
});

describe("bearing() normalization boundary", () => {
  it("near-360 case normalizes into [359.9, 360), never exactly 360", () => {
    const value = expectOk(bearing(near360BoundaryCase.a, near360BoundaryCase.b));
    expect(value).toBeGreaterThanOrEqual(359.9);
    expect(value).toBeLessThan(360);
    expect(value).toBeCloseTo(near360BoundaryCase.expected, 2);
  });
});

describe("bearing() degenerate cases", () => {
  it("coincident positions return err('coincident-position')", () => {
    const reason = expectErr(
      bearing(coincidentPositionCase.a, coincidentPositionCase.b),
    );
    expect(reason).toBe("coincident-position");
  });

  it("near-coincident positions (sub-threshold separation) return err('coincident-position')", () => {
    const reason = expectErr(
      bearing(nearCoincidentPositionCase.a, nearCoincidentPositionCase.b),
    );
    expect(reason).toBe("coincident-position");
  });

  it("NaN coordinate returns err('invalid-input')", () => {
    const reason = expectErr(bearing(nonFiniteInputCase.a, nonFiniteInputCase.b));
    expect(reason).toBe("invalid-input");
  });

  it("Infinity coordinate returns err('invalid-input')", () => {
    const reason = expectErr(bearing(infiniteInputCase.a, infiniteInputCase.b));
    expect(reason).toBe("invalid-input");
  });
});
