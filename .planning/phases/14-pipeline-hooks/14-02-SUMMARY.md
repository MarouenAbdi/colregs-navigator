---
phase: 14-pipeline-hooks
plan: 02
subsystem: infra
tags: [github-actions, ci, npm, tsgo, prisma]

# Dependency graph
requires: [14-01]
provides:
  - "Real, live-PR-verified proof that .github/workflows/ci.yml's four jobs (lint, typecheck, test, build) actually run and pass on a genuine pull request against this repo"
  - "Three permanent CI-correctness fixes discovered only by exercising CI against a real PR: lockfile peer-dep drift, missing DB seed step, tsgo/@typescript-native-preview compatibility"
affects: [14-03, 14-04, 15-deploy-verify]

# Tech tracking
tech-stack:
  added:
    - "@typescript/native-preview (devDependency) -- Microsoft's official tsgo marker package, installed solely so Next.js 16.2.10 recognizes typescript@7.0.2's native rewrite and skips a CI-only fail-fast check; does not change the pinned typescript@7.0.2 version"
  patterns:
    - "npm ci must be validated with --no-legacy-peer-deps locally before trusting it will pass in CI -- a local ~/.npmrc legacy-peer-deps=true setting silently masks lockfile drift that GitHub Actions' clean npm environment enforces strictly"
    - "Both the test and build CI jobs must run 'npx prisma db seed' after 'prisma migrate deploy' -- any future job that reads Scenario-table data (tests or Next.js static generation) needs the curated seed rows, which migrate deploy alone does not provide"

key-files:
  created: []
  modified:
    - "package-lock.json (regenerated under strict/non-legacy-peer-deps resolution)"
    - "package.json (added @typescript/native-preview devDependency)"
    - ".github/workflows/ci.yml (added 'npx prisma db seed' to test and build jobs)"

key-decisions:
  - "Chose @typescript/native-preview (Next.js's own hasNativeTypeScriptPreview() escape hatch) over two narrower workarounds that were tried and rejected: (1) overriding CI/GITHUB_ACTIONS env vars for the build step -- dead end, GitHub Actions reasserts GITHUB_ACTIONS=true for every step regardless of step-level env: overrides; (2) a postinstall shim creating an empty placeholder typescript/lib/typescript.js -- satisfied one check but crashed a second, independent code path in Next's build pipeline that also loads that file expecting a real TypeScript compiler API surface"
  - "Task 2 (branch protection) is genuinely blocked on a human billing/visibility decision (GitHub Pro upgrade vs. make-repo-public vs. defer-and-document) that cannot be resolved via any API call -- this plan stops at that checkpoint per its own design"

requirements-completed: [CI-01]

# Metrics
duration: 70min
completed: 2026-07-20
---

# Phase 14 Plan 02: Pipeline & Hooks -- Real CI Verification Summary

**Proved plan 14-01's ci.yml actually runs and passes on a live PR (not just "the YAML looks right"), fixing three real, previously-undetected CI bugs surfaced only by that live exercise**

## Performance

- **Duration:** ~70 min
- **Tasks:** 1 of 2 completed (Task 2 blocked on human decision, per plan design)
- **Files modified:** 3 (package-lock.json, package.json, .github/workflows/ci.yml)

## Accomplishments

