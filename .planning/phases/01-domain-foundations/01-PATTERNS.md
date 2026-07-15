# Phase 1: Domain Foundations - Pattern Map

**Mapped:** 2026-07-14
**Files analyzed:** 19 (new)
**Analogs found:** 0 / 19

## Greenfield Confirmation

This repository has **no existing source code**. Verified directly:

```
$ find . -maxdepth 3 -type d -not -path "./.git*" -not -path "./.planning*" -not -path "./.claude*"
.
$ find . -not -path "./.git/*" -not -path "./.planning/*" -not -path "./.claude/*" -not -path "./node_modules/*" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" \)
(no results)
$ cat package.json
no package.json
```

There is no `src/` directory, no `package.json`, no prior phase, and no `.planning/codebase/` map. Phase 1 is the first code the project will contain. **Every file below has zero in-repo analog.** This is expected and correct for a Phase 1 pattern map on a greenfield project — do not treat the empty "Analogs found" count as an error.

Because there is nothing to copy from in the codebase, the planner's pattern source for this phase is `01-RESEARCH.md`'s "Architecture Patterns" section (Patterns 1-3 and the Code Examples section), which contains Context7-verified, version-exact API shapes for Zod 4.4.3 and Vitest 4.1.10 — cited below verbatim with line references into RESEARCH.md rather than into nonexistent source files. Treat the RESEARCH.md excerpts as the "analog" substitute for this phase only; from Phase 2 onward, real in-repo files (this phase's own output) become the analogs.

## File Classification

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|-----------------|---------------|
| `src/domain/shared/result.ts` | utility | transform | none (greenfield) | no analog |
| `src/domain/shared/result.test.ts` | test | transform | none (greenfield) | no analog |
| `src/domain/vessel/vessel.ts` | model | CRUD (construction/validation) | none (greenfield) | no analog |
| `src/domain/vessel/vessel.test.ts` | test | CRUD (construction/validation) | none (greenfield) | no analog |
| `src/domain/geometry/bearing.ts` | utility | transform | none (greenfield) | no analog |
| `src/domain/geometry/bearing.fixtures.ts` | test (fixture) | transform | none (greenfield) | no analog |
| `src/domain/geometry/bearing.test.ts` | test | transform | none (greenfield) | no analog |
| `src/domain/geometry/relative-bearing.ts` | utility | transform | none (greenfield) | no analog |
| `src/domain/geometry/relative-bearing.fixtures.ts` | test (fixture) | transform | none (greenfield) | no analog |
| `src/domain/geometry/relative-bearing.test.ts` | test | transform | none (greenfield) | no analog |
| `src/domain/geometry/cpa.ts` | utility | transform | none (greenfield) | no analog |
| `src/domain/geometry/cpa.fixtures.ts` | test (fixture) | transform | none (greenfield) | no analog |
| `src/domain/geometry/cpa.test.ts` | test | transform | none (greenfield) | no analog |
| `src/domain/geometry/angle-convert.ts` | utility | transform | none (greenfield) | no analog |
| `src/domain/geometry/angle-convert.fixtures.ts` | test (fixture) | transform | none (greenfield) | no analog |
| `src/domain/geometry/angle-convert.test.ts` | test | transform | none (greenfield) | no analog |
| `vitest.config.ts` | config | — | none (greenfield) | no analog |
| `package.json` | config | — | none (greenfield) | no analog |
| `tsconfig.json` | config | — | none (greenfield) | no analog |

**Note on `angle-convert.*`:** CONTEXT.md's `<domain>` boundary lists "compass/math/screen-space angle converters" as in-scope, but the locked decisions (D-01 through D-16) never elaborate a concrete converter beyond `bearing`/`relativeBearing`/`cpa`/`tcpa`. RESEARCH.md's recommended structure includes it as Claude's-discretion file naming. Flagging for the planner: confirm whether `angle-convert.ts` is a distinct deliverable in this phase or folded into `bearing.ts` — CLAUDE.md's `screenToChart()`/`chartToScreen()` mention is explicitly framed as driven by `ResizeObserver` (a later UI-phase input), so the *screen-space* half of this file may be premature in Phase 1. Domain-internal angle conversions (e.g., normalizing degrees, compass-vs-math convention) are in scope now; DOM-adjacent screen-space conversion is not required until the UI phase actually needs it.

## Pattern Assignments

Since no in-repo analog exists, each assignment below cites the RESEARCH.md-sourced, library-verified pattern the planner should treat as the template. All code excerpts are copied verbatim from `01-RESEARCH.md` (this worktree, same phase directory) with their original line numbers.

---

### `src/domain/shared/result.ts` (utility, transform)

**Source:** `01-RESEARCH.md` lines 205-229 ("Pattern 2: Shared `Result<T>` discriminated union with boolean discriminant")

```typescript
export type DegenerateCaseReason =
  | "coincident-position"   // D-07: bearing/relativeBearing when positions are identical
  | "no-closure";            // D-06: cpa/tcpa when relative velocity ~= 0 (parallel/matching course)
  // Claude's discretion (per CONTEXT.md) to add more reasons as needed.

export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; reason: DegenerateCaseReason; details?: Record<string, unknown> };

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function err<T>(reason: DegenerateCaseReason, details?: Record<string, unknown>): Result<T> {
  return { ok: false, reason, details };
}
```

**Exhaustiveness helper** (RESEARCH.md lines 230-244) — add once `DegenerateCaseReason` grows past 2 variants:

```typescript
function assertUnreachable(x: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(x)}`);
}
```

**Discriminant convention:** boolean `ok` field (not a string tag) — mirrors Zod's own `SafeParseReturnType` shape, gives full narrowing via plain `if (result.ok) {...} else {...}` with no `switch` needed at the top level.

---

### `src/domain/vessel/vessel.ts` (model, CRUD/construction+validation)

**Source:** `01-RESEARCH.md` lines 171-203 ("Pattern 1: Zod value object with reject-not-normalize numeric range validation")

```typescript
import * as z from "zod";

