# Phase 18: On-Chart Vessel Control Overlay - Pattern Map

**Mapped:** 2026-07-25
**Files analyzed:** 11 (7 new, 4 modified; 3 existing cards retired)
**Analogs found:** 11 / 11

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/components/sandbox/chart/ChartHeaderStrip.tsx` (new) | component | transform | `src/components/sandbox/reasoning/VerdictBanner.tsx` | exact (logic explicitly "ports as-is" per design snapshot) |
| `src/components/sandbox/chart/ChartFooterStrip.tsx` (new) | component | transform | `src/components/sandbox/instruments/InstrumentReadouts.tsx` | exact (readout tiles reused verbatim) + `vessel-role.ts` (role badges) |
| `src/components/sandbox/chart/VesselOverlayCard.tsx` (new) | component | request-response (CRUD-style field edits) | `src/components/sandbox/control-panel/ControlPanel.tsx`'s `VesselFormSection` | exact (design snapshot: "strict subset of today's `VesselFormSection`") |
| `src/components/sandbox/chart/chart-header-risk.ts` (new) | utility | transform | `src/components/sandbox/instruments/status-pill.ts` | role-match (same shape, deliberately divergent thresholds — D-02) |
| `src/components/sandbox/chart/footer-action-copy.ts` (new) | utility | transform | `src/components/sandbox/vessel-role.ts` (`ROLE_BADGE_TEXT` map pattern) | role-match |
| `src/components/sandbox/chart/vessel-overlay-position.ts` (new) | utility | transform | `src/components/sandbox/chart/chart-panel-derivation.ts` | role-match (pure derivation over vessel + containerSize + viewBox) |
| `src/components/sandbox/chart/ChartPanel.tsx` (modified) | component (container) | event-driven (selection state) + request-response (render) | itself (current file) + `useSandboxState.ts` (single-state-owner precedent) | exact (extends existing file) |
| `src/components/sandbox/chart/VesselGroup.tsx` (modified) | component | event-driven | itself (current file) | exact (extends existing file) |
| `src/components/sandbox/hooks/useHullDrag.ts` (modified) | hook | event-driven | `src/components/sandbox/hooks/useRotateHandleDrag.ts` (its sibling, already has the `stopPropagation`-on-`onPointerDown` shape this modification needs) | exact |
| `src/components/sandbox/SandboxContainer.tsx` (modified) | component (container) | request-response (composition/prop-wiring) | itself (current file) | exact (mostly deletion + prop-forwarding) |
| `src/components/sandbox/types.ts` (modified) | config (shared types) | n/a | itself (current file) — extend `ChartPanelProps` using the existing `VesselUpdateHandlers` pattern | exact |

## Pattern Assignments

### `src/components/sandbox/chart/ChartHeaderStrip.tsx` (component, transform)

**Analog:** `src/components/sandbox/reasoning/VerdictBanner.tsx` (being retired this phase — mine its logic, then it and its two local-only maps, `VESSEL_LABEL_TEXT`/`ROLE_STATUS_TEXT`, go away; do not resurrect those two maps elsewhere per CONTEXT.md's canonical-refs note)

**Rule badge + title derivation — port as-is** (`VerdictBanner.tsx` lines 47-52, 54-59, 66-70):
```typescript
function bannerRuleBadge(classification: ClassificationResult): string {
  if (classification.doubt) return "Rule 7";
  const classifyingEntry =
    classification.trail[classifyingEntryIndex(classification.trail.length)];
  return `Rule ${ruleNumber(classifyingEntry.ruleId)}`;
}

function bannerAccentClassName(classification: ClassificationResult, isDegenerate: boolean): string {
  if (isDegenerate || classification.doubt) return "bg-doubt";
  if (classification.giveWay === null && classification.standOn === null) return "bg-mutual";
  return "bg-rule-accent";
}
```
`classifyingEntryIndex`/`ruleNumber` come from `src/components/sandbox/reasoning/reasoning-trail-tag.ts` (lines 16-27) — import from there, don't re-derive.

**Degenerate/error framing** (`VerdictBanner.tsx` lines 39-41):
```typescript
const DEGENERATE_TITLE = "Unable to classify";
const DEGENERATE_DESCRIPTION =
  "Vessel A and Vessel B are at the same position — drag one apart to resume live classification.";
