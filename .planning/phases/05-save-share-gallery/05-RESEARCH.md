# Phase 5: Save, Share & Gallery - Research

**Researched:** 2026-07-18
**Domain:** Next.js App Router routing/data-loading + first-ever client-side tRPC wiring, reusing an already-complete persistence layer (Phase 3) and sandbox UI (Phase 4)
**Confidence:** HIGH

## Summary

This phase is almost entirely **wiring**, not new architecture. Phase 3 already built `scenario.create`/`scenario.get`/`gallery.list` with a hard "always re-derive on read" guarantee (no verdict column exists in the schema — it structurally cannot go stale), and Phase 4 already built a fully editable, self-contained `SandboxContainer` client component. Phase 5's job is: (1) give `SandboxContainer` an optional seed-from-saved-scenario prop instead of only its hardcoded fixture, (2) stand up the *first* client-side tRPC/React Query provider so a "Save" button can call `scenario.create` as a mutation, (3) add two new routes (`/s/[shareId]` and `/gallery`) that call the *existing* router through a server-side caller, and (4) write a one-time Prisma seed script that populates 5-8 curated rows directly via Prisma Client (deliberately bypassing the public `scenario.create` mutation, per CONTEXT.md D-03).

The single most important non-obvious finding: this project's `classifyEncounter()` domain logic ([VERIFIED: src/domain/colregs/classify-encounter.ts line 178]) defines the head-on sector as *identical* to its own ±5° doubt band ("Per Assumption A1, the head-on sector IS the doubt band itself — every match always carries doubt: true"). This means **every head-on gallery/shared scenario will always render the existing doubt-caveat banner** — this is intentional Phase-2 domain design, not a bug to fix, but it directly affects how the gallery's "textbook head-on" entry should be authored and reviewed (its rationale text must not claim the encounter-type classification is itself in doubt — only the geometric closing detail is being cited as unambiguous).

The second key finding: reuse the Prisma `cuid()` (`Scenario.id`) directly as the URL's `shareId` segment. `scenario.get`'s input is already `{ shareId: string }` matched 1:1 against `findUnique({ where: { id: shareId } })` — there is zero code to add for the ID scheme itself, and this matches CLAUDE.md's explicit guidance to skip `nanoid` unless a genuinely shorter URL is a real product requirement (it wasn't raised in CONTEXT.md discussion).

**Primary recommendation:** Extend `SandboxContainer` with an `initialScenario` prop and a `banner` prop; add a classic `@trpc/react-query` `createTRPCReact` provider (matches installed deps — do NOT reach for the newer `@trpc/tanstack-react-query` package, which is not installed); build `/s/[shareId]/page.tsx` as a server component using the existing `createCallerFactory`/`createTRPCContext` pattern already proven in `scenario.test.ts`; have `/gallery` link its cards directly to `/s/[shareId]` so the same detail page serves both plain shares and curated gallery entries (differentiated only by conditionally showing `rationale` when `isCurated` is true).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Save scenario (create row) | API / Backend | Browser / Client | `scenario.create` mutation already exists (Phase 3); triggered by a new client-side tRPC call from the Save button |
| Load shared/gallery scenario for display | Frontend Server (SSR) | API / Backend | New `/s/[shareId]` server component calls the existing router via a server-side caller — no client-side fetch needed for initial load |
| Gallery listing | Frontend Server (SSR) | API / Backend | New `/gallery` server component calls `gallery.list` via the same server-side caller pattern |
| Curated seed data | Database / Storage | — | Seed script (`prisma/seed.ts`) writes `isCurated`/`rationale`/`displayOrder` directly via Prisma Client, deliberately bypassing the API layer (D-03) — no public mutation may set these fields |
| Editable sandbox (drag/reclassify) | Browser / Client | — | 100% reused from Phase 4's `SandboxContainer`; only its initial-state source changes (default fixture vs. a fetched scenario) |
| Re-derive-on-read verdict computation | API / Backend | — | Already fully implemented in `scenario-service.ts` (Phase 3) — Phase 5 adds zero classification logic |
| Route/link structure (`/s/[id]`, `/gallery`) | Frontend Server (SSR) | — | New Next.js App Router file-based routes; no new backend endpoints required |

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Saving always creates a brand-new scenario via `scenario.create` — no update/overwrite-in-place semantics. No ownership tracking, consistent with the no-auth constraint.
- **D-02:** Opening a shared link or a gallery entry loads into the **same fully-editable `SandboxContainer`**, pre-seeded with the saved scenario's vessels instead of the default fixture. A visible banner/label (e.g. "Viewing saved scenario — drag to explore") is shown. This reuses 100% of Phase 4's sandbox component rather than building a second read-only rendering mode.
- **D-03:** Curated gallery rows are inserted via a **Prisma seed script** (`prisma/seed.ts`), not through the public `scenario.create` mutation. The public mutation deliberately stays without `isCurated`/`rationale`/`displayOrder` fields — extending it would let any caller self-curate with no auth to prevent it.
- **D-04:** The gallery covers **one clean case per core rule the reasoning trail distinguishes**: a textbook head-on, a give-way crossing, a stand-on crossing (mirror view of the same encounter), an overtaking case, plus 1-2 Rule 18 vessel-type-priority examples.
- **D-05:** Rationale text per entry is **1-2 sentences, plain language** — names the encounter type and the one geometric fact that makes it unambiguous. Shorter/less rule-number-heavy than the reasoning trail panel.

