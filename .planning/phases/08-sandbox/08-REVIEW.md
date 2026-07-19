---
phase: 08-sandbox
reviewed: 2026-07-18T23:57:39Z
depth: standard
files_reviewed: 17
files_reviewed_list:
  - app/globals.css
  - app/s/[shareId]/page.tsx
  - src/components/sandbox/ChartPanel.tsx
  - src/components/sandbox/ControlPanel.tsx
  - src/components/sandbox/CopyLinkButton.tsx
  - src/components/sandbox/InstrumentReadouts.tsx
  - src/components/sandbox/ReasoningTrail.tsx
  - src/components/sandbox/SandboxContainer.tsx
  - src/components/sandbox/VerdictBanner.tsx
  - src/components/sandbox/chip-scenarios.ts
  - src/components/sandbox/instrument-readouts.ts
  - src/components/sandbox/reasoning-trail-tag.ts
  - src/components/sandbox/status-pill.ts
  - src/components/sandbox/types.ts
  - src/components/sandbox/vessel-role.ts
  - src/components/ui/label.tsx
  - src/components/ui/select.tsx
  - src/components/ui/slider.tsx
findings:
  critical: 2
  warning: 4
  info: 3
  total: 9
status: resolved
resolved_critical: 2
resolved_warning: 3
deferred_info: 3
---

# Phase 8: Code Review Report

**Reviewed:** 2026-07-18T23:57:39Z
**Depth:** standard
**Files Reviewed:** 17
**Status:** issues_found

## Summary

Reviewed Phase 8's restyle of the Sandbox (ChartPanel, ControlPanel, the
VerdictBanner/InstrumentReadouts/ReasoningTrail split, chip-preset row,
CopyLinkButton, and the new shadcn `ui/select.tsx`/`ui/slider.tsx`/`ui/label.tsx`
primitives) against the 08-UI-SPEC.md design contract and CLAUDE.md's
conventions. The `vessel-role.ts` single-source-of-truth consolidation is done
correctly — `ROLE_HULL_FILL_CLASS`/`ROLE_BADGE_TEXT`/`ROLE_BADGE_CLASSNAME` are
each imported and reused (not re-derived) by `ChartPanel.tsx`, `ControlPanel.tsx`,
and `VerdictBanner.tsx`, and `getVesselRole()`'s "standOn === vessel" shortcut is
sound given `types.ts`'s locked non-null contract for `giveWay`/`standOn`.
`reasoning-trail-tag.ts`'s shared `classifyingEntryIndex()`/`ruleNumber()`
helpers are consumed consistently by both `VerdictBanner.tsx` and
`ReasoningTrail.tsx`, and the reasoning-trail dynamic-length rendering
(`classification.trail.length`, never a hardcoded 3) is correctly implemented.

However, two BLOCKER-level defects were found, both squarely inside the
project's own self-identified highest-risk areas for this phase:

1. A provable SVG hit-testing dead zone in `ChartPanel.tsx` where the
   non-rotating role-badge chip physically overlaps part of the hull polygon's
   painted (and therefore pointer-event-capturing) area — silently blocking
   hull-drag gestures that start in that region, at the *default* heading used
   by every current chip scenario.
2. `SandboxContainer.tsx` initializes `activeChipId` to `"classic-crossing"`
   unconditionally, so every `/s/[shareId]` shared-scenario page renders the
   "Classic crossing" chip as visually active/pressed regardless of what
   scenario is actually loaded — directly contradicting the phase's own written
   interaction contract ("the highlight never goes stale/misleading").

Four Warning-level and three Info-level findings follow, covering dead
prop-threading left over from the `ReasoningPanel` split, a missing
mutation-error path on Save/Share, an unguarded clipboard call, and a
newly-introduced un-tokenized hex literal.

## Critical Issues

### CR-01: Role-badge chip overlaps and blocks part of the hull's drag hit-target

**File:** `src/components/sandbox/ChartPanel.tsx:288-306` (badge), interacting with `:79-83` (hull points) and `:244-253` (hull pointer handlers)

