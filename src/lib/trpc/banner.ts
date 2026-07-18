/**
 * buildScenarioBanner -- pure helper deriving the banner label/rationale
 * shown by SandboxContainer (05-03's `banner` prop) from a fetched
 * ScenarioRow's `isCurated`/`rationale` fields (D-02).
 *
 * Curated rows with a rationale get the gallery-specific label + rationale
 * text; every other combination (plain saved scenario, or a curated row
 * that's somehow missing its rationale) falls back to the generic
 * "Viewing saved scenario" label with no `rationale` key.
 *
 * Framework-free by design -- no react/next/prisma imports -- so it stays
 * usable from both Server Components (app/s/[shareId]/page.tsx) and any
 * future client-side consumer with zero coupling to either.
 */

export function buildScenarioBanner(row: {
  isCurated: boolean;
  rationale: string | null;
}): { label: string; rationale?: string } {
  if (row.isCurated && row.rationale) {
    return { label: "Gallery example", rationale: row.rationale };
  }
  return { label: "Viewing saved scenario — drag to explore" };
}
