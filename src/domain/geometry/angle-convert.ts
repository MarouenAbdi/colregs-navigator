/**
 * Phase 1 scope: compass<->math angle conversion only. The pure
 * screenToChart()/chartToScreen() numeric coordinate-conversion functions
 * are implemented in this same phase, in a sibling file (screen-convert.ts,
 * this plan's Task 3) — kept separate from this file because they convert
 * screen-pixel coordinates <-> chart {x,y} positions, not compass/math
 * angles. Only the *caller* that measures live containerSize via
 * ResizeObserver and supplies the chart's viewBox is Phase 4's (Interactive
 * Chart Sandbox) responsibility, per CLAUDE.md's SVG + Pointer Events
 * architecture note; the conversion functions themselves are not deferred.
 */

export function compassToMathDegrees(compassDegrees: number): number {
  throw new Error("not implemented");
}

export function mathToCompassDegrees(mathDegrees: number): number {
  throw new Error("not implemented");
}

export function normalizeCompassDegrees(degrees: number): number {
  throw new Error("not implemented");
}

export function normalizeRelativeBearingDegrees(degrees: number): number {
  throw new Error("not implemented");
}
