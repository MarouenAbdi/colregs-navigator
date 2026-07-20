import { describe, expect, it } from "vitest";
import { buildGridLineSegments, CHART_VIEW_BOX, wedgePath } from "./chart-panel-geometry.js";

describe("wedgePath", () => {
  it("builds an SVG sector path from a fixed center/radius/bearing span", () => {
    const path = wedgePath({ screenX: 100, screenY: 100 }, 60, 0, 90);

    expect(path.startsWith("M 100 100")).toBe(true);
    // Bearing 0 (due north) -> SVG (100, 40): svgAngle = 0 - 90 = -90deg.
    expect(path).toContain("L 100 40");
    // Bearing 90 (due east) -> SVG (160, 100): svgAngle = 90 - 90 = 0deg.
    expect(path).toContain("A 60 60 0 0 1 160 100");
    expect(path.endsWith("Z")).toBe(true);
  });
});

describe("buildGridLineSegments", () => {
  const containerSize = { width: 400, height: 400 };

  it("returns one segment per GRID_STEP_CHART_UNITS step across both axes", () => {
    const segments = buildGridLineSegments(containerSize, CHART_VIEW_BOX);

    // CHART_VIEW_BOX spans -10..10 on both axes, stepped every 2 units:
    // 11 vertical + 11 horizontal = 22 segments.
    expect(segments).toHaveLength(22);
  });

  it("computes the leftmost vertical gridline's screen endpoints via chartToScreen", () => {
    const segments = buildGridLineSegments(containerSize, CHART_VIEW_BOX);
    const leftmost = segments.find((segment) => segment.key === "grid-v--10");

    expect(leftmost).toEqual({ key: "grid-v--10", x1: 0, y1: 400, x2: 0, y2: 0 });
  });
});
