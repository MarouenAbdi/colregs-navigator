---
phase: 16-sandbox-mutation-path-generalization
reviewed: 2026-07-25T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - src/components/sandbox/hooks/useSandboxState.ts
  - src/components/sandbox/SandboxContainer.tsx
  - src/components/sandbox/SandboxContainer.test.tsx
findings:
  critical: 1
  warning: 2
  info: 2
  total: 5
status: issues_found
---

# Phase 16: Code Review Report

**Reviewed:** 2026-07-25
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Reviewed `useSandboxState.ts` (the extracted state hook), `SandboxContainer.tsx` (now
JSX-only composition), and `SandboxContainer.test.tsx` (integration coverage) for the
mutation-path-generalization phase. `SandboxContainer.tsx` is clean — it is purely
declarative wiring with no logic bugs found. The test file exercises the intended
behaviors (default mount, live re-classification, Pitfall 5 degenerate handling, Rule
13(d) hysteresis, reset, save/redirect) with no reliability-affecting issues.

`useSandboxState.ts` has one real crash risk: the lazy `useState` initializer for
`lastGoodClassification` performs an unchecked type assertion on a `Result<T>` that can
legitimately be the `{ ok: false }` variant, and unlike the equivalent situation already
handled defensively in `scenario-service.ts` (`getScenario`/`listGallery`), there is no
fallback here — the failure mode is an uncaught `TypeError` during render with no
`ErrorBoundary` in this codebase to catch it. Additionally, the four
`onVessel*Change` handlers duplicate the same ternary-based next-state construction
four times, which is a missed opportunity given this phase's explicit goal of
generalizing the mutation path.

## Critical Issues

### CR-01: Unchecked `Result` cast in the lazy initializer can crash the entire render tree

**File:** `src/components/sandbox/hooks/useSandboxState.ts:74-89`

**Issue:** The lazy initializer for `lastGoodClassification` asserts the result of
`classifyEncounter(seedA, seedB)` is always `{ ok: true, value }`:

```ts
const [lastGoodClassification, setLastGoodClassification] = useState<ClassificationResult>(
  () => {
    const initialResult = classifyEncounter(seedA, seedB) as {
      ok: true;
      value: ClassificationResult;
    };
    return initialResult.value;
  },
);
```

`classifyEncounter` returns `Result<ClassificationResult>` (`src/domain/shared/result.ts`),
whose failure variant is `{ ok: false; reason; details? }` — it has no `.value` property.
If `seedA`/`seedB` (from `initialScenario` — a saved/shared scenario, or the default
fixture) ever produce a degenerate classification, `initialResult.value` silently
evaluates to `undefined` at runtime (the cast suppresses the type error, it doesn't
change the runtime shape), so `lastGoodClassification` becomes `undefined`. The very
next line then unconditionally dereferences it:

```ts
const previousEncounterTypeRef = useRef<EncounterType | undefined>(
  lastGoodClassification.encounterType,   // TypeError: Cannot read properties of undefined
);
```

This throws during the hook's own execution, on the initial render, before any
`isDegenerate` handling can kick in. There is no `ErrorBoundary`/`error.tsx` in this
codebase (verified: no matches for `ErrorBoundary`/`componentDidCatch` under `src/app`),
so this is an unrecoverable crash of the whole page rather than the intended
`isDegenerate` degraded-but-functional UI.

The comment justifies safety by pointing to `createScenario`'s dry-run validation
(`scenario-service.ts`), but that invariant is enforced in a different file, at a
different point in time, and depends on `classifyEncounter`'s degenerate-detection logic
never changing in a way that reclassifies previously-valid persisted data as degenerate
(e.g. a future tightening of the doubt-band or CPA/TCPA thresholds, or a scenario created
before a rule change). Notably, `scenario-service.ts`'s own `getScenario`/`listGallery`
treat this exact same "should be unreachable" case defensively (`if (!result.ok) throw
new TRPCError(...)`) rather than casting past it — this file is the one place the same
invariant is trusted unconditionally.

**Fix:** Check `.ok` instead of casting, and fall back to a degenerate initial state
rather than crashing:

```ts
const initialResult = classifyEncounter(seedA, seedB);
const [lastGoodClassification, setLastGoodClassification] = useState<
  ClassificationResult | undefined
>(initialResult.ok ? initialResult.value : undefined);
const [isDegenerate, setIsDegenerate] = useState<boolean>(!initialResult.ok);

const previousEncounterTypeRef = useRef<EncounterType | undefined>(
  lastGoodClassification?.encounterType,
);
```

