/**
 * ReasoningTrail -- the numbered reasoning-trail card (SBOX-03): renders
 * `classification.trail`'s actual length every time (3-5 entries depending
 * on encounter type, never a hardcoded 3 steps), each step tagged/toned by
 * position (GEOMETRY / RULE N (or the doubt-substituted "Rule 7") /
 * VERDICT), plus the doubt caveat line. Receives `classification` only --
 * always renders the last-good trail regardless of any parent-level
 * degenerate flag (the degenerate note itself now lives in VerdictBanner).
 */

import type { ReasoningTrailProps } from "../types.js";
import { classifyingEntryIndex, ruleNumber } from "./reasoning-trail-tag.js";
import type { ClassificationResult, ReasoningTrailEntry } from "../../../domain/colregs/types.js";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// The only seven fact keys `classifyEncounter()` ever produces -- moved
// verbatim from the former single combined reasoning aside (single
// remaining consumer after the 3-card split).
const FACT_LABEL: Record<string, string> = {
  riskOfCollision: "Risk of collision",
  tcpaMinutes: "TCPA",
  dcpaNm: "DCPA",
  relativeBearingAtoB: "Rel. bearing A→B",
  relativeBearingBtoA: "Rel. bearing B→A",
  vesselAType: "Vessel A type",
  vesselBType: "Vessel B type",
};

function formatFactValue(key: string, value: number | string | boolean): string {
  switch (key) {
    case "riskOfCollision":
      return value ? "Yes" : "No";
    case "tcpaMinutes":
      return `${(value as number).toFixed(1)} min`;
    case "dcpaNm":
      return `${(value as number).toFixed(2)} nm`;
    case "relativeBearingAtoB":
    case "relativeBearingBtoA":
      return `${(value as number).toFixed(1)}°`;
    case "vesselAType":
    case "vesselBType":
      return String(value);
    default:
      return String(value);
  }
}

function FactReadout({ facts }: { facts: ReasoningTrailEntry["facts"] }) {
  const entries = Object.entries(facts);
  if (entries.length === 0) return null;
  return (
    <dl className="
      flex flex-wrap gap-x-4 gap-y-0.5 font-mono text-sm text-muted-foreground
    ">
      {entries.map(([key, value]) => (
        <div key={key} className="flex gap-1">
          <dt>{FACT_LABEL[key] ?? key}:</dt>
          <dd>{formatFactValue(key, value)}</dd>
        </div>
      ))}
    </dl>
  );
}

const DOUBT_CAVEAT_TEXT: Record<string, string> = {
  "near-overtaking-crossing-boundary":
    "Near the overtaking/crossing boundary (112.5° abaft the beam) — this verdict may flip with a small heading change.",
  "near-head-on-boundary":
    "Near the head-on boundary (reciprocal heading) — this verdict may flip with a small heading change.",
};

// "doubt" is its own tone (amber, matching VerdictBanner's doubt accent) --
// the classifying step's tag substitutes to "Rule 7" but must not read as
// a normal teal rule citation, since it's flagging ambiguity, not a rule.
// "verdict" itself isn't a single fixed color: a mutual (head-on) verdict
// reuses the slate mutual tone rather than give-way red, mirroring
// VerdictBanner's own accent derivation (bannerAccentClassName) instead of
// hard-coding red for every verdict step.
type TrailTone = "geometry" | "rule" | "doubt" | "verdict-mutual" | "verdict-decisive";

const TONE_NUMBER_CLASSNAME: Record<TrailTone, string> = {
  geometry: "bg-geometry",
  rule: "bg-rule-accent",
  doubt: "bg-doubt",
  "verdict-mutual": "bg-mutual",
  "verdict-decisive": "bg-give-way",
};

const TONE_TAG_CLASSNAME: Record<TrailTone, string> = {
  geometry: "text-geometry bg-geometry/10",
  rule: "text-rule-accent bg-rule-accent/10",
  doubt: "text-doubt bg-doubt/10",
  "verdict-mutual": "text-mutual bg-mutual/10",
  "verdict-decisive": "text-give-way bg-give-way/10",
};

function trailStepTag(
  entry: ReasoningTrailEntry,
  index: number,
  trailLength: number,
  classifyingIndex: number,
  classification: ClassificationResult,
): { tag: string; tone: TrailTone } {
  if (index === 0) return { tag: "GEOMETRY", tone: "geometry" };
  if (index === trailLength - 1) {
    const isMutual = classification.giveWay === null && classification.standOn === null;
    return { tag: "VERDICT", tone: isMutual ? "verdict-mutual" : "verdict-decisive" };
  }
  if (index === classifyingIndex && classification.doubt) return { tag: "Rule 7", tone: "doubt" };
  return { tag: `RULE ${ruleNumber(entry.ruleId)}`, tone: "rule" };
}

export function ReasoningTrail({ classification }: ReasoningTrailProps) {
  const { trail, doubt, doubtBoundary } = classification;
  const classifyingIndex = classifyingEntryIndex(trail.length);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <span className="
          font-mono text-[11px] tracking-wide text-muted-foreground uppercase
        ">
          Reasoning Trail
        </span>
        <Badge variant="outline" className="
          font-mono text-[10px] font-normal text-muted-foreground
        ">
          {trail.length} steps
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <ol className="flex flex-row flex-wrap gap-3 p-0">
          {trail.map((entry, index) => {
            const { tag, tone } = trailStepTag(
              entry,
              index,
              trail.length,
              classifyingIndex,
              classification,
            );
            return (
              <li
                key={`${entry.ruleId}-${index}`}
                className="
                  min-w-55 flex-1 basis-55 rounded-[10px] border border-border
                  bg-chart-surface px-[13px] py-3
                "
              >
                <div className="mb-2 flex items-center gap-[9px]">
                  <span
                    className={`
                      flex size-[22px] shrink-0 items-center justify-center
                      rounded-full font-mono text-[11px] font-semibold
                      text-white
                      ${TONE_NUMBER_CLASSNAME[tone]}
                    `}
                  >
                    {index + 1}
                  </span>
                  <span
                    className={`
                      w-fit rounded-md px-[7px] py-0.5 font-mono text-[9.5px]
                      font-semibold tracking-[0.04em]
                      ${TONE_TAG_CLASSNAME[tone]}
                    `}
                  >
                    {tag}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="
                    shrink-0 text-sm font-semibold whitespace-nowrap
                    text-foreground
                  ">
                    {entry.ruleId}
                  </span>
                  <span className="min-w-0 text-sm text-muted-foreground">{entry.text}</span>
                </div>
                <FactReadout facts={entry.facts} />
              </li>
            );
          })}
        </ol>

        {doubt && doubtBoundary ? (
          <p className="text-sm text-doubt">{DOUBT_CAVEAT_TEXT[doubtBoundary]}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
