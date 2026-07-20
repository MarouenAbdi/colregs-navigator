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
  created:
    - "CONTRIBUTING.md (brought into this worktree branch from the 14-03 integration commit, since this branch diverged before 14-03 merged; PR Expectations section then updated for Task 2)"
  modified:
    - "package-lock.json (regenerated under strict/non-legacy-peer-deps resolution)"
    - "package.json (added @typescript/native-preview devDependency)"
    - ".github/workflows/ci.yml (added 'npx prisma db seed' to test and build jobs)"

key-decisions:
  - "Chose @typescript/native-preview (Next.js's own hasNativeTypeScriptPreview() escape hatch) over two narrower workarounds that were tried and rejected: (1) overriding CI/GITHUB_ACTIONS env vars for the build step -- dead end, GitHub Actions reasserts GITHUB_ACTIONS=true for every step regardless of step-level env: overrides; (2) a postinstall shim creating an empty placeholder typescript/lib/typescript.js -- satisfied one check but crashed a second, independent code path in Next's build pipeline that also loads that file expecting a real TypeScript compiler API surface"
  - "User resolved the Task 2 blocking checkpoint by selecting 'make-repo-public' (over 'upgrade-to-pro' or 'defer-and-document') -- free, unlocks branch protection immediately, and makes the README CI badge universally visible without requiring repo access, which fits this project's stated portfolio/interview purpose (CLAUDE.md)"
  - "Verified via 'git log --all --oneline -- .env' that no .env file has ever been tracked in this repo's history before making it public, eliminating the historical-secrets concern noted as a con of the make-repo-public option"

requirements-completed: [CI-01, CI-05]

# Metrics
duration: 85min
completed: 2026-07-20
---

# Phase 14 Plan 02: Pipeline & Hooks -- Real CI Verification Summary

**Proved plan 14-01's ci.yml actually runs and passes on a live PR, fixed three real CI bugs surfaced only by that live exercise, then made the repo public and enforced branch protection on main so all four checks genuinely gate merges (CI-01 and CI-05 both closed)**

## Performance

- **Duration:** ~85 min (70 min Task 1 + checkpoint, ~15 min Task 2 after decision)
- **Tasks:** 2 of 2 completed
- **Files modified:** 4 (package-lock.json, package.json, .github/workflows/ci.yml, CONTRIBUTING.md)

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

## Checkpoint: Decision resolved

Task 2's prerequisite `type="checkpoint:decision" gate="blocking"` was presented to the user with
three options (`upgrade-to-pro`, `make-repo-public`, `defer-and-document`). The user selected
**`make-repo-public`**. Before acting on it, a sanity check confirmed `git log --all --oneline --
.env` returns empty -- no `.env` file has ever been tracked in this repo's history -- removing the
historical-secrets concern noted as a con of this option.

## Task 2: Configure branch protection on main -- COMPLETE

1. **Made the repository public:** `gh repo edit MarouenAbdi/colregs-navigator --visibility public
   --accept-visibility-change-consequences`. Verified via `gh repo view ... --json visibility` ->
   `"PUBLIC"`.
2. **Configured branch protection on `main`:** `gh api -X PUT
   repos/MarouenAbdi/colregs-navigator/branches/main/protection` with
   `required_status_checks.contexts: ["lint","typecheck","test","build"]`, `strict: true`,
   `enforce_admins: true`, `required_pull_request_reviews: null`, `restrictions: null`. The PUT
   call itself succeeded (no HTTP 403 -- confirming the earlier private-repo/Free-plan blocker is
   gone now that the repo is public) and echoed back the exact configuration requested.
3. **Re-verified via GET:** `gh api repos/MarouenAbdi/colregs-navigator/branches/main/protection
   --jq '.required_status_checks.contexts, .enforce_admins.enabled'` returned
   `["lint","typecheck","test","build"]` and `true`, matching the plan's exact acceptance
   criteria.
4. **Updated `CONTRIBUTING.md`'s "Pull Request Expectations" section** to state definitively that
   branch protection is enforced on `main` (all four checks required, `enforce_admins: true`, not
   bypassable even by the repo owner), replacing the prior hedged/conditional language that
   deferred to "a decision made in a separate, later plan."

Both CI-01 (proven by a real live PR run in Task 1) and CI-05 (branch protection now genuinely
gating merges) are satisfied for this phase -- no open item is carried forward to Phase 15 on
this front.

### Deviation: CONTRIBUTING.md was not yet present in this branch's ancestry

The orchestrator's Task 2 instructions assumed `CONTRIBUTING.md` (added by plan 14-03) was
"already merged into this branch's ancestry." In fact this worktree's branch
(`worktree-agent-a46e4515b4aa88b6a`) was created off `e64b8e8`, before plan 14-03's work
(`ccb31e6`..`db3fd46`) was merged into the `gsd/phase-14-pipeline-hooks` integration branch -- so
`CONTRIBUTING.md` did not exist on this branch yet. **[Rule 3 - blocking issue]** Fixed by reading
the file's current, real content directly from the integration branch
(`git show gsd/phase-14-pipeline-hooks:CONTRIBUTING.md`) rather than guessing or writing a
divergent version from scratch, then applying only the required "Pull Request Expectations"
edit on top of that real content. This does mean the orchestrator's merge-back of this worktree
may see `CONTRIBUTING.md` as a two-sided add (both branches introduce the same-named file from a
common ancestor that lacks it) -- content is otherwise identical except for the one section this
plan was tasked with updating, so any conflict should be a trivial, single-hunk resolution in
favor of this worktree's enforced-branch-protection language.

## Self-Check: PASSED

- `.github/workflows/ci.yml` contains the `npx prisma db seed` step in both `test` and `build` jobs -- FOUND
- `package.json` contains `@typescript/native-preview` devDependency -- FOUND
- Commit `77a28d1` exists in `git log` -- FOUND
- Commit `42d7f56` exists in `git log` -- FOUND
- Commit `aa073b2` exists in `git log` -- FOUND
- Commit `650c939` exists in `git log` -- FOUND
- PR #17 is closed (not merged) on `MarouenAbdi/colregs-navigator` -- confirmed via `gh pr list --state all`
- No `ci-verify/14-02` branch remains on the remote -- confirmed via `git ls-remote origin`
- `gh pr checks 17 --json name,state` returned all four jobs (`lint`, `typecheck`, `test`, `build`) as `SUCCESS` before closing
- `gh repo view MarouenAbdi/colregs-navigator --json visibility` returns `"PUBLIC"` -- FOUND
- `gh api repos/MarouenAbdi/colregs-navigator/branches/main/protection --jq '.required_status_checks.contexts, .enforce_admins.enabled'` returns `["lint","typecheck","test","build"]` and `true` -- FOUND
- `CONTRIBUTING.md` contains updated, non-conditional branch-protection language in its "Pull Request Expectations" section -- FOUND
