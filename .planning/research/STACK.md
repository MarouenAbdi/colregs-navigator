# Stack Research

**Domain:** Front-end redesign sync — modal wizard, on-chart floating overlays, cross-section client state sharing (Next.js App Router + React 19 + shadcn/ui)
**Researched:** 2026-07-25
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

No changes. This milestone is presentation-layer only against an already-locked stack (Next.js 16.2.10, React 19.2.7, TypeScript 7.0.2, Tailwind 4.3.3, tRPC 11.18.0, Prisma 7.8.0, Zod 4.4.3, Vitest 4.1.10 + RTL 16.3.2) — see `CLAUDE.md` for full existing table. Nothing in this milestone's three questions requires touching the core table.

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `radix-ui` (already installed, `^1.6.2`) | 1.6.2 | Underlying primitive package that shadcn's `Dialog` and `Popover` registry components import from | Already a dependency — do not add `@radix-ui/react-dialog` or `@radix-ui/react-popover` as separate packages; this project already uses the unified `radix-ui` meta-package (confirmed in `package.json`), so adding the shadcn `dialog`/`popover` components only writes new files into `src/components/ui/`, zero new npm dependency |
| shadcn `dialog` registry component (not yet in `src/components/ui/`) | shadcn CLI `^4.13.1` (already installed) | Guided Tour modal shell | Run `npx shadcn@latest add dialog` once. Confirmed via `ls src/components/ui/` that only `badge`, `button`, `card`, `label`, `select`, `slider` exist today — `dialog` and `popover` are genuinely missing and need to be added, but via the CLI (source files), not as new npm packages |
| shadcn `popover` registry component (not yet in `src/components/ui/`) | shadcn CLI `^4.13.1` | Shell (portal, dismiss-on-outside-click, Escape-to-close, focus return) for the on-chart floating vessel-control overlay | Run `npx shadcn@latest add popover` once. See Architecture rationale below — recommended over a fully hand-rolled `position: absolute` div with manual outside-click/Escape handling |

No other new libraries are needed for this milestone's three questions. Deliberately not adding: a dedicated stepper/wizard package (see "What NOT to Use"), a floating-UI/positioning package beyond what Radix's Popover already ships with, or zustand (see Question 3 rationale below).

### Development Tools

No changes to tooling for this milestone.

## Installation

```bash
# Only these two shadcn registry additions are needed — both resolve against the
# already-installed `radix-ui` package, so `npm install` output should show no new
# dependency lines, only new files under src/components/ui/.
npx shadcn@latest add dialog
npx shadcn@latest add popover
```

## Question 1 — Modal for the Guided Tour: shadcn `Dialog` fits, use it as-is

**Verdict: yes, shadcn/ui's `Dialog` (Radix `Dialog` under the hood) is the right and sufficient primitive. Do not add a dedicated stepper/wizard library.**

Verified against the shadcn/ui registry source (Context7 `/shadcn-ui/ui`) and Radix's own `Dialog` implementation (Context7 `/radix-ui/primitives`):

- `Dialog` is fully **controlled** via `open`/`onOpenChange` — the shadcn registry's own example (`drawer-dialog.tsx`) demonstrates exactly this shape (`const [open, setOpen] = useState(false)` passed straight into `<Dialog open={open} onOpenChange={setOpen}>`). The Guided Tour's `open` state is driven by the "How to read this" button; step state is a **separate**, independent piece of state (`currentStep`) held in the same component.
- Radix's `DialogContent` is wrapped in a `Presence` component gated only on the `open` boolean (not on `children` identity) — swapping the step-illustration/body content on Next/Back/Skip **does not remount or reopen the dialog**, it's a normal React re-render inside an already-open, already-focus-trapped dialog. This directly answers the "6-step walkthrough inside one modal" requirement: one `<Dialog>` instance, `currentStep` drives which body/illustration slot renders, `DialogFooter` renders Back/Next/Skip buttons that mutate `currentStep` (and call `setOpen(false)` on Skip/final Next).
- Focus management, Escape-to-close, and outside-click dismissal are handled by Radix's `FocusScope`/`DismissableLayer` automatically — no extra work needed for the modal shell itself.
- The step-dot progress indicator has **no dedicated shadcn component** — the shadcn "Component Selection" skill doc (fetched via Context7) explicitly enumerates overlay components (Dialog/Sheet/Drawer/AlertDialog) and feedback components (Progress/Toast/Skeleton/Spinner) and lists no "Stepper" anywhere. `Progress` (a linear bar) is the wrong visual shape for "6 discrete dots." Hand-roll the dots: a small row of `<button>` elements (one per step, `aria-current` on the active one, filled vs. outline styling via a Tailwind class toggle) inside `DialogFooter` or a dedicated header slot. This is a handful of lines and fits this project's "justify every dependency" persona — there is no ecosystem-standard shadcn stepper to reach for instead.
- No responsive Dialog→Drawer swap is needed here (that pattern exists in the shadcn examples for mobile bottom-sheet UX) — the design calls for a modal walkthrough, and this project is desktop-first/portfolio-demo scoped; keep it a plain `Dialog` unless the design file specifically shows a bottom-sheet variant on narrow viewports.

