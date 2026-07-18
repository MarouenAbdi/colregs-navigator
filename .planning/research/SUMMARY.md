# Project Research Summary

**Project:** COLREGS Navigator
**Milestone:** v1.1 — UI Redesign (shadcn/ui adoption)
**Domain:** Retrofitting a dark-only, shadcn/ui-based design system onto an existing, already-shipped Next.js 16 / React 19 / Tailwind v4 interactive-SVG portfolio app, plus relocating an existing `/gallery` route into a home-page anchor section
**Researched:** 2026-07-18
**Confidence:** HIGH

## Executive Summary

This milestone is a pure presentation-layer restyle, not a new product. The app (a domain-modeling-heavy COLREGS collision-avoidance rules engine with an interactive SVG sandbox) already shipped its v1.0 core loop and validated features; v1.1 layers shadcn/ui + Tailwind v4 dark-only theming on top, adds a net-new marketing Hero section, and relocates the existing preset Gallery from its own `/gallery` route to a `/#gallery` anchor on the home page. No domain logic, tRPC routers, or Prisma layer changes. The four phases (Scaffolding, Hero, Sandbox, Gallery) map directly onto dependency order: tooling/tokens/shell first, then the one genuinely new UI surface (Hero), then the highest-risk restyle (Sandbox), then the lowest-risk relocation (Gallery).

