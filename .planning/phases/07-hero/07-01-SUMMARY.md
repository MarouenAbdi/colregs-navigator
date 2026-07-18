---
phase: 07-hero
plan: 01
subsystem: ui
tags: [nextjs, react, tailwind, shadcn, svg, colregs-domain]

requires:
  - phase: 06-scaffolding
    provides: shadcn/ui install (radix-nova preset), dark-only design tokens, Header/Footer page shell, Button primitive
provides:
  - Net-new Hero section (headline/copy/CTAs/trust-note) rendered above the Sandbox on the home page
  - Static, illustrative "Live classification" preview card driven by a real classifyEncounter()/bearing()/cpa() call against a fixed fixture
  - Real #sandbox anchor target wrapping SandboxContainer in app/page.tsx
  - Reduced-motion-guarded scroll-behavior:smooth for same-page CTA anchor scrolling
  - shadcn card/badge primitives (CLI-vendored)
affects: [08-sandbox, 09-gallery]

tech-stack:
  added: []
  patterns:
    - "Illustrative/decorative UI surfaces call real domain functions (classifyEncounter/bearing/cpa) against a fixed, documented fixture instead of hand-typing displayed numbers"
    - "hero/ components import ui/* via the @/ alias and domain/* via relative .js-suffixed paths, matching Header.tsx's established split"
    - "Custom Tailwind v4 breakpoints use the zero-risk min-[900px]:/max-[899px]: arbitrary-value syntax by default, avoiding an unverified --breakpoint-* theme token"

key-files:
  created:
    - src/components/hero/hero-preview-fixture.ts
    - src/components/hero/hero-preview-fixture.test.ts
    - src/components/hero/Hero.tsx
    - src/components/hero/Hero.test.tsx
    - src/components/ui/card.tsx
    - src/components/ui/badge.tsx
  modified:
    - app/page.tsx
    - app/globals.css
    - vitest.config.ts

key-decisions:
  - "Used the zero-risk min-[900px]:/max-[899px]: arbitrary-value breakpoint syntax throughout Hero.tsx instead of registering a --breakpoint-hero theme token, since the arbitrary-value form is already Tailwind v4-verified and confirmed compiling to real CSS in the production build (satisfies UI-SPEC's OR-clause acceptance criterion with less indirection)."
  - "Added a Vitest resolve.alias for @/* pointing at ./src, since tsconfig's existing @/* path alias (added Phase 6 for shadcn-adjacent imports) had no Vitest-side equivalent and Header.tsx's prior use of the alias was never exercised by a test file."

patterns-established:
  - "Illustrative/preview UI (no live user data) still calls the real domain layer against a fixed fixture, with a fixture-drift guard test asserting the exact displayed numbers"

requirements-completed: [HERO-01, HERO-02, HERO-03, HERO-04]

duration: 55min
completed: 2026-07-18
---

# Phase 7 Plan 1: Hero Section Implementation Summary

**Net-new Hero section (headline/CTAs/trust-note) above the Sandbox, with a fully static SVG "Live classification" preview card whose RANGE/BEARING/CPA/Rule-15/verdict numbers are computed by a real `classifyEncounter()`/`bearing()`/`cpa()` call against a fixed, verified fixture.**

## Performance

- **Duration:** 55 min
- **Started:** 2026-07-18T16:22:23Z (approx, first task-relevant tool call)
- **Completed:** 2026-07-18T17:17:19Z
- **Tasks:** 3
- **Files modified:** 9 (6 created, 3 modified)

