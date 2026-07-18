# Deferred Items — Phase 07 (Hero)

## Pre-existing, out-of-scope test failures (not fixed by 07-01)

`npx vitest run` (full suite) shows 13 failing tests across 3 files, all
requiring a live Postgres connection that isn't available in this worktree:

- `src/server/db/scenario-repository.test.ts`
- `src/server/api/routers/scenario.test.ts`
- `src/server/application/scenario-service.test.ts`

Failure mode: `SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a
string` (pg client auth against a DB that isn't running/reachable in this
environment) and one downstream `TRPCError` code mismatch caused by the
same root connection failure.

These files belong to Phase 3/5 (Scenario CRUD, Save/Share/Gallery) and are
entirely out of Hero's scope (07-01-PLAN.md's `files_modified` list does
not include any `src/server/*` file). Per the executor's scope-boundary
rule, pre-existing failures in unrelated files are logged here, not fixed.
`npx vitest run src/components/hero` (the phase's own scoped verification
command) passes with 0 failures.
