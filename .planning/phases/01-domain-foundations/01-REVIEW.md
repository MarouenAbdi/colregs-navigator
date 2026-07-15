---
phase: 01-domain-foundations
reviewed: 2026-07-15T09:21:13Z
depth: standard
files_reviewed: 19
files_reviewed_list:
  - src/domain/geometry/angle-convert.fixtures.ts
  - src/domain/geometry/angle-convert.test.ts
  - src/domain/geometry/angle-convert.ts
  - src/domain/geometry/bearing.fixtures.ts
  - src/domain/geometry/bearing.test.ts
  - src/domain/geometry/bearing.ts
  - src/domain/geometry/cpa.fixtures.ts
  - src/domain/geometry/cpa.test.ts
  - src/domain/geometry/cpa.ts
  - src/domain/geometry/relative-bearing.fixtures.ts
  - src/domain/geometry/relative-bearing.test.ts
  - src/domain/geometry/relative-bearing.ts
  - src/domain/geometry/screen-convert.fixtures.ts
  - src/domain/geometry/screen-convert.test.ts
  - src/domain/geometry/screen-convert.ts
  - src/domain/shared/result.test.ts
  - src/domain/shared/result.ts
  - src/domain/vessel/vessel.test.ts
  - src/domain/vessel/vessel.ts
findings:
  critical: 0
  warning: 1
  info: 5
  total: 6
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-07-15T09:21:13Z
**Depth:** standard
**Files Reviewed:** 19
**Status:** issues_found

## Summary

Reviewed all Phase 1 domain-foundations source files (Result<T> shared type, Vessel/Position Zod
schemas, and the geometry module: bearing, relativeBearing, cpa/tcpa, angle conversion, and
screen<->chart coordinate conversion), plus their paired fixtures and tests.

