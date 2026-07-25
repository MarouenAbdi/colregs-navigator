/**
 * Chart-header risk-pill derivation. This is a **deliberate, explicit
 * divergence** from `status-pill.ts`'s own documented rationale (D-02):
 * where `status-pill.ts` is driven by the authoritative Rule 7 domain risk
 * signal on `ClassificationResult`, this module is driven purely by
 * CPA-distance thresholds (cpa<0.3/1.0), matching the design mock's own
 * `riskMap` verbatim. This divergence is scoped explicitly to this one
 * on-chart header pill and never feeds back into that domain risk signal
 * or any `src/domain/` logic -- see 18-DESIGN-SNAPSHOT.md's "Risk pill
 * 4-tier derivation" section for the source this ports.
 */

export type ChartHeaderRiskTier = "none" | "ok" | "watch" | "high";

export function deriveChartHeaderRisk(
  cpaNm: number | null,
  tcpaMinutes: number | null,
): { tier: ChartHeaderRiskTier; text: string } {
  if (cpaNm === null) {
    return {
      tier: "none",
      text: "No defined closest point of approach — courses do not converge.",
    };
  }

  if (tcpaMinutes !== null && tcpaMinutes <= 0) {
    return {
      tier: "none",
      text: "Vessels are opening — CPA already passed. No risk of collision developing on present courses.",
    };
  }

  if (cpaNm < 0.3) {
    return {
      tier: "high",
      text: `Risk of collision exists — CPA ${cpaNm.toFixed(2)} NM. A substantial, early, readily-apparent action is required.`,
    };
  }

  if (cpaNm < 1.0) {
    return {
      tier: "watch",
      text: `Close-quarters developing — CPA ${cpaNm.toFixed(2)} NM. Monitor the compass bearing for appreciable change.`,
    };
  }

  return {
    tier: "ok",
    text: `Passing clear — CPA ${cpaNm.toFixed(2)} NM on present courses.`,
  };
}

export const CHART_HEADER_RISK_TONE_CLASSNAME: Record<ChartHeaderRiskTier, string> = {
  none: "text-muted-foreground bg-muted-foreground/10 border-muted-foreground/35",
  ok: "text-green-400 bg-green-400/10 border-green-400/35",
  watch: "text-doubt bg-doubt/10 border-doubt/35",
  high: "text-red-400 bg-red-400/10 border-red-400/35",
};

export const CHART_HEADER_RISK_DOT_CLASSNAME: Record<ChartHeaderRiskTier, string> = {
  none: "bg-muted-foreground",
  ok: "bg-green-400",
  watch: "bg-doubt",
  high: "bg-red-400",
};
