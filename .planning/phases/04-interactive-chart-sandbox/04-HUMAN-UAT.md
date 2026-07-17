---
status: partial
phase: 04-interactive-chart-sandbox
source: [04-VERIFICATION.md]
started: 2026-07-17T20:52:32Z
updated: 2026-07-17T21:25:00Z
---

## Current Test

[awaiting re-verification of items 1 and 3 after fix commit 3746a98]

## Tests

### 1. Continuous-drag smoothness (CHRT-02)
expected: Dragging a vessel's hull or rotate handle produces no lag or flicker in the chart, the live classification, or the reasoning trail. The code has no throttling/RAF batching (a deliberate choice per 04-RESEARCH.md — `classifyEncounter()` is pure synchronous trig, cheap enough per pointermove), so this should already feel responsive, but it needs an actual browser to confirm.
result: issue found — user reported "having trouble dragging vessels" during live testing. Root cause diagnosed as the same hit-area overlap as item 3 below (fixed in commit 3746a98) rather than a performance/throttling problem — the drag gesture itself was misfiring against the rotate handle's hit-circle, which reads as "trouble dragging." Needs re-verification after the fix.

### 2. Give-way/stand-on color legibility
expected: Red (give-way) / green (stand-on) / slate (mutual) hull colors plus GW/SO/MUTUAL text badges are clearly distinguishable at a glance, including for colorblind users (the badges are the accessibility fallback for the color signal).
result: [pending]

### 3. Rotate-handle vs. hull-drag pixel-boundary behavior
expected: Dragging near the boundary between the vessel hull and its rotate handle correctly starts the intended gesture (position drag vs. heading rotate) without misfiring the other one.
result: issue found — user reported "not able to rotate properly." Diagnosed root cause: `ChartPanel.tsx`'s rotate-handle hit-circle (r=22, centered at `cy=-20` in the vessel's local SVG group) overlapped more than half of the hull's own 44x44 hit-rect (`y: -22 to 22`), since both were independently sized to meet the 44px WCAG 2.5.5 touch-target minimum without accounting for their 20px separation. SVG paint order gave the rotate-handle priority in the overlap zone, so grabbing what looked like the hull polygon near the bow frequently triggered rotation instead of position-drag (or vice versa). Component tests never caught this because jsdom stubs `setPointerCapture`/`hasPointerCapture` and dispatch events directly to a `data-testid`'d node, bypassing real paint-order hit-testing entirely.
**Fixed in commit `3746a98`:** hull hit-rect's top edge pinned to the bow tip (`y=-10`, was `-22`); rotate handle moved further out (`cy=-34`, was `-20`) so the two 44px hit targets clear each other with a 2px margin. All 146 tests + `tsc --noEmit` still pass after the fix. **Needs a live re-test to confirm** — no browser tooling was available this session to verify visually.

## Summary

total: 3
passed: 0
issues: 2
pending: 1
skipped: 0
blocked: 0

## Gaps

### Gap 1: Hull-drag / rotate-handle hit-area overlap (items 1 and 3)
- **Status:** Fixed, awaiting re-verification
- **Found:** Live UAT — user reported unreliable drag and rotate behavior
- **Root cause:** Overlapping SVG hit-targets in `ChartPanel.tsx`'s `VesselGroup` (see item 3 above for full diagnosis)
- **Fix:** Commit `3746a98` — separated the hull hit-rect and rotate-handle hit-circle geometry so they no longer overlap
- **Verification status:** Automated (146/146 tests, `tsc --noEmit`) passes. Visual/interactive confirmation still needed — re-test dragging and rotating in a running `npm run dev` session.
