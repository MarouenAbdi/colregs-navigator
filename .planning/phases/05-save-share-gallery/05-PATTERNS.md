# Phase 5: Save, Share & Gallery - Pattern Map

**Mapped:** 2026-07-18
**Files analyzed:** 10 (5 new, 3 modified, 2 new-supporting-component candidates left to planner's file-layout discretion)
**Analogs found:** 8 / 10 (2 are genuinely greenfield — first-ever client tRPC wiring — documented under "No Analog Found" with the RESEARCH.md code example used instead)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/lib/trpc/server.ts` | utility (server caller) | request-response | `src/server/api/routers/scenario.test.ts` (lines 10-15) + `src/server/api/trpc.ts` (lines 38-40) | role-match (test file proves the exact call shape; no production file does this yet) |
| `src/lib/trpc/client.tsx` | provider | request-response | *(none in-repo — greenfield)* | no analog — use RESEARCH.md Pattern 3 (Context7-sourced) |
| `app/layout.tsx` (MODIFIED) | config/provider | request-response | itself (`app/layout.tsx`, current version) | exact (targeted diff, not rewrite) |
| `app/s/[shareId]/page.tsx` | route (server component) | request-response | `app/page.tsx` (route shape) + `src/server/api/routers/scenario.test.ts` (caller usage) + `src/server/api/routers/scenario.ts` (NOT_FOUND handling) | role-match |
| `app/gallery/page.tsx` | route (server component) | request-response | `app/page.tsx` (route shape) + `src/server/api/routers/gallery.ts` (list contract) | role-match |
| `src/components/sandbox/SandboxContainer.tsx` (MODIFIED) | component (state owner) | request-response / CRUD | itself (`SandboxContainer.tsx`, current version) | exact (targeted diff, not rewrite) |
| `src/components/sandbox/SandboxContainer.tsx` — Save trigger addition | component (client, mutation trigger) | request-response | `src/components/sandbox/ControlPanel.tsx` (lines 1-16, 33-64: `"use client"` + form-control subcomponent pattern) | role-match (closest existing client-interactive subcomponent; mutation call itself has no analog — see below) |
| `prisma/seed.ts` | utility (batch/seed script) | batch / file-I/O (DB write) | `src/server/db/scenario-repository.ts` (lines 35-53: direct Prisma `create` call shape) + `src/server/db/client.ts` (singleton import) | role-match |
| `prisma.config.ts` (MODIFIED) | config | — | itself (current version) | exact (one-line addition) |
| `src/components/sandbox/SandboxContainer.test.tsx` / new route tests | test | request-response | `src/components/sandbox/SandboxContainer.test.tsx` (lines 1-68: jsdom polyfill + `act`/`cleanup` pattern) + `src/server/api/routers/scenario.test.ts` (lines 1-54: caller-factory integration test pattern) | exact |

## Pattern Assignments

### `src/lib/trpc/server.ts` (utility, request-response)

**Analog:** `src/server/api/routers/scenario.test.ts` + `src/server/api/trpc.ts`

**Core pattern** — the server-side caller is already proven, just not yet wrapped in a reusable helper (`scenario.test.ts` lines 10-15):
```typescript
import { createCallerFactory, createTRPCContext } from "../trpc.js";
import { appRouter } from "./_app.js";

const createCaller = createCallerFactory(appRouter);
const caller = createCaller(createTRPCContext());
```

**What `trpc.ts` already exports** (lines 38-40), confirming no new tRPC primitives are needed:
```typescript
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;
```

**Apply as:** wrap this exact pattern in a `getCaller()` function per RESEARCH.md Pattern 4, importing `appRouter` from `src/server/api/routers/_app.ts` and `createTRPCContext` from `src/server/api/trpc.ts` — same two import paths `scenario.test.ts` already uses, just from a new file location (`src/lib/trpc/server.ts`, one directory level deeper — adjust relative paths accordingly, e.g. `../../server/api/routers/_app.js`).

---

### `src/lib/trpc/client.tsx` (provider, request-response)

**No in-repo analog** — this is the first client-side tRPC wiring in the project (confirmed: no `"use client"` file anywhere imports `@trpc/react-query` or `@tanstack/react-query` yet). Use RESEARCH.md's Pattern 3 code example verbatim (Context7 `/trpc/trpc`-sourced, already adapted to this project's exact dependency versions in `package.json`):

- Import `AppRouter` type from `src/server/api/routers/_app.ts` (existing export, confirmed at `_app.ts` line 16: `export type AppRouter = typeof appRouter;`)
- **Do NOT** import `@trpc/tanstack-react-query` — confirmed absent from `package.json`; only `@trpc/react-query` (11.18.0), `@trpc/client` (11.18.0), `@tanstack/react-query` (5.101.2) are installed.

**Shared with:** `app/layout.tsx` (mounts this provider), and any client component calling `trpc.scenario.create.useMutation()` (the Save trigger).

---

### `app/layout.tsx` (MODIFIED — config/provider)

**Analog:** itself, current version (read in full above)

**Current file (unchanged parts to preserve):**
```tsx
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "COLREGS Navigator",
  description: "Maritime collision-avoidance rules engine and visualizer.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-slate-50 min-h-screen">{children}</body>
    </html>
  );
}
```

**Targeted diff:** wrap `{children}` in `<TRPCReactProvider>` imported from `../src/lib/trpc/client.js` (matches this file's existing relative-import convention — `app/page.tsx` uses the same `../src/...` shape). Do not touch `metadata`/`<html>`/`<body>` className.

---

### `app/s/[shareId]/page.tsx` (route, request-response)

**Analogs:** `app/page.tsx` (only existing route, sets the file's minimal shape) + `src/server/api/routers/scenario.ts` (NOT_FOUND error contract) + `src/server/application/scenario-service.ts` (return shape: `ScenarioRow & { verdict: ClassificationResult }`)

**Existing route shape to match** (`app/page.tsx`, full file):
```tsx
import { SandboxContainer } from "../src/components/sandbox/SandboxContainer.js";

