# COLREGS Navigator

## Current State

**Shipped:** v1.3 CI/CD & Deployment — 2026-07-22. A DevOps-competency milestone: a real, required GitHub Actions CI pipeline (lint, typecheck, test against live Postgres, build) gates every PR via branch protection; Husky + lint-staged pre-commit hooks auto-fix staged files; `CONTRIBUTING.md` documents real contributor workflow; and the app is live on a public Vercel production URL backed by a provisioned Neon Postgres database, with an environment-gated `prisma migrate deploy`, a `/api/health` DB-connectivity check, and a live-exercised rollback/promote path. Every requirement verified against real infrastructure — a live PR run, live branch protection, a live deployment, a real external HTTP request, a genuine ~18.5h idle window, and a live rollback cycle — not simulation. All 17/17 v1.3 requirements validated across 2 phases / 9 plans (2026-07-20 → 2026-07-22). See `.planning/milestones/v1.3-ROADMAP.md` and `.planning/milestones/v1.3-REQUIREMENTS.md` for full detail.

**Next:** Planning next milestone — see Next Milestone Goals below.

## Current Milestone: v1.4 Design Sync (Sandbox & Gallery)

**Goal:** Re-sync the front end against the updated Claude Design file (`COLREGS Navigator (shadcn).dc.html`, same `claude.ai/design` project `c265c047-81a0-4446-bdf3-95d434adc3dc` used for v1.1) — restructure the Sandbox around the design's merged header/footer command strips and on-chart vessel overlays, add the net-new Guided Tour, replace the Gallery card's navigate-to-page click with an in-place "Try on Sandbox" load, and sync the Hero preview card's visual details. No domain/rules-engine logic changes.

**Target features:**
- Sandbox: merge `VerdictBanner` + risk badge into one chart header strip; merge `InstrumentReadouts` + per-vessel required-action text into one chart footer strip; replace the side `ControlPanel` with on-chart floating vessel-control overlays (opens on vessel click); replace vertical `ReasoningTrail` with horizontal "NAV DECISION CHAIN" connected node-cards
- Remove the inline 6-chip preset row from Sandbox entirely
- Net-new Guided Tour: 6-step modal walkthrough, triggered by a new "How to read this" button
- Gallery: `GalleryCard` drops its whole-card `Link` to `/s/{id}`; replaced by a hover-reveal "Try on Sandbox" button that loads the scenario into the homepage Sandbox state and smooth-scrolls to it (no page navigation)
- Hero preview card: sync visual details (bezel accents, radar sweep, readout styling) to the updated design, still fully static/fixture-driven

**Locked decisions:** Match the design exactly on all three scope questions raised during milestone scoping — Guided Tour is in scope (not deferred), the chip row is removed (not kept alongside Gallery), and Gallery fully switches to load-in-place (not both Link + button). Zero change to `classifyEncounter()`/domain logic — presentation layer only, same pattern as v1.1.

**Progress:** Phase 16 (Sandbox Mutation-Path Generalization) complete 2026-07-25 — SBOX-10 validated. `useSandboxState()` now exposes a single generalized `loadScenario(vesselA, vesselB)` entry point (replacing `handleChipSelect`); every mutation source (drag, rotate, ControlPanel edit, Reset) funnels through it; the inline 6-chip preset row and its backing `chip-scenarios.ts` module are fully removed. Human-verified behavioral parity in a real browser. Two pre-existing, out-of-scope issues surfaced and logged as backlog todos rather than blocking this phase: a floating-point precision gap in the exact-coincident-position degenerate check, and an unsafe `Result` cast in `useSandboxState`'s lazy initializer (both predate this phase). This was the prerequisite Phase 17 (Gallery → Sandbox bridge) depended on.

