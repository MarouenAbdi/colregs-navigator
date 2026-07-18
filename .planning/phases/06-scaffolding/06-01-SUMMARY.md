---
phase: 06-scaffolding
plan: 01
subsystem: ui
tags: [shadcn, radix-ui, tailwind-v4, next-font, geist, dark-theme, lucide-react]

# Dependency graph
requires: []
provides:
  - shadcn/ui installed (Radix base, `nova` preset) with `@/*` alias resolving to `./src/*`
  - Single locked dark-only design-token palette in `app/globals.css` (`#09090B`/`#FAFAFA`/`#2dd4bf` + zinc-900/zinc-800 surfaces/borders)
  - Geist + Geist Mono fonts loaded app-wide via `next/font/google`
  - Sticky `Header` + `Footer` Server Components wired into `app/layout.tsx`, wrapping every route
  - `src/components/shared/` structural placeholder (SCAF-06)
affects: [07-hero, 08-sandbox, 09-gallery]

# Tech tracking
tech-stack:
  added: [shadcn (CLI, devDep), radix-ui, class-variance-authority, clsx, tailwind-merge, lucide-react, tw-animate-css]
  patterns:
    - "@/* path alias scoped to shadcn-adjacent code only; existing relative .js-suffixed imports stay untouched"
    - "Dark-only hardcoded <html className=\"dark\">, no theme-switcher package, :root/.dark blocks kept identical (defense-in-depth)"
    - "Server Components by default for static chrome (Header/Footer), no \"use client\" unless interactive"

key-files:
  created:
    - components.json
    - src/lib/utils.ts
    - src/components/ui/button.tsx
    - src/components/layout/Header.tsx
    - src/components/layout/Footer.tsx
    - src/components/shared/README.md
  modified:
    - app/globals.css
    - app/layout.tsx
    - tsconfig.json
    - next.config.ts
    - package.json
    - package-lock.json

key-decisions:
  - "Substituted lucide-react's Code2 icon for the Source link instead of Github -- the installed lucide-react@1.25.0 no longer ships any brand/company-logo icons"
  - "Added an explicit webpack resolve.alias for @/* in next.config.ts (mirroring the existing .js extensionAlias fix) because typescript@7.0.2/tsgo removed baseUrl, which Next's webpack build otherwise needs to auto-derive the same alias"
  - "tsconfig.json's @/* alias uses paths only (no baseUrl) -- tsgo hard-errors if baseUrl is present"

patterns-established:
  - "Pattern: any future path-alias addition must also add a matching next.config.ts webpack resolve.alias entry, since tsconfig-only aliases silently fail in next build --webpack under typescript@7.0.2"

requirements-completed: [SCAF-01, SCAF-02, SCAF-03, SCAF-04, SCAF-05, SCAF-06]

duration: ~45min
completed: 2026-07-18
---

# Phase 6 Plan 1: Scaffolding Summary

**shadcn/ui installed (Radix base) with a single locked dark-token palette, Geist/Geist Mono fonts, and a sticky Header/Footer page shell wired into `app/layout.tsx` for every route.**

## Performance

- **Duration:** ~45 min
- **Tasks:** 3 completed
- **Files modified:** 12 (6 created, 6 modified) across the 3 task commits, plus 1 prep commit (planning docs) and 1 tsconfig fix folded into Task 1

## Accomplishments
- shadcn/ui CLI initialized with `--base radix --preset nova`; `components.json` aliases correctly resolve to this repo's hybrid `app/`-at-root + `src/components`/`src/lib` layout
- Collapsed the CLI's generated `:root`/`.dark` OKLCH dual palette to one locked dark palette using UI-SPEC.md's literal hex values, with `scroll-padding-top: 64px` (D-06) and no theme-switcher machinery
- Geist + Geist Mono loaded app-wide via `next/font/google`, correctly named `--font-geist-sans`/`--font-geist-mono` to match the CSS `@theme inline` mapping
- Sticky `Header` (logo/wordmark/chip, Sandbox/Gallery anchors hidden below 640px, external Source link with `rel="noreferrer"`) and `Footer` (locked brand/disclaimer copy) built as Server Components and wired into `app/layout.tsx`
- `src/components/shared/README.md` added as SCAF-06's structural placeholder

## Task Commits

Each task was committed atomically:

0. **Prep: bring in phase 6 planning docs missing from worktree base** - `24b2112` (docs)
1. **Task 1: Run shadcn init and collapse the theme scaffold to one locked dark palette** - `51b8cf7` (feat)
2. **Task 2: Add Button primitive and build Header/Footer components** - `0b90d27` (feat)
3. **Task 3: Wire the dark-only page shell into app/layout.tsx** - `74826a5` (feat)

