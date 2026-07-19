# Phase 8: Sandbox - Pattern Map

**Mapped:** 2026-07-18
**Files analyzed:** 14 (7 modified/restyled, 5 new, 2 CSS/config touch-points)
**Analogs found:** 14 / 14 (all files have at least a role-match analog; every file is either an existing file being restyled in place, or has a strong same-repo precedent)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/components/sandbox/SandboxContainer.tsx` (restyle + new chip wiring) | controller/container (client) | event-driven (state owner) | itself (existing file, in-place restyle) + `src/components/hero/Hero.tsx` (shadcn layout composition) | exact (self) / role-match (layout) |
| `src/components/sandbox/ControlPanel.tsx` (restyle: native `<select>`/`<input>` → shadcn `Select`/`Slider`) | component (form) | request-response (controlled form) | itself (existing file) + shadcn `Select`/`Slider` API from `08-RESEARCH.md` Code Examples | exact (self, structure) / role-match (new primitive API) |
| `src/components/sandbox/ChartPanel.tsx` (restyle: hex-literal re-theme only) | component (SVG chart) | event-driven (drag/rotate) | itself (existing file, in-place restyle) | exact |
| `src/components/sandbox/ReasoningPanel.tsx` (split into 3 sub-components) | component (presentational) | transform (derive+render) | itself (existing file, to be split) + `src/components/hero/HeroPreviewCard.tsx` (Card/Badge composition over a `ClassificationResult`) | exact (self) / role-match (composition) |
| `src/components/sandbox/VerdictBanner.tsx` (NEW — split out of ReasoningPanel) | component (presentational) | transform | `HeroPreviewCard.tsx` lines 129-146 (Card + Badge + verdict text over a `classification`) | role-match |
| `src/components/sandbox/InstrumentReadouts.tsx` (NEW) | component (presentational) | transform (derives from geometry fns) | `HeroPreviewCard.tsx` lines 248-263 (3-tile readout grid, same RANGE/BEARING/CPA labels+format) | role-match (strong — near-identical grid) |
| `src/components/sandbox/ReasoningTrail.tsx` (NEW — split out of ReasoningPanel) | component (presentational) | transform (renders `classification.trail`) | itself's own current `<ol>` block in `ReasoningPanel.tsx` lines 132-142 | exact |
| `src/components/sandbox/instrument-readouts.ts` (NEW, pure) | utility | transform | `src/components/hero/hero-preview-geometry.ts` (pure, framework-free geometry helper module, Phase 7 precedent) | role-match |
| `src/components/sandbox/status-pill.ts` (NEW, pure) | utility | transform | `src/components/sandbox/vessel-role.ts` (small pure derivation fn keyed off `ClassificationResult`) | role-match |
| `src/components/sandbox/chip-scenarios.ts` (NEW, pure fixture data) | model/fixture | transform | `src/domain/colregs/classify-encounter.fixtures.ts` (Vessel-pair literal + worked-math comment pattern) + `src/components/hero/hero-preview-fixture.ts` (Phase 7's own sandbox-adjacent, non-domain fixture-module precedent) | role-match (strong — D-03 explicitly names both as the precedent) |
| `src/components/sandbox/vessel-role.ts` (EXTEND — consolidate badge/hull/label maps) | utility | transform | itself (existing file) | exact |
| `src/components/sandbox/types.ts` (EXTEND — widen props for `vesselA`/`vesselB` on readouts) | model (types) | n/a | itself (existing file) | exact |
| `src/components/sandbox/CopyLinkButton.tsx` (restyle to icon button) | component | request-response | itself (existing file) + `src/components/layout/Header.tsx` (existing icon-only `Button` composition pattern) | exact (self) / role-match (icon button) |
| `app/globals.css` (EXTEND — add `--color-give-way`/`--color-stand-on`/`--color-mutual`/`--color-rule-accent`(/optionally `--color-doubt`/`--color-geometry`) tokens) | config (design tokens) | n/a | itself (existing file, `@theme inline` + `:root`/`.dark` block pattern already established in Phase 6) | exact |
| `src/components/sandbox/ControlPanel.test.tsx` (rewrite for Select/Slider) | test | request-response | itself (existing file) + `08-RESEARCH.md` Code Examples "Test rewrite pattern" | exact (self, needs a real interaction-pattern rewrite) |
| `src/components/sandbox/SandboxContainer.test.tsx` / `ReasoningPanel.test.tsx` (update for restyle + chip click) | test | event-driven | itself (existing files) | exact |

## Pattern Assignments

### `src/components/sandbox/SandboxContainer.tsx` (controller/container, event-driven)

**Analog:** itself (in-place restyle) — the state-management/choke-point logic (`applyVesselUpdate`, `handleReset`, `previousEncounterTypeRef`) is locked and must NOT change; only the returned JSX changes.

**Existing choke-point pattern to preserve exactly** (`SandboxContainer.tsx` lines 84-104):
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

**New `handleChipSelect` — mirror `handleReset()` exactly** (`SandboxContainer.tsx` lines 134-142), per D-02:
```typescript
function handleReset(): void {
  previousEncounterTypeRef.current = undefined;
  applyVesselUpdate(seedA, seedB);
}
// New sibling, same shape, sourced from chip-scenarios.ts instead of seedA/seedB:
function handleChipSelect(chipId: ChipId): void {
  const { vesselA: chipA, vesselB: chipB } = CHIP_SCENARIOS[chipId];
  previousEncounterTypeRef.current = undefined;
  applyVesselUpdate(chipA, chipB);
  setActiveChipId(chipId); // new local state, cleared on any non-chip-originated update
}
```

**Layout restructure — replace the current 3-equal-column flex row** (`SandboxContainer.tsx` lines 145-197, specifically the `<div className="flex flex-row gap-8 items-start">` wrapper) **with the 2-col grid + full-width controls row** per `08-UI-SPEC.md` Layout section:
```tsx
<div className="grid grid-cols-1 gap-4 min-[900px]:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
  <ChartPanel {...chartProps} />
  <div className="flex flex-col gap-4">
    <InstrumentReadouts vesselA={vesselA} vesselB={vesselB} classification={lastGoodClassification} />
    <ReasoningTrail classification={lastGoodClassification} isDegenerate={isDegenerate} />
  </div>