Verification performed beyond reading:
- Ran `npx vitest run` — 7 files, 65 tests, all passing.
- Ran `npx tsc --noEmit` (project's locked `strict: true` config) — zero type errors.
- Ran `npx tsc --noUnusedLocals --noUnusedParameters --noEmit` — zero unused-symbol errors.
- Hand-traced the trigonometry in every fixture (bearing atan2 convention, CPA/TCPA vector math,
  compass<->math angle conversion, relative-bearing normalization boundaries, screen<->chart
  round-trip) against the implementation; all fixture expectations match the code's actual
  arithmetic, including the epsilon-threshold boundary cases in `cpa.fixtures.ts`.
- Confirmed via a standalone script that Zod v4.4.3's `z.number()` rejects `Infinity`/`-Infinity`
  in addition to `NaN` on `PositionSchema`/heading/speed, closing a gap the test suite itself
  does not exercise.
- Confirmed `src/domain/` has zero imports from Next.js/tRPC/Prisma/server code (only `zod` and
  internal domain modules), honoring CLAUDE.md's architecture boundary.
- Grepped for hardcoded secrets, `eval`/`innerHTML`/`exec`, `console.log`/`debugger`/TODO/FIXME,
  and empty `catch` blocks — none found (there are no `catch` blocks in this layer at all; the
  code consistently uses `Result<T>` for expected degenerate cases and `throw TypeError` for
  programmer-error-class invalid input).

No correctness bugs, security issues, or crashes were found. The geometry math is genuinely
correct and the fixtures are unusually well-documented/self-checking. The findings below are
maintainability/consistency concerns, not defects in current behavior.

## Warnings

### WR-01: Angle-normalization logic is duplicated with no shared enforcement

**File:** `src/domain/geometry/bearing.ts:35`, `src/domain/geometry/relative-bearing.ts:35-38`
**Issue:** `angle-convert.ts` exports `normalizeCompassDegrees()` (lines 34-40) and
`normalizeRelativeBearingDegrees()` (lines 42-56) — the exact same [0,360) and (-180,180]
normalization formulas used inline in `bearing.ts:35` and `relative-bearing.ts:35-38`. The
duplication in `relative-bearing.ts` is explicitly justified in an `angle-convert.ts` comment
("kept file-independent so this plan and Plan 02 can execute in the same wave without a file
dependency") — but `bearing.ts`'s duplicate (`((rawDegrees % 360) + 360) % 360`) carries no such
justification, and both plans have since merged into the same codebase, so the original
"avoid a cross-plan file dependency" rationale no longer applies. Nothing (no shared test, no
type-level link) guarantees the two implementations of the same correctness-critical invariant
stay in sync if the normalization convention is ever revisited — precisely the kind of geometry
math CLAUDE.md calls out as this project's core value, where a silent divergence would be a real
correctness bug and hard to notice (each function's own tests would still pass; only cross-
function consistency would break).
**Fix:** Now that both files coexist, have `bearing.ts` import and call
`normalizeCompassDegrees` from `./angle-convert.js`, and have `relative-bearing.ts` import and
call `normalizeRelativeBearingDegrees` from `./angle-convert.js`, removing both inline copies:
```typescript
// bearing.ts
import { normalizeCompassDegrees } from "./angle-convert.js";
// ...
const rawDegrees = Math.atan2(dx, dy) * (180 / Math.PI);
return ok(normalizeCompassDegrees(rawDegrees));
```
```typescript
// relative-bearing.ts
import { normalizeRelativeBearingDegrees } from "./angle-convert.js";
// ...
const raw = bearingResult.value - own.heading;
return ok(normalizeRelativeBearingDegrees(raw));
```

## Info

### IN-01: `angle-convert.ts` exports are currently unused outside their own tests

**File:** `src/domain/geometry/angle-convert.ts:19-56`
**Issue:** `compassToMathDegrees`, `mathToCompassDegrees`, `normalizeCompassDegrees`, and
`normalizeRelativeBearingDegrees` have no consumers anywhere in `src/` outside their own test
file (confirmed via grep). This is expected for a foundational phase whose consumers (the chart
rendering layer, the rules engine) land in later phases/plans — not a defect — but worth tracking
so a future review doesn't silently accumulate orphaned exports if a planned consumer never
materializes.
**Fix:** No action needed now; revisit if Phase 4 (chart rendering) doesn't end up calling
`compassToMathDegrees`/`mathToCompassDegrees` for heading-to-SVG-rotation conversion as implied by
the module's own docstring.

### IN-02: Redundant `Math.abs()` on a value that can never be negative

**File:** `src/domain/geometry/cpa.ts:63`
**Issue:** `Math.abs(vDotV) < NEAR_ZERO_RELATIVE_VELOCITY_SQ` — `vDotV` is defined on line 62 as
`V.x * V.x + V.y * V.y`, a sum of two squares, which is always `>= 0`. The `Math.abs()` call is
dead defensive code that can mislead a future reader into thinking `vDotV` can go negative (e.g.,
if someone later changes the formula to a dot product between differently-signed vectors without
noticing the `Math.abs` was silently correcting for that).
**Fix:** Drop the `Math.abs()` call since it has no effect on current behavior:
```typescript
if (vDotV < NEAR_ZERO_RELATIVE_VELOCITY_SQ) {
```

### IN-03: `compassToMathDegrees`/`mathToCompassDegrees` have byte-identical bodies

**File:** `src/domain/geometry/angle-convert.ts:19-32`
**Issue:** Both functions call `normalizeCompassDegrees(90 - x)` with an identical implementation
(the comment on line 30 even notes this is "the same 90-minus-transform"). The self-inverse
property is documented only in a comment, not expressed in code, so a future edit to one
function's formula (e.g., an off-by-sign fix) could easily be applied to only one of the two
without the reviewer noticing they were meant to stay identical.
**Fix:** Consider expressing the relationship directly, e.g. `export const mathToCompassDegrees
= compassToMathDegrees;` (with a comment explaining why), or keep both but add a round-trip
property test asserting the two functions always agree for arbitrary inputs, not just the two
`roundTripSamples` fixture values.

### IN-04: Inconsistent invalid-input signaling convention across the geometry module

**File:** `src/domain/geometry/angle-convert.ts:20-22`, `src/domain/geometry/screen-convert.ts:30-33`, vs. `src/domain/geometry/bearing.ts:16-23`, `src/domain/geometry/cpa.ts:36-38`
**Issue:** `bearing()`, `relativeBearing()`, and `cpa()` signal non-finite numeric input via
`Result<T>`'s `err("invalid-input", ...)`, while `angle-convert.ts` and `screen-convert.ts`
signal the same class of problem (NaN/Infinity input) by throwing `TypeError`. Each choice is
individually defensible (documented in `angle-convert.ts`'s file header: these functions have no
domain-level degenerate case, only a programmer-error case), but the split itself isn't recorded
anywhere as a deliberate module-wide convention. A future contributor adding a new geometry
function has no explicit rule to follow for which pattern applies to their new function.
**Fix:** Add a short convention note (e.g. in a module-level README or the `result.ts` docstring)
stating the rule explicitly: "Result<T> is for domain-meaningful degenerate cases (coincident
position, no closure); throw TypeError for inputs that are never domain-valid regardless of
which function receives them (NaN/Infinity)." This turns an implicit pattern into an enforceable
one for Phase 2+ contributors.

### IN-05: No linting configuration in the repository

**File:** (repository root)
**Issue:** There is no ESLint/Biome/other linter config in the project. The consistent use of
`===`, explicit imports, and absence of unused symbols currently reviewed clean, but that is
presently enforced only by `tsc --noEmit` plus manual discipline, not by an automated gate a CI
pipeline could run.
**Fix:** Not blocking for Phase 1, but consider adding a lint step (e.g. ESLint with
`@typescript-eslint`) before the codebase grows past the domain layer into `src/server/`/
`src/app/`, where framework-specific footguns (unhandled promises, `any` casts) become possible.

---

_Reviewed: 2026-07-15T09:21:13Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
