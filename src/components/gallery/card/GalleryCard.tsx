/**
 * One Gallery card (GAL-01/GAL-02): mini-chart illustration, static Rule-N
 * badge, dynamic verdict badge, title, and description, all wrapped in a
 * single accessible Link -- the whole card is the click target, matching
 * the design's "no labeled CTA" affordance (per the design's Copywriting
 * Contract).
 */

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GalleryPreviewChart } from "../chart/GalleryPreviewChart.js";
import { getVesselRole, ROLE_BADGE_CLASSNAME } from "../../sandbox/vessel-role.js";
import type { ClassificationResult, VesselLabel } from "../../../domain/colregs/types.js";
import type { Vessel } from "../../../domain/vessel/vessel.js";

type GalleryCardProps = {
  id: string;
  title: string;
  ruleLabel: string;
  description: string;
  vesselA: Vessel;
  vesselB: Vessel;
  classification: ClassificationResult;
};

// Card-footer-specific presentation choice (per the design's Typography
// section: "A GIVES WAY"/"MUTUAL", not the 2-letter mini-chart pill text) --
// kept local, not shared, since no other component needs this exact string
// shape.
function cardVerdictBadge(classification: ClassificationResult): { text: string; className: string } {
  if (classification.giveWay === null) {
    return { text: "MUTUAL", className: ROLE_BADGE_CLASSNAME.mutual };
  }
  const giveWayLabel: VesselLabel = classification.giveWay;
  return {
    text: `${giveWayLabel === "vesselA" ? "A" : "B"} GIVES WAY`,
    className: ROLE_BADGE_CLASSNAME[getVesselRole(giveWayLabel, classification)],
  };
}

export function GalleryCard({ id, title, ruleLabel, description, vesselA, vesselB, classification }: GalleryCardProps) {
  const verdict = cardVerdictBadge(classification);

  return (
    <Link
      href={`/s/${id}`}
      aria-label={`Load ${title} scenario into the sandbox`}
      className="
        group block rounded-xl
        focus-visible:ring-2 focus-visible:ring-ring
        focus-visible:outline-hidden
      "
    >
      <Card className="
        h-full gap-0 border border-border px-4 transition-all duration-200
        group-hover:border-primary/40 group-hover:shadow-sm
      ">
        <div className="mb-4">
          <GalleryPreviewChart vesselA={vesselA} vesselB={vesselB} />
        </div>
        <div className="mb-3 flex items-center justify-between">
          <Badge variant="outline" className="
            border-accent font-mono text-[13px] font-semibold text-accent
          ">
            {ruleLabel}
          </Badge>
          <Badge variant="outline" className={`
            ${verdict.className}
            font-mono text-[13px] font-semibold uppercase
          `}>
            {verdict.text}
          </Badge>
        </div>
        <h3 className="mb-1.5 text-2xl/tight font-semibold text-foreground">{title}</h3>
        <p className="text-base font-semibold text-muted-foreground">{description}</p>
      </Card>
    </Link>
  );
}
