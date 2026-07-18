# Phase 6: Scaffolding - Research

**Researched:** 2026-07-18
**Domain:** shadcn/ui CLI adoption + Tailwind v4 dark-only theming + Geist fonts + Next.js 16 App Router page shell, retrofitted onto an existing v1.0 Next.js codebase
**Confidence:** HIGH (CLI flags/defaults, font-loading pattern, and components.json alias mechanics re-verified live against Context7 `/shadcn-ui/ui` and `/vercel/next.js` this session; package legitimacy re-verified live via slopcheck + npm registry this session)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**shadcn component install scope**
- **D-01:** Install only the shadcn primitives Scaffolding itself needs to build Header/Footer (e.g. `button`, `separator` — exact list finalized during planning based on the design's actual Header/Footer markup). Do NOT front-load card/badge/select/slider/tabs/input/sheet now — Hero, Sandbox, and Gallery each run their own `npx shadcn add <component>` when they build those sections.
- **D-02:** Because the mobile nav decision (D-03) removes the need for a slide-out drawer, `sheet` is NOT needed by this phase — confirm during planning that no drawer/overlay primitive is pulled in for the Header.

**Mobile header collapse (640px breakpoint)**
- **D-03:** Below the 640px breakpoint, the Header shows **only the Logo and the "Source" button**. The "Sandbox" and "Gallery" in-page anchor nav links are hidden entirely — no hamburger menu, no drawer, no icon-only fallback. This satisfies SCAF-04's "collapsing nav links at 640px" requirement with a Tailwind responsive-hide utility on the two anchor links, not a new interactive component.

**Source link & branding**
- **D-04:** The Header's external "Source" link points to `https://github.com/MarouenAbdi/colregs-navigator` (not the `portfolio-project` repo the current git remote resolves to).
- **D-05:** No existing icon/favicon/logo asset exists in the repo (`public/` is empty — confirmed this session). Build the logo mark (small icon + "COLREGS Navigator" wordmark + "Rules 11-18" chip) to visually match `.planning/design/Main-Design.png`'s header using a `lucide-react` icon, not a new/external asset.

**Sticky-header scroll offset**
- **D-06:** Scaffolding sets `scroll-padding-top` (sized to the sticky Header's actual rendered height, 64px per UI-SPEC) on the scroll container as part of building the Header in this phase — not deferred to Phase 7/9.

### Claude's Discretion
- Exact shadcn component names pulled for the Header/Footer build (beyond confirming `sheet` is excluded) — resolve during planning by inspecting what the Header/Footer markup actually composes. **Research finding: `button` is required (Source link styling); `separator` is optional — a plain `border-b`/`border-t` Tailwind utility on the Header/Footer container satisfies the hairline-divider requirement without a dedicated component; only add `separator` if planning genuinely needs a non-full-width or differently-styled divider.**
- Exact `lucide-react` icon chosen for the logo mark — match the design image's glyph as closely as the available icon set allows. **Research finding: the header glyph in `Main-Design.png` is a small circular/target-style mark to the left of "COLREGS Navigator"; verified candidates that exist in the current `lucide-react` registry (confirmed via WebSearch against lucide.dev, not just training knowledge): `Compass` (tags: direction, north, safari), `Navigation` (tags: location, travel), `LocateFixed` (tags: map, gps, cross). `Compass` is the closest semantic and visual match for a maritime/navigation app's brand mark — recommend it as the default choice, final call deferred to visual comparison during implementation.**

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within Phase 6's scope. (The pending "embed gallery on home page" todo is explicitly Phase 9's concern, already tracked in STATE.md/PROJECT.md; not re-raised here.)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SCAF-01 | shadcn/ui installed and configured (CLI init, `@/*` path alias, `components/ui/`), compatible with webpack-only Next.js 16 build | CLI flags verified live via Context7 this session (`--template next --base radix --preset nova`); confirmed CLI is bundler-agnostic (only writes source files/edits `package.json`+CSS); confirmed default base flips to Base UI (`base`) without the explicit flag — see "Critical CLI Finding" below |
| SCAF-02 | Dark-only design-token theme (`#09090B`, zinc scale, `#2dd4bf` accent) defined once in `app/globals.css` via `@theme`, no light variant/`next-themes`/`.dark`-toggle machinery | Pattern verified via project ARCHITECTURE.md Pattern 2 + PITFALLS.md Pitfall 2/3/4; confirmed current `app/globals.css` has zero existing theme content to conflict with (just `@import "tailwindcss";`) |
| SCAF-03 | Geist and Geist Mono fonts loaded via `next/font/google`, applied app-wide | Exact current import pattern re-verified live via Context7 `/vercel/next.js` this session (see Code Examples); **new finding**: shadcn's `nova` preset config already declares `font: "geist"` — verify after `init` whether this already wired the import before treating it as a separate task (see Common Pitfalls) |
| SCAF-04 | Sticky Header/Nav (logo, Sandbox/Gallery anchors, Source link) collapsing nav links at 640px | **New finding: 640px is Tailwind's built-in default `sm:` breakpoint** — no custom `@theme` breakpoint token is needed for this requirement; confirmed no custom breakpoint currently exists in `app/globals.css` to conflict |
| SCAF-05 | Header/Main/Footer page shell in `app/layout.tsx`, Footer matching design | Confirmed current `app/layout.tsx` has no Header/Footer, single `<html>`/`<body>` wrapper — this is a pure addition, not a conflicting rewrite |
| SCAF-06 | Shared cross-feature components/types/tokens in `src/components/shared/` | Confirmed via project ARCHITECTURE.md Pattern 3; confirmed `src/components/shared/` does not yet exist (only `src/components/sandbox/` exists today) |

</phase_requirements>

## Summary

This phase retrofits shadcn/ui onto an existing, working Next.js 16.2.10 / React 19.2.7 / Tailwind CSS 4.3.3 app that currently has **no** design-system machinery at all: `app/globals.css` is a single `@import "tailwindcss";` line, `app/layout.tsx` has no Header/Footer and a hardcoded `bg-slate-50` light body class, and `tsconfig.json` has no `@/*` path alias. This is a greenfield scaffolding job layered onto a live codebase, not a migration of existing design tokens — there is nothing to "undo" except the one hardcoded light-mode class in `layout.tsx`.

The single highest-leverage fact from this session's live re-verification: **shadcn's CLI `init` command's own code (`packages/shadcn/src/commands/init.ts`, confirmed via Context7 this session) sets `options.base = options.base || "base"`** — meaning any invocation without an explicit `--base radix` flag (including `--defaults`) silently installs Base UI (`@base-ui/react`), not Radix. The CONTEXT.md/UI-SPEC.md-mandated exact command (`npx shadcn@latest init --template next --base radix --preset nova`) is correct and must be used verbatim — this is now doubly confirmed (project-level STACK.md research + this session's live Context7 re-check of the actual CLI source).

