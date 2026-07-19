# Deferred Items - Phase 09 Plan 02

- **Pre-existing tsc failure (out of scope):** `npx tsc --noEmit` fails with
  `src/server/db/client.ts(1,30): error TS2307: Cannot find module
  '../../../generated/prisma/client.js'` in this worktree. This worktree has no
  `.env` (no `DATABASE_URL`), so `npx prisma generate` cannot run and the
  generated Prisma client was never produced. This is an environment/setup gap
  unrelated to this plan's presentation-layer file changes
  (src/components/shared, src/components/hero, src/components/gallery,
  src/components/sandbox/vessel-role.ts) — none of those files touch Prisma.
  Verified via `npx vitest run` (all relevant test files pass) as the
  functional verification instead.
