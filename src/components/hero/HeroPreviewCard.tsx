/**
 * The Hero section's "Live classification" preview card (HERO-02): a
 * fully static, illustrative SVG chart driven by a real
 * `classifyEncounter()`/`bearing()`/`cpa()` call against a fixed fixture
 * (`hero-preview-fixture.ts`) -- not hand-typed literals. Shares zero code
 * with the real interactive `ChartPanel.tsx` (CONTEXT.md D-03) and is
 * never wired to live Sandbox state (CONTEXT.md D-01: no pulsing dot, no
 * animated bearing line).
 */
import { classifyEncounter } from "../../domain/colregs/classify-encounter.js";
import { bearing } from "../../domain/geometry/bearing.js";
import { cpa } from "../../domain/geometry/cpa.js";
import { chartToScreen } from "../../domain/geometry/screen-convert.js";
import type { EncounterType, VesselLabel } from "../../domain/colregs/types.js";
import { heroPreviewVesselA, heroPreviewVesselB } from "./hero-preview-fixture.js";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  HERO_CONTAINER_SIZE,
  HERO_VIEW_BOX,
  HERO_CHART_CENTER,
  HERO_OUTER_RING_RADIUS_PX,
  HERO_INNER_RING_RADIUS_PX,
  VESSEL_A_HULL_COLOR,
  VESSEL_B_HULL_COLOR,
  CONNECTOR_STROKE,
  HULL_PATH,
  HULL_STROKE,
  HULL_STROKE_WIDTH,
  headingVectorEndpoint,
  bearingSectorPath,
  midpoint,
} from "./hero-preview-geometry.js";

const ENCOUNTER_TYPE_TITLE: Record<EncounterType, string> = {
  crossing: "Crossing",
  "head-on": "Head-on",
  overtaking: "Overtaking",
};

const VESSEL_LABEL_TEXT: Record<VesselLabel, string> = {
  vesselA: "Vessel A",
  vesselB: "Vessel B",
};

type VesselMarkerProps = {
  screen: { screenX: number; screenY: number };
  heading: number;
  hullColor: string;
  label: string;
  pillText: string;
};

// The hull rotates with heading; the label circle and role-badge pill are
// deliberately SEPARATE, non-rotated groups at a fixed screen offset --
// matching the design source's renderVessel(), where only the hull path
// carries `rotate(hdg)`. Rotating the labels together with the hull (the
// original approach) swings them around the vessel whenever heading isn't
// ~0, which is visibly wrong for non-upright headings like Vessel B's 280deg.
function VesselMarker({ screen, heading, hullColor, label, pillText }: VesselMarkerProps) {
  return (
    <>
      <g transform={`translate(${screen.screenX} ${screen.screenY}) rotate(${heading})`}>
        <path d={HULL_PATH} fill={hullColor} stroke={HULL_STROKE} strokeWidth={HULL_STROKE_WIDTH} />
      </g>
      <g transform={`translate(${screen.screenX - 11} ${screen.screenY - 11})`}>
        <circle r={7} fill="#18181B" />
        <text textAnchor="middle" dominantBaseline="middle" fill="#FFFFFF" fontSize={10} fontWeight={600}>
          {label}
        </text>
      </g>
      <g transform={`translate(${screen.screenX + 12} ${screen.screenY + 10})`}>
        <rect width={20} height={12} rx={3} fill={hullColor} />
        <text x={10} y={6} textAnchor="middle" dominantBaseline="middle" fill="#FFFFFF" fontSize={7.5} fontWeight={600}>
          {pillText}
        </text>
      </g>
    </>
  );
}

