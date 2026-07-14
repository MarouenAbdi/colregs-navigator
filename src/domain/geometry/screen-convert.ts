import type { Position } from "../vessel/vessel.js";

/**
 * Pure screen-pixel <-> chart {x,y} conversion. Plain number-in/number-out
 * — zero SVGElement/ResizeObserver/DOM dependency (ROADMAP Phase 1 Success
 * Criterion #3). The only Phase-4-owned piece is the *caller* that
 * measures containerSize via ResizeObserver and supplies the chart's
 * viewBox; these functions take both as plain arguments and never touch
 * the DOM.
 */

export interface ContainerSize {
  width: number;
  height: number;
}

export interface ChartViewBox {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

export function chartToScreen(
  position: Position,
  containerSize: ContainerSize,
  viewBox: ChartViewBox,
): { screenX: number; screenY: number } {
  throw new Error("not implemented");
}

export function screenToChart(
  screenX: number,
  screenY: number,
  containerSize: ContainerSize,
  viewBox: ChartViewBox,
): Position {
  throw new Error("not implemented");
}