export const VesselTypeSchema = z.enum([
  "power-driven",
  "sailing",
  "fishing",
  "not-under-command",
  "restricted-in-ability-to-maneuver",
]); // D-12: kebab-case, 5 values

export const PositionSchema = z.object({
  x: z.number(), // nm, east-positive, unbounded plane (D-01, D-03)
  y: z.number(), // nm, north-positive, unbounded plane
});

export const VesselSchema = z.object({
  position: PositionSchema,
  heading: z.number().gte(0).lt(360), // D-10: rejects 360, -10 — does NOT normalize
  speed: z.number().gte(0),           // D-09: no upper ceiling, 0 is valid (anchored)
  type: VesselTypeSchema,
});

export type Vessel = z.infer<typeof VesselSchema>;
export type Position = z.infer<typeof PositionSchema>;
export type VesselType = z.infer<typeof VesselTypeSchema>;
```

**Validation pattern:** `.gte()`/`.lte()` inclusive, `.gt()`/`.lt()` exclusive — exact Zod 4 API, verified via Context7 `/websites/zod_dev_v4`. This maps directly onto the `[0, 360)` heading bound (D-10). Do NOT add a `.transform()` to wrap/normalize heading — that would silently violate D-10's reject-not-normalize requirement (see RESEARCH.md "Anti-Patterns to Avoid", line 285).

**No analog exists for `.test.ts` file structure either** — the planner should base `vessel.test.ts` on the `toBeCloseTo` / `describe`/`it`/`expect` shape shown in the "Core geometry test pattern" below, adapted to Zod's `.safeParse()`/`.parse()` assertions instead of `Result<T>` assertions (Zod schemas throw or return `{success, data|error}`, not this phase's own `Result<T>` — do not conflate the two: `VesselSchema.safeParse()` is Zod's own boundary contract, `Result<T>` is this phase's separate hand-rolled type for geometry function outputs).

---

### `src/domain/geometry/bearing.ts`, `relative-bearing.ts`, `cpa.ts` (utility, transform)

**Source:** `01-RESEARCH.md` lines 247-282 ("Pattern 3: CPA/TCPA vector math with hours-to-minutes conversion")

```typescript
function dot(a: Vector2, b: Vector2): number {
  return a.x * b.x + a.y * b.y;
}

// R = posB - posA, V = velB - velA (velocity derived from heading+speed per vessel)
const R: Vector2 = { x: posB.x - posA.x, y: posB.y - posA.y };
const V: Vector2 = { x: velB.x - velA.x, y: velB.y - velA.y };

const vDotV = dot(V, V);
if (Math.abs(vDotV) < EPSILON) {
  // D-06: parallel/matching course — no defined closest approach.
  return err("no-closure", { currentDistanceNm: Math.hypot(R.x, R.y) });
}

const tcpaHours = -dot(R, V) / vDotV;
const tcpaMinutes = tcpaHours * 60; // D-02: report in minutes
const posAtCpa: Vector2 = { x: R.x + V.x * tcpaHours, y: R.y + V.y * tcpaHours };
const dcpaNm = Math.hypot(posAtCpa.x, posAtCpa.y);

