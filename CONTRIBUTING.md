# Contributing to COLREGS Navigator

This document describes the real, verified developer workflow for this repo -- setup, the
checks CI actually runs, what the pre-commit hook actually does (and does not do), commit/branch
conventions, PR expectations, and how to roll back a bad change. Nothing here is aspirational;
each section reflects behavior that has been exercised and confirmed against this codebase.

## Setup

```bash
cp .env.example .env
docker compose up -d
npm install
npx prisma migrate dev
npm test
```

- `docker compose up -d` starts a local Postgres 17 container (credentials/database name defined
  in `docker-compose.yml`, matching the connection string in `.env.example`).
- `npm install` also runs `postinstall: prisma generate` automatically, and (via the `prepare`
  script) registers this repo's Husky git hooks -- see "Pre-commit Hooks" below.
- `npx prisma migrate dev` applies the committed migrations under `prisma/migrations/` and
  generates the Prisma client.
- `npm test` runs the Vitest suite (domain rules engine plus persistence/API tests).

## Running Checks Locally

These are the exact same commands the CI pipeline (`.github/workflows/ci.yml`) runs, one per job
(`lint`, `typecheck`, `test`, `build`):

```bash
npm run lint       # eslint . -- reports violations, exits non-zero on any new error
npm run lint:fix   # eslint . --fix -- applies safe autofixes first
npm run typecheck  # tsc --noEmit
npm test           # vitest run
npm run build      # next build --webpack
```

Running these locally before pushing catches the same failures CI would catch, before a PR is
even opened.

## Pre-commit Hooks

A Husky-managed `git commit` hook (`.husky/pre-commit`) runs two things, in this exact order,
every time you commit:

1. **`.env*` guard** -- inspects staged file names; if any staged file is `.env` or matches
   `.env.<anything>` (excluding `.env.example`, which is meant to be committed as a template),
   the commit is rejected with a non-zero exit **before a commit object is ever created**, naming
   the offending file(s).
2. **`lint-staged`** (only if the guard above passes) -- runs `eslint --fix` against staged
   `*.{js,jsx,mjs,cjs,ts,tsx}` files only (config: `lint-staged.config.js`), auto-fixing anything
   ESLint can safely fix and re-staging the result.

**What does NOT run pre-commit:** the full `typecheck`/`test` suite deliberately does not run at
commit time -- only in CI. This is intentional (`tsc`'s type checker needs the whole project
graph; scoping it to staged files alone would produce false negatives/positives), not an
oversight. This means a commit can land locally with a type error or a failing test that CI will
catch on push/PR -- run `npm run typecheck` and `npm test` yourself before pushing if you want to
catch that earlier.

Hooks are registered automatically by `npm install` via the `"prepare": "husky"` script
(`git config core.hooksPath` resolves to `.husky/_` after install) -- no manual setup step is
needed on a fresh clone.

## Branch & Commit Conventions

Per this project's locked engineering conventions (`CLAUDE.md`, "Git workflow"): *"feature
branches, small logical conventional commits; commit messages, branch names, and PR descriptions
are AI-generated but human-reviewed."*

Observed branch-name patterns actually used in this repo's history:

- `gsd/phase-N-slug` (e.g. `gsd/phase-13-comment-cleanup`)
- `frontend-implementation/phase-N-slug` (e.g. `frontend-implementation/phase-8-sandbox`)

Commits follow Conventional Commits style (`feat(scope): ...`, `fix(scope): ...`,
`docs(scope): ...`, `chore(scope): ...`), scoped small and logical -- one task/behavior per
commit, not a single end-of-day squash.

## Pull Request Expectations

A PR is expected to pass all four required CI checks defined in `.github/workflows/ci.yml`:
`lint`, `typecheck`, `test`, `build`.

Branch protection status on `main`: these four checks **are** configured as required status
checks via GitHub branch protection (`required_status_checks.contexts: ["lint", "typecheck",
"test", "build"]`, `strict: true`), with `enforce_admins: true` so this is not bypassable even
by the repo owner's own admin access. A red run on any of the four checks mechanically blocks
merging into `main` -- this is enforced by GitHub itself, not just a convention. The repo is
public, which is what unlocked branch protection on GitHub's Free plan (private repos on the
Free plan cannot configure branch protection or Repository Rulesets).

## Rollback

Two rollback paths exist, depending on what needs undoing:

- **Production deployment rollback** -- the live app is deployed to Vercel with Instant
  Rollback available (`npx vercel rollback DEPLOYMENT_ID`, `npx vercel promote DEPLOYMENT_ID`),
  an alias-only reassignment that never rebuilds or re-runs `prisma migrate deploy`. See
  README.md's "Rollback Procedure" section for the full, live-verified command reference.
- **Bad merge commit on `main`** -- `git revert` the offending commit (never a force-push/history
  rewrite of shared history), then let CI/CD redeploy the reverted state normally.
