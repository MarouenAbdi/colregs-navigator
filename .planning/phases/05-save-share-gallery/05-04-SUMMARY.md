---
phase: 05-save-share-gallery
plan: 04
subsystem: ui
tags: [next.js, app-router, server-components, trpc, gallery]

# Dependency graph
requires:
  - phase: 05-save-share-gallery
    provides: "getCaller() server-side tRPC caller factory (05-01), curated Scenario rows seeded via prisma/seed.ts (05-02)"
provides:
  - "/gallery route: a Server Component rendering gallery.list() as a responsive card grid, each card linking to /s/[shareId]"
affects: [05-05 share page, future gallery UI polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server Component data fetch via getCaller().{router}.{procedure}() -- no client-side loading state needed for read-only public pages"
    - "Ambient module shim (src/types/next-link.d.ts) as the scoped workaround for TS 7.0.2 Node16/NodeNext ESM resolver gaps against exports-less CJS packages, instead of loosening project-wide moduleResolution"

key-files:
  created: [app/gallery/page.tsx, src/types/next-link.d.ts]
  modified: []

key-decisions:
  - "Added an ambient `declare module \"next/link\"` shim (src/types/next-link.d.ts) rather than changing tsconfig's moduleResolution or package.json's type field -- isolated-repro-confirmed this is a TypeScript 7.0.2 Node16/NodeNext resolver limitation (Next.js 16.2.10's package.json has no `exports` map; Node's actual ESM loader resolves such subpaths fine via plain filesystem lookup per its own spec, but TS's NodeNext resolver in ESM mode does not fall back the same way). Changing the project-wide module system would be an architectural change out of scope for a single page; the shim is local, additive, and doesn't touch node_modules or any other file."

requirements-completed: [SCEN-03]

# Metrics
duration: 20min
completed: 2026-07-18
---

# Phase 5 Plan 4: Gallery Listing Page Summary

**`/gallery` Server Component rendering `gallery.list()` as a responsive card grid, each card linking to the same `/s/[shareId]` detail route a plain shared link uses -- no duplicate gallery-detail page.**

## Performance

- **Duration:** 20 min
- **Started:** 2026-07-18T00:10:00Z
- **Completed:** 2026-07-18T00:29:00Z
- **Tasks:** 1 completed
- **Files modified:** 2 (2 created)

## Accomplishments
- `app/gallery/page.tsx` -- an `async function GalleryPage()` Server Component (no `"use client"`) that calls `getCaller().gallery.list()` exactly once, rendering an `<h1>` + responsive `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` card grid, each card a `<Link href={`/s/${row.id}`}>` wrapping an encounter-type badge and the rationale text, with a zero-scenario fallback message.
- Confirmed against the shared dev Postgres (already seeded by 05-02): `SELECT COUNT(*) FROM "Scenario" WHERE "isCurated" = true` returns 6.

## Task Commits

Each task was committed atomically:

1. **Task 1: Build the gallery listing page** - `5c90898` (feat) -- includes both `app/gallery/page.tsx` and the `src/types/next-link.d.ts` blocking-issue fix (same commit, both required for the task's own `npx tsc --noEmit` verification to pass)

**Plan metadata:** commit pending (docs: complete plan) -- to be added after this SUMMARY is written

_Note: no TDD tasks in this plan; the single task is plain `auto` type._

## Files Created/Modified
- `app/gallery/page.tsx` - Server Component: fetches `gallery.list()`, renders card grid linking to `/s/[shareId]`, empty-state fallback
- `src/types/next-link.d.ts` - Ambient `declare module "next/link"` shim working around a TS 7.0.2 Node16/NodeNext resolver gap for Next.js 16.2.10's exports-less package.json

## Decisions Made
- Followed the plan's exact contract for the page (layout classes, grid, badge, fallback message) -- no product-level deviation.
- Ambient module shim over tsconfig/module-system changes: see key-decisions above and Deviations below for the full investigation trail.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added `src/types/next-link.d.ts` ambient shim so `next/link` resolves under `tsc --noEmit`**
- **Found during:** Task 1 verification (`npx tsc --noEmit`)
- **Issue:** `import Link from "next/link"` failed with `TS2307: Cannot find module 'next/link'`. Root-caused via an isolated minimal reproduction (outside this project's other tsconfig settings): Next.js 16.2.10's `package.json` has no `"exports"` field (subpaths like `./link` are declared only via the legacy `"files"` array, which is how Next.js has historically shipped). Under this project's locked `"module"/"moduleResolution": "NodeNext"` + `package.json` `"type": "module"` (established Phase 1, foundational to the whole codebase's import convention -- not something to change for one page), Node's actual ESM loader still resolves exports-less subpaths via plain filesystem lookup (this is explicit, documented Node.js behavior: "when the exports field is not defined, subpath exports are similarly not enforced, and resolution proceeds via the file system as before"). TypeScript 7.0.2's Node16/NodeNext resolver, however, does not fall back the same way for bare subpath specifiers once ESM mode is in effect -- confirmed by reproducing the exact failure in a throwaway two-file `tsconfig.json`/`.tsx` sandbox with only `module`/`moduleResolution: NodeNext`, `type: module`, and the shared `node_modules/next`, and confirming it resolves fine the instant `type: module` is removed (CJS mode). This is a TypeScript resolver limitation, not a project misconfiguration -- and would block any future page using `next/link` (or likely `next/navigation`, `next/image`, etc.) under this project's locked module settings, not just this one file.
- **Fix:** Evaluated and rejected two alternatives first: (a) loosening `tsconfig.json`'s `moduleResolution` to `"bundler"` (Next's own default) -- rejected as an architectural, project-wide change affecting every other file's import resolution, out of scope for a single-page plan and risking regressions in the `.js`-extension relative-import convention established since Phase 1; (b) importing the resolvable deep path `next/dist/client/link.js` directly -- rejected as an unsupported, version-fragile private API that Next explicitly discourages. Instead added a scoped, additive `declare module "next/link"` ambient type declaration at `src/types/next-link.d.ts` (picked up automatically since `src` is already in `tsconfig.json`'s `include`), typing `Link`'s props as `AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }` -- this only affects TypeScript's static check; the actual runtime import is unchanged and resolves normally under Next's own SWC/webpack bundling (which uses Node's real ESM/CJS resolution, not TS's checker).
- **Files modified:** `src/types/next-link.d.ts` (new file)
- **Verification:** `npx tsc --noEmit` exits 0 (previously failed with `TS2307`); confirmed the shim change alone (isolated repro) flips the same reproduction from failing to passing
- **Committed in:** `5c90898` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 - blocking, tooling/resolver gap only -- no product code, dependency, or project-wide config change)
**Impact on plan:** The fix is additive and local (one new `.d.ts` file); it does not touch `tsconfig.json`, `package.json`, or `node_modules`, and does not change any other file's module resolution behavior. No scope creep beyond what was required for this task's own verification command to pass.