## Files Created/Modified
- `components.json` - shadcn CLI config; aliases `@/components`, `@/components/ui`, `@/lib`, `@/lib/utils`; CSS path `app/globals.css`
- `app/globals.css` - collapsed single dark palette (`#09090B`/`#FAFAFA`/`#2dd4bf`/zinc-900/zinc-800), `scroll-padding-top: 64px`, `--font-sans`/`--font-mono` wired to Geist variables
- `tsconfig.json` - added `@/*` -> `./src/*` path alias (no `baseUrl` — removed by tsgo)
- `next.config.ts` - added webpack `resolve.alias` for `@` -> `./src` (Next's webpack build needs this explicitly since tsgo removed `baseUrl`)
- `package.json` / `package-lock.json` - `radix-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react` (deps); `shadcn`, `tw-animate-css` (devDeps)
- `src/lib/utils.ts` - shadcn's `cn()` classname-merge helper
- `src/components/ui/button.tsx` - shadcn Button primitive (CLI-generated)
- `src/components/layout/Header.tsx` - sticky Header Server Component
- `src/components/layout/Footer.tsx` - Footer Server Component
- `src/components/shared/README.md` - SCAF-06 structural placeholder
- `app/layout.tsx` - hardcoded `dark` class, Geist/Geist Mono wiring, Header/Footer composition around the existing `TRPCReactProvider`

## Decisions Made
- Icon substitution: `Code2` instead of `Github` for the Source link (see Deviations below)
- `next.config.ts` webpack alias addition to bridge the tsc-vs-webpack alias-resolution gap introduced by typescript@7.0.2/tsgo removing `baseUrl`
- Kept `cn()` (shadcn's classname helper, already imported by the CLI's font-wiring) instead of the plan's illustrative template-literal `className` string for `<html>` — functionally equivalent, more consistent with the rest of the new shadcn-adjacent code

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Worktree base commit predated the phase 6 planning session**
- **Found during:** Pre-Task 1 setup
- **Issue:** This worktree's base commit (`8b0ca444...`) predates the commits that created `.planning/phases/06-scaffolding/06-01-PLAN.md` and its referenced context files — those planning commits landed on `frontend-implementation/phase-5-scaffolding` instead. `.planning/phases/` did not exist in this worktree at all.
- **Fix:** Read-only `git checkout <branch> -- <paths>` of the 7 planning docs (PLAN, CONTEXT, RESEARCH, PATTERNS, UI-SPEC, DISCUSSION-LOG, 06-02-PLAN) from that branch into this worktree; committed them as a prep commit before starting Task 1 execution.
- **Files modified:** `.planning/phases/06-scaffolding/*.md` (7 files)
- **Committed in:** `24b2112`

**2. [Rule 3 - Blocking] shadcn CLI refused to run without a pre-existing path alias**
- **Found during:** Task 1
- **Issue:** `npx shadcn@latest init` failed at "Validating import alias" — the CLI requires a `@/*`-style alias to already exist in `tsconfig.json` before it will proceed, but this repo had none yet.
- **Fix:** Added `"paths": { "@/*": ["./src/*"] }` to `tsconfig.json` manually first, then re-ran `init` successfully.
- **Files modified:** `tsconfig.json`
- **Committed in:** `51b8cf7`

**3. [Rule 3 - Blocking] typescript@7.0.2 (tsgo) has removed the `baseUrl` compiler option**
- **Found during:** Task 1
- **Issue:** `npx tsc --noEmit` failed with `error TS5102: Option 'baseUrl' has been removed`. The standard shadcn/Next.js manual-alias pattern (and 06-RESEARCH.md's own Code Example) specifies `"baseUrl": "."` alongside `"paths"`.
- **Fix:** Removed `baseUrl`, kept `paths` only (already relative, resolves correctly without it under tsgo).
- **Files modified:** `tsconfig.json`
- **Committed in:** `51b8cf7`

**4. [Rule 3 - Blocking] shadcn CLI's internal `npm install` step failed with `spawn npm EAGAIN`**
- **Found during:** Task 1
- **Issue:** `npx shadcn@latest init` failed during "Installing dependencies" with `Command failed with EAGAIN: npm install -- clsx tailwind-merge shadcn@latest class-variance-authority tw-animate-css radix-ui lucide-react` / `spawn npm EAGAIN` — a process-spawn resource-exhaustion error under this environment's concurrent-worktree load (confirmed by a subsequent `fork failed: resource temporarily unavailable` on a bare retry).
- **Fix:** Installed the exact same 7 packages directly via `npm install`/`npm install --save-dev` (matching 06-RESEARCH.md's Package Legitimacy Audit table exactly — no substitutions), then re-ran `shadcn init`, which detected the dependencies already present and only wrote config/CSS files (confirmed via the CLI's own `✔ Installing dependencies` step completing instantly on retry).
- **Files modified:** `package.json`, `package-lock.json`
- **Committed in:** `51b8cf7`

**5. [Rule 1 - Bug] lucide-react no longer exports a `Github` icon**
- **Found during:** Task 2
- **Issue:** 06-RESEARCH.md's Discretion note called for `lucide-react`'s `Github` icon on the Source button (WebSearch-verified against lucide.dev during research). The actually-installed `lucide-react@1.25.0` exports zero brand/company-logo icons at all (`Object.keys(require('lucide-react')).filter(k => /github/i.test(k))` returns `[]`) — a real upstream package change between the research session and this execution.
- **Fix:** Substituted `Code2` (a generic "view source"/code-brackets glyph) — avoids rendering an icon that could be mistaken for an unofficial GitHub brand mark.
- **Files modified:** `src/components/layout/Header.tsx`
- **Committed in:** `0b90d27`

**6. [Rule 3 - Blocking] `next build --webpack` couldn't resolve the `@/*` alias despite `tsc` resolving it correctly**
- **Found during:** Task 3
- **Issue:** After wiring `Header`/`Footer` imports into `app/layout.tsx`, `npm run build` failed with `Module not found: Can't resolve '@/lib/utils'` (and the two layout imports) even though `npx tsc --noEmit` passed. Next's webpack build derives its own alias from `tsconfig.json`'s `baseUrl`, which deviation #3 above had to remove for `tsc` to work — the two tools' requirements are mutually exclusive via `tsconfig.json` alone.
- **Fix:** Added an explicit `config.resolve.alias["@"] = path.join(import.meta.dirname, "src")` in `next.config.ts`'s existing `webpack()` callback, mirroring the pattern already used there for the `.js`-suffix `extensionAlias` fix.
- **Files modified:** `next.config.ts`
- **Committed in:** `74826a5`

**7. [Rule 3 - Blocking] Fresh worktree had no generated Prisma client / no `.env` / DB port mismatch, blocking `npm run build`'s `/gallery` prerender**
- **Found during:** Task 3 (build verification)
- **Issue:** `npx tsc --noEmit` initially failed on `Cannot find module '../../../generated/prisma/client.js'` (Prisma client never generated in this fresh worktree checkout); `npm run build` then failed prerendering `/gallery` with a DB auth error because `.env` (copied from `.env.example`) pointed at port 5432, which in this environment is occupied by an unrelated project's Postgres container — this repo's own `colregs-navigator-postgres-1` container is mapped to 5433.
- **Fix:** Copied `.env.example` to `.env` (gitignored, not committed), ran `npx prisma generate`, and corrected the port to `5433` to match the actually-running container.
- **Files modified:** none committed (`.env` is gitignored, local-only)
- **Committed in:** N/A (local environment setup only)

---

**Total deviations:** 7 auto-fixed (6 Rule 3 - blocking, 1 Rule 1 - bug)
**Impact on plan:** All fixes were necessary to get the exact deliverables the plan specified working in this environment (a genuinely fresh worktree with a newer typescript/tsgo release and a changed lucide-react release than what research observed). No scope creep — no architectural changes, no unrequested features.

## Issues Encountered
See Deviations above — all resolved inline, no open blockers.

## User Setup Required
None - no external service configuration required. (Local Postgres container already running in this dev environment; `.env` is a local, gitignored file not part of any commit.)

## Next Phase Readiness
- Phases 7-9 (Hero, Sandbox, Gallery) can now build on: the `@/*` alias (tsconfig **and** next.config.ts webpack alias — future phases must remember both), the collapsed dark token palette, `Button` primitive, and the Header/Footer page shell.
- No blockers. One environment note for future phases: if a new path alias or shadcn primitive is added, re-verify `next build --webpack` (not just `tsc --noEmit`) since typescript@7.0.2/tsgo's removal of `baseUrl` means tsconfig-only alias additions will silently fail webpack resolution until mirrored in `next.config.ts`.
- Manual visual verification (dark render vs. light OS/browser preference, nav collapse at 640px, font application) is intentionally deferred to Plan 06-02's checkpoint per this plan's `<verification>` section — not yet performed.

## Self-Check: PASSED

All 11 claimed files verified present on disk; all 5 claimed commit hashes verified present in git log.

---
*Phase: 06-scaffolding*
*Completed: 2026-07-18*
