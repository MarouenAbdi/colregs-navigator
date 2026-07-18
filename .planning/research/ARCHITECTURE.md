# Architecture Research

**Domain:** Next.js App Router + shadcn/ui integration into an existing DDD-lite/Clean-Architecture codebase (COLREGS Navigator v1.1 "UI Redesign (shadcn)")
**Researched:** 2026-07-18
**Confidence:** HIGH (shadcn/ui + Tailwind v4 conventions verified via Context7 `/websites/ui_shadcn`; folder/boundary recommendations grounded directly in the actual files read from this repo, not generic advice)

> Note: this file supersedes the v1.0 `ARCHITECTURE.md` (2026-07-14, domain/rules-engine focus). That research remains valid for `src/domain/`/`src/server/`, which this milestone does not touch — see PROJECT.md's "zero change to domain logic" constraint. This file covers the v1.1-specific question: where shadcn/ui primitives, shared design tokens, a new page shell, Hero, and restyled Sandbox/Gallery fit into the existing `src/components/sandbox/` + `src/domain/` structure.

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│ app/  (Next.js App Router — routes only, thin)                       │
│  layout.tsx  → Header + Footer (global chrome) + font vars + <html>  │
│  page.tsx    → Hero + SandboxContainer + GallerySection (home)       │
│  s/[shareId]/page.tsx → SandboxContainer(initialScenario) + banner   │
│  gallery/page.tsx → redirect("/#gallery")  (route removed, shim)     │
├──────────────────────────────────────────────────────────────────────┤
│ src/components/  (feature-first, presentation layer)                 │
│  ui/        ← shadcn-owned primitives (generated, vendored, edited   │
│               in place, never duplicated elsewhere)                  │
│  layout/    ← Header, Footer, page-shell composition (NEW)           │
│  shared/    ← cross-feature composed components + shared style maps  │
│               (NEW — DRY location Hero/Sandbox/Gallery all check     │
│               first before adding a new component)                   │
│  hero/      ← Hero section (NEW)                                     │
│  gallery/   ← GallerySection (NEW, replaces app/gallery/page.tsx)    │
│  sandbox/   ← ChartPanel/ControlPanel/ReasoningPanel/                │
│               SandboxContainer/CopyLinkButton (EXISTING, restyled)   │
├──────────────────────────────────────────────────────────────────────┤
│ src/lib/    ← cn() utility (NEW, shadcn convention) + trpc client     │
│               (EXISTING) — cross-cutting infra, not domain           │
├──────────────────────────────────────────────────────────────────────┤
│ src/domain/  (pure TS, zero framework imports — UNTOUCHED this       │
│               milestone: colregs/, geometry/, vessel/, shared/)      │
├──────────────────────────────────────────────────────────────────────┤
│ src/server/  (tRPC routers, Prisma repositories — UNTOUCHED)         │
└──────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `src/components/ui/*` | shadcn/ui primitives (Button, Card, Badge, Input, Select, NavigationMenu, Separator) | CLI-generated via `npx shadcn@latest add <name>`; treated as vendored/open code — edit in place if needed, never fork into a second copy |
| `src/components/layout/*` | Global page chrome: Header/Nav, Footer, optionally a `PageShell` wrapper | Composes `ui/*` primitives only; no domain imports; rendered once from `app/layout.tsx` so it's consistent across `/`, `/s/[shareId]` |
| `src/components/shared/*` | Cross-feature composed pieces (e.g. a card treatment reused by Hero's preview card and Gallery's scenario cards; shared vessel-role display/style maps) | Composes `ui/*` primitives OR is a pure style/lookup module (`.ts`, no JSX) reused by 2+ feature folders |
| `src/components/hero/*` | Hero section: headline, copy, CTAs, illustrative live-classification preview card | Calls `classifyEncounter()` from `src/domain/colregs/` directly against a fixed fixture — no tRPC, no server round-trip (it's illustrative, not the live sandbox) |
| `src/components/sandbox/*` | Interactive chart/controls/reasoning trail (existing, restyled) | Unchanged prop contracts (`types.ts`); JSX/markup restyled to shadcn primitives; logic/hooks reused verbatim |
| `src/components/gallery/*` | Embedded gallery section on the home page | Server Component, same `getCaller().gallery.list()` tRPC pattern currently in `app/gallery/page.tsx`, moved and reused |

## Recommended Project Structure

```
src/
├── components/
│   ├── ui/                       # shadcn CLI output — DO NOT hand-edit structure, only content
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   └── navigation-menu.tsx   # (add only the primitives actually used by the design)
│   ├── layout/                   # NEW
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── shared/                   # NEW — DRY home, check here before adding anything new
│   │   ├── vessel-role-styles.ts # consolidates ChartPanel's HULL_FILL_CLASS +
│   │   │                         # ReasoningPanel's ROLE_BADGE/ROLE_BADGE_TEXT (currently duplicated)
│   │   └── ScenarioCard.tsx       # (extract here ONLY once Hero's preview card and
│   │                              # Gallery's scenario card are both built and shown
│   │                              # to share a visual treatment — don't pre-abstract)
│   ├── hero/                     # NEW
│   │   ├── Hero.tsx               # markup only
│   │   └── usePreviewClassification.ts  # calls domain classifyEncounter() against a fixture
│   ├── gallery/                   # NEW
│   │   └── GallerySection.tsx     # Server Component, moved from app/gallery/page.tsx
│   └── sandbox/                   # EXISTING — see file-by-file notes below
│       ├── ChartPanel.tsx
│       ├── chart-rendering.ts     # NEW — extracted wedgePath/buildGridLines/CHART_VIEW_BOX
│       ├── ControlPanel.tsx
│       ├── ReasoningPanel.tsx
│       ├── SandboxContainer.tsx
│       ├── useSandboxState.ts     # NEW (optional) — extracted state/handlers from SandboxContainer
│       ├── CopyLinkButton.tsx
│       ├── vessel-role.ts         # EXISTING — extend, don't duplicate
│       ├── types.ts               # EXISTING — reuse as-is
│       └── hooks/
│           ├── useHullDrag.ts     # EXISTING — reuse as-is, verbatim
│           └── useRotateHandleDrag.ts  # EXISTING — reuse as-is, verbatim
├── lib/
│   ├── utils.ts                   # NEW — shadcn's cn() (clsx + tailwind-merge)
│   └── trpc/                      # EXISTING — untouched
├── domain/                        # UNTOUCHED this milestone
└── server/                        # UNTOUCHED this milestone
```

### Structure Rationale

- **`components/ui/` is placed under `src/components/`, not at repo root or under `app/`.** This matches both shadcn's own convention (a project with a `src/` directory gets `src/components/ui`) and this repo's existing pattern of putting all React components under `src/components/`. It sits as a **sibling** to `sandbox/`, `hero/`, `gallery/`, `layout/` — never nested inside a feature folder — because `ui/` is the shadcn-vendored primitive layer every feature composes, not feature-owned code.
- **`components/shared/` is new and deliberately separate from `components/ui/`.** `ui/` is "shadcn's code that you technically own but should keep close to upstream" (so future `npx shadcn add`/diffing stays clean); `shared/` is "this project's own cross-feature composition," which is exactly the DRY location the milestone constraint requires ("shared components, types, and design tokens live in ONE shared location... check the shared location first"). Conflating the two would make future shadcn re-syncs risky and blur ownership.
- **Design tokens live in exactly one file: `app/globals.css`.** This is already the only global stylesheet in the repo (currently just `@import "tailwindcss";`). Tailwind v4 is CSS-first — there is no `tailwind.config.ts` in this project (confirmed: none exists) and none should be added; all theme customization (colors, radius, fonts) happens via `@theme inline` + `:root` CSS custom properties directly in this file, per shadcn's own Tailwind v4 theming docs. Do not create a second CSS file or a `tailwind.config.js` — that would violate the "one shared location" rule on day one.
- **`src/lib/` (already exists) gets the new `utils.ts`, not a new top-level folder.** shadcn's default alias config expects `lib/utils`; this repo already has `src/lib/trpc/` as its "cross-cutting, non-domain, non-server infra" home, so `src/lib/utils.ts` (the `cn()` helper) is a natural, DRY-respecting fit — no new top-level directory needed.
- **`sandbox/` keeps its current internal shape** (`hooks/`, `types.ts`, `vessel-role.ts` as its own pure-logic module) because it already implements the presentation/logic separation the milestone now mandates project-wide — it's the reference pattern to extend to `hero/` and `gallery/`, not to replace.

## Architectural Patterns

### Pattern 1: shadcn primitives via a new `@/*` path alias, scoped narrowly

**What:** shadcn's CLI and its generated components assume a `@/components/ui/...`-style alias. This codebase currently has **no `paths` alias at all** — every import (~98 across 37 files) is a relative, `.js`-suffixed specifier (`../../domain/vessel/vessel.js`), a convention this project locked in Phase 1 and later had to patch `next.config.ts`'s webpack `resolve.extensionAlias` for (see PROJECT.md Key Decisions). Introducing shadcn requires adding:
```json
// tsconfig.json compilerOptions — additive only
"baseUrl": ".",
"paths": { "@/*": ["./src/*"] }
```
This is purely additive under `moduleResolution: "bundler"` (already set) — it does not require touching any of the 98 existing relative imports, and shadcn-generated files use **bare, non-`.js`-suffixed** imports (`import { cn } from "@/lib/utils"`), so they never touch the webpack `extensionAlias` remap at all (that remap only intercepts specifiers literally ending in `.js`). The two import conventions coexist without conflict.

**When to use:** Use the `@/*` alias only for consuming `components/ui/*` and `lib/utils` (i.e., anything shadcn-generated or shadcn-adjacent). Do **not** retroactively convert the existing hand-written relative-import codebase — that's an unrelated, large, risk-adding mechanical change this milestone doesn't need (mirrors the project's own prior "smaller blast radius" precedent for the webpack fix).

**Trade-offs:** Two coexisting import styles in one repo is a minor inconsistency, but converting 98 existing imports has no functional benefit and real regression risk; isolating the new convention to genuinely new (shadcn) code is the lower-risk choice.

### Pattern 2: Dark-only theming without a `.dark` class or `next-themes`

**What:** shadcn's default template pairs CSS-variable tokens with a `.dark` class selector (toggled by `next-themes`) so components can reference semantic classes like `bg-primary`/`text-primary-foreground` (verified via Context7: shadcn's own recommended theming pattern is CSS-variable-driven semantic classes, not literal `dark:` Tailwind variants baked into component source). Since this project's locked decision is **dark-mode only, no toggle, no light palette**, the `.dark`/`next-themes` machinery is pure unneeded complexity: define the palette **once**, directly in `:root`, and skip the `.dark` class and `next-themes` dependency entirely.

```css
@import "tailwindcss";

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  /* ...only the tokens the design file actually uses... */
}

:root {
  --background: oklch(...); /* #09090B from the design file */
  --primary: oklch(...);    /* #2dd4bf teal accent */
  /* single palette, no .dark block needed */
}
```

**When to use:** Any project that is genuinely single-theme forever (this one, per the locked decision). Do not install `next-themes` or scaffold a `.dark` class — there is nothing to toggle, and adding the machinery would be dead code contradicting the project's own "justify every dependency" persona.

**Trade-offs:** If a future milestone ever wants a light theme, this needs to be un-simplified (add `.dark` class + `next-themes`) — acceptable since that's explicitly Out of Scope for v1.1.

### Pattern 3: One shared style/lookup map instead of two parallel ones (fixing an existing DRY gap)

**What:** `ChartPanel.tsx` currently defines `HULL_FILL_CLASS: Record<VesselRole, string>` and `ROLE_BADGE_TEXT: Record<VesselRole, string>`; `ReasoningPanel.tsx` independently defines its own `ROLE_BADGE: Record<..., {text, className}>` and `VESSEL_LABEL_TEXT`. These describe the same three concepts (role → display text, role → color/class) in two places that must be kept in sync by hand — exactly the duplication the milestone's DRY constraint targets. The existing `src/components/sandbox/vessel-role.ts` (already the single shared source for role *derivation*, per its own header comment) is the correct place to **extend** with role → text and role → Tailwind-class maps, consumed by both `ChartPanel` and `ReasoningPanel`.

**When to use:** Whenever a lookup table (color, label, icon) is duplicated — or nearly duplicated — across 2+ sibling components describing the same domain concept (here: `VesselRole`). Extend the file that already owns that concept's derivation, don't create a third parallel map.

**Trade-offs:** None meaningful — this is a pure consolidation with no behavior change, straightforward to do while restyling ChartPanel/ReasoningPanel in the Sandbox phase.

## Data Flow

### Request Flow (unchanged by this milestone)

```
[User drags vessel] → ChartPanel (SVG pointer handlers, hooks/useHullDrag)
    ↓
SandboxContainer.applyVesselUpdate() → VesselSchema.safeParse → classifyEncounter() (src/domain)
    ↓                                                              ↓
setVesselA/B, setLastGoodClassification            ClassificationResult
    ↓
re-render: ChartPanel (roles/colors), ControlPanel (form), ReasoningPanel (trail)
```
This entire flow is presentation-layer restyling only — no change to `SandboxContainer`'s state-owner logic, `classifyEncounter`, or the tRPC/Prisma layers.

### New Flow: Hero's illustrative preview card

```
Hero.tsx (Server or Client Component, static)
    ↓
usePreviewClassification() (or plain module-level call, no interactivity)
    ↓
classifyEncounter(fixedVesselA, fixedVesselB)  ← same domain fn Sandbox uses, different fixture
    ↓
render verdict/badge inside a shadcn Card
```
No tRPC call — the Hero preview is illustrative/static per the design brief, so it should call the pure domain function directly, exactly like `SandboxContainer` already does for its lazy-initializer default classification (`crossingResidualBasicCase` fixture pattern already established in `src/domain/colregs/classify-encounter.fixtures.ts` — reuse that pattern for Hero's fixture rather than inventing a new one).

### New Flow: Gallery embedded on home page

```
app/page.tsx (Server Component)
    ↓
<GallerySection />  (src/components/gallery/, Server Component)
    ↓
getCaller().gallery.list()  ← same tRPC caller pattern as current app/gallery/page.tsx
    ↓
render shadcn Card grid, Link to /s/[shareId] (unchanged)
```
`app/gallery/page.tsx` shrinks to a redirect shim (`redirect("/#gallery")` from `next/navigation`), preserving any existing bookmarked `/gallery` links per the locked decision.

## Scaling Considerations

Not applicable in the traditional sense (this is a portfolio app, not a scaling concern) — the relevant "scale" axis here is **feature count**, not traffic:

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (4 feature folders: sandbox, hero, gallery, layout) | Flat `src/components/<feature>/` + `src/components/shared/` is sufficient — no need for further nesting |
| If a 5th+ feature folder emerges post-v1.1 | Re-audit `shared/` for anything now duplicated across 3+ folders; keep the same flat pattern, resist adding a generic `common/` catch-all that isn't `ui/` or `shared/` |
| If `shared/ScenarioCard.tsx`-style extraction grows past 3-4 components | Consider splitting `shared/` into `shared/cards/`, `shared/badges/`, etc. — not needed yet |

## Anti-Patterns

### Anti-Pattern 1: Hand-editing/duplicating `components/ui/*` per feature

**What people do:** Copy `ui/card.tsx` into `hero/HeroCard.tsx` and tweak it, because "the Hero card needs slightly different padding."
**Why it's wrong:** Immediately breaks the DRY constraint and makes future `npx shadcn add`/upgrades diverge unpredictably; also means two components silently drift out of visual sync.
**Do this instead:** Compose `ui/card.tsx` with different `className` props (shadcn primitives are designed to accept `className` and merge via `cn()`), or if the variation is a genuine reusable pattern (not a one-off), extract it once into `src/components/shared/`.

### Anti-Pattern 2: Re-adding `next-themes`/`.dark` toggle machinery "just in case"

**What people do:** Scaffold shadcn's default dark-mode boilerplate (ThemeProvider, `.dark` class, toggle button) reflexively because "that's what the docs show."
**Why it's wrong:** This project has a locked decision — dark-only, no toggle. Adding unused toggle machinery is dead code and directly contradicts the "justify every dependency" persona already established in CLAUDE.md/STACK.md for this project.
**Do this instead:** Single `:root` palette, no `.dark` class, no `next-themes` dependency (see Pattern 2 above).

### Anti-Pattern 3: Retrofitting the entire codebase's import style to match shadcn's alias convention

**What people do:** See the new `@/*` alias, decide "for consistency" to rewrite all 98 existing relative `.js`-suffixed imports to `@/...` aliases.
**Why it's wrong:** Large, purely-cosmetic diff across every existing file, in a milestone explicitly scoped as "zero change to domain logic or existing validated requirements" — high regression risk (this repo already had one webpack-resolution incident from an import-convention mismatch, per PROJECT.md's Key Decisions) for zero functional benefit.
**Do this instead:** New alias for new (shadcn-adjacent) code only; leave the existing convention untouched (see Pattern 1 above).

### Anti-Pattern 4: Restyling ChartPanel's `<Card>` wrapper without re-theming the SVG's own hardcoded colors

**What people do:** Wrap `ChartPanel`'s existing `<div>`/`<svg>` in a shadcn `<Card>` and call the restyle done.
**Why it's wrong:** `ChartPanel.tsx` currently hardcodes a **light-theme** chart surface directly in the SVG/JSX — `className="bg-white border border-slate-200 rounded"` on the `<svg>`, plus hex literals (`GRID_STROKE = "#E2E8F0"`, `BEARING_LINE_DEFAULT_STROKE = "#475569"`, `DOUBT_STROKE = "#F59E0B"`, `CONE_DEFAULT_STROKE = "#CBD5E1"`, stroke `"#94A3B8"`, `"#0D9488"`). Against the new dark page shell these will visually clash (a bright white chart panel on a `#09090B` page) even after the outer `<Card>` chrome is restyled — this is the single highest-risk visual regression in the Sandbox phase if missed.
**Do this instead:** Re-theme these specific constants against the new dark palette's CSS custom properties (or Tailwind's generated `bg-background`/`border-border` semantic classes) as part of the Sandbox phase restyle — not deferred, not assumed to be "just a wrapper Card" job.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| shadcn/ui CLI (`npx shadcn@latest`) | One-time `init` (Scaffolding phase) + `add <component>` per primitive needed | Verified via Context7 (`/websites/ui_shadcn`, HIGH confidence): CLI writes `components.json`, `src/components/ui/*`, `src/lib/utils.ts`, and edits `app/globals.css` in place — review its edit to `globals.css` against the "one shared token location" rule before committing |
| Google Fonts (Geist, Geist Mono) | `next/font/google` in `app/layout.tsx`, exposed as CSS vars consumed by `@theme inline` in `globals.css` | Matches PROJECT.md's "Geist fonts" scaffolding requirement; load once in `layout.tsx`, never re-imported per-feature |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `src/components/ui/*` ↔ every feature folder | One-directional import (feature → ui, never reverse) | `ui/*` must never import from `hero/`, `sandbox/`, `gallery/`, or `layout/` |
| `src/components/shared/*` ↔ `hero/`, `sandbox/`, `gallery/` | One-directional import (feature → shared) | Before adding a new component/type/map in a feature folder, check `shared/` first per the milestone's explicit DRY instruction |
| `src/components/*` ↔ `src/domain/*` | Presentation calls pure domain functions (`classifyEncounter`, fixtures) directly; domain never imports back | Existing hard rule from CLAUDE.md/STACK.md — unaffected by this milestone; Hero's preview card is the one new call site |
| `src/components/*` ↔ `src/server/*` | Only via `trpc` client (Client Components) or `getCaller()` (Server Components) — unchanged existing pattern | `GallerySection` and `app/s/[shareId]/page.tsx` already establish this; `Hero` should NOT introduce a new server round-trip for its static preview |
| `app/layout.tsx` ↔ `src/components/layout/*` | RootLayout renders `<Header />`/`<Footer />` once, wraps `{children}` | Keeps Header/Footer consistent across `/`, `/s/[shareId]`; `app/gallery/page.tsx` still inherits this chrome even though it's now just a redirect (irrelevant since it never renders) |

