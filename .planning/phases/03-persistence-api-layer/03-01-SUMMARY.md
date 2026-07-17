---
phase: 03-persistence-api-layer
plan: 01
subsystem: database
tags: [prisma, postgres, docker, trpc, nextjs, dotenv]

# Dependency graph
requires:
  - phase: 01-domain-foundations
    provides: VesselSchema/PositionSchema Zod domain types mirrored by the Prisma schema
  - phase: 02-colregs-rules-engine
    provides: classifyEncounter() that later plans in this phase will call on read (not used by this plan directly)
provides:
  - Locked-version Prisma 7.8.0/tRPC 11.18.0/Next.js 16.2.10 dependency tree (first framework deps in this repo)
  - prisma/schema.prisma with the flat Scenario model (D-03/D-04/D-05/D-06/D-08/D-09), no verdict column
  - prisma.config.ts (Prisma 7 DATABASE_URL wiring via dotenv/config)
  - docker-compose.yml for local Postgres 17 (D-01), running and healthy with the initial migration applied
  - Committed initial migration (prisma/migrations/20260717125040_init) creating the Scenario table
  - src/server/db/client.ts exporting a working PrismaClient singleton built with @prisma/adapter-pg
  - .env.example / .env (local, uncommitted) / .gitignore entries for env + generated client output
  - README.md Local Setup section (Docker-only, no hosted deployment per D-02)
affects: [03-02, 03-03, phase-4-interactive-chart]

# Tech tracking
tech-stack:
  added: [next@16.2.10, react@19.2.7, react-dom@19.2.7, "@trpc/server@11.18.0", "@trpc/client@11.18.0", "@trpc/react-query@11.18.0", "@tanstack/react-query@5.101.2", prisma@7.8.0, "@prisma/client@7.8.0", "@prisma/adapter-pg@7.8.0", pg@8.22.0, dotenv, "@types/pg (dev)"]
  patterns: ["Prisma 7 driver-adapter architecture (provider = \"prisma-client\", explicit output path, prisma.config.ts instead of schema-embedded datasource url)", "Flat single-table Scenario schema (no normalized Vessel table, no JSON columns)", "HMR-safe PrismaClient globalThis singleton constructed with a mandatory driver adapter"]

key-files:
  created: [prisma/schema.prisma, prisma.config.ts, docker-compose.yml, .env.example, README.md, prisma/migrations/20260717125040_init/migration.sql, src/server/db/client.ts]
  modified: [package.json, package-lock.json, .gitignore]

key-decisions:
  - "dotenv package legitimacy verified via human checkpoint (Task 1) before install: repo matches motdotla/dotenv, no postinstall script, created 2013, slopcheck [OK]"
  - "vesselAType/vesselBType are plain String columns, not a native Postgres enum (Open Question 3, RESEARCH.md) -- Zod is the only enforcement boundary"
  - "Gallery fields (isCurated/displayOrder/rationale) added to Scenario now per D-08/D-09, unpopulated until Phase 5"
  - "Docker CLI was unavailable in the initial execution environment -- Task 3 was correctly halted as a human-action checkpoint rather than faked; resumed and completed once Docker Desktop was confirmed running"

patterns-established:
  - "Pattern: Prisma 7 client singleton must be constructed with an explicit driver adapter (@prisma/adapter-pg) -- implemented in src/server/db/client.ts"
  - "Pattern: generated Prisma client output (generated/prisma/) is TypeScript source, imported via NodeNext's .js-extension convention (e.g. \"../../../generated/prisma/client.js\")"

requirements-completed: []  # SCEN-02 is shared across 03-01/03-02/03-03 (all three plans declare it in frontmatter); the "always re-derive on read" behavior itself is implemented in Plan 03-02 (application-layer scenario-service) and exposed via Plan 03-03's routers -- not yet claimed complete here. This plan lays the schema/migration/client foundation that makes SCEN-02 physically enforceable (no verdict column can exist to trust), but does not itself satisfy the requirement's behavior.

# Metrics
duration: ~50min total (Task 2: ~35min; Task 3: ~15min once Docker became available)
completed: 2026-07-17
---

# Phase 3 Plan 01: Persistence Foundation Setup Summary

**Prisma 7.8.0/tRPC 11.18.0/Next.js 16.2.10 dependencies installed and locked; Scenario schema, prisma.config.ts, docker-compose.yml authored per D-01 through D-09; local Postgres migrated and a working PrismaClient singleton created**

## Status: COMPLETE

