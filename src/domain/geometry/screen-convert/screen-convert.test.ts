import { describe, expect, it } from "vitest";
import { chartToScreen, screenToChart } from "./screen-convert.js";
import {
  centeredOriginCase,
  degenerateViewBoxCase,
  nonFiniteInputCase,
  northUpCase,
  roundTripCases,
  screenToChartOriginCase,
  sharedContainerSize,
  sharedViewBox,
  southDownCase,
} from "./screen-convert.fixtures.js";

describe("chartToScreen", () => {
  it("maps the chart origin to the container's visual center", () => {
    const result = chartToScreen(centeredOriginCase.position, sharedContainerSize, sharedViewBox);
    expect(result.screenX).toBeCloseTo(centeredOriginCase.expectedScreenX, 2);
    expect(result.screenY).toBeCloseTo(centeredOriginCase.expectedScreenY, 2);
  });

  it("maps a due-north chart position to the top of the screen (Y-axis inversion)", () => {
    const result = chartToScreen(northUpCase.position, sharedContainerSize, sharedViewBox);
    expect(result.screenY).toBeCloseTo(northUpCase.expectedScreenY, 2);
  });

  it("maps a due-south chart position to the bottom of the screen", () => {
    const result = chartToScreen(southDownCase.position, sharedContainerSize, sharedViewBox);
    expect(result.screenY).toBeCloseTo(southDownCase.expectedScreenY, 2);
  });

  it("confirms Y-axis inversion: larger chart y maps to smaller screenY", () => {
    const north = chartToScreen(northUpCase.position, sharedContainerSize, sharedViewBox);
    const south = chartToScreen(southDownCase.position, sharedContainerSize, sharedViewBox);
    expect(north.screenY).toBeLessThan(south.screenY);
  });

  it("throws a TypeError for non-finite position input", () => {
    expect(() =>
      chartToScreen({ x: Number.POSITIVE_INFINITY, y: 0 }, sharedContainerSize, sharedViewBox),
    ).toThrow(TypeError);
  });

  it("throws a TypeError for a degenerate (zero-area) container/viewBox configuration", () => {
    expect(() =>
      chartToScreen(
        centeredOriginCase.position,
        degenerateViewBoxCase.containerSize,
        degenerateViewBoxCase.viewBox,
      ),
    ).toThrow(TypeError);
  });
});

describe("screenToChart", () => {
  it("is the exact inverse of chartToScreen at the chart origin", () => {
    const result = screenToChart(
      screenToChartOriginCase.screenX,
      screenToChartOriginCase.screenY,
      sharedContainerSize,
      sharedViewBox,
    );
    expect(result.x).toBeCloseTo(screenToChartOriginCase.expectedPosition.x, 2);
    expect(result.y).toBeCloseTo(screenToChartOriginCase.expectedPosition.y, 2);
  });

  it("throws a TypeError for non-finite screen coordinate input", () => {
    expect(() =>
      screenToChart(
        nonFiniteInputCase.screenX,
        nonFiniteInputCase.screenY,
        sharedContainerSize,
        sharedViewBox,
      ),
    ).toThrow(TypeError);
  });

  it("round-trips for at least 2 sample chart positions", () => {
    for (const position of roundTripCases) {
      const screen = chartToScreen(position, sharedContainerSize, sharedViewBox);
      const roundTripped = screenToChart(
        screen.screenX,
        screen.screenY,
        sharedContainerSize,
        sharedViewBox,
      );
      expect(roundTripped.x).toBeCloseTo(position.x, 2);
      expect(roundTripped.y).toBeCloseTo(position.y, 2);
    }
  });
});
