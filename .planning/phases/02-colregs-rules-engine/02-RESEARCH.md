# Phase 2: COLREGS Rules Engine - Research

**Researched:** 2026-07-15
**Domain:** Maritime collision-avoidance rules (COLREGS Rules 7, 12-15, 18) implemented as a pure TypeScript decision function
**Confidence:** MEDIUM-HIGH (rule text and priority ordering are HIGH confidence, verified against multiple authoritative sources; the exact head-on/crossing numeric boundary angle is a genuine COLREGS ambiguity — flagged LOW/ASSUMED with a recommended resolution)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Overtaking Persistence (Rule 13(d))**
- D-01: `classifyEncounter()` accepts an optional previous-classification parameter — `classifyEncounter(vesselA, vesselB, previous?)`. The function stays pure (same inputs -> same output); "previous" is an explicit input, not hidden state.
- D-02: A sticky "overtaking" classification releases back to fresh geometric evaluation exactly when the Rule 7 risk-of-collision gate fails — the same gate that determines whether a confident give-way verdict applies at all is reused as the single "finally past and clear" release mechanism. No separate distance threshold.
- D-03: When `previous` is not supplied, classification is derived fresh from geometry only — no bias, no hidden default.
- D-04: The Phase 2 fixture suite must include explicit hysteresis fixtures (e.g. feed `previous: 'overtaking'` alongside a current relative bearing that reads as crossing, assert result stays `'overtaking'`).

**Risk-of-Collision Threshold (Rule 7, CLAS-03)**
- D-05: Risk of collision requires both a positive TCPA (`tcpaMinutes > 0`) AND a DCPA at or under a distance threshold.
- D-06: The DCPA distance threshold is 1.0 nm.
- D-07: `cpa()`'s tagged `no-closure` result is treated as "no risk of collision" automatically.
- D-08: A negative TCPA always means "no risk," regardless of how small DCPA was. No grace window after CPA=0.

**Doubt-Band Width & Shape (CLAS-04)**
- D-09: The doubt band at the overtaking/crossing boundary (112.5° relative bearing) is ±5°.
- D-10: The head-on boundary (reciprocal heading, relative bearing ≈ 0°) uses the same ±5° width — one shared `DOUBT_BAND_DEGREES` constant applied symmetrically to both boundaries, rather than two independently-tuned values.
- D-11: When a case falls inside the doubt band, `classifyEncounter()` still returns one definite classification value plus a doubt flag — it does NOT introduce a distinct `'ambiguous'` `EncounterType` value.
- D-12: The doubt flag/reasoning identifies which specific boundary triggered it (e.g. `'near-overtaking-crossing-boundary'` vs `'near-head-on-boundary'`) rather than a single generic flag.

**Reasoning Trail Shape (RSON-01, RSON-02)**
- D-13: Each trail entry is a self-contained structured object: `{ ruleId: 'Rule 13', text: '...', facts: { relativeBearing: 135, ... } }`.
- D-14: The trail includes the full decision path, not just the winning rule — rules checked and explicitly ruled out appear alongside the rule that ultimately matched.
- D-15: Trail entries are ordered in evaluation order — Rule 7 gate -> Rule 13 -> Rule 14 -> Rule 15 -> Rule 18 — matching the actual dispatch sequence locked in CLAUDE.md.
- D-16: Trail entries carry raw numeric geometric facts (exact `relativeBearing`, `dcpaNm`, etc.), not just descriptive text.

### Claude's Discretion
- Exact `EncounterType`/`GiveWayResult` TypeScript shape and file/module layout within `src/domain/` beyond what D-13 constrains — follow CLAUDE.md's flat `src/domain/` structure and the Rule 13->14->15->18 decision-tree/strategy-dispatch pattern.
- Naming conventions for new `DegenerateCaseReason`/doubt-flag string literals beyond what's named here — extend the existing tagged-result pattern from Phase 1 as needed.
- Rule 18 vessel-type-hierarchy tie-break mechanics when both vessels share the same type or an equivalent-priority status (not-under-command / restricted-in-ability-to-maneuver) — not discussed explicitly in discussion; derived from COLREGS Rule 18's text and Phase 1's D-11 during this research (see Standard Stack / Code Examples "Rule 18 Priority Tier Lookup").

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within Phase 2 scope. No scope-creep suggestions came up during the discussion.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CLAS-01 | App classifies the encounter as head-on, crossing, or overtaking per COLREGS Rules 12-15, using relative bearing (not heading difference alone) | Architecture Patterns (Sequential Rule Dispatch), Common Pitfalls 1-2 (both-direction relative-bearing checks), Code Examples (verbatim Rule 13/14/15 text) |
| CLAS-02 | App evaluates overtaking before head-on/crossing per Rule 13's explicit precedence, and does not flip an established overtaking situation to crossing as bearing drifts | Architecture Patterns (Stage 2 sticky-overtaking check), Common Pitfall 4 (release-vs-soften trap), Code Examples (hysteresis fixture pattern) |
| CLAS-03 | App gates classification on risk of collision (Rule 7) so diverging/parallel vessels are not given a confident give-way verdict | Architecture Patterns (Stage 1 Rule 7 gate), Pattern 2 (isolated `riskOfCollision()` function), Code Examples (verbatim Rule 7 text) |
| CLAS-04 | App treats near-boundary cases (22.5°-abaft-the-beam, reciprocal-heading) as an explicit doubt/ambiguous state rather than a hard cutoff | Common Pitfall 3, Open Question 1 (head-on sector boundary), Assumption A1 |
| DETM-01 | App determines which vessel is give-way and which is stand-on, per Rules 13/14/15/17 | Architecture Patterns (Stages 3-5), Assumption A2 (Rule 17 scope boundary) |
| DETM-02 | App applies the Rule 18 vessel-type hierarchy as an override layer on top of the geometric baseline, treating "not under command" and "restricted in ability to maneuver" as co-equal status | Pattern 3 (Rule 18 Priority Tier Lookup), Code Examples (verbatim Rule 18 text + derived priority ranking), Assumption A3 |
| RSON-02 | The reasoning trail is produced as a byproduct of the same rule-evaluation logic that determines the verdict (not reverse-engineered after the fact) | Architecture Patterns (trail accumulation at every dispatch stage), Anti-Patterns ("re-deriving the reasoning trail after computing the verdict") |
</phase_requirements>

