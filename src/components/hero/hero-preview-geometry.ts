/**
 * Pure, framework-free geometry for the Hero preview card's illustrative
 * SVG chart. Every constant here is derived from the design source
 * ("COLREGS Navigator (shadcn).dc.html", claude.ai/design project
 * c265c047) to reproduce its exact layout, not eyeballed from the PNG --
 * see each constant's comment for the derivation.
 */
import type { ChartViewBox, ContainerSize } from "../../domain/geometry/screen-convert.js";

// Per the design's Preview Card Dimensions spec: 8:5 (not square) aspect ratio,
// framed to comfortably contain both fixture vessels + the range rings.
export const HERO_CONTAINER_SIZE: ContainerSize = { width: 320, height: 200 };

// The design hardcodes this card's two vessels at pixel positions
// hA=(150,210)/hB=(360,95) on its 480x300 canvas -- its own
// PX=80-pixels-per-NM sandbox scale applied to the same real
// bearing/range this fixture reproduces (061deg/2.99nm). This viewBox is
// solved (not eyeballed) so heroPreviewVesselA/B's *real* NM coordinates
// land on those exact screen pixels, scaled to this card's 320px width:
// minX=-1.875, minY=-1.125 puts A at (100,140) and B at (~239.5,~62.7),
// matching the mock's (150,210)/(360,95) scaled by 320/480 to sub-pixel
// accuracy. Width/height (6 x 3.75) preserve the 8:5 aspect ratio and a
// uniform 320/6 = 200/3.75 = 53.33px-per-NM scale (no bearing distortion).
export const HERO_VIEW_BOX: ChartViewBox = { minX: -1.875, minY: -1.125, width: 6, height: 3.75 };

// Range rings, bearing sector, and north reference line are centered on
// this fixed chart-canvas center (matches the mock's rings, which are
// centered on its own canvas center, not on either vessel).
export const HERO_CHART_CENTER = {
  screenX: HERO_CONTAINER_SIZE.width / 2,
  screenY: HERO_CONTAINER_SIZE.height / 2,
};

// The mock's two range rings are hardcoded at r=115/r=60 on its 480px-wide
// canvas -- reproduced as the same fraction of this card's width.
export const HERO_OUTER_RING_RADIUS_PX = HERO_CONTAINER_SIZE.width * (115 / 480);
export const HERO_INNER_RING_RADIUS_PX = HERO_CONTAINER_SIZE.width * (60 / 480);

// Domain-locked colors (per the design's fixed color table): the fixture's verdict is
// fixed at authoring time, so hull/pill *colors* may stay hardcoded, but
// "GW"/"SO" *text* must still be derived from the classification result.
export const VESSEL_A_HULL_COLOR = "#EF4444"; // red-500, give-way
export const VESSEL_B_HULL_COLOR = "#22C55E"; // green-500, stand-on
export const CONNECTOR_STROKE = "#475569"; // slate-600

// Bearing sector wedge: apex at the fixed chart-canvas center, one edge
// running due north, the other along the real bearing to vesselB.
export function bearingSectorPath(bearingDegrees: number): string {
  const northEdge = { x: HERO_CHART_CENTER.screenX, y: HERO_CHART_CENTER.screenY - HERO_OUTER_RING_RADIUS_PX };
  const bearingEdge = {
    x: HERO_CHART_CENTER.screenX + HERO_OUTER_RING_RADIUS_PX * Math.sin((bearingDegrees * Math.PI) / 180),
    y: HERO_CHART_CENTER.screenY - HERO_OUTER_RING_RADIUS_PX * Math.cos((bearingDegrees * Math.PI) / 180),
  };
  // Sweep is clockwise from north (0deg) to bearingDegrees, so the swept
  // angle is bearingDegrees itself (assumed normalized to [0, 360)) --
  // matching ChartPanel.tsx's wedgePath(), which computes the same flag
  // from its own start/end bearing difference rather than hardcoding it.
  const largeArcFlag = bearingDegrees > 180 ? 1 : 0;
  return [
    `M ${HERO_CHART_CENTER.screenX} ${HERO_CHART_CENTER.screenY}`,
    `L ${northEdge.x} ${northEdge.y}`,
    `A ${HERO_OUTER_RING_RADIUS_PX} ${HERO_OUTER_RING_RADIUS_PX} 0 ${largeArcFlag} 1 ${bearingEdge.x} ${bearingEdge.y}`,
    "Z",
  ].join(" ");
}
