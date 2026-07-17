# COLREGS Navigator

## What This Is

COLREGS Navigator is a maritime collision-avoidance rules engine and visualizer. Users place two vessels on a nautical-chart-style sandbox — setting each vessel's position, heading, speed, and type — and the app classifies the encounter (head-on, crossing, or overtaking) under the International Regulations for Preventing Collisions at Sea (COLREGS Rules 11–18), determines which vessel must give way, and explains the verdict with the specific rule citation and the geometric reasoning (relative bearing, closing angle) behind it. It's a portfolio project aimed at software engineering interviews, demonstrating domain modeling depth (DDD-lite, rules-engine/state-machine design) on an unusual, memorable subject.

## Core Value

Given any two-vessel encounter, correctly classify it under COLREGS and clearly explain — not just assert — which vessel must give way and why. If this reasoning is wrong or opaque, nothing else about the project matters.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can place two vessels on a chart-style sandbox, setting position, heading, speed, and vessel type
- [ ] User can drag/adjust vessel position and heading and see the encounter classification update live
- [ ] App classifies the encounter as head-on, crossing, or overtaking per COLREGS Rules 11–18
- [ ] App determines give-way vs. stand-on vessel, including vessel-type-based responsibilities (power-driven, sailing, fishing, restricted-in-ability-to-maneuver) per Rule 18
- [ ] App displays a reasoning trail: the specific rule citation plus the geometric logic (relative bearing, closing angle) that produced the verdict
- [ ] User can save a scenario and get a shareable link (no login required)
- [ ] User can browse a curated gallery of preset classic encounters (e.g. textbook head-on, classic crossing, overtaking case)
- [ ] Visual chart rendering shows vessel positions, headings, and encounter geometry clearly

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

## Constraints

- **Tech stack**: Next.js, React, TypeScript, Tailwind CSS (frontend); tRPC, Prisma, Zod (backend); PostgreSQL (database); Vitest + React Testing Library (testing) — set in advance by the user's project spec (`prompt.json`)
- **Architecture style**: DDD-lite, Clean Architecture, Modular Monolith, feature-first organization — low coupling, high cohesion, explicit dependencies, composition over inheritance
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
*Last updated: 2026-07-16 after Phase 2 (COLREGS Rules Engine) completion — the core `classifyEncounter()` rules engine (head-on/crossing/overtaking classification, Rule 7 risk gate, Rule 18 vessel-type hierarchy, reasoning trail) is implemented and fixture-tested (100/100 tests passing), still internal-only with no UI/persistence wired up yet. A critical Rule 18/overtaking precedence bug (Rule 13(a) requires overtaking to override Rules 4–18) was caught by code review and fixed before close, with a regression test added; two review-fix items remain flagged for human maintainer sign-off (see 02-HUMAN-UAT.md). Active requirements remain unvalidated until their owning UI/persistence phases (3–5) land.*
