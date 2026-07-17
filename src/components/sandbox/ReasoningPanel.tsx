/**
 * ReasoningPanel (04-05) -- the persistent, always-visible, full reasoning-
 * trail side panel (D-03). Renders the verdict banner, the vessel role
 * badges, the ordered `classification.trail` (rule citation + prose +
 * geometric facts, RSON-01), and the doubt caveat line (D-04) / degenerate
 * "Unable to classify" inline note.
 *
 * Presentational only -- consumes exactly `ReasoningPanelProps` (04-01) and
 * introduces no new rule-explanation copy beyond the banner template, the
 * fact-readout labels, and the two doubt-caveat strings (all verbatim from
 * 04-UI-SPEC.md's Copywriting Contract).
 */

import type { ReasoningPanelProps } from "./types.js";
import { getVesselRole } from "./vessel-role.js";
import type { ReasoningTrailEntry } from "../../domain/colregs/types.js";

const ENCOUNTER_TYPE_TITLE: Record<string, string> = {
  "head-on": "Head-on",
  crossing: "Crossing",
  overtaking: "Overtaking",
};

const VESSEL_LABEL_TEXT: Record<string, string> = {
  vesselA: "Vessel A",
  vesselB: "Vessel B",
};

const ROLE_BADGE: Record<"give-way" | "stand-on" | "mutual", { text: string; className: string }> = {
  "give-way": { text: "GW", className: "text-red-500" },
  "stand-on": { text: "SO", className: "text-green-500" },
  mutual: { text: "MUTUAL", className: "text-slate-400" },
};

// The only seven fact keys `classify-encounter.ts` ever produces (per this
// plan's <interfaces> block) -- label/format mapping, keyed by fact key.
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
    <dl className="flex flex-wrap gap-x-4 gap-y-0.5 font-mono text-sm text-slate-600">
      {entries.map(([key, value]) => (
        <div key={key} className="flex gap-1">
          <dt>{FACT_LABEL[key] ?? key}:</dt>
          <dd>{formatFactValue(key, value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function verdictBannerText(classification: ReasoningPanelProps["classification"]): string {
  const encounterTitle = ENCOUNTER_TYPE_TITLE[classification.encounterType];
  const verdictClause =
    classification.giveWay === null && classification.standOn === null
      ? "mutual obligation"
      : `${VESSEL_LABEL_TEXT[classification.giveWay as string]} gives way`;
  return `${encounterTitle} — ${verdictClause}`;
}

const DOUBT_CAVEAT_TEXT: Record<string, string> = {
  "near-overtaking-crossing-boundary":
    "Near the overtaking/crossing boundary (112.5° abaft the beam) — this verdict may flip with a small heading change.",
  "near-head-on-boundary":
    "Near the head-on boundary (reciprocal heading) — this verdict may flip with a small heading change.",
};

export function ReasoningPanel({ classification, isDegenerate }: ReasoningPanelProps) {
  const vesselARole = getVesselRole("vesselA", classification);
  const vesselBRole = getVesselRole("vesselB", classification);

  return (
    <aside className="p-6 flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Reasoning Trail</h2>

      {isDegenerate ? (
        <div className="flex flex-col gap-1">
          <p className="text-[28px] font-semibold">Unable to classify</p>
          <p className="text-base font-normal">
            Vessel A and Vessel B are at the same position — drag one apart to resume live
            classification.
          </p>
        </div>
      ) : (
        <p className="text-[28px] font-semibold">{verdictBannerText(classification)}</p>
      )}

      <div className="flex gap-2">
        <span
          aria-label="Vessel A role"
          className={`text-sm font-semibold ${ROLE_BADGE[vesselARole].className}`}
        >
          {ROLE_BADGE[vesselARole].text}
        </span>
        <span
          aria-label="Vessel B role"
          className={`text-sm font-semibold ${ROLE_BADGE[vesselBRole].className}`}
        >
          {ROLE_BADGE[vesselBRole].text}
        </span>
      </div>

      <ol className="flex flex-col gap-2">
        {classification.trail.map((entry, index) => (
          <li key={`${entry.ruleId}-${index}`} className="flex flex-col gap-0.5">
            <div className="flex gap-2 items-baseline">
              <span className="text-sm font-semibold">{entry.ruleId}</span>
              <span className="text-base font-normal">{entry.text}</span>
            </div>
            <FactReadout facts={entry.facts} />
          </li>
        ))}
      </ol>

      {classification.doubt && classification.doubtBoundary ? (
        <p className="text-sm text-amber-600">{DOUBT_CAVEAT_TEXT[classification.doubtBoundary]}</p>
      ) : null}
    </aside>
  );
}