</div>
<div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
  <VesselControlCard label="vesselA" ... />
  <VesselControlCard label="vesselB" ... />
</div>
```
`VerdictBanner` renders full-width, above this grid (see UI-SPEC Layout item 3) — a real, direct-image-confirmed placement, not inside the reasoning column.

**Header restyle (D-07/Pitfall S3)** — remove `<h1>COLREGS Navigator</h1>` (redundant with global `Header.tsx`), keep Save (`createScenario.mutate`) but relocate to a small icon button using the `Header.tsx` icon-button-in-`Button` pattern (see CopyLinkButton section below), placed immediately left of "Reset scenario":
```tsx
<div className="flex items-center gap-2">
  <Button variant="outline" size="icon-sm" aria-label="Save and share this scenario" onClick={() => createScenario.mutate({ vesselA, vesselB })} disabled={createScenario.isPending}>
    <Link2 aria-hidden="true" />
  </Button>
  <Button variant="outline" onClick={handleReset}>
    <RotateCcw aria-hidden="true" />
    Reset scenario
  </Button>
</div>
```

---

### `src/components/sandbox/ControlPanel.tsx` (component/form, request-response)

**Analog:** itself (`VesselFormSection`'s prop-driven, controlled-component shape stays; only the JSX for the two fields changes) + `08-RESEARCH.md` Code Examples for the exact shadcn `Select`/`Slider` API.

**Current native pattern to replace** (`ControlPanel.tsx` lines 38-61):
```tsx
<input type="number" min={0} max={40} step={1} value={vessel.speed}
  onChange={(e) => onVesselSpeedChange(label, Number(e.target.value))} .../>
<select value={vessel.type} onChange={(e) => onVesselTypeChange(label, e.target.value as VesselType)}>
  {VesselTypeSchema.options.map((type) => <option key={type} value={type}>{VESSEL_TYPE_LABELS[type]}</option>)}
</select>
```

**New shadcn pattern** (verified via Context7 `/shadcn-ui/ui`, `08-RESEARCH.md` Code Examples):
```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

