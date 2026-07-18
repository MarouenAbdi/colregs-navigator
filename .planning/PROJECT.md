# COLREGS Navigator

## Current Milestone: v1.1 UI Redesign (shadcn)

**Goal:** Re-implement the existing app's front end against the imported Claude Design file ("COLREGS Navigator (shadcn).dc.html" — `claude.ai/design` project `c265c047-81a0-4446-bdf3-95d434adc3dc`) using shadcn/ui + Tailwind, with zero change to domain logic or existing validated requirements.

**Target features (4 phases, each its own branch + PR):**
- Scaffolding — shadcn/ui install + Tailwind theme tokens (dark palette, Geist fonts), Header/Nav, page shell (Header / Main / Footer), Footer
- Hero — Direction A hero section (headline, copy, CTAs, illustrative live-classification preview card)
- Sandbox — restyle the existing interactive chart/controls/reasoning-trail to match the design exactly, same domain wiring
- Gallery — gallery section embedded on the home page below Sandbox (closes the pending gallery-placement todo); `/gallery` route removed, redirects to `/#gallery`

**Locked decisions:** Hero Direction A (not the alternate "bridge display" variant); dark-mode only, no light theme/toggle; design followed exactly (colors, spacing, breakpoints at 900px/640px) using shadcn/ui as the component primitive layer.

**Progress:** Phase 6 (Scaffolding) complete — shadcn/ui installed (Radix base), dark-only design tokens locked in `app/globals.css`, Geist/Geist Mono fonts loaded app-wide, sticky Header/Footer page shell wraps every route. Human-verified in a real browser (dark render under light OS preference, 640px nav collapse, computed font-family, Source link). Next: Phase 7 (Hero).

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
- [x] User can browse a curated gallery of preset classic encounters (e.g. textbook head-on, classic crossing, overtaking case) — Validated in Phase 5 (Save, Share & Gallery); gallery page placement (currently its own `/gallery` route) has an open follow-up to embed it on the home page instead — tracked as a todo, not a validation gap

### Active

