# Phase 3: Persistence & API Layer - Pattern Map

**Mapped:** 2026-07-17
**Files analyzed:** 15 (new) + 1 (modified)
**Analogs found:** 6 / 15 (in-codebase, convention-level) — the remaining 9 have **no in-codebase role analog** (this phase is the first to introduce `src/server/`, `app/`, and `prisma/`); for those, RESEARCH.md's Code Examples / Architecture Patterns sections are the canonical source and are cited below in place of a codebase file.

## Important Context for the Planner

`src/domain/` (Phases 1-2) is the **only** existing code in this repo. There are zero `controllers`, `services`, `repositories`, or `routes` to copy structural shape from — this phase is greenfield for every persistence/API role. What IS reusable from `src/domain/` is not role-analogy but **convention-analogy**: ESM import style, Zod-schema-as-type-boundary idiom, `Result<T>` discipline, JSDoc/decision-ID commenting style, and the Vitest test/fixture layout. Every new file below should match these conventions even though no prior file plays the same *role*.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `prisma/schema.prisma` | model/config | CRUD | *(none in repo)* | no-analog — see RESEARCH.md "Code Examples" |
| `prisma.config.ts` | config | — | *(none in repo)* | no-analog — see RESEARCH.md "Code Examples" |
| `docker-compose.yml` | config | — | *(none in repo)* | no-analog — see RESEARCH.md "Code Examples" |
| `.env` (uncommitted) / `.env.example` | config | — | *(none in repo)* | no-analog |
| `src/server/db/client.ts` | service (singleton/infra) | request-response | `src/domain/colregs/classify-encounter.ts` (ESM import convention only) | convention-match |
| `src/server/db/scenario-repository.ts` | model/repository | CRUD | `src/domain/vessel/vessel.ts` (Zod-as-type-boundary) + `src/domain/shared/result.ts` (nullable/never-throw discipline) | convention-match |
| `src/server/application/scenario-service.ts` | service (use-case/application) | request-response, orchestration | `src/domain/colregs/classify-encounter.ts` (composition-of-pure-functions structure, JSDoc/decision-ID header style) | role-adjacent (closest structural match in repo) |
| `src/server/api/trpc.ts` | config/middleware (tRPC init) | request-response | *(none in repo)* | no-analog — see RESEARCH.md Pattern 3 |
| `src/server/api/routers/scenario.ts` | controller/route | request-response | `src/domain/vessel/vessel.ts` (Zod schema reuse for input) | convention-match |
| `src/server/api/routers/gallery.ts` | controller/route | request-response, CRUD (read) | `src/server/api/routers/scenario.ts` (sibling file, same phase) | role-match (once scenario.ts exists) |
| `src/server/api/routers/_app.ts` | config (router composition) | — | *(none in repo)* | no-analog — trivial `createTRPCRouter({...})` composition |
| `app/api/trpc/[trpc]/route.ts` | route/controller | request-response | *(none in repo)* | no-analog — see RESEARCH.md Pattern (fetchRequestHandler) |
| `src/server/application/scenario-service.test.ts` | test | — | `src/domain/colregs/classify-encounter.test.ts` | exact (test conventions) |
| `src/server/api/routers/scenario.test.ts` (integration, via `createCallerFactory`) | test | request-response | `src/domain/colregs/classify-encounter.test.ts` | exact (test conventions) |
| `src/server/db/scenario-repository.fixtures.ts` (if used) | test fixture | — | `src/domain/colregs/classify-encounter.fixtures.ts` | exact (fixture conventions) |
| `package.json` (modified) | config | — | *(existing file, modified in place)* | n/a |

## Pattern Assignments

### `src/server/db/client.ts` (service/singleton, infra)

**Analog:** No role analog exists. Convention source: `src/domain/colregs/classify-encounter.ts` imports (ESM `.js`-suffixed relative imports).