<Slider value={[vessel.speed]} min={0} max={40} step={1}
  onValueChange={([speed]) => onVesselSpeedChange(label, speed)} />
{/* live numeric readout stays a separate <span>, Body role 16px/600 mono, text-primary per UI-SPEC */}

<Select value={vessel.type} onValueChange={(type) => onVesselTypeChange(label, type as VesselType)}>
  <SelectTrigger id={`${label}-type`} className="w-full">
    <SelectValue placeholder="Vessel type" />
  </SelectTrigger>
  <SelectContent>
    {VesselTypeSchema.options.map((type) => (
      <SelectItem key={type} value={type}>{VESSEL_TYPE_LABELS[type]}</SelectItem>
    ))}
  </SelectContent>
</Select>
```
`VESSEL_TYPE_LABELS` (lines 10-16) and the `VesselFormSection` prop contract stay unchanged — the source of truth for option values is still `VesselTypeSchema.options`, per the existing "never hand-author a parallel list" comment (line 6-9).

**Card wrapper per UI-SPEC** (letter-chip + heading + role badge in the header row) — new markup around the existing `VesselFormSection`, composing `Card`/`CardHeader`/`CardContent` (see `card.tsx` primitive below) and the consolidated `vessel-role.ts` badge map.

---

### `src/components/sandbox/ChartPanel.tsx` (SVG chart, event-driven drag/rotate)

**Analog:** itself — this is almost entirely a "leave the logic alone, re-theme the paint values" restyle. Do NOT touch `HULL_POINTS`, drag-hook wiring, or any `pointer-events`-relevant fill/stroke going to `"none"`.

**What genuinely still needs changing** (per `08-RESEARCH.md` Pitfall S1 table — do not trust `PITFALLS.md`'s stale example list):
```typescript
// ChartPanel.tsx line 77 — NOT YET addressed:
const BEARING_LINE_DEFAULT_STROKE = "#475569"; // -> should become var(--color-geometry) or stay, verify contrast
// line 78 — NOT YET addressed either way, contrast-verify:
const DOUBT_STROKE = "#F59E0B";
// line 181 — inline, NOT a named const, easy to miss:
<line ... stroke="#94A3B8" /> // rotate-handle stalk
// line 222 — inline, NOT a named const:
<circle ... stroke="#0D9488" /> // rotate-handle ring — KEEP this exact hex, but reference the new --color-rule-accent token instead of a bare literal (UI-SPEC's explicit "keep distinct" decision)
// line 323 — mixed raw hex + semantic token, should become one semantic token:
className="bg-[#0B0B0E] border border-border rounded"
```
**Already correctly re-themed (do not re-touch, do not assume it's still broken):**
```typescript
const GRID_STROKE = "#27272A"; // has "was slate-200" comment — already done
const CONE_DEFAULT_STROKE = "#3F3F46"; // has "was slate-300" comment — already done
```
**Verify before/after with:** `grep -n '#[0-9A-Fa-f]\{3,6\}' src/components/sandbox/ChartPanel.tsx` — re-run fresh at implementation time, do not trust any prior list verbatim.

**Hull fill / role-badge text — consolidate into `vessel-role.ts`, not left in `ChartPanel.tsx`** (lines 40-44, 71-75):
```typescript
const HULL_FILL_CLASS: Record<VesselRole, string> = {
  "give-way": "fill-red-500",
  "stand-on": "fill-green-500",
  mutual: "fill-slate-400",
};
const ROLE_BADGE_TEXT: Record<VesselRole, string> = { "give-way": "GW", "stand-on": "SO", mutual: "MUTUAL" };
```
Move both to `vessel-role.ts` using the new `--color-give-way`/`--color-stand-on`/`--color-mutual` tokens (e.g. `fill-give-way`/`fill-stand-on`/`fill-mutual`), imported by both `ChartPanel.tsx` and the new `ReasoningTrail`/`VerdictBanner` components — see Shared Patterns below.

**Chart "1 NM" scale-bar legend (NEW, per UI-SPEC)** — small addition inside the existing `<div ref={containerRef}>` wrapper (lines 319-378), bottom-left absolute-positioned `<span>` + a short `<line>` matching `--border`, Label role 13px/600 mono `--muted-foreground` — no new geometry module needed, a fixed pixel offset is sufficient since `CHART_VIEW_BOX` is fixed at 20nm x 20nm (line 35).

---

### `src/components/sandbox/ReasoningPanel.tsx` → split into `VerdictBanner.tsx` / `InstrumentReadouts.tsx` / `ReasoningTrail.tsx`

**Analog:** itself (the trail-rendering `<ol>` block, lines 132-142) + `src/components/hero/HeroPreviewCard.tsx` (Card/Badge composition over a `ClassificationResult`-shaped object, lines 129-146 and 248-263).

**Verdict banner — analog from `HeroPreviewCard.tsx` lines 130-146** (Card + accent-tinted verdict strip + `Badge`):
```tsx
<div className="mt-3 flex items-center gap-2.5 rounded-md border border-primary/30 bg-primary/10 px-3 py-2.5">
  <Badge className="h-auto bg-primary px-1.75 py-0.75 text-[10px] text-primary-foreground">Rule 15</Badge>
  <span className="text-[15px] font-semibold text-foreground">{verdictText}</span>
