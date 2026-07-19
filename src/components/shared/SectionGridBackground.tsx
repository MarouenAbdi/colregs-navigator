import type { CSSProperties } from "react";

/**
 * SectionGridBackground -- decorative nautical-chart-style grid overlay,
 * shared across marketing sections. First real occupant of
 * src/components/shared/ (see README.md): Hero (07-01) and the future
 * Gallery section (Phase 9) both use the exact same repeating-grid pattern
 * from the Claude Design source, differing only in grid-line opacity and
 * Hero's extra radial glow -- a real second consumer, not a speculative one.
 *
 * The gradient definitions themselves (cadence, colors, glow shape) live in
 * `.section-grid-overlay`/`.section-grid-overlay--glow` in app/globals.css,
 * not here -- this component only selects the modifier class and sets the
 * one value (opacity) that legitimately varies per call site, keeping the
 * actual CSS out of the component file.
 */
type SectionGridBackgroundProps = {
  /** Grid line opacity. Design: 0.22 for Hero, 0.18 for Gallery. */
  opacity?: number;
  /** Hero-only decorative teal radial glow behind the grid. */
  glow?: boolean;
};

export function SectionGridBackground({ opacity = 0.18, glow = false }: SectionGridBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className={glow ? "section-grid-overlay section-grid-overlay--glow" : `
        section-grid-overlay
      `}
      style={{ "--grid-opacity": opacity } as CSSProperties}
    />
  );
}
