---
phase: 05-save-share-gallery
plan: 05
subsystem: ui
tags: [nextjs, trpc, prisma, webpack, turbopack, share-page]

requires:
  - phase: 05-save-share-gallery (05-01)
    provides: getCaller() server-side tRPC caller
  - phase: 05-save-share-gallery (05-03)
    provides: SandboxContainer initialScenario/banner prop contract
affects: [any future phase adding a new next/* subpath import or a new route]

tech-stack:
  added: []
  patterns:
    - "buildScenarioBanner(row) pure helper deriving UI copy from isCurated/rationale"
    - "app/s/[shareId]/page.tsx: async Server Component, notFound() on TRPCError NOT_FOUND, key={shareId} forces remount across client-side share-page navigation"
    - "next.config.ts webpack() customizer sets resolve.extensionAlias so the codebase's .js-suffix-pointing-at-.ts import convention resolves under Next's bundler, not just tsc/Vitest"

key-files:
  created:
    - src/lib/trpc/banner.ts
    - src/lib/trpc/banner.test.ts
    - app/s/[shareId]/page.tsx
    - src/components/sandbox/CopyLinkButton.tsx
  modified:
    - next.config.ts
    - package.json

key-decisions:
  - "Kept the human-verify checkpoint as an actual live-browser walkthrough, not just tsc/test-suite passing -- this is what surfaced two real bugs (dev-server module resolution, and a stopped/conflicting Postgres container) that 151-160 passing unit/integration tests never would have caught."
  - "User chose webpack + resolve.extensionAlias over rewriting all 98 .js-suffixed relative imports project-wide, to fix Next's inability to resolve the codebase's established .js-import-pointing-at-.ts convention. Smaller blast radius (2 files) vs. correctness-purist option (37 files, all phases) -- explicit user tradeoff, not a unilateral call."
  - "Gallery-on-its-own-page-vs-embedded-on-home-page is a real product design change the user raised during manual verification (want gallery folded into the home page below the sandbox instead of a separate /gallery route). User explicitly deferred this to a later, separate follow-up -- current /gallery route (05-04) stays as built for this phase's completion."

patterns-established:
  - "Any future page needing another next/* subpath (next/image, etc.) is covered by the same tsconfig bundler moduleResolution (05-03) + webpack extensionAlias (this plan) fixes -- no further per-file shims needed."

requirements-completed: [SCEN-01]

duration: ~90min (2 executor sessions + orchestrator-led dev-server debugging and live verification)
completed: 2026-07-18
---

# Phase 05, Plan 05: Share/Gallery-Detail Page + End-to-End Verification Summary

**Built the `/s/[shareId]` page that serves both plain shared links and gallery entries, discovered and fixed a codebase-wide dev-server module-resolution bug that had silently blocked `npm run dev` since Phase 1, and confirmed the full save → share → gallery loop works via live human verification.**

## Performance

- **Tasks:** 3/3 complete (Task 1, Task 2 auto; Task 3 human-verify checkpoint)
- **Files created:** 4
- **Files modified:** 2 (post-checkpoint fix)

## Accomplishments
- `buildScenarioBanner` pure helper + `/s/[shareId]` Server Component + `CopyLinkButton`, all matching the plan's contracts exactly (3/3 unit tests, `tsc --noEmit` clean, 160/160 full suite passing at merge).
- Found and fixed a real, previously-undiscovered bug: neither Turbopack nor Next's default webpack resolves this codebase's `.js`-suffix-pointing-at-`.ts` import convention (established Phase 1, ~98 imports / 37 files) — `npm run dev`/`next build` failed on the very first cross-file import. No prior phase had actually run the dev server end-to-end; tsc and Vitest both resolve this convention fine, which is why it went unnoticed through 4 completed phases and 160 passing tests.
- Diagnosed and resolved a second, environmental issue found during manual verification: the shared dev Postgres container had exited and an unrelated container from a different project was briefly contending for port 5432, causing `ECONNREFUSED` on both the Save button and the gallery/share pages. Brought up this project's own `docker compose` stack, re-applied migrations, reseeded the 6 curated scenarios.
- User manually confirmed the full save → share → gallery → detail loop works end-to-end in a live browser session.

## Task Commits

1. **Task 1: buildScenarioBanner** — `f51df91` (feat) — pure function, 3/3 cases covered
2. **Task 2: /s/[shareId] page + CopyLinkButton** — `83afdaf` (feat)
3. **Task 3: End-to-end human verification** — no code commit (verification-only); triggered the fix below

**Post-checkpoint fix (Rule 3, blocking):** `7beb689` (fix) — `next.config.ts` webpack `resolve.extensionAlias` + `package.json` `dev`/`build` scripts switched to `--webpack`.

_Note: the Postgres container/seed issue required no code change — operational recovery only (`docker compose up -d`, `prisma migrate deploy`, `prisma db seed`), not part of any commit._

## Files Created/Modified
- `src/lib/trpc/banner.ts` — `buildScenarioBanner(row)`, pure, no react/next/prisma imports
- `src/lib/trpc/banner.test.ts` — 3 cases (curated+rationale, curated+null rationale, non-curated)
- `app/s/[shareId]/page.tsx` — async Server Component; awaits Next 16's `params` Promise; `notFound()` only on `TRPCError`+`NOT_FOUND`; reuses `rowToVessels`/`buildScenarioBanner`; `key={shareId}` forces remount across share-page-to-share-page navigation
- `src/components/sandbox/CopyLinkButton.tsx` — `"use client"`, `navigator.clipboard.writeText(window.location.href)`, "Copied!" for ~2s
- `next.config.ts` — added `webpack()` customizer setting `resolve.extensionAlias: { ".js": [".ts", ".tsx", ".js"] }`
- `package.json` — `dev`/`build` scripts now pass `--webpack`

## Deviations from Plan

**1. [Rule 3 — Blocking] `next dev`/`next build` couldn't resolve the codebase's `.js`-suffix import convention at all**

- **Issue:** Task 3's live browser check was the first time anyone actually ran `npm run dev` to completion in this project. It failed immediately: `Module not found: Can't resolve '../src/components/sandbox/SandboxContainer.js'` from `app/page.tsx`, and the same failure recurred transitively through every file it imports (confirmed via `grep`: 98 relative imports across 37 files use this pattern, spanning every phase 1-5). Verified this is not specific to Turbopack: `next dev --webpack` reproduces the identical error, and Next's own docs list `experimental.extensionAlias` as an explicitly unsupported Turbopack config option.
- **Fix (user-approved via AskUserQuestion, given the blast radius crossed prior-phase code):** presented three options — (a) webpack + `resolve.extensionAlias` (2-file change, keeps all 37 files untouched, gives up Turbopack), (b) strip `.js` extensions from all 98 imports project-wide (keeps Turbopack, touches every phase's files), (c) defer live verification entirely. User chose (a). Verified: `curl` 200 on `/`, `/gallery`, `/s/<realId>`; 404 on `/s/<bogusId>`; full suite still 160/160, `tsc --noEmit` clean.
- **Files modified:** `next.config.ts`, `package.json`

**2. [Environmental, not a code defect] Postgres connectivity during manual verification**

- **Issue:** User reported Save doing nothing and `/gallery`/`/s/[shareId]` throwing `Invalid prisma.scenario.findMany() invocation` / `ECONNREFUSED`. Root cause: the shared dev Postgres container this session had been reusing (`agent-a3ad4463cb607a932-postgres-1`, up since a prior phase) had exited, and an unrelated container from a different, unaffiliated project (`project-protfolio-2-postgres-1`) had briefly occupied port 5432.
- **Fix:** `docker compose up -d` (this project's own compose file, port 5432 now free), `npx prisma migrate deploy`, `npx prisma db seed` (6 curated rows restored). Re-verified via `npm test -- src/server/api/routers/scenario.test.ts` (4/4 passing against the live DB) and `curl` against all three routes.
- **Not a code change** — no files modified for this fix.

## Requirements Coverage
- **SCEN-01** ("receive a shareable link"): complete — `/s/[shareId]` renders any valid saved scenario; Save button (05-03) redirects here; confirmed end-to-end by the human-verify checkpoint.

## Deferred / Follow-up (raised by user, out of scope for this plan)
- **Gallery page placement:** user wants the gallery folded into the home page below the sandbox instead of the standalone `/gallery` route built in 05-04. Explicitly deferred to a later, separate change — not addressed in this phase.

## Self-Check: PASSED

- FOUND: src/lib/trpc/banner.ts
- FOUND: app/s/[shareId]/page.tsx
- FOUND: src/components/sandbox/CopyLinkButton.tsx
- FOUND: next.config.ts (webpack customizer present)
- FOUND commit: f51df91
- FOUND commit: 83afdaf
- FOUND commit: 7beb689
- Human-verify checkpoint: all steps except gallery-placement preference confirmed working by user in a live browser session; gallery placement explicitly deferred, not a failure.

---
*Phase: 05-save-share-gallery*
*Completed: 2026-07-18*
