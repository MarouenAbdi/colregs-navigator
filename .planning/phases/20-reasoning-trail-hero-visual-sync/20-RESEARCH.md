# Phase 20: Reasoning-Trail & Hero Visual Sync - Research

**Researched:** 2026-07-27
**Domain:** Cosmetic React/Tailwind restructuring of two existing static/fixture-driven surfaces (CSS-only animation, no new runtime logic)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Hero's "LIVE" indicator vs. the Phase 7 static precedent
- **D-01:** Port the design's pulsing LIVE dot into Hero's new footer readout strip — this phase's "visually match the updated design file" goal (Roadmap criterion 3) supersedes Phase 7's D-01, which predates this design revision.
- **D-02:** The Hero LIVE dot must be *visually distinguished* from the real Sandbox's LIVE dot (`ChartFooterStrip.tsx`'s `animate-pulse` + `bg-rule-accent`), not a byte-for-byte reuse — e.g. a slower or dimmer pulse. This preserves the substance of D-01 (Hero must not visually claim to be wired to live vessel state) even though the literal "no pulsing dot" rule is now superseded. Classification values themselves remain fixture-driven and unchanged (HERO-05's explicit constraint).

#### Hero layout restructuring scope
- **D-03:** Go for full layout parity with the design, not a surface-only styling pass:
  - Move the rule chip + encounter title + risk pill into a header strip atop the chart (mirrors how SBOX-06 already restructured the real Sandbox chart's header).
  - Expand the footer from today's 3-metric grid (RANGE/BEARING/CPA) to the design's 4-item row (RANGE/BEARING A→B/CPA/TCPA) — TCPA is a net-new metric for this card.
- **D-04:** Remove the current `CardHeader`'s "Live classification" eyebrow line and "BRG-ring · 12 NM" label entirely — the new in-card header strip fully replaces its role. Do not keep a trimmed/relocated version of it.

#### Trail animation density
- **D-05:** Port all three of the design's CSS-only animation layers, not just the Roadmap-required connector:
  1. Dashed connector flow (`conduit` keyframe — animates `background-position`, required by Roadmap criterion 2)
  2. Traveling pulse dot along each connector (`travel` keyframe — animates `left`/`opacity`)
  3. Spinning radar-sweep ring inside each step's numbered token (`sweep` keyframe — animates `transform: rotate`)

  All three are CSS-only (no `getBoundingClientRect`/`getBBox`), satisfying the jsdom-measurement-ban precedent regardless of density chosen.
- **D-06:** All animations introduced by this phase (trail's three layers, plus Hero's radar-sweep overlay and LIVE pulse) must be wrapped in a `@media (prefers-reduced-motion: no-preference)` guard, falling back to a static equivalent otherwise. The design source itself has no such guard — this is this phase's own addition, not something to extract from the design.

#### Trail copy details
- **D-07:** Adopt the design's copy verbatim: step-count badge changes from "N steps" to "N contacts"; header subtitle becomes "NAV DECISION CHAIN · radar acquisition" (not just "NAV DECISION CHAIN" alone).

#### Trail responsive strategy (confirmed via existing convention, not re-litigated)
- **D-08:** Use the design's own fallback exactly: single horizontal flex row (`flex:1 1 0` per card, `flex:0 0 34px` per connector) at ≥900px, `flex-direction: column` stack at <900px with connectors shrunk to a fixed-height band. `900px`/`min-[900px]:` is already this codebase's established breakpoint (`SandboxContainer.tsx`, `ChartFooterStrip.tsx` both use it) — not a new convention.

### Claude's Discretion
- Exact color/opacity/timing tuning for the Hero LIVE dot's "subtly distinguished" pulse (D-02) — no specific numbers were requested, only that it must read as different from the real Sandbox's indicator on close inspection.
- Whether the reduced-motion fallback (D-06) shows a fully static state or a single non-repeating transition — implementation detail, not a visual outcome the user specified.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SBOX-09 | Reasoning trail renders as a horizontal sequence of connected step cards ("NAV DECISION CHAIN"), replacing the vertical list | See Architecture Patterns (Pattern 1: two-list-item-per-step flex row), Common Pitfalls 1/2/4, and Code Examples. `ReasoningTrail.tsx`/`reasoning-trail-tag.ts` current structure documented; `docs/reasoning-trails.json` trail-length distribution (3-5 steps across 7 scenarios) verified to stress-test the layout. |
| HERO-05 | Hero's live-classification preview card visual details (bezel accents, radar sweep overlay, readout styling) are synced to the updated design file; the card remains fully static/fixture-driven | See Architecture Patterns (Pattern 3: sub-region flex-div strips), Common Pitfalls 3, `hero-preview-geometry.ts`/`HeroPreviewCard.tsx`/`hero-preview-fixture.ts` current-state documentation, and the Anti-Patterns section (no shared code with `ChartPanel.tsx`, no verbatim LIVE-dot reuse). |
</phase_requirements>

## Summary

Both target surfaces already exist and are well-isolated: `ReasoningTrail.tsx` (a flex-wrap grid of step cards) and `HeroPreviewCard.tsx` + `hero-preview-geometry.ts` (a fixture-driven SVG chart card). This phase is a pure presentation restructuring — no domain, tRPC, or Prisma code is touched, and no new npm packages are required (everything the design snapshot specifies is achievable with Tailwind utilities, a handful of new `app/globals.css` keyframe rules, and SVG). The codebase already has the exact precedent needed for every open question: a `min-[900px]:` breakpoint convention (`SandboxContainer.tsx`, `ChartFooterStrip.tsx`, `Hero.tsx`), a `.radar-sweep-dot` conic-gradient spin primitive checked into `app/globals.css` since Phase 19, and a "plain flex div, not shadcn `Card` primitives" pattern for in-card header/footer strips (`ChartHeaderStrip.tsx`, `ChartFooterStrip.tsx`) that Hero's new header/footer strips should mirror.

The trail's horizontal-row-plus-connector layout is achievable with zero runtime measurement: `display:flex` with `flex:1 1 0` step cards and `flex:0 0 34px` connector segments is inherently resilient to card count (3-5, per `docs/reasoning-trails.json`) because flex-basis math, not JS measurement, distributes the row. The connector's dashed "flow" and "traveling pulse" are both driven by `background-position`/`left` CSS animations on fixed-size elements — no `getBoundingClientRect()` involved anywhere in the design's own markup.

**Primary recommendation:** Restructure `ReasoningTrail.tsx`'s body to the two-list-item-per-step flex-row pattern verbatim from `20-DESIGN-SNAPSHOT.md` (Tailwind arbitrary flex values + a `<style>`-free approach, i.e. new named keyframes/classes added to `app/globals.css`, matching the `.section-grid-overlay`/`.radar-sweep-dot` precedent), and restructure `HeroPreviewCard.tsx`'s header/footer into plain flex-div strips mirroring `ChartHeaderStrip.tsx`/`ChartFooterStrip.tsx`'s existing non-`Card`-primitive pattern, while keeping the SVG chart itself and `hero-preview-geometry.ts`'s pure-function split unchanged in spirit (extend with 3-ring/compass-bezel constants, do not replace the existing derivation approach).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Reasoning-trail horizontal layout + connectors | Browser/Client (React component + CSS) | — | Pure presentation, no server involvement; `ReasoningTrail.tsx` already receives `classification` as a prop from a parent, no new data fetching |
| Trail step tone/tag derivation | Browser/Client (existing pure function) | — | `reasoning-trail-tag.ts` stays untouched — presentation-only phase |
| Trail/Hero CSS animations (conduit, travel, sweep, radar overlay) | Browser/Client (CSS keyframes in `app/globals.css`) | — | No JS animation loop; `prefers-reduced-motion` gating is also pure CSS |
| Hero bezel geometry (rings, compass ticks, cardinal labels) | Browser/Client (pure TS in `hero-preview-geometry.ts` + SVG in `HeroPreviewCard.tsx`) | — | Extends the existing split; SVG is real DOM, testable via RTL |
| Hero header/footer readout strips | Browser/Client (React component, flex-div, no shadcn `Card` primitives for the strips themselves) | — | Mirrors `ChartHeaderStrip.tsx`/`ChartFooterStrip.tsx` precedent exactly |
| Fixture data (`heroPreviewVesselA/B`) | Browser/Client (static constant) | — | No change — TCPA metric it needs (`cpaResult.value.tcpaMinutes`) is already computed in `HeroPreviewCard.tsx`, just not yet displayed |

No API/backend, database, or CDN tier involvement — this phase is 100% within the Next.js client-rendered component tree already in `src/components/hero/` and `src/components/sandbox/reasoning/`.

## Package Legitimacy Audit

Not applicable. This phase installs **zero new npm packages** — every requirement (horizontal flex layout, CSS keyframe animations, `prefers-reduced-motion` media query, conic/radial gradients, SVG bezel geometry) is achievable with the already-installed stack (Tailwind CSS 4.3.3, React 19.2.7, native SVG). No `npm install`, `pip install`, or `cargo add` is required for this phase — the Package Legitimacy Gate is skipped.

## Standard Stack

### Core
No new libraries. This phase uses only what is already installed and already used elsewhere in the codebase:

| Tool | Version (installed) | Purpose | Why Standard (for this codebase) |
|------|---------|---------|--------------|
| Tailwind CSS | 4.3.3 [VERIFIED: package.json] | Utility classes for flex layout, spacing, the `min-[900px]:` arbitrary breakpoint | Already the project's only styling tool; `min-[900px]:` is an established convention (`SandboxContainer.tsx`, `ChartFooterStrip.tsx`, `Hero.tsx`) |
| Native CSS `@keyframes` in `app/globals.css` | — | `conduit`/`travel`/`sweep` animations, `prefers-reduced-motion` guards | CLAUDE.md's "no raw CSS composed as strings in component files" convention + existing `.radar-sweep-dot`/`.section-grid-overlay` precedent in `app/globals.css` |
| Native SVG (`<circle>`, `<line>`, `<text>`) | — | Hero's 3rd range ring, compass-tick bezel, cardinal labels, range labels, center hub | Matches this project's locked "no canvas libs" decision (CLAUDE.md "The Big Decision: SVG + Pointer Events") — Hero's chart is already SVG, this only adds more SVG primitives |
| React 19.2.7 | 19.2.7 [VERIFIED: package.json] | Component restructuring | Locked project stack |

### Supporting
None — no new supporting libraries needed.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Plain CSS `@keyframes` in `app/globals.css` | Tailwind `animate-[...]` arbitrary-value utility inline in JSX | Rejected: CLAUDE.md explicitly bans composing raw CSS/animation strings inside component files; named keyframes in globals.css is the established, already-used pattern |
| Flex row with `flex:1 1 0` cards | CSS Grid with `grid-template-columns: repeat(N, 1fr)` | Grid would need to know N ahead of render to size connector columns differently from card columns (two different track sizes alternating) — flex's `flex:0 0 34px` fixed-basis connector items achieve the same result more simply and match the design's own markup verbatim |
| `getBoundingClientRect()`-free connector (pure CSS gradient) | JS-measured connector (draw an actual SVG/canvas line between two measured card edges) | Explicitly banned by Success Criterion 2 and the project's existing jsdom-measurement-ban precedent (`getScreenCTM()`/`getBBox()` not implemented in jsdom — see `hero-preview-geometry.ts` comments and CLAUDE.md's "jsdom caveat") |

**Installation:** None required — no `npm install` needed for this phase.

## Architecture Patterns

### System Architecture Diagram

```
classification (ClassificationResult, from useEncounterClassification or Hero's fixed fixture)
        │
        ▼
┌───────────────────────────────┐        ┌──────────────────────────────────┐
│  ReasoningTrail.tsx            │        │  HeroPreviewCard.tsx              │
│  (Sandbox reasoning card slot) │        │  (marketing Hero, standalone)     │
│                                 │        │                                    │
│  trail.map(entry, index) ──┐   │        │  classifyEncounter(fixedFixture)   │
│                             │   │        │        │                          │
│                             ▼   │        │        ▼                          │
│  trailStepTag() (unchanged) │   │        │  bearing()/cpa() (unchanged)      │
│      │                      │   │        │        │                          │
│      ▼                      │   │        │        ▼                          │
│  <ol data-r="cond-ol">      │   │        │  ┌──────────────────────────┐    │
│    flex row, cnode/cwire    │   │        │  │ Header strip (rule chip  │    │
│    alternating li's         │   │        │  │  + title + risk pill)    │    │
│    (2 per step, connector   │   │        │  ├──────────────────────────┤    │
│     omitted after last)     │   │        │  │ SVG chart (bezel rings + │    │
│  └──────────────────────────┘   │        │  │  compass ticks + hull +  │    │
│                                 │        │  │  bearing sector)         │    │
│  CSS-only: conduit/travel/     │        │  │  + radar-sweep overlay   │    │
│  sweep keyframes in            │        │  │  (absolutely-positioned  │    │
│  app/globals.css               │        │  │  div, conic-gradient)    │    │
│                                 │        │  ├──────────────────────────┤    │
└───────────────────────────────┘        │  │ Footer strip (LIVE +     │    │
                                           │  │  RANGE/BEARING/CPA/TCPA) │    │
                                           │  └──────────────────────────┘    │
                                           └──────────────────────────────────┘
```
A reader can trace: `classification`/fixture data in → pure tag/tone or geometry derivation → JSX renders step cards or SVG+strips → CSS keyframes (defined once in `app/globals.css`, referenced by class name only) animate presentation, with zero JS measurement loop anywhere in the path.

### Recommended Project Structure
No new files/folders are required. Modify in place:
```
src/components/sandbox/reasoning/
├── ReasoningTrail.tsx        # restructure body markup (2-list-item-per-step flex row)
├── reasoning-trail-tag.ts    # UNCHANGED — tone/tag derivation stays as-is
src/components/hero/
├── HeroPreviewCard.tsx        # restructure header/footer into strips, add bezel SVG elements + radar-sweep overlay div
├── hero-preview-geometry.ts   # ADD: compass-tick ring radius/dasharray constants, 3rd range ring, cardinal-label positions (extends existing pure-constant pattern)
├── hero-preview-fixture.ts    # UNCHANGED — already computes tcpaMinutes via cpa(), just needs to be surfaced in the new footer
app/globals.css
├── (ADD) .trail-connector, @keyframes conduit/travel  — dashed-flow + traveling-pulse connector
├── (ADD) .trail-token-sweep or reuse/extend .radar-sweep-dot — per-token spinning ring
├── (ADD) .hero-radar-sweep-overlay, possibly reusing @keyframes radar-sweep with a new duration — Hero's overlay sweep
```

### Pattern 1: Two-list-item-per-step flex row (trail restructuring)
**What:** Each trail entry renders as a `cnode` (step card, `flex:1 1 0`) list item immediately followed by a `cwire` (connector, `flex:0 0 34px`) list item — except after the last entry, which omits the connector.
**When to use:** Any time you need N boxes joined by N-1 connectors in a single row without JS measurement.
**Example:**
```tsx
// Source: 20-DESIGN-SNAPSHOT.md (design's cond-ol/cnode/cwire markup), adapted to this codebase's map-based rendering
<ol className="flex items-stretch gap-0 p-0 min-[900px]:flex-row flex-col">
  {trail.map((entry, index) => {
    const isLast = index === trail.length - 1;
    return (
      <li key={`node-${entry.ruleId}-${index}`} className="flex flex-1 flex-col ...">
        {/* step card content */}
      </li>
      // then, only if !isLast, a second <li> sibling for the connector —
      // React fragments or an array return let both list items live at
      // the same nesting level as trail.map's other iterations.
    );
  })}
</ol>
```
Concretely: use `trail.flatMap((entry, index) => [cardElement, index < trail.length - 1 ? connectorElement : null])` (or two separate `.map`/`.reduce` passes) so the `<ol>`'s direct children alternate card/connector/card/connector/.../card with no trailing connector — this is the cleanest way to reproduce the design's two-`<li>`-per-step DOM shape from a single `.map()`.

### Pattern 2: Named CSS animation, class-toggle only (per CLAUDE.md's "no raw CSS as strings" rule)
**What:** Define `@keyframes` and animation classes once in `app/globals.css`; components only apply a class name and, if a value must vary per instance (e.g. per-tone accent color), set a single CSS custom property via `style={{ "--tone-color": value } as CSSProperties}`.
**When to use:** Every new animation this phase introduces (conduit, travel, per-token sweep, Hero's radar-sweep overlay).
**Example:**
```css
/* Source: pattern established by .radar-sweep-dot / .section-grid-overlay in app/globals.css */
.trail-connector {
  height: 3px;
  width: 100%;
  border-radius: 2px;
  background: repeating-linear-gradient(90deg, var(--tone-color) 0 5px, transparent 5px 11px);
  background-size: 11px 3px;
}
@media (prefers-reduced-motion: no-preference) {
  .trail-connector {
    animation: conduit 0.55s linear infinite;
  }
}
@keyframes conduit {
  to { background-position: 22px 0; }
}
```
```tsx
// Component only sets the one value that varies per call site (the tone color):
<div className="trail-connector" style={{ "--tone-color": toneColorHex } as CSSProperties} />
```

### Pattern 3: Sub-region flex-div strips, not nested shadcn `Card` (Hero header/footer)
**What:** `ChartHeaderStrip.tsx` and `ChartFooterStrip.tsx` are explicitly plain `<div>` flex markup, not `CardHeader`/`CardContent`, because they are "a sub-region of one merged chart card." Hero's new header/footer strips should follow the identical pattern: `HeroPreviewCard.tsx` keeps its outer `<Card>` wrapper, but the new header-strip (rule chip + title + risk pill) and footer-strip (LIVE + RANGE/BEARING/CPA/TCPA) render as plain flex divs *inside* `CardContent`, not as separate nested `Card`/`CardHeader` instances.
**When to use:** Any in-card header/footer restructuring in this codebase, per existing precedent.
**Example:**
```tsx
// Source: src/components/sandbox/chart/ChartHeaderStrip.tsx (mirror this shape, do not import it)
<div className="flex items-center gap-3 border-b border-border px-4 py-3">
  <span className="... rounded-md ...">{`Rule ${heroRuleNumber}`}</span>
  <h3 className="truncate text-lg font-bold text-foreground">{encounterTitle}</h3>
  <div className="flex-1" />
  <div className="flex items-center gap-[7px] rounded-md border px-[11px] py-[6px] ...">
    <span className="size-2 rounded-full ..." aria-hidden="true" />
    <span>{riskText}</span>
  </div>
</div>
```

### Anti-Patterns to Avoid
- **Importing `ChartHeaderStrip.tsx`/`ChartFooterStrip.tsx`/`chart-header-risk.ts` directly into Hero:** Would violate Phase 7's D-03 ("no shared code with `ChartPanel.tsx`") in spirit — those modules live in `src/components/sandbox/chart/` and are Sandbox-feature-scoped. Copy the small derivation logic (risk-tier thresholds) into a Hero-local helper instead, exactly as `ChartHeaderStrip.tsx`/`ChartFooterStrip.tsx` themselves did when they "mined... verbatim" from retired files rather than importing them.
- **Inline template-literal CSS strings for the new keyframe animations:** Violates CLAUDE.md's "no raw CSS composed as strings in component files." All three trail animation layers and Hero's radar-sweep overlay must be real `@keyframes`/class rules in `app/globals.css`.
- **Using `getBoundingClientRect()`/`getBBox()` anywhere in the connector or radar-sweep code:** Both explicitly banned by Success Criterion 2 and the project's `jsdom`-measurement precedent; not needed anyway since every visual effect here is achievable via fixed-size elements + `background-position`/`transform: rotate` animation.
- **Reusing `ChartFooterStrip.tsx`'s `animate-pulse bg-rule-accent` LIVE dot verbatim for Hero:** Explicitly rejected by D-02 — Hero's dot must be visually distinguished (e.g. slower/dimmer), requiring its own class, not the shared Tailwind `animate-pulse` utility class alone (or at minimum a different color/opacity so it doesn't read identically).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Horizontal row that self-sizes N cards + N-1 connectors | A JS-measured/computed grid-template string | Plain flexbox (`flex:1 1 0` cards, `flex:0 0 34px` connectors) | Flexbox's own layout algorithm already solves "distribute remaining space evenly among flexible items while reserving fixed space for others" — no measurement needed, and it's literally what the design source already does |
| Dashed line "flow" animation | A JS `requestAnimationFrame` loop shifting a background position or drawing frames | CSS `background-position` keyframe animation (`@keyframes conduit`) | Native, GPU-composited, zero JS runtime cost, exactly what the design source does |
| Circular spinning token (radar-sweep) | A rotating `<canvas>` or JS-rotated SVG group with a `requestAnimationFrame` loop | `@keyframes { to { transform: rotate(360deg); } }` on a `conic-gradient` background, per the existing `.radar-sweep-dot` precedent (Phase 19) | This exact primitive already exists and is proven working in this codebase (`SandboxContainer.tsx`, `GuidedTourModal.tsx`) — extend it with a size/duration variant rather than reinventing |

**Key insight:** Every visual effect this phase requires (horizontal distribution, dash-flow, traveling dot, spin) has a well-known, GPU-friendly, measurement-free CSS solution — and three of the four techniques (breakpoint convention, radar-sweep spin, plain-flex-div strips) are *already implemented and proven* elsewhere in this exact codebase. This phase is best executed as "extend existing local patterns," not "introduce new techniques."

## Common Pitfalls

### Pitfall 1: Text/content overflow inside narrow step cards at 3-card trails vs. cramped cards at 5-card trails
**What goes wrong:** `flex: 1 1 0` divides the row width evenly regardless of content length. A 3-step trail gives each card ~33% of the row width (comfortable); a 5-step trail gives each card ~20% (tight) — body text, rule-id + tag chip, and fact-chip rows can wrap awkwardly or overflow at the narrow end.
**Why it happens:** Content length (rule text, fact-readout labels) is independent of trail length, but flex-basis math only accounts for available space, not content.
**How to avoid:** Ensure every text-bearing child inside the `flex-1 1 0` card has `min-width: 0` (a well-known flexbox gotcha — flex children default to `min-width: auto`, which prevents them from shrinking below their content's intrinsic width, defeating the whole row-fitting goal) and apply `truncate`/`line-clamp` utilities where the design snapshot doesn't already specify wrapping behavior. Verify visually at both the 3-step and 5-step ends of `docs/reasoning-trails.json`'s range, not just the design's 5-step example.
**Warning signs:** Cards overflowing their `flex-1` share horizontally, or the row overflowing its container width, at either end of the 3-5 step range.

### Pitfall 2: `min-[900px]:` responsive flip direction confusion
**What goes wrong:** The design's own media query is `@media (max-width:900px)` (mobile-first override at *narrow* widths), while this codebase's established Tailwind convention is `min-[900px]:` (desktop-first utility applied at *wide* widths). These express the same breakpoint but in opposite CSS directions — a literal transcription of the design's `max-width` query as a new bespoke media query (instead of translating it into the existing `min-[900px]:` utility-class convention) would introduce a second, inconsistent breakpoint-declaration style in the same codebase.
**Why it happens:** The design snapshot is extracted from a standalone HTML prototype that doesn't share this codebase's Tailwind conventions.
**How to avoid:** Implement the horizontal-row layout as the *default* (mobile) Tailwind classes are typically the base case, so translate carefully: base classes = the column/stacked fallback, `min-[900px]:` prefixed classes = the horizontal row. Do not add a new raw `@media (max-width: 900px)` block to `app/globals.css`.
**Warning signs:** A new `@media (max-width: ...)` rule appears in `app/globals.css` for this phase — that's a signal the translation was done as literal copy instead of idiomatic Tailwind.

### Pitfall 3: Hero's radar-sweep overlay accidentally affecting the card's box height (re-triggering Phase 7's D-01 layout-shift concern)
**What goes wrong:** Phase 7's D-01 banned Hero animation specifically because "a Hero box-height change after initial paint can throw off the fragment-scroll math for `/#gallery`." The design's radar-sweep overlay is `position:absolute` (doesn't affect layout/height) — but the LIVE pulsing dot and any bezel-related sizing change (3 rings instead of 2, bigger radii) could inadvertently change the SVG's intrinsic aspect-ratio box or the footer strip's height if not scaled/sized carefully.
**Why it happens:** D-01/D-02 in this phase's own CONTEXT.md already navigated the *animation* half of this concern (LIVE dot ported, but "subtly distinguished") — but the *layout* half (bezel ring count going from 2 to 3, footer going from 3 tiles to 5 items) is a separate risk not explicitly re-litigated.
**How to avoid:** Confirm the SVG `viewBox`/container aspect ratio (currently 320×200, 8:5) stays fixed even as bezel constants are extended to 3 rings + compass ticks (per `hero-preview-geometry.ts`'s existing scaling-derivation comments) — the ADDED SVG elements should live *within* the existing viewBox, not force a taller/wider card. Verify the footer strip's height with 5 items (LIVE + 4 metrics) doesn't visibly grow taller than the current 3-metric grid in a way that shifts subsequent page layout — a human-browser check of `/#gallery` fragment-scroll behavior post-change is warranted given D-01's explicit original rationale.
**Warning signs:** Visual diff shows the Hero card's total height changed noticeably vs. before this phase; `/#gallery` anchor scroll lands at a slightly different vertical position than before.

### Pitfall 4: Flexbox children needing `flex-direction: column` for `margin-top: auto` bottom-pinning
**What goes wrong:** The design snapshot's step card relies on `margin-top: auto` to pin fact chips to the bottom of the card ("this requires the card to be a column flexbox"). If the restructured `<li>` card element isn't itself `display:flex; flex-direction:column`, the `margin-top:auto` trick silently does nothing (falls back to normal document flow spacing).
**Why it happens:** Easy to carry over only the *outer* row's `flex:1 1 0` sizing and forget the *inner* per-card flex-column requirement needed for the bottom-pinning behavior.
**How to avoid:** Explicitly set `flex flex-col` (Tailwind) on each step card's own class list, not just on the parent `<ol>`.
**Warning signs:** Fact chips floating immediately after body text instead of anchored to the card's bottom edge, especially visible when card content lengths vary across the 3-5 step range.

## Code Examples

### Current trail step-count badge → "N contacts" (D-07 copy change)
```tsx
// Source: current src/components/sandbox/reasoning/ReasoningTrail.tsx line 129-130
{trail.length} steps
// becomes:
{trail.length} contacts
```

### Reduced-motion guard pattern (already proven in app/globals.css)
```css
/* Source: app/globals.css lines 224-231 (existing Phase 19 precedent) */
@media (prefers-reduced-motion: no-preference) {
  .radar-sweep-dot {
    animation: radar-sweep 2s linear infinite;
  }
}
```
Apply the identical structural pattern (base static styles unconditionally, `animation` property gated inside the media query) to every new keyframe class this phase introduces (`.trail-connector`, the per-token sweep, `.hero-radar-sweep-overlay`, and the Hero LIVE dot's distinguished pulse).

### Extending `.radar-sweep-dot` for a larger, differently-timed variant (trail header dot, per design's "14px, same spinning-conic-gradient token used elsewhere")
```css
/* New: a size/duration variant, not a duplicate rule set — mirrors
   SectionGridBackground's "--grid-opacity" custom-property technique for
   the one dimension that legitimately varies per call site. */
.radar-sweep-dot {
  /* existing 8px base rule stays untouched for its two current consumers */
}
.radar-sweep-dot--lg {
  width: 14px;
  height: 14px;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Trail: `flex flex-row flex-wrap gap-3` grid of cards (current `ReasoningTrail.tsx`) | Single-row `display:flex` (no wrap) with alternating card/connector list items | This phase | Cards no longer wrap to a new line at narrow widths — the design's own `<900px` fallback instead flips the whole `<ol>` to `flex-direction: column` |
| Hero: below-chart verdict banner + 3-metric grid, no header strip | In-card header strip (rule chip + title + risk pill) atop chart, footer strip with 4 metrics + LIVE dot | This phase | Matches the Sandbox's own SBOX-06/SBOX-07 header/footer-strip restructuring (Phase 18), bringing Hero to visual parity with the rest of the redesigned surfaces |
| Hero bezel: 2 plain concentric rings | 3 range rings + compass-tick dashed ring + cardinal labels + range labels + center hub | This phase | Bezel now visually matches the real Sandbox chart's richer instrument-panel aesthetic |

**Deprecated/outdated:** The current `ReasoningTrail.tsx`'s `flex-wrap` grid and `HeroPreviewCard.tsx`'s below-chart verdict-banner layout are both being replaced by this phase — not "deprecated" in an external-library sense, just this codebase's own prior-phase output being superseded per the updated design file.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The `@testing-library/user-event` version note in CLAUDE.md's Tech Stack ("verify at install time") is stale/irrelevant to this phase — this phase touches presentation only, no new pointer-drag interaction is introduced by either surface | Standard Stack | None — flagged only for completeness; this phase does not depend on that library at all |
| A2 | Recommending a Hero-local copy of `deriveChartHeaderRisk()`'s threshold logic (rather than importing `chart-header-risk.ts`) is the right call to preserve D-03's "no shared code with ChartPanel.tsx" intent | Anti-Patterns | Low — if wrong, the fix is a one-line import change; the planner/user may instead decide direct reuse is fine since `chart-header-risk.ts` isn't literally `ChartPanel.tsx`. Flagged as a judgment call, not a hard technical constraint. |
| A3 | Hero's SVG `viewBox`/container aspect ratio (320×200) can accommodate the design's 3rd range ring + compass-tick ring + cardinal/range labels without needing to grow the card's box height (Pitfall 3) | Common Pitfalls | Medium — if the added bezel elements genuinely need more visual room, the planner may need an explicit "verify no card-height growth" checkpoint task, or accept a small height change and re-verify `/#gallery` scroll behavior |

**If this table is empty:** N/A — see entries above.

## Open Questions (RESOLVED)

1. **Exact DOM/CSS technique for the two-`<li>`-per-step alternation from a single `trail.map()`**
   - What we know: The design source's raw HTML literally emits two sibling `<li>` elements per step (one `cnode`, one `cwire`), the `cwire` omitted after the last step.
   - What's unclear: This codebase currently does a straightforward `trail.map((entry, index) => <li>...)`. The cleanest idiomatic React way to interleave a second conditional sibling per iteration (an array-returning `.flatMap()`, two `.map()` passes zipped together, or a `<>` fragment per iteration) isn't specified by the design snapshot — it's an implementation-detail choice for the planner/implementer.
   - **RESOLVED:** Recommendation: Use `trail.flatMap((entry, index) => index < trail.length - 1 ? [cardEl, connectorEl] : [cardEl])` — a single pass, keys derived from `entry.ruleId`+index for the card and `entry.ruleId`+index+"-wire" for the connector, avoiding key collisions.

2. **Whether the per-token sweep ring (Pattern inside each 38px step token) should be a size/color variant of the existing `.radar-sweep-dot` class or a wholly separate class**
   - What we know: Design snapshot explicitly says the trail header's small radar-sweep dot is "same spinning-conic-gradient token used elsewhere" (i.e. reuse `.radar-sweep-dot`'s existing 8px pattern, just visually larger at 14px per the header). The *per-step-token* sweep ring, however, sits as a ring *behind* a solid-color radial-gradient disc with a number on top — structurally different from the simple dot (`.radar-sweep-dot` IS the whole visible element; the token's sweep is a sub-layer inside a bigger composite element).
   - What's unclear: Exact class/property split between the token's static radial-gradient disc, its spinning conic-gradient ring layer, and the number text z-index stack.
   - **RESOLVED:** Recommendation: Introduce `.radar-sweep-dot--lg` (or similar) for the header's 14px reuse case, and a new `.trail-token-sweep-ring` class (absolutely positioned inside the 38px token, `z-index` below the number) for the per-token case — both referencing the same `@keyframes radar-sweep` rotation, since both need only "spin 0→360deg linearly, forever, unless reduced-motion."

## Environment Availability

Not applicable — this phase has no external tool/service/runtime dependencies beyond the already-installed Node/npm toolchain (no database, Docker, or third-party API involvement for a pure client-component/CSS phase).

## Security Domain

Not applicable in any meaningful sense — this phase is presentation-only cosmetic restructuring of two already-static/fixture-driven surfaces, introduces no new user input, no new data flow, no new authentication/authorization surface, and no cryptography. No ASVS category applies beyond what the existing surfaces already satisfy (no new attack surface is created by adding CSS animations or SVG elements).

## Sources

### Primary (HIGH confidence)
- `.planning/phases/20-reasoning-trail-hero-visual-sync/20-DESIGN-SNAPSHOT.md` — full extracted markup/CSS/keyframes for both surfaces, sourced live from the coded design prototype
- `src/components/sandbox/reasoning/ReasoningTrail.tsx`, `reasoning-trail-tag.ts`, `ReasoningTrail.test.tsx` — current implementation and test coverage read directly
- `src/components/hero/HeroPreviewCard.tsx`, `hero-preview-geometry.ts`, `hero-preview-fixture.ts`, `Hero.tsx`, `Hero.test.tsx`, `hero-preview-fixture.test.ts` — current implementation and test coverage read directly
- `src/components/sandbox/chart/ChartHeaderStrip.tsx`, `ChartFooterStrip.tsx`, `chart-header-risk.ts`, `instrument-readouts.ts` — the established "plain flex div strip, not nested Card" and "copy don't import" precedent from Phase 18 (SBOX-06/07)
- `app/globals.css` — existing `.section-grid-overlay`, `.radar-sweep-dot`, `@keyframes radar-sweep`, and the existing `prefers-reduced-motion` gating pattern (Phase 7 + Phase 19 precedent)
- `src/components/sandbox/SandboxContainer.tsx`, `src/components/tour/GuidedTourModal.tsx` — current consumers of `.radar-sweep-dot`
- `docs/reasoning-trails.json` — verified trail-length distribution: 3 (×3 scenarios), 4 (×2), 5 (×2) — confirms the "3-5 step" range this layout must hold up across
- `package.json`, `vitest.config.ts` — confirms no new dependencies needed; test runner/config unaffected by this phase
- `.planning/milestones/v1.1-phases/07-hero/07-CONTEXT.md` (referenced via CONTEXT.md/DESIGN-SNAPSHOT.md quotations) — D-01/D-02/D-03 rationale already reproduced verbatim in this phase's own CONTEXT.md

### Secondary (MEDIUM confidence)
None — all claims above are grounded directly in files read in this repository during this research session; no external web sources were needed for a phase with zero new dependencies.

### Tertiary (LOW confidence)
None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies, entirely verified against `package.json` and existing codebase usage
- Architecture: HIGH — every pattern recommended here (breakpoint convention, plain-flex-div strips, `.radar-sweep-dot` primitive, `prefers-reduced-motion` gating) already exists and is proven working in this exact codebase
- Pitfalls: HIGH — derived from direct inspection of the design snapshot's own CSS/markup against this codebase's existing conventions and Phase 7's documented D-01 rationale, not speculative

**Research date:** 2026-07-27
**Valid until:** No natural expiry — this is a snapshot of the current codebase's own files, not third-party version-dependent information. Re-verify only if `ReasoningTrail.tsx`, `HeroPreviewCard.tsx`, or `app/globals.css` change again before this phase executes.
