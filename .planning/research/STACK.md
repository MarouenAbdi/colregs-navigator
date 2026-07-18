# Stack Research: shadcn/ui Adoption (v1.1 UI Redesign)

**Domain:** Adopting shadcn/ui + dark-only theme + Geist fonts into an existing Next.js 16 / React 19 / Tailwind v4 app
**Researched:** 2026-07-18
**Confidence:** HIGH (all core claims verified via Context7 `/shadcn-ui/ui` official docs + live npm registry lookups; a few CLI-behavior details flagged MEDIUM where they can only be confirmed by actually running the CLI)

This is a **delta** stack document — it only covers what's being *added* for the v1.1 redesign. Next.js 16.2.10, React 19.2.7, TypeScript 7.0.2, Tailwind CSS 4.3.3, tRPC 11.18.0, Prisma 7.8.0, Zod 4.4.3, Vitest 4.1.10 stay exactly as they are; see the root `CLAUDE.md` for that locked stack. The prior `STACK.md` (v1.0, dated 2026-07-14, covering the SVG/geometry/domain-layer decisions) is superseded by this file for v1.1 planning purposes — those v1.0 decisions are unaffected by this redesign and remain valid, just no longer the active research document.

## Recommended Stack

### Core Additions

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `shadcn` (CLI + runtime CSS) | **4.13.1** (latest, stable — NOT canary) | Component scaffolding CLI; also ships a runtime `shadcn/tailwind.css` import consumed by generated components | As of this research date shadcn's Tailwind v4 + React 19 support has been stable/default for months (the "canary" era ended with the v4 GA). `npx shadcn@latest init` auto-detects Next.js App Router + Tailwind v4 from `next.config.*`/`app/` and needs no special flags for framework detection. |
| `radix-ui` (unified package) | **1.6.2** | Underlying accessible primitives (Select, Slider, Tabs, Dialog/Sheet, etc.) for the components you `add` | **Explicit choice — deviates from the CLI's current default.** See "The Base UI vs Radix decision" below. |
| `class-variance-authority` | **0.7.1** | Variant/size class composition inside every generated component (`buttonVariants`, `badgeVariants`, etc.) | Installed automatically as a runtime dependency by `shadcn init`; this is how shadcn expresses "give-way" vs "stand-on" badge color variants, button sizes, etc. without a CSS-in-JS library. |
| `clsx` + `tailwind-merge` | **2.1.1** / **3.6.0** | Power the generated `cn()` helper in `src/lib/utils.ts` | Standard shadcn `cn()` = `twMerge(clsx(inputs))`. Needed by literally every generated component file. |
| `lucide-react` | **1.25.0** | Icon set used by all shadcn component defaults (chevrons in Select, close icon in Sheet/Dialog, etc.) | Default icon library for both `base` and `radix` presets; already assumed by every registry component's `.tsx` source, so treat as non-optional once you `add` more than a couple of components. |
| `tw-animate-css` | **1.4.0** | CSS-only enter/exit animation utilities (`animate-in`, `fade-out-0`, etc.) used by Select/Tabs/Sheet transitions | Replaces the old `tailwindcss-animate` **v3** Tailwind plugin. In Tailwind v4 there is no `tailwind.config.js` plugins array, so this ships as a pure `@import "tw-animate-css";` CSS import instead — installed as a `devDependency` by `shadcn init` automatically. |

### Fonts — no new dependency needed

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `next/font/google` (built into `next`) | ships with Next.js 16.2.10 (already installed) | Load Geist Sans + Geist Mono | Next.js's own `create-next-app` template imports `Geist` and `Geist_Mono` directly from `next/font/google` (confirmed via Context7 `/vercel/next.js` official docs) — self-hosted at build time, zero runtime network request to Google, and zero extra npm package. **Do not** add the standalone `geist` npm package (v1.7.2 exists on npm) or manual `<link>` tags — both are redundant given `next/font/google` already ships Geist natively. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `npx shadcn@latest init` | One-time scaffolding: writes `components.json`, patches `app/globals.css`, adds `src/lib/utils.ts`, installs the runtime deps above | Run in Phase 1 (Scaffolding). Does **not** touch `next.config.ts`, does **not** care whether you run webpack or Turbopack — it only writes source files and edits `package.json`/CSS, so it is fully orthogonal to the project's `--webpack` requirement (see Version Compatibility below). |
| `npx shadcn@latest add <component>` | Adds one component + its transitive registry deps as vendored `.tsx` source under `src/components/ui/` | Re-run per phase as new components are needed (Select/Slider in Sandbox phase, Tabs/Card/Badge wherever the mockup calls for them). |

