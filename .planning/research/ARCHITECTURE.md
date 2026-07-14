# Architecture Research

**Domain:** Rules-engine-centric web app (maritime COLREGS collision-avoidance visualizer)
**Researched:** 2026-07-14
**Confidence:** HIGH (layering/dependency-direction patterns, verified against multiple Clean Architecture + Next.js/tRPC/Prisma reference implementations and official tRPC docs) / MEDIUM (COLREGS-specific module decomposition — sound application of standard rules-engine/specification patterns, but not an "industry convention" since no comparable open-source reference project exists)

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│  UI LAYER (Next.js App Router, React, Tailwind)                       │
│  ┌────────────┐  ┌───────────────────┐  ┌────────────────────────┐    │
│  │ Chart      │  │ Vessel Control     │  │ Reasoning Trail        │    │
│  │ Canvas     │  │ Panel (drag/edit)  │  │ Panel (rule + geometry)│    │
│  └─────┬──────┘  └─────────┬──────────┘  └───────────┬────────────┘    │
│        └────────────────────┴──────────────┬─────────┘                │
│                                    calls domain directly (live)        │
│                                    calls tRPC client (persist/load)    │
├──────────────────────────────────────┬────────────────────────────────┤
│  INTERFACE ADAPTERS (tRPC routers)   │ calls, in-browser, no network   │
│  ┌─────────────────────────────┐     │                                │
│  │ scenario router / gallery    │     │                                │
│  │ router — Zod-validated I/O   │     │                                │
│  └──────────────┬───────────────┘     │                                │
├─────────────────┼─────────────────────┼────────────────────────────────┤
│  APPLICATION LAYER (use cases)        │                                │
│  ┌─────────────────────────────┐      │                                │
│  │ CreateScenario / GetScenario │      │                                │
│  │ / ListPresets (orchestration)│◄─────┘  imports pure functions       │
│  └──────────────┬───────────────┘         from domain layer            │
├─────────────────┼──────────────────────────────────────────────────────┤
│  DOMAIN LAYER — src/domain/colregs (pure TypeScript, zero deps)        │
│  ┌───────────┐ ┌────────────┐ ┌───────────┐ ┌────────────────────┐    │
│  │ Entities/ │ │ Geometry   │ │ Rules      │ │ classifyEncounter() │    │
│  │ Value Obj │ │ (bearing,  │ │ (Rule 12-  │ │ orchestrator ->     │    │
│  │ (Vessel,  │ │ CPA/TCPA)  │ │ 15, 18     │ │ ClassificationResult│    │
│  │ Position) │ │            │ │ specs)     │ │ + ReasoningStep[]   │    │
│  └───────────┘ └────────────┘ └───────────┘ └────────────────────┘    │
├──────────────────────────────────────────────────────────────────────┤
│  INFRASTRUCTURE LAYER                                                  │
│  ┌────────────────────────────┐  ┌──────────────────────────────┐     │
│  │ PrismaScenarioRepository    │  │ scenario-mapper.ts (row <->  │     │
│  │ (implements domain-owned    │  │ domain entity translation)   │     │
│  │ repository interface)       │  │                               │     │
│  └──────────────┬───────────────┘  └──────────────────────────────┘     │
├─────────────────┼────────────────────────────────────────────────────┤
│  PostgreSQL (via Prisma)                                               │
└──────────────────────────────────────────────────────────────────────┘
```

The distinctive feature of this system (vs. a typical CRUD app) is the **dashed line on the left**: the domain layer is called from *two* places — directly from the browser for live/interactive classification, and from the application layer (server-side, via tRPC) for authoritative validation before persistence. Both call the *same* pure functions. This is only possible because the domain layer has zero framework, Node-only, or browser-only dependencies.

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|-------------------------|
| Domain — Entities/Value Objects | Model `Vessel`, `Position`, `Heading`, `Speed`, `VesselType` as immutable, self-validating data with invariants (e.g., heading normalized 0–359°) | Plain TS classes or factory functions + Zod schemas for parsing at the boundary, but internal logic uses plain types, not Zod, to avoid coupling domain to a validation library's runtime |
| Domain — Geometry | Pure trigonometry: bearing A→B, relative bearing, relative velocity vector, CPA/TCPA | Pure functions operating on Value Objects, no I/O, 100% unit-testable with fixed inputs/outputs |
| Domain — Rules | Encode Rules 12–15 (encounter type) and Rule 18 (vessel-type precedence) as independent, composable predicates ("specifications") that both classify *and* produce a human-readable reasoning step | Specification-pattern objects/functions: `{ applies(ctx): boolean; explain(ctx): ReasoningStep }` |
| Domain — `classifyEncounter()` | Orchestrates geometry + rules into a single `ClassificationResult` (encounter type, give-way/stand-on assignment, ordered reasoning trail with rule citations) | One pure function, the single entry point the rest of the app calls |
| Application (use cases) | Orchestrate a single business operation server-side: validate input, re-run domain classification (never trust client-submitted verdicts), call repository, return DTO | Function-per-use-case (`createScenario(input, deps)`), dependencies injected as parameters/object, not imported directly |
| Infrastructure (repositories) | Implement domain/application-defined repository interfaces using Prisma; translate between Prisma rows and domain entities | `PrismaScenarioRepository implements ScenarioRepository` |
| Interface Adapters (tRPC routers) | Thin controllers: parse/validate input via Zod, call one application use case, return its result | `scenarioRouter`, `galleryRouter` merged into `appRouter` |
| UI (React/Next.js) | Render chart, capture drag/edit interactions, call domain layer directly for live feedback, call tRPC client for persistence/loading | Client components import `classifyEncounter` from `domain/colregs` directly (no network round-trip) |

## Recommended Project Structure

```
src/
├── domain/
│   └── colregs/                        # Pure domain layer — zero framework deps, the highest-value test target
│       ├── entities/
│       │   ├── vessel.ts               # Vessel entity: id, position, heading, speed, type
│       │   └── scenario.ts             # Scenario aggregate: two vessels + metadata
│       ├── value-objects/
│       │   ├── position.ts             # Position VO + distance/bearing helpers
│       │   ├── heading.ts              # Heading VO (0–359°, normalization, delta)
│       │   ├── speed.ts                # Speed VO (knots)
│       │   └── vessel-type.ts          # VesselType enum + Rule 18 precedence ranking
│       ├── geometry/
│       │   ├── relative-bearing.ts     # bearing(A,B), relativeBearing(observer, target)
│       │   ├── closing-vector.ts       # relative velocity, CPA, TCPA
│       │   └── geometry.test.ts
│       ├── rules/
│       │   ├── rule-13-overtaking.ts   # Specification: overtaking sector (>112.5° abaft beam)
│       │   ├── rule-14-head-on.ts      # Specification: reciprocal-course sector
│       │   ├── rule-15-crossing.ts     # Specification: crossing sector + give-way side
│       │   ├── rule-18-responsibility.ts # vessel-type-based precedence override
│       │   └── rule-registry.ts        # ordered evaluation pipeline (first-match-wins)
│       ├── classify-encounter.ts       # classifyEncounter(scenario) -> ClassificationResult
│       ├── types.ts                    # EncounterType, GiveWayRole, ReasoningStep, ClassificationResult
│       └── index.ts                    # public surface re-exported for app/server use
│
├── application/                        # Use cases — one file per operation, framework-agnostic
│   ├── scenario/
│   │   ├── create-scenario.ts          # validate -> classify (authoritative) -> persist
│   │   ├── get-scenario.ts             # fetch -> reconstruct domain entity -> return DTO
│   │   └── ports/
│   │       └── scenario-repository.ts  # interface application/domain code depends on
│   └── gallery/
│       └── list-presets.ts             # returns curated Scenario[] (seeded, read-only)
│
├── infrastructure/
│   ├── prisma/
│   │   ├── client.ts                   # PrismaClient singleton
│   │   └── prisma-scenario-repository.ts # implements ScenarioRepository
│   └── mappers/
│       └── scenario-mapper.ts          # Prisma row <-> domain Scenario entity
│
├── server/                             # tRPC — interface adapters
│   ├── routers/
│   │   ├── _app.ts
│   │   ├── scenario.ts                 # thin controller calling application/scenario/*
│   │   └── gallery.ts
│   ├── trpc.ts                         # initTRPC, procedure helpers
│   └── context.ts                      # per-request context (injects repositories)
│
├── app/                                 # Next.js App Router — UI
│   ├── sandbox/
│   │   ├── page.tsx
│   │   └── _components/
│   │       ├── chart-canvas.tsx
│   │       ├── vessel-control-panel.tsx
│   │       └── reasoning-trail.tsx
│   ├── s/[id]/page.tsx                 # shared scenario view (server component, tRPC fetch)
│   ├── gallery/page.tsx
│   └── _hooks/
│       └── use-live-classification.ts  # wraps classifyEncounter for React state, client-only
│
└── prisma/
    └── schema.prisma
