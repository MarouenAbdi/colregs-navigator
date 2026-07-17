# Phase 3: Persistence & API Layer - Research

**Researched:** 2026-07-17
**Domain:** Prisma 7 (Postgres ORM) + tRPC 11 on Next.js 16 App Router — first framework integration in this repo
**Confidence:** HIGH (stack/versions/setup mechanics) / MEDIUM (application-layer placement, degenerate-result-on-read handling — flagged as Open Questions)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Database Provisioning**
- **D-01:** Local development uses **Docker Postgres** (`docker-compose.yml`, `DATABASE_URL` pointing at localhost). Zero external account needed; any reviewer cloning the repo gets a fully reproducible setup. Prisma abstracts the connection, so a deploy target can later point at any managed Postgres without schema/code changes.
- **D-02:** **No live deployment for this milestone** — the project is demoed via README + local run instructions (or a screen recording), not a hosted live link. Do not provision Neon/Supabase or any hosted DB as part of this phase; setup docs should describe local Docker only.

**Scenario Schema Shape**
- **D-03:** Vessel data is modeled as **flat columns on a single `Scenario` row** (`vesselAPosX`, `vesselAPosY`, `vesselAHeading`, `vesselASpeed`, `vesselAType`, and mirrored `vesselB*` columns) — not a JSON column and not a normalized related `Vessel` table. The two-vessel relationship is fixed (never 1-to-many), so normalization would add join complexity without benefit; flat columns keep every field fully typed and indexable in Postgres.
- **D-04:** Position is stored as **two separate float columns per vessel** (`vesselAPosX`, `vesselAPosY`), not an embedded JSON object — consistent with D-03 and avoids JSON parsing anywhere in the persistence layer.
- **D-05 (reaffirmed, not re-asked):** Share IDs use Prisma's default `cuid()`/`uuid()` — already locked in CLAUDE.md's Alternatives Considered table. `nanoid` is out of scope unless a short-URL requirement emerges later.
- **D-06:** No derived-verdict column or field anywhere in the schema (hard constraint from ROADMAP.md Phase 3 success criterion #1 — reaffirmed, not a new decision, but binding on schema design).

**Gallery Data Approach**
- **D-07:** Phase 3 builds the **gallery capability only — no seed data**. A `gallery.list` tRPC procedure filters `Scenario` rows on `isCurated`, but no curated scenarios are seeded in this phase. Phase 5 owns selecting and writing the actual 5–8 textbook encounters (SCEN-03) — seeding placeholder data now risks it leaking into the eventual demo or requiring rework.
- **D-08:** Gallery entries are **not a separate `GalleryEntry` table** — `isCurated Boolean @default(false)` and `displayOrder Int?` live directly on `Scenario`. A gallery entry IS a scenario, just flagged; this matches SCEN-03's framing of gallery items as regular scenarios with rationale text, and avoids a join on every `gallery.list` call.
- **D-09:** Add a **nullable `rationale String?` field to `Scenario` now** (in this phase's migration), even though it stays unused/null for regular non-curated scenarios. Phase 5's SCEN-03 requires "brief rationale text per gallery entry" — adding the column now means one migration instead of two, and it's optional so it doesn't affect regular `scenario.create`/`scenario.get` behavior in this phase.

**Not-Found & Error Handling**
- **D-10:** `scenario.get` throws a standard **`TRPCError({ code: 'NOT_FOUND' })`** when the repository returns null for a given share ID (deleted, typo'd, or malformed) — not a `Result`-style discriminated-union response. tRPC's own error channel is the idiomatic mechanism here; doubling it with a domain-style `Result<T>` envelope at the API boundary would mean checking two things per call site instead of one. (Phase 1/2's `Result<T>` pattern stays a domain-internal convention — it does not extend across the tRPC boundary.)
- **D-11:** `scenario.create`'s tRPC input schema **reuses Phase 1's domain `VesselSchema`/`PositionSchema` directly** (or a thin composition of them) rather than defining a separate tRPC-specific input schema. This is CLAUDE.md's explicitly stated pattern — Zod schemas act as the shared boundary contract between API validation and domain value objects, avoiding duplicate type definitions.

### Claude's Discretion
- Exact placement of the "always re-run `classifyEncounter()` on read" logic — whether it lives in an explicit application/use-case layer (`src/server/application/`), the repository, or the router itself. ROADMAP.md's Phase 3 goal names "application use cases" as a distinct layer from routers/repository, but this wasn't discussed explicitly — follow CLAUDE.md's Clean Architecture layering (`src/domain/` never imports from `src/server/`; routers are thin adapters) during planning/research.
- Prisma migration workflow specifics (e.g., `prisma migrate dev` vs `db push` during early development, whether migrations are checked into the repo) — not discussed; follow standard Prisma conventions for a project with a documented setup guide.
- Exact router/procedure naming and file layout within `src/server/api/` beyond "scenario and gallery routers" (already named in ROADMAP.md) — follow CLAUDE.md's `src/server/api/` (adapters) / `src/server/db/` (infra) folder shape.
- Rule 18 vessel-type Zod enum reuse: confirm during planning that Prisma's `vesselAType`/`vesselBType` columns use the same 5-value kebab-case union already locked in Phase 1 (D-12 there) rather than redefining it.

### Deferred Ideas (OUT OF SCOPE)
- **Live hosted deployment (Neon/Supabase)** — considered during the Database Provisioning discussion and explicitly declined for this milestone (D-02). Revisit only if a future milestone decides a live demo link is worth the added setup/account overhead.
- **Curating the actual 5–8 gallery scenarios and rationale text** — belongs to Phase 5 (SCEN-03), not this phase (D-07).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SCEN-02 | Loading a shared scenario always re-runs classification from the saved inputs (never trusts a stored verdict) | See "Architecture Patterns → Pattern 2 (Re-derive-on-read use case)" and "Common Pitfalls → Pitfall 3" below: the application-layer `getScenario` use case must call `classifyEncounter(vesselA, vesselB)` fresh on every `scenario.get`/`gallery.list` read, using only the flat columns mapped back into `Vessel` objects — the schema physically cannot store a verdict (D-06), which is the primary enforcement mechanism, but the *read path* must still be wired correctly (see Open Question 1 on handling a `!ok` `Result` from a stored, previously-valid scenario). |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

These are binding, not optional, for this phase's plan:

1. **Locked versions:** Next.js 16.2.10, React 19.2.7, TypeScript 7.0.2, Tailwind CSS 4.3.2, `@trpc/server`/`client`/`react-query` 11.18.0, `@tanstack/react-query` 5.101.2 (tRPC peer, not a separate decision), Prisma/`@prisma/client` 7.8.0, Zod 4.4.3, Vitest 4.1.10, `@testing-library/react` 16.3.2. **All re-verified live against the npm registry during this research session (2026-07-17) — see Standard Stack table below; every version matches CLAUDE.md exactly.**
2. **`src/domain/` is framework-free and never imports from `src/server/`, Next.js, tRPC, or Prisma** — the hard architectural rule this phase must not violate. New code goes in `src/server/api/` (tRPC routers = thin adapters), `src/server/db/` (Prisma client + repositories = infrastructure), and (per this phase's Claude's Discretion item) likely `src/server/application/` (use cases that call into `src/domain/`).
3. **Zod schemas double as domain value-object types** (`z.infer<typeof VesselSchema>`) and as the tRPC input validation boundary — D-11 requires reusing `VesselSchema`/`PositionSchema` from `src/domain/vessel/vessel.ts` directly in the `scenario.create` input schema, not redefining a parallel shape.
4. **Result<T> stays domain-internal** — do not let it leak across the tRPC boundary (D-10); tRPC's own `TRPCError` channel is the API-level error mechanism.
5. **Vitest + TDD-where-practical**, focused on unit tests for business rules/domain logic — for this phase that means the application-layer "always re-derive" use case and repository mapping are the highest-value test targets (there is no UI yet to test).
6. **DDD-lite / Clean Architecture / Modular Monolith, feature-first** — favor simplicity, justify every abstraction. Do not introduce a generic repository-pattern library, a DI container, or an ORM abstraction layer on top of Prisma — Prisma Client itself already is the repository's implementation detail.
7. **No hosted DB, no auth** — confirmed again in PROJECT.md's Key Decisions and Out-of-Scope list; this phase must not add either.

## Summary

Phase 3 is a from-scratch integration of Prisma 7.8.0 + tRPC 11.18.0 into a Next.js 16.2.10 App Router project that currently has zero framework dependencies (`package.json` only lists `zod`, `typescript`, `vitest`). The core technical risk in this phase is **not** the tRPC/Next.js wiring (that is a well-documented, conventional pattern) — it is that **Prisma 7 changed its entire client architecture** relative to the Prisma 5/6 knowledge most training data and tutorials assume. Prisma 7 removed the Rust query-engine binary entirely: the client is now pure TypeScript + a WASM query compiler, driven by a mandatory **driver adapter** (`@prisma/adapter-pg` for Postgres) that itself wraps `pg` (node-postgres). Three things behave differently from "classic" Prisma and will break a plan that assumes old conventions:

1. The generator block uses `provider = "prisma-client"` (not `prisma-client-js`) and **requires an explicit `output` path** — the client is no longer generated into `node_modules/@prisma/client`.
2. **`prisma.config.ts` at the project root replaces the schema's `datasource { url = env("DATABASE_URL") }` line** as the place `DATABASE_URL` is wired — the schema's `datasource` block in Prisma 7 has no `url` at all (Prisma reads it from `prisma.config.ts`, using `dotenv/config` to populate `process.env`).
3. **`new PrismaClient()` with zero arguments throws at runtime** (`P2038`, "PrismaClient requires a driver adapter") — every `PrismaClient` instantiation must pass `{ adapter: new PrismaPg({ connectionString }) }`.

tRPC 11 + Next.js 16 App Router integration itself is standard and well-documented: a single catch-all route handler (`app/api/trpc/[trpc]/route.ts`) using `fetchRequestHandler`, a `createTRPCContext`, a router composed of `scenario` and `gallery` sub-routers, and a `TRPCReactProvider` mounted in the root layout for client-side hooks (not strictly required by this phase's success criteria, which only mention routers — client wiring is Phase 4's concern, but the `trpc/` scaffold this phase creates should follow the documented shape so Phase 4 doesn't have to rework it).

The Clean Architecture layering CLAUDE.md locks (`src/domain/` never imports frameworks) maps cleanly onto tRPC's own recommended pattern: routers are thin "interface adapters" that call an application/use-case function, which in turn calls `classifyEncounter()` (domain) and a Prisma-backed repository (infrastructure). tRPC's `createCallerFactory()` (a server-side, non-HTTP caller) is the standard mechanism for invoking routers programmatically and is directly useful for integration-testing the routers with Vitest without spinning up an HTTP server.

**Primary recommendation:** Use `provider = "prisma-client"` + `output = "../generated/prisma"` + `prisma.config.ts` + `@prisma/adapter-pg`, model `Scenario` as one flat table per D-03/D-04/D-08/D-09, place the "always re-derive on read" logic in a new `src/server/application/scenario-service.ts` use-case module that routers call into, and keep `scenario`/`gallery` tRPC routers as pure Zod-validated pass-throughs to that service — never calling `classifyEncounter()` or Prisma directly from a router handler.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Scenario input validation (Zod) | API / Backend | — | tRPC's `.input()` on `scenario.create`, reusing domain `VesselSchema` (D-11) |
| Scenario persistence (raw inputs only) | Database / Storage | API / Backend (repository) | Prisma schema + repository module in `src/server/db/`; no derived data stored (D-06) |
| Verdict re-derivation on read | API / Backend (application layer) | Database / Storage (feeds it stored inputs) | `classifyEncounter()` is domain-tier logic, but the *decision to call it on every read* is an application-layer responsibility (SCEN-02) — this is the phase's core architectural guarantee |
| Share-ID generation (non-guessable) | Database / Storage | — | Prisma's `@default(cuid())`/`@default(uuid())` at the schema level (D-05) |
| Gallery filtering (`isCurated`) | API / Backend | Database / Storage | `gallery.list` procedure queries `Scenario WHERE isCurated = true`; no separate table (D-08) |
| Not-found handling | API / Backend | — | `TRPCError({ code: 'NOT_FOUND' })` thrown at the router/application boundary (D-10) |
| Domain classification logic | Backend (Domain sub-tier, framework-free) | — | Already built in Phase 2 (`src/domain/colregs/classify-encounter.ts`); this phase only calls it, never modifies it |
| Client-side data fetching UI | Browser / Client | — | **Out of scope for Phase 3** — `TRPCReactProvider`/hooks scaffold may be created for Phase 4's convenience, but no UI consumes it yet |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `prisma` (CLI) | 7.8.0 | Schema authoring, migrations, client generation | Locked by CLAUDE.md; `[VERIFIED: npm registry]` — confirmed current via `npm view prisma version` (2026-07-17) and matches Context7 `/prisma/prisma` official docs |
| `@prisma/client` | 7.8.0 | Generated, type-safe DB client | Locked by CLAUDE.md; `[VERIFIED: npm registry]` |
| `@prisma/adapter-pg` | 7.8.0 | **Mandatory** driver adapter — Prisma 7 has no built-in query engine; Postgres access goes through this + `pg` | New in this phase's research (not explicitly named in CLAUDE.md, but required by CLAUDE.md's locked Prisma 7.8.0 — see Common Pitfalls). `[VERIFIED: npm registry + Context7 official Prisma docs]` |
| `pg` | 8.22.0 | Underlying Postgres driver `@prisma/adapter-pg` wraps (`PrismaPg` accepts a connection string, `pg.PoolConfig`, or an existing `pg.Pool`) | `[VERIFIED: npm registry]` — 8.22.0 confirmed current; `@types/pg` (8.20.0) not needed for runtime, only if hand-written code imports `pg` directly for something outside the adapter |
| `next` | 16.2.10 | App framework, App Router, route handlers | Locked by CLAUDE.md; `[VERIFIED: npm registry]` |
| `@trpc/server` | 11.18.0 | Router/procedure definitions, context, `fetchRequestHandler` adapter | Locked by CLAUDE.md; `[VERIFIED: npm registry]` |
| `@trpc/client` | 11.18.0 | Typed client (used by `@trpc/react-query`/`@trpc/next`) | Locked by CLAUDE.md; `[VERIFIED: npm registry]` |
| `zod` | 4.4.3 | Input validation + domain value-object schemas (reused, not new) | Already installed; locked by CLAUDE.md |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@trpc/react-query` | 11.18.0 | React hooks (`useQuery`/`useMutation`) over tRPC procedures, TanStack Query integration | Only needed once Phase 4 consumes the routers client-side. This phase can install it now (so the `trpc/client.tsx` scaffold is ready) or defer to Phase 4 — **Claude's Discretion**, no CONTEXT.md decision either way. Recommend installing now since `package.json` changes are cheap and it avoids a second dependency-adding PR. |
| `@trpc/next` | 11.18.0 | Legacy `withTRPC` HOC helper for Pages Router — **NOT needed** for App Router | Do not install unless the project ever adds a Pages Router page; the App Router pattern below uses `@trpc/react-query` + `@tanstack/react-query` directly, not `@trpc/next`. Listed in CLAUDE.md's version table for completeness but its App-Router-era relevance is low. |
| `@tanstack/react-query` | 5.101.2 | tRPC 11's underlying client-side cache/data layer | Ships as tRPC 11's documented pairing (`createTRPCOptionsProxy`, `QueryClientProvider`) — install alongside `@trpc/react-query`, not a separate decision |
| `dotenv` | latest (verify at install — not yet checked live) | Loads `.env` into `process.env` for `prisma.config.ts` (Prisma 7 does **not** auto-load `.env` files, unlike Prisma 5/6) | Required the moment `prisma.config.ts` references `process.env.DATABASE_URL` outside a runtime that auto-loads `.env` (Next.js itself auto-loads `.env` for the app, but the standalone `prisma` CLI does not) — `[ASSUMED]`, install-time registry check needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Flat `Scenario` columns (D-03/D-04) | Normalized `Vessel` table with a foreign key back to `Scenario` | Adds a join on every read for a relationship that is permanently fixed at exactly 2 rows — rejected in CONTEXT.md discussion, not revisited here |
| `src/server/application/` use-case module | Putting re-derivation directly in the Prisma repository (`repository.get()` calls `classifyEncounter()` before returning) | Would blur infrastructure (DB access) with domain orchestration; also makes the repository harder to unit-test in isolation from the domain layer. Recommend the application-layer placement (see Architecture Patterns) |
| `src/server/application/` use-case module | Calling `classifyEncounter()` directly in the tRPC router handler | Violates D-10/CLAUDE.md's "routers are thin adapters, no classification logic in router handlers" success criterion #4 verbatim — explicitly disallowed |
| `@prisma/adapter-pg` + `pg` | Prisma Postgres native driver adapter alternatives (`@prisma/adapter-neon`, `@prisma/adapter-planetscale`) | Those adapters target specific hosted-Postgres providers' serverless drivers (WebSocket-based pooling); D-01/D-02 lock local Docker Postgres with no hosted provider, so the plain `pg`-backed `@prisma/adapter-pg` is correct here |

**Installation:**
```bash
npm install next@16.2.10 react@19.2.7 react-dom@19.2.7 \
  @trpc/server@11.18.0 @trpc/client@11.18.0 @trpc/react-query@11.18.0 \
  @tanstack/react-query@5.101.2 \
  prisma@7.8.0 @prisma/client@7.8.0 @prisma/adapter-pg@7.8.0 pg@8.22.0 \
  dotenv
npm install -D @types/pg
```

**Version verification:** All versions above were confirmed live against the npm registry on 2026-07-17 via `npm view <pkg> version` and cross-checked against Context7's `/prisma/prisma` (v7.5.0/7.6.0 docs — 7.8.0 is the exact registry-current patch, same generator/config API) and `/trpc/trpc` official documentation. No training-data staleness was found in version numbers themselves — the staleness risk in this phase is entirely in **API shape** (Prisma 7's driver-adapter/`prisma.config.ts` architecture is a genuine post-training-cutoff-relevant breaking change from Prisma 5/6 conventions), covered in Common Pitfalls and State of the Art below.

## Package Legitimacy Audit

| Package | Registry | Age | Source Repo | slopcheck | Disposition |
|---------|----------|-----|--------------|-----------|--------------|
| `prisma` | npm | ~10 yrs (created 2016) | github.com/prisma/prisma | OK | Approved |
| `@prisma/client` | npm | ~6 yrs (created 2020) | github.com/prisma/prisma | OK | Approved |
| `@prisma/adapter-pg` | npm | ~3 yrs (created 2023) | github.com/prisma/prisma | OK | Approved |
| `pg` | npm | ~16 yrs (created 2010) | github.com/brianc/node-postgres | OK | Approved |
| `next` | npm | ~15 yrs (created 2011) | github.com/vercel/next.js | OK | Approved |
| `@trpc/server` | npm | ~5 yrs (created 2021) | github.com/trpc/trpc | OK | Approved |
| `@trpc/client` | npm | ~5 yrs (created 2021) | github.com/trpc/trpc | OK | Approved |
| `@trpc/react-query` | npm | ~4 yrs (created 2022) | github.com/trpc/trpc | OK | Approved |
| `@trpc/next` | npm | ~5 yrs (created 2021) | github.com/trpc/trpc | OK | Approved |
| `@tanstack/react-query` | npm | ~4 yrs (created 2022) | github.com/TanStack/query | OK | Approved |
| `zod` | npm | ~6 yrs (created 2020) | github.com/colinhacks/zod | OK | Approved (already installed) |

`slopcheck install` was run against all 11 packages listed above (2026-07-17) and every package returned `[OK]`. No package returned `[SLOP]` or `[SUS]`. No suspicious `postinstall` scripts were found on `pg`, `prisma`, or `@prisma/client` (checked via `npm view <pkg> scripts.postinstall`, all empty).

**Packages removed due to slopcheck `[SLOP]` verdict:** none
**Packages flagged as suspicious `[SUS]`:** none

*Note on `dotenv`: not run through slopcheck in this session (it is an extremely well-known, ubiquitous package — `[ASSUMED]` low-risk, but the planner should include it in a follow-up `npm view dotenv version` / slopcheck pass before install if strict verification is desired).*

> **Process note:** Running `slopcheck install <pkgs>` in this environment executes a real `npm install`, which modified this repo's actual `package.json`/`package-lock.json` and installed `node_modules` as a side effect of verification. This was detected and reverted (`git checkout -- package.json package-lock.json && rm -rf node_modules`) before finishing research, since research must not make code changes. **The planner should be aware `slopcheck install` is not a dry-run** — if re-run during planning/execution, expect it to actually install packages, and revert afterward only if that's not the intended action at that point in the plan.

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│  tRPC HTTP boundary: app/api/trpc/[trpc]/route.ts                   │
│  (fetchRequestHandler — catch-all Next.js App Router handler)       │
└───────────────────────────────┬───────────────────────────────────--┘
                                 │  createTRPCContext(req.headers)
                                 ▼
┌───────────────────────────────────────────────────────────────────--─┐
│  src/server/api/  — tRPC routers (THIN ADAPTERS ONLY)                │
│                                                                       │
│   scenario router                    gallery router                  │
│   ├── create(input: VesselSchema×2)  └── list()                     │
│   │     → calls createScenario()            → calls listGallery()   │
│   └── get(input: { shareId })                                        │
│         → calls getScenario()                                        │
│                                                                       │
│  Zod-validates input (reuses domain VesselSchema/PositionSchema,     │
│  D-11) → ONE call into the application layer → typed response.       │
│  Throws TRPCError({code:'NOT_FOUND'}) only when the application      │
│  layer signals "not found" (D-10). No classifyEncounter() calls      │
│  here, no Prisma calls here.                                         │
└───────────────────────────────┬─────────────────────────────────────┘
                                 │
                                 ▼
┌───────────────────────────────────────────────────────────────────--─┐
│  src/server/application/  — use cases (Claude's Discretion:          │
│  new layer, not explicitly named in CLAUDE.md's existing folders)    │
│                                                                       │
│   createScenario(input)                 getScenario(shareId)         │
│   ├── repository.create(input)          ├── row = repository.get(id)│
│   └── return { shareId }                ├── if (!row) return null   │
│                                          │     (router turns this     │
│                                          │      into NOT_FOUND)       │
│                                          ├── vesselA/B = mapRowToVessels(row)
│                                          ├── result = classifyEncounter(│
│                                          │       vesselA, vesselB)   │← SCEN-02:
│                                          │   (Result<ClassificationResult>,│  ALWAYS
│                                          │    domain-internal — see  │  re-run,
│                                          │    Open Question 1 for    │  never
│                                          │    !ok handling)          │  stored
│                                          └── return { ...row, verdict: result }
│                                                                       │
│   listGallery()                                                      │
│   ├── rows = repository.listCurated()                                │
│   └── rows.map(row => ({ ...row, verdict: classifyEncounter(...) })) │
└───────────────────────────────┬─────────────────────────────────────┘
                                 │
                    ┌────────────┴─────────────┐
                    ▼                          ▼
┌───────────────────────────┐   ┌─────────────────────────────────────┐
│ src/domain/colregs/        │   │ src/server/db/ — Prisma repository  │
│ classifyEncounter()         │   │                                     │
│ (Phase 2, framework-free,   │   │ ScenarioRepository                  │
│ zero imports from server/)  │   │ ├── create(vesselA, vesselB, ...)  │
│                             │   │ ├── findByShareId(id)               │
│ RETURNS: Result<Classification│  │ └── findCurated()                  │
│ Result> — never persisted,  │   │                                     │
│ recomputed on EVERY read    │   │ prisma = new PrismaClient({adapter})│
└───────────────────────────--┘   └──────────────────┬──────────────────┘
                                                       ▼
                                     ┌──────────────────────────────────┐
                                     │ Postgres (Docker container,       │
                                     │ D-01) — Scenario table, flat      │
                                     │ vesselA*/vesselB* columns,        │
                                     │ NO verdict column (D-06)          │
                                     └──────────────────────────────────┘
```

### Recommended Project Structure
```
prisma/
├── schema.prisma            # generator (prisma-client, output path), datasource (no url — see prisma.config.ts)
└── migrations/               # committed to git (standard Prisma convention)
prisma.config.ts              # project root — DATABASE_URL wiring lives HERE in Prisma 7, not schema.prisma
docker-compose.yml            # project root — local Postgres service (D-01)
src/
├── domain/                   # UNCHANGED from Phase 1/2 — zero new imports added here
├── server/
│   ├── db/
│   │   ├── client.ts         # PrismaClient singleton + PrismaPg adapter, HMR-safe globalThis pattern
│   │   └── scenario-repository.ts   # thin Prisma query wrapper, maps rows <-> flat columns
│   ├── application/
│   │   └── scenario-service.ts      # createScenario/getScenario/listGallery use cases — calls classifyEncounter() here
│   └── api/
│       ├── trpc.ts           # initTRPC, createTRPCContext, createTRPCRouter, publicProcedure
│       └── routers/
│           ├── scenario.ts   # scenario.create / scenario.get
│           ├── gallery.ts    # gallery.list
│           └── _app.ts       # appRouter = createTRPCRouter({ scenario, gallery })
app/
└── api/trpc/[trpc]/route.ts  # fetchRequestHandler catch-all, GET+POST
```

### Pattern 1: Prisma 7 driver-adapter client setup (mandatory, not optional)
**What:** Every `PrismaClient` instantiation must receive a driver adapter; there is no "default" engine fallback in 7.x.
**When to use:** Always, for this project's Postgres connection.
**Example:**
```typescript
// Source: Context7 /prisma/prisma (7.5.0 README) + official upgrade guide
// src/server/db/client.ts
import { PrismaClient } from "../../../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

### Pattern 2: Re-derive-on-read application-layer use case (SCEN-02 core mechanism)
**What:** A use-case function that fetches raw stored inputs, maps them to domain `Vessel` objects, and calls `classifyEncounter()` fresh — every single time, no caching, no memoized verdict.
**When to use:** `scenario.get` and `gallery.list` — anywhere a scenario's verdict is exposed to a caller.
**Example:**
```typescript
// Source: derived from Phase 2's classify-encounter.ts signature + tRPC's
// documented "routers call a service" pattern (createCallerFactory docs)
// src/server/application/scenario-service.ts
import { classifyEncounter } from "../../domain/colregs/classify-encounter.js";
import type { Vessel } from "../../domain/vessel/vessel.js";
import type { ScenarioRepository, ScenarioRow } from "../db/scenario-repository.js";

function rowToVessels(row: ScenarioRow): { vesselA: Vessel; vesselB: Vessel } {
  return {
    vesselA: {
      position: { x: row.vesselAPosX, y: row.vesselAPosY },
      heading: row.vesselAHeading,
      speed: row.vesselASpeed,
      type: row.vesselAType,
    },
    vesselB: {
      position: { x: row.vesselBPosX, y: row.vesselBPosY },
      heading: row.vesselBHeading,
      speed: row.vesselBSpeed,
      type: row.vesselBType,
    },
  };
}

export function makeScenarioService(repository: ScenarioRepository) {
  return {
    async getScenario(shareId: string) {
      const row = await repository.findByShareId(shareId);
      if (!row) return null; // router turns this into TRPCError NOT_FOUND (D-10)
      const { vesselA, vesselB } = rowToVessels(row);
      const verdict = classifyEncounter(vesselA, vesselB); // ALWAYS re-run — SCEN-02
      return { ...row, verdict }; // verdict is Result<ClassificationResult> -- see Open Question 1
    },
  };
}
```

### Pattern 3: tRPC router as thin adapter (D-10/D-11, success criterion #4)
**What:** Router procedures validate input (reusing domain Zod schemas) and delegate to exactly one application-layer call — no branching logic, no direct Prisma or domain calls.
**When to use:** `scenario` and `gallery` routers.
**Example:**
```typescript
// Source: Context7 /trpc/trpc official quickstart + error-handling skill docs
// src/server/api/routers/scenario.ts
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "../trpc.js";
import { VesselSchema } from "../../../domain/vessel/vessel.js"; // D-11: reuse, don't redefine

const CreateScenarioInput = z.object({
  vesselA: VesselSchema,
  vesselB: VesselSchema,
});

export const scenarioRouter = createTRPCRouter({
  create: publicProcedure
    .input(CreateScenarioInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.scenarioService.createScenario(input.vesselA, input.vesselB);
    }),
  get: publicProcedure
    .input(z.object({ shareId: z.string() }))
    .query(async ({ ctx, input }) => {
      const scenario = await ctx.scenarioService.getScenario(input.shareId);
      if (!scenario) {
        throw new TRPCError({ code: "NOT_FOUND" }); // D-10
      }
      return scenario;
    }),
});
```

### Pattern 4: Server-side caller for router integration tests
**What:** `createCallerFactory(appRouter)` builds a caller that invokes procedures directly (no HTTP), ideal for Vitest integration tests of the tRPC layer.
**When to use:** Testing `scenario.create` → `scenario.get` round-trips without booting an HTTP server.
**Example:**
```typescript
// Source: Context7 /trpc/trpc server-side-calls docs
import { createCallerFactory } from "../src/server/api/trpc.js";
import { appRouter } from "../src/server/api/routers/_app.js";

const createCaller = createCallerFactory(appRouter);
const caller = createCaller({ /* test context */ });
const { shareId } = await caller.scenario.create({ vesselA, vesselB });
const fetched = await caller.scenario.get({ shareId });
```

### Anti-Patterns to Avoid
- **Calling `new PrismaClient()` with no adapter:** Throws `PrismaClientInitializationError` (code `P2038`) at first query — a Prisma-5/6-era habit that no longer works in 7.x.
- **Putting `url = env("DATABASE_URL")` inside `datasource db {}` in `schema.prisma`:** This was the Prisma 5/6 convention; in Prisma 7 the datasource block has no `url`, and `DATABASE_URL` wiring happens exclusively in `prisma.config.ts`. Leaving both in place doesn't error but the schema-level one is simply ignored — confusing for whoever reads the codebase next.
- **Storing the `ClassificationResult`/verdict on the `Scenario` row, even "just as a cache":** Directly violates success criterion #1 (D-06) — a schema/column that doesn't exist is the only bulletproof enforcement of SCEN-02; a cached-but-"always overwritten" column is one missed code path away from serving a stale verdict.
- **Calling `classifyEncounter()` inside a tRPC router handler:** Violates success criterion #4 ("no classification logic in router handlers") — keep it in the application layer.
- **A generic `Repository<T>` base class or DI container:** CLAUDE.md's "justify every abstraction" persona and this phase's actual complexity (one table, three query shapes: create/findByShareId/findCurated) do not warrant it — a plain `ScenarioRepository` object/module with three functions is sufficient.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Non-guessable unique ID generation | A custom random-string generator (`crypto.randomBytes` + base62 encode, etc.) | Prisma's `@default(cuid())` (or `@default(uuid())`) at the schema level | D-05 already locks this; cuid/uuid are collision-resistant, URL-safe, and need zero custom code — Prisma generates them at the database-adapter layer automatically on insert |
| Postgres connection pooling | Hand-rolled connection pool management around raw `pg` client | `@prisma/adapter-pg`'s `PrismaPg` (internally manages a `pg.Pool`, accepts an existing `pg.Pool` if more control is ever needed) | Reinventing pool lifecycle/idle-error handling that `pg.Pool` + the adapter already handle correctly |
| Request-scoped DB client reuse across Next.js dev-server hot reloads | Nothing — but the *absence* of the `globalThis` singleton pattern (Pattern 1) is itself a "hand-rolled bug": creating a new `PrismaClient`/pool on every HMR reload exhausts Postgres's connection limit in local dev | The documented `globalForPrisma` singleton pattern | This is Prisma's own official recommendation, not a library, but skipping it recreates a well-known dev-time connection-exhaustion problem from scratch |
| tRPC error → HTTP status mapping | Custom error-to-HTTP-code translation logic in the route handler | `TRPCError({ code: 'NOT_FOUND' })` (D-10) — tRPC's adapter automatically maps standard `TRPCError` codes to HTTP status codes | tRPC already solves this; a custom error envelope would need its own client-side unwrapping logic on top of what tRPC's typed error channel already provides |

**Key insight:** Nothing in this phase's actual business problem (persist 2 vessels' raw data, expose 3 read/write operations, always recompute the verdict) needs a new abstraction beyond what Prisma + tRPC ship out of the box. The one deliberate custom piece — the application-layer "always re-derive" use case — is *exactly* the piece that can't be delegated to a library, because it's this project's specific domain guarantee (SCEN-02).

## Common Pitfalls

### Pitfall 1: Assuming Prisma 5/6-era `schema.prisma` conventions apply to 7.8.0
**What goes wrong:** Writing `datasource db { provider = "postgresql"; url = env("DATABASE_URL") }` and `generator client { provider = "prisma-client-js" }`, then being confused when `prisma generate`/`migrate dev` either errors or silently ignores the `url` field.
**Why it happens:** This was the correct, extremely well-documented pattern for Prisma 4/5/6 (the vast majority of tutorials, Stack Overflow answers, and training data reflect this). Prisma 7 (released ~Nov 2025) changed both fields.
**How to avoid:** Use `provider = "prisma-client"` + a required `output` path in the generator block; create `prisma.config.ts` at the project root with `datasource: { url: env("DATABASE_URL") }` (importing `dotenv/config` first, since Prisma's CLI does not auto-load `.env` the way Next.js's own runtime does).
**Warning signs:** `prisma migrate dev` complaining it can't find a datasource URL, or the generated client ending up in `node_modules/@prisma/client` instead of a custom path.

### Pitfall 2: Instantiating `PrismaClient` without a driver adapter
**What goes wrong:** `new PrismaClient()` compiles fine (TypeScript doesn't catch it) but throws `PrismaClientInitializationError` code `P2038` ("PrismaClient requires a driver adapter to connect to your database, but none was provided") on the first query at runtime.
**Why it happens:** Same root cause as Pitfall 1 — this is the single biggest breaking change in Prisma 7's architecture (removal of the Rust query-engine binary means there's no built-in connection mechanism left).
**How to avoid:** Always construct with `new PrismaClient({ adapter: new PrismaPg({ connectionString }) })`. Install `@prisma/adapter-pg` and `pg` as direct dependencies (not just transitively via `prisma`/`@prisma/client`).
**Warning signs:** Runtime error mentioning "driver adapter" or code `P2038`; this is a hard-fail at first query, not a silent bug, so it will surface immediately in any test/dev run that touches the DB.

### Pitfall 3: Treating `classifyEncounter()`'s `Result<T>` as if it always succeeds on stored data
**What goes wrong:** The application-layer read use case (Pattern 2) calls `classifyEncounter(vesselA, vesselB)` and assumes `.ok === true` because the inputs already passed `VesselSchema` validation at create time. But `classifyEncounter()` can still return `{ ok: false, reason: 'coincident-position' }` (if `vesselA.position` and `vesselB.position` are identical — Zod's `PositionSchema` does not forbid this) or, in principle, `'invalid-input'` if a non-finite number ever reached storage (Zod's bare `z.number()` in `VesselSchema` does not chain `.finite()`, so `Infinity`/`-Infinity` — though not `NaN`, which Zod's `z.number()` does reject — could theoretically pass validation and later break `classifyEncounter()`'s Stage 0 geometry).
**Why it happens:** D-10's CONTEXT.md discussion only covers the "row not found" `NOT_FOUND` case; it does not address what happens when a row *is* found but re-derivation genuinely fails. This gap was not surfaced during `/gsd:discuss-phase` and needs a planning decision (see Open Question 1).
**How to avoid:** Decide explicitly (during planning, not implicitly in code) what `scenario.get`/`gallery.list` return when `classifyEncounter()` yields `!ok` for a *found* row — do not let this be an unhandled-promise-style surprise discovered only when someone manually crafts coincident-position input via a direct API call (the chart UI in Phase 4 likely prevents this in normal use, but the API itself has no such guard).
**Warning signs:** A TypeScript error/lint on an unchecked `result.value` access in the application layer is a good early signal this hasn't been decided yet.

### Pitfall 4: ESM/`type: module` friction between Prisma 7's generated client and Next.js/Vitest
**What goes wrong:** Prisma 7 ships as ESM and generates an ESM client by default; import paths without file extensions, or CommonJS-style `require()`, can fail to resolve depending on `moduleResolution`.
**Why it happens:** This repo's `tsconfig.json` already uses `"module": "NodeNext"` / `"moduleResolution": "NodeNext"` and `package.json` already has `"type": "module"` — this is actually already correctly configured (verified in this session), so the risk is *introducing* a CommonJS import somewhere (e.g., a stray `require()` in a config file) rather than the base config being wrong.
**How to avoid:** Keep all new `src/server/` files using `.js`-suffixed relative imports (NodeNext ESM convention, matching the existing `src/domain/` files, which already do this — e.g. `import { ok } from "../shared/result.js"`). Generated Prisma client imports should also resolve via the relative `output` path with an explicit `.js` extension where the generator's `moduleFormat`/`importFileExtension` settings require it (default `moduleFormat` for `prisma-client` is ESM, matching this project).
**Warning signs:** `ERR_MODULE_NOT_FOUND` at runtime, or Vitest failing to resolve the generated Prisma client import.

### Pitfall 5: Confusing "no seed data this phase" (D-07) with "no schema support for seeding" (D-09)
**What goes wrong:** Interpreting D-07 ("no gallery seed data yet") as a reason to also skip the `isCurated`/`displayOrder`/`rationale` columns, deferring the whole gallery schema shape to Phase 5.
**Why it happens:** Surface reading of "Phase 3 builds the gallery capability only — no seed data" could be misread as "don't touch gallery fields at all."
**How to avoid:** D-08/D-09 are explicit and binding: add `isCurated Boolean @default(false)`, `displayOrder Int?`, and `rationale String?` to the `Scenario` model **in this phase's migration**, leaving them unpopulated/null/default until Phase 5 writes real data. Skipping this now means a second migration later purely to add columns Phase 5 needs — CONTEXT.md explicitly calls out avoiding that.
**Warning signs:** A Phase 3 plan whose Prisma schema has no `isCurated`/`rationale`/`displayOrder` fields at all.

## Code Examples

### Docker Compose for local Postgres (D-01)
```yaml
# Source: pattern verified against Context7 /prisma/prisma docker/README.md
# ("docker compose up -d", default Postgres port 5432) + standard community
# convention (Medium confidence secondary sources, cross-checked structurally
# against Prisma's own docker/ fixtures)
services:
  postgres:
    image: postgres:17
    restart: unless-stopped
    environment:
      POSTGRES_USER: colregs
      POSTGRES_PASSWORD: colregs
      POSTGRES_DB: colregs_navigator
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U colregs"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres-data:
```
Corresponding `.env` (not committed): `DATABASE_URL="postgresql://colregs:colregs@localhost:5432/colregs_navigator?schema=public"`

### Minimal `prisma.config.ts` (Prisma 7)
```typescript
// Source: Context7 /prisma/prisma (7.5.0) — Init snapshot + README
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: env("DATABASE_URL") },
});
```

### Minimal `schema.prisma` reflecting D-03/D-04/D-05/D-06/D-08/D-09
```prisma
// Source: pattern synthesized from Context7 /prisma/prisma generator-block
// docs + this phase's locked CONTEXT.md decisions (D-03/D-04/D-05/D-06/D-08/D-09)
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
  // no `url` here in Prisma 7 -- wired via prisma.config.ts
}

