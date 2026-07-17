# Phase 4: Interactive Chart Sandbox - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-17
**Phase:** 4-Interactive Chart Sandbox
**Areas discussed:** Vessel Drag Mechanics, Visual Role Coding, Reasoning Trail Panel, Chart Aesthetic, Doubt State, Initial Sandbox State

---

## Vessel Drag Mechanics

| Option | Description | Selected |
|--------|-------------|----------|
| Position drag + rotate handle + speed input | Drag hull to move position; small bow handle rotates heading; speed set via slider/numeric field in a form panel. Most explicit/discoverable; lower drag-gesture risk. | ✓ |
| Vector-drag (arrow tip sets heading+speed) | Drag the tip of a heading/speed vector arrow — angle=heading, length=speed. Compact but combines two degrees of freedom into one gesture; higher research risk. | |
| Position drag only, heading/speed via form | Dragging only ever moves position; heading/speed always via numeric form fields. Simplest to build but weaker "demo centerpiece" feel. | |

**User's choice:** Position drag + rotate handle + speed input
**Notes:** None — direct selection.

---

## Visual Role Coding

| Option | Description | Selected |
|--------|-------------|----------|
| Color-coded hull (red=give-way, green=stand-on) | Immediate at-a-glance read; needs a secondary cue for colorblind accessibility. | ✓ |
| Icon/badge overlay, neutral hull color | Small badge/label near each vessel; hull stays neutral. | |
| Both — color-coded hull AND badge | Most explicit/accessible; slightly busier chart. | |

**User's choice:** Color-coded hull (e.g. red = give-way, green = stand-on)
**Notes:** None — direct selection. Colorblind-accessibility secondary cue noted as Claude's discretion in CONTEXT.md.

---

## Reasoning Trail Panel

| Option | Description | Selected |
|--------|-------------|----------|
| Full trail always visible, side panel | Entire Rule 7→13→14→15→18 decision path always shown side-by-side with the chart. | ✓ |
| Verdict-first, expandable trail | Headline verdict + citation shown; full trail collapses/expands on click. | |
| Below-chart panel (stacked layout) | Chart full-width, reasoning trail stacked underneath. | |

**User's choice:** Full trail always visible, side panel
**Notes:** None — direct selection.

---

## Chart Aesthetic

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal/schematic | Vessel icons, N-up orientation, subtle grid. Fastest to build. | ✓ |
| Moderate nautical styling | Adds compass rose + distance/range rings. | |
| Full chart skin | Compass rose, range rings, wake trails, chart-paper texture. Most polished, most effort. | |

**User's choice:** Minimal/schematic
**Notes:** None — direct selection.

---

## Doubt State

| Option | Description | Selected |
|--------|-------------|----------|
| Dashed/amber overlay near the triggering boundary | The bearing line or overtaking boundary arc renders dashed/amber when doubt=true, plus a caveat line in the reasoning panel naming the boundary. | ✓ |
| Badge/banner only, no chart change | Reasoning panel shows a caveat banner; chart renders identically to a confident verdict. | |
| Vessel hull gets a doubt indicator | Vessel icons get a dashed outline/pulse in addition to panel text. | |

**User's choice:** Dashed/amber overlay near the triggering boundary
**Notes:** Chosen to tie the visual directly to the specific geometric cause (via `doubtBoundary`) and to avoid visual competition with the hull color coding already decided for give-way/stand-on.

---

## Initial Sandbox State

| Option | Description | Selected |
|--------|-------------|----------|
| A default two-vessel scenario already on the chart | Loads with a classic encounter already placed, so the reasoning panel demonstrates something immediately. | ✓ |
| Blank chart, user places both vessels | Chart starts empty; emphasizes the "sandbox"/placement interaction. | |

**User's choice:** A default two-vessel scenario already on the chart
**Notes:** Motivated by avoiding an empty first impression for an interviewer/reviewer opening the page. Exact scenario values left to Claude's discretion (a clean, unambiguous classic encounter).

---

## Claude's Discretion

- Exact speed input widget (slider vs numeric field vs both) and units/step — default to a labeled numeric input in knots (consistent with Phase 1's speed-in-knots convention).
- Whether to pair the give-way/stand-on hull color with a secondary non-color accessibility cue (icon/pattern/label) — reasonable accessibility addition, doesn't change the decided mechanism.
- Exact default scenario's specific positions/headings/speeds/vessel types for the initial-load state — pick a clean, unambiguous classic encounter (not a doubt-boundary case).
- Handling of `classifyEncounter()`'s `Result<T>` degenerate cases (coincident-position, no-closure) in the UI — not discussed explicitly; flagged for research/planning.
- UI state's tracking/passing of the `previous` classification parameter on every drag update (for Rule 13(d) hysteresis) — not discussed explicitly; flagged for research/planning.
- Exact Next.js app/component file layout under `app/`/`src/components/` — not discussed; follow CLAUDE.md's Clean Architecture layering conventions.

## Deferred Ideas

None — discussion stayed within Phase 4 scope.
