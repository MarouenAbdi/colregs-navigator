# Deferred Items — Phase 20 (Reasoning Trail & Hero Visual Sync)

## Out-of-scope test failures observed during plan 20-03 execution

While running the full `npx vitest run` suite as a sanity check after plan 20-03's
Hero preview card changes, 15 tests across 4 files failed:

- `src/components/gallery/GalleryContainer.test.tsx` (2 tests)
- `src/server/application/scenario-service.test.ts` (6 tests)
- `src/server/db/scenario-repository.test.ts` (3 tests)
- `src/server/api/routers/scenario.test.ts` (4 tests)

Root cause: this worktree has no `.env` file and no reachable Postgres connection
(the repo's `docker-compose.yml` Postgres container is up, but bound to host port
5433, not the 5432 `.env.example` documents, and no `.env` exists in this worktree
to supply `DATABASE_URL` regardless). All 15 failures are Prisma connection errors
(`INTERNAL_SERVER_ERROR` instead of expected `NOT_FOUND`, etc.), not logic bugs.

None of these files were touched by plan 20-03 (`src/components/hero/
hero-preview-geometry.ts`, `hero-preview-risk.ts`, `HeroPreviewCard.tsx` only).
Not fixed per the executor's scope-boundary rule — out of scope for this plan.
Plan 20-03's own verification (`Hero.test.tsx`, `hero-preview-fixture.test.ts`)
passes cleanly and does not depend on a database connection.