The recommended approach is deliberately conservative given how recent and fast-moving the shadcn ecosystem is: pin `--base radix` explicitly (shadcn's CLI silently defaulted to Base UI as of this month — most existing docs/tutorials still assume Radix), skip `next-themes`/`.dark`-toggle machinery entirely in favor of a single hardcoded dark palette (matching the locked "no toggle" decision), and add a narrowly-scoped `@/*` path alias only for shadcn-adjacent code rather than retrofitting the existing 98 relative `.js`-suffixed imports. Component responsibility stays feature-first (`ui/`, `layout/`, `shared/`, `hero/`, `gallery/`, `sandbox/`), with `shared/` as the single DRY location the milestone's own constraints require, and `src/domain/`/`src/server/` untouched.

The dominant risk across all four research files is not "does shadcn work" (it does, cleanly) — it's **silent regressions in code the restyle touches without meaning to change behavior**: (1) the Sandbox's SVG hull/rotate-handle hit-testing contract, which took two rounds of human UAT to fix in v1.0 and depends on `fill` never becoming `"none"`/transparent, a change jsdom-based tests structurally cannot detect; (2) a half-wired dark theme that silently renders light-mode by default if `<html>` never gets a hardcoded `dark` class; (3) Tailwind v4's CSS-first `@theme` model failing silently (no error) when new semantic color tokens are referenced in JSX but never registered; and (4) the Radix `Select`/`Slider` swap breaking existing `userEvent.selectOptions`-based tests in a way that looks like a DOM bug rather than an interaction-model change. All four have concrete, low-cost mitigations documented in PITFALLS.md, and all require a **manual browser verification pass**, not just a green `npm test`, before merging — this should be an explicit success criterion in the Sandbox and Scaffolding phases specifically.

## Key Findings

### Recommended Stack

The locked core stack (Next.js 16.2.10, React 19.2.7, TypeScript 7.0.2, Tailwind CSS 4.3.3, tRPC 11.18.0, Prisma 7.8.0, Zod 4.4.3, Vitest 4.1.10) is unaffected — this is purely a delta stack for the redesign.

**Core additions:**
- `shadcn` CLI 4.13.1 + `radix-ui` 1.6.2 (unified package) — component scaffolding + accessible primitives. **Must pass `--base radix` explicitly** — the CLI's bare/default init now pulls Base UI (`@base-ui/react`), a change too recent for most existing docs to reflect.
- `class-variance-authority` 0.7.1, `clsx` 2.1.1 + `tailwind-merge` 3.6.0, `lucide-react` 1.25.0, `tw-animate-css` 1.4.0 — all installed automatically by `shadcn init`; power the generated `cn()` helper, variant classes, icons, and CSS-only transitions respectively.
- `next/font/google`'s built-in `Geist`/`Geist_Mono` — no new dependency; do not add the standalone `geist` npm package.
- Explicitly **not adopted**: `next-themes` (no toggle needed — dark-only is a locked decision), `react-konva`/canvas (unaffected v1.0 decision), `geolib`/`turf.js` (unaffected v1.0 decision), `json-rules-engine`/`xstate` (unaffected v1.0 decision), individual fragmented `@radix-ui/react-*` packages (superseded by the unified `radix-ui` package).
- Action required in Phase 1: add `tsconfig.json` `paths: { "@/*": ["./src/*"] }` — purely additive, does not conflict with the existing `.js`-suffixed relative-import convention or the webpack `extensionAlias` fix.

### Expected Features

This milestone adds no new domain capability — "features" here means UX/interaction-pattern decisions for the Hero (net-new) and Gallery (relocated) phases.

**Must have (table stakes):**
- Hero: headline + plain-language subhead, primary CTA scrolling straight into the Sandbox (no signup/login gate — matches the app's no-login design), a real-product visual near the fold (the already-locked "illustrative live-classification preview card").
- Gallery: server-rendered grid of the existing 6 curated presets, reachable at a stable `/#gallery` fragment, cards still navigating to `/s/[shareId]` unchanged.
- `/gallery` → `/#gallery` permanent (308) redirect so old bookmarks resolve to something meaningful.

**Should have (differentiators, discretionary):**
- Secondary "view source" CTA in the Hero (verify against the design file first — not confirmed in scope).
- Small illustrative motion in the Hero preview card (only if it doesn't reintroduce live sandbox wiring or cause layout shift above the Gallery anchor).

**Defer (v2+):**
- Mini geometric chart thumbnail per Gallery card (requires extracting a non-interactive `ChartPanel` render mode — real cost, conflicts with the milestone's "restyle don't refactor" framing).
- Inline "load preset into the current sandbox in place" interaction as an alternative to full navigation — explicitly not needed; today's per-scenario `/s/[shareId]` pages are simpler and already validated.

**Explicit anti-features:** do NOT wire the Hero preview card to the real, stateful `SandboxContainer`; do NOT add an auto-playing carousel/video; do NOT gate the CTA behind signup; do NOT add pagination to the Gallery (exactly 6 fixed presets); do NOT client-fetch the Gallery section (breaks the anchor-scroll target's presence at first paint).

### Architecture Approach

Feature-first, presentation-layer-only restructuring on top of the existing DDD-lite boundary (`src/domain/` and `src/server/` stay completely untouched). shadcn's vendored primitives live in `src/components/ui/` as a strict leaf dependency every feature composes but never forks; a new `src/components/shared/` folder is the single DRY home for cross-feature composed pieces and lookup maps (fixing an existing duplication between `ChartPanel`'s `HULL_FILL_CLASS`/`ROLE_BADGE_TEXT` and `ReasoningPanel`'s parallel maps); new `layout/`, `hero/`, `gallery/` folders sit as siblings to the existing `sandbox/` folder, which keeps its current internal shape (hooks/types/pure-logic modules) as the reference pattern to extend, not replace.

**Major components:**
1. `src/components/layout/` (Header, Footer) — global chrome composed from `ui/*` only, rendered once from `app/layout.tsx`.
2. `src/components/hero/` — net-new Hero section; its illustrative preview card calls `classifyEncounter()` directly against a fixed fixture (no tRPC, no live wiring), mirroring the existing fixture pattern already used by `SandboxContainer`'s default state.
3. `src/components/gallery/` — `GallerySection.tsx`, a Server Component moved from `app/gallery/page.tsx`, reusing the existing `gallery.list()` tRPC caller pattern unchanged; `app/gallery/page.tsx` is replaced by a `next.config.ts` redirect (see reconciliation below) rather than left as a lingering shim page.
4. `src/components/sandbox/` (existing, heaviest restyle) — logic/hooks/types reused verbatim; JSX swapped to shadcn primitives; hardcoded light-theme SVG colors re-themed against the new dark palette; role/color lookup maps consolidated into the existing `vessel-role.ts`.

Design tokens live in exactly one file (`app/globals.css`, CSS-first Tailwind v4, no `tailwind.config.js`), and the standard shadcn `:root`/`.dark`/`@theme inline` shape should be **kept** (not simplified away) even though only one theme is ever active — collapsing it wrong risks black/white color bugs and future `npx shadcn add` diff incompatibility.

### Reconciled Point: `/gallery` → `/#gallery` mechanism

FEATURES.md and ARCHITECTURE.md/PITFALLS.md differ slightly on mechanism. **Recommendation: use a `next.config.ts` `redirects()` entry** (`{ source: "/gallery", destination: "/#gallery", permanent: true }`), not a lingering `app/gallery/page.tsx` shim that calls `redirect()` from `next/navigation`. Rationale: the config-level redirect is a single, static, HTTP-level (308) rule verified via Next.js source (`prepare-destination.ts`) to correctly parse and preserve hash fragments in the `destination` string — it's documented, supported behavior, not a workaround, and it avoids an unnecessary extra render/hop that a lingering page-based shim would add. Both research files agree the redirect must only match on the *path* (fragments never reach the server, so `has`/`missing` conditions can't key off `#gallery`), must use `permanent: true` (308, since this is a permanent structural removal), and that the Gallery section's HTML must exist in the initial server-rendered payload (async Server Component, not client-fetched) for the anchor-scroll target to be present when the browser attempts to scroll.

**Both files also agree this needs manual, non-automated verification** — Next.js's hash-scroll behavior has known gaps (native full-page-load fragment scroll after an HTTP redirect behaves differently than client-side `<Link href="/#gallery">` navigation, and Next.js's scroll targeting explicitly skips sticky/fixed elements, so a sticky header can cover the target after "successful" scroll). Concretely test: (a) a fresh tab navigating directly to the old `/gallery` URL, and (b) an in-app `<Link href="/#gallery">` click — these are different code paths and can fail independently. Add `scroll-padding-top` sized to the sticky header's height regardless of outcome.

### Critical Pitfalls

1. **Silent SVG hit-testing regression** — the hull/rotate-handle drag contract depends on `fill` never resolving to `"none"`/transparent (SVG's `pointer-events: visiblePainted` default); jsdom-based tests cannot detect this since `user-event`'s `pointer()` API dispatches events directly at the selected node rather than resolving screen-coordinate hit-testing. **Avoid by:** never setting `fill="none"` or a token that can resolve to transparent on these two elements, and requiring a mandatory manual browser drag+rotate UAT pass (matching v1.0 Phase 4's precedent) before merging the Sandbox PR — not just a green test suite.
2. **Half-wired dark theme** — shadcn's default scaffold ships both `:root` (light) and `.dark` (dark) blocks assuming a toggle; if nobody hardcodes `className="dark"` on `<html>`, the app silently renders in light mode by default. **Avoid by:** hardcoding `dark` on `<html>` in `app/layout.tsx` in the Scaffolding phase and adding "view with OS color-scheme set to light" to that phase's manual-verification checklist.
3. **Unregistered `@theme` color tokens fail silently** — Tailwind v4's CSS-first model only generates `fill-*`/`bg-*`/`text-*` utilities for colors declared under `@theme`'s `--color-*` namespace; a new semantic name (e.g. `fill-give-way`) referenced in JSX without a matching `--color-give-way` declaration produces zero CSS with no error, which (combined with Pitfall 1) can also silently break hit-testing. **Avoid by:** reusing shadcn's existing `--color-chart-1..5` tokens for vessel-role colors where possible, and verifying generated CSS in devtools rather than trusting JSX class names.
4. **Radix `Select`/`Slider` breaks existing native-control tests** — `ControlPanel.test.tsx` currently drives the vessel-type picker with `userEvent.selectOptions`, which has nothing to act on against Radix's portalled `button[role=combobox]` structure; Radix components also call jsdom-unimplemented APIs (`hasPointerCapture`, `scrollIntoView`). **Avoid by:** rewriting (not patching) the test to a click + `findByRole("option")` pattern, adding scoped per-file polyfills matching the existing `MockResizeObserver` convention, or choosing shadcn's native-`<select>`-based "Native Select" variant to sidestep the problem entirely.
5. **shadcn CLI overwrites hand-authored Tailwind v4 config** — `init`/`add` can rewrite `globals.css`/`components.json` wholesale, risking silent loss of the project's existing custom breakpoints (900px/640px). **Avoid by:** committing before running any `shadcn` CLI command and reviewing the full diff afterward, in the Scaffolding phase, before any other phase depends on the resulting CSS shape.

## Implications for Roadmap

Based on combined research, the 4-phase structure already scoped in PROJECT.md (Scaffolding → Hero → Sandbox → Gallery) is well-supported by the dependency graph found in all four research files and should be kept as-is.

### Phase 1: Scaffolding
**Rationale:** Hard dependency for every downstream phase — establishes the CLI-installed primitives, design tokens, path alias, and global page chrome (Header/Footer) that Hero, Sandbox, and Gallery all consume.
**Delivers:** `npx shadcn@latest init --template next --base radix --preset nova`; `tsconfig.json` `@/*` alias; single dark-only `:root`/`.dark`/`@theme inline` palette in `app/globals.css` (kept in the standard shadcn shape, not simplified); Geist/Geist Mono via `next/font/google`; `<html className="dark">` hardcoded (no `next-themes`); `src/components/layout/Header.tsx`+`Footer.tsx`; empty `src/components/shared/` placeholder.
**Addresses:** Foundational — no FEATURES.md item directly, but unblocks all of them.
**Avoids:** Pitfall 2 (half-wired dark theme), Pitfall 3/4 (`@theme` registration/consistency), Pitfall 7 (CLI clobbering existing config).

### Phase 2: Hero
**Rationale:** The one genuinely new UI surface; depends only on Scaffolding's primitives/tokens/shell, has no dependency on the Sandbox restyle, and is lower-risk than Sandbox — good second phase to build momentum and validate the token system end-to-end before the higher-risk restyle.
**Delivers:** `src/components/hero/Hero.tsx` (headline, subhead, primary CTA scrolling to Sandbox, illustrative canned classification preview card calling `classifyEncounter()` against a fixed fixture); composed into `app/page.tsx` above `SandboxContainer`.
**Addresses:** FEATURES.md table-stakes (headline/subhead/CTA, no-gate CTA, real-product visual preview) and the locked "illustrative, not live" anti-feature guardrail.
**Avoids:** Reintroducing a second stateful sandbox instance (Anti-Feature); layout-shift above the future Gallery anchor target (flagged cross-dependency with Phase 4).

### Phase 3: Sandbox
**Rationale:** Highest-risk, heaviest-restyle phase — depends on Scaffolding's dark tokens (needed to re-theme `ChartPanel`'s hardcoded light-mode hex colors) and `ui/*` primitives (Button, Card, Input, Select, Badge). Placed after Hero so the token system is already validated once before the riskiest surface touches it.
**Delivers:** Restyled `SandboxContainer`/`ControlPanel`/`ReasoningPanel`/`CopyLinkButton` (markup only, logic/hooks unchanged); restyled `ChartPanel` with re-themed colors and extracted rendering constants; consolidated `vessel-role.ts` color/label maps; rewritten `Select` interaction tests.
**Addresses:** No new FEATURES.md item — pure restyle of already-validated v1.0 Sandbox behavior.
**Avoids:** Pitfall 1 (hit-testing regression — requires mandatory manual browser UAT), Pitfall 5 (Radix Select/Slider test breakage), the "hardcoded hex chart colors" and "vessel label contrast" UX pitfalls.

### Phase 4: Gallery
**Rationale:** Lowest functional risk (no new interaction model, reuses existing tRPC query and click-through behavior verbatim) but has real, non-obvious routing/scroll gotchas — sequenced last since it's independent of Sandbox and benefits from the Header/nav (built in Scaffolding) already existing to link directly at `/#gallery`.
**Delivers:** `src/components/gallery/GallerySection.tsx` (Server Component, moved from `app/gallery/page.tsx`) appended to `app/page.tsx` with `id="gallery"`; `next.config.ts` `redirects()` entry (`/gallery` → `/#gallery`, `permanent: true`); `scroll-padding-top` sized to the sticky header.
**Addresses:** FEATURES.md table-stakes (Gallery embedded, server-rendered, stable linkable URL, unchanged card-click behavior).
**Avoids:** Pitfall 6 (route-to-anchor scroll/redirect gaps) — requires manual verification of both fresh-tab bookmark navigation and in-app `<Link>` click, per the reconciliation note above.

### Phase Ordering Rationale

- Scaffolding must be first — every other phase consumes its tokens, primitives, and path alias; running the CLI early also minimizes the blast radius of any config restructuring (Pitfall 7).
- Hero before Sandbox: Hero is net-new and lower-risk, letting the team validate the token/theming system on a smaller surface before applying it to the SVG-heavy, hit-testing-sensitive Sandbox.
- Sandbox before Gallery: Sandbox's dark-token re-theming work has no dependency on Gallery, but sequencing it before Gallery matches its higher risk profile getting resolved before the final, lower-risk phase.
- Gallery last: depends on Scaffolding's `ui/*` Card primitive and (optionally, not by default) a shared card treatment extracted during Hero — don't pre-abstract that dependency; only extract into `shared/` if Hero and Gallery cards are shown to actually share a visual pattern.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (Gallery):** the `/gallery` → `/#gallery` redirect + anchor-scroll behavior has genuine, documented Next.js App Router gaps (sticky-header skip, client-nav vs. full-reload scroll differences) that cannot be fully resolved by reading docs alone — flag for manual browser verification as an explicit phase success criterion, and consider `/gsd:plan-phase --research-phase 4` if the manual test reveals unreliable native scroll behavior requiring a client-side fallback effect.
- **Phase 3 (Sandbox):** while shadcn/Radix patterns are well-documented in general, this phase's actual risk (silent hit-testing regression, jsdom's structural inability to catch it) is specific to this codebase's prior incident, not a generic shadcn concern — worth explicit phase-level "manual UAT required" framing rather than additional library research.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Scaffolding):** shadcn CLI init/add, Tailwind v4 `@theme` theming, and Geist font loading are all officially documented, HIGH-confidence, verified-via-Context7 patterns with no domain-specific ambiguity.
- **Phase 2 (Hero):** composing shadcn primitives + calling an existing pure domain function against a new fixture is a well-established, low-risk pattern already used elsewhere in this codebase.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified via Context7 `/shadcn-ui/ui` official docs plus live npm registry lookups for every version cited; only the Base-UI-vs-Radix CLI default change and `@testing-library/user-event` exact version are flagged MEDIUM (recency/registry-interruption caveats), both with clear mitigations (explicit `--base radix` flag, verify at install time). |
| Features | MEDIUM-HIGH | Next.js redirect/hash mechanics are HIGH (verified against Next.js source and official docs); Hero/Gallery UX pattern claims are MEDIUM, synthesized from a single (if methodologically substantial, 100+ page) dev-tool-landing-page study cross-checked against this project's own already-locked design decisions in PROJECT.md. |
| Architecture | HIGH | shadcn/Tailwind v4 conventions verified via Context7; all folder/boundary/reuse recommendations are grounded directly in actual repo files read (not generic advice), including specific existing duplication (ChartPanel/ReasoningPanel role maps) and specific existing hardcoded colors. |
| Pitfalls | HIGH | Grounded in this repo's actual source (ChartPanel, hooks, tests, vitest config) cross-checked against Context7 shadcn/Tailwind docs and current Next.js docs; a handful of community-sourced claims (Radix Select jsdom polyfill needs, `@theme` vs `@theme inline` black/white bug) are flagged MEDIUM/MEDIUM-HIGH but corroborated by first-party GitHub issues/discussions, not single blog posts alone. |

**Overall confidence:** HIGH

### Gaps to Address

- **`/gallery` → `/#gallery` mechanism reconciliation (resolved above, but verification still open):** all four files agree on the config-level `redirects()` approach and agree the actual scroll-to-anchor behavior cannot be confirmed by documentation alone — this must be manually tested in a real browser for both fresh-tab and in-app-link navigation paths as a Phase 4 (Gallery) success criterion, not assumed to work from the redirect config alone.
- **Base UI vs. Radix CLI default:** shadcn's CLI changed its default primitive library to Base UI very recently (this month, per STACK.md). The recommendation to pass `--base radix` explicitly is sound today, but if this milestone's execution is delayed, re-verify the CLI's current default behavior and Radix/Base UI's respective React 19 peer-dep compatibility before running `init`.
- **Whether the mockup/design file specifies a mini chart thumbnail per Gallery card or a mobile drawer nav:** FEATURES.md and STACK.md both flag these as "verify against the actual design file" items rather than confirmed scope — the roadmap should treat these as open questions to resolve at the start of the Hero/Gallery/Scaffolding phases, not assumed either way.
- **Exact `@testing-library/user-event` version:** flagged MEDIUM confidence in STACK.md due to an interrupted registry lookup during research — verify the installed version supports the `pointer()` API (any v14+ does) at actual install time in Phase 1.

## Sources

### Primary (HIGH confidence)
- Context7 `/shadcn-ui/ui` — CLI `init`/`add` commands, `components.json` schema, Tailwind v4 CSS templates, React 19 peer-dep guidance, Base UI vs Radix changelog entries, theming docs
- Context7 `/vercel/next.js` — `next/font/google` Geist import pattern, `redirects()` config semantics, `prepare-destination.ts`/`parseDestination()` hash-preservation behavior, `Link` scroll behavior
- Context7 `/websites/tailwindcss` — `@custom-variant dark`, `@theme` directive semantics
- npm registry live lookups — exact current versions for `shadcn`, `radix-ui`, `@base-ui/react`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `tw-animate-css`, `geist`, `next-themes`, `next`
- Direct repository reads — `package.json`, `next.config.ts`, `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `app/gallery/page.tsx`, `app/s/[shareId]/page.tsx`, `postcss.config.mjs`, `tsconfig.json`, `SandboxContainer.tsx`, `ChartPanel.tsx`, `ControlPanel.tsx`/`.test.tsx`, `ReasoningPanel.tsx`, `CopyLinkButton.tsx`, `vessel-role.ts`, `types.ts`, `useHullDrag.ts`, `useRotateHandleDrag.ts`, `vitest.config.ts`
- `.planning/PROJECT.md` — authoritative for locked v1.1 decisions (Hero Direction A, dark-mode-only, `/gallery` redirect rationale, breakpoints) and prior incidents (SVG hit-target fix, webpack `extensionAlias` fix)

### Secondary (MEDIUM confidence)
- [We studied 100 dev tool landing pages (Evil Martians)](https://evilmartians.com/chronicles/we-studied-100-devtool-landing-pages-here-is-what-actually-works-in-2025) — hero visual taxonomy, "no salesy BS" principle
- [Shadcnblocks — Updating shadcn/ui to Tailwind 4](https://www.shadcnblocks.com/blog/tailwind4-shadcn-themeing) — `@theme` vs `@theme inline` black/white color bug
- [github.com/testing-library/user-event Discussion #1087](https://github.com/testing-library/user-event/discussions/1087) and [radix-ui/primitives Issue #1822](https://github.com/radix-ui/primitives/issues/1822) — Radix Select/jsdom incompatibility, first-party but community-reported
- [vercel/next.js Issue #44295](https://github.com/vercel/next.js/issues/44295) and [Discussion #13804](https://github.com/vercel/next.js/discussions/13804) — hash-scroll behavior gaps, first-party but still-open/unresolved

### Tertiary (LOW confidence)
- General WebSearch on generic hero-section/scroll-pattern listicles — used only for background context, not the basis for any table-stakes/differentiator claim without corroboration from a higher-confidence source

---
*Research completed: 2026-07-18*
*Ready for roadmap: yes*
