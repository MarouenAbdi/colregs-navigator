# Phase 1: Domain Foundations - Context

**Gathered:** 2026-07-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Pure, framework-free domain layer: a `Vessel` value object (position, heading, speed, vessel type) and a geometry module (`bearing`, `relativeBearing`, `cpa`/`tcpa`, compass/math/screen-space angle converters). Zero dependencies on Next.js/tRPC/Prisma/React. Everything is fixture-tested in isolation — no classification logic (that's Phase 2) and no UI/rendering (Phase 4).

</domain>

<decisions>
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Tech stack & architecture decisions (locked)
- `CLAUDE.md` — Technology Stack section: locks hand-rolled geometry (no geolib/turf.js), plain TS + Zod domain layer (no rules-engine library, no xstate), the `src/domain/` framework-free boundary rule, and the exact bearing/relative-bearing/CPA formulas (`atan2(dx, dy)` convention, `(-180, 180]` relative-bearing normalization, CPA/TCPA vector formulas).

### Project scope & requirements
- `.planning/PROJECT.md` — Core Value statement and Out-of-Scope list (no multi-vessel, no lights/sound-signal rules, no real AIS data — all relevant to keeping Phase 1's geometry module scoped to the 2-vessel synthetic sandbox).
- `.planning/REQUIREMENTS.md` — VESL-01 (vessel model requirement mapped to this phase); DETM-02 (source of the 5-vessel-type decision, D-11).
- `.planning/ROADMAP.md` — Phase 1 section (goal, success criteria, requirements mapping). **Note the D-11 discrepancy**: success criterion #1 currently says "four" vessel types and should be updated to "five" to match REQUIREMENTS.md DETM-02.

No other external specs, ADRs, or design docs exist yet — this is the first phase of the project.

</canonical_refs>

<code_context>
## Existing Code Insights

This is a greenfield project — no `src/` directory exists yet, no prior phases, no codebase maps in `.planning/codebase/`. There is nothing to reuse; Phase 1 establishes the first code in the repository.

### Established Patterns
- None yet — CLAUDE.md's Technology Stack section documents the *intended* patterns (flat `src/domain/` structure, Zod as both validation and domain value-object layer) but none exist in code yet.

</code_context>

<specifics>
## Specific Ideas

No particular UI/example references — Phase 1 is pure domain logic with no visual surface. The one concrete artifact to produce beyond code is the worked-trigonometry documentation accompanying each hand-derived fixture (D-13), so a reviewer can audit correctness without re-deriving the math themselves.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 1 scope. No scope-creep suggestions came up during this discussion.

</deferred>

---

*Phase: 1-Domain Foundations*
*Context gathered: 2026-07-14*
