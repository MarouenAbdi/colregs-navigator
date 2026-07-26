/**
 * Per-step inline SVG illustrations for the Guided Tour (D-03), ported
 * verbatim from `19-DESIGN-SNAPSHOT.md`'s `tourViz` array into plain JSX,
 * never via a raw-HTML injection prop (RESEARCH.md Pattern 3). Six distinct
 * sub-components, not one generic parameterized illustration -- the steps
 * are not near-identical, so CLAUDE.md's "no duplicated JSX" convention
 * does not apply here. Raw hex fill/stroke literals are the design's exact,
 * fixed-at-authoring-time illustration content (matching
 * `hero-preview-geometry.ts`'s own hardcoded-hex precedent), not component
 * chrome built as a JS template-literal string -- CLAUDE.md's "no raw CSS
 * strings" convention targets the latter, not literal SVG attribute values.
 */
import { Fragment } from "react";

const TOUR_VIZ_FONT_FAMILY = "'Geist Mono', monospace";

// Step 0 -- Welcome aboard the Navigator: radar scope with two vessel
// wedges (red/green) + a dashed relative-bearing line + a
// "RULE 15 · CROSSING" verdict pill.
function WelcomeIllustration() {
  return (
    <svg viewBox="0 0 460 176" width="100%" height="100%" fontFamily={TOUR_VIZ_FONT_FAMILY}>
      <defs>
        <radialGradient id="tour-viz-radar-gradient" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="rgba(45,212,191,.10)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      <rect width={460} height={176} fill="#0B0B0E" />
      <rect width={460} height={176} fill="url(#tour-viz-radar-gradient)" />
      <g stroke="rgba(45,212,191,.16)" fill="none">
        <circle cx={230} cy={88} r={34} />
        <circle cx={230} cy={88} r={66} />
        <circle cx={230} cy={88} r={98} />
      </g>
      <line x1={230} y1={10} x2={230} y2={166} stroke="rgba(45,212,191,.12)" />
      <line x1={120} y1={88} x2={340} y2={88} stroke="rgba(45,212,191,.12)" />
      <path d="M230 88 L230 20 A68 68 0 0 1 289 55 Z" fill="rgba(45,212,191,.14)" />
      <g transform="translate(196,120) rotate(35)">
        <path d="M0 -9 L6 8 L0 4 L-6 8 Z" fill="#EF4444" />
      </g>
      <g transform="translate(276,58) rotate(-58)">
        <path d="M0 -9 L6 8 L0 4 L-6 8 Z" fill="#22C55E" />
      </g>
      <line x1={196} y1={120} x2={276} y2={58} stroke="#475569" strokeDasharray="3 3" />
      <g transform="translate(300,138)">
        <rect x={0} y={0} width={150} height={26} rx={6} fill="rgba(45,212,191,.12)" stroke="rgba(45,212,191,.35)" />
        <text x={9} y={17} fill="#2dd4bf" fontSize={10} fontWeight={700}>
          RULE 15 · CROSSING
        </text>
      </g>
    </svg>
  );
}

// Step 1 -- Move the vessels: hull outline with a dashed drag-path arrow
// labeled "DRAG HULL" and a dashed rotate-arc labeled "ROTATE BOW".
function MoveVesselsIllustration() {
  return (
    <svg viewBox="0 0 460 176" width="100%" height="100%" fontFamily={TOUR_VIZ_FONT_FAMILY}>
      <rect width={460} height={176} fill="#0B0B0E" />
      <g stroke="rgba(63,63,70,.35)">
        <line x1={0} y1={44} x2={460} y2={44} />
        <line x1={0} y1={88} x2={460} y2={88} />
        <line x1={0} y1={132} x2={460} y2={132} />
        <line x1={115} y1={0} x2={115} y2={176} />
        <line x1={230} y1={0} x2={230} y2={176} />
        <line x1={345} y1={0} x2={345} y2={176} />
      </g>
      <path d="M60 96 q60 -46 130 -8" fill="none" stroke="#2dd4bf" strokeWidth={1.5} strokeDasharray="4 4" />
      <path d="M186 86 l6 4 -8 4 z" fill="#2dd4bf" />
      <g transform="translate(210,96) rotate(28)">
        <path d="M0 -16 L11 14 L0 8 L-11 14 Z" fill="#EF4444" />
        <line x1={0} y1={-16} x2={0} y2={-44} stroke="#2dd4bf" strokeWidth={1.5} />
        <circle cx={0} cy={-44} r={7} fill="#0B0B0E" stroke="#2dd4bf" strokeWidth={1.5} />
      </g>
      <path d="M250 44 a34 34 0 0 1 22 20" fill="none" stroke="#2dd4bf" strokeWidth={1.5} strokeDasharray="4 4" />
      <path d="M270 58 l6 3 -3 6 z" fill="#2dd4bf" />
      <text x={34} y={126} fill="#71717A" fontSize={10}>
        DRAG HULL
      </text>
      <text x={286} y={40} fill="#2dd4bf" fontSize={10}>
        ROTATE BOW
      </text>
    </svg>
  );
}