(This also requires widening `lastGoodClassification`'s type to `ClassificationResult |
undefined` in the hook's return type and updating `SandboxContainer`/`VerdictBanner` to
handle the `undefined` case — the same "Unable to classify" path Pitfall 5 already
renders for mid-session degenerate drags.)

## Warnings

### WR-01: Four mutation handlers duplicate the same next-state construction instead of being generalized

**File:** `src/components/sandbox/hooks/useSandboxState.ts:119-145`

**Issue:** `onVesselPositionChange`, `onVesselHeadingChange`, `onVesselSpeedChange`, and
`onVesselTypeChange` are four near-identical functions, each doing the same
"which-vessel ternary + spread one field" shape:

```ts
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
// ...same shape again for speed and type
```

This phase's stated purpose is generalizing the sandbox's mutation path around a single
choke point (`applyVesselUpdate`), and `applyVesselUpdate` itself is a good example of
that. But the four call sites feeding it still duplicate the exact same
which-vessel-gets-the-patch logic four times — a partial generalization. This is the
same category of risk CLAUDE.md calls out for duplicated JSX ("a bug fixed in one
vessel's block but not the other would have been invisible until someone dragged the
second vessel") — here, a future fifth field (or a fix to the ternary logic) has four
places to update in lockstep instead of one.

**Fix:** Collapse to one generic patcher:

```ts
function patchVessel<K extends keyof Vessel>(vessel: VesselLabel, key: K, value: Vessel[K]): void {
  applyVesselUpdate(
    vessel === "vesselA" ? { ...vesselA, [key]: value } : vesselA,
    vessel === "vesselB" ? { ...vesselB, [key]: value } : vesselB,
  );
}

const onVesselPositionChange = (vessel: VesselLabel, position: Position) =>
  patchVessel(vessel, "position", position);
const onVesselHeadingChange = (vessel: VesselLabel, heading: number) =>
  patchVessel(vessel, "heading", heading);
const onVesselSpeedChange = (vessel: VesselLabel, speed: number) =>
  patchVessel(vessel, "speed", speed);
const onVesselTypeChange = (vessel: VesselLabel, type: VesselType) =>
  patchVessel(vessel, "type", type);
```

### WR-02: Next state is derived from render-scoped closures rather than a functional updater

**File:** `src/components/sandbox/hooks/useSandboxState.ts:97-145`

**Issue:** `applyVesselUpdate` and all four `onVessel*Change` handlers read `vesselA`/
`vesselB` from the hook's render closure and call `setVesselA(nextA)`/`setVesselB(nextB)`
with a directly-computed value rather than an updater function
(`setVesselA(prev => ...)`). Today this happens to be safe because every real call site
(`useHullDrag`'s `onPointerMove`, `ControlPanel`'s slider `onChange`, `Reset`) fires once
per discrete browser/user-gesture event, each of which triggers a full React commit
before the next fires. But if two of these handlers are ever invoked back-to-back within
the same synchronous task (e.g. a future drag gesture that updates both position and
heading in one pointer-move handler, or a batched multi-field form submit), the second
call would compute its "next" vessel from the same stale `vesselA`/`vesselB` the first
call started from, silently discarding whichever field the first call had just set. This
is exactly the kind of landmine that tends to surface later as an intermittent,
hard-to-repro bug once a new call site is added (this file's own comments flag Phase 17
as adding a new "Try on Sandbox" call site through `loadScenario`, so more call sites are
explicitly expected here).

**Fix:** Use the functional form so every update composes correctly regardless of
batching:

```ts
function applyVesselUpdate(nextA: Vessel, nextB: Vessel): void {
  const parsedA = VesselSchema.safeParse(nextA);
  const parsedB = VesselSchema.safeParse(nextB);
  if (!parsedA.success || !parsedB.success) return;

  setVesselA(nextA);
  setVesselB(nextB);
  // ... unchanged
}

function onVesselPositionChange(vessel: VesselLabel, position: Position): void {
  setVesselA((prevA) => {
    setVesselB((prevB) => {
      const nextA = vessel === "vesselA" ? { ...prevA, position } : prevA;
      const nextB = vessel === "vesselB" ? { ...prevB, position } : prevB;
      applyVesselUpdate(nextA, nextB);
      return prevB; // classification/validation owns the real setVesselB call
    });
    return prevA;
  });
}
```

(The nesting above is awkward specifically because `applyVesselUpdate` both validates
and sets state together — a cleaner fix is to split "compute candidate next state" from
"validate + commit", but the core point stands: today's direct-value pattern is only
safe by coincidence of current call-site timing, not by construction.)

## Info

### IN-01: Hook's return type is a large inline literal, duplicated against the return statement

**File:** `src/components/sandbox/hooks/useSandboxState.ts:29-43` and `169-183`

**Issue:** `useSandboxState`'s return type is written out in full as an inline object
type on the function signature (lines 30-43), then the same 13 property names are
repeated in the `return { ... }` statement at the bottom (lines 169-183). Any future
property rename/addition/removal needs to be kept in sync manually in two places with no
compiler help beyond the final assignment check.

**Fix:** Extract a named type once and reuse it:

```ts
export interface SandboxState {
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
}

export function useSandboxState(initialScenario?: { vesselA: Vessel; vesselB: Vessel }): SandboxState {
```

### IN-02: Stale `saveError` isn't cleared by subsequent vessel edits

**File:** `src/components/sandbox/hooks/useSandboxState.ts:47-55, 164-167`

**Issue:** `saveError` is only cleared at the start of the next `handleSave` call
(`setSaveError(null)` at line 165). If a save fails (e.g. transient server error) and the
user then drags a vessel to a different, clearly valid configuration, the old error
message (`"Couldn't save this scenario. Try again."`) keeps rendering under the header
until the user clicks Save again — even though the state that caused the failure no
longer exists. This isn't incorrect, but it's a rough edge for a "recomputes live" UX.

**Fix:** Clear `saveError` inside `applyVesselUpdate` (or wherever vessel state
mutates), not only at the start of `handleSave`:

```ts
function applyVesselUpdate(nextA: Vessel, nextB: Vessel): void {
  ...
  setVesselA(nextA);
  setVesselB(nextB);
  setSaveError(null);
  ...
}
```

---

_Reviewed: 2026-07-25_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
