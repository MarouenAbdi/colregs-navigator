# Phase 7: Hero - Pattern Map

**Mapped:** 2026-07-18
**Files analyzed:** 6 (2 new components, 1 new fixture module, 2 new tests, 2 modified files)
**Analogs found:** 6 / 6

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/hero/Hero.tsx` | component (plain Server Component, markup + inline domain call) | transform (render-time pure-function call → static markup, zero client state) | `src/components/layout/Header.tsx` (structure/CTA composition) + `src/components/sandbox/ReasoningPanel.tsx` (deriving readouts/verdict text from a `ClassificationResult`) | role-match (composite — no single existing file is both "plain Server Component" AND "renders a classification verdict") |
| `src/components/hero/hero-preview-fixture.ts` | fixture/config module | CRUD (static data — none; pure exported constants) | `src/domain/colregs/classify-encounter.fixtures.ts` | exact (naming/export convention, inline-derivation-comment style) |
| `app/page.tsx` | route/page (Server Component) | request-response (SSR page composition) | itself (current 5-line version) | exact — trivial modification, no better analog needed |
| `app/globals.css` | config (design tokens / global styles) | — | itself (`@theme` block + `@layer base` `html`/`scroll-padding-top`) | exact — additive edit to an existing, already-understood file |
| `src/components/hero/hero-preview-fixture.test.ts` | test (plain Vitest, no DOM) | transform (assert fixed input → fixed output) | `src/domain/colregs/classify-encounter.test.ts` | exact (plain `describe`/`it`/`expect` against a `Result<T>`-returning domain function, no jsdom) |
| `src/components/hero/Hero.test.tsx` | test (RTL component test) | request-response (render + query DOM assertions) | `src/components/sandbox/environment.smoke.test.tsx` (trivial render+assert shape) + `src/components/sandbox/ControlPanel.test.tsx` (jsdom pragma / `afterEach(cleanup)` boilerplate) | role-match — no existing test renders a fully static, prop-less component; smoke test is the closest "just render and query" shape |

## Pattern Assignments

### `src/components/hero/Hero.tsx` (component, transform)

**Primary analog:** `src/components/layout/Header.tsx` (plain Server Component + CTA composition)
**Secondary analog:** `src/components/sandbox/ReasoningPanel.tsx` (deriving display text from a `ClassificationResult`)
**Data source analog:** `src/components/sandbox/SandboxContainer.tsx` lines 54-69 (calling `classifyEncounter()` against a fixture and unwrapping the `Result` at a "known-good, not user-editable" call site)

**No "use client" directive pattern** (`src/components/layout/Header.tsx` lines 1-20):
```typescript
/**
 * Header (06-01) -- sticky page-shell chrome wired into app/layout.tsx.
 * Plain Server Component (no "use client" -- no state/event handlers),
 * matching this repo's existing default (app/gallery/page.tsx is already
 * an async Server Component with no client directive).
 */