export default function Home() {
  return <SandboxContainer />;
}
```

**Error contract this page must handle** (`scenario.ts` lines 23-32):
```typescript
get: publicProcedure
  .input(z.object({ shareId: z.string() }))
  .query(async ({ ctx, input }) => {
    const scenario = await ctx.scenarioService.getScenario(input.shareId);
    if (!scenario) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }
    return scenario;
  }),
```

**Row shape returned** (`scenario-service.ts` lines 38-56, `rowToVessels`) — use this exact reconstruction, do not re-derive independently:
```typescript
export function rowToVessels(row: ScenarioRow): { vesselA: Vessel; vesselB: Vessel } {
  return {
    vesselA: {
      position: { x: row.vesselAPosX, y: row.vesselAPosY },
      heading: row.vesselAHeading,
      speed: row.vesselASpeed,
      type: row.vesselAType as VesselType,
    },
    vesselB: { /* same shape for B */ },
  };
}
```
Note: `rowToVessels` is exported from `scenario-service.ts` already — the page can import and reuse it directly instead of hand-rolling the same field mapping again.

**Full target pattern:** RESEARCH.md's Architecture Pattern 2 (verified against the actual `scenario.ts`/`scenario-service.ts` contracts above — the code example there is accurate to this codebase, not just illustrative). Key non-negotiable from Pitfall 1: pass `key={shareId}` to `<SandboxContainer>` so client-side navigation between two `/s/[id]` routes remounts and re-runs `useState` initializers.

---

### `app/gallery/page.tsx` (route, request-response)

**Analogs:** `app/page.tsx` (route shape) + `src/server/api/routers/gallery.ts` (contract: always resolves, empty array is valid, never throws)

**Router contract this page consumes** (`gallery.ts`, full file):
```typescript
export const galleryRouter = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.scenarioService.listGallery();
  }),
});
```
`listGallery()` (`scenario-service.ts` lines 102-117) returns `Array<ScenarioRow & { verdict: ClassificationResult }>`, ordered by `displayOrder` ascending (`scenario-repository.ts` lines 63-68, `findCurated`). No pagination, no filtering needed — render the array as-is.

**Card link target:** each card links to `/s/${row.id}` (same detail route as plain shares — Pattern 2 in RESEARCH.md, D-02/D-03 compliant: no separate gallery-detail page).

---

### `src/components/sandbox/SandboxContainer.tsx` (MODIFIED — component, request-response/CRUD)

**Analog:** itself, current version (full file read above, 160 lines)

**Exact lines requiring changes:**
- Lines 33-34 (`useState` seeds): replace `crossingResidualBasicCase.vesselA`/`.vesselB` with `initialScenario?.vesselA ?? crossingResidualBasicCase.vesselA` / `...vesselB ?? ...`
- Lines 41-49 (`lastGoodClassification` lazy initializer): replace the two hardcoded `crossingResidualBasicCase.vesselA/vesselB` references with the same `seedA`/`seedB` locals
- Lines 54-56 (`previousEncounterTypeRef` initial value): unaffected — already derives from `lastGoodClassification.encounterType`, which now flows from the seed
- Lines 114-122 (`handleReset`): per RESEARCH.md's Open Question 1 / Assumption A3, reset target is planning's call — either keep hardcoded `crossingResidualBasicCase` (current behavior) or reset to `seedA`/`seedB` if `initialScenario` was provided. Both are one-line changes to this existing function; do not add a second reset code path.
- Lines 124-135 (`<header>`): this is the existing "Reset Scenario" button location the Save trigger and D-02 banner should sit alongside/below, per CONTEXT.md's explicit steer ("pick the simplest approach that fits the existing `SandboxContainer` header").

**Props addition** (new interface, follows the existing `*Props` naming convention in `src/components/sandbox/types.ts`):
```typescript
interface SandboxContainerProps {
  initialScenario?: { vesselA: Vessel; vesselB: Vessel };
  banner?: { label: string; rationale?: string };
}
```

---

### Save trigger (client component/button — likely inline in `SandboxContainer.tsx`'s header, or a small extracted `SaveButton.tsx` following the sibling-subcomponent convention)

**Analog:** `src/components/sandbox/ControlPanel.tsx` (lines 1, 66-90 — `"use client"` directive placement, Tailwind button/label styling conventions) and `SandboxContainer.tsx`'s own existing "Reset Scenario" button (lines 128-134) for the exact button markup/class convention to match:
```tsx
<button
  type="button"
  onClick={handleReset}
  className="bg-teal-600 text-white px-4 py-2 rounded"