## Question 2 — On-chart floating overlay divs over the pointer-event-driven SVG

**Verdict: use plain absolutely-positioned HTML (not SVG `foreignObject`), computed via the project's existing `chartToScreen()` pure function — not `getBoundingClientRect()`/Radix's automatic anchor-tracking on the SVG node itself — and wrap the card in shadcn's `Popover` (added above) purely for its dismiss/focus behavior, using Popover's documented "virtual anchor" pattern to feed it the already-computed coordinate.**

This is a CSS/React stacking question, not a domain question, and it composes cleanly with two decisions already locked in this project (`.planning/PROJECT.md` Key Decisions table):

1. **Positioning source of truth: reuse `chartToScreen()`, don't touch the SVG DOM.** This project already has (per `CLAUDE.md`) a pure, DOM-free `chartToScreen()`/`screenToChart()` pair, specifically because `SVGElement.getScreenCTM()`/`getBBox()` are unimplemented in jsdom and untestable in components. The same caveat extends to `getBoundingClientRect()` on an SVG node driving a positioning library: it works in real browsers but is a common jsdom/RTL testing gap (returns a zeroed rect unless explicitly mocked). **Do not** anchor Radix's `Popover` directly to a `ref` on the SVG vessel `<g>` element — that would silently reintroduce a DOM-dependent, hard-to-unit-test code path this project has already deliberately engineered around once. Instead, compute the vessel's screen-space `{x, y}` with the existing `chartToScreen()` function (same one already used for chart↔screen conversion) and feed that plain number pair into the overlay's position — fully unit-testable with plain fixtures, zero DOM dependency, consistent with the codebase's established pattern of pure computation modules paired with dumb presentation.
2. **Use the shadcn `Popover`'s documented "virtual anchor" pattern for the open/dismiss shell only.** Radix's own `PopoverAnchor` doesn't require a real rendered trigger — the shadcn registry's `context-menu.tsx` (fetched via Context7) demonstrates exactly this: a zero-size, invisible, `position: fixed` div is portaled in at a computed `{x, y}` and wired in as the anchor via `PopoverContext.Provider`/`triggerRef`. Reuse that same pattern: render a 1px invisible anchor div at the `chartToScreen()`-computed coordinate, feed it to `Popover`'s anchor, and let Radix's `Popper` positioning handle side/align/collision-avoidance (flip away from chart edges) for the actual card — for free, without hand-rolling clamping math. This gets you Radix's outside-click dismissal, Escape-to-close, and focus return (needed for the select + range slider inside the card to be keyboard-accessible) without writing that logic by hand — genuinely nontrivial to get right, and this project's own pitfalls list (two prior hit-testing regressions) shows hand-rolled interaction/positioning code in this codebase has bitten it before.
3. **Pointer-events layering extends the project's existing locked precedent, doesn't introduce a new one.** `.planning/PROJECT.md`'s Key Decisions table already establishes: "Decorative overlays layered on top of an interactive shape need explicit `pointer-events: none`" (the Phase 8 badge-overlay regression). The floating overlay card is the same shape of problem one layer up (HTML-over-SVG instead of SVG-over-SVG):
   - The **card itself** must NOT have `pointer-events: none` (it contains a real `select` + `slider` the user must operate).
   - Any **invisible connector/gap** between the anchor point and the card (if the design has one) must have `pointer-events: none` explicitly, exactly per the existing precedent — don't let an invisible spacer silently swallow clicks meant for the vessel hull underneath.
   - Because the card is a normal HTML element rendered later in DOM order (or portaled to `document.body`, which Radix's `Popover.Portal` does by default) with a higher effective stacking position than the SVG, it will correctly capture pointer events over anything visually beneath it **without any special CSS** — this is ordinary DOM stacking, not an SVG-specific concern; no `pointer-events: none` is needed on the SVG chart itself.
   - **Add a click-vs-drag threshold**, since opening the overlay is triggered by "vessel clicked/selected" but the existing pointer handlers already run drag logic (`onPointerDown`/`onPointerMove`/`onPointerUp` + `setPointerCapture` per `CLAUDE.md`'s locked architecture). A short (~4-6px) movement threshold between `pointerdown` and `pointerup` on the same target is the standard way to distinguish "this was a click, open the overlay" from "this was a drag, don't." This is a few lines added to the existing pointer handler, not a new dependency — do not reach for a gesture library (`@use-gesture/react`, already rejected in this project's original stack research) for this.
   - Follow the same "move a chunk of hit-testing-sensitive code atomically, human-verify drag+rotate afterward" discipline this project used for `VesselGroup.tsx` in Phase 12 — adding a sibling overlay near the hull is exactly the kind of change the Phase 4/Phase 8 regressions warn about, so a manual drag/rotate/click-to-open verification pass before closing this feature is warranted, not optional.
4. **Container requirement:** wrap the SVG chart and its overlay layer in a shared `position: relative` container so the overlay's `position: absolute` (or the portaled anchor's `position: fixed`, per the shadcn pattern above) resolves against the chart, not the page. Confirm the chart container doesn't set `overflow: hidden`/`clip` in a way that would clip a card positioned near a vessel close to the chart edge — clamp the computed `{x, y}` within the container's bounds as a small, independently-testable extension of the existing `chartToScreen()` module rather than a CSS-only fix.

## Question 3 — Sharing state between the Gallery Server Component grid and the Sandbox client component

**Verdict: use a small, page-scoped React Context (a Client Component provider wrapping the existing Server Component composition) — not zustand, at least not for this milestone.**

Verified against Next.js's own current App Router docs (Context7 `/vercel/next.js/v16.2.9`, matching this project's locked `16.2.10`):

