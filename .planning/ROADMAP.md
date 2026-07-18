# Roadmap: COLREGS Navigator

## Overview

This roadmap builds COLREGS Navigator as a stack of horizontal technical layers, assembled bottom-up: the pure domain layer (geometry primitives, then the COLREGS rules engine) is built and fixture-tested in complete isolation first, since it is both the highest-risk-of-subtle-bugs work and the entire portfolio-value proposition of the project. Only once the domain layer is proven correct does the roadmap move to the persistence/API layer (Prisma + tRPC, conventional low-risk work), then the interactive SVG chart sandbox (wired directly to the already-correct domain layer for live drag classification), and finally save/share and the curated gallery — which reuse the persistence layer and sandbox UI built in the prior two phases rather than introducing new architecture. Nothing is demoable end-to-end until Phase 4; that tradeoff is deliberate and explicitly chosen (Horizontal Layers mode) in exchange for validating the riskiest logic (COLREGS classification) before any UI or persistence complexity sits on top of it.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Domain Foundations** - Geometry primitives and vessel value objects, fixture-tested in isolation (completed 2026-07-15)
- [x] **Phase 2: COLREGS Rules Engine** - Encounter classification, give-way/stand-on determination, and the reasoning trail (completed 2026-07-15)
- [x] **Phase 3: Persistence & API Layer** - Prisma schema, repository, application use cases, and thin tRPC routers (completed 2026-07-17)
- [x] **Phase 4: Interactive Chart Sandbox** - SVG chart with live drag-and-classify, reasoning overlay, and visual role coding (completed 2026-07-17)
- [x] **Phase 5: Save, Share & Gallery** - Shareable scenario links and a curated gallery of classic encounters (completed 2026-07-18)

## Phase Details

### Phase 1: Domain Foundations

**Goal**: The domain has correct, fully fixture-tested geometric math and vessel-modeling primitives that every later layer depends on — zero framework dependencies, so the same code runs in the browser and on the server.
**Depends on**: Nothing (first phase)
**Requirements**: VESL-01
**Success Criteria** (what must be TRUE):

  1. A `Vessel` value object models position, heading, speed, and all five vessel types (power-driven, sailing, fishing, not-under-command, restricted-in-ability-to-maneuver) with validated construction
  2. Bearing, relative-bearing, and CPA/TCPA functions return textbook-correct results against a fixture suite (e.g., a reciprocal-heading-but-off-axis-bearing case is correctly NOT flagged head-on)
  3. Compass/math angle converters are pure, independently unit-tested functions with no DOM dependency (screen-space conversion is explicitly deferred to Phase 4)
  4. Degenerate inputs (identical position, zero speed, exact boundary angles, near-zero relative velocity, negative TCPA) have explicit, tested, defined behavior rather than crashing or returning NaN

**Plans**: 3 plans
Plans:
**Wave 1**

- [x] 01-01-PLAN.md — Project toolchain, shared Result<T> degenerate-case union, Vessel/Position Zod value objects

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02-PLAN.md — bearing() and relativeBearing() geometry functions with fixture suite
- [x] 01-03-PLAN.md — cpa()/tcpa() vector math and compass/math angle-convert utilities

**Cross-cutting constraints:**

- Fixtures are hand-derived from worked trigonometry, organized as per-function files co-located with their tests, and floating-point assertions use toBeCloseTo with 2 decimal digits (D-13, D-14, D-15)

### Phase 2: COLREGS Rules Engine

**Goal**: Given any two-vessel scenario, the system correctly classifies the encounter and determines give-way/stand-on with a transparent reasoning trail — the project's core value — validated against textbook fixtures before any UI exists.
**Depends on**: Phase 1
**Requirements**: CLAS-01, CLAS-02, CLAS-03, CLAS-04, DETM-01, DETM-02, RSON-02
**Success Criteria** (what must be TRUE):

  1. `classifyEncounter()` classifies head-on, crossing, and overtaking per Rules 12-15 using relative bearing (not heading difference) against a textbook fixture suite
  2. Overtaking is evaluated before head-on/crossing per Rule 13's explicit precedence, and an established overtaking situation never flips to crossing as bearing drifts
  3. Rule 7's risk-of-collision gate prevents diverging/parallel vessels from receiving a confident give-way verdict, and near-boundary cases (22.5°-abaft-the-beam, reciprocal heading) return an explicit doubt/ambiguous state rather than a hard cutoff
  4. Give-way/stand-on determination applies the Rule 18 vessel-type hierarchy as an override on the geometric baseline, treating not-under-command and restricted-in-ability-to-maneuver as co-equal statuses
  5. Every classification result carries an ordered reasoning trail (rule id + matched geometric facts) produced by the same evaluation path as the verdict — never a separate, reverse-engineered explanation function

**Plans**: 2 plans
Plans:
**Wave 1**