export function HeroPreviewCard() {
  const result = classifyEncounter(heroPreviewVesselA, heroPreviewVesselB);
  if (!result.ok) {
    // Fixture is fixed/known-good at authoring time -- a developer-facing
    // invariant failure, not a runtime error state to design for (matches
    // SandboxContainer.tsx's own seed-fixture reasoning).
    throw new Error("Hero preview fixture failed to classify -- fixture is broken");
  }
  const classification = result.value;

  const bearingResult = bearing(heroPreviewVesselA.position, heroPreviewVesselB.position);
  if (!bearingResult.ok) {
    throw new Error("Hero preview fixture failed to compute bearing -- fixture is broken");
  }
  const bearingDegrees = bearingResult.value;

  const cpaResult = cpa(heroPreviewVesselA, heroPreviewVesselB);
  if (!cpaResult.ok) {
    throw new Error("Hero preview fixture failed to compute CPA -- fixture is broken");
  }

  const screenA = chartToScreen(heroPreviewVesselA.position, HERO_CONTAINER_SIZE, HERO_VIEW_BOX);
  const screenB = chartToScreen(heroPreviewVesselB.position, HERO_CONTAINER_SIZE, HERO_VIEW_BOX);

  const range = Math.hypot(
    heroPreviewVesselB.position.x - heroPreviewVesselA.position.x,
    heroPreviewVesselB.position.y - heroPreviewVesselA.position.y,
  );

  const giveWayLabel = VESSEL_LABEL_TEXT[classification.giveWay as VesselLabel];
  const verdictText = `${ENCOUNTER_TYPE_TITLE[classification.encounterType]} — ${giveWayLabel} gives way`;

  const vesselAPillText = classification.giveWay === "vesselA" ? "GW" : "SO";
  const vesselBPillText = classification.giveWay === "vesselB" ? "GW" : "SO";

  const sectorPath = bearingSectorPath(bearingDegrees);
  const headingVectorA = headingVectorEndpoint(screenA, heroPreviewVesselA.heading);
  const headingVectorB = headingVectorEndpoint(screenB, heroPreviewVesselB.heading);
  const connectorMidpoint = midpoint(screenA, screenB);

  return (
    <Card className="gap-3">
      <CardHeader className="flex flex-row items-center justify-between font-mono text-[10.5px] font-semibold text-muted-foreground">
        <span className="flex items-center gap-[7px]">
          {/* Static, non-pulsing dot per CONTEXT.md D-01 -- no animation classes. */}
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
          <span className="text-foreground">Live classification</span>
        </span>
        <span>BRG-ring · 12 NM</span>
      </CardHeader>
      <CardContent className="flex flex-col">
        <div className="overflow-hidden rounded-md border border-border bg-[#0B0B0E]">
          <svg viewBox="0 0 320 200" width="100%" height="auto" role="img" aria-label="Illustrative encounter preview chart">
            <defs>
              <pattern id="heroGrid" width={20} height={20} patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(120,120,130,0.14)" strokeWidth={1} />
              </pattern>
              <radialGradient
                id="heroSectorGradient"
                gradientUnits="userSpaceOnUse"
                cx={HERO_CHART_CENTER.screenX}
                cy={HERO_CHART_CENTER.screenY}
                r={HERO_OUTER_RING_RADIUS_PX}
              >
                <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0} />
              </radialGradient>
            </defs>

            <rect x={0} y={0} width={320} height={200} fill="url(#heroGrid)" />

            <circle
              cx={HERO_CHART_CENTER.screenX}
              cy={HERO_CHART_CENTER.screenY}
              r={HERO_OUTER_RING_RADIUS_PX}
              stroke="rgba(45,212,191,0.16)"
              fill="none"
              strokeWidth={1}
            />
            <circle
              cx={HERO_CHART_CENTER.screenX}
              cy={HERO_CHART_CENTER.screenY}
              r={HERO_INNER_RING_RADIUS_PX}
              stroke="rgba(45,212,191,0.16)"
              fill="none"
              strokeWidth={1}
            />

            <path d={sectorPath} fill="url(#heroSectorGradient)" />

            <line
              x1={HERO_CHART_CENTER.screenX}
              y1={HERO_CHART_CENTER.screenY}
              x2={HERO_CHART_CENTER.screenX}
              y2={HERO_CHART_CENTER.screenY - HERO_OUTER_RING_RADIUS_PX}
              stroke="rgba(45,212,191,0.16)"
              strokeWidth={1}
            />

            <line
              x1={screenA.screenX}
              y1={screenA.screenY}
              x2={screenB.screenX}
              y2={screenB.screenY}
              stroke={CONNECTOR_STROKE}
              strokeWidth={1.5}
            />

            <line
              x1={screenA.screenX}
              y1={screenA.screenY}
              x2={headingVectorA.x}
              y2={headingVectorA.y}
              stroke={VESSEL_A_HULL_COLOR}
              strokeWidth={1.5}
              strokeDasharray="3 3"
            />
            <line
              x1={screenB.screenX}
              y1={screenB.screenY}
              x2={headingVectorB.x}
              y2={headingVectorB.y}
              stroke={VESSEL_B_HULL_COLOR}
              strokeWidth={1.5}
              strokeDasharray="3 3"
            />

            {/* Design's bearingLine() renders this chip at these exact,
                unscaled pixel values regardless of card size -- not a
                hardcoded literal, this matches the design source verbatim. */}
            <g transform={`translate(${connectorMidpoint.x} ${connectorMidpoint.y})`}>
              <rect x={-34} y={-11} width={68} height={22} rx={6} fill="#18181B" stroke="#27272A" />
              <text textAnchor="middle" dominantBaseline="middle" fill="#D4D4D8" className="font-mono" fontSize={12}>
                {`${range.toFixed(2)} NM`}
              </text>
            </g>

            <VesselMarker
              screen={screenA}
              heading={heroPreviewVesselA.heading}
              hullColor={VESSEL_A_HULL_COLOR}
              label="A"
              pillText={vesselAPillText}
            />
            <VesselMarker
              screen={screenB}
              heading={heroPreviewVesselB.heading}
              hullColor={VESSEL_B_HULL_COLOR}
              label="B"
              pillText={vesselBPillText}
            />
          </svg>
        </div>

        <div className="mt-3 flex items-center gap-2.5 rounded-md border border-primary/30 bg-primary/10 px-3 py-2.5">
          <Badge className="h-auto bg-primary px-[7px] py-[3px] text-[10px] text-primary-foreground">Rule 15</Badge>
          <span className="text-[15px] font-semibold text-foreground">{verdictText}</span>
        </div>

        <div className="mt-2 grid grid-cols-3 gap-2">
          <div className="rounded-md border border-border px-[10px] py-[9px]">
            <div className="font-mono text-[9.5px] font-semibold tracking-wide text-muted-foreground uppercase">RANGE</div>
            <div className="mt-[3px] font-mono text-[15px] font-semibold text-foreground">{`${range.toFixed(2)} NM`}</div>
          </div>
          <div className="rounded-md border border-border px-[10px] py-[9px]">
            <div className="font-mono text-[9.5px] font-semibold tracking-wide text-muted-foreground uppercase">BEARING</div>
            <div className="mt-[3px] font-mono text-[15px] font-semibold text-foreground">
              {`${Math.round(bearingDegrees).toString().padStart(3, "0")}°`}
            </div>
          </div>
          <div className="rounded-md border border-border px-[10px] py-[9px]">
            <div className="font-mono text-[9.5px] font-semibold tracking-wide text-muted-foreground uppercase">CPA</div>
            <div className="mt-[3px] font-mono text-[15px] font-semibold text-foreground">{`${cpaResult.value.dcpaNm.toFixed(2)} NM`}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
