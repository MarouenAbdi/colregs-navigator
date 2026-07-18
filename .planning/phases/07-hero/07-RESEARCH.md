# Phase 7: Hero - Research

**Researched:** 2026-07-18
**Domain:** Net-new static marketing Hero section (Next.js Server Component) + hand-built decorative SVG chart preview, composed against an existing shadcn/Tailwind v4 dark-theme scaffold
**Confidence:** HIGH (all five open questions resolved against direct repo inspection + a working numeric simulation of the actual domain algorithms, not guesswork; Tailwind v4 breakpoint claims verified via Context7)

> This document is a **deltas-only, deep-dive supplement** to the milestone-level research already on disk (`research/ARCHITECTURE.md`, `research/PITFALLS.md`, `research/FEATURES.md`, `research/STACK.md`). It does not restate what those already establish (folder location, no-tRPC pattern, dependency direction, dark-theme tokens, shadcn CLI setup) — it answers the five specific open implementation questions the milestone research left for phase-level planning.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Preview card motion**
- **D-01:** The illustrative preview card is fully static — no animation (no pulsing "live" dot, no animated bearing line). Matches the design mock exactly and avoids the layout-shift risk flagged in `research/PITFALLS.md` (a Hero box-height change after initial paint can throw off the native browser fragment-scroll math for the future `/#gallery` anchor).

**Preview card chart fidelity**
- **D-02:** The mini polar-chart illustration matches the design mock's full detail: range ring, dashed bearing line, compass-style tick marks, both vessel triangles with role badges — a faithful hand-built static SVG, not a simplified/reduced version. Consistent with the project's already-locked "design followed exactly" decision.
- **D-03 (carried from research/PITFALLS.md):** This illustration must NOT share code/component with the real interactive `ChartPanel.tsx` — build it as an independent, static SVG. Reusing `ChartPanel`'s rendering code for a decorative preview is an explicit warning sign in Pitfall 1 (risk of coupling the decorative preview to the live hit-testing contract during future Sandbox restyle work).

**Mobile layout (below 900px)**
- **D-04:** Below the 900px breakpoint, Hero collapses to a single column with headline/copy/CTAs stacked above the preview card (text-first). Standard marketing-page convention — gets visitors to the primary CTA fastest on small screens, consistent with HERO-04's single-column requirement.

