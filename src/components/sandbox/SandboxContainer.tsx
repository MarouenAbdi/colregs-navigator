"use client";

/**
 * SandboxContainer -- the top-level state owner that wires ChartPanel,
 * ControlPanel, and the 3 split reasoning cards (VerdictBanner,
 * InstrumentReadouts, ReasoningTrail) together. Delegates all
 * vesselA/vesselB state, the Rule 13(d) hysteresis, and the
 * validate-then-classify choke point to useSandboxState() so state and
 * presentation stay separate concerns -- this file is now JSX composition
 * plus the reset/save CTAs only, ensuring the live classification update
 * behaves identically regardless of which input (drag, form field, or
 * scenario load) triggered it.
 */

import { useEffect } from "react";
import { RotateCcw, Link2 } from "lucide-react";
import { ChartPanel } from "./chart/ChartPanel.js";
import { ControlPanel } from "./control-panel/ControlPanel.js";
import { VerdictBanner } from "./reasoning/VerdictBanner.js";
import { InstrumentReadouts } from "./instruments/InstrumentReadouts.js";
import { ReasoningTrail } from "./reasoning/ReasoningTrail.js";
import { useSandboxState } from "./hooks/useSandboxState.js";
import { useSandboxBridge } from "./bridge/SandboxBridgeProvider.js";
import { Button } from "@/components/ui/button";
import type { SandboxContainerProps } from "./types.js";

export function SandboxContainer({ initialScenario, banner }: SandboxContainerProps = {}) {
  const sandboxState = useSandboxState(initialScenario);
  const { pendingScenario } = useSandboxBridge();

  // Keyed on requestId (a monotonically-changing number), not vesselA/
  // vesselB object identity, so re-selecting the same Gallery scenario
  // twice in a row still re-triggers the load (Roadmap Phase 17 success
  // criterion 4).
  useEffect(() => {
    if (!pendingScenario) return;
    sandboxState.loadScenario(pendingScenario.vesselA, pendingScenario.vesselB);
  }, [pendingScenario?.requestId]);

  return (
    <div className="
      mx-auto max-w-300 px-5 py-12
      min-[900px]:px-6 min-[900px]:py-16
    ">
      <header className="mb-8 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span className="
              font-mono text-[13px] font-semibold tracking-wide text-primary
              uppercase
            ">
              Interactive sandbox · night-display mode
            </span>
            <h1 className="text-2xl/tight font-semibold text-foreground">
              Drag a vessel — watch the verdict update
            </h1>
            <p className="
              max-w-150 text-base font-semibold text-muted-foreground
            ">
              Drag a hull to reposition it, grab the bow handle to change heading, and adjust
              speed &amp; type below. Classification recomputes live.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Save and share this scenario"
              onClick={sandboxState.handleSave}
              disabled={sandboxState.isSaving || sandboxState.isDegenerate}
            >
              <Link2 aria-hidden="true" />
            </Button>
            <Button type="button" variant="outline" onClick={sandboxState.handleReset}>
              <RotateCcw aria-hidden="true" />
              Reset scenario
            </Button>
          </div>
        </div>
        {sandboxState.saveError ? <p className="text-sm text-doubt">{sandboxState.saveError}</p> : null}
        {banner ? (
          <div className="
            rounded-sm border border-border bg-card px-3 py-2 text-sm
            text-muted-foreground
          ">
            <div>{banner.label}</div>
            {banner.rationale ? <div>{banner.rationale}</div> : null}
          </div>
        ) : null}
      </header>

      <VerdictBanner
        classification={sandboxState.lastGoodClassification}
        isDegenerate={sandboxState.isDegenerate}
      />

      <div className="
        mt-4 grid grid-cols-1 gap-4
        min-[900px]:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]
      ">
        <ChartPanel
          vesselA={sandboxState.vesselA}
          vesselB={sandboxState.vesselB}
          classification={sandboxState.lastGoodClassification}
          isDegenerate={sandboxState.isDegenerate}
          onVesselPositionChange={sandboxState.onVesselPositionChange}
          onVesselHeadingChange={sandboxState.onVesselHeadingChange}
          onVesselSpeedChange={sandboxState.onVesselSpeedChange}
          onVesselTypeChange={sandboxState.onVesselTypeChange}
        />
        <div className="flex flex-col gap-4">
          <InstrumentReadouts
            vesselA={sandboxState.vesselA}
            vesselB={sandboxState.vesselB}
            classification={sandboxState.lastGoodClassification}
          />
          <ControlPanel
            vesselA={sandboxState.vesselA}
            vesselB={sandboxState.vesselB}
            classification={sandboxState.lastGoodClassification}
            onVesselSpeedChange={sandboxState.onVesselSpeedChange}
            onVesselTypeChange={sandboxState.onVesselTypeChange}
          />
        </div>
      </div>

      <div className="mt-4">
        <ReasoningTrail classification={sandboxState.lastGoodClassification} />
      </div>
    </div>
  );
}
