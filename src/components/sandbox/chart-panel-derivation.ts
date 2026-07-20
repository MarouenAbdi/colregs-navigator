/**
 * Per-render chart-overlay derivation for ChartPanel: screen positions,
 * role, bearing/cone styling, range, and doubt-vessel resolution, all
 * recomputed from `vesselA`/`vesselB`/`classification` on every call rather
 * than buried inline in the component body. Mirrors instrument-readouts.ts's
 * shape (doc comment, named domain imports, one exported interface + one
 * exported derive function) -- both are pure, zero-React derivations over
 * the same classified-vessel-pair inputs.
 */

import { chartToScreen, type ChartViewBox, type ContainerSize } from "../../domain/geometry/screen-convert.js";
import { getVesselRole, type VesselRole } from "./vessel-role.js";
import { resolveDoubtGeometry } from "../../domain/colregs/resolve-doubt-geometry.js";
import {
  BEARING_LINE_DEFAULT_STROKE,
  CONE_END_RELATIVE_BEARING_DEGREES,
  CONE_RADIUS_PX,
  CONE_START_RELATIVE_BEARING_DEGREES,
  DOUBT_STROKE,
  RANGE_RING_INNER_RADIUS_RATIO,
  RANGE_RING_OUTER_RADIUS_RATIO,
  wedgePath,
} from "./chart-panel-geometry.js";
import { deriveInstrumentReadouts } from "./instrument-readouts.js";
import type { Vessel } from "../../domain/vessel/vessel.js";
import type { ClassificationResult, VesselLabel } from "../../domain/colregs/types.js";

export interface ChartOverlayState {
  screenA: { screenX: number; screenY: number };
  screenB: { screenX: number; screenY: number };
  chartCenter: { screenX: number; screenY: number };
  innerRingRadiusPx: number;
  outerRingRadiusPx: number;
  roleA: VesselRole;
  roleB: VesselRole;
  bearingStroke: string;
  bearingDashArray: string | undefined;
  rangeNm: number;
  bearingMidpoint: { screenX: number; screenY: number };
  doubtVessel: VesselLabel | null;
  conePathA: string;
  conePathB: string;
}

export function deriveChartOverlayState(
  vesselA: Vessel,
  vesselB: Vessel,
  classification: ClassificationResult,
  containerSize: ContainerSize,
  viewBox: ChartViewBox,
): ChartOverlayState {
  const screenA = chartToScreen(vesselA.position, containerSize, viewBox);
  const screenB = chartToScreen(vesselB.position, containerSize, viewBox);
  const chartCenter = chartToScreen({ x: 0, y: 0 }, containerSize, viewBox);
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
  // chip; ChartPanel's live version was missing it entirely). Single-
  // sourced from deriveInstrumentReadouts() rather than a second
  // independently-computed Euclidean distance, same duplication-avoidance
  // precedent as vessel-role.ts's role/style maps (D-01).
  const { rangeNm } = deriveInstrumentReadouts(vesselA, vesselB);
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

  return {
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
  };
}
