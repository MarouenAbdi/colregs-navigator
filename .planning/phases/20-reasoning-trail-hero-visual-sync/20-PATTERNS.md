# Phase 20: Reasoning-Trail & Hero Visual Sync - Pattern Map

**Mapped:** 2026-07-27
**Files analyzed:** 4 (2 restructured components, 1 extended pure-geometry module, 1 shared stylesheet)
**Analogs found:** 4 / 4

This phase modifies **no new files** — every target is an existing, already-shipped file being restructured in place. "Analogs" below are therefore split into two kinds: (a) the file's own current content, which is the primary pattern to extend/replace, and (b) sibling files in this codebase that already implement the exact structural pattern the design snapshot calls for (plain flex-div strips, `min-[900px]:` breakpoint, `.radar-sweep-dot` primitive) and should be mirrored rather than imported (per D-03/Anti-Patterns in RESEARCH.md).

## File Classification

| Modified File | Role | Data Flow | Closest Analog | Match Quality |
|----------------|------|-----------|-----------------|----------------|
| `src/components/sandbox/reasoning/ReasoningTrail.tsx` | component (presentation) | transform (classification → JSX list) | its own current body (in-place restructure) + `ChartFooterStrip.tsx`'s `.flex.flex-wrap` tile-row pattern for the header pill/copy convention | exact (self) / role-match (sibling) |
| `src/components/hero/HeroPreviewCard.tsx` | component (presentation, SVG) | transform (fixture → static SVG + strips) | its own current body (in-place restructure) + `ChartHeaderStrip.tsx` (header strip) + `ChartFooterStrip.tsx` (footer strip) | exact (self) / exact (sibling strips, "copy don't import" per D-03) |
| `src/components/hero/hero-preview-geometry.ts` | utility (pure geometry constants) | transform (design px → viewBox-scaled constants) | its own current body (extend, same derivation-comment style) | exact (self) |
| `app/globals.css` | config/stylesheet | n/a (CSS keyframes/classes) | its own `.radar-sweep-dot`/`@keyframes radar-sweep`/`prefers-reduced-motion` block (lines 202-231) | exact (self) |

No files with zero analog — this is a pure restructuring phase of pre-existing, well-isolated surfaces.

## Pattern Assignments

### `src/components/sandbox/reasoning/ReasoningTrail.tsx` (component, transform)

**Primary analog: itself** — `src/components/sandbox/reasoning/ReasoningTrail.tsx` (full file, 192 lines, already read in full above). Keep unchanged:
- `FACT_LABEL`, `formatFactValue`, `FactReadout` (lines 20-64) — fact-chip rendering logic, untouched by this phase.
- `TrailTone` type + `TONE_NUMBER_CLASSNAME`/`TONE_TAG_CLASSNAME` (lines 80-96) — five-way tone split already maps 1:1 onto the design's `dotFor()` categories; only the *visual treatment* per tone changes, not the categories.
- `trailStepTag()` (lines 98-112) — GEOMETRY/RULE N/VERDICT tag+tone derivation, untouched.
- Import of `classifyingEntryIndex`/`ruleNumber` from `./reasoning-trail-tag.js` (line 12) — untouched dependency.

**What must change — current body structure to replace** (lines 118-192):
```tsx
// CURRENT (to be replaced):
<CardHeader className="flex flex-row items-center justify-between">
  <span className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
    Reasoning Trail
  </span>
  <Badge variant="outline" className="font-mono text-[10px] font-normal text-muted-foreground">
    {trail.length} steps
  </Badge>
</CardHeader>
<CardContent className="flex flex-col gap-3">
  <ol className="flex flex-row flex-wrap gap-3 p-0">
    {trail.map((entry, index) => {
      ...
      return (
        <li key={...} className="min-w-55 flex-1 basis-55 rounded-[10px] border border-border bg-chart-surface px-[13px] py-3">
          ...
        </li>
      );
    })}
  </ol>
```