</div>
```
Adapt to full-width `Card` per UI-SPEC (rule badge uses `--color-rule-accent`, not `--primary`, per the UI-SPEC's explicit "never use rule-accent for `--primary`'s job and vice-versa" rule), title reuses **Heading role** (`text-2xl font-semibold leading-[1.25]`, replacing the current `text-[28px] font-semibold` at `ReasoningPanel.tsx` line 107/114), and 2 role badges beneath (see Shared Patterns — `vessel-role.ts` consolidation) instead of the current inline `ROLE_BADGE` map (lines 29-33, 117-130) which must be deleted from this file, not merely restyled in place.

**Existing verdict-derivation logic to preserve exactly** (`ReasoningPanel.tsx` lines 81-88, `ENCOUNTER_TYPE_TITLE` lines 18-22) — reuse verbatim in the new `VerdictBanner.tsx`:
```typescript
const ENCOUNTER_TYPE_TITLE: Record<string, string> = { "head-on": "Head-on", crossing: "Crossing", overtaking: "Overtaking" };
function verdictBannerText(classification: ReasoningPanelProps["classification"]): string {
  const encounterTitle = ENCOUNTER_TYPE_TITLE[classification.encounterType];
  const verdictClause = classification.giveWay === null && classification.standOn === null
    ? "mutual obligation"
    : `${VESSEL_LABEL_TEXT[classification.giveWay as string]} gives way`;
  return `${encounterTitle} — ${verdictClause}`;
}
```

**Instrument readouts — analog from `HeroPreviewCard.tsx` lines 248-263** (near-identical 3-tile grid, extend to 2×2 + status pill):
```tsx
<div className="rounded-md border border-border px-2.5 py-2.25">
  <div className="font-mono text-[9.5px] font-semibold tracking-wide text-muted-foreground uppercase">RANGE</div>
  <div className="mt-0.75 font-mono text-[15px] font-semibold text-foreground">{`${range.toFixed(2)} NM`}</div>
</div>
```
Add a 4th tile (TCPA) to make 2×2, source all 4 values from the new `instrument-readouts.ts` module (see below), and append the status pill (from `status-pill.ts`) as the last child inside the same `Card` (UI-SPEC: "status pill is NOT a separate card").

**Reasoning trail — existing block to restyle, keep content/order/logic unchanged** (`ReasoningPanel.tsx` lines 132-142):
```tsx
<ol className="flex flex-col gap-2">
  {classification.trail.map((entry, index) => (
    <li key={`${entry.ruleId}-${index}`} className="flex flex-col gap-0.5">
      <div className="flex gap-2 items-baseline">
        <span className="text-sm font-semibold">{entry.ruleId}</span>
        <span className="text-base font-normal">{entry.text}</span>
      </div>
      <FactReadout facts={entry.facts} />
    </li>
  ))}
