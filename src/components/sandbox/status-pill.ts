/**
 * Status-pill copy derivation, driven by `ClassificationResult.riskOfCollision`.
 * The "clear" copy is transcribed verbatim from the design mock; the "risk"
 * copy is original (not shown in the mock), mirroring the clear tone's
 * exact sentence structure/length so the pill never visibly reflows
 * between the two states.
 */

export function statusPillCopy(
  riskOfCollision: boolean,
  cpaNm: number | null,
): { text: string; tone: "clear" | "risk" } {
  const cpaText = cpaNm !== null ? `${cpaNm.toFixed(2)} NM` : "—";
  return riskOfCollision
    ? { text: `Risk of collision — CPA ${cpaText} on present courses.`, tone: "risk" }
    : { text: `Passing clear — CPA ${cpaText} on present courses.`, tone: "clear" };
}
