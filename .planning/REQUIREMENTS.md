# Requirements: COLREGS Navigator — v1.1 UI Redesign (shadcn)

**Defined:** 2026-07-18
**Core Value:** Given any two-vessel encounter, correctly classify it under COLREGS and clearly explain — not just assert — which vessel must give way and why.

This milestone is a presentation-layer re-implementation, not a new-feature milestone. All v1.0 functional requirements (VESL, CLAS, DETM, RSON, CHRT, SCEN — see `.planning/milestones/v1.0-REQUIREMENTS.md`) remain validated and unchanged; nothing here touches `src/domain/` or `src/server/`. Source of truth for visual fidelity: the imported Claude Design file "COLREGS Navigator (shadcn).dc.html" (`claude.ai/design` project `c265c047-81a0-4446-bdf3-95d434adc3dc`).

## v1.1 Requirements

### Scaffolding (shadcn/ui + theme + page shell)

- [x] **SCAF-01**: shadcn/ui is installed and configured (CLI init, `@/*` path alias, `components/ui/`) as the app's component-primitive layer, compatible with the existing webpack-only (non-Turbopack) Next.js 16 build
- [x] **SCAF-02**: A dark-only design-token theme (base `#09090B`, zinc scale, teal `#2dd4bf` accent) is defined once in `app/globals.css` via Tailwind v4's `@theme`, with no light-theme variant or unused `next-themes`/`.dark`-toggle machinery
- [x] **SCAF-03**: Geist and Geist Mono fonts are loaded via `next/font/google` and applied app-wide
- [x] **SCAF-04**: A sticky Header/Nav (logo, "Sandbox"/"Gallery" in-page anchor links, external "Source" link) renders above all pages, collapsing nav links at the 640px breakpoint per the design
- [x] **SCAF-05**: A page shell (Header / Main / Footer) wraps the app in `app/layout.tsx`, with Footer matching the design's content and layout
- [x] **SCAF-06**: Shared cross-feature components, types, and design tokens live in one shared location (e.g. `src/components/shared/`) that Hero/Sandbox/Gallery all import from — no duplicated role/color/label mappings across features

### Hero

- [ ] **HERO-01**: A new Hero section (Direction A: headline, supporting copy, "Open the sandbox" + "Classic encounters" CTAs) renders above the Sandbox on the home page, matching the design exactly
- [ ] **HERO-02**: The Hero's illustrative live-classification preview card (mini chart, rule badge, range/bearing/CPA readouts) renders as static/canned illustrative content — it is decorative, not wired to the interactive Sandbox's live state
- [ ] **HERO-03**: Hero CTAs scroll to `#sandbox` and `#gallery` respectively within the same page
- [ ] **HERO-04**: Hero layout is responsive per the design's breakpoints (single-column below 900px, scaled headline below 640px)

### Sandbox (restyle, same interaction model)

- [ ] **SBOX-01**: The existing interactive chart (drag-to-reposition, drag-to-rotate heading) is restyled to the dark theme exactly per the design, with zero regression to existing hit-testing behavior (drag/rotate must still hit-test the real painted shape, verified manually in a browser, not just via jsdom tests)
- [x] **SBOX-02**: Vessel type/speed controls and the verdict banner are restyled using shadcn/ui form primitives (Select, Slider, Card, Badge) while preserving all existing classification behavior
- [ ] **SBOX-03**: The reasoning trail panel is restyled to match the design (numbered steps, colored tags/dots, connecting line) with no change to its underlying content/order
- [x] **SBOX-04**: Existing Vitest/RTL tests exercising drag and control interactions are updated for any shadcn/Radix primitive swap (e.g. native `<select>` → `Select`) and continue to pass
- [x] **SBOX-05**: Sandbox layout is responsive per the design's breakpoints (stacked single-column below 900px, stacked controls below 640px)

### Gallery

- [x] **GAL-01**: The curated gallery of preset encounters is embedded as a section on the home page below the Sandbox, matching the design's card grid exactly (responsive: 3 → 2 → 1 columns)
- [x] **GAL-02**: Clicking a gallery card loads that preset into the Sandbox above it (existing load-and-scroll behavior preserved)
- [x] **GAL-03**: The standalone `/gallery` route is removed; visiting it redirects (permanent redirect) to `/#gallery`, verified manually to work both from a fresh tab/bookmark and via in-app navigation
- [x] **GAL-04**: The Gallery section remains server-rendered (not client-fetched) so the `/#gallery` anchor scroll works on redirect

## v2 Requirements

None identified — this milestone's carried-forward v2 items (RSON-V2-01, SCEN-V2-01) are functional/domain items unrelated to the redesign; see `.planning/milestones/v1.0-REQUIREMENTS.md`.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Hero Direction B ("bridge display" full-bleed variant) | The design file's two directions were an authoring-tool comparison toggle, not a runtime feature; Direction A was chosen as the shipped design |
| Light theme / theme toggle | Source design only defines a dark palette; inventing a light palette is scope beyond "follow the design exactly" |
| Wiring the Hero preview card to live Sandbox state | The design's own wording is "illustrative" — duplicating live state into the Hero is unnecessary coupling and cost beyond a restyle |
| Reusing `/gallery` as a standalone route alongside the embedded section | Would duplicate content/maintenance for no product benefit; the pending todo this milestone closes was specifically to remove the separate route |
| Any new domain/classification logic or rule coverage | Out of scope for a presentation-layer milestone; `src/domain/` and `src/server/` are untouched |

## Traceability

Populated by roadmap creation — all 19 requirements mapped to their user-specified phases (6-9).

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCAF-01 | Phase 6 | Complete |
| SCAF-02 | Phase 6 | Complete |
| SCAF-03 | Phase 6 | Complete |
| SCAF-04 | Phase 6 | Complete |
| SCAF-05 | Phase 6 | Complete |
| SCAF-06 | Phase 6 | Complete |
| HERO-01 | Phase 7 | Pending |
| HERO-02 | Phase 7 | Pending |
| HERO-03 | Phase 7 | Pending |
| HERO-04 | Phase 7 | Pending |
| SBOX-01 | Phase 8 | Pending |
| SBOX-02 | Phase 8 | Complete |
| SBOX-03 | Phase 8 | Pending |
| SBOX-04 | Phase 8 | Complete |
| SBOX-05 | Phase 8 | Complete |
| GAL-01 | Phase 9 | Complete |
| GAL-02 | Phase 9 | Complete |
| GAL-03 | Phase 9 | Complete |
| GAL-04 | Phase 9 | Complete |

**Coverage:**
- v1.1 requirements: 19 total
- Mapped to phases: 19/19 ✓
- Unmapped: 0

---
*Requirements defined: 2026-07-18*
*Last updated: 2026-07-18 — traceability populated after ROADMAP.md creation for milestone v1.1 (Phases 6-9)*
