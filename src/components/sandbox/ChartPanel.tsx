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
import { getVesselRole, ROLE_BADGE_TEXT, ROLE_HULL_FILL_CLASS, type VesselRole } from "./vessel-role.js";
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
const GRID_STROKE = "#27272A"; // border token -- dark-theme grid line (was slate-200, a light-canvas color)

// Decorative fixed-pixel texture layer UNDER the nm-scale gridlines above --
// independent of chart scale, matching the design source's own two-tier
// grid (`sfine` 20px + `sgrid` 80px pattern, composited together). Reuses
// the same fixed-pixel-pattern technique as HeroPreviewCard's `heroGrid`.
const FINE_GRID_CELL_PX = 20;
const FINE_GRID_STROKE = "rgba(120,120,130,.08)";

// Range rings + N/E-W crosshair (design source: 960x640 viewBox, rings at
// r=120/r=240 centered on the chart's own origin, crosshair spanning the
// inner ring's diameter) -- expressed as a ratio of container width so they
// stay correctly proportioned across container sizes, not a hardcoded px
// literal tied to the design's own fixed 960px canvas.
const RANGE_RING_STROKE = "rgba(45,212,191,.12)"; // primary teal -- matches HeroPreviewCard's own ring styling
const RANGE_RING_INNER_RADIUS_RATIO = 120 / 960;
const RANGE_RING_OUTER_RADIUS_RATIO = 240 / 960;
const CROSSHAIR_STROKE = "#3F3F46"; // zinc-700, same as CONE_DEFAULT_STROKE below

// Bigger hull + a stalk-mounted rotate handle set well clear of the bow
// tip (04-HUMAN-UAT.md Gap 1 follow-up: separating two invisible padded
// hit-shapes by a numeric margin still left drag/rotate feeling
// imprecise -- a padded invisible shape is inherently bigger than the
// control it represents, so its boundary never quite matches what the
// user visually sees). Both the hull and the rotate handle now attach
// their pointer handlers directly to their own visible, solid-filled
// shape: SVG's default `pointer-events: visiblePainted` hit-tests a
// shape's actual painted area whenever its fill is anything other than
// "none", so a gesture can only start when the pointer is genuinely over
// the thing the user sees, never a padded box/circle around it. No
// separate WCAG-sized invisible hit-circle remains for the rotate handle
// -- its own visible ring is the entire hit target, enlarged slightly
// (r=10, up from a decorative r=7) to stay comfortably grabbable now that
// it alone defines the click area.
// Hull shape: the same concave 4-point kite/arrow as HeroPreviewCard's
// HULL_PATH ("M 0,-13.8 L 8.43,10.73 L 0,5.37 L -8.43,10.73 Z", itself
// transcribed from the design source's renderVessel()) -- NOT a flat-back
// triangle. Scaled up by the same ratio across all four points (factor
// 28/13.8 ≈ 2.029) to preserve this panel's deliberately bigger interactive
// hit target (04-HUMAN-UAT.md Gap 1) while matching Hero's exact
// bow/stern/notch/half-width proportions, not an arbitrarily-chosen shape.
const HULL_BOW_Y = -28;
const HULL_STERN_Y = 21.77;
const HULL_NOTCH_Y = 10.9;
const HULL_HALF_WIDTH = 17.1;
const HULL_POINTS = `0,${HULL_BOW_Y} ${HULL_HALF_WIDTH},${HULL_STERN_Y} 0,${HULL_NOTCH_Y} ${-HULL_HALF_WIDTH},${HULL_STERN_Y}`;

// Near-white outline + width, matching HeroPreviewCard's HULL_STROKE/
// HULL_STROKE_WIDTH ("rgba(250,250,250,.85)" / 1.15) scaled by the same
// ~2.029 hull-size ratio used for the hull points above -- not a
// cross-feature import (Sandbox and Hero are separate features per
// CLAUDE.md's low-coupling convention), just the same literal value.
const HULL_STROKE = "rgba(250,250,250,.85)";
const HULL_STROKE_WIDTH = 2.33;

const BADGE_RECT_WIDTH = 30;
const BADGE_RECT_HEIGHT = 18;

// Letter identifier (A/B) and role badge (GW/SO/MUTUAL) both sit in a
// NON-rotating sibling group at a fixed screen-relative offset from the
// vessel's position -- matching HeroPreviewCard's VesselMarker (label
// upper-left, badge lower-right, "only the hull path carries rotate(hdg)")
// and the actual design source's renderVessel(), which likewise gives the
// badge/label groups their own translate-only transform separate from the
// hull's rotate. Offsets are Hero's own (-11,-11)/(+12,+10) scaled by the
// same ~2.029 hull-size ratio, not arbitrary new values.
const LETTER_OFFSET_X = -22.3;
const LETTER_OFFSET_Y = -22.3;
const LETTER_CIRCLE_R = 11;
const BADGE_OFFSET_X = 24.3;
const BADGE_OFFSET_Y = 20.3;

