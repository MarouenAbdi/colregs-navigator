/**
 * Gallery card's static, illustrative SVG mini-chart (GAL-01, D-06/D-08):
 * a parametrized version of Hero's "static, fixture-driven,
 * classifyEncounter()-backed illustration" pattern (09-RESEARCH.md Pattern
 * 1), accepting any `vesselA`/`vesselB` pair rather than one hardcoded
 * fixture -- rendered 6 times, once per curated gallery card. Shares zero
 * code with the live interactive `ChartPanel.tsx` and is never wired to
 * live Sandbox state (same "decorative static illustration stays
 * independent of the live chart" precedent as `HeroPreviewCard.tsx`, D-08).
 */
import { classifyEncounter } from "../../domain/colregs/classify-encounter.js";
import { chartToScreen, type ContainerSize } from "../../domain/geometry/screen-convert.js";
import type { Vessel } from "../../domain/vessel/vessel.js";
import { getVesselRole, ROLE_HULL_FILL_CLASS, ROLE_STROKE_CLASS, type VesselRole } from "../sandbox/vessel-role.js";
import { HULL_PATH, HULL_STROKE, HULL_STROKE_WIDTH, headingVectorEndpoint, midpoint } from "../shared/static-chart-geometry.js";
import { computeCardViewBox } from "./gallery-preview-geometry.js";

// UI-SPEC.md "Mini-Chart Contract": fixed 3:2 aspect ratio (358:238
// logical, rounded to clean numbers), a correction to Hero's own 8:5
// ratio -- Gallery's mini-chart is proportionally slightly less
// wide/more square than Hero's.
const GALLERY_CONTAINER_SIZE: ContainerSize = { width: 360, height: 240 };

// Engineering default (09-RESEARCH.md's confidence note, Pattern 1) --
// visually compared against Main-Design.png's 6 gallery cards; adjust if
// a card's vessels look clipped or too small/centered.
const PADDING_FRACTION = 0.35;

// UI-SPEC.md's "Mini-chart per-vessel role pill" correction (Pitfall 3):
// the small hull-adjacent pill uses a 2-letter "MU" for mutual, NOT
// vessel-role.ts's ROLE_BADGE_TEXT.mutual ("MUTUAL", 6 characters, sized
// for the card's separate footer verdict badge) -- reusing that constant
// here would overflow/wrap at this smaller scale.
const PILL_TEXT: Record<VesselRole, string> = {
  "give-way": "GW",
  "stand-on": "SO",
  mutual: "MU",
};

type VesselMarkerProps = {
  screen: { screenX: number; screenY: number };
  heading: number;
  role: VesselRole;
  label: string;
};

// The hull rotates with heading; the label circle and role pill are
// deliberately SEPARATE, non-rotated groups at a fixed screen offset --
// matching HeroPreviewCard.tsx's VesselMarker convention (only the hull
// path carries `rotate(hdg)`).
function VesselMarker({ screen, heading, role, label }: VesselMarkerProps) {
  const headingVector = headingVectorEndpoint(screen, heading);
  return (
    <>
      {/* z-order per UI-SPEC.md's Mini-Chart Contract: hull (3), label
          badge (4), pill (5), then the dashed heading vector (6) on top. */}
      <g transform={`translate(${screen.screenX} ${screen.screenY}) rotate(${heading})`}>
        <path d={HULL_PATH} className={ROLE_HULL_FILL_CLASS[role]} stroke={HULL_STROKE} strokeWidth={HULL_STROKE_WIDTH} />
      </g>
      <g transform={`translate(${screen.screenX - 11} ${screen.screenY - 11})`}>
        <circle r={7} fill="#18181B" />
        <text textAnchor="middle" dominantBaseline="middle" fill="#FFFFFF" fontSize={10} fontWeight={600}>
          {label}
        </text>
      </g>
      <g transform={`translate(${screen.screenX + 12} ${screen.screenY + 10})`}>
        <rect width={20} height={12} rx={3} className={ROLE_HULL_FILL_CLASS[role]} />
        <text x={10} y={6} textAnchor="middle" dominantBaseline="middle" fill="#FFFFFF" fontSize={7.5} fontWeight={600}>
          {PILL_TEXT[role]}
        </text>
      </g>
      <line
        x1={screen.screenX}
        y1={screen.screenY}
        x2={headingVector.x}
        y2={headingVector.y}
        className={ROLE_STROKE_CLASS[role]}
        strokeWidth={1.5}
        strokeDasharray="3 3"
      />
    </>
  );
}

