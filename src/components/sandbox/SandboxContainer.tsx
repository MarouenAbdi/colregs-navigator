"use client";

/**
 * SandboxContainer (04-06) -- the top-level state owner that wires
 * ChartPanel (04-03), ControlPanel (04-04), and ReasoningPanel (04-05)
 * together. Owns `vesselA`/`vesselB` state, the `previousEncounterTypeRef`
 * Rule 13(d) hysteresis ref, and the single `applyVesselUpdate`
 * validate-then-classify choke point every drag AND form update funnels
 * through -- satisfying CLAS-05's "live update regardless of input
 * modality" requirement. Seeds state from D-06's locked default scenario
 * (`crossingResidualBasicCase`) and implements the Reset Scenario CTA.
 */

import { useRef, useState } from "react";
import { ChartPanel } from "./ChartPanel.js";
import { ControlPanel } from "./ControlPanel.js";
import { ReasoningPanel } from "./ReasoningPanel.js";
import { classifyEncounter } from "../../domain/colregs/classify-encounter.js";
import { crossingResidualBasicCase } from "../../domain/colregs/classify-encounter.fixtures.js";
import {
  VesselSchema,
  type Position,
  type Vessel,
  type VesselType,
} from "../../domain/vessel/vessel.js";
import type {
  ClassificationResult,
  EncounterType,
  VesselLabel,
} from "../../domain/colregs/types.js";

export function SandboxContainer() {
  const [vesselA, setVesselA] = useState<Vessel>(crossingResidualBasicCase.vesselA);
  const [vesselB, setVesselB] = useState<Vessel>(crossingResidualBasicCase.vesselB);

  // Lazy initializer: the ONE place in this file that unwraps a
  // classifyEncounter() Result's `.value` without a preceding `.ok`
  // check. Safe specifically because `crossingResidualBasicCase` is a
  // known-good, already-tested, doubt-free fixture -- not user-editable
  // at mount time -- so its classification can never fail.
  const [lastGoodClassification, setLastGoodClassification] = useState<ClassificationResult>(
    () => {
      const initialResult = classifyEncounter(
        crossingResidualBasicCase.vesselA,
        crossingResidualBasicCase.vesselB,
      ) as { ok: true; value: ClassificationResult };
      return initialResult.value;
    },
  );
  const [isDegenerate, setIsDegenerate] = useState<boolean>(false);

  // Seeded from the default scenario's own encounter type, so a drag
  // immediately after mount already has correct hysteresis context.
  const previousEncounterTypeRef = useRef<EncounterType | undefined>(
    lastGoodClassification.encounterType,
  );

  // Single choke point: every drag handler AND every ControlPanel
  // onChange handler funnels through this function. Validates both
  // vessels with VesselSchema before classifyEncounter() ever sees them
  // (T-04-01), then re-derives the verdict from scratch every time --
  // never a stale/cached result -- respecting Rule 13(d) hysteresis via
  // previousEncounterTypeRef.
  function applyVesselUpdate(nextA: Vessel, nextB: Vessel): void {
    const parsedA = VesselSchema.safeParse(nextA);
    const parsedB = VesselSchema.safeParse(nextB);
    if (!parsedA.success || !parsedB.success) return;

    setVesselA(nextA);
    setVesselB(nextB);

    const result = classifyEncounter(nextA, nextB, previousEncounterTypeRef.current);
    if (result.ok) {
      setLastGoodClassification(result.value);
      setIsDegenerate(false);
      previousEncounterTypeRef.current = result.value.encounterType;
    } else {
      // Pitfall 5: a transient coincident-position drag frame must not
      // corrupt hysteresis or discard the last-good verdict -- leave
      // lastGoodClassification and previousEncounterTypeRef.current
      // untouched, only flip the degenerate flag.
      setIsDegenerate(true);
    }
  }

  function onVesselPositionChange(vessel: VesselLabel, position: Position): void {
    applyVesselUpdate(
      vessel === "vesselA" ? { ...vesselA, position } : vesselA,
      vessel === "vesselB" ? { ...vesselB, position } : vesselB,
    );
  }

  function onVesselHeadingChange(vessel: VesselLabel, heading: number): void {
    applyVesselUpdate(
      vessel === "vesselA" ? { ...vesselA, heading } : vesselA,
      vessel === "vesselB" ? { ...vesselB, heading } : vesselB,
    );
  }

  function onVesselSpeedChange(vessel: VesselLabel, speed: number): void {
    applyVesselUpdate(
      vessel === "vesselA" ? { ...vesselA, speed } : vesselA,
      vessel === "vesselB" ? { ...vesselB, speed } : vesselB,
    );
  }

  function onVesselTypeChange(vessel: VesselLabel, type: VesselType): void {
    applyVesselUpdate(
      vessel === "vesselA" ? { ...vesselA, type } : vesselA,
      vessel === "vesselB" ? { ...vesselB, type } : vesselB,
    );
  }

  function handleReset(): void {
    // Reset Scenario is a deliberate FULL state reset, including
    // hysteresis -- unlike every other applyVesselUpdate call site above
    // (a normal drag/form update must never clear hysteresis on its
    // own, see the degenerate branch in applyVesselUpdate). These are
    // intentionally different code paths, not an inconsistency.
    previousEncounterTypeRef.current = undefined;
    applyVesselUpdate(crossingResidualBasicCase.vesselA, crossingResidualBasicCase.vesselB);
  }

  return (
    <main className="flex flex-col gap-8 p-16">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">COLREGS Navigator</h1>
        <button
          type="button"
          onClick={handleReset}
          className="bg-teal-600 text-white px-4 py-2 rounded"
        >
          Reset Scenario
        </button>
      </header>

      {/* D-03: ChartPanel, ControlPanel, and ReasoningPanel are permanent
          sibling panels in one layout row -- not collapsed/expandable, not
          stacked below the chart -- keeping the full reasoning trail
          persistently visible alongside the chart at all times. */}
      <div className="flex flex-row gap-8 items-start">
        <ChartPanel
          vesselA={vesselA}
          vesselB={vesselB}
          classification={lastGoodClassification}
          isDegenerate={isDegenerate}
          onVesselPositionChange={onVesselPositionChange}
          onVesselHeadingChange={onVesselHeadingChange}
        />
        <ControlPanel
          vesselA={vesselA}
          vesselB={vesselB}
          onVesselSpeedChange={onVesselSpeedChange}
          onVesselTypeChange={onVesselTypeChange}
        />
        <ReasoningPanel classification={lastGoodClassification} isDegenerate={isDegenerate} />
      </div>
    </main>
  );
}
