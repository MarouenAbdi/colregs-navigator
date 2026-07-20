import type { Position } from "../../vessel/vessel.js";

/**
 * Hand-derived screen<->chart coordinate conversion fixtures (D-13-style,
 * for consistency with the rest of this project's hand-derived fixture
 * files even though D-13 itself is trigonometry-specific).
 *
 * Shared container/viewBox configuration used across all cases:
 * containerSize = {width: 800, height: 600}, viewBox = {minX: -50, minY: -50,
 * width: 100, height: 100} => scaleX = 800/100 = 8, scaleY = 600/100 = 6.
 */
export const sharedContainerSize = { width: 800, height: 600 };
export const sharedViewBox = { minX: -50, minY: -50, width: 100, height: 100 };

// Chart origin (0,0) maps to the container's visual center:
// screenX = (0 - (-50)) * 8 = 400. screenY = 600 - (0 - (-50)) * 6 = 600 - 300 = 300.
export const centeredOriginCase: {
  position: Position;
  expectedScreenX: number;
  expectedScreenY: number;
} = {
  position: { x: 0, y: 0 },
  expectedScreenX: 400,
  expectedScreenY: 300,
};

// Chart position due north (y positive, "up") maps to the TOP of the screen:
// screenY = 600 - (50 - (-50)) * 6 = 600 - 600 = 0.
export const northUpCase: { position: Position; expectedScreenY: number } = {
  position: { x: 0, y: 50 },
  expectedScreenY: 0,
};

// Chart position due south maps to the BOTTOM of the screen:
// screenY = 600 - (-50 - (-50)) * 6 = 600 - 0 = 600.
export const southDownCase: { position: Position; expectedScreenY: number } = {
  position: { x: 0, y: -50 },
  expectedScreenY: 600,
};

// Exact inverse of centeredOriginCase: screenToChart(400,300,...) => {x:0,y:0}.
// x = 400/8 + (-50) = 50 - 50 = 0. y = (600-300)/6 + (-50) = 50 - 50 = 0.
export const screenToChartOriginCase: {
  screenX: number;
  screenY: number;
  expectedPosition: Position;
} = {
  screenX: 400,
  screenY: 300,
  expectedPosition: { x: 0, y: 0 },
};

// Round-trip sample chart positions.
export const roundTripCases: Position[] = [
  { x: 10, y: 20 },
  { x: -30, y: 45 },
];

// Non-finite numeric input case: screenX = NaN.
export const nonFiniteInputCase = { screenX: Number.NaN, screenY: 300 };

// Degenerate configuration case: containerSize.width <= 0.
export const degenerateViewBoxCase = {
  containerSize: { width: 0, height: 600 },
  viewBox: sharedViewBox,
};
