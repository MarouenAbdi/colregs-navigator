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

// Single-sourced role -> style maps (ARCHITECTURE.md's consolidation note):
// ChartPanel.tsx (HULL_FILL_CLASS/ROLE_BADGE_TEXT) and ReasoningPanel.tsx
// (ROLE_BADGE/VESSEL_LABEL_TEXT) each independently duplicated these same
// three concepts -- a fix applied to one file's map but not the other
// would have been invisible until someone happened to exercise the
// un-fixed path (the exact class of bug CLAUDE.md's "No duplicated JSX"
// convention warns about, extended here to style maps). References the
// give-way/stand-on/mutual semantic tokens registered in app/globals.css,
// not Tailwind's default red-500/green-500/slate-400 palette.
export const ROLE_HULL_FILL_CLASS: Record<VesselRole, string> = {
  "give-way": "fill-give-way",
  "stand-on": "fill-stand-on",
  mutual: "fill-mutual",
};

// Mirrors ROLE_HULL_FILL_CLASS's pattern for the one new consumer
// (Gallery's mini-chart dashed heading-vector lines) needing a stroke
// instead of a fill.
export const ROLE_STROKE_CLASS: Record<VesselRole, string> = {
  "give-way": "stroke-give-way",
  "stand-on": "stroke-stand-on",
  mutual: "stroke-mutual",
};

export const ROLE_BADGE_TEXT: Record<VesselRole, string> = {
  "give-way": "GW",
  "stand-on": "SO",
  mutual: "MUTUAL",
};

// 10%/35% opacity convention established by Phase 7's rule-banner
// precedent (bg-primary/10, border-primary/30) -- reused here, not
// reinvented, per 08-UI-SPEC.md's Color section measurement of the design
// mock's own badge tints.
export const ROLE_BADGE_CLASSNAME: Record<VesselRole, string> = {
  "give-way": "bg-give-way/10 border-give-way/35 text-give-way",
  "stand-on": "bg-stand-on/10 border-stand-on/35 text-stand-on",
  mutual: "bg-mutual/10 border-mutual/35 text-mutual",
};