_None — all requirements validated as of Phase 5, the milestone's final phase._

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
- **Current state**: Milestone v1.0 complete — Phase 5 (Save, Share & Gallery) was the final phase; all 6 requirements validated across 5 phases / 19 plans. Milestone v1.1 (UI Redesign) started 2026-07-18.

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
| Domain: maritime COLREGS collision-avoidance rules engine | Highest-scoring idea across 10 brainstormed concepts on memorability, domain-logic depth, and interview value; user works in ocean tech but chose to keep the project employer-agnostic | — Pending |
| Interaction model: scenario sandbox (place/drag vessels, live classification) | Chosen over time-stepped simulation and real-AIS-replay for tighter, more demoable scope | — Pending |
| Rule scope: COLREGS Rules 11–18 only (steering/sailing rules, 2 vessels) | Richest domain-modeling target without ballooning scope; lights/sound-signal rules and multi-vessel resolution deferred | — Pending |
| Explainability is a first-class feature (rule citation + geometric reasoning shown, not just verdict) | Directly showcases domain-model transparency and reasoning, which is the whole point of the rules-engine architecture | — Pending |
| Scenarios are saveable/shareable via link, backed by Postgres/Prisma/tRPC; no auth | Exercises the full backend stack end-to-end while keeping scope minimal — no user accounts needed for a link-shareable tool | — Pending |
| Framed as a general maritime showcase, no employer/company tie-in | User's explicit choice — safest and most portable framing for a public portfolio piece | — Pending |
| Rule 18's vessel-type hierarchy must never override Rule 13 overtaking verdicts | Rule 13(a) explicitly states it applies "notwithstanding anything contained in Rules 4 to 18" — a code-review pass on Phase 2 caught an initial implementation that applied Rule 18 uniformly to crossing AND overtaking, which would have produced a legally incorrect give-way verdict; fixed and regression-tested before phase close | Fixed in Phase 2 |
| SVG drag/rotate hit-targets must hit-test the actual visible shape, not a padded invisible proxy | Live human UAT on Phase 4 found dragging/rotating vessels "tricky" across two rounds of fixes — the root cause was that both the hull-drag rect and the rotate-handle circle used separate, independently-sized invisible hit-shapes, so their boundaries never matched what the user visually saw or could be reliably kept apart by picking numeric margins. The fix was structural, not numeric: attach pointer handlers directly to the visible, solid-filled shape itself (SVG's default `pointer-events: visiblePainted` hit-tests the real painted area for any non-`none` fill) so a gesture only starts where the pointer is genuinely over what the user sees. Relevant precedent if Phase 5 or later work adds more draggable/clickable chart elements. | Fixed in Phase 4 (commits `3bf6f24`, `f559e98`) |
| `next dev`/`next build` run via webpack (not Turbopack), with `resolve.extensionAlias` set in `next.config.ts` | Phase 5's final human-verify checkpoint was the first time anyone actually ran the dev server end-to-end — it failed immediately because neither Turbopack nor Next's default webpack resolves this codebase's `.js`-suffix-pointing-at-`.ts` relative-import convention (established Phase 1, ~98 imports across 37 files; tsc and Vitest both already resolve it fine, which is why the gap went unnoticed through 4 completed phases). Turbopack's own docs list `extensionAlias` as explicitly unsupported. User chose the smaller-blast-radius fix (2-file config change, keep the convention as-is) over rewriting all 98 imports to drop the `.js` suffix (bigger, cross-phase mechanical change, would have kept Turbopack) | Fixed in Phase 5 (commit `7beb689`) |
| v1.1 is a full front-end redesign against an imported Claude Design file, not a new-feature milestone | User adopted a design produced in `claude.ai/design` (project `c265c047-81a0-4446-bdf3-95d434adc3dc`, file "COLREGS Navigator (shadcn).dc.html") and asked for it implemented exactly, with shadcn/ui, split into 4 branch+PR phases (Scaffolding, Hero, Sandbox, Gallery). No REQ-IDs change — same validated requirements, new presentation layer | Pending |
| Hero ships as Direction A only (split headline + live-preview card); Direction B ("bridge display" full-bleed variant) is not built | The design file's two directions were an authoring-tool toggle for comparing options, not a runtime feature; user picked A as the shipped design | Pending |
| `/gallery` route removed in favor of a `/#gallery` section embedded on the home page, with `/gallery` redirecting there | Closes the v1.0 pending todo about gallery placement; a redirect (not a hard 404) preserves any existing bookmarked links | Pending |
| Dark-mode only, no light theme/toggle | The source design file only defines a dark palette (#09090B base, teal #2dd4bf accent); inventing a light palette would be scope beyond "follow the design exactly" | Pending |

## Next Milestone Goals

Deferred to v1.2+ (see `.planning/milestones/v1.0-REQUIREMENTS.md` for full v2 list and rationale):

- RSON-V2-01: ambiguous/edge-case scenarios in the curated gallery (near-boundary head-on/crossing, Rule 17(a)(ii) doubt situations)
- SCEN-V2-01: auto-generated social preview image (OG image) per shared scenario

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
*Last updated: 2026-07-18 — Phase 6 (Scaffolding) complete: shadcn/ui, dark-only tokens, Geist fonts, Header/Footer shell (SCAF-01–06 validated). v1.0 shipped all 6 requirements across 5 phases / 19 plans (Save/Share/Gallery flow confirmed via live human verification; webpack `extensionAlias` fix for the `.js`-suffix import convention). v1.1 re-implements the entire front end against an imported Claude Design file using shadcn/ui, in 4 branch+PR phases (Scaffolding, Hero, Sandbox, Gallery) — no functional/REQ-ID changes, presentation layer only.*
