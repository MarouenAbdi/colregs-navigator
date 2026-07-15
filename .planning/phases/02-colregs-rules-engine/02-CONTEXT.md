# Phase 2: COLREGS Rules Engine - Context

**Gathered:** 2026-07-15
**Status:** Ready for planning

<domain>
## Phase Boundary

`classifyEncounter()` — a pure domain function that, given two `Vessel`s (from Phase 1) and an optional previous classification, determines the encounter type (head-on, crossing, overtaking) per COLREGS Rules 12–15, applies Rule 7's risk-of-collision gate, applies the Rule 18 vessel-type-hierarchy override on top of the geometric baseline, and returns an ordered reasoning trail as a byproduct of the same evaluation path. Builds directly on Phase 1's `bearing()`, `relativeBearing()`, `cpa()`/`tcpa()`, and `Vessel`. Zero framework dependencies. No UI, no persistence — those are Phase 4 and Phase 3/5 respectively.

</domain>

<decisions>
## Implementation Decisions

### Overtaking Persistence (Rule 13(d))
- **D-01:** `classifyEncounter()` accepts an **optional previous-classification parameter** — `classifyEncounter(vesselA, vesselB, previous?)`. The function stays pure (same inputs → same output); "previous" is an explicit input, not hidden state. This lets Rule 13(d)'s "once overtaking, always overtaking until finally past and clear" be implemented and fixture-tested entirely within Phase 2, without waiting for Phase 4's UI to exist.
- **D-02:** A sticky "overtaking" classification **releases back to fresh geometric evaluation exactly when the Rule 7 risk-of-collision gate fails** (see D-05–D-08) — i.e., the same gate that determines whether a confident give-way verdict applies at all is reused as the single "finally past and clear" release mechanism. No separate distance threshold for this.
- **D-03:** When `previous` is **not supplied** (first render of a scenario, freshly loaded saved scenario), classification is derived fresh from geometry only — no bias, no hidden default, consistent with Phase 1's no-hidden-defaults convention.
- **D-04:** The Phase 2 fixture suite **must include explicit hysteresis fixtures** — e.g., feed `previous: 'overtaking'` alongside a current relative bearing that reads as crossing, and assert the result stays `'overtaking'`. This directly tests CLAS-02 now rather than deferring verification to Phase 4 integration testing.

### Risk-of-Collision Threshold (Rule 7, CLAS-03)
- **D-05:** Risk of collision requires **both** a positive TCPA (still closing, `tcpaMinutes > 0`) **and** a DCPA at or under a distance threshold. A vessel that will eventually pass but is currently very far away is not a *current* collision risk — matches real navigational practice and keeps confident give-way verdicts limited to genuinely close encounters.
- **D-06:** The DCPA distance threshold is **1.0 nm**. Chosen as a round, easily-documented/tunable value appropriate for this synthetic nm-scale sandbox (vessels typically a few nm to a few tens of nm apart per CLAUDE.md).
- **D-07:** `cpa()`'s tagged **`no-closure`** result (parallel/matching-course vessels, D-06 from Phase 1) is treated as **"no risk of collision"** automatically — constant, non-closing bearing is the textbook "no risk" case Rule 7 exists to exclude.
- **D-08:** A **negative TCPA** (closest approach already occurred, vessels now diverging) **always means "no risk,"** regardless of how small DCPA was. No grace window after CPA=0. This is consistent with D-02's overtaking-release condition (Rule 7 gate failing = "past and clear").