Phase 17 (Gallery → Sandbox bridge) complete 2026-07-25 — GAL-05/GAL-06 validated, 8/8 must-haves, 4/4 plans. A page-scoped `SandboxBridgeProvider`/`useSandboxBridge()` React Context (no Zustand, no prop-drilling through the Server Component tree) lets `TryOnSandboxButton` on any `GalleryCard` signal "load this scenario" to `SandboxContainer`, which applies it via `loadScenario()`. `GalleryCard`'s whole-card `<Link>` to `/s/{id}` is gone — the button is the sole interactive affordance, hover/focus-within/touch-visible per the design's D-01–D-09 contract. Also landed the two hardening fixes carried over from Phase 16: a real `.ok` check replacing `useSandboxState`'s unchecked `Result` cast, and `bearing()`'s coincident-position guard widened from exact equality to a small distance threshold. Human-verified end-to-end in a real browser (no navigation, correct scroll timing, mouse/keyboard/touch discoverability, correct second-load replacement). Code review found 4 non-blocking warnings (millisecond-collision edge case in the bridge's `requestId`, a duplicated magic scroll-target string, a WCAG 2.5.3 accessible-name gap on the CTA, a silent validation-failure no-op) — none block the roadmap criteria; logged in `17-REVIEW.md` for future cleanup.

Phase 18 (On-Chart Vessel Control Overlay) complete 2026-07-25 — SBOX-06/SBOX-07/SBOX-08 validated, 8/8 must-haves, 5/5 plans. `ChartHeaderStrip`/`ChartFooterStrip` merge `VerdictBanner`/`InstrumentReadouts` into one bordered header/footer strip around the chart (4-tier CPA-driven risk pill, per-vessel required-action copy); the side `ControlPanel` is replaced by a click-to-open floating `VesselOverlayCard`, wired via a `selectedVessel` state machine in `ChartPanel.tsx` with toggle-closes-on-re-click, switch-without-closing, and close-on-empty-chart-click. `useHullDrag`/`useRotateHandleDrag` fire `onSelect()` in the same breath as `setPointerCapture` (D-04), with `stopPropagation()` guarding against this codebase's 3rd occurrence of the painted-element-swallows-pointer-event hit-testing regression class (Phase 4, Phase 8 precedent) — proven both by automated jsdom regression tests and a live human-browser UAT pass with zero dead zones. `VerdictBanner`/`InstrumentReadouts`/`ControlPanel` and the dead `status-pill.ts` are fully deleted. One executor recovered cleanly from a mid-plan API disconnect (all task work and commits had already landed; only the SUMMARY.md write was lost, reconstructed by the orchestrator from the worktree's git history).

<details>
<summary>v1.3 milestone details (shipped 2026-07-22)</summary>

**Goal:** Demonstrate basic, portfolio-credible full-stack DevOps competency — a GitHub Actions CI/CD pipeline and a real, live-deployed instance of the app with a production Postgres database — so the repo shows the same engineering discipline in deployment/operations that v1.2 demonstrated in code hygiene.

**Target features:**
- GitHub Actions CI: lint + typecheck + test + build running on every PR, with a passing status badge in the README (carries forward CI-01)
- CD: automatic deployment to production on merge to `main` (continuous deployment, not just continuous integration)
- A live, publicly reachable deployment of the app backed by a real production Postgres database — hosting platform and DB provider to be selected via research (free/hobby-tier fit for a portfolio project)
- Husky + lint-staged pre-commit hooks (carries forward HOOKS-01)
- `CONTRIBUTING.md` (carries forward DOCS-CONTRIB-01)

**Locked decisions:** Research-first — hosting platform and Postgres provider are not pre-decided; the research phase compares options and the user picks before requirements lock. CD means real auto-deploy on merge to main, not a manual/staged release process.

**Why:** Portfolio project — v1.0-v1.2 proved product/domain depth, UI polish, and code hygiene; a working CI/CD pipeline plus a live deployment is the remaining piece an interviewer or tech lead would expect to see from a "professional engineering practices" showcase.

**Outcome:** Both phases shipped 2026-07-20 → 2026-07-22. Phase 14 (Pipeline & Hooks) complete 2026-07-20 — GitHub Actions CI (lint/typecheck/test/build) wired reusing `docker-compose.yml`'s Postgres, proved against a live PR (surfacing and fixing 3 real CI bugs), branch protection enforced on `main` after making the repo public, Husky + lint-staged pre-commit hooks shipped (with a real `set -e` trap bug fixed), `CONTRIBUTING.md` written, and an environment-gated `vercel-build` deploy script authored and locally verified. Phase 15 (Deploy & Verify) complete 2026-07-22 — `/api/health` DB-connectivity Route Handler shipped; Neon Postgres + Vercel provisioned; the live production deployment confirmed via Vercel CLI (not dashboard screenshots) to be built by the exact locked deploy script with zero PgBouncer errors; the rollback/promote mechanism live-exercised against real deployment IDs; and HEALTH-03 (the final requirement) confirmed via a genuine ~18.5h idle-window request. A milestone audit (2026-07-22) found and closed 4 doc/traceability gaps inline (stale README/CONTRIBUTING status text, a missing SUMMARY.md frontmatter block, a missing Phase 15 VERIFICATION.md) — none were functional gaps. Two non-blocking tech-debt items carried forward: `/api/health` has no CI regression coverage, and a spurious empty Vercel project from a `vercel link` mis-detection bug awaits manual deletion by the user.