```
The header strip's title (`bannerTitle`) reuses this same `isDegenerate` branch — matches design snapshot's `c.error ? 'Unable to classify' : c.encounter`.

**Risk pill — NEW logic, not a port.** Delegate to `chart-header-risk.ts` (see below) for `risk`/`riskText`/`riskBg`/`riskBorder`/`riskColor`; the header strip component itself only renders the dot + text (design snapshot lines 20-23), sized/positioned per the header-strip markup (flex row, rule badge + title on the left with `text-overflow: ellipsis`, flex spacer, risk pill capped at 46% width on the right — see `18-DESIGN-SNAPSHOT.md`'s header markup block).

**Encounter-type title map — port as-is** (`VerdictBanner.tsx` lines 15-19):
```typescript
const ENCOUNTER_TYPE_TITLE: Record<string, string> = {
  "head-on": "Head-on",
  crossing: "Crossing",
  overtaking: "Overtaking",
};
```

---

### `src/components/sandbox/chart/chart-header-risk.ts` (utility, transform)

**Analog:** `src/components/sandbox/instruments/status-pill.ts` (full file, 31 lines) — same function shape (`(classification-derived signal, cpaNm, tcpaMinutes) => { text, tone }`), but D-02 is an explicit, knowing divergence from this file's own documented rationale.

**Existing shape to mirror** (`status-pill.ts` lines 15-30):
```typescript
export type StatusPillTone = "clear" | "risk" | "opening";