A second load-bearing finding: this repo's file layout is a **hybrid** shadcn has to be told about explicitly — `app/` (routes) lives at the repo root, while `components`/`lib` live under `src/`. shadcn's `components.json` aliases (`components`, `ui`, `lib`, `hooks`, `utils`) are independent of where `app/` lives (confirmed via Context7: aliases only govern where the CLI writes/imports component-adjacent code, not the router), but the CLI's interactive init prompts (or its auto-detection heuristics) may default to assuming an all-`src/` or all-root layout. The plan must explicitly pass/confirm `aliases.components: "@/components"` → `./src/components`, and the `tailwind.css` path pointing at `app/globals.css` (not `src/app/globals.css` or `src/styles/globals.css`), rather than accepting whatever the CLI auto-detects.

**Primary recommendation:** Run `npx shadcn@latest init --template next --base radix --preset nova` from repo root after committing a clean baseline (Pitfall 7), immediately diff `components.json`/`app/globals.css`/`tsconfig.json`/`package.json` before proceeding, hand-verify the alias block matches this repo's actual `app/`-at-root + `src/components`+`src/lib` split, then hardcode `<html lang="en" className="dark">` (never install `next-themes`), collapse the theme to one dark palette using the design's literal hex values (not OKLCH), verify Geist wiring, and build `Header`/`Footer` in `src/components/layout/` composing only `Button` (+ optionally `Separator`) against Tailwind's default `sm:` (640px) breakpoint.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| shadcn/ui primitive install (`components.json`, `src/components/ui/*`) | Frontend Server (build-time codegen) | Browser (renders resulting components) | CLI writes source files consumed by Next.js's build; no runtime server logic involved |
| Dark-only design tokens (`@theme` in `globals.css`) | Frontend Server (SSR delivers the compiled CSS) | Browser (applies the computed styles) | Tailwind v4 compiles tokens at build time; no client-side theme-switching logic exists or is wanted |
| Geist/Geist Mono font loading | Frontend Server (`next/font/google` self-hosts + injects `<link>`/font-face at build/render time) | Browser (renders text with the loaded font) | Zero-network-request self-hosting happens server-side during the Next.js build; this is not a CDN/`<link>`-tag client concern |
| Header/Footer/page shell (`app/layout.tsx`) | Frontend Server (Server Component by default in App Router) | Browser (sticky positioning, scroll behavior are client-rendered CSS behaviors) | Header/Footer contain only static links/anchors — no interactivity requiring a Client Component boundary in this phase |
| Shared cross-feature components/types location (`src/components/shared/`) | Frontend Server | — | Pure code-organization concern, not a runtime-tier concern; classified here only because it's colocated with other Frontend Server-tier presentation code |

