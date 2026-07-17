# Phase 4: Interactive Chart Sandbox - Context

**Gathered:** 2026-07-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Users place and drag two vessels directly on an SVG chart-style canvas — setting position, heading, speed, and vessel type via drag and/or form controls — and see the COLREGS encounter classification update live as they drag, with no manual submit step and no lag/flicker. Give-way and stand-on vessels are visually distinguished on the chart, and a reasoning-trail panel shows the specific rule citation plus the geometric logic (relative bearing, closing angle) behind the current verdict, updating live alongside the chart. The chart also overlays the geometric reasoning directly on the canvas (relative bearing line, overtaking boundary arc). This phase is wired directly to Phase 2's already-correct `classifyEncounter()` — it is the first phase with any UI at all, and the demo centerpiece (nothing is end-to-end demoable before this phase, per ROADMAP.md's Horizontal Layers rationale). No persistence, save, or share (Phase 5 owns that) and no gallery UI (also Phase 5).

</domain>

<decisions>
## Implementation Decisions

### Vessel Manipulation (Drag Mechanics)
- **D-01:** Dragging the vessel hull moves **position**; a separate small **rotate handle** (e.g. at the bow) sets **heading**; **speed** is set via a numeric/slider field in a form panel — three distinct, discoverable gestures/controls rather than combining heading+speed into one vector-drag gesture. Chosen specifically to reduce drag-gesture implementation risk (STATE.md flagged "drag-gesture implementation details" as needing deeper research for this phase) while still satisfying VESL-02's drag-adjust-heading requirement directly (not form-only).
- **Claude's discretion:** exact speed input widget (slider vs numeric field vs both) and its exact units/step — not discussed at that granularity; default to a labeled numeric input in knots, consistent with Phase 1's speed-in-knots convention (D-01 in 01-CONTEXT.md).

### Visual Role Coding (Give-Way / Stand-On)
- **D-02:** Give-way vs stand-on is shown via **color-coded vessel hulls** (e.g. red = give-way, green = stand-on). This is the sole visual signal decided in discussion — no separate icon/badge was requested.
- **Claude's discretion:** whether to pair the hull color with a secondary non-color cue (icon, pattern, or text label) for colorblind accessibility. Not discussed explicitly, but flagged during discussion as worth considering — a reasonable accessibility addition during planning/research, not a scope change, since it doesn't alter the decided color-coding mechanism.