export function statusPillCopy(
  riskOfCollision: boolean,
  cpaNm: number | null,
  tcpaMinutes: number | null,
): { text: string; tone: StatusPillTone } {
  const cpaText = cpaNm !== null ? `${cpaNm.toFixed(2)} NM` : "—";
  if (!riskOfCollision && tcpaMinutes !== null && tcpaMinutes <= 0) {
    return {
      text: `Vessels are opening — CPA already passed. No risk of collision developing on present courses.`,
      tone: "opening",
    };
  }
  return riskOfCollision
    ? { text: `Risk of collision — CPA ${cpaText} on present courses.`, tone: "risk" }
    : { text: `Passing clear — CPA ${cpaText} on present courses.`, tone: "clear" };
}
```
The new module's `!riskOfCollision && tcpaMinutes !== null && tcpaMinutes <= 0` branch is the direct analog of the design snapshot's `!closing && vr2 > 1e-6` "none" tier — both detect "vessels are opening" via `tcpaMinutes <= 0`. Reuse `deriveInstrumentReadouts()`'s `cpaNm`/`tcpaMinutes` output (`src/components/sandbox/instruments/instrument-readouts.ts` lines 27-44) as the input — do not recompute CPA independently (same "single-sourced" precedent `chart-panel-derivation.ts` line 75 already follows for `rangeNm`).

**4-tier scheme to implement (verbatim, per D-02)** — from `18-DESIGN-SNAPSHOT.md` lines 38-53:
```typescript
const riskMap = {
  none:  ['#0B0B0E',            '#27272A',            '#A1A1AA'],
  ok:    ['rgba(34,197,94,.1)', 'rgba(34,197,94,.3)',  '#4ade80'],
  watch: ['rgba(245,158,11,.1)','rgba(245,158,11,.35)','#fbbf24'],
  high:  ['rgba(239,68,68,.1)', 'rgba(239,68,68,.35)', '#f87171'],
};
// error/degenerate reuses the amber 'watch' palette verbatim
if (!closing && vr2 > 1e-6) { risk = 'none'; ... }
else if (cpa < 0.3)          { risk = 'high'; ... }
else if (cpa < 1.0)          { risk = 'watch'; ... }
else                          { risk = 'ok'; ... }
```
Per CLAUDE.md's "no raw hex literals in components" convention and this codebase's existing token approach (`app/globals.css` lines 106-110, 147-151: `--give-way`/`--stand-on`/`--mutual`/`--rule-accent`/`--doubt`), do NOT port the design's hex/`rgba()` literals verbatim into TS — express the 4 tiers as Tailwind utility classnames (bg/border/text) against this project's existing tokens or new semantic ones registered the same way, mirroring `ROLE_BADGE_CLASSNAME`'s `Record<Tier, string>` shape in `vessel-role.ts` (lines 51-55) — return a classname key, not a hex string, from this module.

---

### `src/components/sandbox/chart/ChartFooterStrip.tsx` (component, transform)

**Analogs:** `src/components/sandbox/instruments/InstrumentReadouts.tsx` (readout tiles) + `src/components/sandbox/vessel-role.ts` (role badges, reused not reinvented)

**Readout tile pattern — port as-is** (`InstrumentReadouts.tsx` lines 18-31, 51-67, 86-91):
```typescript
const PLACEHOLDER = "—";
function formatBearing(bearingAtoBDegrees: number | null): string {
  if (bearingAtoBDegrees === null) return PLACEHOLDER;
  return `${Math.round(bearingAtoBDegrees).toString().padStart(3, "0")}°`;
}
// ... formatCpa/formatTcpa mirror this null-guard shape

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-chart-surface px-[11px] py-[10px]">
      <div className="font-mono text-[9.5px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</div>
      <div className="mt-0.75 font-mono text-[17px] font-semibold text-foreground">{value}</div>
    </div>
  );
}
```
Values come from `deriveInstrumentReadouts(vesselA, vesselB)` (`instrument-readouts.ts` line 27) — same call, same import, unchanged. `LIVE` blinking-dot label (design snapshot line 64) is new literal UI copy with a CSS `@keyframes` pulse — per CLAUDE.md's "no raw CSS in component files" convention, the `blip` keyframe belongs in `app/globals.css`, not a template-literal `<style>` block in the `.tsx` file.

**Per-vessel role badge — reuse verbatim, do not reinvent** (`vessel-role.ts` lines 42-55):
```typescript
export const ROLE_BADGE_TEXT: Record<VesselRole, string> = { "give-way": "GW", "stand-on": "SO", mutual: "MUTUAL" };
export const ROLE_BADGE_CLASSNAME: Record<VesselRole, string> = {
  "give-way": "bg-give-way/10 border-give-way/35 text-give-way",
  "stand-on": "bg-stand-on/10 border-stand-on/35 text-stand-on",
  mutual: "bg-mutual/10 border-mutual/35 text-mutual",
};
```
Get each vessel's role via `getVesselRole(label, classification)` (`vessel-role.ts` line 12) — same call `ControlPanel.tsx`/`VerdictBanner.tsx`/`ChartPanel.tsx` already make.

**Per-vessel action copy** — new module, see `footer-action-copy.ts` below.

---

### `src/components/sandbox/chart/footer-action-copy.ts` (utility, transform)

**Analog:** `src/components/sandbox/vessel-role.ts`'s `Record<VesselRole, string>` map pattern (lines 42-46) — same shape, new content.

**Content to adopt verbatim (D-03)**, from `18-DESIGN-SNAPSHOT.md` lines 91-95, keyed off `VesselRole` (`"give-way" | "stand-on" | "mutual"` — this codebase's existing role type, not the design's raw `GW`/`SO`/`MUTUAL` strings):
```typescript
export const ROLE_ACTION_TEXT: Record<VesselRole, string> = {
  "give-way": "Alter course early & substantially — pass well clear astern.",
  "stand-on": "Hold course & speed; stand ready to act if she does not.",
  mutual: "No privilege — both take early, decisive avoiding action.",
};
```
Degenerate/error state uses the same `PLACEHOLDER = "—"` constant convention as `InstrumentReadouts.tsx` line 16 (D-03: "consistent with `InstrumentReadouts.tsx`'s current placeholder convention").

---

### `src/components/sandbox/chart/vessel-overlay-position.ts` (utility, transform)

**Analog:** `src/components/sandbox/chart/chart-panel-derivation.ts` (full file) — same pure-derivation shape: named domain/geometry imports, one exported interface, one exported derive function, zero React/JSX, computed fresh from `vessel` + `containerSize` + `viewBox` on every call (doc comment at lines 1-9 states this pattern explicitly; mirror it for this new module's own doc comment).

**Existing quadrant-adjacent primitives already in scope** (`chart-panel-derivation.ts` lines 52-56):
```typescript
const screenA = chartToScreen(vesselA.position, containerSize, viewBox);
const screenB = chartToScreen(vesselB.position, containerSize, viewBox);
```
`chartToScreen()` (from `src/domain/geometry/screen-convert/screen-convert.js`) already gives pixel-space `{ screenX, screenY }` for a vessel; the new module's job is purely the quadrant-anchor arithmetic on top of that (design snapshot's `posCard`, lines 129-139) — do NOT reintroduce the design's own `v.x / 960 * 100` normalization (that assumes the design's fixed 960x640 canvas). Use this codebase's actual `CHART_VIEW_BOX` (`chart-panel-geometry.ts` line 14: `{ minX: -10, minY: -10, width: 20, height: 20 }`) and the live `containerSize`/`chartToScreen()` output instead, to get the true on-screen quadrant test (`vessel.position.x < 0` / `vessel.position.y < 0`, or the already-computed `screenX < containerSize.width / 2` — equivalent, pick whichever is simpler against already-derived values) — never the design's hardcoded normalization constants.

**Positioning contract to port (behavior, not literals)** — CLAUDE.md's Claude's-Discretion note in CONTEXT.md D-discretion-1 explicitly says: port the *behavior* (anchor opposite the vessel's chart quadrant, ~224px/max-46% width) using this codebase's Tailwind/CSS-custom-property conventions, not raw hex/px from the design. The function should return which corner/offset to anchor to (e.g. an enum/flags: `{ right: boolean; below: boolean }` or literal offset numbers), letting the component apply Tailwind position classes + one CSS custom property for the numeric offset, per CLAUDE.md's "expose it as a CSS custom property, don't compose the whole rule in JS" convention.

**Absolute-positioning container precedent** — the overlay card is `position:absolute` within the same relatively-positioned wrapper `ChartPanel.tsx` already uses for its "1 NM" scale-bar legend (`ChartPanel.tsx` lines 80, 164-173):
```tsx
<div ref={containerRef} className="relative aspect-square w-full">
  <svg ...>...</svg>
  <div className="absolute bottom-2 left-2 flex items-center gap-1 ...">
    ...
  </div>
