/**
 * Status-pill copy derivation, driven by `ClassificationResult.riskOfCollision`
 * (the authoritative Rule 7 domain signal) -- NOT the design mock's own
 * ad-hoc CPA-distance thresholds (cpa<0.3/1.0), which are prototype-only
 * heuristics with no backing in the rules engine and could contradict the
 * actual verdict (e.g. a close CPA the engine has already ruled clear).
 * The "opening" tone is a safe, additive exception: `tcpaMinutes <= 0`
 * (closest approach was in the past, D-06) is a supplementary geometric
 * fact, never a re-judgment of risk, so it can't conflict with
 * `riskOfCollision`.
 */

export type StatusPillTone = "clear" | "risk" | "opening";

export function statusPillCopy(
  riskOfCollision: boolean,
  cpaNm: number | null,
  tcpaMinutes: number | null,
): { text: string; tone: StatusPillTone } {
  const cpaText = cpaNm !== null ? `${cpaNm.toFixed(2)} NM` : "—";
  if (!riskOfCollision && tcpaMinutes !== null && tcpaMinutes <= 0) {
    return {
      text: `Vessels are opening — CPA already passed. No risk of collision developing on present courses.`,
      tone: "opening",
    };
  }
  return riskOfCollision
    ? { text: `Risk of collision — CPA ${cpaText} on present courses.`, tone: "risk" }
    : { text: `Passing clear — CPA ${cpaText} on present courses.`, tone: "clear" };
}
