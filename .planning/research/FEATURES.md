# Feature Research

**Domain:** Web app UI patterns — guided product tour, on-canvas contextual control overlay, load-example-into-live-workspace
**Researched:** 2026-07-25
**Confidence:** MEDIUM-HIGH (Radix/shadcn primitive behavior verified via Context7/official source = HIGH; general UX pattern conventions cross-referenced across 3+ independent sources = MEDIUM; no single canonical spec exists for "load example into workspace," so that section is pattern-synthesis, not a documented standard = MEDIUM)

## Scope Note

This document supersedes the prior FEATURES.md (v1.3 CI/CD & Deployment — pipeline/hosting feature landscape) for this milestone. v1.4's feature landscape is three specific front-end UI patterns net-new to this app (Guided Tour modal, on-chart contextual vessel overlay, Gallery load-in-place), matched against the locked v1.4 Design Sync scope in PROJECT.md. Prior milestones' research (CI/CD in v1.3, lint-tooling in v1.2, UI redesign in v1.1, core domain features in v1.0) remain valid for their own milestones and are not re-litigated here. No domain/rules-engine feature research is included — PROJECT.md and CLAUDE.md are both explicit that v1.4 makes zero change to `classifyEncounter()`/domain logic.

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist for each of the three new patterns. Missing these makes the feature feel broken or unfinished, not just "less polished."

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Tour: Back/Next/Skip on every step (except first has no Back, last has "Done" not "Next") | Standard modal-walkthrough convention across SaaS onboarding (Appcues, Whatfix, UserGuiding all converge on this) | LOW | Trivial state machine: `currentStep: number`, clamp at bounds |
| Tour: step-dot progress indicator, current step visually distinct | Users expect to see "how much is left" — a bare modal with no progress cue reads as an unbounded interruption | LOW | Simple, `steps.map(i => <Dot active={i === current} />)` |
| Tour: Escape key closes it, and clicking the backdrop/outside closes it | Universal modal convention; both are separate dismiss paths users independently reach for | LOW | Native `<dialog>`/Radix `Dialog` gives this for free — see Architecture note |
| Tour: focus is trapped inside the modal while open, and returns to the trigger button ("How to read this") on close | WCAG 2.1.2 / ARIA APG modal dialog pattern — screen-reader and keyboard-only users are otherwise stranded or lost in background content | MEDIUM | Radix `Dialog` (which shadcn's `Dialog` wraps) does this automatically per Context7-verified source (`FocusScope trapped`, background `aria-hidden`/inert) — do not hand-roll |
| Tour: does not re-trigger automatically on every visit once seen | Repeat visitors find an auto-popping tour on every page load actively hostile | LOW | Persist a "seen" flag; for a no-auth/no-account, link-shareable portfolio app, `localStorage` is sufficient — no need for a DB-backed per-user flag |
| Tour: manually re-launchable via a persistent, always-visible button ("How to read this") | Users who skipped or want a refresher need a way back in; if the only entry point is a one-time auto-launch, the feature becomes unreachable after first dismissal | LOW | Already locked into scope per PROJECT.md — the button itself is the re-trigger path, no auto-launch needed at all for this milestone |
| On-chart overlay: dismissed by clicking outside it | Baseline popover/contextual-menu convention users apply everywhere (Figma, Miro, GitHub's PR review popovers, native `<select>`) | LOW | Radix `Popover`'s `DismissableLayer` gives `onPointerDownOutside` dismissal by default — confirmed via Context7 |
| On-chart overlay: dismissed by pressing Escape | Same universal expectation as any transient overlay | LOW | Also default behavior of Radix's `DismissableLayer` (`onEscapeKeyDown` wired to the same `onDismiss`) |
| On-chart overlay: re-selecting the same vessel toggles it closed; selecting the other vessel moves the overlay there (does not stack two overlays) | Users expect a single "currently selected thing has one active editor," not accumulating overlays — this matches the existing single-selection mental model already implied by "opens on vessel click" | LOW-MEDIUM | Because this project has exactly 2 selectable targets, model as one piece of state: `selectedVesselId: 'A' \| 'B' \| null`, not two independent open booleans — prevents an entire class of "both overlays open" bugs |
| On-chart overlay: positioned near the selected vessel, not in a fixed page location | If it doesn't visually track the vessel it edits, users lose the "this control belongs to that shape" association the whole point of on-chart controls is to create | MEDIUM | Requires anchoring the overlay's floating position to the vessel's *current* screen coordinates (which change as the vessel is dragged) — Radix Popover supports a controlled `open` state and (per Radix Popper primitives) an `Anchor` element separate from the `Trigger`, which is the correct primitive for "position relative to an SVG element the user clicked," not the popover's own hidden trigger button |
| Gallery card: clear, discoverable CTA for "load this into the sandbox" (not just an ambiguous hover-only affordance) | If the only way to discover the action is hovering (esp. on touch, where hover doesn't exist), touch/mobile users have no path to the feature at all | MEDIUM | This is a **flagged risk**, not just a note — see Pitfall below; hover-reveal alone fails on touch devices |
| Gallery card → Sandbox: page auto-scrolls to bring the now-updated Sandbox into view after load | If the Sandbox is below the fold (which it structurally is — Gallery is below Sandbox on the home page per PROJECT.md's existing layout) and the state updates invisibly off-screen, users have no feedback that the click did anything | LOW-MEDIUM | `scrollIntoView({ behavior: 'smooth', block: 'start' })` on the Sandbox container ref, triggered after state update commits |
| Gallery card → Sandbox: some visible acknowledgment that new data loaded (brief highlight/flash, or the scroll itself as the only cue) | Without *some* signal, a user who was already looking at the Sandbox (post-scroll, or on a tall viewport where both are visible) may not notice the vessel positions changed | LOW | Cheapest version: reuse whatever "state just changed" visual language the Sandbox already has, if any; otherwise a brief container flash/ring is the standard minimal solve |

### Differentiators (Competitive Advantage)

Not required for the pattern to "work," but meaningfully improve the portfolio-quality feel, and align with the project's Core Value (explainability of a rules engine) rather than generic feature-completeness.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Tour steps use real illustrations of *this app's actual chart UI* per step, not generic icon art | Generic onboarding libraries (Shepherd, Intro.js, Joyride) default to pointing arrows/tooltips at live DOM; a bespoke modal-with-illustration (as scoped) instead teaches the mental model (bearing lines, give-way color, decision-chain) which is the app's actual differentiator — worth the extra design effort here specifically | MEDIUM | Directly supports Core Value: teaching the *reasoning*, not just "here's a button" |
| On-chart overlay content is scoped exactly to what's editable for that vessel (position/heading/speed/type) and nothing else — no generic "properties panel" chrome | A minimal, vessel-specific control surface (vs. porting the old side `ControlPanel`'s full layout into a popover) is what actually earns the "on-chart" framing rather than just moving the same panel to float | LOW-MEDIUM | This is presentation-layer work per the milestone's own framing — resist scope creep into new controls |
| "Try on Sandbox" preserves current scroll-restoration/URL state cleanly (no page nav, no history entry added) so back-button behavior is unaffected | A load-in-place pattern that quietly pushes a new history entry (or worse, still navigates) breaks the "single page app doesn't navigate" promise that's the entire point of switching away from `Link`-per-card | LOW | Simple to get right (just call state setters + `scrollIntoView`, no `router.push`), easy to get wrong if any old routing logic is left half-removed |

### Anti-Features (Commonly Requested, Often Problematic)

Patterns that look like the "obvious" implementation of this milestone's three features but create real problems for this project's scale and constraints.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|------------------|-------------|
| Pulling in a full onboarding-tour library (Shepherd.js, Intro.js, React Joyride, driver.js) for the Guided Tour | "Why hand-roll a wizard when libraries exist for exactly this" | These libraries are built for *spotlight/tooltip tours that point at live DOM elements* (with all the associated scroll-into-view, resize-observer, and z-index-stacking complexity that implies) — this milestone's scope is explicitly a **self-contained 6-step modal walkthrough with per-step illustrations**, i.e. closer to a plain paginated dialog than a DOM-spotlight tour. Adding a dependency for a fixed, small, non-DOM-anchored step sequence fails this project's own "justify every dependency" persona test, and duplicates work `Dialog` (already in the shadcn/ui set) + a `currentStep` state already does | A plain shadcn/ui `Dialog` + local step-array state + Back/Next/Skip buttons + dot progress — no new dependency |
| Making the on-chart overlay a fully generic, reusable "floating panel" component abstraction from day one | DRY instinct — "vessel A and vessel B will both need this, so build the generic version first" | This project's own established convention (Phase 6, restated in CLAUDE.md: "don't pre-abstract... only move something there once a second real consumer actually needs it") argues against inventing a speculative generic floating-panel primitive before the two-vessel case proves out the actual shared shape; premature abstraction here risks guessing the wrong API surface (anchor logic, controlled-open logic) before it's been exercised twice | Build it once for the vessel-overlay use case (parameterized over vessel A/B per the existing "no duplicated JSX" convention), extract a shared primitive only if a third on-chart overlay consumer appears later |
| Hover-only "Try on Sandbox" reveal with no persistent/always-visible affordance | Visually cleaner card in its default (unhovered) state — common in desktop-first template galleries (e.g. Canva-style "hover a template thumbnail to reveal the CTA") | Hover has no equivalent on touch input — a touch user gets no visible CTA at all unless the card is tapped first to simulate a hover state (inconsistent, easy to miss), which silently locks mobile/tablet users out of the feature entirely; also fails basic keyboard-only navigation (no visible focus-triggered reveal) unless explicitly built in | Reveal the CTA on hover **and** on keyboard focus (`:focus-within`) **and** always-show it (even subtly, e.g. lower opacity) on touch/coarse-pointer media queries (`@media (hover: none)`) — this is a known, solvable CSS pattern, not a reason to avoid the hover-reveal aesthetic entirely |
| Tour auto-launching on every first visit without an explicit trigger, PLUS the required manual "How to read this" button | "Maximize activation" — many SaaS onboarding guides recommend auto-launching on first session | This milestone's locked scope is a manually-triggered tour only ("triggered by a new 'How to read this' button") — auto-launch is out of scope and would need its own `localStorage`-driven "seen" gate, first-visit detection, and a decision about interrupting a fresh visitor before they've even seen the Hero/Sandbox — meaningfully more design surface than what's scoped | Ship the manual-trigger button only, as locked; auto-launch-on-first-visit is a legitimate v2 candidate but a separate decision, not bundled into this milestone |
| Building the "load example into workspace" data flow through a full page navigation + query-param + `useEffect`-on-mount rehydration (i.e., keep `/s/{id}` as the loader, just auto-navigate back to `/#sandbox`) | Reuses the existing `/s/{id}` scenario-loading code path that's already built and tested, feels lower-risk than writing a new same-page loader | This is exactly the pattern being explicitly removed this milestone ("no page navigation") — round-tripping through a route defeats the goal (perceived instant, in-place load) and reintroduces a page transition/flash the design is trying to eliminate | Call the same domain-level "load scenario into sandbox state" function directly from the Gallery card's click handler, in-process, no route change — see Architecture dependency note below |

## Feature Dependencies

```
[Guided Tour: modal shell + step state]
    └──requires──> [shadcn/ui Dialog primitive already in the stack]
                       (no new dependency — Dialog ships with the existing shadcn/ui set)

[On-chart vessel control overlay]
    └──requires──> [Vessel selection state: selectedVesselId: 'A' | 'B' | null]
                       └──requires──> [Existing per-vessel position/heading/speed/type state
                                        already owned by useSandboxState() (per v1.2 refactor)]
    └──requires──> [Anchor-to-live-coordinate positioning
                     (vessel's current screen position, which changes on drag)]

[Gallery "Try on Sandbox" load-in-place]
    └──requires──> [A same-page, callable "load scenario data into Sandbox state" function
                     that does NOT go through /s/{id} routing]
                       └──requires──> [Sandbox state to be lifted/reachable from the Gallery
                                        section's parent (both live on the same home page route
                                        per the existing v1.1 layout — Gallery embedded below
                                        Sandbox on '/')]
    └──requires──> [scrollIntoView on a Sandbox container ref]

[Removing the 6-chip preset row]
    └──conflicts-with-keeping──> [Gallery cards remaining Link-only]
       (both are explicitly locked as mutually exclusive changes this milestone —
        chip row removed, Gallery fully switches to load-in-place, not "both")
```

### Dependency Notes

- **On-chart overlay requires a single `selectedVesselId` state, not two independent booleans:** modeling "vessel A overlay open" and "vessel B overlay open" as separate flags allows an invalid state (both open) that a single selected-ID variable makes structurally impossible — cheaper to get right upfront than to patch later.
- **On-chart overlay requires anchor-to-live-coordinate positioning:** because vessels are draggable, the overlay's popover anchor cannot be a static DOM ref set once at open-time — it must track the vessel's live screen position (the same `screenToChart()`/`chartToScreen()` transform functions this project already has per STACK.md's architecture note) each render while open, or use Radix's `Anchor` primitive re-pointed at the vessel's current bounding rect.
- **Gallery load-in-place requires Sandbox state to be reachable without routing:** since Gallery is already embedded on the same home page below the Sandbox (v1.1's Phase 9 change), this is a lifting-state-up / shared-hook problem, not a cross-page data-passing problem — significantly simpler than it would have been before v1.1's Gallery-embedding change.
- **Chip-row removal conflicts with keeping Gallery as pure `Link`:** explicitly locked as an either/or in PROJECT.md — both changes ship together, not incrementally, because leaving the old chip-based "load a preset" path alongside the new Gallery-based one would give users two inconsistent ways to load a scenario into the same Sandbox.

## MVP Definition

### Launch With (v1 of this milestone)

- [ ] Guided Tour: shadcn `Dialog`-based 6-step modal, Back/Next/Skip, step-dot progress, per-step illustration slot, manual trigger only ("How to read this" button) — essential, this is the milestone's one net-new feature, explicitly locked in scope
- [ ] Guided Tour: `localStorage`-based "seen" flag so it doesn't force-relaunch every visit, but is NOT wired to any auto-launch (manual trigger is the only launch path this milestone) — essential per locked scope; note this is deliberately the *minimum* viable persistence, not a decision to build auto-launch later without revisiting UX
- [ ] On-chart vessel overlay: single `selectedVesselId` state, opens on vessel click, closes on outside-click/Escape/re-click-same-vessel, replaces the side `ControlPanel` — essential, directly named in Target features
- [ ] Gallery card: hover-reveal CTA with `:focus-within` and touch-visible fallback (not hover-only) — essential; hover-only would silently break the feature on touch devices, which is not an acceptable MVP gap for a feature replacing a previously-working `Link`
- [ ] Gallery load-in-place: direct state-setter call (no routing) + `scrollIntoView` to Sandbox — essential, this is the core ask of GAL card change

### Add After Validation (v1.x)

- [ ] Auto-launch Guided Tour on genuine first visit (in addition to the manual button) — only add if user analytics/feedback shows most users never discover the manual trigger; requires its own first-visit-detection design, deliberately deferred rather than bundled in
- [ ] Brief highlight/flash animation on the Sandbox after a Gallery load, beyond the scroll itself — nice confirmation polish, not required if scroll-then-visible-state-change is already sufficiently noticeable in testing

### Future Consideration (v2+)

- [ ] Multi-step "spotlight" tour that points at live Sandbox elements (DOM-anchored, not modal-only) — would justify evaluating a real tour library (Shepherd/driver.js) at that point, since the modal-only approach's "don't need a library" reasoning stops applying once DOM-anchoring/scroll-tracking is required
- [ ] Overlay-based editing extended to more than 2 vessels — out of scope per PROJECT.md's existing "multi-vessel is a v2 extension" boundary; the `selectedVesselId: 'A' | 'B' | null` single-selection model would need revisiting (e.g. a set/array) if vessel count becomes dynamic

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|----------------------|----------|
| Guided Tour modal (6-step, Back/Next/Skip, dots) | MEDIUM | LOW | P1 |
| On-chart vessel control overlay (replaces side panel) | HIGH | MEDIUM | P1 |
| Gallery "Try on Sandbox" load-in-place + scroll | HIGH | MEDIUM | P1 |
| Touch/keyboard-visible CTA fallback on Gallery cards | HIGH (accessibility/reach) | LOW | P1 |
| Tour "seen" localStorage gate | LOW-MEDIUM | LOW | P1 (cheap, prevents annoyance) |
| Post-load highlight/flash animation on Sandbox | LOW | LOW | P3 |
| Auto-launch tour on first visit | MEDIUM | MEDIUM | P3 (explicitly deferred) |

**Priority key:**
- P1: Must have for this milestone (matches PROJECT.md's locked Target features)
- P2: Should have, add when possible
- P3: Nice to have, explicitly deferred this milestone

## Reference Pattern Analysis

| Feature | Where this pattern is well-established | Our approach |
|---------|------------------------------------------|--------------|
| Modal onboarding walkthrough (steps, dots, skip) | SaaS onboarding tools broadly (Appcues, Whatfix, UserGuiding all document the same core shape) | Same shape, hand-rolled on shadcn `Dialog` — no tour library, per Anti-Features above |
| Contextual floating toolbar/popover on canvas-element select | Figma, Miro, and any Radix/shadcn-based app using `Popover` for "click a thing, get a small floating control surface" | Radix `Popover` (already implied by shadcn/ui in the stack) with controlled `open` driven by `selectedVesselId`, anchored to the vessel's live position |
| "Use this template" → loads directly into open editor, no separate page | Canva's "Use this template" flow: click loads the design directly into the editing workspace, no intermediate page | Same shape, but simpler here — the "editor" (Sandbox) and the "gallery" already live on the same page/route (unlike Canva, where they're logically different views), so this is a same-page state update + scroll, not a navigation-then-load |

## Sources

- [Onboarding UX: 10 patterns, best practices, and real examples — Appcues](https://www.appcues.com/blog/user-onboarding-ui-ux-patterns) — MEDIUM confidence, cross-referenced with 2 other sources below
- [Product tour UI/UX: Best onboarding flow patterns — Appcues](https://www.appcues.com/blog/product-tours-ui-patterns) — MEDIUM confidence
- [10 Product Tour Modal Examples — Kompassify](https://kompassify.com/blog/product-tour-modal-examples) — MEDIUM confidence, real modal examples
- [How to Create Effective Product Tours in 2025 — Whatfix](https://whatfix.com/product-tour/) — MEDIUM confidence
- [Building an Accessible Widget: WAI-ARIA Modal Alert Dialogs — Deque](https://www.deque.com/blog/aria-modal-alert-dialogs-a11y-support-series-part-2/) — HIGH confidence, accessibility vendor, matches ARIA APG
- [How to Build Accessible Modals with Focus Traps — UXPin](https://www.uxpin.com/studio/blog/how-to-build-accessible-modals-with-focus-traps/) — MEDIUM-HIGH, cross-referenced with Deque
- Context7 `/radix-ui/primitives` — Popover source (`popover.tsx`, `focus-scope.tsx`) — HIGH confidence, direct library source: confirms `DismissableLayer` default outside-click/Escape dismissal, `FocusScope trapped` focus-trap behavior, controlled `open`/`onOpenChange`, and `PopoverTrigger` toggle-on-click semantics — directly applicable since this project's stack (shadcn/ui) wraps this exact primitive
- [Complete guide to building product tours on your React apps — LogRocket](https://blog.logrocket.com/complete-guide-to-build-product-tours-on-your-react-apps/) — MEDIUM confidence, tour library landscape (Shepherd/Popper-based responsiveness caveat, mobile modal caveat)
- Canva "Use this template" flow — MEDIUM confidence (WebSearch-derived description of Canva's documented user-facing behavior, not an official API/architecture doc, but consistent across multiple third-party how-to guides)
- Project's own CLAUDE.md conventions (no-pre-abstraction rule, separation-of-concerns rule) — used to source the Anti-Features "don't pre-abstract the floating panel" recommendation, applying this project's own established engineering conventions rather than external research

---
*Feature research for: guided tour modal, on-chart contextual overlay, load-example-into-live-workspace patterns (v1.4 Design Sync)*
*Researched: 2026-07-25*
