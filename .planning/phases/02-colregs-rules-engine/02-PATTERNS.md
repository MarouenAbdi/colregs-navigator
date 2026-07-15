# Phase 2: COLREGS Rules Engine - Pattern Map

**Mapped:** 2026-07-15
**Files analyzed:** 10 (new)
**Analogs found:** 10 / 10

All ten new Phase 2 files are pure `src/domain/` additions with no framework surface. Because `src/domain/colregs/` does not exist yet, every analog comes from Phase 1's `src/domain/geometry/` and `src/domain/shared/` — this phase is a direct structural extension of an established convention set, not a new pattern family. No component/controller/route/config files are in scope for this phase (pure domain logic only, per CONTEXT.md's phase boundary).

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `src/domain/colregs/types.ts` | model (type/schema definitions) | transform | `src/domain/vessel/vessel.ts` | exact |
| `src/domain/colregs/risk-of-collision.ts` | utility (pure function) | transform | `src/domain/geometry/relative-bearing.ts` | exact |
| `src/domain/colregs/risk-of-collision.fixtures.ts` | test (fixtures) | transform | `src/domain/geometry/cpa.fixtures.ts` | exact |
| `src/domain/colregs/risk-of-collision.test.ts` | test | transform | `src/domain/geometry/cpa.test.ts` | exact |
| `src/domain/colregs/vessel-priority.ts` | utility (pure function) | transform | `src/domain/geometry/bearing.ts` | role-match |
| `src/domain/colregs/vessel-priority.fixtures.ts` | test (fixtures) | transform | `src/domain/geometry/relative-bearing.fixtures.ts` | role-match |
| `src/domain/colregs/vessel-priority.test.ts` | test | transform | `src/domain/geometry/relative-bearing.test.ts` | role-match |
| `src/domain/colregs/classify-encounter.ts` | service (dispatch/orchestrator) | transform (composed) | `src/domain/geometry/relative-bearing.ts` (composition style) | role-match |
| `src/domain/colregs/classify-encounter.fixtures.ts` | test (fixtures) | transform | `src/domain/geometry/relative-bearing.fixtures.ts` | exact |
| `src/domain/colregs/classify-encounter.test.ts` | test | transform | `src/domain/geometry/relative-bearing.test.ts` | exact |

## Pattern Assignments

### `src/domain/colregs/types.ts` (model, transform)

**Analog:** `src/domain/vessel/vessel.ts`

**Imports pattern** (vessel.ts lines 1):
```typescript
import * as z from "zod";
```
Note: `types.ts` in Phase 2 will mostly be plain TypeScript type/interface declarations (`EncounterType`, `GiveWayResult`, `ReasoningTrailEntry`, `DoubtBoundary`, `ClassificationResult`), per CONTEXT.md's discretion note ("exact shape... beyond what D-13 constrains"). Only add a `z.enum(...)` for `EncounterType`/doubt-boundary literals if a Zod boundary is genuinely needed (RESEARCH.md: "N/A for new schemas this phase unless... Zod-validated at a boundary" — likely not required since this is pure internal domain output, not an external input boundary).

**Enum/union declaration pattern** (vessel.ts lines 9-15):
```typescript
export const VesselTypeSchema = z.enum([
  "power-driven",
  "sailing",
  "fishing",
  "not-under-command",
  "restricted-in-ability-to-maneuver",
]); // D-12: kebab-case, matches COLREGS terminology verbatim
```
Apply the same kebab-case string-literal convention to `EncounterType` (`'head-on' | 'crossing' | 'overtaking'`) and doubt-boundary reason strings (`'near-overtaking-crossing-boundary'`, `'near-head-on-boundary'`, per D-12) — plain TS union types are sufficient unless a runtime Zod boundary is added.

**Type re-export pattern** (vessel.ts lines 36-38):
```typescript
export type Vessel = z.infer<typeof VesselSchema>;
export type Position = z.infer<typeof PositionSchema>;
export type VesselType = z.infer<typeof VesselTypeSchema>;
```
If plain interfaces/types are used instead of Zod (the more likely path per RESEARCH.md), export named `interface`/`type` declarations directly rather than `z.infer` wrappers — but keep the same "declare schema/shape, then a co-located exported type alias" grouping style for readability.