</ol>
```
`FactReadout`/`FACT_LABEL`/`formatFactValue` (lines 37-79) stay as-is — only the outer numbered-circle/tag/connecting-line chrome around each `<li>` is new, per UI-SPEC's tone-per-position table (GEOMETRY/rule-id/VERDICT). `classification.trail.length` drives step count — never hardcode 3 (Anti-Pattern from RESEARCH.md).

**Doubt caveat — unchanged, reuse verbatim** (`ReasoningPanel.tsx` lines 90-95, 144-146):
```typescript
const DOUBT_CAVEAT_TEXT: Record<string, string> = {
  "near-overtaking-crossing-boundary": "Near the overtaking/crossing boundary (112.5° abaft the beam) — this verdict may flip with a small heading change.",
  "near-head-on-boundary": "Near the head-on boundary (reciprocal heading) — this verdict may flip with a small heading change.",
};
```

**Degenerate state — unchanged copy, reuse verbatim** (`ReasoningPanel.tsx` lines 105-112, matches `08-UI-SPEC.md`'s Copywriting Contract "Error/degenerate state" row exactly):
```tsx
<p className="text-[28px] font-semibold">Unable to classify</p>
<p className="text-base font-normal">
  Vessel A and Vessel B are at the same position — drag one apart to resume live classification.
</p>
```

---

### `src/components/sandbox/instrument-readouts.ts` (NEW, pure utility, transform)

**Analog:** `src/components/hero/hero-preview-geometry.ts` (Phase 7's precedent for a pure, framework-free geometry-derivation module, zero JSX, exported constants/functions only).

**Full recommended implementation** (from `08-RESEARCH.md` Code Examples, cross-verified against `src/domain/geometry/relative-bearing.ts`/`cpa.ts`'s actual `Result<T>` shapes read directly above):
```typescript
import { relativeBearing } from "../../domain/geometry/relative-bearing.js";
import { cpa } from "../../domain/geometry/cpa.js";
import type { Vessel } from "../../domain/vessel/vessel.js";

export interface InstrumentReadouts {
  rangeNm: number;
  bearingAtoBDegrees: number | null;
  cpaNm: number | null;
  tcpaMinutes: number | null;
}

