/**
 * ChartFooterStrip -- merged RANGE/BEARING/CPA/TCPA readout tiles + LIVE
 * indicator + per-vessel role/action panel for the on-chart footer bar
 * (SBOX-07). Mines `InstrumentReadouts.tsx`'s `Tile`/`formatBearing`/
 * `formatCpa`/`formatTcpa`/`PLACEHOLDER` logic verbatim -- that component
 * is retired next plan, so this file copies rather than imports. Values
 * come from `deriveInstrumentReadouts()` (direct geometry calls against
 * live vessel state), unchanged from the file it replaces. A sub-region of
 * one merged chart card (not a standalone card), so this renders plain
 * flex markup rather than the shadcn `Card` primitives
 * `InstrumentReadouts.tsx` used.
 */

import type { ChartFooterStripProps } from "../types.js";
import { deriveInstrumentReadouts } from "../instruments/instrument-readouts.js";
import { getVesselRole, ROLE_BADGE_CLASSNAME, ROLE_BADGE_TEXT } from "../vessel-role.js";
import { ROLE_ACTION_TEXT } from "./footer-action-copy.js";
import type { ClassificationResult, VesselLabel } from "../../../domain/colregs/types.js";

const PLACEHOLDER = "—";

function formatBearing(bearingAtoBDegrees: number | null): string {
  if (bearingAtoBDegrees === null) return PLACEHOLDER;
  return `${Math.round(bearingAtoBDegrees).toString().padStart(3, "0")}°`;
}

function formatCpa(cpaNm: number | null): string {
  if (cpaNm === null) return PLACEHOLDER;
  return `${cpaNm.toFixed(2)} NM`;
}

function formatTcpa(tcpaMinutes: number | null): string {
  if (tcpaMinutes === null) return PLACEHOLDER;
  return `${tcpaMinutes.toFixed(1)} min`;
}

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
        mt-0.75 font-mono text-[17px] font-semibold text-foreground
      ">{value}</div>
    </div>
  );
}

// Extracted per CLAUDE.md's "no duplicated JSX for near-identical instances"
// convention, mirroring VerdictBanner.tsx's own RoleBadge subcomponent
// precedent for its two per-vessel badges.
function VesselActionCell({
  label,
  letter,
  classification,
  isDegenerate,
  withDivider,
}: {
  label: VesselLabel;
  letter: "A" | "B";
  classification: ClassificationResult;
  isDegenerate: boolean;
  withDivider: boolean;
}) {
  const role = getVesselRole(label, classification);
  return (
    <div
      className={`
        flex max-w-[250px] items-start gap-[9px] px-[15px] py-[13px]
        ${withDivider ? `
          border-t border-border
          min-[900px]:border-t-0 min-[900px]:border-l
        ` : ""}
      `}
    >
      <span
        className="
          flex size-6 shrink-0 items-center justify-center rounded-[7px]
          bg-foreground text-[13px] font-bold text-background
        "
      >
        {letter}
      </span>
      <div className="flex flex-col gap-1">
        <span
          className={`
            w-fit rounded-full border px-2 py-0.5 font-mono text-[11px]
            font-semibold
            ${ROLE_BADGE_CLASSNAME[role]}
          `}
        >
          {ROLE_BADGE_TEXT[role]}
        </span>
        <div className="text-[12.5px] text-muted-foreground">
          {isDegenerate ? PLACEHOLDER : ROLE_ACTION_TEXT[role]}
        </div>
      </div>
    </div>
  );
}

export function ChartFooterStrip({
  vesselA,
  vesselB,
  classification,
  isDegenerate,
}: ChartFooterStripProps) {
  const { rangeNm, bearingAtoBDegrees, cpaNm, tcpaMinutes } = deriveInstrumentReadouts(
    vesselA,
    vesselB,
  );

  return (
    <div className="flex flex-wrap items-stretch border-t border-border">
      <div className="
        flex flex-wrap items-center gap-[22px] px-[18px] py-[13px] font-mono
      ">
        <div
          className="
            flex items-center gap-1.5 text-[11px] font-semibold tracking-wide
            text-rule-accent uppercase
          "
        >
          <span aria-hidden="true" className="
            size-1.5 animate-pulse rounded-full bg-rule-accent
          " />
          LIVE
        </div>
        <Tile label="RANGE" value={`${rangeNm.toFixed(2)} NM`} />
        <Tile label="BEARING A→B" value={formatBearing(bearingAtoBDegrees)} />
        <Tile label="CPA" value={formatCpa(cpaNm)} />
        <Tile label="TCPA" value={formatTcpa(tcpaMinutes)} />
      </div>

      <div className="flex-1" />

      <div className="flex flex-wrap">
        <VesselActionCell
          label="vesselA"
          letter="A"
          classification={classification}
          isDegenerate={isDegenerate}
          withDivider={false}
        />
        <VesselActionCell
          label="vesselB"
          letter="B"
          classification={classification}
          isDegenerate={isDegenerate}
          withDivider={true}
        />
      </div>
    </div>
  );
}
