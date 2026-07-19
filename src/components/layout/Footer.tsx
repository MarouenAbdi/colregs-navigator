/**
 * Footer (06-01) -- static page-shell chrome wired into app/layout.tsx.
 * Plain Server Component (no "use client"). Copy is locked verbatim by
 * 06-UI-SPEC.md's Copywriting Contract -- do not paraphrase.
 */
export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="
        mx-auto flex flex-col gap-4 px-6 py-4 text-xs text-muted-foreground
        md:flex-row md:items-center md:justify-between
      ">
        <span>COLREGS Navigator · classification maps to Rules 11-18</span>
        <span>
          Educational reference only — not a substitute for a qualified
          watchkeeper or official publications. Not for navigation.
        </span>
      </div>
    </footer>
  );
}
