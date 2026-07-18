# Phase 6: Scaffolding - Context

**Gathered:** 2026-07-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 6 (Scaffolding) delivers the foundation layer for the entire v1.1 redesign: shadcn/ui installed as the component-primitive layer, a single dark-only design-token theme, Geist/Geist Mono fonts loaded app-wide, and a Header/Main/Footer page shell wrapping every route. It builds nothing that later phases (Hero, Sandbox, Gallery) themselves own — it exists so those phases have tokens, primitives, and a consistent shell to build against. Requirements: SCAF-01 through SCAF-06 (see REQUIREMENTS.md).

</domain>

<decisions>
## Implementation Decisions

### shadcn component install scope
- **D-01:** Install only the shadcn primitives Scaffolding itself needs to build Header/Footer (e.g. `button`, `separator` — exact list finalized during planning based on the design's actual Header/Footer markup). Do NOT front-load card/badge/select/slider/tabs/input/sheet now — Hero, Sandbox, and Gallery each run their own `npx shadcn add <component>` when they build those sections. Keeps this phase's PR scoped to what SCAF-01–06 actually require.
- **D-02:** Because the mobile nav decision (D-03) removes the need for a slide-out drawer, `sheet` is NOT needed by this phase — confirm during planning that no drawer/overlay primitive is pulled in for the Header.

### Mobile header collapse (640px breakpoint)
- **D-03:** Below the 640px breakpoint, the Header shows **only the Logo and the "Source" button**. The "Sandbox" and "Gallery" in-page anchor nav links are hidden entirely — no hamburger menu, no drawer, no icon-only fallback. Mobile visitors reach those sections by scrolling the single-page layout instead of via nav links. This satisfies SCAF-04's "collapsing nav links at 640px" requirement with the simplest possible mechanism (a Tailwind responsive-hide utility on the two anchor links), not a new interactive component.

### Source link & branding
- **D-04:** The Header's external "Source" link points to `https://github.com/MarouenAbdi/colregs-navigator` (not the `portfolio-project` repo the current git remote resolves to — that remote is a working-copy detail unrelated to the public-facing link target).
- **D-05:** No existing icon/favicon/logo asset exists in the repo (`public/` has no SVGs, no favicon files). The logo mark (small icon + "COLREGS Navigator" wordmark + "Rules 11-18" chip) should be built to visually match what's shown in `.planning/design/Main-Design.png`'s header — pick the closest-matching icon (a `lucide-react` icon, consistent with the rest of the app's icon usage) rather than inventing a new visual concept or importing an external asset.

### Sticky-header scroll offset
- **D-06:** Scaffolding sets `scroll-padding-top` (sized to the sticky Header's actual rendered height) on the scroll container as part of building the Header in this phase — not deferred to Phase 7 (Hero) or Phase 9 (Gallery). Scaffolding owns the header height, so it's the natural single place to prevent any future `#sandbox`/`#gallery` anchor target from landing underneath the sticky header. Later phases that add real anchor targets (Hero's CTAs, Gallery's redirect landing) inherit this for free and don't need to remember to add it themselves.

### Claude's Discretion
- Exact shadcn component names pulled for the Header/Footer build (beyond confirming `sheet` is excluded) — resolve during planning by inspecting what the Header/Footer markup actually composes.
- Exact `lucide-react` icon chosen for the logo mark — match the design image's glyph as closely as the available icon set allows.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design source of truth
- `.planning/design/Main-Design.png` — full home-page mock (dark theme, Header, Hero, Sandbox, Gallery cards, Footer) exported from the imported Claude Design file; the Header (logo, nav links, Source button) and Footer (single-row content, two text blocks) shown here are the exact visual target for this phase
- `.planning/design/claude-design-prompt.json` — original design brief (brand personality, color system incl. locked domain-semantic colors, typography direction, motion philosophy) that produced Main-Design.png

### Stack & CLI
- `.planning/research/STACK.md` — shadcn CLI version/flags (`npx shadcn@latest init --template next --base radix ...` — **must use `--base radix`, not the CLI's new Base UI default**), Geist font loading via `next/font/google` (no `geist` npm package needed), dependency list (`radix-ui`, `class-variance-authority`, `clsx`/`tailwind-merge`, `lucide-react`, `tw-animate-css`)

### Architecture
- `.planning/research/ARCHITECTURE.md` — target folder structure (`src/components/ui/`, `layout/`, `shared/`), `tsconfig.json` `@/*` path alias addition (additive only, does not touch the existing 98 relative `.js`-suffixed imports), dark-only theming pattern (single `:root` palette, no `.dark` class, no `next-themes`), `src/lib/utils.ts` for `cn()`

### Pitfalls (Scaffolding-tagged)
- `.planning/research/PITFALLS.md` Pitfall 2 — half-wired light/dark toggle risk; must hardcode dark rendering and verify with OS/browser color-scheme set to light
- `.planning/research/PITFALLS.md` Pitfall 3 & 4 — custom semantic color tokens (and any future vessel-role tokens) must be registered under Tailwind v4's `@theme`/`@theme inline`, and the `:root`/`.dark`/`@theme inline` split should be kept in its standard shape (collapsed to one palette) rather than hand-simplified inconsistently
- `.planning/research/PITFALLS.md` Pitfall 7 — commit before running any `shadcn` CLI command; diff-review `globals.css`/`components.json` afterward to confirm no existing custom breakpoints (900px/640px) were clobbered

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` — SCAF-01 through SCAF-06, full acceptance criteria
- `.planning/ROADMAP.md` — Phase 6 success criteria, Phase 6→9 dependency chain (Hero/Sandbox/Gallery all depend on this phase's tokens/shell)
- `.planning/PROJECT.md` — locked v1.1 decisions (dark-mode only, no toggle; shadcn as primitive layer; git workflow — one branch/PR per phase)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/layout.tsx`, `app/page.tsx`, `app/gallery/page.tsx`, `app/globals.css` (currently just `@import "tailwindcss";`) — existing files this phase edits/extends, not replaces
- `next.config.ts`'s webpack `resolve.extensionAlias` — existing fix for the `.js`-suffix relative-import convention; unaffected by adding the new `@/*` alias for shadcn-adjacent code only (per ARCHITECTURE.md Pattern 1)

### Established Patterns
- No `tailwind.config.js` exists (Tailwind v4 CSS-first) — all theme customization happens in `app/globals.css` via `@theme`/`@theme inline`; do not introduce a second config file
- No path aliases currently exist in `tsconfig.json` — the `@/*` alias is net-new, scoped to shadcn-generated/adjacent imports only

### Integration Points
- `app/layout.tsx` is where `<Header />`/`<Footer />` get rendered once and `{children}` wrapped — this is the single page-shell integration point every future route (`/`, `/s/[shareId]`) inherits from

</code_context>

<specifics>
## Specific Ideas

- Footer content and layout are fully specified visually in `Main-Design.png` — a single row: "⊙ COLREGS Navigator · classification maps to Rules 11-18" on the left, "Educational reference only — not a substitute for a qualified watchkeeper or official publications. Not for navigation." on the right. No footer nav/links/columns beyond this.
- Header content is fully specified visually in `Main-Design.png`: icon + "COLREGS Navigator" wordmark + "Rules 11-18" chip on the left; "Sandbox" / "Gallery" anchor links + "Source" button (with icon) on the right, all in a sticky bar.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 6's scope. (The pending "embed gallery on home page" todo is explicitly Phase 9's concern, already tracked in STATE.md and PROJECT.md; it was not raised or folded here.)

</deferred>

---

*Phase: 6-Scaffolding*
*Context gathered: 2026-07-18*
