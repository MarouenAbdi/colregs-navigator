/**
 * The Hero section's illustrative encounter-preview card (HERO-02): a
 * fully static, illustrative SVG chart driven by a real
 * `classifyEncounter()`/`bearing()`/`cpa()` call against a fixed fixture
 * (`hero-preview-fixture.ts`) -- not hand-typed literals. Shares zero code
 * with the real interactive `ChartPanel.tsx` (07-CONTEXT.md D-03) and is
 * never wired to live Sandbox state -- its footer's pulsing indicator is
 * a purely decorative, visually-distinguished echo of the real Sandbox's
 * own live indicator (this phase's D-01/D-02), not a live data connection;
 * the bearing line and every other readout stay non-animated.
 */
import { classifyEncounter } from "../../domain/colregs/classify-encounter.js";
import { bearing } from "../../domain/geometry/bearing/bearing.js";
import { cpa } from "../../domain/geometry/cpa/cpa.js";
import { chartToScreen } from "../../domain/geometry/screen-convert/screen-convert.js";
import type { EncounterType } from "../../domain/colregs/types.js";
import { heroPreviewVesselA, heroPreviewVesselB } from "./hero-preview-fixture.js";
import { Card, CardContent } from "@/components/ui/card";
import {
  HERO_CONTAINER_SIZE,
  HERO_VIEW_BOX,
  HERO_CHART_CENTER,
  HERO_OUTER_RING_RADIUS_PX,
  HERO_INNER_RING_RADIUS_PX,
  VESSEL_A_HULL_COLOR,
  VESSEL_B_HULL_COLOR,
  CONNECTOR_STROKE,
  bearingSectorPath,
} from "./hero-preview-geometry.js";
import {
  HERO_PREVIEW_RISK_TONE_CLASSNAME,
  HERO_PREVIEW_RISK_DOT_CLASSNAME,
  deriveHeroPreviewRisk,
} from "./hero-preview-risk.js";
import {
  HULL_PATH,
  HULL_STROKE,
  HULL_STROKE_WIDTH,
  headingVectorEndpoint,
  midpoint,
} from "../shared/static-chart-geometry.js";

const ENCOUNTER_TYPE_TITLE: Record<EncounterType, string> = {
  crossing: "Crossing",
  "head-on": "Head-on",
  overtaking: "Overtaking",
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

// Copies ChartFooterStrip.tsx's Tile shape verbatim (not imported --
// HeroPreviewCard.tsx shares zero code with the Sandbox chart module tree,
// D-03) with one deliberate deviation: the value uses this codebase's
// existing Hero 15px value-role convention, not ChartFooterStrip.tsx's 17px.
function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="
      rounded-lg border border-border bg-chart-surface px-[11px] py-[10px]
    ">
      <div className="
        font-mono text-[9.5px] font-semibold tracking-wide text-muted-foreground
        uppercase
      ">
        {label}
      </div>
      <div className="
        mt-0.75 font-mono text-[15px] font-semibold text-foreground
      ">{value}</div>
    </div>
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

  if (classification.giveWay === null) {
    // Rule 14 head-on situations have no single give-way vessel (both
    // alter course), which this fixed crossing-encounter fixture never
    // produces -- an explicit throw here (matching this function's other
    // fixture-invariant checks above) instead of casting the null away.
    throw new Error("Hero preview fixture classified as a mutual/no-giveWay encounter -- fixture is broken");
  }
  const vesselAPillText = classification.giveWay === "vesselA" ? "GW" : "SO";
  const vesselBPillText = classification.giveWay === "vesselB" ? "GW" : "SO";

  const sectorPath = bearingSectorPath(bearingDegrees);
  const headingVectorA = headingVectorEndpoint(screenA, heroPreviewVesselA.heading);
  const headingVectorB = headingVectorEndpoint(screenB, heroPreviewVesselB.heading);
  const connectorMidpoint = midpoint(screenA, screenB);

  const risk = deriveHeroPreviewRisk(cpaResult.value.dcpaNm, cpaResult.value.tcpaMinutes);

  return (
    <Card className="gap-3">
      <CardContent className="flex flex-col">
        <div className="
          flex items-center gap-3 border-b border-border px-4 py-3
        ">
          <div className="flex min-w-0 items-center gap-2">
            {/* Hardcoded per this fixture's invariant Rule 15/crossing
                verdict (unchanged from the prior below-chart badge) --
                never derived, since this fixture never produces another
                rule outcome. */}
            <span className="
              w-fit shrink-0 rounded-md bg-rule-accent px-2 py-0.5 font-mono
              text-[11px] font-semibold text-background
            ">
              Rule 15
            </span>
            <h3 className="truncate text-lg font-bold text-foreground">
              {ENCOUNTER_TYPE_TITLE[classification.encounterType]}
            </h3>
          </div>

          <div className="flex-1" />

          <div className={`
            flex max-w-[46%] items-center gap-[7px] rounded-md border px-[11px]
            py-[6px] text-[12.5px]
            ${HERO_PREVIEW_RISK_TONE_CLASSNAME[risk.tier]}
          `}>
            <span aria-hidden="true" className={`
              size-2 shrink-0 rounded-full
              ${HERO_PREVIEW_RISK_DOT_CLASSNAME[risk.tier]}
            `} />
            <span className="truncate">{risk.text}</span>
          </div>
        </div>

        <div className="
          overflow-hidden rounded-md border border-border bg-[#0B0B0E]
        ">
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
              <text textAnchor="middle" dominantBaseline="middle" fill="#D4D4D8" className="
                font-mono
              " fontSize={12}>
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

        <div className="
          mt-3 flex flex-wrap items-center gap-[22px] rounded-md border
          border-border bg-chart-surface px-[18px] py-[13px] font-mono
        ">
          <div className="
            flex items-center gap-1.5 text-[11px] font-semibold tracking-wide
            text-primary uppercase
          ">
            {/*
              D-02: bg-primary/text-primary + hero-live-pulse (plan 20-01's
              CSS, 2.8s ease-in-out), deliberately NOT bg-rule-accent/
              text-rule-accent + ChartFooterStrip.tsx's own faster pulse
              class -- the real Sandbox's LIVE dot must never be mistaken
              for this static card's.
            */}
            <span aria-hidden="true" className="
              hero-live-pulse size-1.5 rounded-full bg-primary
            " />
            LIVE
          </div>
          <Tile label="RANGE" value={`${range.toFixed(2)} NM`} />
          <Tile label="BEARING A→B" value={`${Math.round(bearingDegrees).toString().padStart(3, "0")}°`} />
          <Tile label="CPA" value={`${cpaResult.value.dcpaNm.toFixed(2)} NM`} />
          <Tile label="TCPA" value={`${cpaResult.value.tcpaMinutes.toFixed(1)} min`} />
        </div>
      </CardContent>
    </Card>
  );
}
