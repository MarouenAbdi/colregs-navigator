# Project Research Summary

**Project:** COLREGS Navigator
**Domain:** Maritime COLREGS collision-avoidance rules-engine + interactive 2D chart visualizer (portfolio project)
**Researched:** 2026-07-14
**Confidence:** MEDIUM-HIGH

## Executive Summary

COLREGS Navigator is a rules-engine-centric web app, not a CRUD app wearing a maritime skin — and the research across all four tracks converges on the same core message: the entire value of this portfolio project lives in a small, pure, framework-free domain layer (`src/domain/colregs/`) that classifies a two-vessel encounter (head-on/crossing/overtaking, Rules 12–15), applies the Rule 18 vessel-type hierarchy, and produces a structured reasoning trail — not just a verdict. Every other layer (Next.js/tRPC/Prisma UI and persistence) exists to expose that domain layer, never to contain it. The stack needed on top of the already-locked foundation (Next.js/React/TypeScript/Tailwind/tRPC/Prisma/Zod/Vitest/RTL) is deliberately minimal: native SVG + Pointer Events for the chart (not react-konva/canvas — this project has only ~2 vessels, nowhere near canvas's many-object performance threshold, and SVG is trivially testable with RTL), and hand-rolled trigonometry for bearing/CPA math (not geolib/turf — this is a synthetic flat-plane sandbox, not real-world geodesy, and the math itself is the portfolio's showcase content). No new rules-engine or state-machine library is warranted either — COLREGS 11–18 is fixed published law, not runtime-editable business rules, so a typed `classifyEncounter()` function with a Specification-pattern rule registry is both simpler and more testable than `json-rules-engine` or `xstate`.

The recommended architecture is Functional Core / Imperative Shell with Ports & Adapters: a zero-dependency domain layer callable from *both* the browser (for instant live-drag reclassification, no network round-trip) and the server (for authoritative re-classification before persistence) — this dual-callability is only possible if domain code never imports React, Next.js, tRPC, or `@prisma/client`. Persistence should store only raw scenario inputs (vessel position/heading/speed/type) and always recompute the verdict on read, never store the derived verdict as a second source of truth. Build order should be strictly dependency-driven: domain layer and its unit tests first (fully verified against textbook fixtures before any UI exists), then infrastructure/application/tRPC, then the UI sandbox wired directly to the domain layer, then persistence/sharing, then the gallery last (since presets are just seeded scenarios reusing the same model).

The single largest risk is getting the COLREGS domain logic subtly wrong in ways that look plausible but are legally/nautically incorrect — this is where pitfalls research is most load-bearing. The most dangerous failure modes are: classifying by heading-difference instead of relative bearing (Pitfall 1), evaluating head-on/crossing before overtaking despite Rule 13's explicit precedence (Pitfall 2), treating COLREGS's explicit "in doubt, assume the cautious case" clauses as hard floating-point cutoffs instead of a first-class ambiguous-zone concept (Pitfall 3), and skipping the Rule 7 risk-of-collision precondition so that diverging/parallel vessels get a confident (wrong) give-way verdict (Pitfall 4). All four are domain-modeling-phase decisions that must be made correctly before writing a single UI component — retrofitting them later is a rewrite, not a patch, especially since explainability (Pitfall 8) requires the reasoning trail to be a byproduct of rule evaluation from day one, not reverse-engineered from a final label afterward.

## Key Findings

### Recommended Stack

The locked stack (Next.js 16, React 19, TypeScript 7, Tailwind 4, tRPC 11, Prisma 7, Zod 4, Vitest 4, RTL 16) needs almost nothing added on top of it — the deliberate, high-confidence recommendation is to build the chart and geometry layers on native browser APIs and hand-written TypeScript rather than adding dependencies. See `.planning/research/STACK.md` for full detail.

