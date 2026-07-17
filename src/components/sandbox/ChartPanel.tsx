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

import { useEffect, useRef, useState } from "react";
import type { ChartPanelProps } from "./types.js";
import { getVesselRole, type VesselRole } from "./vessel-role.js";
import {
  chartToScreen,
  type ChartViewBox,
  type ContainerSize,
} from "../../domain/geometry/screen-convert.js";
import type { Vessel } from "../../domain/vessel/vessel.js";
import { useHullDrag, type DragHandlers } from "./hooks/useHullDrag.js";
import { useRotateHandleDrag } from "./hooks/useRotateHandleDrag.js";
import { resolveDoubtGeometry } from "../../domain/colregs/resolve-doubt-geometry.js";
import type { VesselLabel } from "../../domain/colregs/types.js";

// Fixed chart-space viewBox for this phase: 20nm x 20nm centered on the
// origin -- comfortably contains the default crossingResidualBasicCase
// scenario (vessels 5nm apart), with room to drag.
const CHART_VIEW_BOX: ChartViewBox = { minX: -10, minY: -10, width: 20, height: 20 };

const GRID_STEP_CHART_UNITS = 2;
const GRID_STROKE = "#E2E8F0"; // slate-200

const HULL_FILL_CLASS: Record<VesselRole, string> = {
  "give-way": "fill-red-500",
  "stand-on": "fill-green-500",
  mutual: "fill-slate-400",
};

const ROLE_BADGE_TEXT: Record<VesselRole, string> = {
  "give-way": "GW",
  "stand-on": "SO",
  mutual: "MUTUAL",
};

const BEARING_LINE_DEFAULT_STROKE = "#475569"; // slate-600
const DOUBT_STROKE = "#F59E0B"; // amber-500
const CONE_DEFAULT_STROKE = "#CBD5E1"; // slate-300

const CONE_RADIUS_PX = 60;
// Rule 13(b)'s "abaft the beam" cone, expressed as a relative-bearing
// sector: 112.5deg to 247.5deg (a fixed 135-degree-wide cone, symmetric
// around 180deg/dead-astern).
const CONE_START_RELATIVE_BEARING_DEGREES = 112.5;
const CONE_END_RELATIVE_BEARING_DEGREES = 247.5;

