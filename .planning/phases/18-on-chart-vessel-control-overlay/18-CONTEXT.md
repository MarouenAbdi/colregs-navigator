# Phase 18: On-Chart Vessel Control Overlay - Context

**Gathered:** 2026-07-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Users read the verdict and instrument readouts directly on the Sandbox chart via two merged strips — a header command strip (rule badge + encounter title + risk badge, replacing the standalone `VerdictBanner` card) and a footer instrument strip (LIVE/RANGE/BEARING/CPA/TCPA readouts + each vessel's required-action text, replacing the standalone `InstrumentReadouts` card) — and control each vessel via a floating on-chart overlay that opens when its hull is pressed, replacing the always-visible side `ControlPanel`. This phase does not touch the reasoning trail (`ReasoningTrail` stays a separate card below the chart — that's Phase 20's "NAV DECISION CHAIN" horizontal restructure) or the Guided Tour (Phase 19). No `classifyEncounter()`/domain logic change — presentation layer only, same boundary as the rest of v1.4.

</domain>

<decisions>
## Implementation Decisions

All four decisions below were captured by reading the actual current design source (`COLREGS Navigator (shadcn).dc.html`, fetched live via `DesignSync` from the `claude.ai/design` project referenced in `PROJECT.md`) and confirming intent directly with the user — see `18-DESIGN-SNAPSHOT.md` for the full extracted markup/logic each decision below references.

### Overlay close behavior
- **D-01:** The design source's actual coded overlay-close behavior (explicit `×` button on the card, and clicking empty chart space while an overlay is open) is real and must be implemented, but it is **not sufficient on its own** — ROADMAP's Phase 18 success criterion 3 explicitly locks "re-clicking the same vessel closes it," which the design source's own code does not do (its `startDrag` handler unconditionally sets `selected: letter` on every vessel press, never toggling). **This phase must add the toggle on top of the design's behavior**, not choose one or the other: a vessel press when its own overlay is already open closes it; a vessel press when the *other* vessel's overlay is open (or none is open) opens/moves to the pressed vessel; the `×` button and clicking empty chart space both close whatever is open. All three closing paths coexist.

### Risk badge — 4-tier scheme (deliberate divergence from prior status-pill.ts rationale)
- **D-02:** The header's risk badge adopts the design source's 4-tier `riskMap` (`none`/`ok`/`watch`/`high`) verbatim — including the `watch` (amber, "Close-quarters developing") tier, which is driven by a CPA-distance threshold (`cpa < 1.0`), not by `classification.riskOfCollision`. **This is a knowing, explicit divergence from `status-pill.ts`'s existing code comment**, which documents a prior decision to reject CPA-distance heuristics in favor of the domain's `riskOfCollision` signal ("prototype-only heuristics... could contradict the actual verdict"). The user was shown this conflict directly and chose to adopt the design's richer 4-tier scheme anyway. Scope of the divergence: it's isolated to this one header risk-pill's tone/copy — it does not feed back into `classification.riskOfCollision`, the give-way/stand-on verdict, or any `src/domain/` logic; those stay exactly as they are today. Derive `risk`/`riskText` from the same CPA/TCPA values `deriveInstrumentReadouts()` (or the underlying `src/domain/geometry/cpa/` module) already computes — do not duplicate the CPA math. Exact thresholds/copy/colors are in `18-DESIGN-SNAPSHOT.md`'s "Risk pill 4-tier derivation" section. The degenerate/error (same-position) state reuses the amber `watch` palette with the existing "Unable to classify" framing, matching the design source.

### Footer per-vessel required-action copy
- **D-03:** The three required-action strings are adopted verbatim from the design source (see `18-DESIGN-SNAPSHOT.md`): give-way — "Alter course early & substantially — pass well clear astern."; stand-on — "Hold course & speed; stand ready to act if she does not."; mutual — "No privilege — both take early, decisive avoiding action." Keyed off the same `GW`/`SO`/`MUTUAL` role this codebase's `getVesselRole()` already returns — no new role concept. Degenerate/error state: both vessels' action text shows the existing `PLACEHOLDER` em-dash (`—`), consistent with `InstrumentReadouts.tsx`'s current placeholder convention.

### Overlay open trigger
- **D-04:** The overlay opens on the vessel hull's/rotate-handle's existing `onPointerDown` (the same handler that already calls `setPointerCapture` to start a drag) — not on a separately-detected "clean click without movement." This mirrors the design source's own `startDrag` handler exactly (`e.stopPropagation()` + set selected, in the same breath as starting the drag) and was chosen specifically because it sidesteps new click-vs-drag hit-testing logic in a codebase with a documented, twice-fixed regression class in exactly this area (Phase 4, Phase 8 precedent, referenced again in this phase's own ROADMAP goal). Practical effect: the overlay can appear the instant a vessel is pressed, even if the user immediately drags it away — this is expected, not a bug to guard against.

