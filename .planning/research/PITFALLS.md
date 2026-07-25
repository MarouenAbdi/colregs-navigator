# Pitfalls Research

**Domain:** Front-end redesign sync of an existing interactive SVG chart + reasoning-trail + gallery app (COLREGS Navigator v1.4 Design Sync)
**Researched:** 2026-07-25
**Confidence:** HIGH (grounded directly in this codebase's current source and its own documented incident history; one external claim (Radix Dialog modal behavior) verified via Context7)

This is not generic web-dev pitfalls research. Every pitfall below is scoped to the five target features of the v1.4 milestone (`.planning/PROJECT.md`) and grounded in the actual files that will be touched: `src/components/sandbox/chart/VesselGroup.tsx`, `ChartPanel.tsx`, `SandboxContainer.tsx`, `hooks/useSandboxState.ts`, `control-panel/ControlPanel.tsx`, `reasoning/ReasoningTrail.tsx`, `src/components/gallery/GalleryContainer.tsx`, `card/GalleryCard.tsx`, and `app/page.tsx`.

## Critical Pitfalls

### Pitfall 1: On-chart floating vessel-control overlays reopen the hit-testing regression class (third occurrence)

**What goes wrong:**
The design replaces the side `ControlPanel` with floating control cards that open directly on top of the chart when a vessel is clicked. If that overlay is implemented as an absolutely-positioned HTML `<div>` (or an SVG `<g>`) stacked over `ChartPanel`'s `<svg>`, any part of its painted area that geometrically overlaps a vessel's hull polygon, its rotate-handle circle, or the space between them will silently swallow `pointerdown` events meant for `hullDrag`/`rotateDrag` — even if the overlay is only open for one vessel while the user tries to drag the *other* one, or even after the overlay is dismissed if its close animation/unmount is delayed by a CSS transition and the element is still in the hit-testing tree.

**Why it happens:**
This is the exact same failure class the codebase has already hit twice (Phase 4: separate padded invisible hit-shapes for hull vs. rotate handle; Phase 8: an unhandled, solid-filled role-badge `<g>` with no `pointerEvents: "none"` overlapping ~45px² of the hull). Both times the root cause was a new painted element added on top of, or adjacent to, the interactive hull/rotate-handle shapes without either (a) attaching handlers to it deliberately or (b) explicitly opting it out with `pointer-events: none`. A floating on-chart control card is a strictly larger, more animated version of the same shape (it can be 150-250px wide, positioned near the vessel it belongs to, i.e. directly adjacent to or over the hull/handle it's describing) — the blast radius of a missed `pointer-events: none` is much bigger than the ~45px² badge case.

**How to avoid:**
- Any newly-added on-chart overlay card must set `pointer-events: none` on its own root container by default, and re-enable `pointer-events: auto` only on the specific interactive controls inside it (its own close button, sliders, selects) — mirroring the exact pattern already used for the range-tooltip `<g>` and the letter/badge `<g>` in `VesselGroup.tsx`.
- Treat the overlay's *open* state as a state machine that also needs to answer: "which vessel's hull/rotate-handle does this overlay's bounding box geometrically overlap, right now, at this heading?" Do not assume it never overlaps just because it's visually "beside" the vessel — headings rotate the hull polygon, and a card anchored via a fixed offset (like the existing badge) can drift into hull space at some headings the same way the Phase 8 badge did at heading 0.
- Because this project's own review process caught the Phase 8 regression via **automated code review (point-in-polygon check)**, not manual UAT, plan an equivalent automated check (or at minimum an explicit manual test matrix: open overlay for vessel A, attempt drag vessel B; open overlay for vessel A, attempt drag vessel A itself in a region not covered by the card) before declaring this feature done.
- Extract the overlay's open/anchor logic into a small pure function (`resolveOverlayAnchor(vessel, containerSize, viewBox)`) that is unit-tested independent of pointer-event wiring, consistent with this codebase's established "split computation from presentation" convention.

**Warning signs:**
- Reviewer/tester can drag a vessel fine when no overlay is open, but dragging becomes flaky or dead once *any* vessel's overlay has been opened during the session (stale mounted-but-invisible overlay).
- The overlay is positioned via a raw pixel offset copy-pasted between vessel A and vessel B call sites rather than a shared, parameterized anchor function (this project's own convention explicitly flags copy-pasted near-identical JSX between two vessel instances as a known bug source).
- No `pointer-events: none` grep hit on the new overlay's root element during code review.

**Phase to address:**
Early architectural decision — before any visual polish on the overlay cards, decide (1) overlay anchor/positioning strategy and (2) the default `pointer-events: none` + selective re-enable pattern, in the phase that first introduces the on-chart overlay component. This is the highest-risk single item in the whole milestone given two prior incidents of this exact class.

---

### Pitfall 2: "Try on Sandbox" requires Gallery (Server Component) to reach into Sandbox's client-only state, which today doesn't exist as a bridgeable seam

**What goes wrong:**
`GalleryContainer` is currently an `async` **Server Component** with no `"use client"` directive — it fetches curated scenarios server-side via `getCaller().gallery.list()` and renders `GalleryCard`s that are plain `<Link href={\`/s/${id}\`}>` navigations. `SandboxContainer` is a separate **Client Component** that owns all vessel state internally via its own `useSandboxState()` hook call — nothing about the current `vesselA`/`vesselB` state is lifted to `app/page.tsx` or exposed anywhere the Gallery subtree can reach. Implementing "load this scenario into the homepage Sandbox state, no navigation" naively (e.g. a client-side handler on the card that expects `SandboxContainer` to somehow pick up a query param, or a direct import/call between components) will either silently do nothing, force a full remount that loses in-progress Sandbox edits, or require prop-drilling scenario data through a Server Component (`app/page.tsx`) that cannot itself hold client state or event handlers.

**Why it happens:**
This is a cross-subtree state-sharing problem hidden by two facts that were both true and fine *before* this milestone: (1) Gallery only ever needed to *read* server data and hand off via URL navigation, never write into another component's client state; (2) Sandbox's state has always been self-contained since Phase 4, with the single external input being the `initialScenario` prop passed at *mount* time from `/s/[shareId]/page.tsx` (a full page load), not a live update after mount. "Try on Sandbox" is the first requirement in this app's history that needs one already-mounted client subtree to push new data into a second, sibling, already-mounted client subtree on the same page.

**How to avoid:**
- Decide the state-ownership seam explicitly, as an early architectural decision, before touching `GalleryCard.tsx`. The two realistic options given this codebase's stack (no Zustand yet, no Context provider yet):
  1. **Lift `vesselA`/`vesselB` state out of `useSandboxState()` up to a new client wrapper in `app/page.tsx`** (or a thin client "page shell" component), passing state + setters down into both `SandboxContainer` and a client-side Gallery-to-Sandbox bridge. This is the most direct fix but requires `app/page.tsx` to gain a `"use client"` boundary (or a dedicated client child) while `GalleryContainer` itself stays a Server Component for its data fetch — the *card's* click handler, not the container, is what needs to be a Client Component crossing back up.
  2. **Introduce a small shared client store** (the `zustand` dependency this project's STACK.md already flagged as "only if 3+ sibling panels need shared state without prop drilling" — this is exactly that trigger condition arriving) that both `SandboxContainer` and `GalleryCard`'s "Try on Sandbox" button read/write. This avoids restructuring `app/page.tsx`'s Server/Client boundary but is a new dependency; per this project's own STACK.md, only take this path once prop-drilling the lifted state (option 1) is actually confirmed painful, not preemptively.
- Whichever seam is chosen, decide it in the phase that removes the chip row / adds the Gallery button — not as an afterthought once the button already needs to "just call something."
- The smooth-scroll-to-Sandbox behavior must be sequenced *after* the state update commits (e.g. scroll on the next effect tick / after the setter call, not synchronously in the click handler), or the scroll will land on a Sandbox that hasn't re-rendered with the new scenario yet.
- `GalleryCard`'s existing `rowToVessels(row)` → `Vessel` conversion already exists server-side in `scenario-service.ts` — reuse that exact shape as the payload crossing the bridge so the Gallery's data model and Sandbox's `Vessel` domain type never drift into two parallel shapes.

**Warning signs:**
- A PR implements the button's `onClick` before the state-ownership question above has been explicitly decided and written down (a red flag that the architecture decision is being made implicitly, ad hoc, inside a leaf component).
- The button appears to "work" only because it does a full `router.push` to `/s/{id}` under the hood (i.e. secretly falls back to the old navigate-away behavior) rather than genuinely mutating live Sandbox state without navigation — this defeats the entire locked decision ("Gallery fully switches to load-in-place").
- Smooth-scroll fires before the Sandbox visibly updates, producing a jarring "scrolled to the right place but the chart hasn't changed yet" flash.

**Phase to address:**
Early architectural decision — this must be resolved as a design decision (state-lifting vs. shared store) in the phase that implements the Gallery button, before any component code is written, because it changes whether `app/page.tsx` and/or `SandboxContainer`'s public API need to change shape.

---

### Pitfall 3: Horizontal "node chain" reasoning-trail layout tempts DOM-measurement code that jsdom cannot run

**What goes wrong:**
The current `ReasoningTrail.tsx` already renders its steps as a `flex flex-row flex-wrap` list (see the `ol` in the file) — so the *current* implementation is CSS-flexbox-driven, not DOM-measurement-driven, and is fully testable under Vitest/jsdom today. The redesign to a horizontal, connected "NAV DECISION CHAIN" with connector lines/arrows between node-cards creates real temptation to reach for `getBoundingClientRect()`/`getBBox()` on rendered card elements to draw SVG or absolutely-positioned connector lines precisely between two card edges (especially if cards wrap to a second row, or the row becomes horizontally scrollable and connectors need to track scroll position). Any component code that calls `getBBox()`/`getScreenCTM()` (or relies on real layout measurement of arbitrary DOM nodes) will pass in a real browser but silently return zero-value/incorrect geometry — or throw — under this project's jsdom-based Vitest test environment, exactly as already documented for `SVGElement.getScreenCTM()`/`getBBox()` in this project's own Key Decisions table.

**Why it happens:**
"Connect card N to card N+1 with a line/arrow" is a native fit for either (a) CSS-only connectors (a `::before`/border-based chevron between flex/grid items, entirely free of real element positions) or (b) JS-measured connectors (draw an SVG line between two elements' actual screen rects) — and (b) is the more visually "correct" approach for a design that shows precise connector geometry, especially if the chain needs to reflow at different container widths. Engineers reach for `getBoundingClientRect()` because it's the obvious browser API for "where is this element on screen," without recalling that this project has already hit this exact class of gap once — the `getScreenCTM()`/`getBBox()` jsdom gap is called out explicitly in this project's Key Decisions and stack conventions as a locked rule ("keep coordinate-transform logic DOM-API-free").

**How to avoid:**
- Default to a CSS-only connector approach: connect node-cards with border/pseudo-element chevrons or fixed-geometry SVG arrows whose shape depends only on which two tone/step types are adjacent (known at render time from `trail[i]`/`trail[i+1]`), never on a runtime-measured pixel position. This keeps the entire component testable with plain RTL queries (`getByText`, `getByRole`), consistent with how `ReasoningTrail.test.tsx` already asserts on rendered trail content today.
- If connector precision genuinely requires real element positions (e.g. a horizontally-scrollable chain where connectors must track scroll offset), isolate that measurement in a dedicated hook (e.g. `useNodeChainConnectors()`) that is explicitly excluded from unit-test coverage and instead verified only via the project's human-verified browser walkthrough — do not write a Vitest test that pretends to validate real pixel connector geometry under jsdom; that test will be lying (jsdom returns 0-valued `DOMRect`s for `getBoundingClientRect()` on elements with no real layout engine backing them, which validates nothing).
- Any pure derivation this new layout does need (step ordering, tone-per-step, "3-5 entries" trail length business logic already present in `reasoning-trail-tag.ts`) should stay in that existing DOM-API-free module, not migrate into a component that also does measurement — keeping the "split computation from presentation" convention intact.
- If horizontal overflow/scrolling is introduced, decide keyboard scroll-ability (arrow keys / focus order) up front — a horizontally scrollable list of interactive-looking cards is an accessibility surface this project hasn't had before (the current vertical/wrapping list has no scroll container at all).

**Warning signs:**
- A new test file for the reasoning trail imports `getBoundingClientRect` mocking helpers, or stubs `Element.prototype.getBoundingClientRect` — a strong signal the component under test is DOM-measurement-coupled and will be a maintenance/flakiness liability the same way `getScreenCTM()` was flagged as project-banned.
- Connector line rendering "looks right" in dev but is subtly offset or invisible specifically in the CI test run (jsdom vs. real browser layout divergence) — if this happens even once, it's a sign the component crossed the DOM-API-free boundary.

**Phase to address:**
Early architectural decision for the connector rendering strategy (CSS-only vs. measured) — decide in the phase that first builds the horizontal trail layout, since retrofitting a DOM-measurement approach into an already-shipped CSS-only version (or vice versa) is a full rewrite, not a tweak.

---

### Pitfall 4: Guided Tour modal stacks on top of an already-interactive Sandbox with its own overlay conventions, and no Dialog primitive exists in this codebase yet

**What goes wrong:**
This codebase's `src/components/ui/` currently has no Dialog/Modal/Sheet primitive (`badge`, `button`, `card`, `label`, `select`, `slider` only) — the Guided Tour will be the first modal surface in the app. Adding shadcn/ui's Dialog (built on Radix's `Dialog` primitive, `modal={true}` by default) on a page that *already* has other absolutely-positioned overlay UI (the new on-chart vessel-control cards from Pitfall 1, plus any conditional banners like the existing `saveError`/`banner` blocks in `SandboxContainer.tsx`) creates two concrete integration risks: (a) **z-index/stacking-context collisions** — `ChartPanel`'s `<div className="relative ...">` container and the new on-chart overlay cards each establish their own stacking context; a Radix Dialog portal renders to `document.body` by default, which should escape local stacking contexts, but only if nothing in the existing tree sets a competing large `z-index` at the document root level (verify no existing overlay uses an inline `z-[9999]`-style escape hatch); (b) **focus-return-to-trigger conflicts** — Radix Dialog's default behavior traps focus while open and returns focus to the triggering element (the "How to read this" button) via `onCloseAutoFocus` when closed; if the Tour is dismissed *while* a vessel drag or overlay-card interaction elsewhere on the page has changed the DOM (e.g. removed/remounted the trigger button through an unrelated re-render), focus can silently fail to return anywhere, breaking keyboard navigation continuity.

**Why it happens:**
Radix's modal Dialog is deliberately aggressive about claiming the interaction surface (full accessibility compliance requires it) — it is not designed with this app's specific existing overlay stack in mind, and this is the app's first time combining "one already-complex page with prior overlay-hit-testing incidents" with "a brand-new, library-supplied modal that manages its own portal, focus trap, and outside-click dismissal."

**How to avoid:**
- Confirmed via Radix Primitives documentation: Dialog's `Root` `modal` prop defaults to `true` (focus-trapping, full modal behavior), `Content` exposes `onOpenAutoFocus`/`onCloseAutoFocus`/`onPointerDownOutside`/`onInteractOutside` callbacks, and it auto-closes on Escape, returning focus to the trigger by default. Do not fight these defaults; instead verify them against this specific page: write the human-verification checklist item "open Tour from the button, confirm background Sandbox drag/overlay interactions are fully inert while Tour is open (not just visually dimmed), close Tour via Escape AND via a close button AND via outside-click, confirm focus lands back on the 'How to read this' button each time."
- Because this page uses SVG pointer-events extensively and has already had two silent-hit-testing incidents, explicitly test that the Dialog's overlay (the dimming backdrop) truly blocks pointer events to the chart underneath — Radix's overlay is a real full-viewport element, not a CSS-opacity-only trick, so this should hold, but this project's own history (Phase 8) is a reminder to verify empirically rather than assume a library "must" work correctly for this codebase's specific SVG hit-testing setup.
- Give the Tour a fixed, explicit z-index tier that is documented once (e.g. in a shared z-index scale comment) rather than an ad hoc large number, especially once on-chart overlay cards (Pitfall 1) also need their own z-index tier — two new stacking features landing in the same milestone raises real risk of an undocumented z-index collision between "Tour portal" and "on-chart overlay card" if either is later given a casually-chosen large z-index value.
- Since this is a 6-step walkthrough likely referencing specific Sandbox UI elements (chart, control cards — note the chip row is being removed, so tour content must not reference it), sequence the Tour's content/copy against the *final* post-redesign UI, not the current one, to avoid a Tour that explains UI that no longer exists.

**Warning signs:**
- Manual testing of the Tour only checks that it opens/closes visually, without confirming keyboard-Tab cannot escape the dialog into the underlying Sandbox while it's open.
- No documented z-index scale exists once both the Tour and the on-chart overlay cards are live, making a future overlap bug hard to diagnose ("which one is supposed to be on top?").
- Tour step copy is written before the final on-chart overlay/reasoning-chain layouts are settled, requiring a rewrite pass later.

**Phase to address:**
Early architectural decision for the Dialog integration pattern (which shadcn/ui Dialog primitive to add, z-index tier, focus-return verification) in the phase that introduces the Guided Tour — ideally scheduled *after* the on-chart overlay cards and reasoning-chain layout are done, so Tour content can reference final UI and z-index tiers can be assigned without guessing at a not-yet-built layout.

---

### Pitfall 5: Passing automated tests is not this project's actual acceptance bar — a phase can be "green" and still be wrong

**What goes wrong:**
Every one of the four preceding pitfalls (overlay hit-testing, cross-tree state bridging, DOM-measurement-free connectors, modal focus/z-index) can produce a test suite that passes 100% while the live, human-operated browser experience is broken — because Vitest + RTL under jsdom cannot observe real pointer-capture behavior across two real painted shapes, cannot observe true focus-trap escape via Tab in a real browser, and cannot observe real CSS stacking-context/z-index rendering order. This project has already lived through this gap directly: the Phase 5 dev-server-breaking import-resolution bug was invisible to `tsc` and Vitest for four full completed phases and was only caught the first time someone actually ran `next dev`; the Phase 4 hit-testing regression needed two rounds of live human UAT before it was fixed; the Phase 8 badge-overlap regression was caught by an added automated point-in-polygon check specifically *because* manual visual inspection alone had already been shown insufficient once.

**Why it happens:**
A green CI run (lint + typecheck + test + build, all required on every PR since v1.3) creates a strong, well-earned sense of confidence in this codebase generally — but that pipeline was built to catch regressions in domain logic, types, and build correctness, not real-browser pointer-event routing, real focus management, or real visual stacking. For a portfolio/interview-facing project, the actual bar an interviewer would apply ("does this feel solid when I click around it") is exactly the category of bug these four pitfalls produce and CI cannot detect.

**How to avoid:**
- Treat this milestone's close-out the same way v1.1's Sandbox/Gallery phases and v1.2's refactor phases were closed: every phase touching the five target areas gets an explicit, scripted human-verification pass in a real browser before being marked done, not just a green PR check. Write the verification script per feature area up front (during phase planning, not during closeout) so it captures the specific regression classes above: "drag vessel A with vessel B's overlay open," "click Try on Sandbox from Gallery and confirm the Sandbox chart visibly updates without a page navigation," "Tab through the open Tour and confirm focus cannot reach the Sandbox behind it," "resize the browser narrower than 900px and confirm the node-chain layout doesn't visually break in a way CSS-only testing wouldn't catch."
- Where a pitfall's failure mode is *specifically* something automated code review has caught before in this repo (the Phase 8 point-in-polygon check), prefer adding an equivalent lightweight geometric/structural check over relying on manual inspection alone — manual visual inspection already has one documented miss in this exact codebase (the ~45px² badge overlap was invisible to the human UAT pass that preceded the automated catch).
- Do not let "it built and the tests are green" be the phase-completion signal communicated to the user; explicitly report the human-verification outcome (what was clicked, what was confirmed) as this project's established closeout pattern already does.

**Warning signs:**
- A phase's completion report cites only "npm run test / build / lint all green" with no mention of an actual browser session.
- A pitfall-class bug (drag breaks near an overlay, focus escapes a modal, a connector line is misplaced) is discovered *after* a phase was already marked complete — a sign the verification script for that phase didn't explicitly target the known regression class.

**Phase to address:**
This applies to every phase in the milestone, not one specific phase — it should be written into each phase's planning as an explicit verification checklist item, derived directly from Pitfalls 1-4 above, rather than left as a generic "please test manually" note.

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|-----------------|-----------------|
| Leaving `chip-scenarios.ts`, `activeChipId`, `handleChipSelect`, and the `CHIP_ORDER` import wired inside `useSandboxState.ts` after the chip row UI is removed from `SandboxContainer.tsx` | Faster to ship — no risk of breaking the hysteresis-reset logic those functions also perform | Dead/orphaned state and an unused-but-still-tested code path that will confuse the next contributor into thinking chips are still reachable from the UI; `chip-scenarios.test.ts` will keep passing while testing a feature with no UI entry point | Never as a final state — if chip presets still need to seed the Gallery's "Try on Sandbox" bridge internally, rename/refactor the module to reflect its new sole purpose rather than leaving Sandbox-chip-shaped naming/comments in place |
| Implementing "Try on Sandbox" as a disguised `router.push('/s/{id}')` instead of a genuine live-state update (Pitfall 2) | Fastest path to "something happens on click," reuses existing `/s/[shareId]` route entirely | Directly violates the locked decision ("Gallery fully switches to load-in-place, not both Link + button") and reintroduces a full page navigation the milestone explicitly set out to remove | Never — this is an explicit locked scope decision, not a judgment call |
| CSS-only hover-reveal on `GalleryCard` for "Try on Sandbox" with no keyboard/touch fallback | Matches the design's hover-reveal visual exactly, minimal extra markup | Keyboard-only and touch users (no true `:hover` state) may never discover or reach the button — this project's cards were previously a single accessible `<Link>` covering the whole card, so removing the whole-card click affordance is itself an accessibility regression risk unless the button is unconditionally focusable and reachable via Tab, and shown on `:focus-within` as well as `:hover` | Acceptable only if the button is real, keyboard-focusable markup (not `display:none` until hover) that also reveals on `:focus-within`/touch-active state, not opacity-only relying on mouse hover |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|-----------------|-------------------|
| Gallery (Server Component) → Sandbox (Client Component) state bridge | Assuming a prop or import can pass live data between two independently-mounted subtrees on the same page without an explicit shared client boundary | Lift `vesselA`/`vesselB` state to a shared client-side owner (page-level client wrapper or a `zustand` store, per Pitfall 2), decided explicitly before writing the button's click handler |
| Radix/shadcn Dialog (new) ↔ existing SVG pointer-events-heavy Sandbox | Assuming the Dialog "just works" on top of a page with unusual custom pointer-event wiring, without empirically re-verifying background inertness given this project's history of exactly that assumption failing twice before | Explicitly test, in a real browser, that opening the Tour makes all Sandbox drag/overlay interactions genuinely inert (not just visually dimmed) |
| Reasoning-trail connector rendering ↔ Vitest/jsdom test environment | Reaching for `getBoundingClientRect()`/`getBBox()` to draw precise connector lines between rendered node-cards | Use CSS-only, position-independent connectors (or isolate any real measurement into a hook explicitly excluded from unit coverage and verified only via human browser walkthrough) |
| On-chart vessel overlay cards ↔ existing hull/rotate-handle pointer handlers | Adding a new painted element near/over the hull or rotate-handle without an explicit `pointer-events: none` default | Default every new on-chart overlay's root to `pointer-events: none`, re-enabling only on its own interactive children, mirroring the existing badge/tooltip pattern in `VesselGroup.tsx`/`ChartPanel.tsx` |

## Performance Traps

This milestone is presentation-layer-only on a 2-vessel, single-page app with no new data-scale dimension — there is no meaningful "grows with usage" performance risk to flag here (consistent with this project's existing SVG-not-canvas architectural rationale, which explicitly rejected canvas because scale doesn't justify it). The only near-term-relevant item:

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|-----------------|
| On-chart overlay card mounts/unmounts (or animates open/close) on every vessel click, re-triggering `ResizeObserver`/container-size derivation unnecessarily | Chart briefly re-derives `containerSize`/overlay geometry (`deriveChartOverlayState`) on overlay open/close even though the container itself didn't resize | Keep the overlay as a sibling overlay layer outside the SVG's own layout box (e.g. an absolutely-positioned `<div>` over the chart container, not a child of the `<svg>` that could trigger reflow of the SVG's own box), so opening/closing it never touches `useContainerSize`'s `ResizeObserver` at all | Not a real threshold concern at this project's 2-vessel scale — flag only if overlay open/close is observed to cause a visible chart re-render/flicker during manual testing |

## Security Mistakes

No new attack surface is introduced by this milestone (no new user input, no new persistence, no new auth boundary — it is explicitly presentation-layer-only per the locked decision "Zero change to `classifyEncounter()`/domain logic"). Not a meaningful research area for this specific milestone; do not manufacture generic web-security findings that don't apply here.

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-------------------|
| Hover-only reveal for Gallery's "Try on Sandbox" button, no keyboard/touch equivalent | Touch and keyboard-only users lose the ability to load a gallery scenario at all (a strict regression from today's whole-card `<Link>`, which was reachable via Tab + Enter unconditionally) | Reveal on `:hover` **and** `:focus-within`, and ensure the button is always in the DOM/tab order (not conditionally rendered only on JS hover-detection) |
| On-chart floating control card opens directly over the vessel the user just clicked, potentially obscuring the very hull/heading visual the user needs to see while adjusting it | User can't see the vessel they're editing while editing it, undermining "watch the verdict update live" as they adjust speed/type | Anchor the overlay card offset from the vessel (not centered on top of it), and keep both vessels' hulls, headings, and the bearing line visible while any one overlay is open |
| Removing the always-visible side `ControlPanel` in favor of click-to-open overlays hides speed/type controls behind a discovery step | New users may not realize a vessel is clickable to reveal its controls, since the prior design showed both vessels' full control forms unconditionally, at all times | Guided Tour (already in scope) should explicitly call out "click a vessel to adjust its speed and type" as one of its 6 steps, since this is a discoverability change the redesign is introducing |

## "Looks Done But Isn't" Checklist

- [ ] **On-chart vessel overlay cards:** Often missing the "drag still works while a *different* vessel's overlay is open" case — verify by opening vessel A's overlay, then dragging vessel B's hull and rotate handle to completion.
- [ ] **Gallery "Try on Sandbox":** Often missing genuine no-navigation state update — verify the URL bar does NOT change and the existing Sandbox's in-progress edits (if any) are intentionally replaced, not silently ignored, when the button is clicked.
- [ ] **Reasoning-trail node chain:** Often missing keyboard/scroll accessibility if it becomes horizontally scrollable — verify Tab order and (if scrollable) arrow-key or visible scroll-affordance behavior, not just mouse-drag/trackpad scroll.
- [ ] **Guided Tour:** Often missing verified focus-trap behavior — verify Tab cannot escape the open Tour into the Sandbox behind it, and that closing via Escape/close-button/outside-click all correctly return focus to the "How to read this" trigger.
- [ ] **Chip-row removal:** Often leaves orphaned state/hooks (`activeChipId`, `handleChipSelect`, `chip-scenarios.ts`) wired but unreachable from any UI — verify via a repo-wide usage check, not just "the buttons are gone from the page."
- [ ] **Every one of the above:** Often "done" per green CI (lint/typecheck/test/build) but not yet verified in a real, human-operated browser session — verify against this project's own established closeout pattern (explicit browser walkthrough reported, not inferred from passing tests).

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|-----------------|------------------|
| On-chart overlay silently blocks hull/rotate drag (Pitfall 1) | LOW | Same fix pattern as Phase 4/Phase 8: add explicit `pointer-events: none` to the overlay's root, re-enable only on its real interactive children; re-run the manual drag-with-overlay-open test matrix |
| Gallery button falls back to full navigation instead of live state update (Pitfall 2) | MEDIUM | Requires the state-lifting/shared-store architectural decision to be made retroactively — cheaper if caught during the phase that builds it, expensive if caught after the whole milestone is "done" and other phases have already built on the old assumption |
| Connector rendering breaks under jsdom or relies on real-browser-only measurement (Pitfall 3) | MEDIUM | Replace measured connectors with a CSS-only equivalent; move any remaining real-measurement logic into an explicitly-excluded-from-unit-tests hook, verified only via browser walkthrough |
| Guided Tour focus/z-index collides with on-chart overlays (Pitfall 4) | LOW-MEDIUM | Assign an explicit, documented z-index tier to each of Tour/overlay-card/existing chart elements; re-verify focus-trap and background-inertness in a real browser |
| A phase was marked done on green CI alone and a real-browser regression surfaces later (Pitfall 5) | LOW-MEDIUM (if caught same milestone) / HIGH (if it ships to the public portfolio URL first) | Add the missing verification-script item, re-run it, and treat the phase as reopened rather than patched silently — consistent with this project's own history of reopening/fixing regressions found post-hoc (Phase 8's badge fix, the Phase 5 dev-server fix) |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|-------------------|----------------|
| On-chart overlay blocks hull/rotate-handle drag | Phase that first introduces on-chart vessel-control overlays (early architectural decision: `pointer-events` default + anchor-function design) | Manual drag test with overlay open on the *other* vessel; ideally an automated geometric/overlap check mirroring the Phase 8 point-in-polygon precedent |
| Gallery → Sandbox state bridge missing/faked | Phase that replaces `GalleryCard`'s `Link` with the "Try on Sandbox" button (early architectural decision: state-lifting vs. shared store, decided before writing the click handler) | Confirm no URL/navigation change occurs and the Sandbox chart visibly updates to the loaded scenario |
| Reasoning-chain connectors depend on real-browser DOM measurement | Phase that builds the horizontal "NAV DECISION CHAIN" layout (early architectural decision: CSS-only vs. measured connectors) | Vitest/RTL suite passes without any `getBoundingClientRect`/`getBBox` mocking; connector visuals confirmed only via browser walkthrough if any measurement remains |
| Guided Tour modal focus/z-index conflicts | Phase that adds the Guided Tour, scheduled after the on-chart overlay and reasoning-chain layouts are settled (early architectural decision: Dialog primitive choice, z-index tier, focus-return verification) | Real-browser Tab-trap test, Escape/close-button/outside-click dismissal test, confirm focus returns to the trigger button each time |
| Orphaned chip-row state/hooks left wired after chip-row removal | Phase that removes the inline chip row from `SandboxContainer` | Repo-wide reference check confirming `chip-scenarios.ts`/`activeChipId`/`handleChipSelect` are either removed or repurposed with updated naming, not silently retained as dead code |
| Green CI mistaken for "done" across any of the above | Every phase in this milestone (late polish / closeout step, not a one-time phase) | Each phase's closeout explicitly reports a human-operated browser verification pass targeting that phase's specific regression class, per this project's established closeout pattern |

## Sources

- `.planning/PROJECT.md` — this project's own Key Decisions table, specifically the two documented hit-testing-regression precedents (Phase 4, Phase 8), the `jsdom`/`getScreenCTM()`/`getBBox()` gap precedent, and the Phase 5 "tests green but dev server broken" precedent — HIGH confidence, primary source, this codebase's own incident history.
- Direct reading of current source: `src/components/sandbox/chart/VesselGroup.tsx`, `ChartPanel.tsx`, `SandboxContainer.tsx`, `hooks/useSandboxState.ts`, `hooks/useHullDrag.ts`, `control-panel/ControlPanel.tsx`, `reasoning/ReasoningTrail.tsx`, `src/components/gallery/GalleryContainer.tsx`, `card/GalleryCard.tsx`, `app/page.tsx`, `src/components/ui/` directory listing — HIGH confidence, ground truth for current architecture (confirms Gallery is a Server Component with no client-state bridge to Sandbox today, and no Dialog primitive exists yet in `src/components/ui/`).
- Context7 `/websites/radix-ui_primitives` (Dialog component docs) — verified `modal` defaults to `true`, focus-trap behavior, `onOpenAutoFocus`/`onCloseAutoFocus`/`onPointerDownOutside`/`onInteractOutside` callback surface, and default Escape-to-close-and-return-focus-to-trigger behavior — HIGH confidence, official documentation, used to ground Pitfall 4's specific claims about Radix Dialog's default behavior rather than relying on general training-data familiarity with shadcn/ui Dialog.

---
*Pitfalls research for: COLREGS Navigator v1.4 Design Sync (Sandbox & Gallery)*
*Researched: 2026-07-25*
