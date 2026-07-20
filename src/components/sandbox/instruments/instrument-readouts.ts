/**
 * Instrument-readout derivation (Range/Bearing A->B/CPA/TCPA) -- calls
 * `relativeBearing()`/`cpa()` directly against live vessel state, rather
 * than scanning `classification.trail[].facts` for these values. The
 * facts-trail approach is unreliable across code paths: the sticky-
 * overtaking (Rule 13(d)) trail entry has `facts: {}` (no bearing
 * recorded); a `cpa()` "no-closure" result never attaches `tcpaMinutes`/
 * `dcpaNm` to any trail entry at all; and "Range" (plain current distance)
 * is never computed by any domain function in the success path -- it
 * cannot be scanned for under any path. Calling the same geometry
 * functions `classifyEncounter()` itself calls guarantees the displayed
 * readouts always agree with the verdict shown, with zero new domain
 * surface.
 */

import { relativeBearing } from "../../../domain/geometry/relative-bearing.js";
import { cpa } from "../../../domain/geometry/cpa.js";
import type { Vessel } from "../../../domain/vessel/vessel.js";

export interface InstrumentReadouts {
  rangeNm: number;
  bearingAtoBDegrees: number | null; // null when vessels are coincident (relativeBearing() failure)
  cpaNm: number | null; // null when cpa() reports no-closure/invalid-input
  tcpaMinutes: number | null;
}

export function deriveInstrumentReadouts(vesselA: Vessel, vesselB: Vessel): InstrumentReadouts {
  // Range: plain Euclidean distance -- always computable (Math.hypot of a
  // zero vector is 0), unlike bearing/cpa which fail on coincident input.
  const rangeNm = Math.hypot(
    vesselB.position.x - vesselA.position.x,
    vesselB.position.y - vesselA.position.y,
  );

  const bearingResult = relativeBearing(vesselA, vesselB);
  const cpaResult = cpa(vesselA, vesselB);

  return {
    rangeNm,
    bearingAtoBDegrees: bearingResult.ok ? bearingResult.value : null,
    cpaNm: cpaResult.ok ? cpaResult.value.dcpaNm : null,
    tcpaMinutes: cpaResult.ok ? cpaResult.value.tcpaMinutes : null,
  };
}
