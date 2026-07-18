/**
 * VerdictBanner -- the full-width verdict card (SBOX-02): rule badge,
 * standalone title, one-line plain-English description, and per-vessel
 * role badges. Split out of the former single combined reasoning aside so
 * the design's exact card boundary can be expressed directly (08-UI-SPEC.md
 * Layout: "verdict banner ... is not nested inside the reasoning column").
 */

import type { VerdictBannerProps } from "./types.js";
import { getVesselRole, ROLE_BADGE_CLASSNAME, type VesselRole } from "./vessel-role.js";
import { classifyingEntryIndex, ruleNumber } from "./reasoning-trail-tag.js";
import type { ClassificationResult, VesselLabel } from "../../domain/colregs/types.js";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ENCOUNTER_TYPE_TITLE: Record<string, string> = {
  "head-on": "Head-on",
  crossing: "Crossing",
  overtaking: "Overtaking",
};

// Single remaining consumer of this label map after the 3-card split --
// the verdict banner's own 2-line role-badge stack.
const VESSEL_LABEL_TEXT: Record<VesselLabel, string> = {
  vesselA: "Vessel A",
  vesselB: "Vessel B",
};

// Full-word status text is unique to this card's larger role box (per the
// design reference) -- ChartPanel's hull label and ControlPanel's compact
// header pill both need the short "GW"/"SO"/ROLE_BADGE_TEXT abbreviation
// instead, so this is intentionally a local map, not folded into the
// shared vessel-role.ts maps.
const ROLE_STATUS_TEXT: Record<VesselRole, string> = {
  "give-way": "GIVE WAY",
  "stand-on": "STAND ON",
  mutual: "MUTUAL",
};

const DEGENERATE_TITLE = "Unable to classify";
const DEGENERATE_DESCRIPTION =
  "Vessel A and Vessel B are at the same position — drag one apart to resume live classification.";

// D-08: the doubt/Rule 7 badge treatment is generic (driven by
// classification.doubt), never tied to a specific chip fixture -- doubt
// always wins over whichever rule the classifying trail entry would
// otherwise cite.
function bannerRuleBadge(classification: ClassificationResult): string {
  if (classification.doubt) return "Rule 7";
  const classifyingEntry =
    classification.trail[classifyingEntryIndex(classification.trail.length)];
  return `Rule ${ruleNumber(classifyingEntry.ruleId)}`;
}

function verdictBannerDescription(classification: ClassificationResult): string {
  if (classification.giveWay === null && classification.standOn === null) {
    return "Mutual obligation. Both vessels must alter course to starboard early and substantially to avoid a close-quarters situation.";
  }
  return `${VESSEL_LABEL_TEXT[classification.giveWay as VesselLabel]} gives way. Give-way vessel takes early, substantial action; stand-on vessel holds course and speed.`;
}

function RoleBadge({
  vesselLabel,
  classification,
}: {
  vesselLabel: VesselLabel;
  classification: ClassificationResult;
}) {
  const role = getVesselRole(vesselLabel, classification);
  return (
    <div
      className={`flex flex-col items-center gap-0.5 rounded-lg border px-4 py-2 ${ROLE_BADGE_CLASSNAME[role]}`}
    >
      <span className="text-xs font-normal">{VESSEL_LABEL_TEXT[vesselLabel]}</span>
      <span className="font-mono text-sm font-bold uppercase">{ROLE_STATUS_TEXT[role]}</span>
    </div>
  );
}

export function VerdictBanner({ classification, isDegenerate }: VerdictBannerProps) {
  return (
    <Card className="relative overflow-hidden">
      <span
        aria-hidden="true"
        className="absolute inset-y-3 left-3 w-1 rounded-full bg-rule-accent"
      />
      <CardContent className="flex flex-col items-start justify-between gap-4 pl-7 min-[640px]:flex-row min-[640px]:items-center">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-3">
            {!isDegenerate ? (
              <Badge className="h-auto w-fit bg-rule-accent px-2 py-0.5 font-mono text-[13px] text-background">
                {bannerRuleBadge(classification)}
              </Badge>
            ) : null}
            <h2 className="text-2xl font-semibold leading-[1.25] text-foreground">
              {isDegenerate ? DEGENERATE_TITLE : ENCOUNTER_TYPE_TITLE[classification.encounterType]}
            </h2>
          </div>
          <p className="text-base font-normal text-muted-foreground">
            {isDegenerate ? DEGENERATE_DESCRIPTION : verdictBannerDescription(classification)}
          </p>
        </div>

        <div className="flex shrink-0 gap-3">
          {(["vesselA", "vesselB"] as const).map((vesselLabel) => (
            <RoleBadge key={vesselLabel} vesselLabel={vesselLabel} classification={classification} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
