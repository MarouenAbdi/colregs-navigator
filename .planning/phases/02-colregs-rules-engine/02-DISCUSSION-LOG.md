# Phase 2: COLREGS Rules Engine - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-15
**Phase:** 2-COLREGS Rules Engine
**Areas discussed:** Overtaking persistence, Risk-of-collision threshold, Doubt-band width & shape, Reasoning trail shape

---

## Overtaking Persistence

| Option | Description | Selected |
|--------|-------------|----------|
| Optional previous-result param | `classifyEncounter(vesselA, vesselB, previous?)` stays pure but can honor "once overtaking, stay overtaking" directly; CLAS-02 becomes fixture-testable now | ✓ |
| Snapshot-only in Phase 2 | Function ignores history entirely; Phase 4's React state layer decides whether to override a fresh result | |

**User's choice:** Optional previous-result param (recommended)
**Notes:** Chosen so CLAS-02's "does not flip" requirement can be unit-tested in Phase 2 without waiting for Phase 4's UI to exist.

| Option | Description | Selected |
|--------|-------------|----------|
| Risk-of-collision gate fails | Reuse the Rule 7 gate as the single shared "finally past and clear" release mechanism | ✓ |
| Separate distance threshold | Independent "clear" distance specific to releasing overtaking | |
| Never releases in Phase 2 scope | Overtaking stays sticky forever within this phase's scope; release logic deferred | |

**User's choice:** Risk-of-collision gate fails (recommended)
**Notes:** One shared mechanism, no separate threshold to maintain.

| Option | Description | Selected |
|--------|-------------|----------|
| Derive fresh from geometry only | No previous input = no bias, matches Phase 1's no-hidden-defaults convention | ✓ |
| Require caller to always pass something | Mandatory previous-classification parameter with an explicit "none" sentinel | |

**User's choice:** Derive fresh from geometry only (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — explicit hysteresis fixtures | Directly tests CLAS-02's "does not flip" requirement now | ✓ |
| No — defer to Phase 4 integration testing | Trust the logic conceptually; verify only once the sandbox exists | |

**User's choice:** Yes — explicit hysteresis fixtures (recommended)

---

## Risk-of-Collision Threshold

| Option | Description | Selected |
|--------|-------------|----------|
| Both TCPA>0 AND DCPA ≤ threshold | Matches real navigational practice; distance-gates confident give-way verdicts | ✓ |
| TCPA>0 alone is sufficient | Any closing trajectory counts regardless of eventual miss distance | |

**User's choice:** Both TCPA>0 AND DCPA ≤ threshold (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| 1.0 nm | Round, easy to document/tune later; fits this synthetic nm-scale sandbox | ✓ |
| 0.5 nm | Tighter "close-quarters" reading | |

**User's choice:** 1.0 nm (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — no-closure means no risk | Parallel/non-closing courses are the textbook "no risk" case | ✓ |
| No — needs separate handling | Treat as its own case requiring additional logic | |

**User's choice:** Yes — no-closure means no risk (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — negative TCPA always means no risk | Once past closest approach and diverging, no current risk regardless of miss distance | ✓ |
| Short grace window after TCPA=0 | Treat a brief period just after TCPA=0 as still "at risk" | |

**User's choice:** Yes — negative TCPA always means no risk (recommended)
**Notes:** Consistent with the Overtaking-persistence release condition.

---

## Doubt-Band Width & Shape

| Option | Description | Selected |
|--------|-------------|----------|
| ±5° | Moderate band — catches near-boundary drift without over-flagging the ordinary crossing sector | ✓ |
| ±2° | Tight band — only truly borderline degrees flagged | |
| ±10° | Wide, conservative band — leans harder into "when in doubt" | |

**User's choice:** ±5° (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Same width for both boundaries | One shared DOUBT_BAND_DEGREES constant applied symmetrically | ✓ |
| Separate value for head-on | Independent tunable width for Rule 14's boundary | |

**User's choice:** Same width for both boundaries (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Definite classification + doubt flag | Matches Rule 14's "assume it exists" text; keeps EncounterType simple | ✓ |
| Distinct 'ambiguous' classification value | EncounterType becomes a 4-state union; UI must handle a new state | |

**User's choice:** Definite classification + doubt flag (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Identify the specific boundary | Richer reasoning trail, shows exactly which COLREGS ambiguity clause applies | ✓ |
| Generic flag only | Simpler doubt signal, doesn't distinguish which boundary | |

**User's choice:** Identify the specific boundary (recommended)

---

## Reasoning Trail Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Rule id + plain text + matched facts | Self-contained entries; Phase 4 can render citation and overlay geometry without recomputation | ✓ |
| Rule id + plain text only | Raw geometric numbers live only on the top-level result object | |

**User's choice:** Rule id + plain text + matched facts (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Full path incl. ruled-out checks | Shows the full decision-tree traversal — serves domain-modeling-depth goal and RSON-02 | ✓ |
| Only the winning path | Terser, omits rejected branches of the dispatch | |

**User's choice:** Full path incl. ruled-out checks (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Evaluation order | Rule 7 → 13 → 14 → 15 → 18, matching the actual dispatch sequence | ✓ |
| Verdict-first, then supporting detail | Lead with the final rule/verdict, then supporting checks | |

**User's choice:** Evaluation order (recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — raw numeric facts per entry | Required for RSON-03's pixel-accurate chart overlay, derived from the same numbers that produced the verdict | ✓ |
| No — text only, UI recomputes geometry | Phase 4 calls bearing()/cpa() again itself for chart overlay numbers | |

**User's choice:** Yes — raw numeric facts per entry (recommended)

---

## Claude's Discretion

- Exact `EncounterType`/`GiveWayResult` TypeScript shape and file/module layout within `src/domain/` beyond what the reasoning-trail entry shape constrains.
- Naming conventions for new `DegenerateCaseReason`/doubt-flag string literals beyond `'near-overtaking-crossing-boundary'` and `'near-head-on-boundary'`.
- Rule 18 vessel-type-hierarchy tie-break mechanics when both vessels share the same type or an equivalent-priority status — not discussed explicitly; derive from COLREGS Rule 18's text and Phase 1's co-equal-priority framing (D-11) during planning/research.

## Deferred Ideas

None — discussion stayed within Phase 2 scope throughout.
