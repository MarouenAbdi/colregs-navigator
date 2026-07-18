# Roadmap: COLREGS Navigator

## Milestones

- ✅ **v1.0** (2026-07-14 → 2026-07-18) — Domain foundations, COLREGS rules engine, persistence/API layer, interactive chart sandbox, save/share/gallery. 5 phases, 19 plans. See `.planning/milestones/v1.0-ROADMAP.md`.
- 🚧 **v1.1 UI Redesign (shadcn)** — Phases 6-9 (in progress). Re-implements the entire front end against an imported Claude Design file using shadcn/ui, dark-mode only. Zero change to domain logic or existing validated requirements.

## Git Workflow (v1.1 — explicit user requirement)

This milestone's 4 phases are **each their own git branch + PR**, executed strictly in order (Phase 6 → 7 → 8 → 9). This is a deliberate deviation from the default `gsd/phase-{phase}-{slug}` continuous-flow convention only in that **each phase's PR must be merged to `main` before the next phase's branch is cut** (Hero depends on Scaffolding's shipped tokens/shell; Sandbox depends on Scaffolding's tokens; Gallery depends on Scaffolding's Header nav) — no parallel phase branches for this milestone.

| Phase | Branch | PR |
|-------|--------|----|
| 6 - Scaffolding | `gsd/phase-6-scaffolding` | 1 PR into `main` |
| 7 - Hero | `gsd/phase-7-hero` | 1 PR into `main` |
| 8 - Sandbox | `gsd/phase-8-sandbox` | 1 PR into `main` |
| 9 - Gallery | `gsd/phase-9-gallery` | 1 PR into `main` |

Branch names follow this project's standard `phase_branch_template` (`gsd/phase-{phase}-{slug}`, see `.planning/config.json`) — no new naming convention introduced, just a stricter sequential-merge rule than the default.

## Phases

**Phase Numbering:** v1.1 continues numbering from v1.0's last phase (Phase 5) — this milestone is Phases 6-9. Integer phases are planned milestone work; decimal phases (e.g. 6.1) would be urgent insertions, none currently exist.

- [ ] **Phase 6: Scaffolding** - shadcn/ui install + Tailwind dark theme tokens + Header/Nav + page shell (Header/Main/Footer) + Footer
- [ ] **Phase 7: Hero** - Direction A hero section (headline, copy, CTAs, illustrative live-classification preview card)
- [ ] **Phase 8: Sandbox** - Restyle the existing interactive chart/controls/reasoning-trail to match the design exactly, same domain wiring, same interaction model
- [ ] **Phase 9: Gallery** - Gallery section embedded on the home page below Sandbox; `/gallery` route removed with a redirect to `/#gallery`

## Phase Details

### Phase 6: Scaffolding
**Goal**: shadcn/ui is installed as the app's component-primitive layer, a single dark-only design-token theme is defined, Geist fonts load app-wide, and a Header/Main/Footer page shell wraps every route.
**Depends on**: Nothing (first phase of v1.1, builds on the completed v1.0 app)
**Requirements**: SCAF-01, SCAF-02, SCAF-03, SCAF-04, SCAF-05, SCAF-06
**Success Criteria** (what must be TRUE):
  1. The app renders in dark theme regardless of the OS/browser color-scheme preference, with no unused light-theme/toggle machinery left half-wired (manual browser check with color-scheme set to light) — SCAF-02
  2. A sticky Header (logo, "Sandbox"/"Gallery" in-page anchor links, external "Source" link) renders above every page, collapsing nav links at the 640px breakpoint — SCAF-04
  3. A Footer matching the design's content and layout renders at the bottom of the page shell on every page — SCAF-05
  4. Geist and Geist Mono fonts are visibly applied app-wide (not the browser default fallback) — SCAF-03
  5. shadcn/ui is installed and configured (CLI init with `--base radix`, `@/*` path alias, `components/ui/`) as the component-primitive layer, and shared cross-feature components/types/design tokens live in one shared location (`src/components/shared/`) that later phases import from rather than duplicating — SCAF-01, SCAF-06
**Plans**: TBD
**UI hint**: yes