</div>
```
The overlay card(s) become additional absolutely-positioned siblings of this same `<div>`/`<svg>` pair — not a new positioning context.

---

### `src/components/sandbox/chart/VesselOverlayCard.tsx` (component, request-response)

**Analog:** `src/components/sandbox/control-panel/ControlPanel.tsx`'s `VesselFormSection` (lines 41-131) — design snapshot explicitly calls this "a strict subset of today's `ControlPanel.tsx` `VesselFormSection`."

**Imports to reuse verbatim** (`ControlPanel.tsx` lines 1-10):
```typescript
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card"; // or a plain div, since this is a floating card not a grid-cell Card
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { VesselTypeSchema, type VesselType } from "../../../domain/vessel/vessel.js";
import { getVesselRole, ROLE_BADGE_CLASSNAME, ROLE_BADGE_TEXT } from "../vessel-role.js";
```

**Vessel-type label map — reuse verbatim, do not duplicate** (`ControlPanel.tsx` lines 16-22):
```typescript
const VESSEL_TYPE_LABELS: Record<VesselType, string> = {
  "power-driven": "Power-driven",
  sailing: "Sailing",
  fishing: "Fishing",
  "not-under-command": "Not under command",
  "restricted-in-ability-to-maneuver": "Restricted in ability to maneuver",
};
```
Design snapshot's own `<select>` options (lines 113-117) use a *different* 5-value vocabulary (`power`/`sailing`/`fishing`/`ram`/`nuc`) than this codebase's real `VesselTypeSchema` enum — do NOT port the design's option list; keep `VESSEL_TYPE_LABELS`/`VesselTypeSchema.options.map(...)` exactly as `ControlPanel.tsx` already does (lines 80-90) so the form can never drift from the domain's actual 5 vessel-type values.

**Read-only heading formatting — reuse verbatim** (`ControlPanel.tsx` lines 27-29):
```typescript
function formatHeading(heading: number): string {
  return `${Math.round(heading).toString().padStart(3, "0")}°`;
}
```
Same "heading is drag-only, never editable here" convention (comment at lines 24-26) — the overlay's HEADING field stays a read-only formatted span, exactly like `ControlPanel.tsx` lines 118-127.

**Select/Slider wiring — reuse verbatim** (`ControlPanel.tsx` lines 80-91, 108-115):
```tsx
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
...
<Slider
  aria-label={`${heading} speed`}
  value={[vessel.speed]}
  min={0}
  max={40}
  step={1}
  onValueChange={([speed]) => onVesselSpeedChange(label, speed)}