## Accomplishments
- Built `Hero.tsx`, a plain Server Component rendering the exact locked headline/copy/CTAs/trust-note from `Main-Design.png`, plus a hand-built, independent static SVG mini-chart (two range rings, shaded bearing sector with radial gradient, north reference line -- all centered on a fixed `HERO_CHART_CENTER`, not vessel A's own screen position; dashed heading-vector lines; a solid distance-labeled A→B connector) that shares zero code with the real interactive `ChartPanel.tsx`.
- Verified `heroPreviewVesselA`/`heroPreviewVesselB` fixture reproduces Rule 15 crossing / Vessel A gives way / RANGE 2.99 NM / BEARING 061deg / CPA 1.18 NM via a real domain-layer call, guarded by a drift-detection test.
- Wired `<Hero />` and a real `#sandbox` anchor target into `app/page.tsx`, leaving `SandboxContainer.tsx` itself untouched (Pitfall H1), plus reduced-motion-guarded `scroll-behavior: smooth` in `app/globals.css`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Install shadcn primitives and build the verified preview-card fixture** - `6e244e8` (feat)
2. **Task 2: Build Hero.tsx (headline/copy/CTAs + static SVG preview card)** - `ae6e7bc` (feat)
3. **Task 3: Wire Hero and the #sandbox anchor into the home page; add smooth-scroll and the 900px breakpoint token** - `d6a60cc` (feat)

_No TDD tasks this plan -- all three tasks are `type="auto"`, non-TDD._

## Files Created/Modified
- `src/components/ui/card.tsx` - shadcn Card/CardHeader/CardContent/CardFooter/CardTitle/CardAction/CardDescription primitives (CLI-vendored, official registry)
- `src/components/ui/badge.tsx` - shadcn Badge/badgeVariants primitive (CLI-vendored, official registry)
- `src/components/hero/hero-preview-fixture.ts` - Fixed `heroPreviewVesselA`/`heroPreviewVesselB` Vessel fixture reproducing the design mock's exact displayed numbers
- `src/components/hero/hero-preview-fixture.test.ts` - Fixture-drift guard (HERO-02) asserting `classifyEncounter()`/`bearing()`/`cpa()` still reproduce Rule 15/crossing/vesselA-gives-way + 2.99nm/061deg/1.18nm
- `src/components/hero/Hero.tsx` - Plain Server Component: headline/copy/CTAs/trust-note + hand-built static SVG preview card
- `src/components/hero/Hero.test.tsx` - RTL test covering HERO-01 headline render and HERO-03 CTA href values
- `app/page.tsx` - Home page composing `<Hero />` above a new `<section id="sandbox">` wrapper around `SandboxContainer`
- `app/globals.css` - Adds reduced-motion-guarded `scroll-behavior: smooth` (D-05) alongside the existing `scroll-padding-top: 64px`
- `vitest.config.ts` - Adds a `resolve.alias` for `@/*` -> `./src` so `@/components/ui/*` imports resolve under Vitest (see Deviations)

## Decisions Made
- Skipped registering a `--breakpoint-hero: 900px` Tailwind theme token; used `min-[900px]:` arbitrary-value classes directly in `Hero.tsx` instead, confirmed compiling to real CSS in the production build output (`.next/static/css/*.css` contains a `900px` media query). Satisfies 07-UI-SPEC.md's OR-clause acceptance criterion ("neither is present and Hero.tsx uses only min-[900px]:/max-[899px]: arbitrary-value classes") with one less moving part than the named-token path.
- Kept the domain-locked hull/pill colors (`#EF4444`, `#22C55E`) hardcoded per UI-SPEC's explicit contract, while deriving "GW"/"SO" pill *text* from `classification.giveWay`/`classification.standOn` (never a hand-typed literal), matching `ReasoningPanel.tsx`'s established pattern.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added `resolve.alias` for `@/*` to `vitest.config.ts`**
- **Found during:** Task 2 (Hero.tsx RTL test)
- **Issue:** `tsconfig.json`'s `@/*` path alias (added Phase 6 for shadcn-adjacent imports, already used by `Header.tsx`) has no Vitest-side equivalent -- Vite/Vitest do not read `tsconfig.json`'s `paths` automatically. `Header.tsx` has no test file, so this gap was never exercised until `Hero.test.tsx` tried to render a component importing `@/components/ui/button`/`card`/`badge`, failing with "Failed to resolve import".
- **Fix:** Added `resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } }` to `vitest.config.ts`.
- **Files modified:** `vitest.config.ts`
- **Verification:** `npx vitest run src/components/hero` passes; `npx tsc --noEmit` and `npm run build` both already resolved the alias correctly and remain green.
- **Committed in:** `ae6e7bc` (Task 2 commit)

**2. [Rule 3 - Blocking, environment-only] Generated Prisma client and local `.env` missing in fresh worktree**
- **Found during:** Task 2/3 verification (`npx tsc --noEmit`, `npm run build`, `npx vitest run`)
- **Issue:** This git worktree was freshly created with no `node_modules`, no generated Prisma client (`generated/prisma`, gitignored build artifact), and no `.env` file (gitignored). `tsc --noEmit` failed on a missing Prisma-generated module; `npm run build`/full-suite `vitest run` failed against DB-dependent code because a default/example `DATABASE_URL` pointed at the wrong Postgres port (`.env.example`'s documented `5432`, while this project's actual running Docker Postgres container is mapped to host port `5433`).
- **Fix:** Ran `npm install`, `npx prisma generate`, and copied the main checkout's local `.env` (correct port `5433`) into the worktree. No source file changed -- purely local environment setup, mirroring what already exists in the primary checkout.
- **Files modified:** none tracked (both `generated/prisma/` and `.env` are gitignored)
- **Verification:** `npx tsc --noEmit` (0 errors), `npm run build` (exits 0, all 4 routes including `/gallery`'s DB-backed static prerender), `npx vitest run` (163/163 passed)
- **Committed in:** n/a (no tracked files changed)

---

**Total deviations:** 2 auto-fixed (1 blocking code fix, 1 blocking environment-only fix)
**Impact on plan:** Both fixes were necessary to complete verification in this worktree; neither expands scope beyond what Phase 7's plan already required. No scope creep.

## Issues Encountered
- Initial `npx vitest run` (full suite, before the `.env`/Prisma fix above) showed 13 unrelated DB-dependent test failures in Phase 3/5 files (`scenario-repository.test.ts`, `scenario.test.ts`, `scenario-service.test.ts`). Investigated and resolved as a local environment gap (see Deviation 2 above), not a real defect -- corrected the phase's `deferred-items.md` note accordingly once the root cause was confirmed. Full suite now passes 163/163.

## User Setup Required

None - no external service configuration required. (The `.env`/Prisma-generate step above is a one-time local dev-environment setup already documented in the project's existing README/setup guide, not a new requirement introduced by this plan.)

## Next Phase Readiness

- Hero's automated verification is complete (`npx vitest run src/components/hero`, `npx tsc --noEmit`, `npm run build` all exit 0); manual visual/responsive/scroll verification against `Main-Design.png` is explicitly deferred to Plan 07-02's checkpoint per this plan's own `<verification>` section (Split Signals).
- `app/page.tsx` now renders `<Hero />` above a real `#sandbox` anchor wrapping `SandboxContainer` unmodified -- Phase 8 (Sandbox restyle) can proceed against this same wrapper without any Hero-side rework.
- No blockers for Plan 07-02 or Phase 8.

## Self-Check: PASSED

All 9 created/modified files verified present on disk; all 3 task commits
(`6e244e8`, `ae6e7bc`, `d6a60cc`) plus the SUMMARY commit (`db9cfc0`)
verified present in `git log --oneline --all`.

---
*Phase: 07-hero*
*Completed: 2026-07-18*