- Next.js's official guidance for exactly this shape of problem ("Server Components can't hold/provide React Context") is: **create a Client Component that accepts `children` and acts as a provider, render it from a Server Component, and place providers "as deep as possible in the component tree."** This is a first-party documented pattern (`Context providers` section, `05-server-and-client-components.mdx`), not an inferred workaround.
- Concretely: add one small Client Component (e.g. `SandboxBridgeProvider`) that wraps just the home page's `<Gallery />` + `<Sandbox />` composition inside `app/page.tsx` (a Server Component). It exposes something like `{ pendingScenario, requestLoad(scenario) }` via `useContext`. `GalleryCard`'s "Try on Sandbox" button (already a Client Component, since it needs `onClick` + hover state) calls `requestLoad(scenario)`; `Sandbox`'s root client component (already the `useSandboxState()` consumer) reads `pendingScenario` via a `useEffect` and applies it, then smooth-scrolls (`scrollIntoView({ behavior: "smooth" })`) to itself. `Gallery` itself stays a Server Component for its tRPC-driven data fetch (`gallery.list`) — only the interactive button needs the client boundary, matching the "interleave Server and Client Components" pattern Next.js documents (Server Component `<Cart />` passed as `children` into a Client `<Modal />`), applied here as Server-fetched `Gallery` content nested inside the new Client `SandboxBridgeProvider`.
- **Why Context over zustand here, even though zustand is pre-approved-but-unused in this project's stack:** the existing stack research explicitly scoped zustand's trigger condition as "3+ sibling panels genuinely needing shared read/write state without prop drilling" for **continuously-updating, multi-consumer** state (the kind that benefits from zustand's selector-based subscriptions to avoid extra re-renders). This bridge is the opposite shape: a single, low-frequency, fire-once "load this scenario" event from one button click — not state read by many components on every render. Context's one real weakness (no selective subscription, i.e. all consumers re-render on any context value change) is irrelevant at this frequency and consumer count (exactly two: the provider itself, and `Sandbox`'s root). Reaching for zustand here would add a new runtime dependency to solve a problem React's built-in, already-installed `createContext`/`useContext` solves just as well — directly against this project's "justify every dependency" persona.
- **Revisit zustand if:** a later milestone needs `ChartPanel`, the new floating-overlay controls, `ReasoningTrail`, *and* the Gallery bridge to all read/write a shared, frequently-updating slice of state without prop-drilling through `SandboxContainer` — i.e., the originally-scoped trigger condition actually arrives. Until then, stay with Context for this one cross-feature bridge, and `useSandboxState()` (unchanged) for everything internal to Sandbox.
- One Next.js-specific footgun to avoid: do **not** implement the bridge as a bare module-level singleton object (`export const bridge = { pendingScenario: null }`) mutated directly — that pattern is the well-known "don't use module-scope global state in the App Router" anti-pattern (real risk when state is seeded from server-rendered/request data, since a module singleton can leak across requests on the server). It's lower-risk here because this bridge only ever gets written to from a client `onClick` handler (never during SSR), but using React Context (scoped per component-tree instance, not per module) sidesteps the question entirely and is the documented pattern regardless.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|--------------------------|
| shadcn `Dialog` (Radix Dialog) for Guided Tour | A dedicated multi-step form/wizard library (e.g. `react-hook-form` wizard patterns, a "stepper" component from another registry) | Only if the tour needed actual form validation/submission between steps — it's a read-only walkthrough with Back/Next/Skip, so a plain controlled `Dialog` + local `currentStep` state is strictly sufficient |
| Plain `Dialog`, no responsive swap | shadcn's `Dialog`↔`Drawer` responsive-swap pattern (`drawer-dialog.tsx`) | If the design explicitly shows a bottom-sheet Guided Tour on mobile/narrow viewports instead of a centered modal — verify against the design file before adding this complexity |
| shadcn `Popover` + `chartToScreen()`-computed virtual anchor for on-chart overlay | Hand-rolled `position: absolute` div with custom outside-click/Escape listeners, no Radix involved | Only if the overlay's dismiss/focus requirements are simpler than they look (e.g., design shows no keyboard access requirement at all) — unlikely for a form with a `select` + `slider` that should be operable via keyboard |
| shadcn `Popover` + virtual anchor | A dedicated positioning library (`@floating-ui/react` directly, `@use-gesture/react`) | Only if overlay positioning needs go beyond what Radix's built-in Popper (which Radix's Popover already uses internally) supports — not indicated by this milestone's scope |
| React Context for the Gallery→Sandbox bridge | `zustand` (already approved-but-unused in this project) | If a future milestone needs several, frequently-updating, cross-feature state slices shared by 3+ components — the originally-scoped zustand trigger condition |
| React Context for the Gallery→Sandbox bridge | URL search params / router state (e.g. `?loadScenario=id` + reading it in Sandbox on mount) | If the "Try on Sandbox" action should also be deep-linkable/shareable as a URL (it isn't specified as a requirement here — the spec says "mutates state directly and smooth-scrolls," not "navigates/updates the URL") |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| A separate `@radix-ui/react-dialog` / `@radix-ui/react-popover` npm install | This project already has the unified `radix-ui` (`^1.6.2`) meta-package installed; shadcn's registry components import from it. Installing the split packages would create a duplicate/conflicting import source for no benefit | `npx shadcn@latest add dialog` / `add popover` — writes source files only, resolves against the already-installed `radix-ui` package |
| A third-party stepper/wizard component library for the 6-step tour | No such component exists in the shadcn registry (confirmed against the shadcn "Component Selection" skill doc); adding an external stepper package for what is a `currentStep` number + Back/Next/Skip buttons + a row of dot buttons is exactly the kind of unjustified dependency this project's persona rejects | Local `currentStep` state in the Guided Tour component + hand-rolled step-dot row |
| Anchoring Radix `Popover`/any positioning library directly to a `ref` on an SVG element via `getBoundingClientRect()` | Reintroduces a DOM-dependent code path this project has already engineered around once (the `getScreenCTM()`/`getBBox()` jsdom gap documented in this project's own `CLAUDE.md`); untestable in Vitest/RTL without mocking `getBoundingClientRect` | Feed the overlay a plain `{x, y}` computed by the existing `chartToScreen()` pure function; use a portaled invisible virtual-anchor div (shadcn's own `context-menu.tsx` pattern) if using Radix `Popover` for the dismiss shell |
| `pointer-events: none` on the SVG chart root, or omitting it on invisible connector/gap elements in the overlay | Would either break the existing draggable vessel hulls (locked Phase 4/Phase 8 hit-testing precedent) or silently create a new dead-zone exactly like the Phase 8 badge-overlay regression this project already fixed once | Explicit, narrowly-scoped `pointer-events: none` only on invisible/decorative connector elements, never on the interactive card or the SVG root |
| `zustand` for the Gallery→Sandbox bridge in this milestone | Solves a different problem shape (frequent, multi-consumer shared state) than what this milestone needs (one low-frequency cross-tree event); adds a dependency ahead of its own pre-scoped trigger condition being met | React Context via a small Client Component provider, per Next.js's own documented pattern |
| A bare mutable module-level singleton object as the Gallery→Sandbox bridge | Known App Router anti-pattern class (module-scope state risks leaking across server-rendered requests); even though this specific bridge is client-only-write, it sets a precedent this codebase shouldn't otherwise repeat | React Context (tree-scoped, not module-scoped) |

## Stack Patterns by Variant

**If a future milestone adds a 3rd/4th cross-feature or cross-panel shared-state consumer beyond the Gallery→Sandbox bridge:**
- Promote from React Context to `zustand` (already vetted, `5.0.14` per this project's original stack research)
- Because Context's lack of selective subscription starts costing real re-renders once several independent, frequently-updating consumers are involved — the exact condition the original stack research pre-scoped zustand's adoption on

**If the Guided Tour's step content needs to be data-driven/CMS-editable rather than hardcoded JSX per step (not indicated by current scope):**
- Keep the same `Dialog` + `currentStep` shell, but externalize step content into a typed array of `{ title, body, illustration }` objects
- Because that's a content-shape change, not a component-architecture change — no new library is implied by "6 steps" alone

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|------------------|-------|
| shadcn `dialog`/`popover` registry components (added via `shadcn@^4.13.1` CLI) | `radix-ui@^1.6.2` (already installed) | Confirmed via `package.json`: this project uses the unified `radix-ui` meta-package, not split `@radix-ui/react-*` packages — the CLI-added component source imports `{ Dialog, Popover } from "radix-ui"`, matching what's already installed, zero new dependency line expected in `package.json` after running the CLI |
| React `Context` (`createContext`/`useContext`) | React 19.2.7 (already installed) | No version concern — built into React, no library needed |
| Next.js App Router "Client Component provider wrapping Server Components" pattern | Next.js `16.2.10` (locked) | Confirmed current in Next.js `v16.2.9` docs (closest published doc version to this project's locked `16.2.10`) — the pattern is stable/unchanged across recent majors, not a new-version-only feature |

## Sources

- Context7 `/shadcn-ui/ui` — `Dialog` controlled-state example (`drawer-dialog.tsx`), full `Dialog` registry source, `Popover` registry source, `context-menu.tsx` virtual-anchor pattern, shadcn "Component Selection" skill doc (confirms no dedicated stepper component exists) — HIGH confidence, current registry source
- Context7 `/radix-ui/primitives` — `Dialog`'s `Presence`-gated-on-`open` content mounting, `FocusScope`/`DismissableLayer` focus-trap and dismiss behavior, controlled `open`/`onOpenChange` prop shape — HIGH confidence, first-party primitive source
- Context7 `/vercel/next.js/v16.2.9` — "Interleaving Server and Client Components," "Context providers" (Client Component provider wrapping Server Components, providers placed "as deep as possible") — HIGH confidence, official docs at a version matching this project's locked `16.2.10`
- Local repo inspection (`package.json`, `src/components/ui/` listing) — confirmed `radix-ui@^1.6.2` already installed, confirmed only `badge`/`button`/`card`/`label`/`select`/`slider` exist today (dialog/popover genuinely missing) — HIGH confidence, direct filesystem verification
- `.planning/PROJECT.md` Key Decisions table — existing locked SVG/pointer-events/hit-testing precedents (Phase 4, Phase 8) this research extends rather than contradicts — HIGH confidence, project's own source of truth
- WebSearch: "absolutely positioned HTML overlay div on top of SVG element pointer-events click-through React" — general confirmation of `pointer-events: none`-for-click-through as standard CSS practice; MEDIUM confidence (general web consensus, cross-checked against this project's own already-verified Phase 8 precedent, not a novel claim)

---
*Stack research for: v1.4 Design Sync (Sandbox & Gallery) — Guided Tour modal, on-chart floating vessel-control overlays, Gallery→Sandbox state bridge*
*Researched: 2026-07-25*
