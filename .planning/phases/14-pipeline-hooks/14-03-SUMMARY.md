---
phase: 14-pipeline-hooks
plan: 03
subsystem: infra
tags: [husky, lint-staged, eslint, git-hooks, contributing-docs]

requires:
  - phase: 14-pipeline-hooks
    provides: "14-01's four-job CI pipeline (.github/workflows/ci.yml: lint/typecheck/test/build) and postinstall prisma generate script"
provides:
  - "Husky 9 + lint-staged 17 pre-commit hook: .env* guard (rejects any staged .env variant except .env.example before a commit object is created) then staged-file eslint --fix"
  - "CONTRIBUTING.md documenting real setup, checks, hook behavior, branch/commit conventions, PR expectations, rollback"
affects: [pipeline-hooks, ci-cd, deployment]

tech-stack:
  added: ["husky ^9.1.7", "lint-staged ^17.1.0"]
  patterns:
    - "Pre-commit hook is staged-file-scoped only (eslint --fix); full typecheck/test suite stays CI-only, never pre-commit"
    - ".env* guard runs unconditionally before lint-staged, as a fail-closed check on staged file names via git diff --cached --name-only"

key-files:
  created: [.husky/pre-commit, lint-staged.config.js, CONTRIBUTING.md, .planning/phases/14-pipeline-hooks/deferred-items.md]
  modified: [package.json, package-lock.json]

key-decisions:
  - "Fixed a set -e trap discovered during manual verification: husky wraps hook execution in `sh -e`, and grep's exit-1-on-no-match return would abort the .env* guard (and the entire hook) before lint-staged ever ran, on every normal commit that has no staged .env files -- i.e. almost all commits. Added `|| true` to both grep stages in the pipeline (Rule 1 auto-fix, not in the plan's literal script text)."
  - "CONTRIBUTING.md's Pull Request Expectations section is phrased conditionally on branch protection status, since plan 14-02 (which resolves the branch-protection decision) has not yet produced a SUMMARY.md in this worktree."

requirements-completed: [HOOKS-01, DOCS-CONTRIB-01]

duration: 25min
completed: 2026-07-20
---

# Phase 14 Plan 03: Pipeline & Hooks -- Husky + lint-staged + CONTRIBUTING.md Summary

**Husky 9 + lint-staged 17 pre-commit hook (staged-file `eslint --fix` + `.env*` commit guard) and a `CONTRIBUTING.md` documenting the actually-verified hook/setup/CI behavior.**

## Performance

- **Duration:** ~25 min
- **Tasks:** 2 completed (plus 1 blocking checkpoint approved before Task 1)
- **Files modified:** 6 (2 created config files, 1 created doc, 1 created deferred-items log, 2 modified: package.json/package-lock.json)

## Accomplishments

