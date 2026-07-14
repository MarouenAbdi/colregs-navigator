# Phase 1: Domain Foundations - Research

**Researched:** 2026-07-14
**Domain:** Pure TypeScript domain modeling (Zod value objects) + hand-rolled 2D navigation trigonometry (bearing/CPA/TCPA), Vitest fixture-based testing
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
## Implementation Decisions

### Units & Coordinate System
- **D-01:** Position in nautical miles (nm) from an arbitrary chart origin; speed in knots.
- **D-02:** TCPA (time to closest point of approach) is reported in **minutes**, not raw hours, so typical few-minute encounters don't produce awkward fractional-hour values.
- **D-03:** Axis convention: `x` = east, `y` = north — matches the `bearing() = atan2(dx, dy)` formula already locked in CLAUDE.md. The plane is **unbounded** — no artificial position-range validation in the domain layer; viewport clamping (if any) is a later UI concern.
- **D-04:** Bearing and relative-bearing functions return **raw, unrounded floating-point degrees**. Rounding for display is a presentation concern for a later phase, and fixtures compare with a tolerance, not exact equality.

### Degenerate-Input Handling
- **D-05:** All geometry functions share **one common `Result<T>` discriminated union** (e.g. `{ ok: true, value: T } | { ok: false, reason: DegenerateCaseReason }`), reused across `bearing`, `relativeBearing`, and `cpa`/`tcpa`. Never null/NaN/silent defaults for a degenerate case.
- **D-06:** When relative velocity is ~zero (`V·V ≈ 0` — parallel/matching-course vessels), `cpa`/`tcpa` returns an explicit tagged "no defined closest approach" result carrying current distance, not `Infinity` and not a thrown error (this is an expected, common geometric state, not an exceptional one).
- **D-07:** When two vessels are at the exact same position (bearing is geometrically undefined), `bearing()`/`relativeBearing()` return the same tagged-result pattern (e.g. `kind: 'coincident-position'`) rather than silently returning 0° (which would misleadingly read as "due north").
- **D-08:** Angle normalization boundaries are locked per CLAUDE.md: true bearing ∈ **[0, 360)**, relative bearing ∈ **(-180, 180]**. Fixtures must explicitly test the boundary values (0°, 359.999°, -180°, 180°).