return ok({ tcpaMinutes, dcpaNm });
```

**Critical convention (bearing.ts specifically):** the locked formula is `atan2(dx, dy)`, NOT the JS-standard `atan2(dy, dx)`. RESEARCH.md "Common Pitfalls / Pitfall 1" (lines 303-307) flags this explicitly as the highest-risk implementation mistake in this phase — a due-east case (dx>0, dy=0) must return 90°, not 0°. Name intermediates `dx`/`dy` explicitly at the call site to make the swap visually auditable.

**Degenerate-input handling (all three geometry files):** every function returns the shared `Result<T>` from `src/domain/shared/result.ts` — never `null`/`NaN`/thrown errors for expected degenerate cases (D-05). `bearing()`/`relativeBearing()` return `err("coincident-position", ...)` when positions are identical (D-07); `cpa()`/`tcpa()` returns `err("no-closure", { currentDistanceNm })` when `V·V ≈ 0` (D-06, use an epsilon like `1e-9`, not exact-equality per RESEARCH.md Pitfall discussion).

**Unresolved decision the planner must make explicit (flagged by RESEARCH.md, not locked in CONTEXT.md):** negative TCPA (vessels already past closest approach) has no locked handling. RESEARCH.md's recommendation (Open Question 1, lines 404-409) is to return it as a normal `ok()` result with the raw signed value, consistent with D-04's "raw, unrounded" philosophy — but this needs a fixture-tested decision during planning, not silent adoption.

---

### `src/domain/geometry/*.fixtures.ts` (test fixture, transform)

**Source:** `01-RESEARCH.md` lines 369-385 ("Fixture-file co-location pattern (D-14)")

```typescript
// bearing.fixtures.ts — worked-trigonometry comments per D-13
import type { Position } from "../vessel/vessel";

export const dueEastCase: { a: Position; b: Position; expectedBearing: number } = {
  // A at origin, B 5nm due east: dx=5, dy=0 => atan2(5,0) = 90deg exactly.
  a: { x: 0, y: 0 },
  b: { x: 5, y: 0 },
  expectedBearing: 90,
};

export const coincidentPositionCase: { a: Position; b: Position } = {
  a: { x: 2, y: 3 },
  b: { x: 2, y: 3 }, // identical position => geometrically undefined bearing (D-07)
};
```

**Pattern:** every fixture case carries an inline comment showing the worked trigonometry (D-13 — hand-derived, auditable, not copied from an opaque calculator). Fixture files are co-located 1:1 with their function+test file (D-14): `bearing.ts` / `bearing.fixtures.ts` / `bearing.test.ts` all live in the same directory.

---

### `src/domain/geometry/*.test.ts`, `src/domain/shared/result.test.ts`, `src/domain/vessel/vessel.test.ts` (test, transform)

**Source:** `01-RESEARCH.md` lines 326-353 ("toBeCloseTo usage for angle/distance/time fixtures (D-15)")

```typescript
import { describe, expect, it } from "vitest";
import { bearing } from "./bearing";
import { dueEastCase, coincidentPositionCase } from "./bearing.fixtures";

describe("bearing", () => {
  it("returns 90 for a point due east", () => {
    const result = bearing(dueEastCase.a, dueEastCase.b);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBeCloseTo(90, 2); // D-15: 2-digit tolerance
    }
  });

  it("flags coincident positions instead of returning 0", () => {
    const result = bearing(coincidentPositionCase.a, coincidentPositionCase.b);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("coincident-position"); // D-07
    }
  });
});
```

**Convention:** explicit `describe`/`it`/`expect` imports (no Vitest globals — matches `globals: false` in the recommended `vitest.config.ts` and CLAUDE.md's "no magic" persona). Always narrow on `result.ok` before asserting the success/failure-specific field. Always pass `2` explicitly to `toBeCloseTo` even though it's the default, per D-15's auditability requirement.

---

### `vitest.config.ts` (config)

**Source:** `01-RESEARCH.md` lines 355-367

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node", // default; explicit here since Success Criterion 3 depends on it
    include: ["src/**/*.test.ts"],
    globals: false, // explicit describe/it/expect imports — matches CLAUDE.md's "no magic" persona
  },
});
```

**Do not** switch to `environment: 'jsdom'` for this phase — Success Criterion 3 requires the domain layer (including any angle converters) to have zero DOM dependency, and `jsdom` doesn't implement `getScreenCTM()`/`getBBox()` anyway (CLAUDE.md, RESEARCH.md Pitfall 4).

---

### `package.json`, `tsconfig.json` (config)

No RESEARCH.md code excerpt exists for these (they weren't shown as full examples) — planner should use the "Installation" block from RESEARCH.md (lines 94-98):

```bash
npm install zod
npm install -D typescript vitest
```

Locked exact versions per RESEARCH.md's Standard Stack table: `zod@4.4.3`, `typescript@7.0.2`, `vitest@4.1.10`. No other dependencies belong in this phase (`@testing-library/react`, `zustand`, `nanoid` are explicitly out of scope — later phases).

## Shared Patterns

### Result<T> discriminated union
**Source:** `01-RESEARCH.md` lines 205-229 (excerpted above under `result.ts`)
**Apply to:** `bearing.ts`, `relative-bearing.ts`, `cpa.ts` — every function that can hit a degenerate geometric case. This is the single most important cross-cutting pattern in this phase; CONTEXT.md D-05 is explicit that all three functions must reuse the *same* union type, not per-function ad-hoc shapes.

### Reject-not-normalize numeric validation
**Source:** `01-RESEARCH.md` lines 192-197 (excerpted above under `vessel.ts`)
**Apply to:** `vessel.ts` only in this phase (heading, speed fields). If a future phase adds more Zod-validated domain values, this same `.gte()/.lt()` reject convention should be reused rather than introducing `.transform()`-based coercion, per D-10's rationale.

### atan2 argument-order discipline
**Source:** `01-RESEARCH.md` lines 303-307 (Pitfall 1)
**Apply to:** `bearing.ts` and any function it composes into (`relative-bearing.ts` calls `bearing.ts`'s output, per its own name). Name intermediates explicitly and include at least one 90°-sensitive fixture per function that calls `atan2`.

### toBeCloseTo(_, 2) numeric fixture tolerance
**Source:** `01-RESEARCH.md` lines 328-353 (excerpted above)
**Apply to:** every `*.test.ts` file asserting a numeric angle, distance, or time value (D-15). Do not use exact `toBe()` equality on any floating-point geometry output.

## No Analog Found

All 19 files have no in-repo analog, for the single shared reason stated at the top of this document (greenfield repository, Phase 1 is the first code). Restating per the required template section:

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/domain/shared/result.ts` | utility | transform | Greenfield — no prior domain code exists |
| `src/domain/shared/result.test.ts` | test | transform | Greenfield — no prior test suite exists |
| `src/domain/vessel/vessel.ts` | model | CRUD | Greenfield — no prior Zod schemas exist |
| `src/domain/vessel/vessel.test.ts` | test | CRUD | Greenfield — no prior test suite exists |
| `src/domain/geometry/bearing.ts` | utility | transform | Greenfield — no prior geometry code exists |
| `src/domain/geometry/bearing.fixtures.ts` | test fixture | transform | Greenfield — no prior fixture files exist |
| `src/domain/geometry/bearing.test.ts` | test | transform | Greenfield — no prior test suite exists |
| `src/domain/geometry/relative-bearing.ts` | utility | transform | Greenfield |
| `src/domain/geometry/relative-bearing.fixtures.ts` | test fixture | transform | Greenfield |
| `src/domain/geometry/relative-bearing.test.ts` | test | transform | Greenfield |
| `src/domain/geometry/cpa.ts` | utility | transform | Greenfield |
| `src/domain/geometry/cpa.fixtures.ts` | test fixture | transform | Greenfield |
| `src/domain/geometry/cpa.test.ts` | test | transform | Greenfield |
| `src/domain/geometry/angle-convert.ts` | utility | transform | Greenfield; also see scope-ambiguity note above (may not be needed this phase) |
| `src/domain/geometry/angle-convert.fixtures.ts` | test fixture | transform | Greenfield |
| `src/domain/geometry/angle-convert.test.ts` | test | transform | Greenfield |
| `vitest.config.ts` | config | — | Greenfield — no prior build/test config exists |
| `package.json` | config | — | Greenfield — no prior manifest exists |
| `tsconfig.json` | config | — | Greenfield — no prior TS config exists |

**For all files above, the planner should treat the "Pattern Assignments" section's RESEARCH.md excerpts as the template of record, since no codebase analog is possible in Phase 1.**

## Metadata

**Analog search scope:** Entire working tree (`find . -not -path "./.git/*" -not -path "./.planning/*" -not -path "./.claude/*"`), confirmed empty of any `.ts`/`.tsx`/`.js` files and no `package.json`.
**Files scanned:** 0 (none exist)
**Pattern extraction date:** 2026-07-14
**Substitute pattern source:** `.planning/phases/01-domain-foundations/01-RESEARCH.md` (Architecture Patterns section, Patterns 1-3, and Code Examples section) — Context7-verified against `zod@4.4.3` and `vitest@4.1.10`.