export function deriveInstrumentReadouts(vesselA: Vessel, vesselB: Vessel): InstrumentReadouts {
  const rangeNm = Math.hypot(
    vesselB.position.x - vesselA.position.x,
    vesselB.position.y - vesselA.position.y,
  );
  const bearingResult = relativeBearing(vesselA, vesselB);
  const cpaResult = cpa(vesselA, vesselB);
  return {
    rangeNm,
    bearingAtoBDegrees: bearingResult.ok ? bearingResult.value : null,
    cpaNm: cpaResult.ok ? cpaResult.value.dcpaNm : null,
    tcpaMinutes: cpaResult.ok ? cpaResult.value.tcpaMinutes : null,
  };
}
```
**Import path note:** this module lives in `src/components/sandbox/`, so the relative path to domain modules is `../../domain/...` (two levels up), matching every other sandbox file's existing import depth (confirmed in `SandboxContainer.tsx` lines 19-32, `ChartPanel.tsx` lines 22-30). Do NOT scan `classification.trail[].facts` instead — see Anti-Patterns in RESEARCH.md (sticky-overtaking has `facts: {}`, no-closure CPA never attaches `tcpaMinutes`/`dcpaNm` to any trail entry, and Range has no source in `facts` under any path).

**Requires widening props** (`types.ts` — see below) since the component rendering this needs `vesselA`/`vesselB`, which `ReasoningPanelProps` currently lacks (`types.ts` lines 35-38).

---

### `src/components/sandbox/status-pill.ts` (NEW, pure utility, transform)

**Analog:** `src/components/sandbox/vessel-role.ts` (small, single-purpose pure function keyed off `ClassificationResult`/booleans, zero JSX — exact same shape).

```typescript
export function statusPillCopy(riskOfCollision: boolean, cpaNm: number | null): { text: string; tone: "clear" | "risk" } {
  const cpaText = cpaNm !== null ? `${cpaNm.toFixed(2)} NM` : "—";
  return riskOfCollision
    ? { text: `Risk of collision — CPA ${cpaText} on present courses.`, tone: "risk" }
    : { text: `Passing clear — CPA ${cpaText} on present courses.`, tone: "clear" };
}
```
Copy is locked by `08-UI-SPEC.md`'s Copywriting Contract table (verbatim for the "clear" tone; `[ASSUMED]` but now spec-approved for "risk"). `cpaNm === null` → `"—"` placeholder, matching the existing "Unable to classify" degenerate-state convention already used in `ReasoningPanel.tsx`.

---

### `src/components/sandbox/chip-scenarios.ts` (NEW, fixture/model, transform)

**Analog:** `src/domain/colregs/classify-encounter.fixtures.ts` (`Vessel`-pair literal + inline worked-math derivation comment pattern) — explicitly named as the pattern to mirror by both `08-CONTEXT.md`'s Reusable Assets section and `08-RESEARCH.md`. Also mirrors `src/components/hero/hero-preview-fixture.ts` (Phase 7's own non-domain, sandbox-adjacent fixture module, D-07 precedent explicitly cited in D-03).

**Fixture-literal shape to copy** (`classify-encounter.fixtures.ts` lines 42-60 — `Vessel` object pairs, no schema wrapper, plain `as const` type literals, comment documents the exact `relativeBearing`/`cpa` derivation above each fixture):
```typescript
// vesselA is being overtaken (heading 000, speed 8); vesselB approaches
// from 150 deg relative bearing... relativeBearing(A,B) = 150. cpa(A,B):
// tcpaMinutes ~= 7.42, dcpaNm ~= 0.5 (under threshold -> risk holds).
export const overtakingBothDirectionsCase: ClassificationCase = {
  vesselA: { position: { x: 0, y: 0 }, heading: 0, speed: 8, type: "power-driven" },
  vesselB: { position: { x: 0.5, y: -0.8660254 }, heading: 0, speed: 15, type: "power-driven" },
  expectedEncounterType: "overtaking",
  ...
};
```
**The 6 chip fixtures themselves (exact values, fully worked and cross-verified) are already provided in `08-RESEARCH.md`'s "Code Examples" section** ("The two genuinely new chip fixtures" + "Remaining chips — reuse existing... zero new derivation") — copy those literals verbatim into this new file, with a `label`/`chipId`/`rule` lookup wrapper. Do NOT import from `classify-encounter.fixtures.ts` itself (D-03: sandbox-local, standalone copies only) — re-type the position/heading/speed/type values as new local literals.

**Fixture-invariant guard pattern to copy from `HeroPreviewCard.tsx` lines 82-90** (the "fixture is fixed at authoring time, so a classify failure is a developer bug, not a runtime state" precedent):
```typescript
const result = classifyEncounter(heroPreviewVesselA, heroPreviewVesselB);
if (!result.ok) {
  throw new Error("Hero preview fixture failed to classify -- fixture is broken");
}
```
Apply the same "fixture failure throws, does not silently degrade" contract when a chip's fixture is classified client-side inside `SandboxContainer`/`chip-scenarios.ts` consumers — these are also fixed, developer-authored literals, never user input.

---

### `src/components/sandbox/vessel-role.ts` (EXTEND, utility, transform)

**Analog:** itself — existing file, already the single canonical source for role derivation (`getVesselRole`); this phase's job is purely additive (new exported lookup maps), per `ARCHITECTURE.md` Pattern 3 and `08-CONTEXT.md`'s explicit consolidation instruction.

**Existing pattern to extend** (`vessel-role.ts` lines 1-16, full file):
```typescript
import type { ClassificationResult, VesselLabel } from "../../domain/colregs/types.js";

export type VesselRole = "give-way" | "stand-on" | "mutual";

