/**
 * useRotateHandleDrag -- pointerdown/move/up + setPointerCapture
 * heading-drag hook (VESL-02/D-01). Computes the new heading via
 * bearing() -- the project's already-implemented, already-tested
 * atan2-argument-order convention -- never a second hand-rolled atan2
 * call -- duplicating this project's own atan2-argument-order convention
 * in a second place would risk the two implementations drifting apart.
 */

import type { PointerEvent } from "react";
import { bearing } from "../../../domain/geometry/bearing/bearing.js";
import {
  screenToChart,
  type ChartViewBox,
  type ContainerSize,
} from "../../../domain/geometry/screen-convert/screen-convert.js";
import type { Position } from "../../../domain/vessel/vessel.js";
import type { VesselLabel } from "../../../domain/colregs/types.js";
import type { ChartPanelProps } from "../types.js";
import type { DragHandlers } from "./useHullDrag.js";

export function useRotateHandleDrag(
  vessel: VesselLabel,
  vesselPosition: Position,
  onVesselHeadingChange: ChartPanelProps["onVesselHeadingChange"],
  containerSize: ContainerSize | null,
  viewBox: ChartViewBox,
  onSelect: (vessel: VesselLabel) => void,
): DragHandlers {
  const onPointerDown = (event: PointerEvent<SVGElement>) => {
    // Pitfall 1: stop the gesture from also bubbling to the hull hit-rect's
    // own onPointerDown -- the rotate handle sits near/over the hull. This
    // also now covers the same svg-level "close on empty chart click"
    // bubbling concern useHullDrag.ts's own stopPropagation() guards
    // against, since onSelect() below must not be immediately clobbered by
    // ChartPanel's empty-chart-space close handler in the same dispatch.
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    onSelect(vessel);
  };

  const onPointerMove = (event: PointerEvent<SVGElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    if (!containerSize) return;
    const svgRect = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!svgRect) return;
    const pointerChartPosition = screenToChart(
      event.clientX - svgRect.left,
      event.clientY - svgRect.top,
      containerSize,
      viewBox,
    );
    const headingResult = bearing(vesselPosition, pointerChartPosition);
    // Coincident-position (pointer dragged exactly onto the vessel's own
    // center): no-op, do not crash.
    if (!headingResult.ok) return;
    onVesselHeadingChange(vessel, headingResult.value);
  };

  const onPointerUp = (event: PointerEvent<SVGElement>) => {
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return { onPointerDown, onPointerMove, onPointerUp };
}
