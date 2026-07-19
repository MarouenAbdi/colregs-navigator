# Phase 9: Gallery - Research

**Researched:** 2026-07-19
**Domain:** Next.js App Router (route removal + redirect, server-rendered section composition), Prisma schema migration, static SVG data visualization (parametrized), Tailwind v4 responsive grid
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** The Gallery's 6 cards match the design's exact labels/rules — Classic crossing (Rule 15, A gives way), Head-on meeting (Rule 14, mutual), Overtaking (Rule 13, A gives way), Sailing has priority (Rule 18, A gives way), Not under command (Rule 18, A gives way), In doubt (Rule 7, mutual) — the same 6 labels Phase 8 already built for the Sandbox's chip row. `curated-scenarios.ts` (the DB seed data `gallery.list()` reads) is updated to match: its current 6 entries don't (no `not-under-command`/`in-doubt` case, a stand-on-mirror duplicate, no title field — see `08-CONTEXT.md` D-03 for the original discovery of this mismatch).
- **D-02:** The two new fixtures needed (`not-under-command`, `in-doubt`) reuse Phase 8's already-verified vessel geometry from `src/components/sandbox/chip-scenarios.ts` (`notUnderCommandVessels`, `inDoubtVessels`) rather than deriving new literals from scratch — that geometry is already tested against `classifyEncounter()` and visually proven in the Sandbox chips. Since `curated-scenarios.ts` (server layer) must not depend on `src/components/sandbox/` (UI layer) for a directional-dependency reason, planning should resolve exactly where the shared literal values live (e.g. new named exports in `src/domain/colregs/classify-encounter.fixtures.ts`, consumed by both `chip-scenarios.ts` and `curated-scenarios.ts`) — this is an implementation detail, not a further user decision.
- **D-03:** The current entry #2 ("stand-on crossing" — same geometry as entry #1, roles mirrored) is dropped. The design shows exactly 6 cards with no mirror-pair entry; keeping it would make Gallery a 7-card grid the design doesn't show.
- **D-04:** Card title + one-line description text is used **verbatim from the design image** (`Main-Design.png`), not freshly drafted. Exact text, transcribed directly from the design (see CONTEXT.md's `<specifics>` section) — `CuratedScenario` needs a new `title` field (currently only `rationale` exists, which is a longer explanatory sentence, not this punchier one-liner).
- **D-05:** `prisma/seed.ts` is updated for the new 6-entry curated set and the local dev DB is reseeded as part of this phase's work — no production/user data exists to lose (portfolio project, no auth). Same mechanism Phase 5 already used to seed the original 6 scenarios.
- **D-06:** Each of the 6 gallery cards gets a real static SVG mini-chart illustration (two vessel triangles, role badges, connecting line) — matching what `Main-Design.png` actually shows on every card — not a simplified text/badge-only treatment. Satisfies GAL-01's "matching the design's card grid exactly."
- **D-07:** The mini-chart is built at **reduced visual detail** relative to the Hero preview card — vessel triangles + role badges + connecting line only, no range rings/grid pattern/dashed heading vectors. This matches what's actually visible in the design at the gallery card's smaller size (Hero's full richness — grid, rings, radial gradient sector — is not present on the gallery cards in the design image). **Research correction:** see this document's "Common Pitfalls" / "Architecture Patterns Pattern 2" — direct pixel inspection of the design PNG shows dashed heading vectors ARE present on every card; only grid pattern/range rings/gradient sector are absent.
- **D-08 (carried from Hero's D-03 precedent):** This is a genuinely new, parametrized component (accepts a `vesselA`/`vesselB` pair per card, renders 6 times) — it does NOT reuse `HeroPreviewCard.tsx` directly (that component is hardcoded to one fixture) and does NOT share code with the live interactive `ChartPanel.tsx`, consistent with the established "decorative static illustration stays independent of the live chart" precedent from Hero.
- **D-09 (flagged for planning, not a user decision):** This is the second consumer of the "static mini polar-chart driven by a `Vessel` pair" pattern (Hero's `hero-preview-geometry.ts` was the first). Per this project's established convention ("Shared/decorative primitives: extract only on a real second consumer" — CLAUDE.md), planning should evaluate extracting the shared geometry helpers (`chartToScreen`, heading-vector endpoint, hull path constants) that both Hero's and Gallery's static illustrations need into `src/components/shared/`, rather than duplicating them a second time. Not a user preference — follows an already-locked codebase convention.

### Claude's Discretion

- Exact location for the two new shared vessel-geometry fixture literals (D-02) — domain fixtures file vs. another shared location; resolve during planning respecting the server/UI dependency direction.
- Whether to extract shared static-chart geometry helpers into `src/components/shared/` now (D-09) or keep Gallery's version independent for this phase — evaluate during planning against the actual code shape once both components exist side by side.
- Exact `CuratedScenario` type/shape change needed to add the `title` field (D-04).
- Gallery grid's intermediate breakpoint between the 3-column desktop layout and the 1-column mobile layout (GAL-01's "3 → 2 → 1 columns") — no tablet-width mock exists; derive a sensible middle breakpoint consistent with the project's existing 900px/640px convention.

### Deferred Ideas (OUT OF SCOPE)

None new — discussion stayed within Phase 9's scope.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GAL-01 | The curated gallery of preset encounters is embedded as a section on the home page below the Sandbox, matching the design's card grid exactly (responsive: 3 → 2 → 1 columns) | Architecture Patterns (Pattern 1–3, component structure), "Grid Breakpoints" section (concrete `grid-cols-1 min-[640px]:grid-cols-2 min-[900px]:grid-cols-3` recommendation, reusing existing project breakpoints), Code Examples (fixture sourcing table fixing the give-way-vessel mismatches that would otherwise violate "matching the design exactly") |
| GAL-02 | Clicking a gallery card loads that preset into the Sandbox above it (existing load-and-scroll behavior preserved) | System Architecture Diagram — confirms the existing `<Link href="/s/{id}">` → `app/s/[shareId]/page.tsx` → `SandboxContainer` pattern is unchanged; no new state-lifting mechanism needed |
| GAL-03 | The standalone `/gallery` route is removed; visiting it redirects (permanent redirect) to `/#gallery`, verified manually to work both from a fresh tab/bookmark and via in-app navigation | Code Examples ("exact `next.config.ts` `redirects()` addition", Context7-verified against locked Next.js 16.2.10), Anti-Patterns (delete `app/gallery/` entirely, don't leave a stub), Pitfall 5 (re-verified current codebase state for Pitfall 6 of `.planning/research/PITFALLS.md`) |
| GAL-04 | The Gallery section remains server-rendered (not client-fetched) so the `/#gallery` anchor scroll works on redirect | System Architecture Diagram + Recommended Project Structure (`GalleryContainer.tsx` as an async Server Component, same `await getCaller().gallery.list()` pattern as the current `app/gallery/page.tsx`) |

</phase_requirements>

## Summary

Phase 9 does three structurally independent things: (1) moves the Gallery's card-grid rendering from a standalone `/gallery` route onto the home page as a new server-rendered `<section id="gallery">`, with `next.config.ts`'s `redirects()` handling the old URL (verified current for the locked Next.js 16.2.10 via Context7 — `{ source: "/gallery", destination: "/#gallery", permanent: true }` is still the correct, unchanged API); (2) corrects `src/server/db/curated-scenarios.ts`'s seed data to match the 6 labels/rules the design and Phase 8's Sandbox chip row already define, which requires a Prisma schema migration (`title` column) and — critically — is a **bigger data fix than CONTEXT.md's D-01/D-02 framing suggests**: 2 of the 4 "already correct" entries (Overtaking, Sailing has priority) actually produce the **wrong give-way vessel** relative to the design's "A GIVES WAY" requirement and must be corrected, not just the 2 flagged-as-new entries; (3) builds a new parametrized static-SVG mini-chart component for the 6 cards, reusing the Hero's illustrative-chart precedent but at reduced detail — with one correction to CONTEXT.md's D-07: the design's actual PNG (verified by pixel-level crop, not the earlier screenshot pass) **does** show dashed heading-vector lines on every card; only the grid-pattern background and range rings/gradient sector are absent.

**Primary recommendation:** Source all 6 gallery entries' vessel geometry from the same values Phase 8 already verified in `chip-scenarios.ts` (reusing 2 identical existing domain fixtures as-is, slot-swapping a 3rd, and adding 3 new named fixture exports to `classify-encounter.fixtures.ts`) rather than patching the existing `curated-scenarios.ts` entries in place — this guarantees every card's give-way badge matches the design without hand-verifying trigonometry, and reuses `VerdictBanner.tsx`'s existing rule-badge derivation (`classifyingEntryIndex`/`ruleNumber`/doubt-override) and `vessel-role.ts`'s existing role/color derivation rather than reinventing either.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Gallery card grid rendering | Frontend Server (SSR) | — | Must be server-rendered (GAL-04) so `id="gallery"` exists at first paint; async Server Component, same pattern as current `app/gallery/page.tsx` |
| Curated scenario data (6 fixtures + title) | Database / Storage | Domain (fixture literals) | `Scenario` table rows (`isCurated: true`); the *literal vessel values* live in `src/domain/colregs/classify-encounter.fixtures.ts` (domain layer), the *persisted rows* live in Postgres via `prisma/seed.ts` |
| `/gallery` → `/#gallery` redirect | Frontend Server (SSR) | — | `next.config.ts` `redirects()` runs in Next's server-side routing layer, before any page/filesystem route is resolved (confirmed via Context7 — redirects take precedence over an existing `page.tsx` at the same path) |
| Gallery card mini-chart SVG | Browser / Client | — | Pure presentational SVG markup, computed server-side (no client JS/interactivity — same "static illustration" pattern as `HeroPreviewCard.tsx`) |
| Card click → scenario navigation | Browser / Client | Frontend Server (SSR) | A plain `<Link href="/s/{id}">`; navigation itself is client-side (Next `Link`), but the destination `/s/[shareId]` page is server-rendered |
| Rule/role badge derivation (GW/SO/MU, Rule N) | Browser / Client | — | Pure, framework-free-ish TS functions already existing in `src/components/sandbox/` (`vessel-role.ts`, `reasoning-trail-tag.ts`) — reused, not reimplemented |

## Standard Stack

No new external packages are introduced by this phase — it is entirely internal restructuring (route removal, SSR composition, a Prisma migration, and new static-SVG component code) using the project's already-locked stack (Next.js 16.2.10, React 19.2.7, Prisma 7.8.0, Tailwind v4, Vitest 4.1.10). See CLAUDE.md's Technology Stack section for the full locked-version table — nothing here supersedes it.

**Verified via `npx prisma --version` in this session:** prisma 7.8.0 / @prisma/client 7.8.0 / TypeScript 7.0.2 — matches CLAUDE.md's locked versions exactly `[VERIFIED: local CLI]`.

### Alternatives Considered

Not applicable — no new library decision this phase.

## Package Legitimacy Audit

No external packages are installed by this phase. Nothing to audit.

## Architecture Patterns

### System Architecture Diagram

```
Browser (fresh tab, bookmark to /gallery)
   |
   v
Next.js server routing layer
   |-- redirects() match: source "/gallery" -> 308 -> Location: /#gallery
   v
Browser follows redirect -> GET /
   |
   v
app/page.tsx (Server Component)
   |-- <Hero />
   |-- <section id="sandbox"><SandboxContainer /></section>
   |-- <section id="gallery">
   |      <GalleryContainer />              <-- NEW, async Server Component
   |            |
   |            v
   |      await getCaller().gallery.list()  <-- unchanged tRPC call
   |            |
   |            v
   |      src/server/api/routers/gallery.ts -> scenario-service.listGallery()
   |            |
   |            v
   |      src/server/db/curated-scenarios.ts (seed data, corrected)
   |            + classifyEncounter() re-derived on every read (D-06, unchanged)
   |            |
   |            v
   |      6x <GalleryCard>  -- each renders <GalleryPreviewChart vesselA vesselB />
   |            |
   |            v (click)
   |      <Link href="/s/{scenario.id}">  -- plain nav, no client state lift
   |   </section>
   v
Browser scrolls to #gallery (scroll-padding-top already set, app/globals.css:168)

app/s/[shareId]/page.tsx (unchanged) <- destination of every gallery-card click
   |-- SandboxContainer (pre-seeded with the clicked scenario)
```

### Recommended Project Structure

```
src/components/gallery/
├── GalleryContainer.tsx        # async Server Component: fetch + section chrome (eyebrow/heading/subhead) + grid
├── GalleryCard.tsx              # one card: mini-chart + Rule badge + role badge + title + description, wraps a <Link>
├── GalleryPreviewChart.tsx      # the parametrized static SVG mini-chart (accepts vesselA/vesselB)
├── gallery-preview-geometry.ts  # pure: per-card computed viewBox (bounding-box of the two vessels), NOT a fixed HERO_VIEW_BOX-style constant
├── GalleryContainer.test.tsx    # RTL: renders 6 cards, correct labels/badges, Link hrefs
└── gallery-preview-geometry.test.ts  # pure unit tests for the viewBox-bounding-box function

src/components/shared/
└── static-chart-geometry.ts     # NEW extraction candidate (see Don't Hand-Roll) -- headingVectorEndpoint, midpoint, HULL_PATH/HULL_STROKE/HULL_STROKE_WIDTH, moved out of hero-preview-geometry.ts once Gallery is a real second consumer

app/
├── page.tsx                     # add <section id="gallery"><GalleryContainer /></section> below #sandbox
├── gallery/                     # DELETED entirely (page.tsx + directory) -- redirects() makes it unreachable and dead
└── (next.config.ts gets a new top-level `redirects()` key)

src/domain/colregs/
└── classify-encounter.fixtures.ts   # +3 new named exports (see Code Examples) -- pure data, zero logic change
```

### Pattern 1: Reuse Hero's "static, fixture-driven, classifyEncounter()-backed illustration" pattern — but with per-card computed geometry, not a hand-solved fixed viewBox
**What:** `HeroPreviewCard.tsx` hand-solves ONE `HERO_VIEW_BOX` constant to fit its one hardcoded fixture (documented in `hero-preview-geometry.ts`'s comment: "This viewBox is solved... so heroPreviewVesselA/B's real NM coordinates land on those exact screen pixels"). Gallery has **6 different vessel pairs whose real-world range spans 1.0 NM to 10.0 NM** (computed directly from the literal position values, `[VERIFIED: arithmetic on this repo's own fixture literals]`):

| Card | Vessel range (Math.hypot) |
|---|---|
| Classic crossing | 5.0 NM |
| Head-on meeting | 5.0 NM |
| Overtaking | 1.0 NM |
| Sailing has priority | 5.0 NM |
| Not under command | 1.4 NM |
| In doubt | 10.0 NM |

A single fixed viewBox tuned to one of these would make the 1.0 NM pairs look like a cramped dot and the 10.0 NM pair overflow (or vice-versa). **When to use:** any parametrized-fixture chart component whose inputs vary in scale. **Recommendation:** write a pure `computeCardViewBox(vesselA, vesselB, aspectRatio, paddingFraction): ChartViewBox` in `gallery-preview-geometry.ts` — bounding box of both vessel positions, expanded by a padding fraction, forced to the card's fixed aspect ratio (matching the SVG's `viewBox` width/height ratio so `chartToScreen` doesn't distort). This is genuinely new logic (neither `ChartPanel.tsx`'s fixed 20nm box nor Hero's one-fixture hand-solve needs it), so per this project's "extract only on a real second consumer" convention it stays **Gallery-local**, not `shared/`, until something else needs dynamic-bbox-from-vessel-pair.

```typescript
// Source: derived from src/domain/geometry/screen-convert.ts's existing
// ChartViewBox shape — not a new geometry primitive, just a new way to
// compute one.
import type { ChartViewBox } from "../../domain/geometry/screen-convert.js";
import type { Position } from "../../domain/vessel/vessel.js";

export function computeCardViewBox(
  a: Position,
  b: Position,
  aspectRatio: number, // width / height, e.g. 320/200
  paddingFraction: number, // e.g. 0.35
): ChartViewBox {
  const minXRaw = Math.min(a.x, b.x);
  const maxXRaw = Math.max(a.x, b.x);
  const minYRaw = Math.min(a.y, b.y);
  const maxYRaw = Math.max(a.y, b.y);
  const rawWidth = Math.max(maxXRaw - minXRaw, 0.001); // guard coincident x
  const rawHeight = Math.max(maxYRaw - minYRaw, 0.001);

  const padX = rawWidth * paddingFraction;
  const padY = rawHeight * paddingFraction;
  let width = rawWidth + padX * 2;
  let height = rawHeight + padY * 2;
  const centerX = (minXRaw + maxXRaw) / 2;
  const centerY = (minYRaw + maxYRaw) / 2;

  // Force the box onto the card's fixed aspect ratio so chartToScreen
  // never distorts hull shapes.
  if (width / height > aspectRatio) {
    height = width / aspectRatio;
  } else {
    width = height * aspectRatio;
  }

  return { minX: centerX - width / 2, minY: centerY - height / 2, width, height };
}
```
**Confidence:** MEDIUM — the *need* for per-card dynamic sizing is HIGH confidence (verified by the 10x range spread above), but the exact padding/aspect constants are a reasonable engineering default, not extracted from the design file (each of the 6 mockup mini-charts was almost certainly hand-tuned by the designer per card, which a single formula can only approximate — visually compare against `Main-Design.png` during implementation and adjust `paddingFraction` if a card's vessels look off-center or clipped).

### Pattern 2: Design fidelity correction — Gallery mini-charts DO show dashed heading vectors; they do NOT show grid pattern, range rings, or a gradient bearing sector
**What:** CONTEXT.md's D-07 says the mini-chart has "no range rings/grid pattern/dashed heading vectors." A pixel-level crop of `Main-Design.png` (all 6 cards individually inspected) shows this is only 2/3 correct: **every card does render a short dashed heading-vector line from each hull**, colored to match that vessel's role (red dashed for give-way, green dashed for stand-on, slate dashed for mutual) — visually identical in technique to `HeroPreviewCard.tsx`'s `headingVectorEndpoint()`-driven dashed lines, just without Hero's grid pattern, concentric range rings, or radial gradient sector. Each card genuinely has: two hull triangles (role-colored, not the Hero's fixed A=red/B=green), a role-labeled circle badge ("A"/"B"), a small role pill under each hull ("GW"/"SO"/"MU" — note the 2-letter abbreviation for mutual, see Pitfall 3 below), a thin connector line with a floating range-label chip, and the dashed heading vectors. Card background is flat/dark (no grid), no rings, no gradient.
**When to use:** this is the literal spec for `GalleryPreviewChart.tsx` — build exactly this element set, nothing more, nothing less.
**Confidence:** HIGH — verified by direct pixel crop-and-zoom of the design source, not the coarser full-page screenshot pass CONTEXT.md's own research likely used.

### Pattern 3: Role-based hull/badge coloring, not vessel-slot-based
**What:** `HeroPreviewCard.tsx` hardcodes `VESSEL_A_HULL_COLOR = "#EF4444"` (red) and `VESSEL_B_HULL_COLOR = "#22C55E"` (green) — i.e., colored by which *argument slot* the vessel is in, not by its actual give-way/stand-on/mutual role. This happens to work for Hero because its one fixture always has vesselA as give-way. Gallery's "Head-on meeting" and "In doubt" cards are **mutual** (both hulls slate, `#94A3B8`, confirmed by pixel sampling and by matching `app/globals.css`'s already-defined `--mutual: #94A3B8` token exactly) — a hardcoded-by-slot approach would incorrectly render them red/green. Gallery must derive hull color from the actual computed role, via the **already-existing** `getVesselRole()` + `ROLE_HULL_FILL_CLASS` from `src/components/sandbox/vessel-role.ts` (`fill-give-way`/`fill-stand-on`/`fill-mutual`, backed by `--give-way`/`--stand-on`/`--mutual` CSS custom properties already in `app/globals.css`).
**When to use:** every hull/badge color decision in `GalleryPreviewChart.tsx`/`GalleryCard.tsx`.
**Confidence:** HIGH — colors verified by direct pixel sampling of the design PNG against the exact hex values already hardcoded in `app/globals.css` (give-way `#EF4444`≈sampled `(240,71,71)`; stand-on `#22C55E`≈sampled `(32,197,94)`; mutual `#94A3B8`=sampled `(148,163,184)` exact match).

### Anti-Patterns to Avoid
- **Hand-typing new vessel literals directly in `curated-scenarios.ts`:** violates the file's own established, documented convention ("Every vessel object here is imported verbatim from `classify-encounter.fixtures.ts` — never re-typed as a new literal"). Add new fixtures to `classify-encounter.fixtures.ts` instead (see Code Examples).
- **Reusing `HeroPreviewCard.tsx`'s hardcoded `VESSEL_A_HULL_COLOR`/`VESSEL_B_HULL_COLOR` constants for Gallery:** wrong for any mutual-role card (see Pattern 3).
- **Keeping `app/gallery/page.tsx` around "just in case," relying only on the redirect:** the redirect makes it unreachable (Context7-verified: redirects run before filesystem routes), but GAL-03 says the route is *removed* — leaving unreachable dead code fails that literally and is confusing to a future reader.
- **Adding a defensive client-side `scrollIntoView` fallback up front:** Pitfall 6 (already researched, still accurate against the current codebase — verified `next.config.ts`, `app/page.tsx`, `app/gallery/page.tsx`, Header nav, and `scroll-padding-top` in this session) explicitly says only add it if manual testing shows the native behavior is unreliable.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Rule badge text ("Rule 15"/"Rule 18"/"Rule 7") per card | A new switch/lookup on `encounterType` | `classifyingEntryIndex()` + `ruleNumber()` from `src/components/sandbox/reasoning-trail-tag.ts`, plus `VerdictBanner.tsx`'s `if (classification.doubt) return "Rule 7"` override pattern | Already correctly handles the doubt-overrides-everything rule (the "In doubt" card needs "Rule 7," not "Rule 14," even though its `trail`'s classifying entry is a head-on stage) — reimplementing this risks silently getting the "In doubt" card's badge wrong |
| Give-way/stand-on/mutual role + color derivation | A new per-vessel role function in `gallery/` | `getVesselRole()` + `ROLE_HULL_FILL_CLASS` from `src/components/sandbox/vessel-role.ts` | Already the single source of truth `ChartPanel.tsx`/`ControlPanel.tsx`/`VerdictBanner.tsx` all consume — SCAF-06 explicitly forbids "duplicated role/color/label mappings across features" |
| Heading-vector dashed-line endpoint math | New trig in `gallery-preview-geometry.ts` | `headingVectorEndpoint()` (currently `hero-preview-geometry.ts`) | Pure, already correct, trivially reusable — extraction candidate, see below |
| Hull triangle SVG path | A new path string | `HULL_PATH`/`HULL_STROKE`/`HULL_STROKE_WIDTH` (currently `hero-preview-geometry.ts`) | Same reasoning; the concave-notch hull shape is a specific, deliberate design reproduction, not something to re-derive |
| screen↔chart coordinate math | Anything DOM-based (`getScreenCTM`) | `chartToScreen()` from `src/domain/geometry/screen-convert.ts` | Already the project's locked pattern (CLAUDE.md), jsdom-safe, already used by both `ChartPanel.tsx` and `HeroPreviewCard.tsx` |

**Key insight:** Every visual element Gallery's mini-chart needs (except the per-card dynamic viewBox) already has a correct, tested implementation somewhere in `src/components/sandbox/` or `src/components/hero/`. This phase's real component-layer work is composition and extraction, not new geometry/domain logic — consistent with the milestone's "presentation-layer, zero `src/domain/`/`src/server/` logic changes" boundary (the one exception being additive fixture *data*, not logic, per the fixtures discussion below).

### Extraction proposal (answers CONTEXT.md D-09 + expands it)

CONTEXT.md's D-09 only flagged `hero-preview-geometry.ts`'s chart-drawing helpers for possible extraction. Research surfaces **two more** genuine second-consumer candidates once Gallery exists:

| Currently in `sandbox/` | Gallery also needs it? | Recommendation |
|---|---|---|
| `hero-preview-geometry.ts`: `headingVectorEndpoint()`, `midpoint()`, `HULL_PATH`, `HULL_STROKE`, `HULL_STROKE_WIDTH` | Yes | **Move** to `src/components/shared/static-chart-geometry.ts`. Leave `HERO_CONTAINER_SIZE`/`HERO_VIEW_BOX`/`HERO_CHART_CENTER`/ring radii/`bearingSectorPath()`/gradient constants in `hero-preview-geometry.ts` — Gallery doesn't use rings/gradient/fixed-viewbox at all (Pattern 2). Only 1 existing consumer (`HeroPreviewCard.tsx`) touches this move; low blast radius. |
| `vessel-role.ts`: `getVesselRole()`, `ROLE_HULL_FILL_CLASS`, `ROLE_BADGE_TEXT`, `ROLE_BADGE_CLASSNAME` | Yes | **Move** to `src/components/shared/vessel-role.ts` (or leave in place and have Gallery import across the sibling feature folder — see tradeoff below). Currently imported by `ChartPanel.tsx`, `ControlPanel.tsx`, `ReasoningTrail.tsx`, `VerdictBanner.tsx` (4 files) — moving means updating 4 existing import paths plus Gallery's new one. |
| `reasoning-trail-tag.ts`: `classifyingEntryIndex()`, `ruleNumber()` | Yes | Same as above — currently imported by `ReasoningTrail.tsx`, `VerdictBanner.tsx` (2 files). |

**Recommendation for planning:** extract all three. This is a larger diff than D-09's original hero-only scope, but it's the change that actually satisfies SCAF-06's "no duplicated role/color/label mappings across features" for the concrete new duplication this phase would otherwise create (Gallery needing the exact same GW/SO/MUTUAL + Rule-N derivation Sandbox already has, correctly, tested). The alternative — Gallery importing directly from `"../sandbox/vessel-role.js"` — works (no domain/server-boundary rule forbids feature-to-feature imports, only the `src/domain/` and `src/server/` boundaries are hard-locked) but leaves a `gallery/` → `sandbox/` cross-feature import that the project's `hero/`, `sandbox/` "feature-first" folder convention doesn't otherwise have any precedent for; extraction to `shared/` is the cleaner fit and is Claude's-discretion-explicitly-flagged territory per CONTEXT.md, so this is presented as a strong recommendation, not a re-litigated locked decision.

**Note:** `ROLE_BADGE_TEXT.mutual` is `"MUTUAL"` (full word) — correct for the gallery card's *footer* verdict badge, but the design's small *per-vessel mini-chart pill* shows the abbreviated `"MU"` (2 letters, matching `"GW"`/`"SO"`'s length), which `ROLE_BADGE_TEXT` does not have. See Pitfall 3.

## Common Pitfalls

### Pitfall 1: The existing "Overtaking" and "Sailing has priority"-adjacent curated-scenarios.ts entries produce the WRONG give-way vessel for the new design labels
**What goes wrong:** A naive reading of CONTEXT.md's D-01/D-02 ("the two new fixtures needed... reuse Phase 8's geometry... the current entries don't [match]... `curatedScenarios` is updated to match") could be executed as "keep the 4 existing entries, add 2 new ones, drop the mirror" — but 2 of those 4 "existing" entries are actually geometrically wrong for their new labels:
- **Overtaking:** `curated-scenarios.ts`'s current entry uses `overtakingBothDirectionsCase` with `vesselA: overtakingBothDirectionsCase.vesselA` (the slower, being-overtaken vessel) and `vesselB: overtakingBothDirectionsCase.vesselB` (the faster, overtaking vessel) — this classifies with **`giveWay: "vesselB"`** `[VERIFIED: classify-encounter.fixtures.ts's own documented expectedGiveWay for this fixture]`. The design's "Overtaking" card requires **"A GIVES WAY"** (per `chip-scenarios.test.ts`'s own verified `EXPECTED.overtaking.giveWay === "vesselA"`, using the *same underlying vessel values but with the A/B slots swapped*).
- **Sailing has priority:** `curated-scenarios.ts`'s current 5th entry (`crossingRule18OverrideCase`) uses `vesselA: fishing`/`vesselB: power-driven` and classifies with **`giveWay: "vesselB"`** — wrong vessel *type* (fishing, not sailing) and wrong give-way vessel for a card labeled "Sailing has priority, A gives way."

**Why it happens:** The original 6 `curated-scenarios.ts` entries (Phase 5) were designed to demonstrate a different rationale set (head-on / crossing give-way / crossing stand-on mirror / overtaking / fishing-override / sailing-head-on-override) than the 6 design labels Phase 8 later locked in. They overlap on encounter *type* (crossing, overtaking) but not on which vessel gives way or which vessel type is used.

**How to avoid:** Don't patch the existing entries in place. Build the new 6-entry `curatedScenarios` array by pulling vessel geometry from the same source `chip-scenarios.test.ts` already proves correct — see Code Examples below for exactly which fixture to use for each of the 6 cards (2 reused unchanged, 1 reused with A/B slots swapped, 3 newly added).

**Warning signs:** A gallery card's footer badge reads "B GIVES WAY" for any card except the two labeled MUTUAL, or "Sailing has priority" shows a fishing-vessel type instead of sailing.

**Phase to address:** Gallery (this phase).

### Pitfall 2: `curated-scenarios.test.ts`'s Test 3 (mirror-geometry check) will fail once the mirror entry is dropped, and must be rewritten, not just left alone
**What goes wrong:** `curated-scenarios.test.ts`'s Test 3 currently finds the "give-way-vesselA" crossing entry and the "give-way-vesselB" crossing entry and asserts they are the SAME physical encounter with vessel slots swapped (a genuine mirror-geometry property). This passes today because entry #2 (being dropped, D-03) is exactly that mirror of entry #1. After D-03 drops entry #2, the remaining crossing-type entries with `giveWay: "vesselB"` are the Rule-18-override entries (fishing-vs-power-driven type mismatches) — which are NOT geometric mirrors of the give-way-vesselA entry. If Test 3 is left as-is, the `expect(giveWayA!.entry.vesselA.position).toEqual(giveWayB!.entry.vesselB.position)` assertions will fail against unrelated encounters.
**Why it happens:** Test 3 was written when the mirror pair existed and encodes an assumption ("there is exactly one genuine mirror pair in this data set") the new 6-entry set no longer satisfies — by design, since the new set has no mirror card at all (D-03).
**How to avoid:** Rewrite Test 3 to drop the mirror-geometry assertion entirely (replace with a simpler "crossing-type coverage includes at least one entry" check, since the new design no longer has a give-way-vesselA/give-way-vesselB pair to compare). Test 1's `length` range (`5`–`8` inclusive) already comfortably covers the new count of 6, no change needed there. Test 4 ("1-2 entries demonstrate a Rule 18 override") needs re-verification against the new entry set too — depending on which fixture is used for "Sailing has priority," it may or may not count as a "type mismatch" entry (see Code Examples: if `crossingSailingPriorityCase`'s baseline already matches Rule 18 without an override firing, per chip-scenario's own comment, it is a type-mismatch entry but NOT an override-demonstrating one — Test 4's current assertion structure, which diffs against a same-type baseline, should still correctly report `actual.value.giveWay === baseline.value.giveWay` for this entry and *not* count it, which may drop the override count below the current `>=1` lower bound if "Not under command" is the only genuine override remaining — verify against the real fixture values during implementation, not assumed here).
**Warning signs:** `npm run test` fails on `curated-scenarios.test.ts` immediately after the seed data changes, with a `toEqual` mismatch on vessel position/heading.
**Phase to address:** Gallery (this phase).

### Pitfall 3: The per-vessel mini-chart role pill uses "MU" (2 letters), not the codebase's existing "MUTUAL" (`ROLE_BADGE_TEXT.mutual`)
**What goes wrong:** Blindly reusing `ROLE_BADGE_TEXT` from `vessel-role.ts` for the small pill under each vessel hull in the mini-chart would render "MUTUAL" (6 characters) instead of the design's "MU" (2 characters, matching "GW"/"SO"'s length) — visually oversized/wrapped in the small pill.
**Why it happens:** `ROLE_BADGE_TEXT.mutual` was defined for other consumers (currently unused for mutual in practice, per its own file's comment structure) that show the full word; Gallery's mini-chart pill is a new, smaller UI surface with its own 2-letter convention, verified directly from the design PNG (`[VERIFIED: pixel crop of Main-Design.png, all 4 mutual-hull pills sampled]`).
**How to avoid:** `GalleryPreviewChart.tsx` should define its own local 2-letter pill-text map (`{ "give-way": "GW", "stand-on": "SO", mutual: "MU" }`), separate from `ROLE_BADGE_TEXT`. The card's *footer* verdict badge ("A GIVES WAY" / "MUTUAL") is a different UI surface and should reuse the full-word form there (matching the design's footer badge, which does spell out "MUTUAL").
**Warning signs:** "MUTUAL" text overflowing or wrapping inside the small hull-adjacent pill in a manual visual check.
**Phase to address:** Gallery (this phase).

### Pitfall 4: Reseeding without clearing old curated rows doubles (or worse) the gallery
**What goes wrong:** `prisma/seed.ts`'s `main()` unconditionally calls `prisma.scenario.create()` for every entry in `curatedScenarios` — it has no delete/clear step. Phase 5 already ran this once against the local dev DB (confirmed running: `colregs-navigator-postgres-1` container, healthy, port 5433). Simply editing `curated-scenarios.ts` and re-running `npx prisma db seed` would **add** 6 new rows alongside the 6 stale old-shape rows still marked `isCurated: true` — `gallery.list()` would then return 12 rows (6 correct + 6 stale/wrong-shape, the stale ones missing the new `title` field), doubling the card grid and breaking GAL-01's "matching the design exactly."
**Why it happens:** The seed script was written for a one-time initial seed (Phase 5), not designed for idempotent re-seeding.
**How to avoid:** Either (a) run `npx prisma migrate reset` (drops and recreates the entire dev DB, reapplies all migrations, and Prisma automatically invokes the configured seed command per `prisma.config.ts`'s `migrations.seed`) for a fully clean slate — simplest, and acceptable per D-05 ("no production/user data exists to lose"), though it also deletes any non-curated scenarios a developer manually created via the Sandbox's share button during local testing; or (b) add an explicit `await prisma.scenario.deleteMany({ where: { isCurated: true } })` at the top of `seed.ts`'s `main()` before the create loop, which is idempotent and preserves any non-curated rows. Recommend (b) for a cleaner, more intentional migration + reseed step, but either is valid — this is an implementation-detail choice for the planner, not a further open question.
**Warning signs:** The home page's Gallery section shows more than 6 cards, or shows cards with a blank/missing title.
**Phase to address:** Gallery (this phase).

### Pitfall 5 (carried forward, re-verified current): Route-to-anchor migration — see `.planning/research/PITFALLS.md` Pitfall 6
Re-verified against the current codebase state in this research session (not assumed unchanged):
- `app/gallery/page.tsx` — confirmed still the plain unstyled Server Component described (fetches `getCaller().gallery.list()`, maps to `<Link href="/s/${row.id}">` cards).
- `app/page.tsx` — confirmed current shape is exactly `<Hero /><section id="sandbox"><SandboxContainer /></section>` (no Gallery section yet).
- `next.config.ts` — confirmed no `redirects()` key exists yet; has existing `turbopack`, `webpack`, `typescript` top-level keys that must be preserved when adding `redirects()`.
- Header nav (`src/components/layout/Header.tsx`) — confirmed `href="#gallery"` already wired (currently a dead anchor since no `id="gallery"` element exists anywhere yet).
- `app/globals.css` line 168 — confirmed `scroll-padding-top: 64px;` is already set (Pitfall 6's recommended mitigation is already in place from Phase 6, needs no new work).
- No client-side `scrollIntoView` fallback exists yet anywhere in the codebase — correct per Pitfall 6's "don't add defensively" guidance; only add if manual testing surfaces a real gap.

**Confirmed via Context7 (`/vercel/next.js/v16.2.9`, matches locked 16.2.10):** `redirects()`'s `{ source, destination, permanent }` shape is unchanged and current; and redirects are processed **before the filesystem**, meaning `app/gallery/page.tsx` can be deleted entirely without affecting whether the redirect fires (the redirect would have worked even if the file were left in place, but GAL-03 requires the route itself to be removed, and leaving unreachable dead code around is bad practice regardless).

## Code Examples

### Exact `next.config.ts` `redirects()` addition (append as a new top-level key)
```typescript
// Source: Context7 /vercel/next.js/v16.2.9 docs/01-app/03-api-reference/05-config/01-next-config-js/redirects.mdx
// -- current, unchanged API for the locked Next.js 16.2.10.
const nextConfig: NextConfig = {
  turbopack: { /* ...existing, unchanged... */ },
  webpack: (config) => { /* ...existing, unchanged... */ return config; },
  typescript: { ignoreBuildErrors: true /* ...existing, unchanged... */ },
  async redirects() {
    return [
      {
        source: "/gallery",
        destination: "/#gallery",
        permanent: true, // 308 -- structural, permanent change (GAL-03)
      },
    ];
  },
};
```

### `app/page.tsx` — the exact composition addition
```tsx
import { Hero } from "../src/components/hero/Hero.js";
import { SandboxContainer } from "../src/components/sandbox/SandboxContainer.js";
import { GalleryContainer } from "../src/components/gallery/GalleryContainer.js";

export default function Home() {
  return (
    <>
      <Hero />
      <section id="sandbox">
        <SandboxContainer />
      </section>
      <section id="gallery">
        <GalleryContainer />
      </section>
    </>
  );
}
```

### `CuratedScenario` type change (adds `title`)
```typescript
export interface CuratedScenario {
  vesselA: Vessel;
  vesselB: Vessel;
  title: string;      // NEW (D-04) -- punchy one-liner, verbatim from Main-Design.png
  rationale: string;  // unchanged -- longer explanatory sentence (existing usage: banner/description text)
  displayOrder: number;
}
```

### Prisma schema change (nullable, matching `rationale`'s existing convention)
```prisma
model Scenario {
  // ...unchanged fields...
  isCurated    Boolean @default(false)
  displayOrder Int?
  rationale    String?
  title        String? // NEW -- curated-only, populated by prisma/seed.ts, null for non-curated user-shared scenarios
}
```
Migration command (per this repo's own README.md-documented convention): `npx prisma migrate dev --name add_scenario_title`.

### The 6 curated entries' correct fixture sourcing (the core Pitfall-1 fix)

| Card (design label) | Source | Change needed |
|---|---|---|
| Classic crossing | `crossingResidualBasicCase` (existing, unchanged) | None — `[VERIFIED: crossingCase.own/contact in relative-bearing.fixtures.ts has byte-identical position/heading/speed/type values to chip-scenarios.ts's classicCrossingVessels]` |
| Head-on meeting | `headOnGenuineCase` (existing, unchanged) | None — `[VERIFIED: headOnCase.own/contact is byte-identical to chip-scenarios.ts's headOnMeetingVessels]` |
| Overtaking | `overtakingBothDirectionsCase`, **slots swapped** | `vesselA: overtakingBothDirectionsCase.vesselB, vesselB: overtakingBothDirectionsCase.vesselA` — reuses the exact same tested values, just assigns the faster/overtaking vessel to slot A so `giveWay` comes out `"vesselA"`, matching chip-scenarios' `overtakingVessels` and its test-verified `EXPECTED.overtaking.giveWay === "vesselA"` |
| Sailing has priority | **NEW** fixture, e.g. `crossingSailingPriorityCase` | Copy chip-scenarios.ts's `sailingHasPriorityVessels` literal values verbatim into a new named export in `classify-encounter.fixtures.ts` (vesselA power-driven `(0,0)` h0 s10, vesselB sailing `(5,0)` h270 s10) |
| Not under command | **NEW** fixture, e.g. `crossingNotUnderCommandCase` | Copy chip-scenarios.ts's `notUnderCommandVessels` literal values verbatim (D-02, already directed) |
| In doubt | **NEW** fixture, e.g. `headOnInDoubtCase` | Copy chip-scenarios.ts's `inDoubtVessels` literal values verbatim (D-02, already directed) |

```typescript
// classify-encounter.fixtures.ts additions (pure data, zero logic change --
// classify-encounter.ts's dispatch code is untouched by this phase).
// Values copied verbatim from src/components/sandbox/chip-scenarios.ts,
// already proven correct against classifyEncounter() by
// chip-scenarios.test.ts's EXPECTED table.

export const crossingSailingPriorityCase: ClassificationCase = {
  vesselA: { position: { x: 0, y: 0 }, heading: 0, speed: 10, type: "power-driven" },
  vesselB: { position: { x: 5, y: 0 }, heading: 270, speed: 10, type: "sailing" },
  expectedEncounterType: "crossing",
  expectedGiveWay: "vesselA",
  expectedStandOn: "vesselB",
  expectedDoubt: false,
};

export const crossingNotUnderCommandCase: ClassificationCase = {
  vesselA: { position: { x: 1.4, y: 0 }, heading: 270, speed: 10, type: "power-driven" },
  vesselB: { position: { x: 0, y: 0 }, heading: 0, speed: 10, type: "not-under-command" },
  expectedEncounterType: "crossing",
  expectedGiveWay: "vesselA",
  expectedStandOn: "vesselB",
  expectedRiskOfCollision: true,
  expectedDoubt: false,
};

export const headOnInDoubtCase: ClassificationCase = {
  vesselA: { position: { x: 0, y: 0 }, heading: 45, speed: 10, type: "sailing" },
  vesselB: {
    position: { x: 7.66044443118978, y: 6.427876096865393 },
    heading: 225,
    speed: 10,
    type: "sailing",
  },
  expectedEncounterType: "head-on",
  expectedGiveWay: null,
  expectedStandOn: null,
  expectedRiskOfCollision: true,
  expectedDoubt: true,
  expectedDoubtBoundary: "near-head-on-boundary",
};
```

### Reusing the existing rule-badge derivation for a gallery card (not reimplementing it)
```typescript
// Source: pattern from src/components/sandbox/VerdictBanner.tsx's
// bannerRuleBadge(), applied identically for a gallery card.
import { classifyingEntryIndex, ruleNumber } from "../sandbox/reasoning-trail-tag.js"; // or shared/ if extracted
import type { ClassificationResult } from "../../domain/colregs/types.js";

function cardRuleBadge(classification: ClassificationResult): string {
  if (classification.doubt) return "Rule 7"; // doubt always wins, even for head-on's "In doubt" card
  const classifyingEntry = classification.trail[classifyingEntryIndex(classification.trail.length)];
  return `Rule ${ruleNumber(classifyingEntry.ruleId)}`;
}
```

## State of the Art

Not applicable — no library/framework version drift is relevant to this phase's work (internal restructuring of an already-current stack).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `paddingFraction`/exact aspect-ratio constants for `computeCardViewBox()` are a reasonable default, not derived from the design file's per-card pixel layout | Architecture Patterns, Pattern 1 | Low — a visually-off card (vessels too close to the card edge, or too small) is a cosmetic fix during manual QA, not a functional regression |
| A2 | The "Rule 15"-style badge's exact color/outline treatment (teal `--accent`/`#2dd4bf` outline, mirroring Hero's existing `Badge variant="outline"` pattern) rather than the Sandbox's solid-fill `--rule-accent`/`#0D9488` treatment | Architecture Patterns / Code Examples (implied) | Low — cosmetic; both are already-defined design tokens in `app/globals.css`, a wrong pick is a one-line className fix caught in visual QA |
| A3 | Recommend deleting `app/gallery/page.tsx` and its directory outright, rather than replacing its contents with a stub | Anti-Patterns, Pitfall 5 | Low — Context7-verified that the redirect makes the route unreachable either way; this is a code-cleanliness recommendation, not a functional requirement |

## Open Questions

None blocking. The two items CONTEXT.md left to "Claude's Discretion" (shared-geometry extraction scope, exact fixture location) are resolved above with concrete recommendations (Architecture Patterns Pattern 1, Don't Hand-Roll extraction proposal); the planner may still choose to scope down the `vessel-role.ts`/`reasoning-trail-tag.ts` extraction (leave in `sandbox/`, import cross-feature) if minimizing this phase's diff size is prioritized over the cleaner `shared/` location — both are viable, documented above with tradeoffs.

## Grid Breakpoints (GAL-01's "3 → 2 → 1 columns")

**Recommendation:** reuse the project's two already-established breakpoints — no third breakpoint is needed.

```
grid grid-cols-1 gap-6 min-[640px]:grid-cols-2 min-[900px]:grid-cols-3
```

**Reasoning:** the project's container is `max-w-300` (≈1200px) with `px-5`/`min-[900px]:px-6` gutters (same pattern as `SandboxContainer.tsx`/`Hero.tsx`). Three columns need roughly ≥300px per card, comfortably available at ≥900px (the same breakpoint the project already uses for its two-column layouts, e.g. Hero's `min-[900px]:grid-cols-[1.05fr_0.95fr]`, Sandbox's `min-[900px]:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]`). Two columns need roughly ≥300px per card too, but only 2 of them — comfortably available from 640px up (the project's other existing breakpoint, used for Hero's headline scale-down and the Header's nav-link collapse). Below 640px, a single column matches every other section's mobile-stack behavior in this codebase. This directly answers CONTEXT.md's open discretion item ("Gallery grid's intermediate breakpoint... no tablet-width mock exists") — no new breakpoint value needs to be invented.
**Confidence:** MEDIUM — no tablet-width mock exists to verify pixel-exact column-fit at the 640–899px range (CONTEXT.md itself notes this gap), but the recommendation reuses existing, already-verified project breakpoints rather than introducing an unverified new one, which is the lower-risk choice either way.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL (Docker) | `prisma migrate dev` + reseed (D-05) | Yes | `postgres:17`, container `colregs-navigator-postgres-1`, healthy, port 5433 `[VERIFIED: docker ps]` | — |
| Prisma CLI | Schema migration | Yes | 7.8.0, matches locked version `[VERIFIED: npx prisma --version]` | — |
| Docker | Postgres container runtime | Yes | Client 29.6.1, `desktop-linux` context `[VERIFIED: docker info]` | — |
| Node.js | Build/test/dev | Yes | v22.23.1 `[VERIFIED: node --version]` | — |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none.

## Security Domain

`security_enforcement` is absent from `.planning/config.json` (treated as enabled), but this phase introduces no new authentication, authorization, or externally-supplied input surface — the only new "input" is the already-public `gallery.list()` tRPC query (read-only, unchanged contract) and a static server-side redirect rule (no user input reflected into the destination). No ASVS category is newly triggered.

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | No | No auth in this project (portfolio scope, unchanged) |
| V3 Session Management | No | N/A |
| V4 Access Control | No | `gallery.list()` remains a public, read-only query; no new mutation added |
| V5 Input Validation | No | No new user-supplied input path introduced (the redirect `source`/`destination` are static config, not derived from request data) |
| V6 Cryptography | No | N/A |

### Known Threat Patterns for this stack
None newly applicable this phase.

## Sources

### Primary (HIGH confidence)
- Context7 `/vercel/next.js/v16.2.9` — `redirects()` config shape (`source`/`destination`/`permanent`), hash-fragment handling in redirect destinations, and route-processing order confirming redirects run before filesystem/page routes
- Local codebase reads (this session): `app/gallery/page.tsx`, `app/page.tsx`, `next.config.ts`, `src/server/api/routers/gallery.ts`, `src/server/db/curated-scenarios.ts`, `src/server/db/curated-scenarios.test.ts`, `prisma/seed.ts`, `prisma/schema.prisma`, `prisma/migrations/20260717125040_init/migration.sql`, `src/server/db/scenario-repository.ts`, `src/server/application/scenario-service.ts`, `src/components/sandbox/chip-scenarios.ts`, `src/components/sandbox/chip-scenarios.test.ts`, `src/domain/colregs/classify-encounter.fixtures.ts`, `src/domain/colregs/classify-encounter.test.ts`, `src/domain/geometry/relative-bearing.fixtures.ts`, `src/domain/geometry/screen-convert.ts`, `src/components/hero/hero-preview-geometry.ts`, `src/components/hero/HeroPreviewCard.tsx`, `src/components/hero/hero-preview-fixture.ts`, `src/components/sandbox/vessel-role.ts`, `src/components/sandbox/reasoning-trail-tag.ts`, `src/components/sandbox/VerdictBanner.tsx`, `src/components/layout/Header.tsx`, `app/globals.css`, `app/s/[shareId]/page.tsx`, `src/components/shared/SectionGridBackground.tsx`, `vitest.config.ts`, `package.json`
- `.planning/design/Main-Design.png` — direct pixel-level crop-and-zoom inspection of all 6 gallery cards (not just the coarse full-page pass), plus RGB pixel sampling of hull/badge colors cross-checked against `app/globals.css`'s `--give-way`/`--stand-on`/`--mutual` token values
- `npx prisma --version`, `docker ps`, `docker info`, `node --version` — live environment verification in this session

### Secondary (MEDIUM confidence)
- Grid breakpoint recommendation (Grid Breakpoints section) — reasoned from the project's existing 640px/900px breakpoint usage across `Hero.tsx`/`SandboxContainer.tsx`/`Header.tsx`, not independently pixel-verified against a tablet-width design mock (none exists)
- `computeCardViewBox()`'s padding/aspect constants — engineering default, not extracted from the design source

### Tertiary (LOW confidence)
None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; all versions verified live against the locked CLAUDE.md table
- Architecture: HIGH — redirect API verified via Context7 against the locked Next.js version; component/file structure follows directly-inspected existing precedent (Hero/Sandbox)
- Pitfalls: HIGH — the fixture-mismatch pitfalls (Pitfall 1, 2) are verified by direct arithmetic/comparison against this repo's own fixture files and test files, not inferred

**Research date:** 2026-07-19
**Valid until:** 30 days (stable internal-only stack, no external API drift risk)
