# Phase 20: Reasoning-Trail & Hero Visual Sync - Context

**Gathered:** 2026-07-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Purely additive/cosmetic visual sync of two existing, already-shipped surfaces against the updated Claude Design file — zero change to `classifyEncounter()` or any classification output:

1. **Reasoning trail** (`ReasoningTrail.tsx`): restructure from today's wrapping grid of cards into a true horizontal "NAV DECISION CHAIN" — a single flex row of equal-width step cards joined by CSS-only animated connectors, stacking vertically below the existing 900px breakpoint.
2. **Hero preview card** (`HeroPreviewCard.tsx`, `hero-preview-geometry.ts`): sync bezel (3 range rings + compass-tick ring + cardinal labels), add the radar-sweep overlay, and restructure the header/footer to match the design's richer readout (rule chip + risk pill in a header strip; RANGE/BEARING/CPA/TCPA + LIVE dot in a footer strip) — while keeping the classification itself fully static/fixture-driven (no live Sandbox wiring, no shared code with `ChartPanel.tsx`).

No new capabilities, no domain logic changes, no changes to any other Sandbox/Gallery/Tour surface.

</domain>

<decisions>
## Implementation Decisions

### Hero's "LIVE" indicator vs. the Phase 7 static precedent
- **D-01:** Port the design's pulsing LIVE dot into Hero's new footer readout strip — this phase's "visually match the updated design file" goal (Roadmap criterion 3) supersedes Phase 7's D-01, which predates this design revision.
- **D-02:** The Hero LIVE dot must be *visually distinguished* from the real Sandbox's LIVE dot (`ChartFooterStrip.tsx`'s `animate-pulse` + `bg-rule-accent`), not a byte-for-byte reuse — e.g. a slower or dimmer pulse. This preserves the substance of D-01 (Hero must not visually claim to be wired to live vessel state) even though the literal "no pulsing dot" rule is now superseded. Classification values themselves remain fixture-driven and unchanged (HERO-05's explicit constraint).

### Hero layout restructuring scope
- **D-03:** Go for full layout parity with the design, not a surface-only styling pass:
  - Move the rule chip + encounter title + risk pill into a header strip atop the chart (mirrors how SBOX-06 already restructured the real Sandbox chart's header).
  - Expand the footer from today's 3-metric grid (RANGE/BEARING/CPA) to the design's 4-item row (RANGE/BEARING A→B/CPA/TCPA) — TCPA is a net-new metric for this card.
- **D-04:** Remove the current `CardHeader`'s "Live classification" eyebrow line and "BRG-ring · 12 NM" label entirely — the new in-card header strip fully replaces its role. Do not keep a trimmed/relocated version of it.

### Trail animation density
- **D-05:** Port all three of the design's CSS-only animation layers, not just the Roadmap-required connector:
  1. Dashed connector flow (`conduit` keyframe — animates `background-position`, required by Roadmap criterion 2)
  2. Traveling pulse dot along each connector (`travel` keyframe — animates `left`/`opacity`)
  3. Spinning radar-sweep ring inside each step's numbered token (`sweep` keyframe — animates `transform: rotate`)

  All three are CSS-only (no `getBoundingClientRect`/`getBBox`), satisfying the jsdom-measurement-ban precedent regardless of density chosen.
- **D-06:** All animations introduced by this phase (trail's three layers, plus Hero's radar-sweep overlay and LIVE pulse) must be wrapped in a `@media (prefers-reduced-motion: no-preference)` guard, falling back to a static equivalent otherwise. The design source itself has no such guard — this is this phase's own addition, not something to extract from the design.

### Trail copy details
- **D-07:** Adopt the design's copy verbatim: step-count badge changes from "N steps" to "N contacts"; header subtitle becomes "NAV DECISION CHAIN · radar acquisition" (not just "NAV DECISION CHAIN" alone).

### Trail responsive strategy (confirmed via existing convention, not re-litigated)
- **D-08:** Use the design's own fallback exactly: single horizontal flex row (`flex:1 1 0` per card, `flex:0 0 34px` per connector) at ≥900px, `flex-direction: column` stack at <900px with connectors shrunk to a fixed-height band. `900px`/`min-[900px]:` is already this codebase's established breakpoint (`SandboxContainer.tsx`, `ChartFooterStrip.tsx` both use it) — not a new convention.

### Claude's Discretion
- Exact color/opacity/timing tuning for the Hero LIVE dot's "subtly distinguished" pulse (D-02) — no specific numbers were requested, only that it must read as different from the real Sandbox's indicator on close inspection.
- Whether the reduced-motion fallback (D-06) shows a fully static state or a single non-repeating transition — implementation detail, not a visual outcome the user specified.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design source (primary reference)
- `.planning/phases/20-reasoning-trail-hero-visual-sync/20-DESIGN-SNAPSHOT.md` — extracted markup, inline styles, and JS style-builder for both the trail and Hero card, pulled live from the coded design prototype (`claude.ai/design` project `c265c047-81a0-4446-bdf3-95d434adc3dc`, file `COLREGS Navigator (shadcn).dc.html`). This is a fully coded prototype, not a static mock — treat it as ground truth for exact colors, dash patterns, radii, and keyframe definitions.

### Prior locked decisions this phase interacts with
- `.planning/milestones/v1.1-phases/07-hero/07-CONTEXT.md` — D-01 (Hero static-card precedent, now partially superseded per D-01/D-02 above), D-02/D-03 (chart fidelity, no shared code with `ChartPanel.tsx` — still binding, unchanged by this phase)

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` — SBOX-09, HERO-05
- `.planning/ROADMAP.md` — Phase 20 success criteria (4 criteria, all human-verification-gated per this project's established precedent for visual/interaction changes)

### Reference data
- `docs/reasoning-trails.json` — catalog of all COLREGS reasoning-trail shapes; trail lengths range 3–5 steps across 7 catalogued scenarios — the horizontal layout must hold up at every length in this set, not just the 5-step example in the design snapshot.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/sandbox/reasoning/reasoning-trail-tag.ts` — `classifyingEntryIndex()`/`ruleNumber()` helpers stay as-is; only the presentation layer in `ReasoningTrail.tsx` changes.
- `ReasoningTrail.tsx`'s existing `TrailTone` five-way split (`geometry|rule|doubt|verdict-mutual|verdict-decisive`) already maps 1:1 onto the design's `dotFor()` color categories (`geo/rule/gw/so/mut/doubt`) — no new tone categories needed, just new visual treatment per tone.
- `ChartFooterStrip.tsx`'s LIVE-dot pattern (`animate-pulse` + `bg-rule-accent`) is the reference implementation to *deliberately diverge from* per D-02, not copy verbatim.

### Established Patterns
- `min-[900px]:` Tailwind arbitrary-breakpoint convention, already used in `SandboxContainer.tsx` and `ChartFooterStrip.tsx` — reuse for the trail's responsive flip (D-08).
- This project's CLAUDE.md convention: split non-trivial derived computation from presentation (e.g. `hero-preview-geometry.ts` pattern) — any new bezel-radius/connector-geometry math for either surface should follow the same split, not get inlined into JSX.
- jsdom-measurement-ban precedent (no `getBoundingClientRect()`/`getBBox()` in components) — both this phase's connector and Hero's radar sweep are pure CSS/keyframe, already compliant by construction.

### Integration Points
- `ReasoningTrail.tsx` renders inside the existing Sandbox reasoning card slot — no parent-component signature changes expected.
- `HeroPreviewCard.tsx` is fixture-driven and standalone (per D-02/D-03 in `07-CONTEXT.md`) — this phase's changes stay entirely within `HeroPreviewCard.tsx` and `hero-preview-geometry.ts`; no `ChartPanel.tsx` coupling introduced.

</code_context>

<specifics>
## Specific Ideas

- The reasoning trail's target visual is captured precisely in `scraps/radar-chain.png` in the design project (horizontal cards, numbered radar-token badges, dashed teal connectors, last/verdict card glowing red-bordered) — contrast with `scraps/trail.png`, a screenshot of the current "before" vertical/wrapped state.
- Hero's new bezel is a genuine upgrade over what Phase 7 shipped (2 plain rings) — 3 range rings, a compass-style dashed tick ring, N/S/E/W cardinal labels, and distance labels per ring, all extracted verbatim in the design snapshot.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 20-Reasoning-Trail & Hero Visual Sync*
*Context gathered: 2026-07-27*
