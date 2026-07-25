# Project Research Summary

**Project:** COLREGS Navigator — v1.4 "Design Sync (Sandbox & Gallery)" milestone
**Domain:** Front-end redesign sync for an existing Next.js 16 / React 19 / tRPC app — modal wizard, on-chart floating overlays, and cross-subtree client state sharing, applied to an already-shipped interactive SVG chart + gallery product
**Researched:** 2026-07-25
**Confidence:** HIGH

## Executive Summary

This milestone is presentation-layer-only: zero changes to `classifyEncounter()` or any domain/`src/server/` code. It restructures three existing surfaces — replacing the side `ControlPanel` with on-chart floating vessel-control overlays, adding a 6-step Guided Tour modal, and switching the Gallery from `<Link>` navigation to an in-place "Try on Sandbox" load — using primitives already available in the locked stack. No new npm dependencies are required: `radix-ui@^1.6.2` is already installed, so shadcn's `Dialog` and `Popover` registry components (`npx shadcn add dialog`/`popover`) are pure source-file additions. The Gallery→Sandbox state bridge is solved with plain React Context (a thin Client Component provider wrapping the existing Server/Client composition in `app/page.tsx`), not zustand — the trigger condition this project pre-scoped for adopting zustand (3+ frequently-updating shared-state consumers) has not arrived; there are exactly two, low-frequency consumers here.

The recommended approach generalizes code that already exists rather than adding parallel paths: `handleChipSelect()` becomes `loadScenario(vesselA, vesselB)`, and every vessel-mutation source (drag, form field, reset, Gallery load) continues to funnel through the single `applyVesselUpdate()` choke point. Positioning of the new on-chart overlay must go through the existing DOM-API-free `chartToScreen()` function, never `getBoundingClientRect()`/`getScreenCTM()` on the SVG — this project has already engineered around that exact jsdom gap once and the convention must hold for the new overlay and for any reasoning-trail connector-line work.

The dominant risk is not technology selection but regression of a bug class this codebase has already paid for twice: painted elements silently swallowing pointer events meant for vessel hulls/rotate-handles (Phase 4 and Phase 8 incidents). The new on-chart overlay card is a strictly larger, more animated version of that same shape and is the highest-risk single item in the milestone. A second, systemic risk is that automated CI (lint/typecheck/test/build) cannot observe real pointer-capture routing, real focus-trap escape, or real CSS stacking order — this project has already shipped "green but broken" once (the Phase 5 dev-server bug invisible to tsc/Vitest). Every phase in this milestone needs an explicit, scripted human-verification pass in a real browser, not just passing CI, as its actual completion bar.

## Key Findings

### Recommended Stack

No core-stack changes. The only additions are two shadcn/ui registry components (`Dialog`, `Popover`) layered on the already-installed `radix-ui` package — confirmed via direct `package.json`/`src/components/ui/` inspection that only `badge`/`button`/`card`/`label`/`select`/`slider` exist today, and that `dialog`/`popover` resolve against the existing dependency with zero new `package.json` lines. React's built-in `createContext`/`useContext` — not zustand — is the recommended mechanism for the Gallery→Sandbox bridge.

**Core technologies:**
- shadcn `Dialog` (Radix `Dialog` under the hood) — Guided Tour modal shell — controlled `open`/`currentStep` state, `Presence`-gated content mounting means step swaps don't remount the dialog; no dedicated stepper package needed (none exists in the shadcn registry)
- shadcn `Popover` (virtual-anchor pattern) — dismiss/focus shell for the on-chart vessel-control overlay — provides outside-click dismissal, Escape-to-close, and focus return for free; anchored via a portaled invisible div fed the existing `chartToScreen()`-computed coordinate, never a `ref` on the SVG node
- React Context (`SandboxBridgeProvider`) — Gallery→Sandbox cross-tree signal — a Client Component provider wrapping Server Component children per Next.js's own documented pattern; zustand deliberately deferred until a 3rd shared-state consumer actually appears

### Expected Features

Three UI patterns, matched against locked v1.4 scope. No domain/feature research applies (classification logic is unchanged this milestone).