### Claude's Discretion
- Exact placement/styling of the save trigger and immediate success feedback (inline copyable link vs. redirect to the share URL) — pick the simplest approach that fits `SandboxContainer`'s existing header (which already has a "Reset Scenario" button).
- Share link URL shape and whether "Copy Link" uses the Clipboard API or selectable text — a dedicated route like `/s/[shareId]` is the natural fit; exact styling/interaction is planning's call.
- Gallery browsing layout (list vs. grid, mini-chart preview vs. text-only) — follow CLAUDE.md's SVG-first, no-canvas convention if a preview is built; text + encounter-type badge is a reasonable default if not.
- Exact wording of all 5-8 rationale texts and the specific vessel positions/headings/speeds/types for each curated scenario — D-04 sets the *shape* of the set, not the literal seed data; author using the existing domain fixtures as a starting point.
- Route/file layout for the new gallery page and share-link view, and the first-ever client-side tRPC/React Query wiring — standard Next.js App Router + tRPC setup, not a vision decision.

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within Phase 5 scope. No scope-creep suggestions came up.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SCEN-01 | User can save a scenario and receive a shareable link, with no login required | `scenario.create` already implemented (Phase 3); this phase adds the client-side mutation call, the Save UI trigger, and the `/s/[shareId]` display route. Reusing the raw Prisma cuid as the shareId requires zero new ID-generation code. |
| SCEN-03 | User can browse a curated gallery of 5-8 classic textbook encounters | `gallery.list`/`findCurated` already implemented (Phase 3, currently returns `[]`); this phase adds the `prisma/seed.ts` script to populate `isCurated`/`rationale`/`displayOrder`, and the `/gallery` listing page. |

## Standard Stack

### Core (already installed — no new versions to verify, these are locked project dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@trpc/react-query` | 11.18.0 [VERIFIED: package.json] | Client-side tRPC hooks (`createTRPCReact`) + Provider | Already a locked dependency (CLAUDE.md); classic pattern matches what's installed — the newer `@trpc/tanstack-react-query` package is NOT installed and must not be introduced for this |
| `@tanstack/react-query` | 5.101.2 [VERIFIED: package.json] | Underlying query cache for `@trpc/react-query` | Ships as tRPC 11's required peer, already installed |
| `@trpc/client` | 11.18.0 [VERIFIED: package.json] | `httpBatchLink` transport | Required by `createTRPCReact().createClient()` |
| Next.js App Router file conventions (`page.tsx`, dynamic segments) | 16.2.10 [VERIFIED: package.json] | New routes `/gallery`, `/s/[shareId]` | Locked framework version; `params` is a `Promise` in this version — must `await params` (confirmed via Context7 `/vercel/next.js/v16.2.9` docs) |
| `next/navigation`'s `notFound()` | ships with Next 16.2.10 | Render Next's 404 UI when a `shareId` doesn't resolve | Built-in, no new dependency; confirmed via Context7 official docs — throws and terminates rendering, call before any `<Suspense>` boundary for a real HTTP 404 |

### Supporting
*(none — this phase introduces no new runtime dependencies)*

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Reusing Prisma `cuid()` as the shareId | `nanoid` (6.0.0) for a short slug | Only justified if a genuinely shorter URL is a real product requirement — not raised in CONTEXT.md. Reusing the cuid needs zero schema/API changes (it's already `scenario.get`'s exact input shape); adding nanoid would require a new column, a uniqueness constraint, and duplicate-ID collision handling for no discussed benefit. |
| Classic `@trpc/react-query` `createTRPCReact` client pattern | `@trpc/tanstack-react-query`'s `createTRPCContext`/`createTRPCOptionsProxy` pattern | The newer pattern is what current tRPC docs increasingly lead with, but it is a **different, uninstalled package**. Introducing it would add a new dependency for a client-side wiring task that the already-installed `@trpc/react-query` handles fully. |
| Server-side caller (`createCallerFactory`) for SSR data loading | `@trpc/react-query/rsc`'s `createHydrationHelpers` + `HydrateClient` prefetch pattern | The hydration-helpers pattern exists to let a Server Component *prefetch* into the client Query Cache for a subtree that later re-fetches/mutates the same query client-side. This phase's share/gallery pages only need one-shot server data to pass as a prop into `SandboxContainer` — no client-side re-fetch of that same query happens. The simpler direct-caller pattern (already proven in `scenario.test.ts`) avoids the extra `cache()`/`QueryClient` hydration machinery for no benefit here. |

**Installation:**
```bash
# No installation needed — every package used by this phase is already
# a direct dependency in package.json (@trpc/react-query, @trpc/client,
# @tanstack/react-query, next, react). Confirmed via `cat package.json`.
```

## Package Legitimacy Audit

**No new external packages are introduced by this phase.** Every library referenced above is an existing, already-installed dependency (`package.json`, verified by direct read). The Package Legitimacy Gate protocol applies only when a phase installs new packages — nothing here triggers it. `slopcheck`/registry verification was not run because there is nothing new to verify.

**Packages removed due to slopcheck [SLOP] verdict:** none (N/A — no new packages)
**Packages flagged as suspicious [SUS]:** none (N/A — no new packages)

## Architecture Patterns

### System Architecture Diagram

