/**
 * Pure, framework-free geometry for the Hero preview card's illustrative
 * SVG chart. Every constant here is derived from the design source
 * ("COLREGS Navigator (shadcn).dc.html", claude.ai/design project
 * c265c047) to reproduce its exact layout, not eyeballed from the PNG --
 * see each constant's comment for the derivation.
 */
import type { ChartViewBox, ContainerSize } from "../../domain/geometry/screen-convert/screen-convert.js";

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
// Kept in place (not removed) until plan 20-04's Task 1 migrates
// HeroPreviewCard.tsx's remaining 4 call sites off these two constants --
// removing them here would leave the repo non-compiling between plans.
export const HERO_OUTER_RING_RADIUS_PX = HERO_CONTAINER_SIZE.width * (115 / 480);
export const HERO_INNER_RING_RADIUS_PX = HERO_CONTAINER_SIZE.width * (60 / 480);

// The design's updated bezel replaces the 2-ring layout above with 3 range
// rings at r=42/84/126 on its 480-wide canvas -- reproduced as the same
// fraction of this card's width (28px/56px/84px at this codebase's 320px).
export const HERO_RANGE_RING_RADII_PX: readonly [number, number, number] = [
  HERO_CONTAINER_SIZE.width * (42 / 480),
  HERO_CONTAINER_SIZE.width * (84 / 480),
  HERO_CONTAINER_SIZE.width * (126 / 480),
];

// The design's compass bezel ring sits at r=132 on its 480-wide canvas --
// deliberately just outside the outermost range ring (84px) so the two
// don't visually collide.
export const HERO_COMPASS_RING_RADIUS_PX = HERO_CONTAINER_SIZE.width * (132 / 480);

// Ratio between this card's compass radius and the design's own 480-canvas
// compass radius -- used below to proportionally scale the design's literal
// stroke-width/dasharray numbers so tick density is preserved at any card size.
const HERO_COMPASS_SCALE = HERO_COMPASS_RING_RADIUS_PX / 132;

// Design's minor-tick ring: stroke-width 5, dasharray "1.5 9.42" on its 480-canvas.
export const HERO_COMPASS_MINOR_STROKE_WIDTH_PX = 5 * HERO_COMPASS_SCALE;
export const HERO_COMPASS_MINOR_DASHARRAY = `${1.5 * HERO_COMPASS_SCALE} ${9.42 * HERO_COMPASS_SCALE}`;

// Design's major/cardinal-tick ring: stroke-width 9, dasharray "3 66.13".
export const HERO_COMPASS_MAJOR_STROKE_WIDTH_PX = 9 * HERO_COMPASS_SCALE;
export const HERO_COMPASS_MAJOR_DASHARRAY = `${3 * HERO_COMPASS_SCALE} ${66.13 * HERO_COMPASS_SCALE}`;

// Small ringed dot at dead-center, decorative, not a vessel -- a fixed
// literal since the design snapshot doesn't specify a scalable ratio for it.
export const HERO_CENTER_HUB_RADIUS_PX = 3;

// N/S/E/W labels sit at the bezel edge -- i.e. the compass ring's own
// radius, no additional offset.
export const HERO_CARDINAL_LABEL_OFFSET_PX = HERO_COMPASS_RING_RADIUS_PX;

// Design's 3 stacked range labels, verbatim copy -- fixed display strings,
// not derived from HERO_RANGE_RING_RADII_PX's actual NM-per-pixel scale,
// matching the design source exactly per this phase's "reproduce literal
// values" convention.
export const HERO_RANGE_LABEL_TEXT: readonly string[] = ["0.5 NM", "1.0 NM", "1.5 NM"];

// Domain-locked colors (per the design's fixed color table): the fixture's verdict is
// fixed at authoring time, so hull/pill *colors* may stay hardcoded, but
// "GW"/"SO" *text* must still be derived from the classification result.
export const VESSEL_A_HULL_COLOR = "#EF4444"; // red-500, give-way
export const VESSEL_B_HULL_COLOR = "#22C55E"; // green-500, stand-on
export const CONNECTOR_STROKE = "#475569"; // slate-600

// Bearing sector wedge: apex at the fixed chart-canvas center, one edge
// running due north, the other along the real bearing to vesselB.
export function bearingSectorPath(bearingDegrees: number): string {
  const northEdge = { x: HERO_CHART_CENTER.screenX, y: HERO_CHART_CENTER.screenY - HERO_RANGE_RING_RADII_PX[2] };
  const bearingEdge = {
    x: HERO_CHART_CENTER.screenX + HERO_RANGE_RING_RADII_PX[2] * Math.sin((bearingDegrees * Math.PI) / 180),
    y: HERO_CHART_CENTER.screenY - HERO_RANGE_RING_RADII_PX[2] * Math.cos((bearingDegrees * Math.PI) / 180),
  };
  // Sweep is clockwise from north (0deg) to bearingDegrees, so the swept
  // angle is bearingDegrees itself (assumed normalized to [0, 360)) --
  // matching ChartPanel.tsx's wedgePath(), which computes the same flag
  // from its own start/end bearing difference rather than hardcoding it.
  const largeArcFlag = bearingDegrees > 180 ? 1 : 0;
  return [
    `M ${HERO_CHART_CENTER.screenX} ${HERO_CHART_CENTER.screenY}`,
    `L ${northEdge.x} ${northEdge.y}`,
    `A ${HERO_RANGE_RING_RADII_PX[2]} ${HERO_RANGE_RING_RADII_PX[2]} 0 ${largeArcFlag} 1 ${bearingEdge.x} ${bearingEdge.y}`,
    "Z",
  ].join(" ");
}
