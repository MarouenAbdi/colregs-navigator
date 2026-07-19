---
phase: 09-gallery
reviewed: 2026-07-19T00:00:00Z
depth: standard
files_reviewed: 19
files_reviewed_list:
  - app/page.tsx
  - prisma/migrations/20260719100808_add_curated_title_and_rule_label/migration.sql
  - prisma/schema.prisma
  - prisma/seed.ts
  - src/components/gallery/GalleryCard.test.tsx
  - src/components/gallery/GalleryCard.tsx
  - src/components/gallery/GalleryContainer.test.tsx
  - src/components/gallery/GalleryContainer.tsx
  - src/components/gallery/GalleryPreviewChart.test.tsx
  - src/components/gallery/GalleryPreviewChart.tsx
  - src/components/gallery/gallery-preview-geometry.test.ts
  - src/components/gallery/gallery-preview-geometry.ts
  - src/components/hero/HeroPreviewCard.tsx
  - src/components/hero/hero-preview-geometry.ts
  - src/components/sandbox/vessel-role.ts
  - src/components/shared/static-chart-geometry.ts
  - src/domain/colregs/classify-encounter.fixtures.ts
  - src/server/db/curated-scenarios.test.ts
  - src/server/db/curated-scenarios.ts
  - src/server/db/scenario-repository.ts
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
fixed_after_review: [WR-01, WR-03]
---

# Phase 9: Code Review Report

**Reviewed:** 2026-07-19T00:00:00Z
**Depth:** standard
**Files Reviewed:** 19
**Status:** issues_found

## Summary

