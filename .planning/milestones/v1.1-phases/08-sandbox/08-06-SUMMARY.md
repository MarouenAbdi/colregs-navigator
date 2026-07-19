---
phase: 08-sandbox
plan: 06
subsystem: ui
tags: [react, tailwind, colregs, sandbox, uat, manual-verification]

# Dependency graph
requires:
  - phase: 08-sandbox
    plan: 05
    provides: Fully composed, green SandboxContainer (all Wave 1-3 output wired together)
provides:
  - Human-confirmed PASS for drag-to-reposition/drag-to-rotate hit-testing, visual fidelity, chip-row correctness, Save/Reset, and responsive breakpoints
  - 11 UAT-driven fix commits closing the gap between the initial restyle and both the original UI-SPEC screenshot and a freshly re-imported Claude Design source
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Cross-referenced a live Claude Design MCP project (\"COLREGS Navigator design brief\", COLREGS Navigator (shadcn).dc.html) via DesignSync for exact CSS values (colors, padding, font) instead of eyeballing screenshots alone -- caught several precise deltas (rule-badge text color, role-badge full-word labels, accent-color state derivation) invisible from a screenshot"
    - "Vessel hull icon shape/stroke/non-rotating label convention deliberately kept in sync with HeroPreviewCard's existing HULL_PATH/HULL_STROKE constants (same literal values, scaled proportionally) rather than diverging -- two features rendering the \"same\" vessel icon must not silently drift apart"

key-files:
  created: []
  modified:
    - src/components/sandbox/ReasoningTrail.tsx
    - src/components/sandbox/ReasoningTrail.test.tsx
    - src/components/sandbox/SandboxContainer.tsx
    - src/components/sandbox/SandboxContainer.test.tsx
    - src/components/sandbox/VerdictBanner.tsx
    - src/components/sandbox/VerdictBanner.test.tsx
    - src/components/sandbox/InstrumentReadouts.tsx
    - src/components/sandbox/ChartPanel.tsx
    - src/components/sandbox/ChartPanel.test.tsx
    - src/components/sandbox/ControlPanel.tsx
    - src/components/sandbox/status-pill.ts
    - src/components/sandbox/status-pill.test.ts

key-decisions:
  - "Did NOT port the re-imported design source's own inline reasoning/risk JS (its doubt-step logic and ad-hoc CPA-distance risk thresholds) -- that markup is a static demo re-implementation of COLREGS, not this project's tested, authoritative domain layer. Only visual/layout/color values were reconciled; the status-pill's new \"opening\" tone was derived from the domain's own tcpaMinutes sign (D-06), not the prototype's hardcoded thresholds."
  - "Vessel hull shape changed from a flat-back triangle to the same concave 4-point kite/arrow HeroPreviewCard already uses, scaled up ~2.029x to preserve ChartPanel's deliberately larger interactive hit target (04-HUMAN-UAT.md Gap 1) rather than shrinking it back to Hero's small static-preview size"
  - "Letter chip (A/B) and role badge (GW/SO/MUTUAL) moved OUT of the hull's rotating <g> into a sibling non-rotating group at a fixed screen offset -- matching both HeroPreviewCard's VesselMarker and the design source's own renderVessel(), which give the hull its own rotate(hdg) transform separate from the badge/label groups. Pre-fix, a vessel's badge visibly rotated with heading (e.g. read sideways at 270°)."

patterns-established: []

requirements-completed: [SBOX-01, SBOX-05]

# Metrics
duration: ~2h (interactive UAT session, 11 fix commits)
completed: 2026-07-19
---

# Phase 8 Plan 6: Manual Browser UAT Summary

**Human-verified PASS for all 6 required checks (drag/rotate hit-testing, visual fidelity, chip-row correctness, Save/Reset, responsive breakpoints) after an interactive UAT session that surfaced and fixed 11 rounds of styling/layout drift between the initial restyle and the design -- including a live re-sync against a freshly updated Claude Design source imported mid-session.**

## Performance

- **Duration:** ~2 hours (interactive, human-in-the-loop)
- **Completed:** 2026-07-19
- **Tasks:** 1 (checkpoint:human-verify)
- **Fix commits:** 11

## Human Verdict

**"all good, approved."**

All 6 `<how-to-verify>` checks from the plan confirmed passing in a real browser (`npm run dev`, `/#sandbox`):

1. Drag-to-reposition -- smooth, no offset/snap glitch, live verdict/readout/trail updates for both vessels
2. Drag-to-rotate -- hull rotates to track pointer, live re-derivation, for both vessels
3. Visual fidelity -- confirmed against both the original design screenshot and a freshly re-imported Claude Design source (see below)
4. Chip row -- all 6 chips load distinct, correctly-classified scenarios; active-chip highlight clears on manual drag
5. Save/Reset -- Save redirects to `/s/{shareId}`; Reset restores default scenario
6. Responsive breakpoints -- 900px and 640px stacking confirmed

## Issues Found and Fixed (chronological)

1. **Reasoning-trail rule-id label wrapping** (`94c3f57`) -- long rule citations like "Rule 13(a)-(b)" wrapped onto 3 lines; pinned the label to its natural width, let the description wrap independently.
2. **Sandbox eyebrow color + verdict-banner layout** (`86fdd92`) -- eyebrow was muted gray instead of teal accent; verdict banner stacked everything in one left column instead of using the card's full width.
3. **Verdict banner vs. reference screenshot** (`9161a4c`) -- added the missing teal left divider, put rule badge + title on one row, redesigned role badges from plain-gray-label to bordered/tinted boxes with full-word status ("GIVE WAY"/"STAND ON").
4. **Verdict banner divider spacing** (`58d07b8`) -- divider was flush against the card edge with no gap; inset it.
5. **Full re-sync against updated Claude Design source** (`d95de26`) -- user provided a live Claude Design MCP link; pulled the exact HTML/CSS via DesignSync and reconciled every Sandbox component's precise values (accent-color state derivation, tile backgrounds, reasoning-trail card-grid layout, chip-row font, hull letter/badge, control-panel label fonts) instead of continuing to eyeball screenshots.
6. **Section order** (`4b8afe8`) -- Reasoning Trail was inline beside the chart/readouts column instead of full-width below the whole block; vessel-control cards were a separate row instead of stacked under Instrument Readouts.
7. **Chart background + vessel icon shape** (`f7c172b`) -- added the missing two-tier grid texture, teal range rings, and N/E-W crosshair; replaced the flat-back-triangle hull with the same concave kite/arrow shape HeroPreviewCard uses.
8. **Vessel icon rotation bug** (`3678dd3`) -- letter chip and role badge were nested inside the hull's rotating group, so they visibly spun with heading (e.g. read sideways at 270°); moved them to a non-rotating sibling group, matching Hero's fixed-offset convention; also added the hull's near-white outline stroke.
9. **Drag/rotate cursor affordance** (`a5c0b85`) -- neither the hull nor the rotate handle had any cursor styling; added `cursor-grab`/`active:cursor-grabbing`.
10. **Instrument Readouts title + status-alert styling** (`abed912`) -- the card's "INSTRUMENT READOUTS" header was missing entirely; the status alert was a small rounded-full pill instead of the design's full-width rounded-lg bar.
11. **Range tooltip** (`937e968`) -- the bearing line was missing the design's midpoint distance chip ("X.XX NM"), present in HeroPreviewCard's static preview but never ported to the live ChartPanel.

All 11 commits kept the full test suite green (194/194 passing) and `npm run typecheck` clean throughout.

## Decisions Made

- Reused a live Claude Design MCP project as ground truth once the user surfaced it, rather than continuing to approximate from static screenshots -- this caught several exact-value deltas (rule-badge text color, teal hex matching `--primary` not `--rule-accent`, role-badge full-word convention) that screenshot comparison alone had missed.
- Deliberately did not copy the re-imported design prototype's own JS reasoning/risk logic (a simplified static re-implementation of COLREGS with its own doubt-handling and CPA thresholds) -- only visual/layout/color values were ported, preserving this project's tested domain layer as the sole source of truth for classification behavior.
- Kept the vessel hull's larger, UAT-established interactive hit target (04-HUMAN-UAT.md Gap 1) while still matching Hero's exact shape proportions, by scaling all of Hero's HULL_PATH points by the same ratio rather than shrinking the hit target back down.

## Next Phase Readiness

- Phase 8 (Sandbox) is fully restyled, wired, and human-verified. All must-haves (SBOX-01: hit-testing regression check, SBOX-05: responsive breakpoints) are confirmed passing in a real browser.
- No open issues or follow-up gap-closure plans needed.
- Ready for code review, regression gate, and phase-goal verification.

## Self-Check

```
FOUND: src/components/sandbox/ReasoningTrail.tsx
FOUND: src/components/sandbox/SandboxContainer.tsx
FOUND: src/components/sandbox/VerdictBanner.tsx
FOUND: src/components/sandbox/InstrumentReadouts.tsx
FOUND: src/components/sandbox/ChartPanel.tsx
FOUND: src/components/sandbox/ControlPanel.tsx
FOUND commit: 94c3f57
FOUND commit: 86fdd92
FOUND commit: 9161a4c
FOUND commit: 58d07b8
FOUND commit: d95de26
FOUND commit: 4b8afe8
FOUND commit: f7c172b
FOUND commit: 3678dd3
FOUND commit: a5c0b85
FOUND commit: abed912
FOUND commit: 937e968
```

All modified files verified present on disk; all 11 fix commits verified present in `git log`. Full suite: 194/194 tests passing, `npm run typecheck` clean.

## Self-Check: PASSED

---
*Phase: 08-sandbox*
*Completed: 2026-07-19*
