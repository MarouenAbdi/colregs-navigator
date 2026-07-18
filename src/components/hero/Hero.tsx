/**
 * Hero (07-01) -- net-new marketing Hero section (Direction A only, per
 * PROJECT.md's locked v1.1 decision). Plain Server Component (no
 * "use client" -- no state/effects), matching this repo's existing default
 * (src/components/layout/Header.tsx).
 *
 * Renders the locked headline/copy/CTAs (HERO-01) plus a fully static,
 * illustrative "Live classification" preview card (HERO-02) built as an
 * independent, hand-built SVG -- it shares zero code with the real
 * interactive `ChartPanel.tsx` (CONTEXT.md D-03) and is never wired to the
 * live Sandbox state (CONTEXT.md D-01: no pulsing dot, no animated bearing
 * line). The preview card's RANGE/BEARING/CPA/Rule-15/verdict numbers come
 * from a real `classifyEncounter()`/`bearing()`/`cpa()` call against a
 * fixed, known-good fixture (`hero-preview-fixture.ts`, CONTEXT.md D-07) --
 * not hand-typed literals.
 */
import { classifyEncounter } from "../../domain/colregs/classify-encounter.js";
import { bearing } from "../../domain/geometry/bearing.js";
import { cpa } from "../../domain/geometry/cpa.js";
import { chartToScreen } from "../../domain/geometry/screen-convert.js";
import type { EncounterType, VesselLabel } from "../../domain/colregs/types.js";
import { heroPreviewVesselA, heroPreviewVesselB } from "./hero-preview-fixture.js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionGridBackground } from "@/components/shared/SectionGridBackground";
import { ArrowRight, CircleCheck } from "lucide-react";

// UI-SPEC.md "Preview Card Dimensions": 8:5 (not square) aspect ratio,
// framed to comfortably contain both fixture vessels + the range rings.
const HERO_CONTAINER_SIZE = { width: 320, height: 200 };

// The design source ("COLREGS Navigator (shadcn).dc.html") hardcodes this
// exact card's two vessels at pixel positions hA=(150,210)/hB=(360,95) in
// its 480x300 canvas -- which is just its own PX=80-pixels-per-NM sandbox
// scale applied to the same real bearing/range this fixture reproduces
// (061deg/2.99nm): dx=range*sin(61deg)*80=~210, dy=-range*cos(61deg)*80=~-115,
// matching the mock's hB-hA delta to within rounding. This viewBox is
// solved (not eyeballed) so heroPreviewVesselA/B's *real* NM coordinates
// land on those exact screen pixels (scaled to this card's 320px width):
// minX=-1.875, minY=-1.125 puts A at (100,140) and B at (~239.5,~62.7),
// matching the mock's (150,210)/(360,95) scaled by 320/480 to sub-pixel
// accuracy. Width/height (6 x 3.75) preserve the 8:5 aspect ratio and the
// resulting uniform 320/6 = 200/3.75 = 53.33px-per-NM scale (no distortion
// of the real bearing angle).
const HERO_VIEW_BOX = { minX: -1.875, minY: -1.125, width: 6, height: 3.75 };

// Range rings, bearing sector, and north reference line are centered on
// this fixed chart-canvas center (matches the mock's rings, which are
// centered on its 480x300 canvas center, not on either vessel).
const HERO_CHART_CENTER = {
  screenX: HERO_CONTAINER_SIZE.width / 2,
  screenY: HERO_CONTAINER_SIZE.height / 2,
};

// The mock's two range rings are hardcoded at r=115/r=60 on its 480px-wide
// canvas -- reproduced here as the same fraction of this card's width
// (115/480 and 60/480), not an arbitrary chart-unit formula.
const HERO_OUTER_RING_RADIUS_PX = HERO_CONTAINER_SIZE.width * (115 / 480);
const HERO_INNER_RING_RADIUS_PX = HERO_CONTAINER_SIZE.width * (60 / 480);

// Domain-locked colors (UI-SPEC.md Color table) -- hardcoded per the
// locked contract: the fixture's verdict is fixed at authoring time, so
// hull/pill *colors* may stay hardcoded, but "GW"/"SO" *text* must still be
// derived from the classification result below (not a hand-typed literal).
const VESSEL_A_HULL_COLOR = "#EF4444"; // red-500, give-way
const VESSEL_B_HULL_COLOR = "#22C55E"; // green-500, stand-on
const CONNECTOR_STROKE = "#475569"; // slate-600

const ENCOUNTER_TYPE_TITLE: Record<EncounterType, string> = {
  crossing: "Crossing",
  "head-on": "Head-on",
  overtaking: "Overtaking",
};

const VESSEL_LABEL_TEXT: Record<VesselLabel, string> = {
  vesselA: "Vessel A",
  vesselB: "Vessel B",
};

