/**
 * useSandboxState -- SandboxContainer's "brain": owns `vesselA`/`vesselB`
 * state, the `previousEncounterTypeRef` Rule 13(d) hysteresis ref, and the
 * single `applyVesselUpdate` validate-then-classify choke point every
 * drag, form update, and scenario load funnels through. Separated from
 * SandboxContainer's JSX so the state machine can be reasoned about and
 * tested independently of rendering. Preserves Rule 13(d) hysteresis
 * semantics and the Pitfall 5 degenerate-frame handling exactly as they
 * existed inline in SandboxContainer.tsx -- moved here unchanged.
 */

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
  saveError: string | null;
  isSaving: boolean;
  onVesselPositionChange: (vessel: VesselLabel, position: Position) => void;
  onVesselHeadingChange: (vessel: VesselLabel, heading: number) => void;
  onVesselSpeedChange: (vessel: VesselLabel, speed: number) => void;
  onVesselTypeChange: (vessel: VesselLabel, type: VesselType) => void;
  handleReset: () => void;
  loadScenario: (nextA: Vessel, nextB: Vessel) => void;
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

  // Single generalized full-replace + hysteresis-reset entry point --
  // every "load a whole new vessel pair" call site (Reset today; Phase 17's
  // Gallery "Try on Sandbox" bridge next) funnels through this one function
  // rather than each re-implementing the reset-then-apply body.
  function loadScenario(nextA: Vessel, nextB: Vessel): void {
    previousEncounterTypeRef.current = undefined;
    applyVesselUpdate(nextA, nextB);
  }

  function handleReset(): void {
    // handleReset still owns computing seedA/seedB (this instance's seed --
    // either initialScenario or the default fixture); it delegates the
    // actual apply step to loadScenario (D-03) rather than duplicating
    // loadScenario's body under a second name.
    loadScenario(seedA, seedB);
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
    saveError,
    isSaving: createScenario.isPending,
    onVesselPositionChange,
    onVesselHeadingChange,
    onVesselSpeedChange,
    onVesselTypeChange,
    handleReset,
    loadScenario,
    handleSave,
  };
}
