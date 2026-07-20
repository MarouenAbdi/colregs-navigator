---
phase: 14-pipeline-hooks
plan: 01
subsystem: infra
tags: [github-actions, ci, prisma, node, docker-compose]

# Dependency graph
requires: []
provides:
  - "Repo's first GitHub Actions CI pipeline (.github/workflows/ci.yml): lint, typecheck, test, build jobs on pull_request and push:main"
  - ".nvmrc pinning Node major version 22 as the single source of truth for local dev, CI, and future deploy tooling"
  - "postinstall script (prisma generate) so npm ci always regenerates the gitignored generated/prisma client"
  - "README CI status badge"
affects: [14-02, 14-03, 14-04, 15-deploy-verify]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CI jobs reuse docker-compose.yml verbatim (docker compose up -d --wait) rather than re-declaring services: in workflow YAML"
    - "prisma migrate deploy (never migrate dev/db push) is the only CI/CD-safe migration command"

key-files:
  created: [.nvmrc, .github/workflows/ci.yml]
  modified: [package.json, package-lock.json, README.md]

key-decisions:
  - "lint/typecheck jobs set a placeholder (non-connecting) DATABASE_URL purely so prisma.config.ts's env('DATABASE_URL') call doesn't throw -- Prisma 7's env() helper throws whenever the variable is entirely unset, not only when a real DB connection is attempted"
  - "build job needs a real reachable Postgres (same as test) because GalleryContainer.tsx's async Server Component performs a live gallery.list() read during next build --webpack's static generation of '/'"
  - "No 5th deploy job added -- GitHub Actions is CI-only per this milestone's locked architecture; CD is the future host's native Git integration (Phase 15)"

patterns-established:
  - "Any future CI job that imports the Prisma client (even without connecting) must set DATABASE_URL to a syntactically valid placeholder string first"

requirements-completed: [CI-01, CI-02, CI-03, CI-04, CI-06]

# Metrics
duration: 25min
completed: 2026-07-20
---

# Phase 14 Plan 01: Pipeline & Hooks -- CI Pipeline Foundation Summary

**GitHub Actions CI pipeline (lint/typecheck/test/build) reusing docker-compose.yml's Postgres, gated by a new .nvmrc-pinned Node version and an automatic postinstall Prisma-generate step**

## Performance

- **Duration:** 25 min
- **Started:** 2026-07-20T17:50:00+01:00
- **Completed:** 2026-07-20T17:54:31+01:00
- **Tasks:** 3 completed
- **Files modified:** 5 (.nvmrc, package.json, package-lock.json, .github/workflows/ci.yml, README.md)

## Accomplishments
- `.nvmrc` pins Node major version 22, feeding `actions/setup-node`'s `node-version-file` input
- `postinstall: prisma generate` added to `package.json`, so every `npm ci` regenerates the gitignored `generated/prisma` client with no manual step
- `.github/workflows/ci.yml` defines exactly four jobs (`lint`, `typecheck`, `test`, `build`), triggered on `pull_request` and `push:main`, with a least-privilege top-level `permissions: contents: read`
- `test`/`build` jobs reuse the existing `docker-compose.yml` Postgres verbatim (`docker compose up -d --wait`) -- no duplicated service definition
- README displays a live CI status badge under the H1, with a source comment flagging the repo's current private-visibility caveat (relevant to plan 14-02's upcoming branch-protection decision)

## Task Commits

Each task was committed atomically:

1. **Task 1: Pin Node version and auto-generate the Prisma client on every install** - `ef36da3` (feat)
2. **Task 2: Author .github/workflows/ci.yml -- four required jobs reusing docker-compose.yml** - `200bd01` (feat)
3. **Task 3: Add a live GitHub Actions CI status badge to README** - `c199a8e` (docs)

_Note: no TDD tasks in this plan -- infra/config only._

## Files Created/Modified
- `.nvmrc` - Pins Node major version 22 (single source of truth for local dev/CI/future deploy)
- `package.json` - Adds `"postinstall": "prisma generate"` script
- `package-lock.json` - Lockfile regenerated to reflect the new install-script metadata (`hasInstallScript: true`)
- `.github/workflows/ci.yml` - Four-job CI pipeline (lint, typecheck, test, build)
- `README.md` - CI status badge under the H1 heading