All three tasks are done and committed. Task 3 was initially blocked in the first execution
session because the `docker` CLI was not present in that sandboxed environment -- this was
correctly surfaced as a `human-action` checkpoint rather than faked (no fallback exists for
local Postgres per D-01/D-02). Execution resumed in the same worktree after Docker Desktop was
confirmed installed and running (`docker ps` succeeded), and Task 3 completed without rework:
the schema/config/compose artifacts from Task 2 needed no changes.

## Performance

- **Duration:** ~50 min total (Task 2 ~35 min; Task 3 ~15 min once Docker was available)
- **Tasks:** 3 of 3 completed (Task 1 approved via checkpoint, Tasks 2-3 executed and committed)
- **Files modified:** 8 (Task 2) + 3 (Task 3) = 11

## Accomplishments
- Installed all locked-version dependencies for Prisma 7 / tRPC 11 / Next.js 16 (first framework dependencies in this repo; `package.json` previously only had `zod`, `typescript`, `vitest`)
- Authored `prisma/schema.prisma` matching D-03/D-04/D-05/D-06/D-08/D-09 exactly, with zero verdict-shaped fields (verified via grep)
- Authored `prisma.config.ts` (Prisma 7's `DATABASE_URL` wiring, since the schema's `datasource` block has no `url` in 7.x)
- Authored `docker-compose.yml` for local Postgres 17 with a `pg_isready` healthcheck
- Added `.env.example`, extended `.gitignore` (`.env`, `generated/`, `prisma/generated/`), created `README.md` with a Local Setup section documenting Docker-only local dev
- Started local Postgres via `docker compose up -d`, confirmed healthy via `pg_isready`
- Ran `npx prisma migrate dev --name init`, creating and committing `prisma/migrations/20260717125040_init/migration.sql` (`CREATE TABLE "Scenario"` with all flat columns, no verdict field)
- Generated the Prisma client to `generated/prisma/` (gitignored, regenerated via `npx prisma generate`/`migrate dev`)
- Created `src/server/db/client.ts`: HMR-safe `PrismaClient` singleton built with the mandatory `@prisma/adapter-pg` driver adapter
- Verified end-to-end connectivity: `npx prisma db execute --stdin <<< "SELECT 1;"` succeeded; `npx tsc --noEmit` clean; existing 100-test domain suite still passes unchanged

## Task Commits

1. **Task 1: Verify dotenv package legitimacy before install** - checkpoint approved by human (no commit; evidence-gathering only, no files changed)
2. **Task 2: Install dependencies, author Prisma schema/config/Docker Compose, add setup docs** - `6c8e9bd` (feat)
3. **Task 3: Start Docker Postgres, run initial migration, create Prisma client singleton** - `6143f1e` (feat)

**Plan metadata:** `dad6e9a` (docs: interim summary, later superseded by this full-completion revision)

## Files Created/Modified
- `package.json` / `package-lock.json` - added Prisma 7.8.0, tRPC 11.18.0, Next.js 16.2.10, and peer dependencies at locked versions
- `prisma/schema.prisma` - `Scenario` model: flat `vesselA*`/`vesselB*` columns, `cuid()` id, gallery fields, no verdict column
- `prisma.config.ts` - `DATABASE_URL` wiring via `dotenv/config` + `env()`
- `docker-compose.yml` - local Postgres 17 service with healthcheck
- `.env.example` - `DATABASE_URL` template matching `docker-compose.yml` credentials
- `.gitignore` - added `.env`, `generated/`, `prisma/generated/`
- `README.md` - new file, "## Local Setup" section (Docker Desktop + Node 22+ prerequisites, setup command sequence)
- `.env` - created locally from `.env.example` (NOT committed, matches `.gitignore`)
- `prisma/migrations/20260717125040_init/migration.sql` - `CREATE TABLE "Scenario"` with all flat columns and gallery fields, committed
- `prisma/migrations/migration_lock.toml` - Prisma's migration provider lock file, committed
- `src/server/db/client.ts` - `PrismaClient` singleton with `@prisma/adapter-pg`, exports `prisma`
- `generated/prisma/` - Prisma-generated client (gitignored, not committed; regenerated by `npx prisma generate`)

