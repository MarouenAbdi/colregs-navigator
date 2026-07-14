<!-- GSD:project-start source:PROJECT.md -->
## Project

**COLREGS Navigator**

COLREGS Navigator is a maritime collision-avoidance rules engine and visualizer. Users place two vessels on a nautical-chart-style sandbox — setting each vessel's position, heading, speed, and type — and the app classifies the encounter (head-on, crossing, or overtaking) under the International Regulations for Preventing Collisions at Sea (COLREGS Rules 11–18), determines which vessel must give way, and explains the verdict with the specific rule citation and the geometric reasoning (relative bearing, closing angle) behind it. It's a portfolio project aimed at software engineering interviews, demonstrating domain modeling depth (DDD-lite, rules-engine/state-machine design) on an unusual, memorable subject.

**Core Value:** Given any two-vessel encounter, correctly classify it under COLREGS and clearly explain — not just assert — which vessel must give way and why. If this reasoning is wrong or opaque, nothing else about the project matters.

### Constraints

- **Tech stack**: Next.js, React, TypeScript, Tailwind CSS (frontend); tRPC, Prisma, Zod (backend); PostgreSQL (database); Vitest + React Testing Library (testing) — set in advance by the user's project spec (`prompt.json`)
- **Architecture style**: DDD-lite, Clean Architecture, Modular Monolith, feature-first organization — low coupling, high cohesion, explicit dependencies, composition over inheritance
- **Engineering persona**: build as a Staff Full-Stack Engineer would — think before coding, favor simplicity over cleverness, justify every abstraction and dependency, comment only non-obvious code
- **Testing approach**: TDD where practical, focused on unit tests for business rules, domain logic, and utilities (the COLREGS rules engine is the highest-value test target)
- **Git workflow**: feature branches, small logical conventional commits; commit messages, branch names, and PR descriptions are AI-generated but human-reviewed
- **Documentation**: README, setup guide, architecture overview, Architecture Decision Records, API documentation, folder structure explanation, and design rationale are all expected deliverables
- **Scope discipline**: chosen as a "Focused" project — one sharp, well-executed core loop (classify → explain → visualize) rather than a broad multi-feature system, to maximize polish and demo quality over breadth
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Core Technologies (locked — versions current as of research date)
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 16.2.10 | App framework, routing, SSR | Locked by project constraint |
| React | 19.2.7 | UI layer | Locked by project constraint |
| TypeScript | 7.0.2 | Type safety, domain modeling | Locked by project constraint |
| Tailwind CSS | 4.3.2 | Styling | Locked by project constraint |
| @trpc/server / client / react-query | 11.18.0 | Typed API layer | Locked by project constraint |
| @tanstack/react-query | 5.101.2 | tRPC's underlying data layer (installed as a peer, not a separate decision) | Ships alongside tRPC 11 |
| Prisma / @prisma/client | 7.8.0 | ORM / DB access | Locked by project constraint |
| Zod | 4.4.3 | Schema validation | Locked by project constraint — also doubles as the domain value-object layer, see below |
| Vitest | 4.1.10 | Test runner | Locked by project constraint |
| @testing-library/react | 16.3.2 | Component testing | Locked by project constraint |
### Supporting Libraries (new — the actual research deliverable)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| *(none — native SVG + Pointer Events)* | — | Chart rendering + draggable vessel icons | Default choice for this project. See rationale below. |
| `@testing-library/user-event` | latest v14+ (verify at install time — registry lookup was interrupted; this line is MEDIUM confidence) | Simulates realistic pointer drag sequences (`pointer()` API) against SVG elements in tests | Any test that exercises vessel drag-to-reposition interaction |
| `zustand` | 5.0.14 | Lightweight shared client state | Only if the chart panel, control panel, and reasoning-trail panel end up as non-nested siblings and prop drilling becomes painful. Start without it. |
| `nanoid` | 6.0.0 | Short, URL-safe shareable scenario slugs | Only if you want a slug distinct from the DB primary key (e.g. `/s/xK9d2q` instead of a full cuid). Prisma's built-in `cuid()`/`uuid()` default is sufficient otherwise — prefer that and skip this dependency unless the shorter URL is a real product requirement. |
### Development Tools
| Tool | Purpose | Notes |
|------|---------|-------|
| Native Pointer Events API (`onPointerDown`/`onPointerMove`/`onPointerUp`, `setPointerCapture`) | Drag handling for vessel icons | No library needed — see Architecture note below |
| `ResizeObserver` (native browser API) | Track chart container size for the screen↔chart coordinate transform | Pair with a pure `screenToChart()`/`chartToScreen()` function you unit test directly — do not rely on `SVGElement.getScreenCTM()` in components (see jsdom caveat below) |
## Installation
# Supporting (only if/when needed — start without any of these)
# Dev dependencies
## The Big Decision: SVG + Pointer Events, NOT react-konva/Canvas
- **Scale doesn't justify canvas.** This project has exactly 2 vessels plus a handful of overlay primitives (bearing line, CPA marker, heading vectors). Konva's retained-mode canvas rendering exists to solve *many-object* performance problems (dashboards, games, editors with hundreds of shapes) — [Konva's own "best canvas library" guide](https://konvajs.org/docs/guides/best-canvas-library.html) and comparison articles position it for exactly that case. At 2 objects, canvas buys nothing and costs a dependency the project's own engineering persona ("justify every abstraction and dependency") would reject.
- **Testability fits the locked stack.** The project's testing constraint is Vitest + React Testing Library, TDD-where-practical. SVG elements are real DOM nodes — RTL can query them (`getByRole`, `getByTestId`) and `@testing-library/user-event` can simulate pointer drags directly. Canvas content is opaque pixels to RTL; teams testing `react-konva` widely report needing `vitest-canvas-mock` and still hitting flakiness — one canvas-testing writeup found Vitest's canvas+thread combination "crashing node.js" and "failing ~50% of the time" ([source](https://github.com/vitest-dev/vitest/discussions/395)), with the pragmatic workaround being "don't test the canvas, test the model." SVG avoids that problem class entirely — you get DOM-level interaction testing for free.
- **Vector aesthetic fit.** A nautical chart (compass rose, range rings, rhumb/bearing lines, sharp vessel wedges) is fundamentally vector content, not bitmap/sprite content — SVG is a more natural fit than a canvas library built around sprites and filters.
- **Fits existing idioms.** SVG-in-JSX is fully declarative React, consistent with how the rest of the app (including tRPC-driven UI) is built — no separate imperative scene-graph API to learn or maintain alongside React's own render model.
## The Big Decision: Hand-Rolled Geometry, NOT geolib/turf.js
- **Wrong problem class.** `geolib` (3.3.14) and `@turf/turf` (7.3.5) solve *geodesy* — great-circle/rhumb-line math on the WGS84 ellipsoid, built for real lat/lon coordinates where Earth's curvature matters over long distances. This project is an explicit "chart-style sandbox" with synthetic vessel positions (not real AIS/lat-lon ingestion — that's listed Out of Scope in PROJECT.md). At the scale of a two-vessel encounter (positions at most a few tens of nautical miles apart, likely a local Cartesian plane with an arbitrary origin), flat-plane trigonometry is both correct and simpler than pulling in a geodesy library.
- **This math IS the portfolio's core value.** PROJECT.md is explicit that the point of this project is demonstrating "domain modeling depth" through the rules-engine/geometry layer. True bearing (`atan2`-based, normalized 0–360° clockwise from North), relative bearing (bearing to contact minus own heading, normalized to ±180°), and CPA/TCPA (closest point of approach / time to CPA, via the standard relative-position-dot-relative-velocity formula) are each a few dozen lines of trigonometry. Outsourcing them to a library would remove the exact code an interviewer is meant to read.
- **Testability.** A pure `bearing(a, b): number` / `relativeBearing(own, contact): number` / `cpa(vesselA, vesselB): { distance, timeToClosestApproach }` module has zero dependencies on Next.js/tRPC/Prisma/React and is trivially unit-tested with plain numeric fixtures in Vitest — directly satisfying the project's stated testing priority ("the COLREGS rules engine is the highest-value test target").
- True bearing between two points: `atan2(dx, dy)` (note: bearing convention swaps the usual x/y order vs. math-standard `atan2(y, x)`, since bearing is measured clockwise from North, not counterclockwise from East), normalized to `[0, 360)`.
- Relative bearing: `normalize(bearingToContact - ownHeading)` to `(-180, 180]`.
- CPA: relative position vector `R = posB - posA`, relative velocity vector `V = velB - velA`; `tcpa = -(R · V) / (V · V)` (guard `V · V ≈ 0` → parallel/matching course, CPA = current distance, no time bound); `dcpa = |R + V * tcpa|`. ([Background reference](https://binnacleai.com/blog/cpa-tcpa-explained))
## Domain / Rules-Engine Layer: Plain TypeScript + Zod, NOT a Rules-Engine Library
- **`json-rules-engine` and similar libraries solve a different problem.** These exist so non-engineers can edit rules at runtime via JSON (pricing, eligibility, feature flags) — the tradeoff is weaker TypeScript type-checking and harder-to-trace rule firing ("debugging is harder than expected... rule conflicts are invisible until production" — multiple sources). COLREGS Rules 11–18 are fixed, published maritime law that will never need runtime editing by a non-engineer. A JSON rules engine would add indirection without solving a real problem this project has, and would make producing the required "reasoning trail" (rule citation + geometric logic) harder to construct and test than a typed function would.
- **XState doesn't fit either.** Encounter classification is a pure, stateless derivation — recomputed from scratch on every vessel drag/position change — not a long-lived process with time-based transitions and side effects. Modeling it as an actual finite state machine would add a dependency to manage a problem (state over time) this domain doesn't have at the current scope.
- **Recommended pattern:** a pure `classifyEncounter(vesselA: Vessel, vesselB: Vessel): EncounterResult` function in `src/domain/colregs/`, internally structured as a decision tree/strategy dispatch across Rule 13 (overtaking) → Rule 14 (head-on) → Rule 15 (crossing) → Rule 18 (vessel-type precedence), with zero imports from Next.js, tRPC, or Prisma. Zod schemas (`VesselSchema`, `PositionSchema`) act as the shared boundary contract — used both for tRPC input validation and as the domain's value-object types (`z.infer<typeof VesselSchema>`), avoiding duplicate type definitions between the API and domain layers. tRPC routers become thin "interface adapter" wrappers that call the pure domain function and (optionally) hand the result to a Prisma repository for persistence when a scenario is saved. This keeps the domain layer 100% unit-testable in isolation, matching multiple independently-sourced Clean-Architecture-in-Next.js references: [Clean Architecture in Practice with TypeScript, Prisma, Next.js](https://www.arnaudrenaud.com/articles/clean-architecture-typescript-prisma-next/), [nikolovlazar/nextjs-clean-architecture](https://github.com/nikolovlazar/nextjs-clean-architecture).
- **Folder shape:** flat and pragmatic is fine at this project's scope — `src/domain/` (pure, framework-free: colregs rules, geometry math, types), `src/server/api/` (tRPC routers = interface adapters, call into `src/domain/`), `src/server/db/` (Prisma client + repositories = infrastructure). The hard rule to enforce: `src/domain/` never imports from `src/server/` or any Next.js/tRPC/Prisma package — this boundary is what makes the "domain modeling depth" claim in PROJECT.md actually true rather than aspirational.
## Alternatives Considered
| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|--------------------------|
| SVG + native Pointer Events | `react-konva` + `konva` | Roadmap grows to 3+ animated vessels, real-time replay, or heavy shape-transform performance needs (currently Out of Scope) |
| SVG + native Pointer Events | `@use-gesture/react` (10.3.1) or Motion/`framer-motion` (12.42.2) drag helpers | Drag interactions need multi-touch, inertia, or complex gesture composition beyond simple click-drag-release — not needed for 2 vessels on a fixed chart |
| Hand-rolled geometry module | `geolib` (3.3.14) | Real lat/lon + geodesic (Earth-curvature) distance/bearing become in-scope (e.g. real AIS ingestion is added in a future milestone) |
| Plain TS + Zod domain layer | `json-rules-engine` | Rules need to be editable by non-engineers at runtime without a deploy (not the case for published maritime law) |
| Plain TS + Zod domain layer | `xstate` | Encounter modeling grows into an actual time-based multi-step process (e.g. simulating maneuver sequences over time) rather than a stateless snapshot classification |
| Prisma default `cuid()`/`uuid()` for shareable IDs | `nanoid` (6.0.0) | Product requirement for short, human-shareable URLs distinct from the DB primary key |
| `useState`/`useReducer` + lifting state up | `zustand` (5.0.14) | Sandbox grows to 3+ sibling panels genuinely needing shared read/write state without prop drilling |
## What NOT to Use
| Avoid | Why | Use Instead |
|-------|-----|--------------|
| `react-konva` / `konva` (canvas rendering) | Solves a many-object/high-performance-animation problem this 2-vessel project doesn't have; makes RTL-based component testing much harder (canvas is opaque pixels); known Vitest+canvas testing flakiness in the community | Native SVG + React JSX |
| `geolib` / `@turf/turf` | Solves real-world geodesy (Earth curvature) for a synthetic, non-geographic sandbox; would also outsource the exact math the portfolio project exists to showcase | Hand-rolled `src/domain/geometry/` pure functions |
| `json-rules-engine` (or similar JSON-driven rules libraries) | Built for runtime-editable business rules by non-engineers; weakens type safety and traceability versus a typed function, for rules (COLREGS 11–18) that are fixed published law | Pure `classifyEncounter()` TypeScript function with Zod-typed inputs |
| `xstate` | Adds state-machine machinery for a classification that is a stateless per-render derivation, not a time-based multi-step process | Pure function recomputed on each vessel state change |
| `vitest-canvas-mock` | Only needed if you adopt `react-konva`/canvas rendering — irrelevant complexity if you take the SVG recommendation | N/A — avoided by not using canvas |
| Calling `SVGElement.getScreenCTM()`/`getBBox()` directly inside components | Not implemented in `jsdom`, throws in Vitest/RTL tests | Pure `screenToChart()`/`chartToScreen()` functions driven by `ResizeObserver` + known `viewBox`, tested independently of the DOM |
## Stack Patterns by Variant
- Reconsider `react-konva`/`konva` for the chart layer
- Because SVG's DOM-node-per-element cost and React reconciliation overhead start to matter once you're past a handful of simultaneously moving objects; Konva's retained-mode canvas scales better there
- Add `geolib` (3.3.14) for geodesic distance/bearing between real-world coordinates
- Because flat-plane trigonometry stops being a safe approximation once real Earth-referenced positions and longer distances are involved
## Version Compatibility
| Package A | Compatible With | Notes |
|-----------|------------------|-------|
| `react-konva@19.2.5` | `react@19.2.7` | Confirmed current major-version alignment, for reference only — not the primary recommendation |
| `zod@4.4.3` | `@trpc/server@11.18.0` | tRPC 11's input/output validation is designed around Zod 3/4-style schemas; no known incompatibility |
| `jsdom` (via Vitest env) | SVG testing | Does not implement `getScreenCTM()`/`getBBox()` — see caveat above; keep coordinate-transform logic DOM-API-free |
| `@testing-library/user-event` | `@testing-library/react@16.3.2` | Verify exact user-event major version at install time (registry lookup was interrupted mid-research) — any recent major (v14+) supports the `pointer()` API needed for drag simulation |
## Sources
- Context7 `/konvajs/react-konva`, `/konvajs/konva`, `/konvajs/site` — library metadata/resolution (HIGH reputation, used to confirm Konva is the community-standard canvas choice, then deliberately not selected for this project's scope)
- Context7 `/websites/motion_dev` — `onDrag`/drag-constraints API shape, used to evaluate Motion as a drag alternative
- npm registry (`npm view <pkg> version`) — live version numbers for all packages listed, fetched at research time (HIGH confidence, not training data)
- [Konva "Best JavaScript Canvas Library" guide](https://konvajs.org/docs/guides/best-canvas-library.html) — canvas-vs-SVG-vs-WebGL positioning
- [Fabric.js vs Konva vs PixiJS 2026 comparison](https://www.pkgpulse.com/guides/fabricjs-vs-konva-vs-pixijs-canvas-2d-graphics-2026) — MEDIUM confidence, single source, but consistent with Konva's own positioning
- [vitest-dev/vitest discussion #395](https://github.com/vitest-dev/vitest/discussions/395) — canvas mocking flakiness in Vitest
- [testing-library/react-testing-library#1116](https://github.com/testing-library/react-testing-library/issues/1116) — `getScreenCTM` not implemented in jsdom, MEDIUM-HIGH confidence (verified GitHub issue, first-party repo)
- [geolib npm](https://www.npmjs.com/package/geolib) / [turf.js distance docs](https://turfjs.org/docs/api/distance) — geodesy library comparison
- [CPA & TCPA Explained — Binnacle AI](https://binnacleai.com/blog/cpa-tcpa-explained) — CPA/TCPA formula background, MEDIUM confidence (single source, cross-checked against standard relative-velocity vector math which is well-established)
- [Clean Architecture in Practice with TypeScript, Prisma, Next.js — Arnaud Renaud](https://www.arnaudrenaud.com/articles/clean-architecture-typescript-prisma-next/) — MEDIUM confidence, community pattern reference
- [nikolovlazar/nextjs-clean-architecture](https://github.com/nikolovlazar/nextjs-clean-architecture) — MEDIUM confidence, community reference implementation
- [Nected: Top 10 Node.js Rule Engines 2026](https://www.nected.ai/blog/rule-engine-in-node-js-javascript) — rules-engine-library use-case boundaries (when to use vs. avoid)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