## Decisions Made
- Confirmed (empirically, not just from research) that Prisma 7.8.0's `env()` helper in `prisma.config.ts` throws whenever `DATABASE_URL` is entirely absent from the environment -- regardless of whether the invoked command (`generate`) ever attempts a real connection. This is Prisma's documented `env()` behavior ("also throws an error if the variable is missing"), not a bug tied to the specific older-Prisma issues cited in planning research. The plan's own CI design already accounted for this by setting a placeholder `DATABASE_URL` in the `lint`/`typecheck` jobs "as defense-in-depth" -- in practice this placeholder is load-bearing, not optional, for those two jobs.
- Confirmed the `prisma-client` generator (per `prisma/schema.prisma`'s `generator client { provider = "prisma-client" }`) emits `generated/prisma/client.ts`, not `client.js` as literally written in the plan's acceptance criteria/verify command -- verified Task 1 against the real emitted filename instead.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug/inaccurate plan assumption] Task 1's verify command required a DATABASE_URL to be set**
- **Found during:** Task 1 (Pin Node version and auto-generate the Prisma client)
- **Issue:** The plan's `<interfaces>` section asserted `prisma generate` "should succeed with no DATABASE_URL set at all" on Prisma `^7.8.0`. Running the plan's literal verify command (`rm -rf generated && npm run postinstall && test -f generated/prisma/client.js && echo OK`) with zero environment setup failed with `PrismaConfigEnvError: Cannot resolve environment variable: DATABASE_URL` -- confirmed against the actually-installed `prisma@7.8.0`/`@prisma/client@7.8.0` in this repo, not a stale cache.
- **Fix:** No code fix was needed -- this is expected behavior for Prisma 7's `env()` helper (confirmed via Context7 docs: "also throws an error if the variable is missing"). Re-ran verification with a placeholder `DATABASE_URL` set (matching exactly what the CI workflow's `lint`/`typecheck` jobs already do), which succeeded. No local-dev or CI-facing behavior needed to change, since a real `.env` (local) or job-level `env:` (CI) is always present in the two real-world invocation paths -- only the artificial "zero env setup" test scenario in the plan's verify string was inaccurate.
- **Files modified:** None (documentation-only correction; the plan's CI workflow already handles this correctly in Task 2)
- **Verification:** `DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" npm run postinstall` succeeds and regenerates the client
- **Committed in:** ef36da3 (Task 1 commit; no separate fix commit needed)

**2. [Rule 1 - Bug/inaccurate plan assumption] Generated Prisma client filename is `client.ts`, not `client.js`**
- **Found during:** Task 1 (Pin Node version and auto-generate the Prisma client)
- **Issue:** The plan's acceptance criteria and automated verify command both reference `generated/prisma/client.js`. This project's `prisma/schema.prisma` uses `generator client { provider = "prisma-client" }`, which emits TypeScript source (`client.ts`), matching the rest of this TypeScript-first codebase (run via `tsx`/`tsc`, no separate JS build step for the generated client).
- **Fix:** Verified against the actual emitted filename (`generated/prisma/client.ts`) instead of the plan's literal `client.js`. No code change -- purely a verification-target correction.
- **Files modified:** None
- **Verification:** `test -f generated/prisma/client.ts && echo OK` passes after a fresh `rm -rf generated && npm run postinstall`
- **Committed in:** ef36da3 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 -- plan-assumption corrections, zero code changes required)
**Impact on plan:** No scope creep, no code changes beyond what the plan specified. Both deviations are documentation-level corrections to the plan's stated verification assumptions; the actual CI workflow authored in Task 2 already handles the `DATABASE_URL` requirement correctly (placeholder for lint/typecheck, real value for test/build).

## Issues Encountered
- This worktree had no `node_modules` at task start (fresh worktree checkout) -- ran `npm install` once to establish a real local install before running Task 1's verify command, confirming the `postinstall` script fires correctly on `npm ci`/`npm install` as intended.
- None of the deviations above blocked task completion; both were caught, understood, and worked around within the same task's verification step.

## User Setup Required

None - no external service configuration required. This plan is entirely repo-local tooling (GitHub Actions CI definition, `.nvmrc`, `package.json` script, README badge) -- no secrets, hosting accounts, or DB provisioning needed. Live verification that opening a real PR triggers all four jobs by name is explicitly deferred to plan 14-02 per this plan's own `<success_criteria>`.

## Next Phase Readiness
- `.nvmrc`, the `postinstall` script, and `.github/workflows/ci.yml` are all committed and locally verified (valid YAML, exactly 4 jobs, correct docker-compose/migrate-deploy usage, lint and typecheck both pass clean against the current codebase).
- Ready for plan 14-02 to open a real PR and confirm all four jobs (`lint`, `typecheck`, `test`, `build`) actually run and pass against GitHub's runners, and to make the branch-protection decision flagged by this plan's README comment (private-repo Free-plan limitation).
- No blockers.

---
*Phase: 14-pipeline-hooks*
*Completed: 2026-07-20*