```
Browser (Client Component tree)
  │
  │  user clicks "Save" in SandboxContainer
  ▼
trpc.scenario.create.useMutation()  ──httpBatchLink──▶  /api/trpc  (existing route handler, Phase 3)
  │                                                          │
  │  onSuccess: router.push(`/s/${shareId}`)                 ▼
  │                                                   scenarioRouter.create
  │                                                          │
  │                                                          ▼
  │                                                   scenario-service.createScenario()
  │                                                     (dry-run classifyEncounter, discard verdict)
  │                                                          │
  │                                                          ▼
  │                                                   scenario-repository.create() → Postgres

Next.js server (RSC, no client fetch needed for initial load)
  GET /s/[shareId]  ──▶  page.tsx (server component)
                            │  await params; appRouter.createCaller(createTRPCContext())
                            │  .scenario.get({ shareId })
                            ▼
                     scenario-service.getScenario()
                       (fetch row, classifyEncounter() AGAIN — fresh verdict, SCEN-02)
                            │
                            ├─ null/NOT_FOUND ──▶ notFound() ──▶ Next 404 UI
                            │
                            ▼
                     row + verdict ──▶ <SandboxContainer initialScenario={...} banner={...} />
                                          (client component, hydrates, fully editable from here on)

  GET /gallery ──▶ page.tsx (server component)
                     appRouter.createCaller(...).gallery.list()
                     ──▶ scenario-service.listGallery() (re-derives verdict per curated row)
                     ──▶ renders card grid, each card <Link href={`/s/${row.id}`}>
```

### Recommended Project Structure
```
app/
├── page.tsx                 # unchanged: default sandbox at "/"
├── layout.tsx                # + mount <TRPCReactProvider> around {children}
├── gallery/
│   └── page.tsx              # NEW: server component, gallery.list via server caller, card grid
└── s/
    └── [shareId]/
        └── page.tsx          # NEW: server component, scenario.get via server caller, notFound() on miss
src/
├── lib/
│   └── trpc/
│       ├── client.tsx         # NEW: "use client" — createTRPCReact<AppRouter>(), TRPCReactProvider
│       └── server.ts          # NEW: server-only caller — appRouter.createCaller(createTRPCContext())
├── components/sandbox/
│   ├── SandboxContainer.tsx   # MODIFIED: accept optional initialScenario + banner props
│   └── ...                    # ChartPanel/ControlPanel/ReasoningPanel: unchanged, no prop changes needed
prisma/
└── seed.ts                   # NEW: writes 5-8 curated Scenario rows directly via Prisma Client
prisma.config.ts               # MODIFIED: add migrations.seed = "node prisma/seed.ts"
```

### Pattern 1: Extending `SandboxContainer` with an optional seed scenario
**What:** Add `initialScenario?: { vesselA: Vessel; vesselB: Vessel }` and a `banner?: { label: string; rationale?: string }` prop. Replace the hardcoded `crossingResidualBasicCase` default with `initialScenario ?? crossingResidualBasicCase` in each `useState` initializer.
**When to use:** Any route that needs to open the sandbox pre-loaded (`/s/[shareId]`, and gallery detail via the same route).
**Example:**
```typescript
// src/components/sandbox/SandboxContainer.tsx (targeted diff, not a rewrite)
interface SandboxContainerProps {
  initialScenario?: { vesselA: Vessel; vesselB: Vessel };
  banner?: { label: string; rationale?: string };
}

export function SandboxContainer({ initialScenario, banner }: SandboxContainerProps) {
  const seedA = initialScenario?.vesselA ?? crossingResidualBasicCase.vesselA;
  const seedB = initialScenario?.vesselB ?? crossingResidualBasicCase.vesselB;
  const [vesselA, setVesselA] = useState<Vessel>(seedA);
  const [vesselB, setVesselB] = useState<Vessel>(seedB);
  // lastGoodClassification's lazy initializer and previousEncounterTypeRef
  // must also derive from (seedA, seedB) instead of the hardcoded fixture --
  // classifyEncounter(seedA, seedB) replaces the two hardcoded
  // crossingResidualBasicCase.vesselA/vesselB references at lines 43-46, 54-56.
  // handleReset() still resets to the hardcoded default fixture (D-06 from
  // Phase 4 is about the RESET behavior specifically, not the seed source --
  // CONTEXT.md does not ask Reset to return to the *loaded* scenario).
  // ...
}
```

### Pattern 2: One detail route serves both plain shares and gallery entries
**What:** `/s/[shareId]/page.tsx` calls `scenario.get`, which already returns the full row (including `isCurated`/`rationale`). Conditionally build the `banner` prop: if `row.isCurated && row.rationale`, show the rationale text; otherwise show a generic "Viewing saved scenario — drag to explore" label.
**When to use:** Every gallery card links to `/s/${row.id}` rather than a separate `/gallery/[id]` page — this is the literal reuse the phase goal asks for ("reusing the persistence layer and sandbox UI already built"), and it means zero duplicate detail-page code between "shared link" and "gallery entry" flows.
**Example:**
```typescript
// app/s/[shareId]/page.tsx
import { notFound } from "next/navigation";
import { TRPCError } from "@trpc/server";
import { SandboxContainer } from "../../../src/components/sandbox/SandboxContainer.js";
import { getCaller } from "../../../src/lib/trpc/server.js";

export default async function SharedScenarioPage({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;
  const caller = getCaller();

  let scenario;
  try {
    scenario = await caller.scenario.get({ shareId });
  } catch (err) {
    if (err instanceof TRPCError && err.code === "NOT_FOUND") notFound();
    throw err;
  }

  const banner = scenario.isCurated && scenario.rationale
    ? { label: "Gallery example", rationale: scenario.rationale }
    : { label: "Viewing saved scenario — drag to explore" };

  return (
    <SandboxContainer
      // KEY: forces React to remount (re-run useState initializers) when
      // navigating client-side between two different /s/[shareId] routes --
      // otherwise the sandbox would silently keep showing the PREVIOUS
      // scenario's vessels (see Pitfall 1 below).
      key={shareId}
      initialScenario={{
        vesselA: {
          position: { x: scenario.vesselAPosX, y: scenario.vesselAPosY },
          heading: scenario.vesselAHeading,
          speed: scenario.vesselASpeed,
          type: scenario.vesselAType as VesselType,
        },
        vesselB: { /* same shape for B */ } as Vessel,
      }}
      banner={banner}
    />
  );
}
```

