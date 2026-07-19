"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { VesselTypeSchema, type VesselType } from "../../domain/vessel/vessel.js";
import { getVesselRole, ROLE_BADGE_CLASSNAME, ROLE_BADGE_TEXT } from "./vessel-role.js";
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

// Read-only HEADING readout is a plain zero-padded degree string (e.g.
// "035°") -- heading stays drag-only on the chart, per the Sandbox design
// contract, so there is deliberately no editable heading control here.
function formatHeading(heading: number): string {
  return `${Math.round(heading).toString().padStart(3, "0")}°`;
}

interface VesselFormSectionProps {
  label: "vesselA" | "vesselB";
  letter: "A" | "B";
  heading: string;
  vessel: ControlPanelProps["vesselA"];
  classification: ControlPanelProps["classification"];
  onVesselSpeedChange: ControlPanelProps["onVesselSpeedChange"];
  onVesselTypeChange: ControlPanelProps["onVesselTypeChange"];
}

function VesselFormSection({
  label,
  letter,
  heading,
  vessel,
  classification,
  onVesselSpeedChange,
  onVesselTypeChange,
}: VesselFormSectionProps) {
  const role = getVesselRole(label, classification);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-foreground text-[13px] font-bold text-background">
          {letter}
        </span>
        <h2 className="text-sm font-semibold text-foreground">{heading}</h2>
        <Badge variant="outline" className={`ml-auto border ${ROLE_BADGE_CLASSNAME[role]}`}>
          {ROLE_BADGE_TEXT[role]}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor={`${label}-type`}
            className="font-mono text-[11px] font-semibold text-muted-foreground uppercase"
          >
            Type
          </Label>
          <Select value={vessel.type} onValueChange={(type) => onVesselTypeChange(label, type as VesselType)}>
            <SelectTrigger id={`${label}-type`} className="w-full">
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
            <Label className="font-mono text-[11px] font-semibold text-muted-foreground uppercase">
              Speed
            </Label>
            {/* Only element in this restyled section allowed to use
                --primary, per 08-UI-SPEC.md's Color section -- every other
                accent need here uses the give-way/stand-on/mutual role
                tokens instead. */}
            <span className="font-mono text-sm font-semibold text-primary">{`${vessel.speed} kn`}</span>
          </div>
          <Slider
            aria-label={`${heading} speed`}
            value={[vessel.speed]}
            min={0}
            max={40}
            step={1}
            onValueChange={([speed]) => onVesselSpeedChange(label, speed)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label className="font-mono text-[11px] font-semibold text-muted-foreground uppercase">
            Heading
          </Label>
          <span className="font-mono text-sm font-semibold text-foreground">
            {formatHeading(vessel.heading)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function ControlPanel({
  vesselA,
  vesselB,
  classification,
  onVesselSpeedChange,
  onVesselTypeChange,
}: ControlPanelProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <VesselFormSection
        label="vesselA"
        letter="A"
        heading="Vessel A"
        vessel={vesselA}
        classification={classification}
        onVesselSpeedChange={onVesselSpeedChange}
        onVesselTypeChange={onVesselTypeChange}
      />
      <VesselFormSection
        label="vesselB"
        letter="B"
        heading="Vessel B"
        vessel={vesselB}
        classification={classification}
        onVesselSpeedChange={onVesselSpeedChange}
        onVesselTypeChange={onVesselTypeChange}
      />
    </div>
  );
}
