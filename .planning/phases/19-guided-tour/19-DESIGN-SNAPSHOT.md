# Phase 19: Guided Tour — Design Snapshot

**Extracted:** 2026-07-26
**Source:** `claude.ai/design` project `c265c047-81a0-4446-bdf3-95d434adc3dc`, file `COLREGS Navigator (shadcn).dc.html`, fetched live via the `DesignSync` tool (`get_file`) — same project used for v1.1 and Phase 18.
**Also present in the project (not fetched):** `screenshots/01-tour-viz.png`, `02-tour-viz.png`, `03-tour-viz.png` — visual references for the tour illustrations, if the raw SVG below needs cross-checking.

This document is the primary implementation reference for Phase 19 — the design source contains a **fully coded, working prototype** of the Guided Tour (not just a static mockup), so behavior, copy, and visuals below are extracted directly from its source, not paraphrased.

## Trigger button

Lives in `SandboxContainer`'s existing top header row (next to Reset), labeled exactly **"How to read this"** — a small radar-sweep icon (spinning conic-gradient dot, reused from the header's other radar accents) + text, teal-tinted outline button:

```html
<button onClick="{{ onTourOpen }}" style="...color:#2dd4bf;background:rgba(45,212,191,.08);border:1px solid rgba(45,212,191,.35);border-radius:8px;height:36px;padding:0 14px;...">
  <span class="radar-sweep-dot"/> How to read this
</button>
```

## Modal structure (fixed overlay, NOT a native `<dialog>`)

```html
<!-- ===== TUTORIAL TOUR ===== -->
<div style="position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;
            padding:28px 40px;background:rgba(4,4,6,.78);backdrop-filter:blur(6px);animation:verdictIn .2s ease;">
  <div style="max-width:600px;height:100%;max-height:820px;background:#101014;border:1px solid #27272A;
              border-radius:16px;box-shadow:0 40px 90px -30px rgba(0,0,0,.9),0 0 0 1px rgba(45,212,191,.08);overflow:hidden;">
    <!-- header: radar-sweep dot + "GUIDED TOUR · STEP {n}/6" + Skip button -->
    <!-- icon (46x46 teal chip) + step title (h3, 21px/700) -->
    <!-- illustration: 180px-tall inline SVG, per-step (see tourViz below) -->
    <!-- body: paragraph + up to 3 tag/text point rows -->
    <!-- footer: Back (hidden on step 1) — step dots (6) — Next/"Start exploring" -->
  </div>
</div>
```

**Important gap vs. ROADMAP's locked success criteria:** this markup has **no outside-click handler** on the fixed overlay div, and **no Escape-key handler** anywhere in the tour's JS (only `onTourSkip`/`onTourNext`/`onTourBack`, wired to explicit buttons). ROADMAP's success criteria 3 and 4 (dismiss via Escape or outside-click; focus returns to trigger) are **not actually implemented in the design's own prototype code** — same category of gap as Phase 18's D-01 (design's real behavior falling short of a locked ROADMAP criterion). Resolved in this phase's `19-CONTEXT.md` by choosing the Radix/shadcn Dialog primitive, which provides both behaviors by default without hand-building them.

## Step content (verbatim — ports directly into `guided-tour-steps.ts`)

6 steps, each `{icon, title, body, points: [{tag, text}]}`:

1. **⚓ Welcome aboard the Navigator** — "Drop two vessels on a nautical chart and this engine names the give-way ship — and the exact COLREGS rule behind the verdict. Here is how to read it."
   - `RULES 11–18` — "Every verdict maps to the real Steering & Sailing Rules for vessels in sight of one another."
   - `LIVE` — "Anything you change recomputes instantly — geometry, verdict, and reasoning all update together."

2. **✥ Move the vessels** — "The chart is fully draggable. Grab a hull to reposition it, or drag its bow handle to swing the heading. Selecting a vessel opens its control card."
   - `DRAG HULL` — "Reposition a ship anywhere on the scope — range and bearing follow."
   - `DRAG BOW` — "Rotate the small handle ahead of the bow to change heading."
   - `TYPE & SPEED` — "In the card, set vessel type (power, sailing, fishing, RAM, NUC) and speed — these drive the Rule 18 priority."

3. **▦ Read the instruments** — "The footer strip is your live radar readout. These four numbers tell you whether a real risk of collision is developing."
   - `RANGE / BRG` — "Distance in nautical miles and the compass bearing from A to B."
   - `CPA` — "Closest Point of Approach — how near the vessels pass on present courses."
   - `TCPA` — "Time to that closest approach. A positive, shrinking value means they are closing."

