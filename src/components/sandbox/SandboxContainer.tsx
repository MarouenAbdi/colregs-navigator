"use client";

/**
 * SandboxContainer -- the top-level state owner that wires ChartPanel,
 * ControlPanel, and the 3 split reasoning cards (VerdictBanner,
 * InstrumentReadouts, ReasoningTrail) together. Owns `vesselA`/`vesselB`
 * state, the `previousEncounterTypeRef` Rule 13(d) hysteresis ref, and the
 * single `applyVesselUpdate` validate-then-classify choke point every drag,
 * form update, AND chip-preset load funnels through -- satisfying CLAS-05's
 * "live update regardless of input modality" requirement. Seeds state from
 * the locked default scenario (`crossingResidualBasicCase`) and implements
 * the reset-scenario CTA and the 6-chip preset row (D-01/D-02).
 */

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Link2 } from "lucide-react";
import { ChartPanel } from "./ChartPanel.js";
import { ControlPanel } from "./ControlPanel.js";
import { VerdictBanner } from "./VerdictBanner.js";
import { InstrumentReadouts } from "./InstrumentReadouts.js";
import { ReasoningTrail } from "./ReasoningTrail.js";
import { CHIP_ORDER, CHIP_SCENARIOS, type ChipId } from "./chip-scenarios.js";
import { classifyEncounter } from "../../domain/colregs/classify-encounter.js";
import { crossingResidualBasicCase } from "../../domain/colregs/classify-encounter.fixtures.js";
import { trpc } from "../../lib/trpc/client.js";
import { Button } from "@/components/ui/button";
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
import type { SandboxContainerProps } from "./types.js";

