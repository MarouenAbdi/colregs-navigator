/**
 * Domain type contracts for this project's COLREGS rules engine (D-11-D-16).
 *
 * Plain TypeScript type/interface declarations only — no Zod. These types
 * describe pure internal domain output (the result of classifying an
 * encounter), not an external input boundary, so no runtime schema
 * validation belongs here (per this project's Standard Stack decision to
 * keep domain output types free of Zod runtime validation).
 * `classify-encounter.ts` imports all six of these directly.
 */

/**
 * The three COLREGS steering/sailing encounter shapes this project covers
 * (Rules 12-15). Deliberately three values, not four (D-11): a case that
 * falls inside a doubt band (see `DoubtBoundary` below) still resolves to
 * one definite `EncounterType` — Rule 14's own text ("when in doubt, assume
 * it exists") locks a value rather than introducing a 4th ambiguous state.
 */
export type EncounterType = "head-on" | "crossing" | "overtaking";

/**
 * Identifies which of the two function-argument-position vessels
 * (`vesselA`/`vesselB`, in call order) a give-way/stand-on verdict refers
 * to. Kept as a label rather than echoing back the `Vessel` object itself
 * — the caller already holds both vessels and only needs to know which one
 * the verdict applies to.
 */
export type VesselLabel = "vesselA" | "vesselB";

/**
 * Identifies which specific sector boundary a doubt flag was triggered by
 * (D-12) — richer than a single generic "doubt" boolean, since the Sandbox
 * UI needs to know which boundary to render a caveat against.
 */
export type DoubtBoundary =
  | "near-overtaking-crossing-boundary" // D-09: 112.5 deg +/- 5 deg
  | "near-head-on-boundary"; // D-10: 0 deg +/- 5 deg (same DOUBT_BAND_DEGREES width)

/**
 * One step of the ordered reasoning trail (D-13-D-16). Self-contained: the
 * rule citation, plain-language explanation, AND the raw geometric facts
 * that were matched/ruled-out are bundled together, so the Sandbox chart
 * can render the citation and overlay exact geometry without recomputing
 * anything.
 */
export interface ReasoningTrailEntry {
  ruleId: string;
  text: string;
  facts: Record<string, number | string | boolean>;
}

/**
 * Shared give-way/stand-on shape used internally by each dispatch stage's
 * helper functions (Rule 13/14/15 baseline, Rule 18 override) before being
 * folded into the final `ClassificationResult`.
 */
export interface GiveWayResult {
  giveWay: VesselLabel | null;
  standOn: VesselLabel | null;
}

/**
 * The full output of `classifyEncounter()`.
 *
 * `giveWay`/`standOn` nullable design: Rule 14 head-on situations have no
 * distinct give-way vessel when both vessels share the same Rule 18
 * priority tier — COLREGS requires BOTH vessels to alter course to
 * starboard (mutual obligation). `null`/`null` represents this genuine
 * mutual-obligation case, not a missing/error value. When Rule 18's
 * vessel-type hierarchy applies to a head-on encounter between vessels of
 * *different* priority tiers, `giveWay`/`standOn` ARE populated (via
 * `classifyEncounter()`'s own Stage 6 Rule-18 override). For
 * `'crossing'`/`'overtaking'` encounters, `giveWay`/`standOn` are always
 * non-null.
 */
export interface ClassificationResult {
  encounterType: EncounterType;
  riskOfCollision: boolean;
  giveWay: VesselLabel | null;
  standOn: VesselLabel | null;
  doubt: boolean;
  doubtBoundary?: DoubtBoundary;
  trail: ReasoningTrailEntry[];
}