### Phase 7: Hero
**Goal**: A net-new Hero section (Direction A) renders above the Sandbox, giving visitors an immediate, honest preview of the product's core value before they reach the interactive tool.
**Depends on**: Phase 6 (consumes its tokens, primitives, and page shell)
**Requirements**: HERO-01, HERO-02, HERO-03, HERO-04
**Success Criteria** (what must be TRUE):
  1. A Hero section (headline, supporting copy, "Open the sandbox" and "Classic encounters" CTAs) renders above the Sandbox on the home page, matching the design exactly — HERO-01
  2. The Hero's illustrative live-classification preview card (mini chart, rule badge, range/bearing/CPA readouts) renders as static/canned content, visibly not wired to the interactive Sandbox's live state — HERO-02
  3. Clicking each Hero CTA scrolls to `#sandbox` or `#gallery` respectively within the same page — HERO-03
  4. The Hero layout is responsive per the design's breakpoints (single-column below 900px, scaled headline below 640px) — HERO-04
**Plans**: TBD
**UI hint**: yes

### Phase 8: Sandbox
**Goal**: The existing interactive chart, controls, and reasoning trail are restyled to match the design exactly, with zero regression to the underlying domain wiring or interaction model.
**Depends on**: Phase 6 (dark tokens needed to re-theme `ChartPanel`'s hardcoded light-mode colors; `ui/*` primitives for Button/Card/Input/Select/Badge)
**Requirements**: SBOX-01, SBOX-02, SBOX-03, SBOX-04, SBOX-05
**Success Criteria** (what must be TRUE):
  1. The interactive chart matches the dark theme exactly, and dragging to reposition and dragging to rotate heading both still work correctly when manually tested in a real browser tab — not just via a green `npm test` run, since jsdom cannot detect a hit-testing regression on the hull/rotate-handle shapes — SBOX-01
  2. Vessel type/speed controls and the verdict banner are restyled using shadcn/ui form primitives (Select, Slider, Card, Badge) while producing identical classification results to before the restyle — SBOX-02
  3. The reasoning trail panel displays the same rule citations and geometric facts in the same order as before, restyled with numbered steps, colored tags/dots, and a connecting line — SBOX-03
  4. All existing Vitest/RTL tests exercising drag and control interactions pass after being updated for the shadcn/Radix primitive swap (e.g. native `<select>` → `Select`) — SBOX-04
  5. The Sandbox layout is responsive per the design's breakpoints (stacked single-column below 900px, stacked controls below 640px) — SBOX-05
**Plans**: TBD
**UI hint**: yes

### Phase 9: Gallery
**Goal**: The curated gallery of preset encounters is embedded as a section on the home page below the Sandbox, and the standalone `/gallery` route is removed in favor of a working `/#gallery` redirect.
**Depends on**: Phase 6 (`ui/*` Card primitive, Header nav linking directly at `/#gallery`); independent of Phase 7/8
**Requirements**: GAL-01, GAL-02, GAL-03, GAL-04
**Success Criteria** (what must be TRUE):
  1. The curated gallery of preset encounters renders as a card grid embedded on the home page below the Sandbox, responsive at 3 → 2 → 1 columns matching the design exactly — GAL-01
  2. Clicking a gallery card loads that preset into a full scenario view (existing load-and-scroll behavior preserved, same `/s/[shareId]` navigation as before) — GAL-02
  3. Visiting the old `/gallery` URL issues a permanent redirect to `/#gallery` and lands the user scrolled to the Gallery section (not the top of the page), verified manually both from a fresh browser tab/bookmark navigation and via an in-app `<Link>` click — these are independent code paths that can fail separately — GAL-03
  4. The Gallery section is present in the initial server-rendered HTML (not client-fetched), so the `#gallery` anchor target exists at first paint and the redirect's scroll-to-anchor behavior works reliably — GAL-04
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:** Phases execute in strict numeric order: 6 → 7 → 8 → 9 (each phase's PR merges to `main` before the next phase's branch is cut — see Git Workflow above).

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-5 | v1.0 | 19/19 | Complete | 2026-07-18 |
| 6. Scaffolding | v1.1 | 0/? | Not started | - |
| 7. Hero | v1.1 | 0/? | Not started | - |
| 8. Sandbox | v1.1 | 0/? | Not started | - |
| 9. Gallery | v1.1 | 0/? | Not started | - |