4. **§ Read the verdict** — "The header banner states the encounter type, the governing rule, and which vessel must give way. Each ship also carries a GIVE WAY / STAND ON badge and its required action."
   - `GIVE WAY` — "This vessel must take early, substantial action to keep clear."
   - `STAND ON` — "This vessel holds course and speed — but stays ready to act."
   - `IN DOUBT` — "Ambiguous geometry is flagged amber — the rules tell you to assume the more dangerous case."

5. **⟿ Follow the reasoning** — "The NAV Decision Chain shows every logical step the engine took — from risk-of-collision through the encounter type to the final Rule 18 verdict. Read it left to right."
   - `CONTACT 01` — "Each node cites its own rule (e.g. Rule 7, 13, 14, 15, 18) and the facts that triggered it."
   - `HIGHLIGHT` — "The last, glowing node is the decisive step that produced the verdict."

6. **❖ Start from a classic** — "Not sure where to begin? The Gallery below holds textbook COLREGS geometries. Load one into the sandbox with a click, then drag from there."
   - `6 SCENARIOS` — "Crossing, head-on, overtaking, sailing priority, not-under-command, and an in-doubt case."
   - `RESET` — "The Reset button restores the current scenario to its textbook starting position at any time."

## Footer controls

- **Back**: only rendered when `tourStep > 0` (matches ROADMAP criterion 2's "no Back on step 1").
- **Step dots**: 6 dots, active dot 18px-wide pill (`#2dd4bf`), completed dots 6px (`#0d9488`), upcoming dots 6px (`#3F3F46`).
- **Forward button label**: `"Next"` for steps 1–5, **`"Start exploring"`** for step 6 (not literally "Done" — see `19-CONTEXT.md` D-02 for the resolved wording decision). Handler (`tourNext`) closes the tour when already on the last step, so the same button that reads "Start exploring" is also the close action.
- **Skip**: always-visible "Skip tour ×" button in the header, closes immediately from any step.

## Per-step illustrations (`tourViz`, 6 inline SVGs, `viewBox="0 0 460 176"`)

Each is a self-contained decorative SVG (no external assets, `'Geist Mono'` font family, app's existing teal/red/green/amber palette):

0. Radar scope with two vessel wedges (red/green) + dashed relative-bearing line + a "RULE 15 · CROSSING" verdict pill.
1. Hull outline with a dashed drag-path arrow labeled "DRAG HULL" and a dashed rotate-arc labeled "ROTATE BOW".
2. Four instrument tiles (RANGE/BEARING/CPA/TCPA) with sample values, CPA/TCPA highlighted teal.
3. Header verdict pill + two vessel rows with GIVE WAY (amber) / STAND ON (green) badges.
4. Horizontal decision-chain: 4 connected nodes (RULE 7 → RULE 15 → RULE 18 → VERDICT), last node glowing teal.
5. 6 scenario thumbnail tiles in a 3×2 grid (CROSSING/HEAD-ON/OVERTAKE/SAILING/NUC/IN DOUBT), first tile highlighted.

Full extracted SVG markup for all 6, verbatim from the design source, for direct porting into `TourStepIllustration.tsx`:

```js
tourViz = [
    // 0 — Welcome: radar scope with two vessels + verdict pill
    `<svg viewBox="0 0 460 176" width="100%" height="100%" font-family="'Geist Mono',monospace">
      <defs><radialGradient id="tvg" cx="50%" cy="50%" r="60%"><stop offset="0%" stop-color="rgba(45,212,191,.10)"/><stop offset="100%" stop-color="transparent"/></radialGradient></defs>
      <rect width="460" height="176" fill="#0B0B0E"/><rect width="460" height="176" fill="url(#tvg)"/>
      <g stroke="rgba(45,212,191,.16)" fill="none"><circle cx="230" cy="88" r="34"/><circle cx="230" cy="88" r="66"/><circle cx="230" cy="88" r="98"/></g>
      <line x1="230" y1="10" x2="230" y2="166" stroke="rgba(45,212,191,.12)"/><line x1="120" y1="88" x2="340" y2="88" stroke="rgba(45,212,191,.12)"/>
      <path d="M230 88 L230 20 A68 68 0 0 1 289 55 Z" fill="rgba(45,212,191,.14)"/>
      <g transform="translate(196,120) rotate(35)"><path d="M0 -9 L6 8 L0 4 L-6 8 Z" fill="#EF4444"/></g>
      <g transform="translate(276,58) rotate(-58)"><path d="M0 -9 L6 8 L0 4 L-6 8 Z" fill="#22C55E"/></g>
      <line x1="196" y1="120" x2="276" y2="58" stroke="#475569" stroke-dasharray="3 3"/>
      <g transform="translate(300,138)"><rect x="0" y="0" width="150" height="26" rx="6" fill="rgba(45,212,191,.12)" stroke="rgba(45,212,191,.35)"/><text x="9" y="17" fill="#2dd4bf" font-size="10" font-weight="700">RULE 15 · CROSSING</text></g>
    </svg>`,
    // 1 — Move: hull with drag + rotate handles
    `<svg viewBox="0 0 460 176" width="100%" height="100%" font-family="'Geist Mono',monospace">
      <rect width="460" height="176" fill="#0B0B0E"/>
      <g stroke="rgba(63,63,70,.35)"><line x1="0" y1="44" x2="460" y2="44"/><line x1="0" y1="88" x2="460" y2="88"/><line x1="0" y1="132" x2="460" y2="132"/><line x1="115" y1="0" x2="115" y2="176"/><line x1="230" y1="0" x2="230" y2="176"/><line x1="345" y1="0" x2="345" y2="176"/></g>
      <path d="M60 96 q60 -46 130 -8" fill="none" stroke="#2dd4bf" stroke-width="1.5" stroke-dasharray="4 4"/><path d="M186 86 l6 4 -8 4 z" fill="#2dd4bf"/>
      <g transform="translate(210,96) rotate(28)"><path d="M0 -16 L11 14 L0 8 L-11 14 Z" fill="#EF4444"/><line x1="0" y1="-16" x2="0" y2="-44" stroke="#2dd4bf" stroke-width="1.5"/><circle cx="0" cy="-44" r="7" fill="#0B0B0E" stroke="#2dd4bf" stroke-width="1.5"/></g>
      <path d="M250 44 a34 34 0 0 1 22 20" fill="none" stroke="#2dd4bf" stroke-width="1.5" stroke-dasharray="4 4"/><path d="M270 58 l6 3 -3 6 z" fill="#2dd4bf"/>
      <text x="34" y="126" fill="#71717A" font-size="10">DRAG HULL</text><text x="286" y="40" fill="#2dd4bf" font-size="10">ROTATE BOW</text>
    </svg>`,
    // 2 — Instruments: readout tiles
    `<svg viewBox="0 0 460 176" width="100%" height="100%" font-family="'Geist Mono',monospace">
      <rect width="460" height="176" fill="#0B0B0E"/>
      ${['RANGE|1.92 NM','BEARING|045°','CPA|0.28 NM','TCPA|04:12'].map((t,i)=>{const c=[16,130,244,358][i];const lab=t.split('|')[0],val=t.split('|')[1];const hot=i>=2;return `<g transform="translate(${c},52)"><rect width="86" height="72" rx="9" fill="#101014" stroke="${hot?'rgba(45,212,191,.4)':'#27272A'}"/><text x="12" y="26" fill="#71717A" font-size="9.5">${lab}</text><text x="12" y="50" fill="${hot?'#2dd4bf':'#FAFAFA'}" font-size="17" font-weight="700">${val}</text></g>`}).join('')}
      <text x="16" y="150" fill="#52525B" font-size="9.5">LIVE READOUT · UPDATES AS YOU MOVE</text>
    </svg>`,
    // 3 — Verdict: two vessel rows with badges
    `<svg viewBox="0 0 460 176" width="100%" height="100%" font-family="'Geist Mono',monospace">
      <rect width="460" height="176" fill="#0B0B0E"/>
      <g transform="translate(16,20)"><rect width="428" height="30" rx="7" fill="rgba(45,212,191,.08)" stroke="rgba(45,212,191,.25)"/><text x="12" y="20" fill="#2dd4bf" font-size="11" font-weight="700">CROSSING · RULE 15 · VESSEL A GIVES WAY</text></g>
      <g transform="translate(16,62)"><rect width="428" height="42" rx="8" fill="#101014" stroke="#27272A"/><g transform="translate(14,11)"><path d="M0 20 L11 -4 L22 20 L11 14 Z" fill="#EF4444"/></g><text x="48" y="26" fill="#FAFAFA" font-size="12">Vessel A</text><rect x="300" y="9" width="116" height="24" rx="6" fill="rgba(245,158,11,.14)" stroke="rgba(245,158,11,.4)"/><text x="313" y="25" fill="#F59E0B" font-size="10" font-weight="700">GIVE WAY</text></g>
      <g transform="translate(16,114)"><rect width="428" height="42" rx="8" fill="#101014" stroke="#27272A"/><g transform="translate(14,11)"><path d="M0 20 L11 -4 L22 20 L11 14 Z" fill="#22C55E"/></g><text x="48" y="26" fill="#FAFAFA" font-size="12">Vessel B</text><rect x="300" y="9" width="116" height="24" rx="6" fill="rgba(34,197,94,.14)" stroke="rgba(34,197,94,.4)"/><text x="313" y="25" fill="#22C55E" font-size="10" font-weight="700">STAND ON</text></g>
    </svg>`,
    // 4 — Reasoning: decision chain
    `<svg viewBox="0 0 460 176" width="100%" height="100%" font-family="'Geist Mono',monospace">
      <rect width="460" height="176" fill="#0B0B0E"/>
      <text x="16" y="26" fill="#52525B" font-size="9.5">NAV DECISION CHAIN</text>
      ${['RULE 7|Risk exists','RULE 15|Crossing','RULE 18|Both power','VERDICT|A gives way'].map((t,i)=>{const y=42+i*30;const glow=i===3;const lab=t.split('|')[0],d=t.split('|')[1];return `${i>0?`<line x1="30" y1="${y-30+22}" x2="30" y2="${y}" stroke="#2dd4bf" stroke-width="1.5"/>`:''}<circle cx="30" cy="${y+11}" r="6" fill="${glow?'#2dd4bf':'#0B0B0E'}" stroke="#2dd4bf" stroke-width="1.5"/><g transform="translate(48,${y})"><rect width="396" height="22" rx="6" fill="${glow?'rgba(45,212,191,.12)':'#101014'}" stroke="${glow?'rgba(45,212,191,.5)':'#27272A'}"/><text x="10" y="15" fill="#2dd4bf" font-size="9" font-weight="700">${lab}</text><text x="92" y="15" fill="${glow?'#FAFAFA':'#A1A1AA'}" font-size="10">${d}</text></g>`}).join('')}
    </svg>`,
    // 5 — Gallery: scenario thumbnails
    `<svg viewBox="0 0 460 176" width="100%" height="100%" font-family="'Geist Mono',monospace">
      <rect width="460" height="176" fill="#0B0B0E"/>
      ${[[16,20,'CROSSING'],[164,20,'HEAD-ON'],[312,20,'OVERTAKE'],[16,100,'SAILING'],[164,100,'NUC'],[312,100,'IN DOUBT']].map((g,i)=>{const glow=i===0;return `<g transform="translate(${g[0]},${g[1]})"><rect width="132" height="66" rx="8" fill="#101014" stroke="${glow?'rgba(45,212,191,.45)':'#27272A'}"/><g stroke="rgba(45,212,191,.2)" fill="none"><circle cx="66" cy="30" r="12"/><circle cx="66" cy="30" r="22"/></g><path d="M52 44 L80 16" stroke="#475569" stroke-dasharray="2 2"/><path d="M52 44 l7 -3 -1 6 z" fill="#EF4444"/><path d="M80 16 l-6 2 0 -6 z" fill="#22C55E"/><text x="8" y="60" fill="${glow?'#2dd4bf':'#71717A'}" font-size="8" font-weight="700">${g[2]}</text></g>`}).join('')}
    </svg>`,
  ];
```

Each string is a raw SVG template literal in the design source's own (non-React) templating engine — the `${...}` interpolations are plain JS template-literal expressions (array `.map().join('')`), not framework-specific syntax, so they port directly into a TypeScript template literal or a small JSX-generating helper inside `TourStepIllustration.tsx` with no semantic translation needed, only syntax (e.g. `class` vs `className` if converted to JSX instead of `dangerouslySetInnerHTML`).

---

*Design source fetched fresh for this phase — Phase 18 precedent confirms this project's `claude.ai/design` snapshots can contain real behavioral gaps vs. locked ROADMAP wording (D-01 there, the Escape/outside-click gap and button-label wording here) that must be resolved explicitly, not silently inherited.*