// Step 2 -- Read the instruments: 4 readout tiles (RANGE/BEARING/CPA/TCPA),
// CPA/TCPA highlighted teal ("hot"). Ported from the design's
// `.map().join('')` string-composition loop as a real `.map()` returning
// JSX elements with a `key` prop (RESEARCH.md Pattern 3).
const INSTRUMENT_TILES = [
  { x: 16, label: "RANGE", value: "1.92 NM" },
  { x: 130, label: "BEARING", value: "045°" },
  { x: 244, label: "CPA", value: "0.28 NM" },
  { x: 358, label: "TCPA", value: "04:12" },
];

function InstrumentsIllustration() {
  return (
    <svg viewBox="0 0 460 176" width="100%" height="100%" fontFamily={TOUR_VIZ_FONT_FAMILY}>
      <rect width={460} height={176} fill="#0B0B0E" />
      {INSTRUMENT_TILES.map((tile, i) => {
        const hot = i >= 2;
        return (
          <g key={tile.label} transform={`translate(${tile.x},52)`}>
            <rect width={86} height={72} rx={9} fill="#101014" stroke={hot ? "rgba(45,212,191,.4)" : "#27272A"} />
            <text x={12} y={26} fill="#71717A" fontSize={9.5}>
              {tile.label}
            </text>
            <text x={12} y={50} fill={hot ? "#2dd4bf" : "#FAFAFA"} fontSize={17} fontWeight={700}>
              {tile.value}
            </text>
          </g>
        );
      })}
      <text x={16} y={150} fill="#52525B" fontSize={9.5}>
        LIVE READOUT · UPDATES AS YOU MOVE
      </text>
    </svg>
  );
}

// Step 3 -- Read the verdict: header verdict pill + two vessel rows with
// GIVE WAY (amber) / STAND ON (green) badges.
function VerdictIllustration() {
  return (
    <svg viewBox="0 0 460 176" width="100%" height="100%" fontFamily={TOUR_VIZ_FONT_FAMILY}>
      <rect width={460} height={176} fill="#0B0B0E" />
      <g transform="translate(16,20)">
        <rect width={428} height={30} rx={7} fill="rgba(45,212,191,.08)" stroke="rgba(45,212,191,.25)" />
        <text x={12} y={20} fill="#2dd4bf" fontSize={11} fontWeight={700}>
          CROSSING · RULE 15 · VESSEL A GIVES WAY
        </text>
      </g>
      <g transform="translate(16,62)">
        <rect width={428} height={42} rx={8} fill="#101014" stroke="#27272A" />
        <g transform="translate(14,11)">
          <path d="M0 20 L11 -4 L22 20 L11 14 Z" fill="#EF4444" />
        </g>
        <text x={48} y={26} fill="#FAFAFA" fontSize={12}>
          Vessel A
        </text>
        <rect x={300} y={9} width={116} height={24} rx={6} fill="rgba(245,158,11,.14)" stroke="rgba(245,158,11,.4)" />
        <text x={313} y={25} fill="#F59E0B" fontSize={10} fontWeight={700}>
          GIVE WAY
        </text>
      </g>
      <g transform="translate(16,114)">
        <rect width={428} height={42} rx={8} fill="#101014" stroke="#27272A" />
        <g transform="translate(14,11)">
          <path d="M0 20 L11 -4 L22 20 L11 14 Z" fill="#22C55E" />
        </g>
        <text x={48} y={26} fill="#FAFAFA" fontSize={12}>
          Vessel B
        </text>
        <rect x={300} y={9} width={116} height={24} rx={6} fill="rgba(34,197,94,.14)" stroke="rgba(34,197,94,.4)" />
        <text x={313} y={25} fill="#22C55E" fontSize={10} fontWeight={700}>
          STAND ON
        </text>
      </g>
    </svg>
  );
}