### Pattern 3: Client-side tRPC provider (classic `createTRPCReact`, matches installed deps)
**What:** Source: Context7 `/trpc/trpc` — "Create tRPC React Client with Provider" + "Integrate TRPCReactProvider in Next.js Root Layout".
```tsx
// src/lib/trpc/client.tsx
"use client";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { useState } from "react";
import type { AppRouter } from "../../server/api/routers/_app.js";

export const trpc = createTRPCReact<AppRouter>();

let clientQueryClientSingleton: QueryClient;
function getQueryClient() {
  if (typeof window === "undefined") return makeQueryClient();
  return (clientQueryClientSingleton ??= makeQueryClient());
}
function makeQueryClient(): QueryClient {
  const { QueryClient } = require("@tanstack/react-query");
  return new QueryClient();
}
function getUrl() {
  return typeof window !== "undefined" ? "/api/trpc" : "http://localhost:3000/api/trpc";
}

export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    trpc.createClient({ links: [httpBatchLink({ url: getUrl() })] }),
  );
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
```
```tsx
// app/layout.tsx — mount once at the root
import { TRPCReactProvider } from "../src/lib/trpc/client.js";
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-slate-50 min-h-screen">
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
```

### Pattern 4: Server-side caller for SSR pages (no HTTP round-trip)
**What:** Source: Context7 `/trpc/trpc` — "Implement tRPC Server Caller for Server Components". Reuses this project's *existing* `createTRPCContext`/`appRouter` — the exact same primitives `scenario.test.ts` already uses.
```typescript
// src/lib/trpc/server.ts
import "server-only";
import { appRouter } from "../../server/api/routers/_app.js";
import { createTRPCContext } from "../../server/api/trpc.js";

export function getCaller() {
  return appRouter.createCaller(createTRPCContext());
}
```

### Pattern 5: Prisma seed script (direct Prisma Client, bypasses the public mutation — D-03)
**What:** Source: Context7 `/prisma/prisma` — seed command resolution + ESM execution. Prisma 7 reads the seed command from `prisma.config.ts`'s `migrations.seed` (this project already uses `prisma.config.ts`, not `package.json`'s `prisma.seed` field, for its datasource/migrations config — keep the seed command in the same file for consistency).
```typescript
// prisma.config.ts (add migrations.seed)
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "node prisma/seed.ts" },
  datasource: { url: env("DATABASE_URL") },
});
```
```typescript
// prisma/seed.ts
import "dotenv/config"; // defensive: don't rely on the parent CLI process's
                         // already-loaded env being inherited by this subprocess
import { prisma } from "../src/server/db/client.js"; // reuse the adapter-configured
                                                       // singleton -- a bare
                                                       // `new PrismaClient()` throws
                                                       // P2038 in Prisma 7 without
                                                       // the pg driver adapter
import { classifyEncounter } from "../src/domain/colregs/classify-encounter.js";
import type { Vessel } from "../src/domain/vessel/vessel.js";

interface CuratedEntry {
  vesselA: Vessel;
  vesselB: Vessel;
  rationale: string;
  displayOrder: number;
}

const curated: CuratedEntry[] = [
  // Author 5-8 entries here (D-04's shape: head-on, give-way crossing,
  // stand-on crossing/mirror, overtaking, 1-2 Rule 18 examples). See
  // "Fixture Catalog for Seed Authoring" below for known-good starting
  // points and which fixtures are NOT safe to reuse as-is.
];

async function main() {
  for (const entry of curated) {
    // Defensive dry-run validation, mirroring createScenario's own guard --
    // a seed row that fails classification would break gallery.list's
    // non-optional re-derivation at every future read.
    const result = classifyEncounter(entry.vesselA, entry.vesselB);
    if (!result.ok) {
      throw new Error(`Curated entry unclassifiable: ${result.reason}`);
    }
    await prisma.scenario.create({
      data: {
        vesselAPosX: entry.vesselA.position.x,
        vesselAPosY: entry.vesselA.position.y,
        vesselAHeading: entry.vesselA.heading,
        vesselASpeed: entry.vesselA.speed,
        vesselAType: entry.vesselA.type,
        vesselBPosX: entry.vesselB.position.x,
        vesselBPosY: entry.vesselB.position.y,
        vesselBHeading: entry.vesselB.heading,
        vesselBSpeed: entry.vesselB.speed,
        vesselBType: entry.vesselB.type,
        isCurated: true,
        rationale: entry.rationale,
        displayOrder: entry.displayOrder,
      },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
```
```bash
# Run manually with:
npx prisma db seed
# (No `tsx`/`ts-node` needed -- Node 22.23.1 in this environment has
# TypeScript type stripping ON BY DEFAULT since v22.18.0, confirmed by
# directly running a .ts file with interfaces + type-only imports via
# plain `node file.ts` in this session, no flag required.)
```