### Vessel Value-Object Validation
- **D-09:** `speed >= 0` is valid with **no upper ceiling**. Zero speed (anchored/dead-in-water) is a normal, meaningful vessel state — relevant to the "not under command" status used later in Rule 18. The domain layer doesn't need an opinion on what a "fast" vessel is.
- **D-10:** `heading` must already be in **[0, 360)** at construction — the Zod schema **rejects** out-of-range values (e.g. 360, -10) rather than normalizing them mod 360. Normalization is a geometry-module concern, not a validation concern.
- **D-11 (resolves a doc discrepancy):** The `VesselType` enum has **5 values**, not 4. ROADMAP.md's Phase 1 success criteria list "four vessel types," but REQUIREMENTS.md's DETM-02 explicitly names `not-under-command` as a status co-equal with, and distinct from, `restricted-in-ability-to-maneuver` (COLREGS Rule 3(f) vs 3(g) — two legally distinct statuses that sit at the same priority tier in Rule 18's hierarchy). Modeling both now avoids a breaking `VesselType` change during Phase 2.
  - **Follow-up for planning:** ROADMAP.md Phase 1, success criterion #1 should be corrected to say "five vessel types" (or explicitly list all five) to match this decision.
- **D-12:** `VesselType` literal values are **kebab-case**, matching COLREGS terminology verbatim: `'power-driven' | 'sailing' | 'fishing' | 'not-under-command' | 'restricted-in-ability-to-maneuver'`.

### Fixture Suite Sourcing & Structure
- **D-13:** Fixture cases are **hand-derived** from known COLREGS reference geometries and worked trigonometry (not copied from an opaque external calculator). Show the worked math in a comment/doc alongside each fixture so correctness is auditable.
- **D-14:** Fixtures are organized as **per-function files co-located with their tests** (e.g. `bearing.fixtures.ts` next to `bearing.test.ts`, `cpa.fixtures.ts` next to `cpa.test.ts`) — consistent with the flat `src/domain/` folder shape in CLAUDE.md.
- **D-15:** Floating-point fixture assertions use **`toBeCloseTo` with 2 decimal digits** (~0.01 tolerance) — tight enough to catch real trigonometry bugs, loose enough to avoid engine-level floating-point noise.
- **D-16:** The fixture suite includes **geometry-only fixtures for all 3 classic encounter shapes** (clean head-on, clean crossing, clean overtaking) even though classification itself is Phase 2's job — so Phase 2 can reuse these known-correct geometric facts as its starting inputs instead of re-deriving them. Also includes the reciprocal-heading-but-off-axis-bearing case named explicitly in ROADMAP.md's success criteria.

### Claude's Discretion
- Exact module/file layout within `src/domain/` beyond the fixture co-location rule (D-14) — follow the flat, pragmatic shape CLAUDE.md already specifies (geometry vs vessel vs shared types).
- Naming of the `DegenerateCaseReason` union members beyond the two named here (`no-closure`, `coincident-position`) — add more as needed during implementation, following the same tagged-result pattern.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within Phase 1 scope. No scope-creep suggestions came up during this discussion.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VESL-01 | User can set each vessel's position, heading, speed, and vessel type (power-driven, sailing, fishing, restricted-in-ability-to-maneuver — corrected to 5 types per CONTEXT.md D-11, adding `not-under-command`) for two vessels | `VesselSchema` (Zod) pattern in "Architecture Patterns / Pattern 1" models exactly these four fields with the 5-value kebab-case `VesselType` enum (D-12), reject-not-normalize heading validation (D-10), and no-ceiling speed validation (D-09) |
</phase_requirements>

## Summary

Phase 1 has no framework risk — it's a greenfield, dependency-free TypeScript module (`src/domain/`) validated with Zod and tested with Vitest. All the hard technical decisions (units, coordinate convention, degenerate-case handling, fixture organization) are already locked in `01-CONTEXT.md`. The research need here is narrow and mechanical: confirm the exact Zod 4.x API shapes for the validation rules CONTEXT.md specifies (reject-not-normalize heading, no speed ceiling, 5-value kebab-case enum), confirm the idiomatic shape of a hand-rolled `Result<T>` discriminated union and how TypeScript narrows on it, verify the CPA/TCPA hours-to-minutes conversion arithmetic, and confirm Vitest defaults (`environment: 'node'`, `toBeCloseTo` digit semantics) match what the fixture suite needs.

Two points surfaced during research that CONTEXT.md's decisions don't explicitly cover and should be flagged to the planner: (1) Zod 4 number range validation uses exclusive `.lt()`/`.gt()` alongside inclusive `.gte()`/`.lte()`, which maps directly onto the `[0, 360)` heading and `(-180, 180]` relative-bearing boundaries — this is a clean fit, not a gap. (2) TCPA can be **negative** (vessels already past their closest approach, now separating) — this is a distinct case from the `V·V ≈ 0` case D-06 covers, and CONTEXT.md's decisions don't say whether a negative TCPA should be clamped, tagged, or returned as-is. This needs an explicit choice during planning/implementation, matching Success Criterion 4's mandate that all degenerate inputs have defined, tested behavior.

**Primary recommendation:** Use `z.object` with per-field `.gte()/.lt()` numeric refinements and `z.enum()` for `VesselType`; define one shared `Result<T>` union type in a `src/domain/shared/` (or similar) module with `ok()`/`err()` factory helpers; implement bearing/relativeBearing/CPA as pure functions returning that `Result<T>`; convert TCPA from hours to minutes with a single `* 60` multiplier; run Vitest with default `environment: 'node'` (no jsdom needed — Success Criterion 3 explicitly requires no DOM dependency) and `toBeCloseTo(expected, 2)` for all angle/distance/time assertions per D-15.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Vessel value object (position, heading, speed, type) validation | Database / Storage tier's upstream contract — but physically lives in a framework-free **Domain** layer | — | Zod schema is the domain's own value-object boundary (per CLAUDE.md), not a persistence or API concern; it will later be reused as the tRPC input contract but that reuse is Phase 3's job, not this phase's |
| Bearing / relative-bearing calculation | Domain (pure function) | — | Stateless trigonometry, zero I/O, must run identically in browser and server per phase goal |
| CPA/TCPA calculation | Domain (pure function) | — | Same as above — pure vector math, no framework coupling |
| Angle unit conversion (compass/math/screen-space) | Domain (pure function) | — | Explicitly required to have "no DOM dependency" (Success Criterion 3); screen-space conversion driven by external `ResizeObserver` input (a later phase's concern), but the conversion function itself is pure and belongs in the domain |
| Degenerate-input signaling (`Result<T>`) | Domain (cross-cutting type) | — | Shared contract used only by domain functions in this phase; no API/UI consumer yet |

This phase has no Browser/Client, Frontend Server, API, or CDN tier work at all — it is 100% Domain tier, which matches the phase goal statement ("zero framework dependencies, runs in browser and server").

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `zod` | 4.4.3 | Runtime validation + domain value-object schema (`Vessel`, `Position`) | Locked by CLAUDE.md; doubles as domain value-object layer per project's explicit architecture decision |
| `typescript` | 7.0.2 | Static typing, `z.infer` type derivation, exhaustiveness checking | Locked by CLAUDE.md |
| `vitest` | 4.1.10 | Test runner for fixture-based unit tests | Locked by CLAUDE.md |

### Supporting
None required for this phase. `@testing-library/react`, `zustand`, and `nanoid` (listed in CLAUDE.md's Supporting Libraries) are for later phases (Phase 4 UI, Phase 3 persistence) and are out of scope here — Phase 1 has no React components and no persistence.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled `Result<T>` union | `neverthrow` (or similar `Result`/`Either` library) | CONTEXT.md D-05 explicitly locks a hand-rolled shared union — a library would add a dependency for a ~10-line type the project's own engineering persona ("justify every abstraction and dependency") would reject at this scale |
| Zod field-level `.refine()` | Zod `.superRefine()` for cross-field checks | Not needed in Phase 1 — `Vessel`'s validation rules (heading range, speed floor, type enum) are all single-field constraints; `.superRefine()` becomes relevant only if a future field depends on another field's value |

**Installation:**
```bash
npm install zod
npm install -D typescript vitest
```

**Version verification:** Verified live via `npm view <package> version` at research time — `zod@4.4.3`, `vitest@4.1.10`, `typescript@7.0.2` [VERIFIED: npm registry] — these exact versions match what CLAUDE.md already locked from prior tech-stack research, confirming no drift since that research was done.

## Package Legitimacy Audit

Phase 1 introduces no *new* packages beyond what CLAUDE.md's tech-stack research already vetted (`zod`, `vitest`, `typescript`). Re-ran the legitimacy gate anyway since this is the first phase to actually install them.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| `zod` | npm | ~5 yrs | very high (tens of millions/wk) | github.com/colinhacks/zod | OK | Approved |
| `typescript` | npm | ~13 yrs | very high | github.com/microsoft/TypeScript | OK | Approved |
| `vitest` | npm | ~4 yrs | high (millions/wk) | github.com/vitest-dev/vitest | **SUS** — flagged `TYPOSQUAT_RISK` ("suspiciously close to `vite`") | Flagged by heuristic, but treated as false positive — see below |

**slopcheck's `vitest` flag is a heuristic false positive, not a real risk signal.** `vitest` is Vite's own official first-party test runner (same GitHub org, `vitest-dev`, itself an offshoot of the Vite core team), independently confirmed via Context7 with a "High" source-reputation rating and a 87.87 benchmark score, and it is the test runner the project's own CLAUDE.md already locks by name and version. The name similarity to `vite` is intentional branding (both are Vite-ecosystem tools), not a typosquat. No checkpoint is warranted for this specific package, but the planner should note the false-positive pattern in case slopcheck is re-run later against other Vite-adjacent package names.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** `vitest` (heuristic false positive, justified above — no checkpoint needed)

## Architecture Patterns

### System Architecture Diagram

```
Zod schema definition
  (VesselSchema, PositionSchema — src/domain/vessel/)
        |
        v
  Vessel construction / parsing
  (VesselSchema.parse(input) — throws ZodError on invalid input,
   OR .safeParse(input) — returns {success, data|error})
        |
        v
  Geometry functions consume plain Vessel/Position values
  (bearing, relativeBearing, cpa/tcpa — src/domain/geometry/)
        |
        +--> normal case --> Result<T> = { ok: true, value }
        |
        +--> degenerate case --> Result<T> = { ok: false, reason: DegenerateCaseReason }
        |
        v
  Fixture-driven Vitest suite asserts on both branches
  (*.test.ts + co-located *.fixtures.ts, toBeCloseTo(_, 2) for numeric fields)
```

A reader can trace the primary use case end-to-end: raw position/heading/speed input → validated `Vessel` via Zod → pure geometry function → `Result<T>` (success value or tagged degenerate reason) → asserted by a fixture test. No I/O, no DOM, no network at any stage.

### Recommended Project Structure
```
src/
└── domain/
    ├── shared/
    │   ├── result.ts             # Result<T> union + ok()/err() factories
    │   └── result.test.ts        # exhaustiveness/narrowing sanity tests
    ├── vessel/
    │   ├── vessel.ts              # VesselSchema (Zod), Vessel = z.infer<typeof VesselSchema>, VesselType enum
    │   └── vessel.test.ts
    └── geometry/
        ├── bearing.ts
        ├── bearing.fixtures.ts
        ├── bearing.test.ts
        ├── relative-bearing.ts
        ├── relative-bearing.fixtures.ts
        ├── relative-bearing.test.ts
        ├── cpa.ts
        ├── cpa.fixtures.ts
        ├── cpa.test.ts
        ├── angle-convert.ts        # compass/math/screen-space converters
        ├── angle-convert.fixtures.ts
        └── angle-convert.test.ts
```
This matches CLAUDE.md's "flat and pragmatic" folder guidance and D-14's fixture co-location rule. Exact naming/grouping beyond fixture co-location is explicitly Claude's discretion per CONTEXT.md — the above is a recommendation, not a mandate.

### Pattern 1: Zod value object with reject-not-normalize numeric range validation
**What:** Model `heading` as a Zod number that fails validation outside `[0, 360)` rather than wrapping/normalizing it.
**When to use:** Any domain field where "out of range" is a caller bug, not a value to silently correct — matches D-10.
**Example:**
```typescript
// Source: Context7 /websites/zod_dev_v4 — z.number() gte/lt validators (Zod 4)
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
`z.number().gte(0).lt(360)` is the exact Zod 4 API for an inclusive-lower/exclusive-upper numeric range — `.gte()`/`.lte()` are inclusive, `.gt()`/`.lt()` are exclusive [VERIFIED: Context7 /websites/zod_dev_v4]. This is a precise fit for both the `[0, 360)` heading bound (D-10) and, symmetrically, could express `(-180, 180]` for relative bearing as `.gt(-180).lte(180)` if that value is ever wrapped in its own Zod schema (relative bearing itself is a `Result<number>` return value, not a constructed/validated object, per D-04/D-08 — Zod validates *inputs*, not the function's *output*).

### Pattern 2: Shared `Result<T>` discriminated union with boolean discriminant
**What:** One reusable success/failure union, discriminated on a boolean `ok` field (not a string tag), returned by every degenerate-input-prone geometry function.
**When to use:** Any pure function where failure is an expected, common outcome (not exceptional) — per D-05/D-06/D-07's explicit rejection of thrown errors/NaN/null for these cases.
**Example:**
```typescript
// Idiomatic TS discriminated union pattern — general TS knowledge, not library-specific.
// Boolean-discriminant Result is a common convention (mirrors Zod's own SafeParseReturnType shape).

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
**Consumer narrowing / exhaustiveness:** Because the discriminant is a boolean (`ok`), a simple `if (result.ok) { ... } else { ... }` gives full type narrowing on both branches — no `switch` or `assertUnreachable` helper is needed for the top-level `ok`/`not-ok` split. An `assertUnreachable`-style exhaustiveness helper *is* worth adding for the `reason` field once `DegenerateCaseReason` grows past a couple of variants, so that a `switch (result.reason)` in a future consumer (e.g. Phase 2's rules engine) fails to compile if a new reason is added without being handled:
```typescript
function assertUnreachable(x: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(x)}`);
}

// Example future consumer (Phase 2, shown for illustration only — not this phase's job):
function describeFailure(reason: DegenerateCaseReason): string {
  switch (reason) {
    case "coincident-position": return "Vessels are at the same position.";
    case "no-closure": return "Vessels are not closing (parallel/matching course).";
    default: return assertUnreachable(reason);
  }
}
```
This exhaustiveness pattern is standard TypeScript practice [CITED: multiple community sources cross-verified — fullstory.com/blog/discriminated-unions-and-exhaustiveness-checking-in-typescript, DEV Community "Mastering TypeScript's never Type"] — no single canonical source, but the `never`-typed `default` branch is the consistent convention across all sources checked.

### Pattern 3: CPA/TCPA vector math with hours-to-minutes conversion
**What:** Implement the locked CLAUDE.md formula, converting the naturally-hours-denominated `tcpa` to minutes per D-02.
**When to use:** The one `cpa()`/`tcpa()` function this phase must implement.
**Example:**
```typescript
// Formula source: CLAUDE.md (locked) + cross-verified against
// https://binnacleai.com/blog/cpa-tcpa-explained [CITED, MEDIUM confidence — single source,
// but consistent with standard relative-velocity vector math]
//
// Units: position in nm, speed in knots (nm/hour) — per D-01.
// R (nm) · V (nm/hr) has units nm²/hr; V · V (nm/hr)² has units nm²/hr².
// tcpa = -(R·V)/(V·V) => (nm²/hr) / (nm²/hr²) = hr.  <-- raw formula yields HOURS.
// D-02 requires MINUTES output => multiply by 60 as the final step.

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
**Precision pitfall confirmed via research:** a raw `V·V === 0` check is fragile against floating-point noise from `sin`/`cos`-derived velocity components; use a small epsilon threshold (e.g. `1e-9` or a domain-meaningful "knots" threshold) rather than exact equality, consistent with D-06's framing of this as "≈ zero," not "=== zero" [MEDIUM confidence — general floating-point-comparison practice, not phase-specific research; the exact epsilon value is Claude's discretion / a fixture-driven decision during implementation].

### Anti-Patterns to Avoid
- **Normalizing heading in the Zod schema:** D-10 explicitly requires *rejecting* out-of-range heading at construction, not normalizing mod 360. A `.transform()` that wraps the value would silently violate this decision.
- **Returning `Infinity`, `NaN`, or throwing for degenerate geometry cases:** D-05/D-06/D-07 explicitly forbid this — always return the tagged `Result<T>` failure branch.
- **Calling `Math.atan2(dy, dx)` instead of `Math.atan2(dx, dy)`:** `Math.atan2(y, x)` is the JS-standard math-convention argument order (angle from positive x-axis, counterclockwise). The locked bearing convention (`atan2(dx, dy)`, clockwise from north) *intentionally* swaps this — see Common Pitfalls below.
- **Using `jsdom` environment for these tests:** Success Criterion 3 requires the angle converters to have no DOM dependency; defaulting to `environment: 'node'` (Vitest's own default) both matches this requirement and is faster.

## Don't Hand-Rolled — N/A for this phase

Nothing in this phase should reach for an external library — CLAUDE.md already made and justified this exact call (hand-rolled geometry, hand-rolled `Result<T>`, plain Zod, no rules-engine/state-machine library). Restating for completeness since the template expects this section:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Runtime input validation | Custom manual `if`-chain validators | `zod` (already locked) | Already the project's locked choice; hand-written validation would duplicate what Zod gives for free with less type safety |
| Result/Either type | Custom ad-hoc `{success, error}` shapes re-invented per function | One shared `Result<T>` type (this phase's own small, hand-rolled union — not a library) | CONTEXT.md D-05 explicitly wants exactly one shared shape reused across all three geometry functions, to keep consumer code uniform |

**Key insight:** This phase is unusual in that the "don't hand-roll" instinct is inverted — the *math itself* (bearing/CPA formulas) is the one thing CLAUDE.md explicitly says TO hand-roll, because outsourcing it to `geolib`/`turf.js` would remove the exact code the portfolio project exists to showcase.

## Common Pitfalls

### Pitfall 1: `Math.atan2` argument order mismatch with bearing convention
**What goes wrong:** `Math.atan2(y, x)` is the JS/math-standard signature (angle from the positive x-axis, counterclockwise, range `(-π, π]`). Compass bearing is measured clockwise from north. The locked formula `atan2(dx, dy)` deliberately swaps the arguments relative to math convention — passing `(dy, dx)` by habit (muscle memory from generic "atan2(y,x)" trigonometry) silently produces a *different, wrong* angle rather than an error.
**Why it happens:** Every generic `atan2` reference/tutorial documents `atan2(y, x)`; bearing math is a specialized convention that inverts this, and the inversion is easy to forget mid-implementation.
**How to avoid:** Name the intermediate variables explicitly (`dx`, `dy`) right before the call so the swap is visually obvious at the call site; add at least one fixture with a bearing that would be visibly wrong (e.g., off by 90°) if the arguments were swapped, so a regression is caught immediately.
**Warning signs:** A "due east" case (dx > 0, dy = 0) that returns 0°/360° instead of 90°, or a "due north" case that returns 90° instead of 0°, is the signature symptom of a swapped argument order. [VERIFIED: cross-checked against movable-type.co.uk's widely-cited bearing formula reference and confirmed the `atan2(dx, dy)` — not `atan2(dy, dx)` — ordering]

### Pitfall 2: Negative TCPA (already past closest approach) has no locked behavior
**What goes wrong:** If two vessels are diverging (already past their point of closest approach), the raw formula `tcpa = -(R·V)/(V·V)` can be negative. CONTEXT.md's decisions (D-06/D-07) cover "no closure" (parallel course) and "coincident position," but do not explicitly say what `cpa()`/`tcpa()` should return when the mathematically valid answer is a *negative* time.
**Why it happens:** The vector formula is time-symmetric — it finds the point in time (past or future) where distance is minimized, with no built-in floor at t=0.
**How to avoid:** This needs an explicit decision during planning/implementation (not just "return whatever the formula gives," since Success Criterion 4 requires *all* degenerate/edge inputs to have defined, tested behavior). Two reasonable options, both fixture-testable: (a) return the raw negative `tcpaMinutes` value as an `ok()` result, since it's not degenerate — it's a valid, meaningful answer ("closest approach was 4 minutes ago") — or (b) treat it as informationally distinct and let the consumer (Phase 2) decide what a negative TCPA means for risk-of-collision (Rule 7). Given D-04's "raw, unrounded" philosophy for bearing outputs, option (a) — returning the raw signed value inside `ok()` — is the more consistent choice, but this is a recommendation, not a locked decision; flag for the planner to confirm or add a fixture-tested tie-breaker.
**Warning signs:** A fixture with two vessels moving apart on reciprocal-ish headings produces a negative `tcpaMinutes` that either crashes an unguarded `toBeCloseTo` assertion (if the test wrongly expected only positive values) or silently passes without anyone having decided it should.

### Pitfall 3: `.refine()` chaining order changed between Zod 3 and Zod 4
**What goes wrong:** In Zod 3, calling `.refine()` before another method like `.min()` could break method chaining due to type-narrowing to `ZodEffects`. In Zod 4 this was fixed — refinements are stored inline and chaining works either order.
**Why it happens:** This is a version-specific behavior change; training-data knowledge of Zod 3's limitation could lead to writing unnecessarily defensive/reordered validation code that Zod 4 no longer requires.
**How to avoid:** Since the project is locked to `zod@4.4.3`, write `.gte(0).lt(360)` (or any `.refine()` combined with other checks) in whatever order reads most naturally — no workaround needed. [VERIFIED: Context7 /websites/zod_dev_v4 changelog]

### Pitfall 4: Relying on `SVGElement.getScreenCTM()`/`getBBox()` inside the pure converter functions
**What goes wrong:** CLAUDE.md already flags this: these DOM APIs are not implemented in `jsdom` and will throw in Vitest tests if a converter function calls them directly.
**Why it happens:** It's tempting to make "screen-space" conversion reach into the DOM directly for convenience.
**How to avoid:** Keep `screenToChart()`/`chartToScreen()` as pure functions taking plain numeric inputs (viewBox dimensions, container size from `ResizeObserver` — captured by a *caller* in a later UI phase, not this phase), so they need zero DOM access and can be tested with `environment: 'node'`. This is directly required by Success Criterion 3.
**Warning signs:** A test that only passes under `environment: 'jsdom'` and fails/errors under `'node'` is a sign the pure-function boundary has been violated. [CITED: CLAUDE.md, cross-referenced against testing-library/react-testing-library#1116]

## Code Examples

### toBeCloseTo usage for angle/distance/time fixtures (D-15)
```typescript
// Source: Context7 /vitest-dev/vitest v4.1.6 docs/api/expect.md
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
`toBeCloseTo(expected, numDigits)` defaults `numDigits` to 2 if omitted, but D-15 calls for explicit `2` at every call site for auditability [VERIFIED: Context7 /vitest-dev/vitest/v4.1.6].

### Minimal vitest.config.ts for this phase
```typescript
// Source: Context7 /vitest-dev/vitest v4.1.6 — common config example, trimmed to what Phase 1 needs
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node", // default; explicit here since Success Criterion 3 depends on it
    include: ["src/**/*.test.ts"],
    globals: false, // explicit describe/it/expect imports — matches CLAUDE.md's "no magic" persona
  },
});
```

### Fixture-file co-location pattern (D-14)
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

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Zod 3 `.refine()` breaking subsequent chained methods (`ZodEffects` type narrowing) | Zod 4 stores refinements inline, chaining works in any order | Zod 4.0 (2025) | No defensive reordering needed for `Vessel`'s field validators — write `.gte(0).lt(360)` naturally |
| Zod 3 `z.union([z.literal(a), z.literal(b), ...])` for multi-value literals | Zod 4 `z.literal([a, b, ...])` accepts an array directly | Zod 4.0 | Not directly used here (this phase uses `z.enum()` for `VesselType`, which was already the more idiomatic choice for a fixed string-literal set in both versions) — noted for completeness only |

**Deprecated/outdated:** Nothing in this phase's dependency set is deprecated. `zod@4.4.3`, `vitest@4.1.10`, `typescript@7.0.2` are all current per live registry check at research time.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The epsilon threshold for "V·V ≈ 0" (D-06) should be a small absolute value (e.g. `1e-9`) rather than a relative/scaled threshold | Pattern 3 / Code Examples | Low — this is explicitly left to fixture-driven implementation discretion; wrong choice only affects boundary-case classification of near-parallel courses, easily caught and adjusted via the fixture suite itself |
| A2 | Negative TCPA should be returned as a raw signed `ok()` value rather than clamped to zero or tagged as a new degenerate reason | Common Pitfalls, Pitfall 2 | Medium — if the planner/implementer picks a different convention (e.g., clamping), Phase 2's Rule 7 risk-of-collision logic (which likely needs to distinguish "closing" from "already separating") may need to re-derive this signal a different way; better to decide explicitly now with a fixture than discover the gap mid-Phase-2 |
| A3 | Recommended file/folder names (`vessel.ts`, `bearing.ts`, `cpa.ts`, `angle-convert.ts`, `shared/result.ts`) | Recommended Project Structure | Low — CONTEXT.md explicitly leaves this to Claude's discretion; any reasonable flat naming satisfies D-14's only hard constraint (fixture co-location) |

## Open Questions

1. **What should `cpa()`/`tcpa()` return for a negative TCPA (vessels already diverging)?**
   - What we know: The raw vector formula can mathematically produce a negative time; D-06/D-07 cover two other degenerate cases but not this one.
   - What's unclear: Whether this counts as a normal `ok()` result (just a signed number) or needs its own tagged reason.
   - Recommendation: Treat as `ok()` with the raw signed value (consistent with D-04's "return raw, unrounded" philosophy for bearing), and add an explicit fixture for it under Success Criterion 4's "explicit, tested, defined behavior" mandate. Confirm with the user only if the planner considers this a meaningful ambiguity — otherwise proceed with this recommendation.

2. **Exact epsilon value for the `V·V ≈ 0` comparison (D-06).**
   - What we know: Must be "approximately zero," not exact-equality, per D-06's own wording.
   - What's unclear: No specific numeric threshold is locked anywhere.
   - Recommendation: Pick a small constant (e.g. `1e-9` for squared-knots units) during implementation and document it inline; validate via a fixture with a *near*-parallel (not exactly parallel) course to confirm the threshold doesn't misclassify a genuinely-closing encounter as "no-closure."

## Environment Availability

Skipped — this phase has no external service/tool dependencies beyond the npm-installed libraries already covered in Standard Stack / Package Legitimacy Audit (no database, no Docker, no running services required to write or test pure TypeScript).

## Validation Architecture

Skipped — `.planning/config.json` sets `workflow.nyquist_validation: false` explicitly.

## Security Domain

`.planning/config.json`'s `features` object does not set `security_enforcement: false`, so per the governing instructions this section is technically required — but nearly every ASVS category is not applicable to this phase's actual surface area (a pure, offline TypeScript module with no network, no auth, no persistence, and no user-facing HTTP boundary). Documenting that explicitly rather than omitting the section:

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No authentication surface exists anywhere in this phase |
| V3 Session Management | No | No sessions; pure functions |
| V4 Access Control | No | No access boundaries; this is a library, not a service |
| V5 Input Validation | **Yes** | `zod` schemas (`VesselSchema`, `PositionSchema`) are the input validation boundary — reject invalid `heading`/`speed`/`type` at construction (D-09/D-10/D-12), never coerce or silently accept malformed input |
| V6 Cryptography | No | No secrets, no cryptographic operations in this phase |

### Known Threat Patterns for this stack

Not applicable — there is no injection surface (no SQL, no HTML rendering, no shell execution, no network parsing) in a pure computational domain module. The only "threat" analog worth naming is a correctness one, not a security one: malformed numeric input (`NaN`, `Infinity`) reaching the geometry functions unchecked. Zod's `z.number()` already rejects `NaN` by default [VERIFIED: Zod 4 numeric validators reject non-finite/NaN values as a base behavior], so as long as all inputs pass through `VesselSchema`/`PositionSchema` before reaching bearing/CPA functions, this is covered by the V5 control above rather than being a distinct threat category.

## Sources

### Primary (HIGH confidence)
- Context7 `/websites/zod_dev_v4` — `z.number()` gte/lte/gt/lt validators, `.refine()` chaining fix in Zod 4, `z.discriminatedUnion`, `z.literal([...])` array syntax, `z.enum()` behavior
- Context7 `/vitest-dev/vitest/v4.1.6` — `toBeCloseTo` default digit count and signature, default `environment: 'node'`, `vitest.config.ts` common options, `import.meta.dirname` for fixture path resolution
- `npm view zod version` / `npm view vitest version` / `npm view typescript version` — live registry versions, confirmed current at research time
- `slopcheck scan --pkg npm <package>` — legitimacy audit for `zod`, `typescript`, `vitest`

### Secondary (MEDIUM confidence)
- [movable-type.co.uk bearing formula reference](https://www.movable-type.co.uk/scripts/latlong.html) — confirms `atan2(dx, dy)` argument order and `(θ+360) % 360` normalization pattern, cross-checked against the CLAUDE.md-locked formula
- [Binnacle AI — CPA and TCPA Explained](https://binnacleai.com/blog/cpa-tcpa-explained) — CPA/TCPA vector formula and the "parallel course => current distance, no time bound" degenerate case; single source but consistent with standard relative-velocity vector math (already cited in CLAUDE.md)
- [fullstory.com — Discriminated Unions and Exhaustiveness Checking in TypeScript](https://www.fullstory.com/blog/discriminated-unions-and-exhaustiveness-checking-in-typescript/) and [DEV Community — Mastering TypeScript's never Type](https://dev.to/kaithorne/mastering-typescripts-never-type-exhaustive-checks-conditional-types-and-real-patterns-4c26) — `never`-typed exhaustiveness-check convention, cross-verified across two independent community sources

### Tertiary (LOW confidence)
- None — all findings in this research were either Context7-verified, registry-verified, or cross-checked against at least one additional source.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified live against npm registry, exactly matching CLAUDE.md's prior locked research; no drift
- Architecture: HIGH — Zod/Vitest API shapes verified via Context7 against the exact library versions in use; `Result<T>` pattern is standard TypeScript, not library-dependent
- Pitfalls: HIGH for atan2/Zod-chaining/jsdom pitfalls (verified/cited); MEDIUM for the negative-TCPA and epsilon-threshold items, which are genuinely open implementation decisions rather than researchable facts

**Research date:** 2026-07-14
**Valid until:** 2026-10-14 (stable domain — Zod/Vitest/TypeScript are mature libraries with slow-moving APIs relevant to this phase; 90-day validity is conservative)
