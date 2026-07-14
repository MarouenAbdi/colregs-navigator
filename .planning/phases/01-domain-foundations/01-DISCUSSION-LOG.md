# Phase 1: Domain Foundations - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-14
**Phase:** 1-Domain Foundations
**Areas discussed:** Units & coordinate system, Degenerate-input handling shape, Vessel value-object validation rules, Fixture suite sourcing & structure

---

## Units & Coordinate System

| Option | Description | Selected |
|--------|-------------|----------|
| Nautical miles + knots | Position in nm, speed in knots — natural CPA/TCPA units, authentic maritime feel | ✓ |
| Arbitrary unitless Cartesian plane | Simpler math, loses "real chart" feel | |
| Meters + m/s | SI units, reads as physics sim not nautical chart | |

**User's choice:** Nautical miles + knots

| Option | Description | Selected |
|--------|-------------|----------|
| Minutes | Converts nm/knots' natural hours output to minutes for realistic encounter timescales | ✓ |
| Hours | No conversion needed, but awkward fractional values | |
| Both — hours internally, minutes at display edge | Keeps geometry module unit-agnostic internally | |

**User's choice:** Minutes

| Option | Description | Selected |
|--------|-------------|----------|
| x=east, y=north; unbounded plane | Standard nautical convention, matches CLAUDE.md's bearing formula | ✓ |
| x=east, y=north; bounded to fixed extent (e.g. ±50nm) | Adds a plausibility validation rule | |
| Let Claude decide the bound if bounded | Defers numeric bound to implementation | |

**User's choice:** x=east, y=north; unbounded plane

| Option | Description | Selected |
|--------|-------------|----------|
| Raw float, unrounded | Domain stays pure math, fixtures use tolerance comparisons | ✓ |
| Rounded to whole degrees at source | Bakes presentation choice into domain layer | |

**User's choice:** Raw float, unrounded

---

## Degenerate-Input Handling Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit tagged result: no defined CPA | Discriminated union caller must handle, avoids NaN/Infinity confusion | ✓ |
| Return current distance with timeToClosestApproach = Infinity | Risks Infinity leaking into UI formatting | |
| Throw a domain error | Wrong shape for an expected, common geometric case | |

**User's choice:** Explicit tagged result: no defined CPA

| Option | Description | Selected |
|--------|-------------|----------|
| Same tagged-result pattern for coincident position | Consistent with CPA decision, avoids misleading 0° = "due north" | ✓ |
| Return 0° and let caller notice via distance=0 | Relies on caller remembering to check distance | |
| Throw a domain error | Coincident position can occur mid-drag in Phase 4, not exceptional | |

**User's choice:** Same tagged-result pattern: explicit 'undefined' state

| Option | Description | Selected |
|--------|-------------|----------|
| Shared generic Result<T> discriminated union | One reusable type across bearing/relativeBearing/cpa | ✓ |
| Each function defines its own specific union | More precise typing, no shared handling pattern | |
| Let Claude decide once shapes are drafted | Defers final call to implementation | |

**User's choice:** Shared generic Result<T> discriminated union

| Option | Description | Selected |
|--------|-------------|----------|
| Bearing ∈ [0,360); relative bearing ∈ (-180,180] | Matches CLAUDE.md's already-locked convention | ✓ |
| Bearing ∈ [0,360); relative bearing ∈ [-180,180) | Flips inclusive side without clear reason | |

**User's choice:** Bearing ∈ [0, 360); relative bearing ∈ (-180, 180] — matches CLAUDE.md

---

## Vessel Value-Object Validation Rules

| Option | Description | Selected |
|--------|-------------|----------|
| speed >= 0, no upper ceiling | Zero speed is a valid, meaningful state (anchored/drifting) | ✓ |
| speed > 0 strictly | Excludes a legitimate, common encounter type | |
| speed >= 0 with a sane knots ceiling (e.g. 40) | Risks rejecting a valid edge-case fixture | |

**User's choice:** speed >= 0, no upper ceiling

| Option | Description | Selected |
|--------|-------------|----------|
| Reject via Zod (must already be in [0,360)) | Keeps value object strict; normalization is geometry's job | ✓ |
| Normalize automatically (mod 360) at construction | Blurs validation vs. computation | |

**User's choice:** Reject via Zod (must already be in [0, 360))

| Option | Description | Selected |
|--------|-------------|----------|
| 5 values: add 'not-under-command' as distinct from RIATM | Matches REQUIREMENTS.md DETM-02 literally; avoids breaking change in Phase 2 | ✓ |
| 4 values: keep RIATM as only top-tier status | Matches ROADMAP.md wording literally, requires revisiting DETM-02 | |

**User's choice:** 5 values: add 'not-under-command' as distinct from 'restricted-in-ability-to-maneuver'
**Notes:** Resolves a wording discrepancy between ROADMAP.md (says "four vessel types") and REQUIREMENTS.md DETM-02 (implies 5 co-equal statuses). Flagged as a follow-up correction to ROADMAP.md during planning.

| Option | Description | Selected |
|--------|-------------|----------|
| kebab-case literal values | Matches COLREGS terminology verbatim, no translation layer | ✓ |
| camelCase literal values | More conventional JS identifiers, needs display-name mapping anyway | |

**User's choice:** kebab-case: 'power-driven' \| 'sailing' \| 'fishing' \| 'not-under-command' \| 'restricted-in-ability-to-maneuver'

---

## Fixture Suite Sourcing & Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Hand-derived from COLREGS reference scenarios + worked trigonometry | Auditable correctness, worked math shown alongside fixture | ✓ |
| Cross-check against a published navigation/CPA calculator or textbook example | More authoritative but limited availability, needs citations | |

**User's choice:** Hand-derived from COLREGS reference scenarios + worked trigonometry

| Option | Description | Selected |
|--------|-------------|----------|
| Per-function fixture files co-located with tests | Scoped, easy to find, matches flat src/domain/ shape | ✓ |
| One shared fixtures.ts for all geometry functions | Easier to browse at once, grows large over time | |

**User's choice:** Per-function fixture files co-located with tests

| Option | Description | Selected |
|--------|-------------|----------|
| toBeCloseTo with 2 decimal digits (~0.01 tolerance) | Catches real bugs, tolerant of floating-point noise | ✓ |
| toBeCloseTo with 4+ decimal digits | More likely to catch subtle errors but flakier | |
| Exact equality (no tolerance) | Fragile for CPA/TCPA outputs which are rarely round numbers | |

**User's choice:** toBeCloseTo with 2 decimal digits (~0.01 tolerance)

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — include geometry-only fixtures for all 3 classic encounter shapes | Lets Phase 2 reuse known-correct inputs, no duplicate derivation | ✓ |
| No — keep Phase 1 fixtures narrowly focused on math edge cases only | Classic geometries derived fresh in Phase 2 when needed | |

**User's choice:** Yes — include geometry-only fixtures for all 3 classic encounter shapes

---

## Claude's Discretion

- Exact module/file layout within `src/domain/` beyond the fixture co-location rule.
- Naming of additional `DegenerateCaseReason` union members beyond `no-closure` and `coincident-position`.

## Deferred Ideas

None — discussion stayed within Phase 1 scope.