## Decisions Made
- `dotenv` package legitimacy confirmed via Task 1's human-verify checkpoint before installing (repo `motdotla/dotenv`, no postinstall script, `slopcheck install dotenv` returned `[OK]`)
- Kept `vesselAType`/`vesselBType` as plain `String` columns (not a Postgres native enum) per RESEARCH.md's Open Question 3 resolution -- Zod is the only write-path enforcement needed
- Ran `npm audit` after install: 5 moderate-severity advisories, all in transitive dev-tooling dependencies (`postcss` via `next`'s build pipeline, `@hono/node-server` via `@prisma/dev`) -- not runtime application code, not introduced by a package choice this plan made (locked major versions per CLAUDE.md), so left as-is rather than force-upgrading and risking a breaking change to a pinned version. Documented here for visibility, not treated as a plan-blocking issue.
- Did not mark requirement SCEN-02 complete in `REQUIREMENTS.md`: all three plans in this phase (03-01/03-02/03-03) declare `requirements: [SCEN-02]` in frontmatter, but the actual "always re-derive on read" behavior is implemented by Plan 03-02's application-layer service and exposed by Plan 03-03's routers -- neither exists yet. Marking it complete now would be inaccurate; deferring to whichever plan's execution actually lands the behavior.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Adjusted schema/comment wording to satisfy the plan's own verify command**
- **Found during:** Task 2 (schema.prisma authoring)
- **Issue:** The plan's acceptance criteria run `grep -v '^//' prisma/schema.prisma | grep -ci 'verdict\|encounterType\|giveWay\|standOn'` expecting 0, and `grep -c "url" prisma/schema.prisma` expecting 0. An initial draft placed the D-06 "no verdict column" explanatory comment *indented* inside the model body (matching RESEARCH.md's own inline example) and used the word "url" inside an inline comment about the datasource block -- both caused the verify command to return a nonzero count because `grep -v '^//'` only strips comment lines that start at column 0, not indented ones.
- **Fix:** Moved the D-06 explanatory comment to an unindented, top-of-file `//` block (which the verify command's filter now strips) and reworded the datasource comment to avoid the literal substring "url".
- **Files modified:** `prisma/schema.prisma`
- **Verification:** Re-ran all of Task 2's grep-based acceptance criteria; all pass
- **Committed in:** `6c8e9bd` (Task 2 commit)

**2. [Rule 3 - Blocking] `npx prisma migrate dev` did not generate the client; ran `npx prisma generate` explicitly**
- **Found during:** Task 3 (initial migration)
- **Issue:** After `npx prisma migrate dev --name init` reported success and created the migration, `generated/prisma/` did not exist -- the client generation step that normally follows a migration did not produce output in this run.
- **Fix:** Ran `npx prisma generate` directly, which produced `generated/prisma/` (TypeScript source files: `client.ts`, `models/Scenario.ts`, etc.) in 17ms.
- **Files modified:** none tracked (generated output is gitignored per Task 2's `.gitignore` entries)
- **Verification:** `test -d generated/prisma` succeeds; `src/server/db/client.ts`'s import resolves; `npx tsc --noEmit` is clean; `npx prisma db execute --stdin <<< "SELECT 1;"` succeeds
- **Committed in:** N/A (generated output not committed by design)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes were mechanical (comment placement, an extra explicit `generate` invocation) -- no change to schema semantics, D-06's enforcement, or the plan's architecture.

## Issues Encountered
- **Docker CLI unavailable in the first execution session** -- `docker`, `docker-compose`, `colima`, and `podman` were all checked and none were present. This correctly blocked Task 3 (no fallback exists per D-01/D-02) and was reported as a `human-action` checkpoint. Resolved: the coordinator confirmed Docker Desktop was installed and running (`docker ps` succeeded) in a follow-up message, and Task 3 was completed in the same worktree with no rework needed on Task 2's artifacts.
- `npm audit` surfaced 5 moderate-severity advisories in transitive build/dev-tooling dependencies (`postcss`, `@hono/node-server`) -- noted under Decisions Made, not blocking.

## User Setup Required

None remaining. Docker Desktop is confirmed installed and running; `.env` exists locally (uncommitted, matches `.env.example`); the local Postgres container is up and healthy with the initial migration applied.

## Next Phase Readiness
- `generated/prisma/` client and `src/server/db/client.ts` singleton are ready for Plan 03-02 (application-layer `scenario-service.ts`) and Plan 03-03 (tRPC routers) to import.
- `prisma/migrations/20260717125040_init/` is committed -- any environment cloning this repo can reproduce the schema via `docker compose up -d && npx prisma migrate dev`.
- `npm test` (existing 100-test domain suite) still passes unchanged after the dependency install and migration -- confirms no regression from adding the new framework dependencies.
- SCEN-02 remains unclaimed in `REQUIREMENTS.md` pending Plans 03-02/03-03, which implement and expose the actual re-derive-on-read behavior this plan's schema makes enforceable.

---
*Phase: 03-persistence-api-layer*
*Completed: 2026-07-17*

## Self-Check: PASSED

All claimed created files found on disk (prisma/schema.prisma, prisma.config.ts,
docker-compose.yml, .env.example, README.md, .gitignore, prisma/migrations/20260717125040_init/migration.sql,
src/server/db/client.ts). All claimed commit hashes found in git log (6c8e9bd, dad6e9a, 6143f1e).
