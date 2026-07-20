# Deferred Items -- Phase 12

Out-of-scope discoveries logged during plan execution, not fixed per the
executor's scope-boundary rule (only auto-fix issues directly caused by the
current task's changes).

## Plan 01, Task 3

- **`npx tsc --noEmit` fails** with `Cannot find module
  '../../../generated/prisma/client.js'` (`src/server/db/client.ts:1`). Root
  cause: this worktree has no `DATABASE_URL` configured and the Prisma client
  has never been generated here (`npx prisma generate` also fails with
  `PrismaConfigEnvError: Cannot resolve environment variable: DATABASE_URL`).
  Pre-existing environment gap, unrelated to any file this plan touches
  (`src/components/sandbox/*`) -- confirmed no sandbox/chart file references
  the generated Prisma client.
- **`npx vitest run` (full suite) reports 4 failing test files** --
  `scenario-service.test.ts` and `scenario.test.ts` -- all failing with
  `SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string`, i.e.
  no live Postgres connection is reachable from this worktree. Same root
  cause as above (missing `DATABASE_URL`/DB access), unrelated to the
  ChartPanel/chart-panel-geometry/chart-panel-derivation changes in this
  plan. `ChartPanel.test.tsx` (all 4 tests) and every other non-DB test file
  in the suite pass.

Neither item is fixed here -- both require environment/DB configuration
outside this plan's file scope.
