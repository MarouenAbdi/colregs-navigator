/**
 * Gallery section container (GAL-01/GAL-02/GAL-04): an async Server
 * Component that fetches curated scenarios via the real tRPC caller (no
 * client-side fetch, no "use client") and composes them into the responsive
 * card grid. Reuses SandboxContainer.tsx's exact section-container className
 * convention, per 09-UI-SPEC.md's Layout section.
 */

import { getCaller } from "../../lib/trpc/server.js";
import { rowToVessels } from "../../server/application/scenario-service.js";
import { SectionGridBackground } from "@/components/shared/SectionGridBackground";
import { GalleryCard } from "./GalleryCard.js";

export async function GalleryContainer() {
  const scenarios = await getCaller().gallery.list();

  return (
    <section className="relative overflow-hidden bg-background">
      <SectionGridBackground opacity={0.18} />
      <div className="
        relative z-1 mx-auto max-w-300 px-5 py-12
        min-[900px]:px-6 min-[900px]:py-16
      ">
        <div className="
          mb-8 flex flex-col items-center gap-3 text-center
          min-[900px]:mb-12
        ">
          <span className="font-mono text-[13px] font-semibold text-accent">Curated scenarios</span>
          <h2 className="
            text-center text-[36px] leading-[1.15] font-bold text-foreground
          ">
            Classic encounters, one click away
          </h2>
          <p className="max-w-125 text-base font-semibold text-muted-foreground">
            Textbook COLREGS geometries. Load any into the sandbox and drag from there.
          </p>
        </div>

        {scenarios.length === 0 ? (
          <p className="text-center text-muted-foreground">No curated scenarios yet — run the seed script.</p>
        ) : (
          <div className="
            grid grid-cols-1 gap-4
            min-[640px]:grid-cols-2
            min-[900px]:grid-cols-3
          ">
            {scenarios.map((row) => {
              const { vesselA, vesselB } = rowToVessels(row);
              return (
                <GalleryCard
                  key={row.id}
                  id={row.id}
                  title={row.title ?? ""}
                  ruleLabel={row.ruleLabel ?? ""}
                  description={row.rationale ?? ""}
                  vesselA={vesselA}
                  vesselB={vesselB}
                  classification={row.verdict}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