- Opened a real scratch PR (`ci-verify/14-02`, #17) against `MarouenAbdi/colregs-navigator` and used `gh pr checks --watch` to observe all four named CI jobs (`lint`, `typecheck`, `test`, `build`) run to completion with `SUCCESS` state -- confirmed via `gh pr checks 17 --json name,state`, which returned all four as `SUCCESS`.
- Closed the scratch PR (not merged) and deleted the scratch branch both locally and on the remote -- no lingering scratch artifacts.
- Along the way, found and permanently fixed three real, pre-existing CI defects that a YAML-only review would never have caught -- each is now committed to this plan's own branch (not just the throwaway scratch branch), independent of Task 2's outcome.

## Task 1: Trigger and verify a real CI run against a live PR

Completed. All four jobs ran and passed on PR #17 (`gh pr checks 17 --json name,state` → `[{"name":"lint","state":"SUCCESS"},{"name":"typecheck","state":"SUCCESS"},{"name":"test","state":"SUCCESS"},{"name":"build","state":"SUCCESS"}]`).

## Deviations from Plan

### Auto-fixed Issues (Rule 1/3 -- bugs and blocking issues found while proving Task 1)

**1. [Rule 1 - Bug] package-lock.json drift under strict peer-dependency resolution**
- **Found during:** Task 1, first CI run attempt -- all four jobs failed in ~10s with `npm error code EUSAGE ... lock file's @swc/helpers@0.5.15 does not satisfy @swc/helpers@0.5.23` and the equivalent for `valibot`.
- **Root cause:** The committed lockfile was only ever validated locally under a developer's global `~/.npmrc` (`legacy-peer-deps=true`), which silently tolerates a peer-dependency mismatch between `@prisma/dev`'s own `valibot@1.2.0` requirement and `eslint-plugin-better-tailwindcss`/`@valibot/to-json-schema`'s `valibot@^1.4.x` peer requirement. GitHub Actions' clean npm environment (no such override) enforces this strictly, and `npm ci` refuses to proceed.
- **Fix:** Regenerated `package-lock.json` via `npm install --no-legacy-peer-deps`, which correctly nests `@prisma/dev`'s own `valibot@1.2.0` in its own `node_modules/@prisma/dev/node_modules/valibot` rather than at the hoisted top level, letting the shared `valibot@1.4.2`/`@swc/helpers@0.5.23` satisfy every other consumer.
- **Files modified:** `package-lock.json`
- **Commit:** `77a28d1`

**2. [Rule 1 - Bug] test and build CI jobs never seed the database**
- **Found during:** Task 1, second CI run attempt -- `test` failed with `TestingLibraryElementError: Unable to find an element with the text: Classic crossing`; `build` failed silently during Next.js static generation.
- **Root cause:** Both jobs run `npx prisma migrate deploy` (schema only) but never `npx prisma db seed`. The gallery/scenario UI and its tests depend on the curated seed rows (`prisma/seed.ts` writes `curatedScenarios` into the `Scenario` table), which a bare schema migration never populates.
- **Fix:** Added `- run: npx prisma db seed` immediately after `prisma migrate deploy` in both the `test` and `build` jobs of `.github/workflows/ci.yml`. Verified idempotent (seed script scopes its `deleteMany` to `isCurated: true` rows only) and that both jobs pass locally with a freshly migrated + seeded database.
- **Files modified:** `.github/workflows/ci.yml`
- **Commit:** `42d7f56`

**3. [Rule 1 - Bug] typescript@7.0.2 (tsgo) incompatible with Next.js 16.2.10's build-time dependency check, CI-only**
- **Found during:** Task 1, third CI run attempt -- `build` failed with a silent `exit 1` immediately after `Skipping validation of types`, no error message printed.
- **Root cause:** `typescript@7.0.2` (the Go-based "tsgo" rewrite this project's stack locks) removed the classic `typescript/lib/typescript.js` Program-API file. Next's `has-necessary-dependencies.js` hardcodes an `existsSync` check against exactly that path to decide "is typescript installed?" -- a separate, earlier check than the actual type-checking step this project already disables via `next.config.ts`'s `typescript.ignoreBuildErrors` (documented there from an earlier phase; `npx tsc --noEmit` remains the real gate). Outside CI, Next silently self-heals via a harmless `npm install typescript` no-op and proceeds; under CI, Next intentionally skips that self-heal "to avoid side-effects" and hard-fails instead, with the actual error message swallowed by its build-output spinner framing. Reproduced exactly and deterministically via `CI=true npm run build` locally (exit 1, zero output, byte-for-byte matching the real CI failure).
- **Two narrower fixes tried first and rejected** (see key-decisions above for detail): overriding `CI`/`GITHUB_ACTIONS` env vars for the build step (dead end -- GitHub Actions reasserts `GITHUB_ACTIONS=true` per-step regardless of override, and Next's vendored `ci-info` treats that alone as sufficient to set `isCI=true`); a postinstall shim creating an empty placeholder file at the checked path (satisfied the one check it was aimed at, but crashed a second, independent code path in Next's build pipeline that also loads that same file expecting a real TypeScript compiler API object -- `TypeError: Cannot read properties of undefined (reading 'getCurrentDirectory')`).
- **Fix:** Added `@typescript/native-preview` as a devDependency -- Microsoft's own official marker package (repo: `microsoft/typescript-go`) that Next 16.2.10 explicitly checks for via `hasNativeTypeScriptPreview()` to recognize the tsgo compiler and skip the whole missing-deps branch entirely (function-level support Next.js ships specifically for this migration scenario, not a workaround). Verified with `CI=true npm run build` completing a full production build (3 real routes, static pages generated, build traces collected) and with `npm ls typescript` confirming the pinned `typescript@7.0.2` version is unchanged (deduped identically everywhere in the tree) -- this dependency exists purely to satisfy Next's internal detection, not to change the actual compiler in use.
- **Files modified:** `package.json`, `package-lock.json`
- **Commit:** `aa073b2`

All three fixes were validated locally end-to-end before being trusted in CI: a clean `npm ci --no-legacy-peer-deps` from the committed lockfile, `npm run lint`/`npm run typecheck` (both clean), `npm test` against a freshly migrated + seeded database (216/216 tests passing), and `CI=true npm run build` (exact local reproduction of the GitHub Actions environment) completing a full production build with zero errors.

## Task 2: BLOCKED on human decision (per plan design, not a deviation)

Task 2 ("Configure branch protection on `main`") is a `type="checkpoint:decision" gate="blocking"` task. Its prerequisite decision -- how to satisfy CI-05 (required status checks on `main`) given this repo is private on GitHub's Free plan (branch protection and Repository Rulesets both return HTTP 403 "Upgrade to GitHub Pro or make this repository public", confirmed live via `gh api` at planning time) -- requires a billing or repo-visibility choice only the account owner can make. This is not resolvable via any API call and is not a deviation from the plan; it is the plan's own designed stopping point. Execution halts here; a continuation agent will resume Task 2 once the user has selected one of: `upgrade-to-pro`, `make-repo-public`, or `defer-and-document`.

## Self-Check: PASSED

- `.github/workflows/ci.yml` contains the `npx prisma db seed` step in both `test` and `build` jobs -- FOUND
- `package.json` contains `@typescript/native-preview` devDependency -- FOUND
- Commit `77a28d1` exists in `git log` -- FOUND
- Commit `42d7f56` exists in `git log` -- FOUND
- Commit `aa073b2` exists in `git log` -- FOUND
- PR #17 is closed (not merged) on `MarouenAbdi/colregs-navigator` -- confirmed via `gh pr list --state all`
- No `ci-verify/14-02` branch remains on the remote -- confirmed via `git ls-remote origin`
- `gh pr checks 17 --json name,state` returned all four jobs (`lint`, `typecheck`, `test`, `build`) as `SUCCESS` before closing
