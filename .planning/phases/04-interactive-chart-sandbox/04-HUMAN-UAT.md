---
status: partial
phase: 04-interactive-chart-sandbox
source: [04-VERIFICATION.md]
started: 2026-07-17T20:52:32Z
updated: 2026-07-17T22:40:00Z
---

## Current Test

[awaiting re-verification of items 1 and 3 after fix commits 3746a98, 3bf6f24, f559e98]

## Tests

### 1. Continuous-drag smoothness (CHRT-02)
expected: Dragging a vessel's hull or rotate handle produces no lag or flicker in the chart, the live classification, or the reasoning trail. The code has no throttling/RAF batching (a deliberate choice per 04-RESEARCH.md — `classifyEncounter()` is pure synchronous trig, cheap enough per pointermove), so this should already feel responsive, but it needs an actual browser to confirm.
result: issue found — user reported "having trouble dragging vessels" during live testing, then "still tricky" after the first fix. Root cause diagnosed as hit-area geometry (same as item 3), not a performance/throttling problem. Fixed across commits `3bf6f24` (hull) and `f559e98` (rotate handle) — both now hit-test their actual visible shape rather than a padded invisible proxy. Needs re-verification after these fixes.

### 2. Give-way/stand-on color legibility
expected: Red (give-way) / green (stand-on) / slate (mutual) hull colors plus GW/SO/MUTUAL text badges are clearly distinguishable at a glance, including for colorblind users (the badges are the accessibility fallback for the color signal).
result: [pending]

### 3. Rotate-handle vs. hull-drag pixel-boundary behavior
expected: Dragging near the boundary between the vessel hull and its rotate handle correctly starts the intended gesture (position drag vs. heading rotate) without misfiring the other one, and only when actually clicking on the vessel/handle itself.
result: issue found (three rounds).
  - **Round 1:** user reported "not able to rotate properly." Diagnosed: the rotate-handle hit-circle (r=22, `cy=-20`) overlapped more than half of the hull's 44x44 invisible hit-rect. **Fixed in `3746a98`** — pinned hit-rect top edge to the bow tip and moved the rotate handle further out. Tests passed, but the underlying design (two independently-sized padded invisible shapes) still left overlap risk down to numeric guesswork.
  - **Round 2:** user reported dragging/rotating still "tricky" after round 1's fix, and asked for bigger icons and hit-testing constrained to "the vessel only." Diagnosed: an invisible padded hit-rect is inherently larger than the vessel it represents, so precise separation from a neighboring hit-target can't be guaranteed by picking numbers — it needs the hit-test to follow the actual vessel shape. **Fixed in `3bf6f24`** — removed the hull's separate invisible hit-rect; pointer handlers now live directly on the visible, solid-filled hull polygon (SVG's default `pointer-events: visiblePainted` hit-tests the real painted shape, not a bounding box), and the hull itself is enlarged (~36x48px, up from 12x18px). The rotate handle at that point still kept its own separate padded 44px hit-circle.
  - **Round 3:** user asked to apply the same principle to the rotate handle's circles. **Fixed in `f559e98`** — removed the rotate handle's separate padded invisible hit-circle too; pointer handlers now live directly on the visible teal-ringed circle (`fill="white"`, a real paint, hit-tests exactly its drawn area). Visible ring enlarged slightly (r=10, was r=7) since it alone now defines the click area.
  All 146 tests + `tsc --noEmit` + `next build` pass after all three fixes. **Needs a live re-test to confirm** — no browser tooling was available this session to verify visually.

## Summary

total: 3
passed: 0
issues: 2
pending: 1
skipped: 0
blocked: 0

## Gaps

### Gap 1: Hull-drag / rotate-handle hit-area design (items 1 and 3)
- **Status:** Fixed (3rd round), awaiting re-verification
- **Found:** Live UAT — user reported unreliable drag and rotate behavior across three rounds of testing
- **Root cause (round 1):** Overlapping SVG hit-targets in `ChartPanel.tsx`'s `VesselGroup` — two independently-sized padded invisible shapes with only a numeric margin between them
- **Root cause (round 2):** Even with no overlap, a padded invisible hit-rect is a poor proxy for "the vessel" — its boundary doesn't match what the user visually sees, so gestures still felt imprecise; user also wanted bigger, easier-to-grab icons
- **Root cause (round 3):** The hull fix from round 2 wasn't yet applied to the rotate handle, which still used a separate padded invisible hit-circle
- **Fix:** Commit `3746a98` (numeric separation) → `3bf6f24` (hull: hit-testing follows the actual polygon shape, hull enlarged) → `f559e98` (rotate handle: hit-testing follows the actual visible circle, circle enlarged slightly)
- **Verification status:** Automated (146/146 tests, `tsc --noEmit`, `next build`) passes all three rounds. Visual/interactive confirmation still needed — re-test dragging and rotating in a running `npm run dev` session.
