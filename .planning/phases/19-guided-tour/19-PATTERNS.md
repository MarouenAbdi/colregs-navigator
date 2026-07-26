# Phase 19: Guided Tour - Pattern Map

**Mapped:** 2026-07-26
**Files analyzed:** 7 (5 new, 1 modified, 1 new CSS addition)
**Analogs found:** 7 / 7

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|---------------|
| `src/components/ui/dialog.tsx` | component (ui primitive wrapper) | request-response (open/close, event-driven) | `src/components/ui/select.tsx` | exact — same Radix-primitive-wrapper convention, same repo |
| `src/components/tour/guided-tour-steps.ts` | utility (pure data module) | transform (static data, no I/O) | `src/components/hero/hero-preview-fixture.ts` (also `src/server/db/curated-scenarios.ts`) | role-match — pure exported data, zero JSX, zero framework imports |
| `src/components/tour/TourStepIllustration.tsx` | component (presentation, SVG) | transform (switch-on-prop render) | `src/components/hero/HeroPreviewCard.tsx` (its `VesselMarker` sub-component + `src/components/sandbox/chart/VesselGroup.tsx`) | role-match — plain-JSX SVG composition switched by a discrete key, same repo SVG idiom |
| `src/components/tour/GuidedTourModal.tsx` | component (modal/controller composition) | event-driven (step index state machine + dismissal callbacks) | `src/components/sandbox/chart/VesselOverlayCard.tsx` (card composition/props shape) + Radix Dialog docs pattern in RESEARCH.md | role-match — closest "floating card driven by local state + typed props" analog in this repo; no existing modal to use as an exact analog (this is the first Dialog in the codebase) |
| `src/components/sandbox/SandboxContainer.tsx` (MODIFIED) | component (container, adds trigger button + composes modal) | event-driven (adds local `useState` for tour open/step, wires new header button) | itself — existing Reset/Save button block in the same header row | exact — file already contains the exact pattern to extend |
| `src/components/tour/GuidedTourModal.test.tsx` (or a `SandboxContainer.test.tsx` addition covering the trigger) | test | request-response (render + user-event interaction assertions) | `src/components/sandbox/chart/VesselOverlayCard.test.tsx` | exact — jsdom pragma, `userEvent.setup()`, `afterEach(cleanup)`, ResizeObserver polyfill block all directly reusable |
| `app/globals.css` (MODIFIED — radar-sweep-dot keyframes) | config (styles) | transform (static CSS, no data flow) | No existing keyframe/conic-gradient rule in this file today — see "No Analog Found" | none — net-new CSS pattern for this codebase |

## Pattern Assignments

### `src/components/ui/dialog.tsx` (component, request-response)

**Analog:** `src/components/ui/select.tsx` (full file read; also cross-checked against `src/components/ui/button.tsx`)

**Imports pattern** (`select.tsx` lines 1-5):
```typescript
import * as React from "react"
import { Select as SelectPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { ChevronDownIcon, CheckIcon, ChevronUpIcon } from "lucide-react"
```
For `dialog.tsx`, translate to:
```typescript
import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { XIcon } from "lucide-react"
```

**Core wrapper pattern** (`select.tsx` lines 7-11, `Select` root — no `forwardRef`, just a thin `data-slot`-carrying pass-through):
```typescript
function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}
```
Every Radix part in this repo (`Select`, `SelectTrigger`, `SelectContent`, etc.) follows this exact shape: destructure `className`/`children` when needed, forward everything else, always stamp `data-slot="<kebab-name>"`. `dialog.tsx` must do the same for `Dialog`, `DialogTrigger`, `DialogPortal`, `DialogOverlay`, `DialogContent`, `DialogTitle`, `DialogDescription`, `DialogClose`. **No `React.forwardRef`** anywhere in this repo's `ui/` files — React 19 passes `ref` as a normal prop.