```

### Structure Rationale

- **`domain/colregs/`:** Isolated at the top level (not nested under `server/` or `app/`) precisely because it must be importable from *both* — a Next.js client component and a tRPC server procedure — without pulling in either's runtime. This is the load-bearing decision for the whole architecture: if classification logic ever imports `next/*`, `react`, or `@prisma/client`, live client-side re-classification breaks or requires duplicating logic.
- **`rules/` as one file per rule:** Mirrors the regulation itself (Rule 13, 14, 15, 18) so a reviewer/interviewer can map code directly to the cited legal text — this is a deliberate readability/demo-value choice, not just a technical one.
- **`application/` separate from `server/`:** Keeps tRPC (a transport concern) swappable. Use cases don't know they're being called over HTTP; they take plain arguments and injected dependencies. This also means use cases are unit-testable without spinning up a tRPC context.
- **`infrastructure/` behind ports defined in `application/*/ports/`:** Dependency Inversion — the application layer defines what it needs (`ScenarioRepository`), infrastructure provides it. Domain and application never import `@prisma/client` directly.
- **Feature-first grouping inside `application/`, `server/routers/`:** `scenario/` and `gallery/` are the two bounded contexts (modular-monolith style) — low coupling between them, each could become a separate package later without restructuring the domain.

## Architectural Patterns

### Pattern 1: Functional Core, Imperative Shell

**What:** The domain layer (`domain/colregs/`) is a "functional core" — pure functions, immutable value objects, no side effects, no I/O. Everything else (React rendering, tRPC handling, Prisma queries) is the "imperative shell" that calls into the core and handles the messy edges (network, database, DOM).
**When to use:** Ideal here because the core value proposition ("correctly classify and explain") is a pure computation — deterministic given (position, heading, speed, type) × 2 vessels. No hidden state, no clock dependency (a `Scenario` has no time dimension beyond the current instant).
**Trade-offs:** Requires discipline to keep the core pure — the moment a rule needs "today's date" or a database lookup, it stops being pure. For this domain (Rules 11–18, static regulation text) that's not a risk. Slight verbosity vs. just writing an `if/else` chain in a tRPC procedure, but that verbosity is exactly what buys independent unit-testability.

**Example:**
```typescript
// domain/colregs/classify-encounter.ts
export function classifyEncounter(scenario: Scenario): ClassificationResult {
  const geometry = computeEncounterGeometry(scenario.vesselA, scenario.vesselB);
  const applicableRule = ruleRegistry.find((rule) => rule.applies(geometry));
  return applicableRule.explain(geometry, scenario);
}
// No imports from react, next, @prisma/client, or trpc anywhere in this file's dependency tree.
```

### Pattern 2: Ports & Adapters (Repository Interfaces)

**What:** The application layer declares the interface it needs (`ScenarioRepository` with `save()`, `findById()`, `listPresets()`); infrastructure provides the Prisma-backed implementation. Use cases receive the repository via dependency injection (constructor/parameter), never import Prisma directly.
**When to use:** Whenever a use case needs persistence. Standard Clean Architecture / hexagonal pattern, well-supported in the TypeScript + Prisma ecosystem.
**Trade-offs:** One extra layer of indirection (interface + implementation) for what could be a single Prisma call — worth it here specifically because it (a) keeps domain/application unit-testable with an in-memory fake repository and no database, and (b) is a well-understood pattern to narrate in interviews.

**Example:**
```typescript
// application/scenario/ports/scenario-repository.ts
export interface ScenarioRepository {
  save(scenario: Scenario): Promise<ScenarioId>;
  findById(id: ScenarioId): Promise<Scenario | null>;
}

