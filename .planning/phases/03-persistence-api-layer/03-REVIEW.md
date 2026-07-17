---
phase: 03-persistence-api-layer
reviewed: 2026-07-17T00:00:00Z
depth: standard
files_reviewed: 14
files_reviewed_list:
  - app/api/trpc/[trpc]/route.ts
  - docker-compose.yml
  - prisma.config.ts
  - prisma/schema.prisma
  - src/server/api/routers/_app.ts
  - src/server/api/routers/gallery.ts
  - src/server/api/routers/scenario.test.ts
  - src/server/api/routers/scenario.ts
  - src/server/api/trpc.ts
  - src/server/application/scenario-service.test.ts
  - src/server/application/scenario-service.ts
  - src/server/db/client.ts
  - src/server/db/scenario-repository.test.ts
  - src/server/db/scenario-repository.ts
findings:
  critical: 1
  warning: 4
  info: 4
  total: 9
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-07-17T00:00:00Z
**Depth:** standard
**Files Reviewed:** 14
**Status:** issues_found

## Summary

Reviewed the tRPC router / application-service / Prisma-repository stack that
makes up this phase's persistence and API layer. The `create()`/`findByShareId()`
/`findCurated()` repository functions correctly use Prisma's parameterized
query builder (no raw SQL, no injection surface), the "always re-derive
verdict on read" design (D-06) is implemented and integration-tested
end-to-end through the real router → service → repository → domain chain, and
the domain/infra boundary (D-11, reusing `VesselSchema`) is respected.

The standout defect is in `src/server/api/trpc.ts`: the file's own header
comment claims the custom `errorFormatter` "strips verbose Prisma error
internals from responses when `NODE_ENV === 'production'`" as the mitigation
for the documented information-disclosure risk (T-3-07), but the
implementation never touches `shape.message` — it only appends an inert
`prismaDetailsHidden: true` flag that nothing reads. Any unhandled Prisma
error (constraint violation, connection failure, etc.) thrown from
`scenario-repository.ts` will still surface its raw `.message` text to API
consumers in every environment, including production. This is a real gap
between the stated security control and what ships. A handful of smaller
robustness and test-reliability issues (unchecked `VesselType` casts, a
test that assumes exclusive access to a shared persistent Postgres instance,
an unvalidated `DATABASE_URL`) round out the findings below.

## Critical Issues

### CR-01: errorFormatter does not actually redact Prisma/internal error details — the documented security mitigation is a no-op

**File:** `src/server/api/trpc.ts:19-36`
**Issue:** The file header states this `errorFormatter` exists to prevent
"leaking connection details/SQL text through the tRPC error channel" in
production (T-3-07 / RESEARCH.md Information Disclosure mitigation). The
actual implementation:

```ts
const t = initTRPC.context<typeof createTRPCContext>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        prismaDetailsHidden:
          process.env.NODE_ENV === "production" ? true : undefined,
      },
    };
  },
});
```

only spreads the incoming `shape` unchanged and bolts on an extra
`data.prismaDetailsHidden` boolean that no client or test ever reads. It
never rewrites or clears `shape.message`. In `@trpc/server`, when a
non-`TRPCError` is thrown (e.g. any `PrismaClientKnownRequestError`, a
Postgres connection failure from `scenario-repository.ts`'s unguarded
`prisma.scenario.create/findUnique/findMany` calls, or an adapter-level pg
error), tRPC's `TRPCError` constructor defaults `message` to
`cause?.message ?? code` — i.e. the *original* Prisma/pg error message is
what ends up in `shape.message`, verbatim, in every environment, since
nothing here overrides it. Prisma/pg error messages can include table/column
names, constraint names, and — for connection failures — host/port
information from the connection string.

There is no `try/catch` anywhere in `scenario-repository.ts` or
`scenario-service.ts` that converts a raw Prisma error into a sanitized
`TRPCError` before it reaches this formatter, so this is the only line of
defense the codebase has for that risk, and it does nothing.

**Fix:** Actually redact the message in production, e.g.:

```ts
errorFormatter({ shape, error }) {
  const isProd = process.env.NODE_ENV === "production";
  const isKnownTRPCError = error.code !== "INTERNAL_SERVER_ERROR";
  return {
    ...shape,
    message:
      isProd && !isKnownTRPCError ? "Internal server error" : shape.message,
  };
},
```