model Scenario {
  id             String   @id @default(cuid())
  createdAt      DateTime @default(now())

  vesselAPosX    Float
  vesselAPosY    Float
  vesselAHeading Float
  vesselASpeed   Float
  vesselAType    String   // mirrors domain VesselTypeSchema's 5 kebab-case values

  vesselBPosX    Float
  vesselBPosY    Float
  vesselBHeading Float
  vesselBSpeed   Float
  vesselBType    String

  isCurated      Boolean  @default(false) // D-08 -- gallery flag, unused until Phase 5
  displayOrder   Int?                      // D-08 -- gallery ordering, unused until Phase 5
  rationale      String?                   // D-09 -- gallery rationale text, null until Phase 5

  // NOTE: deliberately NO verdict/encounterType/giveWay/standOn column anywhere
  // in this model -- D-06, success criterion #1.
}
```

## State of the Art

| Old Approach (Prisma 5/6, still in most training data) | Current Approach (Prisma 7.8.0, locked by CLAUDE.md) | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `generator client { provider = "prisma-client-js" }`, client generated into `node_modules/@prisma/client` | `generator client { provider = "prisma-client", output = "<path>" }`, client generated to a custom path, imported from there | Prisma 7.0.0 (~Nov 2025) | Import paths change; `output` becomes required, not optional |
| `datasource db { url = env("DATABASE_URL") }` inside `schema.prisma`; `.env` auto-loaded by Prisma CLI | `prisma.config.ts` at project root defines `datasource.url`; `.env` is **not** auto-loaded by the CLI (needs explicit `dotenv/config` import) | Prisma 7.0.0 | A schema-only setup silently has no working `DATABASE_URL` until `prisma.config.ts` is added |
| `new PrismaClient()` — Rust query-engine binary handled the DB connection internally, no adapter needed for standard Postgres/MySQL/SQLite | `new PrismaClient({ adapter })` — driver adapter (`@prisma/adapter-pg` for Postgres) is **mandatory**; the Rust engine binary is removed entirely | Prisma 7.0.0 | Omitting the adapter throws `P2038` at first query, not a compile error |
| Prisma Client bundled a Rust-compiled native binary (platform-specific download, historically an Alpine/`openssl` Docker pain point) | Pure TypeScript client + WASM query compiler/planner — no native binary in the client itself (the separate schema-engine binary used by `prisma migrate` still exists) | Prisma 7.0.0 | Smaller bundle, faster queries (~3.4x per Prisma's own benchmark, external claim not independently re-verified here), fewer Docker base-image compatibility issues for the *client* — the CLI's schema engine is a separate concern |

**Deprecated/outdated:**
- `prisma-client-js` generator provider: superseded by `prisma-client` as the default in 7.x (the old provider name may still work in a compatibility mode per Prisma's migration guide, but CLAUDE.md's locked 7.8.0 should use the new default rather than an explicitly legacy path).
- Schema-embedded `datasource.url`: superseded by `prisma.config.ts`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `dotenv` should be added as an explicit dependency for `prisma.config.ts` | Standard Stack (Supporting) | Low — if Next.js's own env-loading already covers the `prisma` CLI's needs in this project's exact setup, this is an unnecessary but harmless dependency; if wrong the other way (needed but omitted), `prisma migrate dev` fails immediately and loudly at CLI invocation, easy to diagnose |
| A2 | Recommended `output = "../generated/prisma"` path and `moduleFormat`/ESM defaults for the `prisma-client` generator will not conflict with this project's `NodeNext` TypeScript config | Code Examples / Pitfall 4 | Medium — if the generator's default ESM output needs an explicit `moduleFormat`/`importFileExtension` override to interoperate with `NodeNext`, first `tsc`/Vitest run against generated-client imports would surface a module-resolution error; not a data-loss risk, just a setup friction point to verify during Wave 0 of implementation |
| A3 | Placing the "always re-derive on read" use case in a new `src/server/application/` layer (rather than the repository or router) is the right interpretation of CLAUDE.md's Clean Architecture layering | Architecture Patterns / Architectural Responsibility Map | Low-Medium — explicitly flagged as Claude's Discretion in CONTEXT.md, so this is a recommendation, not a locked decision; if the planner disagrees, the repository-layer or router-layer alternatives are functionally equivalent as long as `classifyEncounter()` is still called fresh on every read and never in a router handler directly (which IS locked, per success criterion #4) |
| A4 | `@testing-library/user-event` version/exact npm details noted in CLAUDE.md as "MEDIUM confidence, registry lookup interrupted" are **not relevant to this phase** (Phase 3 has no UI/component tests) | Project Constraints | None for this phase — carried over from CLAUDE.md for completeness only, does not affect Phase 3 planning |

**If empty:** N/A — see table above; four assumptions logged, all low-to-medium risk, none blocking.

## Open Questions (RESOLVED)

1. **What should `scenario.get`/`gallery.list` return when `classifyEncounter()` returns `{ ok: false }` for a row that WAS found?**
   - What we know: D-10 locks the `NOT_FOUND` `TRPCError` for a missing row. `classifyEncounter()` returns `Result<ClassificationResult>`, which is domain-internal and explicitly not meant to cross the tRPC boundary (D-10's own rationale).
   - What's unclear: A genuinely degenerate stored scenario (coincident positions — not currently prevented by `VesselSchema`/`PositionSchema`, since positions are unconstrained per Phase 1's "unbounded plane" design note) would make the read use case receive `!ok`. There's no CONTEXT.md decision on whether to (a) reject such input at `scenario.create` time (validate `classifyEncounter()` succeeds before persisting, even though the verdict itself is discarded — a "dry run" validation), (b) surface a distinct tRPC error code (e.g. `UNPROCESSABLE_CONTENT`) at read time, or (c) let the API return a response shape that includes a nullable/degenerate verdict field the (future, Phase 4) client must handle.
   - Recommendation: Favor option (a) — validate at `scenario.create` time by calling `classifyEncounter()` once (discarding the result, never storing it) purely to reject genuinely un-classifiable input with a `BAD_REQUEST` `TRPCError` at write time. This keeps `scenario.get`'s contract simple (a found row can always be classified) and matches the "fail fast at the boundary" idiom already used for Zod validation. This needs an explicit planning decision, not an implicit implementation choice.
   - **RESOLVED:** Plan 03-02 Task 2 adopted option (a) — `createScenario` calls `classifyEncounter()` as a dry run (result discarded, never persisted) and rejects with `TRPCError({ code: 'BAD_REQUEST' })` on `!ok`, so `scenario.get`/`gallery.list` can assume a found row is always classifiable (with a defensive `INTERNAL_SERVER_ERROR` fallback for the theoretically-unreachable read-time failure).

2. **Should `@trpc/react-query`/`TRPCReactProvider` client-side scaffold be built in this phase or deferred to Phase 4?**
   - What we know: This phase's 4 success criteria only mention routers (`scenario`/`gallery`), not any client consumption. ROADMAP.md assigns the interactive chart/UI to Phase 4.
   - What's unclear: Whether "thin adapters... expose create/get/list operations" implies the client wiring must exist and be demonstrably callable end-to-end in this phase (e.g. via a smoke-test page), or whether router-level tests (via `createCallerFactory`) are sufficient proof this phase is "done."
   - Recommendation: Build only the server-side scaffold (routers + `createTRPCContext` + route handler) and verify via `createCallerFactory`-based Vitest integration tests, per this phase's stated scope ("No UI (Phase 4/5)"). Install `@trpc/react-query`/`@tanstack/react-query` as dependencies now (cheap, avoids a second install later) but defer building `TRPCReactProvider`/`layout.tsx` wiring to Phase 4 unless the planner decides a minimal smoke-test page adds meaningful verification value now.
   - **RESOLVED:** Plans 03-01 and 03-03 adopted the recommendation — `@trpc/react-query`/`@tanstack/react-query` are installed as dependencies now, but `TRPCReactProvider`/`layout.tsx` client wiring is explicitly deferred to Phase 4; Phase 3 verifies routers via `createCallerFactory`-based Vitest integration tests only (Plan 03-03).

3. **Does `VesselTypeSchema`'s 5-value string union need a Postgres-level enum, or is a plain `String` column sufficient?**
   - What we know: CLAUDE.md's Claude's Discretion item explicitly calls out confirming the Prisma columns reuse Phase 1's exact 5-value kebab-case union (D-12 there) rather than redefining it.
   - What's unclear: Prisma supports native Postgres `enum` types (`enum VesselType { ... }` in `schema.prisma`, compiled to a Postgres `CREATE TYPE`), which would give DB-level enforcement, versus a plain `String` column that only Zod validates at the tRPC input boundary (not enforced if a row were ever written outside the Zod-validated path).
   - Recommendation: Use a plain `String` column (not a Postgres native enum) for `vesselAType`/`vesselBType`. Rationale: the *only* write path is `scenario.create`'s Zod-validated tRPC input (D-11) — there's no raw-SQL or admin-tool write path in this project's scope that would bypass Zod, so a native Postgres enum adds a second place (migration + schema) that must stay in sync with `VesselTypeSchema` for no additional real-world safety in this project's actual usage pattern. A `String` column is also one less thing to migrate if Phase 2's 5-value union ever changes.
   - **RESOLVED:** Plan 03-01's schema task adopted the recommendation — `vesselAType`/`vesselBType` are plain `String` columns, not a native Postgres enum.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js 16 / Prisma 7 (requires 20.19+, 22.x recommended) | Yes | v22.23.1 | — |
| npm | Package installation | Yes | 10.9.8 | — |
| Docker / Docker Compose | Local Postgres (D-01) | **Not available in this research sandbox** (`docker` command not found) | — | This is a per-developer-machine requirement, not a research-environment blocker — the phase's setup guide (deliverable per CLAUDE.md's documentation expectations) must document Docker Desktop installation as a prerequisite. Flag for `/gsd:execute-phase` to verify Docker is present on the actual execution machine before running `docker compose up`. |
| `psql` (Postgres CLI) | Manual DB inspection (optional, not required for the phase's success criteria) | Not checked / not required | — | Prisma Studio (`npx prisma studio`) or `docker exec -it <container> psql` are documented fallbacks that don't require a host-installed `psql` |

**Missing dependencies with no fallback:**
- Docker/Docker Compose — no code-level fallback exists for "local Postgres" per D-01/D-02 (a hosted DB was explicitly declined). This blocks actually running migrations/tests against a live database, but does NOT block writing the schema, routers, or unit tests that mock the repository layer. The plan should sequence "write schema + routers + unit tests with mocked repository" as independently verifiable from "stand up Docker Postgres and run integration tests," so a Docker-unavailable environment can still make partial progress.

**Missing dependencies with fallback:**
- `psql` — Prisma Studio or `docker exec` psql access cover manual inspection needs.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | No | Explicitly out of scope project-wide (PROJECT.md: "no auth", scenarios shareable by link only) |
| V3 Session Management | No | No sessions exist in this phase or project |
| V4 Access Control | Partial | No per-user access control exists (by design — public share-by-link model). The only "access control" is possession of the non-guessable share ID itself — this is a deliberate security-through-obscurity model the project has already accepted (PROJECT.md), not a gap this phase needs to close. Worth noting explicitly rather than silently accepting: cuid()/uuid() IDs are not brute-forceable in practice (122+ bits of entropy for UUIDv4; cuid's collision-resistant design is similarly large), so this is a reasonable control for a portfolio project's threat model. |
| V5 Input Validation | Yes | Zod (`VesselSchema`/`PositionSchema` reused per D-11) validates all `scenario.create` input at the tRPC boundary before it reaches Prisma — this is the standard, correct control and already locked by CONTEXT.md/CLAUDE.md. No additional library needed. |
| V6 Cryptography | Partial | Share-ID generation (`cuid()`/`uuid()`) is Prisma's own value-generator, not hand-rolled — appropriate per "Don't Hand-Roll" above. No other cryptographic operations exist in this phase (no passwords, no signing, no encryption at rest beyond whatever the hosting Postgres instance provides). |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|----------------------|
| SQL injection via raw queries | Tampering | Not applicable if all queries go through Prisma Client's generated, parameterized query methods (`prisma.scenario.create(...)`, `.findUnique(...)`) — **do not** introduce `prisma.$queryRawUnsafe` or raw SQL string concatenation anywhere in this phase's repository code |
| Share-ID enumeration / guessing | Information Disclosure | cuid()/uuid() (D-05) provide sufficient entropy that sequential-guessing attacks are infeasible; this is the standard mitigation already locked — no additional rate-limiting is in this phase's scope (no CONTEXT.md decision requiring it, and the project has explicitly no-auth, low-stakes data — scenarios are non-sensitive maritime geometry, not PII) |
| Prisma Client info-leak via error messages | Information Disclosure | tRPC's default `errorFormatter` should not leak raw Prisma error internals (e.g. full SQL, connection strings) to API responses in production. Recommend the standard tRPC pattern (Context7-verified) of formatting errors to strip `error.cause` details unless in a Zod-validation-error case (already shown in Code Examples' error-handling pattern) — worth an explicit `errorFormatter` in `src/server/api/trpc.ts` rather than tRPC's un-customized default, since Prisma error objects can be verbose. This is a MEDIUM-confidence recommendation (general best practice, not a CONTEXT.md-locked requirement) — flag as a planning nice-to-have, not a blocking success criterion. |
| Unrestricted resource growth (unlimited `scenario.create` calls, no auth) | Denial of Service | No rate-limiting exists or is required by CONTEXT.md/PROJECT.md for this milestone (portfolio project, not a production service under real load) — explicitly out of scope; noting for completeness only, not a recommendation to add scope. |

## Sources

### Primary (HIGH confidence)
- Context7 `/prisma/prisma` (7.5.0 docs, matching current 7.8.0 registry version's generator/config API) — `schema.prisma` generator block structure, `prisma.config.ts` shape, driver-adapter requirement (`P2038` error source), `PrismaClient` import paths, `cuid()`/`uuid()`/`nanoid()` value generators, Docker Compose command reference
- Context7 `/trpc/trpc` — Next.js App Router file structure, `createTRPCContext`/`fetchRequestHandler` route handler setup, Zod input validation pattern, `TRPCError` + `errorFormatter` for Zod errors, `createCallerFactory`/server-side caller pattern, `TRPCReactProvider` client wiring
- npm registry (`npm view <pkg> version`, `npm view <pkg> time.created`, `npm view <pkg> repository.url`, `npm view <pkg> scripts.postinstall`) — live version/age/source-repo/postinstall-script data for all 11 recommended packages, fetched 2026-07-17
- `slopcheck install <11 packages>` — run 2026-07-17, all 11 packages returned `[OK]`, no `[SLOP]`/`[SUS]` findings
- Direct codebase inspection: `src/domain/vessel/vessel.ts`, `src/domain/colregs/classify-encounter.ts`, `src/domain/colregs/types.ts`, `src/domain/shared/result.ts`, `src/domain/geometry/relative-bearing.ts`, `src/domain/geometry/cpa.ts`, `src/domain/colregs/risk-of-collision.ts`, `tsconfig.json`, `vitest.config.ts`, `package.json` — confirms exact function signatures, `Result<T>` failure modes, and existing ESM/TypeScript configuration this phase must integrate with

### Secondary (MEDIUM confidence)
- WebFetch of https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7 — corroborates Context7 findings on generator/config/adapter changes, adds Node.js 20.19+/TypeScript 5.4+ prerequisite detail (this project's Node v22.23.1/TypeScript 7.0.2 both exceed these)
- WebSearch results (Prisma 7 announcement blog, tomodahinata.com migration guide, dev.to, digitalapplied.com, aysh.me) — cross-confirm the "Rust-free," "mandatory driver adapters," "prisma.config.ts default" narrative across multiple independent sources; treated as MEDIUM since these are third-party blog summaries, but consistent with and corroborated by the Context7/official-docs primary sources above
- WebSearch docker-compose + Prisma community pattern (Medium/Nerd-for-Tech articles) — general docker-compose.yml shape (port mapping, env vars, volumes) cross-checked structurally against Prisma's own `docker/README.md` fixture (Context7)

### Tertiary (LOW confidence)
- None — all findings in this research were corroborated by at least a primary or secondary source above.

## Metadata

**Confidence breakdown:**
- Standard stack (versions): HIGH — every version live-verified against npm registry and matches CLAUDE.md exactly, zero discrepancies found
- Prisma 7 architecture (generator/config/adapter): HIGH — corroborated by Context7 official docs, official Prisma upgrade guide (WebFetch), and multiple independent WebSearch sources, plus a live P2038-error source-code excerpt confirming the adapter is enforced at runtime
- tRPC + Next.js App Router integration: HIGH — Context7's official `/trpc/trpc` docs give the exact, current recommended file structure and code for this exact combination
- Application-layer placement (Pattern 2's location) / degenerate-Result-on-read handling: MEDIUM — genuinely unresolved by CONTEXT.md, flagged explicitly in Open Questions 1 and Assumption A3 rather than asserted as settled fact
- Docker Compose specifics: MEDIUM — no single authoritative "the" docker-compose.yml exists for this use case; the example given is a synthesis of Prisma's own docker fixture conventions plus verified community patterns, not a single copy-pasted official source

**Research date:** 2026-07-17
**Valid until:** ~30 days for the stack/architecture findings (Prisma 7 is very recently released — watch for patch releases that could adjust minor API details); the Open Questions are planning-time decisions, not time-sensitive facts, and remain valid until explicitly resolved by the planner/discuss-phase.
