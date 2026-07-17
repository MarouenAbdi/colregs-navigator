---
phase: 04-interactive-chart-sandbox
reviewed: 2026-07-17T00:00:00Z
depth: standard
files_reviewed: 24
files_reviewed_list:
  - app/globals.css
  - app/layout.tsx
  - app/page.tsx
  - next-env.d.ts
  - package.json
  - postcss.config.mjs
  - src/components/sandbox/ChartPanel.test.tsx
  - src/components/sandbox/ChartPanel.tsx
  - src/components/sandbox/ControlPanel.test.tsx
  - src/components/sandbox/ControlPanel.tsx
  - src/components/sandbox/ReasoningPanel.test.tsx
  - src/components/sandbox/ReasoningPanel.tsx
  - src/components/sandbox/SandboxContainer.test.tsx
  - src/components/sandbox/SandboxContainer.tsx
  - src/components/sandbox/environment.smoke.test.tsx
  - src/components/sandbox/hooks/useHullDrag.test.ts
  - src/components/sandbox/hooks/useHullDrag.ts
  - src/components/sandbox/hooks/useRotateHandleDrag.test.ts
  - src/components/sandbox/hooks/useRotateHandleDrag.ts
  - src/components/sandbox/types.ts
  - src/components/sandbox/vessel-role.test.ts
  - src/components/sandbox/vessel-role.ts
  - src/domain/colregs/resolve-doubt-geometry.fixtures.ts
  - src/domain/colregs/resolve-doubt-geometry.test.ts
  - src/domain/colregs/resolve-doubt-geometry.ts
  - tsconfig.json
  - vitest.config.ts
  - vitest.setup.ts
findings:
  critical: 0
  warning: 4
  info: 3
  total: 7
status: issues_found
---

# Phase 04: Code Review Report

**Reviewed:** 2026-07-17T00:00:00Z
**Depth:** standard
**Files Reviewed:** 24
**Status:** issues_found

## Summary

Reviewed the Phase 4 interactive-chart-sandbox UI (ChartPanel, ControlPanel,
ReasoningPanel, SandboxContainer, the drag hooks, `vessel-role.ts`) plus the
new pure domain module `resolveDoubtGeometry()` and the surrounding
build/test config. `resolveDoubtGeometry()` itself, its fixtures, and its
tests are solid — the tie-break logic, the coincident-position propagation,
and the sticky-hysteresis case are all correctly reasoned through and
covered. The drag hooks (`useHullDrag`, `useRotateHandleDrag`) correctly
guard on `hasPointerCapture`/`containerSize`/`svgRect` before converting
coordinates, and `ChartPanel` gracefully degrades when `resolveDoubtGeometry`
itself returns `!ok`.

No hardcoded secrets, `eval`, empty catch blocks, `console.*`, or debug
artifacts were found. No critical/blocker-level defects were found — nothing
here crashes the app or leaks data — but there is one clear contract-gap bug
(`isDegenerate` is part of `ChartPanelProps` and is passed by
`SandboxContainer`, yet `ChartPanel` never reads it), an unsound type
assertion that can silently render "undefined gives way" if the
give-way/stand-on invariant is ever violated upstream, and a silent-failure
UX gap in the single validation choke point (`applyVesselUpdate`).

## Warnings

### WR-01: `ChartPanel` never reads the `isDegenerate` prop it declares and is given