and/or wrap repository calls in `scenario-service.ts` with a `catch` that
re-throws a generic `TRPCError({ code: "INTERNAL_SERVER_ERROR" })`, so raw
Prisma error text never reaches the tRPC boundary regardless of the
formatter. Add a regression test that mocks the repository to throw a
Prisma-shaped error and asserts the client-visible message does not contain
the original error text when `NODE_ENV=production`.

## Warnings

### WR-01: `listGallery() returns []` test assumes exclusive, resettable access to a shared persistent Postgres instance

**File:** `src/server/application/scenario-service.test.ts:103-111`
**Issue:** The test asserts `expect(result).toEqual([])` against the live,
persistent Docker Postgres instance (per the file header, no mocking). The
test's own comment acknowledges the risk ("May contain rows curated by a
different test run against the same persistent DB") but argues it holds
"because this suite creates no curated rows before this assertion runs."
That reasoning only covers ordering *within this file*; it does not hold if:
- a previous interrupted test run's `afterAll` cleanup didn't run (e.g.
  process killed mid-suite) and left a row with `isCurated: true` in the DB,
  or
- Vitest runs test files in parallel workers and another suite (now or in
  the future) curates a row concurrently.
Either case makes this assertion flaky/false-failing through no fault of the
code under test, and the failure would look like a `listGallery` regression
rather than test-isolation debt.
**Fix:** Either scope the assertion to rows this test created (e.g. filter
`result` by an id prefix/tag this run controls, as the later test in the
same file already does via `.find`), or have this specific test create a
fresh curated row and delete it, asserting relative counts/deltas rather
than absolute emptiness. Alternatively, `beforeAll`/`beforeEach` could
`deleteMany({ where: { isCurated: true } })` scoped to a test-run marker to
guarantee a clean slate.

### WR-02: `rowToVessels` casts untrusted-shape DB strings to `VesselType` with no runtime check

**File:** `src/server/application/scenario-service.ts:38-56`
**Issue:** `row.vesselAType as VesselType` / `row.vesselBType as VesselType`
are bare type assertions, justified by comment as safe "because the only
write path... already validated." That's true today, but the schema itself
(`prisma/schema.prisma:37-41`) documents that gallery curation fields are
"Unused/null/default until Phase 5," strongly implying a future write path
(seed script, admin tool, or direct SQL) will populate/curate rows outside
`createScenario`'s Zod-validated boundary. If any future write path (or a
manual DB edit, or a migration default) ever writes a value outside
`VesselTypeSchema`'s enum, this cast silently produces an invalid `Vessel`
object that gets passed straight into `classifyEncounter`, bypassing the
"defensive `!result.ok` check" the surrounding code relies on for safety —
because the failure mode here isn't `!result.ok`, it's an invalid enum value
reaching domain rule-dispatch logic that was never designed to handle it,
likely with the domain module (undocumented here) either throwing an
unexpected exception or matching the wrong rule silently.
**Fix:** Validate with the existing schema instead of casting:
```ts
import { VesselTypeSchema } from "../../domain/vessel/vessel.js";
// ...
type: VesselTypeSchema.parse(row.vesselAType),
```
This converts a future data-integrity problem into a clear, immediate parse
error at the service boundary instead of undefined behavior inside the
domain layer.

### WR-03: `DATABASE_URL` is read and used without validation, producing unclear failures if unset

**File:** `src/server/db/client.ts:11`
**Issue:** `new PrismaPg({ connectionString: process.env.DATABASE_URL })`
passes `undefined` straight through if the env var is missing (e.g. a
misconfigured deploy, a `.env` not loaded in a given script context). The
comment above even notes "Prisma 7 requires a driver adapter... throws P2038
at first query" — i.e. this failure is deferred to first query time with an
opaque Prisma error code, rather than failing fast with an actionable
message at module-load time.
**Fix:**
```ts
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}
const adapter = new PrismaPg({ connectionString: databaseUrl });
```

### WR-04: `ScenarioRow` duplicates the Prisma-generated model shape instead of importing it