</details>

<details>
<summary>v1.2 milestone details (shipped 2026-07-20)</summary>

**Goal:** Review and clean up the codebase — long/confusing files, stale comments, deprecated Tailwind v4 class names — and set up ESLint (`npm run lint`) as a first step toward demonstrating professional engineering hygiene to a tech lead or interviewer reviewing the repo.

**Target features:**
- ESLint configured (Next.js + TypeScript + Tailwind plugin), wired as a new `npm run lint` script alongside the existing `test`/`build`/`typecheck` scripts
- Fix deprecated Tailwind v3→v4 class names found across the codebase (`outline-none`→`outline-hidden` in 4 files, bare `rounded`→`rounded-sm` in 2 files)
- Full `src/` + `app/` sweep to break up long/confusing files — `ChartPanel.tsx` (560 lines) and `SandboxContainer.tsx` (280 lines) are the clear Sandbox outliers, plus a check of Hero/Gallery/domain files
- Codebase-wide comment cleanup: remove the 10 found comments referencing Phase/Plan/REQ-IDs, enforcing the existing "WHY only, no rotting task IDs" convention (established Phase 7) retroactively across files predating that convention

**Locked decisions:** Refactor/cleanup sweep covers all of `src/` + `app/`, not just Sandbox; lint tooling scope is a local `npm run lint` script only this milestone (no GitHub Actions CI — that's a candidate for a future milestone); no new user-facing features, no domain logic changes.

**Why:** Portfolio project — the app has shipped two milestones' worth of features; this milestone demonstrates the same engineering discipline (clean structure, clean lint, clean commit/comment hygiene) a tech lead would expect from a real collaborative codebase, ahead of using it as an interview artifact.

**Outcome:** All 4 phases shipped 2026-07-20. Phase 10 (ESLint Setup & Lint-Clean Baseline) complete 2026-07-19 — mid-execution, a real architectural blocker was found: `typescript-eslint`/`eslint-config-next` are incompatible with this project's locked TypeScript 7.0.2 (tsgo compiler) — no published version of either supports it. Resolved (user-approved) by bypassing to `@next/eslint-plugin-next` standalone + `@babel/eslint-parser` for syntax-only TS/TSX parsing, keeping TypeScript 7.0.2 locked as-is; type safety remains fully covered by the existing `npm run typecheck` script. `npm run lint` reaches a lint-clean baseline (0 errors) via a reviewed two-pass `eslint --fix` + `--fix --suppress-all`, plus two zero-dependency differentiators: a `no-restricted-imports` rule that lint-enforces the `src/domain/` architecture boundary (not just documents it), and a custom rule catching stale Phase/Plan/REQ-ID comment references. Code review caught and fixed a real regression during closeout: the lint-clean autofix pass silently changed the Sandbox chart border/save-banner corner radius ahead of Phase 11's planned, human-verified version of that exact change — restored and pinned against a repeat. Phase 11 (Tailwind Deprecated Class-Name Fixes) complete 2026-07-20 — applied the planned rename by hand across 6 files, removed the now-dead ESLint ignore pattern, closed with a human-verified browser walkthrough confirming no visual or keyboard-focus-outline regression — TWFX-01–04 validated, code review clean. Phase 12 (ChartPanel/SandboxContainer Decomposition Refactor) complete 2026-07-20 — both files decomposed into focused modules (geometry, derivation, resize hook, `useSandboxState()`, and a byte-for-byte `VesselGroup.tsx` extraction moved last per this project's two prior hit-testing-regression precedent), both landing under the ~150-200 line convention with zero behavior/hit-testing regression, human-confirmed. Phase 13 (Comment Cleanup) complete 2026-07-20 — stale Phase/Plan/REQ-ID comments rewritten by hand across 66 files preserving full WHY content; survived a session interruption mid-Wave-1 (6 killed worktree-executor agents) via manual orchestrator recovery with zero lost work; a broader re-grep pass (CMNT-02) caught additional real gaps the original scoping undercounted; human sign-off approved 2026-07-20 — CMNT-01/CMNT-02 complete.

</details>

<details>
<summary>v1.1 milestone details (shipped 2026-07-19)</summary>

**Shipped:** v1.1 UI Redesign (shadcn) — 2026-07-19. The entire front end was re-implemented against an imported Claude Design file using shadcn/ui + Tailwind, dark-mode only, across 4 branch+PR phases (Scaffolding, Hero, Sandbox, Gallery). Zero change to domain logic (`src/domain/`, `src/server/`) or the underlying functional requirements validated in v1.0 — this was a presentation-layer milestone. All 19/19 v1.1 requirements validated (SCAF-01–06, HERO-01–04, SBOX-01–05, GAL-01–04). The gallery is now embedded on the home page below the Sandbox, and the standalone `/gallery` route redirects to `/#gallery`, closing the placement todo carried over from v1.0.

**Goal:** Re-implement the existing app's front end against the imported Claude Design file ("COLREGS Navigator (shadcn).dc.html" — `claude.ai/design` project `c265c047-81a0-4446-bdf3-95d434adc3dc`) using shadcn/ui + Tailwind, with zero change to domain logic or existing validated requirements.

**Target features (4 phases, each its own branch + PR):**
- Scaffolding — shadcn/ui install + Tailwind theme tokens (dark palette, Geist fonts), Header/Nav, page shell (Header / Main / Footer), Footer
- Hero — Direction A hero section (headline, copy, CTAs, illustrative live-classification preview card)
- Sandbox — restyle the existing interactive chart/controls/reasoning-trail to match the design exactly, same domain wiring
- Gallery — gallery section embedded on the home page below Sandbox (closes the pending gallery-placement todo); `/gallery` route removed, redirects to `/#gallery`

**Locked decisions:** Hero Direction A (not the alternate "bridge display" variant); dark-mode only, no light theme/toggle; design followed exactly (colors, spacing, breakpoints at 900px/640px) using shadcn/ui as the component primitive layer.

**Progress:** All 4 phases complete (Scaffolding, Hero, Sandbox, Gallery) — milestone shipped 2026-07-19. Phase 9 (Gallery) embedded the curated encounter gallery as a home-page section below the Sandbox, removed the standalone `/gallery` route in favor of a `/#gallery` redirect (GAL-01–04 verified 4/4), and closed the pending gallery-placement todo carried over from v1.0.

</details>

## What This Is

COLREGS Navigator is a maritime collision-avoidance rules engine and visualizer. Users place two vessels on a nautical-chart-style sandbox — setting each vessel's position, heading, speed, and type — and the app classifies the encounter (head-on, crossing, or overtaking) under the International Regulations for Preventing Collisions at Sea (COLREGS Rules 11–18), determines which vessel must give way, and explains the verdict with the specific rule citation and the geometric reasoning (relative bearing, closing angle) behind it. It's a portfolio project aimed at software engineering interviews, demonstrating domain modeling depth (DDD-lite, rules-engine/state-machine design) on an unusual, memorable subject.

## Core Value

Given any two-vessel encounter, correctly classify it under COLREGS and clearly explain — not just assert — which vessel must give way and why. If this reasoning is wrong or opaque, nothing else about the project matters.

## Requirements

### Validated

- [x] User can place two vessels on a chart-style sandbox, setting position, heading, speed, and vessel type — Validated in Phase 4 (Interactive Chart Sandbox)
- [x] User can drag/adjust vessel position and heading and see the encounter classification update live — Validated in Phase 4 (Interactive Chart Sandbox)
- [x] App classifies the encounter as head-on, crossing, or overtaking per COLREGS Rules 11–18 — Logic validated in Phase 2 (COLREGS Rules Engine); user-facing/visible validation completed in Phase 4 once a UI existed to exercise it
- [x] App determines give-way vs. stand-on vessel, including vessel-type-based responsibilities (power-driven, sailing, fishing, restricted-in-ability-to-maneuver) per Rule 18 — Logic validated in Phase 2; visual give-way/stand-on distinction (color + role badges) validated in Phase 4
- [x] App displays a reasoning trail: the specific rule citation plus the geometric logic (relative bearing, closing angle) that produced the verdict — Validated in Phase 4 (Interactive Chart Sandbox); the reasoning panel renders both rule citations/prose AND each trail entry's raw geometric facts (relative bearing, TCPA, DCPA), not verdict-only
- [x] Visual chart rendering shows vessel positions, headings, and encounter geometry clearly — Validated in Phase 4 (Interactive Chart Sandbox)
- [x] User can save a scenario and get a shareable link (no login required) — Validated in Phase 5 (Save, Share & Gallery); confirmed end-to-end via live human verification
- [x] User can browse a curated gallery of preset classic encounters (e.g. textbook head-on, classic crossing, overtaking case) — Validated in Phase 5 (Save, Share & Gallery); gallery placement follow-up resolved in Phase 9 (Gallery) — the section is now embedded on the home page below the Sandbox, `/gallery` redirects to `/#gallery`
- [x] Codebase reaches a lint-clean baseline with an enforced `src/domain/` architecture boundary, no deprecated Tailwind v4 class names, decomposed Sandbox files, and no stale Phase/Plan/REQ-ID comment references — Validated in v1.2 Tech Debt & Stabilization (Phases 10-13), 22/22 requirements; see `.planning/milestones/v1.2-REQUIREMENTS.md`
- [x] GitHub Actions CI (lint/typecheck/test/build) required on every PR via branch protection, Husky + lint-staged pre-commit hooks, and `CONTRIBUTING.md` — Validated in v1.3 CI/CD & Deployment (Phase 14), 10/10 requirements
- [x] App is live on a real, publicly-reachable production URL (Vercel) backed by a provisioned production Postgres (Neon), with CD on merge to `main`, a `/api/health` DB-connectivity check, and a documented/live-exercised rollback path — Validated in v1.3 CI/CD & Deployment (Phase 15), 7/7 requirements; see `.planning/milestones/v1.3-REQUIREMENTS.md`

### Active

_Being scoped for the next milestone — see REQUIREMENTS.md once defined._

### Out of Scope

- Multi-vessel (3+) simultaneous conflict resolution — core value is proving the two-vessel rules engine is correct and explainable first; multi-vessel is a natural v2 extension
- Lights/shapes and sound-signal rules (Rules 19, 32–37, restricted visibility) — steering/sailing rules (11–18) are the richest domain-modeling showcase; broader rule coverage adds breadth without adding architectural depth
- Real AIS data ingestion/replay — sandbox scenarios (manual + presets) are sufficient to demonstrate the domain logic; live/historical data integration is a separate data-engineering concern
- User accounts / authentication — scenarios are shareable by link; auth would add surface area without strengthening the core value
- Employer/industry-specific framing — kept as a general maritime-rules showcase, not tied to any specific company or real incident

## Context

- **Purpose**: portfolio project intended to demonstrate senior/staff-level engineering practices (architecture, testing, git hygiene, documentation) to interviewers, built with AI-assisted development.
- **Domain source**: COLREGS (International Regulations for Preventing Collisions at Sea) — Rules 11–18 govern steering and sailing responsibilities between vessels in sight of one another. This is public, well-documented maritime law, not proprietary or company-specific.
- **Why this domain was chosen**: evaluated against 9 other candidate ideas (music theory voice-leading validator, SAR search-pattern planner, escape-room solvability engine, ATC sequencing simulator, orbital mission planner, fairy chess engine, D&D encounter balancer, whiskey substitution engine, ER triage allocator) on memorability, backend/frontend depth, scope fit, and interview value. COLREGS Navigator scored highest: it's a domain almost nobody builds a portfolio project around, and the core logic (classify encounter → determine obligations under a real published rulebook) is a textbook case for a rules-engine/state-machine domain layer — letting Clean Architecture/DDD-lite actually earn its keep rather than being over-engineering for a CRUD app.
- **Full engineering spec** (persona, workflow, practices) originally captured in `prompt.json` at repo root — see Constraints below for the concrete decisions pulled from it.
- **Current state**: Milestone v1.0 complete — Phase 5 (Save, Share & Gallery) was the final phase; all 6 requirements validated across 5 phases / 19 plans. Milestone v1.1 (UI Redesign) complete 2026-07-19 — all 4 phases done (Scaffolding, Hero, Sandbox, Gallery), 19/19 v1.1 requirements validated. Milestone v1.2 (Tech Debt & Stabilization) complete 2026-07-20 — all 4 phases done (ESLint Setup, Tailwind Fixes, Sandbox Refactor, Comment Cleanup), 22/22 v1.2 requirements validated. Milestone v1.3 (CI/CD & Deployment) complete 2026-07-22 — both phases done (Pipeline & Hooks, Deploy & Verify), 17/17 v1.3 requirements validated; app is live on Vercel with a provisioned Neon Postgres database, gated by a required GitHub Actions CI pipeline. No milestone currently active.
- **Known tech debt (carried from v1.3)**: `/api/health` has zero automated CI regression coverage (`vitest.config.ts` only globs `src/**/*.test.{ts,tsx}`, and the route lives outside `src/`); a spurious empty Vercel project (`agent-a5473b04789dea3ed`) from a `vercel link` mis-detection bug awaits manual deletion via the Vercel dashboard.

## Constraints

- **Tech stack**: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui (frontend); tRPC, Prisma, Zod (backend); PostgreSQL (database); Vitest + React Testing Library (testing) — set in advance by the user's project spec (`prompt.json`); shadcn/ui added in v1.1 as the component primitive layer for the redesign
- **Architecture style**: DDD-lite, Clean Architecture, Modular Monolith, feature-first organization — low coupling, high cohesion, explicit dependencies, composition over inheritance
- **Frontend separation of concerns** (added v1.1): presentation (JSX/markup), styling (Tailwind classes/tokens), and logic (hooks/state/domain calls) are kept in separate concerns within a component's file/folder — no inline style objects, no business logic in component bodies. shadcn/ui primitives are composed, not bypassed. Shared components, types, and design tokens live in one shared location reused across features (DRY) — before adding a new component/type, check the shared location first and reuse or extend rather than duplicating.
- **Engineering persona**: build as a Staff Full-Stack Engineer would — think before coding, favor simplicity over cleverness, justify every abstraction and dependency, comment only non-obvious code
- **Testing approach**: TDD where practical, focused on unit tests for business rules, domain logic, and utilities (the COLREGS rules engine is the highest-value test target)
- **Git workflow**: feature branches, small logical conventional commits; commit messages, branch names, and PR descriptions are AI-generated but human-reviewed
- **Documentation**: README, setup guide, architecture overview, Architecture Decision Records, API documentation, folder structure explanation, and design rationale are all expected deliverables
- **Scope discipline**: chosen as a "Focused" project — one sharp, well-executed core loop (classify → explain → visualize) rather than a broad multi-feature system, to maximize polish and demo quality over breadth

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Domain: maritime COLREGS collision-avoidance rules engine | Highest-scoring idea across 10 brainstormed concepts on memorability, domain-logic depth, and interview value; user works in ocean tech but chose to keep the project employer-agnostic | ✓ Good — shipped v1.0/v1.1, domain depth held up as the portfolio's core differentiator |
| Interaction model: scenario sandbox (place/drag vessels, live classification) | Chosen over time-stepped simulation and real-AIS-replay for tighter, more demoable scope | ✓ Good — validated in Phase 4 (v1.0), restyled unchanged in Phase 8 (v1.1) |
| Rule scope: COLREGS Rules 11–18 only (steering/sailing rules, 2 vessels) | Richest domain-modeling target without ballooning scope; lights/sound-signal rules and multi-vessel resolution deferred | ✓ Good — scope held through both milestones with no pressure to expand |
| Explainability is a first-class feature (rule citation + geometric reasoning shown, not just verdict) | Directly showcases domain-model transparency and reasoning, which is the whole point of the rules-engine architecture | ✓ Good — reasoning trail restyled (not rebuilt) in v1.1, same content/order preserved |
| Scenarios are saveable/shareable via link, backed by Postgres/Prisma/tRPC; no auth | Exercises the full backend stack end-to-end while keeping scope minimal — no user accounts needed for a link-shareable tool | ✓ Good — shipped end-to-end in Phase 5, unaffected by the v1.1 presentation redesign |
| Framed as a general maritime showcase, no employer/company tie-in | User's explicit choice — safest and most portable framing for a public portfolio piece | ✓ Good — held through v1.1, no employer-specific framing introduced |
| Rule 18's vessel-type hierarchy must never override Rule 13 overtaking verdicts | Rule 13(a) explicitly states it applies "notwithstanding anything contained in Rules 4 to 18" — a code-review pass on Phase 2 caught an initial implementation that applied Rule 18 uniformly to crossing AND overtaking, which would have produced a legally incorrect give-way verdict; fixed and regression-tested before phase close | Fixed in Phase 2 |
| SVG drag/rotate hit-targets must hit-test the actual visible shape, not a padded invisible proxy | Live human UAT on Phase 4 found dragging/rotating vessels "tricky" across two rounds of fixes — the root cause was that both the hull-drag rect and the rotate-handle circle used separate, independently-sized invisible hit-shapes, so their boundaries never matched what the user visually saw or could be reliably kept apart by picking numeric margins. The fix was structural, not numeric: attach pointer handlers directly to the visible, solid-filled shape itself (SVG's default `pointer-events: visiblePainted` hit-tests the real painted area for any non-`none` fill) so a gesture only starts where the pointer is genuinely over what the user sees. Relevant precedent if Phase 5 or later work adds more draggable/clickable chart elements. | Fixed in Phase 4 (commits `3bf6f24`, `f559e98`) |
| Decorative overlays layered on top of an interactive shape need explicit `pointer-events: none` | Phase 8's restyle re-verified this exact precedent from a new angle: adding a non-rotating letter/role-badge overlay on top of the vessel hull (for a fixed, always-upright label) reintroduced the same hit-testing regression class — the badge's own painted rect geometrically overlapped ~45px² of the hull's painted stern silhouette at heading 0 (the app's default seed), and being unhandled + solid-filled, silently captured pointerdown via SVG's default `pointer-events: visiblePainted`, blocking hull-drag gestures underneath it. Caught by automated code review (point-in-polygon check), not by the manual UAT pass that preceded it — human visual inspection alone did not catch a ~45px² dead zone. Any future decorative SVG overlay stacked on an interactive shape must get `pointer-events: none` explicitly, not by default. | Fixed in Phase 8 (commit `fb0ec8a`) |
| `next dev`/`next build` run via webpack (not Turbopack), with `resolve.extensionAlias` set in `next.config.ts` | Phase 5's final human-verify checkpoint was the first time anyone actually ran the dev server end-to-end — it failed immediately because neither Turbopack nor Next's default webpack resolves this codebase's `.js`-suffix-pointing-at-`.ts` relative-import convention (established Phase 1, ~98 imports across 37 files; tsc and Vitest both already resolve it fine, which is why the gap went unnoticed through 4 completed phases). Turbopack's own docs list `extensionAlias` as explicitly unsupported. User chose the smaller-blast-radius fix (2-file config change, keep the convention as-is) over rewriting all 98 imports to drop the `.js` suffix (bigger, cross-phase mechanical change, would have kept Turbopack) | Fixed in Phase 5 (commit `7beb689`) |
| v1.1 is a full front-end redesign against an imported Claude Design file, not a new-feature milestone | User adopted a design produced in `claude.ai/design` (project `c265c047-81a0-4446-bdf3-95d434adc3dc`, file "COLREGS Navigator (shadcn).dc.html") and asked for it implemented exactly, with shadcn/ui, split into 4 branch+PR phases (Scaffolding, Hero, Sandbox, Gallery). No REQ-IDs change — same validated requirements, new presentation layer | ✓ Good — all 4 phases shipped 2026-07-19, zero domain/`src/server/` changes, 19/19 v1.1 requirements validated |
| Hero ships as Direction A only (split headline + live-preview card); Direction B ("bridge display" full-bleed variant) is not built | The design file's two directions were an authoring-tool toggle for comparing options, not a runtime feature; user picked A as the shipped design | ✓ Good — HERO-01–04 verified in Phase 7, no request to revisit Direction B |
| `/gallery` route removed in favor of a `/#gallery` section embedded on the home page, with `/gallery` redirecting there | Closes the v1.0 pending todo about gallery placement; a redirect (not a hard 404) preserves any existing bookmarked links | ✓ Good — GAL-01–04 verified in Phase 9, redirect confirmed from both fresh-tab and in-app navigation |
| Dark-mode only, no light theme/toggle | The source design file only defines a dark palette (#09090B base, teal #2dd4bf accent); inventing a light palette would be scope beyond "follow the design exactly" | ✓ Good — SCAF-02 verified in Phase 6, held through all 4 phases with no toggle regressions |
| v1.2 is a tech-debt/hygiene milestone only — no new user-facing features, `classifyEncounter()` and all COLREGS rule outputs stayed byte-identical | User chose to demonstrate professional engineering hygiene (clean lint, clean file structure, clean comment/commit history) as a portfolio signal ahead of using the repo as an interview artifact | ✓ Good — shipped 2026-07-20, 22/22 v1.2 requirements validated, zero domain-logic change confirmed by unchanged test suite (216/216) throughout |
| `typescript-eslint`/`eslint-config-next` bypassed via `@next/eslint-plugin-next` + `@babel/eslint-parser` (syntax-only TS/TSX parsing) | Neither library supports this project's locked TypeScript 7.0.2 (tsgo compiler) — no published version of either does. Bypassing kept TypeScript 7.0.2 locked as-is; `npm run typecheck` still covers type safety | ✓ Good — Phase 10 lint-clean baseline reached with zero rule downgrades; documented as a known limitation |
| `VesselGroup.tsx` extracted last, as one atomic verbatim cut-paste, in the Phase 12 Sandbox refactor | This exact code (hull polygon, rotate-handle circle, badge overlay) caused two prior hit-testing regressions (Phase 4, Phase 8) — moving it as one unit rather than incrementally rewriting avoided a third | ✓ Good — Phase 12 closed with zero hit-testing regression, human-confirmed drag/rotate at heading 0 |
| GitHub Actions stays CI-only; CD is Vercel's native Git integration, not a 5th Actions deploy job | Avoids the "hand-rolled Actions deploy alongside host-native CD" anti-pattern identified in v1.3 research (duplicate builds/race conditions) | ✓ Good — CD-01/CD-02 shipped via Vercel's native integration, zero Actions deploy step added |
| Repo made public to unlock branch protection (over upgrading to GitHub Pro or deferring CI-05) | Free, unlocks required status checks immediately, fits the project's portfolio/interview purpose; verified no `.env` was ever tracked in git history before making the switch | ✓ Good — CI-05 verified live via `gh api` branch protection, no historical-secrets exposure |
| Neon's direct/unpooled connection string used for production `DATABASE_URL`, not the pooled one | `prisma migrate deploy` breaks against PgBouncer-pooled connections — a documented Neon+Prisma pitfall | ✓ Good — zero PgBouncer/prepared-statement errors in the live production build |
| Rollback runbook (HEALTH-04) live-exercised against real Vercel deployment IDs, not just documented | A written-but-untested rollback procedure is not credibly "verified" for a go-live milestone | ✓ Good — real rollback/promote cycle confirmed via `vercel inspect` timestamps showing no rebuild occurred |

## Next Milestone Goals

Deferred to v2+ (see `.planning/milestones/v1.0-REQUIREMENTS.md`, `.planning/milestones/v1.2-REQUIREMENTS.md`, and `.planning/milestones/v1.3-REQUIREMENTS.md` for full v2 lists and rationale):

- RSON-V2-01: ambiguous/edge-case scenarios in the curated gallery (near-boundary head-on/crossing, Rule 17(a)(ii) doubt situations)
- SCEN-V2-01: auto-generated social preview image (OG image) per shared scenario
- FMT-01: repo-wide Prettier reformatting pass (scoped to new/touched files only if pursued)
- RFCT-V2-01: `ChipRow.tsx` extraction and a `SandboxContainer` header-block split
- HEALTH-CI-01: add automated CI regression coverage for `/api/health` (currently invisible to `vitest.config.ts`'s `src/**` glob) — tech debt carried from v1.3
- DEPENDABOT-01: Dependabot config for automated dependency update PRs (deferred from v1.3)
- AUDIT-01: non-blocking `npm audit --audit-level=high` CI step (deferred from v1.3)
- ADR-CD-01: ADR entry documenting the CD-mechanism decision, host-native vs. Actions-driven deploy (deferred from v1.3)
- PREVIEW-01: PR preview deployments, free via Vercel's own git integration (deferred from v1.3)

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-25 after Phase 18 (On-Chart Vessel Control Overlay). v1.3 CI/CD & Deployment shipped 2026-07-22 — both phases (14-15) complete, 17/17 v1.3 requirements validated across 9 plans (2026-07-20 → 2026-07-22): GitHub Actions CI/CD, live Vercel+Neon deployment, Husky/lint-staged, and CONTRIBUTING.md, all verified against real infrastructure. v1.2 Tech Debt & Stabilization shipped 2026-07-20 — all 4 phases (10-13) complete, 22/22 v1.2 requirements validated across 18 plans (2026-07-19 → 2026-07-20). v1.0 shipped all 6 functional requirements across 5 phases / 19 plans (2026-07-14 → 2026-07-18); v1.1 re-implemented the entire front end against an imported Claude Design file using shadcn/ui across 4 branch+PR phases (2026-07-18 → 2026-07-19, 166 commits, 215 files changed), no functional/REQ-ID changes, presentation layer only, 19/19 requirements validated.*
