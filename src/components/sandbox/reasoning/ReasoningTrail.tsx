/**
 * ReasoningTrail -- the numbered reasoning-trail card (SBOX-03): renders
 * `classification.trail`'s actual length every time (3-5 entries depending
 * on encounter type, never a hardcoded 3 steps), each step tagged/toned by
 * position (GEOMETRY / RULE N (or the doubt-substituted "Rule 7") /
 * VERDICT), plus the doubt caveat line. Receives `classification` only --
 * always renders the last-good trail regardless of any parent-level
 * degenerate flag (the degenerate note itself now lives in VerdictBanner).
 */

import type { CSSProperties } from "react";
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
      mt-auto flex flex-wrap gap-x-4 gap-y-0.5 font-mono text-sm
      text-muted-foreground
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

// The 4 radar-scope corner-tick brackets that frame each step card --
// extracted into one subcomponent per CLAUDE.md's "no duplicated JSX for
// near-identical instances" convention (the 4 spans differ only in which
// two edges their border sits on).
function CornerBrackets({ opacity }: { opacity: number }) {
  return (
    <>
      <span
        aria-hidden="true"
        className="
          absolute top-0 left-0 size-[11px] border-t-[1.5px] border-l-[1.5px]
        "
        style={{ borderColor: "var(--tone-color)", opacity }}
      />
      <span
        aria-hidden="true"
        className="
          absolute top-0 right-0 size-[11px] border-t-[1.5px] border-r-[1.5px]
        "
        style={{ borderColor: "var(--tone-color)", opacity }}
      />
      <span
        aria-hidden="true"
        className="
          absolute bottom-0 left-0 size-[11px] border-b-[1.5px] border-l-[1.5px]
        "
        style={{ borderColor: "var(--tone-color)", opacity }}
      />
      <span
        aria-hidden="true"
        className="
          absolute right-0 bottom-0 size-[11px] border-r-[1.5px]
          border-b-[1.5px]
        "
        style={{ borderColor: "var(--tone-color)", opacity }}
      />
    </>
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

const TONE_TAG_CLASSNAME: Record<TrailTone, string> = {
  geometry: "text-geometry bg-geometry/10",
  rule: "text-rule-accent bg-rule-accent/10",
  doubt: "text-doubt bg-doubt/10",
  "verdict-mutual": "text-mutual bg-mutual/10",
  "verdict-decisive": "text-give-way bg-give-way/10",
};

// Drives every card/connector/token's `--tone-color` custom property --
// the single source of truth `.trail-connector`/`.trail-connector-pulse`/
// `.trail-token`/`.trail-token-sweep-ring` (app/globals.css, plan 20-01)
// all read via `var(--tone-color)`.
const TONE_ACCENT_VAR: Record<TrailTone, string> = {
  geometry: "var(--geometry)",
  rule: "var(--rule-accent)",
  doubt: "var(--doubt)",
  "verdict-mutual": "var(--mutual)",
  "verdict-decisive": "var(--give-way)",
};

// The last (VERDICT) card's border/glow is the only per-card styling that
// varies by tone AND can't be expressed as a static Tailwind class (the
// `color-mix()` percentages are fixed, but the base color is one of only
// two verdict tones) -- kept as a lookup map, mirroring the
// TONE_TAG_CLASSNAME pattern above, rather than composing the strings
// inline at the call site.
const TONE_LAST_CARD_STYLE: Record<"verdict-mutual" | "verdict-decisive", CSSProperties> = {
  "verdict-mutual": {
    borderColor: "color-mix(in srgb, var(--mutual) 53%, transparent)",
    boxShadow:
      "0 0 0 1px color-mix(in srgb, var(--mutual) 19%, transparent), 0 14px 34px -14px color-mix(in srgb, var(--mutual) 41%, transparent)",
  },
  "verdict-decisive": {
    borderColor: "color-mix(in srgb, var(--give-way) 53%, transparent)",
    boxShadow:
      "0 0 0 1px color-mix(in srgb, var(--give-way) 19%, transparent), 0 14px 34px -14px color-mix(in srgb, var(--give-way) 41%, transparent)",
  },
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
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="
            radar-sweep-dot radar-sweep-dot--lg
          " />
          <span className="
            font-mono text-[11px] tracking-wide text-muted-foreground uppercase
          ">
            NAV DECISION CHAIN · radar acquisition
          </span>
        </div>
        <Badge variant="outline" className="
          font-mono text-[10px] font-normal text-muted-foreground
        ">
          {trail.length} contacts
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <ol className="
          flex flex-col items-stretch gap-0 p-0
          min-[900px]:flex-row
        ">
          {trail.flatMap((entry, index) => {
            const { tag, tone } = trailStepTag(
              entry,
              index,
              trail.length,
              classifyingIndex,
              classification,
            );
            const isLast = index === trail.length - 1;
            const toneColor = TONE_ACCENT_VAR[tone];

            const card = (
              <li
                key={`${entry.ruleId}-${index}-card`}
                data-role="trail-card"
                className={`
                  relative flex flex-none flex-col gap-2 rounded-[13px] border
                  px-[15px] pt-4 pb-[15px]
                  min-[900px]:flex-1
                  ${isLast ? "bg-[#101016]" : "border-border bg-chart-surface"}
                `}
                style={{
                  "--tone-color": toneColor,
                  ...(isLast
                    ? TONE_LAST_CARD_STYLE[tone as "verdict-mutual" | "verdict-decisive"]
                    : {}),
                } as CSSProperties}
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-0.5"
                  style={{ backgroundColor: "var(--tone-color)", opacity: isLast ? 0.9 : 0.55 }}
                />
                <CornerBrackets opacity={isLast ? 1 : 0.65} />
                <div className="mb-2 flex items-center gap-[9px]">
                  <div className="
                    relative flex size-[38px] shrink-0 items-center
                    justify-center
                  ">
                    <span
                      aria-hidden="true"
                      className="trail-token absolute inset-0"
                      style={{ "--tone-color": toneColor } as CSSProperties}
                    />
                    <span
                      aria-hidden="true"
                      className="trail-token-sweep-ring absolute inset-0"
                      style={{ "--tone-color": toneColor } as CSSProperties}
                    />
                    <span className="
                      relative font-mono text-[13px] font-semibold text-white
                    ">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="
                      font-mono text-[8.5px] font-semibold tracking-[0.08em]
                      text-muted-foreground uppercase
                    ">
                      {`Contact ${String(index + 1).padStart(2, "0")}`}
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

            if (isLast) return [card];

            const connector = (
              <li
                key={`${entry.ruleId}-${index}-wire`}
                aria-hidden="true"
                className="
                  relative flex w-full flex-[0_0_26px] items-center
                  min-[900px]:w-auto min-[900px]:flex-[0_0_34px]
                "
                style={{ "--tone-color": toneColor } as CSSProperties}
              >
                <div className="trail-connector w-full" />
                <div className="trail-connector-pulse" />
              </li>
            );

            return [card, connector];
          })}
        </ol>

        {doubt && doubtBoundary ? (
          <p className="text-sm text-doubt">{DOUBT_CAVEAT_TEXT[doubtBoundary]}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