**Imports pattern** (`src/domain/colregs/classify-encounter.ts` lines 16-27):
```typescript
import type { Vessel } from "../vessel/vessel.js";
import { ok, type Result } from "../shared/result.js";
import { relativeBearing } from "../geometry/relative-bearing.js";
import { cpa } from "../geometry/cpa.js";
import { riskOfCollision } from "./risk-of-collision.js";
import { rule18Overrides, vesselPriority } from "./vessel-priority.js";
import type {
  ClassificationResult,
  EncounterType,
  ReasoningTrailEntry,
  VesselLabel,
} from "./types.js";
```
Every new `src/server/**` file MUST follow this same convention: relative imports end in `.js` (NodeNext ESM resolution — confirmed in `tsconfig.json`: `"module": "NodeNext"`, `"moduleResolution": "NodeNext"`), even though the source files are `.ts`. This applies to the generated Prisma client import too, per RESEARCH.md Pitfall 4.

**Core pattern** — copy verbatim from RESEARCH.md "Pattern 1" (Architecture Patterns section, `03-RESEARCH.md` lines 253-273):
```typescript
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
No in-repo analog for the `globalThis` HMR-safe singleton pattern exists (nothing in `src/domain/` holds module-level mutable state) — this is a new convention introduced by this phase, sourced entirely from RESEARCH.md/Prisma's own official pattern.

---

### `src/server/db/scenario-repository.ts` (repository, CRUD)

**Analog:** `src/domain/vessel/vessel.ts` (Zod-schema-as-type-boundary convention) + `src/domain/shared/result.ts` (never-throw / explicit failure-signaling discipline, though D-10 confirms `Result<T>` itself stays domain-internal and must NOT be used at this layer's external-facing return values consumed by the application layer — a plain `null` return for "not found" is the correct analog per RESEARCH.md Pattern 2, not `Result<T>`).

**Zod-as-boundary pattern to mirror** (`src/domain/vessel/vessel.ts` lines 9-38):
```typescript
export const VesselTypeSchema = z.enum([
  "power-driven",
  "sailing",
  "fishing",
  "not-under-command",
  "restricted-in-ability-to-maneuver",
]); // D-12: kebab-case, matches COLREGS terminology verbatim

export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const VesselSchema = z.object({
  position: PositionSchema,
  heading: z.number().gte(0).lt(360),
  speed: z.number().gte(0),
  type: VesselTypeSchema,
});

