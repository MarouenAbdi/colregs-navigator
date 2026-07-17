"use client";

import { VesselTypeSchema, type VesselType } from "../../domain/vessel/vessel.js";
import type { ControlPanelProps } from "./types.js";

// D-12: display labels are UI-only presentation strings; the underlying
// option values are always VesselTypeSchema's own enum members (never a
// hand-authored parallel list), so the form can never drift from the
// domain's five vessel-type statuses.
const VESSEL_TYPE_LABELS: Record<VesselType, string> = {
  "power-driven": "Power-driven",
  sailing: "Sailing",
  fishing: "Fishing",
  "not-under-command": "Not under command",
  "restricted-in-ability-to-maneuver": "Restricted in ability to maneuver",
};

interface VesselFormSectionProps {
  label: "vesselA" | "vesselB";
  heading: string;
  vessel: ControlPanelProps["vesselA"];
  onVesselSpeedChange: ControlPanelProps["onVesselSpeedChange"];
  onVesselTypeChange: ControlPanelProps["onVesselTypeChange"];
}

function VesselFormSection({
  label,
  heading,
  vessel,
  onVesselSpeedChange,
  onVesselTypeChange,
}: VesselFormSectionProps) {
  return (
    <div className="flex flex-col gap-4 p-6">
      <h2 className="text-xl font-semibold">{heading}</h2>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        Speed (kn)
        <input
          type="number"
          min={0}
          max={40}
          step={1}
          value={vessel.speed}
          onChange={(e) => onVesselSpeedChange(label, Number(e.target.value))}
          className="font-mono rounded border border-slate-200 px-2 py-1 focus:outline-teal-600"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        Vessel type
        <select
          value={vessel.type}
          onChange={(e) => onVesselTypeChange(label, e.target.value as VesselType)}
          className="rounded border border-slate-200 px-2 py-1 focus:outline-teal-600"
        >
          {VesselTypeSchema.options.map((type) => (
            <option key={type} value={type}>
              {VESSEL_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export function ControlPanel({
  vesselA,
  vesselB,
  onVesselSpeedChange,
  onVesselTypeChange,
}: ControlPanelProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <VesselFormSection
        label="vesselA"
        heading="Vessel A"
        vessel={vesselA}
        onVesselSpeedChange={onVesselSpeedChange}
        onVesselTypeChange={onVesselTypeChange}
      />
      <VesselFormSection
        label="vesselB"
        heading="Vessel B"
        vessel={vesselB}
        onVesselSpeedChange={onVesselSpeedChange}
        onVesselTypeChange={onVesselTypeChange}
      />
    </div>
  );
}
