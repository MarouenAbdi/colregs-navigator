# Phase 9: Gallery - Pattern Map

**Mapped:** 2026-07-19
**Files analyzed:** 18 (new + modified)
**Analogs found:** 16 / 18

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/components/gallery/GalleryContainer.tsx` | controller (async Server Component) | request-response (SSR fetch + render) | `app/gallery/page.tsx` (data-fetch shape) + `src/components/hero/Hero.tsx` (section chrome shape) | exact (data-fetch) / role-match (chrome) |
| `src/components/gallery/GalleryCard.tsx` | component | transform (props -> markup) | `src/components/sandbox/VerdictBanner.tsx` (role-badge derivation + render) | role-match |
| `src/components/gallery/GalleryPreviewChart.tsx` | component | transform (Vessel pair -> static SVG) | `src/components/hero/HeroPreviewCard.tsx` | exact (same "static fixture-driven SVG" pattern, reduced detail) |
| `src/components/gallery/gallery-preview-geometry.ts` | utility | transform (pure geometry) | `src/components/hero/hero-preview-geometry.ts` | exact |
| `src/components/gallery/GalleryContainer.test.tsx` | test | request-response (RTL render) | `src/components/hero/Hero.test.tsx` | role-match |
| `src/components/gallery/gallery-preview-geometry.test.ts` | test | transform (pure fn unit test) | `src/components/hero/hero-preview-fixture.test.ts` (pure geometry/fixture test style) | role-match |
| `src/components/shared/static-chart-geometry.ts` (new extraction) | utility | transform (pure geometry) | `src/components/hero/hero-preview-geometry.ts` (source of the extracted functions) | exact (extraction, not analog) |
| `app/page.tsx` | route/composition | request-response | itself (existing file, additive edit) | exact |
| `app/gallery/page.tsx` (deleted) + `next.config.ts` (redirects) | route/config | request-response | `next.config.ts` itself (existing top-level key pattern) | exact |
| `src/domain/colregs/classify-encounter.fixtures.ts` (+3 exports) | model/fixture data | CRUD (pure data) | itself (existing `ClassificationCase` export pattern) | exact |
| `src/server/db/curated-scenarios.ts` | model/seed-data | CRUD | itself (existing file, full-rewrite of the array + `CuratedScenario` interface) | exact |
| `src/server/db/curated-scenarios.test.ts` | test | CRUD (data-shape assertions) | itself (existing file, Test 3/4 rewritten) | exact |
| `prisma/schema.prisma` (`title` field) | model/migration | CRUD | itself (`rationale`/`displayOrder` nullable-field precedent, same model) | exact |
| `prisma/seed.ts` (add `deleteMany` + `title`) | service (seed script) | batch | itself (existing file) | exact |
| `src/server/api/routers/gallery.ts` | route (tRPC router) | request-response | unchanged — no analog needed, contract untouched | n/a (no change) |
| `src/components/sandbox/vessel-role.ts` / `reasoning-trail-tag.ts` (possible move to `shared/`) | utility | transform | themselves (existing files, relocated + import-path updates in 4-6 consumer files) | exact |

## Pattern Assignments

### `src/components/gallery/GalleryContainer.tsx` (controller, async Server Component, request-response)

**Analogs:** `app/gallery/page.tsx` (data-fetch + empty-state) and `src/components/hero/Hero.tsx` (section-chrome layout conventions)

**Data-fetch pattern to copy** — `app/gallery/page.tsx` lines 1-11:
```tsx
import Link from "next/link";
import { getCaller } from "../../src/lib/trpc/server.js";