// application/scenario/create-scenario.ts
export async function createScenario(
  input: CreateScenarioInput,
  deps: { repository: ScenarioRepository }
): Promise<ClassificationResult & { id: ScenarioId }> {
  const scenario = Scenario.fromInput(input);        // domain construction/validation
  const result = classifyEncounter(scenario);          // domain — authoritative, server-side
  const id = await deps.repository.save(scenario);     // infrastructure via port
  return { ...result, id };
}
```

### Pattern 3: Specification Pattern for Rules

**What:** Each COLREGS rule (13, 14, 15, 18) is a self-contained object/function pair: `applies(geometry): boolean` decides if the rule's sector/condition is met, `explain(geometry): ReasoningStep` produces the citation + geometric justification. A `ruleRegistry` array is evaluated in priority order (Rule 18 vessel-type overrides checked before/after sector-based rules as COLREGS itself prescribes).
**When to use:** Any time classification logic would otherwise become a nested if/else tree mixing "is this true" with "what do I tell the user." Also directly supports the explainability requirement — since `explain()` is a first-class method, the reasoning trail isn't reverse-engineered after the fact, it's the same code path that produced the verdict.
**Trade-offs:** More files/ceremony than a single switch statement; pays off because it makes the rule *order* (which matters — COLREGS rules have precedence) explicit and testable in isolation, and each rule can be unit tested against textbook encounter fixtures independently of the others.

## Data Flow

### Flow 1: Live Interactive Classification (client-only, no network)

```
User drags vessel on chart-canvas
    ↓
