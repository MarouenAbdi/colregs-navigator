# Phase 20: Reasoning-Trail & Hero Visual Sync — Design Snapshot

**Extracted:** 2026-07-27
**Source:** `claude.ai/design` project `c265c047-81a0-4446-bdf3-95d434adc3dc`, file `COLREGS Navigator (shadcn).dc.html`, fetched live via the `DesignSync` tool (`get_file`) — same project used for v1.1 and Phases 18-19.
**Also present in the project (not fetched in full, lower priority than the coded prototype below):** `scraps/radar-chain.png` (a rendered screenshot of the exact horizontal trail below — used here to visually confirm the coded markup), `scraps/trail.png` (a screenshot of the CURRENT app's vertical/wrapped trail, i.e. the "before" state).

This is a **fully coded prototype**, not a static mockup — markup, inline styles, and the JS style-builder function are extracted verbatim below. The design has moved on since Phase 7 (v1.1): the Hero card's bezel is meaningfully richer than what's currently implemented (3 range rings vs. 2, added compass-tick bezel, added cardinal labels, added radar-sweep overlay — none of which existed when `hero-preview-geometry.ts` was authored).

## 1. Reasoning Trail ("NAV DECISION CHAIN")

### Structure
Header row: radar-sweep dot (14px, same spinning-conic-gradient token used elsewhere) + `NAV DECISION CHAIN · radar acquisition` label, right-aligned pill badge `{{ stepCount }} contacts`.

Body: `<ol data-r="cond-ol">` — `display:flex;align-items:stretch;gap:0` (a single horizontal row, NOT `flex-wrap`). Each step renders as **two list items**:
1. `<li data-r="cnode">` — the step card, `flex:1 1 0` (equal-width, fills available row space)
2. `<li data-r="cwire">` (only `showConnAfter`, i.e. omitted after the last card) — the connector segment, `flex:0 0 34px`

### Step card (`cnode`)
```
nodeStyle: background #0B0B0E (last: #101016), border 1px solid #27272A (last: <accentColor>88),
           border-radius 13px, padding 16px 15px 15px;
           last card only: box-shadow 0 0 0 1px <col>30, 0 14px 34px -14px <col>66  (glow)
accentBarStyle: 2px-tall bar pinned to the card's top inside edge, color = step's accent, opacity .55 (.9 on last)
brkTL/TR/BL/BR: 11x11px corner brackets (radar-scope corner ticks), 1.5px border in accent color,
                 opacity .65 on normal steps, 1 (full) on the last/verdict step
```
Card content: circular "token" (38px, radial-gradient fill + spinning conic-gradient sweep ring + step number, all in accent color) + contact label (`CONTACT 0N`, 8.5px tracked) + rule id + tag chip — then body text — then fact chips pinned to the bottom via `margin-top:auto` (this requires the card to be a column flexbox, which it already is via `nodeStyle`'s `display:flex;flex-direction:column`).

### Connector (`cwire`) — CSS-only, satisfies Roadmap criterion 2 (no `getBoundingClientRect`/`getBBox`)
```js
connLineStyle: `height:3px;width:100%;border-radius:2px;
  background:repeating-linear-gradient(90deg,${col} 0 5px,transparent 5px 11px);
  background-size:11px 3px;animation:conduit .55s linear infinite;`
pulseStyle: `position:absolute;top:50%;width:6px;height:6px;margin-top:-3px;border-radius:50%;
  background:${col};box-shadow:0 0 8px 1px ${col};animation:travel 1.9s ease-in-out infinite;`
```
`@keyframes conduit { to { background-position: 22px 0; } }` — animates the dashed line's `background-position` only (pure CSS, no layout read).
`@keyframes travel { 0%{left:-4px;opacity:0;} 12%{opacity:1;} 88%{opacity:1;} 100%{left:calc(100% + 4px);opacity:0;} }` — a small dot that travels along the connector, implying "signal flow" between steps.

Color per step (`dotFor`): `geo→this.C.brg`, `rule→this.C.teal`, `gw→this.C.GW`, `so→this.C.SO`, `mut→this.C.MUTUAL`, `doubt→this.C.doubt` — this maps 1:1 onto the codebase's existing `TrailTone` five-way split (`geometry|rule|doubt|verdict-mutual|verdict-decisive`) in `ReasoningTrail.tsx`; no new tone categories needed.

### Responsive fallback (source's own media query, ALREADY the codebase's established breakpoint)
```css
@media (max-width:900px){
  [data-r="cond-ol"]{flex-direction:column !important;align-items:stretch !important;}
  [data-r="cnode"]{flex:0 0 auto !important;}
  [data-r="cwire"]{flex:0 0 26px !important;width:100% !important;}
}
```
The design's own fallback simply stacks the same DOM order vertically and shrinks the connector segment to a fixed 26px band — it does NOT rotate the dashed line to vertical (the horizontal dash pattern is kept, just squeezed into a shorter box). `900px` (`min-[900px]:`) is already this codebase's convention (`SandboxContainer.tsx`, `ChartFooterStrip.tsx` both use it).

### Copy deltas vs. current `ReasoningTrail.tsx`
- Header label: `Reasoning Trail` → `NAV DECISION CHAIN` (locked by Roadmap criterion 1 — not a gray area) + new subtitle `radar acquisition`.
- Count badge: `{n} steps` → `{n} contacts`.

## 2. Hero Preview Card

### Bezel — net-new vs. current `hero-preview-geometry.ts` (which only has 2 plain rings)
```
3 range rings (not 2): r=42, r=84, r=126 on a 480-wide reference canvas (design's own hero canvas is 480x300,
  vs. this codebase's 320x200 — same 8:5 aspect, just scaled; ratios: 42/240=.175, 84/240=.35, 126/240=.525 of half-width)
Compass bezel ring (2 stacked dashed circles at the OUTER radius, r=132 on 480-canvas):
  <circle r=132 stroke-width=5  stroke-dasharray="1.5 9.42"  stroke="teal @ .32"/>  — minor ticks
  <circle r=132 stroke-width=9  stroke-dasharray="3 66.13"   stroke="teal @ .5"/>   — major ticks (4 marks, cardinal points)
Crosshair: full N-S and E-W lines through center, #3F3F46 @ .7 opacity
Cardinal labels: N/S/E/W text at the bezel edge, Geist Mono 11px bold, teal
Range labels: "0.5 NM" / "1.0 NM" / "1.5 NM" stacked above center, Geist Mono 9px, #52525B
Center hub: small ringed dot at dead-center (decorative, NOT a vessel)
```
No corner-bracket bezel accents on the Hero card (those exist only on the real Sandbox chart's `data-r="scope"`, not on Hero — confirmed by their absence from the Hero markup block).

### Radar sweep overlay
```html
<div style="position:absolute;left:50%;top:50%;width:47.9%;aspect-ratio:1;transform:translate(-50%,-50%);pointer-events:none;">
  <div style="width:100%;height:100%;border-radius:50%;
    background:conic-gradient(from 0deg,rgba(45,212,191,.3),rgba(45,212,191,0) 60deg,transparent);
    animation:sweep 4.5s linear infinite;mix-blend-mode:screen;"></div>
</div>
```
`@keyframes sweep { to { transform: rotate(360deg); } }` — pure CSS rotation, no JS. Sits inside the same relatively-positioned scope container as the SVG (absolutely positioned over it, not part of the SVG itself).

### Header strip (net layout change vs. current card)
Design's Hero card header is a single row: `{{ heroRule }}` chip (teal pill, e.g. "RULE 15") + `{{ heroEncounter }}` title, right-aligned risk pill (`{{ heroRiskText }}` + colored dot, background/border driven by risk level). This REPLACES the current implementation's separate below-chart verdict banner (`Rule 15` badge + verdict sentence in a bordered box under the SVG).

### Footer readouts (net content change vs. current card)
Single row, NOT a 3-column grid: `LIVE` (pulsing dot + text) — `RANGE` — `BEARING A→B` — `CPA` — `TCPA`. Current codebase's footer is a 3-item grid (`RANGE`/`BEARING`/`CPA`) with **no TCPA metric** and no `LIVE` indicator at all.

### Tension with Phase 7's locked D-01 (`07-CONTEXT.md`)
> "The illustrative preview card is fully static — no animation (no pulsing 'live' dot, no animated bearing line). ... avoids the layout-shift risk ... (a Hero box-height change after initial paint can throw off the fragment-scroll math for `/#gallery`)."

D-01's actual rationale is a **layout-shift/box-height** concern, not a blanket ban on all motion — and Roadmap criterion 3 for this phase explicitly asks for a "radar sweep overlay" (which is `position:absolute`, doesn't affect box height). The design's footer `LIVE` dot, however, is the exact same pulsing-dot pattern D-01 named directly. This is flagged as a gray area below rather than resolved unilaterally.

## Canonical refs
- This file (`20-DESIGN-SNAPSHOT.md`) — primary implementation reference
- `.planning/milestones/v1.1-phases/07-hero/07-CONTEXT.md` — D-01 (static preview precedent), D-02/D-03 (chart fidelity, no shared code with `ChartPanel.tsx`)
- `docs/reasoning-trails.json` — catalog of all COLREGS reasoning-trail shapes (3-5 steps), needed to verify the horizontal layout at every real trail length, not just the 5-step example above
- `src/components/sandbox/reasoning/ReasoningTrail.tsx`, `reasoning-trail-tag.ts` — current implementation to be restructured
- `src/components/hero/HeroPreviewCard.tsx`, `hero-preview-geometry.ts` — current implementation to be restructured
