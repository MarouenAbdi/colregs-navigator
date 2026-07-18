/**
 * Hero (07-01) -- net-new marketing Hero section (Direction A only, per
 * PROJECT.md's locked v1.1 decision). Plain Server Component (no
 * "use client" -- no state/effects), matching this repo's existing default
 * (src/components/layout/Header.tsx).
 *
 * Renders the locked headline/copy/CTAs (HERO-01). The "Live
 * classification" preview card (HERO-02) is its own component --
 * see HeroPreviewCard.tsx -- so this file stays scoped to marketing
 * layout/copy, with no classification math or chart geometry.
 */
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionGridBackground } from "@/components/shared/SectionGridBackground";
import { ArrowRight, CircleCheck } from "lucide-react";
import { HeroPreviewCard } from "./HeroPreviewCard.js";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background">
      <SectionGridBackground opacity={0.22} glow />
      <div className="relative z-[1] mx-auto grid max-w-[1200px] grid-cols-1 gap-[30px] px-5 pt-8 pb-11 min-[900px]:grid-cols-[1.05fr_0.95fr] min-[900px]:items-center min-[900px]:gap-[52px] min-[900px]:px-6 min-[900px]:pt-10 min-[900px]:pb-[68px]">
        <div>
          <Badge variant="outline" className="mb-6 h-auto w-fit gap-2 px-[11px] py-1 font-mono text-[11px] font-semibold text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
            Collision-avoidance rules engine
          </Badge>

          <h1 className="mb-5 text-[33px] leading-[1.05] font-bold tracking-[-0.03em] min-[640px]:text-[44px] min-[900px]:text-[54px]">
            <span className="text-foreground">Two vessels. One rulebook. </span>
            <span className="text-accent">See who gives way — and why.</span>
          </h1>

          <p className="mb-[30px] max-w-[470px] text-[16.5px] leading-[1.6] text-muted-foreground">
            Drop two ships on a nautical chart. The engine classifies the encounter under the real International Regulations for Preventing Collisions at Sea, names the give-way vessel, and shows the exact rule and geometry behind the verdict.
          </p>

          <div className="mb-8 flex flex-row gap-3">
            <Button asChild size="lg" className="h-10 gap-2 px-[18px] text-sm font-medium">
              <a href="#sandbox">
                Open the sandbox
                <ArrowRight aria-hidden="true" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-10 gap-2 px-[18px] text-sm font-medium">
              <a href="#gallery">Classic encounters</a>
            </Button>
          </div>

          <p className="flex max-w-[470px] items-center gap-[11px] border-t border-border pt-[18px] text-[13px] text-muted-foreground">
            <CircleCheck className="h-4 w-4 text-accent" aria-hidden="true" />
            <span className="text-muted-foreground">Grounded in </span>
            <span className="font-semibold text-foreground">Rules 11–18</span>
            <span className="text-muted-foreground">
              {" "}
              of the actual COLREGS — Steering &amp; Sailing Rules, conduct in sight of one another.
            </span>
          </p>
        </div>

        <div className="w-full">
          <HeroPreviewCard />
        </div>
      </div>
    </section>
  );
}
