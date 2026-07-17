# Phase 4: Interactive Chart Sandbox - Pattern Map

**Mapped:** 2026-07-17
**Files analyzed:** 19
**Analogs found:** 8 / 19 (domain-integration + test-convention analogs; component/page role is genuinely greenfield — see "No Analog Found")

## Context

This phase is the first UI work in the repo. `app/` currently contains only the tRPC route handler; there is no `app/page.tsx`, no `src/components/`, no Tailwind config, and no `.tsx` test file anywhere. Consequently **there is no in-repo component/controller/page analog** to copy render or drag-interaction patterns from — RESEARCH.md's own Pattern 1/2/3 code examples (already vetted against Context7/MDN sources) are the closest thing to an analog for those files, not existing code.

What *does* exist and must be copied/reused directly:
1. The domain layer this UI wires into (`classifyEncounter`, `bearing`, `screenToChart`/`chartToScreen`, `VesselSchema`, `Result<T>`) — these are integration points, not patterns to imitate, and must be imported, never reimplemented.
2. The project's `describe`/`it`/`expect` + `*.fixtures.ts` test-authoring convention, used consistently across all 15 existing domain test files — the new component/hook tests should follow the same shape.
3. The project's ESM import conventions (`.js`-suffixed relative imports under `NodeNext` resolution, named exports only, no default exports observed anywhere in `src/`).
4. The tRPC-boundary Zod-reuse convention (`VesselSchema` imported directly rather than redefined) — directly relevant to `ControlPanel`'s form-state typing and `SandboxContainer`'s validation choke point.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `app/layout.tsx` | provider/root-layout | request-response (SSR shell) | *(none in repo)* | no-analog — use RESEARCH.md Next.js App Router pattern |
| `app/page.tsx` | route/page | request-response | `app/api/trpc/[trpc]/route.ts` (import-path convention only) | partial — path convention only |
| `app/globals.css` | config | — | *(none)* | no-analog — Tailwind v4 CSS-first config, follow RESEARCH.md |
| `src/components/sandbox/SandboxContainer.tsx` | component (stateful container) | event-driven | `src/domain/colregs/classify-encounter.ts` (integration target, not a component analog) | no-analog for component shape; strong integration-point match |
| `src/components/sandbox/ChartPanel.tsx` | component (presentational, SVG) | event-driven | `src/domain/geometry/screen-convert.ts` (coordinate-transform contract it must call) | no-analog for component shape; strong integration-point match |
| `src/components/sandbox/ControlPanel.tsx` | component (form) | request-response (onChange) | `src/domain/vessel/vessel.ts` (`VesselSchema`, `VesselTypeSchema` it must render/validate against) | no-analog for component shape; strong integration-point match |
| `src/components/sandbox/ReasoningPanel.tsx` | component (presentational, list) | transform (render `ReasoningTrailEntry[]`) | `src/domain/colregs/types.ts` (`ReasoningTrailEntry` shape it renders) | no-analog for component shape; strong integration-point match |
| `src/components/sandbox/hooks/useHullDrag.ts` | hook | event-driven | `src/domain/geometry/screen-convert.ts` (`screenToChart` it must call on every `pointermove`) | no-analog for hook shape; strong integration-point match |
| `src/components/sandbox/hooks/useRotateHandleDrag.ts` | hook | event-driven | `src/domain/geometry/bearing.ts` (`bearing()` it must call, not re-derive) | no-analog for hook shape; strong integration-point match |
| `src/domain/colregs/resolve-doubt-geometry.ts` (planner decision, per RESEARCH.md Open Question 2) | utility (pure domain fn) | transform | `src/domain/geometry/relative-bearing.ts` | role-match — same package, same `Result`-free pure-derivation shape |
| `src/domain/colregs/resolve-doubt-geometry.test.ts` | test | — | `src/domain/geometry/relative-bearing.test.ts` + `.fixtures.ts` | exact — same test-authoring convention |
| `src/components/sandbox/SandboxContainer.test.tsx` | test | — | `src/domain/colregs/classify-encounter.test.ts` (structure/style only, not RTL specifics) | partial — `describe`/`it`/`expect` convention carries over; RTL/jsdom mechanics are new |
| `src/components/sandbox/ChartPanel.test.tsx` | test | — | `src/domain/geometry/screen-convert.test.ts` | partial — same reasoning |
| `src/components/sandbox/hooks/useHullDrag.test.ts` | test | — | `src/domain/geometry/bearing.test.ts` | partial — same reasoning |
| `src/server/api/routers/scenario.ts` (unmodified, read-only reference) | router | CRUD | — | reference only: shows `VesselSchema` reuse-at-boundary pattern this phase's `ControlPanel`/`SandboxContainer` should mirror |
| `vitest.config.ts` | config | — | existing file, modify in place | exact — extend, don't replace |
| `vitest.setup.ts` | config | — | existing file, modify in place | exact — extend, don't replace |
| `package.json` | config | — | existing file, modify in place | exact — extend, don't replace |
| `postcss.config.mjs` (new) | config | — | *(none)* | no-analog — Tailwind v4 setup, follow RESEARCH.md install steps |

