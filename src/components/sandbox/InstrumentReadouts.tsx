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
import { statusPillCopy } from "./status-pill.js";
import { Card, CardContent } from "@/components/ui/card";

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
// convention from the give-way/stand-on badge shades).
const STATUS_PILL_TONE_CLASSNAME: Record<"clear" | "risk", string> = {
  clear: "text-green-400 bg-green-400/10 border-green-400/35",
  risk: "text-red-400 bg-red-400/10 border-red-400/35",
};

const STATUS_PILL_DOT_CLASSNAME: Record<"clear" | "risk", string> = {
  clear: "bg-green-400",
  risk: "bg-red-400",
};

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border px-2.5 py-2.25">
      <div className="font-mono text-[9.5px] font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </div>
      <div className="mt-0.75 font-mono text-[15px] font-semibold text-foreground">{value}</div>
    </div>
  );
}

export function InstrumentReadouts({
  vesselA,
  vesselB,
  classification,
  isDegenerate: _isDegenerate,
}: InstrumentReadoutsProps) {
  const { rangeNm, bearingAtoBDegrees, cpaNm, tcpaMinutes } = deriveInstrumentReadouts(
    vesselA,
    vesselB,
  );
  const pill = statusPillCopy(classification.riskOfCollision, cpaNm);

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          <Tile label="RANGE" value={`${rangeNm.toFixed(2)} NM`} />
          <Tile label="BEARING A→B" value={formatBearing(bearingAtoBDegrees)} />
          <Tile label="CPA" value={formatCpa(cpaNm)} />
          <Tile label="TCPA" value={formatTcpa(tcpaMinutes)} />
        </div>

        <span
          className={`inline-flex w-fit items-center gap-1 rounded-full border px-2 py-1 font-sans text-[13px] font-semibold ${STATUS_PILL_TONE_CLASSNAME[pill.tone]}`}
        >
          <span
            className={`h-1 w-1 rounded-full ${STATUS_PILL_DOT_CLASSNAME[pill.tone]}`}
            aria-hidden="true"
          />
          {pill.text}
        </span>
      </CardContent>
    </Card>
  );
}