**Must have (table stakes):**
- Guided Tour: Back/Next/Skip (first step no Back, last step "Done"), step-dot progress, Escape/outside-click dismiss, focus trap + focus-return to trigger, `localStorage` "seen" flag (no auto-launch — manual "How to read this" button only)
- On-chart overlay: dismiss on outside-click/Escape, single `selectedVesselId: 'A' | 'B' | null` state (not two independent booleans) so re-selecting toggles closed and selecting the other vessel moves the overlay, positioned near the live (draggable) vessel position
- Gallery card: discoverable CTA revealed on hover **and** `:focus-within` **and** touch/coarse-pointer fallback — hover-only silently locks out touch and keyboard users, a regression from today's fully-accessible whole-card `<Link>`
- Gallery→Sandbox: direct state-setter call (no routing/navigation), `scrollIntoView({behavior:'smooth'})` sequenced after the state update commits, some visible acknowledgment that data changed

**Should have (competitive):**
- Tour illustrations depict this app's actual chart UI (bearing lines, give-way color, decision chain) rather than generic icon art — teaches the reasoning that is the app's actual differentiator
- On-chart overlay scoped exactly to editable fields (position/heading/speed/type), resisting scope creep into a full "properties panel" port
- Load-in-place preserves scroll/URL state cleanly — no history entry added, back-button behavior unaffected

