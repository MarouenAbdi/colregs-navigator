# Roadmap: COLREGS Navigator

## Milestones

- ✅ **v1.0** (2026-07-14 → 2026-07-18) — Domain foundations, COLREGS rules engine, persistence/API layer, interactive chart sandbox, save/share/gallery. 5 phases, 19 plans. See `.planning/milestones/v1.0-ROADMAP.md`.
- ✅ **v1.1 UI Redesign (shadcn)** (2026-07-18 → 2026-07-19) — Re-implemented the entire front end against an imported Claude Design file using shadcn/ui, dark-mode only, across 4 branch+PR phases (Scaffolding, Hero, Sandbox, Gallery). Zero change to domain logic or existing validated requirements. 4 phases, 14 plans, 19/19 requirements validated. See `.planning/milestones/v1.1-ROADMAP.md`.
- ✅ **v1.2 Tech Debt & Stabilization** (2026-07-19 → 2026-07-20) — ESLint tooling, deprecated Tailwind v4 class-name fixes, ChartPanel/SandboxContainer decomposition refactor, and comment-convention cleanup. No new user-facing features; zero change to domain logic outcomes. 4 phases, 18 plans, 22/22 requirements validated. See `.planning/milestones/v1.2-ROADMAP.md`.
- ✅ **v1.3 CI/CD & Deployment** (2026-07-20 → 2026-07-22) — GitHub Actions CI/CD pipeline, Husky/lint-staged pre-commit hooks, CONTRIBUTING.md, and a live Vercel + Neon production deployment with go-live verification. 2 phases (14-15), 9 plans, 17/17 requirements validated. See `.planning/milestones/v1.3-ROADMAP.md`.
- 🚧 **v1.4 Design Sync (Sandbox & Gallery)** (started 2026-07-25) — Re-sync the front end against the updated Claude Design file: merge Sandbox's header/footer command strips, replace the side ControlPanel with on-chart floating vessel-control overlays, add a net-new Guided Tour, switch the Gallery card to an in-place "Try on Sandbox" load, and sync the Hero preview card's visual details. 5 phases (16-20), presentation-layer only, zero domain-logic change.

## Phases

<details>
<summary>✅ v1.0 (Phases 1-5) — SHIPPED 2026-07-18</summary>

- [x] Phase 1-5 — see `.planning/milestones/v1.0-ROADMAP.md` for full phase details

</details>

<details>
<summary>✅ v1.1 UI Redesign (shadcn) (Phases 6-9) — SHIPPED 2026-07-19</summary>

- [x] Phase 6: Scaffolding — shadcn/ui install + Tailwind dark theme tokens + Header/Nav + page shell (completed 2026-07-18)
- [x] Phase 7: Hero — Direction A hero section (headline, copy, CTAs, illustrative live-classification preview card) (completed 2026-07-18)
- [x] Phase 8: Sandbox — Restyled interactive chart/controls/reasoning-trail to match the design, same domain wiring (completed 2026-07-18)
- [x] Phase 9: Gallery — Gallery section embedded on the home page below Sandbox; `/gallery` route removed with a redirect to `/#gallery` (completed 2026-07-19)

See `.planning/milestones/v1.1-ROADMAP.md` for full phase details (goals, success criteria, plans).

</details>

<details>
<summary>✅ v1.2 Tech Debt & Stabilization (Phases 10-13) — SHIPPED 2026-07-20</summary>

- [x] Phase 10: ESLint Setup & Lint-Clean Baseline — Install ESLint (flat config), wire `npm run lint`, and reach a lint-clean baseline with architecture-boundary and convention-enforcing custom rules (completed 2026-07-19)
- [x] Phase 11: Tailwind Deprecated Class-Name Fixes — Replace deprecated Tailwind v3 class names with v4 canonical equivalents in the 6 flagged files, verified by hand (completed 2026-07-19)
- [x] Phase 12: ChartPanel/SandboxContainer Decomposition Refactor — Decompose the two oversized Sandbox files into focused modules, preserving all existing behavior and hit-testing (completed 2026-07-20)
- [x] Phase 13: Comment Cleanup — Rewrite stale Phase/Plan/REQ-ID comment references by hand, preserving substantive WHY content (completed 2026-07-20)

See `.planning/milestones/v1.2-ROADMAP.md` for full phase details (goals, success criteria, plans).

</details>

<details>
<summary>✅ v1.3 CI/CD & Deployment (Phases 14-15) — SHIPPED 2026-07-22</summary>

- [x] Phase 14: Pipeline & Hooks — GitHub Actions CI/CD pipeline (lint/typecheck/test/build gate + auto-deploy wiring), Husky/lint-staged pre-commit hooks, and CONTRIBUTING.md (completed 2026-07-20)
- [x] Phase 15: Deploy & Verify — Live Vercel + Neon production deployment, provisioned and go-live-verified end-to-end (completed 2026-07-22)

