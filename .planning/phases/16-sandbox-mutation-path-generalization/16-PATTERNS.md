# Phase 16: Sandbox Mutation-Path Generalization - Pattern Map

**Mapped:** 2026-07-25
**Files analyzed:** 5 (all modified/deleted, zero net-new files this phase)
**Analogs found:** 5 / 5 (this phase is a refactor — each file's own current implementation IS its analog)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `src/components/sandbox/hooks/useSandboxState.ts` | hook (state container) | event-driven / CRUD (full-replace) | itself (current `handleChipSelect`/`handleReset`/`applyVesselUpdate`) | exact — same file, generalize in place |
| `src/components/sandbox/SandboxContainer.tsx` | component (container/composition) | request-response (renders derived state, dispatches events) | itself (current chip row JSX + `handleReset` wiring) | exact — same file, delete a block |
| `src/components/sandbox/chip-scenarios.ts` | utility/data module (deleted) | transform (pure data → `Vessel` literals) | n/a — deletion target | n/a |
| `src/components/sandbox/chip-scenarios.test.ts` | test (deleted) | n/a | n/a — deletion target | n/a |
| `src/components/sandbox/SandboxContainer.test.tsx` | test | request-response (RTL integration test) | itself (existing hysteresis/Reset/save tests in the same file) | exact — same file, replace 2 tests |

**Note on "3-5 analogs" guidance:** this phase intentionally has no *external* analog search — CONTEXT.md/ARCHITECTURE.md are explicit that this is a mechanical rename/generalization of already-existing, already-tested code, not new logic requiring a pattern borrowed from elsewhere in the codebase. The "closest analog" for every file is its own pre-refactor body.

## Pattern Assignments

### `src/components/sandbox/hooks/useSandboxState.ts` (hook, event-driven/CRUD)

**Analog:** itself, current state (full file already read above — 207 lines)

**Imports pattern** (lines 12-28) — REMOVE the `chip-scenarios.js` import, everything else stays:
```typescript
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CHIP_SCENARIOS, type ChipId } from "../chip-scenarios.js"; // ← DELETE this line
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
```

**Return type signature — current** (lines 30-45), showing the two fields/one method that must change per D-01/D-02:
```typescript
export function useSandboxState(initialScenario?: { vesselA: Vessel; vesselB: Vessel }): {
  vesselA: Vessel;
  vesselB: Vessel;
  lastGoodClassification: ClassificationResult;
  isDegenerate: boolean;
  activeChipId: ChipId | null;          // ← DELETE (D-02)
  saveError: string | null;
  isSaving: boolean;
  onVesselPositionChange: (vessel: VesselLabel, position: Position) => void;
  onVesselHeadingChange: (vessel: VesselLabel, heading: number) => void;
  onVesselSpeedChange: (vessel: VesselLabel, speed: number) => void;
  onVesselTypeChange: (vessel: VesselLabel, type: VesselType) => void;
  handleReset: () => void;
  handleChipSelect: (chipId: ChipId) => void;   // ← RENAME/GENERALIZE (D-01) to
                                                  //   loadScenario(vesselA, vesselB): void
  handleSave: () => void;
} {
```

**`activeChipId` state declaration to delete** (lines 87-97):
```typescript
  // Tracks which chip (if any) is the source of the currently-loaded
  // scenario -- purely a client-side visual highlight, cleared by
  // any manual drag/heading/speed/type edit so it never goes stale. ...
  const [activeChipId, setActiveChipId] = useState<ChipId | null>(
    initialScenario ? null : "classic-crossing",
  );
```
Every `setActiveChipId(null)` call inside `onVesselPositionChange`/`onVesselHeadingChange`/`onVesselSpeedChange`/`onVesselTypeChange` (lines 133-163, one call at the top of each of the 4 handler bodies) must also be deleted — these are the only other `activeChipId` touch points besides the declaration and `handleChipSelect`.

**Core pattern — the choke point being generalized** (lines 111-131, `applyVesselUpdate` — UNCHANGED, this is what `loadScenario` wraps, do not touch its body):
```typescript
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
      setIsDegenerate(true);
    }
  }
```

**`handleReset` — current** (lines 165-175), to be refactored per D-03 (delegate to `loadScenario` instead of duplicating the reset-hysteresis-then-apply body):
```typescript
  function handleReset(): void {
    // Reset scenario is a deliberate FULL state reset, including
    // hysteresis -- unlike every other applyVesselUpdate call site above
    // ...
    previousEncounterTypeRef.current = undefined;
    applyVesselUpdate(seedA, seedB);
  }
```

**`handleChipSelect` — current** (lines 177-184), this IS `loadScenario`'s exact body per D-01, minus the `CHIP_SCENARIOS[chipId]` lookup and `setActiveChipId(chipId)` call:
```typescript
  function handleChipSelect(chipId: ChipId): void {
    // Mirrors handleReset()'s exact shape (D-01/D-02: full replace + full
    // hysteresis reset) -- routes through the same applyVesselUpdate choke
    // point every other update site uses, never a parallel state path.
    previousEncounterTypeRef.current = undefined;
    applyVesselUpdate(CHIP_SCENARIOS[chipId].vesselA, CHIP_SCENARIOS[chipId].vesselB);
    setActiveChipId(chipId);
  }
```

**Target shape post-refactor** (per D-01/D-03, ARCHITECTURE.md Pattern 1 — copy this exact shape):
```typescript
  // Single generalized full-replace + hysteresis-reset entry point --
  // every "load a whole new vessel pair" call site (Reset today; Gallery's
  // "Try on Sandbox" bridge starting Phase 17) funnels through this one
  // function rather than each re-implementing the reset-then-apply body.
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
```
Note: `seedA`/`seedB` are already computed once at the top of the hook (lines 63-64) and are in scope for both `handleReset` and the module generally — no new plumbing needed, `handleReset` just references the existing closure variables.

**Return statement — current** (lines 191-206), remove `activeChipId`, rename `handleChipSelect` → `loadScenario`:
```typescript
  return {
    vesselA,
    vesselB,
    lastGoodClassification,
    isDegenerate,
    activeChipId,       // ← DELETE
    saveError,
    isSaving: createScenario.isPending,
    onVesselPositionChange,
    onVesselHeadingChange,
    onVesselSpeedChange,
    onVesselTypeChange,
    handleReset,
    handleChipSelect,   // ← RENAME to loadScenario
    handleSave,
  };
```

**Error handling / validation pattern** (unchanged, reference only): `applyVesselUpdate`'s `VesselSchema.safeParse` guard (lines 112-114) and the degenerate-frame branch (lines 124-130) — `loadScenario` inherits this for free since it calls `applyVesselUpdate` internally, no duplicate validation needed.

---

### `src/components/sandbox/SandboxContainer.tsx` (component, request-response)

**Analog:** itself, current state (full file already read above — 147 lines)

**Imports pattern — current** (lines 15-24), the `chip-scenarios.js` import must be deleted:
```typescript
import { RotateCcw, Link2 } from "lucide-react";
import { ChartPanel } from "./chart/ChartPanel.js";
import { ControlPanel } from "./control-panel/ControlPanel.js";
import { VerdictBanner } from "./reasoning/VerdictBanner.js";
import { InstrumentReadouts } from "./instruments/InstrumentReadouts.js";
import { ReasoningTrail } from "./reasoning/ReasoningTrail.js";
import { CHIP_ORDER } from "./chip-scenarios.js";       // ← DELETE this line
import { useSandboxState } from "./hooks/useSandboxState.js";
import { Button } from "@/components/ui/button";
import type { SandboxContainerProps } from "./types.js";
```

**Chip row JSX block to delete entirely** (lines 82-108):
```tsx
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
```
No replacement JSX — D-05 explicitly says the vertical space simply collapses (`<VerdictBanner/>` at line 110 becomes the next element after `</header>` at line 80).

**Reset button call site — UNCHANGED, no edit needed** (lines 64-67), confirmed by D-05/code_context: `handleReset`'s public signature is untouched, only its internal body changes:
```tsx
            <Button type="button" variant="outline" onClick={sandboxState.handleReset}>
              <RotateCcw aria-hidden="true" />
              Reset scenario
            </Button>
```

**File header comment** (lines 3-13) references "chip-row/reset/save CTAs" — update to drop the chip-row mention once the block is removed, consistent with this repo's "comments explain WHY, not stale references" convention (CLAUDE.md Conventions section).

---

### `src/components/sandbox/chip-scenarios.ts` (utility/data module — DELETE)

**Disposition:** Delete outright per D-04. No analog needed — this is a pure removal, not a refactor target. Verified consumers before deletion (both being edited/removed this phase): `SandboxContainer.tsx` (`CHIP_ORDER` import, chip row JSX) and `useSandboxState.ts` (`CHIP_SCENARIOS`/`ChipId` import, `handleChipSelect`).

**Fixture-preservation cross-reference (informational only, no action needed this phase):** the 3 nontrivial fixtures are already verbatim-preserved in `src/domain/colregs/classify-encounter.fixtures.ts`:
- `sailingHasPriorityVessels` → `crossingSailingPriorityCase` (line 471, comment: "already proven correct against classifyEncounter() by chip-scenarios.test.ts")
- `notUnderCommandVessels` → `crossingNotUnderCommandCase` (line 487, same comment)
- `inDoubtVessels` → `headOnInDoubtCase` (line 509, same comment)
- `classicCrossingVessels` is byte-identical to `crossingResidualBasicCase` (already `useSandboxState.ts`'s own default seed, line 220 of the fixtures file) — no separate preservation needed.
- `headOnMeetingVessels` and `overtakingVessels` have no preserved analog and none is needed (D-04: "simple/undistinguished geometries with no unique derivation value").

---

### `src/components/sandbox/chip-scenarios.test.ts` (test — DELETE)

**Disposition:** Delete outright alongside `chip-scenarios.ts` per D-04 — its only subject (`CHIP_SCENARIOS`/`CHIP_ORDER`) no longer exists. No replacement test needed for this file's content specifically; the 3 nontrivial fixtures' correctness continues to be covered by `classify-encounter.fixtures.ts`'s own consumers in `classify-encounter.test.ts` (unaffected by this phase).

---

### `src/components/sandbox/SandboxContainer.test.tsx` (test, request-response/integration)

**Analog:** itself, current state (full file already read above — 375 lines). Two tests must be replaced (D-06); everything else in this file is unaffected and must keep passing unmodified.

**Test 1 to replace — chip-active regression test** (lines 277-302):
```tsx
  it("does not show any chip as active when a saved/shared scenario is loaded, even though it defaults to Classic crossing on the plain seedless route", () => {
    // Regression test: activeChipId used to default to "classic-crossing"
    // unconditionally, so every /s/[shareId] page showed that chip as
    // active/pressed regardless of the actually-loaded (arbitrary) vessel
    // geometry -- directly contradicting this component's own documented
    // "highlight never goes stale/misleading" contract.
    render(<SandboxContainer />);
    expect(screen.getByRole("button", { name: "Classic crossing" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    cleanup();

    render(
      <SandboxContainer
        initialScenario={{
          vesselA: overtakingBothDirectionsCase.vesselA,
          vesselB: overtakingBothDirectionsCase.vesselB,
        }}
      />,
    );
    for (const chip of screen.getAllByRole("button", { pressed: false })) {
      expect(chip).toHaveAttribute("aria-pressed", "false");
    }
    expect(screen.queryByRole("button", { pressed: true })).not.toBeInTheDocument();
  });
```
This entire test is now moot — there is no chip UI and no `activeChipId` to regress. DELETE, no direct replacement needed (nothing left to assert about chip highlighting). Optionally fold a one-line assertion into the existing D-06 default-mount test (lines 148-154) confirming no chip-row buttons render at all (e.g. `expect(screen.queryByRole("button", { name: "Classic crossing" })).not.toBeInTheDocument()`), satisfying the "Chip-row removal... verify via a repo-wide usage check" pitfall-checklist item at the component-test level, but this is Claude's Discretion per D-06/CONTEXT.md.

**Test 2 to replace — chip-click load test** (lines 358-374), this is the one that needs equivalent coverage exercising `loadScenario()` per D-06:
```tsx
  // D-01/D-02: chip row loads a canned scenario in place, full replace +
  // hysteresis reset, mechanically identical to Reset scenario.
  it("loads the Overtaking chip's fixture scenario when clicked, landing give-way on the fixture's documented vessel", async () => {
    const user = userEvent.setup();
    render(<SandboxContainer />);

    await user.click(screen.getByRole("button", { name: "Overtaking" }));

    const verdictHeading = screen.getByRole("heading", { name: "Overtaking" });
    const verdictCard = verdictHeading.closest('[data-slot="verdict-banner"]') as HTMLElement;
    expect(verdictCard).not.toBeNull();

    // The "Overtaking" chip fixture documents vesselA as the give-way
    // vessel (chip-scenarios.ts) -- its role badge must read "GIVE WAY".
    const vesselABadgeContainer = within(verdictCard).getByText("Vessel A").parentElement;
    expect(vesselABadgeContainer?.textContent).toContain("GIVE WAY");
  });
```
There is no remaining UI call site for `loadScenario()` in this phase (Reset is the only current caller, already covered by the existing "restores the default scenario..." test at lines 219-230, and by the two `initialScenario`-Reset tests at lines 247-275). Per D-06/code_context, replacement coverage should exercise `loadScenario()` directly rather than leave a UI-referencing test in place. Two concrete options for the executor (Claude's Discretion, D-06):
1. **Hook-level unit test** — add/extend a `useSandboxState.test.ts`-style test (check first whether one exists; if not, this file is the closest existing analog for the render-and-assert pattern used above) that calls `renderHook(() => useSandboxState())` and asserts calling `.loadScenario(vesselA, vesselB)` produces the expected `lastGoodClassification`/`isDegenerate`/hysteresis-reset behavior, mirroring the assertions already made about `handleReset` in this file (lines 219-230) but driving `loadScenario` with an arbitrary vessel pair (e.g. `overtakingBothDirectionsCase`, already imported in this file) instead of the seed pair.
2. **Extend the existing Reset-with-`initialScenario` test** (lines 247-275) — since `handleReset` now delegates to `loadScenario` (D-03), that test already exercises `loadScenario` indirectly; strengthen its assertions/comment to explicitly note it is proving `loadScenario`'s full-replace + hysteresis-reset contract, not just "Reset works." This is the lower-effort option and requires no new render pass.

Either way, the test's asserted behavior (full vessel-pair replace + `previousEncounterTypeRef` reset landing on the correct verdict) is identical to what the deleted test proved — only the entry point (`loadScenario` called directly/via Reset) changes, not the underlying behavior being verified.

**Imports this file already has that remain relevant to the replacement test(s)** (lines 15-25): `render`, `screen`, `within`, `cleanup`, `act` from RTL; `overtakingBothDirectionsCase`/`crossingResidualBasicCase` from `classify-encounter.fixtures.js` — no new imports needed regardless of which replacement option is chosen, since both existing fixtures already provide a distinct-from-default vessel pair.

---

## Shared Patterns

### Single choke point: `applyVesselUpdate()`
**Source:** `src/components/sandbox/hooks/useSandboxState.ts`, lines 111-131
**Apply to:** `loadScenario()` (new), `handleReset()` (refactored), and all 4 existing `onVessel*Change` handlers (untouched).
Every vessel-mutation entry point must call `applyVesselUpdate(nextA, nextB)` — never re-implement `VesselSchema.safeParse` + `classifyEncounter()` + degenerate-branch logic inline at a new call site. This is the invariant ARCHITECTURE.md's Data Flow section and PITFALLS.md's "orphaned code" entry both anchor on.

### Full-replace + hysteresis-reset variant: `loadScenario()`
**Source:** current `handleChipSelect()` body, `useSandboxState.ts` lines 177-184 (post-refactor: the new `loadScenario()` function)
**Apply to:** `handleReset()` only, this phase. (Phase 17's Gallery bridge becomes a second caller later — not in scope now, do not build for it yet.)
```typescript
function loadScenario(nextA: Vessel, nextB: Vessel): void {
  previousEncounterTypeRef.current = undefined;
  applyVesselUpdate(nextA, nextB);
}
```

### No-duplicated-near-identical-logic convention
**Source:** CLAUDE.md Conventions section ("no duplicated JSX for near-identical instances" — same spirit extended to logic by D-03's own rationale)
**Apply to:** `handleReset()` — must delegate to `loadScenario()`, not re-declare `previousEncounterTypeRef.current = undefined; applyVesselUpdate(seedA, seedB);` as a second, separately-maintained copy of the same 2-line body.

### Orphaned-code check (closeout gate, not a code pattern per se)
**Source:** `.planning/research/PITFALLS.md`, Technical Debt Patterns table row 1 and "Looks Done But Isn't" checklist item "Chip-row removal"
**Apply to:** phase closeout — run a repo-wide grep for `chip-scenarios`, `CHIP_SCENARIOS`, `CHIP_ORDER`, `ChipId`, `activeChipId`, `handleChipSelect` after all edits land; expect zero hits outside `.planning/` docs and git history. This is the acceptance gate for D-02/D-04, not something to encode as source, but the planner should include it as an explicit verification step in the phase's plan.

## No Analog Found

None — every file this phase touches is a refactor/deletion of existing, already-read code; there is no net-new file requiring an external analog search.

## Metadata

**Analog search scope:** `src/components/sandbox/**` (own current implementation only — no external codebase search needed per this phase's refactor-only scope)
**Files scanned:** `useSandboxState.ts`, `SandboxContainer.tsx`, `chip-scenarios.ts`, `chip-scenarios.test.ts`, `SandboxContainer.test.tsx`, `types.ts`, `classify-encounter.fixtures.ts` (targeted grep for preserved-fixture cross-reference only)
**Pattern extraction date:** 2026-07-25
