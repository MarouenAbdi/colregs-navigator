# Deferred Items -- Phase 14 (Pipeline & Hooks)

Items discovered during execution that are out of scope for the current plan (pre-existing,
unrelated to the plan's own file changes) and therefore not auto-fixed.

## From Plan 14-03

- **`npm run typecheck` fails in this worktree**: `src/server/db/client.ts(1,30): error
  TS2307: Cannot find module '../../../generated/prisma/client.js'`. Root cause: this worktree
  has no `.env` file and no local Docker Postgres running, so `postinstall: prisma generate`
  (which requires `DATABASE_URL` to be set at all, per Prisma 7's `env()` helper behavior --
  documented in `14-01-SUMMARY.md`) never generated the `generated/prisma/` client output.
  Unrelated to plan 14-03's own changes (Husky/lint-staged install, `CONTRIBUTING.md`) --
  neither task touches Prisma, the schema, or `src/server/db/`. Resolves itself once the
  worktree/environment is set up per `CONTRIBUTING.md`'s "Setup" section (`cp .env.example
  .env`, `docker compose up -d`, `npx prisma migrate dev`). `npm run lint` (0 errors, 3
  pre-existing unrelated `max-lines` warnings) and the `.husky/pre-commit` hook's own manual
  verification (auto-fix + `.env*` guard) both pass independently of this gap.
