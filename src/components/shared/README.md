# src/components/shared

Created empty by Phase 6 (Scaffolding), satisfying SCAF-06's "shared
cross-feature location" requirement. Per 06-RESEARCH.md's "don't
pre-abstract" guidance, components only move here once a real second
consumer appears -- nothing is placed speculatively.

## Components

- **`SectionGridBackground`** (Phase 7) -- the decorative repeating-grid
  overlay (with an optional teal radial glow) behind marketing sections.
  Used by Hero (07-01); Gallery (Phase 9) is the design's other confirmed
  consumer of the same pattern, which is why this was extracted here
  rather than left inline in `hero/`.
