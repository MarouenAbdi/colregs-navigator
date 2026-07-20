/**
 * Pure, framework-free geometry for ChartPanel's SVG chart (RFCT-01):
 * fixed layout constants (viewBox, grid, range rings, hull shape, badge/
 * handle offsets, cone/bearing styling) plus `wedgePath()` and
 * `buildGridLineSegments()`, both relocated verbatim from ChartPanel.tsx
 * with no behavior change. Every comment below is preserved from its
 * original site in ChartPanel.tsx.
 */

import { chartToScreen, type ChartViewBox, type ContainerSize } from "../../domain/geometry/screen-convert.js";

// Fixed chart-space viewBox for this phase: 20nm x 20nm centered on the
// origin -- comfortably contains the default crossingResidualBasicCase
// scenario (vessels 5nm apart), with room to drag.
export const CHART_VIEW_BOX: ChartViewBox = { minX: -10, minY: -10, width: 20, height: 20 };

export const GRID_STEP_CHART_UNITS = 2;
export const GRID_STROKE = "#27272A"; // border token -- dark-theme grid line (was slate-200, a light-canvas color)

// Decorative fixed-pixel texture layer UNDER the nm-scale gridlines above --
// independent of chart scale, matching the design source's own two-tier
// grid (`sfine` 20px + `sgrid` 80px pattern, composited together). Reuses
// the same fixed-pixel-pattern technique as HeroPreviewCard's `heroGrid`.
export const FINE_GRID_CELL_PX = 20;
export const FINE_GRID_STROKE = "rgba(120,120,130,.08)";

// Range rings + N/E-W crosshair (design source: 960x640 viewBox, rings at
// r=120/r=240 centered on the chart's own origin, crosshair spanning the
// inner ring's diameter) -- expressed as a ratio of container width so they
// stay correctly proportioned across container sizes, not a hardcoded px
// literal tied to the design's own fixed 960px canvas.
export const RANGE_RING_STROKE = "rgba(45,212,191,.12)"; // primary teal -- matches HeroPreviewCard's own ring styling
export const RANGE_RING_INNER_RADIUS_RATIO = 120 / 960;
export const RANGE_RING_OUTER_RADIUS_RATIO = 240 / 960;
export const CROSSHAIR_STROKE = "#3F3F46"; // zinc-700, same as CONE_DEFAULT_STROKE below

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
export const HULL_BOW_Y = -28;
export const HULL_STERN_Y = 21.77;
export const HULL_NOTCH_Y = 10.9;
export const HULL_HALF_WIDTH = 17.1;
export const HULL_POINTS = `0,${HULL_BOW_Y} ${HULL_HALF_WIDTH},${HULL_STERN_Y} 0,${HULL_NOTCH_Y} ${-HULL_HALF_WIDTH},${HULL_STERN_Y}`;

// Near-white outline + width, matching HeroPreviewCard's HULL_STROKE/
// HULL_STROKE_WIDTH ("rgba(250,250,250,.85)" / 1.15) scaled by the same
// ~2.029 hull-size ratio used for the hull points above -- not a
// cross-feature import (Sandbox and Hero are separate features per
// CLAUDE.md's low-coupling convention), just the same literal value.
export const HULL_STROKE = "rgba(250,250,250,.85)";
export const HULL_STROKE_WIDTH = 2.33;

export const BADGE_RECT_WIDTH = 30;
export const BADGE_RECT_HEIGHT = 18;

// Letter identifier (A/B) and role badge (GW/SO/MUTUAL) both sit in a
// NON-rotating sibling group at a fixed screen-relative offset from the
// vessel's position -- matching HeroPreviewCard's VesselMarker (label
// upper-left, badge lower-right, "only the hull path carries rotate(hdg)")
// and the actual design source's renderVessel(), which likewise gives the
// badge/label groups their own translate-only transform separate from the
// hull's rotate. Offsets are Hero's own (-11,-11)/(+12,+10) scaled by the
// same ~2.029 hull-size ratio, not arbitrary new values.
export const LETTER_OFFSET_X = -22.3;
export const LETTER_OFFSET_Y = -22.3;
export const LETTER_CIRCLE_R = 11;
export const BADGE_OFFSET_X = 24.3;
export const BADGE_OFFSET_Y = 20.3;

export const ROTATE_HANDLE_CY = -58;
export const ROTATE_HANDLE_VISIBLE_R = 10;
export const ROTATE_STALK_Y2 = ROTATE_HANDLE_CY + ROTATE_HANDLE_VISIBLE_R;

export const BEARING_LINE_DEFAULT_STROKE = "#475569"; // slate-600
export const DOUBT_STROKE = "#F59E0B"; // amber-500
export const CONE_DEFAULT_STROKE = "#3F3F46"; // zinc-700 -- dark-theme reference cone (was slate-300, a light-canvas color)

export const CONE_RADIUS_PX = 60;
// Rule 13(b)'s "abaft the beam" cone, expressed as a relative-bearing
// sector: 112.5deg to 247.5deg (a fixed 135-degree-wide cone, symmetric
// around 180deg/dead-astern).
export const CONE_START_RELATIVE_BEARING_DEGREES = 112.5;
export const CONE_END_RELATIVE_BEARING_DEGREES = 247.5;

// SVG sector/wedge path for the overtaking-boundary reference cone
// (04-RESEARCH.md Pattern 3). `startBearingDeg`/`endBearingDeg` are TRUE
// bearings (already offset by the observing vessel's heading) -- this
// function does no relative-to-true conversion itself.
export function wedgePath(
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

export function buildGridLineSegments(
  containerSize: ContainerSize,
  viewBox: ChartViewBox,
): Array<{ key: string; x1: number; y1: number; x2: number; y2: number }> {
  const lines: Array<{ key: string; x1: number; y1: number; x2: number; y2: number }> = [];
  const minX = viewBox.minX;
  const maxX = viewBox.minX + viewBox.width;
  const minY = viewBox.minY;
  const maxY = viewBox.minY + viewBox.height;

  for (let x = minX; x <= maxX; x += GRID_STEP_CHART_UNITS) {
    const top = chartToScreen({ x, y: minY }, containerSize, viewBox);
    const bottom = chartToScreen({ x, y: maxY }, containerSize, viewBox);
    lines.push({
      key: `grid-v-${x}`,
      x1: top.screenX,
      y1: top.screenY,
      x2: bottom.screenX,
      y2: bottom.screenY,
    });
  }
  for (let y = minY; y <= maxY; y += GRID_STEP_CHART_UNITS) {
    const left = chartToScreen({ x: minX, y }, containerSize, viewBox);
    const right = chartToScreen({ x: maxX, y }, containerSize, viewBox);
    lines.push({
      key: `grid-h-${y}`,
      x1: left.screenX,
      y1: left.screenY,
      x2: right.screenX,
      y2: right.screenY,
    });
  }
  return lines;
}