### Claude's Discretion
- Exact Tailwind/shadcn translation of the design source's inline-style card (`posCard`'s quadrant-based diagonal positioning, `backdrop-blur`, border/shadow treatment) — port the *behavior* (anchor opposite the vessel's chart quadrant, ~224px/max-46% width) using this codebase's existing token/utility conventions, not the design's raw hex/px literals.
- Whether the risk badge's `riskText` copy is reused as-is from the design snapshot or lightly adapted to fit this app's existing sentence conventions (e.g. matching `InstrumentReadouts`' existing phrasing style) — content meaning must match, exact wording has some latitude.
- Corner bezel accents shown in the design's chart chrome (small teal corner brackets) — include if trivial to add alongside this phase's other chart-frame changes, otherwise defer; not called out in ROADMAP's success criteria for this phase.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design source (primary reference for this phase)
- `.planning/phases/18-on-chart-vessel-control-overlay/18-DESIGN-SNAPSHOT.md` — **read this first.** Local extract of the header strip, footer strip, vessel-overlay markup/positioning/interaction logic, and risk/action-copy derivations from the live `claude.ai/design` file, with provenance and porting notes. This is the primary implementation reference for this phase's visual/behavioral contract.
- Live source (only if the snapshot is suspected stale): `claude.ai/design` project `c265c047-81a0-4446-bdf3-95d434adc3dc` ("COLREGS Navigator design brief"), file `COLREGS Navigator (shadcn).dc.html`, accessible via the `DesignSync` tool (`get_file`).

### Roadmap & requirements
- `.planning/ROADMAP.md` — Phase 18 section (Goal, Depends on Phase 16, Requirements: SBOX-06/SBOX-07/SBOX-08, Success Criteria 1-4 — criterion 3's re-click-toggle wording is the source of D-01; criterion 4's hit-testing re-verification requirement is the source of D-04's caution).
- `.planning/REQUIREMENTS.md` — SBOX-06, SBOX-07, SBOX-08.
- `.planning/PROJECT.md` — v1.4 milestone goal ("re-sync front end against the updated Claude Design file") and "zero change to `classifyEncounter()`/domain logic — presentation layer only" constraint, directly relevant to D-02's scope boundary (risk-badge divergence stays presentation-only).

### Prior phases
- `.planning/phases/16-sandbox-mutation-path-generalization/16-CONTEXT.md` — confirms the "every mutation source funnels through one choke point" invariant this phase's overlay-driven type/speed edits must keep respecting (via `useSandboxState()`'s existing `onVesselSpeedChange`/`onVesselTypeChange`, unchanged this phase).
- `.planning/phases/17-gallery-sandbox-bridge/17-CONTEXT.md` — no direct dependency (ROADMAP notes Phase 18 is independent of Phase 17's Gallery-bridge files), but documents this project's established pattern for capturing decisions directly from user discussion when no local design mockup existed — same pattern used here, except this phase *did* get a live design-source read via `DesignSync`.

### Existing code this phase must reuse, not reinvent
- `src/components/sandbox/vessel-role.ts` — `getVesselRole()`, `ROLE_BADGE_TEXT`, `ROLE_BADGE_CLASSNAME`, `ROLE_HULL_FILL_CLASS` — reuse for both the header risk context and the new per-vessel overlay/footer role badges; do not introduce a parallel role-label map (see `VerdictBanner.tsx`'s own comment on why `VESSEL_LABEL_TEXT`/`ROLE_STATUS_TEXT` stayed local — that card is being removed this phase, so those two maps go with it, not to be resurrected elsewhere without checking for reuse first).
- `src/components/sandbox/instruments/instrument-readouts.ts` (`deriveInstrumentReadouts()`) — the existing direct-geometry-call pattern for RANGE/BEARING/CPA/TCPA; the footer strip reuses this output as-is, and D-02's risk-tier derivation should build on the same CPA/TCPA values rather than recomputing them.
- `src/components/sandbox/control-panel/ControlPanel.tsx` — `VESSEL_TYPE_LABELS`, `formatHeading()`, the existing Select/Slider field wiring, and the "heading is read-only/drag-only, no editable control" convention — the overlay's TYPE/SPEED/HEADING fields are the same three fields with the same read-only-heading rule, just relocated into a floating card.
- `src/components/sandbox/chart/VesselGroup.tsx` / `useHullDrag.ts` / `useRotateHandleDrag.ts` — the existing `onPointerDown`/`setPointerCapture` drag handlers D-04 attaches the overlay-open behavior onto; also the file with the most detailed existing comments on this codebase's hit-testing-regression precedent (worth re-reading before touching hull/rotate hit-target code).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `getVesselRole()` + the `vessel-role.ts` badge/color maps — drive the header risk-adjacent role context, the overlay card's role badge, and the footer's per-vessel role badge; already shared across `ChartPanel`/`ControlPanel`/`VerdictBanner` today.
- `deriveInstrumentReadouts()` — footer strip's RANGE/BEARING/CPA/TCPA values, unchanged.
- `ControlPanel.tsx`'s `VESSEL_TYPE_LABELS` + `formatHeading()` — overlay's TYPE select options and read-only HEADING display text.
- `useSandboxState()`'s existing `onVesselSpeedChange`/`onVesselTypeChange` — overlay's editable fields wire to these exact same callbacks `ControlPanel` uses today; no new state-mutation path needed (Phase 16's single-choke-point invariant holds).

### Established Patterns
- "Single choke point" invariant (from Phase 16): all vessel mutation, including the overlay's type/speed edits, must keep flowing through `useSandboxState()`'s existing callbacks — this phase adds a new *UI surface* for those callbacks, not a new mutation path.
- Hit-testing convention (from `VesselGroup.tsx`'s own comments): only genuinely painted shapes (solid fill, not `fill="none"`) get pointer handlers; purely decorative overlays get `pointerEvents="none"`. The new floating overlay card sits *outside* the SVG (an absolutely-positioned sibling `div`, per the design source's `posCard`), so it doesn't interact with this SVG-internal hit-testing rule directly — but D-04's pointerdown-based open trigger means the overlay's own appearance must not itself create a new element that could swallow the *next* pointerdown on the chart underneath it (e.g. if the card visually overlaps the vessel).

### Integration Points
- `SandboxContainer.tsx` — currently composes `VerdictBanner` (above the chart) and `InstrumentReadouts` + `ControlPanel` (in a side column next to `ChartPanel`). All three of those composition points change this phase: `VerdictBanner` and `InstrumentReadouts` are removed as standalone cards (their content moves inside `ChartPanel`'s header/footer strips), and `ControlPanel` is removed as an always-visible side column (its content becomes the click-triggered floating overlay, also inside/adjacent to `ChartPanel`).
- `ChartPanel.tsx` — gains the header strip, footer strip, and the two conditional overlay cards as new elements around/within its existing `<div ref={containerRef}>` wrapper (the same relatively-positioned container that already hosts the "1 NM" scale-bar legend as an absolutely-positioned sibling of the `<svg>` — the overlay cards follow that same positioning pattern, not a new one). Needs new local state for "which vessel (if any) has its overlay open," analogous to the design source's `selected` state.
- `VesselGroup.tsx` / hull & rotate-handle `onPointerDown` handlers — need to also signal "open this vessel's overlay" per D-04, in addition to their existing `setPointerCapture` drag-start behavior.

</code_context>

<specifics>
## Specific Ideas

The primary "specific idea" for this phase is the design source itself — captured in full in `18-DESIGN-SNAPSHOT.md`, not paraphrased from memory. Where this phase's locked ROADMAP requirements and the design source's actual coded behavior disagreed (overlay close, D-01) or where the design's visual richness conflicted with a prior architectural rationale in this codebase (risk badge, D-02), the user was shown the specific conflict and made an explicit call rather than either being silently overridden.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. Corner bezel accents (mentioned in Claude's Discretion above) are a minor visual add-on within this phase's own chart-frame changes, not a deferred capability.

### Reviewed Todos (not folded)
None — `gsd-sdk query todo.match-phase 18` returned zero matches.

</deferred>

---

*Phase: 18-On-Chart Vessel Control Overlay*
*Context gathered: 2026-07-25*