**Target structure (from 20-DESIGN-SNAPSHOT.md, Section 1):**
- Header: radar-sweep dot (14px variant) + "NAV DECISION CHAIN" + "radar acquisition" subtitle; badge copy `{trail.length} steps` → `{trail.length} contacts` (D-07). See "Code Examples" below for the exact copy-diff excerpt from RESEARCH.md.
- Body `<ol>`: `flex items-stretch gap-0` (no `flex-wrap`), base classes = column/stacked fallback, `min-[900px]:flex-row` = the horizontal row (Pitfall 2 — do NOT add a raw `max-width` media query).
- Two `<li>`s per step via `trail.flatMap((entry, index) => index < trail.length - 1 ? [cardEl, connectorEl] : [cardEl])` (per RESEARCH.md Pattern 1 and Open Question 1's recommendation) — card `<li>` is itself `flex flex-col` (Pitfall 4, required for `margin-top:auto` fact-chip bottom-pinning), connector `<li>` is `flex-0 0 34px` (`min-[900px]:` variant) / `flex-0 0 26px` stacked variant.
- Card content adds: 38px circular token (radial-gradient fill + spinning conic-gradient sweep ring behind the step number — see "New CSS" below), `CONTACT 0N` label, then existing rule-id/tag/body-text/fact-chip markup carried over.
- Connector `<li>` renders two children: the dashed line div (`className="trail-connector"`, `style={{ "--tone-color": ... }}`) and the traveling pulse dot div (`className="trail-connector-pulse"`, same custom-property pattern).

**Analog for the "plain flex-div strip with right-aligned badge" header shape:** `src/components/sandbox/chart/ChartHeaderStrip.tsx` lines 65-84 (rule chip + title + `flex-1` spacer + right-aligned pill) — the same `<div className="flex-1" />` spacer-then-pill idiom applies to the trail header's dot+label-then-badge row.

**Test analog:** `src/components/sandbox/reasoning/ReasoningTrail.test.tsx` (full file read above) — existing assertions (`"3 steps"`, `getAllByRole("listitem")`, tag/tone text queries, fact-format strings, doubt-caveat verbatim strings) all remain valid *except*:
- `"3 steps"`/`"5 steps"` text assertions (lines 98, 117) must become `"3 contacts"`/`"5 contacts"` per D-07.
- `getAllByRole("listitem")` length assertions (`toHaveLength(3)`) will now count 2N-1 `<li>`s (cards + connectors) instead of N — tests must be updated to filter to card `<li>`s only (e.g. by a `data-` attribute or class selector) or recompute the expected count as `2 * trail.length - 1`.

---

### `src/components/hero/HeroPreviewCard.tsx` (component, transform)

**Primary analog: itself** — full file read above (297 lines). Keep unchanged:
- The entire fixture/domain-call block (lines 84-129): `classifyEncounter()`, `bearing()`, `cpa()`, `chartToScreen()`, range calc, `giveWayLabel`/`verdictText` derivation, `sectorPath`/`headingVectorA/B`/`connectorMidpoint`. Zero domain logic changes per phase boundary.
- `VesselMarker` subcomponent (lines 48-82) and its two call sites (lines 235-248) — hull/label/pill rendering untouched.
- The inner SVG's grid pattern, sector gradient, range rings, north line, connector line, heading-vector dashed lines (lines 148-222) — extend (add 3rd ring + compass ticks + cardinal/range labels + center hub), do not replace.

**What must change:**
1. **`CardHeader`** (lines 133-143, "Live classification" eyebrow + "BRG-ring · 12 NM") — **removed entirely** per D-04, replaced by an **in-`CardContent` header strip** atop the chart (per D-03), mirroring:

   **Analog:** `src/components/sandbox/chart/ChartHeaderStrip.tsx` lines 65-104 (full component read above) — copy this shape (rule chip + truncating title + `flex-1` spacer + risk pill with dot), not import it:
   ```tsx
   // Source: src/components/sandbox/chart/ChartHeaderStrip.tsx lines 65-104
   <div className="flex items-center gap-3 border-b border-border px-4 py-3">
     <div className="flex min-w-0 items-center gap-2">
       <span className="w-fit shrink-0 rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold text-background ${accent}">
         {bannerRuleBadge(classification)}
       </span>
       <h3 className="truncate text-lg font-bold text-foreground">{title}</h3>
     </div>
     <div className="flex-1" />
     <div className="flex max-w-[46%] items-center gap-[7px] rounded-md border px-[11px] py-[6px] text-[12.5px] ${riskToneClassName}">
       <span aria-hidden="true" className="size-2 shrink-0 rounded-full ${riskDotClassName}" />
       <span className="truncate">{risk.text}</span>
     </div>
   </div>
   ```
   Per Anti-Patterns (RESEARCH.md): do **not** import `deriveChartHeaderRisk`/`CHART_HEADER_RISK_TONE_CLASSNAME` from `chart-header-risk.ts` directly — copy the small CPA-threshold risk-tier logic into a Hero-local helper (e.g. inline in `HeroPreviewCard.tsx` or a small local const), exactly as `ChartHeaderStrip.tsx` itself did from the file it replaced. Reference for the threshold logic to copy: `src/components/sandbox/chart/chart-header-risk.ts` (full file read above, lines 15-51 — `cpaNm < 0.3` → high, `< 1.0` → watch, else ok).

2. **Below-chart verdict banner** (lines 252-261, `Badge` "Rule 15" + verdict sentence in a bordered box) — **removed**, folded into the new header strip's rule-chip + title.

3. **Footer 3-column grid** (lines 263-293) — **replaced** with a single-row strip (LIVE + RANGE + BEARING A→B + CPA + TCPA), mirroring:

   **Analog:** `src/components/sandbox/chart/ChartFooterStrip.tsx` lines 108-139 (full component read above) — copy the `Tile` subcomponent shape and the LIVE-dot-then-Tile-row layout, NOT the component itself (D-03: no shared code with `ChartPanel.tsx`'s sibling tree):
   ```tsx
   // Source: src/components/sandbox/chart/ChartFooterStrip.tsx lines 37-53 (Tile) and 119-139 (row)
   function Tile({ label, value }: { label: string; value: string }) {
     return (
       <div className="rounded-lg border border-border bg-chart-surface px-[11px] py-[10px]">
         <div className="font-mono text-[9.5px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</div>
         <div className="mt-0.75 font-mono text-[17px] font-semibold text-foreground">{value}</div>
       </div>
     );
   }
   // ...
   <div className="flex flex-wrap items-center gap-[22px] px-[18px] py-[13px] font-mono">
     <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-rule-accent uppercase">
       <span aria-hidden="true" className="size-1.5 ??? rounded-full bg-rule-accent" />
       LIVE
     </div>
     <Tile label="RANGE" value={...} />
     <Tile label="BEARING A→B" value={...} />
     <Tile label="CPA" value={...} />
     <Tile label="TCPA" value={...} />
   </div>
   ```
   **D-02 divergence point:** the `<span className="size-1.5 animate-pulse rounded-full bg-rule-accent" />` LIVE dot at `ChartFooterStrip.tsx` line 130-132 is the exact pattern to *avoid copying verbatim* — Hero's version must use a different class (e.g. a new `.hero-live-dot` CSS animation in `app/globals.css`, slower duration and/or dimmer opacity/color than Tailwind's stock `animate-pulse`) so it reads as visually distinct on close inspection. TCPA value is already computed and available as `cpaResult.value.tcpaMinutes` (confirmed present in the existing `cpa()` call at line 100 of `HeroPreviewCard.tsx` — just not yet surfaced in JSX).

4. **Bezel SVG additions** (extend the existing `<svg viewBox="0 0 320 200">` block, lines 148-222) — add 3rd range ring, compass-tick dashed ring (2 stacked `<circle>`s with `strokeDasharray`), N/S/E/W `<text>` cardinal labels, range `<text>` labels, center hub `<circle>`, all driven by new constants from `hero-preview-geometry.ts` (see below) — must stay within the existing 320×200 viewBox per Pitfall 3 (no card-height growth).

5. **Radar-sweep overlay** — a new `position:absolute` `<div>` sibling to the SVG (not inside it), inside the same relatively-positioned chart-wrapper `<div>` (currently `<div className="overflow-hidden rounded-md border border-border bg-[#0B0B0E]">` at line 145) — needs `position: relative` added to that wrapper. Content per `20-DESIGN-SNAPSHOT.md` Section 2 "Radar sweep overlay": `left:50%;top:50%;width:47.9%;aspect-ratio:1;transform:translate(-50%,-50%)`, inner div with `conic-gradient(...)` + `animation:sweep 4.5s linear infinite` + `mix-blend-mode:screen` — expressed as a `.hero-radar-sweep`/`.hero-radar-sweep-inner` class pair in `app/globals.css` (see below), not inline template-literal CSS (CLAUDE.md convention).

**Test analog:** `src/components/hero/Hero.test.tsx` (exists, references `HeroPreviewCard`) and `src/components/hero/hero-preview-fixture.test.ts` — check both for text-content assertions against the removed "Live classification"/"BRG-ring · 12 NM" strings and the 3-tile grid; update to match new header/footer strip copy.

---

### `src/components/hero/hero-preview-geometry.ts` (utility, transform)

**Primary analog: itself** — full file read above (65 lines). Keep unchanged: `HERO_CONTAINER_SIZE`, `HERO_VIEW_BOX`, `HERO_CHART_CENTER`, `VESSEL_A_HULL_COLOR`/`VESSEL_B_HULL_COLOR`/`CONNECTOR_STROKE`, `bearingSectorPath()` — all untouched; the SVG's coordinate system and vessel-position solve stays exactly as-is (Pitfall 3 constraint).

**Pattern to extend (same derivation-comment style, do not deviate):**
```ts
// Source: hero-preview-geometry.ts lines 34-37 (existing 2-ring precedent to extend to 3)
export const HERO_OUTER_RING_RADIUS_PX = HERO_CONTAINER_SIZE.width * (115 / 480);
export const HERO_INNER_RING_RADIUS_PX = HERO_CONTAINER_SIZE.width * (60 / 480);
```
Per `20-DESIGN-SNAPSHOT.md` Section 2 "Bezel": design's 3 rings are `r=42, r=84, r=126` on its own 480-wide canvas — but note the design's *own* canvas is 480×300 (not this codebase's 320×200 — same 8:5 aspect, different absolute scale) — the snapshot's own comment gives the correct fraction-of-half-width ratios to reuse: `42/240=.175, 84/240=.35, 126/240=.525`. Follow the exact style of the existing derivation comments (lines 10-24, 34-37) — every new constant must carry a "why this exact number" comment tracing back to the design source, per this file's established convention and CLAUDE.md's "comments: WHY only" rule. New constants needed: a 3rd ring radius, compass-bezel outer radius + two dash-array pairs (minor/major ticks), cardinal-label positions (N/S/E/W at bezel edge), range-label text values/positions, center-hub radius.

**Test analog:** No dedicated `hero-preview-geometry.test.ts` currently exists (only `hero-preview-fixture.test.ts`) — if new derivation math (e.g. a `compassTickPath()`-style helper analogous to `bearingSectorPath()`) is added, the closest existing test-shape analog is `hero-preview-fixture.test.ts`'s numeric-fixture-assertion style, or `chart-panel-geometry.test.ts` (`src/components/sandbox/chart/chart-panel-geometry.test.ts`) for a pure-geometry-module test pattern.

---

### `app/globals.css` (config/stylesheet, n/a)

**Primary analog: itself** — the existing `.radar-sweep-dot`/`@keyframes radar-sweep`/`prefers-reduced-motion` block, full excerpt already read above (lines 202-231):
```css
/* Source: app/globals.css lines 209-231 (existing Phase 19 precedent, reuse structurally for every new animation this phase adds) */
@keyframes radar-sweep {
  to {
    transform: rotate(360deg);
  }
}

.radar-sweep-dot {
  position: relative;
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  background: conic-gradient(from 0deg, transparent, var(--primary) 60%, transparent);
}

@media (prefers-reduced-motion: no-preference) {
  .radar-sweep-dot {
    animation: radar-sweep 2s linear infinite;
  }
}
```
**Consumers of `.radar-sweep-dot` to check/extend, not duplicate:** `src/components/sandbox/SandboxContainer.tsx` line 75, `src/components/tour/GuidedTourModal.tsx` line 86 — both `<span className="radar-sweep-dot" aria-hidden="true" />`. The trail header's 14px dot (D-05 layer 3 precedent, called out in `20-DESIGN-SNAPSHOT.md` as "same spinning-conic-gradient token used elsewhere") should be a `.radar-sweep-dot--lg` size variant (per RESEARCH.md's own "Code Examples" section) rather than a new duplicate rule set — base rule's two current 8px consumers must stay untouched.

**New rules needed this phase** (all following the identical base-static-then-`prefers-reduced-motion`-gated-`animation` structure shown above):
1. `.trail-connector` + `@keyframes conduit` — dashed line, `background-position` animation. Exact CSS given verbatim in RESEARCH.md's Pattern 2 example (reproduced from `20-DESIGN-SNAPSHOT.md`'s `connLineStyle`/`conduit` keyframe, Section 1).
2. `.trail-connector-pulse` + `@keyframes travel` — traveling dot, `left`/`opacity` animation. Source: `20-DESIGN-SNAPSHOT.md` lines 34-38 (`pulseStyle`/`travel` keyframe verbatim).
3. `.trail-token-sweep-ring` (new class, per RESEARCH.md Open Question 2's recommendation) + reuse `@keyframes radar-sweep` — per-token spinning ring inside the 38px step token, `z-index` below the number.
4. `.hero-radar-sweep` (outer positioned wrapper) + `.hero-radar-sweep-inner` (conic-gradient + `mix-blend-mode:screen`) + `@keyframes sweep` — Hero's overlay. Source: `20-DESIGN-SNAPSHOT.md` Section 2 "Radar sweep overlay" verbatim markup/CSS.
5. `.hero-live-dot` + a distinguishing keyframe/duration (D-02, Claude's Discretion on exact tuning) — deliberately NOT reusing Tailwind's `animate-pulse` utility alone, per the Anti-Patterns note above.

Every one of these five must follow the exact `@media (prefers-reduced-motion: no-preference) { .foo { animation: ... } }` gating structure (D-06) — base/static rule unconditional, `animation` property itself inside the media query, matching the `.radar-sweep-dot` precedent exactly (not the Hero design source, which has no such guard).

---

## Shared Patterns

### "Copy, don't import" cross-feature isolation (D-03)
**Source:** `src/components/sandbox/chart/ChartHeaderStrip.tsx` line 1-11 doc comment ("Mines `VerdictBanner.tsx`'s ... logic verbatim ... this file copies rather than imports") and `ChartFooterStrip.tsx` line 1-12 doc comment (identical pattern for `InstrumentReadouts.tsx`).
**Apply to:** `HeroPreviewCard.tsx`'s new header/footer strips — copy the small derivation helpers (risk-tier thresholds, tile shape) as Hero-local code; never `import` from `src/components/sandbox/chart/*`.

### Plain flex-div strip, not nested shadcn `Card`
**Source:** `ChartHeaderStrip.tsx`/`ChartFooterStrip.tsx` (both render bare `<div>` trees, no `CardHeader`/`CardContent`).
**Apply to:** Hero's new header/footer strips render as plain `<div>`s inside the existing single `CardContent`, not as separate `Card`/`CardHeader` instances.

### `min-[900px]:` breakpoint convention
**Source:** `src/components/sandbox/SandboxContainer.tsx` line 44, `src/components/sandbox/chart/ChartFooterStrip.tsx` lines 78-79, `src/components/hero/Hero.tsx` lines 24-25, `src/components/gallery/GalleryContainer.tsx` lines 22/26/45.
**Apply to:** `ReasoningTrail.tsx`'s `<ol>`/card/`<li>`/connector classes — base classes = stacked/column fallback, `min-[900px]:` prefix = the horizontal-row layout (Pitfall 2 — translate the design's `max-width:900px` query into this idiom, do not add a new raw `@media` block).

### Named CSS animation, class-toggle only + `prefers-reduced-motion` gate
**Source:** `app/globals.css` lines 209-231 (`.radar-sweep-dot`), and the `--grid-opacity`/`--glow` custom-property technique at lines 186-200 (`.section-grid-overlay`).
**Apply to:** All five new animation classes this phase introduces (`.trail-connector`, `.trail-connector-pulse`, `.trail-token-sweep-ring`, `.hero-radar-sweep`/`.hero-radar-sweep-inner`, `.hero-live-dot`) — components set only a CSS custom property (e.g. `style={{ "--tone-color": hex } as CSSProperties}`) for the one value that varies per call site (tone color), never a composed animation/gradient string.

### Fixed-shape trail derivation, unchanged
**Source:** `src/components/sandbox/reasoning/reasoning-trail-tag.ts` (full file read above) — `classifyingEntryIndex()`/`ruleNumber()`.
**Apply to:** No changes required; `ReasoningTrail.tsx` continues to import and call these exactly as today.

## No Analog Found

None. Every file this phase touches already exists with a well-understood current structure, and every new visual technique the design snapshot requires (breakpoint flip, plain-flex strip, radar-sweep spin primitive, reduced-motion gating) already has a proven in-codebase precedent to mirror.

## Metadata

**Analog search scope:** `src/components/sandbox/reasoning/`, `src/components/hero/`, `src/components/sandbox/chart/`, `app/globals.css`, `src/components/sandbox/SandboxContainer.tsx`, `src/components/tour/GuidedTourModal.tsx`
**Files scanned:** 8 source files fully read (`ReasoningTrail.tsx`, `reasoning-trail-tag.ts`, `HeroPreviewCard.tsx`, `hero-preview-geometry.ts`, `hero-preview-fixture.ts`, `ChartHeaderStrip.tsx`, `ChartFooterStrip.tsx`, `chart-header-risk.ts`), plus `app/globals.css` (full), `ReasoningTrail.test.tsx` (full), `20-DESIGN-SNAPSHOT.md` (full), and targeted greps for `min-[900px]:`/`radar-sweep-dot`/`animate-pulse`/`prefers-reduced-motion` usage across `src/` and `app/`
**Pattern extraction date:** 2026-07-27