export function SandboxContainer({ initialScenario, banner }: SandboxContainerProps = {}) {
  const router = useRouter();
  // 05-03 Task 2: Save persists the current vesselA/vesselB via
  // scenario.create (no login step, SCEN-01) and redirects to the
  // resulting share URL on success.
  const createScenario = trpc.scenario.create.useMutation({
    onSuccess: ({ shareId }) => router.push(`/s/${shareId}`),
  });
  // 05-03: when `initialScenario` is provided (saved/shared scenario), seed
  // from it instead of the app's hardcoded default demo fixture. When
  // absent (plain "/" route), falls back to the pre-existing default --
  // Assumption A3: Reset restores THIS instance's seed, not an unrelated
  // global default.
  const seedA = initialScenario?.vesselA ?? crossingResidualBasicCase.vesselA;
  const seedB = initialScenario?.vesselB ?? crossingResidualBasicCase.vesselB;

  const [vesselA, setVesselA] = useState<Vessel>(seedA);
  const [vesselB, setVesselB] = useState<Vessel>(seedB);

  // Lazy initializer: the ONE place in this file that unwraps a
  // classifyEncounter() Result's `.value` without a preceding `.ok`
  // check. Safe specifically because the seed vessels come from either
  // the known-good, already-tested, doubt-free default fixture, or a
  // previously-persisted (already-validated on create) saved scenario --
  // not user-editable at mount time -- so its classification can never
  // fail.
  const [lastGoodClassification, setLastGoodClassification] = useState<ClassificationResult>(
    () => {
      const initialResult = classifyEncounter(seedA, seedB) as {
        ok: true;
        value: ClassificationResult;
      };
      return initialResult.value;
    },
  );
  const [isDegenerate, setIsDegenerate] = useState<boolean>(false);

  // Tracks which chip (if any) is the source of the currently-loaded
  // scenario -- purely a client-side visual highlight (T-08-07), cleared by
  // any manual drag/heading/speed/type edit so it never goes stale. The
  // default seed is byte-identical to the "classic-crossing" chip fixture,
  // matching the design's default-active chip.
  const [activeChipId, setActiveChipId] = useState<ChipId | null>("classic-crossing");

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
    setActiveChipId(null);
    applyVesselUpdate(
      vessel === "vesselA" ? { ...vesselA, position } : vesselA,
      vessel === "vesselB" ? { ...vesselB, position } : vesselB,
    );
  }

  function onVesselHeadingChange(vessel: VesselLabel, heading: number): void {
    setActiveChipId(null);
    applyVesselUpdate(
      vessel === "vesselA" ? { ...vesselA, heading } : vesselA,
      vessel === "vesselB" ? { ...vesselB, heading } : vesselB,
    );
  }

  function onVesselSpeedChange(vessel: VesselLabel, speed: number): void {
    setActiveChipId(null);
    applyVesselUpdate(
      vessel === "vesselA" ? { ...vesselA, speed } : vesselA,
      vessel === "vesselB" ? { ...vesselB, speed } : vesselB,
    );
  }

  function onVesselTypeChange(vessel: VesselLabel, type: VesselType): void {
    setActiveChipId(null);
    applyVesselUpdate(
      vessel === "vesselA" ? { ...vesselA, type } : vesselA,
      vessel === "vesselB" ? { ...vesselB, type } : vesselB,
    );
  }

  function handleReset(): void {
    // Reset scenario is a deliberate FULL state reset, including
    // hysteresis -- unlike every other applyVesselUpdate call site above
    // (a normal drag/form update must never clear hysteresis on its
    // own, see the degenerate branch in applyVesselUpdate). These are
    // intentionally different code paths, not an inconsistency. The seed
    // scenario is not necessarily one of the 6 chip fixtures, so this
    // deliberately does NOT set activeChipId -- it stays whatever it was.
    previousEncounterTypeRef.current = undefined;
    applyVesselUpdate(seedA, seedB);
  }

  function handleChipSelect(chipId: ChipId): void {
    // Mirrors handleReset()'s exact shape (D-01/D-02: full replace + full
    // hysteresis reset) -- routes through the same applyVesselUpdate choke
    // point every other update site uses, never a parallel state path.
    previousEncounterTypeRef.current = undefined;
    applyVesselUpdate(CHIP_SCENARIOS[chipId].vesselA, CHIP_SCENARIOS[chipId].vesselB);
    setActiveChipId(chipId);
  }

  return (
    <div className="mx-auto max-w-300 px-5 py-12 min-[900px]:px-6 min-[900px]:py-16">
      <header className="mb-8 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">
              Interactive sandbox · night-display mode
            </span>
            <h1 className="text-2xl leading-[1.25] font-semibold text-foreground">
              Drag a vessel — watch the verdict update
            </h1>
            <p className="max-w-150 text-base font-semibold text-muted-foreground">
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
              onClick={() => createScenario.mutate({ vesselA, vesselB })}
              disabled={createScenario.isPending}
            >
              <Link2 aria-hidden="true" />
            </Button>
            <Button type="button" variant="outline" onClick={handleReset}>
              <RotateCcw aria-hidden="true" />
              Reset scenario
            </Button>
          </div>
        </div>
        {banner ? (
          <div className="rounded border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
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
            onClick={() => handleChipSelect(id)}
            aria-pressed={activeChipId === id}
            className={`rounded-full border px-3 py-1.5 font-mono text-[13px] font-semibold transition-colors ${
              activeChipId === id
                ? "border-rule-accent bg-rule-accent text-white"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <VerdictBanner classification={lastGoodClassification} isDegenerate={isDegenerate} />

      <div className="mt-4 grid grid-cols-1 gap-4 min-[900px]:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <ChartPanel
          vesselA={vesselA}
          vesselB={vesselB}
          classification={lastGoodClassification}
          isDegenerate={isDegenerate}
          onVesselPositionChange={onVesselPositionChange}
          onVesselHeadingChange={onVesselHeadingChange}
        />
        <div className="flex flex-col gap-4">
          <InstrumentReadouts
            vesselA={vesselA}
            vesselB={vesselB}
            classification={lastGoodClassification}
            isDegenerate={isDegenerate}
          />
          <ReasoningTrail classification={lastGoodClassification} />
        </div>
      </div>

      <div className="mt-8">
        <ControlPanel
          vesselA={vesselA}
          vesselB={vesselB}
          classification={lastGoodClassification}
          onVesselSpeedChange={onVesselSpeedChange}
          onVesselTypeChange={onVesselTypeChange}
        />
      </div>
    </div>
  );
}