**File:** `src/components/sandbox/ChartPanel.tsx:183-189` (contract: `src/components/sandbox/types.ts:19-26`)
**Issue:** `ChartPanelProps.isDegenerate` is documented as "true when the most
recent `classifyEncounter()` call returned `!ok`" and `SandboxContainer`
faithfully passes its `isDegenerate` state into `ChartPanel` (`SandboxContainer.tsx:146`).
`ChartPanel`'s destructured props, however, are only
`{ vesselA, vesselB, classification, onVesselPositionChange, onVesselHeadingChange }`
— `isDegenerate` is silently dropped and never referenced anywhere in the
file. Concretely: `SandboxContainer` always passes the *current* (possibly
coincident) `vesselA`/`vesselB` positions into `ChartPanel`, but the
`classification` prop stays pinned to the *last-good* result while
degenerate. During that window, `ChartPanel` still draws the bearing line
(collapsed to zero length, since both vessels are at the same screen point)
and the doubt-cone overlay from stale geometry, with zero visual indication
that the chart is currently showing frozen reasoning over an invalid vessel
configuration. `ReasoningPanel` does surface "Unable to classify" elsewhere
on the page, but the chart itself gives no cue.
**Fix:** Destructure and use `isDegenerate` in `ChartPanel`, e.g. dim the SVG
content or suppress the bearing-line/cone overlays while degenerate:
```tsx
export function ChartPanel({
  vesselA,
  vesselB,
  classification,
  isDegenerate,
  onVesselPositionChange,
  onVesselHeadingChange,
}: ChartPanelProps) {
  ...
  <svg
    className={`bg-white border border-slate-200 rounded ${isDegenerate ? "opacity-50" : ""}`}
    ...
```

### WR-02: Invalid `ControlPanel` input silently reverts with no user feedback

**File:** `src/components/sandbox/SandboxContainer.tsx:64-84` (speed input: `src/components/sandbox/ControlPanel.tsx:38-46`)
**Issue:** `applyVesselUpdate` is the single validate-then-classify choke
point (by design), but on `VesselSchema.safeParse` failure it does nothing
but `return` (`SandboxContainer.tsx:67`) — `vesselA`/`vesselB` state is not
updated, no error is shown. `VesselSchema.speed` requires `gte(0)`
(`vessel.ts:29`), and `ControlPanel`'s speed `<input type="number" min={0}>`
does not actually prevent a user from typing a leading `-` in most browsers.
Because `ControlPanel` is a fully controlled component
(`value={vessel.speed}`), typing e.g. `-5` triggers `onVesselSpeedChange`,
which fails validation and leaves `vesselA`/`vesselB` state untouched — on
the next render the input snaps back to the last valid value mid-keystroke,
with no indication to the user of why their input was rejected. This is the
classic "controlled input fights the user" bug.
**Fix:** Either clamp before parsing (`Math.max(0, Number(e.target.value))`
in `ControlPanel`) or surface a validation error from `applyVesselUpdate`
(e.g. an `inputError` state rendered near the offending field) instead of a
bare silent no-op.

### WR-03: Unsound `as string` cast can render "undefined gives way"

**File:** `src/components/sandbox/ReasoningPanel.tsx:81-88`
**Issue:** `verdictBannerText` does:
```ts
const verdictClause =
  classification.giveWay === null && classification.standOn === null
    ? "mutual obligation"
    : `${VESSEL_LABEL_TEXT[classification.giveWay as string]} gives way`;
```
`classification.giveWay` is typed `VesselLabel | null`
(`src/domain/colregs/types.ts:76`). The `as string` cast unsoundly discards
the `null` branch of that union to satisfy `VESSEL_LABEL_TEXT`'s
`Record<string, string>` index signature. If `giveWay` is ever `null` while
`standOn` is non-null (or vice versa) — an invariant that is only enforced
by a code comment in `types.ts`, not by the type system itself — this
silently produces `VESSEL_LABEL_TEXT[null]` → `undefined`, and the banner
renders the literal text **"undefined gives way"** with no error, no crash,
and no test coverage of that path.
**Fix:** Narrow on the actual union instead of casting away `null`:
```ts
const verdictClause =
  classification.giveWay === null
    ? "mutual obligation"
    : `${VESSEL_LABEL_TEXT[classification.giveWay]} gives way`;
```
(and type `VESSEL_LABEL_TEXT` as `Record<VesselLabel, string>` so the
compiler enforces exhaustiveness instead of requiring a cast at all.)

### WR-04: Unchecked `as number` fact-value casts + no error boundary anywhere in the app