**Core technologies (on top of the locked stack):**
- Native SVG + Pointer Events (no library): chart rendering + draggable vessel icons — SVG is real DOM, so RTL/`@testing-library/user-event` can test it directly; canvas (react-konva) is opaque pixels and only pays off at object counts far beyond this project's 2 vessels
- Hand-rolled `src/domain/geometry/` module (no `geolib`/`@turf/turf`): bearing/relative-bearing/CPA-TCPA math as pure, unit-tested TypeScript — this is a synthetic flat-plane sandbox, not real-world geodesy, and the math is the portfolio's core showcase content
- Plain TypeScript + Zod domain layer (no `json-rules-engine`/`xstate`): COLREGS 11–18 is fixed published law needing type-safety and traceability, not runtime-editable rules or time-based state transitions
- `@testing-library/user-event` (dev dependency): simulates pointer-drag sequences against SVG elements in tests
- `zustand` / `nanoid`: optional, add only if cross-panel prop drilling or short shareable slugs become real needs — start without both

**Critical caveat:** `jsdom` (Vitest's DOM environment) does not implement `SVGElement.getScreenCTM()`/`getBBox()` — the screen↔chart coordinate transform must be written as a pure, DOM-API-free function and unit-tested directly, never called from component code in a way that hits this limitation.

### Expected Features

See `.planning/research/FEATURES.md` for the full landscape, competitor analysis, and dependency graph.

**Must have (table stakes, v1):**
- Per-vessel setup: position, heading, speed, type (two vessels)
- Live encounter classification (head-on/crossing/overtaking, Rules 12–15) with instant feedback on parameter change
- Give-way/stand-on determination, clearly labeled, with rule citation shown
- Reasoning trail: rule citation + geometric explanation (relative bearing, closing angle) in text
- Visual chart rendering with vessel position/heading and basic bearing indicator
- Live drag-and-adjust with real-time reclassification
- Save scenario + shareable link, no login
- Curated gallery of 5–8 classic preset encounters

**Should have (differentiators, v1.x):**
- Rule 18 vessel-type hierarchy (sailing, fishing, restricted-in-ability-to-maneuver overrides) — add once the power-driven baseline is solid
- Geometric overlay drawn directly on the chart (bearing line, overtaking boundary arc), not just described in text
- Deep-link social preview (OG image) for portfolio/resume distribution
- Edge-case/ambiguous scenarios in the gallery (near-boundary head-on/crossing, Rule 17(a)(ii) doubt situations)

**Defer (v2+, explicitly out of scope per PROJECT.md):**
- Multi-vessel (3+) conflict resolution
- Lights/shapes/sound-signal and restricted-visibility rules (Rules 19, 32–37)
- Real AIS data ingestion/replay
- User accounts/auth
- Gamification/scoring (actively conflicts with the reasoning-trail-first UX this project is built around)

### Architecture Approach

See `.planning/research/ARCHITECTURE.md` for the full system diagram, project structure, and data flows. The recommended shape is Clean Architecture / DDD-lite / Modular Monolith with a Functional Core, Imperative Shell split: a pure, zero-dependency domain layer (`src/domain/colregs/`) is called directly from the browser for live classification (no network) and from tRPC/application-layer code for authoritative server-side re-classification before persistence — the same functions, both places. This is the load-bearing architectural decision: if domain code ever imports `next/*`, `react`, or `@prisma/client`, live client-side reclassification breaks.

**Major components:**
1. **Domain layer** (`domain/colregs/`) — entities/value objects (Vessel, Position, Heading, VesselType), geometry (bearing, CPA/TCPA), rules (one file per COLREGS rule as a Specification with `applies()`/`explain()`), and a `classifyEncounter()` orchestrator returning a `ClassificationResult` with an ordered reasoning trail
2. **Application layer** (`application/`) — use cases (`createScenario`, `getScenario`, `listPresets`) that validate input, re-run domain classification server-side, and call a repository via a port interface (dependency inversion, never importing Prisma directly)
3. **Infrastructure** (`infrastructure/`) — `PrismaScenarioRepository` implementing the domain-owned repository interface, plus row↔entity mappers
4. **Interface adapters** (`server/routers/`) — thin tRPC routers (Zod-validated input, one call into the application layer, no business logic)
5. **UI** (`app/`) — chart canvas, vessel control panel, reasoning trail panel; client components call the domain layer directly for live feedback, and the tRPC client only for persistence/loading

**Suggested build order (dependency-driven):** domain layer + unit tests → Prisma schema + repository → application use cases → tRPC routers → UI sandbox (wired to domain directly) → persistence/share UI → gallery (last, since presets reuse the same scenario model).

### Critical Pitfalls

See `.planning/research/PITFALLS.md` for all 10 pitfalls plus technical debt, integration, performance, security, and UX tables. Top risks, in order of how early they must be decided:

1. **Heading-difference vs. relative-bearing confusion** — classification must be built on relative-bearing-of-B-from-A and relative-bearing-of-A-from-B as independently computed, independently tested primitives; heading-difference alone silently misclassifies both head-on and overtaking cases. Avoid by writing and unit-testing the geometry primitives before any classification rule.
2. **Wrong rule evaluation order** — Rule 13 (overtaking) explicitly overrides Rules 14/15 and must be evaluated first, using relative bearing only; a classifier structured as `if headOn() else if crossing() else overtaking()` will misclassify legitimate overtaking situations as crossing. Also implement the "sticky" rule: an established overtaking situation must not flip to crossing later even if bearing drifts.
3. **Doubt/boundary handling treated as exact thresholds** — COLREGS explicitly requires "if in doubt, assume the more cautious classification" near the 22.5°-abaft-beam and reciprocal-heading boundaries; naive hard cutoffs cause verdict "flicker" during live drag and omit the ambiguous-zone concept the reasoning trail is supposed to surface. Model doubt bands as first-class domain concepts from the start.
4. **Missing Rule 7 (risk-of-collision) gating** — classifying encounters without first checking whether the vessels are actually converging (CPA/TCPA or bearing-rate) produces confident-but-nonsensical give-way verdicts for diverging/parallel vessels. Decide explicitly (recommended: yes, minimal version) before building the classification pipeline.
5. **Explainability bolted on instead of designed in** — the reasoning trail must be a byproduct of the same rule-evaluation code path that produces the verdict (structured `RuleEvaluation` objects with rule id, matched facts, and threshold), not a separate function re-deriving text from a final label. This is a domain-model return-type decision, not a UI feature.

Also notable: Rule 18 must treat "not under command" and "restricted in ability to maneuver" as co-equal (not strictly ranked), and must never override an overtaking classification; degenerate inputs (identical position, zero speed, exact boundary angles) need explicit defined behavior since a free-drag sandbox will produce them constantly; compass-bearing vs. math-angle vs. screen-Y-down conventions must be isolated behind small, independently tested pure converter functions; and the domain layer must have zero imports from `@prisma/client` or `@trpc/*` so its test suite never needs a database or tRPC context.

## Implications for Roadmap

### Phase 1: Domain Foundations — Geometry Primitives + Value Objects
**Rationale:** Everything else in the product (classification, reasoning trail, chart overlay) depends on correct bearing/relative-bearing/CPA math and well-formed value objects (Vessel, Position, Heading, VesselType). Getting this wrong is the highest-cost-to-fix mistake in the whole project (Pitfall 1, 6, 7), so it must be built and fully unit-tested in isolation before any classification logic or UI exists.
**Delivers:** `Position`, `Heading`, `Speed`, `VesselType` value objects; `bearing()`, `relativeBearing()`, CPA/TCPA functions; compass↔math↔screen angle converters — all pure, zero framework dependencies, fixture-tested against known values (North=0°=up, reciprocal-heading-but-off-axis-bearing is NOT head-on, etc.)
**Addresses:** Vessel setup feature (FEATURES.md P1)
**Avoids:** Pitfall 1 (heading-diff vs. relative-bearing), Pitfall 6 (angle convention mismatch), Pitfall 7 (degenerate inputs — identical position, zero speed, exact boundary angles)

### Phase 2: COLREGS Rules Engine — Classification, Give-Way/Stand-On, Rule 18
**Rationale:** With geometry primitives verified, the classification pipeline (Rules 11–18) can be built as a Specification-pattern rule registry evaluated in the legally-correct order (overtaking first, per Rule 13's override clause), returning structured reasoning facts rather than a bare verdict. This is the core value proposition of the entire project and must be validated against textbook fixtures before any UI consumes it.
**Delivers:** `classifyEncounter(scenario): ClassificationResult` with ordered `ReasoningStep[]`; Rule 7 risk-of-collision gate; Rule 13/14/15 encounter classification; Rule 18 vessel-type override layer with NUC/RAM modeled as co-equal; explicit doubt-zone/ambiguous-classification state
**Addresses:** Encounter classification, give-way/stand-on determination, Rule 18 hierarchy, reasoning trail data model (FEATURES.md P1/P2)
**Avoids:** Pitfall 2 (evaluation order), Pitfall 3 (doubt/boundary handling), Pitfall 4 (Rule 7 gating), Pitfall 5 (Rule 18 strict-ranking mistake), Pitfall 8 (explainability designed in, not bolted on), Pitfall 10 (domain coupled to tRPC/Prisma — enforce zero imports from either)

### Phase 3: Persistence Layer — Prisma Schema, Repository, Application Use Cases
**Rationale:** Can be built and integration-tested independently of the UI, satisfying the `ScenarioRepository` port already implied by the domain/application boundary. Comes before the UI so the "save & share" and "load scenario" flows have a real backend to wire into once the sandbox exists.
**Delivers:** Prisma schema (scenario inputs only — position/heading/speed/type — never the derived verdict); `PrismaScenarioRepository`; `createScenario`/`getScenario`/`listPresets` use cases with in-memory-fake-repository unit tests; non-guessable share-slug IDs (UUID/cuid, not sequential)
**Uses:** Prisma, PostgreSQL, Zod (API-boundary validation only, not domain typing) from STACK.md
**Implements:** Ports & Adapters / Repository pattern from ARCHITECTURE.md; avoids Anti-Pattern 2 (persisting derived verdict instead of inputs) and the sequential-ID security mistake from PITFALLS.md

### Phase 4: tRPC API Layer — Thin Routers Over Application Use Cases
**Rationale:** Once use cases exist and are tested, the tRPC routers are a thin, low-risk adapter layer (Zod input validation → one use-case call → typed response). Sequencing this after Phase 3 keeps routers free of business logic per Anti-Pattern 1.
**Delivers:** `scenario` and `gallery` routers merged into `appRouter`; Zod schemas at the API boundary distinct from internal domain types
**Uses:** tRPC 11, Zod 4 (STACK.md); Interface Adapters layer (ARCHITECTURE.md)
**Avoids:** Pitfall 10 / Anti-Pattern 1 (classification logic leaking into router handlers)

### Phase 5: Interactive Chart Sandbox — SVG Rendering + Live Drag Classification
**Rationale:** This is where the "live update while dragging" requirement — the main interaction loop and a stated PROJECT.md differentiator — gets built and demoed, using the domain layer directly (Flow 1, no network round-trip). Deliberately sequenced after the domain/rules engine is proven correct in isolation, so the UI is exercising known-good logic rather than co-developing both at once.
**Delivers:** SVG chart canvas with vessel icons, heading vectors, bearing line; native Pointer Events drag handling with `screenToChart()`/`chartToScreen()` pure converters; `use-live-classification` hook wrapping `classifyEncounter()` for React state; reasoning trail panel; give-way/stand-on visual role coding
**Addresses:** Visual chart rendering, live drag-and-adjust, reasoning trail UI (FEATURES.md P1)
**Avoids:** Pitfall 9 (drag re-triggering persistence/over-computation every frame — keep drag position as local/ref state, throttle via rAF, decouple from any network call), Pitfall 6 (verify rendered vessel direction matches stated heading), the SSR/hydration gotcha (guard canvas/drag-dependent rendering behind client-only mounting)

### Phase 6: Save/Share + Gallery
**Rationale:** Depends on both the persistence layer (Phase 3/4) and the working sandbox (Phase 5) already existing. Presets are modeled as seeded, flagged scenarios reusing the exact same save/load mechanism — not a separate feature — so this is naturally last and lowest-risk.
**Delivers:** "Save & Share" button → tRPC mutation → shareable `/s/[id]` link (Flow 2/3, server always re-classifies on load, never trusts a stored verdict); curated gallery of 5–8 classic preset encounters with short rationale text per entry
**Addresses:** Save/share scenario, curated preset gallery (FEATURES.md P1)
**Avoids:** Anti-Pattern 2 (stale verdict drift — always recompute on load)

### Phase Ordering Rationale

- Domain correctness (geometry → classification) is strictly upstream of everything else technically and is also the highest interview-value, highest-risk-of-subtle-bugs work — front-loading it means the riskiest logic is validated against textbook fixtures before any UI or persistence complexity is layered on top.
- Persistence and API layers are conventional, low-risk CRUD-shaped work once ports/interfaces are defined — sequencing them before the UI means the "save & share" flow has a real backend the moment the sandbox needs it, without blocking sandbox development on backend work.
- The interactive chart is sequenced after the domain layer specifically so live-drag feedback (Pitfall 9) and rendering-direction correctness (Pitfall 6) can be verified against an already-correct classification engine, rather than debugging domain bugs and UI bugs simultaneously.
- Gallery/presets are explicitly last because FEATURES.md's dependency graph shows presets are not a separate data model — they require save/share to exist first (seeded scenarios flagged as featured).

### Research Flags

Phases likely needing deeper research during planning (`/gsd:plan-phase --research-phase <N>`):
- **Phase 2 (Rules Engine):** COLREGS-specific implementation pitfalls are well-documented at a conceptual level (PITFALLS.md) but exact sector-boundary conventions, doubt-band widths, and the precise Rule 7 risk-of-collision test used in practice are MEDIUM confidence and worth validating against a textbook worked example or the official Navigation Rules text during planning, not just architecture review.
- **Phase 5 (Interactive Chart):** The SVG+Pointer-Events approach and the `jsdom`/`getScreenCTM()` testing caveat are well-researched, but the exact drag-gesture implementation (native `document` listeners vs. React synthetic handlers, throttling strategy) benefits from a focused look at current React 19 + Pointer Events patterns during phase planning.

Phases with standard, well-documented patterns (skip research-phase):
- **Phase 1 (Geometry Primitives):** Standard nautical trigonometry, cross-verified across multiple sources — implementation-ready.
- **Phase 3 (Persistence) / Phase 4 (tRPC API):** Conventional Clean Architecture + tRPC + Prisma patterns, HIGH confidence, official docs available via Context7 (`/trpc/trpc`).
- **Phase 6 (Save/Share + Gallery):** Straightforward extension of the persistence layer; no novel technical risk.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Versions verified live from npm registry; the "don't add a dependency" recommendations (SVG over konva, hand-rolled geometry over geolib/turf, plain TS over json-rules-engine/xstate) are cross-checked across multiple 2025/2026 comparison sources and GitHub issues |
| Features | MEDIUM-HIGH | COLREGS rule content itself is HIGH confidence (public law, cross-verified); competitor/UX feature patterns are MEDIUM — this exact "explainable rules-engine visualizer" sub-category has few direct comparables, so some conclusions are inferred by analogy to adjacent sandbox-tool categories (Algorithm Visualizer, regex101) |
| Architecture | HIGH for layering/dependency-direction (verified against multiple Clean Architecture + Next.js/tRPC/Prisma reference implementations and official tRPC docs) / MEDIUM for COLREGS-specific module decomposition (sound application of standard patterns, but no comparable open-source reference project exists for this exact domain) |
| Pitfalls | MEDIUM-HIGH | COLREGS rule semantics (Pitfalls 1–5) are HIGH confidence, sourced from multiple maritime training/reference sites that independently agree, plus ScienceDirect literature documenting real systematic implementation failures; software-architecture/UI pitfalls (6–10) are MEDIUM, sourced from community engineering writing rather than a single authoritative spec |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Exact CPA/TCPA and Rule 7 risk-of-collision formula:** cross-checked against standard relative-velocity vector math (well-established) but sourced from a single blog reference for the exact formula presentation — validate against a known textbook worked example during Phase 2 implementation before trusting it as the authoritative gate.
- **`@testing-library/user-event` exact version:** registry lookup was interrupted mid-research (STACK.md); verify the installed version supports the `pointer()` API needed for SVG drag-simulation tests at install time in Phase 5.
- **Doubt-band width for the "in doubt, assume cautious" clauses:** COLREGS text mandates the behavior but doesn't specify a numeric tolerance band around 22.5°/reciprocal-heading — this is a product/domain decision to make explicitly during Phase 2 planning (document the chosen epsilon as a named, tested domain constant, not an implicit side effect of comparison operators).
- **Sector-boundary implementation conventions:** MEDIUM confidence per ARCHITECTURE.md sources — cross-referenced against ShipCalculators.com and academic literature, but worth a focused validation pass against the official Navigation Rules PDF during Phase 2 planning, given documented real-world implementation pitfalls (e.g., using COG instead of heading).

## Sources

### Primary (HIGH confidence)
- npm registry (`npm view <pkg> version`) — live version numbers, STACK.md
- Context7 `/trpc/trpc` — official tRPC project structure and router patterns, ARCHITECTURE.md
- [US DHS/USCG Navigation Rules PDF](https://www.navcen.uscg.gov/sites/default/files/pdf/navRules/navrules.pdf) — official regulatory text, FEATURES.md
- [testing-library/react-testing-library#1116](https://github.com/testing-library/react-testing-library/issues/1116) — `getScreenCTM` jsdom limitation, STACK.md
- [Reliability of maritime collision avoidance systems algorithms — ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0951832025010403) — documented real implementation failure patterns, PITFALLS.md

### Secondary (MEDIUM confidence)
- [Clean Architecture in Practice with TypeScript, Prisma, Next.js — Arnaud Renaud](https://www.arnaudrenaud.com/articles/clean-architecture-typescript-prisma-next/) — layering pattern, STACK.md + ARCHITECTURE.md
- [nikolovlazar/nextjs-clean-architecture (GitHub)](https://github.com/nikolovlazar/nextjs-clean-architecture) — reference implementation, ARCHITECTURE.md
- [Rule 18: not a simple "pecking order" — Professional Mariner](https://professionalmariner.com/rule-18-not-a-simple-pecking-order/) — NUC/RAM co-equal status, PITFALLS.md
- [Rule 7 COLREGS Risk of Collision — Marine Public](https://www.marinepublic.com/blogs/training/575092-rule-7-colregs-risk-of-collision-with-explanations) — risk-of-collision precondition, PITFALLS.md
- [SkipperCheck](https://skippercheck.net/colreg-simulator) / [Columbia COLREGs Challenge](https://smartmaritimenetwork.com/2025/07/29/columbia-launches-gamified-colregs-training-app/) — competitor analysis, FEATURES.md
- [CPA & TCPA Explained — Binnacle AI](https://binnacleai.com/blog/cpa-tcpa-explained) — CPA/TCPA formula background, STACK.md

### Tertiary (LOW confidence)
- [ColRegs Collaborative VR Training](https://chaac.tech/solutions/military-immersive-training/colregs-collaborative) — vendor marketing page, not independently verified, FEATURES.md
- [Fabric.js vs Konva vs PixiJS 2026 comparison](https://www.pkgpulse.com/guides/fabricjs-vs-konva-vs-pixijs-canvas-2d-graphics-2026) — single-source comparison, STACK.md

---
*Research completed: 2026-07-14*
*Ready for roadmap: yes*
