/**
 * Shared give-way/stand-on/mutual role derivation (04-01). Reused by
 * ChartPanel (hull color coding, D-02) and ReasoningPanel (role badges) so
 * both components agree on the same role for a given vessel/classification
 * pair rather than each re-deriving it independently.
 */

import type { ClassificationResult, VesselLabel } from "../../domain/colregs/types.js";

export type VesselRole = "give-way" | "stand-on" | "mutual";

export function getVesselRole(vessel: VesselLabel, classification: ClassificationResult): VesselRole {
  if (classification.giveWay === null && classification.standOn === null) return "mutual";
  if (classification.giveWay === vessel) return "give-way";
  return "stand-on"; // classification.standOn === vessel per types.ts's non-null contract for crossing/overtaking
}
