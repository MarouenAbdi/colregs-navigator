/**
 * useSandboxState -- SandboxContainer's "brain": owns `vesselA`/`vesselB`
 * state, the `previousEncounterTypeRef` Rule 13(d) hysteresis ref, and the
 * single `applyVesselUpdate` validate-then-classify choke point every
 * drag, form update, AND chip-preset load funnels through. Separated from
 * SandboxContainer's JSX so the state machine can be reasoned about and
 * tested independently of rendering. Preserves Rule 13(d) hysteresis
 * semantics and the Pitfall 5 degenerate-frame handling exactly as they
 * existed inline in SandboxContainer.tsx -- moved here unchanged.
 */

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CHIP_SCENARIOS, type ChipId } from "../chip-scenarios.js";
import { classifyEncounter } from "../../../domain/colregs/classify-encounter.js";
import { crossingResidualBasicCase } from "../../../domain/colregs/classify-encounter.fixtures.js";
import { trpc } from "../../../lib/trpc/client.js";
import {
  VesselSchema,
  type Position,
  type Vessel,
  type VesselType,
} from "../../../domain/vessel/vessel.js";
import type {
  ClassificationResult,
  EncounterType,
  VesselLabel,
} from "../../../domain/colregs/types.js";

export function useSandboxState(initialScenario?: { vesselA: Vessel; vesselB: Vessel }): {
  vesselA: Vessel;
  vesselB: Vessel;
  lastGoodClassification: ClassificationResult;
  isDegenerate: boolean;
  activeChipId: ChipId | null;
  saveError: string | null;
  isSaving: boolean;
  onVesselPositionChange: (vessel: VesselLabel, position: Position) => void;
  onVesselHeadingChange: (vessel: VesselLabel, heading: number) => void;
  onVesselSpeedChange: (vessel: VesselLabel, speed: number) => void;
  onVesselTypeChange: (vessel: VesselLabel, type: VesselType) => void;
  handleReset: () => void;
  handleChipSelect: (chipId: ChipId) => void;
  handleSave: () => void;
} {
  const router = useRouter();
  // Save persists the current vesselA/vesselB via scenario.create (no login
  // step, SCEN-01) and redirects to the resulting share URL on success.
  const [saveError, setSaveError] = useState<string | null>(null);
  const createScenario = trpc.scenario.create.useMutation({
    onSuccess: ({ shareId }) => router.push(`/s/${shareId}`),
    // scenario-service.ts's createScenario() throws BAD_REQUEST for a
    // degenerate (coincident) vessel pair -- the button is also disabled
    // while isDegenerate, but the mutation can still reject for other
    // server-side reasons, so this must not be a silent no-op either way.
    onError: () => setSaveError("Couldn't save this scenario. Try again."),
  });
  // When `initialScenario` is provided (saved/shared scenario), seed
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
  // scenario -- purely a client-side visual highlight, cleared by
  // any manual drag/heading/speed/type edit so it never goes stale. Only
  // defaults to "classic-crossing" on the plain, seedless "/" route, where
  // the default seed genuinely IS that chip's fixture (byte-identical,
  // matching the design's default-active chip) -- a saved/shared scenario
  // (`initialScenario` provided) has arbitrary geometry that has nothing to
  // do with that fixture, so it must start with no chip highlighted.
  const [activeChipId, setActiveChipId] = useState<ChipId | null>(
    initialScenario ? null : "classic-crossing",
  );

  // Seeded from the default scenario's own encounter type, so a drag
  // immediately after mount already has correct hysteresis context.
  const previousEncounterTypeRef = useRef<EncounterType | undefined>(
    lastGoodClassification.encounterType,
  );

  // Single choke point: every drag handler AND every ControlPanel
  // onChange handler funnels through this function. Validates both
  // vessels with VesselSchema before classifyEncounter() ever sees them,
  // then re-derives the verdict from scratch every time --
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

  function handleSave(): void {
    setSaveError(null);
    createScenario.mutate({ vesselA, vesselB });
  }

  return {
    vesselA,
    vesselB,
    lastGoodClassification,
    isDegenerate,
    activeChipId,
    saveError,
    isSaving: createScenario.isPending,
    onVesselPositionChange,
    onVesselHeadingChange,
    onVesselSpeedChange,
    onVesselTypeChange,
    handleReset,
    handleChipSelect,
    handleSave,
  };
}