**Portal + z-50 pattern** (`select.tsx` lines 82-134, `SelectContent`):
```typescript
function SelectContent({
  className,
  children,
  position = "item-aligned",
  align = "center",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(`
          relative z-50 max-h-(--radix-select-content-available-height) min-w-36
          origin-(--radix-select-content-transform-origin) overflow-x-hidden
          overflow-y-auto rounded-lg bg-popover text-popover-foreground
          shadow-md ring-1 ring-foreground/10 duration-100
          data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95
          data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95
        `, className)}
        {...props}
      >
        {children}
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}
```
`dialog.tsx`'s `DialogContent` must wrap `DialogPrimitive.Portal` → `DialogOverlay` + `DialogPrimitive.Content` the same way, keep `z-50` (this repo's one and only Portal-content z-index value, used consistently — see "Shared Patterns: Z-index" below), and use the same `data-[state=open]:animate-in`/`data-[state=closed]:animate-out` token-based animation classes (from the already-installed `tw-animate-css` import in `app/globals.css` line 2 — no custom keyframes needed for open/close transitions, only for the net-new radar-sweep-dot, see below).

**No auth/guard pattern applies** — this is a client-only UI primitive with no request boundary.

**No error handling / validation pattern applies** — a primitive wrapper has no try/catch or schema validation; Radix handles all internal state.

---

### `src/components/tour/guided-tour-steps.ts` (utility, transform)

**Analog:** `src/components/hero/hero-preview-fixture.ts` (full file read) — closest "pure static TS data module, zero JSX, zero framework import" in this repo. Secondary analog: `src/server/db/curated-scenarios.ts` (array-of-typed-objects-with-an-interface shape).