import { Compass, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
```
Hero.tsx must follow this exact convention: a leading doc comment stating it is a plain Server Component (no `"use client"`), then `import { Button } from "@/components/ui/button"` using the `@/` alias (not a relative path) for `ui/*` primitives — this is the established alias-vs-relative split in this codebase (see Shared Patterns below).

**CTA composition pattern** (`src/components/layout/Header.tsx` lines 37-46, and RESEARCH.md's Code Examples section which already transcribes this for Hero):
```tsx
<Button asChild variant="outline" size="sm">
  <a
    href="https://github.com/MarouenAbdi/colregs-navigator"
    target="_blank"
    rel="noreferrer"
  >
    <Code2 className="h-4 w-4" aria-hidden="true" />
    Source
  </a>
</Button>
```
Both Hero CTAs copy this `Button asChild` + plain `<a href="#...">` shape exactly (per CONTEXT.md D-05/D-06 and RESEARCH.md Pitfall H2) — no `next/link`, same-page fragment anchors only, matching `Header.tsx`'s own `href="#sandbox"` / `href="#gallery"` nav links at lines 34-35.

**Domain call + Result-unwrap pattern** (`src/components/sandbox/SandboxContainer.tsx` lines 54-69):
```typescript
// Lazy initializer: the ONE place in this file that unwraps a
// classifyEncounter() Result's `.value` without a preceding `.ok`
// check. Safe specifically because the seed vessels come from either
// the known-good, already-tested, doubt-free default fixture...
const [lastGoodClassification, setLastGoodClassification] = useState<ClassificationResult>(
  () => {
    const initialResult = classifyEncounter(seedA, seedB) as {
      ok: true;
      value: ClassificationResult;
    };
    return initialResult.value;
  },
);
```
Hero.tsx's own skeleton (already drafted in RESEARCH.md's Code Examples, verified against this repo's `Result<T>` shape in `src/domain/shared/result.ts`) follows the same "fixed fixture is known-good" reasoning but expressed as an explicit `if (!result.ok) throw new Error(...)` guard rather than an unchecked cast — this is the UI-SPEC-locked "Error state" contract (07-UI-SPEC.md Copywriting Contract table: "developer-facing invariant failure, not a runtime error state to design for").

**Readout-derivation pattern (label text from classification, not hand-typed)** (`src/components/sandbox/ReasoningPanel.tsx` lines 81-96):
```typescript
function verdictBannerText(classification: ReasoningPanelProps["classification"]): string {
  const encounterTitle = ENCOUNTER_TYPE_TITLE[classification.encounterType];
  const verdictClause =
    classification.giveWay === null && classification.standOn === null
      ? "mutual obligation"
      : `${VESSEL_LABEL_TEXT[classification.giveWay as string]} gives way`;
  return `${encounterTitle} — ${verdictClause}`;
}
```
and role-badge-text lookup (lines 29-33):
```typescript
const ROLE_BADGE: Record<"give-way" | "stand-on" | "mutual", { text: string; className: string }> = {
  "give-way": { text: "GW", className: "text-red-500" },
  "stand-on": { text: "SO", className: "text-green-500" },
  mutual: { text: "MUTUAL", className: "text-slate-400" },
};
```
Hero.tsx must derive "GW"/"SO" badge **text** the same way — from `classification.giveWay`/`classification.standOn` — per CONTEXT.md/RESEARCH.md Pattern 3 and UI-SPEC's Color section: *"The 'GW'/'SO' label text must be derived from `classification.giveWay`/`classification.standOn` (not hand-typed)... the colors may stay hardcoded since the fixture's verdict... is fixed at authoring time."* **Do not** import `ReasoningPanel.tsx`, `getVesselRole()`, or `vessel-role.ts` directly (feature-boundary violation, `sandbox/` is off-limits to `hero/` per ARCHITECTURE.md's dependency rules) — only copy the *shape* of this derive-from-result pattern, reimplemented locally.

**Coordinate-projection pattern (pure, zero DOM)** (`src/domain/geometry/screen-convert.ts` lines 44-74, `chartToScreen()`):
```typescript
export function chartToScreen(
  position: Position,
  containerSize: ContainerSize,
  viewBox: ChartViewBox,
): { screenX: number; screenY: number } {
  // ...
  const scaleX = containerSize.width / viewBox.width;
  const scaleY = containerSize.height / viewBox.height;
  const screenX = (position.x - viewBox.minX) * scaleX;
  const screenY = containerSize.height - (position.y - viewBox.minY) * scaleY;
  return { screenX, screenY };
}
```
Call this **once per vessel, synchronously, at render time** (no `useEffect`/`ResizeObserver`, unlike `ChartPanel.tsx`) against a **fixed** `HERO_CONTAINER_SIZE`/`HERO_VIEW_BOX` constant pair — RESEARCH.md's Pattern 1 and Code Examples section already spell out the exact constants to start from (tune to the UI-SPEC's corrected 8:5 aspect ratio, not the research doc's placeholder square).

**SVG structural conventions to imitate (NOT to import)** (`src/components/sandbox/ChartPanel.tsx`):
- Triangle hull via `<polygon points="...">` with a `HULL_POINTS` constant string (lines 61-64, 194-201)
- Named color constants declared as top-of-file `const X_STROKE = "#hex"; // tailwind-color-name` comments (lines 38-44, 77-79) — Hero must do the same for its own domain-locked hex values (`#EF4444` give-way, `#22C55E` stand-on, `#475569` bearing line — see UI-SPEC Color section), as inline hardcoded values per the locked "do NOT import vessel-role.ts" contract (D-03/Pattern 3)
- `<text textAnchor="middle">` for badge/label text (lines 202-209)
- **Hard constraint (D-03, CONTEXT.md + RESEARCH.md Pitfall 1):** Hero's mini-chart SVG must share **zero imports** with `ChartPanel.tsx` — no `VesselGroup`, no `wedgePath`, no `HULL_FILL_CLASS`, no `getVesselRole`. Build an independent, static (non-interactive, no `onPointerDown` handlers, no drag hooks) SVG from scratch, reusing only the pure `chartToScreen()` domain function and the *visual conventions* (polygon triangles, named stroke/fill constants, `textAnchor="middle"` labels) shown above.

---

### `src/components/hero/hero-preview-fixture.ts` (fixture/config module)

**Analog:** `src/domain/colregs/classify-encounter.fixtures.ts`

**Imports pattern** (lines 1-16):
```typescript
/**
 * Hand-derived fixtures for `classifyEncounter()` ... -- the
 * auditable proof-of-correctness suite CONTEXT.md calls for. Each fixture
 * documents the worked `relativeBearing()`/`cpa()` derivation behind its
 * expected values inline...
 */
import type { Vessel } from "../vessel/vessel.js";
```
Hero's fixture file is one directory level deeper (`src/components/hero/`), so its relative import must be `"../../domain/vessel/vessel.js"` (matching RESEARCH.md's already-verified Code Examples section) — same `.js`-suffixed relative-import convention (NodeNext-style, still required under this repo's `bundler` moduleResolution per `tsconfig.json`'s own comment block), not the `@/` alias (alias is reserved for `ui/*`/shadcn-adjacent code per `06-PATTERNS.md` Pattern 1, referenced in `tsconfig.json` lines 47-52).

**Per-fixture derivation-comment pattern** (e.g. lines 36-41):
```typescript
// vesselA is being overtaken (heading 000, speed 8); vesselB approaches
// from 150 deg relative bearing (well abaft A's beam, |150| > 112.5) at a
// higher speed (15kn), same geometry shape as Phase 1's overtakingCase
// scaled to 1/10 magnitude so DCPA falls under the 1.0nm threshold.
// relativeBearing(A,B) = 150. cpa(A,B): tcpaMinutes ~= 7.42, dcpaNm ~= 0.5
// (under threshold -> risk of collision holds).
export const overtakingBothDirectionsCase: ClassificationCase = {
  vesselA: { position: { x: 0, y: 0 }, heading: 0, speed: 8, type: "power-driven" },
  vesselB: { position: { x: 0.5, y: -0.8660254 }, heading: 0, speed: 15, type: "power-driven" },
  expectedEncounterType: "overtaking",
  ...
};
```
Hero's fixture must carry the same style of "how these numbers were derived, not hand-typed" comment — RESEARCH.md's Code Examples section already provides the exact verified comment block and values (`heroPreviewVesselA`/`heroPreviewVesselB`, reproducing RANGE 2.99 NM / BEARING 061° / CPA 1.18 NM / Rule 15 crossing / Vessel A gives way) — copy that block verbatim as the starting point, since D-07 locks these exact values as "not re-derivable by planning" (07-UI-SPEC.md Executor Notes).

**Vessel shape** — no schema validation needed in the fixture itself (matches the analog: fixtures are plain object literals typed against `Vessel`, validated only at the domain-function boundary, not at fixture-authoring time).

---

### `app/page.tsx` (route, request-response)

**Analog:** itself (current file, full contents already read)

**Current state** (`app/page.tsx`, full file):
```tsx
import { SandboxContainer } from "../src/components/sandbox/SandboxContainer.js";

export default function Home() {
  return <SandboxContainer />;
}
```

**Target shape** (per RESEARCH.md Architecture Patterns diagram + Pitfall H1 + UI-SPEC Executor Notes "Anchor/scroll wiring"):
```tsx
import { Hero } from "../src/components/hero/Hero.js";
import { SandboxContainer } from "../src/components/sandbox/SandboxContainer.js";

export default function Home() {
  return (
    <>
      <Hero />
      <section id="sandbox">
        <SandboxContainer />
      </section>
    </>
  );
}
```
Same relative `.js`-suffixed import convention as the existing `SandboxContainer` import (not `@/` alias — `app/page.tsx` is not shadcn-adjacent code). **Do not** add `id="sandbox"` inside `SandboxContainer.tsx` itself — Pitfall H1 documents that its root is already a stray nested `<main>`; the id must land on a **new wrapper** in `app/page.tsx` only (`<section id="sandbox">` or `<div id="sandbox">`, per UI-SPEC's own suggested snippet).

---

### `app/globals.css` (config, additive edit)

**Analog:** itself — the existing `@layer base` `html` block (lines 136-142) and `@theme inline` block (lines 7-49)

**Existing scroll-padding pattern to extend** (lines 136-142):
```css
@layer base {
  html {
    @apply font-sans;
    /* CONTEXT.md D-06: sticky Header height (64px per UI-SPEC.md Spacing
       Scale) -- ensures #sandbox/#gallery anchor targets never land
       underneath the sticky Header. */
    scroll-padding-top: 64px;
    }
}
```
Add `scroll-behavior: smooth` to this same `html` rule (D-05) — same file, same selector, same comment-attribution style (`/* CONTEXT.md D-05: ... */`) referencing the deciding doc/decision-ID, matching the existing `D-06` comment immediately above it. Per RESEARCH.md's "Don't Hand-Roll" table, prefer wrapping in `@media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } }` for accessibility, still inside `@layer base`.

**Custom breakpoint token pattern** (extends the existing `@theme inline` block, lines 7-49 — note: existing tokens are declared inside `@theme inline`, not a bare `@theme` block): register `--breakpoint-hero: 900px;` (RESEARCH.md Pattern 4) inside this same `@theme inline` block, following the existing `--radius-*`/`--color-*` token declaration style (one `--token-name: value;` per line, no extra grouping comment needed beyond a short inline note). Verify `max-hero:`/`hero:` variant generation before relying on it (Pitfall H3) — fall back to `min-[900px]:`/`max-[899px]:` arbitrary-value utilities directly in Hero.tsx's JSX if the named variant doesn't compile as expected.

---

### `src/components/hero/hero-preview-fixture.test.ts` (test, plain Vitest)

**Analog:** `src/domain/colregs/classify-encounter.test.ts`

**Imports + structure pattern** (lines 1-32):
```typescript
import { describe, expect, it } from "vitest";
import { classifyEncounter } from "./classify-encounter.js";
import {
  crossingResidualBasicCase,
  // ...
} from "./classify-encounter.fixtures.js";