function headingVectorEndpoint(
  screen: { screenX: number; screenY: number },
  headingDegrees: number,
): { x: number; y: number } {
  const headingRadians = headingDegrees * (Math.PI / 180);
  const HEADING_VECTOR_LENGTH_PX = 70;
  return {
    x: screen.screenX + HEADING_VECTOR_LENGTH_PX * Math.sin(headingRadians),
    y: screen.screenY - HEADING_VECTOR_LENGTH_PX * Math.cos(headingRadians),
  };
}

export function Hero() {
  const result = classifyEncounter(heroPreviewVesselA, heroPreviewVesselB);
  if (!result.ok) {
    // Fixture is fixed/known-good at authoring time -- same reasoning
    // SandboxContainer.tsx's own lazy-initializer comment uses for its
    // seed fixture (07-UI-SPEC.md Error-state contract: a developer-facing
    // invariant failure, not a runtime error state to design for).
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

  const giveWayClause = `${VESSEL_LABEL_TEXT[classification.giveWay as VesselLabel]} gives way`;
  const verdictText = `${ENCOUNTER_TYPE_TITLE[classification.encounterType]} — ${giveWayClause}`;

  const vesselAPillText = classification.giveWay === "vesselA" ? "GW" : "SO";
  const vesselBPillText = classification.giveWay === "vesselB" ? "GW" : "SO";

  // Bearing sector wedge: apex at the fixed chart-canvas center, one edge
  // running due north, the other along the real bearing to vesselB.
  const northEdge = { x: HERO_CHART_CENTER.screenX, y: HERO_CHART_CENTER.screenY - HERO_OUTER_RING_RADIUS_PX };
  const bearingEdge = {
    x: HERO_CHART_CENTER.screenX + HERO_OUTER_RING_RADIUS_PX * Math.sin((bearingDegrees * Math.PI) / 180),
    y: HERO_CHART_CENTER.screenY - HERO_OUTER_RING_RADIUS_PX * Math.cos((bearingDegrees * Math.PI) / 180),
  };
  const sectorPath = [
    `M ${HERO_CHART_CENTER.screenX} ${HERO_CHART_CENTER.screenY}`,
    `L ${northEdge.x} ${northEdge.y}`,
    `A ${HERO_OUTER_RING_RADIUS_PX} ${HERO_OUTER_RING_RADIUS_PX} 0 0 1 ${bearingEdge.x} ${bearingEdge.y}`,
    "Z",
  ].join(" ");

  const headingVectorA = headingVectorEndpoint(screenA, heroPreviewVesselA.heading);
  const headingVectorB = headingVectorEndpoint(screenB, heroPreviewVesselB.heading);

  const connectorMidpoint = {
    x: (screenA.screenX + screenB.screenX) / 2,
    y: (screenA.screenY + screenB.screenY) / 2,
  };

  return (
    <section className="relative overflow-hidden bg-background">
      <SectionGridBackground opacity={0.22} glow />
      <div className="relative z-[1] mx-auto grid max-w-[1200px] grid-cols-1 gap-[30px] px-5 pt-8 pb-11 min-[900px]:grid-cols-[1.05fr_0.95fr] min-[900px]:items-center min-[900px]:gap-[52px] min-[900px]:px-6 min-[900px]:pt-10 min-[900px]:pb-[68px]">
        <div>
          <Badge variant="outline" className="mb-6 h-auto w-fit gap-2 px-[11px] py-1 font-mono text-[11px] font-semibold text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
            Collision-avoidance rules engine
          </Badge>

          <h1 className="mb-5 text-[33px] leading-[1.05] font-bold tracking-[-0.03em] min-[640px]:text-[44px] min-[900px]:text-[54px]">
            <span className="text-foreground">Two vessels. One rulebook. </span>
            <span className="text-accent">See who gives way — and why.</span>
          </h1>

          <p className="mb-[30px] max-w-[470px] text-[16.5px] leading-[1.6] text-muted-foreground">
            Drop two ships on a nautical chart. The engine classifies the encounter under the real International Regulations for Preventing Collisions at Sea, names the give-way vessel, and shows the exact rule and geometry behind the verdict.
          </p>

          <div className="mb-8 flex flex-row gap-3">
            <Button asChild size="lg" className="h-10 gap-2 px-[18px] text-sm font-medium">
              <a href="#sandbox">
                Open the sandbox
                <ArrowRight aria-hidden="true" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-10 gap-2 px-[18px] text-sm font-medium">
              <a href="#gallery">Classic encounters</a>
            </Button>
          </div>

          <p className="flex max-w-[470px] items-center gap-[11px] border-t border-border pt-[18px] text-[13px] text-muted-foreground">
            <CircleCheck className="h-4 w-4 text-accent" aria-hidden="true" />
            <span className="text-muted-foreground">Grounded in </span>
            <span className="font-semibold text-foreground">Rules 11–18</span>
            <span className="text-muted-foreground">
              {" "}
              of the actual COLREGS — Steering &amp; Sailing Rules, conduct in sight of one another.
            </span>
          </p>
        </div>

        <div className="w-full">
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
            <div className="overflow-hidden rounded-md border border-border">
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

                <g transform={`translate(${connectorMidpoint.x} ${connectorMidpoint.y})`}>
                  <rect x={-32} y={-11} width={64} height={22} rx={4} fill="#0F172A" />
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#F8FAFC"
                    fontFamily="monospace"
                    fontSize={11}
                  >
                    {`${range.toFixed(2)} NM`}
                  </text>
                </g>

                {/* Hull rotates with heading; the label circle and role
                    badge below are deliberately SIBLING groups (not
                    nested inside this rotated <g>) with their own plain
                    translate -- matching the design source's renderVessel(),
                    where only the hull path carries `rotate(hdg)` while the
                    badge/label groups use position-only translates. Nesting
                    them inside the rotated group (the previous approach)
                    swings the labels around the vessel whenever heading
                    isn't ~0, which is visibly wrong for non-upright headings
                    like Vessel B's 280deg. */}
                <g transform={`translate(${screenA.screenX} ${screenA.screenY}) rotate(${heroPreviewVesselA.heading})`}>
                  <polygon points="0,-9 6,7 -6,7" fill={VESSEL_A_HULL_COLOR} />
                </g>
                <g transform={`translate(${screenA.screenX - 11} ${screenA.screenY - 11})`}>
                  <circle r={7} fill="#18181B" />
                  <text textAnchor="middle" dominantBaseline="middle" fill="#FFFFFF" fontSize={10} fontWeight={600}>
                    A
                  </text>
                </g>
                <g transform={`translate(${screenA.screenX + 12} ${screenA.screenY + 10})`}>
                  <rect width={20} height={12} rx={3} fill={VESSEL_A_HULL_COLOR} />
                  <text x={10} y={6} textAnchor="middle" dominantBaseline="middle" fill="#FFFFFF" fontSize={7.5} fontWeight={600}>
                    {vesselAPillText}
                  </text>
                </g>

                <g transform={`translate(${screenB.screenX} ${screenB.screenY}) rotate(${heroPreviewVesselB.heading})`}>
                  <polygon points="0,-9 6,7 -6,7" fill={VESSEL_B_HULL_COLOR} />
                </g>
                <g transform={`translate(${screenB.screenX - 11} ${screenB.screenY - 11})`}>
                  <circle r={7} fill="#18181B" />
                  <text textAnchor="middle" dominantBaseline="middle" fill="#FFFFFF" fontSize={10} fontWeight={600}>
                    B
                  </text>
                </g>
                <g transform={`translate(${screenB.screenX + 12} ${screenB.screenY + 10})`}>
                  <rect width={20} height={12} rx={3} fill={VESSEL_B_HULL_COLOR} />
                  <text x={10} y={6} textAnchor="middle" dominantBaseline="middle" fill="#FFFFFF" fontSize={7.5} fontWeight={600}>
                    {vesselBPillText}
                  </text>
                </g>
              </svg>
            </div>

            <div className="mt-3 flex items-center gap-2.5 rounded-md border border-primary/30 bg-primary/10 px-3 py-2.5">
              <Badge className="h-auto bg-primary px-[7px] py-[3px] text-[10px] text-primary-foreground">Rule 15</Badge>
              <span className="text-[15px] font-semibold text-foreground">{verdictText}</span>
            </div>

            <div className="mt-2 grid grid-cols-3 gap-2">
              <div className="rounded-md border border-border px-[10px] py-[9px]">
                <div className="font-mono text-[9.5px] font-semibold tracking-wide text-muted-foreground uppercase">
                  RANGE
                </div>
                <div className="mt-[3px] font-mono text-[15px] font-semibold text-foreground">
                  {`${range.toFixed(2)} NM`}
                </div>
              </div>
              <div className="rounded-md border border-border px-[10px] py-[9px]">
                <div className="font-mono text-[9.5px] font-semibold tracking-wide text-muted-foreground uppercase">
                  BEARING
                </div>
                <div className="mt-[3px] font-mono text-[15px] font-semibold text-foreground">
                  {`${Math.round(bearingDegrees).toString().padStart(3, "0")}°`}
                </div>
              </div>
              <div className="rounded-md border border-border px-[10px] py-[9px]">
                <div className="font-mono text-[9.5px] font-semibold tracking-wide text-muted-foreground uppercase">
                  CPA
                </div>
                <div className="mt-[3px] font-mono text-[15px] font-semibold text-foreground">
                  {`${cpaResult.value.dcpaNm.toFixed(2)} NM`}
                </div>
              </div>
            </div>
          </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