React state update (vessel position/heading)
    ↓
use-live-classification hook calls domain/colregs classifyEncounter() directly, in-browser
    ↓
ClassificationResult (encounter type, give-way/stand-on, reasoning trail)
    ↓
Reasoning Trail panel + chart overlay re-render
```
No tRPC/Prisma involved — this loop must be sub-frame-latency, so it stays entirely client-side, in memory, in the browser's JS runtime, using the exact same pure functions the server uses.

### Flow 2: Save/Share Scenario (persistence, authoritative re-classification)

```
User clicks "Save & Share"
    ↓
tRPC client mutation: scenario.create(input)
    ↓
scenario router (Zod validates raw input shape)
    ↓
application/scenario/create-scenario.ts (use case)
    ↓
domain: Scenario.fromInput() (re-validate invariants) → classifyEncounter() (re-run, never trust client verdict)
    ↓
infrastructure: PrismaScenarioRepository.save() → PostgreSQL
    ↓
returns { id, classification } → client shows shareable URL /s/[id]
```
The server *always* re-derives the classification rather than trusting a client-computed result — this closes the obvious integrity gap of a client-side-only rules engine and is a deliberate defense against "trust the client."

### Flow 3: Load Scenario (shared link or gallery preset)

```
GET /s/[id] (Next.js server component)
    ↓
tRPC query: scenario.getById(id)
    ↓
application/scenario/get-scenario.ts
    ↓
infrastructure: PrismaScenarioRepository.findById() → scenario-mapper (row → domain entity)
    ↓
domain: classifyEncounter() re-run (so displayed reasoning always matches current rule-engine version)
    ↓
Server component passes serializable Scenario + ClassificationResult as props to client chart
    ↓
