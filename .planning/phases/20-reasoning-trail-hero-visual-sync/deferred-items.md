# Deferred Items — Phase 20 (Reasoning Trail & Hero Visual Sync)

## Out-of-scope test failures observed during plans 20-02 and 20-03 execution

While running the full `npx vitest run` suite as a sanity check after each plan's
changes, both plans independently observed the same 15 pre-existing failures
across 4 files:

- `src/components/gallery/GalleryContainer.test.tsx` (2 tests)
- `src/server/application/scenario-service.test.ts` (6 tests)
- `src/server/db/scenario-repository.test.ts` (3 tests)
- `src/server/api/routers/scenario.test.ts` (4 tests)

Root cause: these isolated worktrees have no `.env` file and no reachable Postgres
connection (the repo's `docker-compose.yml` Postgres container is bound to host
port 5433, not the 5432 `.env.example` documents, and no `.env` exists in the
worktree to supply `DATABASE_URL` regardless) — `generated/prisma/client.js`
doesn't exist because `prisma generate` requires a real `DATABASE_URL`. All
failures are Prisma connection errors (`INTERNAL_SERVER_ERROR` instead of
expected `NOT_FOUND`, etc.), not logic bugs. `npx tsc --noEmit` shows the same
root cause (`src/server/db/client.ts` can't resolve the generated module).

None of these files were touched by plan 20-02 (`ReasoningTrail.tsx`,
`SandboxContainer.tsx`) or plan 20-03 (`hero-preview-geometry.ts`,
`hero-preview-risk.ts`, `HeroPreviewCard.tsx`). Not fixed per the executor's
scope-boundary rule — out of scope for both plans. Each plan's own verification
suite passes cleanly and does not depend on a database connection.

Confirmed resolved: the orchestrator's post-merge test gate on the main checkout
(which has a working `DATABASE_URL`) shows the full suite passing — this is
purely a worktree/CI-env gap, not a regression.