describe("classifyEncounter() overtaking direction (Rule 13)", () => {
  it("classifies vesselB as overtaking vesselA when the bearing from A to B is more than 112.5 deg", () => {
    const result = classifyEncounter(
      overtakingBothDirectionsCase.vesselA,
      overtakingBothDirectionsCase.vesselB,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.encounterType).toBe(overtakingBothDirectionsCase.expectedEncounterType);
      expect(result.value.giveWay).toBe(overtakingBothDirectionsCase.expectedGiveWay);
      expect(result.value.standOn).toBe(overtakingBothDirectionsCase.expectedStandOn);
      expect(result.value.doubt).toBe(overtakingBothDirectionsCase.expectedDoubt);
    }
  });
});
```
Hero's fixture-drift test (HERO-02, RESEARCH.md Validation Architecture) copies this exact `Result.ok` narrowing shape: `import { classifyEncounter } from "../../domain/colregs/classify-encounter.js"`, call it against `heroPreviewVesselA`/`heroPreviewVesselB` from the sibling fixture file, and assert `result.value.encounterType === "crossing"`, `result.value.giveWay === "vesselA"`, `result.value.standOn === "vesselB"`, plus the readout numbers (`bearing()`/`cpa()` called directly, asserting `range` via `Math.hypot`, `bearing` ≈ 61.0, `cpa().dcpaNm` ≈ 1.18 — the exact values RESEARCH.md's Code Examples section documents). **No jsdom pragma needed** — this is a plain Node-environment test (matches `vitest.config.ts`'s `environment: "node"` default), same as its analog.

---

### `src/components/hero/Hero.test.tsx` (test, RTL/jsdom)

**Primary analog:** `src/components/sandbox/environment.smoke.test.tsx` (trivial render+query shape — closest match to a fully static, prop-less component)
**Boilerplate analog:** `src/components/sandbox/ControlPanel.test.tsx` lines 1-20 (jsdom pragma + `afterEach(cleanup)` requirement)

**jsdom pragma + cleanup boilerplate** (`ControlPanel.test.tsx` lines 1-20):
```typescript
// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
// ...
// Rule 3 (blocking): `vitest.config.ts` sets `globals: false` (project-wide,
// per CLAUDE.md's "no magic" persona), so `@testing-library/react`'s
// automatic afterEach-cleanup detection ... never registers. Without this,
// each `it` block's `render()` leaves its previous tree mounted...
afterEach(() => {
  cleanup();
});
```
Every `.test.tsx` file in this repo needs this exact `// @vitest-environment jsdom` pragma (line 1, must be the literal first line) plus the explicit `afterEach(cleanup)` call — `vitest.config.ts` runs with `globals: false`, so RTL's automatic cleanup never registers. Hero.test.tsx must copy this boilerplate verbatim.