export function getVesselRole(vessel: VesselLabel, classification: ClassificationResult): VesselRole {
  if (classification.giveWay === null && classification.standOn === null) return "mutual";
  if (classification.giveWay === vessel) return "give-way";
  return "stand-on";
}
```
**Add** (consolidating `ChartPanel.tsx`'s `HULL_FILL_CLASS`/`ROLE_BADGE_TEXT` and `ReasoningPanel.tsx`'s `ROLE_BADGE`/`VESSEL_LABEL_TEXT` into this one file, using the new `--color-give-way`/`--color-stand-on`/`--color-mutual` tokens instead of raw Tailwind palette classes):
```typescript
export const ROLE_HULL_FILL_CLASS: Record<VesselRole, string> = {
  "give-way": "fill-give-way",
  "stand-on": "fill-stand-on",
  mutual: "fill-mutual",
};
export const ROLE_BADGE_TEXT: Record<VesselRole, string> = { "give-way": "GW", "stand-on": "SO", mutual: "MUTUAL" };
export const ROLE_BADGE_CLASSNAME: Record<VesselRole, string> = {
  "give-way": "bg-give-way/10 border-give-way/35 text-give-way",
  "stand-on": "bg-stand-on/10 border-stand-on/35 text-stand-on",
  mutual: "bg-mutual/10 border-mutual/35 text-mutual",
};
```

---

### `src/components/sandbox/types.ts` (EXTEND, model)

**Analog:** itself.

**Current `ReasoningPanelProps`** (`types.ts` lines 35-38):
```typescript
export interface ReasoningPanelProps {
  classification: ClassificationResult;
  isDegenerate: boolean;
}
```
**Widen** (for whichever new component renders `InstrumentReadouts`, per D-05's requirement that CPA/TCPA/range/bearing be derived from live vessel state, not `ClassificationResult`):
```typescript
export interface InstrumentReadoutsProps {
  vesselA: Vessel;
  vesselB: Vessel;
  classification: ClassificationResult;
  isDegenerate: boolean;
}
```
This is a sandbox-local, additive `types.ts` change only — no `src/domain/colregs/types.ts` edit (that file's `ClassificationResult` interface, lines 73-81, stays byte-for-byte unchanged per the milestone's locked boundary).

---

### `src/components/sandbox/CopyLinkButton.tsx` (restyle to icon button)

**Analog:** itself (existing file) + `src/components/layout/Header.tsx` lines 69-80 (existing precedent for an icon-inside-`Button` composition using the shadcn `Button` primitive with `asChild`).

**Current pattern** (`CopyLinkButton.tsx`, full file, lines 12-30):
```tsx
export function CopyLinkButton() {
  const [copied, setCopied] = useState(false);
  async function handleClick(): Promise<void> {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button type="button" onClick={handleClick} className="rounded border border-slate-200 px-2 py-1 text-sm text-slate-700 hover:border-teal-600">
      {copied ? "Copied!" : "Copy Link"}
    </button>
  );
}
```
**Icon-button analog from `Header.tsx`:**
```tsx
<Button asChild variant="outline" size="sm">
  <a href="..." target="_blank" rel="noreferrer">
    <svg ...>...</svg>
    Source
  </a>
</Button>
```
**Restyled `CopyLinkButton` should become:**
```tsx
import { Button } from "@/components/ui/button";
import { Link2, Check } from "lucide-react";

<Button variant="outline" size="icon-sm" onClick={handleClick} aria-label={copied ? "Link copied" : "Copy link"}>
  {copied ? <Check aria-hidden="true" /> : <Link2 aria-hidden="true" />}
</Button>
```
State/clipboard logic (`useState`, `navigator.clipboard.writeText`, the 2s `setTimeout` reset) is unchanged — only the rendered markup swaps from a raw `<button>` to the shadcn `Button` primitive.

---

### `app/globals.css` (EXTEND — new `@theme` tokens)

**Analog:** itself — the existing `@theme inline` + `:root`/`.dark` dual-block pattern (lines 7-127), already established in Phase 6, explicitly a "defense-in-depth" convention (both blocks carry identical values on purpose, per the file's own header comment lines 51-59).

**Pattern to copy exactly** (existing `--color-X: var(--X)` + raw `--X: <hex>` pairing, e.g. lines 27, 76):
```css
@theme inline {
    --color-destructive: var(--destructive);
    --color-border: var(--border);
    /* ...existing tokens... */
}
:root {
    --destructive: oklch(0.704 0.191 22.216);
    --border: #27272A;
    /* ...existing values... */
}
.dark {
    --destructive: oklch(0.704 0.191 22.216); /* identical to :root, on purpose */
    --border: #27272A;
}
```
**Add (Pitfall S2 — these do NOT exist yet, confirmed by direct read):**
```css
@theme inline {
    --color-give-way: var(--give-way);
    --color-stand-on: var(--stand-on);
    --color-mutual: var(--mutual);
    --color-rule-accent: var(--rule-accent);
    /* optional, low-risk per UI-SPEC "recommended, not required": */
    --color-doubt: var(--doubt);
    --color-geometry: var(--geometry);
}
```
Add identical `--give-way: #EF4444` / `--stand-on: #22C55E` / `--mutual: #94A3B8` / `--rule-accent: #0D9488` (/ `--doubt: #F59E0B` / `--geometry: #475569`) raw vars to BOTH `:root` and `.dark` blocks — matching the existing defense-in-depth duplication exactly, not just one block.