Reviewed the Gallery feature (curated scenarios seed data, gallery domain fixtures reuse, `GalleryContainer`/`GalleryCard`/`GalleryPreviewChart`, and the shared static-chart geometry extracted from Hero), including the post-manual-QA state of `GalleryCard.tsx`/`GalleryContainer.tsx` (commit `a0c70d2`'s four fixes are present and correct: `SectionGridBackground`, `font-semibold` body text, `border` utility on the card, and the shared `Badge` for the verdict chip).

No security or crash-level defects were found — no injection vectors, no hardcoded secrets, no unsafe queries (Prisma's generated client is used throughout), no unhandled promise rejections. However, I traced the actual per-card geometry math for all 6 real curated scenarios (not just the unit-test fixtures) and found a genuine, provable rendering defect: the "Overtaking" gallery card's stand-on vessel heading vector is computed to extend past the SVG's own viewBox and will be clipped. I also found a stale/self-contradicting schema comment and a duplicated component pattern the project's own conventions call out to avoid.

## Warnings

### WR-01: Fixed-length heading vector clips outside the SVG viewBox on the real "Overtaking" gallery card — FIXED (commit b8f6867)

**Resolution:** Verified the reviewer's hand-traced geometry computationally (confirmed viewBox and screenY values exactly), then clamped the heading-vector endpoint to the chart's own viewBox bounds (4px margin) locally in `GalleryPreviewChart.tsx`'s `VesselMarker`, leaving Hero's fixed-scale usage of the shared function untouched. Added a regression test in `GalleryPreviewChart.test.tsx` using the exact curated "Overtaking" card geometry, asserting both vessels' heading-vector endpoints stay within `[0, 360] x [0, 240]`. Full suite (209/209) and `tsc --noEmit` pass.

**File:** `src/components/shared/static-chart-geometry.ts:21-32`, consumed by `src/components/gallery/GalleryPreviewChart.tsx:52,72-80`

**Issue:** `HEADING_VECTOR_LENGTH_PX = 70` is a fixed *screen-pixel* length. It was originally correct for `HeroPreviewCard.tsx`, which always renders against one hand-solved, fixed `HERO_VIEW_BOX` (6 x 3.75 NM over a 320px-wide canvas ⇒ ~53 px/NM, constant). `GalleryPreviewChart.tsx` reuses the same constant unscaled, but its viewBox is *recomputed per card* by `computeCardViewBox()` from each curated scenario's real vessel separation (which the project's own research doc says spans 1.0–10.0 NM across the 6 cards) — so the screen-px-per-NM scale varies by roughly an order of magnitude between cards.

Concretely, for `displayOrder: 2` ("Overtaking", `src/server/db/curated-scenarios.ts:64-76`, built from `overtakingBothDirectionsCase` with the vesselA/vesselB roles swapped), the two vessels are only 1 NM apart and both share heading `0` (parallel courses, as required for an overtaking geometry). Working through `computeCardViewBox` + `chartToScreen` by hand for this exact entry:

- `computeCardViewBox` yields `viewBox = { minX: -0.854, minY: -1.169, width: 2.208, height: 1.472 }` (uniform scale ≈163 px/NM, vs. Hero's fixed ≈53 px/NM).
- The trailing/overtaken vessel (`vesselB`, the slower ship, at chart `(0, 0)`) maps to `screenY ≈ 49.4`.
- Its heading is `0` (north/up), so `headingVectorEndpoint` computes the dashed vector's endpoint at `screenY - 70 ≈ -20.6` — outside the `viewBox="0 0 360 240"` region entirely.

SVG's default `overflow: hidden` on the root `<svg>` (plus the wrapping `overflow-hidden` div) means roughly 20 of the vector's 70px will be silently clipped at the top edge of this specific, real, shipped gallery card. This isn't a hypothetical edge case — it's one of exactly 6 cards this feature ships. It also isn't caught by any test, since `GalleryPreviewChart.test.tsx` only asserts DOM text presence (jsdom does no layout/pixel math).

**Fix:** Scale `HEADING_VECTOR_LENGTH_PX` (or an equivalent per-call parameter) by each chart's own px-per-NM ratio, e.g. pass `pxPerNm = GALLERY_CONTAINER_SIZE.width / viewBox.width` into `headingVectorEndpoint` and use a NM-based length (e.g. `0.5 NM * pxPerNm`) instead of a hardcoded screen-pixel constant, or clamp the endpoint to stay within the container bounds before rendering. Alternatively, widen `PADDING_FRACTION` specifically for the axis a vessel's heading points toward, though a scale-aware vector length is the more robust fix since it addresses the root cause rather than one symptom.

### WR-02: `VesselMarker` (hull + label + pill) duplicated near-verbatim between Hero and Gallery instead of extracted to the shared module

**File:** `src/components/hero/HeroPreviewCard.tsx:62-82` vs. `src/components/gallery/GalleryPreviewChart.tsx:51-83`

**Issue:** `static-chart-geometry.ts` was correctly extracted once Gallery became "a real second consumer" of the hull path/heading-vector/midpoint *math* (per its own header comment and CLAUDE.md's "extract only on a real second consumer" convention). But the actual `VesselMarker` *component* — the hull `<path>` + label-circle `<g>` + role-pill `<g>` structure built on top of that math — is still hand-duplicated in both files, differing only in how the fill color is sourced (a literal hex prop in Hero vs. a `ROLE_HULL_FILL_CLASS[role]` Tailwind class in Gallery) and the pill text map. This is exactly the class of duplication CLAUDE.md's "No duplicated JSX for near-identical instances" convention warns about ("a rotation bug fixed in one vessel's block but not the other would have been invisible") — here the risk is a fix applied to one file's marker (e.g. the hull path, stroke width, or z-order) silently not applied to the other's.

**Fix:** Extract a shared `VesselMarker`-style presentational component into `src/components/shared/` (or a `static-chart-geometry.tsx` sibling) parameterized by a `fill: string` (already how Gallery's Tailwind class and Hero's hex color could both be expressed via a `className` or CSS custom property per the "no raw CSS in component files" convention) and `pillText: string`, and have both `HeroPreviewCard.tsx` and `GalleryPreviewChart.tsx` consume it.

### WR-03: Stale, self-contradicting comment on `isCurated`/`displayOrder`/`rationale` in the Prisma schema — FIXED (commit b8f6867)

**Resolution:** Updated the comment to state these fields are populated by `prisma/seed.ts` for curated rows as of Phase 9, removing the contradiction with the adjacent `title`/`ruleLabel` comment.

**File:** `prisma/schema.prisma:37-46`

**Issue:** The comment above `isCurated`/`displayOrder`/`rationale` (lines 37-38) still reads: *"Gallery fields (D-08/D-09) -- schema support only, no seed data this phase (D-07). Unused/null/default until Phase 5."* This phase (09-gallery) is exactly the phase that populates these fields (`prisma/seed.ts:39-57`, `src/server/db/curated-scenarios.ts`) and actively reads them (`GalleryContainer.tsx`, `scenario-repository.ts:findCurated`). The very next comment block (lines 42-44, for `title`/`ruleLabel`) directly contradicts the one above it: *"populated by prisma/seed.ts... same convention as `rationale` above"* — i.e., it asserts `rationale` is populated by the seed script, while the preceding comment asserts these fields are "unused... until Phase 5." A future reader hits an internal contradiction in the same file.

**Fix:** Update lines 37-38 to reflect the current state, e.g.: "Gallery fields (D-08/D-09) — populated by `prisma/seed.ts` for curated rows as of Phase 9; null for non-curated user-shared scenarios."

## Info

### IN-01: `GalleryContainer.test.tsx` is an unmocked integration test coupled to live seed data

**File:** `src/components/gallery/GalleryContainer.test.tsx:17-36`

**Issue:** Both tests call `await GalleryContainer()` directly, which internally calls the real `getCaller().gallery.list()` (a live tRPC caller backed by the real Prisma client — see `src/components/gallery/GalleryContainer.tsx:15`). The assertions hardcode "exactly 6 links" and specific curated titles ("Classic crossing", "In doubt"). This test will fail in any environment where `npx prisma db seed` hasn't been run, and will silently start failing for reasons unrelated to the code under test if the curated scenario count/titles ever change without a corresponding test update — it's testing seed-data content coupled through a live DB round-trip rather than exercising `GalleryContainer`'s own rendering logic in isolation.

**Fix:** Either mark this test as a documented integration test (e.g. a `describe.skip`-able suite or separate integration test path that CI runs only after seeding), or inject a fake/mocked `gallery.list()` result so the component test is hermetic and only verifies `GalleryContainer`'s own rendering contract (heading, count, hrefs) against controlled data.

### IN-02: Silent empty-string fallback for nullable curated fields can render a blank, still-clickable card

**File:** `src/components/gallery/GalleryContainer.tsx:41-43`

**Issue:** `title: row.title ?? ""`, `ruleLabel: row.ruleLabel ?? ""`, `description: row.rationale ?? ""` silently degrade to empty strings if a curated row is ever missing these (nullable per `prisma/schema.prisma`) fields, rather than filtering the row out or surfacing an error. In that state, `GalleryCard`'s `aria-label` becomes `"Load  scenario into the sandbox"` (double space, empty scenario name) and the card renders with a blank badge/title/description — a degraded, confusing UI with no visible signal that something is wrong, for what the codebase's own comments describe as a developer-facing invariant (curated data is meant to always be complete).

**Fix:** Either assert non-null at the boundary (mirroring the `!result.ok` throw pattern used elsewhere in this phase for curated-data invariants, e.g. `GalleryPreviewChart.tsx:92-100`) or filter out incomplete curated rows before rendering, so a missing field fails loudly during development rather than shipping a blank card.

---

_Reviewed: 2026-07-19T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
