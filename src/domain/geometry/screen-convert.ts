import type { Position } from "../vessel/vessel.js";

/**
 * Pure screen-pixel <-> chart {x,y} conversion. Plain number-in/number-out
 * — zero DOM/browser-observer/graphics-element API dependency (ROADMAP
 * Phase 1 Success Criterion #3). The only Phase-4-owned piece is the
 * *caller* that measures containerSize via a live browser size-tracking
 * API and supplies the chart's viewBox; these functions take both as
 * plain arguments and never touch the DOM.
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

function assertValidConfig(
  numericFields: Record<string, number>,
  containerSize: ContainerSize,
  viewBox: ChartViewBox,
): void {
  for (const [name, value] of Object.entries(numericFields)) {
    if (!Number.isFinite(value)) {
      throw new TypeError(`expected a finite number for '${name}', got ${value}`);
    }
  }
  if (
    !(containerSize.width > 0 && containerSize.height > 0 && viewBox.width > 0 && viewBox.height > 0)
  ) {
    throw new TypeError(
      "containerSize.width/height and viewBox.width/height must all be > 0 " +
        `(got containerSize=${JSON.stringify(containerSize)}, viewBox=${JSON.stringify(viewBox)})`,
    );
  }
}

export function chartToScreen(
  position: Position,
  containerSize: ContainerSize,
  viewBox: ChartViewBox,
): { screenX: number; screenY: number } {
  assertValidConfig(
    {
      "position.x": position.x,
      "position.y": position.y,
      "containerSize.width": containerSize.width,
      "containerSize.height": containerSize.height,
      "viewBox.minX": viewBox.minX,
      "viewBox.minY": viewBox.minY,
      "viewBox.width": viewBox.width,
      "viewBox.height": viewBox.height,
    },
    containerSize,
    viewBox,
  );

  const scaleX = containerSize.width / viewBox.width;
  const scaleY = containerSize.height / viewBox.height;
  const screenX = (position.x - viewBox.minX) * scaleX;
  // Y-axis inversion: chart y increases north/up, screen y increases
  // downward — this subtraction-from-containerSize.height is the
  // coordinate-convention pitfall most likely to be silently swapped,
  // mirroring bearing.ts's atan2-argument-order lesson.
  const screenY = containerSize.height - (position.y - viewBox.minY) * scaleY;

  return { screenX, screenY };
}

export function screenToChart(
  screenX: number,
  screenY: number,
  containerSize: ContainerSize,
  viewBox: ChartViewBox,
): Position {
  assertValidConfig(
    {
      screenX,
      screenY,
      "containerSize.width": containerSize.width,
      "containerSize.height": containerSize.height,
      "viewBox.minX": viewBox.minX,
      "viewBox.minY": viewBox.minY,
      "viewBox.width": viewBox.width,
      "viewBox.height": viewBox.height,
    },
    containerSize,
    viewBox,
  );

  const scaleX = containerSize.width / viewBox.width;
  const scaleY = containerSize.height / viewBox.height;
  const x = screenX / scaleX + viewBox.minX;
  const y = (containerSize.height - screenY) / scaleY + viewBox.minY;

  return { x, y };
}