export default async function GalleryPage() {
  const scenarios = await getCaller().gallery.list();
  // ... empty-state check, then map to cards
```
GalleryContainer must be `async`, call `await getCaller().gallery.list()` the exact same way (GAL-04 hard requirement — server-rendered, not client-fetched). Import path from `src/components/gallery/` to `src/lib/trpc/server.js` is `"../../lib/trpc/server.js"`.

**Empty-state pattern** — `app/gallery/page.tsx` lines 10-12 (`scenarios.length === 0 ? <p>No curated scenarios yet — run the seed script.</p> : ...`) — reuse verbatim per UI-SPEC's Copywriting Contract "Empty state" row, just restyled (`text-muted-foreground`, centered).

**Section-chrome / container convention to copy** — `src/components/hero/Hero.tsx` lines 18-22 and `src/components/sandbox/SandboxContainer.tsx` line 184:
```tsx
<div className="mx-auto max-w-300 px-5 py-12 min-[900px]:px-6 min-[900px]:py-16">
```
This exact container class string is UI-SPEC's locked "Section container" value — copy verbatim, do not re-derive. Header block (eyebrow/heading/subhead), per UI-SPEC, is `flex flex-col items-center gap-3 text-center` (centered, unlike Hero's/Sandbox's left-aligned headers — a deliberate deviation, don't copy Hero's left-aligned header block, only its outer container width/padding).

**Composition wiring** (from RESEARCH.md's verified Code Example, matches this repo's existing `app/page.tsx` import-path convention):
```tsx
import { GalleryContainer } from "../src/components/gallery/GalleryContainer.js";
// added below the existing <section id="sandbox"> in app/page.tsx:
<section id="gallery">
  <GalleryContainer />
</section>
```

**Grid** (UI-SPEC locked, corrected from RESEARCH's gap-6 guess):
```
grid grid-cols-1 gap-4 min-[640px]:grid-cols-2 min-[900px]:grid-cols-3
```

---

### `src/components/gallery/GalleryCard.tsx` (component, transform)

**Analog:** `src/components/sandbox/VerdictBanner.tsx`

**Rule-badge derivation to copy** (never reimplement) — `VerdictBanner.tsx` lines 46-51:
```typescript
function bannerRuleBadge(classification: ClassificationResult): string {
  if (classification.doubt) return "Rule 7";
  const classifyingEntry =
    classification.trail[classifyingEntryIndex(classification.trail.length)];
  return `Rule ${ruleNumber(classifyingEntry.ruleId)}`;
}
```
Import `classifyingEntryIndex`/`ruleNumber` from `src/components/sandbox/reasoning-trail-tag.ts` (or `shared/` if extracted — see Shared Patterns). This exact doubt-override logic is required so the "In doubt" card shows "Rule 7" not "Rule 14".

**Role derivation to copy** — `VerdictBanner.tsx` line 10 import + line 78 usage:
```typescript
import { getVesselRole, ROLE_BADGE_CLASSNAME, type VesselRole } from "./vessel-role.js";
...
const role = getVesselRole(vesselLabel, classification);
```
Footer verdict badge text: "A GIVES WAY" (not the sandbox's "GIVE WAY"/vessel-label-first format) — per UI-SPEC's Copywriting Contract, compose `${VESSEL_LABEL}${" "}GIVES WAY` / `"MUTUAL"` locally in `GalleryCard.tsx`, don't reuse `VerdictBanner.tsx`'s `ROLE_STATUS_TEXT` map verbatim (different exact string).

**Whole-card-as-link pattern** — `app/gallery/page.tsx` lines 14-23 (existing precedent for `<Link href={...}><div>...</div></Link>` wrapping a full card) — same shape, upgrade `<div>` to shadcn `<Card>` per UI-SPEC's Layout section, add `aria-label="Load {title} scenario into the sandbox"` on the `Link` per UI-SPEC's Interaction Contract.

**Card composition** (shadcn primitives, no new primitives needed) — `src/components/ui/card.tsx` (`Card` — flat single-column, no `CardHeader`/`CardContent` split per UI-SPEC's "zero internal split needed") and `src/components/ui/badge.tsx` (`Badge variant="outline"` for the Rule-N badge, matching `HeroPreviewCard.tsx`'s own `Badge` import at line 17 `import { Badge } from "@/components/ui/badge";`).

---

### `src/components/gallery/GalleryPreviewChart.tsx` (component, transform: Vessel pair -> static SVG)

**Analog:** `src/components/hero/HeroPreviewCard.tsx` (the only existing "static, fixture-driven SVG chart" in the codebase — D-08 requires this stay independent from `ChartPanel.tsx`, the live interactive chart)

**Imports pattern to mirror** — `HeroPreviewCard.tsx` lines 10-33 (adapt `hero-preview-fixture.js` -> parametrized `vesselA`/`vesselB` props instead of a fixed fixture import):
```typescript
import { classifyEncounter } from "../../domain/colregs/classify-encounter.js";
import { chartToScreen } from "../../domain/geometry/screen-convert.js";
import type { Vessel } from "../../domain/vessel/vessel.js";
import {
  headingVectorEndpoint,
  midpoint,
  HULL_PATH,
  HULL_STROKE,
  HULL_STROKE_WIDTH,
} from "../shared/static-chart-geometry.js"; // after extraction, see Shared Patterns
import { getVesselRole, ROLE_HULL_FILL_CLASS } from "../sandbox/vessel-role.js"; // or shared/ if moved
```

**VesselMarker "rotate hull only, keep label/pill fixed" pattern to copy exactly** — `HeroPreviewCard.tsx` lines 60-80:
```tsx
function VesselMarker({ screen, heading, hullColor, label, pillText }: VesselMarkerProps) {
  return (
    <>
      <g transform={`translate(${screen.screenX} ${screen.screenY}) rotate(${heading})`}>
        <path d={HULL_PATH} fill={hullColor} stroke={HULL_STROKE} strokeWidth={HULL_STROKE_WIDTH} />
      </g>
      <g transform={`translate(${screen.screenX - 11} ${screen.screenY - 11})`}>
        <circle r={7} fill="#18181B" />
        <text textAnchor="middle" dominantBaseline="middle" fill="#FFFFFF" fontSize={10} fontWeight={600}>{label}</text>
      </g>
      <g transform={`translate(${screen.screenX + 12} ${screen.screenY + 10})`}>
        <rect width={20} height={12} rx={3} fill={hullColor} />
        <text x={10} y={6} textAnchor="middle" dominantBaseline="middle" fill="#FFFFFF" fontSize={7.5} fontWeight={600}>{pillText}</text>
      </g>
    </>
  );
}
```
**Required deviation per D-09/Pattern 3 and UI-SPEC:** `hullColor` must come from `ROLE_HULL_FILL_CLASS[getVesselRole(...)]` (or the raw hex via `ROLE_*` color token), never Hero's hardcoded `VESSEL_A_HULL_COLOR`/`VESSEL_B_HULL_COLOR` constants — Gallery has mutual-role cards Hero never had. **Required deviation per UI-SPEC's per-vessel-pill correction:** `pillText` map must be a new local `{ "give-way": "GW", "stand-on": "SO", mutual: "MU" }` (Pitfall 3) — do not reuse `ROLE_BADGE_TEXT.mutual` ("MUTUAL", overflows).

**Fixture-invariant throw pattern to copy** — `HeroPreviewCard.tsx` lines 84-89, 93-95, 111-117 (throw on `!result.ok` / `giveWay === null` handled differently here — Gallery's mutual cards are valid, not an error, so the `giveWay === null` throw must NOT be copied; only the `!result.ok` classification-failure throw pattern applies, since Gallery fixtures are also fixed/known-good at authoring time).

**SVG element set to include** (per UI-SPEC Mini-Chart Contract, reduced from Hero's full set): faint grid pattern (`HeroPreviewCard.tsx` lines 143-144, 158 — reuse the exact `<pattern id="heroGrid">` technique at lower opacity `rgba(120,120,130,0.08)` instead of Hero's `0.14`), connector line (lines 188-195, using `--geometry`/`#475569`), two role-colored hulls via `VesselMarker`, dashed heading vectors (lines 197-214, but stroke = role color not slot color), range-label chip (lines 216-224). **Omit:** range rings (lines 160-175), `bearingSectorPath`/radial gradient (lines 146-155, 177), Hero's fixed `HERO_VIEW_BOX`/`HERO_CONTAINER_SIZE` constants (replaced by the new `computeCardViewBox()` per-card dynamic box).

**Aspect ratio/dimensions:** 3:2 (not Hero's 8:5) — `viewBox="0 0 W H"` where `H = W * 2/3`, full card width minus `2 * 16px` padding, per UI-SPEC's Mini-Chart Contract.

---

### `src/components/gallery/gallery-preview-geometry.ts` (utility, transform)

**Analog:** `src/components/hero/hero-preview-geometry.ts` (structurally — a pure, framework-free module colocated with its consuming component, per this project's "split computation from presentation" convention)

**New logic this file must contain** (from RESEARCH.md's verified Code Example, Pattern 1) — copy this exact function, it is already fully specified:
```typescript
import type { ChartViewBox } from "../../domain/geometry/screen-convert.js";
import type { Position } from "../../domain/vessel/vessel.js";

export function computeCardViewBox(
  a: Position,
  b: Position,
  aspectRatio: number,
  paddingFraction: number,
): ChartViewBox {
  const minXRaw = Math.min(a.x, b.x);
  const maxXRaw = Math.max(a.x, b.x);
  const minYRaw = Math.min(a.y, b.y);
  const maxYRaw = Math.max(a.y, b.y);
  const rawWidth = Math.max(maxXRaw - minXRaw, 0.001);
  const rawHeight = Math.max(maxYRaw - minYRaw, 0.001);

  const padX = rawWidth * paddingFraction;
  const padY = rawHeight * paddingFraction;
  let width = rawWidth + padX * 2;
  let height = rawHeight + padY * 2;
  const centerX = (minXRaw + maxXRaw) / 2;
  const centerY = (minYRaw + maxYRaw) / 2;

  if (width / height > aspectRatio) {
    height = width / aspectRatio;
  } else {
    width = height * aspectRatio;
  }

  return { minX: centerX - width / 2, minY: centerY - height / 2, width, height };
}
```
This is genuinely new (neither Hero's fixed viewBox hand-solve nor `ChartPanel.tsx`'s fixed 20nm box needs dynamic bounding-box sizing) — per CLAUDE.md's "extract only on a real second consumer" convention, this stays Gallery-local, not `shared/`.

**File-header comment convention to copy** (matches `hero-preview-geometry.ts` lines 1-7's doc-comment style — explain provenance/derivation, not restate code):
```typescript
/**
 * Pure, framework-free geometry for the Gallery mini-chart's per-card
 * dynamic viewBox. Unlike Hero's single hand-solved HERO_VIEW_BOX, Gallery's
 * 6 vessel pairs span a 1.0-10.0 NM range, so the viewBox must be computed
 * per card from the actual vessel positions, not a fixed constant.
 */
```

---

### `src/components/shared/static-chart-geometry.ts` (new extraction, utility, transform)

**Source to extract from:** `src/components/hero/hero-preview-geometry.ts` lines 50-65, 88-93 (`HULL_PATH`, `HULL_STROKE`, `HULL_STROKE_WIDTH`, `headingVectorEndpoint()`, `midpoint()`) — move these five exports verbatim into the new shared file; leave `HERO_CONTAINER_SIZE`/`HERO_VIEW_BOX`/`HERO_CHART_CENTER`/ring radii/`bearingSectorPath()`/`VESSEL_A_HULL_COLOR`/`VESSEL_B_HULL_COLOR`/`CONNECTOR_STROKE` in `hero-preview-geometry.ts` (Gallery doesn't use rings/gradient/fixed-viewbox, and hull colors must be role-derived, not the extracted slot-based constants).

**Consumers to update after the move:** `HeroPreviewCard.tsx` (change its import block, lines 18-33, to pull the 5 moved names from `../shared/static-chart-geometry.js` and the remaining names from `./hero-preview-geometry.js`), plus the new `GalleryPreviewChart.tsx`. This is a genuine second-consumer extraction, satisfying CLAUDE.md's "Shared/decorative primitives: extract only on a real second consumer" convention (D-09).

---

### `src/server/db/curated-scenarios.ts` (model/seed-data, CRUD)

**Analog:** itself (full-array rewrite, same file structure/doc-comment convention retained)

**Convention to preserve** — file header lines 1-18 and the "never re-typed as a new literal" rule (line 7-9): every new/changed vessel object must be an import from `classify-encounter.fixtures.ts`, never a hand-typed literal in this file. This is an explicit Anti-Pattern in RESEARCH.md.

**`CuratedScenario` interface change** (RESEARCH.md's verified Code Example — add `title` between existing fields, current shape at lines 29-34):
```typescript
export interface CuratedScenario {
  vesselA: Vessel;
  vesselB: Vessel;
  title: string;      // NEW
  rationale: string;  // unchanged
  displayOrder: number;
}
```

**Fixture-sourcing table (the core data fix, RESEARCH.md verified):**
| Card | Fixture | Notes |
|---|---|---|
| Classic crossing | `crossingResidualBasicCase` | unchanged |
| Head-on meeting | `headOnGenuineCase` | unchanged |
| Overtaking | `overtakingBothDirectionsCase` with **A/B slots swapped** (`vesselA: ...vesselB`, `vesselB: ...vesselA`) | fixes wrong give-way vessel |
| Sailing has priority | new `crossingSailingPriorityCase` (add to fixtures file) | replaces `crossingRule18OverrideCase` (wrong type/vessel) |
| Not under command | new `crossingNotUnderCommandCase` (add to fixtures file) | net-new card |
| In doubt | new `headOnInDoubtCase` (add to fixtures file) | net-new card, replaces the dropped mirror entry |

Drop the current entry #2 (`crossingResidualBasicCase` with slots swapped) per D-03 — no mirror-pair card in the new 6.

---

### `src/domain/colregs/classify-encounter.fixtures.ts` (+3 exports)

**Analog:** itself — existing `ClassificationCase` export pattern, e.g. lines 220-232 (`crossingResidualBasicCase`) and 364-382 (`crossingRule18OverrideCase`).

**Exact new exports** (verified against `chip-scenarios.ts`'s already-tested literal values, per RESEARCH.md Code Examples — copy these three verbatim, they are fully specified):
```typescript
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
Zero logic change to `classify-encounter.ts`'s dispatch code — this file is pure data.

---

### `src/server/db/curated-scenarios.test.ts` (test, CRUD data-shape assertions)

**Analog:** itself — 5 existing `it(...)` blocks, structure preserved.

**What must change (RESEARCH.md Pitfall 2, both verified failure modes):**
- Test 3 (lines 30-75): the mirror-geometry assertion (`giveWayA!.entry.vesselA.position` toEqual `giveWayB!.entry.vesselB.position`, etc.) must be **removed** — the new 6-entry set has no mirror pair (D-03). Replace with a simpler "crossing-type coverage includes at least one give-way-vesselA entry" check (head-on/overtaking coverage assertions at lines 41-49 can stay as-is).
- Test 4 (lines 77-102): re-verify against the new entry set — depending on final fixture choice for "Sailing has priority," the `mismatchEntries.length >= 1` lower bound may need re-checking against the real new data (only "Not under command" is guaranteed to be a genuine Rule 18 override in the new set; "Sailing has priority" is a type-mismatch entry whose baseline may already match, per RESEARCH.md's own flagged uncertainty — verify against actual computed values during implementation, don't assume the existing `>=1, <=2` bounds still hold without checking).
- Test 1 (`length` between 5-8) and Test 5 (unique `displayOrder` + non-empty `rationale`) need no structural change, but Test 5 should also assert non-empty `title` now that the field exists.

---

### `prisma/schema.prisma` (model/migration)

**Analog:** itself — the existing `Scenario` model's `rationale`/`displayOrder` nullable-field convention, lines 37-42:
```prisma
isCurated    Boolean @default(false)
displayOrder Int?
rationale    String?
```
**Copy this exact pattern for the new field** (RESEARCH.md verified Code Example):
```prisma
title String? // NEW -- curated-only, populated by prisma/seed.ts, null for non-curated user-shared scenarios
```
Migration command per this repo's convention: `npx prisma migrate dev --name add_scenario_title`.

---

### `prisma/seed.ts` (service/seed script, batch)

**Analog:** itself — existing `main()` function, lines 21-52.

**Required addition (RESEARCH.md Pitfall 4 — must not double the gallery on reseed):**
```typescript
// Add near the top of main(), before the create loop:
await prisma.scenario.deleteMany({ where: { isCurated: true } });
```
**Required field addition** to the existing `prisma.scenario.create({ data: { ... } })` call (lines 34-50) — add `title: entry.title,` alongside the existing `rationale: entry.rationale,` (line 47).

---

## Shared Patterns

### Whole-object-as-link click target
**Source:** `app/gallery/page.tsx` lines 14-23
**Apply to:** `GalleryCard.tsx`
```tsx
<Link href={`/s/${row.id}`} key={row.id}>
  <div className="...">...</div>
</Link>
```
Upgrade the plain `<div>` to shadcn `<Card>`; add `aria-label` per UI-SPEC.

### Server-rendered tRPC data fetch (GAL-04 hard requirement)
**Source:** `app/gallery/page.tsx` line 5; `app/s/[shareId]/page.tsx` line 17
**Apply to:** `GalleryContainer.tsx`
```typescript
const scenarios = await getCaller().gallery.list();
```
Never converted to a client component / `useQuery` hook — this is the one non-negotiable architectural constraint of the phase.

### Role-based color/text derivation (never hardcode by vessel slot)
**Source:** `src/components/sandbox/vessel-role.ts` lines 12-16, 27-47
**Apply to:** `GalleryPreviewChart.tsx`, `GalleryCard.tsx`
```typescript
export function getVesselRole(vessel: VesselLabel, classification: ClassificationResult): VesselRole {
  if (classification.giveWay === null && classification.standOn === null) return "mutual";
  if (classification.giveWay === vessel) return "give-way";
  return "stand-on";
}
export const ROLE_HULL_FILL_CLASS: Record<VesselRole, string> = {
  "give-way": "fill-give-way", "stand-on": "fill-stand-on", mutual: "fill-mutual",
};
export const ROLE_BADGE_CLASSNAME: Record<VesselRole, string> = {
  "give-way": "bg-give-way/10 border-give-way/35 text-give-way",
  "stand-on": "bg-stand-on/10 border-stand-on/35 text-stand-on",
  mutual: "bg-mutual/10 border-mutual/35 text-mutual",
};
```
Critical because 2 of Gallery's 6 cards (Head-on meeting, In doubt) are mutual — Hero's hardcoded-by-slot `VESSEL_A_HULL_COLOR`/`VESSEL_B_HULL_COLOR` constants would render these wrong (Pattern 3 in RESEARCH.md).

### Rule-N badge derivation (doubt always overrides)
**Source:** `src/components/sandbox/reasoning-trail-tag.ts` (whole file, 28 lines) + `VerdictBanner.tsx` lines 46-51
**Apply to:** `GalleryCard.tsx`
```typescript
export function classifyingEntryIndex(trailLength: number): number { return trailLength - 2; }
export function ruleNumber(ruleId: string): string {
  const match = /Rule (\d+)/.exec(ruleId);
  return match ? match[1] : ruleId;
}
// consumer:
if (classification.doubt) return "Rule 7";
const classifyingEntry = classification.trail[classifyingEntryIndex(classification.trail.length)];
return `Rule ${ruleNumber(classifyingEntry.ruleId)}`;
```

### Section container width/padding convention
**Source:** `src/components/sandbox/SandboxContainer.tsx` line 184; `src/components/hero/Hero.tsx` line 22
**Apply to:** `GalleryContainer.tsx`
```
mx-auto max-w-300 px-5 py-12 min-[900px]:px-6 min-[900px]:py-16
```

### `next.config.ts` additive top-level key
**Source:** `next.config.ts` lines 5-61 (existing `turbopack`/`webpack`/`typescript` keys)
**Apply to:** the new `redirects()` key
```typescript
async redirects() {
  return [{ source: "/gallery", destination: "/#gallery", permanent: true }];
},
```
Must be added as a sibling key inside the same `nextConfig` object — do not replace or restructure the existing keys.

### Fixture-invariant defensive throw (static/known-good data at authoring time)
**Source:** `src/components/hero/HeroPreviewCard.tsx` lines 84-89 (`if (!result.ok) throw new Error(...)`)
**Apply to:** `GalleryPreviewChart.tsx`'s classification call per card (but NOT the `giveWay === null` throw at lines 111-117 — that branch is a valid, expected state for Gallery's 2 mutual cards, not a fixture-invariant failure).

## No Analog Found

None — every file in scope has at least a role-match analog; the two "n/a" rows in the classification table are unchanged files (contract preserved, no new pattern needed).

## Metadata

**Analog search scope:** `app/`, `src/components/hero/`, `src/components/sandbox/`, `src/components/ui/`, `src/domain/colregs/`, `src/domain/geometry/`, `src/server/db/`, `src/server/api/routers/`, `prisma/`
**Files scanned:** 22 (read in full or targeted sections)
**Pattern extraction date:** 2026-07-19