## Suggested Build Order (feeds roadmap phases)

1. **Scaffolding** — hard dependency for everything downstream:
   - `npx shadcn@latest init` → `components.json`, `src/components/ui/*`, `src/lib/utils.ts`
   - Add `tsconfig.json` `paths: { "@/*": ["./src/*"] }` (Pattern 1)
   - Rewrite `app/globals.css`: single dark-only `:root` palette + `@theme inline` (Pattern 2) — no `.dark` class, no `next-themes`
   - Add Geist/Geist Mono via `next/font/google` in `app/layout.tsx`
   - Build `src/components/layout/Header.tsx` + `Footer.tsx` (compose `ui/*` only), wire into `app/layout.tsx`
   - Create empty `src/components/shared/` (structural placeholder; first real content added once Hero/Sandbox reveal actual duplication)
2. **Hero** — depends on Scaffolding's primitives, tokens, and Header/Footer shell:
   - `src/components/hero/Hero.tsx` + preview-card logic calling `classifyEncounter()` against a new fixture (sibling pattern to `classify-encounter.fixtures.ts`)
   - Compose `app/page.tsx`: `<Hero />` above `<SandboxContainer />`
3. **Sandbox** — depends on Scaffolding's dark tokens (needed to re-theme ChartPanel's hardcoded light colors, Anti-Pattern 4) and `ui/*` (Button, Card, Input, Select, Badge):
   - Restyle `SandboxContainer.tsx`, `ControlPanel.tsx`, `ReasoningPanel.tsx`, `CopyLinkButton.tsx` JSX/markup only — logic/hooks/types unchanged
   - Restyle `ChartPanel.tsx`: re-theme hardcoded colors, extract `wedgePath`/`buildGridLines`/constants to co-located `chart-rendering.ts`
   - Consolidate `HULL_FILL_CLASS`/`ROLE_BADGE_TEXT`/`ROLE_BADGE`/`VESSEL_LABEL_TEXT` into extended `vessel-role.ts` (Pattern 3), update both consumers
   - Optional: extract `SandboxContainer`'s state/handlers into a co-located `useSandboxState.ts` hook so the component file is markup-only
