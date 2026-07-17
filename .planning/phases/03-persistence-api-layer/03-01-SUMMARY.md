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
  - docker-compose.yml for local Postgres 17 (D-01)
  - .env.example / .env (local, uncommitted) / .gitignore entries for env + generated client output
  - README.md Local Setup section (Docker-only, no hosted deployment per D-02)
affects: [03-02, 03-03, phase-4-interactive-chart]

# Tech tracking
tech-stack:
  added: [next@16.2.10, react@19.2.7, react-dom@19.2.7, "@trpc/server@11.18.0", "@trpc/client@11.18.0", "@trpc/react-query@11.18.0", "@tanstack/react-query@5.101.2", prisma@7.8.0, "@prisma/client@7.8.0", "@prisma/adapter-pg@7.8.0", pg@8.22.0, dotenv, "@types/pg (dev)"]
  patterns: ["Prisma 7 driver-adapter architecture (provider = \"prisma-client\", explicit output path, prisma.config.ts instead of schema-embedded datasource url)", "Flat single-table Scenario schema (no normalized Vessel table, no JSON columns)"]

key-files:
  created: [prisma/schema.prisma, prisma.config.ts, docker-compose.yml, .env.example, README.md]
  modified: [package.json, package-lock.json, .gitignore]

key-decisions:
  - "dotenv package legitimacy verified via human checkpoint (Task 1) before install: repo matches motdotla/dotenv, no postinstall script, created 2013, slopcheck [OK]"
  - "vesselAType/vesselBType are plain String columns, not a native Postgres enum (Open Question 3, RESEARCH.md) -- Zod is the only enforcement boundary"
  - "Gallery fields (isCurated/displayOrder/rationale) added to Scenario now per D-08/D-09, unpopulated until Phase 5"

patterns-established:
  - "Pattern: Prisma 7 client singleton must be constructed with an explicit driver adapter (@prisma/adapter-pg) -- no code yet, deferred to Task 3"

requirements-completed: []  # SCEN-02 not yet satisfied -- Task 3 (migration + client) is blocked, see Status below

# Metrics
duration: ~35min (Task 2 only; Task 3 blocked before starting)
completed: 2026-07-17
---

# Phase 3 Plan 01: Persistence Foundation Setup Summary

**Prisma 7.8.0/tRPC 11.18.0/Next.js 16.2.10 dependencies installed and locked; Scenario schema, prisma.config.ts, and docker-compose.yml authored per D-01 through D-09 -- BLOCKED before Task 3 (no Docker CLI in this execution environment)**

## Status: PARTIALLY COMPLETE -- BLOCKED at Task 3

Tasks 1 and 2 are done and committed. Task 3 (start Docker Postgres, run the initial migration,
create the Prisma client singleton) could not be started: the `docker` CLI is not present in
this execution environment (`command -v docker` -> not found; verified no `docker-compose`,
`colima`, or `podman` alternative either). Per the plan's explicit instruction ("if it is not
[present], stop and report this as a blocker to the user rather than fabricating a passing
result -- there is no fallback for local Postgres per D-01/D-02") and this run's checkpoint
protocol, this is reported as a `human-action` checkpoint rather than attempted or faked.

`.env` was created locally (copied from `.env.example`, not committed -- `.gitignore` already
excludes it) so the only remaining step once Docker is available is `docker compose up -d` +
`npx prisma migrate dev --name init` + creating `src/server/db/client.ts`.

## Performance

- **Duration:** ~35 min (Task 2)
- **Tasks:** 2 of 3 completed (Task 1 approved via prior checkpoint, Task 2 completed this run, Task 3 blocked)
- **Files modified:** 8 (Task 2) + 0 committed for Task 3 (blocked before any file changes)

## Accomplishments
- Installed all locked-version dependencies for Prisma 7 / tRPC 11 / Next.js 16 (first framework dependencies in this repo; `package.json` previously only had `zod`, `typescript`, `vitest`)
- Authored `prisma/schema.prisma` matching D-03/D-04/D-05/D-06/D-08/D-09 exactly, with zero verdict-shaped fields (verified via grep)
- Authored `prisma.config.ts` (Prisma 7's `DATABASE_URL` wiring, since the schema's `datasource` block has no `url` in 7.x)
- Authored `docker-compose.yml` for local Postgres 17 with a `pg_isready` healthcheck
- Added `.env.example`, extended `.gitignore` (`.env`, `generated/`, `prisma/generated/`), created `README.md` with a Local Setup section documenting Docker-only local dev

## Task Commits

1. **Task 1: Verify dotenv package legitimacy before install** - checkpoint approved by human (no commit; evidence-gathering only, no files changed)
2. **Task 2: Install dependencies, author Prisma schema/config/Docker Compose, add setup docs** - `6c8e9bd` (feat)