**CTA scroll behavior**
- **D-05:** Both Hero CTAs ("Open the sandbox" → `#sandbox`, "Classic encounters" → `#gallery`) use smooth-animated scroll (`scroll-behavior: smooth` in CSS, no JS scroll library needed). Works with the existing `scroll-padding-top: 64px` header offset already set in Phase 6's `app/globals.css`.
- **D-06 (carried forward, not re-decided):** `#gallery` does not exist as a real anchor target until Phase 9 ships — Phase 6's Header nav already links `href="#gallery"` and ships to `main` in that same dangling state as an accepted interim condition. Hero's "Classic encounters" CTA follows the identical precedent: point at `#gallery` now, accept it's a no-op until Phase 9's PR lands (no error, browser simply doesn't scroll). Do not build a temporary `/gallery`-route fallback for this — would contradict the already-shipped Header precedent and add throwaway code.

**Preview card fixture data**
- **D-07 (carried from research/ARCHITECTURE.md):** The preview card's canned numbers (Rule 15, Crossing, "Vessel A gives way", RANGE/BEARING/CPA readouts) are produced by calling `classifyEncounter()` from `src/domain/colregs/` directly against a new fixed fixture — no tRPC, no server round-trip. Mirrors `SandboxContainer`'s existing default-classification fixture pattern (`src/domain/colregs/classify-encounter.fixtures.ts`). The specific vessel position/heading/speed values that reproduce the design mock's exact displayed numbers (2.99 NM range, 061° bearing, 1.18 NM CPA, Rule 15 crossing, Vessel A gives way) are a research/planning task, not a user decision.

### Claude's Discretion
- Exact shadcn primitives composed for the CTAs and preview-card `Card` container (Button, Card, Badge — per `research/STACK.md`'s "Hero preview / reasoning-trail containers → Card" guidance).
- Exact fixture values (vessel A/B position, heading, speed) needed to reproduce the design mock's displayed Rule 15 crossing numbers via `classifyEncounter()`.
- Exact `lucide-react` icon(s), if any, used inside the preview card badges — match the design image as closely as the available icon set allows (same approach as Phase 6's D-05 logo-icon precedent).

### Deferred Ideas (OUT OF SCOPE)
None new — discussion stayed within Phase 7's scope.

Reviewed but not folded: "Embed gallery on home page instead of separate route" (`.planning/todos/pending/2026-07-18-embed-gallery-on-home-page-instead-of-separate-route.md`) — matched Phase 7 by keyword overlap during todo cross-reference, but this is explicitly Phase 9's (Gallery) concern. Hero's CTA only needs to point at `#gallery` (D-06), not build the section itself.
</user_constraints>

## Summary

All five open questions have concrete, verified answers. The headline finding: a real, unmodified `classifyEncounter()` call against a hand-derived fixture (vesselA at the origin heading 000°/12kn, vesselB at bearing 061°/range 2.99nm heading 280°/8.3kn) reproduces the design mock's displayed numbers essentially exactly — RANGE 2.99 NM (exact), BEARING 061° (exact), CPA 1.18 NM (1.1805, rounds exact), Rule 15/Crossing/Vessel A gives way (exact) — verified by running the literal formulas from `bearing.ts`/`relative-bearing.ts`/`cpa.ts`/`classify-encounter.ts` in a throwaway script, not by hand arithmetic. The mini-chart SVG must be hand-built with zero imports from `src/components/sandbox/*` (per the already-locked D-03/Pitfall 1), but MAY reuse the pure `chartToScreen()` domain function for coordinate placement — that's domain math, not the forbidden component-rendering code. The `#sandbox` anchor target should land on a new wrapper element in `app/page.tsx`, NOT inside `SandboxContainer.tsx` (whose current root is itself a stray `<main>`, a pre-existing issue Phase 7 should not touch). `scroll-behavior: smooth` plus the already-present `scroll-padding-top: 64px` is fully sufficient — Header's CTAs are already plain `<a href="#...">` tags, so none of the Next.js `<Link>`-specific hash-scroll gaps documented in `PITFALLS.md` Pitfall 6 apply here at all (those are specific to client-side route transitions, not same-page anchor clicks). Only two new shadcn primitives are needed (`card`, `badge`); both are simple, already-installed-dependency-compatible additions with no new npm packages. Testing should follow the Header/Footer precedent (zero automated visual tests for static chrome) plus one new addition Header/Footer didn't need: a plain Vitest assertion that the Hero's fixture keeps producing the claimed Rule 15 verdict, guarding against silent drift if `classifyEncounter()`'s internals ever change.

**Primary recommendation:** Build `Hero.tsx` as a plain (non-`"use client"`) Server Component, call `classifyEncounter()` synchronously and inline (no React hook needed — nothing here has state), use the verified fixture below, hand-build the mini-chart SVG with a fixed `viewBox` (no `ResizeObserver`, unlike `ChartPanel`), and land `id="sandbox"` on a new wrapper in `app/page.tsx` rather than touching `SandboxContainer.tsx`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Hero headline/copy/CTA markup | Frontend Server (SSR) | — | Static content, zero interactivity; matches `Header`/`Footer`'s existing plain-Server-Component precedent |
| Illustrative preview-card classification | Frontend Server (SSR) | — | Pure domain function call (`classifyEncounter`) executed at render time against a fixed fixture — no client JS, no API round-trip (locked: D-07, ARCHITECTURE.md) |
| Mini-chart SVG rendering | Frontend Server (SSR) | — | Static markup, computed once at render time from the fixture's fixed geometry; no drag/resize/interactivity, so no client boundary needed at all |
| CTA anchor-scroll (`#sandbox`/`#gallery`) | Browser / Client | — | Native browser fragment-scroll + CSS `scroll-behavior: smooth`; zero JS, zero React involvement (locked: D-05) |
| `#sandbox` anchor target element | Frontend Server (SSR) | — | Must exist in the initial server-rendered HTML (same reasoning `PITFALLS.md` Pitfall 6 documents for `#gallery`) — lands on a Server Component wrapper in `app/page.tsx`, not inside the `"use client"` `SandboxContainer` |

## Standard Stack

### Core (already installed — no version changes)

| Library | Version (from `package.json`) | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `lucide-react` | `^1.25.0` | Trust-note checkmark icon | Already the project's locked icon library (STACK.md); Header.tsx already established the pattern of verifying an icon's exact export name against the installed version before use (its own `Code2`-not-`Github` deviation note) — do the same for the checkmark icon (candidates: `CircleCheck`, `BadgeCheck`; verify at implementation time, don't assume) |
| `class-variance-authority`, `clsx`, `tailwind-merge`, `radix-ui` | as pinned | Transitive deps of the two new shadcn primitives below | Already installed by Phase 6's `shadcn init`; no action needed |

### New (this phase — shadcn CLI vendored source, not new npm packages)

| Component | shadcn command | Purpose | Why Needed |
|-----------|----------------|---------|------------|
| `card` | `npx shadcn add card` | Preview-card container (`Card`/`CardHeader`/`CardContent`) | Design mock's "Live classification" panel is a bordered, elevated container — matches `STACK.md`'s existing "Hero preview ... containers → Card" guidance exactly |
| `badge` | `npx shadcn add badge` | Eyebrow pill, "Live classification" dot-badge, GW/SO role pills, "Rule 15" chip | `Badge` supports `variant="default\|secondary\|destructive\|outline\|ghost"` (verified via Context7 `/websites/ui_shadcn`) — covers every pill/chip shape visible in the design mock without a bespoke component |

**Installation:**
```bash
npx shadcn add card badge
```
`components.json` already pins `"style": "radix-nova"` (Phase 6) — no `--base` flag needed, the CLI will generate Radix-based `card.tsx`/`badge.tsx` consistent with the already-installed `button.tsx`.

**Version verification:** Confirmed via direct `package.json` read — `radix-ui@^1.6.2`, `lucide-react@^1.25.0`, `class-variance-authority@^0.7.1`, `clsx@^2.1.1`, `tailwind-merge@^3.6.0` are all already present (installed by Phase 6's `shadcn init`). `card`/`badge` are CLI-generated source files, not registry-installed npm packages — no new `package.json` entries expected beyond what Phase 6 already added.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Plain styled `<div>` bar for the Rule 15 verdict banner | shadcn `Alert` | Not justified — a single static colored bar with a `Badge` + text is simpler and matches `STACK.md`'s existing "what NOT to add (yet)" discipline (don't add a component speculatively) |
| `Badge` for the three RANGE/BEARING/CPA readout tiles | Plain bordered `<div>`s | Recommend plain `<div>`s — `Badge` is a pill/chip primitive, not a data-tile primitive; forcing 3 multi-line label+value tiles into `Badge` semantics would be a misuse. Compose with `Card`'s existing border/radius tokens via `className`, no new primitive needed |

## Package Legitimacy Audit

No new npm packages are installed by this phase. `npx shadcn add card badge` vendors component **source files** into `src/components/ui/`, drawing only on dependencies (`radix-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`) already installed and already vetted in `research/STACK.md` (Phase 6, itself a milestone-level research deliverable with full slopcheck/registry verification at that time). Re-running the Package Legitimacy Gate is not applicable here — this table is intentionally empty.

| Package | Registry | Disposition |
|---------|----------|-------------|
| *(none — no new packages this phase)* | — | N/A |

## Architecture Patterns

### System Architecture Diagram

```
app/page.tsx (Server Component)
    │
    ├─▶ <Hero />                              (src/components/hero/Hero.tsx, NEW)
    │       │
    │       ├─▶ classifyEncounter(fixtureA, fixtureB)   [src/domain/colregs/, called inline, synchronous]
    │       │       └─▶ returns ClassificationResult (encounterType, giveWay, trail[])
    │       │
    │       ├─▶ chartToScreen(position, FIXED_CONTAINER_SIZE, FIXED_VIEW_BOX)  [src/domain/geometry/]
    │       │       └─▶ maps fixture vesselA/vesselB positions → static SVG pixel coords
    │       │
    │       ├─▶ hand-built <svg> (range ring, dashed bearing line, tick marks,
    │       │      two vessel triangles + role badges) — NO import from ChartPanel.tsx
    │       │
    │       └─▶ two <a href="#sandbox">/<a href="#gallery"> CTAs (Button asChild,
    │              same pattern as Header.tsx's existing "Source" link)
    │
    └─▶ <div id="sandbox">                     (NEW wrapper, app/page.tsx only)
            └─▶ <SandboxContainer />           (EXISTING, "use client", UNCHANGED this phase)

Browser click on "#sandbox"/"#gallery" anchor
    └─▶ native browser fragment-scroll (scroll-behavior: smooth + scroll-padding-top: 64px,
         both plain CSS on `html` — zero JS, zero React Router involvement)
```

### Recommended Project Structure

```
src/components/hero/
├── Hero.tsx                    # plain Server Component (NO "use client") — markup + inline classifyEncounter() call
└── hero-preview-fixture.ts     # the fixed vesselA/vesselB + FIXED_CONTAINER_SIZE/FIXED_VIEW_BOX constants
                                 # (naming mirrors classify-encounter.fixtures.ts's convention — NOT a
                                 #  "usePreviewClassification.ts" hook, see Pattern 2 below)
```

### Pattern 1: Fixed-viewBox static SVG — no `ResizeObserver`, unlike `ChartPanel`

**What:** `ChartPanel.tsx` needs `ResizeObserver` because it's a real, arbitrarily-resizable interactive panel that must recompute `chartToScreen()` on every container resize. Hero's preview card has no such requirement — it's a small, fixed-aspect decorative element. Define a **constant** `HERO_CONTAINER_SIZE = { width: 280, height: 280 }` (or whatever pixel size matches the design) and a constant `HERO_VIEW_BOX` (chart-space units, e.g. `{ minX: -2, minY: -2, width: 6, height: 6 }` sized to comfortably frame the fixture's two vessel positions), call `chartToScreen()` **once** per vessel at module/render time (no `useEffect`, no `useState`, no ref), and render `<svg viewBox="0 0 280 280" width="100%" height="auto">` — SVG's native `viewBox` scaling makes this fully responsive across breakpoints with zero JS.

**When to use:** Any decorative/non-interactive SVG illustration where the "container" is really just "however big the design says this card is," not a genuinely resizable panel.

**Source:** Verified by reading `screen-convert.ts`'s `chartToScreen()` signature directly — it's a pure `(position, containerSize, viewBox) => {screenX, screenY}` function with **zero DOM dependency** (confirmed in its own header comment: "zero DOM/browser-observer/graphics-element API dependency"). It is exactly as safe to call from a Server Component as any other pure domain function.

### Pattern 2: No React hook needed — plain synchronous function call

**What:** `ARCHITECTURE.md`'s sketch names a `usePreviewClassification.ts` file, which reads as a React hook. It doesn't need to be one: `classifyEncounter()` is synchronous and pure, and Hero has no state/effect. Naming it `usePreviewClassification` would misleadingly imply Rules-of-Hooks constraints (can't call conditionally, needs `"use client"` context for some hook types, etc.) that don't actually apply. Recommend a plain, non-hook module: co-locate the fixture data in `hero-preview-fixture.ts` (mirroring `classify-encounter.fixtures.ts`'s own naming/export convention) and call `classifyEncounter(fixtureVesselA, fixtureVesselB)` directly inside `Hero.tsx`'s function body — this also means Hero.tsx can be `async function Hero()` free (fully synchronous), which keeps it trivially renderable by RTL in tests (see Testing section below) without any of the async-Server-Component test-harness complications Next.js/RTL sometimes have.

**Trade-off:** None meaningful — this is a naming/structure clarification, not a new capability.

### Pattern 3: Hero-local, hardcoded role→color mapping — do NOT import `sandbox/vessel-role.ts`

**What:** The design's preview card shows a red "GW" pill on vesselA and a teal/green "SO" pill on vesselB. `src/components/sandbox/vessel-role.ts` already exports a `getVesselRole()` role-derivation function, and it's tempting to reuse it. **Don't.** Two independent reasons:
1. **Dependency-boundary violation.** `ARCHITECTURE.md`'s locked dependency rules permit `hero/` to import only `ui/*`, `shared/*`, and `src/domain/*` — `src/components/sandbox/*` is not on that list. `vessel-role.ts` lives under `sandbox/`, not `shared/`, so importing it from `hero/` crosses a feature boundary the milestone research explicitly closed off.
2. **Wrong color source anyway.** `ChartPanel.tsx`'s `HULL_FILL_CLASS` (`fill-red-500`/`fill-green-500`/`fill-slate-400`) is *itself* still light-mode-only Tailwind classes, not yet re-themed for the dark palette (that re-theming is explicitly Phase 8's job — `ARCHITECTURE.md` Anti-Pattern 4). Importing it now would inherit colors that don't belong on Hero's dark card and that are about to change anyway in Phase 8.

Since the fixture's verdict is already known and fixed at authoring time (`giveWay: "vesselA"`), there is no need for ANY role-derivation function at all — hardcode which vessel gets which badge/color directly in `Hero.tsx`'s SVG-building code, but derive the *label text* ("GW"/"SO") from `classification.giveWay`/`.standOn` (not fully hand-typed) so a future fixture change can't silently desync the badge text from the actual computed verdict.

**Do NOT create a `shared/vessel-role-colors.ts` "to be safe" either** — `PITFALLS.md` Pitfall 1's own warning signs list explicitly flags "introducing shared/decorative read-only SVG chart previews that get refactored to share code with the real interactive chart" as the failure mode to avoid. A small amount of duplicated color logic between Hero (2 static colors) and the eventual Phase 8 `vessel-role.ts` extension is the deliberately accepted cost of keeping the decorative preview fully decoupled from the live hit-testing contract.

### Pattern 4: Custom 900px Tailwind v4 breakpoint

**What:** The design's "single-column below 900px" (HERO-04) requirement has no matching Tailwind v4 default breakpoint (defaults: `sm`=640px, `md`=768px, `lg`=1024px). Two verified options (Context7 `/websites/tailwindcss`, HIGH confidence):

1. **Arbitrary-value bracket syntax, zero config change** — `min-[900px]:flex-row` / `max-[899px]:flex-col`. Fully supported natively in Tailwind v4, confirmed via official docs: *"For one-off breakpoints not suitable for the theme, use `min` or `max` variants with arbitrary values directly in your markup"* (`max-[600px]:bg-sky-300`, `min-[320px]:text-center`).
2. **Named custom breakpoint token** — register once in `app/globals.css`'s `@theme` block:
   ```css
   @theme {
     --breakpoint-hero: 900px;
   }
   ```
   generating a `hero:` (min-width 900px) variant, confirmed via Context7: *"Defining `--breakpoint-3xl: 120rem` allows you to use the `3xl:*` variant..."* — the same mechanism applies to any custom name. Tailwind v4's docs also confirm *"Tailwind provides `max-*` variants for all default breakpoints"* — **MEDIUM confidence** (not explicitly demonstrated with a custom-named breakpoint in the fetched docs) that `max-hero:` auto-generates the same way; verify with a quick dev-server check before relying on it.

**Recommendation:** Since this exact 900px threshold is *also* required by Phase 8's SBOX-05 ("stacked single-column below 900px" — the identical number), and `SCAF-06`/`ARCHITECTURE.md` already designate `app/globals.css`'s `@theme` block as the single shared token location, register `--breakpoint-hero: 900px` now (Phase 7 is the first phase to actually need it — Phase 6 didn't touch it). Fall back to `min-[900px]:`/`max-[899px]:` arbitrary values for anything the named-variant approach doesn't cleanly cover, per option 1 above (zero-risk, already-verified fallback).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Range/bearing/CPA numbers for the preview card | A second, parallel geometry calculation hand-typed as literal strings | `classifyEncounter()` + `chartToScreen()`, called against a real fixture (this document's Code Examples section) | D-07 already locks this; hand-typing numbers with no connection to the real algorithm risks drifting from reality if the domain logic ever changes, and forfeits the "the math is genuinely computed" credibility the design brief explicitly wants |
| Anchor-scroll behavior | A `scrollIntoView()` `useEffect`/JS scroll library | Plain `<a href="#sandbox">` + CSS `scroll-behavior: smooth` | D-05 already locks this; Header.tsx already proves the plain-`<a>` pattern works for these exact same two anchors |
| Smooth-scroll respecting reduced-motion preference | A JS `matchMedia` check gating a scroll library call | `@media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } }` in CSS | Pure CSS, zero JS, compatible with D-05's "no JS scroll library" decision while still being accessibility-conscious |

**Key insight:** Every piece of "don't hand-roll" guidance here is really "don't duplicate work the domain layer or the browser already does correctly" — Hero's entire job is composition and static presentation, not new logic.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HERO-01 | Hero renders above Sandbox, matching design exactly (headline/copy/CTAs) | Copy transcribed verbatim from `Main-Design.png` in Code Examples below; `Button asChild` + plain `<a>` CTA pattern already proven by `Header.tsx` |
| HERO-02 | Illustrative preview card is static/canned, visibly decoupled from live Sandbox state | Verified fixture (Code Examples) computed via real `classifyEncounter()`/`chartToScreen()` but against a fixed, hardcoded fixture — no props from `SandboxContainer`, no shared state, no tRPC |
| HERO-03 | CTAs scroll to `#sandbox`/`#gallery` within the same page | Anchor/scroll mechanics fully resolved (Architecture Patterns, Pattern 4 area / Pitfalls below) — `id="sandbox"` placement, `scroll-behavior: smooth` sufficiency, and the "why Pitfall 6 doesn't apply here" analysis |
| HERO-04 | Responsive: single-column below 900px, scaled headline below 640px | Pattern 4 (custom 900px breakpoint) + existing `sm:` (640px) default breakpoint already used by `Header.tsx` for its own 640px collapse |
</phase_requirements>

## Common Pitfalls

### Pitfall H1: `SandboxContainer.tsx`'s root element is already a stray `<main>` — don't compound it, don't fix it either

**What goes wrong:** `SandboxContainer.tsx` currently returns `<main className="flex flex-col gap-8 p-16">...</main>` as its root JSX element. `app/layout.tsx` *also* wraps `{children}` in its own `<main>` (`<main><TRPCReactProvider>{children}</TRPCReactProvider></main>`). Since `app/page.tsx` renders `<SandboxContainer />` as that `children`, the app currently ships **two nested `<main>` elements** — invalid HTML (only one `<main>` per document is permitted). This is a pre-existing condition from Phase 4/6, not something Phase 7 introduces.

**Why it happens:** `SandboxContainer.tsx` was originally the *entire* page (`app/page.tsx` used to just render it directly with no Header/Footer chrome around it) — its own `<main>` wrapper made sense before Phase 6 added a page shell with its own `<main>`. Nobody has revisited `SandboxContainer.tsx`'s root element since.

**How to avoid:** Do **not** add `id="sandbox"` by editing `SandboxContainer.tsx` — that would mean editing a file this phase has no other reason to touch, and would still leave the nested-`<main>` issue exactly as broken as before (adding an id doesn't fix invalid nesting). Instead, add a **new wrapping element** around `<SandboxContainer />` in `app/page.tsx` and put `id="sandbox"` on that wrapper (e.g. `<div id="sandbox"><SandboxContainer /></div>` or `<section id="sandbox">...</section>`). This keeps Phase 7's diff scoped to genuinely new Hero-phase code and defers the `<main>`→`<section>` semantic fix to Phase 8, which is already restyling `SandboxContainer.tsx`'s JSX/markup wholesale (`ARCHITECTURE.md`'s own "Restructure (moderate)" verdict for that file already covers this).

**Warning signs:** A diff for this phase that touches `SandboxContainer.tsx` at all — Phase 7's scope (per REQUIREMENTS.md, HERO-01 through HERO-04) has no requirement that requires editing that file.

**Phase to address:** Hero (the wrapper-with-id decision, in `app/page.tsx` only); Sandbox/Phase 8 (the actual `<main>`→`<section>` semantic cleanup, already implied by its own restyle scope)

---

### Pitfall H2: Assuming `PITFALLS.md` Pitfall 6 (route-to-anchor scroll gaps) applies to Hero's CTAs — it doesn't, and confirming *why* matters

**What goes wrong:** It would be easy to over-apply the milestone research's Pitfall 6 (about the `/gallery` → `/#gallery` **redirect** flow) defensively to Hero's CTAs, adding unnecessary client-side `scrollIntoView()` fallback logic "just in case."

**Why it doesn't apply here:** Pitfall 6 is specifically about two failure modes: (1) a **cross-route HTTP redirect** losing the fragment, and (2) Next.js's **`<Link>`-component-specific** hash-scroll gaps during **client-side route transitions**. Hero's CTAs are same-page anchor clicks (`<a href="#sandbox">`, already proven by `Header.tsx`'s identical existing links) — there is no route change, no redirect, and (critically) **no `next/link` component involved at all** if plain `<a>` tags are used, matching `Header.tsx`'s own established pattern. A plain `<a href="#fragment">` click on an already-loaded page is 100% native browser fragment-scroll behavior — none of Next.js's router-level hash-scroll-after-navigation logic (the actual source of Pitfall 6's gaps) is in the code path at all.

**How to avoid:** Use `Button asChild` wrapping a plain `<a href="#sandbox">`/`<a href="#gallery">`, exactly matching `Header.tsx`'s existing "Source" link composition (`<Button asChild variant="outline" size="sm"><a href="...">...</a></Button>`). Do not reach for `next/link`, and do not add a defensive `scrollIntoView()` effect — D-05 already locks "no JS scroll library needed," and this analysis confirms that's the *correct* call, not just an acceptable simplification.

**Warning signs:** Any Hero CTA implementation that imports `next/link` or adds a `useEffect` touching `window.location.hash`.

**Phase to address:** Hero

---

### Pitfall H3: Registering (or skipping) the 900px breakpoint token without checking `max-*` variant generation

**What goes wrong:** If `--breakpoint-hero: 900px` is registered in `@theme` on the assumption that `max-hero:` will "just work" the same way `max-sm:`/`max-md:` do for default breakpoints, and that assumption turns out wrong for custom-named breakpoints in this Tailwind v4 version, the "single-column below 900px" layout could silently fail to apply (class generates no CSS, same failure mode as the milestone `PITFALLS.md` Pitfall 3 class of bug — a Tailwind utility that looks correct in JSX but produces zero compiled CSS).

**How to avoid:** After registering the token (or choosing to skip it in favor of arbitrary-value syntax), inspect the compiled/dev CSS output (or Tailwind's devtools class detection) to confirm `max-hero:flex-col` (or whichever utility is used) actually appears in generated output, exactly as `PITFALLS.md` Pitfall 3 already recommends doing for any new custom token. If `max-hero:` doesn't generate as expected, fall back to the already-verified `max-[899px]:` arbitrary-value syntax — zero risk, confirmed directly against official Tailwind v4 docs.

**Phase to address:** Hero (verification); Sandbox/Phase 8 if it reuses the same token for SBOX-05

## Code Examples

### Verified fixture — reproduces the design mock's displayed numbers

Computed by running the *literal* formulas transcribed from `bearing.ts`/`relative-bearing.ts`/`cpa.ts`/`classify-encounter.ts` (not hand arithmetic) against candidate vessel values, iterating `speedB` until `dcpaNm` converged on the design's 1.18 NM:

```typescript
// src/components/hero/hero-preview-fixture.ts
// Verified [computed via a standalone script replicating bearing.ts/
// relative-bearing.ts/cpa.ts/classify-encounter.ts's exact formulas —
// not hand-derived]: reproduces the design mock's displayed RANGE
// 2.99 NM / BEARING 061° / CPA 1.18 NM / Rule 15 "Crossing — Vessel A
// gives way" essentially exactly (CPA rounds from 1.1805 -> "1.18 NM").
import type { Vessel } from "../../domain/vessel/vessel.js";

export const heroPreviewVesselA: Vessel = {
  position: { x: 0, y: 0 },
  heading: 0,
  speed: 12,
  type: "power-driven",
};

export const heroPreviewVesselB: Vessel = {
  position: { x: 2.6151, y: 1.4496 }, // bearing 061.0deg, range 2.99nm from A
  heading: 280,
  speed: 8.3,
  type: "power-driven",
};

// Resulting classifyEncounter(heroPreviewVesselA, heroPreviewVesselB) output:
//   encounterType: "crossing"
//   giveWay: "vesselA", standOn: "vesselB"
//   doubt: false  (both |bearing - 112.5| and head-on checks clear the 5deg band)
//   trail includes a "Rule 15" entry (Crossing dispatch stage)
// Resulting readouts (computed, not hardcoded):
//   range (Math.hypot):        2.99 NM  (exact)
//   bearing (bearing() fn):    61.0 deg -> "061deg"
//   cpa (cpa().dcpaNm):        1.1805 NM -> "1.18 NM"
// Note: cpa().tcpaMinutes is ~12.3 (positive) but dcpaNm (1.18) is OVER
// the Rule 7 1.0nm risk threshold, so classifyEncounter()'s own
// `riskOfCollision` field evaluates false for this fixture. This does NOT
// block the Rule 15/crossing/give-way verdict (Rule 7's gate only affects
// hysteresis, not encounterType dispatch — see classify-encounter.ts Stage
// 1 vs Stage 3-5) and the design mock never displays the riskOfCollision
// boolean directly, so this is a non-issue for HERO-02's acceptance
// criteria. Flagged here only so a future reader isn't confused if they
// inspect the full ClassificationResult and see riskOfCollision: false.
```

```typescript
// src/components/hero/Hero.tsx (skeleton — plain Server Component, no "use client")
import { classifyEncounter } from "../../domain/colregs/classify-encounter.js";
import { chartToScreen } from "../../domain/geometry/screen-convert.js";
import { heroPreviewVesselA, heroPreviewVesselB } from "./hero-preview-fixture.js";

const HERO_CONTAINER_SIZE = { width: 280, height: 280 };
const HERO_VIEW_BOX = { minX: -1, minY: -1, width: 5, height: 5 }; // frames both vessels + ring

export function Hero() {
  const result = classifyEncounter(heroPreviewVesselA, heroPreviewVesselB);
  if (!result.ok) {
    // Fixture is fixed/known-good at authoring time -- same reasoning
    // SandboxContainer.tsx's own lazy-initializer comment uses for its
    // seed fixture. A real failure here means the fixture itself is
    // broken, not a runtime/user-input concern.
    throw new Error("Hero preview fixture failed to classify -- fixture is broken");
  }
  const classification = result.value;

  const screenA = chartToScreen(heroPreviewVesselA.position, HERO_CONTAINER_SIZE, HERO_VIEW_BOX);
  const screenB = chartToScreen(heroPreviewVesselB.position, HERO_CONTAINER_SIZE, HERO_VIEW_BOX);

  // ... headline/copy/CTA markup, then the hand-built <svg> using
  // screenA/screenB (own <polygon> triangles, own <circle> range ring,
  // own dashed <line> bearing indicator, own tick marks -- no import
  // from ChartPanel.tsx, per Pattern 3 / D-03).
}
```

### CTA pattern — matches `Header.tsx`'s existing composition exactly

```tsx
import { Button } from "@/components/ui/button";

<Button asChild size="lg">
  <a href="#sandbox">Open the sandbox →</a>
</Button>
<Button asChild variant="outline" size="lg">
  <a href="#gallery">Classic encounters</a>
</Button>
```

### Responsive breakpoint usage (Pattern 4)

```tsx
// If --breakpoint-hero: 900px is registered in app/globals.css's @theme block:
<div className="flex flex-col max-hero:flex-col hero:flex-row gap-8">

// Zero-risk fallback (works today, no @theme change needed):
<div className="flex flex-col min-[900px]:flex-row gap-8">
```

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `Badge` variant list (`default`/`secondary`/`destructive`/`outline`/`ghost`) matches this project's installed `radix-nova` style exactly | Standard Stack | Low — even if the exact variant set differs slightly, `Badge` composes with `className` regardless; worst case is a minor visual-only adjustment at implementation time |
| A2 | `max-hero:` auto-generates for a custom-named `--breakpoint-*` token the same way it does for default breakpoints | Architecture Patterns, Pattern 4 / Pitfall H3 | Medium — if wrong, the "single-column below 900px" layout could silently produce no CSS for that utility (Pitfall 3-class failure); mitigated by the explicit verification step in Pitfall H3 and the zero-risk `max-[899px]:` fallback already provided |
| A3 | Checkmark icon name (`CircleCheck`/`BadgeCheck` or similar) exists in the installed `lucide-react@1.25.0` | Standard Stack | Low — `Header.tsx` already established the precedent of verifying icon names against the installed version before committing to one; trivially swappable if the assumed name doesn't exist |

## Open Questions

1. **Exact pixel dimensions of the preview card's mini chart on the actual rendered page**
   - What we know: the design mock shows it at a specific size within a ~360px-wide card column on desktop
   - What's unclear: the precise `HERO_CONTAINER_SIZE`/`viewBox` framing that best matches the mock's visual proportions (ring size relative to vessel triangles, tick spacing)
   - Recommendation: treat the `HERO_CONTAINER_SIZE = { width: 280, height: 280 }` / `HERO_VIEW_BOX` values in the Code Examples section as a starting point, tune visually against `Main-Design.png` during implementation — this is a visual-fit detail, not a correctness question, and doesn't block planning

2. **Whether `--breakpoint-hero` should be registered in Phase 7 or deferred to arbitrary-value syntax throughout**
   - What we know: both approaches are Tailwind v4-native and verified working
   - What's unclear: whether Phase 8 (Sandbox) planning will actually reuse the same named token, or independently reach for its own arbitrary-value classes
   - Recommendation: register the token in Phase 7 (first phase to need 900px) per Pattern 4's reasoning, but this is a low-stakes DRY call either way — not a blocker

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.10 + `@testing-library/react` 16.3.2 + `@testing-library/user-event` 14.6.1 (already installed) |
| Config file | `vitest.config.ts` (global `environment: "node"`, per-file `// @vitest-environment jsdom` opt-in — established project convention) |
| Quick run command | `npx vitest run src/components/hero` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HERO-02 | Fixture keeps producing Rule 15/crossing/vesselA-gives-way and the claimed readout numbers | unit (plain Vitest, no RTL/jsdom needed) | `npx vitest run src/components/hero/hero-preview-fixture.test.ts` | ❌ Wave 0 |
| HERO-01 | Headline text and both CTAs render | RTL | `npx vitest run src/components/hero/Hero.test.tsx` | ❌ Wave 0 |
| HERO-03 | CTA `href` attributes are exactly `#sandbox`/`#gallery` | RTL | (same file as above) `getByRole('link', {name: /open the sandbox/i})` → `toHaveAttribute('href', '#sandbox')` | ❌ Wave 0 |
| HERO-04 | Responsive breakpoint behavior (single-column below 900px, scaled headline below 640px) | manual-only | N/A — jsdom has no real layout engine; CSS media-query rendering isn't meaningfully assertable (same limitation this project's own `PITFALLS.md` documents for hit-testing/visual correctness) | N/A |

**Not worth testing (follows the established `Header.tsx`/`Footer.tsx` precedent — zero test files for purely static/presentational chrome, confirmed by direct repo inspection):**
- Visual/pixel fidelity of the SVG mini-chart illustration (triangle shapes, ring radius, tick placement) — needs manual browser verification against `Main-Design.png`, matching the "Looks Done But Isn't" manual-UAT precedent this milestone already establishes for other phases.
- Exact responsive layout at the 900px/640px breakpoints — manual browser check (resize window / devtools responsive mode), not an automated assertion.

### Sampling Rate
- **Per task commit:** `npx vitest run src/components/hero`
- **Per wave merge:** `npx vitest run` (full suite)
- **Phase gate:** Full suite green + manual visual/responsive check against `Main-Design.png` before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/hero/hero-preview-fixture.test.ts` — covers HERO-02 (fixture-drift guard)
- [ ] `src/components/hero/Hero.test.tsx` — covers HERO-01, HERO-03 (`// @vitest-environment jsdom` pragma required, matching every other component test in this repo)
- No new test framework/fixture infrastructure needed — Hero.tsx is a plain synchronous function component, renderable directly by RTL's `render()` with no async-Server-Component test-harness complications

## Security Domain

Not applicable — `security_enforcement` is not referenced in `.planning/config.json` for this project, and this phase introduces zero new authentication, session, access-control, input-validation, or cryptography surface. Hero is 100% static, non-interactive, server-rendered marketing content with no user input of any kind.

## Sources

### Primary (HIGH confidence)
- Direct repository reads (ground truth): `src/domain/colregs/classify-encounter.ts`, `classify-encounter.fixtures.ts`, `types.ts`; `src/domain/geometry/bearing.ts`, `relative-bearing.ts`, `cpa.ts`, `screen-convert.ts`; `src/domain/vessel/vessel.ts`; `src/components/sandbox/ChartPanel.tsx`, `vessel-role.ts`, `SandboxContainer.tsx`; `src/components/layout/Header.tsx`, `Footer.tsx` (and absence of `Header.test.tsx`/`Footer.test.tsx`); `src/components/shared/README.md`; `app/page.tsx`, `app/layout.tsx`, `app/globals.css`; `components.json`; `package.json`; `vitest.config.ts`
- Numeric verification script (this session): replicated the literal `bearing()`/`relativeBearing()`/`cpa()` formulas from source in a standalone Node script and iterated `speedB` to find the fixture reproducing the design mock's exact RANGE/BEARING/CPA numbers — outputs recorded in this document's Code Examples section
- `Main-Design.png` — direct image read, transcribed Hero copy/layout verbatim
- Context7 `/websites/ui_shadcn` — Card composition (`CardHeader`/`CardContent`/`CardFooter`), Badge variant API
- Context7 `/websites/tailwindcss` — `--breakpoint-*` theme-variable-to-variant relationship, arbitrary-value `min-[]`/`max-[]` breakpoint syntax, default-breakpoint `max-*` variant generation

### Secondary (MEDIUM confidence)
- `max-*` variant auto-generation for **custom-named** (non-default) `--breakpoint-*` tokens — inferred from Tailwind v4's general theme-variable/variant documentation, not explicitly demonstrated with a custom name in the fetched docs; flagged as Assumption A2 with an explicit verification step (Pitfall H3) and a zero-risk fallback

### Tertiary (LOW confidence)
- None — every claim in this document is either directly verified against repo source, computed via a literal formula replication, or backed by official Tailwind/shadcn documentation

## Metadata

**Confidence breakdown:**
- Fixture math (Question 1): HIGH — computed via literal formula replication of the actual source files, cross-checked stage-by-stage (bearing, relative bearing, overtaking/head-on gates, CPA) against `classify-encounter.ts`'s real dispatch logic
- SVG construction approach (Question 2): HIGH — grounded directly in `screen-convert.ts`'s own "zero DOM dependency" documentation and the already-locked D-03/Pitfall 1 constraint
- Anchor/scroll mechanics (Question 3): HIGH — grounded in direct inspection of `Header.tsx`'s already-shipped, working `<a href="#...">` pattern and `globals.css`'s already-present `scroll-padding-top`
- shadcn primitives (Question 4): HIGH — verified against actual installed `src/components/ui/` contents and Context7's live Badge/Card API docs
- Testing approach (Question 5): HIGH — directly grounded in the observed, real Header/Footer precedent (no test files) plus this project's own established per-file jsdom-pragma convention

**Research date:** 2026-07-18
**Valid until:** Effectively indefinite for the fixture math/architecture patterns (pure repo-internal facts); ~30 days for the Tailwind v4 `max-*`-custom-breakpoint claim (Assumption A2) if Tailwind ships a minor release before implementation

---
*Research for: Phase 7 (Hero), COLREGS Navigator v1.1 UI Redesign milestone*
*Researched: 2026-07-18*
