/**
 * SectionGridBackground -- decorative nautical-chart-style grid overlay,
 * shared across marketing sections. First real occupant of
 * src/components/shared/ (see README.md): Hero (07-01) and the future
 * Gallery section (Phase 9) both use the exact same repeating-grid pattern
 * from the Claude Design source, differing only in grid-line opacity and
 * Hero's extra radial glow -- a real second consumer, not a speculative one.
 *
 * Grid cadence (47px/48px), opacities (0.22 Hero / 0.18 Gallery), and the
 * glow's shape/position (900x500 ellipse at 74% 18%, teal at 8% alpha) are
 * lifted directly from the design source
 * ("COLREGS Navigator (shadcn).dc.html") to match pixel-for-pixel, not
 * approximated from the static screenshot.
 *
 * Render as the first child of a `relative overflow-hidden` section, with
 * the section's actual content given `relative` positioning (and a
 * z-index) so it paints above this absolutely-positioned overlay.
 */
type SectionGridBackgroundProps = {
  /** Grid line opacity. Design: 0.22 for Hero, 0.18 for Gallery. */
  opacity?: number;
  /** Hero-only decorative teal radial glow behind the grid. */
  glow?: boolean;
};

export function SectionGridBackground({ opacity = 0.18, glow = false }: SectionGridBackgroundProps) {
  const gridLayer = `repeating-linear-gradient(0deg, transparent 0 47px, rgba(63,63,70,${opacity}) 47px 48px), repeating-linear-gradient(90deg, transparent 0 47px, rgba(63,63,70,${opacity}) 47px 48px)`;
  const backgroundImage = glow
    ? `radial-gradient(900px 500px at 74% 18%, rgba(45,212,191,.08), transparent 60%), ${gridLayer}`
    : gridLayer;

  return <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ backgroundImage }} />;
}