No capability in this phase touches API/Backend or Database/Storage tiers — confirmed consistent with REQUIREMENTS.md's explicit "nothing here touches `src/domain/` or `src/server/`" scope boundary.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `shadcn` (CLI, devDependency) | 4.13.1 [VERIFIED: npm registry — confirmed live this session, matches project STACK.md] | Component scaffolding CLI + registry client | Official, only tool that generates shadcn-shaped `components.json`/`src/components/ui/*` |
| `radix-ui` (unified package) | 1.6.2 [VERIFIED: npm registry — confirmed live this session] | Accessible primitives underlying every `add`-ed component | Explicit `--base radix` choice — see Critical CLI Finding below; peer-dep `^19.0` satisfies installed React 19.2.7 |
| `class-variance-authority` | 0.7.1 [VERIFIED: npm registry] | Variant/size class composition (`buttonVariants`, etc.) | Installed automatically by `shadcn init`; used by every generated component |
| `clsx` | 2.1.1 [VERIFIED: npm registry] | Powers generated `cn()` helper | Standard shadcn `cn()` = `twMerge(clsx(inputs))` |
| `tailwind-merge` | 3.6.0 [VERIFIED: npm registry] | Powers generated `cn()` helper | Same as above |
| `lucide-react` | 1.25.0 [VERIFIED: npm registry] | Icon set for all shadcn defaults + Header logo mark + Source-link Github icon | Default icon library for the `radix`/`nova` preset; confirmed exports `Compass`, `Navigation`, `LocateFixed`, `Github` (verified via WebSearch against lucide.dev this session) |
| `tw-animate-css` | 1.4.0 [VERIFIED: npm registry] | CSS-only animation utilities (devDependency) | Tailwind v4 has no plugins array; this is the CSS-import replacement for the old `tailwindcss-animate` plugin |
| `next/font/google` (built into `next@16.2.10`, already installed) | — | Load Geist Sans + Geist Mono | [CITED: Context7 `/vercel/next.js`, `01-app/01-getting-started/13-fonts.mdx` + `create-next-app`'s own template, re-verified live this session] Zero new dependency; self-hosted at build time |

### Supporting

None new for this phase beyond the Core table — `Button` is the only shadcn UI primitive strictly required for SCAF-04/05 (the Source link). `Separator` is optional (see Discretion note above).

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `--base radix` | `--base base` (Base UI, current CLI default) | Base UI is shadcn's own forward direction and slightly leaner API (no `asChild`/Slot indirection in places), but far less battle-tested/documented; project's locked decision is `radix` — do not revisit without a new discussion |
| Hardcoded `<html className="dark">` | `next-themes` + `ThemeProvider` | Only relevant if a light/toggle theme becomes an actual future requirement — explicitly Out of Scope this milestone |
| Plain `border-b`/`border-t` utility for Header/Footer hairline | shadcn `Separator` component | `Separator` adds a real, if tiny, dependency surface (a Radix primitive) for a single static divider line; a utility class is zero-dependency and visually identical for a fixed horizontal rule — prefer the utility unless the design needs a non-full-bleed or vertically-oriented divider |

**Installation:**
```bash
# Commit a clean baseline first (Pitfall 7), then:
npx shadcn@latest init --template next --base radix --preset nova

# After init + diff review, pull only what Header/Footer need:
npx shadcn@latest add button
# Add separator only if planning determines the design needs a dedicated divider primitive:
# npx shadcn@latest add separator
```

**Version verification:** All Core table versions above were re-confirmed live via `npm view <pkg> version` this session (2026-07-18) — identical to the project-level `STACK.md` findings from the same day, so no drift detected between that research and this phase's execution-time check.

## Package Legitimacy Audit

`slopcheck` was available in this environment (`/opt/homebrew/bin/slopcheck`) and was run live this session via `slopcheck scan --pkg npm <name> --json` for every package this phase installs (via the shadcn CLI's automatic dependency install). All results below are genuine `slopcheck` output, not assumed.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| `shadcn` | npm | created 2024-07-09 (~2 yrs) | very high (de facto standard shadcn CLI) | github.com/shadcn-ui/ui | OK | Approved |
| `radix-ui` | npm | created 2022-08-01 (~4 yrs, unified pkg) | very high | github.com/radix-ui/primitives | OK | Approved |
| `class-variance-authority` | npm | created 2022-01-26 (~4.5 yrs) | very high (shadcn ecosystem standard) | github.com/joe-bell/cva | OK | Approved |
| `clsx` | npm | created 2018-12-24 (~7.5 yrs) | extremely high (ubiquitous) | github.com/lukeed/clsx | OK | Approved |
| `tailwind-merge` | npm | created 2021-07-18 (~5 yrs) | very high | github.com/dcastil/tailwind-merge | OK | Approved |
| `lucide-react` | npm | created 2020-10-19 (~6 yrs) | very high | github.com/lucide-icons/lucide | OK | Approved |
| `tw-animate-css` | npm | created 2025-03-10 (~1.3 yrs) | moderate, growing (shadcn v4-era standard replacement for `tailwindcss-animate`) | github.com/Wombosvideo/tw-animate-css | OK | Approved |

**Packages removed due to slopcheck `[SLOP]` verdict:** none
**Packages flagged as suspicious `[SUS]`:** none

All packages passed both slopcheck AND were independently confirmed via Context7 official docs (`/shadcn-ui/ui`) as the actual CLI-installed dependency set — satisfying this project's `[VERIFIED]` provenance bar (Context7/official docs discovery + slopcheck pass), not merely registry-existence.

No `postinstall` script check was run for these packages — none of them are known to ship build-time native compilation or postinstall network calls (all are pure JS/TS libraries or a CLI that only writes source files); flag this as a residual, low-risk gap rather than a completed check if the planner wants full Step 4 coverage.

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ npx shadcn@latest init --template next --base radix --preset nova│
│   (one-time, Scaffolding phase only)                             │
└───────────────────────────┬───────────────────────────────────────┘
                            │ writes/edits
        ┌───────────────────┼────────────────────┬───────────────────┐
        ▼                   ▼                    ▼                   ▼
 components.json    app/globals.css       src/lib/utils.ts   package.json
 (aliases: @/components  (@theme / :root /   (cn() helper)    (+radix-ui,
  → ./src/components,     @theme inline —                      +cva, +clsx,
  @/lib → ./src/lib)       must hand-collapse                   +tailwind-merge,
                           to ONE dark palette,                  +lucide-react,
                           per D-06/Pitfall 2)                   +shadcn/tw-animate-css
                                                                  as devDeps)
        │
        ▼
 tsconfig.json — ADD "@/*": ["./src/*"]  (verify CLI did this; add manually if not)
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ app/layout.tsx (RootLayout, Server Component)                    │
│                                                                    │
│  import { Geist, Geist_Mono } from "next/font/google"            │
│  const geistSans = Geist({ variable: "--font-geist-sans", ... }) │
│  const geistMono = Geist_Mono({ variable: "--font-geist-mono" }) │
│                                                                    │
│  <html lang="en" className={`dark ${geistSans.variable}          │
│         ${geistMono.variable}`}>                                 │
│    <body>                                                         │
│      <Header />   ← src/components/layout/Header.tsx             │
│      <main>{children}</main>                                     │
│      <Footer />   ← src/components/layout/Footer.tsx             │
│    </body>                                                        │
│  </html>                                                          │
└───────────────────────────┬───────────────────────────────────────┘
                            │ every route inherits this shell
              ┌─────────────┼──────────────┐
              ▼                            ▼
        app/page.tsx                app/s/[shareId]/page.tsx
        (existing, unmodified            (existing, unmodified
         this phase)                      this phase)
```

**Data flow for the Header nav / scroll offset (SCAF-04 + D-06):**
```
User clicks "Sandbox"/"Gallery" <a href="#sandbox"> (Header, hidden below 640px per D-03)
    ↓
Browser native same-page anchor scroll (no client JS needed — plain <a href="#...">)
    ↓
scroll-padding-top: 64px (set on html/body via globals.css this phase)
    ↓
Target lands below the sticky Header, not underneath it
```

### Recommended Project Structure
```
src/
├── components/
│   ├── ui/                # NEW — shadcn CLI output (button.tsx, [separator.tsx])
│   ├── layout/             # NEW — this phase's actual deliverable
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   └── shared/             # NEW — structural placeholder this phase (SCAF-06);
│                           # first real content added once Hero/Sandbox reveal
│                           # actual cross-feature duplication — don't pre-abstract
├── lib/
│   └── utils.ts            # NEW — shadcn's cn()
```

### Pattern 1: `@/*` path alias, scoped narrowly to shadcn-adjacent code

**What:** Add `"baseUrl": ".", "paths": { "@/*": ["./src/*"] }` to `tsconfig.json`. This is additive — it coexists with the existing 98 relative, `.js`-suffixed imports (an orthogonal *extension-resolution* mechanism handled by `next.config.ts`'s webpack `extensionAlias`, not a *path-prefix* alias).
**When to use:** Only for consuming `components/ui/*` and `lib/utils` (shadcn-generated/adjacent). Do not retroactively convert existing hand-written imports.
**Example:**
```json
// tsconfig.json compilerOptions — additive only
{
  "baseUrl": ".",
  "paths": { "@/*": ["./src/*"] }
}
```
[CITED: Context7 `/shadcn-ui/ui`, `components-json.mdx` — "Using tsconfig or jsconfig paths" — re-verified live this session]

### Pattern 2: Dark-only theming without `.dark` class or `next-themes`

**What:** Collapse the generated `:root`/`.dark` dual-palette scaffold to one palette. Recommended shape (per project ARCHITECTURE.md/PITFALLS.md, unchanged by this session's re-verification): keep both `:root` and `.dark` blocks present with identical dark values (defense-in-depth against stray `dark:`-prefixed utility classes in any future copy-pasted shadcn snippet), and additionally hardcode `className="dark"` on `<html>` — never install `next-themes`.
**When to use:** This project only — locked "dark-mode only, no toggle" decision.
**Example:**
```css
/* app/globals.css, after shadcn init has written its scaffold */
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  /* ...map every token the design actually uses... */
}

:root {
  --background: #09090B; /* literal hex, not OKLCH — simpler, no transcription risk */
  --foreground: #FAFAFA;
  --accent: #2dd4bf;
  /* ...zinc-900/zinc-800 secondary surfaces/borders... */
}
.dark {
  /* identical to :root — retained for forward-compat with future `shadcn add` diffs */
}
```
```tsx
// app/layout.tsx
<html lang="en" className={`dark ${geistSans.variable} ${geistMono.variable}`}>
```
[CITED: Context7 `/websites/tailwindcss` `@theme`/`@custom-variant` semantics; project ARCHITECTURE.md Pattern 2]

### Pattern 3: Header/Footer as Server Components composing only `ui/*`

**What:** `src/components/layout/Header.tsx` and `Footer.tsx` are plain Server Components (no `"use client"` needed — no state, no event handlers, only `<a>`/`<Button>` elements and CSS-driven responsive hide/show). Compose `Button` from `ui/button.tsx` for the "Source" link; use plain `<nav>`/`<a>` for in-page anchors.
**When to use:** Any static, non-interactive chrome — matches this repo's existing pattern of Server Components by default (`app/gallery/page.tsx` is already an async Server Component).
**Example:**
```tsx
// src/components/layout/Header.tsx
import Link from "next/link";
import { Compass, Github } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-accent" aria-hidden="true" />
          <span className="text-base">
            <span className="font-semibold">COLREGS</span>{" "}
            <span className="font-normal">Navigator</span>
          </span>
          <span className="rounded-full border border-border px-2 py-0.5 text-xs">
            Rules 11-18
          </span>
        </div>
        <nav className="hidden items-center gap-6 text-sm sm:flex">
          <a href="#sandbox">Sandbox</a>
          <a href="#gallery">Gallery</a>
        </nav>
        <Button asChild variant="outline" size="sm">
          <a
            href="https://github.com/MarouenAbdi/colregs-navigator"
            target="_blank"
            rel="noreferrer"
          >
            <Github className="h-4 w-4" aria-hidden="true" />
            Source
          </a>
        </Button>
      </div>
    </header>
  );
}
```
Note: `hidden ... sm:flex` uses Tailwind's **built-in default `sm:` breakpoint (640px)** — no custom `@theme` breakpoint token is required for D-03/SCAF-04.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| `cn()` classname merging | A custom `clsx`-alike utility | shadcn-generated `src/lib/utils.ts` (`clsx` + `tailwind-merge`) | Every generated `ui/*` component imports this exact function; reinventing it creates a second, subtly different merge implementation |
| Button variant/size styling | Hand-written conditional className strings | `class-variance-authority`-powered `buttonVariants` from `ui/button.tsx` | Installed automatically by `shadcn init`; hand-rolling duplicates logic the CLI already vendors into the project |
| Dark/light theme switching | A custom `useTheme`/localStorage toggle "just in case" | Nothing — hardcode `className="dark"`, no toggle at all | Explicit locked decision (dark-only, no toggle); building even a minimal toggle is unrequested scope and directly contradicts CONTEXT.md |
| Font self-hosting/preloading | Manual `<link rel="preload">`/`@font-face` for Geist | `next/font/google`'s `Geist`/`Geist_Mono` | Already self-hosts, subsets, and preloads correctly at build time — a hand-rolled version would re-solve an already-solved problem with more code and no benefit |

**Key insight:** This entire phase is deliberately "thin" — every one of its four technical deliverables (CLI init, theme tokens, fonts, page shell) has an existing, CLI-or-framework-provided mechanism. There is no domain logic in this phase to justify any custom abstraction; the only genuine engineering judgment calls are (1) collapsing the light/dark dual-palette to one, and (2) choosing the closest-matching `lucide-react` icon.

## Common Pitfalls

### Pitfall 1: `--preset nova`'s `font: "geist"` config may partially pre-wire Geist, creating a duplicate/conflicting font-loading task
**What goes wrong:** This session's live Context7 lookup confirmed the `nova` preset (used by both `radix-nova` and `base-nova` styles) declares `font: "geist"` in its preset defaults (`packages/shadcn/src/preset/defaults.ts`). shadcn also has a `registry:font` item type specifically for wiring a Google Font's CSS variable during install. It is **not fully confirmed via docs** whether, for a Next.js template, `init` actually edits `app/layout.tsx` to add the `next/font/google` `Geist`/`Geist_Mono` imports automatically, or whether the `font: "geist"` preset value only affects `--font-sans` CSS variable *naming* inside `globals.css` (expecting the developer to still wire the actual font loader). If the plan writes a separate "add Geist via next/font/google" task without first checking what `init` already produced, the result could be either (a) a harmless no-op duplicate (safe but wasted planning), or (b) two conflicting definitions of `--font-geist-sans`/`--font-sans` if the CLI's `@theme` output and a manually-added `next/font/google` call use different CSS variable names.
**Why it happens:** shadcn's font-registry mechanism is designed to support both Next.js (self-hosted via `next/font/google`, zero extra npm dependency) and non-Next frameworks (installs an `@fontsource`-style npm package) from the same preset config — the exact behavior for the Next.js path specifically wasn't returned in a single authoritative Context7 snippet this session.
**How to avoid:** After running `init`, immediately `git diff app/layout.tsx app/globals.css` before writing any new font-loading code. If `Geist`/`Geist_Mono` imports and `--font-geist-sans`/`--font-geist-mono` variables are already present and correctly wired to `<html>`'s `className`, SCAF-03 is already satisfied by the init step — the remaining planning task is verification only (render text, confirm computed font-family in devtools is not the browser default), not new code. If absent, add the import/variable pattern from the Code Examples section below as a new, explicit task.
**Warning signs:** Two different CSS custom property names both trying to reference a Geist font-family; `next build` warning about a duplicate/unused font import.
**Phase to address:** Scaffolding (verification step, immediately after `init`)

### Pitfall 2: Hybrid `app/`-at-root + `src/components`/`src/lib` layout may not match the CLI's auto-detected or interactively-prompted alias defaults
**What goes wrong:** This repo's actual layout (`app/` at repo root, `src/components/`, `src/lib/`) is neither a pure "everything under `src/`" nor a pure "everything at root" shape — the two common shadcn starting shapes. Confirmed via Context7 this session: `components.json`'s `aliases` block is independent of where `app/` lives (it only governs `components`/`ui`/`lib`/`hooks`/`utils` import roots), so this hybrid layout is fully supported *in principle*, but the CLI's non-interactive/`--yes`-default flow (this project passes `-y`/default `true`) may still write aliases assuming a different actual folder shape than intended, or may prompt for the global CSS file path and offer a wrong default (`src/app/globals.css` or `src/styles/globals.css` instead of this repo's actual `app/globals.css`).
**Why it happens:** shadcn's detection heuristics are tuned for `create-next-app`'s two standard scaffolds (`--src-dir` or not), not for a project that already existed with a custom split before shadcn was introduced.
**How to avoid:** After running `init`, explicitly inspect the generated `components.json`'s `aliases` block and `tailwind.css` field; confirm `aliases.components` resolves to `./src/components` (via the `@/*` → `./src/*` tsconfig mapping) and `tailwind.css` points at the actual `app/globals.css` at repo root, not a path that doesn't exist in this project. Correct by hand if the CLI guessed wrong, before running any `shadcn add`.
**Warning signs:** `shadcn add button` writes `src/components/ui/button.tsx` to an unexpected path, or fails to find `globals.css` to patch.
**Phase to address:** Scaffolding (immediately after `init`, before first `shadcn add`)

### Pitfall 3–7 (carried forward from project-level research, still applicable and re-confirmed this session)
See `.planning/research/PITFALLS.md` for full detail — Pitfall 2 (half-wired light/dark toggle), Pitfall 3 (unregistered `@theme` color tokens), Pitfall 4 (`@theme` vs `@theme inline` inconsistency), Pitfall 7 (shadcn CLI overwriting existing hand-authored config). All three remain accurate; this session found no contradicting information. The **Critical CLI Finding** (default base flips to Base UI without `--base radix`) from that document is now **doubly verified**: both the project-level STACK.md research and this session's live Context7 query of `packages/shadcn/src/commands/init.ts` independently confirm `options.base = options.base || "base"`.

## Code Examples

### Geist + Geist Mono font loading (App Router root layout)
```tsx
// Source: Context7 /vercel/next.js, create-next-app's own app/ts template
// (re-verified live this session, matches training-data expectation exactly)
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${geistSans.variable} ${geistMono.variable}`}>
      <body className="bg-background text-foreground antialiased">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```
Then in `app/globals.css`, wire the CSS variables Tailwind actually generates utilities from:
```css
@theme inline {
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

### `tsconfig.json` alias addition
```json
// Source: Context7 /shadcn-ui/ui, components-json.mdx (re-verified live this session)
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| shadcn CLI defaulted to Radix UI primitives | shadcn CLI defaults to Base UI (`@base-ui/react`) unless `--base radix` is passed explicitly | "July 2026 - Base UI as the Default" changelog [CITED: Context7 `/shadcn-ui/ui`] — re-confirmed live this session against actual `init.ts` source (`options.base = options.base || "base"`) | Any tutorial, blog post, or prior training-data assumption that a bare `npx shadcn init` gives Radix is now wrong; this project's explicit `--base radix` flag is mandatory, not optional politeness |
| Fragmented `@radix-ui/react-select`, `@radix-ui/react-slider`, etc. packages | Unified `radix-ui` package (single dependency) | "February 2026 - Unified Radix UI Package" [CITED: Context7 `/shadcn-ui/ui`] | `package.json` gets one `radix-ui` entry, not a sprawling list — simpler dependency surface than older shadcn+Radix setups |
| `tailwindcss-animate` Tailwind v3 plugin | `tw-animate-css` pure CSS `@import` | Tailwind v4 GA (no plugins array in CSS-first config) | Installed automatically as a devDependency by `shadcn init`; no manual plugin registration needed |

**Deprecated/outdated:** `next-themes`-driven `.dark` toggle is shadcn's still-current *default-documented* pattern for multi-theme apps, but is explicitly not used here — this project's dark-only requirement predates and is orthogonal to any shadcn version change.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The `nova` preset's `font: "geist"` config may or may not auto-wire `next/font/google` imports into `app/layout.tsx` for a Next.js template — exact behavior not conclusively found in a single Context7 snippet this session | Common Pitfalls #1, Phase Requirements (SCAF-03) | If wrong in the optimistic direction (assumed not wired, but actually is), planner may schedule a genuinely redundant task — low cost, just wasted effort, resolved instantly by the mandated post-`init` diff check |
| A2 | `Compass` is the closest lucide-react icon match to the header glyph in `Main-Design.png` — this is a visual judgment call, not something a text-based tool can conclusively verify pixel-for-pixel | Discretion note, Pattern 3 code example | If wrong, the logo mark looks slightly off-brand from the mock; low severity (CONTEXT.md explicitly leaves this to discretion/implementation-time comparison), easily swapped for `Navigation` or `LocateFixed` (also confirmed to exist) with a one-line import change |
| A3 | shadcn's non-interactive `init` flow (this repo's hybrid `app/`-at-root + `src/` layout) will require manual correction of `components.json`'s alias/CSS-path fields rather than auto-detecting correctly | Common Pitfalls #2 | If the CLI actually auto-detects correctly (better-than-assumed outcome), the mandated diff-review step is simply a quick confirmation instead of a correction — no downside either way |

**All three assumptions above are low-risk and self-resolving via the mandatory post-`init` diff-review step already required by Pitfall 7 — none require a user decision before planning proceeds.**

## Open Questions

1. **Does `shadcn init --preset nova` actually edit `app/layout.tsx` for a Next.js target, or only `globals.css`'s CSS variable naming?**
   - What we know: the preset declares `font: "geist"`; a `registry:font` item type exists with a documented `provider: "google"` shape.
   - What's unclear: whether the Next.js-specific code path in the CLI translates that into an actual `next/font/google` import edit, versus expecting the developer to add it (with the CLI only pre-naming the CSS variable it expects).
   - Recommendation: Resolve empirically at execution time — run `init`, diff `app/layout.tsx`, and branch the plan's SCAF-03 task accordingly (verify-only vs. add-new-code). Do not block planning on this; both branches are cheap and mutually exclusive.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | `npx shadcn` CLI, `next dev`/`next build` | ✓ | v22.23.1 | — |
| npm | package install, `npx` | ✓ | 10.9.8 | — |
| `slopcheck` (package legitimacy check) | Package Legitimacy Audit | ✓ | (via `/opt/homebrew/bin/slopcheck`) | — |
| PostgreSQL | Not required for this phase's manual verification (Header/Footer/theme/fonts render without any DB call — `app/page.tsx` renders `SandboxContainer` client-side; only `/gallery`, untouched this phase, calls the DB) | N/A this phase | — | — |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none — this is a pure frontend/tooling phase with no infrastructure blockers.

## Security Domain

`security_enforcement` is not explicitly set to `false` in `.planning/config.json`, so this section is included per protocol default (absent = enabled). However, Phase 6 introduces **zero** authentication, session, data-input, or cryptography surface — it is a static component-library install + CSS token + page-shell phase with no forms, no user input, no data persistence.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | No | Not applicable — no auth surface in this phase |
| V3 Session Management | No | Not applicable |
| V4 Access Control | No | Not applicable |
| V5 Input Validation | No | The only "input" is a hardcoded external URL (`D-04`'s Source link) — no user-supplied data is accepted or rendered this phase |
| V6 Cryptography | No | Not applicable |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|----------------------|
| External link (`target="_blank"`) without `rel="noreferrer"`/`rel="noopener"` on the Source button | Tampering (reverse tabnabbing) | Include `rel="noreferrer"` on the Source `<a>` (shown in Code Examples above) — the one genuine, if minor, security-relevant detail in this phase |

## Sources

### Primary (HIGH confidence)
- Context7 `/shadcn-ui/ui` (re-queried live this session): `init` command CLI definition (`packages/shadcn/src/commands/init.ts`) confirming `--base <base>` accepts `base, radix, aria` and defaults to `base` when unspecified; `nova` preset defaults (`font: "geist"`, `iconLibrary: "lucide"`); `components.json` alias schema and derivation logic (`utils/alias.ts`); `registry:font` item shape; manual-install docs confirming `@/*` tsconfig alias requirement for Next.js
- Context7 `/vercel/next.js` (re-queried live this session): `Geist`/`Geist_Mono` import pattern from `create-next-app`'s own `app/ts/app/layout.tsx` template and `01-app/01-getting-started/13-fonts.mdx`
- npm registry live lookups this session (`npm view <pkg> version` + `time.created` + `repository.url`): `shadcn` 4.13.1, `radix-ui` 1.6.2, `class-variance-authority` 0.7.1, `clsx` 2.1.1, `tailwind-merge` 3.6.0, `lucide-react` 1.25.0, `tw-animate-css` 1.4.0 — all confirmed current, all with long-lived source repos
- `slopcheck scan --pkg npm <name> --json` live output this session — all 7 packages returned `"status": "OK"`, `"flags": []`
- Direct repo inspection this session: `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `app/gallery/page.tsx`, `package.json`, `tsconfig.json`, `next.config.ts`, `public/` (confirmed empty), `src/components/` (confirmed only `sandbox/` exists) — HIGH confidence, primary source
- WebSearch cross-checked against lucide.dev per-icon pages this session: confirmed `Compass`, `Navigation`, `LocateFixed`, `Github` all exist as current lucide-react exports with the tags described

### Secondary (MEDIUM confidence)
- `.planning/research/STACK.md`, `.planning/research/PITFALLS.md`, `.planning/research/ARCHITECTURE.md` — project-level research from the same day (2026-07-18), independently produced, cross-checked against this session's live re-verification with no contradictions found (this session's Context7 queries corroborate rather than contradict every claim reused from these documents)
- Whether `init --preset nova` fully auto-wires `next/font/google` for a Next.js target specifically (Open Question 1 / Assumption A1) — inferred from adjacent, but not perfectly on-point, Context7 snippets

### Tertiary (LOW confidence)
- None — every claim in this document is either directly tool-verified this session or explicitly flagged in the Assumptions Log/Open Questions above.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every package version and the critical `--base radix` CLI-default behavior re-verified live via Context7 + npm registry this session, not relying solely on prior-session/training knowledge
- Architecture: HIGH — grounded directly in this session's own reads of the actual current repo files (`layout.tsx`, `globals.css`, `tsconfig.json`, `package.json`), not generic shadcn advice
- Pitfalls: HIGH for carried-forward pitfalls (project-level PITFALLS.md, itself HIGH confidence and re-confirmed here); MEDIUM for the two new pitfalls surfaced this session (font pre-wiring ambiguity, hybrid-layout alias detection) — both are explicitly flagged as self-resolving via a mandatory diff-review step, not blocking

**Research date:** 2026-07-18
**Valid until:** ~14 days (shadcn CLI defaults/presets have changed multiple times within recent months per its own changelog — re-verify the `--base radix` requirement and preset behavior if execution is delayed materially past this window)