See `.planning/milestones/v1.3-ROADMAP.md` for full phase details (goals, success criteria, plans).

</details>

### 🚧 v1.4 Design Sync (Sandbox & Gallery) (In Progress)

**Milestone Goal:** Re-sync the front end against the updated Claude Design file — restructure the Sandbox around merged header/footer command strips and on-chart vessel overlays, add the net-new Guided Tour, replace the Gallery card's navigate-to-page click with an in-place "Try on Sandbox" load, and sync the Hero preview card's visual details. Presentation-layer only — zero change to `classifyEncounter()` or any domain/`src/server/` logic.

- [x] **Phase 16: Sandbox Mutation-Path Generalization** - Generalize `handleChipSelect` into a reusable `loadScenario()` entry point and remove the 6-chip preset row entirely (completed 2026-07-25)
- [ ] **Phase 17: Gallery → Sandbox Bridge** - Gallery's "Try on Sandbox" loads a scenario directly into the homepage Sandbox with no page navigation
- [ ] **Phase 18: On-Chart Vessel Control Overlay** - Replace the side ControlPanel with click-to-open floating vessel overlays and merge the chart header/footer strips
- [ ] **Phase 19: Guided Tour** - A 6-step "How to read this" modal walkthrough with full keyboard/focus handling
- [ ] **Phase 20: Reasoning-Trail & Hero Visual Sync** - Horizontal "NAV DECISION CHAIN" trail layout and Hero preview card visual sync

## Phase Details