### Doubt-Band Width & Shape (CLAS-04)
- **D-09:** The doubt band at the **overtaking/crossing boundary** (112.5° relative bearing — 22.5° abaft the beam — on each side) is **±5°**. Moderate width: catches genuinely near-boundary drift without over-flagging the ordinary crossing sector.
- **D-10:** The **head-on boundary** (reciprocal heading, relative bearing ≈ 0°) uses the **same ±5° width** — one shared `DOUBT_BAND_DEGREES` constant applied symmetrically to both boundaries, rather than two independently-tuned values.
- **D-11:** When a case falls inside the doubt band, `classifyEncounter()` still returns **one definite classification value** (per Rule 14's own "when in doubt, assume it exists" text) **plus a doubt flag** — it does NOT introduce a distinct `'ambiguous'` `EncounterType` value. Keeps the type simple; Phase 4's UI checks the doubt flag to render a caveat rather than handling a 4th top-level classification state.
- **D-12:** The doubt flag/reasoning **identifies which specific boundary** triggered it (e.g. `'near-overtaking-crossing-boundary'` vs `'near-head-on-boundary'`) rather than a single generic flag — richer reasoning trail, directly serves RSON-01/02's explainability goal.

### Reasoning Trail Shape (RSON-01, RSON-02)
- **D-13:** Each trail entry is a **self-contained structured object**: `{ ruleId: 'Rule 13', text: '...', facts: { relativeBearing: 135, ... } }` — rule id, plain-language text, AND the matched raw geometric facts together, so Phase 4 can render the citation and overlay exact geometry without recomputing anything.
- **D-14:** The trail includes the **full decision path, not just the winning rule** — rules that were checked and explicitly ruled out (e.g. "Rule 13: not overtaking — relative bearing 45° is forward of the beam") appear alongside the rule that ultimately matched. This directly serves RSON-02's "byproduct of the same evaluation path" requirement and the project's domain-modeling-depth portfolio goal.
- **D-15:** Trail entries are ordered in **evaluation order** — Rule 7 gate → Rule 13 → Rule 14 → Rule 15 → Rule 18 — matching the actual dispatch sequence locked in CLAUDE.md's decision-tree design. The trail literally IS the evaluation path, in the order it happened.
- **D-16:** Trail entries **carry raw numeric geometric facts** (exact `relativeBearing`, `dcpaNm`, etc.), not just descriptive text. Required for RSON-03 (Phase 4) so the chart overlay (bearing line, overtaking boundary arc) is pixel-accurate and derived from the same numbers that produced the verdict — never recomputed separately in the UI layer.

### Claude's Discretion
- Exact `EncounterType`/`GiveWayResult` TypeScript shape and file/module layout within `src/domain/` beyond what D-13 constrains — follow CLAUDE.md's flat `src/domain/` structure and the Rule 13→14→15→18 decision-tree/strategy-dispatch pattern.
- Naming conventions for new `DegenerateCaseReason`/doubt-flag string literals beyond what's named here (e.g. `'near-overtaking-crossing-boundary'`, `'near-head-on-boundary'`) — extend the existing tagged-result pattern from Phase 1 as needed.
- Rule 18 vessel-type-hierarchy tie-break mechanics when both vessels share the same type or an equivalent-priority status (not-under-command / restricted-in-ability-to-maneuver) — not discussed explicitly; derive from COLREGS Rule 18's text and Phase 1's D-11 (co-equal-priority framing) during planning/research.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Tech stack & architecture decisions (locked)
- `CLAUDE.md` — Technology Stack section: locks the pure `classifyEncounter()` pattern (no rules-engine library, no xstate), the Rule 13→14→15→18 decision-tree/strategy-dispatch structure, the `src/domain/` framework-free boundary rule, and the exact bearing/relative-bearing/CPA formulas this phase consumes.

### Project scope & requirements
- `.planning/PROJECT.md` — Core Value statement (correct classification + transparent explanation) and Out-of-Scope list (no multi-vessel, no lights/sound-signal rules — keeps Rule 18 override scope to the 5 vessel types already modeled).
- `.planning/REQUIREMENTS.md` — CLAS-01 through CLAS-04 (classification requirements mapped to this phase), DETM-01/DETM-02 (give-way/stand-on determination, Rule 18 hierarchy), RSON-02 (reasoning trail as evaluation byproduct).
- `.planning/ROADMAP.md` — Phase 2 section (goal, 5 success criteria, requirements mapping).
- `.planning/STATE.md` — Blockers/Concerns section flags Phase 2 as needing deeper research during planning (`--research-phase`) on the exact doubt-band width, Rule 7 risk-of-collision formula, and sector-boundary conventions. **This discussion locked those values (D-05–D-12)** — research should verify/refine, not re-derive from scratch.

### Prior phase context (Phase 1 — this phase builds directly on it)
- `.planning/phases/01-domain-foundations/01-CONTEXT.md` — Locks the axis convention (x=east, y=north), `Result<T>` degenerate-case pattern, angle-normalization boundaries ([0,360) true bearing, (-180,180] relative bearing), and the 5-vessel-type model (D-11 there: `not-under-command` and `restricted-in-ability-to-maneuver` are co-equal, distinct statuses) that DETM-02's Rule 18 hierarchy must respect.

No other external specs, ADRs, or design docs exist for this phase.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/domain/vessel/vessel.ts` — `Vessel`, `Position`, `VesselType` (5-value enum), Zod schemas. Direct input type for `classifyEncounter()`.
- `src/domain/shared/result.ts` — `Result<T>`, `ok()`, `err()`, `DegenerateCaseReason` union, `assertUnreachable()`. The doubt-band flags and any new degenerate cases in Phase 2 should extend this same tagged-result pattern rather than inventing a new error-signaling convention.
- `src/domain/geometry/bearing.ts` — `bearing(a, b): Result<number>`, `[0, 360)`, atan2(dx, dy) convention.
- `src/domain/geometry/relative-bearing.ts` — `relativeBearing(own, contact): Result<number>`, `(-180, 180]`. This is the primary geometric input for the overtaking/crossing/head-on boundary checks (D-09–D-12).
- `src/domain/geometry/cpa.ts` — `cpa(vesselA, vesselB): Result<{ tcpaMinutes, dcpaNm }>`, with the `NEAR_ZERO_RELATIVE_VELOCITY_SQ`-gated `'no-closure'` tag already implemented. Directly powers the Rule 7 gate (D-05–D-08) — no new CPA/TCPA math needed in Phase 2, only threshold logic on top of the existing output.

### Established Patterns
- Every Phase 1 geometry function returns `Result<T>`, never throws/NaN/silent defaults for degenerate cases — `classifyEncounter()` should follow the same convention for its own inputs (e.g. propagate `bearing()`/`cpa()` failures rather than re-wrapping them, per `relativeBearing()`'s existing "propagate unchanged" pattern).
- Fixtures are hand-derived, per-function, co-located with tests (`*.fixtures.ts` next to `*.test.ts`) — Phase 2's `classifyEncounter.fixtures.ts` should follow the same convention, including the hysteresis fixtures required by D-04.

### Integration Points
- `classifyEncounter()` will call `relativeBearing()` (for boundary classification) and `cpa()` (for the Rule 7 gate) directly — both already exist and are fixture-tested; Phase 2 composes them rather than reimplementing geometry.
- Phase 1's `01-CONTEXT.md` D-16 notes the fixture suite already includes geometry-only fixtures for the 3 classic encounter shapes (head-on, crossing, overtaking) — Phase 2 can reuse these as known-correct starting inputs for its own classification fixtures instead of re-deriving them.

</code_context>

<specifics>
## Specific Ideas

No particular UI/example references — Phase 2 is pure domain logic with no visual surface (chart overlay rendering is Phase 4, per D-16). The concrete deliverable beyond code is a fixture suite deep enough to demonstrate the full Rule 7→13→14→15→18 decision path (D-14), which doubles as the auditable proof of correctness for interviewers reviewing this portfolio project.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 2 scope. No scope-creep suggestions came up during this discussion.

</deferred>

---

*Phase: 2-COLREGS Rules Engine*
*Context gathered: 2026-07-15*