---

## Shared Patterns

### Pure derivation module shape (Phase 7 precedent, mandatory per CLAUDE.md conventions)
**Source:** `src/components/hero/hero-preview-geometry.ts` (whole file)
**Apply to:** `instrument-readouts.ts`, `status-pill.ts`, `chip-scenarios.ts`
Zero React/JSX imports, exported constants/functions only, independently unit-testable, with a WHY-only derivation comment on the definition (not at every call site) — matching CLAUDE.md's "Separation of concerns" and "Comments: WHY only" conventions verbatim.

### shadcn Card/Badge composition over a `ClassificationResult`
**Source:** `src/components/hero/HeroPreviewCard.tsx` lines 130-146, 248-263
**Apply to:** `VerdictBanner.tsx`, `InstrumentReadouts.tsx`, vessel-control `Card`s
```tsx
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
```

### Consolidated role→style lookup (fixes existing duplication, ARCHITECTURE.md Pattern 3)
**Source:** `src/components/sandbox/vessel-role.ts` (extended, see above)
**Apply to:** `ChartPanel.tsx` (hull fill), `VerdictBanner.tsx`/`ReasoningTrail.tsx` (role badges), chip active-state, vessel-control card role badge — one source of truth, not 2-3 parallel maps.

### `applyVesselUpdate`/`handleReset` choke point
**Source:** `src/components/sandbox/SandboxContainer.tsx` lines 84-104, 134-142
**Apply to:** the new `handleChipSelect` — MUST route through the exact same `applyVesselUpdate` function and clear `previousEncounterTypeRef.current` the same way `handleReset` does (D-02). Do not introduce a parallel state-update path.

### Icon-in-`Button` composition
**Source:** `src/components/layout/Header.tsx` lines 69-80 (`Button asChild` wrapping an `<a>` + inline `<svg>`)
**Apply to:** `CopyLinkButton.tsx` (icon-only `Button`), Reset-scenario button (leading `RotateCcw`/`RefreshCw` icon + label)

### `@theme inline` + `:root`/`.dark` dual-block token registration
**Source:** `app/globals.css` lines 7-127
**Apply to:** all new semantic tokens (`give-way`/`stand-on`/`mutual`/`rule-accent`/optionally `doubt`/`geometry`) — register in `@theme inline` AND both value blocks, never just one.

### Test rewrite for native-control → Radix-primitive swap
**Source:** `08-RESEARCH.md` Code Examples "Test rewrite pattern for the `<select>` → `Select` swap", cross-checked against the actual current `ControlPanel.test.tsx` line 132 (`user.selectOptions(vesselBSelect, "fishing")` — this exact line breaks)
**Apply to:** `ControlPanel.test.tsx` (full interaction rewrite, not incremental fix)
```tsx
// OLD (breaks):
await user.selectOptions(vesselBSelect, "fishing");
// NEW:
await user.click(screen.getAllByRole("combobox")[1]);
await user.click(await screen.findByRole("option", { name: "Fishing" }));
```
Also carry forward this file's existing `afterEach(() => cleanup())` boilerplate (lines 18-20, required because `vitest.config.ts` sets `globals: false`) and the `ControlledHarness` pattern (lines 46-72) for any new test exercising a controlled re-render loop.

## No Analog Found

None. Every file in scope either already exists (in-place restyle, logic preserved) or has a same-repo Phase 7 (`hero/`) or Phase 6 (`app/globals.css`, `ui/*`) precedent explicitly cited by CONTEXT.md/RESEARCH.md as the pattern to mirror.

## Metadata

**Analog search scope:** `src/components/sandbox/`, `src/components/hero/`, `src/components/layout/`, `src/components/ui/`, `src/domain/colregs/`, `src/domain/geometry/`, `src/domain/vessel/`, `app/globals.css`
**Files scanned:** 24 (14 read in full, 10 grepped/partially read for confirmation)
**Pattern extraction date:** 2026-07-18