type GalleryPreviewChartProps = {
  vesselA: Vessel;
  vesselB: Vessel;
};

export function GalleryPreviewChart({ vesselA, vesselB }: GalleryPreviewChartProps) {
  const result = classifyEncounter(vesselA, vesselB);
  if (!result.ok) {
    // Fixture-invariant guard, mirroring HeroPreviewCard.tsx's pattern --
    // curated gallery scenarios are fixed/known-good at authoring time, so
    // a classification failure here is a developer-facing invariant
    // failure, not a runtime error state to design for. Unlike Hero, a
    // null giveWay/standOn (mutual) is NOT an error here -- Gallery's
    // mutual-role cards are a valid, expected state.
    throw new Error("GalleryPreviewChart: classifyEncounter() failed -- vessel pair is not a valid encounter");
  }
  const classification = result.value;

  const viewBox = computeCardViewBox(vesselA.position, vesselB.position, GALLERY_CONTAINER_SIZE.width / GALLERY_CONTAINER_SIZE.height, PADDING_FRACTION);
  const screenA = chartToScreen(vesselA.position, GALLERY_CONTAINER_SIZE, viewBox);
  const screenB = chartToScreen(vesselB.position, GALLERY_CONTAINER_SIZE, viewBox);

  const roleA = getVesselRole("vesselA", classification);
  const roleB = getVesselRole("vesselB", classification);

  const range = Math.hypot(vesselB.position.x - vesselA.position.x, vesselB.position.y - vesselA.position.y);
  const connectorMidpoint = midpoint(screenA, screenB);

  return (
    <div className="overflow-hidden rounded-md border border-border bg-chart-surface">
      <svg
        viewBox={`0 0 ${GALLERY_CONTAINER_SIZE.width} ${GALLERY_CONTAINER_SIZE.height}`}
        width="100%"
        height="auto"
        role="img"
        aria-label="Encounter preview chart"
      >
        <defs>
          {/* Reuses Hero's heroGrid <pattern> technique verbatim, at a
              lower stroke opacity (UI-SPEC.md Mini-Chart Contract item 1:
              ~8-10% here vs. Hero's declared 14%) and its own pattern id
              (SVG pattern ids must be unique per document, and both
              components can render on the same page). */}
          <pattern id="galleryGrid" width={20} height={20} patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(120,120,130,0.08)" strokeWidth={1} />
          </pattern>
        </defs>

        <rect x={0} y={0} width={GALLERY_CONTAINER_SIZE.width} height={GALLERY_CONTAINER_SIZE.height} fill="url(#galleryGrid)" />

        <line
          x1={screenA.screenX}
          y1={screenA.screenY}
          x2={screenB.screenX}
          y2={screenB.screenY}
          className="stroke-geometry"
          strokeWidth={1.5}
        />

        <VesselMarker screen={screenA} heading={vesselA.heading} role={roleA} label="A" />
        <VesselMarker screen={screenB} heading={vesselB.heading} role={roleB} label="B" />

        {/* Copies HeroPreviewCard.tsx's exact range-label chip markup
            verbatim -- design source renders this at these unscaled
            pixel values regardless of card size. */}
        <g transform={`translate(${connectorMidpoint.x} ${connectorMidpoint.y})`}>
          <rect x={-34} y={-11} width={68} height={22} rx={6} fill="#18181B" stroke="#27272A" />
          <text textAnchor="middle" dominantBaseline="middle" fill="#D4D4D8" className="font-mono" fontSize={12}>
            {`${range.toFixed(2)} NM`}
          </text>
        </g>
      </svg>
    </div>
  );
}
