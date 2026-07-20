"use client";

/**
 * SandboxContainer -- the top-level state owner that wires ChartPanel,
 * ControlPanel, and the 3 split reasoning cards (VerdictBanner,
 * InstrumentReadouts, ReasoningTrail) together. Delegates all
 * vesselA/vesselB state, the Rule 13(d) hysteresis, and the
 * validate-then-classify choke point to useSandboxState() (RFCT-04) --
 * satisfying CLAS-05's "live update regardless of input modality"
 * requirement. This file is now JSX composition + the chip-row/reset/save
 * CTAs only.
 */

import { RotateCcw, Link2 } from "lucide-react";
import { ChartPanel } from "./ChartPanel.js";
import { ControlPanel } from "./ControlPanel.js";
import { VerdictBanner } from "./VerdictBanner.js";
import { InstrumentReadouts } from "./InstrumentReadouts.js";
import { ReasoningTrail } from "./ReasoningTrail.js";
import { CHIP_ORDER } from "./chip-scenarios.js";
import { useSandboxState } from "./hooks/useSandboxState.js";
import { Button } from "@/components/ui/button";
import type { SandboxContainerProps } from "./types.js";

export function SandboxContainer({ initialScenario, banner }: SandboxContainerProps = {}) {
  const sandboxState = useSandboxState(initialScenario);

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

      {/* D-01/D-02: one-shot data-load chip row -- a plain button group, not
          Tabs/ToggleGroup (Pattern 2). Clicking a chip performs a full
          replace + hysteresis reset via handleChipSelect. */}
      <div className="mb-8 flex flex-wrap gap-2">
        {CHIP_ORDER.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => sandboxState.handleChipSelect(id)}
            aria-pressed={sandboxState.activeChipId === id}
            className={`
              flex h-[30px] items-center rounded-full border px-[13px] font-sans
              text-[12.5px] font-medium transition-colors
              ${
              sandboxState.activeChipId === id
                ? "border-rule-accent bg-rule-accent text-white"
                : `
                  border-border bg-card text-muted-foreground
                  hover:text-foreground
                `
            }
            `}
          >
            {label}
          </button>
        ))}
      </div>

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
          onVesselPositionChange={sandboxState.onVesselPositionChange}
          onVesselHeadingChange={sandboxState.onVesselHeadingChange}
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
