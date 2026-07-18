/**
 * Header -- sticky page-shell chrome wired into app/layout.tsx.
 * Plain Server Component (no "use client" -- no state/event handlers),
 * matching this repo's existing default (app/gallery/page.tsx is already
 * an async Server Component with no client directive).
 *
 * The compass mark and the "Source" link's GitHub glyph are both exact,
 * literal reproductions of the SVG paths hardcoded in the Claude Design
 * source (`COLREGS Navigator (shadcn).dc.html`) rather than library icons --
 * the design bakes in a bespoke two-tone compass rose and the raw GitHub
 * octocat path, neither of which lucide-react ships as a drop-in match.
 */
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "#sandbox", label: "Sandbox" },
  { href: "#gallery", label: "Gallery" },
] as const;

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-6">
        <a href="#top" className="flex items-center gap-2.75 text-foreground">
          <svg
            width="26"
            height="26"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="rgba(45,212,191,.5)"
              strokeWidth="2.5"
            />
            <circle cx="50" cy="50" r="37" fill="none" stroke="#3F3F46" strokeWidth="1.5" />
            <g stroke="#52525B" strokeWidth="1.6">
              <line x1="50" y1="4" x2="50" y2="14" />
              <line x1="50" y1="86" x2="50" y2="96" />
              <line x1="4" y1="50" x2="14" y2="50" />
              <line x1="86" y1="50" x2="96" y2="50" />
            </g>
            <path d="M50 12 L58 50 L50 58 L42 50 Z" fill="#2dd4bf" />
            <path d="M50 88 L42 50 L50 42 L58 50 Z" fill="#52525B" />
            <circle cx="50" cy="50" r="3.5" fill="#09090B" stroke="#2dd4bf" strokeWidth="1.5" />
          </svg>
          <span className="text-[15px] font-semibold tracking-[-0.01em]">
            COLREGS <span className="text-accent">Navigator</span>
          </span>
          <span className="rounded-md border border-border px-1.75 py-0.5 font-mono text-[10.5px] text-muted-foreground">
            Rules 11–18
          </span>
        </a>
        <div className="flex items-center gap-1.5">
          <nav className="hidden items-center gap-1.5 sm:flex">
            {NAV_LINKS.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="rounded-md px-2.75 py-1.75 text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {label}
              </a>
            ))}
          </nav>
          <Button asChild variant="outline" size="sm">
            <a
              href="https://github.com/MarouenAbdi/colregs-navigator"
              target="_blank"
              rel="noreferrer"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38v-1.34c-2.23.48-2.7-1.07-2.7-1.07-.36-.93-.89-1.18-.89-1.18-.73-.5.05-.49.05-.49.8.06 1.23.83 1.23.83.72 1.23 1.87.87 2.33.67.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.83-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.52.56.83 1.28.83 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.19c0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
              </svg>
              Source
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