**Task 3: [BLOCKING] Start Docker Postgres, run initial migration, create Prisma client singleton** - NOT STARTED (blocked, no commit)

## Files Created/Modified
- `package.json` / `package-lock.json` - added Prisma 7.8.0, tRPC 11.18.0, Next.js 16.2.10, and peer dependencies at locked versions
- `prisma/schema.prisma` - `Scenario` model: flat `vesselA*`/`vesselB*` columns, `cuid()` id, gallery fields, no verdict column
- `prisma.config.ts` - `DATABASE_URL` wiring via `dotenv/config` + `env()`
- `docker-compose.yml` - local Postgres 17 service with healthcheck
- `.env.example` - `DATABASE_URL` template matching `docker-compose.yml` credentials
- `.gitignore` - added `.env`, `generated/`, `prisma/generated/`
- `README.md` - new file, "## Local Setup" section (Docker Desktop + Node 22+ prerequisites, setup command sequence)
- `.env` - created locally from `.env.example` (NOT committed, matches `.gitignore`)

## Decisions Made
- `dotenv` package legitimacy confirmed via Task 1's human-verify checkpoint before installing (repo `motdotla/dotenv`, no postinstall script, `slopcheck install dotenv` returned `[OK]`)
- Kept `vesselAType`/`vesselBType` as plain `String` columns (not a Postgres native enum) per RESEARCH.md's Open Question 3 resolution -- Zod is the only write-path enforcement needed
- Ran `npm audit` after install: 5 moderate-severity advisories, all in transitive dev-tooling dependencies (`postcss` via `next`'s build pipeline, `@hono/node-server` via `@prisma/dev`) -- not runtime application code, not introduced by a package choice this plan made (locked major versions per CLAUDE.md), so left as-is rather than force-upgrading and risking a breaking change to a pinned version. Documented here for visibility, not treated as a plan-blocking issue.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Adjusted schema/comment wording to satisfy the plan's own verify command**
- **Found during:** Task 2 (schema.prisma authoring)
- **Issue:** The plan's acceptance criteria run `grep -v '^//' prisma/schema.prisma | grep -ci 'verdict\|encounterType\|giveWay\|standOn'` expecting 0, and `grep -c "url" prisma/schema.prisma` expecting 0. An initial draft placed the D-06 "no verdict column" explanatory comment *indented* inside the model body (matching RESEARCH.md's own inline example) and used the word "url" inside an inline comment about the datasource block -- both caused the verify command to return a nonzero count because `grep -v '^//'` only strips comment lines that start at column 0, not indented ones.
- **Fix:** Moved the D-06 explanatory comment to an unindented, top-of-file `//` block (which the verify command's filter now strips) and reworded the datasource comment to avoid the literal substring "url".
- **Files modified:** `prisma/schema.prisma`
- **Verification:** Re-ran all of Task 2's grep-based acceptance criteria; all pass (see below)
- **Committed in:** `6c8e9bd` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Cosmetic/comment-placement fix only; no change to schema semantics or D-06's enforcement (still zero verdict-shaped columns).

## Issues Encountered
- **Docker CLI unavailable in this execution environment** -- `docker`, `docker-compose`, `colima`, and `podman` were all checked and none are present. This blocks Task 3 entirely (no fallback exists per D-01/D-02 -- local Docker Postgres is the only supported provisioning path this milestone). Reported as a `human-action` checkpoint rather than worked around. `npm audit` also surfaced 5 moderate-severity advisories in transitive build/dev-tooling dependencies (`postcss`, `@hono/node-server`) -- noted above under Decisions, not blocking.

## User Setup Required

**External service (Docker) requires manual setup before Task 3 can run.** See the checkpoint returned alongside this summary for exact steps:
- Install/start Docker Desktop (or an equivalent local Docker daemon)
- Confirm `docker --version` succeeds in the environment that will execute Task 3
- `.env` has already been created locally from `.env.example` -- no further env var action needed

## Next Phase Readiness
- Task 2's schema/config/Docker Compose artifacts are ready for Task 3 to consume as soon as Docker is available -- no rework needed, just: `docker compose up -d`, `npx prisma migrate dev --name init`, then author `src/server/db/client.ts` per RESEARCH.md Pattern 1.
- Plans 03-02/03-03 (application layer, tRPC routers) and Phase 4 all depend on Task 3's `generated/prisma` client and `src/server/db/client.ts` singleton -- **this plan is not yet safe to build on top of** until Task 3 completes.
- `npm test` (existing 100-test domain suite) still passes unchanged after the dependency install -- confirms no regression from adding the new framework dependencies.

---
*Phase: 03-persistence-api-layer*
*Completed: 2026-07-17 (partial -- Task 3 blocked)*