## Pattern Assignments

### `src/components/sandbox/SandboxContainer.tsx` (component, event-driven)

**Integration analog:** `src/domain/colregs/classify-encounter.ts`

**Import pattern to copy** (`classify-encounter.ts` lines 16-27):
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
Apply the same convention in the component: relative imports with explicit `.js` extensions (NodeNext ESM resolution — `tsconfig.json` has `"module": "NodeNext"`), `import type` for type-only imports, named exports only.

**Function signature to call directly** (`classify-encounter.ts` lines 38-42):
```typescript
export function classifyEncounter(
  vesselA: Vessel,
  vesselB: Vessel,
  previous?: EncounterType,
): Result<ClassificationResult> {
```
`SandboxContainer` must call this exactly as-is inside event handlers (RESEARCH.md Pattern 2), never in the render body, and must thread the `previous` argument via a `useRef<EncounterType | undefined>` for Rule 13(d) hysteresis.

**`Result<T>` handling pattern to copy** (`src/domain/shared/result.ts` lines 18-31):
```typescript
export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; reason: DegenerateCaseReason; details?: Record<string, unknown> };
```
`SandboxContainer` must branch on `result.ok` exactly like every domain consumer does — never assume `.value` exists without the guard. This is the same shape the Copywriting Contract's "Unable to classify" error state (04-UI-SPEC.md lines 107) is built to render for the `ok: false` branch.

**Zod-reuse-at-boundary pattern to copy** (`src/server/api/routers/scenario.ts` lines 7-10):
```typescript
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "../trpc.js";
import { VesselSchema } from "../../../domain/vessel/vessel.js"; // D-11: reuse, don't redefine
```
`SandboxContainer`'s `applyVesselUpdate` choke point (RESEARCH.md Pattern 2) should import `VesselSchema` the same way and `safeParse`/`parse` drag-derived numeric state before it reaches `classifyEncounter()`, matching the project's one existing precedent for validating at a boundary rather than trusting caller input (V5 in RESEARCH.md's Security Domain section).

---

### `src/components/sandbox/ChartPanel.tsx` (component, event-driven, SVG)

**Integration analog:** `src/domain/geometry/screen-convert.ts`

**Function signatures to call directly** (`screen-convert.ts` lines 44-48, 76-81):
```typescript
export function chartToScreen(
  position: Position,
  containerSize: ContainerSize,
  viewBox: ChartViewBox,
): { screenX: number; screenY: number }

export function screenToChart(
  screenX: number,
  screenY: number,
  containerSize: ContainerSize,
  viewBox: ChartViewBox,
): Position
```
`ChartPanel` supplies `containerSize` (via `ResizeObserver`, client-only) and a fixed `viewBox`; both functions are pure/DOM-free and must be called exactly as-is — do not reimplement the Y-axis inversion (`screen-convert.ts` lines 67-71 document why this is the most likely spot for a silent sign-flip bug).

**Error-throwing convention to be aware of** (`screen-convert.ts` lines 24-42): both functions `throw TypeError` (not `Result<T>`) for non-finite input or degenerate (zero-area) container/viewBox config — this is a different error-handling convention than `classifyEncounter()`'s `Result<T>` return. `ChartPanel` must guard `containerSize`/`viewBox` values are valid *before* calling these (e.g. skip rendering until `ResizeObserver`'s first callback fires with a non-zero size), not wrap every call in try/catch.