4. **Gallery** — depends on Scaffolding (`ui/*` Card) and optionally on a shared card treatment extracted during Hero (only if Hero's preview card and Gallery's scenario cards turn out to share a visual pattern — don't pre-abstract):
   - New `src/components/gallery/GallerySection.tsx` (Server Component, moved logic from `app/gallery/page.tsx`)
   - `app/page.tsx`: append `<GallerySection id="gallery" />` below Sandbox
   - `app/gallery/page.tsx`: replace body with `redirect("/#gallery")` (verify hash-preserving redirect behavior renders/scrolls correctly — flag as a Gallery-phase verification item, MEDIUM confidence on exact browser scroll behavior through a server redirect)

## Reuse-as-is vs Restructure Summary (existing `src/components/sandbox/*`)

| File | Verdict | Why |
|------|---------|-----|
| `types.ts` | Reuse as-is | Pure prop contracts, framework-light, no styling/logic concerns |
| `vessel-role.ts` (+ test) | Extend, don't duplicate | Already the correct shared location for role derivation; add the display-text/color maps currently duplicated in ChartPanel/ReasoningPanel (Pattern 3) |
| `hooks/useHullDrag.ts`, `hooks/useRotateHandleDrag.ts` (+ tests) | Reuse as-is, verbatim | Pure interaction logic, emits no JSX/classNames — exactly the target end-state for "logic" concern already |
| `SandboxContainer.tsx` | Restructure (moderate) | Logic (`applyVesselUpdate`, state) reuse as-is; JSX/markup (raw `<button>`, `<header>`, layout divs) restyled to shadcn primitives; optional extraction of state into a co-located hook to fully satisfy the milestone's logic/presentation split |
| `ChartPanel.tsx` | Restructure (heaviest) | Keep SVG approach; must re-theme hardcoded light-mode colors (Anti-Pattern 4), extract rendering-math constants/functions to a co-located module, consolidate role/color maps into `vessel-role.ts` |
| `ControlPanel.tsx` | Restructure (moderate) | Swap raw `<input>`/`<select>` for shadcn `<Input>`/`<Select>`; existing `VESSEL_TYPE_LABELS` map and options-loop logic reuse as-is |
| `ReasoningPanel.tsx` | Restructure (moderate) | Dedupe role/label maps into `vessel-role.ts`; wrap trail entries in shadcn primitives; all locked copywriting strings reuse verbatim, do not touch |
| `CopyLinkButton.tsx` | Restructure (trivial) | Swap raw `<button>` for shadcn `<Button variant="outline" size="sm">`; clipboard logic unchanged |
| `*.test.tsx` files | Reuse test intent as-is | Tests already query via `data-testid`/role, not raw className strings — a shadcn primitive swap should not break existing assertions, but re-run full suite after each file's restyle |

## Sources

- Context7 `/websites/ui_shadcn` (HIGH reputation) — `components.json` aliases/custom path structure, Tailwind v4 `@theme inline` + CSS-variable theming pattern, confirmation that shadcn primitives use semantic classes (`bg-primary`) rather than literal `dark:` variants baked into component source
- Direct repository reads (HIGH confidence, primary source): `SandboxContainer.tsx`, `ChartPanel.tsx`, `ControlPanel.tsx`, `ReasoningPanel.tsx`, `CopyLinkButton.tsx`, `vessel-role.ts`, `types.ts`, `useHullDrag.ts`, `app/layout.tsx`, `app/page.tsx`, `app/gallery/page.tsx`, `app/s/[shareId]/page.tsx`, `app/globals.css`, `tsconfig.json`, `next.config.ts`, `package.json`
- `.planning/PROJECT.md` — locked v1.1 decisions (Hero Direction A, dark-mode-only/no-toggle, `/gallery` → `/#gallery` redirect, shadcn as primitive layer) and prior architecture-relevant incidents (webpack `extensionAlias`, Rule 13/18 precedence) used to ground the "smaller blast radius" and "no premature toggle machinery" recommendations

---
*Architecture research for: Next.js + shadcn/ui integration into an existing DDD-lite Next.js/tRPC/Prisma codebase*
*Researched: 2026-07-18*