**Trivial render+assert shape** (`environment.smoke.test.tsx`, full file):
```tsx
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("RTL/jsdom environment", () => {
  it("renders a component and finds it by text", () => {
    render(<div>Hello</div>);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
```
Hero.test.tsx follows this same "render with no props, query by role/text" shape (Hero.tsx takes no props — it's fully static per RESEARCH.md Pattern 2), per RESEARCH.md's Phase Requirements → Test Map:
```tsx
render(<Hero />);
expect(screen.getByRole("heading", { name: /two vessels/i })).toBeInTheDocument();
expect(screen.getByRole("link", { name: /open the sandbox/i })).toHaveAttribute("href", "#sandbox");
expect(screen.getByRole("link", { name: /classic encounters/i })).toHaveAttribute("href", "#gallery");
```
No controlled-harness wrapper needed (unlike `ControlPanel.test.tsx`'s `ControlledHarness` — that pattern exists only because `ControlPanel` is a controlled input component; Hero has no props/state at all).

---

## Shared Patterns

### Plain Server Component (no "use client")
**Source:** `src/components/layout/Header.tsx` lines 1-6, `src/components/layout/Footer.tsx` lines 1-5
**Apply to:** `Hero.tsx` only (not the test files, not the fixture module)
```typescript
/**
 * Header (06-01) -- sticky page-shell chrome wired into app/layout.tsx.
 * Plain Server Component (no "use client" -- no state/event handlers)...
 */
```
Both existing layout components establish "no `"use client"` unless the file has state/event handlers" as the repo default. Hero.tsx has neither (RESEARCH.md Pattern 2: `classifyEncounter()` is synchronous/pure, no hooks) — it must NOT declare `"use client"`.

### Import-path convention split: `@/` alias for `ui/*`, relative `.js` for everything else
**Source:** `src/components/layout/Header.tsx` line 17 (`import { Button } from "@/components/ui/button";`) vs. `src/components/sandbox/SandboxContainer.tsx` lines 16-27 (`import { classifyEncounter } from "../../domain/colregs/classify-encounter.js";`), confirmed by `tsconfig.json`'s own comment ("scoped to new shadcn-adjacent code only per 06-PATTERNS.md Pattern 1... coexists with the existing relative `.js`-suffixed imports")
**Apply to:** All new Hero files
- `Hero.tsx`: `@/components/ui/button` / `@/components/ui/card` / `@/components/ui/badge` (once installed) for shadcn primitives; relative `../../domain/colregs/classify-encounter.js`, `../../domain/geometry/screen-convert.js` for domain calls; relative `./hero-preview-fixture.js` for the sibling fixture module.
- `hero-preview-fixture.ts`: relative `../../domain/vessel/vessel.js` only (no UI imports).

### `Result<T>` narrowing before use
**Source:** `src/domain/shared/result.ts` lines 18-24 (`{ ok: true; value: T } | { ok: false; reason; details? }`), consumed via `if (result.ok) { ... }` throughout `classify-encounter.test.ts` and via the lazy-initializer cast in `SandboxContainer.tsx` lines 61-69
**Apply to:** `Hero.tsx`, `hero-preview-fixture.test.ts`
Never destructure `.value` off a `classifyEncounter()`/`bearing()`/`cpa()` return without first checking `.ok` — Hero.tsx should `throw new Error(...)` in the `!ok` branch (developer-facing invariant, per UI-SPEC's Error-state contract), not silently cast like `SandboxContainer.tsx`'s lazy initializer does (that shortcut is acceptable there only because it's inside a `useState` initializer already documented as an accepted exception).

### shadcn primitive installation (no new npm packages)
**Source:** `components.json` (already present, `style: "radix-nova"`, `baseColor: "neutral"`), `src/components/ui/button.tsx` (only existing installed primitive)
**Apply to:** `Hero.tsx`'s dependencies
```bash
npx shadcn add card badge
```
Follows the exact same CLI invocation shape Phase 6 already used for `button` — no `--base`/`--registry` flags needed, generates `src/components/ui/card.tsx` and `src/components/ui/badge.tsx` in the same location/style as the existing `button.tsx`.

### Doc-comment attribution style
**Source:** every existing component file (`Header.tsx` lines 1-15, `Footer.tsx` lines 1-5, `SandboxContainer.tsx` lines 1-12, `ChartPanel.tsx` lines 1-16, `ReasoningPanel.tsx` lines 1-12)
**Apply to:** All new Hero files
Every component/module in this repo opens with a `/** ... */` doc comment naming the plan/phase ID, summarizing responsibility, and (where relevant) documenting a specific deviation or non-obvious decision with its originating decision ID (e.g. "CONTEXT.md D-06", "Rule 3 (blocking)"). Hero.tsx, hero-preview-fixture.ts, and both test files should follow this convention, citing the relevant CONTEXT.md D-0x/UI-SPEC decision IDs from this phase.

## No Analog Found

None. Every file this phase creates or modifies has at least a role-match analog already in the codebase; no file requires falling back to RESEARCH.md's Code Examples as a first resort (though RESEARCH.md's fixture values and Hero.tsx skeleton remain the authoritative source for the exact numbers/shape per D-07's "not re-derivable by planning" lock).

## Metadata

**Analog search scope:** `src/components/layout/`, `src/components/sandbox/`, `src/components/ui/`, `src/domain/colregs/`, `src/domain/geometry/`, `src/domain/vessel/`, `src/domain/shared/`, `app/` (root), `tsconfig.json`, `components.json`, `vitest.config.ts`
**Files scanned:** 19 (Header.tsx, Footer.tsx, SandboxContainer.tsx, SandboxContainer.test.tsx [listed, not read], ChartPanel.tsx, ControlPanel.test.tsx, ReasoningPanel.tsx, environment.smoke.test.tsx, button.tsx, classify-encounter.ts, classify-encounter.fixtures.ts, classify-encounter.test.ts, types.ts, cpa.ts, bearing.ts, screen-convert.ts, vessel.ts, result.ts, app/page.tsx, app/globals.css, tsconfig.json, components.json, vitest.config.ts)
**Pattern extraction date:** 2026-07-18

---
*Patterns for: Phase 7 (Hero), COLREGS Navigator v1.1 UI Redesign milestone*
