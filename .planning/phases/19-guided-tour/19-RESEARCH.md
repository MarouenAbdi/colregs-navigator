# Phase 19: Guided Tour - Research

**Researched:** 2026-07-26
**Domain:** Modal/Dialog UI (Radix/shadcn), controlled multi-step content, focus management, Vitest+RTL testing
**Confidence:** HIGH

## Summary

This phase adds the first modal surface (`Dialog`) to a codebase that already has `radix-ui@1.6.2` installed and four other shadcn primitives (`button`, `badge`, `card`, `label`, `select`, `slider`) built against it, all following one consistent convention: `import { X as XPrimitive } from "radix-ui"`, `cn()` from `@/lib/utils`, `data-slot` attributes, Tailwind classes only (no raw CSS-in-JS), and Portal-rendered content pinned to `z-50`. Radix's `Dialog` primitive natively provides everything CONTEXT.md's D-01 needs — Escape-to-close, outside-click-to-close (`onPointerDownOutside`/`onInteractOutside`), a focus trap while open, and focus-return-to-trigger via `onCloseAutoFocus` — with zero hand-rolled logic required. The 6-step content, per-step SVG illustrations, and copy are already fully specified in `19-DESIGN-SNAPSHOT.md`; the main implementation work is (1) authoring `src/components/ui/dialog.tsx` (not yet present) matching this repo's existing primitive-wrapper convention, (2) building `GuidedTourModal`/`guided-tour-steps.ts`/`TourStepIllustration.tsx` in a new `src/components/tour/` folder per `ARCHITECTURE.md`, and (3) confirming the z-index story, which — contrary to the design source's own `z-index:200` fixed-overlay approach — requires **no new numeric z-index decision at all** in the current codebase, because the actual Phase 18 on-chart overlay (`VesselOverlayCard.tsx`) declares no explicit z-index anywhere and Radix's Dialog portals to `document.body` by default, escaping the chart's local stacking context entirely.

