/**
 * Pure, framework-free geometry shared by every independent static-
 * illustration chart component (Hero's preview card, Gallery's mini-chart)
 * -- extracted from `hero-preview-geometry.ts` once Gallery became a real
 * second consumer of these primitives (D-09, CLAUDE.md's "extract only on
 * a real second consumer" convention). Each of these two
 * components computes its own container size/viewBox and calls into these
 * shared primitives with its own screen coordinates -- nothing here is
 * component-specific.
 */

// The design's renderVessel() draws the hull as a 4-point path with a
// concave notch cut into the stern (M0,-18s L11s,14s L0,7s L-11s,14s Z,
// s=1.15 for the Hero card), not a plain flat-back triangle -- scaled here
// to Hero's canvas (s * 320/480 = 0.767). Gallery reuses this exact path
// unscaled, matching the design's per-card vessel-hull rendering.
export const HULL_PATH = "M 0,-13.8 L 8.43,10.73 L 0,5.37 L -8.43,10.73 Z";
export const HULL_STROKE = "rgba(250,250,250,0.85)";
export const HULL_STROKE_WIDTH = 1.15;

const HEADING_VECTOR_LENGTH_PX = 70;

export function headingVectorEndpoint(
  screen: { screenX: number; screenY: number },
  headingDegrees: number,
): { x: number; y: number } {
  const headingRadians = headingDegrees * (Math.PI / 180);
  return {
    x: screen.screenX + HEADING_VECTOR_LENGTH_PX * Math.sin(headingRadians),
    y: screen.screenY - HEADING_VECTOR_LENGTH_PX * Math.cos(headingRadians),
  };
}

export function midpoint(
  a: { screenX: number; screenY: number },
  b: { screenX: number; screenY: number },
): { x: number; y: number } {
  return { x: (a.screenX + b.screenX) / 2, y: (a.screenY + b.screenY) / 2 };
}
