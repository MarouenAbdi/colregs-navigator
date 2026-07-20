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
import { ROLE_BADGE_TEXT, ROLE_HULL_FILL_CLASS, type VesselRole } from "./vessel-role.js";
import type { Vessel } from "../../domain/vessel/vessel.js";
import { useHullDrag, type DragHandlers } from "./hooks/useHullDrag.js";
import { useRotateHandleDrag } from "./hooks/useRotateHandleDrag.js";
import { useContainerSize } from "./hooks/useContainerSize.js";
import type { VesselLabel } from "../../domain/colregs/types.js";
import {
  BADGE_OFFSET_X,
  BADGE_OFFSET_Y,
  BADGE_RECT_HEIGHT,
  BADGE_RECT_WIDTH,
  CHART_VIEW_BOX,
  CONE_DEFAULT_STROKE,
  DOUBT_STROKE,
  HULL_BOW_Y,
  HULL_HALF_WIDTH,
  HULL_NOTCH_Y,
  HULL_POINTS,
  HULL_STERN_Y,
  HULL_STROKE,
  HULL_STROKE_WIDTH,
  LETTER_CIRCLE_R,
  LETTER_OFFSET_X,
  LETTER_OFFSET_Y,
  ROTATE_HANDLE_CY,
  ROTATE_HANDLE_VISIBLE_R,
  ROTATE_STALK_Y2,
} from "./chart-panel-geometry.js";
import { deriveChartOverlayState } from "./chart-panel-derivation.js";
import { ChartBackdrop } from "./ChartBackdrop.js";

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