## Summary

Phase 2 has no new library research to do — CLAUDE.md already locks the pattern (plain TypeScript + Zod, no rules-engine library, no xstate) and 02-CONTEXT.md already locked the hard implementation decisions (D-01 through D-16: previous-classification parameter, Rule 7 gate thresholds, ±5° doubt band, reasoning-trail shape). What remains is domain research: pinning down the exact COLREGS Rule 12-15/18 boundary mechanics precisely enough to write correct fixtures and code, and resolving two directional-convention traps that are easy to get backwards.

The single most important finding is a **directional-convention risk already flagged in the phase brief, confirmed real by this research**: Rule 13(b)'s "22.5° abaft the beam" test must be evaluated from the perspective of the vessel **being overtaken**, using `relativeBearing(vesselBeingOvertaken, approachingVessel)` — not the reverse — and because a two-vessel scenario has no a-priori "own"/"contact" assignment, `classifyEncounter()` must run this check in **both directions** (is B overtaking A? is A overtaking B?) rather than picking one vessel as "own" up front. A second, related finding not previously flagged: **Rule 14's head-on test is inherently bidirectional too** — checking only `relativeBearing(A,B) ≈ 0` is insufficient (a vessel can appear dead ahead of A while A does not appear dead ahead of it, if their headings aren't reciprocal); both `relativeBearing(A,B)` and `relativeBearing(B,A)` must be near zero for a genuine head-on situation. Phase 1's own `reciprocalOffAxisCase` fixture already proves the mirror-image pitfall (reciprocal heading alone is insufficient); this research surfaces the missing complementary pitfall (small relative bearing alone, from only one side, is also insufficient).

The one open, genuinely unresolved question is **what numeric angle marks the edge of the head-on sector** (as opposed to overtaking's COLREGS-specified 112.5°, head-on has no equivalent number in the rule text itself — courts and commentary disagree, citing values from ~5° to ~20°). A recommended resolution grounded in the literature and consistent with 02-CONTEXT.md's D-10 is provided below, flagged `[ASSUMED]`.

**Primary recommendation:** Implement `classifyEncounter()` as a single sequential dispatch function (Rule 7 gate → Rule 13 both-directions check → Rule 14 both-directions check → Rule 15 residual → Rule 18 override), each stage appending a `{ruleId, text, facts}` entry to an accumulator array that becomes the returned `trail`; return a domain-specific result object (not a raw `Result<T>` reuse) that treats "no risk of collision" and "doubt" as valid `ok` outcomes, while still using `Result<T>` for genuine input-error propagation (`coincident-position`, `invalid-input`) from the composed `bearing()`/`relativeBearing()`/`cpa()` calls.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Encounter classification (head-on/crossing/overtaking) | Domain (`src/domain/colregs/`) | — | Pure derivation from geometric facts; CLAUDE.md mandates zero framework coupling |
| Risk-of-collision gate (Rule 7) | Domain (`src/domain/colregs/`) | — | Threshold logic composed on top of Phase 1's `cpa()` output; no new geometry |
| Give-way/stand-on determination (Rules 13-15, 18) | Domain (`src/domain/colregs/`) | — | Pure function of encounter type + vessel types; no I/O |
| Reasoning trail construction | Domain (`src/domain/colregs/`) | — | Must be a byproduct of the same evaluation path (RSON-02) — cannot live in a separate presentation-layer function |
| Reasoning trail rendering / citation display | Frontend (Phase 4) | — | Out of this phase's scope; Phase 2 only produces the structured data |
| Chart overlay of bearing lines/boundary arcs | Frontend (Phase 4) | — | Consumes `facts` from trail entries; Phase 2 does not render anything |
| Persistence of classification result | API/Backend (Phase 3) | — | Out of scope; SCEN-02 requires re-running classification from saved inputs, never trusting a stored verdict |

## Standard Stack

No new libraries for this phase. CLAUDE.md locks "plain TypeScript + Zod, NOT a rules-engine library" for the domain/rules layer — this phase composes only Phase 1's existing modules.

### Core (already installed, Phase 1)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| typescript | 7.0.2 | Type-safe decision-tree dispatch, discriminated unions for trail/result shapes | Locked project constraint |
| zod | 4.4.3 | N/A for new schemas this phase unless `EncounterType`/doubt-flag literals are Zod-validated at a boundary; `Vessel`/`VesselType` already defined in Phase 1 | Locked project constraint; reused, not re-declared |
| vitest | 4.1.10 | Fixture-driven unit tests for `classifyEncounter()` | Locked project constraint |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Plain TS sequential dispatch function | `json-rules-engine` or similar | Rejected in CLAUDE.md — COLREGS 11-18 are fixed published law, never runtime-edited; a JSON rules engine would weaken type-checking and make the "byproduct reasoning trail" requirement (RSON-02) harder to construct/test than a typed function |
| Plain TS sequential dispatch function | `xstate` | Rejected in CLAUDE.md — classification is a stateless per-call derivation (recomputed fresh from `vesselA`, `vesselB`, `previous` each call), not a time-based multi-step process |

**Installation:** none — no new packages required for this phase.

## Package Legitimacy Audit

Not applicable. This phase installs no external packages; it composes existing Phase 1 domain modules with plain TypeScript. `slopcheck`/registry verification is skipped per the protocol's own scope ("whenever this phase installs external packages").

## Architecture Patterns

### System Architecture Diagram

```
                     ┌─────────────────────────────────────────┐
                     │   classifyEncounter(vesselA, vesselB,    │
                     │              previous?)                  │
                     └───────────────────┬───────────────────────┘
                                         │
                     ┌───────────────────▼───────────────────────┐
                     │ Stage 0: geometry inputs                   │
                     │  relativeBearing(A,B), relativeBearing(B,A)│
                     │  cpa(A,B)                                  │
                     │  -> propagate invalid-input/coincident-    │
                     │     position as Result<T> failure          │
                     └───────────────────┬───────────────────────┘
                                         │ ok
                     ┌───────────────────▼───────────────────────┐
                     │ Stage 1: Rule 7 gate                        │
                     │  riskOfCollision = tcpaMinutes>0            │
                     │    && dcpaNm<=1.0nm (no-closure/negative    │
                     │    tcpa => false)                           │
                     │  -> trail.push({ruleId:'Rule 7', ...})      │
                     │  -> effectivePrevious = riskOfCollision      │
                     │       ? previous : undefined (D-02 release) │
                     └───────────────────┬───────────────────────┘
                                         │
                     ┌───────────────────▼───────────────────────┐
                     │ Stage 2: sticky overtaking check (D-01/02)  │
                     │  if effectivePrevious === 'overtaking'      │
                     │    -> encounterType='overtaking' (forced)   │
                     │    -> trail.push('Rule 13(d): sticky ...')  │
                     │    -> SKIP stage 3 geometric re-derivation  │
                     │       of type (still run Rule 18 stage)     │
                     └───────────────────┬───────────────────────┘
                                         │ not sticky
                     ┌───────────────────▼───────────────────────┐
                     │ Stage 3: Rule 13 (both directions)          │
                     │  |relativeBearing(A,B)| > 112.5±5?          │
                     │  |relativeBearing(B,A)| > 112.5±5?          │
                     │  -> trail.push(matched or ruled-out entry)  │
                     └───────────────────┬───────────────────────┘
                                         │ not overtaking
                     ┌───────────────────▼───────────────────────┐
                     │ Stage 4: Rule 14 (both directions, ≈0°)     │
                     │  |relativeBearing(A,B)| AND                │
                     │  |relativeBearing(B,A)| both within         │
                     │  head-on sector (see Pitfall/Open Question) │
                     │  -> trail.push(matched or ruled-out entry)  │
                     └───────────────────┬───────────────────────┘
                                         │ not head-on
                     ┌───────────────────▼───────────────────────┐
                     │ Stage 5: Rule 15 (residual/catch-all)       │
                     │  encounterType = 'crossing'                 │
                     │  give-way = vessel with other on her        │
                     │    starboard side (positive relativeBearing)│
                     │  -> trail.push('Rule 15: crossing, ...')    │
                     └───────────────────┬───────────────────────┘
                                         │
                     ┌───────────────────▼───────────────────────┐
                     │ Stage 6: Rule 18 override                   │
                     │  compare vessel-type priority tiers         │
                     │  if differ AND would reverse baseline        │
                     │    -> flip give-way/stand-on                 │
                     │  -> trail.push('Rule 18: ...' incl. no-op)  │
                     └───────────────────┬───────────────────────┘
                                         │
                     ┌───────────────────▼───────────────────────┐
                     │ return ok({ encounterType, riskOfCollision, │
                     │   giveWay, standOn, doubt, trail })         │
                     └─────────────────────────────────────────────┘
```

A reader can trace any two-vessel input through: geometry computation -> risk gate -> sticky-overtaking check -> Rule 13 -> Rule 14 -> Rule 15 -> Rule 18 override -> final verdict + full trail, matching the evaluation order locked by D-15.

### Recommended Project Structure
```
src/domain/colregs/
├── classify-encounter.ts          # the pure dispatch function (Stages 0-6 above)
├── classify-encounter.test.ts     # co-located tests
├── classify-encounter.fixtures.ts # hand-derived fixtures incl. hysteresis + boundary cases (D-04, D-13)
├── risk-of-collision.ts           # Rule 7 gate as its own small pure function (isolates D-05-D-08 threshold logic, independently unit-testable)
├── risk-of-collision.test.ts
├── risk-of-collision.fixtures.ts
├── vessel-priority.ts             # Rule 18 tier lookup + override decision, isolated for direct unit testing of tie-break mechanics
├── vessel-priority.test.ts
├── vessel-priority.fixtures.ts
└── types.ts                       # EncounterType, GiveWayResult, ReasoningTrailEntry, DoubtBoundary, ClassificationResult
```
Splitting `risk-of-collision.ts` and `vessel-priority.ts` out from the main dispatch function follows the same "small pure function, own fixture file" convention Phase 1 established for `bearing`/`relativeBearing`/`cpa`, and makes Rule 7's threshold logic and Rule 18's tie-break mechanics independently testable without going through the full dispatch — directly useful given both are called out as needing careful boundary-value testing.

### Pattern 1: Sequential Rule Dispatch with Trail Accumulation
**What:** A single function that runs each rule check in a fixed order, pushing a trail entry (whether matched or ruled out) at every stage it actually executes, and short-circuiting only the *classification* decision (not the trail accumulation) once a match is found.
**When to use:** Any fixed, small, non-reorderable rule sequence where the "why" of a ruled-out check is as valuable as the final match — exactly RSON-02's requirement.
**Example (shape, not full implementation):**
```typescript
// src/domain/colregs/classify-encounter.ts
function evaluateOvertaking(
  vesselA: Vessel, vesselB: Vessel,
  rbAtoB: number, rbBtoA: number,
): { matched: 'A-overtakes-B' | 'B-overtakes-A' | null; entries: ReasoningTrailEntry[] } {
  const entries: ReasoningTrailEntry[] = [];
  // B overtaking A: bearing FROM A TO B (rbAtoB) is >112.5 abaft A's beam --
  // A is the vessel being overtaken, B is the overtaking vessel (Rule 13(b)).
  const bOvertakesA = Math.abs(rbAtoB) > OVERTAKING_BOUNDARY_DEGREES;
  const aOvertakesB = Math.abs(rbBtoA) > OVERTAKING_BOUNDARY_DEGREES;
  if (bOvertakesA) {
    entries.push({ ruleId: 'Rule 13', text: 'Vessel B is overtaking Vessel A (bearing from A to B is more than 22.5° abaft A\'s beam).', facts: { relativeBearingAtoB: rbAtoB } });
    return { matched: 'B-overtakes-A', entries };
  }
  if (aOvertakesB) {
    entries.push({ ruleId: 'Rule 13', text: 'Vessel A is overtaking Vessel B (bearing from B to A is more than 22.5° abaft B\'s beam).', facts: { relativeBearingBtoA: rbBtoA } });
    return { matched: 'A-overtakes-B', entries };
  }
  entries.push({ ruleId: 'Rule 13', text: 'Not overtaking in either direction -- both relative bearings are forward of the 112.5° abaft-the-beam threshold.', facts: { relativeBearingAtoB: rbAtoB, relativeBearingBtoA: rbBtoA } });
  return { matched: null, entries };
}
```
This shape generalizes directly to Rule 14 (both-direction check against the head-on sector) and Rule 15 (residual, no check needed — just an entry).

### Pattern 2: Isolated Threshold Function for Rule 7
**What:** `riskOfCollision(cpaResult: Result<{tcpaMinutes, dcpaNm}>): boolean` as its own tiny pure function.
**When to use:** Always, for this phase — keeps D-05-D-08's threshold logic (both-conditions-required, no-closure=false, negative-TCPA=false) independently fixture-tested without needing a full vessel pair + dispatch.
```typescript
// src/domain/colregs/risk-of-collision.ts
import type { Result } from '../shared/result.js';

export const RISK_OF_COLLISION_DCPA_THRESHOLD_NM = 1.0; // D-06

export function riskOfCollision(
  cpaResult: Result<{ tcpaMinutes: number; dcpaNm: number }>,
): boolean {
  if (!cpaResult.ok) {
    // D-07: 'no-closure' (parallel/matching-course) = no risk.
    // 'invalid-input'/'coincident-position' should already have been
    // propagated as a classifyEncounter()-level failure before this
    // function is reached -- if it IS reached with a non-'no-closure'
    // err, treat conservatively as no risk rather than throwing.
    return false;
  }
  // D-05 + D-08: BOTH must hold -- positive TCPA (still closing) AND
  // DCPA at/under the threshold. Negative TCPA (already past CPA) is
  // always "no risk," regardless of how small DCPA was (D-08).
  return cpaResult.value.tcpaMinutes > 0
    && cpaResult.value.dcpaNm <= RISK_OF_COLLISION_DCPA_THRESHOLD_NM;
}
```

### Pattern 3: Rule 18 Priority Tier Lookup
**What:** A numeric priority map plus a pure comparison function, so "does the override reverse the geometric baseline" is a single readable comparison, not nested conditionals.
```typescript
// src/domain/colregs/vessel-priority.ts
import type { VesselType } from '../vessel/vessel.js';

// Lower number = higher priority = "must be given way to." NUC and
// restricted-in-ability-to-maneuver are explicitly co-equal (Rule 18
// gives no ranking between them -- both rank above fishing, which ranks
// above sailing, which ranks above power-driven). Verified against Rule
// 18(a)-(c) text directly (see Sources).
const PRIORITY: Record<VesselType, number> = {
  'not-under-command': 1,
  'restricted-in-ability-to-maneuver': 1,
  'fishing': 2,
  'sailing': 3,
  'power-driven': 4,
};

export function vesselPriority(type: VesselType): number {
  return PRIORITY[type];
}

// Returns true only when the type hierarchy would REVERSE the
// geometrically-determined give-way vessel -- i.e. the geometric
// give-way vessel has a strictly HIGHER-priority (lower number) type
// than the geometric stand-on vessel. Equal priority (including the
// NUC/RIATM tie) -> no override, geometric baseline stands unchanged.
export function rule18Overrides(
  geometricGiveWayType: VesselType,
  geometricStandOnType: VesselType,
): boolean {
  return vesselPriority(geometricGiveWayType) < vesselPriority(geometricStandOnType);
}
```

### Anti-Patterns to Avoid
- **Single-direction relative-bearing check for overtaking or head-on:** Computing `relativeBearing(vesselA, vesselB)` once and using it to decide both "is A overtaking B" and "is B overtaking A" (or both directions of head-on) silently inverts results whenever the two vessels are on different headings. Always compute both `relativeBearing(A,B)` and `relativeBearing(B,A)` and check the correct direction for each rule (see Pitfall 1 and Pitfall 2 below).
- **Re-deriving the reasoning trail after computing the verdict:** RSON-02 explicitly requires the trail be a byproduct of the same evaluation path. Do not compute `encounterType`/`giveWay` first and then write a second function that "explains" the result by re-inspecting bearings — accumulate trail entries inline, at each dispatch stage, as shown in Pattern 1.
- **Treating `previous` as hidden/mutable state:** D-01 requires `previous` stay an explicit function parameter. Do not reach for module-level state, a class instance, or a React ref to carry it — that breaks purity and testability.
- **Clamping or defaulting Rule 7's no-closure/negative-TCPA cases to some intermediate "maybe risk" value:** D-07/D-08 are unconditional — both collapse to `riskOfCollision = false`, no partial credit.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bearing/relative-bearing/CPA math | New trigonometry in this phase | Phase 1's `bearing()`, `relativeBearing()`, `cpa()` | Already implemented, fixture-tested, and this phase's own CONTEXT.md explicitly says "no new CPA/TCPA math needed in Phase 2" |
| Angle normalization | Ad-hoc modulo arithmetic inside `classifyEncounter` | Reuse the already-normalized outputs of `relativeBearing()` ((-180,180]) directly | Re-normalizing would risk reintroducing the exact off-by-one boundary bug Phase 1's D-08/exactBoundaryCase already solved |
| Rule sequencing / precedence logic | A generic "rule engine" abstraction (priority queues, rule registries, plugin-style rule objects) | A plain sequential function per Pattern 1 | CLAUDE.md explicitly rejects rules-engine libraries and, by extension, home-grown equivalents — Rules 7/13/14/15/18 are a fixed 5-stage sequence, never reordered at runtime |

**Key insight:** Every piece of "hard" math this phase needs already exists in Phase 1. Phase 2's actual complexity is entirely in getting the *directional conventions* (which vessel is "own" for each check) and the *boundary/doubt mechanics* right — not in writing new formulas.

## Common Pitfalls

### Pitfall 1: Overtaking direction inversion
**What goes wrong:** Computing `relativeBearing(vesselA, vesselB)` once, then using its magnitude to decide "is this an overtaking situation" without checking which vessel is being overtaken, silently swaps give-way and stand-on, or misses the case where the *other* vessel is the one overtaking.
**Why it happens:** Rule 13(b)'s test is defined from a single vessel's point of view ("coming up with another vessel from a direction more than 22.5° abaft **her** beam" — "her" = the vessel being overtaken). In a two-vessel function there is no a-priori "her" — both assignments are possible and must be checked.
**How to avoid:** Compute `relativeBearing(A, B)` (bearing to B as seen from A) AND `relativeBearing(B, A)` (bearing to A as seen from B). `|relativeBearing(A,B)| > 112.5°` means **B is overtaking A** (A is being overtaken); `|relativeBearing(B,A)| > 112.5°` means **A is overtaking B**. These are two independent checks, not mirror images of the same number.
**Warning signs:** A fixture where swapping which vessel is passed as `vesselA` vs `vesselB` changes which vessel is classified as give-way for what should be a symmetric physical scenario is a strong signal this got inverted. `[VERIFIED: COLREGS Rule 13(b) text via WebSearch, cross-checked navcen.uscg.gov / ecolregs.com / marinepublic.com]`

### Pitfall 2: Head-on classified from only one vessel's relative bearing
**What goes wrong:** Classifying head-on whenever `relativeBearing(A,B) ≈ 0`, without also checking `relativeBearing(B,A) ≈ 0`, misclassifies as head-on a case where B momentarily appears dead ahead of A but the two are actually on a near-perpendicular course (a crossing situation) — because A appearing dead-ahead-of-B does NOT by itself imply reciprocal headings.
**Why it happens:** Algebraically, `relativeBearing(A,B) ≈ relativeBearing(B,A)` **only** holds when the two headings are (nearly) reciprocal — it is not a general identity. Checking one side alone silently assumes the reciprocal-heading condition rather than verifying it.
**How to avoid:** Require both `|relativeBearing(A,B)|` and `|relativeBearing(B,A)|` to fall within the head-on sector before classifying head-on. This automatically enforces the "nearly reciprocal courses" language of Rule 14(a) using only `relativeBearing()` calls (no separate heading-difference computation needed), directly satisfying CLAS-01's "using relative bearing (not heading difference alone)" instruction while still correctly requiring reciprocity as a side effect of checking both directions.
**Warning signs:** Phase 1's existing `reciprocalOffAxisCase` fixture (reciprocal headings, but off-axis bearing) proves headings-alone is insufficient; the mirror-image gap (bearing-alone-from-one-side without reciprocal headings) has no equivalent fixture yet in Phase 1 and must be added in Phase 2's own fixture suite as an explicit "one-sided-only, not actually head-on" case. `[ASSUMED — derived by this research from the bearing-symmetry algebra above, not stated verbatim in COLREGS text or in CONTEXT.md; logically follows from Rule 14(a)'s "reciprocal or nearly reciprocal courses" requirement combined with Rule 14(b)'s bearing-based test]`

### Pitfall 3: No COLREGS-specified numeric threshold for the head-on/crossing sector boundary
**What goes wrong:** Assuming a specific degree value (5°, 6°, 10°, etc.) for where "head-on" ends and "crossing" begins is settled/official, when it is not.
**Why it happens:** Rule 13 gives an explicit number (22.5° abaft the beam = 112.5° relative bearing). Rule 14 gives none — it only says "ahead or nearly ahead," "masthead lights in a line," and defers to Rule 14(c)'s "when in doubt, assume head-on" as the actual legal tie-break mechanism, precisely because no universal numeric boundary exists.
**How to avoid:** Treat the head-on/crossing boundary angle as a deliberately chosen, documented project constant (not a rediscovered COLREGS fact), and lean on Rule 14(c)'s own doubt-favoring philosophy — which is already what 02-CONTEXT.md's D-11 chose (a definite classification + doubt flag, never a hard cutoff).
**Warning signs:** If a fixture cites "COLREGS defines head-on as within 6°" as an established fact, that citation should be corrected — it is commentary/case-law practice, not statute. `[VERIFIED: multiple independent sources (see Sources) agree the COLREGS text itself gives no numeric head-on threshold; the ~5-6° figures found are practitioner rule-of-thumb and a single reported case-law citation, not a codified rule]`

### Pitfall 4: Rule 7 gate release accidentally re-biases hysteresis instead of releasing it
**What goes wrong:** If the "gate failed -> release sticky overtaking" logic (D-02) is implemented as merely *skipping* the sticky check but still passing `previous` through to bias the geometric re-evaluation somehow (e.g., "prefer overtaking if it's close"), it silently reintroduces exactly the drift-based flip-flopping D-02 exists to prevent, just delayed by one gate-failure cycle.
**Why it happens:** It's tempting to treat "release" as "soften" rather than "fully discard."
**How to avoid:** When the Rule 7 gate fails, `effectivePrevious` must become `undefined` outright (D-03's "no bias, no hidden default" fresh-evaluation path) before Stage 3 runs — not merely `previous` demoted to a hint.
**Warning signs:** A fixture asserting "after Rule 7 gate fails once, classification is fully symmetric with a fresh scenario that never had `previous` set at all" is the correct regression test for this. `[VERIFIED: directly from 02-CONTEXT.md D-02/D-03, cross-checked for internal consistency by this research]`

## Code Examples

### COLREGS rule text (verbatim, for citation accuracy in trail `text` fields)

**Rule 7(a), (d)(i)-(ii) — Risk of collision:**
> "Every vessel shall use all available means... to determine if risk of collision exists. If there is any doubt such risk shall be deemed to exist... In determining if risk of collision exists the following considerations shall be among those taken into account: (i) such risk shall be deemed to exist if the compass bearing of an approaching vessel does not appreciably change; (ii) such risk may sometimes exist even when an appreciable bearing change is evident."
`[CITED: navcen.uscg.gov / ecfr.gov 33 CFR 83.07, cross-verified against ecolregs.com, cultofsea.com]`

**Rule 13(a)-(c) — Overtaking:**
> "(a) Notwithstanding anything contained in Rules 4-18, any vessel overtaking any other shall keep out of the way of the vessel being overtaken. (b) A vessel shall be deemed to be overtaking when coming up with another vessel from a direction more than 22.5 degrees abaft her beam... (c) When a vessel is in any doubt as to whether she is overtaking another, she shall assume that this is the case and act accordingly."
`[CITED: navcen.uscg.gov, cross-verified against ecolregs.com, marinepublic.com, corpuslegalis.com]`

**Rule 14(a)-(c) — Head-on situation:**
> "(a) When two power-driven vessels are meeting on reciprocal or nearly reciprocal courses so as to involve risk of collision each shall alter her course to starboard... (b) Such a situation shall be deemed to exist when a vessel sees the other ahead or nearly ahead... (c) When a vessel is in any doubt as to whether such a situation exists she shall assume that it does exist and act accordingly."
`[CITED: navcen.uscg.gov, cross-verified against cultofsea.com, aluko-oyebode.com]`

**Rule 15 — Crossing situation:**
> "When two power-driven vessels are crossing so as to involve risk of collision, the vessel which has the other on her own starboard side shall keep out of the way and shall, if the circumstances of the case admit, avoid crossing ahead of the other vessel."
`[CITED: law.cornell.edu 33 CFR 83.15, cross-verified against cultofsea.com, ecolregs.com]`

**Rule 18(a)-(c) — Responsibilities between vessels:**
> "Except where Rules 9, 10 and 13 otherwise require: (a) A power-driven vessel underway shall keep out of the way of: (i) a vessel not under command; (ii) a vessel restricted in her ability to manoeuvre; (iii) a vessel engaged in fishing; (iv) a sailing vessel. (b) A sailing vessel underway shall keep out of the way of: (i) a vessel not under command; (ii) a vessel restricted in her ability to manoeuvre; (iii) a vessel engaged in fishing. (c) A vessel engaged in fishing when underway shall, so far as possible, keep out of the way of: (i) a vessel not under command; (ii) a vessel restricted in her ability to manoeuvre."
`[CITED: seamanship.ie, cross-verified against cultofsea.com, ecolregs.com, imorules.com, ialacolreg.com]`
**Derived priority ranking (highest to lowest, this project's 5 modeled types only — "constrained by draught" excluded, not modeled per Phase 1):** not-under-command = restricted-in-ability-to-maneuver (co-equal, no rule text ranks one above the other) > fishing > sailing > power-driven. `[VERIFIED: derived directly from Rule 18(a)-(c)'s "keep out of the way of" lists — each tier's obligations strictly nest the tier(s) above it — cross-checked against a summary ranking independently stated by legalclarity.org/skippercheck.net]`

### Fixture pattern for the overtaking-direction check (extends Phase 1's `relativeBearing.fixtures.ts` convention)
```typescript
// src/domain/colregs/classify-encounter.fixtures.ts
// Reuses Phase 1's overtakingCase geometry directly (D-16 cross-phase reuse).
// own=A is the vessel being overtaken; contact=B is overtaking. Per Pitfall 1,
// this fixture must also assert the REVERSE call (classifyEncounter(B, A))
// does NOT also report B as being overtaken -- exactly one direction fires.
export const overtakingAOvertakenByB = {
  vesselA: { position: { x: 0, y: 0 }, heading: 0, speed: 8, type: 'power-driven' as const },
  vesselB: { position: { x: 5, y: -8.660254 }, heading: 0, speed: 15, type: 'power-driven' as const },
  expectedEncounterType: 'overtaking' as const,
  expectedGiveWay: 'vesselB' as const, // the overtaking vessel keeps clear (Rule 13(a))
  expectedStandOn: 'vesselA' as const,
};

// Hysteresis fixture (D-04): same geometry as above but bearing has drifted
// into the crossing sector; previous='overtaking' must keep it overtaking.
export const overtakingHysteresisHoldsCase = {
  vesselA: { position: { x: 0, y: 0 }, heading: 0, speed: 8, type: 'power-driven' as const },
  vesselB: { position: { x: 5, y: 0 }, heading: 270, speed: 15, type: 'power-driven' as const }, // relative bearing to B from A is 90 deg -- reads as crossing geometrically
  previous: 'overtaking' as const,
  expectedEncounterType: 'overtaking' as const, // sticky, per D-02
};
```

## State of the Art

Not applicable in the usual "library version drift" sense — COLREGS Rules 7/12-18 date to the 1972 convention (in force, unamended for these specific rules). No "old approach / new approach" version table applies. The one relevant currency note: this research used 2026-dated web sources reflecting the current, still-standing text of Rules 7, 13, 14, 15, and 18 as published via the U.S. Navigation Center's amalgamated international/inland rules (the standard authoritative mirror of the IMO convention text for U.S.-based reference).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The head-on/crossing sector boundary angle should be modeled as coincident with the shared `DOUBT_BAND_DEGREES` (5°) itself — i.e., the entire ±5° zone around dead-ahead is both the head-on sector AND its own doubt band, with no separate wider "confident head-on" core beyond it | Common Pitfalls (Pitfall 3), Open Questions #1 | If the planner/user intends a wider head-on core (e.g., ±10-15° core with doubt only at the outer edge, matching some ASV-literature conventions), fixtures built around this assumption at exactly 5°/10° would need every head-on/crossing boundary fixture re-derived; low risk of incorrect *verdicts* either way since Rule 14(c)'s doubt-favors-head-on default is preserved regardless of which interpretation is chosen, but fixture values and doubt-flag trigger points would differ |
| A2 | Rule 17 (stand-on vessel's own subsequent-maneuver obligations) requires no code in `classifyEncounter()` — it governs what the stand-on vessel does procedurally over time, not the give-way/stand-on determination itself, and Phase 2 is an explicitly stateless snapshot classification | Phase Requirements (DETM-01) | If DETM-01's "Rules 13/14/15/17" listing was intended to require Rule 17(a)(ii)'s specific doubt-based stand-on action logic inside this phase's output, some additional trail/result field might be expected; low risk since v1 REQUIREMENTS.md's own text for DETM-01 focuses on "which vessel is give-way and which is stand-on," not on the stand-on vessel's follow-up maneuver, and RSON-V2-01 (Rule 17(a)(ii) doubt situations) is explicitly deferred to v2 |
| A3 | "Vessel constrained by her draught" (Rule 18(d)) is correctly out of scope for the priority ranking, since Phase 1's `VesselType` models only 5 types and this status isn't one of them | Code Examples (Rule 18 priority ranking) | None if Phase 1's 5-type model is final for v1 (it is, per PROJECT.md's Out-of-Scope list and Phase 1's D-11) |

## Open Questions (RESOLVED)

1. **What numeric angle marks the head-on/crossing sector boundary?**
   - What we know: Rule 13 gives an explicit number (112.5° relative bearing / 22.5° abaft the beam) verified directly from the rule text. Rule 14 gives no equivalent number — only qualitative language ("ahead or nearly ahead") plus a doubt-favors-head-on tie-break (14(c)). Practitioner sources converge loosely around 5-6° as a "rule of thumb," and one academic critical-analysis paper explicitly notes "variety in criteria for defining the head-on sector in the literature" — confirming there is no single settled value.
   - What's unclear: Whether 02-CONTEXT.md's D-10 ("uses the same ±5° width") intends that 5° to be the ENTIRE head-on sector half-width (Assumption A1, this research's recommendation) or merely the doubt-band width around some separate, larger core sector value that was left unspecified.
   - Recommendation: Adopt A1 (the ±5° band IS the sector) for planning purposes — it requires no additional undocumented constant, is internally consistent with D-09's structure (one shared constant, "rather than two independently-tuned values"), and is defensible against the literature (closest reported values cluster at 5-6°, not larger). Flag this as a fast confirm-or-adjust checkpoint early in Phase 2 planning rather than blocking on it — the fixture suite structure is identical either way, only the exact boundary constant changes.
   - **RESOLVED:** 02-02-PLAN.md Task 1 adopts Assumption A1 directly — the head-on sector is defined as `|relativeBearing| <= DOUBT_BAND_DEGREES` (5°) on both sides, with no separate wider "confident head-on" core. Every head-on classification therefore always carries `doubt: true, doubtBoundary: 'near-head-on-boundary'`. See 02-02-PLAN.md Task 1's `<behavior>` block (constants + Stage 4 description) and the `headOnBoundaryInclusiveCase`/`justOutsideHeadOnSectorCase` fixtures that fixture-verify the exact 5°/5.5° edge.

2. **Does Rule 15's "starboard side" test need special-casing when relative bearing is exactly 0° or exactly 180°?**
   - What we know: Rule 15's give-way test is "the vessel which has the other on her own starboard side" — operationally, `relativeBearing(vessel, other) > 0` (contact to starboard, using this project's clockwise-positive convention) and inside the crossing sector (not overtaking, not head-on).
   - What's unclear: Exact 0°/180° relative bearing values should already be routed to head-on (0°) or excluded as impossible/undefined for crossing given the dispatch order (Rule 15 only runs after Rule 13 and Rule 14 have both failed to match) — so in practice this shouldn't arise, but it's worth an explicit fixture proving the dispatch order alone handles it rather than needing extra crossing-specific guard logic.
   - Recommendation: No new logic needed; add one fixture confirming Rule 15's residual branch is only reached with `|relativeBearing|` outside both the overtaking and head-on sectors.
   - **RESOLVED:** 02-02-PLAN.md Task 1's dispatch order guarantees this — Stage 5 (Rule 15) only runs after Stage 3 (Rule 13) and Stage 4 (Rule 14) have both ruled out their sectors, so `relBearingAtoB` can never be exactly 0° (would have matched Stage 4's head-on sector) or land on an undefined boundary when Stage 5 executes; no additional guard logic was added. See 02-02-PLAN.md Task 1's Stage 5 description ("relBearingAtoB is never exactly 0 or the sign-flip boundary at this stage since Stages 3-4 already excluded the overtaking/head-on sectors") and Task 2's Rule 18/Stage 0 fixtures which exercise the dispatch order.

## Environment Availability

No new external dependencies for this phase (pure composition of existing Phase 1 modules). Confirmed the existing toolchain from Phase 1 is still present and unchanged:

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Running Vitest/TypeScript | ✓ | v22.23.1 | — |
| Vitest | Test runner for fixtures | ✓ | 4.1.10 | — |
| TypeScript | Type-checked domain code | ✓ | 7.0.2 | — |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none.

## Security Domain

`security_enforcement` is absent from `.planning/config.json` (treated as enabled per default). This phase, however, is a pure, framework-free domain function with no I/O, no network boundary, no auth/session surface, and no persistence — the vast majority of ASVS categories do not apply at this layer.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth surface in this phase — pure function |
| V3 Session Management | No | No session/state carried across calls (previous is an explicit param, not session state) |
| V4 Access Control | No | No access-controlled resource in this phase |
| V5 Input Validation | Yes | `Vessel`/`VesselType`/`Position` already validated via Phase 1's `VesselSchema` (Zod) at the boundary before reaching `classifyEncounter()`; the function itself must still defensively handle non-finite numbers bypassing the schema via direct object construction (already Phase 1's established pattern — `Number.isFinite` guards, propagated via `Result<T>`) |
| V6 Cryptography | No | No cryptographic operations in this phase |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malformed/non-finite numeric input bypassing Zod validation via direct object-literal construction (e.g., in tests, or a future untrusted API boundary) | Tampering | `Number.isFinite` guards on all numeric inputs before arithmetic, returning `Result<T>` failures rather than propagating `NaN`/`Infinity` silently into a verdict — already Phase 1's established convention, must be continued for any new numeric derivations this phase adds (e.g., the Rule 7 threshold comparison itself takes already-validated `Result<T>` output from `cpa()`, so no new raw-input surface is introduced) |

No other threat patterns apply — this phase has no network, storage, or credential surface.

## Sources

### Primary (HIGH confidence)
- Phase 1 source files read directly: `src/domain/vessel/vessel.ts`, `src/domain/shared/result.ts`, `src/domain/geometry/bearing.ts`, `src/domain/geometry/relative-bearing.ts`, `src/domain/geometry/cpa.ts`, `src/domain/geometry/relative-bearing.fixtures.ts`, `src/domain/geometry/cpa.fixtures.ts`, `src/domain/geometry/relative-bearing.test.ts` — used to ground all recommended function signatures, conventions, and fixture patterns in actual, existing code.
- `.planning/phases/02-colregs-rules-engine/02-CONTEXT.md` — locked implementation decisions D-01 through D-16, quoted/extended directly.
- `.planning/phases/01-domain-foundations/01-CONTEXT.md` — D-11 (co-equal vessel-type priority), D-16 (classic-encounter fixture reuse).
- `CLAUDE.md` — Technology Stack section, locks the plain-TS-no-rules-engine pattern this research builds on.

### Secondary (MEDIUM confidence)
- [USCG Navigation Center — Amalgamated Navigation Rules](https://www.navcen.uscg.gov/navigation-rules-amalgamated) — Rule 7, 13, 14, 18 text, cross-verified against multiple independent commentary sites.
- [33 CFR 83.15 — Crossing situation (Cornell Legal Information Institute)](https://www.law.cornell.edu/cfr/text/33/83.15) — Rule 15 exact text (U.S. codification of the IMO rule).
- [33 CFR 83.07 — Risk of collision (eCFR)](https://www.ecfr.gov/current/title-33/chapter-I/subchapter-E/part-83/subpart-B/subject-group-ECFRc711a0393c57020/section-83.07) — Rule 7 exact text.
- [ecolregs.com Rule 13](https://ecolregs.com/index.php?option=com_k2&view=item&layout=item&id=55&Itemid=388&lang=en), [Rule 14](https://ecolregs.com/index.php?option=com_k2&view=item&layout=item&id=56&Itemid=389&lang=en), [Rule 18](https://ecolregs.com/index.php?option=com_k2&view=item&layout=item&id=58&Itemid=391&lang=en) — cross-verification of rule text.
- [Seamanship Centre — Rule 18](https://seamanship.ie/col-regs-rule-18-responsibilities-between-vessels/), [cultofsea.com Rule 18](https://www.cultofsea.com/colregs/part-b-steering-and-sailing-rules-4-19/rule-18-responsibilities-between-vessels/), [imorules.com Rule 18](https://www.imorules.com/GUID-D5EFD3EB-ADF3-43C5-B184-95E819464773.html), [ialacolreg.com Rule 18](https://ialacolreg.com/en/colreg/rule-18) — Rule 18(a)-(c) text and priority ranking, cross-verified across 4 independent sources.
- [legalclarity.org — COLREGs Rule 18 Vessel Hierarchy](https://legalclarity.org/colregs-rule-18-vessel-hierarchy-and-who-gives-way/), [skippercheck.net Rule 18 simulator](https://skippercheck.net/colreg-simulator/responsibilities-between-vessels) — independent statement of the derived priority ranking, used to cross-check the ranking this research derived directly from rule text.
- [Aluko & Oyebode — Rule 14 head-on situation, KIVELI/AFINA I case](https://www.aluko-oyebode.com/insights/colregs-rule-14-head-on-situation-collision-case-kiveli-afina/) — case-law discussion of "nearly reciprocal course" ambiguity, "6 degrees or more = crossing" citation.
- [TransNav — On Determination of the Head-on Situation Under Rule 14](https://www.transnav.eu/files/On_Determination_of_the_Headon_Situation_Under_Rule_14_of_Colreg72,246.pdf) — academic treatment confirming the head-on sector boundary is not numerically settled (fetch returned non-extractable binary content; title/abstract-level relevance only, not full-text-verified).
- [ScienceDirect — COLREGs and their application in collision avoidance algorithms: A critical analysis](https://www.sciencedirect.com/science/article/pii/S0029801822013592) — explicitly notes "variety in criteria for defining the head-on sector in the literature."

### Tertiary (LOW confidence)
- General "5 degree rule of thumb" and "6 degrees" figures surfaced via aggregated WebSearch summaries rather than a single verified primary document — treated as practitioner convention, not codified rule (see Pitfall 3, Open Question 1, Assumption A1).

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries; Phase 1's existing, already-tested modules are the entire dependency surface.
- Architecture (dispatch pattern, trail accumulation, Rule 18 priority ranking): HIGH — directly derived from verified rule text and CONTEXT.md's own locked decisions.
- Rule 13/Rule 14 directional-check pitfalls: HIGH — derived from verified rule text plus straightforward bearing-symmetry algebra, independently checkable.
- Head-on/crossing numeric boundary value: LOW — genuinely unsettled in COLREGS text and secondary literature; flagged as Assumption A1 / Open Question 1 rather than asserted.
- Pitfalls: HIGH — each is either directly derivable from verified rule text or from Phase 1's own existing fixture logic.

**Research date:** 2026-07-15
**Valid until:** Indefinite for the rule-text/priority-ranking findings (COLREGS 1972 Rules 7/13/14/15/18 are stable, unamended law). 30 days for the "Claude's Discretion" implementation-shape recommendations, in case planning surfaces a different preference.
