# Deferred Items — Phase 07 (Hero)

## Resolved: local worktree environment gap (not a code issue)

Task 2's verification run initially showed 13 failing tests across 3 DB-
dependent files (`scenario-repository.test.ts`, `scenario.test.ts`,
`scenario-service.test.ts`), all failing with `SASL:
SCRAM-SERVER-FIRST-MESSAGE: client password must be a string`. Root cause:
this git worktree had no `.env` file (gitignored, not copied into fresh
worktrees) and no generated Prisma client (fresh `npm install`), so any
`DATABASE_URL` fallback used in ad-hoc verification pointed at the wrong
Postgres port (`.env.example`'s documented `5432`, while this project's
actual running `docker-compose` Postgres container is mapped to host port
`5433`).

Fix (environment-only, no source change): ran `npx prisma generate` and
copied the main checkout's local `.env` (`DATABASE_URL` on port `5433`)
into this worktree. Both files are gitignored/build artifacts, not
tracked. After the fix, the full suite passes 163/163 and `npm run build`
succeeds end-to-end (`/gallery`'s static prerender included). No code in
`src/server/*` needed any change — this was purely a fresh-worktree setup
gap, unrelated to Hero's scope.
