/**
 * Hero-local risk-pill derivation. A **deliberate copy** of the Sandbox
 * chart header strip's companion risk-threshold module's exact CPA-threshold
 * branching and Tailwind class-name maps (D-03: copy, don't import) --
 * Hero's card shares zero code with the Sandbox chart module tree
 * (07-CONTEXT.md D-03, still binding), so this file reproduces that logic
 * independently rather than importing it, even though the two are
 * functionally identical today.
 */

export type HeroPreviewRiskTier = "none" | "ok" | "watch" | "high";

export function deriveHeroPreviewRisk(
  cpaNm: number | null,
  tcpaMinutes: number | null,
): { tier: HeroPreviewRiskTier; text: string } {
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

export const HERO_PREVIEW_RISK_TONE_CLASSNAME: Record<HeroPreviewRiskTier, string> = {
  none: "text-muted-foreground bg-muted-foreground/10 border-muted-foreground/35",
  ok: "text-green-400 bg-green-400/10 border-green-400/35",
  watch: "text-doubt bg-doubt/10 border-doubt/35",
  high: "text-red-400 bg-red-400/10 border-red-400/35",
};

export const HERO_PREVIEW_RISK_DOT_CLASSNAME: Record<HeroPreviewRiskTier, string> = {
  none: "bg-muted-foreground",
  ok: "bg-green-400",
  watch: "bg-doubt",
  high: "bg-red-400",
};