- [x] 02-01-PLAN.md — Domain types (types.ts) + isolated Rule 7 risk gate and Rule 18 priority-tier primitives

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-02-PLAN.md — classifyEncounter() dispatch (Rules 7/13/14/15/18) with reasoning trail and full fixture suite

### Phase 3: Persistence & API Layer

**Goal**: Scenarios can be durably persisted and retrieved through a clean application/API boundary that always re-derives the verdict from stored inputs and never trusts a stored result.
**Depends on**: Phase 2
**Requirements**: SCEN-02
**Success Criteria** (what must be TRUE):

  1. The Prisma schema persists only raw scenario inputs (vessel position, heading, speed, type) — there is no derived-verdict column or field anywhere in storage
  2. A scenario can be created and retrieved by a non-guessable share ID (UUID/cuid, not a sequential integer)
  3. Retrieving a persisted scenario always re-runs `classifyEncounter()` against the stored inputs at read time — the stored verdict is never read back as-is
  4. `scenario` and `gallery` tRPC routers expose create/get/list operations as thin adapters (Zod-validated input, one application-layer call, typed response), with no classification logic in router handlers

**Plans**: 3 plans
Plans:
**Wave 1**

- [x] 03-01-PLAN.md — Docker Postgres, Prisma schema/config, initial migration, PrismaClient singleton

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 03-02-PLAN.md — Scenario repository + application-layer re-derive-on-read service (SCEN-02)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 03-03-PLAN.md — scenario/gallery tRPC routers, route handler, end-to-end integration tests

### Phase 4: Interactive Chart Sandbox

**Goal**: Users can interactively set up a two-vessel encounter on a chart and see live, visually-explained classification as they drag — the main interaction loop and demo centerpiece.
**Depends on**: Phase 2
**Requirements**: VESL-02, CLAS-05, DETM-03, RSON-01, RSON-03, CHRT-01, CHRT-02
**Success Criteria** (what must be TRUE):

  1. User can place two vessels on an SVG chart-style canvas, setting position, heading, speed, and vessel type via drag and/or form controls
  2. User can drag a vessel's position and heading directly on the chart and see the encounter classification update live, with no manual submit step and no lag or flicker during continuous drag
  3. Give-way and stand-on vessels are visually distinguished on the chart (color/icon coding)
  4. A reasoning trail panel shows the specific rule citation and the geometric logic (relative bearing, closing angle) behind the current verdict, updating live alongside the chart
  5. The chart visually overlays the geometric reasoning directly on the canvas (relative bearing line, and the overtaking boundary arc where relevant)

**Plans**: 6 plans
Plans:
**Wave 1**

- [x] 04-01-PLAN.md — Tailwind v4 + RTL/jsdom environment, Next.js App Router scaffolding, shared sandbox prop contracts
- [x] 04-02-PLAN.md — resolveDoubtGeometry() pure domain helper (TDD)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 04-03-PLAN.md — ChartPanel (SVG rendering + hull/rotate-handle drag hooks)
- [x] 04-04-PLAN.md — ControlPanel (speed + vessel-type form controls)
- [x] 04-05-PLAN.md — ReasoningPanel (verdict banner, full trail, doubt caveat)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 04-06-PLAN.md — SandboxContainer wiring (state, applyVesselUpdate choke point, default scenario, Reset CTA) + app/page.tsx

**UI hint**: yes

### Phase 5: Save, Share & Gallery

**Goal**: Users can save and share a scenario via link and browse a curated gallery page of classic textbook encounters, both reusing the persistence layer and sandbox UI already built.
**Depends on**: Phase 3, Phase 4
**Requirements**: SCEN-01, SCEN-03
**Success Criteria** (what must be TRUE):

  1. User can save a scenario and receive a shareable link with no login required
  2. User can browse a curated gallery page of 5-8 classic textbook encounters (clean head-on, crossing, and overtaking cases) with brief rationale text per entry
  3. Opening a shared link or a gallery entry loads the exact saved scenario and displays a freshly-recomputed verdict, never a stale cached one (per Phase 3's re-derive-on-read guarantee)

**Plans**: 5 plans
Plans:
**Wave 1**

- [x] 05-01-PLAN.md — tRPC client provider + server-side caller wiring
- [x] 05-02-PLAN.md — Curated seed data (D-04 shape) + Prisma seed script

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 05-03-PLAN.md — SandboxContainer initialScenario/banner props + Save flow (SCEN-01)
- [x] 05-04-PLAN.md — /gallery listing page (SCEN-03)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 05-05-PLAN.md — /s/[shareId] detail page, Copy Link, end-to-end human verification

**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Domain Foundations | 3/3 | Complete    | 2026-07-15 |
| 2. COLREGS Rules Engine | 2/2 | Complete   | 2026-07-15 |
| 3. Persistence & API Layer | 3/3 | Complete   | 2026-07-17 |
| 4. Interactive Chart Sandbox | 6/6 | Complete   | 2026-07-17 |
| 5. Save, Share & Gallery | 5/5 | Complete   | 2026-07-18 |