## Installation

```bash
# Phase 1 (Scaffolding) — one-time init, explicit base + template flags for a
# reproducible, non-interactive setup:
npx shadcn@latest init --template next --base radix --preset nova

# Then pull the components this redesign actually needs (can be split across phases):
npx shadcn@latest add button card badge tabs select slider separator sheet label input
```

`init` will itself add `radix-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react` to `dependencies` and `shadcn`, `tw-animate-css` to `devDependencies` in `package.json` — no manual `npm install` step is required beyond running the CLI.

## The Base UI vs Radix decision

This is the single most important — and most likely to be missed — finding of this research: **shadcn/ui's CLI default primitive library changed from Radix UI to Base UI (`@base-ui/react`) as of the "July 2026 - Base UI as the Default" changelog.** Running a bare `npx shadcn@latest init` today (or `--defaults`) gives you `--preset base-nova`, which pulls in `@base-ui/react` (v1.6.0), **not** `radix-ui`. This is a genuine, very recent (this month) change that most existing tutorials, blog posts, and Stack Overflow answers do not reflect yet.

**Recommendation: pass `--base radix` explicitly and don't take the new default.**

Rationale:
- **Maturity/predictability over novelty.** Radix UI primitives have years of production usage, exhaustive a11y test coverage, and an enormous body of community "how do I customize X" answers. Base UI (co-authored by the former MUI/Base UI team) became shadcn's default only this month — it's the direction shadcn is clearly heading, but for a portfolio project where you (and interviewers) may need to debug an unfamiliar primitive under time pressure, the deeply-documented option is the safer bet.
- **Both are confirmed compatible with your exact React 19.2.7.** Verified via live npm registry: `radix-ui@1.6.2` peer-deps declare `"react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"`; `@base-ui/react@1.6.0` declares `"react": "^17 || ^18 || ^19"`. Neither requires `--legacy-peer-deps` or `--force` on install — shadcn's own `react-19.mdx` doc warning about peer-dep conflicts is now stale for both current packages (verify this stays true at actual install time, since it's a live registry state, not a permanent guarantee).
- **Unified package, not the old fragmented `@radix-ui/react-select` + `@radix-ui/react-slider` + ... imports.** As of the shadcn "Unified Radix UI Package" changelog (Feb 2026), Radix-based components generated by the `new-york`/`radix-*` styles now import everything from a single `radix-ui` package — so choosing Radix today does **not** mean a sprawling dependency list like older shadcn setups; `package.json` gets exactly one `radix-ui` entry.
- **No `Select`/`Slider` API surface risk.** The `base` vs `radix` split has a real, documented API difference (e.g. Base UI's `Select` requires an `items` prop; Radix's `Select` is inline-JSX-only) — per shadcn's own `skills/shadcn/rules/base-vs-radix.md`. Given this project needs `Select` (vessel type) and `Slider` (speed) specifically, picking one base up front and sticking with it avoids having to rewrite those two components' internals mid-milestone if a `shadcn add` run ever silently mixes bases.

If a future contributor re-runs `init` without `--base radix`, they will silently get Base UI instead — worth a one-line comment in `components.json` or the phase-1 PR description.

## Tailwind v4 setup — confirm before writing custom tokens

Tailwind v4 changed shadcn's whole theming model vs v3. Concretely, for this project:

1. **No `tailwind.config.js` file, and `components.json`'s `tailwind.config` field is left as `""`.** Confirmed current behavior — Tailwind v4 is configured entirely through CSS (`@import`, `@theme`, `@custom-variant`), matching what's already in this repo's `postcss.config.mjs` (`@tailwindcss/postcss` plugin, no config file). Nothing to change here — the existing setup is already v4-idiomatic.
2. `app/globals.css` (currently just `@import "tailwindcss";`) will be rewritten by `init` to something like:
   ```css
   @import "tailwindcss";
   @import "tw-animate-css";
   @import "shadcn/tailwind.css";

   @custom-variant dark (&:is(.dark *));

   @theme inline {
     --color-background: var(--background);
     --color-foreground: var(--foreground);
     /* ...card/popover/primary/secondary/muted/accent/destructive/border/input/ring/chart/sidebar... */
     --radius-sm: calc(var(--radius) * 0.6);
     --radius-md: calc(var(--radius) * 0.8);
     --radius-lg: var(--radius);
     /* ... */
   }

   :root { /* light palette, oklch(...) by default */ }
   .dark { /* dark palette, oklch(...) by default */ }

   @layer base {
     * { @apply border-border outline-ring/50; }
     body { @apply bg-background text-foreground; }
   }
   ```
   The `@import "shadcn/tailwind.css"` line is new (added within the last few months) — it's how the `shadcn` npm package (installed as a `devDependency`) now ships shared base utilities instead of inlining everything into your `globals.css`. Confirm this import resolves correctly in your Tailwind v4 PostCSS pipeline the first time you build after `init` — it's a bare-specifier CSS `@import`, which Tailwind v4's own resolver (not classic `postcss-import`) handles, and should Just Work given `@tailwindcss/postcss` is already your plugin, but it's new enough to be worth a sanity build immediately after `init`.
