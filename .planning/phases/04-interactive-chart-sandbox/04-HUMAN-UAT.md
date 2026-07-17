---
status: partial
phase: 04-interactive-chart-sandbox
source: [04-VERIFICATION.md]
started: 2026-07-17T20:52:32Z
updated: 2026-07-17T20:52:32Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Continuous-drag smoothness (CHRT-02)
expected: Dragging a vessel's hull or rotate handle produces no lag or flicker in the chart, the live classification, or the reasoning trail. The code has no throttling/RAF batching (a deliberate choice per 04-RESEARCH.md — `classifyEncounter()` is pure synchronous trig, cheap enough per pointermove), so this should already feel responsive, but it needs an actual browser to confirm.
result: [pending]

### 2. Give-way/stand-on color legibility
expected: Red (give-way) / green (stand-on) / slate (mutual) hull colors plus GW/SO/MUTUAL text badges are clearly distinguishable at a glance, including for colorblind users (the badges are the accessibility fallback for the color signal).
result: [pending]

### 3. Rotate-handle vs. hull-drag pixel-boundary behavior
expected: Dragging near the boundary between the vessel hull and its rotate handle correctly starts the intended gesture (position drag vs. heading rotate) without misfiring the other one. 04-REVIEW.md (IN-02) flagged that the code's own `stopPropagation()` comment describes an impossible bubbling scenario (the hull hit-rect and rotate handle are SVG siblings, not ancestor/descendant, so bubbling between them was never actually possible) — the real protection is SVG paint order (rotate handle drawn on top). Worth a live spot-check to confirm hit-testing actually behaves as intended, not just as commented.
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