**Doc-comment header convention** (vessel.ts lines 3-8):
```typescript
/**
 * COLREGS vessel-type statuses relevant to Rule 18's give-way hierarchy.
 * Five distinct values (D-11): Rule 3(f)'s status and Rule 3(g)'s status
 * are legally distinct, co-equal-priority statuses, not aliases of one
 * another — see the two dedicated enum members below.
 */
```
Every exported type/schema gets a doc comment explaining the *domain* rationale (which decision/rule drove the shape), not just a mechanical description — carry this into `types.ts` (e.g. explain why `doubt` is a boolean+reason rather than a 4th `EncounterType` value, citing D-11/D-12).

---

### `src/domain/colregs/risk-of-collision.ts` (utility, transform)

**Analog:** `src/domain/geometry/relative-bearing.ts` (small pure function composing another Result-returning function)

**Imports pattern** (relative-bearing.ts lines 10-12):
```typescript
import type { Vessel } from "../vessel/vessel.js";
import { err, ok, type Result } from "../shared/result.js";
import { bearing } from "./bearing.js";
```
`.js` extensions on relative imports are mandatory (NodeNext module resolution, confirmed in `tsconfig.json`: `"module": "NodeNext"`). `risk-of-collision.ts` should import `type { Result } from "../shared/result.js"` and `type { Vessel } from "../vessel/vessel.js"` (or just the `cpa` return-shape type) using the same relative-path + `.js`-extension style.

