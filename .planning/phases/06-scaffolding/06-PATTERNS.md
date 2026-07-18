# Phase 6: Scaffolding - Pattern Map

**Mapped:** 2026-07-18
**Files analyzed:** 11 (created or modified)
**Analogs found:** 6 / 11 (partial or config-continuation matches only — see note below)

**Important framing:** Phase 6 is a genuinely greenfield scaffolding job layered onto a v1.0 codebase that has **zero** existing design-system machinery (`app/globals.css` is one line, no `Header`/`Footer`/`layout/` or `ui/` directories exist, no `@/*` alias exists). Unlike a typical feature phase, there is no pre-existing "sibling" component to copy a Header/Footer pattern from — the closest things this repo has are (a) the *existing config files this phase edits in place* (`tsconfig.json`, `package.json`, `app/layout.tsx`, `app/globals.css` — read below for their current shape so edits are additive, not replacements) and (b) a couple of *partial-match* UI fragments (`SandboxContainer.tsx`'s inline header row, `CopyLinkButton.tsx`'s button styling, `app/gallery/page.tsx`'s card/link styling) that show this repo's pre-shadcn Tailwind conventions — conventions this phase is explicitly superseding with shadcn primitives + the new dark token palette, not extending. Where no real analog exists, RESEARCH.md's own vetted Code Examples (Context7-sourced, HIGH confidence) are the primary pattern source and are cited as such below.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `components.json` | config | N/A (CLI-generated) | none (net-new file) | no-analog — CLI output, not hand-authored |
| `app/globals.css` | config | transform (token definitions → compiled CSS) | `app/globals.css` (current 1-line file, being extended) | continuation — same file, currently trivial |
| `tsconfig.json` | config | N/A | `tsconfig.json` (current file, being extended) | continuation — additive alias only |
| `package.json` | config | N/A | `package.json` (current file, CLI-managed) | continuation — CLI writes deps automatically |
| `app/layout.tsx` | provider/layout | request-response (SSR shell wrapping every route) | `app/layout.tsx` (current file, being extended) | continuation — same file, adding fonts/Header/Footer/dark class |
| `src/components/ui/button.tsx` | component (primitive) | request-response | none (shadcn CLI registry output) | no-analog — never hand-write, `npx shadcn add button` generates it |
| `src/components/ui/separator.tsx` (optional) | component (primitive) | request-response | none (shadcn CLI registry output) | no-analog — only add if markup genuinely needs it (see Discretion note) |
| `src/lib/utils.ts` | utility | transform (`cn()` classname merge) | none (shadcn CLI-generated boilerplate) | no-analog — standard shadcn output, never hand-roll (see RESEARCH.md "Don't Hand-Roll") |
| `src/components/layout/Header.tsx` | component (layout/chrome) | request-response (static server-rendered markup) | `src/components/sandbox/SandboxContainer.tsx` lines 144-173 (header row) + `src/components/sandbox/CopyLinkButton.tsx` (button/icon affordance) | partial — internal precedent for header-row layout shape and button styling conventions, but pre-shadcn/pre-dark-theme; RESEARCH.md Pattern 3 is the primary source |
| `src/components/layout/Footer.tsx` | component (layout/chrome) | request-response (static server-rendered markup) | none in codebase | no-analog — no footer exists anywhere; use RESEARCH.md's design/copy contract directly |
| `src/components/shared/` (placeholder dir, SCAF-06) | N/A (structural) | N/A | `src/components/sandbox/` (sibling directory, shows this repo's flat feature-folder convention) | role-match (organizational only) |

## Pattern Assignments

### `app/layout.tsx` (provider/layout, request-response)

**Analog:** itself — current file, to be extended (not replaced)

**Current full content** (`app/layout.tsx` lines 1-22):
```tsx
import "./globals.css";

import type { Metadata } from "next";

import { TRPCReactProvider } from "../src/lib/trpc/client.js";

export const metadata: Metadata = {
  title: "COLREGS Navigator",
  description: "Maritime collision-avoidance rules engine and visualizer.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-slate-50 min-h-screen">
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
```

**What must change, concretely:**
- `<html lang="en">` → `<html lang="en" className={\`dark ${geistSans.variable} ${geistMono.variable}\`}>` (hardcoded `dark`, no toggle — Pitfall 2)
- `<body className="bg-slate-50 min-h-screen">` → replace the light-mode `bg-slate-50` hardcode with `bg-background text-foreground antialiased` (token-driven, matches RESEARCH.md's Code Examples section)
- Existing relative, `.js`-suffixed import convention (`"../src/lib/trpc/client.js"`) must be preserved for this existing import — do NOT convert it to a `@/*` alias retroactively (ARCHITECTURE.md Pattern 1: alias is scoped to shadcn-adjacent code only)
- Add `<Header />`/`<Footer />` wrapping `<TRPCReactProvider>{children}</TRPCReactProvider>` inside `<body>`, importing from the new `@/components/layout/Header` / `@/components/layout/Footer` (these ARE shadcn-adjacent new code, alias is appropriate here)
- Add Geist/Geist Mono font loading — copy verbatim from RESEARCH.md's Code Examples section (Context7-verified `create-next-app` pattern):
```tsx
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
```
- **Pitfall 1 (RESEARCH.md):** before adding this font code, `git diff app/layout.tsx` immediately after `shadcn init` — the `nova` preset may have already partially wired this. Only add if absent/incomplete.

---

### `app/globals.css` (config, transform)

**Analog:** itself — current file (trivial, no conflict)

**Current full content** (`app/globals.css` line 1):
```css
@import "tailwindcss";
```

**Target pattern** — copy verbatim from RESEARCH.md Pattern 2 (Context7-verified Tailwind v4 `@theme`/`@custom-variant` semantics), using this project's own locked hex values from UI-SPEC.md's Color table (`#09090B` background, `#FAFAFA` foreground, `#2dd4bf` accent, `#18181B`/`#27272A` zinc surfaces/borders):
```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css"; /* or whatever import shadcn init actually writes — diff-check */

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  /* map every token UI-SPEC.md's Color/Typography tables declare */
}

:root {
  --background: #09090B;
  --foreground: #FAFAFA;
  --accent: #2dd4bf;
  /* zinc-900 (#18181B) / zinc-800 (#27272A) secondary surfaces/borders */
}
.dark {
  /* identical to :root — defense-in-depth per Pitfall 2, RESEARCH.md */
}
```
Also add `scroll-padding-top: 64px;` on the scroll container (D-06) — this is new, project-specific, not part of the standard shadcn scaffold; add it explicitly (e.g. on `html` or the root scroll container rule).

**Pitfall 7 (RESEARCH.md/UI-SPEC.md):** commit the clean baseline before running `shadcn init`; diff-review this file afterward to confirm no custom breakpoints were clobbered (none currently exist, so this is a "confirm still none unexpected" check, not a conflict-resolution one).

---

### `tsconfig.json` (config)

**Analog:** itself — current file (lines 1-60, read in full)

**Current relevant block** (lines 1-4, 44-60):
```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    ...
  },
  "include": ["src", "app", "next-env.d.ts", "vitest.setup.ts", ".next/types/**/*.ts", ".next/dev/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Additive change only** — insert into `compilerOptions` (per RESEARCH.md Pattern 1 / Code Examples, Context7-verified):
```json
"baseUrl": ".",
"paths": { "@/*": ["./src/*"] }
```
Do **not** touch `moduleResolution: "bundler"`, `module: "esnext"`, or any other existing option — those have their own load-bearing comments explaining prior blocking-issue fixes (see the file's own inline comments, e.g. the `NodeNext`→`bundler` rationale at lines 5-16, and the `jsx: "react-jsx"` rationale at lines 21-27). The new `@/*` alias is a pure addition that coexists with the existing 98 relative `.js`-suffixed imports (an orthogonal mechanism — see `next.config.ts`'s `resolve.extensionAlias`, lines 26-30, which is unaffected).

---

### `src/components/layout/Header.tsx` (component, request-response)

**Analog (partial 1):** `src/components/sandbox/SandboxContainer.tsx` lines 144-173 — shows this repo's existing convention for a flex header row with a title/left-side element and right-side button group:
```tsx
<header className="flex flex-col gap-3">
  <div className="flex items-center justify-between">
    <h1 className="text-2xl font-semibold">COLREGS Navigator</h1>
    <div className="flex gap-2">
      <button type="button" onClick={...} className="bg-teal-600 text-white px-4 py-2 rounded">
        Save
      </button>
      ...
    </div>
  </div>
</header>
```
(Note: this is the pre-shadcn/pre-dark-theme `bg-teal-600`/light convention — Header must use the new `Button` primitive + token classes instead, not copy these literal Tailwind color classes.)

**Analog (partial 2):** `src/components/sandbox/CopyLinkButton.tsx` lines 21-29 — shows this repo's existing small-affordance button-with-conditional-text pattern (secondary/bordered style):
```tsx
<button
  type="button"
  onClick={handleClick}
  className="rounded border border-slate-200 px-2 py-1 text-sm text-slate-700 hover:border-teal-600"
>
  {copied ? "Copied!" : "Copy Link"}
</button>
```
(Same caveat — legacy light-theme classes; Header/Footer should use `bg-background`/`text-foreground`/`border-border` tokens per UI-SPEC.md, not `slate`/`teal-600` literals.)

**Primary source (no real analog exists) — RESEARCH.md Pattern 3**, Context7-verified Server Component shape, copy near-verbatim adjusting only the icon choice and exact copy per UI-SPEC.md:
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
          <a href="https://github.com/MarouenAbdi/colregs-navigator" target="_blank" rel="noreferrer">
            <Github className="h-4 w-4" aria-hidden="true" />
            Source
          </a>
        </Button>
      </div>
    </header>
  );
}
```

**Key deviations from this literal example that CONTEXT.md/UI-SPEC.md lock in:**
- No `"use client"` directive needed — no state/handlers, matches this repo's existing default-Server-Component convention (`app/gallery/page.tsx` is already an async Server Component with no client directive, `app/gallery/page.tsx` lines 1-4)
- `hidden ... sm:flex` on the `nav` implements D-03's "hide Sandbox/Gallery links below 640px, no hamburger" exactly — uses Tailwind's *built-in* `sm:` breakpoint, no `@theme` breakpoint token needed
- Icon choice: `Compass` per Claude's Discretion resolution in RESEARCH.md (verified to exist in current `lucide-react`); swap for `Navigation`/`LocateFixed` only if visual comparison against `Main-Design.png` says otherwise
- `rel="noreferrer"` on the external Source link is required (RESEARCH.md Security Domain — reverse-tabnabbing mitigation, the one genuine security-relevant detail this phase has)

---

### `src/components/layout/Footer.tsx` (component, request-response)

**No analog exists anywhere in this codebase** — no footer, single-row or otherwise, has been built before this phase. Build directly from UI-SPEC.md's Copywriting Contract and Color table:

```tsx
// src/components/layout/Footer.tsx — illustrative shape, not yet codebase-verified
export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex flex-col gap-4 px-6 py-4 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
        <span>COLREGS Navigator · classification maps to Rules 11-18</span>
        <span>
          Educational reference only — not a substitute for a qualified watchkeeper or
          official publications. Not for navigation.
        </span>
      </div>
    </footer>
  );
}
```
Structural precedent for "plain Server Component, no client directive, token-only classes" is the same as Header's — see Pattern 3 discussion above. Content is locked verbatim by UI-SPEC.md's Copywriting Contract table (do not paraphrase).

---

### `src/lib/utils.ts` (utility, transform) — no analog, CLI-generated

**Do not hand-write.** This is the standard shadcn `cn()` helper (`clsx` + `tailwind-merge`), generated automatically by `npx shadcn@latest init`. Every future `ui/*` component imports this exact function — RESEARCH.md's "Don't Hand-Roll" table flags reinventing it as creating "a second, subtly different merge implementation." Verify post-`init` that it lands at `src/lib/utils.ts` (not `src/lib/shadcn-utils.ts` or similar — see Pitfall 2, hybrid-layout alias detection).

---

### `src/components/ui/button.tsx` (and optional `separator.tsx`) — no analog, CLI-generated

**Do not hand-write.** Generated by `npx shadcn@latest add button` (and `add separator` only if the Header/Footer markup ends up genuinely needing a non-full-width divider — see UI-SPEC.md Registry Safety section; a plain `border-b`/`border-t` utility is the default, zero-dependency choice per RESEARCH.md's Alternatives Considered table).

## Shared Patterns

### Server Component default (no `"use client"` unless interactive)
**Source:** `app/gallery/page.tsx` lines 1-4 (existing async Server Component, no directive) — same convention `Header`/`Footer` should follow, since neither has state or event handlers.
```tsx
import Link from "next/link";
import { getCaller } from "../../src/lib/trpc/server.js";

export default async function GalleryPage() {
```
**Apply to:** `Header.tsx`, `Footer.tsx`, and `layout.tsx` itself (all remain Server Components this phase).

### Relative, `.js`-suffixed imports for pre-existing code; `@/*` alias only for new shadcn-adjacent code
**Source:** `app/layout.tsx` line 5 (`import { TRPCReactProvider } from "../src/lib/trpc/client.js";`) vs. RESEARCH.md Pattern 1's new `@/components/ui/button` style import.
**Apply to:** Every new file this phase touches — imports of *existing* domain/server/lib code stay relative+`.js`-suffixed; imports of *newly generated* `ui/*`/`lib/utils` code use the new `@/*` alias. Do not mix conventions within a single new import statement, and do not retroactively convert the ~98 existing relative imports elsewhere in the repo.

### External-link security (`rel="noreferrer"`)
**Source:** RESEARCH.md Security Domain / Known Threat Patterns table (STRIDE: Tampering — reverse tabnabbing).
**Apply to:** Header's "Source" `<a target="_blank">` — the only external link this phase introduces.

### Dark-only hardcoding, no toggle machinery
**Source:** RESEARCH.md Pattern 2 + Pitfall 2 (project-level PITFALLS.md, re-confirmed live this session).
**Apply to:** `app/layout.tsx`'s `<html className="dark ...">` and `app/globals.css`'s collapsed `:root`/`.dark` palette. Never introduce `next-themes` or a `useTheme` hook (RESEARCH.md's "Don't Hand-Roll" table explicitly flags this as out-of-scope, contradicting CONTEXT.md if built).

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `components.json` | config | N/A | Net-new, CLI-generated; no prior shadcn config existed in this repo |
| `src/components/ui/button.tsx` | component | request-response | CLI-registry-generated; never hand-authored |
| `src/components/ui/separator.tsx` | component | request-response | CLI-registry-generated, optional; add only if markup needs it |
| `src/lib/utils.ts` | utility | transform | CLI-generated `cn()` boilerplate; standard, don't hand-roll |
| `src/components/layout/Footer.tsx` | component | request-response | No footer of any kind exists anywhere in the current codebase — build from UI-SPEC.md's Copywriting Contract directly |

For all of the above, RESEARCH.md's own Code Examples / Architecture Patterns sections (Context7-verified, HIGH confidence) are the authoritative pattern source — there is no closer internal analog to prefer over them.

## Metadata

**Analog search scope:** `app/` (root), `src/components/`, `src/lib/`, `tsconfig.json`, `next.config.ts`, `package.json`, `vitest.config.ts` — full repo, since the codebase is small (pre-shadcn, single feature area: `src/components/sandbox/`)
**Files scanned:** `app/layout.tsx`, `app/page.tsx`, `app/gallery/page.tsx`, `app/globals.css`, `tsconfig.json`, `next.config.ts`, `package.json`, `src/components/sandbox/SandboxContainer.tsx`, `src/components/sandbox/CopyLinkButton.tsx`, `src/components/sandbox/ChartPanel.test.tsx` (partial, testing conventions only), `vitest.config.ts`
**Pattern extraction date:** 2026-07-18