**Defer (v2+):**
- Auto-launch Tour on first visit (needs its own first-visit-detection design — explicitly deferred, not bundled)
- Post-load highlight/flash animation on Sandbox beyond the scroll itself
- DOM-anchored "spotlight" tour pointing at live elements (would justify a real tour library — not this milestone's self-contained modal shape)
- Overlay editing extended beyond 2 vessels (out of scope per existing "multi-vessel is v2" boundary)

### Architecture Approach

The current architecture is a single client tree (`SandboxContainer`) with one state choke point (`useSandboxState()`) plus a fully separate Server Component tree (`GalleryContainer`) that only ever wrote via `<Link>` navigation. The target architecture keeps that choke point intact and adds one new entry point (`loadScenario()`, generalized from `handleChipSelect()`) plus a thin `SandboxBridgeProvider` Client Component wrapping the whole page composition, whose Server Component children (`Hero`, `GalleryContainer`) remain unaffected — only the Provider itself and the new interactive leaves (`TryOnSandboxButton`, `VesselControlOverlay`) cross the Server/Client boundary.

**Major components:**
1. `useSandboxState()` — gains `loadScenario(vesselA, vesselB)` (replaces `handleChipSelect`), remains the sole choke point every mutation source (drag, form field, Reset, Gallery load) funnels through
2. `SandboxBridgeProvider` / `useSandboxBridge()` — new page-scoped React Context; pure signaling channel (`pendingScenario`, `requestLoad()`), zero business logic
3. `ChartPanel` + `VesselControlOverlay` — `ChartPanel` gains local `selectedVessel` state (not lifted into `useSandboxState()`) and renders the new floating overlay, which absorbs `ControlPanel`'s form fields and positions via the existing `chartToScreen()`-derived screen coordinates
4. `ChartHeaderStrip` / `ChartFooterStrip` — replace `VerdictBanner`/`InstrumentReadouts` by recomposing the same existing pure derivation modules (`bannerRuleBadge`, `statusPillCopy`, `deriveInstrumentReadouts`) into a new layout, no new business logic
5. `GuidedTourModal` + `guided-tour-steps.ts` (pure data) + `TourStepIllustration` — new, fully independent feature folder (`src/components/tour/`), zero shared files with the Sandbox/Gallery wiring

Suggested build order (from ARCHITECTURE.md): [1] generalize `handleChipSelect`→`loadScenario` + remove chip row first (both [2] and [3] depend on it) → [2] Gallery↔Sandbox bridge and [3] chart restructure (overlay + strips) can run in parallel/either order → [4] Guided Tour and [5] Hero visual sync are fully independent and lowest-risk, safe to sequence last.

### Critical Pitfalls

1. **On-chart overlay reopens the hit-testing regression class (3rd occurrence)** — a floating control card stacked over the chart can silently swallow `pointerdown` events meant for hull/rotate-handle drag, exactly like the Phase 4 and Phase 8 incidents, but at a much larger blast radius (150-250px card vs. ~45px² badge). Avoid: default the overlay's root to `pointer-events: none`, re-enable only on its real interactive children; treat overlay-open as a state machine that must account for heading-dependent hull-polygon overlap; add an automated geometric/overlap check mirroring the Phase 8 point-in-polygon precedent, not manual UAT alone.
2. **Gallery (Server Component) has no existing seam to reach into Sandbox's client-only state** — naive implementations either do nothing, force a state-losing remount, or secretly fall back to `router.push('/s/{id}')`, which defeats the locked "load-in-place, no navigation" decision. Avoid: decide the state-ownership seam (Context provider, per STACK/ARCHITECTURE research) explicitly before writing the button's `onClick`; sequence `scrollIntoView` after the state update commits, not synchronously in the click handler.
3. **Reasoning-trail connector-line work tempts `getBoundingClientRect()`/`getBBox()`, which this project has already banned once (jsdom gap)** — precise connector geometry between node-cards is the obvious but wrong reach. Avoid: default to CSS-only connectors (border/pseudo-element chevrons keyed off adjacent step types, not runtime pixel positions); if real measurement is unavoidable, isolate it in a hook explicitly excluded from unit-test coverage and verify only via browser walkthrough.
4. **Guided Tour modal is the first Dialog primitive in this codebase and can collide with the new overlay's stacking/focus conventions** — Radix Dialog defaults to `modal={true}` (focus trap, auto-close-on-Escape, focus-return-to-trigger); undocumented z-index tiers between Tour and on-chart overlay risk a collision once both ship in the same milestone. Avoid: assign an explicit, documented z-index scale; empirically verify (not assume) that the Dialog backdrop makes background Sandbox interactions genuinely inert given this app's unusual SVG pointer-event wiring.
5. **Green CI is not this project's actual acceptance bar** — Vitest/RTL under jsdom cannot observe real pointer-capture routing, real focus-trap Tab-escape, or real CSS stacking order; this project has already shipped "tests green, dev server broken" once (Phase 5) and needed two UAT rounds to fix hit-testing once before (Phase 4). Avoid: write an explicit, scripted human-verification checklist per phase up front (during planning, not closeout), derived directly from pitfalls 1-4, and report the actual browser-verification outcome as the phase-completion signal — not "lint/test/build all green."

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Sandbox mutation-path generalization (prerequisite refactor)
**Rationale:** Both the Gallery bridge and the chip-row-removal target feature depend on the same small refactor; doing it once first avoids two independent re-derivations later.
**Delivers:** `loadScenario(vesselA, vesselB)` replacing `handleChipSelect(chipId)` in `useSandboxState()`; chip row JSX, `activeChipId`, and (if no other consumer remains) `chip-scenarios.ts` removed from `SandboxContainer`.
**Addresses:** "Remove 6-chip preset row" (locked, mutually exclusive with keeping Gallery as pure `Link`, per FEATURES.md dependency notes).
**Avoids:** Technical-debt pitfall of orphaned `activeChipId`/`handleChipSelect`/`chip-scenarios.ts` left wired but unreachable after the chip row disappears from the UI.

### Phase 2: Gallery → Sandbox load-in-place bridge
**Rationale:** Flagged as the milestone's "hard dependency" — needs the generalized `loadScenario()` from Phase 1, and its state-ownership seam (Context vs. shared store) must be decided explicitly before any component code is written.
**Delivers:** `SandboxBridgeProvider`/`useSandboxBridge()` Context wrapping `app/page.tsx`; `GalleryCard` drops its whole-card `<Link>` in favor of a `TryOnSandboxButton` leaf (hover + `:focus-within` + touch-visible reveal); `scrollIntoView` sequenced after the state commit.
**Uses:** React Context per STACK.md's Question 3 verdict — not zustand.
**Implements:** ARCHITECTURE.md's "Server Components as children of a page-level Client Provider" pattern; Anti-Pattern 3/4 guardrails (don't make `GalleryContainer`/`GalleryCard` Client Components; don't reach for zustand at 2 consumers).

### Phase 3: On-chart vessel control overlay
**Rationale:** Independent of Phase 2 (different files almost entirely, per ARCHITECTURE.md's build-order graph), but shares the Phase 1 prerequisite and is the highest-risk item in the milestone — schedule with dedicated attention to the pointer-events regression class.
**Delivers:** `VesselControlOverlay` (absorbs `ControlPanel`'s form fields), `selectedVessel` state local to `ChartPanel`, click-vs-drag movement-threshold guard in the hull pointer handlers, `ChartHeaderStrip`/`ChartFooterStrip` replacing `VerdictBanner`/`InstrumentReadouts`.
**Addresses:** "On-chart vessel control overlay (replaces side panel)" — HIGH user value, MEDIUM cost per FEATURES.md's prioritization matrix.
**Avoids:** Pitfall 1 (hit-testing regression, 3rd occurrence) — requires explicit `pointer-events: none` default + selective re-enable, and a manual (ideally automated geometric) drag-with-overlay-open verification pass before closing the phase.

### Phase 4: Guided Tour modal
**Rationale:** Fully independent of Phases 2/3 (zero shared files), and best sequenced *after* the overlay/chart-strip restructure lands so Tour copy references the final UI and z-index tiers can be assigned without guessing at a not-yet-built layout.
**Delivers:** `GuidedTourModal` (shadcn `Dialog`), `guided-tour-steps.ts` (pure data), `TourStepIllustration`, `localStorage` "seen" gate, "How to read this" trigger button.
**Addresses:** MEDIUM user value / LOW cost per FEATURES.md; should explicitly teach "click a vessel to adjust its speed/type" given the overlay replaces an always-visible panel.
**Avoids:** Pitfall 4 (Dialog focus/z-index collision with the new overlay) — requires an explicit documented z-index scale and empirical (not assumed) verification that the modal backdrop makes background Sandbox interactions genuinely inert.

### Phase 5: Reasoning-trail visual sync + Hero preview sync (lowest risk, additive/cosmetic)
**Rationale:** Fully independent, static/fixture-driven changes; safest to do last or in parallel on separate branches.
**Delivers:** Horizontal "NAV DECISION CHAIN" connector treatment (CSS-only, position-independent) for `ReasoningTrail`; visual-only sync of the Hero preview to match the redesign.
**Avoids:** Pitfall 3 (DOM-measurement-driven connectors that break under jsdom) — default to CSS-only connectors; isolate any real measurement into a hook explicitly excluded from unit-test coverage.

### Phase Ordering Rationale

- Phase 1 unblocks both Phase 2 and Phase 3's "remove chip row" requirement — a single mechanical refactor, not duplicated logic.
- Phases 2 and 3 touch almost entirely disjoint files (bridge/Gallery vs. chart/overlay) and can run in parallel; if serialized, Phase 2 first is slightly preferable since it's more mechanically constrained.
- Phase 4 (Tour) is scheduled after Phase 3 specifically so its content and z-index tier reference the final, already-built chart/overlay layout rather than a moving target.
- Phase 5 is deliberately last/lowest-priority since it is purely additive/cosmetic and shares no files with the state-bridging or hit-testing-sensitive work.
- Every phase carries an explicit human-verification checklist item (Pitfall 5) — this is a cross-cutting closeout requirement, not a separate phase.

### Research Flags

Needs deeper research during planning:
- **Phase 3 (on-chart overlay):** the pointer-events/hit-testing interaction is this milestone's highest-risk item with a documented 2-incident history in this exact codebase — plan-phase should consider scoping an automated geometric/overlap check (mirroring the Phase 8 point-in-polygon precedent), not rely on manual verification alone.
- **Phase 2 (Gallery bridge):** the state-ownership seam decision (Context, per this research) should be written down explicitly in the phase plan before implementation begins, since STACK/ARCHITECTURE and PITFALLS research frame this as a "decide before writing the click handler" risk.

Phases with standard/well-documented patterns (research-phase likely unnecessary):
- **Phase 1 (mutation-path generalization):** a rename + signature generalization of already-tested, already-existing code.
- **Phase 4 (Guided Tour):** shadcn `Dialog` + local `currentStep` state is a fully documented, verified pattern (Context7-confirmed Radix behavior); the main residual risk (z-index/focus interplay with Phase 3's overlay) is a verification-checklist item, not an open research question.
- **Phase 5 (reasoning-trail/Hero sync):** CSS-only connector treatment is a standard, already-precedented pattern in this codebase.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified against Context7 `/shadcn-ui/ui`, `/radix-ui/primitives`, and `/vercel/next.js/v16.2.9` official sources, plus direct `package.json`/`src/components/ui/` inspection confirming exact current dependency state |
| Features | MEDIUM-HIGH | Radix/shadcn primitive behavior HIGH (Context7-verified); general UX-pattern conventions (tour modals, hover-reveal CTAs) MEDIUM, cross-referenced across 3+ independent sources; no single canonical spec exists for "load example into workspace" so that section is pattern-synthesis |
| Architecture | HIGH | Grounded in direct inspection of the actual current implementation (`useSandboxState.ts`, `ChartPanel.tsx`, `VesselGroup.tsx`, `GalleryContainer.tsx`, etc.), not inferred from training data; Server/Client composition pattern is stable, documented Next.js capability |
| Pitfalls | HIGH | Grounded directly in this codebase's own documented incident history (Phase 4, Phase 8, Phase 5 regressions in PROJECT.md's Key Decisions) plus direct source reading; one external claim (Radix Dialog modal defaults) independently verified via Context7 |

**Overall confidence:** HIGH

### Gaps to Address

- **Exact `@testing-library/user-event` version for simulating pointer-drag sequences in the new overlay's interaction tests** — STACK.md flags this as MEDIUM confidence (registry lookup was interrupted mid-research); verify the installed major version (v14+) at implementation time rather than assuming.
- **Whether the design file specifies a mobile/narrow-viewport Dialog↔Drawer swap for the Guided Tour** — STACK.md's recommendation (plain `Dialog`, no responsive swap) is conditional on the design not showing a bottom-sheet variant; confirm against the actual design file before Phase 4 implementation.
- **Whether any invisible connector/gap element is part of the on-chart overlay's final visual design** — if the design introduces a decorative connector between the vessel anchor point and the floating card, it needs an explicit `pointer-events: none`, per the existing Phase 8 precedent; not yet confirmed since the design's exact overlay-card visual shape wasn't available to this research pass.
- **Automated overlap-check feasibility for Phase 3** — PITFALLS.md recommends an automated geometric/point-in-polygon check mirroring the Phase 8 precedent, but doesn't specify implementation detail; plan-phase should scope whether this is a unit test against `resolveOverlayAnchor()` output or a different mechanism.

## Sources

### Primary (HIGH confidence)
- Context7 `/shadcn-ui/ui` — `Dialog` controlled-state example, `Popover` registry source, `context-menu.tsx` virtual-anchor pattern, "Component Selection" skill doc (confirms no stepper component exists)
- Context7 `/radix-ui/primitives` — `Dialog`/`Popover` `Presence`, `FocusScope`, `DismissableLayer` behavior; controlled `open`/`onOpenChange` shape; modal defaults and `onCloseAutoFocus`/`onPointerDownOutside` callback surface
- Context7 `/vercel/next.js/v16.2.9` — "Interleaving Server and Client Components," "Context providers" pattern (matches this project's locked Next.js 16.2.10)
- Direct repository inspection — `package.json`, `src/components/ui/`, `useSandboxState.ts`, `SandboxContainer.tsx`, `ChartPanel.tsx`, `VesselGroup.tsx`, `ControlPanel.tsx`, `VerdictBanner.tsx`, `InstrumentReadouts.tsx`, `GalleryContainer.tsx`, `GalleryCard.tsx`, `app/page.tsx`, `chip-scenarios.ts` — ground truth for current architecture, confirming Gallery is Server-only with no bridge to Sandbox today and no Dialog primitive exists yet
- `.planning/PROJECT.md` Key Decisions table — this project's own documented Phase 4/Phase 8/Phase 5 incident history, locked v1.4 scope decisions

### Secondary (MEDIUM confidence)
- Appcues onboarding/product-tour UX pattern guides, Kompassify product tour modal examples, Whatfix product tours 2025 — cross-referenced tour-modal conventions (Back/Next/Skip, dot progress)
- Deque WAI-ARIA modal dialog pattern, UXPin accessible modal focus traps — accessibility conventions for focus-trapped modals
- LogRocket product tour library landscape, Canva "Use this template" flow description — informs anti-feature reasoning (why not a tour library; load-in-place pattern precedent)
- Konva canvas-vs-SVG guide, vitest-dev/vitest #395 canvas testing flakiness — carried forward from original stack research, informs the continued SVG-not-canvas rationale

### Tertiary (LOW confidence)
- None flagged — all findings in this milestone's research trace to either direct repository inspection, official Context7-verified library docs, or cross-referenced (3+ source) UX convention research.

---
*Research completed: 2026-07-25*
*Ready for roadmap: yes*