**Fixture Catalog for Seed Authoring** (from `src/domain/colregs/classify-encounter.fixtures.ts` — starting points, not literal seed data per CONTEXT.md's discretion):

| Fixture | Encounter type | `expectedDoubt` | Safe as a curated seed row? |
|---|---|---|---|
| `headOnGenuineCase` | head-on | **true** | Only option for a "textbook head-on" — see Pitfall 2. No head-on fixture in this codebase has `doubt: false`, because the domain's head-on sector *is* the doubt band (see Pitfall 2). |
| `crossingResidualBasicCase` | crossing | false | Clean, but this is *also* the app's hardcoded default scenario at `/` — consider a distinct scenario for the gallery card to avoid the gallery's "give-way crossing" example looking identical to what every visitor already saw on landing. |
| `overtakingBothDirectionsCase` | overtaking | false | Clean overtaking, no `previous` dependency — safe. |
| `crossingRule18OverrideCase` / `crossingRule18NonOverrideCase` | crossing | false | Clean Rule 18 crossing examples (fishing vessel outranking power-driven, and the non-override mirror). |
| `headOnRule18OverrideCase` | head-on | **true** | Inherits the same always-doubt head-on property (see Pitfall 2) even though it also demonstrates Rule 18. |
| `overtakingRule18NoOverrideCase` | overtaking | false | Demonstrates Rule 13(a)'s explicit override of Rule 18 (overtaking vessel keeps give-way regardless of type) — clean. |
| `overtakingHysteresisHoldsCase` / `overtakingHysteresisReleasesCase` / `overtakingHysteresisNearBoundaryCase` | overtaking | n/a | **NOT safe** — their expected classification depends on a `previous` encounter-type argument. A freshly-read `Scenario` row has no persisted `previous` state; `getScenario`/`listGallery` always call `classifyEncounter()` with no third argument (see `scenario-service.ts`). Any hysteresis-dependent fixture will classify *differently* on a fresh read than the fixture's own test asserts. |
| `doubtBand*Case`, `*Boundary*Case`, `*Pitfall2*Case` | various | true (edge-case) | Deliberately near-boundary/ambiguous test fixtures — out of scope per D-04 ("clean... textbook" cases) and RSON-V2-01 (ambiguous cases are explicitly v2). |

No fixture currently demonstrates a "stand-on crossing (mirror view)" as a *distinct* curated pair from `crossingResidualBasicCase`/`crossingRule18*Case` — D-04's "mirror view of the same encounter" likely needs a hand-authored pair (same relative geometry, vessel labels/roles swapped) rather than reuse of an existing fixture as-is; flag for planning/execution to author directly.

### Anti-Patterns to Avoid
- **Building a second, read-only rendering mode for shared/gallery scenarios:** D-02 explicitly rejects this — reuse the same editable `SandboxContainer`.
- **Extending `scenario.create`'s public input schema with `isCurated`/`rationale`/`displayOrder`:** D-03 explicitly rejects this — no auth exists to gate who can mark a scenario curated.
- **Reaching for `@trpc/tanstack-react-query`'s newer proxy-based client API:** not installed; would add an unapproved dependency for no benefit over the already-installed classic `@trpc/react-query` pattern.
- **Persisting the seed script's classification result:** the seed script's `classifyEncounter()` call (shown above) is validation-only, exactly mirroring `createScenario`'s own dry-run pattern — never write a verdict/encounterType column, which does not exist in the schema by design (D-06, Phase 3).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Shareable ID generation | A custom slug generator or `nanoid` integration | The existing Prisma `cuid()` (`Scenario.id`) | `scenario.get` already takes `{ shareId: string }` matched against `id` — zero new code, matches CLAUDE.md's explicit "don't add nanoid by default" guidance |
| Client-side data-fetching/mutation plumbing | A hand-rolled `fetch()` + manual loading/error state for the Save button | `@trpc/react-query`'s `useMutation()` (already an installed, locked dependency) | Type-safe end-to-end with the existing `AppRouter` type; no new dependency, no hand-rolled cache/retry logic |
| 404 handling for an invalid `shareId` | A custom "Scenario not found" page component wired through manual routing logic | `next/navigation`'s `notFound()` + the App Router's `not-found.tsx` convention | Built into the framework already in use; produces a real HTTP 404 status when called before any `<Suspense>` boundary (confirmed via Context7 official docs) |

**Key insight:** every piece of net-new infrastructure this phase would otherwise be tempted to build (ID scheme, read-only view mode, admin-only curation flag) already has a deliberate, documented reason NOT to build it, recorded in Phase 3/4's own CONTEXT.md decisions. The actual new code surface is small: two page components, one provider file, one seed script, and a handful of prop additions to `SandboxContainer`.

## Common Pitfalls

### Pitfall 1: Client-side navigation between two different `/s/[shareId]` routes does not remount `SandboxContainer` by default
**What goes wrong:** If a user navigates (via a `<Link>`) from `/s/abc123` to `/s/xyz789` — e.g. clicking from one gallery entry's detail view to another — Next.js/React does not automatically discard and remount the page's component tree just because the dynamic segment's value changed; it's still "the same route" in React's reconciliation sense. `SandboxContainer`'s `useState(seedA)`/`useState(seedB)` initializers only run once, at mount — the sandbox would keep showing the *previous* scenario's vessels even though the URL and server-fetched data are correct for the new one.
**Why it happens:** Standard React behavior — same component type at the same position in the tree is reused across renders regardless of new props, unless a `key` changes.
**How to avoid:** Pass `key={shareId}` to `<SandboxContainer key={shareId} .../>` in `app/s/[shareId]/page.tsx`, forcing React to unmount/remount (and thus re-run every `useState` initializer) whenever `shareId` changes.
**Warning signs:** Manually clicking between two different gallery entries in the same session shows the *first* entry's vessels persisting on the chart despite a different verdict/rationale banner appearing correctly (since the banner text comes straight from server-rendered props, but the client component's internal state was never reset).

