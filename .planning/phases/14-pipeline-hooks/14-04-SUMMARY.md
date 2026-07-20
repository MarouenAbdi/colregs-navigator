---
phase: 14-pipeline-hooks
plan: 04
subsystem: infra
tags: [vercel, prisma, deployment, ci-cd, nextjs]

# Dependency graph
requires:
  - phase: 14-01
    provides: "postinstall prisma generate script, .nvmrc, CI build job the vercel-build script must not disturb"
provides:
  - "Environment-gated prisma migrate deploy runner (scripts/migrate-if-production.mjs)"
  - "vercel-build package.json script wiring prisma generate -> gated migrate -> next build --webpack"
  - "README Deployment section documenting current, honest CD status"
affects: [15-deploy-verify]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Environment-gated migration inside host build script (VERCEL_ENV === production gate), Vercel vercel-build script convention over vercel.json buildCommand"]

key-files:
  created: [scripts/migrate-if-production.mjs]
  modified: [package.json, README.md]

key-decisions:
  - "Migration gate keys off process.env.VERCEL_ENV === 'production' exactly (not any preview/development value), matching Vercel's own documented env-var semantics"
  - "Single hardcoded execSync command string (npx prisma migrate deploy) with zero interpolated input -- never migrate dev, never db push"
  - "Local verification used the always-on colregs-navigator-postgres-1 docker-compose container (port 5433) as the DATABASE_URL stand-in, not a fresh container -- legitimate for verifying the script's own gating/sequencing logic, not a claim about real production DB behavior (explicitly Phase 15's job)"

patterns-established:
  - "Environment-gated build-time side effects: a script checks a host-injected env var and no-ops (exit 0) when the condition is false, rather than the caller conditionally invoking the script"

requirements-completed: [CD-01, CD-02]

# Metrics
duration: ~15min
completed: 2026-07-20
---

# Phase 14 Plan 04: Vercel Build & Environment-Gated Migration Summary

**Environment-gated `prisma migrate deploy` wired into a new `vercel-build` script (`prisma generate` -> gate -> `next build --webpack`), verified locally in both gate states and end-to-end.**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-07-20T19:22:30Z
- **Tasks:** 2 completed
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments
- `scripts/migrate-if-production.mjs` authored: a single hardcoded `npx prisma migrate deploy` command, gated behind `process.env.VERCEL_ENV === "production"`, no-op otherwise.
- `package.json` gained a `"vercel-build"` script (`prisma generate && node scripts/migrate-if-production.mjs && next build --webpack`) with the existing `"build"` script left byte-identical.
- Both gate states verified locally against the repo's own docker-compose Postgres: `VERCEL_ENV` unset produced zero migration side effects; `VERCEL_ENV=production` ran `prisma migrate deploy` (reported "No pending migrations to apply" -- valid proof the gated branch executed).
- Full `npm run vercel-build` sequence verified end-to-end with `VERCEL_ENV=production`, confirming a webpack (not Turbopack) build via `▲ Next.js 16.2.10 (webpack)` / `✓ Compiled successfully`.
- README.md gained a new `## Deployment` section (after "Local Setup") stating no live deployment exists yet, describing the verified vercel-build sequence, and clarifying CD-01's future mechanism is the host's native Git integration, not a hand-rolled GitHub Actions deploy step.

## Task Commits

Each task was committed atomically:

1. **Task 1: Author the environment-gated migration script and vercel-build package.json script** - `6dd7aa0` (feat)
2. **Task 2: Locally verify the gate and the full vercel-build sequence, document CD status in README** - `035f77a` (docs)

_Note: Task 2 produced documentation + verification evidence only (no source code changes beyond README), hence the `docs` commit type._

## Files Created/Modified
- `scripts/migrate-if-production.mjs` - ESM script; runs `npx prisma migrate deploy` via `execSync({stdio: "inherit"})` only when `VERCEL_ENV === "production"`, no-op (exit 0) otherwise
- `package.json` - added `"vercel-build"` script; `"build"`, `"postinstall"`, and all other existing scripts unchanged
- `README.md` - added `## Deployment` section after `## Local Setup`

## Decisions Made
- Gate condition is a strict `=== "production"` equality check, not a truthy/falsy check on `VERCEL_ENV` -- this correctly treats `"preview"`, `"development"`, and unset as all equally safe (skip) states, matching Vercel's documented three-value enum.
- Used the already-running `colregs-navigator-postgres-1` container (port 5433, confirmed via `docker ps`) for local verification rather than starting a fresh one, per the environment note provided at execution start. `.env.example`'s documented port (5432) is what a fresh `docker compose up -d` would map to; 5433 was this specific long-running container's actual host mapping in this environment.
- `next-env.d.ts`, which Next.js auto-rewrites between `.next/dev/types/routes.d.ts` (dev server) and `.next/types/routes.d.ts` (`next build`), was reverted after the build verification run -- it's a Next.js-managed artifact unrelated to this task's deliverable, not a real code change.

## Deviations from Plan

None - plan executed exactly as written. Both tasks matched their `<action>` and `<verify>` blocks with no auto-fixes required.

## Issues Encountered

None. `prisma migrate status`/`migrate deploy` connected cleanly to the local docker-compose Postgres on the first attempt; the full `vercel-build` sequence completed without error on the first run.

## User Setup Required

None - no external service configuration required. No live host is connected yet (Phase 15 scope); this plan's deliverable is fully self-contained within the repo and verified against the already-running local docker-compose Postgres.

## Next Phase Readiness
- The `vercel-build` script is fully authored, environment-gated, and locally verified end-to-end -- Phase 15 can connect a real host (Vercel) and expect this exact script to run unmodified, with only host-side configuration (env vars, git integration) remaining.
- README's Deployment section gives Phase 15 (and any reviewer) an accurate, non-aspirational statement of current CD status.
- No code changes are anticipated for Phase 15's CD-01/CD-02 completion -- only host provisioning and configuration.

---
*Phase: 14-pipeline-hooks*
*Completed: 2026-07-20*

## Self-Check: PASSED

- FOUND: scripts/migrate-if-production.mjs
- FOUND: vercel-build in package.json
- FOUND: README Deployment section
- FOUND: commit 6dd7aa0
- FOUND: commit 035f77a