---

### `src/components/sandbox/hooks/useRotateHandleDrag.ts` (hook, event-driven)

**Integration analog:** `src/domain/geometry/bearing.ts`

**Function to call directly, never re-derive** (`bearing.ts` lines 15-38):
```typescript
export function bearing(a: Position, b: Position): Result<number> {
  if (
    !Number.isFinite(a.x) ||
    !Number.isFinite(a.y) ||
    !Number.isFinite(b.x) ||
    !Number.isFinite(b.y)
  ) {
    return err("invalid-input", { a, b });
  }
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (dx === 0 && dy === 0) {
    return err("coincident-position", { a, b });
  }
  const rawDegrees = Math.atan2(dx, dy) * (180 / Math.PI);
  const normalizedDegrees = ((rawDegrees % 360) + 360) % 360;
  return ok(normalizedDegrees);
}
```
This is the exact, already-tested, non-standard-atan2-argument-order function `useRotateHandleDrag`'s `pointermove` handler must call (`bearing(vessel.position, pointerChartPosition)`) — RESEARCH.md's Anti-Patterns section explicitly flags a second hand-rolled `atan2` in this hook as a drift risk. Returns `Result<number>`, so the hook must handle the `coincident-position` case (pointer dragged exactly onto the vessel's own center) the same way `SandboxContainer` handles `classifyEncounter()`'s degenerate cases.

---

### `src/components/sandbox/ReasoningPanel.tsx` (component, transform)

**Integration analog:** `src/domain/colregs/types.ts`

**Shape it renders directly, no transformation** (`types.ts` lines 44-48, 73-81):
```typescript
export interface ReasoningTrailEntry {
  ruleId: string;
  text: string;
  facts: Record<string, number | string | boolean>;
}

export interface ClassificationResult {
  encounterType: EncounterType;
  riskOfCollision: boolean;
  giveWay: VesselLabel | null;
  standOn: VesselLabel | null;
  doubt: boolean;
  doubtBoundary?: DoubtBoundary;
  trail: ReasoningTrailEntry[];
}
```
Per RESEARCH.md's Architectural Responsibility Map, `ReasoningPanel` renders `result.trail` (a `ReasoningTrailEntry[]`) with zero transformation logic — map each entry to a list item showing `ruleId` (as the "Rule 15" badge per 04-UI-SPEC.md Label typography) and `text` verbatim (including the existing Rule 18(a)-(c) "mutual obligation stands" copy — do not author new verdict-explanation strings, per 04-UI-SPEC.md's Copywriting Contract line 118).

---

### `src/domain/colregs/resolve-doubt-geometry.ts` (new pure domain utility — planner decision point)

**Analog:** `src/domain/geometry/relative-bearing.ts` (role-match: small, pure, single-purpose derivation function in the same package, same file-naming convention)

