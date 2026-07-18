/**
 * Header (06-01) -- sticky page-shell chrome wired into app/layout.tsx.
 * Plain Server Component (no "use client" -- no state/event handlers),
 * matching this repo's existing default (app/gallery/page.tsx is already
 * an async Server Component with no client directive).
 *
 * Deviation (Rule 1): 06-RESEARCH.md's Discretion note called for a
 * lucide-react `Github` icon on the "Source" link, verified live via
 * WebSearch during research. The installed lucide-react@1.25.0 no longer
 * ships brand/company-logo icons at all (confirmed empty result querying
 * the package's exports for anything git-hub-shaped) -- a real upstream
 * library change research couldn't have caught without installing it.
 * Using `Code2` ("</>") instead: a generic, unambiguous "view source"
 * glyph that doesn't risk looking like an unofficial GitHub brand mark.
 */
import { Compass, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "#sandbox", label: "Sandbox" },
  { href: "#gallery", label: "Gallery" },
] as const;

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-accent" aria-hidden="true" />
          <span className="text-base">
            <span className="font-semibold">COLREGS</span>{" "}
            <span className="font-normal">Navigator</span>
          </span>
          <span className="rounded-full border border-border px-2 py-0.5 text-xs">
            Rules 11-18
          </span>
        </div>
        <div className="flex items-center gap-6">
          <nav className="hidden items-center gap-2 text-sm sm:flex">
            {NAV_LINKS.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="rounded-sm transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
              <Code2 className="h-4 w-4" aria-hidden="true" />
              Source
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