>
  Reset Scenario
</button>
```
A "Save" button should reuse this same `bg-teal-600 text-white px-4 py-2 rounded` class convention for visual consistency with the existing header action.

**No analog for the mutation call itself** (first `useMutation()` usage in the repo) — use RESEARCH.md's documented shape:
```typescript
const createScenario = trpc.scenario.create.useMutation({
  onSuccess: ({ shareId }) => router.push(`/s/${shareId}`),
});
```
This requires `"use client"` (already the convention in `ControlPanel.tsx` line 1 and `SandboxContainer.tsx` line 1) and `next/navigation`'s `useRouter()` for the redirect-on-success UX (CONTEXT.md leaves inline-link-vs-redirect to planning's discretion; redirect to `/s/[shareId]` is the simplest per RESEARCH.md's System Architecture Diagram).

---

### `prisma/seed.ts` (utility, batch/file-I/O)

**Analogs:** `src/server/db/scenario-repository.ts` (direct Prisma call shape) + `src/server/db/client.ts` (singleton import, mandatory per Pitfall 4)

**Prisma singleton to reuse — do NOT construct a second client** (`client.ts`, full file):
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
Import path from `prisma/seed.ts`: `../src/server/db/client.js`.

**Direct-Prisma-call shape to mirror** (`scenario-repository.ts` lines 35-53, `create`) — the seed script's `prisma.scenario.create({ data: {...} })` call should use the identical flat-column field mapping, plus the three curated-only fields (`isCurated`, `rationale`, `displayOrder`) that `scenario-repository.ts`'s own `create()` deliberately omits (D-03 — those three fields must never be settable through the public repository function used by `scenario.create`).

**Validation pattern to mirror** (`scenario-service.ts` lines 62-71, `createScenario`'s dry-run guard) — the seed script should call `classifyEncounter()` per entry before writing, exactly like this:
```typescript
const result = classifyEncounter(vesselA, vesselB);
if (!result.ok) {
  throw new TRPCError({ code: "BAD_REQUEST", message: `Cannot classify scenario: ${result.reason}` });
}
```
(seed script variant throws a plain `Error`, not `TRPCError`, since it runs outside the tRPC boundary — see RESEARCH.md Pattern 5's full example.)

**Fixture reference for authoring seed entries:** `src/domain/colregs/classify-encounter.fixtures.ts` — see RESEARCH.md's "Fixture Catalog for Seed Authoring" table for which fixtures are safe (`headOnGenuineCase`, `overtakingBothDirectionsCase`, `crossingRule18OverrideCase`/`crossingRule18NonOverrideCase`, `headOnRule18OverrideCase`, `overtakingRule18NoOverrideCase`) vs. unsafe (any `*Hysteresis*Case`, since a fresh read never passes a `previous` argument).

---

### `prisma.config.ts` (MODIFIED — config)

**Analog:** itself, current version (full file, 8 lines):
```typescript
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: env("DATABASE_URL") },
});
```
**Targeted diff:** add `seed: "node prisma/seed.ts"` inside the existing `migrations` object — do not restructure the rest of the file.

---

### Test files (SandboxContainer prop additions, new route tests)

**Analog for component/integration test structure:** `src/components/sandbox/SandboxContainer.test.tsx` (lines 1-68 shown) — establishes the required jsdom polyfills (`ResizeObserver`, pointer-capture methods) and the `afterEach(() => cleanup())` requirement (`vitest.config.ts` sets `globals: false`, so RTL's automatic cleanup does not register — every test file in this project manually calls `cleanup()`).

**Analog for router/integration test structure:** `src/server/api/routers/scenario.test.ts` (full file, 54 lines) — the `createCallerFactory(appRouter)` + `createCaller(createTRPCContext())` pattern is the established way to test tRPC procedures end-to-end without an HTTP server; reuse directly for testing `/s/[shareId]/page.tsx`'s and `/gallery/page.tsx`'s server-side data loading logic (extract the caller call into a testable function, or test via the same caller pattern directly against `scenario.get`/`gallery.list` and assert the page's derived `banner`/`initialScenario` construction separately as a pure function if planning chooses to extract one).

---

## Shared Patterns

### tRPC error → HTTP boundary (NOT_FOUND handling)
**Source:** `src/server/api/routers/scenario.ts` lines 23-32, `src/server/application/scenario-service.ts` lines 77-100
**Apply to:** `app/s/[shareId]/page.tsx` — catch `TRPCError` with `code === "NOT_FOUND"` from `caller.scenario.get({ shareId })` and call Next's `notFound()` (per RESEARCH.md Pattern 2's exact try/catch shape).

### Prisma singleton reuse (mandatory, not optional)
**Source:** `src/server/db/client.ts` (full file, 17 lines)
**Apply to:** `prisma/seed.ts` — any new file touching Postgres must import this exact singleton; a bare `new PrismaClient()` throws `P2038` in Prisma 7 (Pitfall 4).

### Dry-run classification validation before persistence
**Source:** `src/server/application/scenario-service.ts` lines 62-71 (`createScenario`)
**Apply to:** `prisma/seed.ts` — every curated entry must pass `classifyEncounter()` before being written, mirroring the exact guard `createScenario` already uses for user-submitted scenarios. Never persist the verdict itself (D-06) — validation only, discard `.value`.

### `"use client"` directive + Tailwind button convention
**Source:** `src/components/sandbox/ControlPanel.tsx` line 1; `src/components/sandbox/SandboxContainer.tsx` lines 128-134 (existing "Reset Scenario" button)
**Apply to:** Any new client component this phase adds (Save trigger, Copy Link button) — reuse `bg-teal-600 text-white px-4 py-2 rounded` for primary actions, `rounded border border-slate-200 px-2 py-1 focus:outline-teal-600` for inputs, matching the established palette (`teal-600` primary, `slate-*` neutrals).

### Server-side caller for SSR data loading (no client fetch)
**Source:** `src/server/api/routers/scenario.test.ts` lines 10-15, `src/server/api/trpc.ts` lines 38-40 (`createCallerFactory`, `createTRPCRouter`, `publicProcedure` already exported)
**Apply to:** `app/s/[shareId]/page.tsx`, `app/gallery/page.tsx` — both are server components; neither needs `trpc.*.useQuery()` client hooks, only the direct caller wrapped in `src/lib/trpc/server.ts`.

### Domain boundary: never let `src/domain/` import anything from `src/server/`/Next.js/Prisma
**Source:** CLAUDE.md's Architecture section; enforced already in `classify-encounter.ts`, `vessel.ts`, `types.ts` (all zero-import-from-server, confirmed by reading each)
**Apply to:** `prisma/seed.ts` may import FROM `src/domain/colregs/classify-encounter.js` (one-directional, allowed), but no file under `src/domain/` may be modified to accommodate the seed script.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `src/lib/trpc/client.tsx` | provider | request-response | First-ever client-side tRPC/React Query wiring in this repo — no prior file establishes this pattern. Use RESEARCH.md's Pattern 3 (Context7-sourced, version-matched to installed `@trpc/react-query@11.18.0`) verbatim. |
| Save-button `useMutation()` call site | component (mutation trigger) | request-response | First-ever client-side tRPC mutation call. Styling/markup should still follow the `ControlPanel.tsx`/existing "Reset Scenario" button conventions (see Shared Patterns above); only the data-fetching call itself is new. |

## Metadata

**Analog search scope:** `src/`, `app/`, `prisma/` (entire repo — no `node_modules` search needed; codebase is small enough for exhaustive review)
**Files scanned:** `SandboxContainer.tsx`, `SandboxContainer.test.tsx`, `ControlPanel.tsx`, `types.ts` (sandbox), `scenario.ts`, `gallery.ts`, `_app.ts`, `trpc.ts`, `scenario.test.ts`, `scenario-service.ts`, `scenario-repository.ts`, `client.ts` (db), `app/page.tsx`, `app/layout.tsx`, `app/api/trpc/[trpc]/route.ts`, `vessel.ts`, `colregs/types.ts`, `prisma.config.ts`, `package.json`
**Pattern extraction date:** 2026-07-18