### Pitfall 2: Every head-on classification always carries `doubt: true` — by domain design, not by accident
**What goes wrong:** Authoring a "textbook, doubt-free head-on" gallery entry is geometrically impossible in this codebase. `classifyEncounter()`'s head-on branch requires `Math.abs(relativeBearingAtoB) <= DOUBT_BAND_DEGREES (5) && Math.abs(relativeBearingBtoA) <= 5` — the *exact same* condition that sets `doubt = true`. A truly reciprocal, dead-ahead head-on encounter (relative bearing ≈ 0° both ways) sits at the center of its own doubt band by definition.
**Why it happens:** Deliberate Phase 2 domain modeling choice (documented inline in `classify-encounter.ts` as "Assumption A1") reflecting COLREGS Rule 14(c)'s literal doubt clause — not a Phase 5 concern to fix.
**How to avoid:** Do not attempt to find/author a "clean" head-on fixture with `doubt: false` — none exists and none should. Instead, write the gallery's head-on rationale text so it doesn't contradict the UI's doubt-caveat banner that will always render alongside it (D-05's own example rationale — "a clear head-on situation requiring both vessels to alter course to starboard" — already does this correctly: it asserts clarity about the *required action*, not about the absence of the geometric doubt flag).
**Warning signs:** QA/review flags the gallery's head-on card as "buggy" because it shows an amber doubt-caveat line even though the rationale calls it "clear" — this is expected, cross-check against `classify-encounter.ts`'s Assumption A1 comment before treating it as a defect.