// Step 4 -- Follow the reasoning: horizontal decision chain, 4 connected
// nodes (RULE 7 -> RULE 15 -> RULE 18 -> VERDICT), last node glowing teal.
const REASONING_NODES = [
  { label: "RULE 7", detail: "Risk exists" },
  { label: "RULE 15", detail: "Crossing" },
  { label: "RULE 18", detail: "Both power" },
  { label: "VERDICT", detail: "A gives way" },
];

function ReasoningIllustration() {
  return (
    <svg viewBox="0 0 460 176" width="100%" height="100%" fontFamily={TOUR_VIZ_FONT_FAMILY}>
      <rect width={460} height={176} fill="#0B0B0E" />
      <text x={16} y={26} fill="#52525B" fontSize={9.5}>
        NAV DECISION CHAIN
      </text>
      {REASONING_NODES.map((node, i) => {
        const y = 42 + i * 30;
        const glow = i === REASONING_NODES.length - 1;
        return (
          <Fragment key={node.label}>
            {i > 0 && <line x1={30} y1={y - 30 + 22} x2={30} y2={y} stroke="#2dd4bf" strokeWidth={1.5} />}
            <circle cx={30} cy={y + 11} r={6} fill={glow ? "#2dd4bf" : "#0B0B0E"} stroke="#2dd4bf" strokeWidth={1.5} />
            <g transform={`translate(48,${y})`}>
              <rect
                width={396}
                height={22}
                rx={6}
                fill={glow ? "rgba(45,212,191,.12)" : "#101014"}
                stroke={glow ? "rgba(45,212,191,.5)" : "#27272A"}
              />
              <text x={10} y={15} fill="#2dd4bf" fontSize={9} fontWeight={700}>
                {node.label}
              </text>
              <text x={92} y={15} fill={glow ? "#FAFAFA" : "#A1A1AA"} fontSize={10}>
                {node.detail}
              </text>
            </g>
          </Fragment>
        );
      })}
    </svg>
  );
}

// Step 5 -- Start from a classic: 6 scenario thumbnail tiles in a 3x2
// grid (CROSSING/HEAD-ON/OVERTAKE/SAILING/NUC/IN DOUBT), first tile
// highlighted.
const GALLERY_TILES = [
  { x: 16, y: 20, label: "CROSSING" },
  { x: 164, y: 20, label: "HEAD-ON" },
  { x: 312, y: 20, label: "OVERTAKE" },
  { x: 16, y: 100, label: "SAILING" },
  { x: 164, y: 100, label: "NUC" },
  { x: 312, y: 100, label: "IN DOUBT" },
];

function GalleryIllustration() {
  return (
    <svg viewBox="0 0 460 176" width="100%" height="100%" fontFamily={TOUR_VIZ_FONT_FAMILY}>
      <rect width={460} height={176} fill="#0B0B0E" />
      {GALLERY_TILES.map((tile, i) => {
        const glow = i === 0;
        return (
          <g key={tile.label} transform={`translate(${tile.x},${tile.y})`}>
            <rect width={132} height={66} rx={8} fill="#101014" stroke={glow ? "rgba(45,212,191,.45)" : "#27272A"} />
            <g stroke="rgba(45,212,191,.2)" fill="none">
              <circle cx={66} cy={30} r={12} />
              <circle cx={66} cy={30} r={22} />
            </g>
            <path d="M52 44 L80 16" stroke="#475569" strokeDasharray="2 2" />
            <path d="M52 44 l7 -3 -1 6 z" fill="#EF4444" />
            <path d="M80 16 l-6 2 0 -6 z" fill="#22C55E" />
            <text x={8} y={60} fill={glow ? "#2dd4bf" : "#71717A"} fontSize={8} fontWeight={700}>
              {tile.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function TourStepIllustration({ step }: { step: number }) {
  switch (step) {
    case 0:
      return <WelcomeIllustration />;
    case 1:
      return <MoveVesselsIllustration />;
    case 2:
      return <InstrumentsIllustration />;
    case 3:
      return <VerdictIllustration />;
    case 4:
      return <ReasoningIllustration />;
    case 5:
      return <GalleryIllustration />;
    default:
      return <WelcomeIllustration />;
  }
}
