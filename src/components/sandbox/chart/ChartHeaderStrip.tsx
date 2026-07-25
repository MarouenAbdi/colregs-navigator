/**
 * ChartHeaderStrip -- merged rule-badge + title + 4-tier risk-pill header
 * strip for the on-chart command bar (SBOX-06). Mines
 * `VerdictBanner.tsx`'s `bannerRuleBadge`/`ENCOUNTER_TYPE_TITLE`/
 * `DEGENERATE_TITLE`/`bannerAccentClassName` logic verbatim -- that
 * component is retired next plan, so this file copies rather than imports
 * -- and adds a right-aligned risk pill driven by `deriveChartHeaderRisk()`
 * (D-02). A sub-region of one merged chart card (not a standalone card),
 * so this renders plain flex markup rather than the shadcn `Card`
 * primitives `VerdictBanner.tsx` used.
 */

import type { ChartHeaderStripProps } from "../types.js";
import { classifyingEntryIndex, ruleNumber } from "../reasoning/reasoning-trail-tag.js";
import {
  deriveChartHeaderRisk,
  CHART_HEADER_RISK_TONE_CLASSNAME,
  CHART_HEADER_RISK_DOT_CLASSNAME,
  type ChartHeaderRiskTier,
} from "./chart-header-risk.js";
import { deriveInstrumentReadouts } from "../instruments/instrument-readouts.js";
import type { ClassificationResult } from "../../../domain/colregs/types.js";

const ENCOUNTER_TYPE_TITLE: Record<string, string> = {
  "head-on": "Head-on",
  crossing: "Crossing",
  overtaking: "Overtaking",
};

const DEGENERATE_TITLE = "Unable to classify";

// Mirrors VerdictBanner.tsx's bannerRuleBadge (D-08): doubt always wins
// over whichever rule the classifying trail entry would otherwise cite.
function bannerRuleBadge(classification: ClassificationResult): string {
  if (classification.doubt) return "Rule 7";
  const classifyingEntry =
    classification.trail[classifyingEntryIndex(classification.trail.length)];
  return `Rule ${ruleNumber(classifyingEntry.ruleId)}`;
}

// Mirrors VerdictBanner.tsx's bannerAccentClassName: degenerate/doubt takes
// priority (amber), then a mutual encounter (slate), else the standard
// rule-accent teal.
function bannerAccentClassName(classification: ClassificationResult, isDegenerate: boolean): string {
  if (isDegenerate || classification.doubt) return "bg-doubt";
  if (classification.giveWay === null && classification.standOn === null) return "bg-mutual";
  return "bg-rule-accent";
}

export function ChartHeaderStrip({
  vesselA,
  vesselB,
  classification,
  isDegenerate,
}: ChartHeaderStripProps) {
  const accent = bannerAccentClassName(classification, isDegenerate);
  const { cpaNm, tcpaMinutes } = deriveInstrumentReadouts(vesselA, vesselB);
  // D-02: the degenerate/error state reuses the amber `watch` palette with
  // the existing "Unable to classify" framing, ignoring
  // deriveChartHeaderRisk()'s own output entirely while degenerate.
  const risk: { tier: ChartHeaderRiskTier; text: string } = isDegenerate
    ? { tier: "watch", text: "Unable to classify — vessels are coincident." }
    : deriveChartHeaderRisk(cpaNm, tcpaMinutes);

  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3">
      <div className="flex min-w-0 items-center gap-2">
        {!isDegenerate ? (
          <span
            className={`
              w-fit shrink-0 rounded-md px-2 py-0.5 font-mono text-[11px]
              font-semibold text-background
              ${accent}
            `}
          >
            {bannerRuleBadge(classification)}
          </span>
        ) : null}
        <h3
          className="truncate text-lg font-bold text-foreground"
        >
          {isDegenerate ? DEGENERATE_TITLE : ENCOUNTER_TYPE_TITLE[classification.encounterType]}
        </h3>
      </div>

      <div className="flex-1" />

      <div
        className={`
          flex max-w-[46%] items-center gap-[7px] rounded-md border px-[11px]
          py-[6px] text-[12.5px]
          ${CHART_HEADER_RISK_TONE_CLASSNAME[risk.tier]}
        `}
      >
        <span
          aria-hidden="true"
          className={`
            size-2 shrink-0 rounded-full
            ${CHART_HEADER_RISK_DOT_CLASSNAME[risk.tier]}
          `}
        />
        <span className="truncate">{risk.text}</span>
      </div>
    </div>
  );
}
