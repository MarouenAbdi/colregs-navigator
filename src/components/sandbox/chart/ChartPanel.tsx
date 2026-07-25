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

import { useState, type CSSProperties } from "react";
import type { ChartPanelProps } from "../types.js";
import { useHullDrag } from "../hooks/useHullDrag.js";
import { useRotateHandleDrag } from "../hooks/useRotateHandleDrag.js";
import { useContainerSize } from "../hooks/useContainerSize.js";
import {
  CHART_VIEW_BOX,
  CONE_DEFAULT_STROKE,
  DOUBT_STROKE,
} from "./chart-panel-geometry.js";
import { deriveChartOverlayState } from "./chart-panel-derivation.js";
import { deriveOverlayAnchor } from "./vessel-overlay-position.js";
import { ChartBackdrop } from "./ChartBackdrop.js";
import { ChartHeaderStrip } from "./ChartHeaderStrip.js";
import { ChartFooterStrip } from "./ChartFooterStrip.js";
import { VesselOverlayCard } from "./VesselOverlayCard.js";
import { VesselGroup } from "./VesselGroup.js";
import type { VesselLabel } from "../../../domain/colregs/types.js";

export function ChartPanel({
  vesselA,
  vesselB,
  classification,
  isDegenerate,
  onVesselPositionChange,
  onVesselHeadingChange,
  onVesselSpeedChange,
  onVesselTypeChange,
}: ChartPanelProps) {
  const { containerRef, containerSize } = useContainerSize();
  const [selectedVessel, setSelectedVessel] = useState<VesselLabel | null>(null);

  // D-01: layered on top of the design source's own non-toggling
  // startDrag behavior -- pressing the already-open vessel's own
  // hull/rotate-handle closes it, pressing the other vessel switches to
  // it without closing anything.
  function selectVessel(vessel: VesselLabel): void {
    setSelectedVessel((current) => (current === vessel ? null : vessel));
  }

  const hullDragA = useHullDrag("vesselA", onVesselPositionChange, containerSize, CHART_VIEW_BOX, selectVessel);
  const hullDragB = useHullDrag("vesselB", onVesselPositionChange, containerSize, CHART_VIEW_BOX, selectVessel);
  const rotateDragA = useRotateHandleDrag(
    "vesselA",
    vesselA.position,
    onVesselHeadingChange,
    containerSize,
    CHART_VIEW_BOX,
    selectVessel,
  );
  const rotateDragB = useRotateHandleDrag(
    "vesselB",
    vesselB.position,
    onVesselHeadingChange,
    containerSize,
    CHART_VIEW_BOX,
    selectVessel,
  );

  const headerFooterProps = { vesselA, vesselB, classification, isDegenerate };

  if (!containerSize || !(containerSize.width > 0 && containerSize.height > 0)) {
    return (
      <div className="
        flex flex-col overflow-hidden rounded-sm border border-border
        bg-chart-surface
      ">
        <ChartHeaderStrip {...headerFooterProps} />
        <div ref={containerRef} className="relative aspect-square w-full" />
        <ChartFooterStrip {...headerFooterProps} />
      </div>
    );
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

  // D-04: the overlay's floating anchor is computed only while a vessel is
  // selected -- deriveOverlayAnchor() is a pure function of screen position
  // + containerSize (Pitfall 1), never recomputed against pointer state.
  const overlayScreen =
    selectedVessel === "vesselA" ? screenA : selectedVessel === "vesselB" ? screenB : null;
  const overlayAnchor = overlayScreen ? deriveOverlayAnchor(overlayScreen, containerSize) : null;

  return (
    <div className="
      flex flex-col overflow-hidden rounded-sm border border-border
      bg-chart-surface
    ">
      <ChartHeaderStrip {...headerFooterProps} />
      <div ref={containerRef} className="relative aspect-square w-full">
        <svg
          width={containerSize.width}
          height={containerSize.height}
          // D-01: empty-chart-space close path -- only reached when a
          // vessel's hull/rotate-handle pointerdown did NOT already fire
          // stopPropagation() first (see useHullDrag.ts/useRotateHandleDrag.ts).
          onPointerDown={() => {
            if (selectedVessel) setSelectedVessel(null);
          }}
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
        {selectedVessel && overlayAnchor ? (
          <div
            className={`
              absolute w-56 max-w-[46%]
              ${overlayAnchor.right ? "left-(--ov-x)" : `right-(--ov-x)`}
              ${overlayAnchor.below ? "top-(--ov-y)" : `bottom-(--ov-y)`}
            `}
            style={
              {
                "--ov-x": `${overlayAnchor.offsetXPx}px`,
                "--ov-y": `${overlayAnchor.offsetYPx}px`,
              } as CSSProperties
            }
          >
            <VesselOverlayCard
              label={selectedVessel}
              letter={selectedVessel === "vesselA" ? "A" : "B"}
              vessel={selectedVessel === "vesselA" ? vesselA : vesselB}
              classification={classification}
              onVesselSpeedChange={onVesselSpeedChange}
              onVesselTypeChange={onVesselTypeChange}
              onClose={() => setSelectedVessel(null)}
            />
          </div>
        ) : null}
      </div>
      <ChartFooterStrip {...headerFooterProps} />
    </div>
  );
}