**Issue:** The role badge (`<rect>` + `<text>`, letter/role chip pattern) is
deliberately rendered in a **non-rotating** sibling group, fixed at
`(BADGE_OFFSET_X, BADGE_OFFSET_Y) = (24.3, 20.3)` with size
`30 × 18`, i.e. spanning chart-local coordinates `x: [9.3, 39.3]`,
`y: [11.3, 29.3]`. The hull polygon (`HULL_POINTS`, a concave kite/arrow
with a notched stern) occupies, at the vessel's un-rotated (`heading: 0`)
orientation, a thin wing on the right side between the "bow→stern" edge and
the "stern→notch" edge. Running the two shapes through a point-in-polygon
test confirms they physically overlap: roughly **45 px²** of the hull's own
painted stern-right wing sits underneath the badge rect (verified
numerically, not just visually estimated).

Because the badge `<rect>` is rendered *after* (i.e. visually on top of) the
rotated hull group in the same `<g>` (see lines 205-309), and SVG's default
`pointer-events: visiblePainted` means any solid-filled shape captures
pointer events for its own painted area regardless of whether it has a
handler, a `pointerdown` that lands in the overlap region is captured by the
badge `<rect>` (which has **no** pointer handlers) instead of reaching the
hull `<polygon>` underneath it. `useHullDrag`'s `onPointerDown` calls
`setPointerCapture` on `event.currentTarget`, so if the initial down event
never reaches the polygon, the drag never starts for pointer-downs in that
zone — this is not a corner-case at extreme headings: `heading: 0` is the
value used by `crossingResidualBasicCase`/`classicCrossingVessels` (the
app's actual default seed and the "Classic crossing" chip), so this dead
zone is present in the sandbox's default, first-paint view for Vessel A,
not just some rotated edge case reachable only by manual dragging.

This is exactly the class of regression the phase's own documentation
flags as highest-risk ("hull shape, rotation-group restructuring" during
UAT) — the badge/letter-offset values here were carried over from
`HeroPreviewCard` (a *static, non-interactive* preview, per this file's own
comment at lines 96-103), without re-verifying that the offsets stay clear
of the *interactive* hull's actual (enlarged) painted silhouette once badge
size and hull size were both scaled up independently.

**Fix:** Make the decorative badge/letter overlay group pointer-transparent,
matching the pattern already established for the range-tooltip group at
line 502 of the same file:

```tsx
{/* Letter identifier (A/B) -- decorative overlay, must never shadow the
    hull's own drag hit-target underneath it. */}
<g pointerEvents="none">
  <circle cx={LETTER_OFFSET_X} cy={LETTER_OFFSET_Y} r={LETTER_CIRCLE_R} className="fill-card" />
  <text ... >{label === "vesselA" ? "A" : "B"}</text>
</g>

{/* Role badge -- same rationale. */}
<g pointerEvents="none">
  <rect ... className={ROLE_HULL_FILL_CLASS[role]} />
  <text ... >{ROLE_BADGE_TEXT[role]}</text>
</g>
```

(Alternatively/additionally, increase `BADGE_OFFSET_X`/`BADGE_OFFSET_Y` so the
badge clears the hull's stern silhouette entirely — but `pointer-events: none`
is the more robust fix since it holds regardless of future hull-size tuning.)
Add a regression test asserting a `pointerdown` at a chart position inside
the badge's visual bounds still starts a hull drag (or asserts
`getComputedStyle(badge).pointerEvents === "none"`).

### CR-02: "Classic crossing" chip shows as active on every shared-scenario page, regardless of loaded data

**File:** `src/components/sandbox/SandboxContainer.tsx:83` (state init), interacting with `:41,54-55` (`initialScenario`) and `app/s/[shareId]/page.tsx:31`

**Issue:**

```ts
const [activeChipId, setActiveChipId] = useState<ChipId | null>("classic-crossing");
```

