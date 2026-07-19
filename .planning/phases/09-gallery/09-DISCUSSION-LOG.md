# Phase 9: Gallery - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-19
**Phase:** 9-Gallery
**Areas discussed:** Gallery card data & labels, Card mini-chart preview

---

## Gallery card data & labels

| Option | Description | Selected |
|--------|-------------|----------|
| Match design exactly | Update `curated-scenarios.ts` to the design's 6 labels; reuse Phase 8's already-verified not-under-command/in-doubt vessel geometry | ✓ |
| Keep current 6 as-is | No `src/server/db/` changes, ships faster, but cards won't literally match the design's labels/rule badges | |

**User's choice:** Match design exactly.
**Notes:** None.

| Option | Description | Selected |
|--------|-------------|----------|
| Use design text verbatim | Matches the locked "design followed exactly" project convention | ✓ |
| Claude drafts fresh copy | Same factual content, different wording | |

**User's choice:** Use design text verbatim.

| Option | Description | Selected |
|--------|-------------|----------|
| Drop the stand-on-mirror entry (#2) | Design shows exactly 6 cards, no mirror-pair entry | ✓ |
| Keep as 7th entry | Preserves mirror-pair coverage, but a 7-card grid the design doesn't show | |

**User's choice:** Drop it.

| Option | Description | Selected |
|--------|-------------|----------|
| Reseed as part of this phase | Standard dev-DB reseed, same mechanism as Phase 5; no production data at stake | ✓ |
| Defer reseeding to a follow-up | Land the code/data changes without running the reseed now | |

**User's choice:** Reseed as part of this phase.

---

## Card mini-chart preview

| Option | Description | Selected |
|--------|-------------|----------|
| Build the mini-chart | Parametrized static SVG per card, following Hero's static-SVG precedent | ✓ |
| Text/badge-only cards | Faster, but visually diverges from the design | |

**User's choice:** Build the mini-chart.

| Option | Description | Selected |
|--------|-------------|----------|
| Reduced detail, matching what the design shows | Vessel triangles + role badges + connecting line only | ✓ |
| Full Hero-level richness, scaled down | Grid, range rings, dashed heading vectors at a smaller size | |

**User's choice:** Reduced detail, matching what the design shows.

---

## Claude's Discretion

- Exact location for the two new shared vessel-geometry fixture literals (domain fixtures file vs. another shared location).
- Whether to extract shared static-chart geometry helpers into `src/components/shared/` now, following the project's "extract on second real consumer" convention, or keep Gallery's version independent for this phase.
- Exact `CuratedScenario` type/shape change needed to add the `title` field.
- Gallery grid's intermediate breakpoint between the 3-column desktop and 1-column mobile layout (no tablet mock exists).

## Deferred Ideas

None — discussion stayed within Phase 9's scope. The "Embed gallery on home page instead of separate route" todo was folded into scope (it *is* this phase), not deferred.