export type Vessel = z.infer<typeof VesselSchema>;
export type Position = z.infer<typeof PositionSchema>;
export type VesselType = z.infer<typeof VesselTypeSchema>;
```
Note the `VesselTypeSchema`'s exact 5 kebab-case values — RESEARCH.md's Open Question 3 recommends the Prisma `vesselAType`/`vesselBType` columns be plain `String` (not a native Postgres enum), validated ONLY by this schema at the tRPC input boundary (D-11). The repository's row-mapping function (`rowToVessels`) must reconstruct a `Vessel` object whose `type` field is one of these exact 5 strings — do not introduce a second enum definition.

**Core CRUD/mapping pattern** — copy from RESEARCH.md "Recommended Project Structure" + Pattern 2's `rowToVessels` helper (`03-RESEARCH.md` lines 238-241, 287-302) as the shape for the repository module: three functions only (`create`, `findByShareId`, `findCurated`) — no generic `Repository<T>` base class (explicitly called out as an anti-pattern in RESEARCH.md's "Anti-Patterns to Avoid").

**Error handling / not-found convention:** Return `null` from `findByShareId` when no row matches (mirrors `src/domain/shared/result.ts`'s discipline of never throwing for an expected "no result" case, but note the *shape* differs: domain functions return `Result<T>` with a `reason`, while this infra-layer function returns a bare nullable — D-10 confirms `Result<T>` does not extend past the domain boundary, and the application layer, not the repository, is what turns `null` into a `TRPCError`).

---

### `src/server/application/scenario-service.ts` (application/use-case service)

**Analog:** `src/domain/colregs/classify-encounter.ts` — closest structural match in the repo for "a function that composes several lower-level functions/modules and returns one assembled result," even though it's domain-tier, not application-tier.

**Composition/orchestration pattern to mirror** (`src/domain/colregs/classify-encounter.ts` lines 38-63, showing the "call function, check `.ok`, propagate or continue" idiom):
```typescript
export function classifyEncounter(
  vesselA: Vessel,
  vesselB: Vessel,
  previous?: EncounterType,
): Result<ClassificationResult> {
  const trail: ReasoningTrailEntry[] = [];

  const rbAtoBResult = relativeBearing(vesselA, vesselB);
  if (!rbAtoBResult.ok) {
    return rbAtoBResult;
  }
  const rbBtoAResult = relativeBearing(vesselB, vesselA);
  if (!rbBtoAResult.ok) {
    return rbBtoAResult;
  }
  const rbAtoB = rbAtoBResult.value;
  const rbBtoA = rbBtoAResult.value;

  const cpaResult = cpa(vesselA, vesselB);
  if (!cpaResult.ok && cpaResult.reason === "invalid-input") {
    return cpaResult;
  }
  // ...
```
`scenario-service.ts` should follow the same "call, check, branch" shape when invoking `classifyEncounter()`, but must NOT propagate the raw `Result<T>` past its own boundary (D-10) — unwrap `.ok`/`.value` inside the service and return a plain object (or `null` for not-found) to the router. RESEARCH.md's Open Question 1 flags that a `!ok` result for a *found* row is unresolved by CONTEXT.md; RESEARCH.md's own recommendation (favor validating at `scenario.create` time so `scenario.get` can assume success) should be treated as the working assumption unless the planner overrides it.

**Exact signature to call into** (`classifyEncounter` export, `src/domain/colregs/classify-encounter.ts` line 38-42):
```typescript
export function classifyEncounter(
  vesselA: Vessel,
  vesselB: Vessel,
  previous?: EncounterType,
): Result<ClassificationResult>
```
`scenario.get`/`gallery.list`'s re-derivation call passes only `vesselA`/`vesselB` reconstructed from stored columns — no `previous` argument (per CONTEXT.md canonical_refs: there is no persisted classification to pass).

**Reference implementation** — copy from RESEARCH.md Pattern 2 (`03-RESEARCH.md` lines 275-315) for the full `rowToVessels` + `makeScenarioService` shape; this is the single most directly-usable code excerpt in RESEARCH.md for this file.

---

### `src/server/api/trpc.ts` (tRPC init/config)

**Analog:** None in-repo (first tRPC integration). Use RESEARCH.md Pattern 3's imports and `createCallerFactory` reference (Pattern 4, `03-RESEARCH.md` lines 352-365) as the canonical source: `initTRPC`, `createTRPCContext`, `createTRPCRouter`, `publicProcedure`, `createCallerFactory` all originate here and are imported by every router file.

---

### `src/server/api/routers/scenario.ts` (controller/route, request-response)

**Analog:** `src/domain/vessel/vessel.ts` for the Zod-schema-reuse import convention (D-11 — do not redefine `VesselSchema`).

**Full pattern** — copy from RESEARCH.md Pattern 3 verbatim (`03-RESEARCH.md` lines 317-350):
```typescript
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
Note the import path `../../../domain/vessel/vessel.js` — three levels up from `src/server/api/routers/` to `src/domain/vessel/vessel.ts` — confirm the exact relative depth matches the final directory layout during implementation.

**Error handling pattern:** `TRPCError({ code: 'NOT_FOUND' })` (D-10) is the only error-shape decision locked for this router; no `Result<T>`-style envelope crosses this boundary.

---

### `src/server/api/routers/gallery.ts` (controller/route, CRUD-read)

**Analog:** `src/server/api/routers/scenario.ts` (sibling, same phase) — once `scenario.ts` exists, `gallery.ts`'s `list` procedure should mirror its "validate input (here: no input, or an optional empty object) → delegate to exactly one application-layer call → return" shape. No `TRPCError` needed for `gallery.list` (an empty curated set is a valid, non-error result — return `[]`, not `NOT_FOUND`).

---

### `src/server/api/routers/_app.ts` (router composition)

**Analog:** None — trivial composition, no code excerpt needed beyond:
```typescript
export const appRouter = createTRPCRouter({ scenario: scenarioRouter, gallery: galleryRouter });
```

---

### `app/api/trpc/[trpc]/route.ts` (Next.js App Router catch-all handler)

**Analog:** None in-repo (first Next.js file in this project). Source entirely from RESEARCH.md's System Architecture Diagram (`03-RESEARCH.md` lines 160-165) and Standard Stack section — `fetchRequestHandler` from `@trpc/server/adapters/fetch`, exporting both `GET` and `POST` handlers, wired to `createTRPCContext` and `appRouter`.

---

### Test files (`*.test.ts`, `*.fixtures.ts`)

**Analog:** `src/domain/colregs/classify-encounter.test.ts` + `src/domain/vessel/vessel.test.ts` — exact match, copy these conventions directly.

**Import/structure pattern** (`src/domain/vessel/vessel.test.ts` lines 1-13):
```typescript
import { describe, expect, it } from "vitest";
import {
  PositionSchema,
  VesselSchema,
  VesselTypeSchema,
} from "./vessel.js";

const validVessel = {
  position: { x: 0, y: 0 },
  heading: 90,
  speed: 12,
  type: "power-driven" as const,
};
```
Note explicit `describe`/`expect`/`it` imports from `"vitest"` — `vitest.config.ts` sets `globals: false` deliberately (comment: "matches CLAUDE.md's 'no magic' persona"), so every new test file in `src/server/**` must import these explicitly too, never rely on global injection.

**Fixture-file separation pattern** (`src/domain/colregs/classify-encounter.test.ts` lines 1-24): named fixture objects (e.g. `overtakingBothDirectionsCase`) are defined in a sibling `*.fixtures.ts` file and imported into the `.test.ts` file — each fixture bundles both inputs and `expected*` fields. For `scenario-service.test.ts`/`scenario-repository` tests, follow the same shape: a fixtures file exporting named scenario-row/vessel-pair objects with `expected*` fields, imported into the test file.

**Server-side caller test pattern** (RESEARCH.md Pattern 4, `03-RESEARCH.md` lines 352-365) — use for integration-testing the tRPC routers without an HTTP server:
```typescript
import { createCallerFactory } from "../src/server/api/trpc.js";
import { appRouter } from "../src/server/api/routers/_app.js";

const createCaller = createCallerFactory(appRouter);
const caller = createCaller({ /* test context */ });
const { shareId } = await caller.scenario.create({ vesselA, vesselB });
const fetched = await caller.scenario.get({ shareId });
```

## Shared Patterns

### ESM `.js`-suffixed relative imports (NodeNext convention)
**Source:** `src/domain/colregs/classify-encounter.ts` lines 16-27, `tsconfig.json` lines 5-6 (`"module": "NodeNext"`, `"moduleResolution": "NodeNext"`)
**Apply to:** Every new `.ts` file in `src/server/` and any cross-references from `app/`.
```typescript
import type { Vessel } from "../vessel/vessel.js";
import { ok, type Result } from "../shared/result.js";
```
This is a hard, mechanical convention already enforced repo-wide — every relative import ends in `.js` even though the source is `.ts`. RESEARCH.md's Pitfall 4 confirms this is also required for the generated Prisma client import path.

### Zod schema as shared domain/API boundary contract
**Source:** `src/domain/vessel/vessel.ts` lines 9-38
**Apply to:** `src/server/api/routers/scenario.ts`'s `CreateScenarioInput`, and any Prisma-row-to-domain-object mapping in `src/server/db/scenario-repository.ts` / `src/server/application/scenario-service.ts`.
```typescript
export const VesselSchema = z.object({
  position: PositionSchema,
  heading: z.number().gte(0).lt(360),
  speed: z.number().gte(0),
  type: VesselTypeSchema,
});
export type Vessel = z.infer<typeof VesselSchema>;
```
D-11 requires reusing this exact schema in the tRPC input, not redefining a parallel `Zod` shape for the API layer.

### `Result<T>` discipline — domain-internal only, do not leak past `src/server/application/`
**Source:** `src/domain/shared/result.ts` lines 18-31
**Apply to:** `src/server/application/scenario-service.ts` (the only new-phase file that directly touches `classifyEncounter()`'s `Result<ClassificationResult>` return value)
```typescript
export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; reason: DegenerateCaseReason; details?: Record<string, unknown> };
```
D-10 is explicit: this pattern stays domain-internal. `scenario-service.ts` must unwrap `.ok`/`.value` before returning anything to a router; routers and the tRPC boundary use `TRPCError` exclusively, never a `Result`-shaped response body.

### Decision-ID-referencing JSDoc/comment style
**Source:** Pervasive across `src/domain/**` — e.g. `src/domain/vessel/vessel.ts` lines 3-8, `src/domain/colregs/classify-encounter.ts` lines 1-14, `src/domain/shared/result.ts` lines 1-7
**Apply to:** All new files — every non-obvious decision (e.g. why `String` not a Postgres enum for vessel type, why no `verdict` column, why `Result<T>` doesn't cross the tRPC boundary) should carry an inline comment citing the CONTEXT.md decision ID (`D-06`, `D-10`, `D-11`, etc.), matching this codebase's existing self-documenting style.

### No generic `Repository<T>` / DI container
**Source:** RESEARCH.md "Anti-Patterns to Avoid" (`03-RESEARCH.md` lines 372); consistent with `src/domain/`'s avoidance of unnecessary abstraction layers (e.g. `classify-encounter.ts` calls concrete named functions like `riskOfCollision`, `vesselPriority` directly, no interface/strategy indirection)
**Apply to:** `src/server/db/scenario-repository.ts` — a plain module/object with `create`/`findByShareId`/`findCurated` functions, not a generic base class.

## No Analog Found

Files with no close match in the codebase (planner should use RESEARCH.md patterns instead — all are cited above with exact `03-RESEARCH.md` line ranges):

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `prisma/schema.prisma` | model/config | CRUD | First Prisma schema in repo; use RESEARCH.md "Minimal `schema.prisma`" code example (lines 462-497) verbatim as starting point |
| `prisma.config.ts` | config | — | First Prisma 7 config file; use RESEARCH.md "Minimal `prisma.config.ts`" example (lines 448-459) |
| `docker-compose.yml` | config | — | First Docker Compose file; use RESEARCH.md "Docker Compose for local Postgres" example (lines 420-446) |
| `src/server/api/trpc.ts` | config/middleware | request-response | First tRPC init file; use RESEARCH.md Pattern 3 imports + Pattern 4's `createCallerFactory` reference |
| `src/server/api/routers/_app.ts` | config | — | Trivial composition, no analog needed |
| `app/api/trpc/[trpc]/route.ts` | route | request-response | First Next.js App Router file in repo; use RESEARCH.md System Architecture Diagram + Standard Stack `fetchRequestHandler` guidance |

## Metadata

**Analog search scope:** Entire repo (`src/`, root config files) via `find`/`Read` — confirmed no `server/`, `app/`, or `prisma/` directories exist prior to this phase.
**Files scanned:** `package.json`, `tsconfig.json`, `vitest.config.ts`, `src/domain/vessel/vessel.ts`, `src/domain/vessel/vessel.test.ts`, `src/domain/colregs/classify-encounter.ts`, `src/domain/colregs/classify-encounter.test.ts`, `src/domain/colregs/types.ts`, `src/domain/shared/result.ts`
**Pattern extraction date:** 2026-07-17