// SVG sector/wedge path for the overtaking-boundary reference cone
// (04-RESEARCH.md Pattern 3). `startBearingDeg`/`endBearingDeg` are TRUE
// bearings (already offset by the observing vessel's heading) -- this
// function does no relative-to-true conversion itself.
function wedgePath(
  center: { screenX: number; screenY: number },
  radiusPx: number,
  startBearingDeg: number,
  endBearingDeg: number,
): string {
  // Bearing (clockwise from North/up) -> SVG angle (clockwise from
  // positive x-axis, y-down) conversion: svgAngle = bearing - 90.
  const toXY = (bearingDeg: number) => {
    const rad = ((bearingDeg - 90) * Math.PI) / 180;
    return {
      x: center.screenX + radiusPx * Math.cos(rad),
      y: center.screenY + radiusPx * Math.sin(rad),
    };
  };
  const start = toXY(startBearingDeg);
  const end = toXY(endBearingDeg);
  const largeArcFlag = endBearingDeg - startBearingDeg > 180 ? 1 : 0; // always 0: 135deg span
  const sweepFlag = 1; // clockwise
  return [
    `M ${center.screenX} ${center.screenY}`,
    `L ${start.x} ${start.y}`,
    `A ${radiusPx} ${radiusPx} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

function buildGridLines(containerSize: ContainerSize): React.ReactNode[] {
  const lines: React.ReactNode[] = [];
  const minX = CHART_VIEW_BOX.minX;
  const maxX = CHART_VIEW_BOX.minX + CHART_VIEW_BOX.width;
  const minY = CHART_VIEW_BOX.minY;
  const maxY = CHART_VIEW_BOX.minY + CHART_VIEW_BOX.height;

  for (let x = minX; x <= maxX; x += GRID_STEP_CHART_UNITS) {
    const top = chartToScreen({ x, y: minY }, containerSize, CHART_VIEW_BOX);
    const bottom = chartToScreen({ x, y: maxY }, containerSize, CHART_VIEW_BOX);
    lines.push(
      <line
        key={`grid-v-${x}`}
        x1={top.screenX}
        y1={top.screenY}
        x2={bottom.screenX}
        y2={bottom.screenY}
        stroke={GRID_STROKE}
        strokeWidth={1}
      />,
    );
  }
  for (let y = minY; y <= maxY; y += GRID_STEP_CHART_UNITS) {
    const left = chartToScreen({ x: minX, y }, containerSize, CHART_VIEW_BOX);
    const right = chartToScreen({ x: maxX, y }, containerSize, CHART_VIEW_BOX);
    lines.push(
      <line
        key={`grid-h-${y}`}
        x1={left.screenX}
        y1={left.screenY}
        x2={right.screenX}
        y2={right.screenY}
        stroke={GRID_STROKE}
        strokeWidth={1}
      />,
    );
  }
  return lines;
}

interface VesselGroupProps {
  label: VesselLabel;
  vessel: Vessel;
  screen: { screenX: number; screenY: number };
  role: VesselRole;
  hullDrag: DragHandlers;
  rotateDrag: DragHandlers;
}

function VesselGroup({ label, vessel, screen, role, hullDrag, rotateDrag }: VesselGroupProps) {
  return (
    <g transform={`translate(${screen.screenX},${screen.screenY}) rotate(${vessel.heading})`}>
      {/* Invisible hull hit-shape, 44x44px minimum (UI-SPEC Spacing Scale
          exception) -- rendered before the visible polygon so it sits
          underneath (does not visually cover it) but still receives the
          drag gesture. Top edge is pinned to the bow tip (y=-10), NOT
          centered on the vessel origin (y=-22) -- a centered hit-rect
          reached 12px past the bow into the rotate handle's own hit-circle
          below, so paint order gave the rotate gesture priority over most
          of the visible hull's upper half, making position-drag unreliable
          right where users naturally grab the vessel (bug found during
          Phase 4 human UAT -- component tests never caught it because
          jsdom stubs setPointerCapture/hasPointerCapture and dispatch
          events directly to a testid'd node, bypassing real paint-order
          hit-testing entirely). */}
      <rect
        data-testid={`hull-hit-${label}`}
        x={-22}
        y={-10}
        width={44}
        height={44}
        fill="transparent"
        onPointerDown={hullDrag.onPointerDown}
        onPointerMove={hullDrag.onPointerMove}
        onPointerUp={hullDrag.onPointerUp}
      />
      {/* Hull shape, local/unrotated, bow pointing up/-y. */}
      <polygon points="0,-10 6,8 -6,8" className={HULL_FILL_CLASS[role]} />
      <text x={0} y={24} textAnchor="middle" className="text-[14px] font-semibold fill-current">
        {ROLE_BADGE_TEXT[role]}
      </text>
      {/* Rotate handle: invisible 44px-diameter hit-circle (WCAG 2.5.5 AA)
          underneath a visible r=6 handle beyond the bow tip. Centered at
          cy=-34 (not -20) so the hit-circle's bottom edge (-34+22=-12)
          clears the hull hit-rect's top edge (-10) with a 2px margin --
          see the hull-hit-rect comment above for why this separation is
          required. */}
      <circle
        data-testid={`rotate-hit-${label}`}
        cx={0}
        cy={-34}
        r={22}
        fill="transparent"
        onPointerDown={rotateDrag.onPointerDown}
        onPointerMove={rotateDrag.onPointerMove}
        onPointerUp={rotateDrag.onPointerUp}
      />
      <circle cx={0} cy={-34} r={6} stroke="#0D9488" strokeWidth={2} fill="white" />
    </g>
  );
}

export function ChartPanel({
  vesselA,
  vesselB,
  classification,
  onVesselPositionChange,
  onVesselHeadingChange,
}: ChartPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<ContainerSize | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setContainerSize({ width, height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

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
    return <div ref={containerRef} className="aspect-square w-full relative" />;
  }

  const screenA = chartToScreen(vesselA.position, containerSize, CHART_VIEW_BOX);
  const screenB = chartToScreen(vesselB.position, containerSize, CHART_VIEW_BOX);

  const roleA = getVesselRole("vesselA", classification);
  const roleB = getVesselRole("vesselB", classification);

  // Bearing line: default styling, swaps to dashed amber when the
  // head-on-boundary doubt is active (D-04).
  const bearingDoubt =
    classification.doubt && classification.doubtBoundary === "near-head-on-boundary";
  const bearingStroke = bearingDoubt ? DOUBT_STROKE : BEARING_LINE_DEFAULT_STROKE;
  const bearingDashArray = bearingDoubt ? "4 3" : undefined;

  // Overtaking-boundary cone doubt resolution: exactly one vessel's cone
  // (per resolveDoubtGeometry, Pitfall 3) swaps to dashed amber when the
  // overtaking/crossing-boundary doubt is active; the other stays static.
  let doubtVessel: VesselLabel | null = null;
  if (classification.doubt && classification.doubtBoundary === "near-overtaking-crossing-boundary") {
    const doubtResult = resolveDoubtGeometry(vesselA, vesselB, classification.doubtBoundary);
    if (doubtResult.ok) {
      doubtVessel = doubtResult.value.vessel;
    }
    // If resolveDoubtGeometry returns !ok (should not occur here since
    // classifyEncounter already succeeded for these same vessels), fall
    // back to default static styling on both cones -- doubtVessel stays
    // null.
  }

  const conePathA = wedgePath(
    screenA,
    CONE_RADIUS_PX,
    vesselA.heading + CONE_START_RELATIVE_BEARING_DEGREES,
    vesselA.heading + CONE_END_RELATIVE_BEARING_DEGREES,
  );
  const conePathB = wedgePath(
    screenB,
    CONE_RADIUS_PX,
    vesselB.heading + CONE_START_RELATIVE_BEARING_DEGREES,
    vesselB.heading + CONE_END_RELATIVE_BEARING_DEGREES,
  );

  return (
    <div ref={containerRef} className="aspect-square w-full relative">
      <svg
        width={containerSize.width}
        height={containerSize.height}
        className="bg-white border border-slate-200 rounded"
      >
        <g>{buildGridLines(containerSize)}</g>
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
    </div>
  );
}