/>
```
`onVesselSpeedChange`/`onVesselTypeChange` are the exact same `useSandboxState()` callbacks `ControlPanel.tsx` already receives (`useSandboxState.ts` lines 138-150) — thread them through unchanged (Phase 16's single-choke-point invariant; see `useSandboxState.ts`'s `applyVesselUpdate`, lines 102-122).

**New elements not in `ControlPanel.tsx`:** role badge in the card header (reuse `ROLE_BADGE_CLASSNAME`/`ROLE_BADGE_TEXT`, same import as above) and an explicit `×` close button (design snapshot lines 108-109) — wire the close button's `onClick` to whatever "close this vessel's overlay" callback `ChartPanel.tsx` passes down (see D-01's three-close-paths requirement below).

---

### `src/components/sandbox/chart/ChartPanel.tsx` (modified — new overlay-selection state + header/footer strips)

**Analog:** itself (current file, full 177 lines) — this is an extension, not a rewrite; keep the existing `containerRef`/`containerSize`/`deriveChartOverlayState()` structure (lines 38-77) and the existing zero-size early return (lines 57-59) exactly as-is.

**New local state needed** (none currently exists in this file — every other piece of Sandbox state lives in `useSandboxState.ts`, but "which vessel's overlay is open" is pure UI-transient state scoped to the chart, analogous to the design source's own `this.state.selected`):
```typescript
const [selectedVessel, setSelectedVessel] = useState<VesselLabel | null>(null);
```

**D-01's three-close-paths + toggle, reconciling the design source's actual code with ROADMAP's stricter criterion** — design snapshot lines 144-156 give the design's real (non-toggling) behavior:
```javascript
// Design's actual pointerdown handler -- unconditionally selects, never toggles:
startDrag = (e, letter, mode) => { e.stopPropagation(); e.preventDefault(); this.drag = {letter, mode}; this.setState({selected: letter}); };
onCloseCard: (e) => { e.stopPropagation(); this.setState({selected: null}); };
onChartDown: () => { if (this.state.selected) this.setState({selected: null}); };
```
This phase's `ChartPanel.tsx` must add the toggle CONTEXT.md D-01 locks on top of this — e.g. a `selectVessel` handler:
```typescript
function selectVessel(vessel: VesselLabel): void {
  setSelectedVessel((current) => (current === vessel ? null : vessel));
}
```
called from the vessel press handler (see `VesselGroup.tsx`/`useHullDrag.ts` below), with the `×` button calling `() => setSelectedVessel(null)` and the `<svg>`'s own `onPointerDown` (empty-chart-space case) also calling `() => setSelectedVessel(null)` when non-null — matching `onChartDown`'s guard shape above but attached to the real `<svg>` element already at `ChartPanel.tsx` line 81.

**Header/footer strip + overlay card composition points** — new elements around the existing `<div ref={containerRef}>` wrapper (lines 80-175), same absolutely-positioned-sibling pattern the "1 NM" legend (lines 164-173) already establishes; conditionally render `VesselOverlayCard` for `selectedVessel === "vesselA"` / `"vesselB"` the same way the design's `ovshipA`/`ovshipB` are conditionally shown on `selA`/`selB` (design snapshot line 103).

---

### `src/components/sandbox/chart/VesselGroup.tsx` (modified — hull/rotate press also opens the overlay)

**Analog:** itself (current file, full 162 lines) — the hull polygon (lines 70-83) and rotate-handle circle (lines 91-105) both already have `onPointerDown` wired to `hullDrag.onPointerDown` / `rotateDrag.onPointerDown`; D-04 requires these same handlers to *also* call an `onSelect(label)` callback, not a new, separate click-detection listener (CONTEXT.md is explicit this sidesteps new hit-testing logic in a codebase with two prior documented hit-testing regressions — read this file's own hit-testing comments, lines 60-69 and 84-90 and 108-121, before touching either hit-target).

**Prop shape extension needed:**
```typescript
export interface VesselGroupProps {
  label: VesselLabel;
  vessel: Vessel;
  screen: { screenX: number; screenY: number };
  role: VesselRole;
  hullDrag: DragHandlers;
  rotateDrag: DragHandlers;
  // new: forwarded from ChartPanel's selectVessel(), called by both
  // hullDrag's and rotateDrag's onPointerDown (D-04) -- see useHullDrag.ts.
}
```
Simplest implementation path (per D-04's own reasoning): thread the `onSelect` callback into `useHullDrag`/`useRotateHandleDrag` themselves (see next entry) rather than adding a second `onPointerDown` prop on the JSX elements here — keeps `VesselGroup.tsx`'s JSX (lines 80-83, 102-105) completely unchanged, all the new logic lives in the two hook files.

---

### `src/components/sandbox/hooks/useHullDrag.ts` (modified — add select-on-press, per D-04)

**Analog:** its own sibling, `src/components/sandbox/hooks/useRotateHandleDrag.ts` — already has the exact shape this modification needs (an extra side-effect fired from `onPointerDown`, same breath as `setPointerCapture`):

**Current `useHullDrag.ts` `onPointerDown`** (lines 32-34, to be extended):
```typescript
const onPointerDown = (event: PointerEvent<SVGElement>) => {
  event.currentTarget.setPointerCapture(event.pointerId);
};
```

**Pattern to mirror, from `useRotateHandleDrag.ts` lines 29-34** (already calls a second thing in the same handler, with a documented "why", matching D-04's "same breath" framing verbatim):
```typescript
const onPointerDown = (event: PointerEvent<SVGElement>) => {
  // Pitfall 1: stop the gesture from also bubbling to the hull hit-rect's
  // own onPointerDown -- the rotate handle sits near/over the hull.
  event.stopPropagation();
  event.currentTarget.setPointerCapture(event.pointerId);
};
```
Add a new `onSelect: (vessel: VesselLabel) => void` parameter to both `useHullDrag()` and `useRotateHandleDrag()`, called inside each hook's own `onPointerDown` right alongside `setPointerCapture`/`stopPropagation` — exactly where the design source's `startDrag` calls `this.setState({selected: letter})` "in the same breath" as starting the drag (design snapshot line 147, CONTEXT.md D-04). The `DragHandlers` return-type interface (`useHullDrag.ts` lines 20-24) itself does not need to change — only the hook's own body and its new parameter.

---

### `src/components/sandbox/SandboxContainer.tsx` (modified — remove 3 standalone cards, add prop-threading to `ChartPanel`)

**Analog:** itself (current file) — mechanical removal, not a new pattern. Delete the `VerdictBanner`/`InstrumentReadouts`/`ControlPanel` imports and their 3 JSX usages (current lines 19-21, 93-96, 109-122), and the now-empty side-column `<div className="flex flex-col gap-4">` wrapper (lines 109-122). `ChartPanel` gains 2 new callback props it doesn't currently receive (`onVesselSpeedChange`/`onVesselTypeChange`, currently only threaded to `ControlPanel` at lines 119-120) — thread the same `sandboxState.onVesselSpeedChange`/`sandboxState.onVesselTypeChange` values through to `ChartPanel` instead, unchanged in shape/origin (`useSandboxState()` still owns them).

---

### `src/components/sandbox/types.ts` (modified — extend `ChartPanelProps`)

**Analog:** itself — extend using the exact same `VesselUpdateHandlers` composition pattern already used for `ControlPanelProps` (lines 26-35):
```typescript
export interface ControlPanelProps {
  vesselA: Vessel;
  vesselB: Vessel;
  classification: ClassificationResult;
  onVesselSpeedChange: VesselUpdateHandlers["onVesselSpeedChange"];
  onVesselTypeChange: VesselUpdateHandlers["onVesselTypeChange"];
}
```
Add the same two fields (`onVesselSpeedChange`/`onVesselTypeChange`) to `ChartPanelProps` (currently lines 18-24, which only has `onVesselPositionChange`/`onVesselHeadingChange`) — `ChartPanel` now needs all 4 `VesselUpdateHandlers` members since it hosts the overlay's TYPE/SPEED fields directly. `ControlPanelProps` itself can likely be deleted along with `ControlPanel.tsx` once the overlay replaces it — confirm no other consumer imports `ControlPanelProps` before deleting.

---

## Shared Patterns

### Role derivation and styling (single-sourced, never duplicated)
**Source:** `src/components/sandbox/vessel-role.ts` (full file, 56 lines)
**Apply to:** `ChartHeaderStrip.tsx`, `ChartFooterStrip.tsx`, `VesselOverlayCard.tsx` — all three need `getVesselRole()` + `ROLE_BADGE_TEXT`/`ROLE_BADGE_CLASSNAME`.
```typescript
export function getVesselRole(vessel: VesselLabel, classification: ClassificationResult): VesselRole {
  if (classification.giveWay === null && classification.standOn === null) return "mutual";
  if (classification.giveWay === vessel) return "give-way";
  return "stand-on";
}
export const ROLE_BADGE_TEXT: Record<VesselRole, string> = { "give-way": "GW", "stand-on": "SO", mutual: "MUTUAL" };
export const ROLE_BADGE_CLASSNAME: Record<VesselRole, string> = {
  "give-way": "bg-give-way/10 border-give-way/35 text-give-way",
  "stand-on": "bg-stand-on/10 border-stand-on/35 text-stand-on",
  mutual: "bg-mutual/10 border-mutual/35 text-mutual",
};
```
Do not introduce a second/parallel role-label map anywhere in this phase's new files — `VerdictBanner.tsx`'s own local `VESSEL_LABEL_TEXT`/`ROLE_STATUS_TEXT` maps are retired along with that file, not resurrected.

### Geometry/instrument values (single-sourced from `src/domain/`)
**Source:** `src/components/sandbox/instruments/instrument-readouts.ts` (`deriveInstrumentReadouts()`)
**Apply to:** `ChartFooterStrip.tsx` (RANGE/BEARING/CPA/TCPA tiles) and `chart-header-risk.ts` (risk-tier derivation) — both must call this one function, never recompute `cpa()`/`relativeBearing()` independently. Same precedent `chart-panel-derivation.ts` line 75 already follows for `rangeNm`.

### Color/semantic tokens (CSS custom properties, never raw hex)
**Source:** `app/globals.css` lines 55-59, 106-110, 147-151 (`--color-give-way`/`--color-stand-on`/`--color-mutual`/`--color-rule-accent`/`--color-doubt`)
**Apply to:** all new files — the design snapshot's `C = { GW: '#EF4444', SO: '#22C55E', MUTUAL: '#94A3B8', doubt: '#F59E0B', teal: '#0d9488' }` hex table (snapshot lines 163-168) already has 1:1 equivalents registered here; reuse the existing Tailwind utility classes derived from these tokens (`bg-give-way`, `text-doubt`, etc.), never introduce new hex literals from the snapshot.

### Single mutation choke-point (Phase 16 invariant, unchanged)
**Source:** `src/components/sandbox/hooks/useSandboxState.ts`'s `applyVesselUpdate` (lines 102-122) and its 4 public callbacks (lines 124-150)
**Apply to:** `VesselOverlayCard.tsx`'s TYPE/SPEED fields, and `ChartPanel.tsx`'s hull/rotate drag wiring — every mutation this phase's new UI surfaces trigger must still call `onVesselSpeedChange`/`onVesselTypeChange`/`onVesselPositionChange`/`onVesselHeadingChange` exactly as today; this phase adds new UI surfaces for these callbacks, never a new mutation path.

### Hit-testing convention (pointer-events on painted vs. decorative shapes)
**Source:** `src/components/sandbox/chart/VesselGroup.tsx`'s own comments (lines 60-69, 84-90, 108-121)
**Apply to:** `ChartPanel.tsx`'s new overlay card — since it's an absolutely-positioned sibling `div` outside the SVG (not a new SVG element), it doesn't need `pointerEvents="none"` itself, but must not visually overlap the vessel it's anchored opposite to, or it could swallow the *next* pointerdown meant for the chart underneath (see `code_context` note in `18-CONTEXT.md` lines 74).

### Test setup polyfills (jsdom gaps)
**Source:** `src/components/sandbox/hooks/useHullDrag.test.ts` (lines 25-54) and `src/components/sandbox/control-panel/ControlPanel.test.tsx` (lines 33-53)
**Apply to:** any new test file exercising drag/select/Radix-primitive interactions — same `MockResizeObserver` class + `Element.prototype.{hasPointerCapture,setPointerCapture,releasePointerCapture,scrollIntoView}` stub pattern, plus the file-scoped `afterEach(() => cleanup())` (`ControlPanel.test.tsx` lines 24-26, needed because `vitest.config.ts` sets `globals: false`).

## No Analog Found

None — every new file in this phase has at least a role-match analog already in `src/components/sandbox/`.

## Metadata

**Analog search scope:** `src/components/sandbox/**`, `src/domain/geometry/cpa/`, `src/domain/colregs/types.ts`, `app/globals.css`
**Files scanned:** 20 (all files under `src/components/sandbox/`, plus `cpa.ts`, `globals.css` token block)
**Pattern extraction date:** 2026-07-25
