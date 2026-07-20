import { describe, expect, it } from "vitest";
import { computeCardViewBox } from "./gallery-preview-geometry.js";

/**
 * computeCardViewBox() unit tests against the 1.0-10.0 NM
 * vessel-pair range the actual 6 curated gallery cards span
 * (verified against the curated scenario set's own per-card range), plus
 * the coincident-axis edge case its own `Math.max(..., 0.001)` guard
 * exists for.
 */
describe("computeCardViewBox", () => {
  it("enforces the given aspect ratio and keeps both vessels strictly inside the viewBox (5 NM apart, x-axis)", () => {
    const a = { x: 0, y: 0 };
    const b = { x: 5, y: 0 };
    const aspectRatio = 1.5;
    const viewBox = computeCardViewBox(a, b, aspectRatio, 0.35);

    expect(viewBox.width / viewBox.height).toBeCloseTo(aspectRatio, 5);

    expect(a.x).toBeGreaterThan(viewBox.minX);
    expect(a.x).toBeLessThan(viewBox.minX + viewBox.width);
    expect(a.y).toBeGreaterThan(viewBox.minY);
    expect(a.y).toBeLessThan(viewBox.minY + viewBox.height);

    expect(b.x).toBeGreaterThan(viewBox.minX);
    expect(b.x).toBeLessThan(viewBox.minX + viewBox.width);
    expect(b.y).toBeGreaterThan(viewBox.minY);
    expect(b.y).toBeLessThan(viewBox.minY + viewBox.height);
  });

  it("produces valid, finite, non-degenerate viewBoxes with the same aspect ratio across the 1.0-10.0 NM card range", () => {
    const aspectRatio = 1.5;
    const paddingFraction = 0.35;

    const near = computeCardViewBox({ x: 0, y: 0 }, { x: 1, y: 0 }, aspectRatio, paddingFraction);
    const far = computeCardViewBox({ x: 0, y: 0 }, { x: 10, y: 0 }, aspectRatio, paddingFraction);

    for (const viewBox of [near, far]) {
      expect(Number.isFinite(viewBox.minX)).toBe(true);
      expect(Number.isFinite(viewBox.minY)).toBe(true);
      expect(Number.isFinite(viewBox.width)).toBe(true);
      expect(Number.isFinite(viewBox.height)).toBe(true);
      expect(viewBox.width).toBeGreaterThan(0);
      expect(viewBox.height).toBeGreaterThan(0);
      expect(viewBox.width / viewBox.height).toBeCloseTo(aspectRatio, 5);
    }
  });

  it("guards the coincident-x-axis edge case (vertical-only vessel pair)", () => {
    const a = { x: 2, y: 0 };
    const b = { x: 2, y: 5 };
    const viewBox = computeCardViewBox(a, b, 1.5, 0.35);

    expect(Number.isFinite(viewBox.width)).toBe(true);
    expect(Number.isFinite(viewBox.height)).toBe(true);
    expect(viewBox.width).toBeGreaterThan(0);
    expect(viewBox.height).toBeGreaterThan(0);
    expect(a.x).toBeGreaterThan(viewBox.minX);
    expect(a.x).toBeLessThan(viewBox.minX + viewBox.width);
    expect(a.y).toBeGreaterThan(viewBox.minY);
    expect(b.y).toBeLessThan(viewBox.minY + viewBox.height);
  });

  it("centers the returned viewBox on the midpoint of the two vessels", () => {
    const a = { x: 0, y: 0 };
    const b = { x: 5, y: 0 };
    const viewBox = computeCardViewBox(a, b, 1.5, 0.35);

    const boxCenterX = viewBox.minX + viewBox.width / 2;
    const boxCenterY = viewBox.minY + viewBox.height / 2;
    const expectedCenterX = (a.x + b.x) / 2;
    const expectedCenterY = (a.y + b.y) / 2;

    expect(boxCenterX).toBeCloseTo(expectedCenterX, 5);
    expect(boxCenterY).toBeCloseTo(expectedCenterY, 5);
  });
});
