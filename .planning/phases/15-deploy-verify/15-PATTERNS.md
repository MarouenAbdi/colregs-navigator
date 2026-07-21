# Phase 15: Deploy & Verify - Pattern Map

**Mapped:** 2026-07-20
**Files analyzed:** 2 (1 new code file, 1 modified doc file) + CLI-only verification steps (no code)
**Analogs found:** 2 / 2 (with caveats noted below — this phase introduces two shapes with zero prior in-repo precedent: try/catch-to-status-code responses, and `NextResponse` usage)

**Scope note:** CONTEXT.md and RESEARCH.md are both explicit that this phase's *only* code deliverable is `app/api/health/route.ts`. `vercel-build`, `scripts/migrate-if-production.mjs`, and the Prisma/adapter setup are locked from Phase 14 and must not be touched. Everything else in this phase (Vercel/Neon provisioning, CLI verification, rollback exercise, overnight-idle check) is dashboard configuration or CLI commands, not source files — those have no "analog" in the pattern-mapping sense and are out of this document's scope.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `app/api/health/route.ts` | route (Next.js App Router Route Handler) | request-response | `app/api/trpc/[trpc]/route.ts` | role-match (structural convention only — see caveat below) |
| `README.md` (§"Deployment") | config/docs | — (static content update) | `README.md` itself (existing §"Deployment" section, lines 37-53) | exact (same file, same section, update in place) |

**Caveat on the health route's analog:** `app/api/trpc/[trpc]/route.ts` is the *only* Route Handler in this codebase, so it is the correct (and only) match for "how does this repo wire an App Router HTTP endpoint" (file location convention, `export { ... as GET }` / named export shape, relative-import style into `src/server/`). It does **not** provide an analog for the health route's actual internals — try/catch-driven status-code branching, `NextResponse.json`, or `Cache-Control` headers — because no file in this codebase does any of those things today. For those specific internals, RESEARCH.md's "Pattern 1" (lines 165-199) is the concrete, already-verified reference to copy from instead of inventing a new shape. This is flagged explicitly in "No Analog Found" below as well.

## Pattern Assignments

### `app/api/health/route.ts` (route, request-response)

**Analog:** `app/api/trpc/[trpc]/route.ts` (structural/location convention) + RESEARCH.md Pattern 1 (internals)