**Primary recommendation:** Run `npx shadcn add dialog` (or hand-author `dialog.tsx` mirroring `select.tsx`'s exact structure if the CLI can't reach the registry in the execution sandbox) to get a Radix-backed, `z-50`-ported `Dialog`; build `GuidedTourModal` as a controlled `Dialog.Root` wrapping 6 steps of local `useState<number>` step data from a pure `guided-tour-steps.ts` module; do not add any bespoke z-index — z-50 already unconditionally out-stacks everything else in this app, and document that fact explicitly (D-04) rather than inventing a numeric scale nothing else in the codebase currently participates in.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Tour trigger button | Browser / Client | — | Plain interactive button in `SandboxContainer`'s existing client-side header row |
| Modal open/close state, step index | Browser / Client | — | Ephemeral view state (`useState`), explicitly NOT lifted into `useSandboxState()` per ARCHITECTURE.md Anti-Pattern 2 — ephemeral view state has zero effect on classification |
| Focus trap / Escape / outside-click dismissal | Browser / Client | — | Delegated entirely to Radix `Dialog` primitive (already a client-side dependency) — no custom DOM/keyboard-event code needed |
| Step content (copy, illustrations) | Browser / Client (static data) | — | Pure static TS module + presentation component, zero backend/API involvement — this is a presentation-layer-only phase per PROJECT.md's v1.4 boundary |
| Persistence / first-visit detection | N/A (out of scope) | — | TOUR-03 (auto-launch) explicitly deferred to v2; no DB/API/session-storage work in this phase |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `radix-ui` | `1.6.2` (installed; registry current is `1.6.7`, satisfies project's `^1.6.2` range) [VERIFIED: npm registry] | Unified Radix primitives package (`Dialog` namespace) | Already the project's sole Radix import path (`Select`, `Slider` use it identically) — no new dependency |
| `shadcn` (CLI, devDependency) | `4.13.1` installed; registry current `4.15.0` [VERIFIED: npm registry] | Scaffolds `src/components/ui/dialog.tsx` matching this repo's existing style (`components.json`: `"style": "radix-nova"`) | Already the tool used to add every existing `ui/` primitive in this repo |

No new runtime dependency is required for this phase — `Dialog` ships inside the already-installed `radix-ui` package `[VERIFIED: npm registry — package inspected via node_modules/radix-ui/dist/index.d.ts, confirms "export { reactDialog as Dialog }" backed by @radix-ui/react-dialog]`.

### Supporting
None. This phase needs no additional supporting libraries — `lucide-react` (already installed, used by `VesselOverlayCard.tsx`'s `X` icon) covers the modal's close icon if needed, and `@testing-library/user-event@14.6.1` (already installed) covers all interaction testing (click, keyboard `Escape`, `Tab`).

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| shadcn/Radix `Dialog` | Hand-rolled `position:fixed` overlay (the design source's own approach) | Rejected in CONTEXT.md D-01 — the design's own prototype has no Escape handler and no outside-click handler, which would fail ROADMAP success criteria 3/4 outright; Radix provides both for free |
| shadcn/Radix `Dialog` | A dedicated tour library (Shepherd.js, Intro.js, react-joyride) | Explicitly out of scope per REQUIREMENTS.md — those exist for DOM-anchored "spotlight" tours pointing at live page elements; this tour is a self-contained modal, not spotlight-based |

**Installation:**
```bash
npx shadcn add dialog
```
If the execution sandbox cannot reach the shadcn registry over the network, hand-author `src/components/ui/dialog.tsx` by mirroring `src/components/ui/select.tsx`'s exact conventions (see Code Examples below) — behaviorally and structurally identical output, zero functional difference.

**Version verification:** `npm view radix-ui version` → `1.6.7` (registry current; project's installed `1.6.2` satisfies its own `^1.6.2` package.json range). `npm view shadcn version` → `4.15.0` (registry current; project's installed `^4.13.1` is a live, non-deprecated major). Both checked live against the npm registry at research time, not training data.

## Package Legitimacy Audit

**No new packages are installed by this phase.** `radix-ui` is already a first-party dependency in `package.json` (confirmed via direct file read, not inference), and `npx shadcn add dialog` only copies a component *source file* into this repo — it does not add a new `package.json` entry. The slopcheck/registry-verification gate in this protocol is scoped to *new* external packages; since none are introduced, this section is intentionally empty of findings.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| — | — | — | — | — | — | N/A — no new packages this phase |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
User clicks "How to read this"                 SandboxContainer.tsx (client)
         │                                       ├─ local state: isTourOpen, tourStep
         ▼                                       │
   setIsTourOpen(true) ────────────────────────► Dialog.Root open={isTourOpen}
                                                  onOpenChange={setIsTourOpen}
                                                       │
                                                       ▼
                                              Dialog.Portal → document.body
                                                       │
                                    ┌──────────────────┴───────────────────┐
                                    ▼                                      ▼
                          Dialog.Overlay (z-50, dims page,        Dialog.Content (z-50,
                          blocks pointer events to chart)         focus-trapped, role="dialog")
                                                                           │
                                                          ┌────────────────┴────────────────┐
                                                          ▼                                  ▼
                                              guided-tour-steps.ts[tourStep]        TourStepIllustration
                                              (title, body, points — pure data)     step={tourStep} (SVG)
                                                          │
                                                          ▼
                                         Footer: Back (hidden step 0) · step dots ·
                                         Next / "Start exploring" (advances tourStep,
                                         or calls setIsTourOpen(false) on last step)

Dismiss paths (Escape key press, outside pointerdown, Skip click, "Start exploring"
click on step 6) all converge on the same onOpenChange(false) callback, which Radix
also uses internally to trigger onCloseAutoFocus → focus returns to the trigger button.
```

### Recommended Project Structure
```
src/components/
├── ui/
│   └── dialog.tsx                # NEW — Dialog/DialogContent/DialogOverlay/etc.
└── tour/
    ├── GuidedTourModal.tsx        # NEW — Dialog.Root composition + step/open state
    ├── guided-tour-steps.ts       # NEW — pure data: {id, title, body, points}[]
    └── TourStepIllustration.tsx   # NEW — per-step inline SVG, switched by step id
```
`tour/` is a top-level sibling of `sandbox/`, not nested under it — the tour's static content has zero dependency on Sandbox's state/types (ARCHITECTURE.md Structure Rationale, already confirmed correct by direct inspection: nothing in `19-DESIGN-SNAPSHOT.md`'s step content references a Sandbox prop/type, only descriptive copy).

### Pattern 1: Controlled Dialog with local step-index state (no external state library)
**What:** `SandboxContainer` owns `const [isTourOpen, setIsTourOpen] = useState(false)` and `GuidedTourModal` owns its own `const [step, setStep] = useState(0)`, reset to `0` on each open via `onOpenChange`. `Dialog.Root`'s `open`/`onOpenChange` props make dismissal (however triggered) always funnel through one callback.
**When to use:** Always for this phase — single producer/consumer, matches ARCHITECTURE.md's explicit call to keep this out of `useSandboxState()`/Context/zustand.
**Example:**
```typescript
// Source: Radix UI Primitives docs (Context7 /websites/radix-ui_primitives, Dialog.md)
// https://www.radix-ui.com/primitives/docs/components/dialog
import * as React from "react";
import { Dialog } from "radix-ui";

const [open, setOpen] = React.useState(false);

<Dialog.Root open={open} onOpenChange={setOpen}>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content>{/* step content here */}</Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```
[CITED: radix-ui.com/primitives/docs/components/dialog.md via Context7]

### Pattern 2: shadcn-style primitive wrapper (matches this repo's `select.tsx` exactly)
**What:** Wrap each Radix `Dialog.*` part in a thin function component carrying `data-slot`, `cn(...)`-merged Tailwind classes, and forwarding all other props — no `React.forwardRef` (this repo's React 19 components pass `ref` as a normal prop, matching `select.tsx`'s own style, which uses none of the legacy `forwardRef` wrapping).
**When to use:** For `dialog.tsx` itself, so it is indistinguishable in style/convention from `button.tsx`/`select.tsx`/`slider.tsx`.
**Example:**
```typescript
// Source: this repo's own src/components/ui/select.tsx (direct file read),
// generalized to Dialog's primitive surface. Overlay/Content z-50 convention
// confirmed both by select.tsx's own SelectContent (z-50) and by shadcn's
// public dialog templates (ui.shadcn.com/docs/components/radix/dialog via
// Context7 — every historical shadcn Dialog/Sheet template applies z-50 to
// both Overlay and Content).
import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function Dialog(props: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger(props: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        `
          fixed inset-0 z-50 bg-black/70 backdrop-blur-sm
          data-[state=open]:animate-in data-[state=open]:fade-in-0
          data-[state=closed]:animate-out data-[state=closed]:fade-out-0
        `,
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({ className, children, ...props }: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          `
            fixed top-1/2 left-1/2 z-50 grid max-h-[820px] w-full max-w-150
            -translate-x-1/2 -translate-y-1/2 gap-4 rounded-2xl border
            border-border bg-card p-0 shadow-lg
            data-[state=open]:animate-in data-[state=open]:fade-in-0
            data-[state=open]:zoom-in-95
            data-[state=closed]:animate-out data-[state=closed]:fade-out-0
          `,
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

// ... DialogTitle, DialogDescription, DialogClose follow the same pattern,
// each a thin data-slot wrapper around DialogPrimitive.Title/.Description/.Close
```
[CITED: this repo's src/components/ui/select.tsx; ui.shadcn.com/docs/components/radix/dialog via Context7]

### Pattern 3: Step-switch presentation, not step-switch data
**What:** `guided-tour-steps.ts` exports only `{id: number; title: string; body: string; points: {tag: string; text: string}[]}[]` — zero JSX. `TourStepIllustration.tsx` is a separate component that does `switch (step) { case 0: return <svg>...</svg>; ... }` (or an array of small named sub-components, one per step, to avoid one 150+ line switch).
**When to use:** Directly follows this repo's established "split computation from presentation" convention (CLAUDE.md Conventions section) and its "no duplicated JSX for near-identical instances" rule — since all 6 illustrations are structurally different (not near-identical), each gets its own render branch rather than one parameterized generic shape.
**Example:** See `19-DESIGN-SNAPSHOT.md`'s full 6-SVG source for the literal markup to port; only syntax translation is needed (`class`→`className`, self-closing tags), no semantic change, if translating to JSX instead of `dangerouslySetInnerHTML` (CONTEXT.md leaves this as Claude's discretion, but plain JSX is recommended — see below).

### Anti-Patterns to Avoid
- **Lifting `isTourOpen`/`tourStep` into `useSandboxState()`:** ARCHITECTURE.md Anti-Pattern 2 — this is ephemeral view state with zero effect on classification; keep it local to `SandboxContainer`/`GuidedTourModal`.
- **`dangerouslySetInnerHTML` for the 6 illustrations:** the design source's own templating literal ports cleanly to real JSX (its `${...}` interpolations are plain `.map().join('')` string composition, not anything JSX can't express directly as `.map(...)` returning `<g>` elements) — plain JSX keeps the SVGs statically typed, lintable, and consistent with `VesselGroup.tsx`'s existing plain-JSX SVG convention (per CLAUDE.md's own note flagging this as "likely the better fit").
- **Composing raw CSS strings for the modal card's border/shadow/backdrop-blur treatment:** per CLAUDE.md's "No raw CSS composed as strings" convention — express the design's `border-radius:16px`, `box-shadow:0 40px 90px...`, `backdrop-filter:blur(6px)` via Tailwind utility classes/existing tokens (`rounded-2xl`, `shadow-lg` + a ring, `backdrop-blur-sm`/`backdrop-blur-md`), not a template-literal-built `style` string.
- **Inventing a new z-index number "to be safe":** do not add e.g. `z-[9999]` to the Dialog content. `z-50` (this repo's own established ceiling, used by `SelectContent`) already sits above everything else in the DOM because nothing else in the app declares any competing z-index at all (verified — see Common Pitfalls below).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Focus trap while modal is open | Custom `focus`/`blur` event listeners cycling `document.activeElement` | Radix `Dialog.Content`'s built-in `FocusScope` (automatic, no config needed) | Radix's focus-trap implementation handles Tab/Shift+Tab wraparound, is Context7-verified, and is exactly the gap CONTEXT.md D-01 identifies the design source's own prototype as missing |
| Escape-to-close | `useEffect` + `document.addEventListener("keydown", ...)` | `Dialog.Content`'s default Escape behavior (`onEscapeKeyDown` only needed if you want to *prevent* the default) | Built in, zero code; the design source's prototype has literally zero Escape handling today — this is the exact gap being closed |
| Outside-click-to-close | `useRef` + `mousedown` listener checking `contains()` | `Dialog.Content`'s `onPointerDownOutside`/`onInteractOutside` (fires by default; only override if you need to intercept) | Same rationale — Radix already solves the exact "click outside the fixed overlay" gap the design source's own JS never wired up |
| Focus-return-to-trigger on close | Manually storing `document.activeElement` before open and calling `.focus()` after close | `Dialog.Content`'s `onCloseAutoFocus` (fires automatically, returns focus to the trigger element by default) | This is ROADMAP success criterion 4 — Radix does this natively; hand-rolling risks exactly the "trigger button unmounted mid-tour" edge case PITFALLS.md's Pitfall 4 calls out |

**Key insight:** every one of ROADMAP's Phase 19 success criteria 2-5 (Back/Next nav aside) maps 1:1 onto a Radix `Dialog` default behavior that the design source's own hand-coded prototype does not implement. The entire "hard part" of this phase is already solved by the primitive already installed in this repo — the actual new code is 3 small React components plus one data file.

## Common Pitfalls

### Pitfall 1: Assuming a z-index collision risk exists and inventing a number to fix it
**What goes wrong:** A planner reads the design source's `z-index:200` and PITFALLS.md's warning about "two new stacking features landing in the same milestone" and concludes a large, explicit z-index must be assigned to the Tour to beat the on-chart overlay.
**Why it happens:** The design source (a bespoke, non-portaled fixed-position prototype) genuinely needed an explicit z-index because it was a sibling DOM node competing with everything else on the page in normal document flow. The *actual current codebase* is structured completely differently.
**How to avoid:** Direct inspection of the current codebase (`src/components/sandbox/chart/VesselOverlayCard.tsx`, `ChartPanel.tsx`) confirms **no explicit z-index exists anywhere in `src/components/sandbox/`** — the overlay card is positioned via a `relative` container plus later DOM order, relying on default stacking (`z-index: auto`). `SelectContent` (the only other Portal-rendered content in this app) already uses `z-50`, confirmed by direct file read of `select.tsx`. A Radix `Dialog.Content` rendered via `Dialog.Portal` to `document.body` with `z-50` will unconditionally paint above the entire in-page-flow Sandbox tree — Portal-rendered content escapes the ancestor's local stacking context regardless of the ancestor's own z-index (which, again, is `auto`/unset here anyway). **No new z-index scale/tier is actually required for correctness** — D-04's real deliverable is documentation (a code comment or a short section in this repo's z-index convention, e.g. inside `dialog.tsx` or a shared note) stating: "Portal-rendered overlays (`Select`, `Dialog`) use `z-50`; nothing else in this app declares an explicit z-index — do not add one to in-flow Sandbox components without updating this note." This satisfies D-04's requirement (a documented, shared scale) without inventing numbers nothing in the codebase needs.
**Warning signs:** A PLAN.md task that says "set Tour z-index to something higher than 200" (there is no 200 anywhere in this codebase — that number only ever existed in the un-ported design source) or that adds a `z-index`/`z-[N]` class to `VesselOverlayCard.tsx` as part of this phase (out of scope — Phase 18 is shipped, and it currently needs no change for this phase's success criterion 5 to hold).

### Pitfall 2: The "radar-sweep-dot" visual referenced in CONTEXT.md's Existing Code Insights does not actually exist yet in the codebase
**What goes wrong:** CONTEXT.md's "Reusable Assets" section states an "existing radar-sweep-dot visual... already used elsewhere in the design's header chrome" is available for reuse in the trigger button and modal header.
**Why it happens:** That claim describes the *design source's* header chrome (the live `claude.ai/design` file), not this repository's actual current code. A repo-wide grep for `radar`, `sweep`, and `conic-gradient`/`animate-spin` returns **zero matches** anywhere in `src/` or `app/` — confirmed via direct search, not inference.
**How to avoid:** Treat the radar-sweep-dot as new decorative chrome to build (a small `<span>` with a CSS conic-gradient background and a spin animation, per the "no raw CSS composed as strings" convention — express it as a real CSS rule in `app/globals.css`, toggled by a class, not an inline `style` string), not as an import/reuse of an existing component. This is a small, low-risk addition, but the planner should not create a task assuming an importable `RadarSweepDot` component already exists.
**Warning signs:** A plan task phrased as "reuse the existing radar-sweep-dot component" without a file path — there is no such file to reuse.

### Pitfall 3: jsdom focus-trap/auto-focus assertions can be flaky if not driven through real Tab-key events
**What goes wrong:** Automated tests assert `document.activeElement` immediately after a state change (e.g., right after `fireEvent.click(closeButton)`) without waiting for Radix's `FocusScope`/`onCloseAutoFocus` microtask/RAF-based focus restoration to complete, producing an intermittently-passing or falsely-passing test.
**Why it happens:** Radix's focus management (both trapping while open and restoring the trigger on close) is not always synchronous with React's render commit — some of it schedules via `requestAnimationFrame`/microtasks. jsdom implements a real `document.activeElement` and real `Tab` key focus order via `@testing-library/user-event`'s `tab()` API (unlike, e.g., `getBBox()`/`getScreenCTM()`, which jsdom simply does not implement — see this repo's own documented `PROJECT.md` caveat), so this is testable, but only if assertions are made with `await` after `user-event` interactions (which already return promises) rather than synchronous `fireEvent`. `[MEDIUM confidence — WebSearch cross-referenced against Radix's own documented focus-trap/auto-focus behavior, no single canonical source found for the exact timing guarantee, but consistent across multiple community reports]`
**How to avoid:** Use `@testing-library/user-event@14.6.1`'s `user.keyboard("{Escape}")` and `user.tab()` (both already the pattern this repo uses for Slider arrow-key tests in `VesselOverlayCard.test.tsx`) and always `await` them before asserting `document.activeElement`. Per ROADMAP success criterion 4, this project has *also* explicitly decided the ultimate focus-return check must be **human-verified via real Tab-key navigation, not just an automated assertion** — the automated test is a smoke check, not the sign-off gate.
**Warning signs:** A test asserting `expect(document.activeElement).toBe(triggerButton)` directly after a synchronous `fireEvent.click()` with no `await`/`waitFor` — likely to be flaky or to pass for the wrong reason.

### Pitfall 4: Default Vitest test environment is `node`, not `jsdom` — must opt in per-file
**What goes wrong:** A new `GuidedTourModal.test.tsx` is written without the per-file jsdom pragma, causing `document`/`window` to be undefined at test time.
**Why it happens:** `vitest.config.ts` sets `environment: "node"` as the explicit project default (confirmed via direct file read); component-level tests opt into jsdom per file.
**How to avoid:** Add `// @vitest-environment jsdom` as the very first line of the new test file, exactly as `VesselOverlayCard.test.tsx` already does — copy that file's `beforeEach`/`ResizeObserver` polyfill block if `ResizeObserver` or `scrollIntoView` end up needed (Dialog itself does not require them, but if the modal's illustration area or the page underneath measures anything, port the same stub pattern).
**Warning signs:** `ReferenceError: document is not defined` at test run.

## Code Examples

### Radix Dialog controlled composition with close-on-last-step
```typescript
// Source: Radix UI Primitives docs (Context7 /websites/radix-ui_primitives)
// https://www.radix-ui.com/primitives/docs/components/dialog
"use client";
import * as React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog"; // once dialog.tsx exists
import { TOUR_STEPS } from "./guided-tour-steps.js";
import { TourStepIllustration } from "./TourStepIllustration.js";

export function GuidedTourModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [step, setStep] = React.useState(0);

  // Reset to step 0 each time the tour (re)opens.
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
        {/* header: step counter + Skip button (calls onOpenChange(false)) */}
        <TourStepIllustration step={step} />
        {/* body: current.title, current.body, current.points */}
        {/* footer: Back (hidden if step === 0, calls setStep(s => s - 1)),
            6 step dots, forward button (label: isLast ? "Start exploring" : "Next") */}
      </DialogContent>
    </Dialog>
  );
}
```
[CITED: radix-ui.com/primitives/docs/components/dialog.md via Context7; step-close logic derived from `19-DESIGN-SNAPSHOT.md`'s documented `tourNext()` behavior]

### Testing Escape-dismissal and focus return (pattern to establish, none exists yet in this repo)
```typescript
// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { SandboxContainer } from "./SandboxContainer.js"; // or a smaller host wrapping the trigger + modal

afterEach(() => cleanup());

describe("Guided Tour dismissal", () => {
  it("returns focus to the trigger button after Escape", async () => {
    const user = userEvent.setup();
    render(<SandboxContainer />);

    const trigger = screen.getByRole("button", { name: "How to read this" });
    await user.click(trigger);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
```
[ASSUMED — pattern authored for this research, not copied from an existing test in this repo; follows the same `userEvent.setup()` / `afterEach(cleanup)` shape as `VesselOverlayCard.test.tsx`]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Per-primitive Radix packages (`@radix-ui/react-dialog`, `@radix-ui/react-select`, ...) | Single unified `radix-ui` package re-exporting each primitive under a namespace (`Dialog`, `Select`, ...) | Already the state of this project — every existing `ui/` file uses the unified import | Simpler import surface; `components.json`'s `"registries": {}` + `"style": "radix-nova"` confirms this project's shadcn setup is already aligned to the unified package, not legacy per-package imports |
| shadcn/ui built only on Radix | shadcn/ui's newer docs also support a Base UI-backed primitive layer (`ui.shadcn.com/docs/components/base/dialog`) alongside the Radix-backed one (`ui.shadcn.com/docs/components/radix/dialog`) | Per shadcn's 2026-01 changelog entry surfaced via Context7 | Not relevant to this project — `components.json`'s `"style": "radix-nova"` and every existing `ui/` component's `radix-ui` import confirm this project is on the Radix-backed variant; do not accidentally pull a Base UI Dialog template |

**Deprecated/outdated:** None directly affecting this phase — Radix Dialog's core API (`Root`/`Trigger`/`Portal`/`Overlay`/`Content`/`Close`, `onOpenAutoFocus`/`onCloseAutoFocus`/`onEscapeKeyDown`/`onPointerDownOutside`/`onInteractOutside`) is stable and unchanged in the currently-installed `1.6.2`/current-registry `1.6.7` versions.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `npx shadcn add dialog` will scaffold a file structurally equivalent to the hand-authored example in Pattern 2 (exact class names/animation utilities may differ slightly from what's shown) | Architecture Patterns, Pattern 2 | Low — if the CLI output differs cosmetically, the planner/implementer should conform to whatever the CLI actually emits rather than the illustrative example above; functional behavior (Radix Dialog defaults) is unaffected either way |
| A2 | Radix's `onCloseAutoFocus`/focus-trap timing is safely `await`-able via `@testing-library/user-event` without extra `waitFor` wrapping | Common Pitfalls, Pitfall 3 | Low-Medium — if a test proves flaky, wrap the focus assertion in `waitFor(() => expect(trigger).toHaveFocus())` rather than treating a single flaky run as a Radix bug |
| A3 | Neither `ResizeObserver` nor `scrollIntoView` polyfills are needed for Dialog-specific tests (only needed if the modal's own layout measures the viewport, which the design source's markup does not do) | Common Pitfalls, Pitfall 4 | Low — worst case, add the same stub block `VesselOverlayCard.test.tsx` already uses if a test fails with a missing-API error |

**If this table is empty:** N/A — see entries above; none are HIGH risk.

## Open Questions (RESOLVED)

1. **Does `npx shadcn add dialog` succeed inside the execution/CI sandbox (network access to the shadcn registry)?**
   - What we know: the project's `components.json` and existing `ui/` files confirm the CLI has been used successfully before in this repo's history.
   - What's unclear: whether the specific sandboxed environment running Phase 19's implementation has outbound network access to `ui.shadcn.com`'s registry at execution time.
   - Recommendation: attempt the CLI first; if it fails (network-restricted sandbox), hand-author `dialog.tsx` directly from Pattern 2's example above, which is functionally and stylistically equivalent to what the CLI would produce for this project's `radix-nova` style.
   - Resolved in 19-01-PLAN.md Task 1: attempt `npx shadcn add dialog`, fall back to hand-authoring from this doc's example.

2. **Exact Tailwind/token translation of the design's `600px` max-width / `820px` max-height / border/shadow treatment.**
   - What we know: CONTEXT.md explicitly leaves "precise Tailwind/shadcn translation... port the *behavior and visual result*... not the design's raw hex/px literals verbatim" as Claude's discretion, same porting convention Phase 18 used.
   - What's unclear: the exact utility class values (e.g., `max-w-150` ≈ 600px at this project's `1rem=4px`-style spacing scale used elsewhere — verify against this repo's actual Tailwind config scale rather than assuming a 1:1 rem mapping).
   - Recommendation: implementer should check `app/globals.css`'s `--spacing`/`--radius` custom properties (same pattern `card.tsx` uses via `--card-spacing`) before hardcoding a `max-w-[600px]` arbitrary value, to stay consistent with the token-first convention already established.
   - Resolved: `max-w-150` = 600px on this project's 0.25rem Tailwind v4 spacing scale.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `radix-ui` (npm) | Dialog primitive | ✓ | 1.6.2 installed (1.6.7 current on registry) | — |
| `shadcn` CLI | Scaffolding `dialog.tsx` | ✓ (installed as devDependency) | 4.13.1 installed (4.15.0 current on registry) | Hand-author `dialog.tsx` from Pattern 2 if `npx shadcn add dialog` cannot reach the registry at execution time |
| `@testing-library/user-event` | Escape/Tab/click simulation in tests | ✓ | 14.6.1 | — |
| Real browser (for human-verification checklist items) | ROADMAP success criteria 4 and 5 (real Tab-key focus verification, real z-index visual check) | Assumed available to the human operator, not to the automated test run | — | None — these two success criteria are explicitly human-verification-only per ROADMAP, cannot be automated away |

**Missing dependencies with no fallback:** none blocking.
**Missing dependencies with fallback:** shadcn CLI registry access (fallback: hand-author `dialog.tsx`).

## Project Constraints (from CLAUDE.md)

- Tech stack is locked: Next.js 16 / React 19 / TypeScript / Tailwind (frontend), no new frontend dependency without justification — this phase adds zero new npm dependencies.
- DDD-lite/Clean Architecture, feature-first organization, "justify every abstraction" — `tour/` as a standalone top-level folder (not nested in `sandbox/`) is justified by zero-coupling to Sandbox state/types (see Architectural Responsibility Map / Recommended Project Structure above).
- "Comment only non-obvious code" — the z-index documentation note (Pitfall 1) and the radar-sweep-dot build-from-scratch note (Pitfall 2) are exactly the kind of non-obvious, locked-decision comments this convention calls for.
- Testing approach: TDD where practical, Vitest + RTL, focused on business rules/domain logic as highest priority — this phase is presentation-only (no domain logic change), so tests here are components/interaction tests (open/close/step-nav/focus), consistent with `VesselOverlayCard.test.tsx`'s existing precedent, not new domain unit tests.
- Git workflow: feature branch (`gsd/phase-19-guided-tour`, already checked out per environment info), small conventional commits.
- "Split computation from presentation" convention: `guided-tour-steps.ts` (pure data) must stay JSX-free; `TourStepIllustration.tsx`/`GuidedTourModal.tsx` are the presentation layer.
- "No duplicated JSX for near-identical instances": the 6 step illustrations are NOT near-identical to each other (each is visually distinct per `19-DESIGN-SNAPSHOT.md`), so this rule does not require a single parameterized illustration component — a per-step switch/branch is appropriate, not a violation.
- "No raw CSS composed as strings": the modal card's border/shadow/blur treatment and the new radar-sweep-dot's conic-gradient/spin animation must be real CSS rules in `app/globals.css` (or Tailwind utilities), never a template-literal-built `style` string.
- "Shared/decorative primitives: extract only on a real second consumer": do not pre-extract a generic `Modal`/`Stepper` abstraction beyond what `Dialog`/`GuidedTourModal` already provide — this is the tour's first and only consumer.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TOUR-01 | User can open a 6-step guided tour via a "How to read this" button, with Back/Next/Skip controls, a per-step illustration, and step-dot progress | Standard Stack (Dialog primitive, zero new deps), Architecture Patterns (Pattern 1 controlled Dialog + Pattern 3 step data/illustration split), Code Examples (controlled composition with step-close logic), full step content already extracted verbatim in `19-DESIGN-SNAPSHOT.md` |
| TOUR-02 | Tour dismisses via Escape, clicking outside, or Skip/Done, and returns keyboard focus to the trigger button | Don't Hand-Roll table (all 3 dismissal paths + focus-return are native Radix `Dialog.Content` behaviors), Common Pitfalls 1 (z-index non-issue) and 3 (jsdom focus-trap test timing), Code Examples (Escape-dismissal + focus-return test pattern) |
</phase_requirements>

## Security Domain

This phase is presentation-layer-only, adds no new input surface, no authentication/session logic, no cryptography, and no new API/data boundary (PROJECT.md's v1.4 constraint: "zero change to `classifyEncounter()`/domain logic — presentation layer only"). The Dialog's step content is static, developer-authored copy with no user-supplied input rendered — no XSS/injection surface is introduced. No ASVS categories apply beyond what the existing app already satisfies; this section is intentionally minimal because the phase has no security-relevant surface to audit.

## Sources

### Primary (HIGH confidence)
- Context7 `/websites/radix-ui_primitives` — Dialog Root/Content API (`open`/`onOpenChange`/`modal` defaults, `onOpenAutoFocus`/`onCloseAutoFocus`/`onEscapeKeyDown`/`onPointerDownOutside`/`onInteractOutside`), controlled composition example, custom-Dialog-wrapping example
- Direct repository inspection (HIGH confidence, ground truth): `package.json`, `components.json`, `src/components/ui/select.tsx`, `src/components/ui/button.tsx`, `src/components/ui/card.tsx`, `src/components/sandbox/chart/VesselOverlayCard.tsx`, `src/components/sandbox/chart/ChartPanel.tsx`, `src/components/sandbox/SandboxContainer.tsx`, `app/globals.css`, `vitest.config.ts`, `vitest.setup.ts`, `node_modules/radix-ui/dist/index.d.ts` (confirms `Dialog` export path), `node_modules/radix-ui/package.json` (confirms React 19.2 peer range)
- `npm view radix-ui version` / `npm view shadcn version` — live registry versions, run at research time

### Secondary (MEDIUM confidence)
- Context7 `/websites/ui_shadcn` — historical Dialog/Sheet component templates confirming the `z-50` Overlay/Content convention and shadcn's newer Radix-vs-Base-UI style split (`ui.shadcn.com/docs/components/radix/dialog` vs `.../base/dialog`) — cross-checked against this repo's own `components.json` `"style": "radix-nova"` to confirm which variant applies
- WebSearch: "Radix Dialog testing jsdom vitest focus trap Escape outside click" — general community confirmation that Radix's focus-trap/auto-focus behavior is testable in jsdom via testing-library but timing-sensitive; no single canonical source, cross-referenced against multiple results (GitHub issues/discussions, dev.to articles)

### Tertiary (LOW confidence)
- None — all findings above were either verified via Context7/official docs or via direct, ground-truth repository inspection.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies, all versions confirmed live against npm registry, Dialog export path confirmed by reading `node_modules` directly
- Architecture: HIGH — patterns derived directly from this repo's own existing `select.tsx`/`button.tsx` conventions plus Context7-verified Radix Dialog API, not speculative
- Pitfalls: HIGH for the z-index and radar-sweep-dot findings (both confirmed via direct repo grep, not inference); MEDIUM for jsdom focus-trap test timing (no single canonical source, but consistent across multiple community reports)

**Research date:** 2026-07-26
**Valid until:** 2026-08-25 (30 days — stable, low-churn API surface; Radix Dialog and shadcn's core Dialog conventions are not fast-moving)
