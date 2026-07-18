/**
 * Shared prop contracts for Phase 4's sandbox UI (04-01). Every later
 * component in this phase -- ChartPanel, ControlPanel, ReasoningPanel,
 * SandboxContainer (04-02 through 04-06) -- imports these types rather than
 * inventing its own shape, so the components can be built in parallel
 * against one fixed interface.
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
  isDegenerate: boolean; // true when the most recent classifyEncounter() call returned !ok
  onVesselPositionChange: VesselUpdateHandlers["onVesselPositionChange"];
  onVesselHeadingChange: VesselUpdateHandlers["onVesselHeadingChange"];
}

export interface ControlPanelProps {
  vesselA: Vessel;
  vesselB: Vessel;
  onVesselSpeedChange: VesselUpdateHandlers["onVesselSpeedChange"];
  onVesselTypeChange: VesselUpdateHandlers["onVesselTypeChange"];
}

export interface ReasoningPanelProps {
  classification: ClassificationResult; // always the LAST-GOOD result
  isDegenerate: boolean;
}

export interface SandboxContainerProps {
  // When provided, seeds SandboxContainer's initial (and Reset-restored)
  // vessels from a saved/shared scenario instead of the app's hardcoded
  // default demo fixture (05-03 Task 1, Assumption A3).
  initialScenario?: { vesselA: Vessel; vesselB: Vessel };
  // When provided, renders a banner communicating that a saved/shared
  // scenario is loaded (D-02).
  banner?: { label: string; rationale?: string };
}