This initializer is unconditional — it does not check whether
`initialScenario` was provided. `SharedScenarioPage` (`app/s/[shareId]/page.tsx`)
always renders `<SandboxContainer initialScenario={...} banner={...} />` for
*any* saved/shared scenario, including all curated gallery scenarios and any
user-saved scenario with arbitrary geometry that has nothing to do with the
"classic-crossing" chip fixture. Since `activeChipId` starts as
`"classic-crossing"` regardless, the first chip in the row
(`aria-pressed={activeChipId === id}`, filled teal `bg-rule-accent` state)
renders as active on first paint for every `/s/[shareId]` visit, even though
the actually-displayed vessels came from the database, not from
`CHIP_SCENARIOS["classic-crossing"]`.

This directly contradicts the phase's own written interaction contract
(08-UI-SPEC.md: "clear it (deselect all chips, no chip shows the active teal
fill) on any ... change that doesn't originate from a chip click, so the
highlight never goes stale/misleading") — the shared-scenario mount path is
precisely such a case and was missed. It is 100% reproducible (visit any
`/s/{shareId}` URL) and not covered by any existing test
(`SandboxContainer.test.tsx`'s `initialScenario` tests only assert the
classification/Reset behavior, never the chip row's `aria-pressed` state).

**Fix:** Seed `activeChipId` from whether an `initialScenario` was actually
supplied (and only default to `"classic-crossing"` on the plain, seedless
`/` route where the default seed genuinely *is* that chip's fixture):

```ts
const [activeChipId, setActiveChipId] = useState<ChipId | null>(
  initialScenario ? null : "classic-crossing",
);
```

## Warnings

### WR-01: Dead `isDegenerate` prop threading left over from the ReasoningPanel split

**File:** `src/components/sandbox/ChartPanel.tsx:311-317`, `src/components/sandbox/InstrumentReadouts.tsx:61-66`, `src/components/sandbox/types.ts:23,56`

**Issue:** `ChartPanelProps` and `InstrumentReadoutsProps` both declare a
required `isDegenerate: boolean` field, and `SandboxContainer.tsx` passes it
to both components (lines 241, 250). Neither component does anything with
it: `ChartPanel.tsx`'s destructure omits it entirely
(`{ vesselA, vesselB, classification, onVesselPositionChange, onVesselHeadingChange }`
— no `isDegenerate`), and `InstrumentReadouts.tsx` explicitly discards it
(`isDegenerate: _isDegenerate`). This is dead prop-threading inherited from
splitting the single `ReasoningPanel` into three cards — `VerdictBanner.tsx`
is the only one of the three that actually branches on it. It's not a
functional bug (both components already degrade gracefully via `null`
propagation from `deriveInstrumentReadouts()`), but it's API cruft that
invites future confusion (a reader has to trace two components deep to
discover the flag does nothing) and fails a straightforward "is this prop
load-bearing" review.

**Fix:** Either remove `isDegenerate` from `ChartPanelProps`/
`InstrumentReadoutsProps` (and the corresponding JSX props in
`SandboxContainer.tsx`) if the chart/instrument-readouts truly never need to
react to it, or use it for a real visual signal (e.g. dim/mute the chart's
vessel hulls, or show a dashed border on the Instrument Readouts card) if
one is actually intended by the design.

### WR-02: Save/Share mutation has no error handling; button stays enabled while classification is degenerate

**File:** `src/components/sandbox/SandboxContainer.tsx:46-48,189-198`

**Issue:**

```ts
const createScenario = trpc.scenario.create.useMutation({
  onSuccess: ({ shareId }) => router.push(`/s/${shareId}`),
});
...
<Button ... onClick={() => createScenario.mutate({ vesselA, vesselB })}
  disabled={createScenario.isPending}>
```

`scenario-service.ts`'s `createScenario()` deliberately does a dry-run
`classifyEncounter()` and throws `TRPCError({ code: "BAD_REQUEST" })` when
the two vessels are coincident/degenerate — but the Save/Share button here is
only disabled while the mutation is pending, never while `isDegenerate` is
`true`, and the `useMutation` call has no `onError` handler anywhere in the
component (nor a toast/alert mechanism this project uses elsewhere — none
was found in `src/components`). A user who drags a vessel onto the other
(a state this UI otherwise handles gracefully, per `VerdictBanner`'s "Unable
to classify" copy) and then clicks the icon-only Save/Share button gets a
silent no-op: the mutation rejects server-side and nothing visibly happens.

**Fix:** Disable the button while degenerate, and surface mutation errors:

```tsx
<Button
  ...
  onClick={() => createScenario.mutate({ vesselA, vesselB })}
  disabled={createScenario.isPending || isDegenerate}
>
```
```ts
const createScenario = trpc.scenario.create.useMutation({
  onSuccess: ({ shareId }) => router.push(`/s/${shareId}`),
  onError: () => setSaveError("Couldn't save this scenario. Try again."),
});
```

### WR-03: Unguarded clipboard write can produce an unhandled promise rejection

**File:** `src/components/sandbox/CopyLinkButton.tsx:17-21`

**Issue:**

```ts
async function handleClick(): Promise<void> {
  await navigator.clipboard.writeText(window.location.href);
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
}
```

`handleClick` is passed directly to `onClick` with no `try/catch`.
`navigator.clipboard.writeText()` rejects in several realistic conditions
(permission denied, insecure/non-HTTPS context, some Safari/Firefox
permission-prompt-denied paths) — when it does, this produces an unhandled
promise rejection and the button silently does nothing (no "Link copied"
feedback, no error indicator), leaving the user unsure whether the click
registered at all.

**Fix:**
```ts
async function handleClick(): Promise<void> {
  try {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  } catch {
    // surface a distinct failure affordance instead of silently no-op'ing
  }
}
```

### WR-04: New range-tooltip text uses a raw, unregistered hex literal

**File:** `src/components/sandbox/ChartPanel.tsx:508`

**Issue:** The range-tooltip chip added this phase (per the commit history,
wave "add range tooltip chip to Sandbox bearing line") hardcodes
`fill="#D4D4D8"` for its text, rather than using any of the
`@theme`-registered tokens (`--foreground`, `--muted-foreground`, etc.) this
same phase spent effort registering for exactly this purpose. This is a
fresh violation of the phase's own documented done-checklist item ("search
specifically for hex-literal strings... as a done-checklist item") — every
*other* color in this file that was touched this phase (grid, cones, bearing
line, crosshair) either reuses an existing named constant or is explicitly
called out in 08-UI-SPEC.md as an acceptable raw-hex holdover; this one is
new and unaccounted for.

**Fix:** Replace with a Tailwind utility referencing an existing token, e.g.
`className="fill-muted-foreground font-mono text-xs"` (dropping the inline
`fill` attribute) to match the "N" compass-label text a few lines above
(line 460-462) which already does this correctly.

## Info

### IN-01: Doubt/geometry chart colors duplicated as both a raw hex constant and a registered `@theme` token

**File:** `src/components/sandbox/ChartPanel.tsx:114-116`, `app/globals.css:59-60`

**Issue:** This phase registered `--color-doubt`/`--color-geometry` in
`app/globals.css` (used correctly via Tailwind utility classes in
`ReasoningTrail.tsx`/`VerdictBanner.tsx`), but `ChartPanel.tsx` still defines
`DOUBT_STROKE = "#F59E0B"` and `BEARING_LINE_DEFAULT_STROKE = "#475569"` as
independent raw-hex JS constants (used as inline SVG `stroke`/`fill`
attribute values, since Tailwind utility classes can't easily express
runtime-conditional SVG paint attributes). The values currently agree with
the tokens, but nothing ties them together — if `--doubt`/`--geometry` are
ever retuned in `globals.css`, these two SVG-only constants will silently
drift out of sync with the rest of the app's doubt/geometry coloring.
08-UI-SPEC.md explicitly permits leaving these as raw hex ("either choice is
acceptable") but only under the "if deferred [i.e. tokens not registered]"
branch — since the tokens *were* registered this phase, this is the
duplicated-source-of-truth case the spec was trying to avoid, just not
literally "differently-named."

**Fix:** Not urgent, but consider reading the color via
`getComputedStyle(document.documentElement).getPropertyValue('--doubt')` at
render time, or (simpler) add a one-line comment at the constant definition
pointing at `globals.css`'s `--doubt`/`--geometry` so a future edit to one
is more likely to prompt a matching edit to the other.

### IN-02: `heading` prop name collides with the vessel's own domain `heading` concept in the same file

**File:** `src/components/sandbox/ControlPanel.tsx:34,44`

**Issue:** `VesselFormSectionProps.heading: string` is actually a display
title ("Vessel A" / "Vessel B"), not a compass heading — but this exact file
also has `vessel.heading` (a `number`, the real compass heading) and a
`formatHeading()` function operating on that number just a few lines below.
Reading `aria-label={`${heading} speed`}` or `<h2>{heading}</h2>` requires
tracing back to the call site to realize "heading" here means "card title,"
in a domain where "heading" already has a specific, different meaning. This
is exactly the kind of ambiguity CLAUDE.md's engineering persona ("favor
simplicity... comment only non-obvious code") would flag on a second pass.

**Fix:** Rename the prop to `title` or `displayName` to avoid the collision:
`<VesselFormSection label="vesselA" letter="A" title="Vessel A" ... />`.

### IN-03: Unchecked type assertion from Radix `Select`'s string callback to the domain `VesselType` union

**File:** `src/components/sandbox/ControlPanel.tsx:71`

**Issue:**
```tsx
<Select value={vessel.type} onValueChange={(type) => onVesselTypeChange(label, type as VesselType)}>
```
`onValueChange` from Radix's `Select` is typed as `(value: string) => void`;
the `as VesselType` cast is unchecked at this call site. In practice this is
safe today because every `<SelectItem>` value is sourced from
`VesselTypeSchema.options` (line 76), so no out-of-domain string can reach
this callback through normal UI interaction — but the assertion itself
provides no compile-time or run-time guarantee, and would silently pass
through an invalid string if a future edit ever adds a `SelectItem` whose
`value` isn't drawn from that same enum.

**Fix:** Low priority given the current single call site is provably safe,
but consider `VesselTypeSchema.parse(type)` (or `.safeParse` with a fallback)
if this pattern is copied elsewhere, so an accidental future mismatch fails
loudly instead of silently typing through.

---

## Resolution

Both Critical findings and 3 of 4 Warnings were fixed and independently
re-verified (point-in-polygon script for CR-01, live-browser
`elementFromPoint()` check, full 196/196 test suite, `npm run typecheck`,
and a production `npm run build` all clean):

- **CR-01** — fixed in `fb0ec8a`: wrapped the letter/role-badge overlay in
  `pointerEvents="none"`, added a regression test.
- **CR-02** — fixed in `7c7f8ba`: `activeChipId` now only defaults to
  `"classic-crossing"` on the seedless route, added a regression test.
- **WR-01** — fixed in `9a4cd74`: removed the dead `isDegenerate` prop from
  `ChartPanelProps`/`InstrumentReadoutsProps` and all call sites/tests.
- **WR-02** — fixed in `7c7f8ba`: Save/Share mutation now has an `onError`
  handler and is disabled while the classification is degenerate.
- **WR-03** — fixed in `0bf3a29`: clipboard write wrapped in try/catch.
- **WR-04** — fixed in `fb0ec8a`: range-tooltip text now uses
  `fill-muted-foreground` instead of a raw hex literal.

**Deliberately deferred** (all explicitly marked low-priority/not-urgent by
the original review, no user-facing or correctness impact):

- **IN-01** — raw-hex/`@theme`-token duplication for doubt/geometry SVG
  stroke colors in `ChartPanel.tsx`. Values currently agree; documented as
  a future drift risk, not a present bug.
- **IN-02** — `heading` prop name collision in `ControlPanel.tsx`'s
  `VesselFormSectionProps` (display title vs. compass heading). Naming
  clarity issue only, no behavior impact.
- **IN-03** — unchecked `as VesselType` cast on `ControlPanel.tsx`'s
  Select `onValueChange`. Provably safe today (every `SelectItem` value is
  drawn from `VesselTypeSchema.options`); flagged for if the pattern is
  ever copied elsewhere.

---

_Reviewed: 2026-07-18T23:57:39Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
_Resolved: 2026-07-19_