### Pitfall 3: Hysteresis-dependent fixtures cannot be reused as curated seed rows
**What goes wrong:** Fixtures like `overtakingHysteresisHoldsCase` only produce their documented `expectedEncounterType` when `classifyEncounter()` is called with a specific `previous` argument. `getScenario`/`listGallery` never pass a `previous` argument (there is no persisted verdict to source one from, by design — D-06). Seeding one of these fixtures verbatim would silently reclassify to a *different* encounter type than the fixture's own name/comment describes, the very first time it's read back.
**Why it happens:** Confusing "this fixture is doubt-free/clean" with "this fixture is safe on a stateless fresh read" — they are different properties.
**How to avoid:** Before selecting any fixture as a seed-row source, check whether it (or fixtures it's derived from, like `stage0CoincidentPropagationCase`) sets a `previous` field or has "hysteresis" in its name/comment — if so, exclude it. See the Fixture Catalog table above.
**Warning signs:** A curated gallery card's displayed verdict/rule-citation doesn't match what the seed script's authoring comment claims it should be.

### Pitfall 4: A bare `new PrismaClient()` in the seed script throws in Prisma 7
**What goes wrong:** Prisma 7 removed the bundled Rust query-engine binary; `new PrismaClient()` with no driver adapter throws `P2038` on the very first query.
**Why it happens:** Prisma 7's adapter-based architecture (already documented inline in `src/server/db/client.ts`).
**How to avoid:** Import and reuse the existing `prisma` singleton from `src/server/db/client.ts` (already wired with `PrismaPg`) inside `prisma/seed.ts`, rather than constructing a second, unconfigured client.
**Warning signs:** `prisma db seed` fails immediately with a `P2038`-coded error.

### Pitfall 5: `DATABASE_URL` may not be visible to the seed subprocess
**What goes wrong:** This project's Vitest config needed an explicit `setupFiles: ["./vitest.setup.ts"]` specifically because "Vitest does not auto-load `.env`... tests connect with DATABASE_URL undefined" (existing inline comment, `vitest.config.ts`). The same class of problem can affect `prisma db seed`, which spawns the seed command as a *subprocess* — while `prisma.config.ts`'s own `dotenv/config` import should populate the parent CLI process's env before it forwards to the child, this is an implicit dependency on process-env inheritance.
**Why it happens:** Node does not auto-load `.env` files without an explicit loader; this project already had to work around the same gap once (Vitest).
**How to avoid:** Add a defensive `import "dotenv/config";` at the top of `prisma/seed.ts` itself, matching the existing pattern already used in `prisma.config.ts`.
**Warning signs:** `prisma db seed` fails with a Postgres connection error / `DATABASE_URL is not set`, despite `.env` existing and `npm run dev`/`npm test` working fine.

## Code Examples

See Architecture Patterns 1-5 above — each includes a verified, sourced code example (Context7 `/trpc/trpc` for the client/server tRPC wiring, Context7 `/vercel/next.js/v16.2.9` for `params`/`notFound()`, Context7 `/prisma/prisma` for seed-command resolution, direct codebase reads for the Prisma-client-singleton and `SandboxContainer` extension patterns).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| `ts-node`/`tsx` to run TypeScript scripts directly | Node's native type stripping (`node file.ts`, no flag) | Unflagged by default in Node v22.18.0 (Aug 2025); fully default in v23.6/v24 | The seed script needs **no new dev dependency** to run — confirmed directly in this environment (Node v22.23.1, verified by executing a `.ts` file with interfaces and a type-only import via plain `node`) |
| tRPC's classic `createTRPCReact` client API | `@trpc/tanstack-react-query`'s proxy-based `createTRPCContext`/`createTRPCOptionsProxy` | tRPC's own docs increasingly lead with the newer pattern | **Not applicable here** — the newer package isn't installed; this phase must use the classic pattern already matching `package.json`'s locked `@trpc/react-query` dependency |

**Deprecated/outdated:** none directly relevant — this project's locked stack (`@trpc/react-query` 11.18.0, not the newer `@trpc/tanstack-react-query`) is a deliberate, already-made choice per CLAUDE.md, not something this research should second-guess.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `tsx`/`ts-node` is not needed to run `prisma/seed.ts` because Node's native type-stripping is on by default in this environment's Node version (v22.23.1) | Architecture Patterns, Pattern 5 / State of the Art | If the deployment/CI environment runs an older Node (<22.18.0) or has type stripping explicitly disabled, `node prisma/seed.ts` would fail and a `tsx`/`ts-node` dev dependency would need to be added. Directly verified via `node --version` and a live type-stripping test IN THIS SESSION, so this is HIGH confidence for the current dev environment specifically — CI/production Node version should be confirmed separately if it differs. |
| A2 | Reusing the Prisma cuid directly as the shareId is sufficient and no shorter/obfuscated slug is needed | User Constraints / Standard Stack | If a stakeholder later wants a shorter URL for aesthetic/marketing reasons, this becomes a schema migration (new unique column) rather than a config change — low risk since CONTEXT.md's Claude's-discretion note already anticipated and accepted this as a non-decision for this phase. |
| A3 | `SandboxContainer`'s `handleReset()` should continue resetting to the hardcoded default fixture even when the page was loaded via `initialScenario` (i.e., Reset does NOT re-seed from the loaded scenario) | Architecture Patterns, Pattern 1 | CONTEXT.md does not explicitly address this interaction between D-02 (seed from saved scenario) and Phase 4's existing Reset button. If the intended UX is "Reset returns to the scenario this page loaded," not "Reset returns to the app's global default," this needs a one-line change (`handleReset` should reference `seedA`/`seedB` instead of the fixture) — flagged as an Open Question below. |

## Open Questions

1. **Should "Reset Scenario" on a `/s/[shareId]` page reset to the loaded scenario, or to the global default fixture?**
   - What we know: Phase 4's `handleReset()` currently hardcodes `crossingResidualBasicCase`. D-02 only specifies the *initial* load behavior, not Reset's behavior when a scenario was loaded from a share/gallery link.
   - What's unclear: Whether a user who has been dragging vessels around on a shared/gallery scenario expects "Reset" to snap back to *that* scenario's original values, or to the app's unrelated default demo scenario.
   - Recommendation: Snap back to the loaded scenario's original values (`seedA`/`seedB`) when `initialScenario` was provided, falling back to `crossingResidualBasicCase` only on the plain `/` route — this matches user intuition ("reset what I was looking at") better than resetting to an unrelated scenario. Low-risk, cheap to implement either way; confirm with a quick discuss-phase note or make the call during planning.

2. **Should the gallery list page show a mini-chart SVG preview per card, or stay text+badge only?**
   - What we know: CONTEXT.md leaves this entirely to Claude's discretion, with a strong steer toward "keep it simple" if no preview is built, and "SVG-first, no canvas" if one is.
   - What's unclear: Whether a small static SVG preview (even a simplified one, not the full interactive `ChartPanel`) adds enough value for a 5-8-item gallery to justify the extra component surface.
   - Recommendation: Start text + encounter-type badge only (zero new rendering code); a mini-preview can be added later without any backend/routing changes since `gallery.list` already returns full vessel geometry.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js (native TS type stripping) | Running `prisma/seed.ts` directly | ✓ | v22.23.1 [VERIFIED: `node --version` + live type-stripping test in this session] | Add `tsx` as a devDependency if a different environment's Node is older than v22.18.0 |
| PostgreSQL (via `docker-compose.yml`, `postgres:17`) | All persistence work (seed script, `scenario.create`/`get`, `gallery.list`) | Not verified running in this research session (`pg_isready` unavailable in this shell; Docker daemon not confirmed reachable) | `postgres:17` per `docker-compose.yml` | None — this is a hard requirement already established in Phase 3; start via `docker compose up -d` before running the seed script or any DB-backed test |
| `@trpc/react-query`, `@tanstack/react-query`, `@trpc/client` | Client-side Save mutation | ✓ | 11.18.0 / 5.101.2 / 11.18.0 [VERIFIED: package.json] | — |

**Missing dependencies with no fallback:**
- None identified for this phase's actual code — the Postgres availability check simply could not be executed in this research shell; it must be confirmed running before planning proceeds to execution/testing.

**Missing dependencies with fallback:**
- Node's native TS type stripping (fallback: add `tsx`, a well-established zero-config TypeScript runner, if the execution environment's Node predates v22.18.0).

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | No | Explicitly out of scope project-wide (PROJECT.md) — scenarios are shareable by link, not owned by an account |
| V3 Session Management | No | No sessions/cookies introduced by this phase |
| V4 Access Control | Yes (by design, not a gap) | Any valid `shareId` is publicly viewable with no ownership check — this is the intended "no login required" design (SCEN-01's own wording). Cuid entropy makes ID enumeration/guessing impractical [ASSUMED — cuid's collision-resistant, non-sequential design is well-established, but exact bit-entropy was not independently recalculated this session]. |
| V5 Input Validation | Yes | Already handled by `VesselSchema`/`VesselTypeSchema` (Zod, Phase 1) at the `scenario.create` boundary — this phase adds no new user-text input fields (rationale text is seed-script-authored, not user-submitted) |
| V6 Cryptography | No | No new cryptographic operations; `cuid()` generation is Prisma's own default, not hand-rolled here |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|----------------------|
| Unauthenticated, unbounded `scenario.create` calls (row-creation spam) | Denial of Service | Already an accepted, existing exposure from Phase 3 (no auth by design) — Phase 5 adds a UI trigger (Save button) that makes this endpoint reachable by ordinary users rather than only API testers, but does not change the underlying risk profile. Out of this phase's scope to add rate limiting; noted for awareness, not a blocking finding. |
| Raw `shareId` path segment passed to Prisma's `findUnique` | Tampering / Injection | Already mitigated — Prisma's generated client parameterizes all queries; a malformed/garbage `shareId` simply returns `null` → `notFound()`, never reaches raw SQL |
| Verbose Prisma/internal error leakage over the tRPC boundary | Information Disclosure | Already mitigated by the existing `errorFormatter` in `src/server/api/trpc.ts` (strips Prisma details when `NODE_ENV === "production"`) — no new error paths introduced by this phase bypass that formatter |

