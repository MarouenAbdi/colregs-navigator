"use client";

/**
 * ChartPanel -- the SVG chart surface (CHRT-01/CHRT-02) rendering both
 * vessels (hull color/badge per D-02) at their chartToScreen-projected
 * positions and headings.
 *
 * Renders nothing but the empty container until ResizeObserver's first
 * callback fires with a non-zero size -- screenToChart()/chartToScreen()
 * throw TypeError for a zero-area containerSize (see screen-convert.ts).
 *
 * Also renders the relative-bearing line and the overtaking-boundary
 * reference cones (RSON-03), and wires the hull-drag (position) and
 * rotate-handle-drag (heading) gestures (VESL-02/D-01) onto their SVG
 * hit-targets.
 */

import type { ChartPanelProps } from "./types.js";
import { useHullDrag } from "./hooks/useHullDrag.js";
import { useRotateHandleDrag } from "./hooks/useRotateHandleDrag.js";
import { useContainerSize } from "./hooks/useContainerSize.js";
import {
  CHART_VIEW_BOX,
  CONE_DEFAULT_STROKE,
  DOUBT_STROKE,
} from "./chart-panel-geometry.js";
import { deriveChartOverlayState } from "./chart-panel-derivation.js";
import { ChartBackdrop } from "./ChartBackdrop.js";
import { VesselGroup } from "./VesselGroup.js";

export function ChartPanel({
  vesselA,
  vesselB,
  classification,
  onVesselPositionChange,
  onVesselHeadingChange,
}: ChartPanelProps) {
  const { containerRef, containerSize } = useContainerSize();

  const hullDragA = useHullDrag("vesselA", onVesselPositionChange, containerSize, CHART_VIEW_BOX);
  const hullDragB = useHullDrag("vesselB", onVesselPositionChange, containerSize, CHART_VIEW_BOX);
  const rotateDragA = useRotateHandleDrag(
    "vesselA",
    vesselA.position,
    onVesselHeadingChange,
    containerSize,
    CHART_VIEW_BOX,
  );
  const rotateDragB = useRotateHandleDrag(
    "vesselB",
    vesselB.position,
    onVesselHeadingChange,
    containerSize,
    CHART_VIEW_BOX,
  );

  if (!containerSize || !(containerSize.width > 0 && containerSize.height > 0)) {
    return <div ref={containerRef} className="relative aspect-square w-full" />;
  }

  const overlay = deriveChartOverlayState(vesselA, vesselB, classification, containerSize, CHART_VIEW_BOX);
  const {
    screenA,
    screenB,
    chartCenter,
    innerRingRadiusPx,
    outerRingRadiusPx,
    roleA,
    roleB,
    bearingStroke,
    bearingDashArray,
    rangeNm,
    bearingMidpoint,
    doubtVessel,
    conePathA,
    conePathB,
  } = overlay;

  return (
    <div ref={containerRef} className="relative aspect-square w-full">
      <svg
        width={containerSize.width}
        height={containerSize.height}
        className="rounded-sm border border-border bg-chart-surface"
      >
        <ChartBackdrop
          containerSize={containerSize}
          chartCenter={chartCenter}
          innerRingRadiusPx={innerRingRadiusPx}
          outerRingRadiusPx={outerRingRadiusPx}
        />
        <g>
          <path
            data-testid="cone-vesselA"
            d={conePathA}
            stroke={doubtVessel === "vesselA" ? DOUBT_STROKE : CONE_DEFAULT_STROKE}
            strokeWidth={1}
            strokeDasharray={doubtVessel === "vesselA" ? "4 3" : undefined}
            fill={doubtVessel === "vesselA" ? DOUBT_STROKE : CONE_DEFAULT_STROKE}
            fillOpacity={0.1}
          />
          <path
            data-testid="cone-vesselB"
            d={conePathB}
            stroke={doubtVessel === "vesselB" ? DOUBT_STROKE : CONE_DEFAULT_STROKE}
            strokeWidth={1}
            strokeDasharray={doubtVessel === "vesselB" ? "4 3" : undefined}
            fill={doubtVessel === "vesselB" ? DOUBT_STROKE : CONE_DEFAULT_STROKE}
            fillOpacity={0.1}
          />
        </g>
        {/* Bearing line lives OUTSIDE the per-vessel rotated groups below --
            it must not inherit either vessel's rotation. */}
        <g>
          <line
            data-testid="bearing-line"
            x1={screenA.screenX}
            y1={screenA.screenY}
            x2={screenB.screenX}
            y2={screenB.screenY}
            stroke={bearingStroke}
            strokeWidth={2}
            strokeDasharray={bearingDashArray}
          />
        </g>
        {/* Range tooltip: non-interactive chip at the bearing line's
            midpoint, matching the design source's bearingLine() label
            (`pointerEvents: none` there) -- must never intercept a drag
            gesture aimed at the chart underneath it. */}
        <g transform={`translate(${bearingMidpoint.screenX},${bearingMidpoint.screenY})`} pointerEvents="none">
          <rect x={-34} y={-11} width={68} height={22} rx={6} className="
            fill-card stroke-border
          " />
          <text
            x={0}
            y={4}
            textAnchor="middle"
            className="fill-muted-foreground font-mono text-xs"
          >
            {`${rangeNm.toFixed(2)} NM`}
          </text>
        </g>
        <VesselGroup
          label="vesselA"
          vessel={vesselA}
          screen={screenA}
          role={roleA}
          hullDrag={hullDragA}
          rotateDrag={rotateDragA}
        />
        <VesselGroup
          label="vesselB"
          vessel={vesselB}
          screen={screenB}
          role={roleB}
          hullDrag={hullDragB}
          rotateDrag={rotateDragB}
        />
      </svg>
      {/* "1 NM" scale-bar legend: tick width is the true on-screen pixel
          length of 1 nautical mile for the current container size and the
          fixed CHART_VIEW_BOX.width (20nm), so it stays accurate across
          container sizes rather than being a hardcoded decorative width. */}
      <div className="
        absolute bottom-2 left-2 flex items-center gap-1 font-mono text-[13px]
        font-semibold text-muted-foreground
      ">
        <span
          className="h-px bg-border"
          style={{ width: containerSize.width / CHART_VIEW_BOX.width }}
        />
        <span>1 NM</span>
      </div>
    </div>
  );
}
