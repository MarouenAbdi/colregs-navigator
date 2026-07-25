/**
 * useHullDrag -- pointerdown/move/up + setPointerCapture position-drag
 * hook (VESL-02/D-01). Converts pointermove screen coordinates to
 * chart-space Position via screenToChart() and forwards them through
 * onVesselPositionChange -- this hook holds no state of its own and does
 * not persist/validate the forwarded value itself (the actual VesselSchema
 * validation boundary is `SandboxContainer`'s `applyVesselUpdate`, not this
 * hook).
 */

import type { PointerEvent } from "react";
import {
  screenToChart,
  type ChartViewBox,
  type ContainerSize,
} from "../../../domain/geometry/screen-convert/screen-convert.js";
import type { VesselLabel } from "../../../domain/colregs/types.js";
import type { ChartPanelProps } from "../types.js";

export interface DragHandlers {
  onPointerDown: (event: PointerEvent<SVGElement>) => void;
  onPointerMove: (event: PointerEvent<SVGElement>) => void;
  onPointerUp: (event: PointerEvent<SVGElement>) => void;
}

export function useHullDrag(
  vessel: VesselLabel,
  onVesselPositionChange: ChartPanelProps["onVesselPositionChange"],
  containerSize: ContainerSize | null,
  viewBox: ChartViewBox,
  onSelect: (vessel: VesselLabel) => void,
): DragHandlers {
  const onPointerDown = (event: PointerEvent<SVGElement>) => {
    // This stopPropagation() is not (only) about sibling overlap the way
    // useRotateHandleDrag's is -- it specifically prevents this pointerdown
    // from bubbling up to ChartPanel's <svg>-level "close on empty chart
    // click" handler, which would otherwise also fire in the same event
    // dispatch and call setSelectedVessel(null) AFTER this hook's own
    // onSelect() call already queued a different value, silently
    // overwriting a vessel-to-vessel switch back to "closed": pressing
    // vessel B while vessel A's overlay is open must switch to B, not
    // close everything.
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    onSelect(vessel);
  };

  const onPointerMove = (event: PointerEvent<SVGElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    if (!containerSize) return;
    // Plain bounding-rect read -- NOT the banned getScreenCTM()/getBBox().
    const svgRect = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!svgRect) return;
    const chartPosition = screenToChart(
      event.clientX - svgRect.left,
      event.clientY - svgRect.top,
      containerSize,
      viewBox,
    );
    onVesselPositionChange(vessel, chartPosition);
  };

  const onPointerUp = (event: PointerEvent<SVGElement>) => {
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return { onPointerDown, onPointerMove, onPointerUp };
}