**File:** `src/components/sandbox/ReasoningPanel.tsx:47-64`
**Issue:** `formatFactValue` casts `value` (typed
`number | string | boolean` per `ReasoningTrailEntry.facts`) to `number` for
four of its seven known keys (`(value as number).toFixed(1)`, etc.) with no
runtime guard. This is only as safe as `classify-encounter.ts` always
producing exactly the expected value type per key — an invariant enforced
nowhere in this reviewed code. If any current or future rule stage ever
pushes a mismatched type under one of these keys (e.g. a stringified number),
`.toFixed` throws inside render. There is no `app/error.tsx` and no React
error boundary anywhere in the codebase (`grep -rl "ErrorBoundary\|componentDidCatch\|error.tsx"` returns nothing), so any such throw takes down the
entire single-page app with a blank screen and no recovery UI, on every
subsequent drag/edit until the page is reloaded.
**Fix:** Add a minimal runtime guard in `formatFactValue` (e.g.
`typeof value === "number" ? value.toFixed(1) : String(value)`) and/or add
an `app/error.tsx` boundary so a single bad fact value degrades gracefully
instead of blanking the whole app.

## Info

### IN-01: Magic, unenforced `max={40}` speed cap in `ControlPanel`

**File:** `src/components/sandbox/ControlPanel.tsx:38-46`
**Issue:** The speed `<input>` has `min={0} max={40}` with no accompanying
comment/constant explaining the `40` (knots) ceiling, while
`VesselSchema.speed` is documented as deliberately unbounded
("speed >= 0 with no upper ceiling", `vessel.ts:29`). Since there is no form
submission/validity check anywhere in the flow, a user can type e.g. `999`
directly into the field and it will be accepted by `VesselSchema` and
applied — the UI's own declared cap is cosmetic only (it just disables the
spinner past 40) and silently inconsistent with the domain layer's stated
contract.
**Fix:** Either extract a named, justified constant (e.g.
`MAX_DISPLAY_SPEED_KN`) shared with a short rationale comment, or drop the
`max` attribute if no real ceiling is intended.

### IN-02: Misleading `stopPropagation()` comment in `useRotateHandleDrag`

**File:** `src/components/sandbox/hooks/useRotateHandleDrag.ts:28-33`
**Issue:** The comment claims `event.stopPropagation()` is needed to "stop
the gesture from also bubbling to the hull hit-rect's own onPointerDown."
In `ChartPanel.tsx`'s `VesselGroup` (`ChartPanel.tsx:150-177`), the
hull-hit `<rect>` and the rotate-hit `<circle>` are **siblings** under the
same `<g>`, not ancestor/descendant — a pointerdown event can only bubble up
an element's own ancestor chain, so it could never reach the rect's handler
via bubbling regardless of this call. The actual (and sufficient) protection
against double-handling is SVG paint order: the rotate-hit circle is
rendered after the hull-hit rect, so it sits on top and exclusively receives
the hit at any overlapping pixel. The `stopPropagation()` call is harmless
but is not doing what the comment says, which will mislead a future
maintainer who tries to reason about or remove it.
**Fix:** Correct the comment to describe the real mechanism (SVG paint-order
hit-testing), or remove the call if truly redundant and add a regression
test asserting click-through behavior at the exact overlap boundary if it's
kept for defense-in-depth.

### IN-03: `getVesselRole`'s "stand-on" branch is a bare `else`, not an explicit check

**File:** `src/components/sandbox/vessel-role.ts:12-16`
**Issue:** `getVesselRole` returns `"stand-on"` for any vessel that isn't
`mutual` and isn't `giveWay`, relying entirely on the comment-documented (not
type-enforced) invariant that `standOn === vessel` in that case. If that
invariant is ever violated by a future domain change (e.g. a new encounter
shape with a give-way vessel but no stand-on vessel), this silently
mislabels the queried vessel as "stand-on" with no error signal.
**Fix:** Make the fallback explicit and fail loudly on violation:
```ts
export function getVesselRole(vessel: VesselLabel, classification: ClassificationResult): VesselRole {
  if (classification.giveWay === null && classification.standOn === null) return "mutual";
  if (classification.giveWay === vessel) return "give-way";
  if (classification.standOn === vessel) return "stand-on";
  throw new Error(`getVesselRole: ${vessel} is neither give-way nor stand-on nor mutual`);
}
```

---

_Reviewed: 2026-07-17T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