### Phase 16: Sandbox Mutation-Path Generalization
**Goal**: Every Sandbox vessel-mutation source funnels through one generalized, reusable scenario-loading entry point, and the inline preset-chip UI is fully removed — the prerequisite both Phase 17 (Gallery load) and the rest of this milestone depend on.
**Depends on**: Nothing (first phase of v1.4; builds on v1.0-v1.3's existing `useSandboxState()`)
**Requirements**: SBOX-10
**Success Criteria** (what must be TRUE):
  1. The Sandbox UI no longer displays the 6-chip preset row anywhere on the page.
  2. `useSandboxState()` exposes a single `loadScenario(vesselA, vesselB)` entry point (replacing `handleChipSelect`) that every mutation source (drag, ControlPanel field edit, Reset) can call.
  3. Existing Sandbox interactions (drag/rotate a vessel, edit via ControlPanel, Reset) behave identically to before the refactor — human-verified in a real browser, not just green tests.
  4. No orphaned chip-row code remains (`activeChipId`, old `handleChipSelect`, `chip-scenarios.ts`) — removed, not merely hidden from the UI.
**Plans**: 2 plans

Plans:
- [x] 16-01-PLAN.md — Generalize useSandboxState() into loadScenario(), delete chip-scenarios.ts/.test.ts, remove chip row from SandboxContainer.tsx, replace chip-dependent tests
- [x] 16-02-PLAN.md — Human-verify drag/rotate/ControlPanel-edit/Reset behavioral parity on the plain `/` route (depends on 16-01)

### Phase 17: Gallery → Sandbox Bridge
**Goal**: Users can load any curated gallery scenario directly into the homepage Sandbox's live state and are scrolled to it — no page navigation, no lost interactivity.
**Depends on**: Phase 16 (needs `loadScenario()`)
**Requirements**: GAL-05, GAL-06
**Success Criteria** (what must be TRUE):
  1. User can click "Try on Sandbox" on any gallery card and see the Sandbox chart/readouts immediately update to that scenario's two vessels, with no URL change and no full page navigation.
  2. After clicking, the page smooth-scrolls to the Sandbox section automatically, sequenced after the scenario state has actually updated.
  3. The "Try on Sandbox" CTA is discoverable and operable via mouse hover, keyboard Tab focus, and touch/coarse-pointer — human-verified across all three input modes, not hover-only.
  4. Human-verified: loading a second gallery card after a first correctly replaces the previously loaded scenario (state genuinely updates, not stale from the first load).
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 17-01: TBD

### Phase 18: On-Chart Vessel Control Overlay
**Goal**: Users read the verdict and instrument readouts directly on the chart via merged header/footer strips, and control each vessel via a floating on-chart overlay opened by clicking it — with zero regression to this codebase's twice-fixed drag/rotate hit-testing.
**Depends on**: Phase 16 (needs the generalized mutation path; independent of Phase 17's Gallery-bridge files)
**Requirements**: SBOX-06, SBOX-07, SBOX-08
**Success Criteria** (what must be TRUE):
  1. A single merged header strip (rule badge + encounter title + risk badge) sits atop the chart — the separate `VerdictBanner` card is gone.
  2. A single merged footer strip (LIVE/RANGE/BEARING/CPA/TCPA + each vessel's required-action text) sits below the chart — the separate `InstrumentReadouts` card is gone.
  3. User can click a vessel on the chart to open a floating control card (type, speed, heading) for that vessel; clicking the other vessel moves the overlay to it, and re-clicking the same vessel closes it. The side `ControlPanel` is fully removed.
  4. Human-verified: with the vessel-control overlay open, dragging and rotating either vessel still works correctly with no dead zones — this is the codebase's 3rd occurrence of the painted-element-swallows-pointer-event regression class (Phase 4, Phase 8 precedent), and must be explicitly re-verified, not assumed.
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 18-01: TBD

### Phase 19: Guided Tour
**Goal**: A first-time or confused user can open a self-contained modal walkthrough that explains how to read the Sandbox, fully operable by mouse, keyboard, and screen-reader-relevant focus handling.
**Depends on**: Phase 18 (tour content/illustrations and z-index tier reference the final chart/overlay layout, not a moving target)
**Requirements**: TOUR-01, TOUR-02
**Success Criteria** (what must be TRUE):
  1. User can click a new "How to read this" button to open a 6-step tour modal, each step showing a per-step illustration and step-dot progress indicator.
  2. User can navigate the tour with Back/Next controls (no Back on step 1; "Done" replaces "Next" on the final step).
  3. User can dismiss the tour via Escape, clicking outside the modal, or Skip/Done — every path closes the tour.
  4. After the tour closes by any dismissal path, keyboard focus visibly returns to the "How to read this" trigger button — human-verified via real Tab-key navigation, not just an automated focus assertion.
  5. Human-verified: the tour modal's stacking order does not visually collide with the Phase 18 on-chart vessel overlay (explicit z-index tiers checked in a session where both could plausibly be open).
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 19-01: TBD

### Phase 20: Reasoning-Trail & Hero Visual Sync
**Goal**: The reasoning trail and Hero preview card visually match the updated design file, purely additive/cosmetic changes with zero classification-output change.
**Depends on**: Nothing new (independent of Phases 17-19; only shares Phase 16's stable foundation)
**Requirements**: SBOX-09, HERO-05
**Success Criteria** (what must be TRUE):
  1. The reasoning trail renders as a horizontal sequence of connected step cards ("NAV DECISION CHAIN") instead of a vertical list, correctly for encounters with varying trail lengths.
  2. The connector treatment between trail cards is CSS-only (no `getBoundingClientRect()`/`getBBox()` runtime measurement) and renders correctly across different step counts — human-verified in a real browser, matching this project's existing jsdom-measurement-ban precedent.
  3. The Hero preview card's bezel accents, radar sweep overlay, and readout styling visually match the updated design file, while the card remains fully static/fixture-driven with unchanged classification values.
  4. Human-verified: no regression to Hero's fixture-driven classification values or to any other Sandbox content during this pass.
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 20-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 10 → 11 → 12 → 13 → 14 → 15 → 16 → 17 → 18 → 19 → 20

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-5 | v1.0 | 19/19 | Complete | 2026-07-18 |
| 6. Scaffolding | v1.1 | 2/2 | Complete | 2026-07-18 |
| 7. Hero | v1.1 | 2/2 | Complete | 2026-07-18 |
| 8. Sandbox | v1.1 | 6/6 | Complete | 2026-07-18 |
| 9. Gallery | v1.1 | 4/4 | Complete | 2026-07-19 |
| 10. ESLint Setup & Lint-Clean Baseline | v1.2 | 3/3 | Complete    | 2026-07-19 |
| 11. Tailwind Deprecated Class-Name Fixes | v1.2 | 3/3 | Complete    | 2026-07-20 |
| 12. ChartPanel/SandboxContainer Decomposition Refactor | v1.2 | 4/4 | Complete   | 2026-07-20 |
| 13. Comment Cleanup | v1.2 | 8/8 | Complete | 2026-07-20 |
| 14. Pipeline & Hooks | v1.3 | 4/4 | Complete | 2026-07-20 |
| 15. Deploy & Verify | v1.3 | 5/5 | Complete | 2026-07-22 |
| 16. Sandbox Mutation-Path Generalization | v1.4 | 2/2 | Complete    | 2026-07-25 |
| 17. Gallery → Sandbox Bridge | v1.4 | 0/TBD | Not started | - |
| 18. On-Chart Vessel Control Overlay | v1.4 | 0/TBD | Not started | - |
| 19. Guided Tour | v1.4 | 0/TBD | Not started | - |
| 20. Reasoning-Trail & Hero Visual Sync | v1.4 | 0/TBD | Not started | - |
</content>
