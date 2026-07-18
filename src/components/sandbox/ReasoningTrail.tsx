/**
 * ReasoningTrail -- the numbered reasoning-trail card (SBOX-03): renders
 * `classification.trail`'s actual length every time (3-5 entries depending
 * on encounter type, never a hardcoded 3 steps), each step tagged/toned by
 * position (GEOMETRY / RULE N (or the doubt-substituted "Rule 7") /
 * VERDICT), plus the doubt caveat line. Receives `classification` only --
 * always renders the last-good trail regardless of any parent-level
 * degenerate flag (the degenerate note itself now lives in VerdictBanner).
 */

import type { ReasoningTrailProps } from "./types.js";
import { classifyingEntryIndex, ruleNumber } from "./reasoning-trail-tag.js";
import type { ReasoningTrailEntry } from "../../domain/colregs/types.js";
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
    <dl className="flex flex-wrap gap-x-4 gap-y-0.5 font-mono text-sm text-muted-foreground">
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

type TrailTone = "geometry" | "rule" | "verdict";

const TONE_NUMBER_CLASSNAME: Record<TrailTone, string> = {
  geometry: "bg-geometry",
  rule: "bg-rule-accent",
  verdict: "bg-give-way",
};

const TONE_TAG_CLASSNAME: Record<TrailTone, string> = {
  geometry: "text-geometry",
  rule: "text-rule-accent",
  verdict: "text-give-way",
};

function trailStepTag(
  entry: ReasoningTrailEntry,
  index: number,
  trailLength: number,
  classifyingIndex: number,
  doubt: boolean,
): { tag: string; tone: TrailTone } {
  if (index === 0) return { tag: "GEOMETRY", tone: "geometry" };
  if (index === trailLength - 1) return { tag: "VERDICT", tone: "verdict" };
  if (index === classifyingIndex && doubt) return { tag: "Rule 7", tone: "rule" };
  return { tag: `RULE ${ruleNumber(entry.ruleId)}`, tone: "rule" };
}

export function ReasoningTrail({ classification }: ReasoningTrailProps) {
  const { trail, doubt, doubtBoundary } = classification;
  const classifyingIndex = classifyingEntryIndex(trail.length);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <span className="text-[13px] font-semibold uppercase tracking-wide text-foreground">
          Reasoning Trail
        </span>
        <Badge variant="outline" className="text-[13px] font-semibold text-muted-foreground">
          {trail.length} steps
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <ol className="flex flex-col gap-3">
          {trail.map((entry, index) => {
            const { tag, tone } = trailStepTag(
              entry,
              index,
              trail.length,
              classifyingIndex,
              doubt,
            );
            const isLast = index === trail.length - 1;
            return (
              <li
                key={`${entry.ruleId}-${index}`}
                className={`flex gap-3 ${isLast ? "" : "border-l border-border pb-1 pl-0"}`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[13px] font-semibold text-white ${TONE_NUMBER_CLASSNAME[tone]}`}
                >
                  {index + 1}
                </span>
                <div className="flex flex-col gap-0.5">
                  <span
                    className={`font-mono text-[13px] font-semibold uppercase tracking-wide ${TONE_TAG_CLASSNAME[tone]}`}
                  >
                    {tag}
                  </span>
                  <div className="flex gap-2 items-baseline">
                    <span className="text-sm font-semibold text-foreground">{entry.ruleId}</span>
                    <span className="text-base font-semibold text-foreground">{entry.text}</span>
                  </div>
                  <FactReadout facts={entry.facts} />
                </div>
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