- Installed `husky` (^9.1.7) and `lint-staged` (^17.1.0) as devDependencies after an explicit human package-legitimacy checkpoint (both confirmed legitimate on npmjs.com -- typicode/husky, okonet-lint-staged org, no typosquat concerns)
- `.husky/pre-commit` rejects any staged `.env`/`.env.<anything>` file (except `.env.example`) before a commit object is ever created, then runs `npx lint-staged`
- `lint-staged.config.js` (ESM default export, matching this repo's `"type": "module"`) maps staged `*.{js,jsx,mjs,cjs,ts,tsx}` files to `eslint --fix` only -- no Prettier, no typecheck
- `CONTRIBUTING.md` authored with all 6 required sections (Setup, Running Checks Locally, Pre-commit Hooks, Branch & Commit Conventions, Pull Request Expectations, Rollback), describing real, already-verified behavior

## Task Commits

Each task was committed atomically:

1. **Task 1: Install and wire Husky + lint-staged (staged-file eslint --fix + .env* guard)** - `e65a044` (feat)
2. **Task 2: Author CONTRIBUTING.md documenting real setup, hook behavior, conventions, and rollback** - `ccb31e6` (docs)

_Note: the blocking `checkpoint:human-verify` gate for package legitimacy (husky, lint-staged) was approved by the user before Task 1 ran -- no commit associated with the checkpoint itself._

## Files Created/Modified

- `.husky/pre-commit` - Pre-commit hook: `.env*` guard (fail-closed, runs first) + `npx lint-staged`
- `lint-staged.config.js` - ESM config: staged `*.{js,jsx,mjs,cjs,ts,tsx}` -> `eslint --fix` only
- `package.json` - `devDependencies` (husky, lint-staged), `"prepare": "husky"` script
- `package-lock.json` - Lockfile updated for the two new devDependencies
- `CONTRIBUTING.md` - Contributor documentation (setup, checks, hooks, conventions, PR expectations, rollback)
- `.planning/phases/14-pipeline-hooks/deferred-items.md` - Logs one out-of-scope, pre-existing environment gap found during verification (see Issues Encountered)

## Decisions Made

- Followed the plan's `npm install -D husky lint-staged` unpinned install; registry resolved `husky@9.1.7` and `lint-staged@17.1.0` (matching the plan's `<interfaces>` note), recorded as `^9.1.7`/`^17.1.0` in `package.json` consistent with this repo's existing devDependency range convention.
- `git config core.hooksPath` resolves to `.husky/_` on this Husky version (confirmed via actual output, not assumed) -- matches the plan's acceptance criteria allowance for either `.husky` or `.husky/_`.
- `CONTRIBUTING.md`'s Pull Request Expectations section does not assert branch protection is enforced, since plan 14-02 (which makes that decision) has not yet run in this worktree -- phrased conditionally per the plan's own instruction.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed a `set -e` trap in `.husky/pre-commit` that would have broken every normal commit**
- **Found during:** Task 1, manual verification of the acceptance criteria (staging a normal file with a fixable lint violation and running `git commit`)
- **Issue:** Husky 9 invokes hook scripts via `sh -e "$s"` (confirmed by reading `.husky/_/h`). The `.env*` guard's `staged_env_files=$(git diff --cached --name-only | grep ... | grep -v ...)` line relies on `grep` returning non-zero when there is no match -- which is normal, expected `grep` behavior, not an error. Under `set -e`, that non-zero exit status (surfaced through the command substitution assigned to the variable) aborted the entire hook script immediately, before `npx lint-staged` ever ran -- on every commit that had no staged `.env*` files, i.e. nearly every commit. Verified directly: `git commit` on a normal file failed with `husky - pre-commit script failed (code 1)` even though running the same script manually via plain `sh` (without `-e`) succeeded.
- **Fix:** Added `|| true` to the end of the grep pipeline so a "no match" result no longer trips `set -e`. Re-verified: (a) a normal file with a Tailwind-class-order violation was committed successfully with the violation auto-fixed in the committed content (`items-center  flex` -> `flex items-center`); (b) a staged `.env.local` scratch file (placeholder content only) was still correctly rejected with a non-zero exit and a message naming the file, with no commit object created.
- **Files modified:** `.husky/pre-commit`
- **Verification:** Both manual end-to-end tests above passed after the fix; scratch test files/commits were reset/removed afterward and are not part of the final commit history.
- **Committed in:** `e65a044` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Necessary for correctness -- without this fix, the pre-commit hook as literally specified in the plan's action text would have silently blocked every single future commit in the repo (a severe regression, not a cosmetic issue). No scope creep; the fix is entirely contained within the one file the plan already targets.

## Issues Encountered

- `npm run typecheck` fails in this worktree with `Cannot find module '../../../generated/prisma/client.js'` -- pre-existing, unrelated to this plan's changes. This worktree has no `.env` file and no local Docker Postgres running, so `postinstall: prisma generate` never generated the Prisma client output (Prisma 7's `env()` helper throws when `DATABASE_URL` is entirely unset, per `14-01-SUMMARY.md`'s own finding). Neither Task 1 nor Task 2 touches Prisma, the schema, or `src/server/db/`. Logged to `deferred-items.md` per the scope-boundary rule (out-of-scope, pre-existing, not auto-fixed). `npm run lint` (0 errors, 3 pre-existing unrelated `max-lines` warnings in `src/domain/colregs/`) confirms this plan's own changes are lint-clean.

## User Setup Required

None - no external service configuration required. Hooks register automatically via `npm install`'s `"prepare": "husky"` script on any machine.

## Next Phase Readiness

- HOOKS-01 and DOCS-CONTRIB-01 are both complete and independently verified (manual end-to-end commit tests for both the lint-autofix path and the `.env*` rejection path).
- `CONTRIBUTING.md`'s Pull Request Expectations section will need a follow-up edit once plan 14-02 resolves the branch-protection decision, to state the final enforced/not-enforced status definitively rather than conditionally.
- No blockers for plan 14-04 or subsequent CI/CD work; this plan's changes are entirely local tooling with no external dependencies.

---
*Phase: 14-pipeline-hooks*
*Completed: 2026-07-20*