**Module shape pattern** (`hero-preview-fixture.ts` lines 1-31):
```typescript
/**
 * [WHY this data exists and where its values came from — not what the code
 * visibly does. hero-preview-fixture.ts justifies every literal against a
 * derivation script/design source, matching this repo's "comments: WHY
 * only" convention.]
 */
import type { Vessel } from "../../domain/vessel/vessel.js";

export const heroPreviewVesselA: Vessel = {
  position: { x: 0, y: 0 },
  heading: 0,
  speed: 12,
  type: "power-driven",
};
```
`guided-tour-steps.ts` should mirror: a single doc comment at the top explaining this is verbatim-ported step content from `19-DESIGN-SNAPSHOT.md` (cite the design source, not "step data" restated), then `export const TOUR_STEPS: TourStep[] = [...]` with an explicit `interface TourStep { id: number; title: string; body: string; points: { tag: string; text: string }[] }` (2-3-tuple vs. general array for `points` is Claude's discretion per CONTEXT.md — `curated-scenarios.ts`'s `CuratedScenario` interface below shows the repo's preferred plain-interface-array style for this kind of shape):

```typescript
// curated-scenarios.ts lines 27-35
export interface CuratedScenario {
  vesselA: Vessel;
  vesselB: Vessel;
  title: string;
  ruleLabel: string;
  rationale: string;
  displayOrder: number;
}

export const curatedScenarios: CuratedScenario[] = [ /* ... */ ];
```

**No JSX, no `"use client"` directive** — both analogs are plain `.ts` (not `.tsx`) modules with zero React import, matching CLAUDE.md's "split computation from presentation" convention exactly.

---

### `src/components/tour/TourStepIllustration.tsx` (component, transform/switch-render)

**Analog:** `src/components/hero/HeroPreviewCard.tsx` (lines 1-70 read) for the "plain-JSX SVG composition, sub-components per visual element" idiom, and `src/components/sandbox/chart/VesselGroup.tsx` (full file read) for the "every visual group gets a WHY comment, no `dangerouslySetInnerHTML`" idiom.

**Imports pattern** (`HeroPreviewCard.tsx` lines 10-35 — geometry/constants imported from a sibling pure-data module, never inlined):
```typescript
import { classifyEncounter } from "../../domain/colregs/classify-encounter.js";
import {
  HERO_CONTAINER_SIZE,
  HERO_VIEW_BOX,
  bearingSectorPath,
} from "./hero-preview-geometry.js";
```
`TourStepIllustration.tsx` should import `TOUR_STEPS`'s type (or just take a `step: number` prop) from `./guided-tour-steps.js`, with zero geometry math needed (the 6 SVGs in `19-DESIGN-SNAPSHOT.md` are literal, fixed-coordinate markup — no `chartToScreen()`/domain calls required, unlike `HeroPreviewCard`).

**Per-instance sub-component pattern** (`HeroPreviewCard.tsx` lines 48-62 — a small named function per distinct visual unit, with a WHY comment justifying any non-obvious transform order):
```typescript
type VesselMarkerProps = {
  screen: { screenX: number; screenY: number };
  heading: number;
  hullColor: string;
  label: string;
  pillText: string;
};

// The hull rotates with heading; the label circle and role-badge pill are
// deliberately SEPARATE, non-rotated groups at a fixed screen offset --
// matching the design source's renderVessel()...
function VesselMarker({ screen, heading, hullColor, label, pillText }: VesselMarkerProps) {
  return (
    <>
      <g transform={`translate(${screen.screenX} ${screen.screenY}) rotate(${heading})`}>
        <path d={HULL_PATH} fill={hullColor} stroke={HULL_STROKE} strokeWidth={HULL_STROKE_WIDTH} />
      </g>
      {/* ... */}
    </>
  );
}
```
Per CONTEXT.md/RESEARCH.md, `TourStepIllustration.tsx` should be **one function per step id** (`WelcomeIllustration`, `MoveVesselsIllustration`, ... or a `switch (step) { case 0: return <WelcomeIllustration />; ... }`), each translating one of `19-DESIGN-SNAPSHOT.md`'s 6 raw SVG template literals into plain JSX (`class` → `className`, self-closing tags, `${...}.map().join('')` → a real `.map()` returning JSX elements with `key`). This matches CLAUDE.md's "no duplicated JSX for near-identical instances" rule *in reverse*: because the 6 illustrations are NOT near-identical, a per-step branch is correct, not a violation — do not force them into one parameterized generic illustration component.

**`VesselGroup.tsx`'s comment convention** (lines 44-49, 60-69, 84-90) — every non-obvious SVG choice (why a group has `pointerEvents="none"`, why a hit-target is sized/shaped a certain way) carries a WHY comment at the definition site. Apply the same standard to any non-obvious per-step SVG choice (e.g. why `viewBox="0 0 460 176"` is kept, why certain colors are hardcoded hex rather than Tailwind tokens — the SVGs use raw hex to port the design source exactly, matching `hero-preview-geometry.ts`'s own precedent of hardcoded hex for a "verdict fixed at authoring time" fixture).

---

### `src/components/tour/GuidedTourModal.tsx` (component, event-driven)

**Analog:** `src/components/sandbox/chart/VesselOverlayCard.tsx` (full file read) for the "floating card, typed props interface, composed from `ui/` primitives" shape; RESEARCH.md's own Code Examples section (lines 250-292) for the Radix-Dialog-specific composition, since no existing Dialog exists in this repo to copy directly.