## Sources

### Primary (HIGH confidence)
- Context7 `/trpc/trpc` — `createTRPCReact` + `TRPCProvider` client setup, `TRPCReactProvider` root-layout mounting, server-side caller pattern (`appRouter.createCaller`), hydration-helpers pattern (evaluated and deliberately not chosen)
- Context7 `/vercel/next.js/v16.2.9` — dynamic route `params` as `Promise`, `notFound()` behavior and placement relative to `<Suspense>`
- Context7 `/prisma/prisma` — seed command resolution (`prisma.config.ts`'s `migrations.seed` vs. `package.json`'s `prisma.seed`), ESM seed execution fixture confirming `"type": "module"` seed scripts are supported
- Direct codebase reads (this session): `prisma/schema.prisma`, `src/server/api/routers/scenario.ts`, `src/server/api/routers/gallery.ts`, `src/server/application/scenario-service.ts`, `src/server/db/scenario-repository.ts`, `src/server/db/client.ts`, `src/components/sandbox/SandboxContainer.tsx`, `src/components/sandbox/types.ts`, `app/page.tsx`, `app/layout.tsx`, `app/api/trpc/[trpc]/route.ts`, `src/server/api/trpc.ts`, `src/domain/vessel/vessel.ts`, `src/domain/colregs/classify-encounter.ts`, `src/domain/colregs/classify-encounter.fixtures.ts`, `src/domain/colregs/types.ts`, `src/domain/colregs/resolve-doubt-geometry.ts`, `package.json`, `tsconfig.json`, `next.config.ts`, `prisma.config.ts`, `vitest.config.ts`, `docker-compose.yml`, `src/server/api/routers/scenario.test.ts`, `src/server/db/scenario-repository.test.ts`
- Live environment verification (this session): `node --version` (v22.23.1), a direct `node <file>.ts` run containing an `interface`, a `type` alias, and a type-only `import type` — succeeded with no flag, confirming native type stripping is active without `tsx`/`ts-node`

### Secondary (MEDIUM confidence)
- WebSearch, cross-checked against Node.js's own release-note framing — Node type stripping timeline (flag added in 22.x, unflagged by default in v22.18.0, fully default in v23.6/v24): [Node.js v22.18.0 (LTS) release notes](https://nodejs.org/en/blog/release/v22.18.0), [Node.js Learn: Running TypeScript Natively](https://nodejs.org/learn/typescript/run-natively)

### Tertiary (LOW confidence)
- None used as the basis for any Standard Stack or Pitfall claim — all findings above were either directly verified against this codebase/environment or against Context7-fetched official documentation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every library is already installed and pinned; no new package decisions were required
- Architecture: HIGH — every pattern is either a direct extension of existing, read code (`SandboxContainer`, `scenario-service.ts`) or a Context7-sourced official tRPC/Next.js pattern
- Pitfalls: HIGH — Pitfalls 1, 4, 5 are general framework/tooling facts (React key semantics, Prisma 7 adapter requirement, dotenv loading) already evidenced elsewhere in this same codebase; Pitfalls 2 and 3 were derived directly from reading `classify-encounter.ts`'s own source and inline comments, not inferred

**Research date:** 2026-07-18
**Valid until:** 2026-08-17 (30 days — stack is fully locked/installed, low volatility; re-verify Node version assumption (A1) if the target deploy environment's Node version is unknown)