Client hydrates, further drags trigger Flow 1 again
```

### Key Data Flows

1. **Live classification bypasses the network entirely** — the domain layer's framework-agnostic purity is what makes sub-100ms drag feedback possible without debounced API calls.
2. **Persistence always re-classifies server-side** — the stored `ClassificationResult` is never blindly trusted from the client; this also means if the rule engine is updated later, old scenario *inputs* remain valid but reasoning can be recomputed rather than becoming stale/incorrect stored output (favor storing vessel inputs as source of truth over storing the derived verdict — see Anti-Pattern 2).

## Scaling Considerations

This is a portfolio project with no auth and no expected high-concurrency load; scaling is a minor concern, but table included per methodology:

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0–1k users | Current architecture as-is: single Next.js app, single Postgres instance (e.g., Neon/Supabase free tier), no caching needed |
| 1k–100k users | Add caching for shared scenario reads (`/s/[id]` is read-heavy, write-once) via Next.js ISR or edge caching; no schema changes needed since domain/application/infra boundaries are already in place |
| 100k+ users | Unlikely for this project's scope, but the modular monolith structure (feature-first `scenario`/`gallery` modules with clean ports) is what would allow extracting a module into a separate service later without touching the domain layer |

### Scaling Priorities

1. **First plausible bottleneck:** Unauthenticated scenario creation (no auth = no natural rate limit) could allow spam/abuse of the database. Mitigate with basic IP-based rate limiting on the `scenario.create` tRPC procedure before this becomes a real product, not before — premature for MVP.
2. **Second bottleneck:** None realistically anticipated at portfolio scale; Postgres + Prisma handles the read/write pattern (mostly reads of static preset/shared scenarios) trivially.

## Anti-Patterns

### Anti-Pattern 1: Classification Logic Inside tRPC Procedures

**What people do:** Write the encounter-classification if/else chain directly inside the tRPC `scenario.create` resolver "because it's only used once."
**Why it's wrong:** Couples the highest-value, most-tested piece of logic to the transport layer. It can no longer be called from the browser for live feedback without a network round-trip (killing the drag-and-see-it-update UX), and it can't be unit tested without spinning up a tRPC context/mock request.
**Do this instead:** Keep `classifyEncounter()` as a pure function in `domain/colregs/`, imported by both the tRPC procedure (via the application layer) and the client hook.

### Anti-Pattern 2: Persisting the Derived Verdict Instead of the Inputs

**What people do:** Store `encounterType`, `giveWayVessel`, and the reasoning trail directly in the database alongside the vessel data.
**Why it's wrong:** Creates two sources of truth. If the rule engine has a bug fix later, previously saved scenarios show stale/incorrect verdicts frozen at save time, and there's no way to tell a "wrong-by-old-bug" verdict from a "wrong-by-current-bug" verdict.
**Do this instead:** Persist only the raw scenario inputs (vessel positions, headings, speeds, types). Always recompute `classifyEncounter()` on load (Flow 3). If reasoning-trail history matters later (e.g., "this scenario used engine v1.2"), version the domain engine explicitly rather than freezing output.

### Anti-Pattern 3: Mixing Rendering Coordinates with Domain Coordinates

**What people do:** Let `Vessel.position` store pixel/canvas coordinates directly, computed once during rendering setup, and feed those into the geometry math.
**Why it's wrong:** Silently couples domain correctness to viewport size/zoom/pan state; bearing and distance calculations become meaningless once the canvas is resized or panned, and the domain layer becomes untestable without a rendering context.
**Do this instead:** Domain `Position` is always in a stable unit (e.g., nautical miles on an abstract plane, or lat/lon). The chart-canvas component owns a separate, one-way transform (domain → pixel) purely for drawing; it never flows back into domain calculations.

### Anti-Pattern 4: One "God" Rule Function

**What people do:** A single 200-line `determineEncounter()` function with nested conditionals covering sector detection, vessel-type precedence, and message formatting all at once.
**Why it's wrong:** Impossible to unit test each rule (12/13/14/15/18) independently against textbook fixtures; a bug fix to the overtaking sector risks silently breaking head-on detection; hard to cite in a portfolio walkthrough ("here's exactly where Rule 15 lives").
**Do this instead:** One file/specification per rule (Pattern 3 above), composed through an explicit, ordered `ruleRegistry`.

## Integration Points

### External Services

None required for MVP scope (no auth provider, no AIS data feed, no third-party maps API — the chart is a custom-rendered sandbox, not a real nautical chart service). This is deliberate per the project's Out of Scope decisions.

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| PostgreSQL (Neon/Supabase/local) | Prisma Client, connection string via env var | Only external dependency; standard Prisma setup, no special COLREGS-specific concerns |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| UI (client component) ↔ Domain | Direct function import (`classifyEncounter`) | In-browser, synchronous, no serialization — this is what makes live drag-classification feel instant |
| UI ↔ Server (tRPC) | tRPC client hooks (`useMutation`/`useQuery`) over HTTP, end-to-end typed | Only for persistence (save/load), not for live classification |
| tRPC router ↔ Application | Direct function call, router passes parsed/validated input | Router is a thin adapter — no business logic, no direct domain imports (goes through application) |
| Application ↔ Domain | Direct function/class import — domain has no dependencies, so this is a one-way, always-safe import direction | Application depends on domain; domain never depends on application |
| Application ↔ Infrastructure | Dependency injection via repository interface (port) defined in `application/*/ports/` | Infrastructure implements the interface; application never imports `@prisma/client` |
| `scenario` module ↔ `gallery` module | No direct coupling — gallery reads presets via its own repository method; if presets are just seeded `Scenario` rows, gallery can reuse `ScenarioRepository.listPresets()` rather than duplicating persistence logic | Keeps the two feature modules independent per modular-monolith intent |

## Suggested Build Order (dependency-driven)

1. **Domain layer first, in isolation** (`domain/colregs/`: value objects → geometry → rules → `classifyEncounter`), fully unit-tested against textbook encounter fixtures (classic head-on, classic crossing, classic overtaking, Rule 18 vessel-type overrides) — this has zero dependencies on anything else in the stack and is the core value; get it right and verified before any UI or persistence exists.
2. **Prisma schema + infrastructure repository**, satisfying the `ScenarioRepository` port defined alongside the application layer — can be built and tested (integration tests against a real/test Postgres) independently of the UI.
3. **Application use cases** (`create-scenario`, `get-scenario`, `list-presets`) wiring domain + infrastructure — unit-testable with an in-memory fake repository, no network/database needed for these tests.
4. **tRPC routers** as thin adapters over the application layer, plus Zod input schemas at the boundary.
5. **UI sandbox** (chart canvas, vessel controls) wired to the domain layer directly for live classification (Flow 1) — this is where the "live update while dragging" requirement gets exercised, and it should be buildable/demoable using the domain layer alone, before Save/Share exists.
6. **Persistence UI** (Save & Share button → tRPC mutation → shareable link page) — Flow 2 and Flow 3.
7. **Gallery of presets** — mostly a thin read-only extension of the same repository/application patterns, last because it depends on the scenario persistence model already existing (presets are just seeded scenarios).

This order front-loads the highest-risk, highest-interview-value work (the rules engine) and defers the lowest-risk, most-conventional work (CRUD persistence, gallery listing) to the end — matching both technical dependency order and the project's stated priority that correctness/explainability of the domain logic is what the whole project stands or falls on.

## Sources

- [Clean Architecture in Practice with TypeScript, Prisma, Next.js — Arnaud Renaud](https://www.arnaudrenaud.com/articles/clean-architecture-typescript-prisma-next/) — MEDIUM confidence (single-author blog, but pattern matches broader Clean Architecture consensus); domain/services/infrastructure layering, Prisma abstracted behind repository interfaces.
- [nikolovlazar/nextjs-clean-architecture (GitHub)](https://github.com/nikolovlazar/nextjs-clean-architecture) — MEDIUM confidence (community reference implementation, associated with a Sentry developer advocate talk); entities/application/infrastructure/interface-adapters layering, dependency-injection container, downward-only dependency flow.
- [tRPC official docs — Next.js project structure](https://trpc.io/docs) via Context7 (`/trpc/trpc`) — HIGH confidence (official documentation); router/context/procedure file layout for both Pages Router and App Router.
- [Building a Rule Engine With TypeScript — Benjamin Ayangbola](https://benjamin-ayangbola.medium.com/building-a-rule-engine-with-typescript-1732d891385c) — LOW/MEDIUM confidence (single blog source, but consistent with independently-found Decider/functional-core patterns); pure-function rules engine approach.
- ["Stop letting your database dictate your TypeScript domain logic" — dev.to](https://dev.to/dogganidhal/stop-letting-your-database-dictate-your-typescript-domain-logic-kf5) — MEDIUM confidence; functional core / Decider pattern, persistence as configuration not architecture.
- COLREGS Rules 12–15 (encounter classification sectors) and Rule 18 (vessel-type responsibility) — public regulation text; sector boundaries (e.g., overtaking = >22.5° abaft the beam) cross-referenced via [ShipCalculators.com COLREGs wiki](https://shipcalculators.com/wiki/colregs-steering-and-sailing-rules) and academic literature on COLREGS-compliant collision-avoidance algorithms (ScienceDirect) — HIGH confidence for the rule text itself (public law), MEDIUM confidence for exact sector-boundary conventions used in software implementations (multiple published algorithms note common implementation pitfalls, e.g., using COG instead of heading — flagged here as a pitfall for the domain-logic phase to verify carefully during implementation, not just architecture).

---
*Architecture research for: maritime COLREGS rules-engine visualizer (Next.js + tRPC + Prisma + PostgreSQL, DDD-lite/Clean Architecture/Modular Monolith)*
*Researched: 2026-07-14*
