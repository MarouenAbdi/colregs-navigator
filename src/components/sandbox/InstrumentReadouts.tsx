/**
 * InstrumentReadouts -- the 2x2 Range/Bearing/CPA/TCPA tile grid plus the
 * status pill, both inside one `Card` (08-UI-SPEC.md: "the status pill is
 * NOT a separate card"). Values come from `deriveInstrumentReadouts()`
 * (direct geometry calls against live vessel state, D-05) -- never scanned
 * from `classification.trail[].facts`, which cannot reliably supply these
 * across every code path (see instrument-readouts.ts).
 */

import type { InstrumentReadoutsProps } from "./types.js";
import { deriveInstrumentReadouts } from "./instrument-readouts.js";
import { statusPillCopy, type StatusPillTone } from "./status-pill.js";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

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

// Tone-to-Tailwind-utility mapping -- one step lighter than the give-way/
// stand-on badge shade, per 08-UI-SPEC.md's Status Pill color table (plain
// default-palette utilities, not new @theme tokens -- a distinct, one-off
// convention from the give-way/stand-on badge shades). "opening" reuses
// muted-foreground -- a neutral/informational tone, never red or green,
// since it is not a risk verdict.
const STATUS_PILL_TONE_CLASSNAME: Record<StatusPillTone, string> = {
  clear: "text-green-400 bg-green-400/10 border-green-400/35",
  risk: "text-red-400 bg-red-400/10 border-red-400/35",
  opening: "text-muted-foreground bg-muted-foreground/10 border-muted-foreground/35",
};

const STATUS_PILL_DOT_CLASSNAME: Record<StatusPillTone, string> = {
  clear: "bg-green-400",
  risk: "bg-red-400",
  opening: "bg-muted-foreground",
};

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

export function InstrumentReadouts({ vesselA, vesselB, classification }: InstrumentReadoutsProps) {
  const { rangeNm, bearingAtoBDegrees, cpaNm, tcpaMinutes } = deriveInstrumentReadouts(
    vesselA,
    vesselB,
  );
  const pill = statusPillCopy(classification.riskOfCollision, cpaNm, tcpaMinutes);

  return (
    <Card>
      <CardHeader>
        <span className="
          font-mono text-[11px] tracking-wide text-muted-foreground uppercase
        ">
          Instrument Readouts
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          <Tile label="RANGE" value={`${rangeNm.toFixed(2)} NM`} />
          <Tile label="BEARING A→B" value={formatBearing(bearingAtoBDegrees)} />
          <Tile label="CPA" value={formatCpa(cpaNm)} />
          <Tile label="TCPA" value={formatTcpa(tcpaMinutes)} />
        </div>

        <div
          className={`
            flex items-center gap-2 rounded-lg border px-[11px] py-[9px]
            text-[12.5px]
            ${STATUS_PILL_TONE_CLASSNAME[pill.tone]}
          `}
        >
          <span
            className={`
              size-[7px] shrink-0 rounded-full
              ${STATUS_PILL_DOT_CLASSNAME[pill.tone]}
            `}
            aria-hidden="true"
          />
          {pill.text}
        </div>
      </CardContent>
    </Card>
  );
}