**Core threshold/gate pattern** (RESEARCH.md Pattern 2, directly modeled on cpa.ts's degenerate-case handling at cpa.ts lines 63-66 and relative-bearing.ts lines 24-28):
```typescript
export const RISK_OF_COLLISION_DCPA_THRESHOLD_NM = 1.0; // D-06

export function riskOfCollision(
  cpaResult: Result<{ tcpaMinutes: number; dcpaNm: number }>,
): boolean {
  if (!cpaResult.ok) {
    // D-07: 'no-closure' (parallel/matching-course) = no risk.
    return false;
  }
  // D-05 + D-08: BOTH must hold.
  return cpaResult.value.tcpaMinutes > 0
    && cpaResult.value.dcpaNm <= RISK_OF_COLLISION_DCPA_THRESHOLD_NM;
}
```
Note this function returns a plain `boolean`, not a `Result<boolean>` — a deliberate departure from the `Result<T>` convention because "no risk" is never itself a degenerate/error case (it's a valid classification outcome), matching relative-bearing.ts's "propagate unchanged, don't re-wrap" philosophy applied one level up: the *input* `cpaResult`'s `Result` failure is consumed and converted into a definite `false`, not re-propagated as a new failure.

**Named-constant-as-documentation pattern** (cpa.ts lines 16-20):
```typescript
// Squared-knots units. Resolves RESEARCH.md Open Question 2: a raw
// `vDotV === 0` check is fragile against floating-point noise...
export const NEAR_ZERO_RELATIVE_VELOCITY_SQ = 1e-9;
```
Apply the same style to `RISK_OF_COLLISION_DCPA_THRESHOLD_NM = 1.0` — export the constant with an inline comment citing the exact decision ID (D-06) that fixed its value, so it reads as traceable to CONTEXT.md rather than an arbitrary magic number.

---

### `src/domain/colregs/risk-of-collision.fixtures.ts` / `.test.ts` (test, transform)

**Analog:** `src/domain/geometry/cpa.fixtures.ts` + `src/domain/geometry/cpa.test.ts`

**Fixture typing + worked-math-in-comments pattern** (cpa.fixtures.ts lines 1-27):
```typescript
import type { Vessel } from "../vessel/vessel.js";

/**
 * Hand-derived CPA/TCPA fixtures (D-13). Velocity components use the
 * project's locked convention: ...
 */

// Head-on closing case:
// vesselA at (0,0) heading 000 ... [worked arithmetic] ...
export const headOnClosingCase: {
  vesselA: Vessel;
  vesselB: Vessel;
  expectedTcpaMinutes: number;
  expectedDcpaNm: number;
} = { /* ... */ };
```
`risk-of-collision.fixtures.ts` should follow this exact shape but at one level of abstraction up: each fixture is a `{ cpaResult: Result<{tcpaMinutes, dcpaNm}>, expectedRisk: boolean }` pair (or reuse `cpa.fixtures.ts`'s existing `headOnClosingCase`/`parallelNoClosureCase`/`negativeTcpaCase` fixtures directly by piping their vessels through `cpa()` in the test, per RESEARCH.md's "Phase 2 can reuse these as known-correct starting inputs"). Required fixture set per D-05–D-08 boundary coverage: (1) positive TCPA + DCPA under threshold → true, (2) positive TCPA + DCPA over threshold → false, (3) `no-closure` → false, (4) negative TCPA with tiny DCPA → false, (5) DCPA exactly at the 1.0nm boundary → true (inclusive, per D-05 "at or under").

**Test structure pattern** (cpa.test.ts lines 1-11, 44-54):
```typescript
import { describe, expect, it } from "vitest";
import { cpa } from "./cpa.js";
import {
  epsilonJustAboveCase,
  epsilonJustBelowCase,
  headOnClosingCase,
  negativeTcpaCase,
  nonFiniteInputCase,
  parallelNoClosureCase,
} from "./cpa.fixtures.js";

describe("cpa", () => {
  it("classifies a vDotV just below the epsilon threshold as no-closure", () => {
    const result = cpa(epsilonJustBelowCase.vesselA, epsilonJustBelowCase.vesselB);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("no-closure");
      /* ... */
    }
  });
});
```
Mirror this `describe("riskOfCollision", () => { it("...", () => {...}) })` grouping, with one `it` per D-05–D-08 boundary case, named descriptively after the rule/decision it verifies (e.g. `it("returns false when tcpaMinutes is negative regardless of DCPA (D-08)")`).

---

### `src/domain/colregs/vessel-priority.ts` (utility, transform)

**Analog:** `src/domain/geometry/bearing.ts` (small pure function with an internal lookup/derivation + a documented convention block)

**Core lookup-table + comparison pattern** (RESEARCH.md Pattern 3, styled after bearing.ts's doc-comment-then-function structure at bearing.ts lines 1-15):
```typescript
import type { VesselType } from "../vessel/vessel.js";

// Lower number = higher priority = "must be given way to." ...
const PRIORITY: Record<VesselType, number> = {
  "not-under-command": 1,
  "restricted-in-ability-to-maneuver": 1,
  "fishing": 2,
  "sailing": 3,
  "power-driven": 4,
};

export function vesselPriority(type: VesselType): number {
  return PRIORITY[type];
}

export function rule18Overrides(
  geometricGiveWayType: VesselType,
  geometricStandOnType: VesselType,
): boolean {
  return vesselPriority(geometricGiveWayType) < vesselPriority(geometricStandOnType);
}
```
Import style matches bearing.ts's `import type { Position } from "../vessel/vessel.js";` (type-only import, relative path with `.js` extension). Unlike bearing.ts, this function has no degenerate-case surface (every `VesselType` has a defined priority, so no `Result<T>`/`err()` needed) — the `Record<VesselType, number>` type itself guarantees exhaustiveness at compile time, which is the TypeScript-native equivalent of Phase 1's `assertUnreachable()` guard.

---

### `src/domain/colregs/vessel-priority.fixtures.ts` / `.test.ts` (test, transform)

**Analog:** `src/domain/geometry/relative-bearing.fixtures.ts` + `.test.ts` (fixture-per-scenario with inline worked reasoning, grouped `describe` blocks by concern)

**Fixture-with-rationale-comment pattern** (relative-bearing.fixtures.ts lines 45-61):
```typescript
// Own is the vessel being overtaken, heading 000. Contact approaches from
// more than 22.5 deg abaft own's beam (Rule 13's overtaking sector)...
export const overtakingCase: OkCase = { /* ... */ };
```
`vessel-priority.fixtures.ts` needs fixtures covering: (1) each of the 5 vessel types' numeric priority value, (2) the NUC/RIATM co-equal-priority tie (both priority 1, `rule18Overrides` returns `false` either direction — this is the tie-break case flagged as "Claude's Discretion" in CONTEXT.md and resolved via RESEARCH.md's Assumption/derivation), (3) a same-type-vs-same-type case (e.g. power-driven vs power-driven, always `false`), (4) a genuine override case (e.g. geometric give-way = power-driven, geometric stand-on = fishing → `true`), (5) the reverse-direction non-override case (geometric give-way = fishing, geometric stand-on = power-driven → `false`, since fishing already outranks power-driven — no reversal needed).

**Test grouping pattern** (relative-bearing.test.ts lines 13, 55, 69):
```typescript
describe("relativeBearing() classic encounter shapes (D-16)", () => { /* ... */ });
describe("relativeBearing() normalization boundary (D-08)", () => { /* ... */ });
describe("relativeBearing() degenerate cases", () => { /* ... */ });
```
Use the same "group by concern, name the describe block after the decision/requirement it verifies" convention: e.g. `describe("vesselPriority() tier ranking")`, `describe("rule18Overrides() tie-break mechanics (co-equal NUC/RIATM)")`.

---

### `src/domain/colregs/classify-encounter.ts` (service/dispatch, transform-composed)

**Analog (composition style):** `src/domain/geometry/relative-bearing.ts` (a function that composes another `Result`-returning function and propagates its failure unchanged)

**Failure-propagation pattern** (relative-bearing.ts lines 24-28):
```typescript
const bearingResult = bearing(own.position, contact.position);
if (!bearingResult.ok) {
  // Propagate unchanged -- do not re-wrap or re-tag the failure.
  return bearingResult;
}
```
`classify-encounter.ts`'s Stage 0 (per RESEARCH.md's Architecture Patterns diagram) must call `relativeBearing(A,B)`, `relativeBearing(B,A)`, and `cpa(A,B)`, and propagate any `invalid-input`/`coincident-position` failure from those calls as a top-level `classifyEncounter()` failure using this exact "check `.ok`, return unchanged if false" idiom — never re-wrap into a new tagged reason.

**Imports pattern** (relative-bearing.ts lines 10-12, extended per RESEARCH.md's recommended module layout):
```typescript
import type { Vessel } from "../vessel/vessel.js";
import { err, ok, type Result } from "../shared/result.js";
import { relativeBearing } from "../geometry/relative-bearing.js";
import { cpa } from "../geometry/cpa.js";
import { riskOfCollision } from "./risk-of-collision.js";
import { rule18Overrides } from "./vessel-priority.js";
import type { EncounterType, ClassificationResult, ReasoningTrailEntry } from "./types.js";
```
Cross-domain-module imports (`../geometry/...`) already exist as an established pattern in Phase 1 itself is not present (Phase 1 modules don't cross-import each other except relative-bearing.ts → bearing.ts within the same folder) — but the `../vessel/vessel.js` cross-folder import from geometry files (bearing.ts line 12, relative-bearing.ts line 10, cpa.ts line 1) is the direct precedent proving cross-subfolder relative imports with `.js` extensions are the established convention. `classify-encounter.ts` importing from `../geometry/*.js` follows the identical pattern one level over.

**Trail-accumulation dispatch pattern:** see RESEARCH.md's Pattern 1 (`evaluateOvertaking`) verbatim — this is the primary new structural pattern for this phase (no direct Phase 1 precedent for "accumulate an ordered array of structured entries across sequential stages," since Phase 1 functions return a single scalar/tuple). Follow RESEARCH.md's Architecture Patterns diagram (Stages 0-6) exactly for dispatch order; each stage function returns `{ matched: ... | null; entries: ReasoningTrailEntry[] }` and the top-level function concatenates entries via `trail.push(...entries)` in fixed order (Rule 7 → sticky-overtaking → Rule 13 → Rule 14 → Rule 15 → Rule 18), matching D-15.

**Return-shape convention:** Per RESEARCH.md's "Primary recommendation," return a domain-specific result object (not a bare `Result<T>` reuse for the whole thing) — `Result<T>` is used only for the Stage 0 geometry-composition failure path (genuine input errors), while "no risk of collision" and "doubt" are valid `ok()` payload fields, not `err()` tags. This mirrors `risk-of-collision.ts`'s design of converting a `Result` failure into a definite in-band value rather than re-propagating it as an error for the whole pipeline.

---

### `src/domain/colregs/classify-encounter.fixtures.ts` / `.test.ts` (test, transform)

**Analog:** `src/domain/geometry/relative-bearing.fixtures.ts` + `.test.ts` (richest existing fixture file — closest scale/shape match, since `classify-encounter` fixtures need full `{vesselA, vesselB, previous?, expected...}` shapes analogous to relative-bearing's `{own, contact, expected}`)

**Cross-phase fixture reuse pattern** (explicitly directed by RESEARCH.md and CONTEXT.md D-16): reuse `src/domain/geometry/relative-bearing.fixtures.ts`'s `headOnCase`, `crossingCase`, `overtakingCase`, and `reciprocalOffAxisCase` vessel pairs directly as the geometric basis for `classify-encounter.fixtures.ts`'s own `expectedEncounterType` fixtures, importing them rather than re-deriving the same vessel positions:
```typescript
import { headOnCase, crossingCase, overtakingCase } from "../geometry/relative-bearing.fixtures.js";
```

**Fixture shape** (RESEARCH.md Code Examples, "Fixture pattern for the overtaking-direction check"):
```typescript
export const overtakingAOvertakenByB = {
  vesselA: { position: { x: 0, y: 0 }, heading: 0, speed: 8, type: "power-driven" as const },
  vesselB: { position: { x: 5, y: -8.660254 }, heading: 0, speed: 15, type: "power-driven" as const },
  expectedEncounterType: "overtaking" as const,
  expectedGiveWay: "vesselB" as const,
  expectedStandOn: "vesselA" as const,
};

export const overtakingHysteresisHoldsCase = {
  vesselA: { position: { x: 0, y: 0 }, heading: 0, speed: 8, type: "power-driven" as const },
  vesselB: { position: { x: 5, y: 0 }, heading: 270, speed: 15, type: "power-driven" as const },
  previous: "overtaking" as const,
  expectedEncounterType: "overtaking" as const,
};
```
Required fixture set per D-01–D-16 (this is the deliverable fixture depth CONTEXT.md calls out as the "auditable proof of correctness"): both-direction overtaking (A-overtakes-B and B-overtakes-A, swapped-argument symmetry test per Pitfall 1), hysteresis-holds (D-04), hysteresis-releases-on-gate-failure (Pitfall 4 regression fixture), genuine head-on (both directions near-zero), one-sided-only-not-head-on (Pitfall 2's new fixture — bearing near 0 from one side only, non-reciprocal headings), doubt-band cases at both the 112.5° and 0° boundaries (D-09–D-12), Rule 15 residual/crossing case with Rule 18 override, Rule 18 no-op case (same/co-equal types), and a propagated Stage-0 geometry failure (coincident positions).

**Test structure:** mirror `relative-bearing.test.ts`'s `describe`-per-concern grouping — e.g. `describe("classifyEncounter() overtaking direction (Rule 13)")`, `describe("classifyEncounter() hysteresis (D-01-D-04)")`, `describe("classifyEncounter() Rule 7 risk gate (D-05-D-08)")`, `describe("classifyEncounter() doubt band (D-09-D-12)")`, `describe("classifyEncounter() Rule 18 override (DETM-02)")`, `describe("classifyEncounter() reasoning trail shape (D-13-D-16)")`.

---

## Shared Patterns

### Result<T> / Degenerate-Case Signaling
**Source:** `src/domain/shared/result.ts`
**Apply to:** `classify-encounter.ts`'s Stage 0 (propagating `relativeBearing`/`cpa` failures)
```typescript
export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; reason: DegenerateCaseReason; details?: Record<string, unknown> };

export function ok<T>(value: T): Result<T> { return { ok: true, value }; }
export function err<T>(reason: DegenerateCaseReason, details?: Record<string, unknown>): Result<T> {
  return { ok: false, reason, details };
}
```
Do not add new `DegenerateCaseReason` variants for "no risk of collision" or "doubt" — those are valid in-band `ok()` outcomes per CONTEXT.md/RESEARCH.md, not degenerate cases. Only genuine geometry input errors (`invalid-input`, `coincident-position`, `no-closure` at the Stage 0 composition boundary) use this type.

### Relative Import + `.js` Extension Convention
**Source:** all Phase 1 files (e.g. `src/domain/geometry/relative-bearing.ts` lines 10-12)
**Apply to:** all 10 new files
```typescript
import type { Vessel } from "../vessel/vessel.js";
import { err, ok, type Result } from "../shared/result.js";
```
NodeNext module resolution (`tsconfig.json`: `"module": "NodeNext"`) requires the `.js` extension on every relative import even though source files are `.ts` — this is non-negotiable and easy to forget when writing new cross-folder imports (`../geometry/*.js`, `./risk-of-collision.js`, etc.).

### Doc-Comment-Then-Code, Decision-ID-Traceable Comments
**Source:** every Phase 1 file (e.g. `cpa.ts` lines 1-14, `bearing.ts` lines 1-10)
**Apply to:** all 10 new files
Every exported function/constant gets a doc comment citing the specific decision ID (`D-05`, `D-08`, etc.) or rule number that drove its exact shape/value — not a generic description. This is the single most consistent stylistic convention across the codebase and directly serves the portfolio's "domain modeling depth" goal (an interviewer should be able to trace any constant back to its rationale without leaving the file).

### Fixture File Co-location + Worked-Math Comments
**Source:** `src/domain/geometry/*.fixtures.ts` (all three existing fixture files)
**Apply to:** all 3 new fixture files
Fixtures live in a dedicated `*.fixtures.ts` file (not inlined in `*.test.ts`), each exported as a typed const with an inline comment showing the worked arithmetic/derivation that produced the `expected*` value(s) — never a bare literal with no derivation shown.

### Test File Structure
**Source:** `src/domain/geometry/relative-bearing.test.ts`, `src/domain/geometry/cpa.test.ts`
**Apply to:** all 3 new test files
```typescript
import { describe, expect, it } from "vitest";
import { functionUnderTest } from "./module.js";
import { fixtureA, fixtureB } from "./module.fixtures.js";

describe("functionUnderTest() concern grouping (decision ID)", () => {
  it("descriptive assertion of one specific rule/boundary", () => {
    const result = functionUnderTest(fixtureA.input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBeCloseTo(fixtureA.expected, 2);
    }
  });
});
```
Note the `if (result.ok) { ... }` type-narrowing guard after every `expect(result.ok).toBe(...)` — required by TypeScript strict mode to safely access `.value`/`.reason` on the discriminated union; keep this in all new tests touching `Result<T>`-returning functions.

## No Analog Found

None. Every new Phase 2 file has a strong analog in Phase 1's `src/domain/geometry/` and `src/domain/shared/` modules — this phase is a direct structural/stylistic continuation of Phase 1, not a new pattern family, with the single exception of the trail-accumulation dispatch shape in `classify-encounter.ts` (no direct Phase 1 precedent, fully specified instead by RESEARCH.md's Pattern 1 and Architecture Patterns diagram, which should be treated as the authoritative shape reference for that one file).

## Metadata

**Analog search scope:** `src/domain/` (only source directory currently populated — confirmed via `find` that `src/domain/colregs/` does not yet exist)
**Files scanned:** `src/domain/shared/result.ts`, `src/domain/vessel/vessel.ts`, `src/domain/geometry/bearing.ts`, `src/domain/geometry/relative-bearing.ts`, `src/domain/geometry/relative-bearing.fixtures.ts`, `src/domain/geometry/relative-bearing.test.ts`, `src/domain/geometry/cpa.ts`, `src/domain/geometry/cpa.fixtures.ts`, `src/domain/geometry/cpa.test.ts`, `tsconfig.json` (9 source files + 1 config)
**Pattern extraction date:** 2026-07-15