**Props/composition pattern** (`VesselOverlayCard.tsx` lines 43-51 — typed props destructured directly, no prop-drilling of raw domain objects beyond what's needed):
```typescript
export function VesselOverlayCard({
  label,
  letter,
  vessel,
  classification,
  onVesselSpeedChange,
  onVesselTypeChange,
  onClose,
}: VesselOverlayCardProps) {
```
`GuidedTourModal` should take `{ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }` (RESEARCH.md's Code Examples section, lines 260) and own its own internal `step` state — matching ARCHITECTURE.md's Anti-Pattern 2 (tour state stays local, never lifted into `useSandboxState()`).

**Dialog composition pattern** (RESEARCH.md lines 279-290 — already vetted against this repo's Radix conventions):
```typescript
"use client";
import * as React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { TOUR_STEPS } from "./guided-tour-steps.js";
import { TourStepIllustration } from "./TourStepIllustration.js";

export function GuidedTourModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  const current = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;

  function handleForward() {
    if (isLast) {
      onOpenChange(false); // "Start exploring" closes the tour on the last step
    } else {
      setStep((s) => s + 1);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <TourStepIllustration step={step} />
        {/* body: current.title, current.body, current.points */}
        {/* footer: Back (hidden if step === 0), 6 step dots, forward button */}
      </DialogContent>
    </Dialog>
  );
}
```

**Button reuse pattern** (per CONTEXT.md's "Existing Code this phase must reuse" + `src/components/ui/button.tsx` full file read) — Back/Next/"Start exploring"/Skip all use the existing `Button` component and its `outline`/`ghost`/`default` variants (lines 29-63 of `button.tsx`); no new variant needed:
```typescript
import { Button } from "@/components/ui/button";
// Back:
<Button type="button" variant="ghost" onClick={() => setStep((s) => s - 1)}>Back</Button>
// Skip (header, always visible):
<Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Skip tour</Button>
// Next / Start exploring:
<Button type="button" variant="default" onClick={handleForward}>{isLast ? "Start exploring" : "Next"}</Button>
```

**No error handling / validation pattern applies** — this is static, developer-authored content (RESEARCH.md's Security Domain section: "no user-supplied input rendered").

---

### `src/components/sandbox/SandboxContainer.tsx` (MODIFIED — trigger button + modal composition)

**Analog:** itself, lines 61-76 (existing Reset/Save button block in the header row) — extend this exact block, do not create a new header row.

**Existing header-button pattern to extend** (lines 61-76):
```tsx
<div className="flex gap-2">
  <Button
    type="button"
    variant="outline"
    size="icon-sm"
    aria-label="Save and share this scenario"
    onClick={sandboxState.handleSave}
    disabled={sandboxState.isSaving || sandboxState.isDegenerate}
  >
    <Link2 aria-hidden="true" />
  </Button>
  <Button type="button" variant="outline" onClick={sandboxState.handleReset}>
    <RotateCcw aria-hidden="true" />
    Reset scenario
  </Button>
</div>
```
Add a third `outline`-variant `Button` (teal-tinted styling per `19-DESIGN-SNAPSHOT.md`'s trigger button markup — express via Tailwind classes on this `Button`, not a new variant in `button.tsx`, since this is a one-off treatment) labeled "How to read this" alongside the radar-sweep-dot span, in the same `flex gap-2` container. Wire its `onClick` to `setIsTourOpen(true)` (new local `useState`, per ARCHITECTURE.md Anti-Pattern 2 — do NOT add this to `useSandboxState()`).

**State-locality pattern** (lines 24-35 — `sandboxState` is the one hook that owns all classification-affecting state; anything ephemeral/view-only, like `pendingScenario`'s consumption via `useEffect`, stays local to this component or a sibling hook):
```typescript
const sandboxState = useSandboxState(initialScenario);
const { pendingScenario } = useSandboxBridge();
```
Add `const [isTourOpen, setIsTourOpen] = useState(false);` as a sibling local `useState`, imported alongside the existing `useEffect` import (line 15: `import { useEffect } from "react";` → `import { useEffect, useState } from "react";`), and render `<GuidedTourModal open={isTourOpen} onOpenChange={setIsTourOpen} />` as a sibling of `ChartPanel`/`ReasoningTrail` (after line 105, before the closing `</div>` at line 106-107).

---

### `src/components/tour/GuidedTourModal.test.tsx` (test, request-response)

**Analog:** `src/components/sandbox/chart/VesselOverlayCard.test.tsx` (full file read).

**jsdom pragma + polyfill block** (lines 1-42 — copy verbatim, this is the exact block RESEARCH.md's Pitfall 4 calls out as mandatory):
```typescript
// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  cleanup();
});

class MockResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", MockResizeObserver);
  // ...hasPointerCapture/setPointerCapture/releasePointerCapture/scrollIntoView stubs
  // only needed if a test ends up measuring/scrolling; Dialog itself needs none of these
  // per RESEARCH.md Assumption A3 — add only if a real test failure demands it.
});
```

**Interaction test pattern** (`VesselOverlayCard.test.tsx` lines 83-108, 156-174 — `userEvent.setup()`, `await user.click(...)`, assert via `screen.getByRole`/`findByRole`, never raw `fireEvent`):
```typescript
it("calls onClose when the close button is clicked", async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  render(<VesselOverlayCard /* ... */ onClose={onClose} />);

  await user.click(screen.getByRole("button", { name: "Close Vessel A control card" }));

  expect(onClose).toHaveBeenCalledTimes(1);
});
```
Translate directly to Guided Tour assertions: `await user.click(trigger)` opens (`screen.findByRole("dialog")`), `await user.keyboard("{Escape}")` closes + returns focus (`expect(trigger).toHaveFocus()` — per RESEARCH.md Pitfall 3, always `await` the interaction before this assertion, never assert synchronously after `fireEvent`). RESEARCH.md's own Code Examples section (lines 294-320) has a full pre-authored test for this exact scenario, cross-checked against this analog's structure — safe to use as the literal starting point for `GuidedTourModal.test.tsx`.

---

### `app/globals.css` (MODIFIED — radar-sweep-dot keyframes)

**No analog exists in this codebase** — `app/globals.css` currently declares zero custom `@keyframes` (only imports `tw-animate-css` for the `animate-in`/`animate-out`/`fade-in`/`zoom-in` utility classes already used by `select.tsx`/`button.tsx`). RESEARCH.md's Pitfall 2 confirms a repo-wide grep for `radar`/`sweep`/`conic-gradient`/`animate-spin` returns zero matches — this decorative element must be built from scratch, not reused.

**Convention to follow instead** (per CLAUDE.md's "No raw CSS composed as strings" rule): define a real `@keyframes radar-sweep { ... }` rule and a `.radar-sweep-dot { background: conic-gradient(...); animation: radar-sweep 2s linear infinite; }` class directly in `app/globals.css` (near the `@theme inline` block, `app/globals.css` lines 1-40, or in its own section below it), then reference only the class name (`className="radar-sweep-dot"`) from `GuidedTourModal.tsx`/`SandboxContainer.tsx` — never build the `conic-gradient(...)`/`animation` string via a template literal inside a `.tsx` file.

## Shared Patterns

### Radix primitive wrapper convention (imports, `data-slot`, no `forwardRef`)
**Source:** `src/components/ui/select.tsx` (whole file), `src/components/ui/button.tsx` (whole file)
**Apply to:** `src/components/ui/dialog.tsx` only (the one new `ui/` primitive this phase adds)
```typescript
import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}
```

### Z-index scale — already fully documented by this phase's own D-04/Pitfall-1 finding, nothing new to invent
**Source:** direct grep confirms exactly two z-index declarations exist anywhere in `src/`: `src/components/layout/Header.tsx:23` (`z-50`, sticky header) and `src/components/ui/select.tsx:95` (`z-50`, Portal content). Nothing in `src/components/sandbox/` declares any z-index (confirmed by grep — zero matches).
**Apply to:** `dialog.tsx`'s `DialogContent`/`DialogOverlay` — use `z-50`, matching `SelectContent`'s existing Portal-content value, and add a one-line code comment at the class declaration (D-04's "documented, shared scale" requirement) stating: "Portal-rendered overlays (Select, Dialog) use z-50; nothing else in this app declares an explicit z-index." Do not invent a larger number — Phase 18's `VesselOverlayCard` has no explicit z-index to compete with, and Dialog's Portal escapes the Sandbox's local stacking context entirely regardless.

### Button component/variants (trigger, Back, Next, Skip)
**Source:** `src/components/ui/button.tsx` (whole file — `outline`/`ghost`/`default` variants, `size="default"`/`"sm"` options)
**Apply to:** the new trigger button in `SandboxContainer.tsx`, and the Back/Skip/Next("Start exploring") buttons inside `GuidedTourModal.tsx`. No new variant needed — CONTEXT.md's Reusable Assets section and direct inspection both confirm the 3 existing variants (`outline` for trigger + Back, `ghost` for Skip, `default` for the forward button) cover every button treatment this phase needs.

### "Split computation from presentation" (pure data module + presentation component)
**Source:** CLAUDE.md Conventions section; concretely demonstrated by `src/components/hero/hero-preview-geometry.ts` + `src/components/hero/HeroPreviewCard.tsx` pairing, and `src/components/hero/hero-preview-fixture.ts` (data) feeding the same `HeroPreviewCard.tsx` (presentation).
**Apply to:** `guided-tour-steps.ts` (pure data, zero JSX) must stay fully decoupled from `TourStepIllustration.tsx`/`GuidedTourModal.tsx` (presentation, JSX only) — the data module should be importable and unit-testable with zero React/DOM dependency, matching `hero-preview-fixture.test.ts`'s existence as a proof this repo already tests data modules standalone.

### jsdom test harness (pragma + ResizeObserver polyfill + userEvent)
**Source:** `src/components/sandbox/chart/VesselOverlayCard.test.tsx` (whole file)
**Apply to:** `GuidedTourModal.test.tsx` and any `SandboxContainer.test.tsx` additions covering the new trigger button — copy the `// @vitest-environment jsdom` pragma (first line, mandatory per RESEARCH.md Pitfall 4), `afterEach(() => cleanup())`, and the `MockResizeObserver`/pointer-capture-stub `beforeEach` block if any measurement API turns out to be needed (RESEARCH.md Assumption A3 says likely not, but the stub is cheap insurance already proven safe in this repo).

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `app/globals.css` radar-sweep-dot keyframes/class | config (styles) | transform | No `@keyframes`/conic-gradient rule exists anywhere in this codebase today (RESEARCH.md Pitfall 2, confirmed via grep) — this is genuinely new decorative CSS, built by following the *convention* ("no raw CSS composed as strings," real rules in `globals.css`) rather than copying an existing rule. |
| `src/components/tour/` folder itself (as a top-level feature folder sibling to `sandbox/`) | — | — | First top-level component folder added since `hero/`/`gallery/`/`sandbox/` were established; ARCHITECTURE.md's Recommended Project Structure is the authority here (already read in full via RESEARCH.md), not an existing folder to mirror structurally — though its *internal* file conventions (pure data + presentation split) do have analogs, listed above. |

## Metadata

**Analog search scope:** `src/components/ui/`, `src/components/sandbox/` (incl. `chart/`, `hooks/`, `bridge/`), `src/components/hero/`, `src/components/gallery/` (incl. `card/`), `src/components/layout/`, `src/server/db/`, `src/lib/`, `app/globals.css`
**Files scanned (read in full or targeted):** `select.tsx`, `button.tsx`, `VesselOverlayCard.tsx`, `VesselOverlayCard.test.tsx`, `SandboxContainer.tsx`, `SandboxContainer.test.tsx` (partial), `VesselGroup.tsx`, `HeroPreviewCard.tsx` (partial), `hero-preview-fixture.ts`, `hero-preview-geometry.ts` (partial), `curated-scenarios.ts` (partial), `TryOnSandboxButton.tsx`, `lib/utils.ts`, `app/globals.css` (partial + grep)
**Pattern extraction date:** 2026-07-26