RESEARCH.md's Open Question 2 leaves the exact location undecided but recommends `src/domain/colregs/` for consistency with Clean Architecture layering (components may import FROM domain, never the reverse). If the planner places this here, follow `relative-bearing.ts`'s file shape: a single exported pure function, JSDoc header explaining the *why* (per CLAUDE.md's "comment only non-obvious code" persona), and a companion `resolve-doubt-geometry.fixtures.ts` + `resolve-doubt-geometry.test.ts` pair, mirroring every other file in `src/domain/`.

---

### Test files (all new `.test.ts`/`.test.tsx` files)

**Analog:** `src/domain/geometry/screen-convert.test.ts` (and, project-wide, all 15 existing `*.test.ts` files — this convention is 100% consistent across the repo)

**Import + structure pattern to copy** (`screen-convert.test.ts` lines 1-20):
```typescript
import { describe, expect, it } from "vitest";
import { chartToScreen, screenToChart } from "./screen-convert.js";
import {
  centeredOriginCase,
  degenerateViewBoxCase,
  nonFiniteInputCase,
  northUpCase,
  roundTripCases,
  screenToChartOriginCase,
  sharedContainerSize,
  sharedViewBox,
  southDownCase,
} from "./screen-convert.fixtures.js";

describe("chartToScreen", () => {
  it("maps the chart origin to the container's visual center", () => {
    const result = chartToScreen(centeredOriginCase.position, sharedContainerSize, sharedViewBox);
    expect(result.screenX).toBeCloseTo(centeredOriginCase.expectedScreenX, 2);
    expect(result.screenY).toBeCloseTo(centeredOriginCase.expectedScreenY, 2);
  });
  // ...
  it("throws a TypeError for non-finite position input", () => {
    expect(() =>
      chartToScreen({ x: Number.POSITIVE_INFINITY, y: 0 }, sharedContainerSize, sharedViewBox),
    ).toThrow(TypeError);
  });
});
```
Every existing test file in this repo: (1) uses explicit `describe`/`it`/`expect` named imports (`vitest.config.ts` sets `globals: false` — no auto-injected globals, matching CLAUDE.md's "no magic" persona), (2) imports fixtures from a co-located `*.fixtures.ts` file rather than inlining test data, (3) groups assertions by exported function under one `describe` block per function. New component/hook tests should follow the same three conventions, adapted for RTL: `render()`/`screen.getByRole()` calls replace direct function calls, but the `describe`/`it`/fixtures shape carries over unchanged.

**New per-file environment directive required** (RESEARCH.md Alternatives Considered, no in-repo precedent yet — first `.tsx` test files in the repo):
```typescript
// @vitest-environment jsdom
```
Add this docblock at the top of every new `.test.tsx` file (component tests only — existing `.test.ts` domain tests stay on the current `environment: "node"` default in `vitest.config.ts`, do not change the global default).

---

### `vitest.config.ts` (modify in place)

**Current file, extend rather than replace** (full current content, 21 lines):
```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node", // default; explicit here since Success Criterion 3 depends on it
    include: ["src/**/*.test.ts"],
    globals: false, // explicit describe/it/expect imports — matches CLAUDE.md's "no magic" persona
    setupFiles: ["./vitest.setup.ts"],
    fileParallelism: false,
  },
});
```
Required changes for this phase, per RESEARCH.md Standard Stack: (1) `include` pattern must widen to also match `.test.tsx` (`"src/**/*.test.{ts,tsx}"`), (2) add `@vitejs/plugin-react-swc` (or `-react`, pick one per RESEARCH.md Alternatives) to `plugins` so `.tsx` component test files transform correctly — Next.js's own SWC pipeline does not apply inside the separate Vitest process. Do not change `environment: "node"` globally or remove `fileParallelism: false` (that setting is load-bearing for Phase 3's Postgres test isolation, unrelated to this phase — leave it untouched).

---

### `vitest.setup.ts` (modify in place)

**Current file, extend rather than replace** (full current content, 8 lines):
```typescript
import "dotenv/config";
```
If `@testing-library/jest-dom` is installed (RESEARCH.md Standard Stack), add its matcher-extension import here (the conventional single-setup-file location, consistent with how `dotenv/config` is already the one existing setup concern): `import "@testing-library/jest-dom/vitest";`. Keep the existing `dotenv/config` import — do not remove it, Phase 3's DB tests still depend on it.

---

## Shared Patterns

### ESM import convention (project-wide, all `src/` files)
**Source:** every file in `src/domain/` and `src/server/`
**Apply to:** all new `.ts`/`.tsx` files under `src/components/`
```typescript
import type { Position } from "../vessel/vessel.js";
```
Relative imports always carry an explicit `.js` extension (not `.ts`) even though the source file is `.ts` — required by `tsconfig.json`'s `"moduleResolution": "NodeNext"`. This applies to every new file in this phase, including component-to-domain imports (e.g. `ChartPanel.tsx` importing `screenToChart` from `../../domain/geometry/screen-convert.js`).

### `Result<T>` degenerate-case handling (project-wide, all domain call sites)
**Source:** `src/domain/shared/result.ts` lines 18-31, consumed throughout `src/domain/` and now, first, by this phase's UI
**Apply to:** `SandboxContainer.tsx` (classifyEncounter, bearing), `useRotateHandleDrag.ts` (bearing), any component reading a domain function's return value
```typescript
export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; reason: DegenerateCaseReason; details?: Record<string, unknown> };
```
Every call into `src/domain/` from this phase's new UI code must branch on `.ok` before touching `.value` — this is the first phase where a `Result<T>` failure (`coincident-position` specifically, per RESEARCH.md Pitfall 5 and 04-UI-SPEC.md's "Unable to classify" error copy) must be rendered to an end user rather than just asserted on in a test.

