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
 * Task 2 of 04-03-PLAN.md adds the bearing line, overtaking-boundary
 * cones, and the hull-drag/rotate-handle-drag wiring on top of this
 * static-rendering foundation.
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
  vessel: Vessel;
  screen: { screenX: number; screenY: number };
  role: VesselRole;
}

function VesselGroup({ vessel, screen, role }: VesselGroupProps) {
  return (
    <g transform={`translate(${screen.screenX},${screen.screenY}) rotate(${vessel.heading})`}>
      {/* Invisible hull hit-shape, 44x44px minimum (UI-SPEC Spacing Scale
          exception) -- rendered before the visible polygon so it sits
          underneath (does not visually cover it). Task 2 attaches the
          drag handlers here. */}
      <rect x={-22} y={-22} width={44} height={44} fill="transparent" />
      {/* Hull shape, local/unrotated, bow pointing up/-y. */}
      <polygon points="0,-10 6,8 -6,8" className={HULL_FILL_CLASS[role]} />
      <text x={0} y={24} textAnchor="middle" className="text-[14px] font-semibold fill-current">
        {ROLE_BADGE_TEXT[role]}
      </text>
    </g>
  );
}

export function ChartPanel({ vesselA, vesselB, classification }: ChartPanelProps) {
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

  if (!containerSize || !(containerSize.width > 0 && containerSize.height > 0)) {
    return <div ref={containerRef} className="aspect-square w-full relative" />;
  }

  const screenA = chartToScreen(vesselA.position, containerSize, CHART_VIEW_BOX);
  const screenB = chartToScreen(vesselB.position, containerSize, CHART_VIEW_BOX);

  const roleA = getVesselRole("vesselA", classification);
  const roleB = getVesselRole("vesselB", classification);

  return (
    <div ref={containerRef} className="aspect-square w-full relative">
      <svg
        width={containerSize.width}
        height={containerSize.height}
        className="bg-white border border-slate-200 rounded"
      >
        <g>{buildGridLines(containerSize)}</g>
        <VesselGroup vessel={vesselA} screen={screenA} role={roleA} />
        <VesselGroup vessel={vesselB} screen={screenB} role={roleB} />
      </svg>
    </div>
  );
}
