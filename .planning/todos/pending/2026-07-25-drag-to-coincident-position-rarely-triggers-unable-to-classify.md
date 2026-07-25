---
created: 2026-07-25T00:00:00.000Z
title: Real mouse drag rarely triggers the degenerate "Unable to classify" state
area: sandbox
resolves_phase: null
files:
  - src/domain/geometry/bearing/bearing.ts
  - src/components/sandbox/chart/ChartPanel.tsx
---

## Problem

`bearing()` only flags a coincident-position input when `dx === 0 && dy === 0`
exactly. Found during Phase 16's 16-02 human-verify checkpoint: dragging one
vessel's hull with a real mouse onto the other vessel's visual position does
not reliably trigger "Unable to classify," because the screen-to-chart
coordinate conversion from real pointer movement essentially never lands on
the *exact* same floating-point coordinate as the other vessel. The RTL test
(`dragHullTo(container, "vesselB", { x: 0, y: 0 })`) uses a synthetic exact
coordinate and does correctly show "Unable to classify," proving the
`classifyEncounter`/`applyVesselUpdate` degenerate-detection logic itself is
correct — this is a UX/precision gap in how a real drag can reach that exact
coordinate, not a logic bug.

Confirmed pre-existing (not introduced by Phase 16's `loadScenario()`
refactor): `ChartPanel.tsx` and the geometry/bearing code were untouched by
that phase, and `applyVesselUpdate`'s body was explicitly left unmodified.

## Solution

TBD. Likely shape: either (a) snap/round chart coordinates during drag to a
small epsilon so near-exact overlaps register as coincident, or (b) widen
`bearing()`'s coincident check to a small distance threshold instead of exact
equality. Needs a product decision on how close counts as "coincident" before
implementing — this is a UX tuning question, not just a code fix.