## Issues Encountered
- Fresh worktree required generating the Prisma client (`npx prisma generate`, gitignored, not committed) and creating a local `.env` (gitignored, not committed, matching `.env.example`) before `tsc --noEmit` could run cleanly against `src/server/db/client.ts` -- consistent with the same first-run setup step documented in 05-01-SUMMARY.md and 05-02-SUMMARY.md for this worktree pattern.
- Could not run `npm run dev` + visually load `/gallery` in this environment (no local `node_modules` materialized in this worktree -- Turbopack refuses to follow the parent checkout's `node_modules` symlink target outside its pinned `turbopack.root`, the same limitation 05-01-SUMMARY.md documented). Verified instead via: `npx tsc --noEmit` (clean), the full Vitest suite (151/151 passing, unaffected), a direct `psql` query against the shared dev Postgres confirming 6 `isCurated: true` rows are present (05-02's seed), and manual review of the rendered JSX against the plan's exact class/structure spec.

## User Setup Required

None - no external service configuration required beyond the pre-existing local Postgres dev setup already documented in `.env.example`.

## Next Phase Readiness
- `/gallery` is ready to render live once combined with the primary checkout's fully-installed `node_modules` (same dev-server limitation as 05-01, not a defect in the shipped code).
- Depends on 05-03 (sibling wave-2 plan, different worktree) having built the `/s/[shareId]` detail route each gallery card links to -- this plan's `<Link href={`/s/${row.id}`}>` targets that route by contract (D-02/D-03) but does not create it.
- The `src/types/next-link.d.ts` shim should get an explicit look during code review, flagged as a new file addressing a tooling gap rather than a product change -- future pages needing other `next/*` subpaths (e.g. `next/navigation`, `next/image`) may hit the same Node16/NodeNext resolver gap and can extend this pattern.

---
*Phase: 05-save-share-gallery*
*Completed: 2026-07-18*

## Self-Check: PASSED

- FOUND: app/gallery/page.tsx
- FOUND: src/types/next-link.d.ts
- FOUND commit: 5c90898