3. **Colors don't have to be OKLCH.** The default template uses `oklch(...)` because that's shadcn's own default palette, not a Tailwind v4 requirement — CSS custom properties accept any valid color syntax. For this milestone, put the mockup's literal hex values directly into the palette block (`--background: #09090B;`, `--accent: #2dd4bf;` /* teal */, etc.) rather than converting to OKLCH — simpler, and avoids any transcription error converting hex→OKLCH by hand.

## Dark-only theme — don't add `next-themes`

The mockup defines exactly one palette (dark) with no toggle. The idiomatic shadcn-recommended way to add a light/dark switcher is `next-themes` (`ThemeProvider attribute="class" defaultTheme="system" enableSystem`) — **skip it entirely.**

Recommended pattern instead:
- Keep the generated `.dark { ... }` CSS block (rename its values to the mockup's actual colors) as the **only** palette that matters, and hardcode `<html lang="en" className="dark">` in `app/layout.tsx` — permanently, no state, no provider.
- Do **not** delete the `.dark` class/`@custom-variant dark` machinery even though there's no toggle: several shadcn component internals bake in literal `dark:` prefixed Tailwind utility overrides (e.g. `dark:bg-input/30` in Button, `dark:border-input` etc.) that only fire when a `.dark` ancestor class exists. Deleting the class instead of just always applying it would silently drop those refinements.
- This avoids a runtime dependency (`next-themes` 0.4.6 is not needed anywhere) and matches CLAUDE.md's existing "dark-mode only, no light theme/toggle" locked decision.

## Component mapping to this milestone's actual UI needs

| Design pattern (from PROJECT.md phases) | shadcn component(s) | Notes |
|---|---|---|
| Header / top nav | **no dedicated shadcn "header" component exists** — compose from `Button` (ghost/link variants) + plain `<nav>`/`<a>` markup; add `Sheet` only if the mockup's mobile breakpoint (900px/640px per PROJECT.md) collapses nav into a slide-out drawer | Verify against the actual mockup in Phase 1 whether mobile nav is a drawer (→ needs `Sheet`) or a simple stacked/hidden menu (→ no extra component) |
| Buttons (CTAs, controls) | `Button` | Core dependency for almost every other component; add first |
| Vessel type picker | `Select` | This is the component most exposed to the Base-vs-Radix API difference noted above — Radix's `Select` composes as inline JSX children; confirm this matches how the mockup's dropdown is expected to behave (single-select, no multi-select needed) |
| Speed control | `Slider` | Radix's `Slider` supports a controlled `value`/`onValueChange` array — fits a single-thumb speed control directly |
| Hero preview / reasoning-trail containers | `Card` | Also likely useful for the Sandbox phase's reasoning-trail panel and Gallery phase's preset-scenario tiles |
| Give-way/stand-on role indicators, vessel-type tags | `Badge` | Matches the existing Phase-4 "color + role badges" pattern referenced in PROJECT.md's Validated requirements — this is a restyle, not new UX |
| Tabbed content (if the mockup groups controls/panels) | `Tabs` | Only add if the mockup actually shows tabs — don't add speculatively |
| Position/heading numeric fields (Sandbox phase, inferred) | `Input`, `Label` | Not explicitly named in the question but near-certain given "position, heading, speed, vessel type" are all user-set values (PROJECT.md) — confirm against the mockup in Phase 3 (Sandbox) before adding |
| Visual separation in Header/Footer or Card internals | `Separator` | Small, no-dependency-risk addition; add opportunistically rather than up front |

### What NOT to add (yet)

| Component/library | Why not | Add it if... |
|---|---|---|
| `Sidebar` (+ `SidebarProvider`/`SidebarInset`/etc.) | This is a dashboard-drawer-navigation pattern (persistent left rail, collapsible sections) — the app is a single-page marketing-style site (Hero → Sandbox → Gallery on one route) per PROJECT.md's phase list, not a multi-page app-shell | The app ever grows a genuine multi-page admin-style nav |
| `Dialog`/`AlertDialog` | Not mentioned in the mockup's described patterns; the existing "save & share" flow (Phase 5, v1.0) doesn't obviously need a modal, and PITFALLS territory (focus trapping, portal z-index vs the SVG chart's own stacking context) isn't worth taking on speculatively | The mockup actually shows a modal confirmation for save/share, or delete-scenario confirmation is added later |
| `next-themes` | Dark-only, no toggle — see above | A light theme or user-togglable theme is ever added (`v1.2+`, not currently planned) |
| `geist` (standalone npm package) | Redundant — `next/font/google`'s built-in `Geist`/`Geist_Mono` already self-hosts identically, at zero extra dependency cost | You need Geist outside a Next.js project (this package exists specifically for non-Next projects) |
| `sonner` (toast) | Not named in the mockup patterns given; the existing share-link UX (v1.0) has no described toast requirement | The redesign's Hero/Sandbox actually shows a toast for "link copied" or similar — verify against the mockup, don't assume |
| `Sidebar`'s implicit `Sheet`/`Tooltip` transitive adds | Only pull `Sheet` directly if the mockup's mobile header genuinely needs a drawer | Confirmed via mockup in Phase 1 |

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|---|---|---|
| `--base radix` | `--base base` (Base UI, the new CLI default) | Starting a brand-new project today with no legacy pattern-matching concerns, or specifically wanting to track shadcn's own forward direction; also has a smaller/cleaner component API in places (e.g. exposed `buttonVariants` without `asChild`/Slot indirection) |
| `next/font/google` (`Geist`, `Geist_Mono`) | `geist` npm package + `next/font/local` | Non-Next.js rendering paths, or if you need Geist's variable-font axis controls beyond what `next/font/google`'s wrapper exposes (unlikely for this project) |
| Hardcoded `<html className="dark">` | `next-themes` with `ThemeProvider` | A theme toggle becomes an actual product requirement |
| `--preset nova` | `--preset lyra` or a bespoke/no-preset init | The mockup's visual language (spacing density, radius scale) more closely matches a different named preset — worth a quick visual comparison during Phase 1, though since the mockup's colors/spacing/breakpoints are being followed exactly and will override most preset defaults anyway, this choice mostly only affects default component internals (padding scale, icon library) rather than final appearance |

## What NOT to Use

| Avoid | Why | Use Instead |
|---|---|---|
| Bare `npx shadcn@latest init` / `init --defaults` | Silently pulls the new `--preset base-nova` default (`@base-ui/react`), not Radix — a very recent (this month) CLI default change that most existing docs/tutorials/answers still assume is Radix | `npx shadcn@latest init --template next --base radix --preset nova` (explicit flags) |
| `tailwindcss-animate` (the v3-era Tailwind plugin) | No `tailwind.config.js`/plugins array exists in Tailwind v4 — this package's plugin API doesn't apply | `tw-animate-css` (pure CSS `@import`, installed automatically by `shadcn init`) |
| `next-themes` | Adds a runtime theme-switching dependency and provider tree for a fixed, dark-only design with no toggle requirement | Hardcoded `<html className="dark">` in `app/layout.tsx` |
| Standalone `geist` npm package or manual `<link>` Google Fonts tags | `next/font/google` already self-hosts Geist/Geist Mono natively at build time — either alternative is a redundant dependency or a slower, non-self-hosted network fetch | `import { Geist, Geist_Mono } from "next/font/google"` |
| Individual `@radix-ui/react-select`, `@radix-ui/react-slider`, etc. package installs | Superseded by the unified `radix-ui` package (Feb 2026 shadcn change) — installing the old fragmented packages manually would fight what the current CLI/registry actually generates | Let `shadcn init --base radix` install the single `radix-ui` package; don't hand-install fragmented Radix packages |

## Version Compatibility

| Package A | Compatible With | Notes |
|---|---|---|
| `shadcn@4.13.1` init | `next@16.2.10` + `--webpack` dev/build scripts | The CLI only writes/edits source files (`components.json`, `globals.css`, `src/components/ui/*`, `src/lib/utils.ts`) and edits `package.json` — it never inspects or depends on which bundler `next dev`/`next build` uses. **Verified no known incompatibility with the project's webpack-only `resolve.extensionAlias` requirement** — that config only remaps `.js`→`.ts`/`.tsx` extension resolution for hand-authored relative imports; it has zero interaction with shadcn's generated `@/`-alias, extensionless imports (see next row). |
| shadcn-generated imports (`@/lib/utils`, `@/components/ui/button`) | Project's `tsconfig.json` (currently has **no** `@/*` path alias) | **Action needed in Phase 1:** add `"baseUrl": ".", "paths": { "@/*": ["./src/*"] }` to `tsconfig.json`'s `compilerOptions`. This is purely additive — it does not touch or conflict with the existing `.js`-suffix relative-import convention (that's an *extension-resolution* concern handled by webpack's `extensionAlias`; `@/*` is a *path-prefix* alias, an orthogonal mechanism). Recommended boundary: shadcn-generated files under `src/components/ui/` keep their default `@/`-prefixed, no-`.js`-suffix internal imports unmodified (so future `shadcn add`/diff/update commands stay clean against upstream); hand-authored app code consuming those components keeps using the project's existing relative `.js`-suffixed convention when importing them, e.g. `import { Button } from "../../components/ui/button.js"`. |
| `radix-ui@1.6.2` | `react@19.2.7` | Peer dep `"react": "^16.8 \|\| ^17.0 \|\| ^18.0 \|\| ^19.0 \|\| ^19.0.0-rc"` — confirmed via live npm registry lookup, satisfies 19.2.7 natively, no `--legacy-peer-deps`/`--force` needed. |
| `@base-ui/react@1.6.0` (if `--base base` chosen instead) | `react@19.2.7` | Peer dep `"react": "^17 \|\| ^18 \|\| ^19"` — also natively compatible, for reference if the Base UI alternative is revisited later. |
| `tailwindcss@4.3.3` (already installed) | `shadcn@4.13.1`'s CSS-first templates | Matches exactly — no Tailwind version bump needed for this milestone. |
| `typescript@7.0.2` (tsgo) | shadcn CLI's codegen (`ts-morph`-based file edits) | The CLI edits/writes plain `.tsx`/`.ts`/`.json` source files; it does not invoke the TypeScript compiler API directly against your project, so it's unaffected by the `tsgo`/`ignoreBuildErrors` situation documented in `next.config.ts`. Your existing `npx tsc --noEmit` gate remains the authoritative type-check step after any `shadcn add`. |

## Sources

- Context7 `/shadcn-ui/ui` (HIGH reputation, 3700+ snippets) — CLI `init`/`add` command definitions, `components.json` schema, Tailwind v4 CSS templates, React 19 peer-dep guidance, Base UI vs Radix changelog entries ("December 2025 - npx shadcn create", "January 2026 - Base UI Documentation", "July 2026 - Base UI as the Default", "February 2026 - Unified Radix UI Package"), `base-nova`/`radix-nova` registry.json dependency declarations, preset defaults (`packages/shadcn/src/preset/defaults.ts`)
- Context7 `/vercel/next.js` (HIGH reputation, official docs) — `next/font/google` Geist/Geist_Mono import pattern from `create-next-app`'s own template and `01-app/01-getting-started/13-fonts.mdx`
- npm registry live lookups (HIGH confidence, current at research date, not training data): `shadcn` (4.13.1 latest / 4.2.0-canary.0 / 4.10.0-rc), `radix-ui` (1.6.2), `@base-ui/react` (1.6.0), `class-variance-authority` (0.7.1), `clsx` (2.1.1), `tailwind-merge` (3.6.0), `lucide-react` (1.25.0), `tw-animate-css` (1.4.0), `geist` (1.7.2), `next-themes` (0.4.6), `next` (16.2.10 latest), peer-dependency fields for `radix-ui` and `@base-ui/react`
- WebFetch `https://ui.shadcn.com/docs/tailwind-v4` — corroborated the `@theme inline`/OKLCH/no-`tailwind.config.js` current setup (MEDIUM-HIGH — WebFetch summary, cross-checked against the same claims independently confirmed via Context7's raw doc snippets above)
- Repo inspection (this codebase, HIGH confidence — direct file reads): `package.json`, `next.config.ts`, `app/globals.css`, `app/layout.tsx`, `postcss.config.mjs`, `tsconfig.json` — used to ground every "no change needed here" / "action needed here" claim against the actual current state rather than a generic starter

---
*Stack research for: shadcn/ui adoption into existing Next.js 16 + React 19 + Tailwind v4 app (v1.1 UI Redesign milestone)*
*Researched: 2026-07-18*
