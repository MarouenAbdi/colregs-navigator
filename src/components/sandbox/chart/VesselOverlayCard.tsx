"use client";

/**
 * VesselOverlayCard -- floating per-vessel TYPE/SPEED/HEADING control card
 * (SBOX-08), replacing the always-visible side `ControlPanel`. Mines
 * `ControlPanel.tsx`'s `VesselFormSection` Select/Slider wiring,
 * `VESSEL_TYPE_LABELS`, and `formatHeading()` verbatim -- that component is
 * retired next plan, so this file copies rather than imports.
 *
 * Pitfall 1 mitigation: the card sits as an absolutely-positioned sibling
 * of the chart SVG (positioning applied by the wrapping div ChartPanel.tsx
 * renders in Plan 18-03, not by this component), so its own painted chrome
 * must not swallow the next pointerdown on the chart underneath it. The
 * root container carries `pointer-events-none`; only the close button, the
 * Select trigger, and the Slider individually re-enable
 * `pointer-events-auto`, so they stay interactive despite the ancestor's
 * blanket `pointer-events-none`.
 */

import { X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { VesselTypeSchema, type VesselType } from "../../../domain/vessel/vessel.js";
import { getVesselRole, ROLE_BADGE_CLASSNAME, ROLE_BADGE_TEXT } from "../vessel-role.js";
import type { VesselOverlayCardProps } from "../types.js";

// D-12: display labels are UI-only presentation strings; the underlying
// option values are always VesselTypeSchema's own enum members.
const VESSEL_TYPE_LABELS: Record<VesselType, string> = {
  "power-driven": "Power-driven",
  sailing: "Sailing",
  fishing: "Fishing",
  "not-under-command": "Not under command",
  "restricted-in-ability-to-maneuver": "Restricted in ability to maneuver",
};

// Read-only HEADING readout -- heading stays drag-only on the chart, so
// there is deliberately no editable heading control here.
function formatHeading(heading: number): string {
  return `${Math.round(heading).toString().padStart(3, "0")}°`;
}

export function VesselOverlayCard({
  label,
  letter,
  vessel,
  classification,
  onVesselSpeedChange,
  onVesselTypeChange,
  onClose,
}: VesselOverlayCardProps) {
  const role = getVesselRole(label, classification);
  const vesselName = letter === "A" ? "Vessel A" : "Vessel B";

  return (
    <div
      className="
        pointer-events-none w-full rounded-xl border border-rule-accent/45
        bg-card/95 p-[13px] shadow-lg backdrop-blur-sm
      "
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="
              flex size-6 items-center justify-center rounded-[7px]
              bg-foreground text-[13px] font-bold text-background
            "
          >
            {letter}
          </span>
          <span className="text-sm font-semibold text-foreground">{vesselName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`
              w-fit rounded-full border px-2 py-0.5 font-mono text-[11px]
              font-semibold
              ${ROLE_BADGE_CLASSNAME[role]}
            `}
          >
            {ROLE_BADGE_TEXT[role]}
          </span>
          <button
            type="button"
            aria-label={`Close ${vesselName} control card`}
            onClick={onClose}
            className="
              pointer-events-auto flex size-6 items-center justify-center
              rounded-md text-muted-foreground
              hover:bg-muted hover:text-foreground
            "
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={`${label}-overlay-type`}
            className="
              font-mono text-[11px] font-semibold text-muted-foreground
              uppercase
            "
          >
            Type
          </label>
          <Select
            value={vessel.type}
            onValueChange={(type) => onVesselTypeChange(label, type as VesselType)}
          >
            <SelectTrigger id={`${label}-overlay-type`} className="
              pointer-events-auto w-full
            ">
              <SelectValue placeholder="Vessel type" />
            </SelectTrigger>
            <SelectContent>
              {VesselTypeSchema.options.map((type) => (
                <SelectItem key={type} value={type}>
                  {VESSEL_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="
              font-mono text-[11px] font-semibold text-muted-foreground
              uppercase
            ">
              Speed
            </span>
            <span className="font-mono text-sm font-semibold text-primary">{`${vessel.speed} kn`}</span>
          </div>
          <Slider
            aria-label={`${vesselName} speed`}
            value={[vessel.speed]}
            min={0}
            max={40}
            step={1}
            onValueChange={([speed]) => onVesselSpeedChange(label, speed)}
            className="pointer-events-auto"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="
            font-mono text-[11px] font-semibold text-muted-foreground uppercase
          ">
            Heading
          </span>
          <span className="font-mono text-sm font-semibold text-foreground">
            {formatHeading(vessel.heading)}
          </span>
        </div>
      </div>
    </div>
  );
}