**File:** `src/server/db/scenario-repository.ts:17-33`
**Issue:** `ScenarioRow` hand-redeclares all 14 fields of the `Scenario`
model rather than importing Prisma's generated `Scenario` type. Every
`prisma/schema.prisma` change (add/rename/retype a column) now requires a
matching manual edit here; TypeScript will only catch drift when the two
shapes become structurally incompatible in a way that breaks an assignment,
which is not guaranteed for additive or type-widening changes (e.g. a new
required column would not fail here since `ScenarioRow` simply omits it, but
callers that destructure/spread the wider Prisma object — as
`scenario-service.ts:99,115` already do with `{ ...row, verdict }` — could
still silently pass the extra untyped field(s) across the tRPC boundary
without anyone noticing).
**Fix:** `import type { Scenario } from "../../../generated/prisma/client.js"` and either use it directly or `export type ScenarioRow = Scenario;`.

## Info

### IN-01: `getScenario`/`listGallery`'s defensive `!result.ok` branches are untested

**File:** `src/server/application/scenario-service.ts:89-97, 109-114`
**Issue:** Both branches are commented "theoretically unreachable... but
defensively checks anyway," yet no test in `scenario-service.test.ts`
exercises them (e.g. via a mocked repository returning a row that fails
re-classification). An untested `throw` path is exactly the kind of code
that regresses silently.
**Fix:** Add one test per function using `vi.spyOn(repository, "findByShareId"/"findCurated")` to return a row engineered to fail `classifyEncounter` (e.g. coincident positions written directly via `prisma.scenario.create`, bypassing the service), asserting `INTERNAL_SERVER_ERROR` and that the domain-internal reason string is not present in the thrown error's message.

### IN-02: Hardcoded default Postgres credentials in `docker-compose.yml`

**File:** `docker-compose.yml:6-8`
**Issue:** `POSTGRES_USER`/`POSTGRES_PASSWORD` are the plaintext literal
`colregs`/`colregs`, committed to the repo. This is standard/acceptable for
a local-only dev Postgres container bound to `localhost:5432`, but it's
worth being explicit that this must never be the pattern reused for a real
deployed database (no `.env`/secret sourced here at all).
**Fix:** No change required for local dev; add a one-line comment noting
this file is dev-only and production deployments must source credentials
from a secret store, to avoid future copy-paste into a real environment.

### IN-03: `scenario.get` accepts an empty string `shareId` with no minimum-length validation

**File:** `src/server/api/routers/scenario.ts:23-25`
**Issue:** `z.object({ shareId: z.string() })` accepts `""` or arbitrarily
long strings. Not an injection risk (Prisma's `findUnique` is parameterized),
but it's a needless gap between the accepted input shape and known
`cuid()`-shaped ids, and provides no early client-side-friendly validation
error for obviously malformed input — the request has to make it to the DB
and back to learn "not found."
**Fix:** `z.object({ shareId: z.string().min(1) })` (or a `cuid()`-length
bound) to fail fast with a `BAD_REQUEST` rather than a round-trip `NOT_FOUND`.

### IN-04: `createScenario`'s `BAD_REQUEST` message embeds the domain-internal `DegenerateCaseReason` value, while sibling code paths explicitly avoid doing so

**File:** `src/server/application/scenario-service.ts:66-71` vs. `89-97, 109-114`
**Issue:** `getScenario`/`listGallery` go out of their way (per their own
comments, citing D-10) to never leak the domain-internal
`DegenerateCaseReason` enum across the tRPC boundary, generalizing it to a
generic `INTERNAL_SERVER_ERROR`. `createScenario`, three lines above,
directly interpolates that same internal reason value into a client-visible
`BAD_REQUEST` message: `` `Cannot classify scenario: ${result.reason}` ``.
This is likely intentional (validation-failure UX benefits from an
explanation) rather than a bug, but the inconsistency between "never leak
this enum" (stated twice) and "leak this enum" (done once, undocumented as
an exception) is confusing for a future maintainer trying to keep D-10
consistent.
**Fix:** Either note explicitly in the `createScenario` comment why this
case is an intentional, reviewed exception to D-10 (client-facing validation
errors vs. server-fault errors), or map `result.reason` to a stable,
API-contract-safe message string rather than passing the internal enum
value through directly.

---

_Reviewed: 2026-07-17T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
