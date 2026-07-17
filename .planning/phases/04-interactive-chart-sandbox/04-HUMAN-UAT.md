---
status: partial
phase: 04-interactive-chart-sandbox
source: [04-VERIFICATION.md]
started: 2026-07-17T20:52:32Z
updated: 2026-07-17T22:25:00Z
---

## Current Test

[awaiting re-verification of items 1 and 3 after fix commits 3746a98 and 3bf6f24]

## Tests

### 1. Continuous-drag smoothness (CHRT-02)
expected: Dragging a vessel's hull or rotate handle produces no lag or flicker in the chart, the live classification, or the reasoning trail. The code has no throttling/RAF batching (a deliberate choice per 04-RESEARCH.md — `classifyEncounter()` is pure synchronous trig, cheap enough per pointermove), so this should already feel responsive, but it needs an actual browser to confirm.
result: issue found — user reported "having trouble dragging vessels" during live testing, then "still tricky" after the first fix. Root cause diagnosed as hit-area geometry (same as item 3), not a performance/throttling problem. Second-round fix (commit `3bf6f24`) removed the padded invisible hit-rect entirely and attaches drag handlers directly to the visible (now bigger) hull polygon, so hit-testing follows the real painted shape. Needs re-verification after this fix.

### 2. Give-way/stand-on color legibility
expected: Red (give-way) / green (stand-on) / slate (mutual) hull colors plus GW/SO/MUTUAL text badges are clearly distinguishable at a glance, including for colorblind users (the badges are the accessibility fallback for the color signal).
result: [pending]

### 3. Rotate-handle vs. hull-drag pixel-boundary behavior
expected: Dragging near the boundary between the vessel hull and its rotate handle correctly starts the intended gesture (position drag vs. heading rotate) without misfiring the other one, and only when actually clicking on the vessel.
result: issue found (two rounds).
  - **Round 1:** user reported "not able to rotate properly." Diagnosed: the rotate-handle hit-circle (r=22, `cy=-20`) overlapped more than half of the hull's 44x44 invisible hit-rect. **Fixed in `3746a98`** — pinned hit-rect top edge to the bow tip and moved the rotate handle further out. Tests passed, but the underlying design (two independently-sized padded invisible shapes) still left overlap risk down to numeric guesswork.
  - **Round 2:** user reported dragging/rotating still "tricky" after round 1's fix, and asked for bigger icons and hit-testing constrained to "the vessel only." Diagnosed: an invisible padded hit-rect is inherently larger than the vessel it represents, so precise separation from a neighboring hit-target can't be guaranteed by picking numbers — it needs the hit-test to follow the actual vessel shape. **Fixed in `3bf6f24`** — removed the hull's separate invisible hit-rect; pointer handlers now live directly on the visible, solid-filled hull polygon (SVG's default `pointer-events: visiblePainted` hit-tests the real painted shape, not a bounding box), and the hull itself is enlarged (~36x48px, up from 12x18px). The rotate handle keeps its own well-separated 44px hit-circle (still padded, since it's an isolated control with nothing nearby to misfire against), pushed further out with a decorative stalk line connecting it visually to the hull.
  All 146 tests + `tsc --noEmit` + `next build` pass after both fixes. **Needs a live re-test to confirm the second fix resolves the reported "tricky" feel** — no browser tooling was available this session to verify visually.

## Summary

total: 3
passed: 0
issues: 2
pending: 1
skipped: 0
blocked: 0

## Gaps

### Gap 1: Hull-drag / rotate-handle hit-area design (items 1 and 3)
- **Status:** Fixed (2nd round), awaiting re-verification
- **Found:** Live UAT — user reported unreliable drag and rotate behavior across two rounds of testing
- **Root cause (round 1):** Overlapping SVG hit-targets in `ChartPanel.tsx`'s `VesselGroup` — two independently-sized padded invisible shapes with only a numeric margin between them
- **Root cause (round 2, after round 1's numeric fix):** Even with no overlap, a padded invisible hit-rect is a poor proxy for "the vessel" — its boundary doesn't match what the user visually sees, so gestures still felt imprecise; user also wanted bigger, easier-to-grab icons
- **Fix:** Commit `3746a98` (numeric separation) then `3bf6f24` (structural fix — hit-testing now follows the actual hull polygon shape directly, plus a bigger hull)
- **Verification status:** Automated (146/146 tests, `tsc --noEmit`, `next build`) passes both rounds. Visual/interactive confirmation still needed — re-test dragging and rotating in a running `npm run dev` session.
