# Phase 18 — Design Source Snapshot

**Fetched:** 2026-07-25, via `DesignSync` (`get_file`) against the `claude.ai/design` project referenced in `PROJECT.md` (`c265c047-81a0-4446-bdf3-95d434adc3dc`, "COLREGS Navigator design brief"), file `COLREGS Navigator (shadcn).dc.html`.

This is a **local, point-in-time extract** of only the markup/logic relevant to Phase 18 (header strip, footer strip, vessel-control overlay). It exists so downstream agents (researcher, planner, executor) don't need `DesignSync` access to act on this phase — treat it as read-only reference, not something to sync back. If the live design file changes after this date, this snapshot is stale; re-fetch via `DesignSync` if a discrepancy is suspected.

The design source is a hand-rolled React prototype (`.dc.html`, inline styles, not Tailwind/shadcn) — it defines the **visual layout, content, and interaction contract** to port into this codebase's actual component/styling conventions (Tailwind classes, shadcn primitives, `src/domain/` derivations), not code to copy verbatim.

---

## Header command strip (`data-r="hdrbar"`)

```html
<div data-r="hdrbar" style="display:flex;align-items:center;gap:14px;padding:12px 16px;background:rgba(18,18,21,.9);border-bottom:1px solid #27272A;">
  <div style="display:flex;align-items:center;gap:10px;min-width:0;">
    <span style="...background:{{ bannerAccent }}...">{{ bannerRule }}</span>
    <h3 style="...white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ bannerTitle }}</h3>
  </div>
  <div style="flex:1;"></div>
  <div style="display:flex;align-items:center;gap:7px;padding:6px 11px;border-radius:8px;background:{{ riskBg }};border:1px solid {{ riskBorder }};font-size:12.5px;color:{{ riskColor }};max-width:46%;">
    <span style="width:8px;height:8px;border-radius:50%;background:{{ riskColor }};flex-shrink:0;"></span>
    <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">{{ riskText }}</span>
  </div>
</div>
```

