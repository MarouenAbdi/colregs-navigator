/**
 * Shared prop contracts for the Sandbox UI. Every component -- ChartPanel,
 * ControlPanel, ReasoningPanel, SandboxContainer -- imports these types
 * rather than inventing its own shape, so the components can be built in
 * parallel against one fixed interface.
 */

import type { ClassificationResult, VesselLabel } from "../../domain/colregs/types.js";
import type { Position, Vessel, VesselType } from "../../domain/vessel/vessel.js";

export interface VesselUpdateHandlers {
  onVesselPositionChange: (vessel: VesselLabel, position: Position) => void;
  onVesselHeadingChange: (vessel: VesselLabel, heading: number) => void;
  onVesselSpeedChange: (vessel: VesselLabel, speed: number) => void;
  onVesselTypeChange: (vessel: VesselLabel, type: VesselType) => void;
}

export interface ChartPanelProps {
  vesselA: Vessel;
  vesselB: Vessel;
  classification: ClassificationResult; // always the LAST-GOOD result, never the raw Result<T> wrapper
  isDegenerate: boolean;
  onVesselPositionChange: VesselUpdateHandlers["onVesselPositionChange"];
  onVesselHeadingChange: VesselUpdateHandlers["onVesselHeadingChange"];
  onVesselSpeedChange: VesselUpdateHandlers["onVesselSpeedChange"];
  onVesselTypeChange: VesselUpdateHandlers["onVesselTypeChange"];
}

export interface ControlPanelProps {
  vesselA: Vessel;
  vesselB: Vessel;
  // The vessel-control card's header row renders a give-way/stand-on/
  // mutual role badge (getVesselRole() requires the full classification,
  // not just the two vessels), per the Sandbox design contract.
  classification: ClassificationResult;
  onVesselSpeedChange: VesselUpdateHandlers["onVesselSpeedChange"];
  onVesselTypeChange: VesselUpdateHandlers["onVesselTypeChange"];
}

// The verdict-banner card's props -- same shape the single ReasoningPanel
// aside used to consume, now split out since that aside is retired in
// favor of 3 separate cards (verdict banner / instrument readouts /
// reasoning trail) matching the design 1:1.
export interface VerdictBannerProps {
  classification: ClassificationResult; // always the LAST-GOOD result
  isDegenerate: boolean;
}

// Range/Bearing A->B/CPA/TCPA are derived at the UI layer from live vessel
// state via deriveInstrumentReadouts() -- ClassificationResult itself
// carries none of these (see instrument-readouts.ts for why scanning
// classification.trail[].facts is not a reliable alternative source).
export interface InstrumentReadoutsProps {
  vesselA: Vessel;
  vesselB: Vessel;
  classification: ClassificationResult;
}

// The reasoning-trail card only ever renders classification.trail/doubt/
// doubtBoundary -- no vessel state needed.
export interface ReasoningTrailProps {
  classification: ClassificationResult;
}

export interface SandboxContainerProps {
  // When provided, seeds SandboxContainer's initial (and Reset-restored)
  // vessels from a saved/shared scenario instead of the app's hardcoded
  // default demo fixture (Assumption A3).
  initialScenario?: { vesselA: Vessel; vesselB: Vessel };
  // When provided, renders a banner communicating that a saved/shared
  // scenario is loaded (D-02).
  banner?: { label: string; rationale?: string };
}

// Phase 18's on-chart header/footer strips and floating vessel-control
// overlay (SBOX-06/07/08) -- ChartPanelProps itself is extended later, in
// Plan 18-03, alongside its actual consumption in ChartPanel.tsx.
export interface ChartHeaderStripProps {
  vesselA: Vessel;
  vesselB: Vessel;
  classification: ClassificationResult;
  isDegenerate: boolean;
}

export interface ChartFooterStripProps {
  vesselA: Vessel;
  vesselB: Vessel;
  classification: ClassificationResult;
  isDegenerate: boolean;
}

export interface VesselOverlayCardProps {
  label: VesselLabel;
  letter: "A" | "B";
  vessel: Vessel;
  classification: ClassificationResult;
  onVesselSpeedChange: VesselUpdateHandlers["onVesselSpeedChange"];
  onVesselTypeChange: VesselUpdateHandlers["onVesselTypeChange"];
  onClose: () => void;
}