### Reasoning Trail Panel
- **D-03:** The reasoning trail is shown as the **full trail, always visible, in a persistent side panel** (not collapsed/expandable, not stacked below the chart). This means the entire Rule 7→13→14→15→18 decision path — including rules that were checked and ruled out, per Phase 2's D-14 (02-CONTEXT.md) — is visible at all times alongside the chart. Chosen as the most literal reflection of the domain-modeling depth the portfolio project exists to showcase.
- **D-04:** Doubt-state cases (Phase 2's `doubt`/`doubtBoundary` fields) render as a **dashed/amber overlay on the specific geometric element that triggered the doubt** (the relative-bearing line or the overtaking boundary arc, depending on which `doubtBoundary` value fired), plus a caveat line in the reasoning panel naming the boundary. The visual ties directly to the specific geometric cause rather than being a generic banner or a change to the vessel hulls (which stay reserved for give-way/stand-on color coding per D-02, avoiding visual competition between the two signals).

### Chart Aesthetic
- **D-05:** The chart uses a **minimal/schematic style** — vessel icons, N-up orientation, a subtle grid — with no compass rose, range rings, wake trails, or chart-paper texture. Keeps visual/SVG effort focused on the domain-logic overlays (bearing line, overtaking boundary arc, doubt-state treatment per D-04) rather than decorative chart embellishment.

### Initial Sandbox State
- **D-06:** The sandbox loads with a **default two-vessel scenario already placed on the chart** (a clear, classic encounter, e.g. a textbook crossing) rather than a blank chart. An interviewer or reviewer opening the page immediately sees a live classification and reasoning trail, instead of an empty first impression.
- **Claude's discretion:** the exact default scenario's specific positions/headings/speeds/types — not discussed; pick a clean, unambiguous classic encounter (not a doubt-boundary case) during planning, consistent with Phase 1/2's "classic encounter shapes" fixtures (head-on/crossing/overtaking) already validated in the domain layer.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Tech stack & architecture decisions (locked)
- `CLAUDE.md` — Technology Stack section: locks **SVG + native Pointer Events** for the chart (explicitly NOT `react-konva`/`konva`, NOT `@use-gesture/react`/`framer-motion` for drag), the hand-rolled geometry module (already implemented in Phase 1 — do not reimplement), the `zustand`-only-if-needed guidance (start with `useState`/`useReducer` + lifting state up), and the `ResizeObserver` + pure `screenToChart()`/`chartToScreen()` pattern (already implemented in Phase 1, see below) for the screen↔chart coordinate transform. Also locks the ban on calling `SVGElement.getScreenCTM()`/`getBBox()` directly in components (not implemented in jsdom).

### Project scope & requirements
- `.planning/PROJECT.md` — Core Value statement (correct classification + transparent, visible explanation) directly motivates D-03 (full trail always visible).
- `.planning/REQUIREMENTS.md` — VESL-02, CLAS-05, DETM-03, RSON-01, RSON-03, CHRT-01, CHRT-02 (all seven requirements mapped to this phase).
- `.planning/ROADMAP.md` — Phase 4 section (goal, 5 success criteria, requirements mapping, `UI hint: yes`).
- `.planning/STATE.md` — Blockers/Concerns section flags Phase 4 as likely needing deeper research during planning (`--research-phase`) specifically on **drag-gesture implementation details** — D-01's three-distinct-gestures choice was made partly to reduce this risk, but research should still verify pointer-capture/drag-sequence mechanics for the rotate handle.

### Prior phase context (Phases 1–3 — this phase wires directly into their output)
- `.planning/phases/01-domain-foundations/01-CONTEXT.md` — Locks the axis convention (x=east, y=north), speed-in-knots (D-01, informs the speed-input default noted under D-01's Claude's Discretion), and the `Result<T>` degenerate-case pattern that `classifyEncounter()` still returns and this phase's UI must handle (e.g. coincident-position, no-closure) — not yet discussed explicitly, flag for research/planning.
- `.planning/phases/02-colregs-rules-engine/02-CONTEXT.md` — Locks the reasoning-trail shape (D-13–D-16: full decision path, raw geometric facts bundled with each entry, evaluation order) that D-03's full-trail panel renders directly, and the doubt-flag/`doubtBoundary` design (D-11/D-12) that D-04's visual treatment consumes. `classifyEncounter(vesselA, vesselB, previous?)`'s optional `previous` parameter (D-01 there) means this phase's UI state must track and pass the prior classification on every drag update to get Rule 13(d) hysteresis correct — not discussed explicitly here, flag for research/planning.
- `.planning/phases/03-persistence-api-layer/03-CONTEXT.md` — No persistence in this phase (Phase 5 owns save/share), but the `VesselSchema`/`PositionSchema` Zod types this phase's form controls and drag handlers must produce are the same ones already wired into the `scenario.create` tRPC input (D-11 there) — reuse directly, no separate UI-layer vessel type needed.

No other external specs, ADRs, or design docs exist for this phase. No SPEC.md was found (`spec_loaded = false`) — this discussion covers both scope confirmation (from ROADMAP.md) and implementation decisions.

</canonical_refs>

<code_context>
## Existing Code Insights

This phase is greenfield for UI/rendering concerns: no React components, no `app/page.tsx`, no Tailwind config exist yet in the repo (`package.json` currently has no `tailwindcss`, `@testing-library/react`, or `@testing-library/user-event` — all named as expected/supporting dependencies in CLAUDE.md but not yet installed). `app/` currently contains only the tRPC route handler (`app/api/trpc/[trpc]/route.ts`); this phase is the first to build actual pages/components.

### Reusable Assets
- `src/domain/geometry/screen-convert.ts` — `chartToScreen()` / `screenToChart()` are **already implemented** as pure, DOM-free functions per CLAUDE.md's exact prescription (take `ContainerSize`/`ChartViewBox` as plain arguments, no `getScreenCTM()`/`getBBox()` calls). This phase's chart component supplies `containerSize` (via `ResizeObserver`) and `viewBox`, then calls these directly — no new coordinate-transform math needed.
- `src/domain/colregs/classify-encounter.ts` — `classifyEncounter(vesselA, vesselB, previous?)` is the exact function this phase wires to live drag events. Returns `Result<ClassificationResult>` (see `types.ts`): `encounterType`, `riskOfCollision`, `giveWay`/`standOn` (nullable — head-on mutual-obligation case), `doubt`, `doubtBoundary?`, and the full `trail: ReasoningTrailEntry[]` that D-03's panel renders directly.
- `src/domain/vessel/vessel.ts` — `VesselSchema`/`PositionSchema`/`VesselTypeSchema` (Zod). This phase's form controls and drag-derived state should produce/validate against these directly, matching D-11's tRPC-boundary-reuse pattern from Phase 3.
- `src/domain/colregs/types.ts` — `ClassificationResult`, `ReasoningTrailEntry` (`{ ruleId, text, facts }`), `DoubtBoundary` (`'near-overtaking-crossing-boundary' | 'near-head-on-boundary'`) — `facts` carries raw numeric geometric values (e.g. exact relative bearing) needed to render pixel-accurate overlays (bearing line, boundary arc) per RSON-03, without recomputing anything in the UI layer.

### Established Patterns
- `src/domain/` has zero framework imports across all three completed phases — this phase's new `src/app/`/`src/components/` (or equivalent) code calls INTO `src/domain/`, never the reverse.
- Zod schemas double as validation and domain value-object types across all prior phases — this phase's vessel-editing UI state should type against `z.infer<typeof VesselSchema>` rather than defining a parallel UI-only vessel type.

### Integration Points
- New Next.js app pages/components (first in the repo) will live under `app/` or a new `src/components/`/`src/app/` path — exact layout is a planning/research decision, not discussed here.
- `@trpc/react-query` and `@tanstack/react-query` are already installed (Phase 3) but Phase 4 does not need them for classification (that's a pure client-side `classifyEncounter()` call, no network round-trip) — they'll matter starting Phase 5 (save/share).

</code_context>
</code_context>

<specifics>
## Specific Ideas

No pixel-level mockups or external visual references were provided. The concrete decisions above (minimal/schematic chart, color-coded hulls, always-visible full reasoning panel, dashed/amber doubt overlay, default classic-encounter initial state) constitute the visual spec for this phase; no further "I want it like X" references came up.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 4 scope. No scope-creep suggestions came up during this discussion.

</deferred>

---

*Phase: 4-Interactive Chart Sandbox*
*Context gathered: 2026-07-17*