Layout: rule badge + encounter title on the left (title ellipsis-truncates on overflow, doesn't wrap); flex spacer; risk pill on the right (dot + text, capped at 46% width, ellipsis-truncates).

**`bannerRule`/`bannerTitle`/`bannerAccent` derivation** (this part already matches current `VerdictBanner.tsx` logic — port as-is, no behavior change):
```js
const bannerAccent = c.error ? C.doubt : c.doubt ? C.doubt : (c.roleA==='MUTUAL' ? C.MUTUAL : C.teal);
bannerRule:  c.error ? '——' : c.rule,        // e.g. "Rule 15", "Rule 7" for doubt
bannerTitle: c.error ? 'Unable to classify' : c.encounter,  // e.g. "Crossing"
```

**Risk pill 4-tier derivation** (`riskMap`) — **decision: adopt this verbatim** (see CONTEXT.md D-02). This is CPA-distance-threshold-driven, NOT `classification.riskOfCollision`-driven — a deliberate, explicit divergence from the prior `status-pill.ts` rationale, made knowingly this phase:
```js
const riskMap = {
  none:  ['#0B0B0E',            '#27272A',            '#A1A1AA'],  // [bg, border, color]
  ok:    ['rgba(34,197,94,.1)', 'rgba(34,197,94,.3)',  '#4ade80'],
  watch: ['rgba(245,158,11,.1)','rgba(245,158,11,.35)','#fbbf24'],
  high:  ['rgba(239,68,68,.1)', 'rgba(239,68,68,.35)', '#f87171'],
};
const [riskBg, riskBorder, riskColor] = c.error
  ? ['rgba(245,158,11,.1)','rgba(245,158,11,.35)','#fbbf24']  // error/degenerate reuses the amber 'watch' palette
  : riskMap[c.risk];

// c.risk derivation (in the classify step):
if (!closing && vr2 > 1e-6) { risk = 'none';  riskText = 'Vessels are opening — CPA already passed. No risk of collision developing on present courses.'; }
else if (cpa < 0.3)          { risk = 'high';  riskText = `Risk of collision exists — CPA ${cpa.toFixed(2)} NM. A substantial, early, readily-apparent action is required.`; }
else if (cpa < 1.0)          { risk = 'watch'; riskText = `Close-quarters developing — CPA ${cpa.toFixed(2)} NM. Monitor the compass bearing for appreciable change.`; }
else                          { risk = 'ok';    riskText = `Passing clear — CPA ${cpa.toFixed(2)} NM on present courses.`; }
```
`closing`/`vr2`/`cpa` here are the same relative-velocity/CPA values this codebase's `src/domain/geometry/cpa/` module already computes — derive `risk`/`riskText` from the existing CPA/TCPA output (same pattern as `deriveInstrumentReadouts()`), don't duplicate the CPA math.

---

## Footer instrument bar (`data-r="ftrbar"`)

```html
<div data-r="ftrbar" style="display:flex;align-items:stretch;gap:0;background:rgba(18,18,21,.9);border-top:1px solid #27272A;">
  <!-- readouts -->
  <div style="display:flex;align-items:center;gap:22px;padding:13px 18px;font-family:'Geist Mono';flex-wrap:wrap;">
    <div style="...color:#2dd4bf;..."><span class="blip-dot"></span>LIVE</div>
    <div><div>RANGE</div><div>{{ rRange }}</div></div>
    <div><div>BEARING A→B</div><div>{{ rBrg }}</div></div>
    <div><div>CPA</div><div>{{ rCpa }}</div></div>
    <div><div>TCPA</div><div>{{ rTcpa }}</div></div>
  </div>
  <div style="flex:1;min-width:12px;"></div>
  <!-- per-vessel required action -->
  <div data-r="ftracts" style="display:flex;border-left:1px solid #27272A;">
    <div style="display:flex;gap:9px;align-items:flex-start;padding:13px 15px;max-width:250px;">
      <span class="letter-chip">A</span>
      <div><span style="{{ ctrlBadgeA }}">{{ roleALabel }}</span><div>{{ actA }}</div></div>
    </div>
    <div style="...border-left:1px solid #27272A;">
      <span class="letter-chip">B</span>
      <div><span style="{{ ctrlBadgeB }}">{{ roleBLabel }}</span><div>{{ actB }}</div></div>
    </div>
  </div>
</div>
```

Layout: `LIVE` blinking-dot label + 4 readout tiles (RANGE/BEARING A→B/CPA/TCPA — same values as today's `InstrumentReadouts`) on the left; flex spacer; vertical-divider-separated per-vessel action panel (letter chip + role badge + action sentence) on the right. Mobile (`max-width:900px`): `ftrbar` wraps, `ftracts` switches from `border-left` to full-width `border-top`.

**`LIVE` is literal UI copy** — a static "LIVE" label next to a pulsing dot (`@keyframes blip`), signaling the strip updates in real time. Not a numeric readout.

**Per-vessel action copy** (`actText`) — **decision: adopt verbatim** (CONTEXT.md D-03):
```js
const actText = (role) =>
  role === 'GW' ? 'Alter course early & substantially — pass well clear astern.'
  : role === 'SO' ? 'Hold course & speed; stand ready to act if she does not.'
  : 'No privilege — both take early, decisive avoiding action.';
```
`role` here is the same `GW`/`SO`/`MUTUAL` role this codebase's `getVesselRole()` already returns (mapped via `ROLE_BADGE_TEXT`) — no new role concept, just new copy keyed off the existing role value. Degenerate/error state: both `actA`/`actB` show `'—'`.

---

## Vessel-control overlay (`ovshipA` / `ovshipB`)

```html
<!-- shown when selA/selB is true -->
<div data-r="ovshipA" style="{{ cardStyleA }}">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
    <div><span class="letter-chip">A</span><span>Vessel A</span></div>
    <div><span style="{{ ctrlBadgeA }}">{{ roleALabel }}</span>
      <button onClick="{{ onCloseCard }}" style="...">×</button>
    </div>
  </div>
  <label>TYPE</label>
  <select value="{{ typeA }}" onChange="{{ onTypeA }}">
    <option value="power">Power-driven</option>
    <option value="sailing">Sailing</option>
    <option value="fishing">Engaged in fishing</option>
    <option value="ram">Restricted in ability to manœuvre</option>
    <option value="nuc">Not under command</option>
  </select>
  <div><label>SPEED</label><span>{{ speedA }} kn</span></div>
  <input type="range" min="0" max="24" step="1" value="{{ speedA }}" onInput="{{ onSpeedA }}">
  <div><span>HEADING</span><span>{{ hdgA }}</span></div>  <!-- read-only, matches ControlPanel's existing "drag-only" heading convention -->
</div>
```

Content is a strict subset of today's `ControlPanel.tsx` `VesselFormSection`: TYPE (editable `Select`), SPEED (editable slider + live value), HEADING (**read-only** formatted display, no control) — same three fields, same read-only-heading convention already documented in `ControlPanel.tsx`'s `formatHeading` comment. Card header adds a role badge (reuse `ROLE_BADGE_TEXT`/`ROLE_BADGE_CLASSNAME`, already shared) and an explicit `×` close button.

**Positioning** (`posCard`) — anchors the card diagonally opposite the vessel's on-chart quadrant so it doesn't cover the vessel it belongs to:
```js
const posCard = (v) => {
  const lx = v.x / 960 * 100, ty = v.y / 640 * 100;
  const right = v.x < 480;   // vessel in left half of chart -> card opens to its right
  const below = v.y < 320;   // vessel in top half of chart -> card opens below it
  const horiz = right ? `left:calc(${lx}% + 26px);` : `right:calc(${100-lx}% + 26px);`;
  const vert  = below ? `top:calc(${ty}% - 6px);`   : `bottom:calc(${100-ty}% - 6px);`;
  return `position:absolute; ${horiz}${vert} width:224px; max-width:46%; ` +
    `background:rgba(24,24,27,.95); backdrop-filter:blur(7px); ` +
    `border:1px solid rgba(45,212,191,.45); border-radius:12px; padding:13px; ` +
    `box-shadow:0 14px 36px -12px rgba(0,0,0,.85); z-index:6;`;
};
```
Card is ~224px wide (max 46% of chart width), positioned relative to the chart container (`position:absolute` within the same relatively-positioned wrapper `ChartPanel.tsx` already uses for its scale-bar legend), not relative to the SVG's internal coordinate system.

**Open/close interaction** (source's actual coded behavior — see CONTEXT.md D-01 for how this phase's requirements reconcile it with ROADMAP's stricter "re-click toggles closed" criterion):
```js
// Vessel pointerdown (same handler that starts hull/rotate drag) unconditionally selects it —
// this is what opens the overlay; it does NOT check "is this vessel already selected":
startDrag = (e, letter, mode) => { e.stopPropagation(); e.preventDefault(); this.drag = {letter, mode}; this.setState({selected: letter}); };

// Explicit close button:
onCloseCard: (e) => { e.stopPropagation(); this.setState({selected: null}); };

// Clicking empty chart space (pointerdown reaches the <svg> itself, not a vessel, because
// startDrag already called stopPropagation for vessel hits) also closes whatever is open:
onChartDown: () => { if (this.state.selected) this.setState({selected: null}); };
```
Selecting vessel B while A's overlay is open just re-fires `startDrag('B', ...)`, which sets `selected: 'B'` — the card visually "moves" because it's now `ovshipB`'s position, not because anything animates a single card between positions.

---

## Color/role tokens referenced above

```js
C = { GW: '#EF4444', SO: '#22C55E', MUTUAL: '#94A3B8', doubt: '#F59E0B', brg: '#475569', teal: '#0d9488' };
const roleColor = (r) => C[r] || C.MUTUAL;
const ctrlBadge = (r) => `...background:${roleColor(r)}14; color:${roleColor(r)}; border:1px solid ${roleColor(r)}40; border-radius:9999px; ...`;
const roleLabel = (r) => ({ GW: 'GIVE WAY', SO: 'STAND ON', MUTUAL: 'MUTUAL' }[r] || '—');
```
These are the design's own hex literals — this codebase already has equivalent `--give-way`/`--stand-on`/`--mutual`/`--doubt`/`--rule-accent` CSS tokens (used by `ROLE_BADGE_CLASSNAME`/`ROLE_HULL_FILL_CLASS` in `vessel-role.ts`) — reuse those existing tokens, don't introduce new hex literals from this snapshot.