**File location + module convention** (from `app/api/trpc/[trpc]/route.ts`, full file, 19 lines):
```typescript
/**
 * Next.js App Router catch-all HTTP handler for tRPC. The first externally
 * reachable HTTP endpoint in this repo (T-3-06/T-3-07 trust boundary).
 */

import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../../../../src/server/api/routers/_app.js";
import { createTRPCContext } from "../../../../src/server/api/trpc.js";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: createTRPCContext,
  });

export { handler as GET, handler as POST };
```
Takeaways to carry over into `app/api/health/route.ts`:
- File goes at `app/api/health/route.ts` (mirrors `app/api/trpc/[trpc]/route.ts`'s placement one level up — `app/api/<segment>/route.ts`).
- A one-line file-header comment stating what the endpoint is and its trust-boundary/role (this repo's established convention for its one existing Route Handler).
- Relative imports into `src/server/` using `../../../src/server/...` with explicit `.js` extensions (this repo's TS/ESM convention — note the health route is one directory shallower than the tRPC catch-all, so it needs one fewer `../` than the example above; verify the exact relative path at write time).
- Only export the HTTP verb(s) actually needed — the tRPC handler exports `GET`/`POST` because tRPC needs both; the health route only needs `GET`.

**Prisma singleton import pattern** (from `src/server/db/client.ts`, full file, 17 lines):
```typescript
import { PrismaClient } from "../../../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```
Takeaway: `app/api/health/route.ts` must `import { prisma } from "<relative-path-to>/src/server/db/client.js"` and call `prisma.$queryRaw` directly — never instantiate a second `PrismaClient`/`PrismaPg` adapter. This is also explicitly required by RESEARCH.md's "Don't Hand-Roll" table (reusing the exact adapter/pool the real app uses, not a separate test-only connection path).

**Core pattern — DB check + status-code branching** (no in-repo analog exists for this shape; use RESEARCH.md Pattern 1 verbatim, already verified against Context7 `/vercel/next.js` docs and this repo's own `client.ts` convention):
```typescript
import { NextResponse } from "next/server";
import { prisma } from "../../../src/server/db/client.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { status: "ok" },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { status: "error" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
```
Locked constraints this implementation must satisfy (from CONTEXT.md decisions, non-negotiable):
- D-05: DB connectivity only — no version/uptime/commit metadata in the response.
- D-06: `catch` block discards the actual error entirely; body is always exactly `{status:"error"}`, never an interpolated error message/stack/connection string.
- D-07: no `AbortController`/timeout race around the query — a slow-but-successful Neon cold-start wake must still resolve to 200.
- D-08: both `dynamic = "force-dynamic"` (export) and an explicit `Cache-Control: no-store` response header on *both* branches (200 and 503) — belt-and-suspenders against edge caching, not relying on Next 15+'s default-dynamic behavior alone.
- `runtime = "nodejs"`: required because `@prisma/adapter-pg` uses `pg`'s TCP client, which the edge runtime cannot run — this repo's `client.ts` already implies a Node-only runtime requirement, but the health route must state it explicitly since Route Handlers default to whichever runtime is inferred otherwise.

**Error handling pattern:** No prior file in this codebase performs try/catch around a Prisma call — `scenario-repository.ts` (below) deliberately has *no* try/catch, since `findUnique`'s null-for-not-found doesn't need one and this repo has no other failure-handling precedent to draw from. The health route is the first place in this codebase a Prisma call's *failure* (not just empty-result) must be caught and translated into an HTTP status. Treat RESEARCH.md's catch-and-discard shape above as the pattern to establish here, since this file's Security Domain table (Information Disclosure row) makes the "catch broadly, never interpolate the error into the response" rule an explicit security requirement, not just a style choice.

**Reference — no-try/catch style in this codebase, for contrast** (`src/server/db/scenario-repository.ts` lines 57-63):
```typescript
export async function findByShareId(
  shareId: string,
): Promise<ScenarioRow | null> {
  // Prisma's findUnique already returns null for no match -- no try/catch
  // needed for the not-found case.
  return prisma.scenario.findUnique({ where: { id: shareId } });
}
```
This illustrates the codebase's general preference for *not* wrapping Prisma calls defensively when Prisma's own return shape (`null`) already communicates the outcome. The health route is an intentional, narrow exception to that preference because D-06 requires translating a thrown connection error into a specific HTTP status code — something no return-value shape can express — not a deviation from house style.

---

### `README.md` §"Deployment" (docs, static content)

**Analog:** the file's own current §"Deployment" section (lines 37-53), to be updated in place — not replaced wholesale.

**Current content to update** (lines 37-53):
```markdown
## Deployment

**No live hosted deployment exists yet** -- provisioning a real host and database is Phase 15
scope, not this milestone's current phase. What already exists, fully authored and locally
verified against this repo's own docker-compose Postgres, is the production build path itself:

- `"vercel-build"` (`package.json`): `prisma generate` -> an environment-gated
  `scripts/migrate-if-production.mjs` -> `next build --webpack`. The migration step only runs
  `prisma migrate deploy` when `VERCEL_ENV === "production"`, so a PR/branch preview build (which
  runs this identical script with a different `VERCEL_ENV` value) can never apply a migration to
  a live database. Both gate states, and the full three-step sequence ending in a confirmed
  webpack build, have been verified locally.
- CD-01's actual auto-deploy-on-merge mechanism will be the eventual host's native Git
  integration (e.g. Vercel watching `main`), not a hand-rolled GitHub Actions deploy step -- this
  milestone's locked architecture decision keeps GitHub Actions scoped to CI only.
- The same `.nvmrc` this repo already uses for CI is what the eventual host will resolve its Node
  version from -- no separate host-specific Node version configuration is expected.
```
Per CONTEXT.md's canonical refs: "must be updated once live to reflect real, non-aspirational status." Follow the section's existing tone/structure (short prose paragraph + bullet list of concrete facts, `--` used as an em-dash substitute throughout this file, consistent with the rest of README.md) — replace the "No live hosted deployment exists yet" framing with the real production URL, confirm the `vercel-build` three-step sequence ran for real (not just locally), and add the health-check endpoint and rollback procedure as new facts, keeping the same bullet-list style as the existing "Prerequisites"/"Deployment" sections elsewhere in this file.

## Shared Patterns

### Relative-import + explicit `.js` extension convention
**Source:** `app/api/trpc/[trpc]/route.ts` line 7-8, `src/server/db/scenario-repository.ts` line 14
**Apply to:** `app/api/health/route.ts`'s import of `prisma` from `src/server/db/client.js`
```typescript
import { prisma } from "./client.js"; // explicit .js extension even though the source is .ts
```
This repo's TypeScript/ESM setup requires the `.js` extension on relative imports (NodeNext-style module resolution) — every existing cross-module import in `src/server/` and `app/api/` follows this, and the new health route must too.

### Env-gating via strict equality (relevant only if future health-check behavior branches on environment)
**Source:** `scripts/migrate-if-production.mjs` line 8
```javascript
if (process.env.VERCEL_ENV === "production") {
```
Not currently required by D-05–D-08 (the health check is environment-agnostic), but this is the established house convention if the planner or a future phase ever needs the health route (or its docs) to branch on `VERCEL_ENV`/`NODE_ENV`: always strict `===` equality against the exact string, never a truthy/falsy check — this is what makes preview builds provably safe from accidentally touching production behavior.

### No-abstraction-until-second-consumer
**Source:** CLAUDE.md project conventions ("Shared/decorative primitives: extract only on a real second consumer"), consistent with `scenario-repository.ts`'s header comment ("this project has exactly one repository... a generic abstraction would add indirection without a second consumer to justify it")
**Apply to:** `app/api/health/route.ts` — do not build a generic "health check runner" abstraction, a shared response-formatting helper, or a reusable DB-ping utility module for a single Route Handler with ~15 lines of real logic. Inline the query and both response branches directly in `route.ts`, matching this repo's established anti-premature-abstraction stance.

## No Analog Found

| File / Concern | Role | Data Flow | Reason |
|------------------|------|-----------|--------|
| Try/catch-to-HTTP-status-code branching | (internal to `app/api/health/route.ts`) | request-response | No file in this codebase currently catches a thrown error and maps it to a specific non-2xx status code — `scenario-repository.ts` relies entirely on Prisma's return-value shapes (`null`, arrays) and never throws-and-catches. Use RESEARCH.md Pattern 1 (already Context7-verified against `/vercel/next.js` docs) as the reference instead of an in-repo analog. |
| `NextResponse.json` usage | (internal to `app/api/health/route.ts`) | request-response | The only existing Route Handler (`app/api/trpc/[trpc]/route.ts`) delegates its entire response to `fetchRequestHandler` and never constructs a `NextResponse` directly — this will be the first use of `next/server`'s `NextResponse` in this codebase. No adaptation needed beyond RESEARCH.md's Pattern 1; flagging only so the planner doesn't search for a nonexistent in-repo precedent. |
| A test file for `app/api/health/route.ts` (e.g. `app/api/health/route.test.ts`) | test | request-response | Not explicitly required by CONTEXT.md/RESEARCH.md (D-05–D-08 describe the endpoint's required behavior, not a testing mandate), and this codebase's only comparable precedent (`scenario-repository.test.ts`) runs *integration* tests against the real Docker Postgres instance with zero Prisma mocking (see excerpt above) — if the planner decides a test is warranted, follow that same no-mocking, real-DB-instance convention rather than introducing `vi.mock` for `prisma` (which has no precedent anywhere in this codebase; a repo-wide grep for `vi.mock` / mocking of `prisma` found no matches). |
| Rollback checklist / provisioning checklist deliverable | docs (procedural, not source code) | — | CONTEXT.md D-02 requires "a clear, ordered checklist for the user to follow" for account/dashboard setup, and RESEARCH.md's rollback cycle (Code Examples section) is itself a checklist of CLI commands, not a code file. This has no codebase analog because it isn't a source file — the planner should decide whether it lives inline in a PLAN.md, as a new standalone runbook doc, or as an addition to README.md's Deployment section; it is out of this document's scope since it maps code patterns, not planning-artifact structure. |

## Metadata

**Analog search scope:** `app/api/` (1 file total), `src/server/db/` (5 files), `src/server/api/routers/` (4 files + 1 test), `scripts/` (1 file), `README.md`, `package.json`
**Files scanned:** 13
**Pattern extraction date:** 2026-07-20
