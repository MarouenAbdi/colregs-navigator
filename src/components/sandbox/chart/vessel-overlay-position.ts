/**
 * Pure quadrant-anchor derivation for the floating vessel overlay card:
 * computed fresh from a vessel's screen position and the chart
 * container's pixel size on every call, with zero framework/DOM/pointer-
 * event dependency. Extracted as a standalone, independently-tested
 * function per PITFALLS.md Pitfall 1's explicit recommendation ("extract
 * the overlay's open/anchor logic into a small pure function... unit-
 * tested independent of pointer-event wiring") -- this codebase's 3rd
 * occurrence of the painted-element-hit-testing regression class
 * (Phase 4/Phase 8 precedent), this time for positioning math rather than
 * hit-testing. Mirrors chart-panel-derivation.ts's own doc-comment/file
 * shape.
 */

import type { ContainerSize } from "../../../domain/geometry/screen-convert/screen-convert.js";

// Matches the design snapshot's own `+26`/`-6` literals (18-DESIGN-SNAPSHOT.md
// "Positioning" posCard section), ported as behavior, not raw CSS.
const HORIZONTAL_GAP_PX = 26;
const VERTICAL_NUDGE_PX = 6;

export interface OverlayAnchor {
  right: boolean; // true: vessel is in the left half -> anchor the card to its right
  below: boolean; // true: vessel is in the top half -> anchor the card below it
  offsetXPx: number; // distance from the anchored horizontal edge (left or right) to the card
  offsetYPx: number; // distance from the anchored vertical edge (top or bottom) to the card
}

export function deriveOverlayAnchor(
  screen: { screenX: number; screenY: number },
  containerSize: ContainerSize,
): OverlayAnchor {
  // At the exact halfway point, `<` resolves to false -- the vessel is
  // treated as being in the right/bottom half, anchoring the card to the
  // left/above. Deterministic, never NaN/ambiguous.
  const right = screen.screenX < containerSize.width / 2;
  const below = screen.screenY < containerSize.height / 2;

  const offsetXPx = right
    ? screen.screenX + HORIZONTAL_GAP_PX
    : containerSize.width - screen.screenX + HORIZONTAL_GAP_PX;

  const offsetYPx = Math.max(
    below
      ? screen.screenY - VERTICAL_NUDGE_PX
      : containerSize.height - screen.screenY - VERTICAL_NUDGE_PX,
    0,
  );

  return { right, below, offsetXPx, offsetYPx };
}