const ROTATE_HANDLE_CY = -58;
const ROTATE_HANDLE_VISIBLE_R = 10;
const ROTATE_STALK_Y2 = ROTATE_HANDLE_CY + ROTATE_HANDLE_VISIBLE_R;

const BEARING_LINE_DEFAULT_STROKE = "#475569"; // slate-600
const DOUBT_STROKE = "#F59E0B"; // amber-500
const CONE_DEFAULT_STROKE = "#3F3F46"; // zinc-700 -- dark-theme reference cone (was slate-300, a light-canvas color)

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
    <g transform={`translate(${screen.screenX},${screen.screenY})`}>
      {/* Everything that should visually track heading lives in this
          rotated sub-group: the stalk, the hull, and the rotate handle
          (its own arc position around the vessel IS the drag control, so
          it must rotate). The letter/role-badge chips below are deliberately
          OUTSIDE this group -- matching HeroPreviewCard's VesselMarker
          ("only the hull path carries rotate(hdg)") and the design source's
          renderVessel(), where the badge/label groups get their own
          translate-only transform. Rotating them (the pre-fix behavior)
          made a vessel's badge read sideways/upside-down at non-upright
          headings. */}
      <g transform={`rotate(${vessel.heading})`}>
        {/* Rotate-handle stalk: a thin, non-interactive connector from the
            bow tip to the rotate handle, signaling "this dot is a heading
            control attached to the vessel" rather than an unrelated nearby
            UI element. No pointer handlers -- purely decorative, so it can
            never intercept a hull-drag or rotate-drag gesture. */}
        <line
          x1={0}
          y1={HULL_BOW_Y}
          x2={0}
          y2={ROTATE_STALK_Y2}
          className="stroke-rule-accent"
          strokeWidth={1.5}
          strokeDasharray="2 3"
          opacity={0.6}
        />
        {/* Hull: the visible, solid-filled polygon IS the hit target --
            pointer handlers are attached directly to it. SVG's default
            `pointer-events: visiblePainted` hit-tests a shape's actual
            painted area whenever its fill is anything other than "none";
            a solid Tailwind fill class qualifies, so a drag gesture can
            only start when the pointer is genuinely over the visible hull,
            never over the empty chart or the (now well-separated) rotate
            handle. Bigger than the original hull (36px wide x 48px tall,
            vs. 12x18) per UAT feedback that the icons were also too small
            to comfortably grab. */}
        <polygon
          data-testid={`hull-hit-${label}`}
          points={HULL_POINTS}
          className={`
            cursor-grab
            active:cursor-grabbing
            ${ROLE_HULL_FILL_CLASS[role]}
          `}
          stroke={HULL_STROKE}
          strokeWidth={HULL_STROKE_WIDTH}
          onPointerDown={hullDrag.onPointerDown}
          onPointerMove={hullDrag.onPointerMove}
          onPointerUp={hullDrag.onPointerUp}
        />
        {/* Rotate handle: the visible teal-ringed circle IS the hit target --
            same principle as the hull polygon above. No separate padded
            invisible hit-circle; `fill="white"` is a real paint (not
            "none"), so pointer-events hit-tests exactly this circle's
            drawn area. Centered well beyond the enlarged hull's bow tip
            (HULL_BOW_Y) so the two hit regions cannot overlap regardless
            of hull width. */}
        <circle
          data-testid={`rotate-hit-${label}`}
          cx={0}
          cy={ROTATE_HANDLE_CY}
          r={ROTATE_HANDLE_VISIBLE_R}
          className="
            cursor-grab stroke-rule-accent
            active:cursor-grabbing
          "
          strokeWidth={2}
          fill="white"
          onPointerDown={rotateDrag.onPointerDown}
          onPointerMove={rotateDrag.onPointerMove}
          onPointerUp={rotateDrag.onPointerUp}
        />
      </g>

      {/* Letter identifier (A/B) and role badge -- both decorative overlays
          fixed at a screen offset regardless of heading. `pointerEvents:
          "none"` on both groups is load-bearing, not decoration: at
          heading 0 (the app's default seed and every current chip
          fixture), the badge's painted rect geometrically overlaps part
          of the hull polygon's own painted stern-right wing (~45px^2,
          confirmed via point-in-polygon test), and SVG's default
          `pointer-events: visiblePainted` would otherwise let this
          unhandled, purely-decorative rect silently capture a
          pointerdown that should have started a hull drag underneath
          it -- the exact hit-testing regression class this panel's other
          comments call out as highest-risk. Matches the same
          `pointerEvents="none"` pattern already used on the range-tooltip
          group below. */}
      <g pointerEvents="none">
        {/* Letter identifier (A/B), fixed upper-left of the vessel
            regardless of heading -- always the same dark chip regardless
            of role. */}
        <circle cx={LETTER_OFFSET_X} cy={LETTER_OFFSET_Y} r={LETTER_CIRCLE_R} className="
          fill-card
        " />
        <text
          x={LETTER_OFFSET_X}
          y={LETTER_OFFSET_Y}
          dy="0.35em"
          textAnchor="middle"
          className="fill-white text-[12px] font-bold"
        >
          {label === "vesselA" ? "A" : "B"}
        </text>

        {/* Role badge (GW/SO/MUTUAL), fixed lower-right of the vessel
            regardless of heading. */}
        <rect
          x={BADGE_OFFSET_X - BADGE_RECT_WIDTH / 2}
          y={BADGE_OFFSET_Y - BADGE_RECT_HEIGHT / 2}
          width={BADGE_RECT_WIDTH}
          height={BADGE_RECT_HEIGHT}
          rx={4}
          className={ROLE_HULL_FILL_CLASS[role]}
        />
        <text
          x={BADGE_OFFSET_X}
          y={BADGE_OFFSET_Y}
          dy="0.35em"
          textAnchor="middle"
          className="fill-white text-[11px] font-semibold"
        >
          {ROLE_BADGE_TEXT[role]}
        </text>
      </g>
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
    return <div ref={containerRef} className="relative aspect-square w-full" />;
  }

  const screenA = chartToScreen(vesselA.position, containerSize, CHART_VIEW_BOX);
  const screenB = chartToScreen(vesselB.position, containerSize, CHART_VIEW_BOX);
  const chartCenter = chartToScreen({ x: 0, y: 0 }, containerSize, CHART_VIEW_BOX);
  const innerRingRadiusPx = containerSize.width * RANGE_RING_INNER_RADIUS_RATIO;
  const outerRingRadiusPx = containerSize.width * RANGE_RING_OUTER_RADIUS_RATIO;

  const roleA = getVesselRole("vesselA", classification);
  const roleB = getVesselRole("vesselB", classification);

  // Bearing line: default styling, swaps to dashed amber when the
  // head-on-boundary doubt is active (D-04).
  const bearingDoubt =
    classification.doubt && classification.doubtBoundary === "near-head-on-boundary";
  const bearingStroke = bearingDoubt ? DOUBT_STROKE : BEARING_LINE_DEFAULT_STROKE;
  const bearingDashArray = bearingDoubt ? "4 3" : undefined;

  // Range tooltip: a chip centered on the bearing line's midpoint showing
  // current distance in NM -- matches the design source's bearingLine()
  // label chip (HeroPreviewCard's static preview already carries this same
  // chip; ChartPanel's live version was missing it entirely). Chart-space
  // position units are already NM (CHART_VIEW_BOX is a 20nm x 20nm box), so
  // this is a plain Euclidean distance, same technique as
  // instrument-readouts.ts's own rangeNm derivation.
  const rangeNm = Math.hypot(
    vesselB.position.x - vesselA.position.x,
    vesselB.position.y - vesselA.position.y,
  );
  const bearingMidpoint = {
    screenX: (screenA.screenX + screenB.screenX) / 2,
    screenY: (screenA.screenY + screenB.screenY) / 2,
  };

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
    <div ref={containerRef} className="relative aspect-square w-full">
      <svg
        width={containerSize.width}
        height={containerSize.height}
        className="rounded-[0.25rem] border border-border bg-chart-surface"
      >
        <defs>
          <pattern
            id="chart-fine-grid"
            width={FINE_GRID_CELL_PX}
            height={FINE_GRID_CELL_PX}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${FINE_GRID_CELL_PX} 0 H 0 V ${FINE_GRID_CELL_PX}`}
              fill="none"
              stroke={FINE_GRID_STROKE}
              strokeWidth={1}
            />
          </pattern>
        </defs>
        <rect width={containerSize.width} height={containerSize.height} fill="url(#chart-fine-grid)" />
        <g>{buildGridLines(containerSize)}</g>
        <g stroke={RANGE_RING_STROKE} fill="none">
          <circle cx={chartCenter.screenX} cy={chartCenter.screenY} r={innerRingRadiusPx} />
          <circle cx={chartCenter.screenX} cy={chartCenter.screenY} r={outerRingRadiusPx} />
        </g>
        <g stroke={CROSSHAIR_STROKE} strokeWidth={1}>
          <line
            x1={chartCenter.screenX}
            y1={chartCenter.screenY - innerRingRadiusPx}
            x2={chartCenter.screenX}
            y2={chartCenter.screenY + innerRingRadiusPx}
          />
          <line
            x1={chartCenter.screenX - innerRingRadiusPx}
            y1={chartCenter.screenY}
            x2={chartCenter.screenX + innerRingRadiusPx}
            y2={chartCenter.screenY}
          />
        </g>
        <text
          x={chartCenter.screenX + 4}
          y={chartCenter.screenY - innerRingRadiusPx + 12}
          className="fill-muted-foreground font-mono text-[11px]"
        >
          N
        </text>
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