### Zod schema reuse at a validation boundary
**Source:** `src/server/api/routers/scenario.ts` line 10 (`import { VesselSchema } from "../../../domain/vessel/vessel.js"; // D-11: reuse, don't redefine`)
**Apply to:** `ControlPanel.tsx` (form state typing), `SandboxContainer.tsx` (`applyVesselUpdate` validation choke point)
```typescript
import { VesselSchema, VesselTypeSchema } from "../../domain/vessel/vessel.js";
```
Do not define a parallel UI-only vessel type or a parallel enum of vessel-type option strings — `VesselTypeSchema`'s `.options` (Zod enum) is the single source of truth for `ControlPanel`'s `<select>` options, matching 04-UI-SPEC.md's Copywriting Contract instruction to "reuse Zod schema's own values, do not invent parallel UI labels."

### Domain-layer purity boundary (architectural, not a code excerpt)
**Source:** CLAUDE.md's stated hard rule + verified by `grep`-level inspection of every `src/domain/*.ts` file (zero imports from `react`, `next`, `@trpc/*`, `@prisma/*` anywhere in `src/domain/`)
**Apply to:** all new files
`src/domain/` must never import from `src/components/` or any Next.js/React package — this phase's new files only ever import FROM `src/domain/`, never the reverse. If `resolve-doubt-geometry.ts` is added to `src/domain/colregs/`, it must remain framework-free like every other file there.

## No Analog Found

Files with no close match in the codebase — this is expected and correct for a phase that is the first UI work in the repo. Planner should use RESEARCH.md's Architecture Patterns (Pattern 1/2/3, full code examples) and 04-UI-SPEC.md (colors, typography, spacing, copy) as the primary reference for these instead of an in-repo analog:

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `app/layout.tsx` | provider/root-layout | request-response | No `app/*.tsx` file exists yet — `app/` only has the tRPC route handler. Use RESEARCH.md's Recommended Project Structure + standard Next.js 16 App Router root-layout shape (imports `globals.css`). |
| `app/page.tsx` | route/page | request-response | Same — first page in the repo. Mounts `SandboxContainer` with the D-06 default scenario (recommend pulling `crossingResidualBasicCase` from `src/domain/colregs/classify-encounter.fixtures.ts` lines 220-227 directly, per RESEARCH.md Open Question 1's own recommendation — it is the only fixture that is a classic crossing, doubt-free, non-null-giveWay case). |
| `app/globals.css` | config | — | No CSS file exists yet. Tailwind v4 CSS-first config (`@import "tailwindcss"`) per RESEARCH.md Standard Stack — no v3-style `tailwind.config.js` needed. |
| `postcss.config.mjs` | config | — | No PostCSS config exists yet; required for `@tailwindcss/postcss` per RESEARCH.md install steps. |
| `SandboxContainer.tsx`, `ChartPanel.tsx`, `ControlPanel.tsx`, `ReasoningPanel.tsx` (component *shape* — JSX/hooks structure, not the domain calls they make) | component | event-driven / transform | No React component exists anywhere in the repo. Domain-call integration points ARE mapped above; the surrounding component/JSX shape has no in-repo precedent — follow RESEARCH.md Patterns 1-3 and 04-UI-SPEC.md's spacing/typography/color tables directly. |
| `useHullDrag.ts`, `useRotateHandleDrag.ts` (hook *shape*) | hook | event-driven | No custom hook exists in the repo. `setPointerCapture`/`pointermove` mechanics have no in-repo precedent — follow RESEARCH.md Pattern 1 (verified against MDN + blog.r0b.io). |

## Metadata

**Analog search scope:** `src/domain/` (19 files), `src/server/` (9 files), `app/` (1 file), repo root config files (`vitest.config.ts`, `vitest.setup.ts`, `package.json`, `tsconfig.json`)
**Files scanned:** ~30
**Pattern extraction date:** 2026-07-17
